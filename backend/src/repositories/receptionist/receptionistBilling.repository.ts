import { pool } from '../../config/db';
import { calculateDiscountPercent, PaymentTransactionDetail, DEFAULT_CANCELLATION_PENALTY_PERCENT } from '../../domain/billing';

export class ReceptionistBillingRepository {
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

      await client.query(`
        SELECT id FROM cuoc_hen WHERE id = $1 FOR UPDATE
      `, [lich_dat_id]);

      const { rows: existingInvoice } = await client.query(`
        SELECT id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don, tong_tien_phai_tra, so_tien_da_tra, trang_thai
        FROM hoa_don
        WHERE cuoc_hen_id = $1
      `, [lich_dat_id]);

      if (existingInvoice.length > 0) {
        let doctorUserId = null;
        let customerName = 'Khách hàng';

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

        let tenItem = 'Khám lâm sàng / Dịch vụ y tế';
        let soBuoiGoi = 1;
        if (goi_dich_vu_id) {
          const { rows: pkgRows } = await client.query('SELECT ten_goi, tong_so_buoi FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
          if (pkgRows.length > 0) {
            tenItem = pkgRows[0].ten_goi;
            soBuoiGoi = pkgRows[0].tong_so_buoi || 1;
          }
        }

        await client.query('COMMIT');
        return {
          hoa_don: {
            id: existingInvoice[0].id,
            ma_hoa_don: existingInvoice[0].ma_hoa_don,
            khach_hang_id,
            loai_hoa_don: 'dich_vu_don',
            tong_tien_truoc_giam: Number(existingInvoice[0].tong_tien_phai_tra),
            tong_tien_thanh_toan: Number(existingInvoice[0].tong_tien_phai_tra),
            so_tien_da_tra: Number(existingInvoice[0].so_tien_da_tra),
            trang_thai: existingInvoice[0].trang_thai,
            ten_item: tenItem,
            so_buoi_goi: soBuoiGoi,
            isNew: false
          },
          doctorUserId,
          customerName
        };
      }

      const { rows: apptRows } = await client.query(`
        SELECT phac_do_dieu_tri_id, loai FROM cuoc_hen WHERE id = $1
      `, [lich_dat_id]);

      let phacDoId = null;
      let doctorUserId = null;
      let customerName = 'Khách hàng';
      const isExam = apptRows.length > 0 && (apptRows[0].loai === 'KHAM' || apptRows[0].loai === 'KHAM_MOI');

      if (apptRows.length > 0 && apptRows[0].phac_do_dieu_tri_id) {
        phacDoId = apptRows[0].phac_do_dieu_tri_id;
        await client.query(`
          UPDATE phac_do_dieu_tri
          SET trang_thai = 'huy', tong_so_buoi = 1, ngay_huy = COALESCE(ngay_huy, NOW())
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
      } else if (!isExam) {
        const { rows: pdRows } = await client.query(`
          INSERT INTO phac_do_dieu_tri (
            khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat
          ) VALUES ($1, $2, 1, 0, 'dang_dieu_tri', NOW())
          RETURNING id
        `, [khach_hang_id, goi_dich_vu_id]);
        phacDoId = pdRows[0].id;
      }

      let insertHoaDonQuery = '';
      let insertParams = [];
      if (isExam) {
        insertHoaDonQuery = `
          INSERT INTO hoa_don (khach_hang_id, cuoc_hen_id, tong_tien_phai_tra, so_tien_da_tra, trang_thai, tong_tien_goc)
          VALUES ($1, $2, $3, 0, 'chua_thanh_toan', $3) 
          RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don, tong_tien_phai_tra as tong_tien_thanh_toan
        `;
        insertParams = [khach_hang_id, lich_dat_id, don_gia];
      } else {
        insertHoaDonQuery = `
          INSERT INTO hoa_don (khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_phai_tra, so_tien_da_tra, trang_thai, tong_tien_goc)
          VALUES ($1, $2, $3, $4, 0, 'chua_thanh_toan', $4) 
          RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don, tong_tien_phai_tra as tong_tien_thanh_toan
        `;
        insertParams = [khach_hang_id, phacDoId, lich_dat_id, don_gia];
      }

      const { rows: hoaDonRows } = await client.query(insertHoaDonQuery, insertParams);

      let tenItem = 'Khám lâm sàng / Dịch vụ y tế';
      let soBuoiGoi = 1;
      if (goi_dich_vu_id) {
        const { rows: pkgRows } = await client.query('SELECT ten_goi, tong_so_buoi FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
        if (pkgRows.length > 0) {
          tenItem = pkgRows[0].ten_goi;
          soBuoiGoi = pkgRows[0].tong_so_buoi || 1;
        }
      }

      await client.query('COMMIT');
      return {
        hoa_don: {
          id: hoaDonRows[0].id,
          ma_hoa_don: hoaDonRows[0].ma_hoa_don,
          khach_hang_id,
          loai_hoa_don: 'dich_vu_don',
          tong_tien_truoc_giam: Number(don_gia),
          tong_tien_thanh_toan: Number(don_gia),
          so_tien_da_tra: 0,
          trang_thai: 'chua_thanh_toan',
          ten_item: tenItem,
          so_buoi_goi: soBuoiGoi,
          isNew: true
        },
        doctorUserId,
        customerName
      };
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
        hd.id,
        hd.khach_hang_id,
        hd.trang_thai,
        hd.tong_tien_phai_tra as tong_tien_thanh_toan, 
        hd.so_tien_da_tra as da_thanh_toan, 
        CASE WHEN hd.phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don, 
        hd.phac_do_dieu_tri_id,
        hd.phac_do_dieu_tri_id as lich_dieu_tri_id,
        hd.cuoc_hen_id,
        hd.tong_tien_goc,
        hd.ghi_chu,
        hd.hinh_thuc_thanh_toan_goi as loai_thanh_toan,
        hd.hinh_thuc_thanh_toan_goi,
        hd.so_tien_giam_voucher,
        hd.ngay_tao,
        COALESCE(pd.tong_so_buoi, 1) as so_buoi_goi,
        ch.ngay_gio_bat_dau as ngay_kham,
        ch.ngay_gio_ket_thuc as ngay_kham_ket_thuc,
        CASE 
          WHEN hd.hinh_thuc_thanh_toan_goi = 'tung_buoi' AND EXISTS (
            SELECT 1 FROM hoa_don exam_hd 
            WHERE exam_hd.cuoc_hen_id = hd.cuoc_hen_id 
              AND exam_hd.phac_do_dieu_tri_id IS NULL 
              AND exam_hd.trang_thai = 'da_thanh_toan'
          ) THEN 0
          WHEN hd.phac_do_dieu_tri_id IS NULL AND hd.tong_tien_goc > COALESCE(dv.don_gia, (SELECT don_gia FROM goi_dich_vu WHERE loai_goi = 'KHAM' AND trang_thai = 'hoat_dong' LIMIT 1), 0) THEN 0
          WHEN hd.cuoc_hen_id IS NOT NULL THEN COALESCE(dv.don_gia, (SELECT don_gia FROM goi_dich_vu WHERE loai_goi = 'KHAM' AND trang_thai = 'hoat_dong' LIMIT 1), 0)
          ELSE 0
        END as chi_phi_kham
      FROM hoa_don hd
      LEFT JOIN phac_do_dieu_tri pd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN cuoc_hen ch ON hd.cuoc_hen_id = ch.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
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
        ch.ngay_gio_bat_dau as ngay_kham,
        COALESCE(g.don_gia, 0) as don_gia
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      WHERE ch.id = $1
    `, [id]);
    return rows[0];
  }

  async processPayment(hoa_don_id: string, maGiaoDich: string, tong_tien: number, phuong_thuc: string, nhan_vien_thuc_hien_id?: number | null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: hdRows } = await client.query(`
        UPDATE hoa_don
        SET so_tien_da_tra = $1, trang_thai = 'da_thanh_toan', ngay_thanh_toan = NOW()
        WHERE id = $2
        RETURNING cuoc_hen_id
      `, [tong_tien, hoa_don_id]);

      await client.query(`
        INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich)
        VALUES ($1, $2, 'THANH_TOAN', $3, $4, $5, NOW())
      `, [hoa_don_id, tong_tien, phuong_thuc, maGiaoDich, nhan_vien_thuc_hien_id || 1]);
      const cuocHenId = hdRows[0]?.cuoc_hen_id;
      if (cuocHenId) {
        await client.query(
          `UPDATE cuoc_hen SET trang_thai_thanh_toan = 'da_thanh_toan' WHERE id = $1`,
          [cuocHenId]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async markPayOSLinkCreated(hoa_don_id: string) {
    const { rows } = await pool.query(
      `UPDATE hoa_don SET thoi_diem_tao_link_thanh_toan = NOW() WHERE id = $1 RETURNING cuoc_hen_id`,
      [hoa_don_id]
    );
    const cuocHenId = rows[0]?.cuoc_hen_id;
    if (cuocHenId) {
      await pool.query(
        `UPDATE cuoc_hen SET trang_thai_thanh_toan = 'dang_cho_thanh_toan' WHERE id = $1 AND trang_thai_thanh_toan = 'chua_thanh_toan'`,
        [cuocHenId]
      );
    }
  }

  async revertPayOSPending(hoa_don_id: string) {
    const { rows } = await pool.query(
      `SELECT cuoc_hen_id FROM hoa_don WHERE id = $1`,
      [hoa_don_id]
    );
    const cuocHenId = rows[0]?.cuoc_hen_id;
    if (cuocHenId) {
      await pool.query(
        `UPDATE cuoc_hen SET trang_thai_thanh_toan = 'chua_thanh_toan' WHERE id = $1 AND trang_thai_thanh_toan = 'dang_cho_thanh_toan'`,
        [cuocHenId]
      );
    }
  }

  async sweepPendingPaymentTimeouts(): Promise<number> {
    const { rows } = await pool.query(`
      UPDATE cuoc_hen ch
      SET trang_thai_thanh_toan = 'chua_thanh_toan'
      FROM hoa_don hd
      WHERE hd.cuoc_hen_id = ch.id
        AND ch.trang_thai_thanh_toan = 'dang_cho_thanh_toan'
        AND hd.trang_thai != 'da_thanh_toan'
        AND hd.thoi_diem_tao_link_thanh_toan IS NOT NULL
        AND hd.thoi_diem_tao_link_thanh_toan < NOW() - INTERVAL '15 minutes'
      RETURNING ch.id
    `);
    return rows.length;
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
      SELECT id, ten_goi, muc_tieu as mo_ta, tong_so_buoi, don_gia, don_gia as gia_goi, don_gia as gia_goc,
             loai_goi, thoi_luong_phut, han_su_dung_mac_dinh_ngay,
             '[]'::json as chi_tiet_dich_vu
      FROM goi_dich_vu
      WHERE trang_thai = 'hoat_dong'
      ORDER BY ten_goi ASC
    `);
    return rows;
  }

  async getServiceById(id: string) {
    const { rows } = await pool.query('SELECT *, ten_goi as ten_dich_vu, don_gia as don_gia FROM goi_dich_vu WHERE id = $1', [id]);
    return rows[0];
  }

  async getActiveVouchers(khachHangId?: string) {
    const { rows } = await pool.query(`
      SELECT v.id, v.ma_code as ma_voucher, v.ten_chien_dich, v.ten_chien_dich as ten_khuyen_mai, v.loai_giam_gia as loai_giam,
             v.gia_tri_giam::text as gia_tri_giam,
             v.giam_toi_da::text as giam_toi_da,
             v.don_hang_toi_thieu::text as don_hang_toi_thieu,
             v.so_luong_gioi_han as so_luong_toi_da, v.ngay_het_han, v.yeu_cau_thanh_toan,
             v.tu_dong_ap_dung, v.loai_goi_ap_dung
      FROM khuyen_mai_voucher v
      LEFT JOIN hoa_don hd ON hd.voucher_id = v.id AND ($1::text IS NULL OR hd.khach_hang_id::text = $1::text) AND hd.trang_thai NOT IN ('da_huy', 'da_hoan_tien')
      WHERE v.dang_kich_hoat = true
        AND (v.ngay_bat_dau IS NULL OR v.ngay_bat_dau <= NOW())
        AND (v.ngay_het_han IS NULL OR v.ngay_het_han >= NOW())
      GROUP BY v.id, v.ma_code, v.ten_chien_dich, v.loai_giam_gia, v.gia_tri_giam, v.giam_toi_da, v.don_hang_toi_thieu, v.so_luong_gioi_han, v.ngay_het_han, v.yeu_cau_thanh_toan, v.tu_dong_ap_dung, v.loai_goi_ap_dung, v.ngay_bat_dau
      HAVING v.so_luong_gioi_han IS NULL OR $1::text IS NULL OR COUNT(hd.id) < v.so_luong_gioi_han
      ORDER BY v.tu_dong_ap_dung DESC, v.gia_tri_giam DESC
    `, [khachHangId || null]);

    return rows.map((r: any) => ({
      ...r,
      gia_tri_giam: Number(r.gia_tri_giam || 0),
      giam_toi_da: r.giam_toi_da ? Number(r.giam_toi_da) : null,
      don_hang_toi_thieu: Number(r.don_hang_toi_thieu || 0),
    }));
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT id, ma_code as ma_voucher, v.ten_chien_dich, v.ten_chien_dich as ten_khuyen_mai, loai_giam_gia as loai_giam,
             gia_tri_giam::text as gia_tri_giam,
             giam_toi_da::text as giam_toi_da,
             don_hang_toi_thieu::text as don_hang_toi_thieu,
             so_luong_gioi_han as so_luong_toi_da, ngay_bat_dau, ngay_het_han,
             dang_kich_hoat, yeu_cau_thanh_toan, tu_dong_ap_dung, loai_goi_ap_dung,
             CASE WHEN dang_kich_hoat = true THEN 'hoat_dong' ELSE 'vo_hieu' END as trang_thai
      FROM khuyen_mai_voucher v
      WHERE ma_code = $1
    `, [code]);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...r,
      gia_tri_giam: Number(r.gia_tri_giam || 0),
      giam_toi_da: r.giam_toi_da ? Number(r.giam_toi_da) : null,
      don_hang_toi_thieu: Number(r.don_hang_toi_thieu || 0),
    };
  }

  async countVoucherUsage(voucherId: string, khachHangId?: string) {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM hoa_don WHERE voucher_id = $1 AND ($2::uuid IS NULL OR khach_hang_id = $2::uuid) AND trang_thai NOT IN ('da_huy', 'da_hoan_tien')`,
      [voucherId, khachHangId || null]
    );
    return parseInt(rows[0].count || '0');
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
        phi_kham_ap_dung,
        ho_ten_khach,
        so_dien_thoai,
        ghi_chu
      } = invoiceData;

      let phacDoId = null;
      let shouldCreatePhacDo = false;
      if (item_type === 'goi' && item_id) {
        const { rows: goiRows } = await client.query('SELECT loai_goi FROM goi_dich_vu WHERE id = $1', [item_id]);
        shouldCreatePhacDo = goiRows[0]?.loai_goi === 'LIEU_TRINH';
      }

      let existingHoaDonId: string | null = null;
      let loaiLichDat = '';
      if (lich_dat_id) {
        const { rows: apptRows } = await client.query(`
          SELECT phac_do_dieu_tri_id, loai FROM cuoc_hen WHERE id = $1 FOR UPDATE
        `, [lich_dat_id]);
        if (apptRows.length > 0) {
          phacDoId = apptRows[0].phac_do_dieu_tri_id;
          loaiLichDat = (apptRows[0].loai || '').toUpperCase();
          if (loaiLichDat === 'DIEU_TRI') {
            shouldCreatePhacDo = true;
          }
        }

        const { rows: existingRows } = await client.query(`
          SELECT id FROM hoa_don WHERE cuoc_hen_id = $1 AND trang_thai = 'chua_thanh_toan'
        `, [lich_dat_id]);
        if (existingRows.length > 0) {
          existingHoaDonId = existingRows[0].id;
        }
      }

      if (shouldCreatePhacDo && !phacDoId) {
        const finalGoiDichVuId = item_type === 'goi' ? item_id : (item_id || null);
        if (finalGoiDichVuId) {
          const { rows: existingPhacDoRows } = await client.query(`
            SELECT id FROM phac_do_dieu_tri
            WHERE khach_hang_id = $1 
              AND goi_dich_vu_id = $2 
              AND trang_thai IN ('dang_dieu_tri', 'cho_kich_hoat')
            ORDER BY 
              CASE trang_thai 
                WHEN 'dang_dieu_tri' THEN 1 
                WHEN 'cho_kich_hoat' THEN 2 
                ELSE 3 
              END,
              id DESC
            FOR UPDATE
          `, [khach_hang_id, finalGoiDichVuId]);

          if (existingPhacDoRows.length > 0) {
            phacDoId = existingPhacDoRows[0].id;
          } else {
            const { rows: pdRows } = await client.query(`
              INSERT INTO phac_do_dieu_tri (
                khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat
              ) VALUES ($1, $2, $3, 0, 'cho_kich_hoat', NULL)
              RETURNING id
            `, [
              khach_hang_id,
              finalGoiDichVuId,
              item_type === 'goi' ? (so_buoi_goi || 10) : 1
            ]);
            phacDoId = pdRows[0].id;
          }

          if (lich_dat_id) {
            await client.query(`
              UPDATE chi_dinh_buoi cd
              SET phac_do_dieu_tri_id = $1
              FROM nhat_ky_buoi_dieu_tri nk
              WHERE cd.nhat_ky_id = nk.id
                AND nk.cuoc_hen_id = $2
                AND cd.goi_dich_vu_id = $3
                AND cd.phac_do_dieu_tri_id IS NULL
            `, [phacDoId, lich_dat_id, finalGoiDichVuId]);
          }

          if (lich_dat_id && loaiLichDat !== 'KHAM' && loaiLichDat !== 'KHAM_MOI') {
            await client.query('UPDATE cuoc_hen SET phac_do_dieu_tri_id = $1 WHERE id = $2', [phacDoId, lich_dat_id]);
          }
        }
      }

      const tiLePhatHuyGoi = phacDoId ? DEFAULT_CANCELLATION_PENALTY_PERCENT : null;

      let hoa_don;
      if (existingHoaDonId) {
        const { rows: hdRows } = await client.query(`
          UPDATE hoa_don SET
            phac_do_dieu_tri_id = $1,
            tong_tien_goc = $2,
            hinh_thuc_thanh_toan_goi = $3,
            so_tien_giam_voucher = $4,
            tong_tien_phai_tra = $5,
            voucher_id = $6,
            ghi_chu = $7,
            ti_le_phat_huy_goi = $8
          WHERE id = $9
          RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don,
                    CASE WHEN phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don,
                    khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc,
                    hinh_thuc_thanh_toan_goi, so_tien_giam_voucher,
                    tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ngay_tao, ghi_chu
        `, [
          phacDoId,
          tong_tien_truoc_giam || tong_tien_thanh_toan,
          loai_thanh_toan || null,
          so_tien_giam_voucher || 0,
          tong_tien_thanh_toan,
          voucher_id || null,
          ghi_chu || null,
          tiLePhatHuyGoi,
          existingHoaDonId
        ]);
        hoa_don = hdRows[0];
      } else {
        const { rows: hdRows } = await client.query(`
          INSERT INTO hoa_don (
            khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id,
            tong_tien_goc, hinh_thuc_thanh_toan_goi, so_tien_giam_voucher,
            tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ghi_chu,
            ti_le_phat_huy_goi
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'chua_thanh_toan', $8, $9, $10)
          RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don,
                    CASE WHEN phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don,
                    khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc,
                    hinh_thuc_thanh_toan_goi, so_tien_giam_voucher,
                    tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ngay_tao, ghi_chu
        `, [
          khach_hang_id,
          phacDoId,
          lich_dat_id || null,
          tong_tien_truoc_giam || tong_tien_thanh_toan,
          loai_thanh_toan || null,
          so_tien_giam_voucher || 0,
          tong_tien_thanh_toan,
          voucher_id || null,
          ghi_chu || null,
          tiLePhatHuyGoi
        ]);
        hoa_don = hdRows[0];
      }

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
    chi_tiet?: PaymentTransactionDetail,
    nhan_vien_thuc_hien_id?: number | null
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: hdRows } = await client.query(`
        UPDATE hoa_don
        SET so_tien_da_tra = $1, trang_thai = $2
        WHERE id = $3
        RETURNING cuoc_hen_id, phac_do_dieu_tri_id
      `, [da_thanh_toan_moi, trang_thai_moi, hoa_don_id]);

      const cuocHenId = hdRows[0]?.cuoc_hen_id;
      const phacDoId = hdRows[0]?.phac_do_dieu_tri_id;

      if (cuocHenId && (trang_thai_moi === 'da_thanh_toan' || da_thanh_toan_moi > 0)) {
        await client.query(`
          UPDATE cuoc_hen
          SET trang_thai_thanh_toan = $1
          WHERE id = $2
        `, [trang_thai_moi === 'da_thanh_toan' ? 'da_thanh_toan' : 'dang_cho_thanh_toan', cuocHenId]);
      }

      if (phacDoId) {
        if (trang_thai_moi === 'da_thanh_toan' || da_thanh_toan_moi > 0 || trang_thai_moi === 'dang_tra_tung_buoi') {
          await client.query(`
            UPDATE phac_do_dieu_tri
            SET trang_thai = 'dang_dieu_tri', ngay_kich_hoat = COALESCE(ngay_kich_hoat, NOW())
            WHERE id = $1 AND trang_thai = 'cho_kich_hoat'
          `, [phacDoId]);
        }

        const { rows: pdInfo } = await client.query(
          'SELECT pd.tong_so_buoi, hd.tong_tien_phai_tra, hd.hinh_thuc_thanh_toan_goi FROM hoa_don hd JOIN phac_do_dieu_tri pd ON pd.id = hd.phac_do_dieu_tri_id WHERE hd.id = $1',
          [hoa_don_id]
        );
        if (pdInfo.length > 0) {
          const { tong_so_buoi, tong_tien_phai_tra, hinh_thuc_thanh_toan_goi } = pdInfo[0];
          if (hinh_thuc_thanh_toan_goi === 'tra_thang' && (trang_thai_moi === 'da_thanh_toan' || da_thanh_toan_moi >= Number(tong_tien_phai_tra))) {
            await client.query(
              "UPDATE cuoc_hen SET trang_thai_thanh_toan = 'da_thanh_toan' WHERE phac_do_dieu_tri_id = $1",
              [phacDoId]
            );
          } else if (hinh_thuc_thanh_toan_goi === 'tung_buoi') {
            const totalSessions = Number(tong_so_buoi || 10);
            const totalAmount = Number(tong_tien_phai_tra || 0);
            const perSession = totalSessions > 0 ? Math.round(totalAmount / totalSessions) : totalAmount;
            const paidSessionsCount = perSession > 0 ? Math.min(totalSessions, Math.floor(da_thanh_toan_moi / perSession)) : 0;

            if (paidSessionsCount > 0) {
              await client.query(
                "UPDATE cuoc_hen SET trang_thai_thanh_toan = 'da_thanh_toan' WHERE phac_do_dieu_tri_id = $1 AND so_thu_tu_buoi <= $2",
                [phacDoId, paidSessionsCount]
              );
            }
            await client.query(
              "UPDATE cuoc_hen SET trang_thai_thanh_toan = 'chua_thanh_toan' WHERE phac_do_dieu_tri_id = $1 AND (so_thu_tu_buoi > $2 OR so_thu_tu_buoi IS NULL)",
              [phacDoId, paidSessionsCount]
            );
          }
        }
      }

      await client.query(`
        INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich, chi_tiet)
        VALUES ($1, $2, 'THANH_TOAN', $3, $4, $5, NOW(), $6)
      `, [hoa_don_id, so_tien_nhan, phuong_thuc, maGiaoDich, nhan_vien_thuc_hien_id || 1, chi_tiet ? JSON.stringify(chi_tiet) : null]);

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

  async getTreatmentPlanById(id: string) {
    const { rows } = await pool.query('SELECT * FROM phac_do_dieu_tri WHERE id = $1', [id]);
    return rows[0];
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
      phi_kham_ap_dung,
      ghi_chu
    } = invoiceData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (voucher_id) {
        const { rows: lockRows } = await client.query(
          'SELECT so_luong_gioi_han FROM khuyen_mai_voucher WHERE id = $1 FOR UPDATE',
          [voucher_id]
        );
        const { rows: countRows } = await client.query(
          'SELECT COUNT(*) FROM hoa_don WHERE voucher_id = $1 AND khach_hang_id = $2',
          [voucher_id, khach_hang_id]
        );
        const soLuongToiDa = lockRows[0]?.so_luong_gioi_han;
        if (soLuongToiDa !== null && soLuongToiDa !== undefined && parseInt(countRows[0].count) >= soLuongToiDa) {
          throw new Error('Mã giảm giá đã hết lượt sử dụng');
        }
      }

      const { rows } = await client.query(`
        INSERT INTO hoa_don (
          khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id,
          tong_tien_goc, hinh_thuc_thanh_toan_goi, so_tien_giam_voucher,
          tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ghi_chu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'chua_thanh_toan', $8, $9)
        RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don,
                  CASE WHEN phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don,
                  khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc,
                  hinh_thuc_thanh_toan_goi, so_tien_giam_voucher,
                  tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ngay_tao, ghi_chu
      `, [
        khach_hang_id,
        lich_dieu_tri_id,
        cuoc_hen_id || null,
        tong_tien_truoc_giam || tong_tien_thanh_toan,
        loai_thanh_toan || null,
        so_tien_giam_voucher || 0,
        tong_tien_thanh_toan,
        voucher_id || null,
        ghi_chu || null
      ]);

      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getTreatmentPlanBySessionId(sessionId: string) {
    const { rows } = await pool.query('SELECT phac_do_dieu_tri_id FROM cuoc_hen WHERE id = $1', [sessionId]);
    return rows[0] ? rows[0].phac_do_dieu_tri_id : null;
  }

  async getAppointmentBillingInfo(id: string) {
    const { rows } = await pool.query(`
      SELECT 
        ch.id, 
        (
          SELECT hd.ngay_tao 
          FROM hoa_don hd 
          WHERE hd.cuoc_hen_id = ch.id AND hd.trang_thai = 'da_thanh_toan' 
          LIMIT 1
        ) as ngay_thanh_toan_kham,
        (
          SELECT hd.tong_tien_phai_tra 
          FROM hoa_don hd 
          WHERE hd.cuoc_hen_id = ch.id AND hd.trang_thai = 'da_thanh_toan' 
          LIMIT 1
        ) as so_tien_da_thanh_toan_kham,
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
            WHERE nk.cuoc_hen_id = ch.id AND recommended_g.loai_goi IN ('LIEU_TRINH', 'LE')
            LIMIT 1
          ),
          ch.phac_do_dieu_tri_id
        ) as khuyen_nghi_goi_id,
        (
          SELECT recommended_g.loai_goi
          FROM nhat_ky_buoi_dieu_tri nk
          JOIN chi_dinh_buoi cdb ON cdb.nhat_ky_id = nk.id
          JOIN goi_dich_vu recommended_g ON cdb.goi_dich_vu_id = recommended_g.id
          WHERE nk.cuoc_hen_id = ch.id AND recommended_g.loai_goi IN ('LIEU_TRINH', 'LE')
          LIMIT 1
        ) as khuyen_nghi_loai_goi,
        (
          SELECT recommended_g.ten_goi
          FROM nhat_ky_buoi_dieu_tri nk
          JOIN chi_dinh_buoi cdb ON cdb.nhat_ky_id = nk.id
          JOIN goi_dich_vu recommended_g ON cdb.goi_dich_vu_id = recommended_g.id
          WHERE nk.cuoc_hen_id = ch.id AND recommended_g.loai_goi IN ('LIEU_TRINH', 'LE')
          LIMIT 1
        ) as khuyen_nghi_ten_goi,
        pd.goi_dich_vu_id as pd_goi_dich_vu_id,
        pd.tong_so_buoi as pd_tong_so_buoi,
        pd.trang_thai as pd_trang_thai,
        gpd.ten_goi as pd_ten_goi,
        gpd.don_gia_theo_buoi as pd_don_gia_theo_buoi,
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

  async getBillingInfoByPackage(customerId: string, packageId: string) {
    if (!customerId || customerId === 'undefined' || customerId === 'null' || !packageId || packageId === 'undefined' || packageId === 'null') {
      return null;
    }
    const { rows: custRows } = await pool.query(`
      SELECT id as khach_hang_id, ho_ten as ten_khach_hang, so_dien_thoai as sdt_khach_hang
      FROM khach_hang WHERE id = $1
    `, [customerId]);
    if (custRows.length === 0) return null;
    const customer = custRows[0];

    const { rows: pkgRows } = await pool.query(`
      SELECT id, ten_goi, loai_goi FROM goi_dich_vu WHERE id = $1
    `, [packageId]);
    if (pkgRows.length === 0) return null;
    const pkg = pkgRows[0];

    const { rows: examRows } = await pool.query(`
      SELECT hd.ngay_tao as ngay_thanh_toan_kham, hd.tong_tien_phai_tra as so_tien_da_thanh_toan_kham
      FROM hoa_don hd
      WHERE hd.khach_hang_id = $1 
        AND hd.trang_thai = 'da_thanh_toan' 
        AND hd.cuoc_hen_id IS NOT NULL 
        AND hd.cuoc_hen_id IN (SELECT id FROM cuoc_hen WHERE loai IN ('KHAM', 'KHAM_MOI'))
      ORDER BY hd.ngay_tao DESC LIMIT 1
    `, [customerId]);
    const examInfo = examRows[0] || {};

    const { rows: pdRows } = await pool.query(`
      SELECT pd.id as phac_do_dieu_tri_id, pd.tong_so_buoi as pd_tong_so_buoi, pd.trang_thai as pd_trang_thai,
             hd.id as hoa_don_goi_id, hd.so_tien_da_tra as so_tien_da_tra_goi, hd.tong_tien_phai_tra as tong_tien_phai_tra_goi,
             hd.hinh_thuc_thanh_toan_goi
      FROM phac_do_dieu_tri pd
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1 AND pd.goi_dich_vu_id = $2
      ORDER BY pd.ngay_kich_hoat DESC LIMIT 1
    `, [customerId, packageId]);
    const pdInfo = pdRows[0] || {};

    let soThuTuBuoi = 1;
    if (pdInfo.phac_do_dieu_tri_id) {
      const { rows: countRows } = await pool.query(`
        SELECT COUNT(*)::int as so_buoi_da_dung
        FROM cuoc_hen
        WHERE phac_do_dieu_tri_id = $1
          AND (
            trang_thai = 'hoan_thanh'
            OR (trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat') AND $2 = 'tra_thang')
          )
          AND loai = 'DIEU_TRI'
      `, [pdInfo.phac_do_dieu_tri_id, pdInfo.hinh_thuc_thanh_toan_goi]);
      soThuTuBuoi = countRows[0]?.so_buoi_da_dung || 1;
    }

    return {
      id: null,
      ngay_thanh_toan_kham: examInfo.ngay_thanh_toan_kham || null,
      so_tien_da_thanh_toan_kham: examInfo.so_tien_da_thanh_toan_kham ? Number(examInfo.so_tien_da_thanh_toan_kham) : 0,
      ma_lich_dat: null,
      ngay_gio_bat_dau: null,
      ngay_gio_ket_thuc: null,
      trang_thai: null,
      phac_do_dieu_tri_id: pdInfo.phac_do_dieu_tri_id || null,
      so_thu_tu_buoi: soThuTuBuoi,
      goi_dich_vu_id: null,
      loai_lich: 'dieu_tri',
      khach_hang_id: customer.khach_hang_id,
      ten_khach_hang: customer.ten_khach_hang,
      sdt_khach_hang: customer.sdt_khach_hang,
      ten_dich_vu: null,
      don_gia_dich_vu: 0,
      khuyen_nghi_goi_id: pkg.id,
      khuyen_nghi_loai_goi: pkg.loai_goi,
      khuyen_nghi_ten_goi: pkg.ten_goi,
      pd_goi_dich_vu_id: pkg.id,
      pd_tong_so_buoi: pdInfo.pd_tong_so_buoi || null,
      pd_trang_thai: pdInfo.pd_trang_thai || null,
      pd_ten_goi: pkg.ten_goi,
      pd_don_gia_theo_buoi: null,
      hoa_don_goi_id: pdInfo.hoa_don_goi_id || null,
      hoa_don_goi_ma: pdInfo.hoa_don_goi_id ? `HD-${pdInfo.hoa_don_goi_id.substring(0, 6).toUpperCase()}` : null,
      trang_thai_hoa_don_goi: pdInfo.hoa_don_goi_id ? 'chua_thanh_toan' : null,
      so_tien_da_tra_goi: pdInfo.so_tien_da_tra_goi ? Number(pdInfo.so_tien_da_tra_goi) : 0,
      tong_tien_phai_tra_goi: pdInfo.tong_tien_phai_tra_goi ? Number(pdInfo.tong_tien_phai_tra_goi) : 0,
      hinh_thuc_thanh_toan_goi: pdInfo.hinh_thuc_thanh_toan_goi || null
    };
  }

  async getPaidInvoiceAmountForAppointment(lich_dat_id: string): Promise<number> {
    const { rows } = await pool.query(
      "SELECT tong_tien_phai_tra FROM hoa_don WHERE cuoc_hen_id = $1 AND trang_thai = 'da_thanh_toan' LIMIT 1",
      [lich_dat_id]
    );
    return rows[0] ? Number(rows[0].tong_tien_phai_tra) : 0;
  }

  async getPrescriptionQuote(cuocHenId: string, goiDichVuId: string) {
    const { rows } = await pool.query(`
      SELECT
        cdb.tong_so_buoi_tu_van,
        cdb.don_gia_tu_van,
        g.tong_so_buoi AS tong_so_buoi_hien_tai,
        g.don_gia      AS don_gia_hien_tai
      FROM chi_dinh_buoi cdb
      JOIN nhat_ky_buoi_dieu_tri nk ON cdb.nhat_ky_id = nk.id
      JOIN goi_dich_vu g ON g.id = cdb.goi_dich_vu_id
      WHERE nk.cuoc_hen_id = $1
        AND cdb.goi_dich_vu_id = $2
        AND cdb.tong_so_buoi_tu_van IS NOT NULL
        AND cdb.don_gia_tu_van IS NOT NULL
      LIMIT 1
    `, [cuocHenId, goiDichVuId]);

    const row = rows[0];
    if (!row) return null;

    return {
      tong_so_buoi_tu_van: Number(row.tong_so_buoi_tu_van),
      don_gia_tu_van: Number(row.don_gia_tu_van),
      tong_so_buoi_hien_tai: Number(row.tong_so_buoi_hien_tai),
      don_gia_hien_tai: Number(row.don_gia_hien_tai),
    };
  }

  async getInvoiceByUuidPrefix(prefix: string) {
    const { rows } = await pool.query(
      "SELECT id, tong_tien_phai_tra, trang_thai FROM hoa_don WHERE id::text LIKE $1 AND trang_thai = 'chua_thanh_toan' LIMIT 1",
      [`${prefix}%`]
    );
    return rows[0] || null;
  }

  async checkPackagePayment(customerId: string, packageId: string) {
    const gdvRes = await pool.query('SELECT loai_goi FROM goi_dich_vu WHERE id = $1', [packageId]);
    if (gdvRes.rows.length > 0 && gdvRes.rows[0].loai_goi === 'LE') {
      return { paid: true };
    }

    const { rows } = await pool.query(`
      SELECT hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.hinh_thuc_thanh_toan_goi, hd.trang_thai, pd.tong_so_buoi,
             hd.tong_tien_goc, hd.so_tien_giam_voucher,
             (
               SELECT COUNT(*)::int
               FROM cuoc_hen
               WHERE phac_do_dieu_tri_id = pd.id AND loai = 'DIEU_TRI'
             ) as so_buoi_da_dat
      FROM phac_do_dieu_tri pd
      JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1 AND pd.goi_dich_vu_id = $2
      ORDER BY hd.ngay_tao DESC LIMIT 1
    `, [customerId, packageId]);

    if (rows.length === 0) {
      return { paid: false, message: 'Chưa thanh toán/đăng ký gói trị liệu này.' };
    }

    const invoice = rows[0];
    const daTra = Number(invoice.so_tien_da_tra || 0);
    const phaiTra = Number(invoice.tong_tien_phai_tra || 0);
    const tongBuoi = Number(invoice.tong_so_buoi || 1);
    const daDat = Number(invoice.so_buoi_da_dat || 0);
    const hinhThuc = invoice.hinh_thuc_thanh_toan_goi || 'mot_lan';

    if (invoice.trang_thai === 'da_thanh_toan' || (phaiTra > 0 && daTra >= phaiTra)) {
      return { paid: true, invoice };
    }

    if (hinhThuc === 'tra_theo_buoi') {
      const donGiaBuoi = tongBuoi > 0 ? Math.round(phaiTra / tongBuoi) : 0;
      const soBuoiDaDuTien = donGiaBuoi > 0 ? Math.floor(daTra / donGiaBuoi) : 0;
      if (daDat < soBuoiDaDuTien) {
        return { paid: true, invoice };
      }
    }

    return {
      paid: false,
      invoice,
      message: 'Gói liệu trình chưa được thanh toán đủ để đặt buổi tiếp theo. Vui lòng thanh toán tại quầy lễ tân.'
    };
  }

  async getCustomerNameById(customerId: string): Promise<string> {
    const { rows } = await pool.query('SELECT ho_ten FROM khach_hang WHERE id = $1', [customerId]);
    return rows[0]?.ho_ten || '';
  }
}

export default new ReceptionistBillingRepository();
