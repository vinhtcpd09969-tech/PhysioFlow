import { pool } from '../config/db';

class TechnicianRepository {
  // 1. Lấy danh sách ca trị liệu chờ thực hiện hôm nay của KTV
  async getTechnicianQueue(userId: string) {
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu as ly_do_kham, ch.trang_thai, NULL::text as anh_dinh_kem_url,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        ch.nhan_su_id as ky_thuat_vien_id
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE ch.nhan_su_id = $1::integer 
        AND ch.loai = 'DIEU_TRI'
        AND ch.trang_thai IN ('cho_kham', 'dang_kham', 'check_in', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin')
        AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
      ORDER BY ch.ngay_gio_bat_dau ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 2. Lấy danh sách lịch hẹn điều trị của KTV (hỗ trợ filter thời gian)
  async getTechnicianAppointments(userId: string, startDate?: string, endDate?: string) {
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.trang_thai, ch.ghi_chu as ly_do_kham,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai as so_dien_thoai,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh,
        ch.nhan_su_id as ky_thuat_vien_id
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      WHERE ch.nhan_su_id = $1::integer
        AND ch.loai = 'DIEU_TRI'
        AND ($2::timestamp IS NULL OR ch.ngay_gio_bat_dau >= $2::timestamp)
        AND ($3::timestamp IS NULL OR ch.ngay_gio_bat_dau <= $3::timestamp)
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [userId, startDate || null, endDate || null]);
    return rows;
  }

  // 3. Lấy chi tiết lịch trị liệu hiện tại (bao gồm cả chẩn đoán/chống chỉ định của Bác sĩ)
  async getAppointmentDetail(appointmentId: string) {
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu as ly_do_kham, ch.trang_thai, NULL::text as anh_dinh_kem_url,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu,
        nk.vas_truoc, nk.vas_sau,
        cd.goi_dich_vu_id
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      WHERE ch.id = $1::uuid;
    `;
    const { rows } = await pool.query(queryStr, [appointmentId]);
    return rows[0] || null;
  }

  // 4. Lưu lượng giá VAS, ghi chú của KTV (Chạy trong transaction bảo toàn chẩn đoán của Bác sĩ)
  async saveTreatmentRecord(data: {
    lich_dat_id: string;
    ktv_id: string;
    vas_truoc: number;
    vas_sau: number;
    ghi_chu?: string | null;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Tạo hoặc cập nhật nhật ký buổi điều trị (UPSERT)
      const nhatKyQuery = `
        INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, ghi_chu, vas_truoc, vas_sau)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (cuoc_hen_id) 
        DO UPDATE SET 
          nguoi_tao_id = EXCLUDED.nguoi_tao_id,
          ghi_chu = EXCLUDED.ghi_chu,
          vas_truoc = EXCLUDED.vas_truoc,
          vas_sau = EXCLUDED.vas_sau
        RETURNING id;
      `;
      const nkRes = await client.query(nhatKyQuery, [
        data.lich_dat_id,
        parseInt(data.ktv_id, 10),
        data.ghi_chu || null,
        data.vas_truoc,
        data.vas_sau
      ]);
      const nhatKyId = nkRes.rows[0].id;

      // 2. Lấy thông tin phác đồ điều trị liên kết
      const getPdRes = await client.query('SELECT phac_do_dieu_tri_id FROM cuoc_hen WHERE id = $1', [data.lich_dat_id]);
      const phacDoId = getPdRes.rows[0]?.phac_do_dieu_tri_id;

      // 3. Cập nhật trạng thái cuộc hẹn thành 'hoan_thanh'
      const updateLdQuery = `
        UPDATE cuoc_hen 
        SET trang_thai = 'hoan_thanh'
        WHERE id = $1;
      `;
      await client.query(updateLdQuery, [data.lich_dat_id]);

      // 4. Nếu ca trị liệu thuộc 1 Phác đồ (gói liệu trình), cập nhật số buổi đã dùng
      if (phacDoId) {
        const countRes = await client.query(
          "SELECT COUNT(*)::int as count FROM cuoc_hen WHERE phac_do_dieu_tri_id = $1 AND trang_thai = 'hoan_thanh' AND loai = 'DIEU_TRI'",
          [phacDoId]
        );
        const completedCount = countRes.rows[0].count || 0;

        await client.query(
          'UPDATE phac_do_dieu_tri SET so_buoi_da_dung = $1 WHERE id = $2',
          [completedCount, phacDoId]
        );
      }

      await client.query('COMMIT');
      return { success: true, medicalRecordId: nhatKyId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 5. Lấy danh sách lịch trực của KTV
  async getTechnicianSchedules(userId: string) {
    const queryStr = `
      SELECT 
        id, nhan_su_id as nguoi_dung_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, 
        to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc,
        trang_thai
      FROM lich_truc_nhan_su
      WHERE nhan_su_id = $1::integer AND ngay_truc >= CURRENT_DATE
      ORDER BY ngay_truc ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }
}

export default new TechnicianRepository();
