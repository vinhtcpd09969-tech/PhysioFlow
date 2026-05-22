import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/physioflow_db' 
});

async function main() {
  console.log('--- ĐANG TRUY VẤN NHẬT KÝ HỆ THỐNG (AUDIT LOGS) ---');
  console.log('Lưu ý: Bảng system_audit_log đã được xóa khỏi cơ sở dữ liệu. Toàn bộ log hiện được ghi ra console.');
}

main();
