import { pool } from '../src/config/db';
import bcrypt from 'bcryptjs';

async function run() {
  try {
    console.log('Creating refresh_tokens table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        nguoi_dung_id UUID NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Inserting mock admin user...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);

    await pool.query(`
      INSERT INTO nguoi_dung (id, ho_ten, email, mat_khau_hash, vai_tro_id, trang_thai)
      VALUES (gen_random_uuid(), 'Admin User', 'admin@physioflow.com', $1, 4, 'hoat_dong')
      ON CONFLICT (email) DO NOTHING;
    `, [hash]);

    console.log('Auth tables and mock user initialized successfully.');
  } catch (err) {
    console.error('Error during init:', err);
  } finally {
    pool.end();
  }
}

run();
