import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5001').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL là bắt buộc'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET là bắt buộc'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET là bắt buộc'),
  ALLOWED_ORIGINS: z.string().optional().default('http://localhost:3000,http://localhost:3001'),
  
  // Email SMTP (Tùy chọn ở local dev, có fallback Ethereal)
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.string().default('587').transform(Number),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASS: z.string().optional().default(''),
  
  // Brevo Transactional Email REST API (HTTPS Port 443)
  BREVO_API_KEY: z.string().optional().default(''),
  BREVO_SENDER_EMAIL: z.string().optional().default('officecareclinic2026@gmail.com'),
  BREVO_SENDER_NAME: z.string().optional().default('OfficeCare Clinic'),
  
  // PayOS Gateway
  PAYOS_CLIENT_ID: z.string().optional().default(''),
  PAYOS_API_KEY: z.string().optional().default(''),
  PAYOS_CHECKSUM_KEY: z.string().optional().default(''),
  
  // Google Gemini AI
  GEMINI_API_KEY: z.string().optional().default(''),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ LỖI BIẾN MÔI TRƯỜNG KHÔNG HỢP LỆ KHI KHỞI ĐỘNG SERVER:');
    result.error.errors.forEach((err) => {
      console.error(`  - Biến [${err.path.join('.')}]: ${err.message}`);
    });
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
export default env;
