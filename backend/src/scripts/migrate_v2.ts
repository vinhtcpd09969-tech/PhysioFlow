import { pool } from '../config/db';

async function migrate() {
  console.log('Bắt đầu cập nhật cấu trúc bảng cho Gói & Dịch vụ...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Cấu hình bảng goi_dich_vu
    console.log('Cập nhật bảng goi_dich_vu...');
    await client.query(`
      ALTER TABLE goi_dich_vu 
      ADD COLUMN IF NOT EXISTS so_dv_toi_da_moi_buoi INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS loai_goi VARCHAR(20) DEFAULT 'lieu_trinh'
    `);

    // 2. Cấu hình bảng goi_dich_vu_chi_tiet
    console.log('Cập nhật bảng goi_dich_vu_chi_tiet...');
    await client.query(`
      ALTER TABLE goi_dich_vu_chi_tiet 
      ADD COLUMN IF NOT EXISTS so_lan_toi_da_trong_goi INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS bat_buoc BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS thu_tu_thuc_hien INTEGER DEFAULT 0
    `);

    // 3. Tạo bảng buoi_dich_vu_su_dung (nếu chưa có)
    console.log('Tạo bảng buoi_dich_vu_su_dung...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS buoi_dich_vu_su_dung (
        id SERIAL PRIMARY KEY,
        buoi_tri_lieu_id UUID NOT NULL REFERENCES buoi_tri_lieu(id) ON DELETE CASCADE,
        dich_vu_id UUID NOT NULL REFERENCES dich_vu(id),
        so_lan_thuc_te INTEGER NOT NULL DEFAULT 1,
        ghi_chu_ly_do TEXT,
        ktv_id UUID REFERENCES nguoi_dung(id),
        trang_thai VARCHAR(20) NOT NULL DEFAULT 'da_duyet'
          CHECK (trang_thai IN ('cho_duyet', 'da_duyet', 'tu_choi')),
        tao_luc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        duyet_boi UUID REFERENCES nguoi_dung(id),
        duyet_luc TIMESTAMPTZ
      )
    `);

    // Index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bdvsu_buoi ON buoi_dich_vu_su_dung(buoi_tri_lieu_id);
      CREATE INDEX IF NOT EXISTS idx_bdvsu_dv ON buoi_dich_vu_su_dung(dich_vu_id);
    `);

    await client.query('COMMIT');
    console.log('Cập nhật DB Schema thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi chạy migration:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
