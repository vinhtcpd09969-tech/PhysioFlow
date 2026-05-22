const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    const counts = await pool.query(`
      SELECT loai_dich_vu, COUNT(*) 
      FROM dich_vu 
      GROUP BY loai_dich_vu
    `);
    console.log('--- Services Counts ---');
    console.log(counts.rows);

    const bosung = await pool.query("SELECT id, ten_dich_vu, loai_dich_vu FROM dich_vu WHERE loai_dich_vu = 'bo_sung' LIMIT 5");
    console.log('--- Sample Bo Sung ---');
    console.log(bosung.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
