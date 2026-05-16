import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const TARGET_CONNECTION_STRING = 'postgresql://postgres:password@localhost:5432/office_care';

async function fixDB() {
  const client = new Client({ connectionString: TARGET_CONNECTION_STRING });
  try {
    await client.connect();
    console.log('Connected to office_care...');

    // 1. Create missing otp_codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL,
        otp varchar(6) NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Created otp_codes table');

    // 2. Set da_xac_thuc_email = true for all seeded users
    const result = await client.query(`
      UPDATE nguoi_dung 
      SET da_xac_thuc_email = true 
      WHERE da_xac_thuc_email = false;
    `);
    console.log(`✅ Verified ${result.rowCount} users in the database.`);

  } catch (err) {
    console.error('❌ Error fixing DB:', err);
  } finally {
    await client.end();
  }
}

fixDB();
