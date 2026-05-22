import { pool } from '../config/db';

async function main() {
  try {
    const { rows: columns } = await pool.query(
      `SELECT table_name, column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema='public' 
       ORDER BY table_name, ordinal_position`
    );

    const tables: { [key: string]: string[] } = {};
    columns.forEach(col => {
      if (!tables[col.table_name]) {
        tables[col.table_name] = [];
      }
      tables[col.table_name].push(`${col.column_name} (${col.data_type})`);
    });

    console.log('--- DATABASE TABLES & COLUMNS (COMPACT) ---');
    for (const [tableName, cols] of Object.entries(tables)) {
      console.log(`- ${tableName}: ${cols.join(', ')}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
