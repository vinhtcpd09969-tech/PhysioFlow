import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

const truncateAll = async () => {
  console.log('Đang thực hiện xóa sạch dữ liệu ở tất cả các bảng...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Tắt các trigger tạm thời nếu cần, hoặc sử dụng TRUNCATE CASCADE
    // Danh sách đầy đủ các bảng trong database office_care
    const tables = [
      'buoi_tri_lieu_dich_vu',
      'danh_gia_dich_vu',
      'buoi_tri_lieu',
      'thanh_toan',
      'hoa_don',
      'lich_dieu_tri',
      'ho_so_dieu_tri',
      'lich_dat',
      'phong',
      'thiet_bi_y_te',
      'lich_lam_viec',
      'chuyen_gia_y_te',
      'khach_hang',
      'refresh_tokens',
      'thong_bao',
      'nguoi_dung',
      'vai_tro',
      'voucher',
      'goi_dich_vu_chi_tiet',
      'goi_dich_vu',
      'dich_vu',
      'danh_muc_dich_vu',
      'otp_codes'
    ];

    console.log(`Các bảng sẽ bị xóa: ${tables.join(', ')}`);
    
    await client.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE;`);
    
    // Reset các sequence nếu có
    await client.query('ALTER SEQUENCE IF EXISTS vai_tro_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE IF EXISTS danh_muc_dich_vu_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE IF EXISTS phong_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE IF EXISTS goi_dich_vu_chi_tiet_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE IF EXISTS refresh_tokens_id_seq RESTART WITH 1;');
    
    await client.query('COMMIT');
    console.log('✅ Đã xóa sạch dữ liệu và reset sequence thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi thực hiện xóa dữ liệu:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

truncateAll();
