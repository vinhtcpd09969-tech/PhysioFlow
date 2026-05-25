import { pool } from '../config/db';

async function main() {
  try {
    const { rows } = await pool.query(`
      SELECT id, ma_voucher, ten_chien_dich, trang_thai, tu_dong_ap_dung, yeu_cau_thanh_toan, ap_dung_cho,
             COALESCE((SELECT json_agg(goi_dich_vu_id) FROM voucher_goi_dich_vu WHERE voucher_id = v.id), '[]'::json) as goi_dich_vu_ids
      FROM voucher v
    `);
    console.log('ALL VOUCHERS IN DATABASE:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
