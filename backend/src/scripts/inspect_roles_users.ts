import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/physioflow_db' });

async function main() {
  try {
    console.log('--- VAI TRO ---');
    const { rows: roles } = await pool.query('SELECT * FROM vai_tro');
    console.log(roles);

    console.log('\n--- ADMIN USER ---');
    const { rows: admins } = await pool.query("SELECT id, ho_ten, email, vai_tro_id FROM nguoi_dung WHERE email = 'admin@officecare.com'");
    console.log(admins);

    console.log('\n--- ALL USER ROLES ---');
    const { rows: users } = await pool.query("SELECT DISTINCT vai_tro_id, COUNT(*) FROM nguoi_dung GROUP BY vai_tro_id");
    console.log(users);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
