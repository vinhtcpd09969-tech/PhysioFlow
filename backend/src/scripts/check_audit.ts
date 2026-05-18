import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/physioflow_db' 
});

async function main() {
  console.log('--- ĐANG TRUY VẤN NHẬT KÝ HỆ THỐNG (AUDIT LOGS) ---');
  try {
    const { rows } = await pool.query(`
      SELECT a.*, nd.ho_ten as user_name
      FROM system_audit_log a
      LEFT JOIN nguoi_dung nd ON a.user_id = nd.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);
    console.log(`Tìm thấy ${rows.length} hoạt động gần nhất:`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Lỗi khi truy vấn:', err);
  } finally {
    await pool.end();
  }
}

main();
