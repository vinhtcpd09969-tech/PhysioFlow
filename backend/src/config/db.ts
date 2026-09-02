import { Pool, types } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Configure system-wide timezone to Vietnam time (GMT+7)
process.env.TZ = 'Asia/Ho_Chi_Minh';

// Fix timezone bug: parse TIMESTAMP WITHOUT TIME ZONE (OID 1114) as UTC
types.setTypeParser(1114, (stringValue) => {
  return new Date(stringValue.replace(' ', 'T') + 'Z');
});

const rawDbUrl = process.env.DATABASE_URL || '';
const connectionString = rawDbUrl.includes('localhost')
  ? rawDbUrl.replace('localhost', '127.0.0.1')
  : rawDbUrl;

const isRemoteDb = rawDbUrl.includes('neon.tech') || rawDbUrl.includes('sslmode=require') || rawDbUrl.includes('ssl=true');

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on('connect', () => {
  // Connection timezone kept as UTC for consistent ISO date handling
});

pool.on('error', (err) => {
  console.error('Lỗi kết nối trên idle client PostgreSQL (tự động phục hồi):', err.message || err);
});

const SLOW_QUERY_THRESHOLD_MS = 1000;

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    const preview = text.replace(/\s+/g, ' ').trim().substring(0, 120);
    console.warn(`⚠️ [Slow Query Alert - ${duration}ms]: ${preview}...`);
  }

  return res;
};

/**
 * Đóng kết nối Database an toàn khi server shutdown
 */
export async function closePool(): Promise<void> {
  try {
    console.log('🔄 Đang đóng PostgreSQL Connection Pool...');
    await pool.end();
    console.log('✅ PostgreSQL Connection Pool đã được giải phóng hoàn toàn.');
  } catch (err) {
    console.error('Lỗi khi đóng PostgreSQL pool:', err);
  }
}

export { pool };
export default { pool, query, closePool };
