import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/physioflow_db' 
});

async function main() {
  console.log('--- ĐANG TRUY VẤN LỊCH TRỰC CỦA NHÂN VIÊN ---');
  try {
    const { rows } = await pool.query(`
      SELECT id, nguoi_dung_id, to_char(ngay, 'YYYY-MM-DD') as ngay, gio_bat_dau, gio_ket_thuc, trang_thai 
      FROM lich_lam_viec 
      ORDER BY ngay DESC
    `);
    console.log(`Tìm thấy tất cả ${rows.length} ca trực trong cơ sở dữ liệu:`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Lỗi khi truy vấn:', err);
  } finally {
    await pool.end();
  }
}

main();
