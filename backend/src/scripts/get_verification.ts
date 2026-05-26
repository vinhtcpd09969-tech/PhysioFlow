import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  // Kiểm tra tên bảng vai trò thực tế
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log('=== Danh sách bảng ===');
  tables.rows.forEach(r => console.log(' ', r.table_name));

  // Tài khoản đã xác thực email
  const users = await pool.query(
    `SELECT id, ho_ten, email, so_dien_thoai, trang_thai, da_xac_thuc_email
     FROM nguoi_dung
     WHERE da_xac_thuc_email = true
     ORDER BY thoi_gian_tao
     LIMIT 20`
  );
  console.log('\n=== Tài khoản đã xác thực ===');
  users.rows.forEach(row => {
    console.log(`${row.ho_ten} | ${row.email} | SĐT: ${row.so_dien_thoai} | ${row.trang_thai}`);
  });

  await pool.end();
}

main().catch(console.error);
