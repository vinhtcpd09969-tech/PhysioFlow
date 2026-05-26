import receptionistRepository from '../repositories/receptionist.repository';
import notificationService from './notification.service';


class ReceptionistService {
  async getTodayAppointments() {
    const rows = await receptionistRepository.getTodayAppointments();
    return {
      cho_xac_nhan: rows.filter(r => r.trang_thai === 'cho_xac_nhan'),
      da_xac_nhan: rows.filter(r => r.trang_thai === 'da_xac_nhan'),
      da_checkin: rows.filter(r => r.trang_thai === 'da_checkin'),
      hoan_thanh: rows.filter(r => r.trang_thai === 'hoan_thanh'),
    };
  }

  async getDashboardData() {
    const rows = await receptionistRepository.getTodayAppointments();
    const appointments = rows.map(r => {
      let frontendStatus = '';
      if (r.loai_lich === 'kham_moi') {
        if (['cho_xac_nhan', 'da_xac_nhan', 'da_checkin'].includes(r.trang_thai)) {
          frontendStatus = 'Cho khao sat';
        } else if (r.trang_thai === 'hoan_thanh') {
          frontendStatus = 'Hoan thanh';
        }
      } else {
        if (['dang_thuc_hien', 'da_checkin', 'dang_dieu_tri'].includes(r.trang_thai)) {
          frontendStatus = 'Dang dieu tri';
        } else if (r.trang_thai === 'hoan_thanh') {
          frontendStatus = 'Hoan thanh';
        }
      }

      const formatTime = (isoString: string | Date) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      };

      const start = formatTime(r.ngay_gio_bat_dau);
      const end = formatTime(r.ngay_gio_ket_thuc);
      const gio = start && end ? `${start} - ${end}` : start;

      return {
        id: r.id,
        ma_lich_dat: r.ma_lich_dat,
        ten_khach_hang: r.ten_khach_hang,
        sdt_khach_hang: r.sdt_khach_hang,
        ten_dich_vu: r.ten_dich_vu,
        bac_si: r.ten_ky_thuat_vien,
        gio,
        trang_thai: frontendStatus,
      };
    }).filter(appt => appt.trang_thai !== '');

    const pending = appointments.filter(a => a.trang_thai === 'Cho khao sat').length;
    const active = appointments.filter(a => a.trang_thai === 'Dang dieu tri').length;
    const completed = appointments.filter(a => a.trang_thai === 'Hoan thanh').length;

    return {
      appointments,
      stats: { pending, active, completed }
    };
  }

  async updateAppointmentStatus(id: string, trang_thai: string) {
    const appointment = await receptionistRepository.updateAppointmentStatus(id, trang_thai);
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    // Kích hoạt gửi thông báo tự động cho khách hàng
    notificationService.triggerAppointmentNotification(id, trang_thai).catch(err => {
      console.error('Lỗi khi trigger thông báo từ le_tan service:', err);
    });

    return appointment;
  }

  async getReceptionistStats() {
    const stats = await receptionistRepository.getReceptionistStats();
    return {
      checkin: parseInt(stats.checkin_count),
      waiting: parseInt(stats.waiting_count),
      total: parseInt(stats.total_today)
    };
  }

  async handleWalkInBooking(data: any) {
    const { sdt, ho_ten, gioi_tinh, ngay_sinh, dich_vu_id, ky_thuat_vien_id, gio_bat_dau } = data;

    let khachHangId;
    const existCust = await receptionistRepository.findCustomerByPhone(sdt);
    
    if (existCust) {
      khachHangId = existCust.khach_hang_id;
    } else {
      khachHangId = await receptionistRepository.createWalkInCustomer(ho_ten, sdt, gioi_tinh, ngay_sinh);
    }

    const duration = await receptionistRepository.getServiceDuration(dich_vu_id);
    const startTime = new Date(gio_bat_dau);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const maLichDat = `LD${Math.floor(100000 + Math.random() * 900000)}`;

    const lich_dat_id = await receptionistRepository.createAppointment(maLichDat, khachHangId, dich_vu_id, ky_thuat_vien_id, startTime, endTime);
    return { lich_dat_id };
  }

  async createBillingFromAppointment(lich_dat_id: string) {
    const lich = await receptionistRepository.getAppointmentForBilling(lich_dat_id);
    if (!lich) throw new Error('Lịch hẹn không hợp lệ hoặc chưa hoàn thành');

    const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;
    const hoa_don = await receptionistRepository.createBilling(maHoaDon, lich.khach_hang_id, lich_dat_id, lich.don_gia, lich.dich_vu_id);
    return hoa_don;
  }

  async calculateBilling(data: any) {
    const { item_type, item_id, loai_thanh_toan, ma_voucher } = data;

    let gia_goc = 0;
    let ten_item = '';
    let so_buoi_goi = 1;

    if (item_type === 'goi') {
      const pkg = await receptionistRepository.getPackageById(item_id);
      if (!pkg) throw new Error('Không tìm thấy gói dịch vụ');
      gia_goc = Number(pkg.gia_goi);
      ten_item = pkg.ten_goi;
      so_buoi_goi = pkg.tong_so_buoi;
    } else if (item_type === 'dich_vu') {
      const svc = await receptionistRepository.getServiceById(item_id);
      if (!svc) throw new Error('Không tìm thấy dịch vụ');
      gia_goc = Number(svc.don_gia);
      ten_item = svc.ten_dich_vu;
    } else {
      throw new Error('Loại vật phẩm thanh toán không hợp lệ');
    }

    // 1. Calculate auto-apply voucher discount (so_tien_giam_phuong_thuc) first
    let so_tien_giam_phuong_thuc = 0;
    let uu_dai_thanh_toan_id: string | null = null; // Store auto-applied voucher ID in this column

    const autoVouchers = await receptionistRepository.getAutoApplyVouchers();
    
    // Find the first matching auto-apply voucher
    const matchingAutoVoucher = autoVouchers.find((v: any) => {
      // Check if matches payment method
      if (v.yeu_cau_thanh_toan === 'tra_thang' && loai_thanh_toan !== 'tra_thang') return false;
      if (v.yeu_cau_thanh_toan === 'tra_gop' && loai_thanh_toan !== 'tra_gop') return false;

      // Check targeting
      if (v.ap_dung_cho === 'dich_vu' || v.ap_dung_cho === 'dich_vu_don' || v.ap_dung_cho === 'dich_vu_cu_the') {
        return item_type === 'dich_vu' && Array.isArray(v.dich_vu_ids) && v.dich_vu_ids.includes(item_id);
      }
      if (v.ap_dung_cho === 'goi' || v.ap_dung_cho === 'goi_dich_vu' || v.ap_dung_cho === 'goi_dieu_tri' || v.ap_dung_cho === 'goi_cu_the') {
        return item_type === 'goi' && Array.isArray(v.goi_dich_vu_ids) && v.goi_dich_vu_ids.includes(item_id);
      }
      return v.ap_dung_cho === 'tat_ca';
    });

    if (matchingAutoVoucher) {
      uu_dai_thanh_toan_id = matchingAutoVoucher.id;
      if (matchingAutoVoucher.loai_giam === 'phan_tram' || matchingAutoVoucher.loai_giam === 'percentage') {
        so_tien_giam_phuong_thuc = Math.round(gia_goc * (Number(matchingAutoVoucher.gia_tri_giam) / 100));
        if (matchingAutoVoucher.giam_toi_da && so_tien_giam_phuong_thuc > Number(matchingAutoVoucher.giam_toi_da)) {
          so_tien_giam_phuong_thuc = Number(matchingAutoVoucher.giam_toi_da);
        }
      } else {
        so_tien_giam_phuong_thuc = Number(matchingAutoVoucher.gia_tri_giam);
      }
      if (so_tien_giam_phuong_thuc > gia_goc) {
        so_tien_giam_phuong_thuc = gia_goc;
      }
    }

    const gia_sau_auto = Math.max(0, gia_goc - so_tien_giam_phuong_thuc);

    // 2. Calculate manual voucher discount on the remaining price
    let voucher_id: string | null = null;
    let so_tien_giam_voucher = 0;

    if (ma_voucher) {
      const voucher = await receptionistRepository.getVoucherByCode(ma_voucher);
      if (!voucher) {
        throw new Error('Mã giảm giá không tồn tại');
      }

      // Check date range
      const now = new Date();
      const startDate = new Date(voucher.ngay_bat_dau);
      const endDate = voucher.ngay_het_han ? new Date(voucher.ngay_het_han) : null;
      if (now < startDate || (endDate && now > endDate)) {
        throw new Error('Mã giảm giá đã hết hạn hoặc chưa được kích hoạt');
      }

      // Check status
      if (voucher.trang_thai !== 'hoat_dong') {
        throw new Error('Mã giảm giá không hoạt động');
      }

      // Check usage count
      const usageCount = await receptionistRepository.countVoucherUsage(voucher.id);
      if (voucher.so_luong_toi_da !== null && usageCount >= voucher.so_luong_toi_da) {
        throw new Error('Mã giảm giá đã hết lượt sử dụng');
      }

      // Check minimum order value
      if (gia_goc < Number(voucher.don_hang_toi_thieu)) {
        throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu (${Number(voucher.don_hang_toi_thieu).toLocaleString()}đ) để áp dụng mã này`);
      }

      // Check targeting
      if (voucher.ap_dung_cho === 'dich_vu' || voucher.ap_dung_cho === 'dich_vu_don' || voucher.ap_dung_cho === 'dich_vu_cu_the') {
        const linkedSvcIds = Array.isArray(voucher.dich_vu_ids) ? voucher.dich_vu_ids : JSON.parse(voucher.dich_vu_ids || '[]');
        if (item_type !== 'dich_vu' || !linkedSvcIds.includes(item_id)) {
          throw new Error('Mã giảm giá không áp dụng cho dịch vụ này');
        }
      } else if (voucher.ap_dung_cho === 'goi' || voucher.ap_dung_cho === 'goi_dich_vu' || voucher.ap_dung_cho === 'goi_dieu_tri' || voucher.ap_dung_cho === 'goi_cu_the') {
        const linkedPkgIds = Array.isArray(voucher.goi_dich_vu_ids) ? voucher.goi_dich_vu_ids : JSON.parse(voucher.goi_dich_vu_ids || '[]');
        if (item_type !== 'goi' || !linkedPkgIds.includes(item_id)) {
          throw new Error('Mã giảm giá không áp dụng cho gói dịch vụ này');
        }
      }

      // Check payment requirements
      if (voucher.yeu_cau_thanh_toan === 'tra_thang' && loai_thanh_toan !== 'tra_thang') {
        throw new Error('Mã giảm giá này chỉ áp dụng cho hình thức thanh toán trả thẳng');
      }
      if (voucher.yeu_cau_thanh_toan === 'tra_gop' && loai_thanh_toan !== 'tra_gop') {
        throw new Error('Mã giảm giá này chỉ áp dụng cho hình thức thanh toán trả góp');
      }

      voucher_id = voucher.id;

      // Calculate voucher discount on remaining price
      if (voucher.loai_giam === 'phan_tram' || voucher.loai_giam === 'percentage') {
        so_tien_giam_voucher = Math.round(gia_sau_auto * (Number(voucher.gia_tri_giam) / 100));
        if (voucher.giam_toi_da && so_tien_giam_voucher > Number(voucher.giam_toi_da)) {
          so_tien_giam_voucher = Number(voucher.giam_toi_da);
        }
      } else {
        so_tien_giam_voucher = Number(voucher.gia_tri_giam);
      }

      // Ensure discount does not exceed remaining price
      if (so_tien_giam_voucher > gia_sau_auto) {
        so_tien_giam_voucher = gia_sau_auto;
      }
    }

    // Clamp final total at 0đ minimum
    const tong_tien_thanh_toan = Math.max(0, gia_sau_auto - so_tien_giam_voucher);

    let so_tien_dot_1 = tong_tien_thanh_toan;
    let so_tien_dot_2 = 0;

    if (loai_thanh_toan === 'tra_gop') {
      so_tien_dot_1 = Math.round(tong_tien_thanh_toan / 2);
      so_tien_dot_2 = tong_tien_thanh_toan - so_tien_dot_1;
    }

    return {
      gia_goc,
      ten_item,
      so_buoi_goi,
      voucher_id,
      so_tien_giam_voucher,
      uu_dai_thanh_toan_id,
      so_tien_giam_phuong_thuc,
      tong_tien_thanh_toan,
      so_tien_dot_1,
      so_tien_dot_2,
      loai_thanh_toan
    };
  }

  async createBillingDirect(data: any) {
    const { khach_hang_id, item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id, ho_ten_khach, so_dien_thoai } = data;

    const calc = await this.calculateBilling({ item_type, item_id, loai_thanh_toan, ma_voucher });

    // Fetch customer info if not supplied
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
      so_dien_thoai: sdtKhach
    };

    const invoice = await receptionistRepository.createInvoiceDirect(invoiceData);
    return invoice;
  }

  async processPayment(data: any) {
    const { hoa_don_id, phuong_thuc, so_tien_nhan } = data;
    const hd = await receptionistRepository.getInvoiceById(hoa_don_id);
    if (!hd) throw new Error('Không tìm thấy hóa đơn');

    const tong_tien = Number(hd.tong_tien_thanh_toan);
    const da_thanh_toan_truoc = Number(hd.da_thanh_toan);
    const tien_nhan = Number(so_tien_nhan);
    const loai_thanh_toan = hd.loai_thanh_toan;

    let da_thanh_toan_moi = 0;
    let trang_thai_moi = '';

    if (da_thanh_toan_truoc === 0) {
      // First payment
      if (loai_thanh_toan === 'tra_gop') {
        const requiredDot1 = Math.round(tong_tien / 2);
        if (tien_nhan < requiredDot1) {
          throw new Error(`Số tiền nhận không đủ cho đợt 1 (tối thiểu ${requiredDot1.toLocaleString()}đ)`);
        }
        
        if (tien_nhan >= tong_tien) {
          da_thanh_toan_moi = tien_nhan;
          trang_thai_moi = 'da_thanh_toan';
        } else {
          da_thanh_toan_moi = tien_nhan;
          trang_thai_moi = 'dang_tra_gop';
        }
      } else {
        if (tien_nhan < tong_tien) {
          throw new Error(`Số tiền nhận không đủ (yêu cầu ${tong_tien.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = tien_nhan;
        trang_thai_moi = 'da_thanh_toan';
      }
    } else {
      // Subsequent payment (e.g. paying remaining/installment 2)
      const remaining = tong_tien - da_thanh_toan_truoc;
      if (tien_nhan < remaining) {
        throw new Error(`Số tiền nhận không đủ thanh toán nợ (yêu cầu ${remaining.toLocaleString()}đ)`);
      }
      da_thanh_toan_moi = da_thanh_toan_truoc + tien_nhan;
      trang_thai_moi = 'da_thanh_toan';
    }

    const maGiaoDich = `GD${Math.floor(10000000 + Math.random() * 90000000)}`;
    await receptionistRepository.processPaymentPartial(
      hoa_don_id, 
      maGiaoDich, 
      tien_nhan, 
      da_thanh_toan_moi, 
      trang_thai_moi, 
      phuong_thuc
    );

    // Update linked treatment plan to dang_dieu_tri on first payment
    if (hd.lich_dieu_tri_id && da_thanh_toan_truoc === 0) {
      await receptionistRepository.updateTreatmentPlanStatus(hd.lich_dieu_tri_id, 'dang_dieu_tri');
    }

    return { success: true, trang_thai_moi, da_thanh_toan_moi };
  }

  async updateSessionServices(buoi_tri_lieu_id: string, services: any[]) {
    await receptionistRepository.updateSessionServices(buoi_tri_lieu_id, services);
    return { success: true };
  }

  async getSessionServices(buoi_tri_lieu_id: string) {
    return receptionistRepository.getSessionServices(buoi_tri_lieu_id);
  }
}

export default new ReceptionistService();
