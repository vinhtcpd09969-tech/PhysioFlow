import { pool } from '../config/db';

async function main() {
  try {
    const { rows: tables } = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
    );
    console.log('Tables in database:');
    console.log(tables.map(t => t.table_name));

    // Check columns of uu_dai_thanh_toan
    const { rows: columns } = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='uu_dai_thanh_toan'`
    );
    console.log('\nColumns of uu_dai_thanh_toan:');
    columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

    // Check columns of hoa_don
    const { rows: columnsHd } = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='hoa_don'`
    );
    console.log('\nColumns of hoa_don:');
    columnsHd.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

  } catch (err) {
    console.error('Error running database check:', err);
  } finally {
    await pool.end();
  }
}

main();
