const { pool } = require('./src/config/db');

async function run() {
  const res = await pool.query("SELECT * FROM otp_codes WHERE email = 'vinhtcpd09969@gmail.com' ORDER BY created_at DESC LIMIT 5");
  console.log('OTP Codes in DB:', res.rows);
  console.log('Current server time:', new Date().toISOString());
  pool.end();
}

run().catch(console.error);
