import { pool } from '../../config/db';
import { calculatePackageCancellationRefund, DEFAULT_CANCELLATION_PENALTY_PERCENT } from '../../domain/billing';

export class AdminFinanceRepository {
  // --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ (MAPPED TO PHAC DO DIEU TRI) ---
  async getMedicalRecords() {
    await pool.query(`
      UPDATE phac_do_dieu_tri
      SET trang_thai = 'hoan_thanh', ngay_hoan_thanh = COALESCE(ngay_hoan_thanh, NOW())
      WHERE trang_thai = 'dang_dieu_tri'
        AND (
          SELECT COUNT(*)::int
          FROM cuoc_hen
          WHERE phac_do_dieu_tri_id = phac_do_dieu_tri.id
            AND (
              trang_thai = 'hoan_thanh'
              OR (
                trang_thai = 'khong_den'
                AND (SELECT hinh_thuc_thanh_toan_goi FROM hoa_don WHERE phac_do_dieu_tri_id = phac_do_dieu_tri.id LIMIT 1)
                    = 'tra_thang'
              )
            )
            AND loai = 'DIEU_TRI'
        ) >= tong_so_buoi
    `);

    const { rows: patients } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, trang_thai, ngay_sinh, gioi_tinh, dia_chi
      FROM khach_hang
      ORDER BY ho_ten ASC
    `);

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
        pd.trang_thai, pd.ngay_kich_hoat,
        g.ten_goi, g.loai_goi, g.don_gia as gia_tien,
        nk_kham.chan_doan, nk_kham.chong_chi_dinh, nk_kham.ghi_chu as ghi_chu_kham,
        nd_bs.ho_ten as ten_bac_si,
        p_kham.ten_phong as ten_phong_kham,
        ch_kham.id as cuoc_hen_id,
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
      ORDER BY pd.ngay_kich_hoat DESC
    `);

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
    `);

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
        nd.ho_ten as ten_nhan_su, nd.vai_tro_id, nd.anh_dai_dien as anh_nhan_su,
        p.ten_phong as ten_phong,
        dv.ten_goi as ten_dich_vu, dv.don_gia as gia_dich_vu,
        nk.vas_truoc, nk.vas_sau, nk.ghi_chu as ghi_chu_tri_lieu, nk.chan_doan as chan_doan_tri_lieu, nk.chong_chi_dinh as chong_chi_dinh_tri_lieu
      FROM cuoc_hen ch
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      WHERE ch.trang_thai NOT IN ('da_huy', 'huy')
      ORDER BY ch.ngay_gio_bat_dau DESC
    `);

    const results = patients.map((p: any) => {
      const patientPlans = allPlans.filter((pl: any) => pl.khach_hang_id === p.id);
      const patientApts = appointments.filter((ap: any) => ap.khach_hang_id === p.id);

      return {
        ...p,
        ma_khach_hang: 'KH-' + p.id.substring(0, 8).toUpperCase(),
        plans: patientPlans,
        appointments: patientApts
      };
    });

    return results;
  }

  // --- QUẢN LÝ TÀI CHÍNH ---
  async getInvoices() {
    const { rows } = await pool.query(`
      SELECT 
        hd.id, 
        hd.khach_hang_id, 
        hd.phac_do_dieu_tri_id, 
        hd.cuoc_hen_id, 
        hd.tong_tien_goc, 
        hd.hinh_thuc_thanh_toan_goi, 
        hd.voucher_id,
        hd.so_tien_giam_voucher,
        v.ma_code as ma_voucher_ap_dung,
        v.ten_chien_dich as ten_voucher_ap_dung,
        hd.tong_tien_phai_tra as tong_tien_thanh_toan, 
        hd.so_tien_da_tra as da_thanh_toan, 
        hd.trang_thai, 
        hd.ghi_chu,
        hd.ngay_tao, 
        COALESCE(
          (SELECT MAX(gt.ngay_giao_dich) FROM giao_dich_thanh_toan gt WHERE gt.hoa_don_id = hd.id),
          hd.ngay_tao
        ) as ngay_cap_nhat_moi_nhat,
        (
          SELECT json_agg(gt.ngay_giao_dich)
          FROM giao_dich_thanh_toan gt
          WHERE gt.hoa_don_id = hd.id
        ) as danh_sach_ngay_giao_dich,
        ch.ngay_gio_bat_dau as ngay_kham,
        ch.ngay_gio_ket_thuc as ngay_kham_ket_thuc,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don, 
        kh.ho_ten as ten_khach_hang, 
        kh.so_dien_thoai,
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
        pd.tong_so_buoi,
        pd.han_su_dung,
        pd.trang_thai as trang_thai_phac_do,
        COALESCE(gdv.loai_goi, dv.loai_goi) as loai_goi,
        COALESCE(gdv.ten_goi, dv.ten_goi, 'Phí khám lâm sàng & Lượng giá') as ten_dich_vu,
        CASE
          WHEN hd.hinh_thuc_thanh_toan_goi = 'tung_buoi' AND EXISTS (
            SELECT 1 FROM hoa_don exam_hd
            WHERE exam_hd.cuoc_hen_id = hd.cuoc_hen_id
              AND exam_hd.phac_do_dieu_tri_id IS NULL
              AND exam_hd.trang_thai = 'da_thanh_toan'
          ) THEN 0
          WHEN hd.phac_do_dieu_tri_id IS NULL THEN COALESCE(hd.tong_tien_goc, dv.don_gia, 0)
          WHEN hd.cuoc_hen_id IS NOT NULL THEN COALESCE(hd.tong_tien_goc, dv.don_gia, 0)
          ELSE 0
        END as chi_phi_kham,
        (
          SELECT 'HD-' || UPPER(SUBSTRING(sep_hd.id::text FROM 1 FOR 6))
          FROM hoa_don sep_hd
          WHERE sep_hd.cuoc_hen_id = hd.cuoc_hen_id
            AND sep_hd.phac_do_dieu_tri_id IS NULL
            AND sep_hd.trang_thai = 'da_thanh_toan'
            AND sep_hd.tong_tien_phai_tra > 0
            AND sep_hd.id != hd.id
            AND sep_hd.ngay_tao < hd.ngay_tao
          LIMIT 1
        ) as ma_hoa_don_kham_rieng,
        (
          SELECT sep_hd.ngay_tao
          FROM hoa_don sep_hd
          WHERE sep_hd.cuoc_hen_id = hd.cuoc_hen_id
            AND sep_hd.phac_do_dieu_tri_id IS NULL
            AND sep_hd.trang_thai = 'da_thanh_toan'
            AND sep_hd.tong_tien_phai_tra > 0
            AND sep_hd.id != hd.id
            AND sep_hd.ngay_tao < hd.ngay_tao
          LIMIT 1
        ) as ngay_thanh_toan_kham_rieng
      FROM hoa_don hd
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      LEFT JOIN phac_do_dieu_tri pd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
      LEFT JOIN cuoc_hen ch ON hd.cuoc_hen_id = ch.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN khuyen_mai_voucher v ON hd.voucher_id = v.id
      ORDER BY COALESCE(
        (SELECT MAX(gt.ngay_giao_dich) FROM giao_dich_thanh_toan gt WHERE gt.hoa_don_id = hd.id),
        hd.ngay_tao
      ) DESC
    `);
    return rows;
  }

  async getPayments() {
    const { rows } = await pool.query(`
      SELECT
        gt.id, gt.hoa_don_id, gt.so_tien, gt.loai_giao_dich, gt.phuong_thuc, gt.ma_tham_chieu,
        gt.ma_tham_chieu as ma_giao_dich,
        gt.ngay_giao_dich as thoi_gian_giao_dich,
        gt.chi_tiet,
        gt.nhan_vien_thuc_hien_id,
        nv.ho_ten as ten_nhan_vien_thuc_hien,
        vt.ten_vai_tro as vai_tro_nhan_vien,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don, kh.ho_ten as ten_khach_hang
      FROM giao_dich_thanh_toan gt
      JOIN hoa_don hd ON gt.hoa_don_id = hd.id
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      LEFT JOIN nguoi_dung nv ON gt.nhan_vien_thuc_hien_id = nv.id
      LEFT JOIN vai_tro vt ON nv.vai_tro_id = vt.id
      ORDER BY gt.ngay_giao_dich DESC
    `);
    return rows;
  }

  async handleRefund(id: string, ly_do: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: payments } = await client.query('SELECT * FROM giao_dich_thanh_toan WHERE id = $1', [id]);
      if (payments.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy giao dịch', code: 404 };
      }
      const originalPayment = payments[0];

      if (originalPayment.loai_giao_dich === 'HOAN_TIEN') {
        await client.query('ROLLBACK');
        return { error: 'Giao dịch này đã được hoàn tiền trước đó', code: 400 };
      }

      const { rows: existingRefunds } = await client.query(
        `SELECT id FROM giao_dich_thanh_toan
         WHERE loai_giao_dich = 'HOAN_TIEN' AND chi_tiet->>'giao_dich_goc' = $1`,
        [originalPayment.ma_tham_chieu]
      );
      if (existingRefunds.length > 0) {
        await client.query('ROLLBACK');
        return { error: 'Giao dịch này đã được hoàn tiền trước đó', code: 400 };
      }

      const maRefund = `REF${Math.floor(10000000 + Math.random() * 90000000)}`;
      const chiTietHoanTien = {
        v: 1,
        loai: 'hoan_tien_don_gian',
        giao_dich_goc: originalPayment.ma_tham_chieu,
        so_tien: Number(originalPayment.so_tien),
        ly_do,
      };
      await client.query(
        `INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich, chi_tiet)
         VALUES ($1, $2, 'HOAN_TIEN', $3, $4, $5, NOW(), $6)`,
        [
          originalPayment.hoa_don_id,
          -BigInt(originalPayment.so_tien),
          originalPayment.phuong_thuc,
          maRefund,
          originalPayment.nhan_vien_thuc_hien_id,
          JSON.stringify(chiTietHoanTien)
        ]
      );

      const { rows: invoices } = await client.query(
        'UPDATE hoa_don SET trang_thai = \'da_hoan_tien\', so_tien_da_tra = GREATEST(0, so_tien_da_tra - $1) WHERE id = $2 RETURNING *',
        [originalPayment.so_tien, originalPayment.hoa_don_id]
      );

      if (invoices[0]?.cuoc_hen_id) {
        await client.query(
          `UPDATE cuoc_hen SET trang_thai_thanh_toan = 'chua_thanh_toan' WHERE id = $1`,
          [invoices[0].cuoc_hen_id]
        );
      }

      await client.query('COMMIT');
      return { success: true, invoice: invoices[0], originalAmount: originalPayment.so_tien };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async handlePackageRefund(
    hoa_don_id: string,
    so_buoi_dung: number,
    ly_do: string,
    nhan_vien_id: number
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: hdRows } = await client.query(
        'SELECT * FROM hoa_don WHERE id = $1',
        [hoa_don_id]
      );
      if (hdRows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy hóa đơn', code: 404 };
      }
      const hd = hdRows[0];

      if (['da_hoan_tien', 'da_huy'].includes(hd.trang_thai)) {
        await client.query('ROLLBACK');
        return { error: 'Hóa đơn này đã được xử lý (hủy/hoàn tiền) trước đó', code: 400 };
      }

      let totalSessions = 10;
      let ldtId = hd.phac_do_dieu_tri_id;
      if (ldtId) {
        const { rows: pdRows } = await client.query(
          `SELECT pd.tong_so_buoi,
                  (pd.trang_thai = 'dang_dieu_tri' AND pd.han_su_dung IS NOT NULL AND pd.han_su_dung < CURRENT_DATE) as qua_han
           FROM phac_do_dieu_tri pd
           WHERE pd.id = $1`,
          [ldtId]
        );
        if (pdRows.length > 0) {
          totalSessions = pdRows[0].tong_so_buoi || 10;
          if (pdRows[0].qua_han) {
            await client.query('ROLLBACK');
            return { error: 'Gói đã quá hạn sử dụng. Vui lòng dùng thao tác "Hủy do quá hạn sử dụng" (giữ nguyên số tiền đã thu, không hoàn tiền) thay vì hủy hoàn tiền thông thường.', code: 400 };
          }
        }
      }

      const hasExam = !!hd.cuoc_hen_id;
      let chi_phi_kham = 0;
      let examAppointment: { ngay_gio_bat_dau: Date; ngay_gio_ket_thuc: Date } | null = null;
      if (hasExam && hd.cuoc_hen_id) {
        const examServiceRes = await client.query(
          `SELECT dv.don_gia, ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc
           FROM cuoc_hen ch
           JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
           WHERE ch.id = $1`,
          [hd.cuoc_hen_id]
        );
        if (examServiceRes.rows && examServiceRes.rows.length > 0) {
          examAppointment = {
            ngay_gio_bat_dau: examServiceRes.rows[0].ngay_gio_bat_dau,
            ngay_gio_ket_thuc: examServiceRes.rows[0].ngay_gio_ket_thuc,
          };
          chi_phi_kham = Number(examServiceRes.rows[0].don_gia);
        }
      }

      let hasPaidSeparateExam = false;
      let separateExamInvoice: { id: string; ngay_tao: Date } | null = null;
      if (hasExam && hd.cuoc_hen_id) {
        const separatePaidExamRes = await client.query(
          `SELECT id, ngay_tao FROM hoa_don
           WHERE cuoc_hen_id = $1
             AND phac_do_dieu_tri_id IS NULL
             AND trang_thai = 'da_thanh_toan'
             AND tong_tien_phai_tra > 0
             AND id != $2`,
          [hd.cuoc_hen_id, hoa_don_id]
        );
        if (separatePaidExamRes.rows && separatePaidExamRes.rows.length > 0) {
          hasPaidSeparateExam = true;
          separateExamInvoice = separatePaidExamRes.rows[0];
        }
      }

      const examTrace = hasExam ? {
        has_separate_invoice: hasPaidSeparateExam,
        invoice_code: separateExamInvoice ? `HD-${separateExamInvoice.id.substring(0, 6).toUpperCase()}` : null,
        invoice_date: separateExamInvoice ? separateExamInvoice.ngay_tao : null,
        appointment_date: examAppointment ? examAppointment.ngay_gio_bat_dau : null,
        appointment_end: examAppointment ? examAppointment.ngay_gio_ket_thuc : null,
      } : null;

      const tong_tien_goc = Number(hd.tong_tien_goc);
      const so_tien_da_dong = Number(hd.so_tien_da_tra);
      const gia_thanh_toan_goi = Number(hd.tong_tien_phai_tra);
      const phi_phat_percent = hd.ti_le_phat_huy_goi !== null && hd.ti_le_phat_huy_goi !== undefined
        ? Number(hd.ti_le_phat_huy_goi)
        : DEFAULT_CANCELLATION_PENALTY_PERCENT;

      const refundCalc = calculatePackageCancellationRefund({
        tongTienGoc: tong_tien_goc,
        soTienDaDong: so_tien_da_dong,
        giaThanhToanGoi: gia_thanh_toan_goi,
        soBuoiDung: so_buoi_dung,
        tongSoBuoi: totalSessions,
        chiPhiKham: chi_phi_kham,
        hasExam,
        hasPaidSeparateExam,
        phiPhatPercent: phi_phat_percent,
      });

      const chi_phi_buoi_dung = refundCalc.chiPhiBuoiDung;
      const phi_phat_thuc_te = refundCalc.phiPhatThucTe;
      const examFeeToCharge = refundCalc.examFeeToCharge;
      const so_tien_hoan_tra = refundCalc.soTienHoanTra;

      const maRefund = `REF${Math.floor(10000000 + Math.random() * 90000000)}`;
      const chiTietHoanTien = {
        v: 1,
        so_tien_da_dong,
        gia_goc_goi: refundCalc.giaGocGoi,
        gia_thanh_toan_goi: refundCalc.giaThanhToanGoi,
        chi_phi_buoi_dung,
        so_buoi_dung,
        tong_so_buoi: totalSessions,
        phi_phat_percent,
        phi_phat_thuc_te,
        exam_fee_to_charge: examFeeToCharge,
        exam_trace: examTrace,
        so_tien_hoan_tra,
        ly_do,
      };

      await client.query(
        `INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, ngay_giao_dich, nhan_vien_thuc_hien_id, chi_tiet)
         VALUES ($1, $2, 'HOAN_TIEN', 'tien_mat', $3, NOW(), $4, $5)`,
        [
          hoa_don_id,
          -BigInt(so_tien_hoan_tra),
          maRefund,
          nhan_vien_id,
          JSON.stringify(chiTietHoanTien)
        ]
      );

      const keptRevenuePackage = refundCalc.keptRevenuePackage;

      await client.query(
        `UPDATE hoa_don
         SET trang_thai = 'da_hoan_tien',
             so_tien_da_tra = $1
         WHERE id = $2`,
        [
          Math.max(0, keptRevenuePackage),
          hoa_don_id
        ]
      );

      if (ldtId) {
        await client.query(
          `UPDATE phac_do_dieu_tri
           SET trang_thai = 'huy', ngay_huy = COALESCE(ngay_huy, NOW())
           WHERE id = $1`,
          [ldtId]
        );
      }

      await client.query('COMMIT');

      const { rows: updatedHd } = await client.query('SELECT * FROM hoa_don WHERE id = $1', [hoa_don_id]);
      return { success: true, invoice: updatedHd[0], so_tien_hoan_tra };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async expirePackageNoRefund(hoa_don_id: string, ly_do: string | undefined, nhan_vien_id: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: hdRows } = await client.query('SELECT * FROM hoa_don WHERE id = $1 FOR UPDATE', [hoa_don_id]);
      if (hdRows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy hóa đơn', code: 404 };
      }
      const hd = hdRows[0];

      if (['da_hoan_tien', 'da_huy'].includes(hd.trang_thai)) {
        await client.query('ROLLBACK');
        return { error: 'Hóa đơn này đã được xử lý (hủy/hoàn tiền) trước đó', code: 400 };
      }

      if (!hd.phac_do_dieu_tri_id) {
        await client.query('ROLLBACK');
        return { error: 'Hóa đơn này không gắn với gói liệu trình nào', code: 400 };
      }

      const { rows: pdRows } = await client.query(
        `SELECT id, han_su_dung, trang_thai,
                (han_su_dung IS NOT NULL AND han_su_dung < CURRENT_DATE) as qua_han
         FROM phac_do_dieu_tri WHERE id = $1 FOR UPDATE`,
        [hd.phac_do_dieu_tri_id]
      );
      if (pdRows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy phác đồ điều trị liên kết', code: 404 };
      }
      const pd = pdRows[0];

      if (!pd.qua_han) {
        await client.query('ROLLBACK');
        return { error: 'Gói chưa quá hạn sử dụng, không thể hủy theo hình thức này.', code: 400 };
      }

      if (['hoan_thanh', 'huy'].includes(pd.trang_thai)) {
        await client.query('ROLLBACK');
        return { error: 'Phác đồ đã hoàn thành hoặc đã hủy trước đó, không thể hủy theo hình thức quá hạn sử dụng.', code: 400 };
      }

      const soTienGiuLai = Number(hd.so_tien_da_tra);
      const hanStr = new Date(pd.han_su_dung).toLocaleDateString('vi-VN');
      const { rows: nvRows } = await client.query('SELECT ho_ten FROM nguoi_dung WHERE id = $1', [nhan_vien_id]);
      const tenNhanVien = nvRows[0]?.ho_ten || `NV#${nhan_vien_id}`;
      const ghiChuMoi = `Hủy do quá hạn sử dụng gói (hạn ${hanStr}), khách không phản hồi. ${tenNhanVien} xác nhận, chốt sổ tại số tiền đã thu (${soTienGiuLai.toLocaleString('vi-VN')}đ), không hoàn/không thu thêm.${ly_do ? ` Lý do: ${ly_do}` : ''}`;

      await client.query(
        `UPDATE hoa_don
         SET trang_thai = 'da_thanh_toan',
             tong_tien_phai_tra = so_tien_da_tra,
             ghi_chu = COALESCE(ghi_chu || ' | ', '') || $1
         WHERE id = $2`,
        [ghiChuMoi, hoa_don_id]
      );

      await client.query(
        `UPDATE phac_do_dieu_tri SET trang_thai = 'huy', ngay_huy = COALESCE(ngay_huy, NOW()) WHERE id = $1`,
        [pd.id]
      );

      await client.query('COMMIT');

      const { rows: updatedHd } = await pool.query('SELECT * FROM hoa_don WHERE id = $1', [hoa_don_id]);
      return { success: true, invoice: updatedHd[0], so_tien_giu_lai: soTienGiuLai };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async sweepExpiredPackages() {
    const { rows } = await pool.query(`
      WITH newly_expired AS (
        UPDATE phac_do_dieu_tri
        SET trang_thai = 'huy', ngay_huy = NOW()
        WHERE trang_thai = 'dang_dieu_tri'
          AND han_su_dung IS NOT NULL
          AND han_su_dung < CURRENT_DATE
        RETURNING id, han_su_dung
      )
      UPDATE hoa_don hd
      SET trang_thai = 'da_thanh_toan',
          tong_tien_phai_tra = hd.so_tien_da_tra,
          ghi_chu = COALESCE(hd.ghi_chu || ' | ', '') ||
            'Hệ thống tự động hủy do quá hạn sử dụng (hạn ' || to_char(ne.han_su_dung, 'DD/MM/YYYY') ||
            '), không hoàn/không thu thêm. Chốt sổ tại số tiền đã thu (' ||
            to_char(hd.so_tien_da_tra, 'FM999,999,999') || 'đ).'
      FROM newly_expired ne
      WHERE hd.phac_do_dieu_tri_id = ne.id
        AND hd.trang_thai NOT IN ('da_hoan_tien', 'da_huy')
      RETURNING hd.id
    `);
    return rows.length;
  }

  // --- QUẢN LÝ MARKETING (VOUCHERS) ---
  async getVouchers() {
    const { rows } = await pool.query(`
      SELECT id, ma_code as ma_voucher, ten_chien_dich, loai_giam_gia as loai_giam,
             gia_tri_giam::text as gia_tri_giam,
             giam_toi_da::text as giam_toi_da,
             don_hang_toi_thieu::text as don_hang_toi_thieu,
             so_luong_gioi_han as so_luong_toi_da,
             ngay_bat_dau, ngay_het_han, dang_kich_hoat, yeu_cau_thanh_toan,
             tu_dong_ap_dung, loai_goi_ap_dung,
             CASE WHEN dang_kich_hoat = true THEN 'hoat_dong' ELSE 'tam_dung' END as trang_thai
      FROM khuyen_mai_voucher
      ORDER BY ngay_bat_dau DESC
    `);
    return rows.map((r: any) => ({
      ...r,
      gia_tri_giam: Number(r.gia_tri_giam || 0),
      giam_toi_da: r.giam_toi_da ? Number(r.giam_toi_da) : null,
      don_hang_toi_thieu: Number(r.don_hang_toi_thieu || 0),
    }));
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT id, ma_code as ma_voucher, ten_chien_dich, loai_giam_gia as loai_giam,
             gia_tri_giam::text as gia_tri_giam,
             giam_toi_da::text as giam_toi_da,
             don_hang_toi_thieu::text as don_hang_toi_thieu,
             so_luong_gioi_han as so_luong_toi_da,
             ngay_bat_dau, ngay_het_han, dang_kich_hoat, yeu_cau_thanh_toan,
             tu_dong_ap_dung, loai_goi_ap_dung,
             CASE WHEN dang_kich_hoat = true THEN 'hoat_dong' ELSE 'tam_dung' END as trang_thai
      FROM khuyen_mai_voucher
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

  async createVoucher(data: any, userId: string) {
    const isAct = data.trang_thai === 'hoat_dong' || data.trang_thai === 'kich_hoat' || data.trang_thai === true;
    const isAuto = data.tu_dong_ap_dung === true || data.tu_dong_ap_dung === 'true';
    const { rows } = await pool.query(
      `INSERT INTO khuyen_mai_voucher (ma_code, ten_chien_dich, loai_giam_gia, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han, ngay_bat_dau, ngay_het_han, dang_kich_hoat, yeu_cau_thanh_toan, tu_dong_ap_dung, loai_goi_ap_dung)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, ma_code as ma_voucher, ten_chien_dich, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, dang_kich_hoat, yeu_cau_thanh_toan, tu_dong_ap_dung, loai_goi_ap_dung`,
      [
        data.ma_voucher,
        data.ten_chien_dich || '',
        data.loai_giam,
        data.gia_tri_giam ? BigInt(data.gia_tri_giam) : BigInt(0),
        data.giam_toi_da ? BigInt(data.giam_toi_da) : null,
        data.don_hang_toi_thieu ? BigInt(data.don_hang_toi_thieu) : BigInt(0),
        data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null,
        data.ngay_bat_dau,
        data.ngay_het_han || null,
        isAct,
        data.yeu_cau_thanh_toan?.length ? data.yeu_cau_thanh_toan : ['tat_ca'],
        isAuto,
        data.loai_goi_ap_dung?.length ? data.loai_goi_ap_dung : ['tat_ca']
      ]
    );
    return rows[0];
  }

  async updateVoucher(id: string, data: any) {
    const isAct = data.trang_thai === 'hoat_dong' || data.trang_thai === 'kich_hoat' || data.trang_thai === true;
    const isAuto = data.tu_dong_ap_dung === true || data.tu_dong_ap_dung === 'true';
    const { rows } = await pool.query(
      `UPDATE khuyen_mai_voucher SET
        ma_code = $1, ten_chien_dich = $2, loai_giam_gia = $3, gia_tri_giam = $4, giam_toi_da = $5,
        don_hang_toi_thieu = $6, so_luong_gioi_han = $7,
        ngay_bat_dau = $8, ngay_het_han = $9, dang_kich_hoat = $10, yeu_cau_thanh_toan = $11,
        tu_dong_ap_dung = $12, loai_goi_ap_dung = $13
       WHERE id = $14
       RETURNING id, ma_code as ma_voucher, ten_chien_dich, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, dang_kich_hoat, yeu_cau_thanh_toan, tu_dong_ap_dung, loai_goi_ap_dung`,
      [
        data.ma_voucher,
        data.ten_chien_dich || '',
        data.loai_giam,
        data.gia_tri_giam ? BigInt(data.gia_tri_giam) : BigInt(0),
        data.giam_toi_da ? BigInt(data.giam_toi_da) : null,
        data.don_hang_toi_thieu ? BigInt(data.don_hang_toi_thieu) : BigInt(0),
        data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null,
        data.ngay_bat_dau,
        data.ngay_het_han || null,
        isAct,
        data.yeu_cau_thanh_toan?.length ? data.yeu_cau_thanh_toan : ['tat_ca'],
        isAuto,
        data.loai_goi_ap_dung?.length ? data.loai_goi_ap_dung : ['tat_ca'],
        id
      ]
    );
    return rows[0];
  }

  async deleteVoucher(id: string) {
    const { rows } = await pool.query('DELETE FROM khuyen_mai_voucher WHERE id = $1 RETURNING id', [id]);
    return rows[0];
  }
}

export default new AdminFinanceRepository();
