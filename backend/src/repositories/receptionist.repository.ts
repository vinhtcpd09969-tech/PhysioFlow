import { pool } from '../config/db';

class ReceptionistRepository {
  async getTodayAppointments() {
    const { rows } = await pool.query(`
      SELECT 
        ld.id, ld.ma_lich_dat, ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc, ld.trang_thai,
        'kham_moi' as loai_lich,
        kh_table.id as khach_hang_id,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang,
        dv.ten_dich_vu,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        p.ten_phong
      FROM lich_dat ld
      JOIN khach_hang kh_table ON ld.khach_hang_id = kh_table.id
      JOIN nguoi_dung kh ON kh_table.nguoi_dung_id = kh.id
      JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      WHERE DATE(ld.ngay_gio_bat_dau) = CURRENT_DATE
      
      UNION ALL
      
      SELECT 
        btl.id, 'TR' || UPPER(SUBSTRING(btl.id::text FROM 1 FOR 6)) as ma_lich_dat,
        btl.thoi_gian_bat_dau as ngay_gio_bat_dau, btl.thoi_gian_ket_thuc as ngay_gio_ket_thuc, btl.trang_thai,
        'dieu_tri' as loai_lich,
        kh_table.id as khach_hang_id,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang,
        dv.ten_dich_vu,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        p.ten_phong
      FROM buoi_tri_lieu btl
      JOIN khach_hang kh_table ON btl.khach_hang_id = kh_table.id
      JOIN nguoi_dung kh ON kh_table.nguoi_dung_id = kh.id
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON btl.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON btl.phong_id = p.id
      WHERE DATE(btl.thoi_gian_bat_dau) = CURRENT_DATE
      
      ORDER BY ngay_gio_bat_dau ASC
    `);
    return rows;
  }

  async updateAppointmentStatus(id: string, trang_thai: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let updateQuery = 'UPDATE lich_dat SET trang_thai = $1 WHERE id = $2 RETURNING *';
      let updateValues: any[] = [trang_thai, id];

      if (trang_thai === 'da_checkin') {
        const { rows: appts } = await client.query('SELECT dich_vu_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, phong_id FROM lich_dat WHERE id = $1', [id]);
        if (appts.length === 0) throw new Error('Không tìm thấy lịch hẹn');
        const appt = appts[0];

        let phongId = appt.phong_id;
        if (!phongId) {
          const { rows: rooms } = await client.query(`
            SELECT p.id 
            FROM phong p
            JOIN phong_dich_vu pdv ON p.id = pdv.phong_id
            JOIN dich_vu dv ON dv.danh_muc_id = pdv.danh_muc_id
            WHERE dv.id = $1
            AND p.trang_thai = 'san_sang'
            AND NOT EXISTS (
               SELECT 1 FROM lich_dat ld
               WHERE ld.phong_id = p.id
               AND ld.trang_thai NOT IN ('da_huy', 'khong_den', 'hoan_thanh')
               AND (ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc) OVERLAPS ($2::timestamp, $3::timestamp)
            )
            LIMIT 1
          `, [appt.dich_vu_id, appt.ngay_gio_bat_dau, appt.ngay_gio_ket_thuc]);

          if (rooms.length === 0) {
            throw new Error('ROOM_UNAVAILABLE');
          }
          phongId = rooms[0].id;
        }

        updateQuery = 'UPDATE lich_dat SET trang_thai = $1, thoi_gian_checkin = NOW(), phong_id = $3 WHERE id = $2 RETURNING *';
        updateValues = [trang_thai, id, phongId];
      }

      const { rows } = await client.query(updateQuery, updateValues);
      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getReceptionistStats() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE trang_thai = 'da_checkin') as checkin_count,
        COUNT(*) FILTER (WHERE trang_thai IN ('cho_xac_nhan', 'da_xac_nhan')) as waiting_count,
        COUNT(*) as total_today
      FROM lich_dat
      WHERE DATE(ngay_gio_bat_dau) = CURRENT_DATE
    `);
    return rows[0];
  }

  async findCustomerByPhone(phone: string) {
    const { rows } = await pool.query('SELECT id, khach_hang_id FROM nguoi_dung JOIN khach_hang ON nguoi_dung.id = khach_hang.nguoi_dung_id WHERE so_dien_thoai = $1', [phone]);
    return rows[0];
  }

  async createWalkInCustomer(ho_ten: string, sdt: string, gioi_tinh: string, ngay_sinh: string | null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: newUser } = await client.query(`
        INSERT INTO nguoi_dung (ho_ten, so_dien_thoai, vai_tro_id) 
        VALUES ($1, $2, (SELECT id FROM vai_tro WHERE ma_vai_tro = 'khach_hang')) RETURNING id
      `, [ho_ten, sdt]);
      const { rows: newKh } = await client.query(`
        INSERT INTO khach_hang (nguoi_dung_id, gioi_tinh, ngay_sinh) VALUES ($1, $2, $3) RETURNING id
      `, [newUser[0].id, gioi_tinh || 'khac', ngay_sinh || null]);
      await client.query('COMMIT');
      return newKh[0].id;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getServiceDuration(dich_vu_id: string) {
    const { rows } = await pool.query('SELECT thoi_luong_phut FROM dich_vu WHERE id = $1', [dich_vu_id]);
    return rows[0]?.thoi_luong_phut || 30;
  }

  async createAppointment(maLichDat: string, khachHangId: string, dich_vu_id: string, ky_thuat_vien_id: string, startTime: Date, endTime: Date) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: rooms } = await client.query(`
        SELECT p.id 
        FROM phong p
        JOIN phong_dich_vu pdv ON p.id = pdv.phong_id
        JOIN dich_vu dv ON dv.danh_muc_id = pdv.danh_muc_id
        WHERE dv.id = $1
        AND p.trang_thai = 'san_sang'
        AND NOT EXISTS (
           SELECT 1 FROM lich_dat ld
           WHERE ld.phong_id = p.id
           AND ld.trang_thai NOT IN ('da_huy', 'khong_den', 'hoan_thanh')
           AND (ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc) OVERLAPS ($2::timestamp, $3::timestamp)
        )
        LIMIT 1
      `, [dich_vu_id, startTime, endTime]);

      if (rooms.length === 0) {
        throw new Error('ROOM_UNAVAILABLE');
      }

      const phongId = rooms[0].id;

      const { rows } = await client.query(`
        INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai, thoi_gian_checkin, nguoi_tao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'da_checkin', NOW(), 'le_tan') RETURNING id
      `, [maLichDat, khachHangId, dich_vu_id, ky_thuat_vien_id || null, phongId, startTime, endTime]);

      await client.query('COMMIT');
      return rows[0].id;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getAppointmentForBilling(lich_dat_id: string) {
    const { rows } = await pool.query(`
      SELECT ld.khach_hang_id, ld.dich_vu_id, dv.don_gia 
      FROM lich_dat ld
      JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      WHERE ld.id = $1 AND ld.trang_thai = 'hoan_thanh'
    `, [lich_dat_id]);
    return rows[0];
  }

  async createBilling(maHoaDon: string, khach_hang_id: string, lich_dat_id: string, don_gia: number, dich_vu_id: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: hoaDonRows } = await client.query(`
        INSERT INTO hoa_don (ma_hoa_don, khach_hang_id, loai_hoa_don, lich_dat_id, tong_tien_truoc_giam, tong_tien_thanh_toan, trang_thai)
        VALUES ($1, $2, 'dich_vu_don', $3, $4, $4, 'chua_thanh_toan') RETURNING id, ma_hoa_don, tong_tien_thanh_toan
      `, [maHoaDon, khach_hang_id, lich_dat_id, don_gia]);

      await client.query(`
        INSERT INTO hoa_don_chi_tiet (hoa_don_id, dich_vu_id, mo_ta, don_gia, so_luong, thanh_tien)
        VALUES ($1, $2, 'Phí dịch vụ', $3, 1, $3)
      `, [hoaDonRows[0].id, dich_vu_id, don_gia]);

      await client.query('COMMIT');
      return hoaDonRows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getInvoiceById(id: string) {
    const { rows } = await pool.query('SELECT tong_tien_thanh_toan, da_thanh_toan FROM hoa_don WHERE id = $1', [id]);
    return rows[0];
  }

  async processPayment(hoa_don_id: string, maGiaoDich: string, tong_tien: number, phuong_thuc: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE hoa_don 
        SET da_thanh_toan = $1, trang_thai = 'da_thanh_toan', ngay_thanh_toan = NOW()
        WHERE id = $2
      `, [tong_tien, hoa_don_id]);

      await client.query(`
        INSERT INTO thanh_toan (hoa_don_id, ma_giao_dich, so_tien, phuong_thuc, trang_thai)
        VALUES ($1, $2, $3, $4, 'thanh_cong')
      `, [hoa_don_id, maGiaoDich, tong_tien, phuong_thuc]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export default new ReceptionistRepository();
