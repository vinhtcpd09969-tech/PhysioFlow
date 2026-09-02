import { pool } from '../../config/db';
import doctorRepository from '../doctor';

export class TechnicianQueueRepository {
  // 1. Lấy danh sách ca trị liệu chờ thực hiện hôm nay của KTV
  async getTechnicianQueue(userId: string) {
    return await doctorRepository.getDoctorQueue(userId, 3);
  }

  // 2. Lấy danh sách lịch hẹn điều trị của KTV (hỗ trợ filter thời gian)
  async getTechnicianAppointments(userId: string, startDate?: string, endDate?: string) {
    const queryStr = `
      SELECT 
        ch.id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.trang_thai, ch.ghi_chu_khach_hang as ly_do_kham,
        ch.khach_hang_id, ch.phac_do_dieu_tri_id,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai as so_dien_thoai,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh,
        ch.nhan_su_id as ky_thuat_vien_id,
        nk.ngay_tao as nhat_ky_ngay_tao
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      WHERE ch.nhan_su_id = $1::integer
        AND ch.loai = 'DIEU_TRI'
        AND ($2::timestamp IS NULL OR ch.ngay_gio_bat_dau >= $2::timestamp)
        AND ($3::timestamp IS NULL OR ch.ngay_gio_bat_dau <= $3::timestamp)
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [userId, startDate || null, endDate || null]);
    return rows;
  }

  // 2.4. Danh sách TOÀN BỘ ca trị liệu khác đang mở dở (trang_thai='dang_kham') của 1 nhân sự
  async getActiveSessionForStaff(staffId: number, excludeAppointmentId: string | null) {
    const { rows } = await pool.query(
      `SELECT ch.id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, kh.ho_ten as ten_khach_hang
       FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE ch.nhan_su_id = $1 AND ch.trang_thai = 'dang_kham' AND ($2::uuid IS NULL OR ch.id != $2::uuid)
       ORDER BY ch.thoi_gian_bat_dau ASC NULLS LAST`,
      [staffId, excludeAppointmentId || null]
    );
    return rows;
  }

  // 2.4b. Giờ tan ca HÔM NAY của nhân sự
  async getCurrentShiftEndForStaff(staffId: number): Promise<string | null> {
    const { rows } = await pool.query(
      `SELECT to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc
       FROM lich_truc_nhan_su
       WHERE nhan_su_id = $1::integer
         AND ngay_truc = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
         AND trang_thai = 'hoat_dong'
         AND gio_bat_dau <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
         AND gio_ket_thuc >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
       LIMIT 1`,
      [staffId]
    );
    return rows[0]?.gio_ket_thuc || null;
  }

  // 2.4c. Ghi vết "mở bàn 2 ngoài giờ ca, KTV đã xác nhận" vào ghi_chu_noi_bo
  async appendGhiChuNoiBo(appointmentId: string, note: string) {
    await pool.query(
      `UPDATE cuoc_hen SET ghi_chu_noi_bo = TRIM(BOTH E'\n' FROM COALESCE(ghi_chu_noi_bo || E'\n', '') || $2) WHERE id = $1::uuid`,
      [appointmentId, note]
    );
  }

  // 2.5. Bắt đầu ca khám / điều trị
  async startSession(appointmentId: string, staffId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(`
        UPDATE cuoc_hen
        SET trang_thai = 'dang_kham',
            nhan_su_id = COALESCE(nhan_su_id, $2::integer),
            gan_qua_hang_doi = CASE WHEN nhan_su_id IS NULL THEN TRUE ELSE gan_qua_hang_doi END,
            thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, NOW())
        WHERE id = $1::uuid;
      `, [appointmentId, staffId]);

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

  // 5. Lấy danh sách lịch trực của KTV
  async getTechnicianSchedules(userId: string) {
    const queryStr = `
      SELECT 
        lt.id, lt.nhan_su_id as nguoi_dung_id, to_char(lt.ngay_truc, 'YYYY-MM-DD') as ngay, 
        to_char(lt.gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(lt.gio_ket_thuc, 'HH24:MI') as gio_ket_thuc,
        lt.trang_thai,
        lt.phong_id, p.ma_phong, p.ten_phong
      FROM lich_truc_nhan_su lt
      LEFT JOIN phong_lam_viec p ON lt.phong_id = p.id
      WHERE lt.nhan_su_id = $1::integer
      ORDER BY lt.ngay_truc ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 6. Lấy thông tin phòng làm việc & danh sách thiết bị y tế
  async getRoomAndEquipmentForStaff(staffId: number, appointmentId?: string | null) {
    const { rows: shiftRows } = await pool.query(
      `SELECT 
         COALESCE(ch.phong_id, lt.phong_id) as phong_id,
         p.ten_phong,
         p.ma_phong,
         p.loai_phong,
         to_char(COALESCE(lt.gio_bat_dau, '07:00'::time), 'HH24:MI') as gio_bat_dau,
         to_char(COALESCE(lt.gio_ket_thuc, '16:00'::time), 'HH24:MI') as gio_ket_thuc
       FROM nguoi_dung u
       LEFT JOIN cuoc_hen ch ON ch.id = $2 AND (ch.nhan_su_id = u.id OR ch.nhan_su_id IS NULL)
       LEFT JOIN LATERAL (
         SELECT lt_sub.phong_id, lt_sub.gio_bat_dau, lt_sub.gio_ket_thuc
         FROM lich_truc_nhan_su lt_sub
         WHERE lt_sub.nhan_su_id = u.id
           AND lt_sub.trang_thai = 'hoat_dong'
         ORDER BY 
           (CASE WHEN ch.id IS NOT NULL AND lt_sub.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') THEN 0 ELSE 1 END) ASC,
           ABS(lt_sub.ngay_truc - (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) ASC
         LIMIT 1
       ) lt ON TRUE
       LEFT JOIN phong_lam_viec p ON p.id = COALESCE(ch.phong_id, lt.phong_id)
       WHERE u.id = $1::integer`,
      [staffId, appointmentId || null]
    );

    if (shiftRows.length === 0 || !shiftRows[0].phong_id) {
      return {
        phong: null,
        thiet_bi: []
      };
    }

    const phongInfo = shiftRows[0];
    const { rows: equipRows } = await pool.query(
      `SELECT 
         id,
         ma_thiet_bi,
         ten_thiet_bi,
         trang_thai,
         ghi_chu
       FROM thiet_bi
       WHERE phong_id = $1::integer
       ORDER BY ten_thiet_bi ASC`,
      [phongInfo.phong_id]
    );

    return {
      phong: phongInfo,
      thiet_bi: equipRows
    };
  }
}

export default new TechnicianQueueRepository();
