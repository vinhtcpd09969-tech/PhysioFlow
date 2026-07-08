import { pool } from '../config/db';

class DoctorRepository {
  // 1. Lấy danh sách bệnh nhân đang xếp hàng chờ khám hôm nay
  async getDoctorQueue(userId: string, roleId: number = 4) {
    const loaiCondition = roleId === 3 ? "ch.loai != 'KHAM'" : "ch.loai = 'KHAM'";
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu as ly_do_kham, ch.trang_thai, NULL::text as anh_dinh_kem_url,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        ch.nhan_su_id as bac_si_id, ch.nhan_su_id as ky_thuat_vien_id
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE ch.nhan_su_id = $1::integer 
        AND ${loaiCondition}
        AND ch.trang_thai IN ('cho_kham', 'dang_kham', 'check_in', 'cho_xac_nhan', 'da_xac_nhan')
        AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
      ORDER BY ch.ngay_gio_bat_dau ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 2. Lấy danh sách lịch hẹn khám của bác sĩ (cho phép filter theo khoảng thời gian)
  async getDoctorAppointments(userId: string, roleId: number = 4, startDate?: string, endDate?: string) {
    const loaiCondition = roleId === 3 ? "ch.loai != 'KHAM'" : "ch.loai = 'KHAM'";
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.trang_thai, ch.ghi_chu as ly_do_kham,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai as so_dien_thoai,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh,
        ch.nhan_su_id as bac_si_id, ch.nhan_su_id as ky_thuat_vien_id
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      WHERE ch.nhan_su_id = $1::integer
        AND ${loaiCondition}
        AND ($2::timestamp IS NULL OR ch.ngay_gio_bat_dau >= $2::timestamp)
        AND ($3::timestamp IS NULL OR ch.ngay_gio_bat_dau <= $3::timestamp)
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [userId, startDate || null, endDate || null]);
    return rows;
  }

  // 3. Lấy lịch sử bệnh án lâm sàng của bệnh nhân (các lần chẩn đoán trước của Bác sĩ)
  async getPatientHistory(patientId: string) {
    const queryStr = `
      SELECT 
        nk.id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu, nk.ngay_tao as thoi_gian_tao,
        ch.id as lich_dat_id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        nd_bs.ho_ten as ten_bac_si,
        goi.ten_goi as khuyen_nghi_goi
      FROM nhat_ky_buoi_dieu_tri nk
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN nguoi_dung nd_bs ON ch.nhan_su_id = nd_bs.id
      LEFT JOIN goi_dich_vu goi ON cd.goi_dich_vu_id = goi.id
      WHERE khach_hang_id = $1::uuid AND ch.loai = 'KHAM'
      ORDER BY nk.ngay_tao DESC;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 4. Lấy danh sách lịch điều trị của bệnh nhân (tiến trình gói/lẻ thực tế)
  async getPatientTreatments(patientId: string) {
    const queryStr = `
      SELECT 
        pd.id, 
        CASE WHEN goi.loai_goi = 'LIEU_TRINH' THEN 'goi' ELSE 'dich_vu' END as loai_dieu_tri, 
        pd.tong_so_buoi, pd.so_buoi_da_dung, pd.trang_thai, pd.ngay_kich_hoat as thoi_gian_tao, 
        'PD-' || UPPER(SUBSTRING(pd.id::text FROM 1 FOR 6)) as ma_lich_dieu_tri,
        NULL::text as ten_dich_vu, goi.ten_goi,
        'Hội chẩn lâm sàng' as chan_doan
      FROM phac_do_dieu_tri pd
      JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu goi ON pd.goi_dich_vu_id = goi.id
      WHERE pd.khach_hang_id = $1::uuid
      ORDER BY pd.ngay_kich_hoat DESC NULLS LAST;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 5. Lấy danh sách chi tiết các buổi trị liệu của 1 lịch điều trị cụ thể
  async getTreatmentSessions(treatmentPlanId: string) {
    const queryStr = `
      SELECT 
        ch.id, ch.so_thu_tu_buoi, ch.trang_thai, ch.ngay_gio_bat_dau as thoi_gian_bat_dau, ch.ngay_gio_ket_thuc as thoi_gian_ket_thuc,
        nk.vas_truoc as danh_gia_truoc_buoi, nk.vas_sau as danh_gia_sau_buoi, nk.ghi_chu as danh_gia_hieu_qua, 
        nk.chong_chi_dinh as canh_bao_dac_biet, nk.chan_doan as ai_tom_tat_ngan,
        nd_ktv.ho_ten as ten_ky_thuat_vien
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      WHERE ch.phac_do_dieu_tri_id = $1::uuid AND ch.loai = 'DIEU_TRI'
      ORDER BY ch.so_thu_tu_buoi ASC;
    `;
    const { rows } = await pool.query(queryStr, [treatmentPlanId]);
    return rows;
  }

  // 6. Ghi nhận bệnh án lâm sàng & Hoàn thành lịch khám (Chạy trong transaction)
  async saveClinicalAssessment(data: {
    lich_dat_id: string;
    bac_si_id: string;
    chan_doan: string;
    chong_chi_dinh: string;
    goi_dich_vu_id?: string | null;
    ghi_chu?: string | null;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Tạo/cập nhật hồ sơ bệnh án (UPSERT vào nhat_ky_buoi_dieu_tri)
      const nhatKyQuery = `
        INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (cuoc_hen_id) 
        DO UPDATE SET 
          nguoi_tao_id = EXCLUDED.nguoi_tao_id,
          chan_doan = EXCLUDED.chan_doan,
          chong_chi_dinh = EXCLUDED.chong_chi_dinh,
          ghi_chu = EXCLUDED.ghi_chu
        RETURNING id;
      `;
      const nkRes = await client.query(nhatKyQuery, [
        data.lich_dat_id,
        parseInt(data.bac_si_id, 10),
        data.chan_doan,
        data.chong_chi_dinh,
        data.ghi_chu || null,
      ]);
      const nhatKyId = nkRes.rows[0].id;

      // 2. Thêm chỉ định gói/dịch vụ
      await client.query('DELETE FROM chi_dinh_buoi WHERE nhat_ky_id = $1', [nhatKyId]);
      if (data.goi_dich_vu_id) {
        await client.query(`
          INSERT INTO chi_dinh_buoi (nhat_ky_id, goi_dich_vu_id)
          VALUES ($1, $2)
        `, [
          nhatKyId,
          data.goi_dich_vu_id
        ]);
      }

      // 3. Cập nhật trạng thái cuộc hẹn sang 'hoan_thanh'
      const updateLdQuery = `
        UPDATE cuoc_hen 
        SET trang_thai = 'hoan_thanh'
        WHERE id = $1;
      `;
      await client.query(updateLdQuery, [data.lich_dat_id]);

      await client.query('COMMIT');
      return { success: true, medicalRecordId: nhatKyId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 7. Lấy chi tiết 1 ca khám theo ID (để hiển thị thông tin khi khám)
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

  // 8. Lấy lịch làm việc của bác sĩ (nguoi_dung_id)
  async getDoctorSchedules(userId: string) {
    const queryStr = `
      SELECT 
        id, nhan_su_id as nguoi_dung_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, 
        to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, trang_thai
      FROM lich_truc_nhan_su
      WHERE nhan_su_id = $1::integer
      ORDER BY ngay_truc ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 9. Lấy danh sách bệnh nhân kèm thông tin chống chỉ định cho bác sĩ (chỉ hiển thị bệnh nhân liên quan đến bác sĩ này)
  async getPatients(userId: string) {
    const queryStr = `
      SELECT DISTINCT kh.id as khach_hang_id, kh.id as id, kh.id as nguoi_dung_id, kh.ngay_sinh, kh.gioi_tinh, kh.dia_chi,
             COALESCE(kh.ho_ten, 'Khách vãng lai') as ho_ten, 
             kh.email, 
             kh.so_dien_thoai, 
             kh.trang_thai, 
             EXISTS (
                SELECT 1 
                FROM cuoc_hen ch_inner
                JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch_inner.id
                WHERE ch_inner.khach_hang_id = kh.id 
                  AND nk.chong_chi_dinh IS NOT NULL 
                  AND nk.chong_chi_dinh <> ''
             ) as has_chong_chi_dinh
      FROM khach_hang kh
      JOIN cuoc_hen ch ON ch.khach_hang_id = kh.id
      WHERE ch.nhan_su_id = $1::integer
      ORDER BY ho_ten ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }
}

export default new DoctorRepository();
