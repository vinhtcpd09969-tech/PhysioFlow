import dotenv from 'dotenv';
dotenv.config();

// Globally parse BigInt to string in JSON.stringify to prevent serialization errors
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';
import appointmentWatchdog from './services/appointment-watchdog.service';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
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

// --- SWAGGER UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// --- API ROUTES HUB ---
app.use('/api', apiRouter);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'OfficeCare API is running (TypeScript)' });
});

// --- GLOBAL ERROR HANDLER (MUST be registered last) ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // Hot-reloaded with updated port
  console.log(`Server is running on port ${PORT}`);
  appointmentWatchdog.start();
});
// Reload trigger: swagger docs fully documented - all 80 endpoints

