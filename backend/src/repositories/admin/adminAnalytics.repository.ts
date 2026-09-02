import { pool } from '../../config/db';
import prisma from '../../config/prisma';

export class AdminAnalyticsRepository {
  // --- QUẢN LÝ ĐÁNH GIÁ ---
  async getFeedback() {
    const { rows } = await pool.query(`
      SELECT 
        id,
        so_sao_tong,
        so_sao_ktv,
        nhan_xet,
        ten_khach_hang,
        ten_ky_thuat_vien,
        vai_tro_nhan_su,
        ma_vai_tro_nhan_su,
        ten_dich_vu,
        thoi_gian_danh_gia,
        phan_hoi_nhan_xet,
        ten_nguoi_phan_hoi,
        ngay_phan_hoi,
        loai_danh_gia,
        cam_xuc,
        do_tin_cay,
        ly_do_cam_xuc,
        de_xuat_hanh_dong,
        de_xuat_phan_hoi
      FROM (
        SELECT
          dg.id,
          dg.so_sao as so_sao_tong,
          NULL::integer as so_sao_ktv,
          dg.nhan_xet,
          kh.ho_ten as ten_khach_hang,
          COALESCE(nd_ktv.ho_ten, '-') as ten_ky_thuat_vien,
          vt.ten_vai_tro as vai_tro_nhan_su,
          vt.ma_vai_tro as ma_vai_tro_nhan_su,
          g.ten_goi as ten_dich_vu,
          dg.ngay_cap_nhat as thoi_gian_danh_gia,
          dg.phan_hoi_nhan_xet,
          nd_ph.ho_ten as ten_nguoi_phan_hoi,
          dg.ngay_phan_hoi,
          'service' as loai_danh_gia,
          dg.cam_xuc,
          dg.do_tin_cay,
          dg.ly_do_cam_xuc,
          dg.de_xuat_hanh_dong,
          dg.de_xuat_phan_hoi
        FROM danh_gia dg
        JOIN khach_hang kh ON dg.khach_hang_id = kh.id
        LEFT JOIN goi_dich_vu g ON dg.goi_dich_vu_id = g.id
        LEFT JOIN cuoc_hen ch ON dg.cuoc_hen_id = ch.id
        LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
        LEFT JOIN vai_tro vt ON nd_ktv.vai_tro_id = vt.id
        LEFT JOIN nguoi_dung nd_ph ON dg.nguoi_phan_hoi_id = nd_ph.id
        WHERE dg.loai_danh_gia = 'GOI_DICH_VU'

        UNION ALL

        SELECT
          dg.id,
          NULL::integer as so_sao_tong,
          dg.so_sao as so_sao_ktv,
          dg.nhan_xet,
          kh.ho_ten as ten_khach_hang,
          nd_ktv.ho_ten as ten_ky_thuat_vien,
          vt.ten_vai_tro as vai_tro_nhan_su,
          vt.ma_vai_tro as ma_vai_tro_nhan_su,
          COALESCE(g.ten_goi, '-') as ten_dich_vu,
          dg.ngay_cap_nhat as thoi_gian_danh_gia,
          dg.phan_hoi_nhan_xet,
          nd_ph.ho_ten as ten_nguoi_phan_hoi,
          dg.ngay_phan_hoi,
          'staff' as loai_danh_gia,
          dg.cam_xuc,
          dg.do_tin_cay,
          dg.ly_do_cam_xuc,
          dg.de_xuat_hanh_dong,
          dg.de_xuat_phan_hoi
        FROM danh_gia dg
        JOIN khach_hang kh ON dg.khach_hang_id = kh.id
        JOIN nguoi_dung nd_ktv ON dg.nhan_su_id = nd_ktv.id
        LEFT JOIN vai_tro vt ON nd_ktv.vai_tro_id = vt.id
        LEFT JOIN cuoc_hen ch ON dg.cuoc_hen_id = ch.id
        LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
        LEFT JOIN nguoi_dung nd_ph ON dg.nguoi_phan_hoi_id = nd_ph.id
        WHERE dg.loai_danh_gia = 'NHAN_SU'
      ) combined
      ORDER BY thoi_gian_danh_gia DESC
    `);
    return rows;
  }

  async replyServiceFeedback(id: string, phanHoi: string, staffId: number) {
    return prisma.danh_gia.update({
      where: { id },
      data: {
        phan_hoi_nhan_xet: phanHoi,
        nguoi_phan_hoi_id: staffId,
        ngay_phan_hoi: new Date()
      }
    });
  }

  async replyStaffFeedback(id: string, phanHoi: string, staffId: number) {
    return prisma.danh_gia.update({
      where: { id },
      data: {
        phan_hoi_nhan_xet: phanHoi,
        nguoi_phan_hoi_id: staffId,
        ngay_phan_hoi: new Date()
      }
    });
  }

  async getFeedbackReviewText(id: string) {
    return prisma.danh_gia.findUnique({ where: { id }, select: { nhan_xet: true, so_sao: true } });
  }

  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary(range?: string, startDate?: string, endDate?: string) {
    const isValidDate = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const hasCustomRange = isValidDate(startDate) && isValidDate(endDate);

    let revWhere = " WHERE loai_giao_dich = 'THANH_TOAN'";
    let aptWhere = '';
    if (hasCustomRange) {
      revWhere += ` AND ngay_giao_dich::date >= '${startDate}'::date AND ngay_giao_dich::date <= '${endDate}'::date`;
      aptWhere = ` WHERE ngay_gio_bat_dau::date >= '${startDate}'::date AND ngay_gio_bat_dau::date <= '${endDate}'::date`;
    } else if (range === 'today') {
      revWhere += ' AND ngay_giao_dich >= CURRENT_DATE';
      aptWhere = ' WHERE ngay_gio_bat_dau >= CURRENT_DATE';
    } else if (range === 'week') {
      revWhere += " AND ngay_giao_dich >= NOW() - INTERVAL '7 days'";
      aptWhere = " WHERE ngay_gio_bat_dau >= NOW() - INTERVAL '7 days'";
    } else if (range === 'month') {
      revWhere += " AND ngay_giao_dich >= DATE_TRUNC('month', NOW())";
      aptWhere = " WHERE ngay_gio_bat_dau >= DATE_TRUNC('month', NOW())";
    } else if (range === 'quarter') {
      revWhere += " AND ngay_giao_dich >= DATE_TRUNC('quarter', NOW())";
      aptWhere = " WHERE ngay_gio_bat_dau >= DATE_TRUNC('quarter', NOW())";
    } else if (range === 'year') {
      revWhere += " AND ngay_giao_dich >= DATE_TRUNC('year', NOW())";
      aptWhere = " WHERE ngay_gio_bat_dau >= DATE_TRUNC('year', NOW())";
    }

    const queries = [
      pool.query('SELECT COUNT(*) FROM khach_hang'),
      pool.query('SELECT COUNT(*) FROM cuoc_hen WHERE trang_thai = \'da_xac_nhan\''),
      pool.query(`SELECT COALESCE(SUM(so_tien), 0) AS sum FROM giao_dich_thanh_toan ${revWhere}`),
      pool.query('SELECT COUNT(*) FROM nguoi_dung WHERE trang_thai = \'hoat_dong\''),
      pool.query(`
        WITH ranh_hoan_toan AS (
          SELECT 
            ns.id as nhan_su_id,
            ns.vai_tro_id,
            lt.ngay_truc
          FROM lich_truc_nhan_su lt
          JOIN nguoi_dung ns ON lt.nhan_su_id = ns.id
          LEFT JOIN cuoc_hen ch_active ON ch_active.nhan_su_id = ns.id 
            AND (
              ch_active.trang_thai = 'dang_kham'
              OR (
                ch_active.trang_thai = 'da_checkin' 
                AND EXISTS (
                  SELECT 1 FROM phien_lam_viec plv_act 
                  WHERE plv_act.cuoc_hen_id = ch_active.id 
                    AND plv_act.thoi_gian_goi_vao IS NOT NULL
                    AND plv_act.lan_thu = (
                      SELECT MAX(plv_m.lan_thu) FROM phien_lam_viec plv_m WHERE plv_m.cuoc_hen_id = ch_active.id
                    )
                )
              )
            )
            AND (
              DATE(ch_active.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = lt.ngay_truc
              OR DATE(ch_active.ngay_gio_bat_dau) = lt.ngay_truc
            )
          WHERE lt.ngay_truc = CURRENT_DATE
            AND (
              lt.gio_ket_thuc IS NULL 
              OR (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time <= lt.gio_ket_thuc
            )
          GROUP BY ns.id, ns.vai_tro_id, lt.ngay_truc
          HAVING COUNT(ch_active.id) = 0
        )
        SELECT COUNT(DISTINCT ch.id)::int as count
        FROM cuoc_hen ch
        LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
        WHERE ch.trang_thai = 'da_checkin'
          AND ch.nhan_su_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM phien_lam_viec plv 
            WHERE plv.cuoc_hen_id = ch.id 
              AND plv.thoi_gian_goi_vao IS NOT NULL
              AND plv.lan_thu = (
                SELECT MAX(plv_max.lan_thu) FROM phien_lam_viec plv_max WHERE plv_max.cuoc_hen_id = ch.id
              )
          )
          AND (
            ((ch.loai = 'KHAM' OR (ch.phac_do_dieu_tri_id IS NULL AND g.loai_goi = 'KHAM')) AND EXISTS (
              SELECT 1 FROM ranh_hoan_toan r 
              WHERE r.vai_tro_id = 4 
                AND (r.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') OR r.ngay_truc = DATE(ch.ngay_gio_bat_dau))
            ))
            OR
            ((ch.loai IN ('DIEU_TRI', 'DICH_VU_LE') OR g.loai_goi IN ('LIEU_TRINH', 'DICH_VU_LE', 'LE')) AND EXISTS (
              SELECT 1 FROM ranh_hoan_toan r 
              WHERE r.vai_tro_id = 3 
                AND (r.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') OR r.ngay_truc = DATE(ch.ngay_gio_bat_dau))
            ))
          )
      `),
      pool.query('SELECT 0::int as count'),
      pool.query(`
        WITH ranh_hoan_toan AS (
          SELECT 
            ns.id as nhan_su_id,
            ns.vai_tro_id,
            lt.ngay_truc
          FROM lich_truc_nhan_su lt
          JOIN nguoi_dung ns ON lt.nhan_su_id = ns.id
          LEFT JOIN cuoc_hen ch_active ON ch_active.nhan_su_id = ns.id 
            AND (
              ch_active.trang_thai = 'dang_kham'
              OR (
                ch_active.trang_thai = 'da_checkin' 
                AND EXISTS (
                  SELECT 1 FROM phien_lam_viec plv_act 
                  WHERE plv_act.cuoc_hen_id = ch_active.id 
                    AND plv_act.thoi_gian_goi_vao IS NOT NULL
                    AND plv_act.lan_thu = (
                      SELECT MAX(plv_m.lan_thu) FROM phien_lam_viec plv_m WHERE plv_m.cuoc_hen_id = ch_active.id
                    )
                )
              )
            )
            AND (
              DATE(ch_active.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = lt.ngay_truc
              OR DATE(ch_active.ngay_gio_bat_dau) = lt.ngay_truc
            )
          WHERE lt.ngay_truc = CURRENT_DATE
            AND (
              lt.gio_ket_thuc IS NULL 
              OR (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time <= lt.gio_ket_thuc
            )
          GROUP BY ns.id, ns.vai_tro_id, lt.ngay_truc
          HAVING COUNT(ch_active.id) = 0
        )
        SELECT ch.id, ch.ngay_gio_bat_dau AS start_time, ch.loai, COALESCE(g.loai_goi, '') AS loai_goi
        FROM cuoc_hen ch
        LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
        WHERE ch.trang_thai = 'da_checkin'
          AND ch.nhan_su_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM phien_lam_viec plv 
            WHERE plv.cuoc_hen_id = ch.id 
              AND plv.thoi_gian_goi_vao IS NOT NULL
              AND plv.lan_thu = (
                SELECT MAX(plv_max.lan_thu) FROM phien_lam_viec plv_max WHERE plv_max.cuoc_hen_id = ch.id
              )
          )
          AND (
            ((ch.loai = 'KHAM' OR (ch.phac_do_dieu_tri_id IS NULL AND g.loai_goi = 'KHAM')) AND EXISTS (
              SELECT 1 FROM ranh_hoan_toan r 
              WHERE r.vai_tro_id = 4 
                AND (r.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') OR r.ngay_truc = DATE(ch.ngay_gio_bat_dau))
            ))
            OR
            ((ch.loai IN ('DIEU_TRI', 'DICH_VU_LE') OR g.loai_goi IN ('LIEU_TRINH', 'DICH_VU_LE', 'LE')) AND EXISTS (
              SELECT 1 FROM ranh_hoan_toan r 
              WHERE r.vai_tro_id = 3 
                AND (r.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') OR r.ngay_truc = DATE(ch.ngay_gio_bat_dau))
            ))
          )
        ORDER BY COALESCE(ch.thoi_gian_checkin, ch.ngay_gio_bat_dau) ASC
        LIMIT 1
      `),
      pool.query('SELECT NULL::text AS start_time'),
      pool.query(`SELECT COUNT(*)::integer FROM khach_hang WHERE ngay_dong_y_dieu_khoan >= DATE_TRUNC('month', NOW())`),
      pool.query(`SELECT COUNT(*)::integer FROM khach_hang WHERE ngay_dong_y_dieu_khoan >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND ngay_dong_y_dieu_khoan < DATE_TRUNC('month', NOW())`),
      pool.query(`SELECT (COUNT(CASE WHEN trang_thai IN ('da_huy', 'huy', 'khong_den') THEN 1 END)::float / GREATEST(COUNT(*), 1) * 100)::numeric(5,1) as rate FROM cuoc_hen ${aptWhere}`),
      pool.query(`SELECT COUNT(*)::integer FROM cuoc_hen WHERE trang_thai = 'hoan_thanh' ${aptWhere ? aptWhere.replace('WHERE', 'AND') : ''}`),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE trang_thai = 'dang_dieu_tri' AND NOT (han_su_dung IS NOT NULL AND han_su_dung < CURRENT_DATE))::int AS dang_dieu_tri,
          COUNT(*) FILTER (WHERE trang_thai = 'dang_dieu_tri' AND han_su_dung IS NOT NULL AND han_su_dung < CURRENT_DATE)::int AS qua_han,
          COUNT(*) FILTER (WHERE trang_thai = 'hoan_thanh')::int AS hoan_thanh,
          COUNT(*) FILTER (WHERE trang_thai = 'huy')::int AS huy
        FROM phac_do_dieu_tri
      `),
      pool.query(`
        SELECT COUNT(*)::int AS cnt
        FROM chi_dinh_buoi cd
        JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
        JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
        JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
        WHERE cd.phac_do_dieu_tri_id IS NULL
          AND g.loai_goi = 'LIEU_TRINH'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS cnt
        FROM khach_hang kh
        WHERE NOT (
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
            WHERE ch_h.khach_hang_id = kh.id AND ch_h.loai IN ('KHAM', 'DICH_VU_LE')
              AND ch_h.trang_thai NOT IN ('da_huy', 'huy')
          )
        )
      `)
    ];
    const results = await Promise.all(queries);

    let earliestPending = null;
    const r6 = results[6].rows[0];
    if (r6 && r6.start_time) {
      const isTreatment = ['DIEU_TRI', 'DICH_VU_LE'].includes(String(r6.loai || '').toUpperCase()) ||
                          ['LIEU_TRINH', 'DICH_VU_LE', 'LE'].includes(String(r6.loai_goi || '').toUpperCase());
      earliestPending = {
        id: r6.id,
        type: isTreatment ? 'treatment' : 'appointment',
        loai_lich: isTreatment ? 'dieu_tri' : 'kham',
        ngay_gio_bat_dau: r6.start_time
      };
    }

    return {
      total_customers: results[0].rows[0].count,
      pending_appointments: results[1].rows[0].count,
      total_revenue: results[2].rows[0].sum || 0,
      active_staff: results[3].rows[0].count,
      pending_appointments_need_assign: results[4].rows[0].count,
      pending_treatments: results[5].rows[0].count,
      earliest_pending: earliestPending,
      customers_this_month: results[8].rows[0].count || 0,
      customers_prev_month: results[9].rows[0].count || 0,
      cancellation_rate: parseFloat(results[10].rows[0].rate || '0'),
      completed_appointments: results[11].rows[0].count || 0,
      emr_stats: {
        lieu_trinh: {
          dang_dieu_tri: results[12].rows[0]?.dang_dieu_tri || 0,
          qua_han: results[12].rows[0]?.qua_han || 0,
          hoan_thanh: results[12].rows[0]?.hoan_thanh || 0,
          huy: results[12].rows[0]?.huy || 0,
          cho_kich_hoat: results[13].rows[0]?.cnt || 0,
          tong: (results[12].rows[0]?.dang_dieu_tri || 0) + (results[12].rows[0]?.qua_han || 0)
            + (results[12].rows[0]?.hoan_thanh || 0) + (results[12].rows[0]?.huy || 0) + (results[13].rows[0]?.cnt || 0)
        },
        customers_without_record: results[14].rows[0]?.cnt || 0
      }
    };
  }

  async getRevenueStats(range?: string, startDate?: string, endDate?: string, bucket?: string) {
    const isValidDate = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const hasCustomRange = isValidDate(startDate) && isValidDate(endDate);

    let formatStr = 'YYYY-MM-DD';
    let startD = startDate || '';
    let endD = endDate || '';

    if (hasCustomRange) {
      formatStr = bucket === 'year' ? 'YYYY' : bucket === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
    } else {
      const now = new Date();
      endD = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - 6 * 86400000);
      startD = sevenDaysAgo.toISOString().split('T')[0];
      bucket = 'day';
      formatStr = 'YYYY-MM-DD';
    }

    const { rows } = await pool.query(`
      SELECT TO_CHAR(ngay_giao_dich, '${formatStr}') as label, 
             SUM(CASE WHEN loai_giao_dich = 'THANH_TOAN' THEN so_tien ELSE 0 END) as revenue
      FROM giao_dich_thanh_toan
      WHERE ngay_giao_dich::date >= '${startD}'::date AND ngay_giao_dich::date <= '${endD}'::date
      GROUP BY label
      ORDER BY label ASC
    `);

    const realMap: Record<string, number> = {};
    rows.forEach((r) => {
      realMap[r.label] = Number(r.revenue || 0);
    });

    const timelineLabels: string[] = [];
    const sDate = new Date(`${startD}T00:00:00`);
    const eDate = new Date(`${endD}T00:00:00`);

    if (bucket === 'year') {
      const sYear = sDate.getFullYear();
      const eYear = eDate.getFullYear();
      for (let y = sYear; y <= eYear; y++) {
        timelineLabels.push(`${y}`);
      }
    } else if (bucket === 'month') {
      const curr = new Date(sDate.getFullYear(), sDate.getMonth(), 1);
      const endMonth = new Date(eDate.getFullYear(), eDate.getMonth(), 1);
      while (curr <= endMonth) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        timelineLabels.push(`${y}-${m}`);
        curr.setMonth(curr.getMonth() + 1);
      }
    } else {
      const curr = new Date(sDate);
      while (curr <= eDate) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        timelineLabels.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }
    }

    return timelineLabels.map((label) => ({
      label,
      revenue: realMap[label] || 0
    }));
  }

  async getStaffPerformance(startDate?: string, endDate?: string) {
    let dateFilter = `ch.ngay_gio_bat_dau >= DATE_TRUNC('month', NOW())`;
    const params: any[] = [];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateFilter = `ch.ngay_gio_bat_dau >= $1::timestamptz AND ch.ngay_gio_bat_dau < ($2::date + INTERVAL '1 day')::timestamptz`;
    } else if (startDate) {
      params.push(startDate);
      dateFilter = `ch.ngay_gio_bat_dau >= $1::timestamptz`;
    }

    const { rows } = await pool.query(`
      SELECT
        nd.ho_ten as name,
        nd.anh_dai_dien as avatar,
        CASE
          WHEN nd.vai_tro_id = 4 THEN 'Chuyên viên tư vấn'
          WHEN nd.vai_tro_id = 3 THEN 'Kỹ thuật viên'
          ELSE vt.ten_vai_tro
        END as role,
        COUNT(ch.id)::integer as sessions
      FROM cuoc_hen ch
      JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      WHERE ch.trang_thai = 'hoan_thanh'
        AND ${dateFilter}
      GROUP BY nd.id, nd.ho_ten, nd.anh_dai_dien, vt.ten_vai_tro
      ORDER BY sessions DESC
      LIMIT 5
    `, params);
    return rows;
  }

  async getTopPackages() {
    const { rows } = await pool.query(`
      SELECT name, COUNT(*)::integer as count
      FROM (
        SELECT gdv.ten_goi as name, pddt.khach_hang_id
        FROM phac_do_dieu_tri pddt
        JOIN goi_dich_vu gdv ON pddt.goi_dich_vu_id = gdv.id
        WHERE pddt.ngay_kich_hoat >= NOW() - INTERVAL '12 months'
        UNION ALL
        SELECT gdv.ten_goi as name, ch.khach_hang_id
        FROM cuoc_hen ch
        JOIN goi_dich_vu gdv ON ch.goi_dich_vu_id = gdv.id
        WHERE ch.phac_do_dieu_tri_id IS NULL
          AND ch.ngay_gio_bat_dau >= NOW() - INTERVAL '12 months'
      ) combined
      GROUP BY name
      ORDER BY count DESC
      LIMIT 5
    `);
    return rows;
  }

  async getTopVipCustomers() {
    const { rows } = await pool.query(`
      SELECT
        kh.id,
        kh.ho_ten as name,
        kh.so_dien_thoai as phone,
        COALESCE(SUM(gd.so_tien), 0)::bigint as total_paid
      FROM khach_hang kh
      LEFT JOIN hoa_don hd ON kh.id = hd.khach_hang_id
      LEFT JOIN giao_dich_thanh_toan gd ON hd.id = gd.hoa_don_id
        AND gd.ngay_giao_dich >= NOW() - INTERVAL '12 months'
      GROUP BY kh.id, kh.ho_ten, kh.so_dien_thoai
      ORDER BY total_paid DESC
      LIMIT 5
    `);
    return rows.map(r => ({
      ...r,
      total_paid: Number(r.total_paid || 0)
    }));
  }
}

export default new AdminAnalyticsRepository();
