import { pool } from '../../config/db';

export class ReceptionistCustomerRepository {
  async searchCustomers(queryText: string) {
    const { rows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, gioi_tinh, ngay_sinh
      FROM khach_hang
      WHERE (unaccent(ho_ten) ILIKE unaccent($1) OR so_dien_thoai ILIKE $1) AND trang_thai = 'hoat_dong'
      LIMIT 50
    `, [`%${queryText}%`]);
    return rows;
  }

  async getCustomerContactInfo(khach_hang_id: string) {
    const { rows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai 
      FROM khach_hang
      WHERE id = $1
    `, [khach_hang_id]);
    return rows[0];
  }

  async getCustomerTreatmentPlans(customerId: string) {
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      return [];
    }
    const { rows } = await pool.query(`
      SELECT pd.id::text, pd.goi_dich_vu_id, pd.tong_so_buoi,
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
             pd.trang_thai,
             gdv.ten_goi as ten_goi_dich_vu, gdv.thoi_luong_phut,
             NULL::uuid as cuoc_hen_id, gdv.loai_goi,
             hd.id as hoa_don_id,
             hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra,
             hd.tong_tien_goc, hd.so_tien_giam_voucher,
             hd.trang_thai as hoa_don_trang_thai,
             (
                SELECT jsonb_build_object(
                  'so_thu_tu_buoi', ch_active.so_thu_tu_buoi,
                  'ngay_gio_bat_dau', ch_active.ngay_gio_bat_dau,
                  'trang_thai', ch_active.trang_thai
                )
                FROM cuoc_hen ch_active
                WHERE ch_active.phac_do_dieu_tri_id = pd.id
                  AND ch_active.trang_thai IN ('da_xac_nhan', 'da_checkin', 'dang_kham', 'cho_tai_luong_gia')
                LIMIT 1
             ) as lich_dang_hoat_dong
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1
        AND (
          SELECT COUNT(*)::int
          FROM cuoc_hen
          WHERE phac_do_dieu_tri_id = pd.id
            AND (
              trang_thai = 'hoan_thanh'
              OR (trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat') AND hd.hinh_thuc_thanh_toan_goi = 'tra_thang')
            )
            AND loai = 'DIEU_TRI'
        ) < pd.tong_so_buoi
        AND pd.trang_thai = 'dang_dieu_tri'
        AND (hd.trang_thai IS NULL OR hd.trang_thai <> 'da_hoan_tien')
        AND (pd.han_su_dung IS NULL OR pd.han_su_dung >= CURRENT_DATE)
    `, [customerId]);

    const { rows: pendingRecs } = await pool.query(`
      SELECT
        cd.id::text,
        cd.goi_dich_vu_id,
        COALESCE(cd.tong_so_buoi_tu_van, gdv.tong_so_buoi) as tong_so_buoi,
        0::int as so_buoi_da_dung,
        'khuyen_nghi' as trang_thai,
        gdv.ten_goi as ten_goi_dich_vu,
        gdv.thoi_luong_phut,
        ch.id as cuoc_hen_id,
        gdv.loai_goi,
        NULL::uuid as hoa_don_id,
        NULL::varchar as hinh_thuc_thanh_toan_goi,
        NULL::bigint as tong_tien_phai_tra,
        NULL::bigint as so_tien_da_tra,
        NULL::bigint as tong_tien_goc,
        NULL::bigint as so_tien_giam_voucher,
        NULL::varchar as hoa_don_trang_thai,
        NULL::jsonb as lich_dang_hoat_dong
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu gdv ON cd.goi_dich_vu_id = gdv.id
      WHERE ch.khach_hang_id = $1
        AND cd.phac_do_dieu_tri_id IS NULL
        AND gdv.loai_goi = 'LIEU_TRINH'
      ORDER BY ch.ngay_gio_bat_dau DESC
    `, [customerId]);

    return [...rows, ...pendingRecs];
  }

  async getCustomerRoster(filters: {
    page: number;
    pageSize: number;
    search: string;
    canLienHe: boolean;
    staleDays: number;
  }) {
    const { page, pageSize, search, canLienHe, staleDays } = filters;
    const offset = (page - 1) * pageSize;

    const canLienHeWhere = canLienHe ? '(can_lien_he = true OR pend_ten_goi IS NOT NULL)' : 'TRUE';
    const searchWhere = `(ho_ten ILIKE $1 OR so_dien_thoai ILIKE $1 OR email ILIKE $1 OR ('KH-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))) ILIKE $1)`;

    const { rows } = await pool.query(`
      WITH base AS (
        SELECT
          kh.id, kh.ho_ten, kh.so_dien_thoai, kh.email, kh.trang_thai,
          pend.ten_goi AS pend_ten_goi, NULL::timestamptz AS pend_han_kich_hoat,
          pend.ngay_gio_bat_dau AS pend_ngay_cho_kich_hoat,
          pend.goi_dich_vu_id AS pend_goi_dich_vu_id, pend.cuoc_hen_id AS pend_cuoc_hen_id,
          prog.id AS prog_id, prog.ten_goi AS prog_ten_goi, prog.tong_so_buoi AS prog_tong_so_buoi,
          prog.so_buoi_da_dung AS prog_so_buoi_da_dung, prog.last_completed_at AS prog_last_completed_at,
          prog.has_upcoming AS prog_has_upcoming,
          xong.ten_goi AS xong_ten_goi,
          huy.ten_goi AS huy_ten_goi,
          last_used.last_date AS last_used_at,
          (
            prog.id IS NOT NULL AND COALESCE(prog.so_buoi_da_dung, 0) >= 1
            AND prog.last_completed_at IS NOT NULL AND NOT COALESCE(prog.has_upcoming, false)
            AND prog.last_completed_at <= NOW() - $4 * INTERVAL '1 day'
          ) AS can_lien_he
        FROM khach_hang kh
        LEFT JOIN LATERAL (
          SELECT g.ten_goi, cd.goi_dich_vu_id, ch.id AS cuoc_hen_id, ch.ngay_gio_bat_dau
          FROM chi_dinh_buoi cd
          JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
          JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
          JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
          WHERE ch.khach_hang_id = kh.id AND cd.phac_do_dieu_tri_id IS NULL
            AND g.loai_goi = 'LIEU_TRINH'
          ORDER BY ch.ngay_gio_bat_dau DESC LIMIT 1
        ) pend ON true
        LEFT JOIN LATERAL (
          SELECT pd.id, g.ten_goi, pd.tong_so_buoi,
            pd.so_buoi_da_dung,
            (SELECT MAX(ngay_gio_bat_dau) FROM cuoc_hen WHERE phac_do_dieu_tri_id = pd.id AND trang_thai = 'hoan_thanh' AND loai = 'DIEU_TRI') AS last_completed_at,
            EXISTS (
              SELECT 1 FROM cuoc_hen ch_up
              WHERE ch_up.phac_do_dieu_tri_id = pd.id AND ch_up.ngay_gio_bat_dau > NOW()
                AND ch_up.trang_thai NOT IN ('da_huy', 'huy')
            ) AS has_upcoming
          FROM phac_do_dieu_tri pd JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
          WHERE pd.khach_hang_id = kh.id AND pd.trang_thai = 'dang_dieu_tri'
          ORDER BY pd.ngay_kich_hoat DESC LIMIT 1
        ) prog ON true
        LEFT JOIN LATERAL (
          SELECT g.ten_goi
          FROM phac_do_dieu_tri pd JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
          WHERE pd.khach_hang_id = kh.id AND pd.trang_thai = 'hoan_thanh'
          ORDER BY pd.ngay_kich_hoat DESC LIMIT 1
        ) xong ON true
        LEFT JOIN LATERAL (
          SELECT g.ten_goi
          FROM phac_do_dieu_tri pd JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
          WHERE pd.khach_hang_id = kh.id AND pd.trang_thai = 'huy'
          ORDER BY pd.ngay_huy DESC NULLS LAST LIMIT 1
        ) huy ON true
        LEFT JOIN LATERAL (
          SELECT MAX(ngay_gio_bat_dau) AS last_date
          FROM cuoc_hen
          WHERE khach_hang_id = kh.id AND trang_thai = 'hoan_thanh'
        ) last_used ON true
      )
      SELECT *, COUNT(*) OVER()::int AS full_count
      FROM base
      WHERE ${searchWhere} AND ${canLienHeWhere}
      ORDER BY ${canLienHe
        ? "CASE WHEN pend_ten_goi IS NOT NULL THEN 0 ELSE 1 END, pend_ngay_cho_kich_hoat ASC NULLS LAST, prog_last_completed_at ASC NULLS LAST, "
        : ''}ho_ten ASC
      LIMIT $2 OFFSET $3
    `, [`%${search}%`, pageSize, offset, staleDays]);

    const total = rows[0]?.full_count ? Number(rows[0].full_count) : 0;
    const data = rows.map((r: any) => {
      const goiHienTai = r.pend_ten_goi
        ? { trang_thai: 'cho_kich_hoat', ten_goi: r.pend_ten_goi, han_kich_hoat: r.pend_han_kich_hoat }
        : r.prog_ten_goi
          ? { trang_thai: 'dang_dieu_tri', ten_goi: r.prog_ten_goi, so_buoi_da_dung: r.prog_so_buoi_da_dung, tong_so_buoi: r.prog_tong_so_buoi }
          : r.xong_ten_goi
            ? { trang_thai: 'hoan_thanh', ten_goi: r.xong_ten_goi }
            : r.huy_ten_goi
              ? { trang_thai: 'huy', ten_goi: r.huy_ten_goi }
              : null;
      const lyDoLienHe = r.pend_ten_goi
        ? { type: 'cho_kich_hoat' as const, goi_dich_vu_id: r.pend_goi_dich_vu_id, cuoc_hen_id: r.pend_cuoc_hen_id }
        : r.can_lien_he
          ? { type: 'lau_chua_quay_lai' as const }
          : null;
      return {
        id: r.id,
        ma_khach_hang: 'KH-' + r.id.substring(0, 8).toUpperCase(),
        ho_ten: r.ho_ten,
        so_dien_thoai: r.so_dien_thoai,
        email: r.email,
        trang_thai: r.trang_thai,
        goi_hien_tai: goiHienTai,
        last_used_at: r.last_used_at,
        ly_do_lien_he: lyDoLienHe,
      };
    });

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    };
  }

  async getCustomerHistory(customerId: string) {
    const { rows: patientRows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, trang_thai, ngay_sinh, gioi_tinh, dia_chi
      FROM khach_hang WHERE id = $1
    `, [customerId]);
    if (patientRows.length === 0) return null;
    const patient = patientRows[0];

    const { rows: plans } = await pool.query(`
      SELECT
        pd.id, pd.goi_dich_vu_id, pd.tong_so_buoi,
        pd.so_buoi_da_dung,
        pd.trang_thai, pd.ngay_kich_hoat, pd.han_su_dung,
        g.ten_goi, g.loai_goi,
        hd.id as hoa_don_id,
        hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra,
        hd.tong_tien_goc, hd.so_tien_giam_voucher,
        hd.trang_thai as trang_thai_hoa_don_goi
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1
      ORDER BY pd.ngay_kich_hoat DESC
    `, [customerId]);

    const { rows: pendingPlans } = await pool.query(`
      SELECT
        cd.goi_dich_vu_id, g.ten_goi, g.loai_goi, g.tong_so_buoi,
        ch.id as cuoc_hen_id, ch.ngay_gio_bat_dau,
        NULL::timestamptz as han_kich_hoat
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      WHERE ch.loai = 'KHAM'
        AND cd.phac_do_dieu_tri_id IS NULL
        AND ch.khach_hang_id = $1
    `, [customerId]);

    const virtualPlans = pendingPlans.map((item: any) => ({
      id: `virtual-${item.cuoc_hen_id}`,
      goi_dich_vu_id: item.goi_dich_vu_id,
      tong_so_buoi: item.tong_so_buoi,
      so_buoi_da_dung: 0,
      trang_thai: 'cho_kich_hoat',
      ngay_kich_hoat: null,
      ten_goi: item.ten_goi,
      loai_goi: item.loai_goi,
      cuoc_hen_id: item.cuoc_hen_id,
      han_kich_hoat: item.han_kich_hoat
    }));

    const { rows: appointments } = await pool.query(`
      SELECT
        ch.id, ch.phac_do_dieu_tri_id, ch.so_thu_tu_buoi, ch.goi_dich_vu_id,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.loai, ch.trang_thai,
        dv.ten_goi as ten_dich_vu
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      WHERE ch.khach_hang_id = $1
      ORDER BY ch.ngay_gio_bat_dau DESC
    `, [customerId]);

    return {
      ...patient,
      ma_khach_hang: 'KH-' + patient.id.substring(0, 8).toUpperCase(),
      plans: [...plans, ...virtualPlans],
      appointments,
    };
  }
}

export default new ReceptionistCustomerRepository();
