import receptionistRepository from '../repositories/receptionist';
import { pool } from '../config/db';
import {
  describePaymentTransaction,
  getMinPaymentRequired,
  getTungBuoiSessionDue,
} from '../domain/billing';
import { HinhThucThanhToanGoi, LoaiGoi } from '../domain/types';
import { sendPaymentReceiptEmail } from '../utils/mailer';
import { BadRequestError, NotFoundError } from '../utils/appError';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  tra_thang: 'Trả thẳng 100%',
  tung_buoi: 'Trả từng buổi',
};

/**
 * BILLING & PAYMENT SERVICE (Phân hệ Tài chính, Hóa đơn, Thanh toán & Mã giảm giá)
 * 
 * Chịu trách nhiệm toàn bộ về:
 * 1. Tính toán giá tiền dịch vụ / gói liệu trình / buổi lượng giá (`calculateBilling`).
 * 2. Xác thực và áp dụng mã giảm giá Voucher (`assertVoucherUsable`, `applyVoucher`).
 * 3. Tạo hóa đơn thanh toán trực tiếp / từ phác đồ chỉ định (`createBillingDirect`, `createBillingFromAppointment`).
 * 4. Xử lý thanh toán tiền mặt & PayOS (`processPayment`, `getRequiredPaymentAmount`).
 * 5. Tự động gửi email biên lai thanh toán (`sendPaymentReceiptEmail`).
 */
export class BillingService {
  async createBillingFromAppointment(lich_dat_id: string) {
    const lich = await receptionistRepository.getAppointmentForBilling(lich_dat_id);
    if (!lich) throw new NotFoundError('Lịch hẹn không hợp lệ hoặc chưa hoàn thành');

    const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;
    const result = await receptionistRepository.createBilling(maHoaDon, lich.khach_hang_id, lich_dat_id, lich.don_gia, lich.goi_dich_vu_id);
    
    const { hoa_don } = result;
    return hoa_don;
  }

  async calculateBilling(data: any) {
    let { item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id, khach_hang_id } = data;
    const giuTheoTuVan = data.giu_theo_tu_van !== false;

    // Resolve item_id if booking session is for a service/package and not provided
    if (lich_dat_id && !item_id && !data.goi_id && !data.goi_dich_vu_id) {
      const { rows: apptRows } = await pool.query(
        'SELECT goi_dich_vu_id FROM cuoc_hen WHERE id = $1',
        [lich_dat_id]
      );
      if (apptRows.length > 0 && apptRows[0].goi_dich_vu_id) {
        item_type = 'dich_vu';
        item_id = apptRows[0].goi_dich_vu_id;
      }
    }

    // Backward compatibility for old frontend payloads
    if (!item_type) {
      if (data.goi_id || data.goi_dich_vu_id) {
        item_type = 'goi';
        item_id = data.goi_id || data.goi_dich_vu_id;
      } else {
        item_type = 'dich_vu';
        item_id = null;
      }
    }

    let gia_goc_goi = 0;
    let ten_item = '';
    let so_buoi_goi = 1;
    let don_gia_theo_buoi = 0;
    let svc: any = null;

    let canh_bao_lech_cau_hinh: {
      tu_van: { tong_so_buoi: number; don_gia: number };
      hien_tai: { tong_so_buoi: number; don_gia: number };
      dang_ap_dung: 'tu_van' | 'hien_tai';
    } | null = null;

    if (item_type === 'goi') {
      const pkg = await receptionistRepository.getPackageById(item_id);
      if (!pkg) throw new NotFoundError('Không tìm thấy gói dịch vụ');
      gia_goc_goi = Number(pkg.gia_goi);
      ten_item = pkg.ten_goi;
      so_buoi_goi = pkg.tong_so_buoi;
      don_gia_theo_buoi = Number(pkg.don_gia_theo_buoi || 0);

      // Gói đến từ chỉ định của chuyên viên PHCN: đối chiếu snapshot lúc tư vấn với cấu hình đang sống
      if (lich_dat_id) {
        const quote = await receptionistRepository.getPrescriptionQuote(lich_dat_id, item_id);
        if (
          quote &&
          (quote.tong_so_buoi_tu_van !== quote.tong_so_buoi_hien_tai ||
            quote.don_gia_tu_van !== quote.don_gia_hien_tai)
        ) {
          canh_bao_lech_cau_hinh = {
            tu_van: { tong_so_buoi: quote.tong_so_buoi_tu_van, don_gia: quote.don_gia_tu_van },
            hien_tai: { tong_so_buoi: quote.tong_so_buoi_hien_tai, don_gia: quote.don_gia_hien_tai },
            dang_ap_dung: giuTheoTuVan ? 'tu_van' : 'hien_tai',
          };

          if (giuTheoTuVan) {
            gia_goc_goi = quote.don_gia_tu_van;
            so_buoi_goi = quote.tong_so_buoi_tu_van;
            don_gia_theo_buoi = so_buoi_goi > 0 ? Math.round(gia_goc_goi / so_buoi_goi) : 0;
          }
        }
      }
    } else if (item_type === 'dich_vu') {
      svc = item_id ? await receptionistRepository.getServiceById(item_id) : null;
      if (!svc) {
        const pkgs = await receptionistRepository.getActivePackages();
        svc = pkgs.find((p: any) => p.loai_goi === 'KHAM') || null;
      }
      if (svc) {
        gia_goc_goi = Number(svc.don_gia || svc.gia_goi || 0);
        ten_item = svc.ten_dich_vu || svc.ten_goi || 'Buổi Lượng Giá PHCN (Chuyên sâu)';
      } else {
        gia_goc_goi = 0;
        ten_item = 'Dịch vụ PHCN';
      }
    } else {
      throw new BadRequestError('Loại vật phẩm thanh toán không hợp lệ');
    }

    const so_tien_giam_phuong_thuc = 0;

    // 2. Calculate manual voucher discount on package price only
    let voucher_id: string | null = null;
    let so_tien_giam_voucher = 0;

    if (ma_voucher) {
      try {
        const voucher = await receptionistRepository.getVoucherByCode(ma_voucher);
        let currentLoaiGoi: 'KHAM' | 'LE' | 'LIEU_TRINH' = 'KHAM';
        if (item_type === 'goi' || item_type === 'dich_vu') {
          if (item_id) {
            const pkg = await receptionistRepository.getPackageById(item_id);
            currentLoaiGoi = pkg?.loai_goi === 'LE' ? 'LE' : (pkg?.loai_goi === 'LIEU_TRINH' ? 'LIEU_TRINH' : 'KHAM');
          } else if (svc) {
            currentLoaiGoi = svc.loai_goi === 'LE' ? 'LE' : (svc.loai_goi === 'LIEU_TRINH' ? 'LIEU_TRINH' : 'KHAM');
          }
        }
        await this.assertVoucherUsable(voucher, loai_thanh_toan, khach_hang_id, 'tai_quay', currentLoaiGoi);

        // Check minimum order value
        if (gia_goc_goi < Number(voucher.don_hang_toi_thieu)) {
          throw new BadRequestError(`Đơn hàng chưa đạt giá trị tối thiểu (${Number(voucher.don_hang_toi_thieu).toLocaleString()}đ) để áp dụng mã này`);
        }

        // Calculate voucher discount on original package price
        if (voucher.loai_giam === 'phan_tram' || voucher.loai_giam === 'percentage') {
          so_tien_giam_voucher = Math.round(gia_goc_goi * (Number(voucher.gia_tri_giam) / 100));
          if (voucher.giam_toi_da && so_tien_giam_voucher > Number(voucher.giam_toi_da)) {
            so_tien_giam_voucher = Number(voucher.giam_toi_da);
          }
        } else {
          so_tien_giam_voucher = Number(voucher.gia_tri_giam);
        }

        // Ensure discount does not exceed package price
        if (so_tien_giam_voucher > gia_goc_goi) {
          so_tien_giam_voucher = gia_goc_goi;
        }

        voucher_id = voucher.id;
      } catch (voucherErr) {
        // Voucher không hợp lệ hoặc đã dùng hết lượt -> Bỏ qua không áp dụng voucher, không chặn tính tiền
        voucher_id = null;
        so_tien_giam_voucher = 0;
      }
    }

    const tong_tien_goi_sau_giam = Math.max(0, gia_goc_goi - so_tien_giam_phuong_thuc - so_tien_giam_voucher);

    const chi_phi_kham = 0;
    const giam_tru_kham_truoc_do = 0;
    const mien_phi_kham_chua_dong = 0;
    const ngay_thanh_toan_kham_str = '';
    const ma_hoa_don_kham_str = '';
    const ngay_kham_str = '';

    const gia_goc = gia_goc_goi;
    const tong_tien_thanh_toan = tong_tien_goi_sau_giam;

    let so_tien_dot_1 = tong_tien_thanh_toan;
    let so_tien_dot_2 = 0;

    if (item_type === 'goi') {
      if (loai_thanh_toan === 'tung_buoi') {
        so_tien_dot_1 = 0;
        so_tien_dot_2 = tong_tien_goi_sau_giam;
      }
      don_gia_theo_buoi = Math.round(tong_tien_goi_sau_giam / so_buoi_goi);
    }

    return {
      gia_goc,
      gia_goc_goi,
      tong_tien_goi_sau_giam,
      ten_item,
      so_buoi_goi,
      voucher_id,
      so_tien_giam_voucher,
      uu_dai_thanh_toan_id: null,
      so_tien_giam_phuong_thuc,
      tong_tien_thanh_toan,
      so_tien_dot_1,
      so_tien_dot_2,
      loai_thanh_toan,
      chi_phi_kham,
      giam_tru_kham_truoc_do,
      mien_phi_kham_chua_dong,
      don_gia_theo_buoi,
      ngay_thanh_toan_kham: ngay_thanh_toan_kham_str,
      ma_hoa_don_kham: ma_hoa_don_kham_str,
      ngay_kham: ngay_kham_str,
      canh_bao_lech_cau_hinh
    };
  }

  async assertVoucherUsable(
    voucher: any,
    loai_thanh_toan?: string,
    khach_hang_id?: string,
    kenh?: 'online' | 'tai_quay',
    loai_goi?: 'KHAM' | 'LE' | 'LIEU_TRINH'
  ) {
    if (!voucher) {
      throw new NotFoundError('Mã giảm giá không tồn tại');
    }

    const now = new Date();
    const startDate = new Date(voucher.ngay_bat_dau);
    const endDate = voucher.ngay_het_han ? new Date(voucher.ngay_het_han) : null;
    if (now < startDate || (endDate && now > endDate)) {
      throw new BadRequestError('Mã giảm giá đã hết hạn hoặc chưa được kích hoạt');
    }

    if (voucher.so_luong_toi_da !== null && khach_hang_id) {
      const usageCount = await receptionistRepository.countVoucherUsage(voucher.id, khach_hang_id);
      if (usageCount >= voucher.so_luong_toi_da) {
        throw new BadRequestError('Bạn đã dùng hết lượt sử dụng mã giảm giá này');
      }
    }

    const normalizeArr = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed.map(String);
          } catch {}
        }
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          return trimmed
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);
        }
        return [trimmed];
      }
      return [String(val)];
    };

    const yeuCauThanhToan = normalizeArr(voucher.yeu_cau_thanh_toan);
    const hasPaymentRestriction = yeuCauThanhToan.length > 0 && !yeuCauThanhToan.includes('tat_ca');
    if (hasPaymentRestriction && loai_goi === 'LIEU_TRINH' && (!loai_thanh_toan || !yeuCauThanhToan.includes(loai_thanh_toan))) {
      const labels = yeuCauThanhToan.map((v) => PAYMENT_METHOD_LABELS[v] || v).join(', ');
      throw new BadRequestError(`Mã giảm giá này chỉ áp dụng cho hình thức thanh toán gói: ${labels}`);
    }

    const loaiGoiApDung = normalizeArr(voucher.loai_goi_ap_dung);
    const hasLoaiGoiRestriction = loaiGoiApDung.length > 0 && !loaiGoiApDung.includes('tat_ca');
    if (hasLoaiGoiRestriction && loai_goi && !loaiGoiApDung.includes(loai_goi)) {
      const goiLabel = loaiGoiApDung.map(l => l === 'LIEU_TRINH' ? 'Gói liệu trình' : l === 'KHAM' ? 'Buổi lượng giá/Khám' : l === 'LE' ? 'Dịch vụ lẻ' : l).join(', ');
      throw new BadRequestError(`Mã giảm giá này chỉ áp dụng cho loại dịch vụ: ${goiLabel}`);
    }
  }

  async getActiveVouchers(khach_hang_id?: string) {
    return receptionistRepository.getActiveVouchers(khach_hang_id);
  }

  async applyVoucher(ma_voucher: string, loai_thanh_toan?: string, khach_hang_id?: string, kenh?: 'online' | 'tai_quay', loai_goi?: 'KHAM' | 'LE' | 'LIEU_TRINH') {
    const voucher = await receptionistRepository.getVoucherByCode(ma_voucher);
    await this.assertVoucherUsable(voucher, loai_thanh_toan, khach_hang_id, kenh, loai_goi);
    return voucher;
  }

  async snapshotTreatmentPlanExpiry(treatmentPlanId: string) {
    const ldt = await receptionistRepository.getTreatmentPlanById(treatmentPlanId);
    if (!ldt) return;

    const { rows: pkgRows } = await pool.query(
      'SELECT han_su_dung_mac_dinh_ngay FROM goi_dich_vu WHERE id = $1',
      [ldt.goi_dich_vu_id]
    );
    const soNgayHieuLuc = pkgRows[0]?.han_su_dung_mac_dinh_ngay;
    if (soNgayHieuLuc) {
      await pool.query(
        `UPDATE phac_do_dieu_tri
         SET han_su_dung = CURRENT_DATE + $1 * INTERVAL '1 day'
         WHERE id = $2 AND han_su_dung IS NULL`,
        [Number(soNgayHieuLuc), treatmentPlanId]
      );
    }
  }

  async createBillingDirect(data: any) {
    const { khach_hang_id, item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id, ho_ten_khach, so_dien_thoai, lich_dieu_tri_id, dang_ky_goi } = data;

    if (dang_ky_goi === false && lich_dat_id) {
      const appt = await receptionistRepository.getAppointmentWithServicePrice(lich_dat_id);
      if (!appt) throw new NotFoundError('Không tìm thấy cuộc hẹn khám');
      
      const calc = await this.calculateBilling({
        item_type: 'dich_vu',
        item_id: appt.goi_dich_vu_id,
        loai_thanh_toan: 'tra_thang',
        ma_voucher: ma_voucher || null,
        lich_dat_id: null,
        khach_hang_id: appt.khach_hang_id
      });

      const invoiceData = {
        khach_hang_id: appt.khach_hang_id,
        item_type: 'dich_vu',
        item_id: appt.goi_dich_vu_id,
        loai_thanh_toan: 'tra_thang',
        voucher_id: calc.voucher_id,
        so_tien_giam_voucher: calc.so_tien_giam_voucher,
        uu_dai_thanh_toan_id: null,
        so_tien_giam_phuong_thuc: calc.so_tien_giam_phuong_thuc,
        tong_tien_truoc_giam: calc.gia_goc,
        tong_tien_thanh_toan: calc.tong_tien_thanh_toan,
        lich_dat_id,
        ten_item: calc.ten_item,
        so_buoi_goi: 1,
        ho_ten_khach: ho_ten_khach || null,
        so_dien_thoai: so_dien_thoai || null
      };

      return receptionistRepository.createInvoiceDirect(invoiceData);
    }

    if (item_type === 'goi' && !lich_dat_id && !lich_dieu_tri_id) {
      throw new BadRequestError('Lễ tân không được phép bán gói trị liệu trực tiếp cho khách vãng lai. Gói trị liệu phải được chỉ định bởi chuyên viên sau khi lượng giá chức năng.');
    }

    let finalLdtId = lich_dieu_tri_id;

    if (!finalLdtId && lich_dat_id) {
      const resolvedLdtId = await receptionistRepository.getTreatmentPlanBySessionId(lich_dat_id);
      if (resolvedLdtId) {
        finalLdtId = resolvedLdtId;
      }
    }

    if (finalLdtId && dang_ky_goi !== false) {
      const ldt = await receptionistRepository.getTreatmentPlanById(finalLdtId);
      if (!ldt) throw new NotFoundError('Không tìm thấy lịch điều trị');

      if (['tra_thang', 'tung_buoi'].includes(loai_thanh_toan)) {
        await this.snapshotTreatmentPlanExpiry(finalLdtId);
      }

      const calc = await this.calculateBilling({
        item_type: 'goi',
        item_id: ldt.goi_dich_vu_id,
        loai_thanh_toan,
        ma_voucher,
        lich_dat_id,
        giu_theo_tu_van: data.giu_theo_tu_van,
        khach_hang_id: ldt.khach_hang_id
      });

      if (calc.so_buoi_goi > 0) {
        await pool.query(
          `UPDATE phac_do_dieu_tri
           SET tong_so_buoi = $1
           WHERE id = $2 AND so_buoi_da_dung = 0 AND tong_so_buoi <> $1`,
          [calc.so_buoi_goi, finalLdtId]
        );
      }

      const invoiceData = {
        lich_dieu_tri_id: finalLdtId,
        khach_hang_id: ldt.khach_hang_id,
        item_type: 'goi',
        tong_tien_truoc_giam: calc.gia_goc,
        so_tien_giam_voucher: calc.so_tien_giam_voucher,
        uu_dai_thanh_toan_id: calc.uu_dai_thanh_toan_id,
        so_tien_giam_phuong_thuc: calc.so_tien_giam_phuong_thuc,
        tong_tien_thanh_toan: calc.tong_tien_thanh_toan,
        loai_thanh_toan,
        voucher_id: calc.voucher_id,
        cuoc_hen_id: lich_dat_id || null,
        ghi_chu: `Gói trị liệu chỉ định từ ca khám.`
      };

      const invoice = await receptionistRepository.createInvoiceForTreatmentPlan(invoiceData);
      if (loai_thanh_toan === 'tung_buoi') {
        await receptionistRepository.updateTreatmentPlanStatus(finalLdtId, 'dang_dieu_tri');
      }
      return invoice;
    }

    const calc = await this.calculateBilling({
      item_type,
      item_id,
      loai_thanh_toan,
      ma_voucher,
      lich_dat_id,
      giu_theo_tu_van: data.giu_theo_tu_van,
      khach_hang_id
    });

    let tenKhach = ho_ten_khach;
    let sdtKhach = so_dien_thoai;

    if (!tenKhach || !sdtKhach) {
      const customer = await receptionistRepository.getCustomerContactInfo(khach_hang_id);
      if (customer) {
        if (!tenKhach) tenKhach = customer.ho_ten;
        if (!sdtKhach) sdtKhach = customer.so_dien_thoai;
      }
    }

    const invoiceData = {
      khach_hang_id,
      item_type,
      item_id,
      loai_thanh_toan,
      voucher_id: calc.voucher_id,
      so_tien_giam_voucher: calc.so_tien_giam_voucher,
      uu_dai_thanh_toan_id: calc.uu_dai_thanh_toan_id,
      so_tien_giam_phuong_thuc: calc.so_tien_giam_phuong_thuc,
      tong_tien_truoc_giam: calc.gia_goc,
      tong_tien_thanh_toan: calc.tong_tien_thanh_toan,
      lich_dat_id,
      ten_item: calc.ten_item,
      so_buoi_goi: calc.so_buoi_goi,
      ho_ten_khach: tenKhach,
      so_dien_thoai: sdtKhach,
      ghi_chu: null
    };

    const invoice = await receptionistRepository.createInvoiceDirect(invoiceData);
    return invoice;
  }

  async computeRequiredPayment(hd: any, so_thu_tu_buoi?: number): Promise<{ requiredAmount: number; giaGocGoi: number }> {
    const tong_tien = Number(hd.tong_tien_thanh_toan);
    const da_thanh_toan_truoc = Number(hd.da_thanh_toan);
    const loai_thanh_toan = hd.loai_thanh_toan;
    const so_buoi_goi = Number(hd.so_buoi_goi) || 1;

    const giaGocGoi = Number(hd.tong_tien_goc);

    let requiredAmount: number;
    if (hd.trang_thai === 'chua_thanh_toan') {
      if (loai_thanh_toan === 'tung_buoi') {
        requiredAmount = 0;
      } else {
        requiredAmount = tong_tien;
      }
    } else if (loai_thanh_toan === 'tung_buoi') {
      const perSessionPrice = so_buoi_goi > 0 ? Math.round(tong_tien / so_buoi_goi) : tong_tien;
      const soBuoiThuTu = Number(so_thu_tu_buoi) || (perSessionPrice > 0 ? Math.floor(da_thanh_toan_truoc / perSessionPrice) + 1 : 1);
      requiredAmount = getTungBuoiSessionDue(tong_tien, so_buoi_goi, soBuoiThuTu, da_thanh_toan_truoc);
    } else {
      requiredAmount = tong_tien - da_thanh_toan_truoc;
    }

    return { requiredAmount, giaGocGoi };
  }

  async markPayOSLinkCreated(hoa_don_id: string) {
    return receptionistRepository.markPayOSLinkCreated(hoa_don_id);
  }

  async revertPayOSPending(hoa_don_id: string) {
    return receptionistRepository.revertPayOSPending(hoa_don_id);
  }

  async processPayment(data: any) {
    const { hoa_don_id, phuong_thuc, so_tien_nhan, so_thu_tu_buoi, nhan_vien_thuc_hien_id } = data;
    const hd = await receptionistRepository.getInvoiceById(hoa_don_id);
    if (!hd) throw new NotFoundError('Không tìm thấy hóa đơn');

    const tong_tien = Number(hd.tong_tien_thanh_toan);
    const da_thanh_toan_truoc = Number(hd.da_thanh_toan);
    const tien_nhan = Number(so_tien_nhan);
    const loai_thanh_toan = hd.loai_thanh_toan;
    const so_buoi_goi = Number(hd.so_buoi_goi) || 1;

    let da_thanh_toan_moi = 0;
    let trang_thai_moi = '';
    const loaiHoaDonForDetail: LoaiGoi | null = hd.phac_do_dieu_tri_id ? 'LIEU_TRINH' : null;
    let chiTiet: ReturnType<typeof describePaymentTransaction> | null = null;

    const { requiredAmount: requiredDot1 } = await this.computeRequiredPayment(hd, so_thu_tu_buoi);

    if (hd.trang_thai === 'chua_thanh_toan') {
      if (loai_thanh_toan === 'tung_buoi') {
        if (tien_nhan < requiredDot1) {
          throw new BadRequestError(`Số tiền nhận không đủ cho buổi khám lâm sàng (tối thiểu ${requiredDot1.toLocaleString()}đ)`);
        }

        if (tien_nhan >= tong_tien) {
          da_thanh_toan_moi = tong_tien;
          trang_thai_moi = 'da_thanh_toan';
          chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: 'tung_buoi', dot: 'tron_goi' });
        } else {
          da_thanh_toan_moi = 0;
          trang_thai_moi = 'dang_tra_tung_buoi';
          chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: 'tung_buoi', dot: 'phi_kham' });
        }
      } else {
        if (tien_nhan < tong_tien) {
          throw new BadRequestError(`Số tiền nhận không đủ (yêu cầu ${tong_tien.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = tong_tien;
        trang_thai_moi = 'da_thanh_toan';
        chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: loai_thanh_toan || null, dot: 'tron_goi' });
      }
    } else {
      if (loai_thanh_toan === 'tung_buoi') {
        const requiredAmount = requiredDot1;
        if (tien_nhan < requiredAmount) {
          throw new BadRequestError(`Số tiền nhận không đủ thanh toán cho buổi tiếp theo (yêu cầu tối thiểu ${requiredAmount.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = da_thanh_toan_truoc + requiredAmount;
        trang_thai_moi = da_thanh_toan_moi >= tong_tien ? 'da_thanh_toan' : 'dang_tra_tung_buoi';
        const perSessionPrice = so_buoi_goi > 0 ? Math.round(tong_tien / so_buoi_goi) : tong_tien;
        const soBuoiThuTu = Number(so_thu_tu_buoi) || (perSessionPrice > 0 ? Math.floor(da_thanh_toan_truoc / perSessionPrice) + 1 : 1);
        chiTiet = describePaymentTransaction({
          loaiHoaDon: loaiHoaDonForDetail,
          hinhThuc: 'tung_buoi',
          dot: 'buoi_le',
          soBuoiThuTu,
          tongSoBuoi: so_buoi_goi,
        });
      } else {
        const remaining = requiredDot1;
        if (tien_nhan < remaining) {
          throw new BadRequestError(`Số tiền nhận không đủ thanh toán nợ (yêu cầu ${remaining.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = da_thanh_toan_truoc + remaining;
        trang_thai_moi = 'da_thanh_toan';
        chiTiet = describePaymentTransaction({
          loaiHoaDon: loaiHoaDonForDetail,
          hinhThuc: loai_thanh_toan || null,
          dot: 'con_lai',
        });
      }
    }

    const actualPaymentAmount = da_thanh_toan_moi - da_thanh_toan_truoc;
    const maGiaoDich = `GD${Math.floor(10000000 + Math.random() * 90000000)}`;

    await receptionistRepository.processPaymentPartial(
      hoa_don_id,
      maGiaoDich,
      actualPaymentAmount,
      da_thanh_toan_moi,
      trang_thai_moi,
      phuong_thuc,
      chiTiet || undefined,
      nhan_vien_thuc_hien_id || null
    );

    if (hd.lich_dieu_tri_id && da_thanh_toan_truoc === 0) {
      const statusToSet = hd.loai_hoa_don === 'dich_vu_don' ? 'da_thanh_toan' : 'dang_dieu_tri';
      if (statusToSet === 'dang_dieu_tri') {
        await this.snapshotTreatmentPlanExpiry(hd.lich_dieu_tri_id);
      }
      await receptionistRepository.updateTreatmentPlanStatus(hd.lich_dieu_tri_id, statusToSet);
    }

    if (hd.cuoc_hen_id) {
      await pool.query(`
        UPDATE cuoc_hen
        SET trang_thai_thanh_toan = 'da_thanh_toan'
        WHERE id = $1
      `, [hd.cuoc_hen_id]);
    }

    if (hd.loai_thanh_toan === 'tung_buoi' && hd.cuoc_hen_id) {
      const paidExam = await receptionistRepository.getPaidInvoiceAmountForAppointment(hd.cuoc_hen_id);
      if (paidExam === 0) {
        const examInvRes = await pool.query(`
          SELECT id, tong_tien_phai_tra
          FROM hoa_don
          WHERE cuoc_hen_id = $1
            AND phac_do_dieu_tri_id IS NULL
            AND trang_thai = 'chua_thanh_toan'
          LIMIT 1
        `, [hd.cuoc_hen_id]);

        let examInvId: string | null = null;
        let examInvAmount = 0;

        if (examInvRes.rows.length > 0) {
          const examInv = examInvRes.rows[0];
          examInvId = examInv.id;
          examInvAmount = Number(examInv.tong_tien_phai_tra);

          await pool.query(`
            UPDATE hoa_don
            SET trang_thai = 'da_thanh_toan',
                so_tien_da_tra = tong_tien_phai_tra,
                ghi_chu = $1
            WHERE id = $2
          `, [`Đã thanh toán cùng lúc với đăng ký gói trả theo từng buổi.`, examInv.id]);

          await pool.query(`
            UPDATE cuoc_hen
            SET trang_thai_thanh_toan = 'da_thanh_toan'
            WHERE id = $1
          `, [hd.cuoc_hen_id]);
        } else {
          const appt = await receptionistRepository.getAppointmentWithServicePrice(hd.cuoc_hen_id);
          const chiPhiKham = appt ? Number(appt.don_gia) : 0;
          if (chiPhiKham > 0) {
            const { rows: newExamRows } = await pool.query(`
              INSERT INTO hoa_don (khach_hang_id, cuoc_hen_id, tong_tien_goc, tong_tien_phai_tra, so_tien_da_tra, trang_thai, ghi_chu)
              VALUES ($1, $2, $3, $3, $3, 'da_thanh_toan', $4)
              RETURNING id
            `, [hd.khach_hang_id, hd.cuoc_hen_id, chiPhiKham, 'Phí khám lâm sàng — thu cùng lúc đăng ký gói trả theo từng buổi.']);
            examInvId = newExamRows[0].id;
            examInvAmount = chiPhiKham;

            await pool.query(`
              UPDATE cuoc_hen
              SET trang_thai_thanh_toan = 'da_thanh_toan'
              WHERE id = $1
            `, [hd.cuoc_hen_id]);
          }
        }

        if (examInvId && examInvAmount > 0) {
          const maGiaoDichExam = `GD${Math.floor(10000000 + Math.random() * 90000000)}`;
          const chiTietExam = describePaymentTransaction({ loaiHoaDon: 'KHAM', hinhThuc: null, dot: 'phi_kham' });
          await pool.query(`
            INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich, chi_tiet)
            VALUES ($1, $2, 'THANH_TOAN', $3, $4, 1, NOW(), $5)
          `, [examInvId, examInvAmount, phuong_thuc || 'tien_mat', maGiaoDichExam, JSON.stringify(chiTietExam)]);
        }
      }
    }

    const displayPaymentAmount = (hd.loai_thanh_toan === 'tung_buoi' && da_thanh_toan_truoc === 0 && actualPaymentAmount === 0)
      ? requiredDot1
      : actualPaymentAmount;

    // Gửi email biên lai tự động (chạy ngầm)
    (async () => {
      try {
        const customerInfo = await pool.query(`
          SELECT kh.ho_ten, kh.email,
                 COALESCE(g_pdt.ten_goi, g_ch.ten_goi, 'Dịch vụ phục hồi chức năng') AS ten_goi,
                 COALESCE(g_pdt.tong_so_buoi, g_ch.tong_so_buoi, 1) AS so_buoi
          FROM hoa_don hd
          JOIN khach_hang kh ON hd.khach_hang_id = kh.id
          LEFT JOIN phac_do_dieu_tri pdt ON hd.phac_do_dieu_tri_id = pdt.id
          LEFT JOIN goi_dich_vu g_pdt ON pdt.goi_dich_vu_id = g_pdt.id
          LEFT JOIN cuoc_hen ch ON hd.cuoc_hen_id = ch.id
          LEFT JOIN goi_dich_vu g_ch ON ch.goi_dich_vu_id = g_ch.id
          WHERE hd.id = $1
        `, [hoa_don_id]);

        if (customerInfo.rows.length > 0 && customerInfo.rows[0].email) {
          const cust = customerInfo.rows[0];
          await sendPaymentReceiptEmail({
            toEmail: cust.email,
            userName: cust.ho_ten || 'Quý khách',
            maHoaDon: hd.ma_hoa_don || `HD-${hoa_don_id.slice(0, 6).toUpperCase()}`,
            tenDichVu: cust.ten_goi || hd.ten_dich_vu || 'Dịch vụ phục hồi chức năng',
            soTienThanhToan: actualPaymentAmount || displayPaymentAmount,
            tongTienHoaDon: tong_tien,
            daThanhToan: da_thanh_toan_moi,
            conLai: Math.max(0, tong_tien - da_thanh_toan_moi),
            phuongThuc: phuong_thuc || 'tien_mat',
            hinhThucGoi: loai_thanh_toan || undefined,
            soBuoi: cust.so_buoi || undefined,
            ngayThanhToan: new Date()
          });
        }
      } catch (err) {
        console.error('Không thể gửi email biên lai thanh toán tự động:', err);
      }
    })();

    return { 
      success: true, 
      trang_thai_moi, 
      da_thanh_toan_moi,
      actualPaymentAmount: displayPaymentAmount,
      changeAmount: phuong_thuc === 'tien_mat' ? Math.max(0, tien_nhan - displayPaymentAmount) : 0
    };
  }

  async getRequiredPaymentAmount(hoa_don_id: string, so_thu_tu_buoi?: number) {
    const hd = await receptionistRepository.getInvoiceById(hoa_don_id);
    if (!hd) throw new NotFoundError('Không tìm thấy hóa đơn');
    const { requiredAmount } = await this.computeRequiredPayment(hd, so_thu_tu_buoi);
    return { hd, requiredAmount };
  }

  async getBillingInfoByPackage(customerId: string, packageId: string) {
    return receptionistRepository.getBillingInfoByPackage(customerId, packageId);
  }

  async getAppointmentBillingInfo(id: string) {
    return receptionistRepository.getAppointmentBillingInfo(id);
  }

  async checkPackagePayment(customerId: string, packageId: string) {
    return receptionistRepository.checkPackagePayment(customerId, packageId);
  }
}

export default new BillingService();
