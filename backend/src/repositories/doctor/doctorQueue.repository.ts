import { pool } from '../../config/db';

export class DoctorQueueRepository {
  // 1. Lấy danh sách bệnh nhân đang xếp hàng chờ khám (CHỈ CÁC CA ĐÃ CHECK-IN / ĐANG KHÁM / CHỜ TÁI LƯỢNG GIÁ)
  async getDoctorQueue(userId: string, roleId: number = 4) {
    const loaiCondition = roleId === 3 ? "ch.loai != 'KHAM'" : "ch.loai = 'KHAM'";
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai as so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu_khach_hang as ly_do_kham, ch.trang_thai, ch.anh_dinh_kem_url,
        ch.phac_do_dieu_tri_id, ch.loai, COALESCE(g.loai_goi, gpd.loai_goi) as loai_goi, ch.buoi, ch.ghi_chu_noi_bo,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        ch.nhan_su_id as bac_si_id, ch.nhan_su_id as ky_thuat_vien_id,
        nk.ngay_tao as nhat_ky_ngay_tao,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong,
        ch.thoi_gian_checkin,
        pv.thoi_gian_goi_vao,
        COALESCE(pv.so_lan_goi_khong_co_mat, 0) as so_lan_goi_khong_co_mat,
        pv.so_thu_tu_hang_doi,
        (CASE WHEN (COALESCE(g.loai_goi, '') = 'KHAM' OR UPPER(COALESCE(ch.loai, '')) = 'KHAM') AND (ch.trang_thai = 'cho_tai_luong_gia' OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1)) THEN true ELSE false END) AS is_reassessment
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT thoi_gian_goi_vao, so_lan_goi_khong_co_mat, so_thu_tu_hang_doi, lan_thu
        FROM phien_lam_viec
        WHERE cuoc_hen_id = ch.id
        ORDER BY lan_thu DESC, thoi_gian_tao DESC
        LIMIT 1
      ) pv ON TRUE
      LEFT JOIN LATERAL (
        SELECT lt.phong_id, p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND lt.gio_bat_dau <= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
          AND lt.gio_ket_thuc >= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
        LIMIT 1
      ) shift_room ON TRUE
      WHERE (ch.nhan_su_id = $1::integer OR ch.nhan_su_id IS NULL)
        AND ${loaiCondition}
        AND ch.trang_thai IN ('da_checkin', 'dang_kham', 'cho_tai_luong_gia')
      ORDER BY 
        (CASE WHEN ch.trang_thai = 'cho_tai_luong_gia' OR nk.id IS NOT NULL OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1) THEN 0 ELSE 1 END) ASC,
        ch.thoi_gian_checkin ASC NULLS LAST,
        ch.ngay_gio_bat_dau ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 2. Lấy danh sách lịch hẹn khám của bác sĩ (cho phép filter theo khoảng thời gian)
  async getDoctorAppointments(userId: string, roleId: number = 4, startDate?: string, endDate?: string) {
    const loaiCondition = roleId === 3 ? "ch.loai != 'KHAM'" : "ch.loai = 'KHAM'";
    let whereClause = `WHERE (ch.nhan_su_id = $1::integer OR ch.nhan_su_id IS NULL) AND ${loaiCondition}`;
    const queryParams: any[] = [userId];

    if (startDate && endDate) {
      queryParams.push(startDate, endDate);
      whereClause += ` AND ch.ngay_gio_bat_dau >= $${queryParams.length - 1}::timestamp AND ch.ngay_gio_bat_dau <= $${queryParams.length}::timestamp`;
    }

    const queryStr = `
      SELECT 
        ch.id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.trang_thai, ch.ghi_chu_khach_hang as ly_do_kham,
        ch.anh_dinh_kem_url, ch.khach_hang_id,
        ch.phac_do_dieu_tri_id, ch.loai, COALESCE(g.loai_goi, gpd.loai_goi) as loai_goi, ch.buoi, ch.ghi_chu_noi_bo,
        ch.thoi_gian_tao, ch.thoi_gian_checkin, ch.thoi_gian_bat_dau, ch.thoi_gian_hoan_thanh,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai as so_dien_thoai,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh,
        ch.nhan_su_id as bac_si_id, ch.nhan_su_id as ky_thuat_vien_id,
        nk.ngay_tao as nhat_ky_ngay_tao,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        ch.so_thu_tu_buoi,
        COALESCE(g.tong_so_buoi, pd.tong_so_buoi) as tong_so_buoi_goi,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong,
        pv.thoi_gian_goi_vao,
        COALESCE(pv.so_lan_goi_khong_co_mat, 0) as so_lan_goi_khong_co_mat,
        pv.so_thu_tu_hang_doi,
        (CASE WHEN (COALESCE(g.loai_goi, '') = 'KHAM' OR UPPER(COALESCE(ch.loai, '')) = 'KHAM') AND (ch.trang_thai = 'cho_tai_luong_gia' OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1)) THEN true ELSE false END) AS is_reassessment
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT thoi_gian_goi_vao, so_lan_goi_khong_co_mat, so_thu_tu_hang_doi, lan_thu
        FROM phien_lam_viec
        WHERE cuoc_hen_id = ch.id
        ORDER BY lan_thu DESC, thoi_gian_tao DESC
        LIMIT 1
      ) pv ON TRUE
      LEFT JOIN LATERAL (
        SELECT lt.phong_id, p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND lt.gio_bat_dau <= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
          AND lt.gio_ket_thuc >= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
        LIMIT 1
      ) shift_room ON TRUE
      ${whereClause}
      ORDER BY 
        (CASE WHEN ch.trang_thai = 'cho_tai_luong_gia' OR nk.id IS NOT NULL OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1) THEN 0 ELSE 1 END) ASC,
        ch.thoi_gian_checkin ASC NULLS LAST,
        ch.ngay_gio_bat_dau ASC;
    `;
    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
  }

  // 2b. Gọi bệnh nhân từ hàng đợi vào phòng (B2/B19)
  async callInPatient(cuocHenId: string, userId: string, roleId: number) {
    const loaiCondition = roleId === 3 ? "loai != 'KHAM'" : "loai = 'KHAM'";
    const { rows: claimRows } = await pool.query(`
      UPDATE cuoc_hen
      SET nhan_su_id = $2::integer,
          gan_qua_hang_doi = CASE WHEN nhan_su_id IS NULL THEN TRUE ELSE gan_qua_hang_doi END
      WHERE id = $1
        AND ${loaiCondition}
        AND trang_thai IN ('da_checkin', 'cho_tai_luong_gia')
        AND (nhan_su_id IS NULL OR nhan_su_id = $2::integer)
      RETURNING id
    `, [cuocHenId, userId]);
    if (claimRows.length === 0) {
      throw new Error('Lịch hẹn này đã được nhân sự khác nhận hoặc không còn trong hàng đợi.');
    }
    const { rows: sessionRows } = await pool.query(
      `UPDATE phien_lam_viec SET thoi_gian_goi_vao = NOW()
       WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)
       RETURNING id`,
      [cuocHenId]
    );
    if (sessionRows.length === 0) {
      await pool.query(
        `INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, thoi_gian_goi_vao, so_lan_goi_khong_co_mat, thoi_gian_tao)
         VALUES ($1, 1, NOW(), 0, NOW())`,
        [cuocHenId]
      );
    }

    const { rows } = await pool.query(`
      SELECT nd.ho_ten as ten_nhan_su, COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong
      FROM cuoc_hen ch
      JOIN nguoi_dung nd ON nd.id = ch.nhan_su_id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN LATERAL (
        SELECT p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND lt.gio_bat_dau <= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
          AND lt.gio_ket_thuc >= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
        LIMIT 1
      ) shift_room ON TRUE
      WHERE ch.id = $1
    `, [cuocHenId]);

    return {
      ten_nhan_su: rows[0]?.ten_nhan_su || null,
      ten_phong: rows[0]?.ten_phong || null,
    };
  }

  // 2c. Đánh dấu khách không có mặt khi được gọi
  async markPatientAbsent(cuocHenId: string, userId: string, roleId: number): Promise<{ so_lan_goi_khong_co_mat: number; shouldFinalize: boolean }> {
    const loaiCondition = roleId === 3 ? "loai != 'KHAM'" : "loai = 'KHAM'";
    const { rows: apptRows } = await pool.query(
      `SELECT id FROM cuoc_hen WHERE id = $1 AND ${loaiCondition} AND nhan_su_id = $2::integer AND trang_thai IN ('da_checkin', 'cho_tai_luong_gia')`,
      [cuocHenId, userId]
    );
    if (apptRows.length === 0) {
      throw new Error('Không tìm thấy lịch hẹn này trong hàng đợi của bạn.');
    }

    const { rows: updRows } = await pool.query(
      `UPDATE phien_lam_viec SET so_lan_goi_khong_co_mat = so_lan_goi_khong_co_mat + 1
       WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)
       RETURNING so_lan_goi_khong_co_mat`,
      [cuocHenId]
    );

    let newCount: number;
    if (updRows.length === 0) {
      await pool.query(
        `INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, so_lan_goi_khong_co_mat, thoi_gian_tao)
         VALUES ($1, 1, 1, NOW())`,
        [cuocHenId]
      );
      newCount = 1;
    } else {
      newCount = updRows[0].so_lan_goi_khong_co_mat;
    }

    await pool.query(
      `UPDATE phien_lam_viec SET thoi_gian_goi_vao = NULL
       WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)`,
      [cuocHenId]
    );
    await pool.query(
      `UPDATE cuoc_hen
       SET thoi_gian_checkin = NOW()
       WHERE id = $1`,
      [cuocHenId]
    );
    return { so_lan_goi_khong_co_mat: newCount, shouldFinalize: false };
  }

  // 6.4. Kiểm tra nhân sự có ca khám khác đang mở dở (trang_thai='dang_kham')
  async getActiveSessionForStaff(staffId: number, excludeAppointmentId: string | null) {
    const { rows } = await pool.query(
      `SELECT ch.id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, kh.ho_ten as ten_khach_hang
       FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE ch.nhan_su_id = $1 AND ch.trang_thai = 'dang_kham' AND ($2::uuid IS NULL OR ch.id != $2::uuid)
       LIMIT 1`,
      [staffId, excludeAppointmentId || null]
    );
    return rows[0] || null;
  }

  // 6.5. Bắt đầu ca khám / điều trị
  async startSession(appointmentId: string, staffId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Cập nhật trạng thái cuộc hẹn thành 'dang_kham', gán nhân sự (nếu đang Bất kỳ/NULL), và ghi mốc thoi_gian_bat_dau
      await client.query(`
        UPDATE cuoc_hen
        SET trang_thai = 'dang_kham',
            nhan_su_id = COALESCE(nhan_su_id, $2::integer),
            gan_qua_hang_doi = CASE WHEN nhan_su_id IS NULL THEN TRUE ELSE gan_qua_hang_doi END,
            thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, NOW())
        WHERE id = $1::uuid;
      `, [appointmentId, staffId]);

      // 2. Đảm bảo phien_lam_viec có mốc thoi_gian_goi_vao
      await client.query(`
        UPDATE phien_lam_viec
        SET thoi_gian_goi_vao = COALESCE(thoi_gian_goi_vao, NOW())
        WHERE id = (
          SELECT id FROM phien_lam_viec 
          WHERE cuoc_hen_id = $1::uuid 
          ORDER BY lan_thu DESC, thoi_gian_tao DESC 
          LIMIT 1
        );
      `, [appointmentId]);

      await client.query(`
        INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, thoi_gian_goi_vao, so_lan_goi_khong_co_mat, thoi_gian_tao)
        SELECT $1::uuid, 1, NOW(), 0, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM phien_lam_viec WHERE cuoc_hen_id = $1::uuid);
      `, [appointmentId]);

      // 3. Tạo nhật ký buổi điều trị (nếu chưa có)
      await client.query(`
        INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu)
        VALUES ($1::uuid, $2::integer, '', '', '')
        ON CONFLICT (cuoc_hen_id) DO NOTHING;
      `, [appointmentId, staffId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new DoctorQueueRepository();
