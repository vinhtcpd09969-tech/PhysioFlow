import { pool } from '../../config/db';
import { GIO_NHAN_KHACH, NO_SHOW_SWEEP_BUFFER_MINUTES } from '../../domain/capacity';
import appointmentRepository from '../appointments';

export interface SweptNoShowItem {
  id: string;
  ma_cuoc_hen: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  ten_dich_vu: string;
  buoi: 'sang' | 'chieu' | string;
  ngay_hen: string;
  trang_thai_thanh_toan: string;
  is_package: boolean;
  is_strike: boolean;
  strike_reason: string;
  customer_strikes_count: number;
  is_customer_locked_postpaid: boolean;
}

export interface SweepNoShowReport {
  total_swept: number;
  unpaid_strikes_count: number;
  paid_noshow_count: number;
  package_noshow_count: number;
  expired_reassessments_count: number;
  items: SweptNoShowItem[];
}

export class ReceptionistQueueRepository {
  /**
   * B10 — quét các lịch đã xác nhận nhưng chưa check-in mà buổi đã kết thúc quá
   * NO_SHOW_SWEEP_BUFFER_MINUTES phút, tự động đánh dấu "không đến".
   * 
   * Quy tắc nghiệp vụ (Cập nhật chuẩn):
   * 1. Lịch lẻ/lượng giá ngoài client CHƯA THANH TOÁN: Đánh dấu 'khong_den', CỘNG 1 LẦN VI PHẠM (Strike).
   * 2. Lịch ĐÃ THANH TOÁN online: Đánh dấu 'khong_den' (phòng khám giữ tiền, không hoàn tiền), NHƯNG KHÔNG CỘNG VI PHẠM.
   * 3. Lịch thuộc Gói liệu trình (trả thẳng / từng buổi): Đánh dấu 'khong_den', KHÔNG CỘNG VI PHẠM khóa đặt lịch.
   */
  async sweepNoShowAppointmentsDetailed(): Promise<SweepNoShowReport> {
    const { rows } = await pool.query(
      `SELECT 
         ch.id,
         ch.khach_hang_id,
         ch.trang_thai_thanh_toan,
         ch.phac_do_dieu_tri_id,
         ch.loai,
         ch.buoi,
         ch.ngay_gio_bat_dau,
         COALESCE(kh.ho_ten, 'Khách hàng') as ten_khach_hang,
         COALESCE(kh.so_dien_thoai, '') as so_dien_thoai,
         COALESCE(g.ten_goi, 'Dịch vụ Lượng giá / Trị liệu') as ten_dich_vu
       FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
       WHERE ch.trang_thai = 'da_xac_nhan'
         AND ch.buoi IS NOT NULL
         AND (
           (DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::text || ' ' ||
             CASE WHEN ch.buoi = 'sang' THEN $1 ELSE $2 END
           )::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'
           + ($3 || ' minutes')::interval
           <= NOW()
         )`,
      [GIO_NHAN_KHACH.sang.ketThuc, GIO_NHAN_KHACH.chieu.ketThuc, NO_SHOW_SWEEP_BUFFER_MINUTES]
    );

    const sweptItems: SweptNoShowItem[] = [];

    for (const row of rows) {
      try {
        const isPackage = Boolean(row.phac_do_dieu_tri_id || ['DIEU_TRI', 'dieu_tri_goi'].includes(String(row.loai)));
        const isPaid = row.trang_thai_thanh_toan === 'da_thanh_toan';
        const isStrike = !isPackage && !isPaid;

        const strikeReason = isPackage
          ? 'Lịch thuộc gói liệu trình — Không tính vi phạm'
          : isPaid
            ? 'Đã thanh toán online — Phòng khám giữ tiền, không phạt vi phạm'
            : 'Lịch hẹn chưa thanh toán — Ghi nhận 1 lần vi phạm No-Show';

        const internalNote = `Tự động đánh dấu không đến — quá giờ nhận khách ${NO_SHOW_SWEEP_BUFFER_MINUTES} phút, khách chưa check-in. (${strikeReason})`;

        await this.updateAppointmentStatus(row.id, 'khong_den', internalNote);

        let customerStrikes = 0;
        if (row.khach_hang_id) {
          const strikesRes = await pool.query(
            `SELECT COUNT(*)::int as count
             FROM cuoc_hen
             WHERE khach_hang_id = $1
               AND trang_thai = 'khong_den'
               AND trang_thai_thanh_toan = 'chua_thanh_toan'
               AND phac_do_dieu_tri_id IS NULL
               AND (thoi_gian_khong_den IS NULL OR thoi_gian_khong_den >= NOW() - INTERVAL '60 days')`,
            [row.khach_hang_id]
          );
          customerStrikes = strikesRes.rows[0]?.count || 0;
        }

        sweptItems.push({
          id: row.id,
          ma_cuoc_hen: `APT-${row.id.substring(0, 6).toUpperCase()}`,
          ten_khach_hang: row.ten_khach_hang,
          so_dien_thoai: row.so_dien_thoai,
          ten_dich_vu: row.ten_dich_vu,
          buoi: row.buoi,
          ngay_hen: row.ngay_gio_bat_dau ? new Date(row.ngay_gio_bat_dau).toLocaleDateString('vi-VN') : 'Hôm nay',
          trang_thai_thanh_toan: row.trang_thai_thanh_toan,
          is_package: isPackage,
          is_strike: isStrike,
          strike_reason: strikeReason,
          customer_strikes_count: customerStrikes,
          is_customer_locked_postpaid: customerStrikes >= 2
        });
      } catch (err) {
        console.error(`Lỗi khi tự động đánh dấu không đến cho lịch ${row.id}:`, err);
      }
    }

    // Quét tự động hoàn thành các ca chờ tái lượng giá đã quá hạn
    let expiredReassessmentsCount = 0;
    try {
      const expiredRes = await pool.query(`
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
      expiredReassessmentsCount = (expiredRes as any).rowCount || 0;

      await pool.query(`
        UPDATE nhat_ky_buoi_dieu_tri
        SET ghi_chu = TRIM(REGEXP_REPLACE(ghi_chu, '\\[Hẹn tái khám hạn:[^\\]]+\\]\\s*', '', 'g'))
        WHERE ghi_chu LIKE '%[Hẹn tái khám hạn:%';
      `);
    } catch (err) {
      console.error('Lỗi khi quét tự động hoàn thành ca chờ tái lượng giá quá hạn:', err);
    }

    return {
      total_swept: sweptItems.length,
      unpaid_strikes_count: sweptItems.filter(s => s.is_strike).length,
      paid_noshow_count: sweptItems.filter(s => !s.is_strike && s.trang_thai_thanh_toan === 'da_thanh_toan').length,
      package_noshow_count: sweptItems.filter(s => s.is_package).length,
      expired_reassessments_count: expiredReassessmentsCount,
      items: sweptItems
    };
  }

  async sweepNoShowAppointments(): Promise<number> {
    const report = await this.sweepNoShowAppointmentsDetailed();
    return report.total_swept;
  }

  async getStaffWorkload(targetDate: string) {
    const VAI_TRO_ID_KTV = 3;
    const queryStr = `
      SELECT 
        ns.id as nhan_su_id,
        ns.ho_ten,
        ns.vai_tro_id,
        vt.ten_vai_tro,
        CASE WHEN ns.vai_tro_id = ${VAI_TRO_ID_KTV} THEN 2 ELSE 1 END as so_khach_song_song,
        to_char(lt.gio_bat_dau, 'HH24:MI') as gio_bat_dau,
        to_char(lt.gio_ket_thuc, 'HH24:MI') as gio_ket_thuc,
        p.ten_phong,
        COUNT(DISTINCT ch.id) FILTER (WHERE ch.trang_thai = 'dang_kham')::integer as so_ca_dang_lam,
        COUNT(DISTINCT ch.id) FILTER (WHERE ch.trang_thai = 'da_checkin')::integer as so_ca_cho,
        COUNT(DISTINCT ch.id) FILTER (WHERE ch.trang_thai = 'cho_tai_luong_gia')::integer as so_ca_cho_tai_luong_gia,
        MAX(ch.thoi_gian_bat_dau + (COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, 30) || ' minutes')::interval) FILTER (WHERE ch.trang_thai = 'dang_kham') as thoi_gian_xong_du_kien_muon_nhat
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung ns ON lt.nhan_su_id = ns.id
      JOIN vai_tro vt ON ns.vai_tro_id = vt.id
      LEFT JOIN phong_lam_viec p ON lt.phong_id = p.id
      LEFT JOIN cuoc_hen ch ON ch.nhan_su_id = ns.id 
          AND ch.trang_thai IN ('dang_kham', 'da_checkin', 'cho_tai_luong_gia') 
          AND (DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1::date)
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      WHERE lt.ngay_truc = $1::date
      GROUP BY ns.id, ns.ho_ten, ns.vai_tro_id, vt.ten_vai_tro, lt.gio_bat_dau, lt.gio_ket_thuc, p.ten_phong
      ORDER BY ns.vai_tro_id DESC, ns.ho_ten ASC;
    `;
    const { rows } = await pool.query(queryStr, [targetDate]);
    return rows;
  }

  async unassignAppointmentStaff(id: string) {
    const queryStr = `
      UPDATE cuoc_hen
      SET nhan_su_id = NULL
      WHERE id = $1::uuid AND trang_thai IN ('da_xac_nhan', 'da_checkin')
      RETURNING id, nhan_su_id, trang_thai;
    `;
    const { rows } = await pool.query(queryStr, [id]);
    return rows[0] || null;
  }

  async updateAppointmentStatus(id: string, trang_thai: string, ghi_chu_noi_bo?: string) {
    return await appointmentRepository.updateAppointmentStatus(
      id,
      { trang_thai, ghi_chu_noi_bo },
      2
    );
  }
}

export default new ReceptionistQueueRepository();
