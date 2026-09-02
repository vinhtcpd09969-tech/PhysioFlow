import { pool } from '../src/config/db';
import fs from 'fs';
import path from 'path';

const BASE_TABLES = [
  'vai_tro',
  'danh_muc_dich_vu',
  'dich_vu',
  'goi_dich_vu',
  'goi_dich_vu_chi_tiet',
  'phong',
  'nguoi_dung',
  'chuyen_gia_y_te'
];

const DEMO_TABLES = [
  'khach_hang',
  'lich_dat',
  'ho_so_dieu_tri',
  'lich_dieu_tri',
  'buoi_tri_lieu',
  'buoi_tri_lieu_dich_vu',
  'hoa_don',
  'thanh_toan',
  'danh_gia_dich_vu',
  'voucher'
];

async function exportTables(tablesList: string[], targetFile: string, title: string) {
  const writeStream = fs.createWriteStream(targetFile);
  
  try {
    writeStream.write(`-- PhysioFlow ${title}\n`);
    writeStream.write(`-- Exported on: ${new Date().toISOString()}\n\n`);
    writeStream.write(`SET session_replication_role = 'replica';\n\n`);

    for (const tableName of tablesList) {
      // Check if table exists
      const { rows: tableExists } = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );`, [tableName]
      );

      if (!tableExists[0].exists) {
        console.log(`Table does not exist, skipping: ${tableName}`);
        continue;
      }

      console.log(`Exporting table: ${tableName}`);
      writeStream.write(`-- Table: ${tableName}\n`);
      writeStream.write(`TRUNCATE TABLE "${tableName}" CASCADE;\n\n`);

      const { rows: columns } = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 AND table_schema='public'`,
        [tableName]
      );

      const colNames = columns.map(c => c.column_name);
      
      const { rows: data } = await pool.query(`SELECT * FROM "${tableName}"`);

      if (data.length === 0) {
        writeStream.write(`-- No data for ${tableName}\n\n`);
        continue;
      }

      for (const row of data) {
        const values = colNames.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') {
            return `'${val.replace(/'/g, "''")}'`;
          }
          if (val instanceof Date) {
            return `'${val.toISOString()}'`;
          }
          if (typeof val === 'bigint') {
            return val.toString();
          }
          if (typeof val === 'object') {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          }
          return val;
        });

        const insertQuery = `INSERT INTO "${tableName}" (${colNames.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        writeStream.write(insertQuery);
      }
      writeStream.write(`\n`);
    }

    writeStream.write(`SET session_replication_role = 'origin';\n`);
    console.log(`Successfully exported ${title} to ${targetFile}`);
  } catch (err) {
    console.error(`Error exporting ${title}:`, err);
  } finally {
    writeStream.end();
  }
}

async function main() {
  const outputDir = path.join(__dirname, '../../database');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const baseFile = path.join(outputDir, 'base_system_data.sql');
  const demoFile = path.join(outputDir, 'demo_data.sql');

  console.log('Starting export process...');
  await exportTables(BASE_TABLES, baseFile, 'Base System Data');
  await exportTables(DEMO_TABLES, demoFile, 'Demo Data');
  
  await pool.end();
  console.log('Export process completed!');
}

main();
