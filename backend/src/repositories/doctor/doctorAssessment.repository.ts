import { pool } from '../../config/db';

export class DoctorAssessmentRepository {
  // 6. Ghi nhận bệnh án lâm sàng & Hoàn thành / Hẹn tái khám (Chạy trong transaction)
  async saveClinicalAssessment(data: {
    lich_dat_id: string;
    bac_si_id: string;
    chan_doan: string;
    chong_chi_dinh: string;
    goi_dich_vu_id?: string | null;
    goi_dich_vu_ids?: string[] | null;
    ghi_chu?: string | null;
    is_reassessment?: boolean;
    han_tai_kham?: string | null;
    vas_score?: number | null;
    rom_data?: any[] | null;
    mmt_data?: any[] | null;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentRes = await client.query('SELECT trang_thai FROM cuoc_hen WHERE id = $1', [data.lich_dat_id]);
      if (currentRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn.');
      }
      if (['hoan_thanh', 'da_huy', 'khong_den'].includes(currentRes.rows[0].trang_thai)) {
        throw new Error('Ca khám này đã kết thúc (hoàn thành/hủy/không đến), không thể chỉnh sửa hoặc hoàn thành lại.');
      }

      const duLieuLuongGiaJson = (data.rom_data?.length || data.mmt_data?.length)
        ? JSON.stringify({ rom_data: data.rom_data || [], mmt_data: data.mmt_data || [] })
        : null;

      // 1. Tạo/cập nhật hồ sơ bệnh án (UPSERT vào nhat_ky_buoi_dieu_tri)
      const nhatKyQuery = `
        INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu, vas_truoc, du_lieu_luong_gia)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cuoc_hen_id) 
        DO UPDATE SET 
          nguoi_tao_id = EXCLUDED.nguoi_tao_id,
          chan_doan = EXCLUDED.chan_doan,
          chong_chi_dinh = EXCLUDED.chong_chi_dinh,
          ghi_chu = EXCLUDED.ghi_chu,
          vas_truoc = COALESCE(EXCLUDED.vas_truoc, nhat_ky_buoi_dieu_tri.vas_truoc),
          du_lieu_luong_gia = COALESCE(EXCLUDED.du_lieu_luong_gia, nhat_ky_buoi_dieu_tri.du_lieu_luong_gia)
        RETURNING id;
      `;
      const nkRes = await client.query(nhatKyQuery, [
        data.lich_dat_id,
        parseInt(data.bac_si_id, 10),
        data.chan_doan,
        data.chong_chi_dinh,
        data.ghi_chu || null,
        data.vas_score != null ? data.vas_score : null,
        duLieuLuongGiaJson,
      ]);
      const nhatKyId = nkRes.rows[0].id;

      // 2. Thêm chỉ định gói/dịch vụ (hỗ trợ nhiều gói cùng lúc)
      await client.query('DELETE FROM chi_dinh_buoi WHERE nhat_ky_id = $1', [nhatKyId]);
      const rawGoiIds = data.goi_dich_vu_ids || (data.goi_dich_vu_id ? [data.goi_dich_vu_id] : []);
      const validGoiIds = Array.from(new Set(rawGoiIds.filter(Boolean)));
      for (const gid of validGoiIds) {
        await client.query(`
          INSERT INTO chi_dinh_buoi (nhat_ky_id, goi_dich_vu_id, tong_so_buoi_tu_van, don_gia_tu_van)
          SELECT $1, g.id, g.tong_so_buoi, g.don_gia
          FROM goi_dich_vu g
          WHERE g.id = $2
        `, [
          nhatKyId,
          gid
        ]);
      }

      // 3. Nếu là Hẹn tái khám (Chuyển tuyến): Đổi trạng thái sang 'cho_tai_luong_gia'
      if (data.is_reassessment) {
        const updateReassessQuery = `
          UPDATE cuoc_hen
          SET trang_thai = 'cho_tai_luong_gia',
              han_tai_kham = $2
          WHERE id = $1;
        `;
        await client.query(updateReassessQuery, [data.lich_dat_id, data.han_tai_kham || null]);
        await client.query(
          `UPDATE phien_lam_viec SET thoi_gian_goi_vao = NULL
           WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)`,
          [data.lich_dat_id]
        );
      } else {
        // Hoàn thành ca khám bình thường (hoặc hoàn thành sau khi tái lượng giá)
        const updateLdQuery = `
          UPDATE cuoc_hen
          SET trang_thai = 'hoan_thanh',
              han_tai_kham = NULL,
              nhan_su_id = COALESCE(nhan_su_id, $2::integer),
              thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, thoi_gian_checkin, NOW()),
              thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW())
          WHERE id = $1;
        `;
        await client.query(updateLdQuery, [data.lich_dat_id, parseInt(data.bac_si_id, 10)]);
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

  // 7. Lấy chi tiết 1 ca khám theo ID
  async getAppointmentDetail(appointmentId: string) {
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai as so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu_khach_hang as ly_do_kham, ch.trang_thai, ch.anh_dinh_kem_url,
        ch.loai, ch.trang_thai_thanh_toan,
        ch.thoi_gian_tao, ch.thoi_gian_checkin, ch.thoi_gian_bat_dau, ch.thoi_gian_hoan_thanh,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu,
        nk.vas_truoc, nk.vas_sau, nk.du_lieu_luong_gia, nk.du_lieu_tri_lieu,
        COALESCE(ch.goi_dich_vu_id, pd.goi_dich_vu_id, cd.goi_dich_vu_id) as goi_dich_vu_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_goi,
        COALESCE(g.quy_trinh, gpd.quy_trinh) as quy_trinh,
        COALESCE(g.muc_tieu, gpd.muc_tieu) as mo_ta_goi,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        COALESCE(g.tong_so_buoi, pd.tong_so_buoi) as tong_so_buoi,
        pd.tong_so_buoi as pd_tong_so_buoi,
        nk.ngay_tao as nhat_ky_ngay_tao
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      WHERE ch.id = $1::uuid;
    `;
    const { rows } = await pool.query(queryStr, [appointmentId]);
    const apt = rows[0] || null;
    if (apt && apt.ho_so_benh_an_id) {
      const cdRes = await pool.query(`
        SELECT cd.goi_dich_vu_id, g.ten_goi, g.don_gia, g.tong_so_buoi
        FROM chi_dinh_buoi cd
        JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
        WHERE cd.nhat_ky_id = $1
      `, [apt.ho_so_benh_an_id]);
      apt.danh_sach_goi_chi_dinh = cdRes.rows;
      apt.goi_dich_vu_ids = cdRes.rows.map((r: any) => r.goi_dich_vu_id);
    }
    if (apt) {
      const blockedRes = await pool.query(`
        SELECT pd.goi_dich_vu_id, g.ten_goi, 'dang_dieu_tri' as reason_type,
               ('Khách hàng đang điều trị gói này (' || pd.so_buoi_da_dung || '/' || pd.tong_so_buoi || ' buổi)') as message
        FROM phac_do_dieu_tri pd
        JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
        WHERE pd.khach_hang_id = $1
          AND pd.trang_thai = 'dang_dieu_tri'
          AND pd.so_buoi_da_dung < pd.tong_so_buoi
        UNION ALL
        SELECT cd.goi_dich_vu_id, g.ten_goi, 'cho_thanh_toan' as reason_type,
               'Khách hàng đã được chỉ định gói này từ ca trước (chưa thanh toán)' as message
        FROM chi_dinh_buoi cd
        JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
        JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
        JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
        WHERE ch.khach_hang_id = $1
          AND ch.id != $2
          AND ch.trang_thai NOT IN ('da_huy', 'khong_den')
          AND cd.phac_do_dieu_tri_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM phac_do_dieu_tri pd
            WHERE pd.khach_hang_id = $1
              AND pd.goi_dich_vu_id = cd.goi_dich_vu_id
              AND (
                pd.trang_thai IN ('dang_dieu_tri', 'hoan_thanh')
                OR (pd.trang_thai = 'huy' AND (pd.ngay_huy >= nk.ngay_tao OR pd.ngay_kich_hoat >= nk.ngay_tao::date))
              )
          )
      `, [apt.khach_hang_id, appointmentId]);
      apt.blocked_packages = blockedRes.rows;
    }
    return apt;
  }

  // 10. Lưu nháp thông tin lượng giá
  async saveAssessmentDraft(data: {
    lich_dat_id: string;
    bac_si_id: string;
    chan_doan?: string | null;
    chong_chi_dinh?: string | null;
    ghi_chu?: string | null;
    vas_score?: number | null;
    rom_data?: any[] | null;
    mmt_data?: any[] | null;
    selected_package_id?: string | null;
    selected_package_ids?: string[] | null;
  }) {
    const duLieuLuongGiaJson = (data.rom_data?.length || data.mmt_data?.length)
      ? JSON.stringify({ rom_data: data.rom_data || [], mmt_data: data.mmt_data || [] })
      : null;

    await pool.query(`
      INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu, vas_truoc, du_lieu_luong_gia)
      VALUES ($1::uuid, $2::integer, COALESCE($3, ''), COALESCE($4, ''), COALESCE($5, ''), $6, $7)
      ON CONFLICT (cuoc_hen_id) 
      DO UPDATE SET 
        chan_doan = COALESCE(EXCLUDED.chan_doan, nhat_ky_buoi_dieu_tri.chan_doan),
        chong_chi_dinh = COALESCE(EXCLUDED.chong_chi_dinh, nhat_ky_buoi_dieu_tri.chong_chi_dinh),
        ghi_chu = COALESCE(EXCLUDED.ghi_chu, nhat_ky_buoi_dieu_tri.ghi_chu),
        vas_truoc = COALESCE(EXCLUDED.vas_truoc, nhat_ky_buoi_dieu_tri.vas_truoc),
        du_lieu_luong_gia = COALESCE(EXCLUDED.du_lieu_luong_gia, nhat_ky_buoi_dieu_tri.du_lieu_luong_gia);
    `, [
      data.lich_dat_id,
      parseInt(data.bac_si_id, 10),
      data.chan_doan || null,
      data.chong_chi_dinh || null,
      data.ghi_chu || null,
      data.vas_score != null ? data.vas_score : null,
      duLieuLuongGiaJson,
    ]);

    const rawPkgIds = data.selected_package_ids || (data.selected_package_id ? [data.selected_package_id] : []);
    if (data.selected_package_ids !== undefined || data.selected_package_id !== undefined) {
      const nkRes = await pool.query('SELECT id FROM nhat_ky_buoi_dieu_tri WHERE cuoc_hen_id = $1::uuid', [data.lich_dat_id]);
      if (nkRes.rows.length > 0) {
        const nhatKyId = nkRes.rows[0].id;
        await pool.query('DELETE FROM chi_dinh_buoi WHERE nhat_ky_id = $1', [nhatKyId]);
        const validPkgIds = Array.from(new Set(rawPkgIds.filter(Boolean)));
        for (const pkgId of validPkgIds) {
          await pool.query(`
            INSERT INTO chi_dinh_buoi (nhat_ky_id, goi_dich_vu_id, tong_so_buoi_tu_van, don_gia_tu_van)
            SELECT $1, g.id, g.tong_so_buoi, g.don_gia
            FROM goi_dich_vu g
            WHERE g.id = $2
          `, [nhatKyId, pkgId]);
        }
      }
    }

    return { success: true };
  }
}

export default new DoctorAssessmentRepository();
