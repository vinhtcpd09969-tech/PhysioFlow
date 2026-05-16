import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const ROOT_CONNECTION_STRING = 'postgresql://postgres:password@localhost:5432/postgres';

async function dropOldDB() {
  const rootClient = new Client({ connectionString: ROOT_CONNECTION_STRING });
  try {
    await rootClient.connect();
    console.log('Đã kết nối vào postgres (hệ thống)...');
    
    // Disconnect any active connections to physioflow_db
    await rootClient.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'physioflow_db';
    `);

    // Drop the old database
    await rootClient.query(`DROP DATABASE IF EXISTS physioflow_db`);
    console.log('✅ Đã xóa vĩnh viễn database cũ: physioflow_db');
  } catch (err) {
    console.error('❌ Lỗi khi xóa database:', err);
  } finally {
    await rootClient.end();
  }
}

dropOldDB();
