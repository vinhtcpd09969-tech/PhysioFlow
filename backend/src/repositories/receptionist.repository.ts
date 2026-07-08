import { pool } from '../config/db';

class ReceptionistRepository {
  async getTodayAppointments() {
    const { rows } = await pool.query(`
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc, 
        ch.trang_thai,
        ch.phac_do_dieu_tri_id as phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        hd_goi.trang_thai as trang_thai_hoa_don_goi,
        hd_goi.so_tien_da_tra as so_tien_da_tra_goi,
        hd_goi.tong_tien_phai_tra as tong_tien_phai_tra_goi,
        hd_goi.hinh_thuc_thanh_toan_goi as hinh_thuc_thanh_toan_goi,
        hd_goi.id as hoa_don_goi_id,
        CASE 
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.id as khach_hang_id,
        kh.ho_ten as ten_khach_hang, 
        kh.so_dien_thoai as sdt_khach_hang,
        dv.ten_goi as ten_dich_vu,
        ch.nhan_su_id,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        ch.phong_id as phong_id,
        p.ten_phong as ten_phong,
        COALESCE(
          (
            SELECT created_at 
            FROM otp_codes 
            WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) 
            ORDER BY created_at DESC 
            LIMIT 1
          ), 
          ch.ngay_gio_bat_dau
        ) as thoi_gian_tao
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN hoa_don hd_goi ON pd.id = hd_goi.phac_do_dieu_tri_id
      WHERE DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
        AND (
          ch.trang_thai != 'chua_xac_nhan'
          OR NOT EXISTS (
            SELECT 1 FROM otp_codes 
            WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) 
              AND expires_at > CURRENT_TIMESTAMP
          )
        )
      ORDER BY ch.ngay_gio_bat_dau ASC
    `);
    return rows;
  }

  async updateAppointmentStatus(id: string, trang_thai: string, ly_do_huy?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch the appointment first to check types and previous records
      const apptRes = await client.query('SELECT * FROM cuoc_hen WHERE id = $1', [id]);
      if (apptRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn');
      }
      const appt = apptRes.rows[0];

      let finalStatus = trang_thai;

      // Handle No-Show Logic
      if (trang_thai === 'khach_khong_den') {
        if (appt.phac_do_dieu_tri_id && appt.so_thu_tu_buoi) {
          // Count previous misses for the same session index
          const missCountRes = await client.query(`
            SELECT COUNT(*)::int as count FROM cuoc_hen 
            WHERE phac_do_dieu_tri_id = $1 
              AND so_thu_tu_buoi = $2 
              AND id != $3 
              AND trang_thai IN ('khach_khong_den', 'khach_khong_den_phat')
          `, [appt.phac_do_dieu_tri_id, appt.so_thu_tu_buoi, id]);
          const previousMisses = missCountRes.rows[0].count || 0;

          if (previousMisses > 0) {
            // This is the 2nd miss! Check payment type
            const invoiceRes = await client.query(`
              SELECT hinh_thuc_thanh_toan_goi FROM hoa_don 
              WHERE phac_do_dieu_tri_id = $1 
              LIMIT 1
            `, [appt.phac_do_dieu_tri_id]);
            const hinhThuc = invoiceRes.rows[0]?.hinh_thuc_thanh_toan_goi;

            if (hinhThuc === 'tra_thang' || hinhThuc === 'tra_gop') {
              // Paid package: forfeit session (khach_khong_den_phat)
              finalStatus = 'khach_khong_den_phat';
            } else {
              // Pay-per-session (tung_buoi): keep as khach_khong_den, deduct reputation points
              finalStatus = 'khach_khong_den';
              await client.query(
                'UPDATE khach_hang SET diem_uy_tin = GREATEST(0, diem_uy_tin - 10) WHERE id = $1',
                [appt.khach_hang_id]
              );
            }
          } else {
            // 1st miss of this session index: remains 'khach_khong_den'
            finalStatus = 'khach_khong_den';
          }
        } else {
          // Non-package session (clinical exam / single service): remains khach_khong_den, deduct points
          finalStatus = 'khach_khong_den';
          await client.query(
            'UPDATE khach_hang SET diem_uy_tin = GREATEST(0, diem_uy_tin - 10) WHERE id = $1',
            [appt.khach_hang_id]
          );
        }
      }

      const updates = [];
      const values = [finalStatus];
      let paramIndex = 2;

      if (ly_do_huy !== undefined) {
        updates.push(`ly_do_huy = $${paramIndex}`);
        values.push(ly_do_huy);
        paramIndex++;
      }

      if (finalStatus === 'da_huy') {
        updates.push(`thoi_gian_huy = NOW()`);
      }

      const updateQuery = `
        UPDATE cuoc_hen 
        SET trang_thai = $1${updates.length > 0 ? ', ' + updates.join(', ') : ''} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      values.push(id);

      const { rows } = await client.query(updateQuery, values);

      if (rows.length > 0) {
        const updatedAppt = rows[0];
        if (['hoan_thanh', 'khach_khong_den_phat'].includes(finalStatus) && updatedAppt.phac_do_dieu_tri_id) {
          // Cập nhật số buổi đã dùng của phác đồ
          const countRes = await client.query(
            "SELECT COUNT(*)::int as count FROM cuoc_hen WHERE phac_do_dieu_tri_id = $1 AND trang_thai IN ('hoan_thanh', 'khach_khong_den_phat') AND loai = 'DIEU_TRI'",
            [updatedAppt.phac_do_dieu_tri_id]
          );
          const completedCount = countRes.rows[0].count || 0;
          await client.query(
            'UPDATE phac_do_dieu_tri SET so_buoi_da_dung = $1 WHERE id = $2',
            [completedCount, updatedAppt.phac_do_dieu_tri_id]
          );
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

  async getReceptionistStats() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE trang_thai = 'da_checkin') as checkin_count,
        COUNT(*) FILTER (WHERE trang_thai IN ('cho_xac_nhan', 'da_xac_nhan')) as waiting_count,
        COUNT(*) as total_today
      FROM cuoc_hen
      WHERE DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
    `);
    return rows[0];
  }

  async findCustomerByPhone(phone: string) {
    const { rows } = await pool.query('SELECT id AS khach_hang_id FROM khach_hang WHERE so_dien_thoai = $1', [phone]);
    return rows[0];
  }

  async createWalkInCustomer(ho_ten: string, sdt: string, gioi_tinh: string, ngay_sinh: string | null) {
    const { rows: newKh } = await pool.query(`
      INSERT INTO khach_hang (ho_ten, so_dien_thoai, gioi_tinh, ngay_sinh) VALUES ($1, $2, $3, $4) RETURNING id
    `, [ho_ten, sdt, gioi_tinh || 'khac', ngay_sinh || null]);
    return newKh[0].id;
  }

  async getServiceDuration(goi_dich_vu_id: string) {
    const { rows } = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
    return rows[0]?.thoi_luong_phut || 30;
  }

  async createAppointment(maLichDat: string, khachHangId: string, goi_dich_vu_id: string, ky_thuat_vien_id: string, startTime: Date, endTime: Date) {
    const { rows } = await pool.query(`
      INSERT INTO cuoc_hen (khach_hang_id, goi_dich_vu_id, nhan_su_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai)
      VALUES ($1, $2, $3, $4, $5, 'DICH_VU_LE', 'cho_xac_nhan') RETURNING id
    `, [khachHangId, goi_dich_vu_id, ky_thuat_vien_id ? parseInt(ky_thuat_vien_id, 10) : null, startTime, endTime]);
    return rows[0].id;
  }

  async getAppointmentForBilling(lich_dat_id: string) {
    const { rows } = await pool.query(`
      SELECT ch.khach_hang_id, ch.goi_dich_vu_id, g.don_gia 
      FROM cuoc_hen ch
      JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      WHERE ch.id = $1 AND ch.trang_thai = 'hoan_thanh'
    `, [lich_dat_id]);
    return rows[0];
  }

  async createBilling(maHoaDon: string, khach_hang_id: string, lich_dat_id: string, don_gia: number, goi_dich_vu_id: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if this ID is a cuoc_hen
      const { rows: apptRows } = await client.query(`
        SELECT phac_do_dieu_tri_id FROM cuoc_hen WHERE id = $1
      `, [lich_dat_id]);

      let phacDoId = null;
      let doctorUserId = null;
      let customerName = 'Khách hàng';

      if (apptRows.length > 0 && apptRows[0].phac_do_dieu_tri_id) {
        phacDoId = apptRows[0].phac_do_dieu_tri_id;
        // Cập nhật phác đồ
        await client.query(`
          UPDATE phac_do_dieu_tri 
          SET trang_thai = 'huy', tong_so_buoi = 1, goi_dich_vu_id = NULL 
          WHERE id = $1
        `, [phacDoId]);

        const { rows: custDetails } = await client.query(`
          SELECT ho_ten FROM khach_hang WHERE id = $1
        `, [khach_hang_id]);
        if (custDetails.length > 0) {
          customerName = custDetails[0].ho_ten;
        }

        const { rows: docRows } = await client.query(`
          SELECT nhan_su_id FROM cuoc_hen WHERE id = $1
        `, [lich_dat_id]);
        if (docRows.length > 0) {
          doctorUserId = docRows[0].nhan_su_id;
        }
      } else {
        // Tạo phác đồ lẻ 1 buổi
        const { rows: pdRows } = await client.query(`
          INSERT INTO phac_do_dieu_tri (
            khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat
          ) VALUES ($1, $2, 1, 0, 'dang_dieu_tri', NOW())
          RETURNING id
        `, [khach_hang_id, goi_dich_vu_id]);
        phacDoId = pdRows[0].id;
      }

      const { rows: hoaDonRows } = await client.query(`
        INSERT INTO hoa_don (khach_hang_id, phac_do_dieu_tri_id, tong_tien_phai_tra, so_tien_da_tra, trang_thai)
        VALUES ($1, $2, $3, 0, 'chua_thanh_toan') 
        RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don, tong_tien_phai_tra as tong_tien_thanh_toan
      `, [khach_hang_id, phacDoId, don_gia]);

      await client.query('COMMIT');
      return { hoa_don: hoaDonRows[0], doctorUserId, customerName };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getInvoiceById(id: string) {
    const { rows } = await pool.query(`
      SELECT 
        hd.tong_tien_phai_tra as tong_tien_thanh_toan, 
        hd.so_tien_da_tra as da_thanh_toan, 
        CASE WHEN hd.phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don, 
        hd.phac_do_dieu_tri_id,
        hd.phac_do_dieu_tri_id as lich_dieu_tri_id,
        hd.cuoc_hen_id,
        hd.tong_tien_goc,
        hd.hinh_thuc_thanh_toan_goi as loai_thanh_toan,
        COALESCE(pd.tong_so_buoi, 1) as so_buoi_goi
      FROM hoa_don hd
      LEFT JOIN phac_do_dieu_tri pd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE hd.id = $1
    `, [id]);
    return rows[0];
  }

  async getAppointmentWithServicePrice(id: string) {
    const { rows } = await pool.query(`
      SELECT 
        ch.id,
        ch.goi_dich_vu_id,
        ch.khach_hang_id,
        COALESCE(g.don_gia, 0) as don_gia
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      WHERE ch.id = $1
    `, [id]);
    return rows[0];
  }

  async processPayment(hoa_don_id: string, maGiaoDich: string, tong_tien: number, phuong_thuc: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE hoa_don 
        SET so_tien_da_tra = $1, trang_thai = 'da_thanh_toan', ngay_thanh_toan = NOW()
        WHERE id = $2
      `, [tong_tien, hoa_don_id]);

      await client.query(`
        INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich)
        VALUES ($1, $2, 'THANH_TOAN', $3, $4, 1, NOW())
      `, [hoa_don_id, tong_tien, phuong_thuc, maGiaoDich]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getPackageById(id: string) {
    const { rows } = await pool.query(`
      SELECT *, don_gia as gia_goi, '[]'::json as chi_tiet_dich_vu
      FROM goi_dich_vu
      WHERE id = $1
    `, [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  async getActivePackages() {
    const { rows } = await pool.query(`
      SELECT id, ten_goi, muc_tieu as mo_ta, tong_so_buoi, don_gia as gia_goi, don_gia as gia_goc,
             loai_goi, thoi_luong_phut,
             '[]'::json as chi_tiet_dich_vu
      FROM goi_dich_vu
      WHERE trang_thai = 'hoat_dong'
      ORDER BY ten_goi ASC
    `);
    return rows;
  }

  async getCompletedAppointments() {
    const { rows } = await pool.query(`
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau, 
        ch.trang_thai,
        kh.id as khach_hang_id,
        kh.ho_ten as ten_khach_hang, 
        kh.so_dien_thoai as sdt_khach_hang,
        ch.goi_dich_vu_id as goi_dich_vu_id,
        g.ten_goi as ten_dich_vu, 
        g.don_gia,
        COALESCE(
          (
            SELECT cdb.goi_dich_vu_id 
            FROM nhat_ky_buoi_dieu_tri nk
            JOIN chi_dinh_buoi cdb ON cdb.nhat_ky_id = nk.id
            JOIN goi_dich_vu recommended_g ON cdb.goi_dich_vu_id = recommended_g.id
            WHERE nk.cuoc_hen_id = ch.id AND recommended_g.loai_goi = 'LIEU_TRINH'
            LIMIT 1
          ),
          ch.phac_do_dieu_tri_id
        ) as khuyen_nghi_goi_id
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN hoa_don hd ON hd.cuoc_hen_id = ch.id
      WHERE ch.trang_thai = 'hoan_thanh' AND hd.id IS NULL
      ORDER BY ch.ngay_gio_bat_dau DESC
    `);
    return rows;
  }

  async getServiceById(id: string) {
    const { rows } = await pool.query('SELECT *, ten_goi as ten_dich_vu, don_gia as don_gia FROM goi_dich_vu WHERE id = $1', [id]);
    return rows[0];
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT id, ma_code as ma_voucher, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, 
             don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, dang_kich_hoat
      FROM khuyen_mai_voucher
      WHERE ma_code = $1
    `, [code]);
    return rows[0];
  }

  async countVoucherUsage(voucherId: string) {
    const { rows } = await pool.query('SELECT COUNT(*) FROM hoa_don WHERE voucher_id = $1', [voucherId]);
    return parseInt(rows[0].count || '0');
  }

  async getAutoApplyVouchers() {
    const { rows: vouchers } = await pool.query(
      `SELECT id, ma_code as ma_voucher, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, 
              don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, dang_kich_hoat
       FROM khuyen_mai_voucher 
       WHERE dang_kich_hoat = true 
       AND ngay_bat_dau <= CURRENT_DATE 
       AND (ngay_het_han IS NULL OR ngay_het_han >= CURRENT_DATE)`
    );
    return vouchers;
  }

  async getCustomerContactInfo(khach_hang_id: string) {
    const { rows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai 
      FROM khach_hang
      WHERE id = $1
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
        so_buoi_goi,
        ho_ten_khach,
        so_dien_thoai,
        ghi_chu
      } = invoiceData;

      const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;

      let phacDoId = null;
      let shouldCreatePhacDo = (item_type === 'goi');

      if (lich_dat_id) {
        const { rows: apptRows } = await client.query(`
          SELECT phac_do_dieu_tri_id, loai FROM cuoc_hen WHERE id = $1
        `, [lich_dat_id]);
        if (apptRows.length > 0) {
          phacDoId = apptRows[0].phac_do_dieu_tri_id;
          const loaiLich = apptRows[0].loai;
          if (loaiLich && !['KHAM', 'KHAM_MOI'].includes(loaiLich.toUpperCase())) {
            shouldCreatePhacDo = true;
          }
        }
      }

      if (shouldCreatePhacDo && !phacDoId) {
        const finalGoiDichVuId = item_type === 'goi' ? item_id : (item_id || null);
        if (finalGoiDichVuId) {
          // Tạo phác đồ điều trị mới
          const { rows: pdRows } = await client.query(`
            INSERT INTO phac_do_dieu_tri (
              khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat
            ) VALUES ($1, $2, $3, 0, 'dang_dieu_tri', NOW())
            RETURNING id
          `, [
            khach_hang_id,
            finalGoiDichVuId,
            item_type === 'goi' ? (so_buoi_goi || 10) : 1
          ]);
          phacDoId = pdRows[0].id;

          // Cập nhật cuộc hẹn gốc liên kết với phác đồ này
          if (lich_dat_id) {
            await client.query('UPDATE cuoc_hen SET phac_do_dieu_tri_id = $1 WHERE id = $2', [phacDoId, lich_dat_id]);
          }
        }
      }

      // Calculate percentage discount
      let tiLeGiam = 0;
      if (loai_thanh_toan === 'tra_thang') tiLeGiam = 10;
      else if (loai_thanh_toan === 'tra_gop') tiLeGiam = 5;

      // Tạo hoa_don
      const { rows: hdRows } = await client.query(`
        INSERT INTO hoa_don (
          khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id,
          tong_tien_goc, hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
          tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'chua_thanh_toan', $9, $10)
        RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don,
                  CASE WHEN phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don,
                  khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc,
                  hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
                  tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ngay_tao, ghi_chu
      `, [
        khach_hang_id,
        phacDoId,
        lich_dat_id || null,
        tong_tien_truoc_giam || tong_tien_thanh_toan,
        loai_thanh_toan || null,
        tiLeGiam,
        so_tien_giam_voucher || 0,
        tong_tien_thanh_toan,
        voucher_id || null,
        ghi_chu || null
      ]);

      const hoa_don = hdRows[0];
      await client.query('COMMIT');
      return {
        ...hoa_don,
        tong_tien_thanh_toan: hoa_don.tong_tien_phai_tra
      };
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
    phuong_thuc: string,
    ghi_chu?: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(`
        UPDATE hoa_don 
        SET so_tien_da_tra = $1, trang_thai = $2
        WHERE id = $3
      `, [da_thanh_toan_moi, trang_thai_moi, hoa_don_id]);

      await client.query(`
        INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich)
        VALUES ($1, $2, 'THANH_TOAN', $3, $4, 1, NOW())
      `, [hoa_don_id, so_tien_nhan, phuong_thuc, maGiaoDich]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateTreatmentPlanStatus(id: string, trang_thai: string) {
    if (trang_thai === 'dang_dieu_tri') {
      await pool.query('UPDATE phac_do_dieu_tri SET trang_thai = $1, ngay_kich_hoat = NOW() WHERE id = $2', [trang_thai, id]);
    } else {
      await pool.query('UPDATE phac_do_dieu_tri SET trang_thai = $1 WHERE id = $2', [trang_thai, id]);
    }
  }

  async updateSessionServices(buoi_tri_lieu_id: string, services: any[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Tìm nhat_ky_buoi_dieu_tri cho cuoc_hen nay
      let nhatKyId = null;
      const nkRes = await client.query('SELECT id FROM nhat_ky_buoi_dieu_tri WHERE cuoc_hen_id = $1', [buoi_tri_lieu_id]);
      if (nkRes.rows.length > 0) {
        nhatKyId = nkRes.rows[0].id;
      } else {
        const newNk = await client.query(`
          INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan)
          VALUES ($1, 1, 'Trị liệu') RETURNING id
        `, [buoi_tri_lieu_id]);
        nhatKyId = newNk.rows[0].id;
      }

      await client.query('DELETE FROM ky_thuat_dieu_tri_ap_dung WHERE nhat_ky_buoi_dieu_tri_id = $1', [nhatKyId]);

      for (const item of services) {
        await client.query(`
          INSERT INTO ky_thuat_dieu_tri_ap_dung (nhat_ky_buoi_dieu_tri_id, dich_vu_id, ghi_chu)
          VALUES ($1, $2, $3)
        `, [
          nhatKyId,
          item.dich_vu_id,
          item.ghi_chu || null
        ]);
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
      SELECT kt.*, dv.ten_dich_vu, dv.don_gia
      FROM ky_thuat_dieu_tri_ap_dung kt
      JOIN nhat_ky_buoi_dieu_tri nk ON kt.nhat_ky_buoi_dieu_tri_id = nk.id
      JOIN dich_vu dv ON kt.dich_vu_id = dv.id
      WHERE nk.cuoc_hen_id = $1
    `, [buoi_tri_lieu_id]);
    return rows;
  }

  async getTreatmentPlanById(id: string) {
    const { rows } = await pool.query('SELECT * FROM phac_do_dieu_tri WHERE id = $1', [id]);
    return rows[0];
  }

  async confirmTreatmentPlan(planData: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        khach_hang_id,
        item_type,
        item_id,
        lich_dat_id
      } = planData;

      let tong_so_buoi = 1;
      if (item_type === 'goi') {
        const pkgRes = await client.query('SELECT tong_so_buoi FROM goi_dich_vu WHERE id = $1', [item_id]);
        if (pkgRes.rows.length > 0) {
          tong_so_buoi = pkgRes.rows[0].tong_so_buoi;
        }
      }

      // Tạo phác đồ điều trị
      const { rows: pdRows } = await client.query(`
        INSERT INTO phac_do_dieu_tri (
          khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat
        ) VALUES ($1, $2, $3, 0, 'cho_thanh_toan', NOW())
        RETURNING *
      `, [
        khach_hang_id,
        item_type === 'goi' ? item_id : null,
        tong_so_buoi
      ]);
      const pd = pdRows[0];

      // Cập nhật cuộc hẹn gốc liên kết với phác đồ này
      if (lich_dat_id) {
        await client.query('UPDATE cuoc_hen SET phac_do_dieu_tri_id = $1 WHERE id = $2', [pd.id, lich_dat_id]);
      }

      await client.query('COMMIT');
      return pd;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async createInvoiceForTreatmentPlan(invoiceData: any) {
    const {
      lich_dieu_tri_id,
      khach_hang_id,
      item_type,
      tong_tien_thanh_toan,
      voucher_id,
      tong_tien_truoc_giam,
      so_tien_giam_voucher,
      so_tien_giam_phuong_thuc,
      loai_thanh_toan,
      cuoc_hen_id,
      ghi_chu
    } = invoiceData;

    const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;

    // Calculate percentage discount
    let tiLeGiam = 0;
    if (loai_thanh_toan === 'tra_thang') tiLeGiam = 10;
    else if (loai_thanh_toan === 'tra_gop') tiLeGiam = 5;

    const { rows } = await pool.query(`
      INSERT INTO hoa_don (
        khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id,
        tong_tien_goc, hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
        tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ghi_chu
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'chua_thanh_toan', $9, $10)
      RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don,
                CASE WHEN phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don,
                khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc,
                hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
                tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ngay_tao, ghi_chu
    `, [
      khach_hang_id,
      lich_dieu_tri_id,
      cuoc_hen_id || null,
      tong_tien_truoc_giam || tong_tien_thanh_toan,
      loai_thanh_toan || null,
      tiLeGiam,
      so_tien_giam_voucher || 0,
      tong_tien_thanh_toan,
      voucher_id || null,
      ghi_chu || null
    ]);

    return rows[0];
  }

  async searchCustomers(queryText: string) {
    const { rows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, gioi_tinh, ngay_sinh, diem_uy_tin 
      FROM khach_hang 
      WHERE (ho_ten ILIKE $1 OR so_dien_thoai ILIKE $1) AND trang_thai = 'hoat_dong'
      LIMIT 20
    `, [`%${queryText}%`]);
    return rows;
  }

  async getCustomerTreatmentPlans(customerId: string) {
    const { rows } = await pool.query(`
      SELECT pd.id, pd.goi_dich_vu_id, pd.tong_so_buoi, pd.so_buoi_da_dung, pd.trang_thai,
             gdv.ten_goi as ten_goi_dich_vu, gdv.thoi_luong_phut
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
      WHERE pd.khach_hang_id = $1 
        AND pd.so_buoi_da_dung < pd.tong_so_buoi 
        AND pd.trang_thai IN ('dang_dieu_tri', 'cho_kich_hoat')
    `, [customerId]);
    return rows;
  }

  async getTreatmentPlanBySessionId(sessionId: string) {
    const { rows } = await pool.query('SELECT phac_do_dieu_tri_id FROM cuoc_hen WHERE id = $1', [sessionId]);
    return rows[0] ? rows[0].phac_do_dieu_tri_id : null;
  }

  async getAppointmentBillingInfo(id: string) {
    const { rows } = await pool.query(`
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc, 
        ch.trang_thai,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        ch.goi_dich_vu_id,
        CASE 
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.id as khach_hang_id,
        kh.ho_ten as ten_khach_hang, 
        kh.so_dien_thoai as sdt_khach_hang,
        dv.ten_goi as ten_dich_vu,
        dv.don_gia as don_gia_dich_vu,
        COALESCE(
          (
            SELECT cdb.goi_dich_vu_id 
            FROM nhat_ky_buoi_dieu_tri nk
            JOIN chi_dinh_buoi cdb ON cdb.nhat_ky_id = nk.id
            JOIN goi_dich_vu recommended_g ON cdb.goi_dich_vu_id = recommended_g.id
            WHERE nk.cuoc_hen_id = ch.id AND recommended_g.loai_goi = 'LIEU_TRINH'
            LIMIT 1
          ),
          ch.phac_do_dieu_tri_id
        ) as khuyen_nghi_goi_id,
        pd.goi_dich_vu_id as pd_goi_dich_vu_id,
        pd.tong_so_buoi as pd_tong_so_buoi,
        pd.trang_thai as pd_trang_thai,
        gpd.ten_goi as pd_ten_goi,
        hd_goi.id as hoa_don_goi_id,
        'HD-' || UPPER(SUBSTRING(hd_goi.id::text FROM 1 FOR 6)) as hoa_don_goi_ma,
        hd_goi.trang_thai as trang_thai_hoa_don_goi,
        hd_goi.so_tien_da_tra as so_tien_da_tra_goi,
        hd_goi.tong_tien_phai_tra as tong_tien_phai_tra_goi,
        hd_goi.hinh_thuc_thanh_toan_goi as hinh_thuc_thanh_toan_goi
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN hoa_don hd_goi ON pd.id = hd_goi.phac_do_dieu_tri_id
      WHERE ch.id = $1
    `, [id]);
    return rows[0];
  }

  async getPaidInvoiceAmountForAppointment(lich_dat_id: string): Promise<number> {
    const { rows } = await pool.query(
      "SELECT tong_tien_phai_tra FROM hoa_don WHERE cuoc_hen_id = $1 AND trang_thai = 'da_thanh_toan' LIMIT 1",
      [lich_dat_id]
    );
    return rows[0] ? Number(rows[0].tong_tien_phai_tra) : 0;
  }
}

export default new ReceptionistRepository();
