import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

import env from './config/env';
import { closePool } from './config/db';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { initReminderJob } from './jobs/reminder.job';
import { initSentimentRetryJob } from './jobs/sentiment-retry.job';
import { initSweepJob } from './jobs/sweep.job';

// Globally parse BigInt to string in JSON.stringify to prevent serialization errors
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();

const allowedOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',')
  : [];
allowedOrigins.push('http://localhost:5001', 'http://localhost:5000');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // Auto-allow any ngrok tunnel for seamless local testing
    if (
      allowedOrigins.includes(origin) || 
      origin.endsWith('.ngrok-free.dev') || 
      origin.endsWith('.ngrok.io')
    ) {
      return callback(null, true);
    } else {
      const errorMsg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(errorMsg), false);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- STATIC UPLOADS (ảnh bìa bài viết, ảnh gói dịch vụ, ảnh chuyên gia) ---
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- API ROUTES HUB ---
app.use('/api', apiRouter);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'OfficeCare API is running (TypeScript)' });
});

// --- GLOBAL ERROR HANDLER (MUST be registered last) ---
app.use(errorHandler);

const PORT = env.PORT || 5001;
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Khởi động job quét nhắc lịch tự động
  initReminderJob();
  // Khởi động job tự động thử lại phân tích cảm xúc đánh giá khi trước đó thất bại/hết quota
  initSentimentRetryJob();
  // Khởi động job tự động quét bảo trì hệ thống (No-show, hết hạn gói, timeout thanh toán)
  initSweepJob();
});

// --- GRACEFUL SHUTDOWN HANDLERS ---
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang tiến hành tắt hệ thống an toàn (Graceful Shutdown)...`);
  server.close(async () => {
    console.log('🔒 HTTP Server đã dừng nhận request mới.');
    await closePool();
    console.log('👋 OfficeCare Backend đã dừng hoàn toàn.');
    process.exit(0);
  });

  // Đặt timeout tối đa 10 giây nếu còn kết nối treo
  setTimeout(() => {
    console.error('⚠️ Quá thời gian chờ shutdown (10s), cưỡng chế dừng tiến trình.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
