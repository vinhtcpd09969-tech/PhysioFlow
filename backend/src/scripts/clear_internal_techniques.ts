import { pool } from '../config/db';

async function main() {
  console.log('Bắt đầu dọn dẹp Kỹ thuật nội bộ và loại bỏ liên kết gói...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lấy danh sách ID các dịch vụ kỹ thuật nội bộ (loai_dich_vu = 'chinh')
    const res = await client.query("SELECT id::text FROM dich_vu WHERE loai_dich_vu = 'chinh'");
    const chinhIds = res.rows.map(r => r.id);
    console.log(`Tìm thấy ${chinhIds.length} dịch vụ kỹ thuật nội bộ.`);

    if (chinhIds.length > 0) {
      // 2. Xóa các bản ghi liên kết trong goi_dich_vu_chi_tiet
      await client.query("DELETE FROM goi_dich_vu_chi_tiet WHERE dich_vu_id = ANY($1::uuid[])", [chinhIds]);
      console.log('✅ Đã xóa goi_dich_vu_chi_tiet liên kết');

      // 3. Reset cột chi_tiet_dich_vu JSON của gói dịch vụ về mảng rỗng []
      await client.query("UPDATE goi_dich_vu SET chi_tiet_dich_vu = '[]'::json");
      console.log('✅ Đã làm sạch chi_tiet_dich_vu trong goi_dich_vu');

      // 4. Xóa/Cập nhật các liên kết lịch hẹn, buổi trị liệu để tránh lỗi khóa ngoại (Foreign Key)
      await client.query("DELETE FROM buoi_tri_lieu_dich_vu WHERE dich_vu_id = ANY($1::uuid[])", [chinhIds]);
      await client.query("DELETE FROM buoi_dich_vu_su_dung WHERE dich_vu_id = ANY($1::uuid[])", [chinhIds]);
      await client.query("UPDATE buoi_tri_lieu SET dich_vu_id = NULL WHERE dich_vu_id = ANY($1::uuid[])", [chinhIds]);
      await client.query("UPDATE lich_dat SET dich_vu_id = NULL WHERE dich_vu_id = ANY($1::uuid[])", [chinhIds]);
      await client.query("UPDATE lich_dat SET khuyen_nghi_dich_vu_id = NULL WHERE khuyen_nghi_dich_vu_id = ANY($1::uuid[])", [chinhIds]);
      await client.query("UPDATE lich_dieu_tri SET dich_vu_id = NULL WHERE dich_vu_id = ANY($1::uuid[])", [chinhIds]);
      await client.query("DELETE FROM voucher_dich_vu WHERE dich_vu_id = ANY($1::uuid[])", [chinhIds]);
      console.log('✅ Đã dọn dẹp tất cả các khóa ngoại liên quan');

      // 5. Xóa hoàn toàn dịch vụ kỹ thuật nội bộ khỏi bảng dich_vu
      await client.query("DELETE FROM dich_vu WHERE loai_dich_vu = 'chinh'");
      console.log('✅ Đã xóa tất cả dịch vụ kỹ thuật nội bộ');
    } else {
      // Nếu không có dịch vụ nào, vẫn đảm bảo gói dịch vụ được làm sạch
      await client.query("UPDATE goi_dich_vu SET chi_tiet_dich_vu = '[]'::json");
      console.log('✅ Đã đảm bảo chi_tiet_dich_vu trong goi_dich_vu sạch');
    }

    // 6. Xóa bất kỳ liên kết goi_dich_vu_chi_tiet nào của dịch vụ đơn lẻ (loai_dich_vu = 'bo_sung') để phòng ngừa
    const boSungRes = await client.query("SELECT id::text FROM dich_vu WHERE loai_dich_vu = 'bo_sung'");
    const boSungIds = boSungRes.rows.map(r => r.id);
    if (boSungIds.length > 0) {
      await client.query("DELETE FROM goi_dich_vu_chi_tiet WHERE dich_vu_id = ANY($1::uuid[])", [boSungIds]);
      console.log('✅ Đã xóa goi_dich_vu_chi_tiet liên kết của dịch vụ đơn lẻ');
    }

    await client.query('COMMIT');
    console.log('🎉 Toàn bộ thao tác dọn dẹp và cập nhật liên kết danh mục/gói hoàn tất thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi thực hiện dọn dẹp:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
