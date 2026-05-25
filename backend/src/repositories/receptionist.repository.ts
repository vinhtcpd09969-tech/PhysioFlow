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
            JOIN dich_vu dv ON dv.id = $1
            JOIN danh_muc_dich_vu dm ON dv.danh_muc_id = dm.id
            WHERE p.trang_thai = 'san_sang'
            AND (
              (dm.ten_danh_muc LIKE '%Khám%' AND p.loai_phong = 'kham_benh') OR
              (dm.ten_danh_muc LIKE '%Trị liệu%' AND p.loai_phong = 'tri_lieu') OR
              (dm.ten_danh_muc LIKE '%Phục hồi%' AND p.loai_phong = 'phuc_hoi')
            )
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

      let { rows } = await client.query(updateQuery, updateValues);

      if (rows.length === 0) {
        // Try updating buoi_tri_lieu
        const btlQuery = 'UPDATE buoi_tri_lieu SET trang_thai = $1 WHERE id = $2 RETURNING *';
        const btlRes = await client.query(btlQuery, [trang_thai, id]);
        rows = btlRes.rows;

        if (rows.length > 0) {
          await this.updateCompletedSessionsCountInternal(id, client);
        }
      }

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
        JOIN dich_vu dv ON dv.id = $1
        JOIN danh_muc_dich_vu dm ON dv.danh_muc_id = dm.id
        WHERE p.trang_thai = 'san_sang'
        AND (
          (dm.ten_danh_muc LIKE '%Khám%' AND p.loai_phong = 'kham_benh') OR
          (dm.ten_danh_muc LIKE '%Trị liệu%' AND p.loai_phong = 'tri_lieu') OR
          (dm.ten_danh_muc LIKE '%Phục hồi%' AND p.loai_phong = 'phuc_hoi')
        )
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
      
      const maLichDieuTri = `LDT${Math.floor(100000 + Math.random() * 900000)}`;
      const { rows: ldtRows } = await client.query(`
        INSERT INTO lich_dieu_tri (
          khach_hang_id, loai_dieu_tri, dich_vu_id, tong_so_buoi, 
          so_buoi_da_dung, trang_thai, ma_lich_dieu_tri, lich_dat_id
        ) VALUES ($1, 'dich_vu_le', $2, 1, 0, 'cho_thanh_toan', $3, $4)
        RETURNING id
      `, [khach_hang_id, dich_vu_id, maLichDieuTri, lich_dat_id || null]);
      const ldtId = ldtRows[0].id;

      const { rows: hoaDonRows } = await client.query(`
        INSERT INTO hoa_don (ma_hoa_don, khach_hang_id, loai_hoa_don, lich_dieu_tri_id, tong_tien_truoc_giam, tong_tien_thanh_toan, trang_thai)
        VALUES ($1, $2, 'dich_vu_don', $3, $4, $4, 'chua_thanh_toan') RETURNING id, ma_hoa_don, tong_tien_thanh_toan
      `, [maHoaDon, khach_hang_id, ldtId, don_gia]);

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
    const { rows } = await pool.query('SELECT tong_tien_thanh_toan, da_thanh_toan, loai_thanh_toan, lich_dieu_tri_id FROM hoa_don WHERE id = $1', [id]);
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

  async getPackageById(id: string) {
    const { rows } = await pool.query('SELECT * FROM goi_dich_vu WHERE id = $1', [id]);
    return rows[0];
  }

  async getServiceById(id: string) {
    const { rows } = await pool.query('SELECT * FROM dich_vu WHERE id = $1', [id]);
    return rows[0];
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT v.*,
             COALESCE((SELECT json_agg(dich_vu_id) FROM voucher_dich_vu WHERE voucher_id = v.id), '[]'::json) as dich_vu_ids,
             COALESCE((SELECT json_agg(goi_dich_vu_id) FROM voucher_goi_dich_vu WHERE voucher_id = v.id), '[]'::json) as goi_dich_vu_ids
      FROM voucher v
      WHERE v.ma_voucher = $1
    `, [code]);
    return rows[0];
  }

  async countVoucherUsage(voucherId: string) {
    const { rows } = await pool.query('SELECT COUNT(*) FROM hoa_don WHERE voucher_id = $1', [voucherId]);
    return parseInt(rows[0].count || '0');
  }

  async getAutoApplyVouchers() {
    const { rows: vouchers } = await pool.query(
      `SELECT * FROM voucher 
       WHERE trang_thai = 'hoat_dong' 
       AND tu_dong_ap_dung = true 
       AND ngay_bat_dau <= CURRENT_DATE 
       AND (ngay_het_han IS NULL OR ngay_het_han >= CURRENT_DATE)
       ORDER BY thoi_gian_tao DESC`
    );

    const result = [];
    for (const v of vouchers) {
      const { rows: packageRows } = await pool.query(
        'SELECT goi_dich_vu_id FROM voucher_goi_dich_vu WHERE voucher_id = $1',
        [v.id]
      );
      const { rows: serviceRows } = await pool.query(
        'SELECT dich_vu_id FROM voucher_dich_vu WHERE voucher_id = $1',
        [v.id]
      );
      result.push({
        ...v,
        goi_dich_vu_ids: packageRows.map(r => r.goi_dich_vu_id),
        dich_vu_ids: serviceRows.map(r => r.dich_vu_id)
      });
    }
    return result;
  }

  async getCustomerContactInfo(khach_hang_id: string) {
    const { rows } = await pool.query(`
      SELECT kh.id, nd.ho_ten, nd.so_dien_thoai 
      FROM khach_hang kh
      JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      WHERE kh.id = $1
    `, [khach_hang_id]);
    return rows[0];
  }

  async createInvoiceDirect(invoiceData: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        khach_hang_id,
        item_type,
        item_id,
        loai_thanh_toan,
        voucher_id,
        so_tien_giam_voucher,
        uu_dai_thanh_toan_id,
        so_tien_giam_phuong_thuc,
        tong_tien_truoc_giam,
        tong_tien_thanh_toan,
        lich_dat_id,
        ten_item,
        so_buoi_goi,
        ho_ten_khach,
        so_dien_thoai
      } = invoiceData;

      // 1. Generate ma_hoa_don
      const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. Create treatment plan (lich_dieu_tri) in 'cho_thanh_toan' status
      let ldtId = null;
      const maLichDieuTri = `LDT${Math.floor(100000 + Math.random() * 900000)}`;
      if (item_type === 'goi') {
        const { rows: ldtRows } = await client.query(`
          INSERT INTO lich_dieu_tri (
            khach_hang_id, loai_dieu_tri, goi_dich_vu_id, tong_so_buoi, 
            so_buoi_da_dung, trang_thai, ma_lich_dieu_tri, ho_ten_khach, 
            so_dien_thoai, lich_dat_id
          ) VALUES ($1, $2, $3, $4, 0, 'cho_thanh_toan', $5, $6, $7, $8)
          RETURNING id
        `, [
          khach_hang_id,
          'theo_goi',
          item_id,
          so_buoi_goi || 1,
          maLichDieuTri,
          ho_ten_khach || null,
          so_dien_thoai || null,
          lich_dat_id || null
        ]);
        ldtId = ldtRows[0].id;
      } else {
        const { rows: ldtRows } = await client.query(`
          INSERT INTO lich_dieu_tri (
            khach_hang_id, loai_dieu_tri, dich_vu_id, tong_so_buoi, 
            so_buoi_da_dung, trang_thai, ma_lich_dieu_tri, ho_ten_khach, 
            so_dien_thoai, lich_dat_id
          ) VALUES ($1, $2, $3, 1, 0, 'cho_thanh_toan', $4, $5, $6, $7)
          RETURNING id
        `, [
          khach_hang_id,
          'dich_vu_le',
          item_id,
          maLichDieuTri,
          ho_ten_khach || null,
          so_dien_thoai || null,
          lich_dat_id || null
        ]);
        ldtId = ldtRows[0].id;
      }

      // 3. Create hoa_don
      const { rows: hdRows } = await client.query(`
        INSERT INTO hoa_don (
          ma_hoa_don, khach_hang_id, loai_hoa_don, lich_dieu_tri_id,
          tong_tien_truoc_giam, so_tien_giam, tong_tien_thanh_toan, da_thanh_toan,
          trang_thai, loai_thanh_toan, voucher_id, so_tien_giam_voucher,
          uu_dai_thanh_toan_id, so_tien_giam_phuong_thuc
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'chua_thanh_toan', $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        maHoaDon,
        khach_hang_id,
        item_type === 'goi' ? 'goi_dich_vu' : 'dich_vu_don',
        ldtId,
        tong_tien_truoc_giam,
        so_tien_giam_voucher + so_tien_giam_phuong_thuc,
        tong_tien_thanh_toan,
        loai_thanh_toan,
        voucher_id || null,
        so_tien_giam_voucher,
        uu_dai_thanh_toan_id || null,
        so_tien_giam_phuong_thuc
      ]);

      const hoa_don = hdRows[0];

      await client.query('COMMIT');
      return hoa_don;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async processPaymentPartial(
    hoa_don_id: string, 
    maGiaoDich: string, 
    so_tien_nhan: number, 
    da_thanh_toan_moi: number, 
    trang_thai_moi: string, 
    phuong_thuc: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const ngayThanhToanSql = trang_thai_moi === 'da_thanh_toan' ? ', ngay_thanh_toan = NOW()' : '';
      await client.query(`
        UPDATE hoa_don 
        SET da_thanh_toan = $1, trang_thai = $2 ${ngayThanhToanSql}
        WHERE id = $3
      `, [da_thanh_toan_moi, trang_thai_moi, hoa_don_id]);

      await client.query(`
        INSERT INTO thanh_toan (hoa_don_id, ma_giao_dich, so_tien, phuong_thuc, trang_thai)
        VALUES ($1, $2, $3, $4, 'thanh_cong')
      `, [hoa_don_id, maGiaoDich, so_tien_nhan, phuong_thuc]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateTreatmentPlanStatus(id: string, trang_thai: string) {
    await pool.query('UPDATE lich_dieu_tri SET trang_thai = $1 WHERE id = $2', [trang_thai, id]);
  }

  async updateSessionServices(buoi_tri_lieu_id: string, services: any[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM buoi_tri_lieu_dich_vu WHERE buoi_tri_lieu_id = $1', [buoi_tri_lieu_id]);

      for (const item of services) {
        await client.query(`
          INSERT INTO buoi_tri_lieu_dich_vu (buoi_tri_lieu_id, dich_vu_id, so_luong, thoi_gian_thuc_hien)
          VALUES ($1, $2, $3, NOW())
        `, [buoi_tri_lieu_id, item.dich_vu_id, item.so_luong || 1]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getSessionServices(buoi_tri_lieu_id: string) {
    const { rows } = await pool.query(`
      SELECT bld.*, dv.ten_dich_vu, dv.don_gia
      FROM buoi_tri_lieu_dich_vu bld
      JOIN dich_vu dv ON bld.dich_vu_id = dv.id
      WHERE bld.buoi_tri_lieu_id = $1
    `, [buoi_tri_lieu_id]);
    return rows;
  }

  async updateCompletedSessionsCountInternal(buoi_tri_lieu_id: string, client: any) {
    const btlRes = await client.query('SELECT lich_dieu_tri_id FROM buoi_tri_lieu WHERE id = $1', [buoi_tri_lieu_id]);
    if (btlRes.rows.length === 0) return;
    const ldtId = btlRes.rows[0].lich_dieu_tri_id;
    if (!ldtId) return;

    // Count actual completed buoi_tri_lieu sessions (excluding cancellations/no-shows)
    const countRes = await client.query(
      "SELECT COUNT(*) FROM buoi_tri_lieu WHERE lich_dieu_tri_id = $1 AND trang_thai = 'hoan_thanh'",
      [ldtId]
    );
    const completedCount = parseInt(countRes.rows[0].count || '0');

    // Update lich_dieu_tri.so_buoi_da_dung
    await client.query(
      'UPDATE lich_dieu_tri SET so_buoi_da_dung = $1 WHERE id = $2',
      [completedCount, ldtId]
    );
  }
}

export default new ReceptionistRepository();
