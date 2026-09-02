require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS unaccent");
    console.log('Unaccent extension enabled successfully!');
    const res = await pool.query("SELECT unaccent('Trần Vinh')");
    console.log('Unaccent result:', res.rows[0]);
  } catch (err) {
    console.error('Failed to enable unaccent:', err.message);
  } finally {
    await pool.end();
  }
}

main();
