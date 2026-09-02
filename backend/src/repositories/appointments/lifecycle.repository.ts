import { Pool, PoolClient } from 'pg';
import { pool } from '../../config/db';
import { resolveNoShowOutcome } from '../../domain/billing';
import { checkReceptionistTransition, isReceptionistLockedStatus } from '../../domain/appointmentStatus';
import { HinhThucThanhToanGoi, NoShowAction } from '../../domain/types';
import { isBuoiDaQua } from './booking.repository';

/**
 * Đếm lại số buổi ĐÃ TIÊU THỤ của 1 phác đồ và tự chuyển trang_thai sang 'hoan_thanh' nếu đã đủ
 * (hoặc lùi lại 'dang_dieu_tri' nếu trước đó lỡ đánh dấu hoàn thành mà giờ chưa đủ buổi nữa).
 */
export async function updateCompletedSessionsCount(db: Pool | PoolClient, phac_do_dieu_tri_id: string): Promise<void> {
  const pdRes = await db.query(
    'SELECT tong_so_buoi, trang_thai FROM phac_do_dieu_tri WHERE id = $1 FOR UPDATE',
    [phac_do_dieu_tri_id]
  );
  if (pdRes.rows.length === 0) return;
  const { tong_so_buoi, trang_thai } = pdRes.rows[0];

  const countRes = await db.query(
    `SELECT COUNT(*)::int as count FROM cuoc_hen
     WHERE phac_do_dieu_tri_id = $1
       AND loai = 'DIEU_TRI'
       AND (
         trang_thai = 'hoan_thanh'
         OR (
           trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat')
           AND (SELECT hinh_thuc_thanh_toan_goi FROM hoa_don WHERE phac_do_dieu_tri_id = $1 LIMIT 1) = 'tra_thang'
         )
       )`,
    [phac_do_dieu_tri_id]
  );
  const completedCount = countRes.rows[0].count || 0;
  const statusToSet = completedCount >= tong_so_buoi ? 'hoan_thanh' : (trang_thai === 'hoan_thanh' ? 'dang_dieu_tri' : trang_thai);

  if (statusToSet === 'hoan_thanh') {
    await db.query(
      `UPDATE phac_do_dieu_tri
       SET so_buoi_da_dung = $1, trang_thai = $2, ngay_hoan_thanh = COALESCE(ngay_hoan_thanh, NOW())
       WHERE id = $3`,
      [completedCount, statusToSet, phac_do_dieu_tri_id]
    );
  } else {
    await db.query(
      `UPDATE phac_do_dieu_tri
       SET so_buoi_da_dung = $1, trang_thai = $2
       WHERE id = $3`,
      [completedCount, statusToSet, phac_do_dieu_tri_id]
    );
  }
}

export class AppointmentLifecycleRepository {
  async updateCompletedSessionsCount(db: Pool | PoolClient, phac_do_dieu_tri_id: string): Promise<void> {
    return updateCompletedSessionsCount(db, phac_do_dieu_tri_id);
  }

  async updateAppointmentStatus(id: string, data: {
    trang_thai: string;
    bac_si_id?: string | null;
    chuyen_gia_id?: string | null;
    ky_thuat_vien_id?: string | null;
    ngay_gio_bat_dau?: string | null;
    ngay_gio_ket_thuc?: string | null;
    buoi?: 'sang' | 'chieu';
    ghi_chu_noi_bo?: string | null;
    phong_id?: string | number | null;
  }, actorRoleId?: number) {
    let finalStatus = data.trang_thai;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const apptRes = await client.query('SELECT * FROM cuoc_hen WHERE id = $1', [id]);
      if (apptRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn');
      }
      const appt = apptRes.rows[0];

      // Nếu là ca chờ tái lượng giá và đã quá hạn, tự động chuyển sang hoàn thành và từ chối check-in
      if (appt.trang_thai === 'cho_tai_luong_gia' && data.trang_thai === 'da_checkin') {
        if (appt.han_tai_kham && new Date(appt.han_tai_kham).getTime() < Date.now()) {
          await client.query(`
            UPDATE cuoc_hen
            SET trang_thai = 'hoan_thanh',
                thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW()),
                ghi_chu_noi_bo = COALESCE(ghi_chu_noi_bo || E'\n', '') || 'Tự động hoàn thành — quá hạn tái lượng giá.'
            WHERE id = $1
          `, [id]);
          await client.query('COMMIT');
          const err = new Error(
            `Ca chờ tái lượng giá đã quá hạn (hạn chót: ${new Date(appt.han_tai_kham).toLocaleString('vi-VN')}). Hệ thống đã tự động chuyển sang trạng thái Hoàn thành và không nhận check-in.`
          ) as any;
          err.statusCode = 400;
          throw err;
        }
      }

      if (actorRoleId === 2) {
        if (data.trang_thai === 'da_checkin') {
          const apptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(appt.ngay_gio_bat_dau));
          const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
          if (appt.trang_thai !== 'cho_tai_luong_gia' && apptDateStr > todayStr) {
            const formattedDate = new Date(appt.ngay_gio_bat_dau).toLocaleDateString('vi-VN');
            throw new Error(`Lễ tân chỉ được phép Check-in cho các ca hẹn trong ngày hôm nay. Không thể check-in vượt thời gian cho ca hẹn ngày ${formattedDate}.`);
          }
        }

        const isRescheduling = (data.ngay_gio_bat_dau !== undefined && String(data.ngay_gio_bat_dau) !== String(appt.ngay_gio_bat_dau)) ||
                               (data.buoi !== undefined && String(data.buoi) !== String(appt.buoi));
        if (isRescheduling && appt.trang_thai === 'da_checkin') {
          data.trang_thai = 'da_xac_nhan';
        }

        if (isReceptionistLockedStatus(appt.trang_thai)) {
          const err = new Error(
            'Không thể thay đổi lịch hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc.'
          ) as any;
          err.statusCode = 403;
          throw err;
        }
        if (data.trang_thai !== appt.trang_thai) {
          const check = checkReceptionistTransition(appt.trang_thai, data.trang_thai, !!appt.nhan_su_id, isRescheduling);
          if (!check.allowed) {
            const err = new Error(check.reason) as any;
            err.statusCode = 403;
            throw err;
          }
        }
      }

      if (data.trang_thai === 'hoan_thanh') {
        if (appt.phac_do_dieu_tri_id) {
          const planInfo = await client.query(`
            SELECT gdv.loai_goi
            FROM phac_do_dieu_tri pd
            JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
            WHERE pd.id = $1
          `, [appt.phac_do_dieu_tri_id]);

          if (planInfo.rows.length > 0 && planInfo.rows[0].loai_goi === 'LIEU_TRINH') {
            const paymentCheck = await client.query(`
              SELECT hd.trang_thai, hd.hinh_thuc_thanh_toan_goi
              FROM hoa_don hd
              WHERE hd.phac_do_dieu_tri_id = $1
              LIMIT 1
            `, [appt.phac_do_dieu_tri_id]);

            if (paymentCheck.rows.length > 0) {
              const { trang_thai: invoiceStatus, hinh_thuc_thanh_toan_goi } = paymentCheck.rows[0];
              if (hinh_thuc_thanh_toan_goi !== 'tung_buoi') {
                if (invoiceStatus !== 'da_thanh_toan') {
                  throw new Error('Gói trị liệu liên kết chưa được thanh toán (đối với trả thẳng). Không thể hoàn thành ca điều trị.');
                }
              }
            } else {
              throw new Error('Gói trị liệu liên kết chưa được đăng ký/thành lập hóa đơn.');
            }
          }
        }
      }

      if (['da_huy', 'khong_den'].includes(data.trang_thai)) {
        const isPackageSession = !!(appt.phac_do_dieu_tri_id && appt.so_thu_tu_buoi);
        let hinhThuc: HinhThucThanhToanGoi | null = null;

        if (isPackageSession) {
          const invoiceRes = await client.query(`
            SELECT hinh_thuc_thanh_toan_goi FROM hoa_don
            WHERE phac_do_dieu_tri_id = $1
            LIMIT 1
          `, [appt.phac_do_dieu_tri_id]);
          hinhThuc = invoiceRes.rows[0]?.hinh_thuc_thanh_toan_goi || null;
        }

        const outcome = resolveNoShowOutcome(data.trang_thai as NoShowAction, hinhThuc, isPackageSession);
        finalStatus = outcome.finalStatus;
      }

      const final_bac_si_id = data.bac_si_id !== undefined ? data.bac_si_id : (data.chuyen_gia_id !== undefined ? data.chuyen_gia_id : data.ky_thuat_vien_id);
      const isCancelledOrNoShow = ['da_huy', 'khong_den'].includes(finalStatus);
      const shouldReleaseAssignment = finalStatus === 'da_huy';

      const updates = ['trang_thai = $1'];
      const values: any[] = [finalStatus];
      let paramIndex = 2;

      let effectiveNhanSuId: number | null = final_bac_si_id !== undefined
        ? (final_bac_si_id ? parseInt(final_bac_si_id, 10) : null)
        : appt.nhan_su_id;

      // An toàn ca trực: Nếu khách check-in khi nhân sự được gán đã hết ca trực hôm nay (now > gio_ket_thuc)
      // thì tự động chuyển về Hàng đợi chung (nhan_su_id = NULL) để nhân sự ca hiện tại kéo vào làm việc
      if (finalStatus === 'da_checkin' && effectiveNhanSuId) {
        const shiftCheck = await client.query(`
          SELECT gio_ket_thuc,
                 (CURRENT_TIME AT TIME ZONE 'Asia/Ho_Chi_Minh' > gio_ket_thuc::time) AS da_het_ca
          FROM lich_truc_nhan_su
          WHERE nhan_su_id = $1
            AND ngay_truc = CURRENT_DATE
            AND trang_thai = 'hoat_dong'
          ORDER BY gio_ket_thuc DESC
          LIMIT 1
        `, [effectiveNhanSuId]);

        if (shiftCheck.rows.length === 0 || shiftCheck.rows[0]?.da_het_ca) {
          effectiveNhanSuId = null;
        }
      }

      if (finalStatus === 'da_checkin') {
        updates.push(`nhan_su_id = $${paramIndex}`);
        values.push(effectiveNhanSuId);
        paramIndex++;
        if (effectiveNhanSuId === null) {
          updates.push(`gan_qua_hang_doi = false`);
        }
      } else if (final_bac_si_id !== undefined && !isCancelledOrNoShow) {
        updates.push(`nhan_su_id = $${paramIndex}`);
        values.push(final_bac_si_id ? parseInt(final_bac_si_id, 10) : null);
        paramIndex++;
      } else if (shouldReleaseAssignment) {
        updates.push(`nhan_su_id = NULL`);
      }

      if (data.ngay_gio_bat_dau !== undefined) {
        updates.push(`ngay_gio_bat_dau = $${paramIndex}`);
        values.push(data.ngay_gio_bat_dau);
        paramIndex++;
      }
      if (data.ngay_gio_ket_thuc !== undefined) {
        updates.push(`ngay_gio_ket_thuc = $${paramIndex}`);
        values.push(data.ngay_gio_ket_thuc);
        paramIndex++;
      }

      if (data.buoi !== undefined) {
        updates.push(`buoi = $${paramIndex}`);
        values.push(data.buoi);
        paramIndex++;
      }

      if (data.ghi_chu_noi_bo !== undefined) {
        updates.push(`ghi_chu_noi_bo = $${paramIndex}`);
        values.push(data.ghi_chu_noi_bo);
        paramIndex++;
      }

      if (data.phong_id !== undefined && !isCancelledOrNoShow) {
        updates.push(`phong_id = $${paramIndex}`);
        values.push(data.phong_id ? parseInt(String(data.phong_id), 10) : null);
        paramIndex++;
      } else if (shouldReleaseAssignment) {
        updates.push(`phong_id = NULL`);
      }

      if (finalStatus === 'da_checkin') {
        updates.push(`thoi_gian_checkin = NOW()`);
        if (appt.trang_thai === 'cho_tai_luong_gia' || data.ngay_gio_bat_dau === undefined) {
          updates.push(`ngay_gio_bat_dau = NOW()`);
          updates.push(`buoi = CASE WHEN EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')) < 12 THEN 'sang' ELSE 'chieu' END`);
          updates.push(`ngay_gio_ket_thuc = NOW() + (COALESCE(thoi_luong_phut, 30) || ' minutes')::interval`);
        }
      } else if (finalStatus === 'dang_kham') {
        updates.push(`thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, NOW())`);
      } else if (finalStatus === 'hoan_thanh') {
        updates.push(`thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, thoi_gian_checkin, NOW())`);
        updates.push(`thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW())`);
      } else if (finalStatus === 'da_huy') {
        updates.push(`thoi_gian_huy = COALESCE(thoi_gian_huy, NOW())`);
      } else if (finalStatus === 'khong_den') {
        updates.push(`thoi_gian_khong_den = COALESCE(thoi_gian_khong_den, NOW())`);
      }

      values.push(id);
      const query = `
        UPDATE cuoc_hen 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      const { rows } = await client.query(query, values);

      if (rows.length > 0) {
        if (rows[0].phac_do_dieu_tri_id) {
          await updateCompletedSessionsCount(client, rows[0].phac_do_dieu_tri_id);
        }

        if (finalStatus === 'da_checkin') {
          const isKham = String(rows[0].loai || '').toUpperCase().includes('KHAM');
          await client.query(`
            INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, so_thu_tu_hang_doi, thoi_gian_tao)
            SELECT
              $1::uuid,
              COALESCE((SELECT MAX(lan_thu) FROM phien_lam_viec WHERE cuoc_hen_id = $1::uuid), 0) + 1,
              COALESCE((
                SELECT MAX(pv.so_thu_tu_hang_doi)
                FROM phien_lam_viec pv
                JOIN cuoc_hen c2 ON pv.cuoc_hen_id = c2.id
                WHERE DATE(pv.thoi_gian_tao AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
                  AND (UPPER(c2.loai) LIKE '%KHAM%') = $2::boolean
              ), 0) + 1,
              NOW()
          `, [id, isKham]);
        }
      }

      await client.query('COMMIT');
      return rows[0] || null;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async pushBackAppointment(cuocHenId: string): Promise<{ so_lan_goi_khong_co_mat: number }> {
    const { rows: apptRows } = await pool.query(
      `SELECT id FROM cuoc_hen WHERE id = $1 AND trang_thai IN ('da_checkin', 'cho_tai_luong_gia')`,
      [cuocHenId]
    );
    if (apptRows.length === 0) {
      throw new Error('Không tìm thấy lịch hẹn này trong hàng đợi.');
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

    return { so_lan_goi_khong_co_mat: newCount };
  }

  async cancelCustomerAppointment(id: string, customer_id: string, lyDoHuy: string) {
    const checkQuery = 'SELECT * FROM cuoc_hen WHERE id = $1 AND khach_hang_id = $2';
    const checkRes = await pool.query(checkQuery, [id, customer_id]);
    if (checkRes.rows.length === 0) {
      throw new Error('Lịch hẹn không tồn tại hoặc không thuộc quyền quản lý của bạn.');
    }
    const appt = checkRes.rows[0];

    if (appt.trang_thai_thanh_toan === 'da_thanh_toan') {
      const err: any = new Error('Lịch đã thanh toán không thể tự hủy — vui lòng gọi Hotline để Lễ tân hỗ trợ đổi lịch.');
      err.statusCode = 400;
      throw err;
    }

    if (appt.trang_thai_thanh_toan === 'dang_cho_thanh_toan') {
      const err: any = new Error('Giao dịch thanh toán đang được xử lý, vui lòng đợi xác nhận xong trước khi hủy.');
      err.statusCode = 400;
      throw err;
    }

    const CANCEL_WINDOW_MS = 60 * 60 * 1000;
    const elapsedMs = Date.now() - new Date(appt.thoi_gian_tao).getTime();
    if (elapsedMs >= CANCEL_WINDOW_MS) {
      const err: any = new Error('Đã quá 60 phút kể từ lúc đặt lịch — không thể tự hủy nữa. Vui lòng gọi Hotline để được hỗ trợ.');
      err.statusCode = 400;
      throw err;
    }
    if (appt.trang_thai !== 'da_xac_nhan') {
      const err: any = new Error('Lịch đã check-in hoặc đang xử lý, không thể tự hủy — vui lòng gọi Hotline để được hỗ trợ.');
      err.statusCode = 400;
      throw err;
    }
    const ngayStr = new Date(appt.ngay_gio_bat_dau).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (appt.buoi && isBuoiDaQua(ngayStr, appt.buoi)) {
      const err: any = new Error('Buổi hẹn đã kết thúc, không thể tự hủy nữa. Vui lòng gọi Hotline để được hỗ trợ.');
      err.statusCode = 400;
      throw err;
    }

    const recentCancelsRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM cuoc_hen
       WHERE khach_hang_id = $1 AND loai_huy = 'khach_huy_som' AND thoi_gian_huy >= NOW() - INTERVAL '7 days'`,
      [customer_id]
    );
    if ((recentCancelsRes.rows[0]?.count || 0) >= 3) {
      const err: any = new Error('Bạn đã hủy sớm quá 3 lần trong 7 ngày qua — vui lòng gọi Hotline để được hỗ trợ hủy/đổi lịch.');
      err.statusCode = 400;
      throw err;
    }

    const query = `
      UPDATE cuoc_hen
      SET trang_thai = 'da_huy', ghi_chu_noi_bo = $1, loai_huy = 'khach_huy_som', thoi_gian_huy = NOW(),
          nhan_su_id = NULL, phong_id = NULL
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [lyDoHuy, id]);
    return rows[0];
  }

  async rescheduleCustomerAppointment(id: string, customer_id: string, new_date: string, new_buoi: 'sang' | 'chieu', new_staff_id?: number | null) {
    const checkQuery = 'SELECT * FROM cuoc_hen WHERE id = $1 AND khach_hang_id = $2';
    const checkRes = await pool.query(checkQuery, [id, customer_id]);
    if (checkRes.rows.length === 0) {
      throw new Error('Lịch hẹn không tồn tại hoặc không thuộc quyền quản lý của bạn.');
    }
    const appt = checkRes.rows[0];

    if (appt.trang_thai_thanh_toan !== 'da_thanh_toan') {
      const err: any = new Error('Chức năng tự đổi lịch online chỉ áp dụng cho lịch đã thanh toán. Đối với lịch chưa thanh toán, quý khách có thể hủy lịch trong vòng 60 phút và đặt lại.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const currentApptDateStr = new Date(appt.ngay_gio_bat_dau).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    if (currentApptDateStr === todayStr) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const cutoffMinutes = appt.buoi === 'sang' ? (7 * 60 + 30 + 135) : (12 * 60 + 240);
      if (nowMinutes >= cutoffMinutes) {
        const err: any = new Error(`Đã quá 50% thời lượng buổi hôm nay (${appt.buoi === 'sang' ? 'sau 09h45' : 'sau 16h00'}). Quý khách không thể tự đổi lịch online nữa, vui lòng liên hệ hotline 0398 655 332 để trung tâm hỗ trợ.`);
        err.statusCode = 400;
        throw err;
      }
    }

    if (appt.trang_thai !== 'da_xac_nhan') {
      const err: any = new Error('Lịch đã check-in hoặc đang làm dịch vụ, không thể tự đổi lịch online.');
      err.statusCode = 400;
      throw err;
    }

    const startHour = new_buoi === 'sang' ? 7 : 12;
    const startMinute = new_buoi === 'sang' ? 30 : 0;
    const duration = Number(appt.thoi_luong_phut) || 30;
    const startIso = `${new_date}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00+07:00`;
    const endDateObj = new Date(new Date(startIso).getTime() + duration * 60 * 1000);
    const endIso = endDateObj.toISOString();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM phien_lam_viec WHERE cuoc_hen_id = $1', [id]);

      const updateRes = await client.query(
        `UPDATE cuoc_hen
         SET ngay_gio_bat_dau = $1,
             ngay_gio_ket_thuc = $2,
             buoi = $3,
             nhan_su_id = $4,
             trang_thai = 'da_xac_nhan',
             gan_qua_hang_doi = false
         WHERE id = $5
         RETURNING *`,
        [startIso, endIso, new_buoi, new_staff_id || null, id]
      );

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async cancelBreakTimeAppointments(): Promise<{ cancelled_count: number }> {
    return { cancelled_count: 0 };
  }
}

export default new AppointmentLifecycleRepository();
