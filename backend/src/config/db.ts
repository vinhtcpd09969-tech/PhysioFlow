import { Pool, types } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Configure system-wide timezone to Vietnam time (GMT+7)
process.env.TZ = 'Asia/Ho_Chi_Minh';

// Fix timezone bug: parse TIMESTAMP WITHOUT TIME ZONE (OID 1114) as UTC
// This ensures that dates stored as UTC are correctly parsed as UTC dates in JS,
// preventing node-postgres from parsing them using the server's local system timezone.
types.setTypeParser(1114, (stringValue) => {
  return new Date(stringValue.replace(' ', 'T') + 'Z');
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', (client) => {
  console.log('Connected to PostgreSQL Database via Pool.');
  // We keep connection timezone as UTC (from connection string) so that both
  // raw pg client and Prisma query engine parse TIMESTAMPTZ values correctly
  // as UTC dates without local session timezone shifting.
});

pool.on('error', (err) => {
  console.log('Unexpected error on idle client', err);
  process.exit(-1);
});

// Dynamic migration block to ensure cuoc_hen has the required cancellation and internal notes columns
pool.query(`
  ALTER TABLE cuoc_hen 
  ADD COLUMN IF NOT EXISTS ly_do_huy TEXT,
  ADD COLUMN IF NOT EXISTS thoi_gian_huy TIMESTAMPTZ;
`).then(() => {
  console.log('Database schema for cuoc_hen columns checked and updated successfully.');
}).catch(err => {
  console.error('Error updating schema for cuoc_hen:', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export { pool };

