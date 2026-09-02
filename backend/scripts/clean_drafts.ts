import { pool } from '../src/config/db';

async function cleanDrafts() {
  try {
    const res1 = await pool.query(`
      UPDATE phac_do_dieu_tri pd
      SET trang_thai = 'cho_kich_hoat', ngay_kich_hoat = NULL
      WHERE pd.trang_thai = 'dang_dieu_tri'
        AND COALESCE((SELECT COUNT(*) FROM cuoc_hen WHERE phac_do_dieu_tri_id = pd.id AND trang_thai = 'hoan_thanh'), 0) = 0
        AND COALESCE((SELECT SUM(so_tien_da_tra) FROM hoa_don WHERE phac_do_dieu_tri_id = pd.id), 0) = 0
    `);
    console.log('Cleaned unpaid regimens to cho_kich_hoat:', res1.rowCount);

    const resDup = await pool.query(`
      UPDATE phac_do_dieu_tri pd1
      SET trang_thai = 'huy', ngay_huy = NOW()
      WHERE pd1.trang_thai = 'cho_kich_hoat'
        AND COALESCE(pd1.so_buoi_da_dung, 0) = 0
        AND NOT EXISTS (SELECT 1 FROM cuoc_hen WHERE phac_do_dieu_tri_id = pd1.id AND trang_thai IN ('da_checkin', 'dang_kham', 'hoan_thanh'))
        AND NOT EXISTS (SELECT 1 FROM hoa_don WHERE phac_do_dieu_tri_id = pd1.id AND COALESCE(so_tien_da_tra, 0) > 0)
        AND pd1.id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY khach_hang_id, goi_dich_vu_id 
              ORDER BY 
                CASE trang_thai WHEN 'dang_dieu_tri' THEN 1 ELSE 2 END,
                id DESC
            ) as rn
            FROM phac_do_dieu_tri
            WHERE trang_thai IN ('dang_dieu_tri', 'cho_kich_hoat')
          ) sub
          WHERE sub.rn > 1
        )
    `);
    console.log('Cleaned duplicate draft regimens to huy:', resDup.rowCount);

    const res2 = await pool.query(`
      DELETE FROM hoa_don
      WHERE trang_thai = 'chua_thanh_toan'
        AND COALESCE(so_tien_da_tra, 0) = 0
        AND id NOT IN (SELECT DISTINCT hoa_don_id FROM giao_dich_thanh_toan)
    `);
    console.log('Cleaned auto-created draft invoices:', res2.rowCount);
  } catch (err) {
    console.error('Error cleaning drafts:', err);
  } finally {
    process.exit(0);
  }
}

cleanDrafts();
