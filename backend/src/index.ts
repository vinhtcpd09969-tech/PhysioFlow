import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      const errorMsg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(errorMsg), false);
    }
  },
  credentials: true
}));
app.use(express.json());

// --- SWAGGER UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// --- API ROUTES HUB ---
app.use('/api', apiRouter);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'PhysioFlow API is running (TypeScript)' });
});

// --- GLOBAL ERROR HANDLER (MUST be registered last) ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
