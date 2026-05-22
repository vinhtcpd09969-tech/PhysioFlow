import { pool } from '../config/db';

async function main() {
  try {
    const { rows: columns } = await pool.query(
      `SELECT table_name, column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_schema='public' 
       ORDER BY table_name, ordinal_position`
    );

    const tables: { [key: string]: any[] } = {};
    columns.forEach(col => {
      if (!tables[col.table_name]) {
        tables[col.table_name] = [];
      }
      tables[col.table_name].push({
        column: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable,
        default: col.column_default
      });
    });

    console.log('--- DATABASE SCHEMA INSPECTION ---');
    for (const [tableName, cols] of Object.entries(tables)) {
      console.log(`\nTable: ${tableName}`);
      cols.forEach(c => {
        console.log(`  - ${c.column} (${c.type})${c.nullable === 'NO' ? ' NOT NULL' : ''}${c.default ? ' DEFAULT ' + c.default : ''}`);
      });
    }

  } catch (err) {
    console.error('Error inspecting database schema:', err);
  } finally {
    await pool.end();
  }
}

main();
