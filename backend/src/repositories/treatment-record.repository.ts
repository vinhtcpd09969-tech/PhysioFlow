import { pool } from '../config/db';

class TreatmentRecordRepository {
  async createTreatmentRecord(data: any) {
    const query = `
      INSERT INTO phac_do_dieu_tri (
        khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat
      ) VALUES ($1, $2, $3, 0, 'cho_thanh_toan', NOW())
      RETURNING *, ngay_kich_hoat as thoi_gian_tao
    `;
    const values = [
      data.khach_hang_id || null,
      data.goi_dich_vu_id || null,
      data.so_luong_buoi || 10
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async getTreatmentRecords() {
    const query = `
      SELECT 
        pd.id, 
        pd.khach_hang_id, 
        pd.goi_dich_vu_id, 
        pd.tong_so_buoi, 
        pd.so_buoi_da_dung, 
        pd.trang_thai,
        pd.ngay_kich_hoat as thoi_gian_tao,
        kh.ho_ten as ho_ten_khach,
        kh.so_dien_thoai,
        goi.ten_goi,
        'Bác sĩ phụ trách' as ten_bac_si,
        'Phòng chính' as ten_phong_kham,
        'KTV phụ trách' as ten_ky_thuat_vien_hien_tai,
        'Phòng trị liệu' as ten_phong_tri_lieu_hien_tai
      FROM phac_do_dieu_tri pd
      JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      JOIN khach_hang kh ON pd.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu goi ON pd.goi_dich_vu_id = goi.id
      ORDER BY pd.ngay_kich_hoat DESC NULLS LAST
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async assignTreatmentRecord(id: string) {
    const query = `
      UPDATE phac_do_dieu_tri
      SET trang_thai = 'dang_dieu_tri'
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      throw new Error('Không tìm thấy hồ sơ điều trị');
    }
    return { record: rows[0] };
  }
}

export default new TreatmentRecordRepository();
