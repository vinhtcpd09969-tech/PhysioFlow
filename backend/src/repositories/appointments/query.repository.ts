import { pool } from '../../config/db';
import adminCustomerRepository from '../admin/adminCustomer.repository';

export class AppointmentQueryRepository {
  async lazySweepExpiredReassessment() {
    try {
      // 1. Quét chuyển các ca ĐANG Ở 'cho_tai_luong_gia' mà đã quá hạn sang 'hoan_thanh' và đính kèm ghi chú
      await pool.query(`
        WITH expired_reassessments AS (
          UPDATE cuoc_hen
          SET trang_thai = 'hoan_thanh',
              thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW()),
              ghi_chu_noi_bo = COALESCE(ghi_chu_noi_bo || E'\n', '') || 'Tự động hoàn thành — quá hạn tái lượng giá mà khách không quay lại.'
          WHERE trang_thai = 'cho_tai_luong_gia'
            AND han_tai_kham IS NOT NULL
            AND han_tai_kham < NOW()
          RETURNING id
        )
        UPDATE nhat_ky_buoi_dieu_tri nk
        SET ghi_chu = REGEXP_REPLACE(
          nk.ghi_chu,
          '(\\[Hạn tái lượng giá:[^\\]]+)(\\])',
          '\\1 - Đã quá hạn khách không quay lại\\2'
        )
        WHERE nk.cuoc_hen_id IN (SELECT id FROM expired_reassessments)
          AND nk.ghi_chu LIKE '%[Hạn tái lượng giá:%'
          AND nk.ghi_chu NOT LIKE '%Đã quá hạn khách không quay lại%';
      `);

      // 2. Xóa bỏ tiền tố thừa [Hẹn tái khám hạn: ...] nếu có
      await pool.query(`
        UPDATE nhat_ky_buoi_dieu_tri
        SET ghi_chu = TRIM(REGEXP_REPLACE(ghi_chu, '\\[Hẹn tái khám hạn:[^\\]]+\\]\\s*', '', 'g'))
        WHERE ghi_chu LIKE '%[Hẹn tái khám hạn:%';
      `);
    } catch (err) {
      console.error('Lỗi khi quét tự động hoàn thành ca chờ tái lượng giá quá hạn:', err);
    }
  }

  async getAllAppointments(_userRole?: number) {
    await this.lazySweepExpiredReassessment();
    const whereClause = '';

    const query = `
      SELECT
        ch.id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau as ngay_gio_bat_dau,
        ch.ngay_gio_ket_thuc as ngay_gio_ket_thuc,
        ch.trang_thai,
        ch.buoi,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        CASE
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.ho_ten AS ten_khach_hang, 
        kh.so_dien_thoai AS so_dien_thoai,
        kh.id as khach_hang_id,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ch.nhan_su_id as bac_si_id,
        ch.nhan_su_id AS ky_thuat_vien_id,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong,
        shift_room.ca_gio_bat_dau,
        shift_room.ca_gio_ket_thuc,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu,
        ch.so_thu_tu_buoi,
        ch.phac_do_dieu_tri_id as phac_do_dieu_tri_id,
        ch.phac_do_dieu_tri_id as goi_dich_vu_id,
        ch.trang_thai_thanh_toan AS trang_thai_thanh_toan,
        hd.trang_thai as trang_thai_hoa_don_goi,
        hd.so_tien_da_tra as so_tien_da_tra_goi,
        hd.tong_tien_phai_tra as tong_tien_phai_tra_goi,
        hd.hinh_thuc_thanh_toan_goi as hinh_thuc_thanh_toan_goi,
        hd.id as hoa_don_goi_id,
        hd.tong_tien_goc as tong_tien_goc_goi,
        hd.so_tien_giam_voucher as so_tien_giam_voucher_goi,
        pd.tong_so_buoi as tong_so_buoi_goi,
        pd.goi_dich_vu_id as pd_goi_dich_vu_id,
        COALESCE(g.loai_goi, gpd.loai_goi) as loai_goi,
        ch.nguoi_tao_id,
        nd_tao.ho_ten AS ten_nguoi_tao,
        ch.thoi_gian_tao as thoi_gian_tao,
        ch.ghi_chu_khach_hang AS ly_do_kham,
        ch.ghi_chu_noi_bo as ghi_chu_noi_bo,
        ch.thoi_gian_checkin,
        ch.thoi_gian_bat_dau,
        ch.thoi_gian_hoan_thanh,
        ch.thoi_gian_khong_den,
        ch.thoi_gian_huy,
        ch.han_tai_kham,
        cd.goi_dich_vu_id as khuyen_nghi_goi_id,
        goi_kn.ten_goi as khuyen_nghi_ten_goi,
        goi_kn.loai_goi as khuyen_nghi_loai_goi,
        cd.phac_do_dieu_tri_id as khuyen_nghi_phac_do_id,
        pv.thoi_gian_goi_vao,
        COALESCE(pv.so_lan_goi_khong_co_mat, 0) as so_lan_goi_khong_co_mat,
        pv.so_thu_tu_hang_doi,
        (CASE WHEN (COALESCE(g.loai_goi, '') = 'KHAM' OR UPPER(COALESCE(ch.loai, '')) = 'KHAM') AND (ch.trang_thai = 'cho_tai_luong_gia' OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1)) THEN true ELSE false END) AS is_reassessment
      FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN nguoi_dung nd_tao ON ch.nguoi_tao_id = nd_tao.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN goi_dich_vu goi_kn ON cd.goi_dich_vu_id = goi_kn.id
      LEFT JOIN LATERAL (
        SELECT thoi_gian_goi_vao, so_lan_goi_khong_co_mat, so_thu_tu_hang_doi, lan_thu
        FROM phien_lam_viec
        WHERE cuoc_hen_id = ch.id
        ORDER BY lan_thu DESC, thoi_gian_tao DESC
        LIMIT 1
      ) pv ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          id, trang_thai, so_tien_da_tra, tong_tien_phai_tra, hinh_thuc_thanh_toan_goi,
          tong_tien_goc, so_tien_giam_voucher
        FROM hoa_don
        WHERE
          (ch.phac_do_dieu_tri_id IS NOT NULL AND phac_do_dieu_tri_id = ch.phac_do_dieu_tri_id)
          OR
          (ch.phac_do_dieu_tri_id IS NULL AND cuoc_hen_id = ch.id)
        ORDER BY phac_do_dieu_tri_id ASC NULLS FIRST
        LIMIT 1
      ) hd ON TRUE
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN LATERAL (
        SELECT 
          lt.phong_id, 
          p_lt.ten_phong,
          to_char(lt.gio_bat_dau, 'HH24:MI') as ca_gio_bat_dau,
          to_char(lt.gio_ket_thuc, 'HH24:MI') as ca_gio_ket_thuc
        FROM lich_truc_nhan_su lt
        LEFT JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND (
            (ch.buoi = 'sang' AND lt.gio_bat_dau < '12:00:00' AND lt.gio_ket_thuc > '07:30:00')
            OR
            (ch.buoi = 'chieu' AND lt.gio_bat_dau < '20:00:00' AND lt.gio_ket_thuc > '12:00:00')
            OR
            (ch.buoi IS NULL)
          )
        ORDER BY lt.gio_bat_dau ASC
        LIMIT 1
      ) shift_room ON TRUE
      ${whereClause}
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async getPublicServices() {
    const query = `
      SELECT id, ten_goi as ten_dich_vu, thoi_luong_phut, don_gia
      FROM goi_dich_vu
      WHERE trang_thai = 'hoat_dong' AND loai_goi IN ('KHAM', 'LE')
      ORDER BY ten_goi ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async getActiveDoctorDates(): Promise<string[]> {
    const query = `
      SELECT DISTINCT to_char(lt.ngay_truc, 'YYYY-MM-DD') as ngay
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
      WHERE nd.vai_tro_id = 4
        AND lt.trang_thai = 'hoat_dong'
        AND lt.ngay_truc >= CURRENT_DATE
      ORDER BY ngay;
    `;
    const { rows } = await pool.query(query);
    return rows.map((r: any) => r.ngay);
  }

  async getPublicAppointmentById(id: string) {
    const query = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ch.trang_thai,
        kh.ho_ten as ho_ten_khach, 
        kh.so_dien_thoai,
        kh.gioi_tinh as gioi_tinh_khach,
        kh.email,
        gdv.ten_goi as ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ch.nhan_su_id AS ky_thuat_vien_id,
        ch.phong_id as phong_id,
        p.ten_phong as ten_phong,
        nk.chan_doan,
        nk.chong_chi_dinh,
        ch.ghi_chu_khach_hang as ghi_chu_dat_lich,
        ch.ghi_chu_noi_bo as ghi_chu_noi_bo,
        ch.thoi_gian_huy,
        ch.ngay_gio_bat_dau as thoi_gian_tao,
        (SELECT expires_at FROM otp_codes WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) ORDER BY expires_at DESC LIMIT 1) as han_xac_nhan
      FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu gdv ON ch.goi_dich_vu_id = gdv.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      WHERE ch.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  async getCustomerAppointments(customer_id: string) {
    const query = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc as ngay_gio_ket_thuc,
        ch.trang_thai,
        ch.buoi,
        ch.trang_thai_thanh_toan,
        CASE
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.ho_ten AS ten_khach_hang,
        kh.id as khach_hang_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        pddt.tong_so_buoi as tong_so_buoi_goi,
        gdv.ten_goi as ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        nd_ktv.anh_dai_dien AS anh_bac_si,
        ch.nhan_su_id as bac_si_id,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong,
        shift_room.ca_gio_bat_dau,
        shift_room.ca_gio_ket_thuc,
        nk.chan_doan,
        nk.chong_chi_dinh,
        ch.ghi_chu_khach_hang as ghi_chu,
        ch.ghi_chu_noi_bo as ghi_chu_noi_bo,
        ch.nguoi_tao_id,
        nd_tao.ho_ten AS ten_nguoi_tao,
        ch.thoi_gian_tao as thoi_gian_tao,
        ch.thoi_gian_checkin,
        ch.thoi_gian_bat_dau as thoi_gian_bat_dau_dieu_tri,
        ch.thoi_gian_hoan_thanh,
        ch.thoi_gian_khong_den,
        ch.thoi_gian_huy,
        (
          SELECT expires_at 
          FROM otp_codes 
          WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) 
          ORDER BY expires_at DESC 
          LIMIT 1
        ) as han_xac_nhan,
        CASE 
          WHEN dg_n.id IS NULL THEN NULL
          WHEN gdv.loai_goi = 'LIEU_TRINH' AND pddt.trang_thai NOT IN ('hoan_thanh', 'huy_ngang') THEN dg_n.id
          WHEN dg_g.id IS NOT NULL THEN dg_g.id
          ELSE NULL
        END as rating_id,
        COALESCE(dg_g.so_sao, dg_n.so_sao) as rating_stars,
        COALESCE(dg_g.nhan_xet, dg_n.nhan_xet) as rating_comment,
        dg_g.id as rating_service_id,
        dg_g.so_sao as rating_service_stars,
        dg_g.nhan_xet as rating_service_comment,
        dg_n.id as rating_staff_id,
        dg_n.so_sao as rating_staff_stars,
        dg_n.nhan_xet as rating_staff_comment,
        gdv.loai_goi,
        pddt.trang_thai as phac_do_status
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu gdv ON ch.goi_dich_vu_id = gdv.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN nguoi_dung nd_tao ON ch.nguoi_tao_id = nd_tao.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN LATERAL (
        SELECT 
          lt.phong_id, 
          p_lt.ten_phong,
          to_char(lt.gio_bat_dau, 'HH24:MI') as ca_gio_bat_dau,
          to_char(lt.gio_ket_thuc, 'HH24:MI') as ca_gio_ket_thuc
        FROM lich_truc_nhan_su lt
        LEFT JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND (
            (ch.buoi = 'sang' AND lt.gio_bat_dau < '12:00:00' AND lt.gio_ket_thuc > '07:30:00')
            OR
            (ch.buoi = 'chieu' AND lt.gio_bat_dau < '20:00:00' AND lt.gio_ket_thuc > '12:00:00')
            OR
            (ch.buoi IS NULL)
          )
        ORDER BY lt.gio_bat_dau ASC
        LIMIT 1
      ) shift_room ON TRUE
      LEFT JOIN phac_do_dieu_tri pddt ON ch.phac_do_dieu_tri_id = pddt.id
      LEFT JOIN danh_gia dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id AND dg_g.loai_danh_gia = 'GOI_DICH_VU')
      LEFT JOIN danh_gia dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id AND dg_n.loai_danh_gia = 'NHAN_SU')
      WHERE kh.id = $1
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query, [customer_id]);
    return rows;
  }

  async getCustomerMedicalRecord(customer_id: string) {
    const khach_hang = await adminCustomerRepository.findCustomerByIdOrIdentifier(customer_id);
    if (!khach_hang) return null;

    const realKhachHangId = khach_hang.id;

    // 1. Lịch sử khám lâm sàng
    const examQuery = `
      SELECT 
        ch.id as cuoc_hen_id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau as ngay_kham,
        'KHAM' as loai_ho_so,
        ch.ghi_chu_khach_hang as ly_do_kham,
        ch.anh_dinh_kem_url,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu,
        nd.ho_ten as ten_bac_si,
        nd.anh_dai_dien as anh_bac_si,
        nd.vai_tro_id as vai_tro_bac_si,
        p.ten_phong as ten_phong,
        hd.id as hoa_don_id,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don,
        goi_kn.ten_goi as khuyen_nghi_goi,
        cd.phac_do_dieu_tri_id as khuyen_nghi_phac_do_id,
        NULL::timestamptz as khuyen_nghi_han_kich_hoat
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN goi_dich_vu goi_kn ON cd.goi_dich_vu_id = goi_kn.id
      LEFT JOIN hoa_don hd ON hd.cuoc_hen_id = ch.id AND hd.phac_do_dieu_tri_id IS NULL
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.loai IN ('KHAM', 'KHAM_MOI')
        AND ch.trang_thai = 'hoan_thanh'
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const examRes = await pool.query(examQuery, [realKhachHangId]);

    // 2. Gói liệu trình
    const packageQuery = `
      SELECT 
        pd.id as phac_do_id,
        pd.goi_dich_vu_id,
        'PD-' || UPPER(SUBSTRING(pd.id::text FROM 1 FOR 6)) as ma_phac_do,
        pd.ngay_kich_hoat,
        'GOI_LIEU_TRINH' as loai_ho_so,
        g.ten_goi as ten_dich_vu,
        pd.tong_so_buoi,
        pd.so_buoi_da_dung,
        pd.trang_thai as trang_thai_phac_do,
        pd.han_su_dung,
        hd.id as hoa_don_id,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don,
        hd.hinh_thuc_thanh_toan_goi,
        CAST(hd.tong_tien_goc AS double precision) as tong_tien_goc,
        CAST(hd.so_tien_giam_voucher AS double precision) as so_tien_giam_voucher,
        g.loai_goi
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1::uuid
      ORDER BY pd.ngay_kich_hoat DESC NULLS LAST;
    `;
    const packageRes = await pool.query(packageQuery, [realKhachHangId]);

    // 3. Các buổi thuộc gói
    const sessionQuery = `
      SELECT DISTINCT ON (ch.phac_do_dieu_tri_id, ch.so_thu_tu_buoi)
        ch.id as cuoc_hen_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        ch.ngay_gio_bat_dau,
        ch.trang_thai,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu,
        nk.vas_truoc,
        nk.vas_sau,
        nk.du_lieu_tri_lieu,
        nd.ho_ten as ten_bac_si,
        nd.anh_dai_dien as anh_ky_thuat_vien,
        p.ten_phong,
        COALESCE(dg_g.so_sao, dg_n.so_sao) as danh_gia_sao,
        COALESCE(dg_g.nhan_xet, dg_n.nhan_xet) as danh_gia_nhan_xet,
        COALESCE(dg_g.phan_hoi_nhan_xet, dg_n.phan_hoi_nhan_xet) as phan_hoi_nhan_xet
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN danh_gia dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id AND dg_g.loai_danh_gia = 'GOI_DICH_VU')
      LEFT JOIN danh_gia dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id AND dg_n.loai_danh_gia = 'NHAN_SU')
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.phac_do_dieu_tri_id IS NOT NULL
      ORDER BY ch.phac_do_dieu_tri_id, ch.so_thu_tu_buoi ASC,
        CASE ch.trang_thai
          WHEN 'hoan_thanh' THEN 0
          WHEN 'khong_den' THEN 2
          WHEN 'da_huy' THEN 3
          ELSE 1
        END ASC,
        ch.ngay_gio_bat_dau DESC;
    `;
    const sessionRes = await pool.query(sessionQuery, [realKhachHangId]);

    const sessionsByPackage: Record<string, any[]> = {};
    for (const session of sessionRes.rows) {
      const pid = session.phac_do_dieu_tri_id;
      if (!sessionsByPackage[pid]) {
        sessionsByPackage[pid] = [];
      }
      sessionsByPackage[pid].push(session);
    }

    const goi_dieu_tri = packageRes.rows.map((pkg: any) => ({
      ...pkg,
      buoi_dieu_tri: sessionsByPackage[pkg.phac_do_id] || []
    }));

    // 4. Dịch vụ lẻ
    const singleQuery = `
      SELECT 
        ch.id as cuoc_hen_id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau as ngay_dieu_tri,
        'DICH_VU_LE' as loai_ho_so,
        g.ten_goi as ten_dich_vu,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu,
        nk.vas_truoc,
        nk.vas_sau,
        nd.ho_ten as ten_bac_si,
        p.ten_phong,
        hd.id as hoa_don_id,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don,
        COALESCE(dg_g.so_sao, dg_n.so_sao) as danh_gia_sao,
        COALESCE(dg_g.nhan_xet, dg_n.nhan_xet) as danh_gia_nhan_xet,
        COALESCE(dg_g.phan_hoi_nhan_xet, dg_n.phan_hoi_nhan_xet) as phan_hoi_nhan_xet
      FROM cuoc_hen ch
      JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN hoa_don hd ON hd.cuoc_hen_id = ch.id
      LEFT JOIN danh_gia dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id AND dg_g.loai_danh_gia = 'GOI_DICH_VU')
      LEFT JOIN danh_gia dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id AND dg_n.loai_danh_gia = 'NHAN_SU')
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.phac_do_dieu_tri_id IS NULL
        AND ch.loai != 'KHAM'
        AND ch.loai != 'KHAM_MOI'
        AND (ch.trang_thai = 'hoan_thanh' OR hd.id IS NOT NULL)
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const singleRes = await pool.query(singleQuery, [realKhachHangId]);

    return {
      khach_hang,
      lich_su_kham: examRes.rows,
      goi_dieu_tri,
      dieu_tri_le: singleRes.rows
    };
  }

  async getCustomerTreatmentSessions(customer_id: string) {
    const query = `
      SELECT 
        ch.id,
        ch.so_thu_tu_buoi,
        ch.ngay_gio_bat_dau as thoi_gian_bat_dau,
        ch.ngay_gio_ket_thuc as thoi_gian_ket_thuc,
        ch.trang_thai,
        nk.chan_doan as ai_tom_tat_ngan,
        nk.vas_truoc as danh_gia_truoc_buoi,
        nk.vas_sau as danh_gia_sau_buoi,
        nk.ghi_chu as danh_gia_hieu_qua,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        dv.ten_dich_vu,
        g.ten_goi
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN dich_vu dv ON ch.dich_vu_id = dv.id
      WHERE ch.khach_hang_id = $1 AND ch.loai = 'DIEU_TRI'
      ORDER BY ch.so_thu_tu_buoi DESC, ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query, [customer_id]);
    return rows;
  }

  async getCustomerInvoices(customer_id: string) {
    const { rows } = await pool.query(`
      SELECT
        hd.id,
        hd.khach_hang_id,
        hd.phac_do_dieu_tri_id,
        hd.cuoc_hen_id,
        hd.tong_tien_goc,
        hd.hinh_thuc_thanh_toan_goi,
        hd.voucher_id,
        hd.so_tien_giam_voucher,
        v.ma_code as ma_voucher_ap_dung,
        v.ten_chien_dich as ten_voucher_ap_dung,
        hd.tong_tien_phai_tra as tong_tien_thanh_toan,
        hd.so_tien_da_tra as da_thanh_toan,
        hd.trang_thai,
        hd.ghi_chu,
        hd.ngay_tao,
        ch.ngay_gio_bat_dau as ngay_kham,
        ch.ngay_gio_ket_thuc as ngay_kham_ket_thuc,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai,
        (
          SELECT COUNT(*)::int
          FROM cuoc_hen
          WHERE phac_do_dieu_tri_id = pd.id
            AND (
              trang_thai = 'hoan_thanh'
              OR (trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat') AND hd.hinh_thuc_thanh_toan_goi = 'tra_thang')
            )
            AND loai = 'DIEU_TRI'
        ) as so_buoi_da_dung,
        pd.tong_so_buoi,
        pd.han_su_dung,
        pd.trang_thai as trang_thai_phac_do,
        COALESCE(gdv.loai_goi, dv.loai_goi) as loai_goi,
        COALESCE(gdv.ten_goi, dv.ten_goi, 'Buổi Lượng giá chức năng') as ten_dich_vu,
        CASE
          WHEN hd.hinh_thuc_thanh_toan_goi = 'tung_buoi' AND EXISTS (
            SELECT 1 FROM hoa_don exam_hd
            WHERE exam_hd.cuoc_hen_id = hd.cuoc_hen_id
              AND exam_hd.phac_do_dieu_tri_id IS NULL
              AND exam_hd.trang_thai = 'da_thanh_toan'
          ) THEN 0
          WHEN hd.phac_do_dieu_tri_id IS NULL AND hd.tong_tien_goc > COALESCE(dv.don_gia, 0) THEN 0
          WHEN hd.cuoc_hen_id IS NOT NULL THEN COALESCE(dv.don_gia, 0)
          ELSE 0
        END as chi_phi_kham,
        (
          SELECT 'HD-' || UPPER(SUBSTRING(sep_hd.id::text FROM 1 FOR 6))
          FROM hoa_don sep_hd
          WHERE sep_hd.cuoc_hen_id = hd.cuoc_hen_id
            AND sep_hd.phac_do_dieu_tri_id IS NULL
            AND sep_hd.trang_thai = 'da_thanh_toan'
            AND sep_hd.tong_tien_phai_tra > 0
            AND sep_hd.id != hd.id
            AND sep_hd.ngay_tao < hd.ngay_tao
          LIMIT 1
        ) as ma_hoa_don_kham_rieng,
        (
          SELECT sep_hd.ngay_tao
          FROM hoa_don sep_hd
          WHERE sep_hd.cuoc_hen_id = hd.cuoc_hen_id
            AND sep_hd.phac_do_dieu_tri_id IS NULL
            AND sep_hd.trang_thai = 'da_thanh_toan'
            AND sep_hd.tong_tien_phai_tra > 0
            AND sep_hd.id != hd.id
            AND sep_hd.ngay_tao < hd.ngay_tao
          LIMIT 1
        ) as ngay_thanh_toan_kham_rieng
      FROM hoa_don hd
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      LEFT JOIN phac_do_dieu_tri pd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
      LEFT JOIN cuoc_hen ch ON hd.cuoc_hen_id = ch.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN khuyen_mai_voucher v ON hd.voucher_id = v.id
      WHERE hd.khach_hang_id = $1::uuid
      ORDER BY COALESCE(
        (SELECT MAX(gt.ngay_giao_dich) FROM giao_dich_thanh_toan gt WHERE gt.hoa_don_id = hd.id),
        hd.ngay_tao
      ) DESC
    `, [customer_id]);
    return rows;
  }

  async getCustomerPayments(customer_id: string) {
    const { rows } = await pool.query(`
      SELECT
        gt.id, gt.hoa_don_id, gt.so_tien, gt.loai_giao_dich, gt.phuong_thuc, gt.ma_tham_chieu,
        gt.ma_tham_chieu as ma_giao_dich,
        gt.ngay_giao_dich as thoi_gian_giao_dich,
        gt.chi_tiet,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don
      FROM giao_dich_thanh_toan gt
      JOIN hoa_don hd ON gt.hoa_don_id = hd.id
      WHERE hd.khach_hang_id = $1::uuid
      ORDER BY gt.ngay_giao_dich DESC
    `, [customer_id]);
    return rows;
  }
}

export default new AppointmentQueryRepository();
