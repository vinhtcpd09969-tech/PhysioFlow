const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const { rows } = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    );
    console.log('Tables found in database:');
    rows.forEach(r => console.log(`- ${r.table_name}`));

    const { rows: columns } = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='goi_dich_vu'`
    );
    if (columns.length > 0) {
      console.log('\nColumns of goi_dich_vu:');
      columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    } else {
      console.log('\nTable goi_dich_vu does NOT exist!');
    }

    const { rows: columnsLich } = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='lich_lam_viec'`
    );
    if (columnsLich.length > 0) {
      console.log('\nColumns of lich_lam_viec:');
      columnsLich.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    } else {
      console.log('\nTable lich_lam_viec does NOT exist!');
    }

    const { rows: roles } = await pool.query('SELECT * FROM vai_tro');
    console.log('\nRoles in DB:', roles);

    const { rows: staffCount } = await pool.query(
      `SELECT nd.ho_ten, vt.ten_hien_thi as vai_tro, cg.chuyen_mon_chinh 
       FROM nguoi_dung nd 
       JOIN vai_tro vt ON nd.vai_tro_id = vt.id 
       LEFT JOIN chuyen_gia_y_te cg ON nd.id = cg.nguoi_dung_id`
    );
    console.log('\nStaff list in DB:', staffCount);


  } catch (err) {
    console.error('Error running database check:', err);
  } finally {
    await pool.end();
  }
}

main();
