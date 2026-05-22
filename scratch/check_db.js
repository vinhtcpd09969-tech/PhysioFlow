const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    const roles = await pool.query('SELECT * FROM vai_tro');
    console.log('--- ROLES ---');
    console.table(roles.rows);

    const users = await pool.query(`
      SELECT nd.id, nd.ho_ten, nd.email, vt.ten_hien_thi as vai_tro, vt.ma_vai_tro, nd.vai_tro_id
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
    `);
    console.log('\n--- USERS ---');
    console.table(users.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
