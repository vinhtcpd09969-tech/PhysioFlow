import { pool } from '../../config/db';
import { sendAccountLockedNotification } from '../../utils/mailer';

export class AdminCustomerRepository {
  // --- QUẢN LÝ KHÁCH HÀNG ---
  async getCustomers() {
    const { rows } = await pool.query(`
      SELECT id as khach_hang_id, ngay_sinh, gioi_tinh, dia_chi,
             id as nguoi_dung_id, 
             COALESCE(ho_ten, 'Khách vãng lai') as ho_ten, 
             email, 
             so_dien_thoai, 
             trang_thai, 
             now() as created_at
      FROM khach_hang
      ORDER BY ho_ten ASC
    `);
    return rows;
  }

  async findCustomerByEmail(email: string, excludeId?: string) {
    const query = excludeId
      ? 'SELECT id FROM khach_hang WHERE LOWER(email) = LOWER($1) AND id != $2::uuid'
      : 'SELECT id FROM khach_hang WHERE LOWER(email) = LOWER($1)';
    const params = excludeId ? [email, excludeId] : [email];
    const { rows } = await pool.query(query, params);
    return rows[0];
  }

  async findCustomerByPhone(phone: string, excludeId?: string) {
    const query = excludeId
      ? 'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id != $2::uuid'
      : 'SELECT id FROM khach_hang WHERE so_dien_thoai = $1';
    const params = excludeId ? [phone, excludeId] : [phone];
    const { rows } = await pool.query(query, params);
    return rows[0];
  }

  async findCustomerByIdOrIdentifier(identifier: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(identifier));
    if (isUuid) {
      const { rows } = await pool.query(
        `SELECT id, ho_ten, so_dien_thoai, email,
                'KH-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8)) as ma_khach_hang,
                ngay_sinh, gioi_tinh, dia_chi
         FROM khach_hang WHERE id = $1::uuid LIMIT 1`,
        [String(identifier)]
      );
      return rows[0] || null;
    } else {
      const { rows } = await pool.query(
        `SELECT id, ho_ten, so_dien_thoai, email,
                'KH-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8)) as ma_khach_hang,
                ngay_sinh, gioi_tinh, dia_chi
         FROM khach_hang WHERE id::text = $1 OR email = $1 OR so_dien_thoai = $1 LIMIT 1`,
        [String(identifier)]
      );
      return rows[0] || null;
    }
  }

  async updateCustomer(id: string, data: any) {
    const { ho_ten, so_dien_thoai, email, gioi_tinh, dia_chi, ngay_sinh } = data;
    const { rows } = await pool.query(`
      UPDATE khach_hang
      SET ho_ten = $1, so_dien_thoai = $2, email = $3, gioi_tinh = $4, dia_chi = $5, ngay_sinh = $6
      WHERE id = $7
      RETURNING *
    `, [ho_ten, so_dien_thoai, email, gioi_tinh, dia_chi, ngay_sinh || null, id]);
    return rows[0];
  }

  async updateCustomerLock(id: string, isLocked: boolean) {
    const status = isLocked ? 'vo_hieu' : 'hoat_dong';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('UPDATE khach_hang SET trang_thai = $1 WHERE id = $2 RETURNING *', [status, id]);
      await client.query('COMMIT');

      if (isLocked && rows[0]?.email) {
        sendAccountLockedNotification(rows[0].email, rows[0].ho_ten || 'Quý khách').catch((err: any) => {
          console.error('Lỗi gửi email thông báo khóa tài khoản khách hàng:', err);
        });
      }

      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getCustomerLockImpact(id: string) {
    const [apptResult, planResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM cuoc_hen
         WHERE khach_hang_id = $1
           AND trang_thai IN ('da_xac_nhan', 'da_checkin', 'dang_kham', 'cho_tai_luong_gia')`,
        [id]
      ),
      pool.query(
        `SELECT pd.id, g.ten_goi, pd.so_buoi_da_dung, pd.tong_so_buoi
         FROM phac_do_dieu_tri pd
         JOIN goi_dich_vu g ON g.id = pd.goi_dich_vu_id
         WHERE pd.khach_hang_id = $1 AND pd.trang_thai = 'dang_dieu_tri' AND pd.so_buoi_da_dung < pd.tong_so_buoi`,
        [id]
      )
    ]);
    return {
      upcomingAppointments: apptResult.rows[0].cnt as number,
      activePlans: planResult.rows as { id: string; ten_goi: string; so_buoi_da_dung: number; tong_so_buoi: number }[]
    };
  }

  async getCustomersOverview(filters: { page: number; pageSize: number; search: string; status: string[]; repTier?: 'low' | 'mid' | 'high' }) {
    const { page, pageSize, search, status, repTier } = filters;
    const offset = (page - 1) * pageSize;

    const statusClauses: string[] = [];
    if (status.includes('locked')) statusClauses.push("trang_thai = 'vo_hieu'");
    if (status.includes('no_record')) statusClauses.push('NOT has_record');
    const statusWhere = statusClauses.length ? statusClauses.join(' AND ') : 'TRUE';
    const searchWhere = `(ho_ten ILIKE $1 OR so_dien_thoai ILIKE $1 OR email ILIKE $1 OR ('KH-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))) ILIKE $1)`;
    const repWhere = 'TRUE';

    const { rows } = await pool.query(`
      WITH base AS (
        SELECT
          kh.id, kh.ho_ten, kh.so_dien_thoai, kh.email, kh.trang_thai,
          COALESCE(spend.total, 0)::bigint AS tong_chi_tieu,
          COALESCE(stats_lich.ti_le_huy, 0)::float AS ti_le_huy,
          COALESCE(stats_lich.tong_lich, 0)::int AS tong_lich,
          COALESCE(stats_lich.so_lich_huy_vang, 0)::int AS so_lich_huy_vang,
          (
            EXISTS (SELECT 1 FROM phac_do_dieu_tri pd WHERE pd.khach_hang_id = kh.id)
            OR EXISTS (
              SELECT 1 FROM chi_dinh_buoi cd
              JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
              JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
              JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
              WHERE ch.khach_hang_id = kh.id AND cd.phac_do_dieu_tri_id IS NULL
                AND g.loai_goi = 'LIEU_TRINH'
            )
            OR EXISTS (
              SELECT 1 FROM cuoc_hen ch_h
              WHERE ch_h.khach_hang_id = kh.id
                AND ch_h.loai IN ('KHAM', 'DICH_VU_LE')
                AND ch_h.trang_thai NOT IN ('da_huy', 'huy')
            )
          ) AS has_record
        FROM khach_hang kh
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(gd.so_tien), 0) AS total
          FROM hoa_don hd
          JOIN giao_dich_thanh_toan gd ON gd.hoa_don_id = hd.id
          WHERE hd.khach_hang_id = kh.id
        ) spend ON true
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) AS tong_lich,
            COUNT(CASE WHEN ch.trang_thai IN ('da_huy', 'huy', 'khong_den') THEN 1 END) AS so_lich_huy_vang,
            ROUND(
              (COUNT(CASE WHEN ch.trang_thai IN ('da_huy', 'huy', 'khong_den') THEN 1 END)::numeric / GREATEST(COUNT(*), 1) * 100)::numeric,
              1
            ) AS ti_le_huy
          FROM cuoc_hen ch
          WHERE ch.khach_hang_id = kh.id
        ) stats_lich ON true
      )
      SELECT *, COUNT(*) OVER()::int AS full_count
      FROM base
      WHERE ${searchWhere} AND ${statusWhere} AND ${repWhere}
      ORDER BY ho_ten ASC
      LIMIT $2 OFFSET $3
    `, [`%${search}%`, pageSize, offset]);

    const total = rows[0]?.full_count ? Number(rows[0].full_count) : 0;
    const data = rows.map((r: any) => ({
      id: r.id,
      ma_khach_hang: 'KH-' + r.id.substring(0, 8).toUpperCase(),
      ho_ten: r.ho_ten,
      so_dien_thoai: r.so_dien_thoai,
      email: r.email,
      trang_thai: r.trang_thai,
      tong_chi_tieu: Number(r.tong_chi_tieu || 0),
      ti_le_huy: Number(r.ti_le_huy || 0),
      tong_lich: Number(r.tong_lich || 0),
      so_lich_huy_vang: Number(r.so_lich_huy_vang || 0),
      has_record: r.has_record
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    };
  }

  async getTreatmentPlansOverview(params: { page: number; pageSize: number; search?: string; status?: string }) {
    const { page, pageSize, search, status } = params;
    const offset = (page - 1) * pageSize;

    const STATUS_CONDITIONS: Record<string, string> = {
      dang_dieu_tri: `trang_thai = 'dang_dieu_tri' AND NOT qua_han`,
      qua_han: `qua_han`,
      hoan_thanh: `trang_thai = 'hoan_thanh'`,
      huy: `trang_thai = 'huy'`
    };
    const statusWhere = status && STATUS_CONDITIONS[status] ? STATUS_CONDITIONS[status] : 'TRUE';
    const searchWhere = `(ho_ten ILIKE $1 OR so_dien_thoai ILIKE $1 OR ten_goi ILIKE $1 OR ('KH-' || UPPER(SUBSTRING(khach_hang_id::text FROM 1 FOR 8))) ILIKE $1)`;

    const { rows } = await pool.query(`
      WITH base AS (
        SELECT
          pd.id, pd.khach_hang_id, pd.tong_so_buoi, pd.trang_thai, pd.ngay_kich_hoat, pd.han_su_dung,
          pd.ngay_hoan_thanh, pd.ngay_huy,
          g.ten_goi,
          kh.ho_ten, kh.so_dien_thoai, kh.email,
          (pd.trang_thai = 'dang_dieu_tri' AND pd.han_su_dung IS NOT NULL AND pd.han_su_dung < CURRENT_DATE) AS qua_han,
          (SELECT COUNT(*)::int FROM cuoc_hen WHERE phac_do_dieu_tri_id = pd.id AND trang_thai = 'hoan_thanh' AND loai = 'DIEU_TRI') AS so_buoi_da_dung
        FROM phac_do_dieu_tri pd
        JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
        JOIN khach_hang kh ON pd.khach_hang_id = kh.id
      )
      SELECT *, COUNT(*) OVER()::int AS full_count
      FROM base
      WHERE ${searchWhere} AND ${statusWhere}
      ORDER BY COALESCE(ngay_huy, ngay_hoan_thanh, ngay_kich_hoat) DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `, [`%${search || ''}%`, pageSize, offset]);

    const total = rows[0]?.full_count ? Number(rows[0].full_count) : 0;
    const data = rows.map((r: any) => ({
      id: r.id,
      khach_hang_id: r.khach_hang_id,
      ma_khach_hang: 'KH-' + r.khach_hang_id.substring(0, 8).toUpperCase(),
      ho_ten: r.ho_ten,
      so_dien_thoai: r.so_dien_thoai,
      email: r.email,
      ten_goi: r.ten_goi,
      status: r.qua_han ? 'qua_han' : r.trang_thai,
      tong_so_buoi: r.tong_so_buoi,
      so_buoi_da_dung: r.so_buoi_da_dung,
      ngay_kich_hoat: r.ngay_kich_hoat,
      han_su_dung: r.han_su_dung,
      ngay_hoan_thanh: r.ngay_hoan_thanh,
      ngay_huy: r.ngay_huy
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    };
  }

  async getCompletedSingleVisits(params: { page: number; pageSize: number; search?: string; loai?: string }) {
    const { page, pageSize, search, loai } = params;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ["ch.trang_thai = 'hoan_thanh'"];
    const values: any[] = [];
    let paramIndex = 1;

    if (loai && (loai === 'KHAM' || loai === 'DICH_VU_LE')) {
      conditions.push(`ch.loai = $${paramIndex++}`);
      values.push(loai);
    } else {
      conditions.push(`ch.loai IN ('KHAM', 'DICH_VU_LE')`);
    }

    if (search && search.trim()) {
      conditions.push(`(
        kh.ho_ten ILIKE $${paramIndex} OR
        kh.so_dien_thoai ILIKE $${paramIndex} OR
        g.ten_goi ILIKE $${paramIndex} OR
        nd.ho_ten ILIKE $${paramIndex} OR
        ('KH-' || UPPER(SUBSTRING(kh.id::text FROM 1 FOR 8))) ILIKE $${paramIndex}
      )`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await pool.query(`
      WITH base AS (
        SELECT
          ch.id, ch.khach_hang_id, ch.loai, ch.ngay_gio_bat_dau,
          kh.ho_ten AS ten_khach_hang,
          kh.so_dien_thoai,
          g.ten_goi AS ten_dich_vu,
          nd.ho_ten AS ten_nhan_su
        FROM cuoc_hen ch
        JOIN khach_hang kh ON ch.khach_hang_id = kh.id
        LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
        LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
        ${whereClause}
      )
      SELECT *, COUNT(*) OVER()::int AS full_count
      FROM base
      ORDER BY ngay_gio_bat_dau DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...values, pageSize, offset]);

    const total = rows[0]?.full_count ? Number(rows[0].full_count) : 0;
    const data = rows.map((r: any) => ({
      id: r.id,
      khach_hang_id: r.khach_hang_id,
      ma_khach_hang: 'KH-' + r.khach_hang_id.substring(0, 8).toUpperCase(),
      ho_ten: r.ten_khach_hang,
      so_dien_thoai: r.so_dien_thoai,
      loai: r.loai,
      ten_dich_vu: r.ten_dich_vu,
      ngay_gio_bat_dau: r.ngay_gio_bat_dau,
      ten_nhan_su: r.ten_nhan_su
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    };
  }

  async getCustomerEmr(khachHangId: string) {
    const { rows: patientRows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, trang_thai, ngay_sinh, gioi_tinh, dia_chi
      FROM khach_hang WHERE id = $1
    `, [khachHangId]);
    if (patientRows.length === 0) return null;
    const patient = patientRows[0];

    const { rows: plans } = await pool.query(`
      SELECT
        pd.id, pd.khach_hang_id, pd.goi_dich_vu_id, pd.tong_so_buoi,
        (
          SELECT COUNT(*)::int
          FROM cuoc_hen
          WHERE phac_do_dieu_tri_id = pd.id
            AND (
              trang_thai = 'hoan_thanh'
              OR (trang_thai = 'khong_den' AND hd.hinh_thuc_thanh_toan_goi = 'tra_thang')
            )
            AND loai = 'DIEU_TRI'
        ) as so_buoi_da_dung,
        pd.trang_thai, pd.ngay_kich_hoat, pd.han_su_dung,
        g.ten_goi, g.loai_goi, g.don_gia as gia_tien,
        nk_kham.chan_doan, nk_kham.chong_chi_dinh, nk_kham.ghi_chu as ghi_chu_kham,
        nd_bs.ho_ten as ten_bac_si, nd_bs.anh_dai_dien as anh_bac_si, nd_bs.vai_tro_id as vai_tro_bac_si,
        p_kham.ten_phong as ten_phong_kham,
        ch_kham.id as cuoc_hen_id, ch_kham.ngay_gio_bat_dau as ngay_gio_kham, ch_kham.ngay_gio_ket_thuc as ngay_gio_ket_thuc_kham,
        hd.id as hoa_don_id,
        hd.hinh_thuc_thanh_toan_goi,
        hd.tong_tien_phai_tra,
        hd.so_tien_da_tra,
        hd.tong_tien_goc,
        hd.so_tien_giam_voucher,
        hd.trang_thai as hoa_don_trang_thai
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN LATERAL (
        SELECT hd_inner.*
        FROM hoa_don hd_inner
        WHERE hd_inner.phac_do_dieu_tri_id = pd.id
        ORDER BY (hd_inner.tong_tien_phai_tra > 0) DESC, hd_inner.ngay_tao DESC
        LIMIT 1
      ) hd ON TRUE
      LEFT JOIN chi_dinh_buoi cd_kham ON cd_kham.phac_do_dieu_tri_id = pd.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk_kham ON nk_kham.id = cd_kham.nhat_ky_id
      LEFT JOIN cuoc_hen ch_kham ON ch_kham.id = nk_kham.cuoc_hen_id
      LEFT JOIN nguoi_dung nd_bs ON ch_kham.nhan_su_id = nd_bs.id
      LEFT JOIN phong_lam_viec p_kham ON ch_kham.phong_id = p_kham.id
      WHERE pd.khach_hang_id = $1
      ORDER BY pd.ngay_kich_hoat DESC
    `, [khachHangId]);

    const { rows: prescribedUnpaid } = await pool.query(`
      SELECT
        ch.khach_hang_id,
        cd.goi_dich_vu_id,
        g.ten_goi,
        g.loai_goi,
        g.don_gia as gia_tien,
        g.tong_so_buoi,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu as ghi_chu_kham,
        nd_bs.ho_ten as ten_bac_si,
        p_kham.ten_phong as ten_phong_kham,
        ch.id as cuoc_hen_id,
        ch.ngay_gio_bat_dau as ngay_kham,
        NULL::timestamptz as han_kich_hoat
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd_bs ON ch.nhan_su_id = nd_bs.id
      LEFT JOIN phong_lam_viec p_kham ON ch.phong_id = p_kham.id
      WHERE ch.loai = 'KHAM'
        AND cd.phac_do_dieu_tri_id IS NULL
        AND ch.khach_hang_id = $1
    `, [khachHangId]);

    const virtualPlans = prescribedUnpaid.map((item: any) => ({
      id: `virtual-${item.cuoc_hen_id}`,
      khach_hang_id: item.khach_hang_id,
      goi_dich_vu_id: item.goi_dich_vu_id,
      tong_so_buoi: item.tong_so_buoi,
      so_buoi_da_dung: 0,
      trang_thai: 'cho_kich_hoat',
      ngay_kich_hoat: null,
      ten_goi: item.ten_goi,
      loai_goi: item.loai_goi,
      gia_tien: item.gia_tien,
      chan_doan: item.chan_doan,
      chong_chi_dinh: item.chong_chi_dinh,
      ghi_chu_kham: item.ghi_chu_kham,
      ten_bac_si: item.ten_bac_si,
      ten_phong_kham: item.ten_phong_kham,
      cuoc_hen_id: item.cuoc_hen_id,
      han_kich_hoat: item.han_kich_hoat
    }));

    const allPlans = [...plans, ...virtualPlans];

    const { rows: appointments } = await pool.query(`
      SELECT
        ch.id, ch.khach_hang_id, ch.phac_do_dieu_tri_id, ch.so_thu_tu_buoi, ch.goi_dich_vu_id,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.loai, ch.trang_thai, ch.ghi_chu_khach_hang as ghi_chu,
        ch.ghi_chu_khach_hang as ly_do_kham, ch.anh_dinh_kem_url,
        nd.ho_ten as ten_nhan_su, nd.vai_tro_id, nd.anh_dai_dien as anh_nhan_su,
        p.ten_phong as ten_phong,
        dv.ten_goi as ten_dich_vu, dv.don_gia as gia_dich_vu,
        nk.vas_truoc, nk.vas_sau, nk.ghi_chu as ghi_chu_tri_lieu, nk.chan_doan as chan_doan_tri_lieu, nk.chong_chi_dinh as chong_chi_dinh_tri_lieu,
        hd_pay.trang_thai as trang_thai_thanh_toan, hd_pay.tong_tien_phai_tra, hd_pay.so_tien_da_tra
      FROM cuoc_hen ch
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT hd2.trang_thai, hd2.tong_tien_phai_tra, hd2.so_tien_da_tra
        FROM hoa_don hd2
        WHERE hd2.cuoc_hen_id = ch.id
        ORDER BY hd2.ngay_tao DESC LIMIT 1
      ) hd_pay ON true
      WHERE ch.khach_hang_id = $1 AND ch.trang_thai NOT IN ('da_huy', 'huy')
      ORDER BY ch.ngay_gio_bat_dau DESC
    `, [khachHangId]);

    const pendingActivation = prescribedUnpaid[0]
      ? { ten_goi: prescribedUnpaid[0].ten_goi, han_kich_hoat: prescribedUnpaid[0].han_kich_hoat }
      : null;
    const activePlanId = plans.find((p: any) => p.trang_thai === 'dang_dieu_tri')?.id;
    const lastActiveSession = activePlanId
      ? appointments.find((a: any) => a.phac_do_dieu_tri_id === activePlanId && a.trang_thai === 'hoan_thanh')
      : null;

    return {
      ...patient,
      ma_khach_hang: 'KH-' + patient.id.substring(0, 8).toUpperCase(),
      plans: allPlans,
      appointments,
      reminder_raw: {
        pending_activation: pendingActivation,
        last_active_session_at: lastActiveSession?.ngay_gio_bat_dau || null,
        active_plan_name: activePlanId ? plans.find((p: any) => p.id === activePlanId)?.ten_goi : null
      }
    };
  }
}

export default new AdminCustomerRepository();
