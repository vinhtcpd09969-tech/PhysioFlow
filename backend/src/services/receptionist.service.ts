import receptionistRepository from '../repositories/receptionist.repository';
import appointmentRepository from '../repositories/appointment.repository';
import notificationService from './notification.service';
import { pool } from '../config/db';


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

  async updateAppointmentStatus(id: string, trang_thai: string, ly_do_huy?: string) {
    if (trang_thai === 'da_checkin' || trang_thai === 'check_in') {
      const appt = await pool.query(
        'SELECT phac_do_dieu_tri_id, so_thu_tu_buoi, loai FROM cuoc_hen WHERE id = $1',
        [id]
      );
      if (appt.rows.length > 0) {
        const { phac_do_dieu_tri_id, so_thu_tu_buoi, loai } = appt.rows[0];
        if (loai === 'DIEU_TRI' && so_thu_tu_buoi === 5 && phac_do_dieu_tri_id) {
          const hdRes = await pool.query(
            'SELECT tong_tien_phai_tra, so_tien_da_tra, trang_thai FROM hoa_don WHERE phac_do_dieu_tri_id = $1',
            [phac_do_dieu_tri_id]
          );
          if (hdRes.rows.length > 0) {
            const hd = hdRes.rows[0];
            const isFullyPaid = hd.trang_thai === 'da_thanh_toan' || Number(hd.so_tien_da_tra) >= Number(hd.tong_tien_phai_tra);
            if (!isFullyPaid) {
              const err = new Error('Khách hàng bắt buộc phải đóng nốt 50% còn lại của gói trước khi check-in Buổi 5.') as any;
              err.statusCode = 400;
              throw err;
            }
          }
        }
      }
    }

    const appointment = await receptionistRepository.updateAppointmentStatus(id, trang_thai, ly_do_huy);
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
    const goi_dich_vu_id = data.goi_dich_vu_id || data.dich_vu_id;
    const { sdt, ho_ten, gioi_tinh, ngay_sinh, gio_bat_dau } = data;
    const bac_si_id = data.bac_si_id || data.chuyen_gia_id || data.ky_thuat_vien_id;

    let khachHangId;
    const existCust = await receptionistRepository.findCustomerByPhone(sdt);
    
    if (existCust) {
      khachHangId = existCust.khach_hang_id;
    } else {
      khachHangId = await receptionistRepository.createWalkInCustomer(ho_ten, sdt, gioi_tinh, ngay_sinh);
    }

    const duration = await receptionistRepository.getServiceDuration(goi_dich_vu_id);
    const startTime = new Date(gio_bat_dau);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const maLichDat = `LD${Math.floor(100000 + Math.random() * 900000)}`;

    const lich_dat_id = await receptionistRepository.createAppointment(maLichDat, khachHangId, goi_dich_vu_id, bac_si_id, startTime, endTime);
    return { lich_dat_id };
  }

  async createBillingFromAppointment(lich_dat_id: string) {
    const lich = await receptionistRepository.getAppointmentForBilling(lich_dat_id);
    if (!lich) throw new Error('Lịch hẹn không hợp lệ hoặc chưa hoàn thành');

    const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;
    const result = await receptionistRepository.createBilling(maHoaDon, lich.khach_hang_id, lich_dat_id, lich.don_gia, lich.goi_dich_vu_id);
    
    const { hoa_don, doctorUserId, customerName } = result;

    if (doctorUserId) {
      try {
        await notificationService.createNotification(
          doctorUserId,
          'Đồng bộ hồ sơ điều trị',
          `Bệnh nhân ${customerName} đã chuyển sang thanh toán lẻ 1 buổi sau buổi trải nghiệm.`,
          'he_thong'
        );
      } catch (err) {
        console.error('Lỗi gửi thông báo cho bác sĩ khi hạ cấp gói:', err);
      }
    }

    return hoa_don;
  }

  async calculateBilling(data: any) {
    const { item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id } = data;

    let gia_goc_goi = 0;
    let ten_item = '';
    let so_buoi_goi = 1;
    let phan_tram_giam_tra_thang = 10;
    let phan_tram_giam_tra_gop = 5;

    if (item_type === 'goi') {
      const pkg = await receptionistRepository.getPackageById(item_id);
      if (!pkg) throw new Error('Không tìm thấy gói dịch vụ');
      gia_goc_goi = Number(pkg.gia_goi);
      ten_item = pkg.ten_goi;
      so_buoi_goi = pkg.tong_so_buoi;
      phan_tram_giam_tra_thang = 10;
      phan_tram_giam_tra_gop = 5;
    } else if (item_type === 'dich_vu') {
      const svc = await receptionistRepository.getServiceById(item_id);
      if (!svc) throw new Error('Không tìm thấy dịch vụ');
      gia_goc_goi = Number(svc.don_gia);
      ten_item = svc.ten_dich_vu;
    } else {
      throw new Error('Loại vật phẩm thanh toán không hợp lệ');
    }

    // 1. Calculate payment method discount (so_tien_giam_phuong_thuc) on package price only
    let so_tien_giam_phuong_thuc = 0;
    if (item_type === 'goi') {
      if (loai_thanh_toan === 'tra_thang') {
        so_tien_giam_phuong_thuc = Math.round(gia_goc_goi * phan_tram_giam_tra_thang / 100);
      } else if (loai_thanh_toan === 'tra_gop') {
        so_tien_giam_phuong_thuc = Math.round(gia_goc_goi * phan_tram_giam_tra_gop / 100);
      } else if (loai_thanh_toan === 'tung_buoi') {
        so_tien_giam_phuong_thuc = 0;
      }
    }

    // 2. Calculate manual voucher discount on package price only
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
      if (gia_goc_goi < Number(voucher.don_hang_toi_thieu)) {
        throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu (${Number(voucher.don_hang_toi_thieu).toLocaleString()}đ) để áp dụng mã này`);
      }

      // Check payment requirements
      if (voucher.yeu_cau_thanh_toan === 'tra_thang' && loai_thanh_toan !== 'tra_thang') {
        throw new Error('Mã giảm giá này chỉ áp dụng cho hình thức thanh toán trả thẳng');
      }
      if (voucher.yeu_cau_thanh_toan === 'tra_gop' && loai_thanh_toan !== 'tra_gop') {
        throw new Error('Mã giảm giá này chỉ áp dụng cho hình thức thanh toán trả góp');
      }

      // Calculate voucher discount on original package price (mutual exclusivity)
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

      // Mutual exclusivity comparison: Pick the one that reduces more money
      if (so_tien_giam_voucher > so_tien_giam_phuong_thuc) {
        so_tien_giam_phuong_thuc = 0;
        voucher_id = voucher.id;
      } else {
        so_tien_giam_voucher = 0;
        voucher_id = null;
      }
    }

    // Clamp final package total at 0đ minimum
    const tong_tien_goi_sau_giam = Math.max(0, gia_goc_goi - so_tien_giam_phuong_thuc - so_tien_giam_voucher);

    // Fetch clinical assessment fee from DB dynamically if appointment is selected
    let chi_phi_kham = 0;
    let giam_tru_kham_truoc_do = 0;
    let mien_phi_kham_chua_dong = 0;
    let mien_phi_kham = false;

    if (lich_dat_id) {
      const appt = await receptionistRepository.getAppointmentWithServicePrice(lich_dat_id);
      if (appt) {
        chi_phi_kham = Number(appt.don_gia);
      }

      // Check if they are eligible for the free exam waiver:
      // payment mode tra_thang or tra_gop, and unit price >= 1.000.000đ
      if (['tra_thang', 'tra_gop'].includes(loai_thanh_toan) && gia_goc_goi >= 1000000) {
        mien_phi_kham = true;
      }

      if (mien_phi_kham) {
        // If eligible for free exam, check if they already paid the exam fee!
        const paidAmount = await receptionistRepository.getPaidInvoiceAmountForAppointment(lich_dat_id);
        if (paidAmount > 0) {
          // They already paid, so we deduct this from the package payment
          giam_tru_kham_truoc_do = paidAmount;
        } else {
          // They haven't paid, so we waive it (deduct from this bill)
          mien_phi_kham_chua_dong = chi_phi_kham;
        }
      }
    }

    // Total display values
    const gia_goc = gia_goc_goi + chi_phi_kham;
    // Total to pay before deduction
    let tong_tien_thanh_toan = tong_tien_goi_sau_giam + chi_phi_kham;

    // Apply the deduction / waiver if applicable
    if (giam_tru_kham_truoc_do > 0) {
      tong_tien_thanh_toan = Math.max(0, tong_tien_thanh_toan - giam_tru_kham_truoc_do);
    }
    if (mien_phi_kham_chua_dong > 0) {
      tong_tien_thanh_toan = Math.max(0, tong_tien_thanh_toan - mien_phi_kham_chua_dong);
    }

    let so_tien_dot_1 = tong_tien_thanh_toan;
    let so_tien_dot_2 = 0;

    if (item_type === 'goi') {
      if (loai_thanh_toan === 'tra_gop') {
        const packageDot1 = Math.round(tong_tien_goi_sau_giam / 2);
        // Note: For tra_gop, first payment is: (50% of package) + (exam fee) - (deduction or waiver)
        so_tien_dot_1 = Math.max(0, packageDot1 + chi_phi_kham - giam_tru_kham_truoc_do - mien_phi_kham_chua_dong);
        so_tien_dot_2 = tong_tien_goi_sau_giam - packageDot1;
      } else if (loai_thanh_toan === 'tung_buoi') {
        so_tien_dot_1 = chi_phi_kham;
        so_tien_dot_2 = tong_tien_goi_sau_giam;
      }
    }

    return {
      gia_goc,
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
      mien_phi_kham_chua_dong
    };
  }

  async confirmTreatmentPlan(data: any) {
    return receptionistRepository.confirmTreatmentPlan(data);
  }

  async createBillingDirect(data: any) {
    const { khach_hang_id, item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id, ho_ten_khach, so_dien_thoai, lich_dieu_tri_id, dang_ky_goi } = data;

    // If dang_ky_goi is false and we have an appointment (lich_dat_id), bill only the appointment fee!
    if (dang_ky_goi === false && lich_dat_id) {
      const appt = await receptionistRepository.getAppointmentWithServicePrice(lich_dat_id);
      if (!appt) throw new Error('Không tìm thấy cuộc hẹn khám');
      
      const calc = await this.calculateBilling({
        item_type: 'dich_vu',
        item_id: appt.goi_dich_vu_id,
        loai_thanh_toan: 'tra_thang', // default for services
        ma_voucher: null,
        lich_dat_id: null
      });

      const invoiceData = {
        khach_hang_id: appt.khach_hang_id,
        item_type: 'dich_vu',
        item_id: appt.goi_dich_vu_id,
        loai_thanh_toan: 'tra_thang',
        voucher_id: null,
        so_tien_giam_voucher: 0,
        uu_dai_thanh_toan_id: null,
        so_tien_giam_phuong_thuc: 0,
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

    // Enforce y khoa constraint: Receptionist cannot sell packages directly to walk-in customers
    if (item_type === 'goi' && !lich_dat_id && !lich_dieu_tri_id) {
      throw new Error('Lễ tân không được phép bán gói trị liệu trực tiếp cho khách vãng lai. Gói trị liệu phải được chỉ định bởi bác sĩ sau khi khám lâm sàng.');
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
      if (!ldt) throw new Error('Không tìm thấy lịch điều trị');

      const calc = await this.calculateBilling({ 
        item_type: 'goi', 
        item_id: ldt.goi_dich_vu_id, 
        loai_thanh_toan, 
        ma_voucher,
        lich_dat_id // Fetch and add dynamic clinical assessment fee!
      });

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
        ghi_chu: calc.giam_tru_kham_truoc_do > 0 
          ? `Đã khấu trừ ${calc.giam_tru_kham_truoc_do.toLocaleString()}đ phí khám lâm sàng đã đóng trước đó.` 
          : (calc.mien_phi_kham_chua_dong > 0 
              ? `Được miễn phí khám lâm sàng (Ưu đãi mua gói trị liệu > 1.000.000đ).` 
              : null)
      };

      const invoice = await receptionistRepository.createInvoiceForTreatmentPlan(invoiceData);
      if (loai_thanh_toan === 'tung_buoi') {
        await receptionistRepository.updateTreatmentPlanStatus(finalLdtId, 'dang_dieu_tri');
      }
      return invoice;
    }

    const calc = await this.calculateBilling({ item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id });

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
      so_dien_thoai: sdtKhach,
      ghi_chu: calc.giam_tru_kham_truoc_do > 0 
        ? `Đã khấu trừ ${calc.giam_tru_kham_truoc_do.toLocaleString()}đ phí khám lâm sàng đã đóng trước đó.` 
        : (calc.mien_phi_kham_chua_dong > 0 
            ? `Được miễn phí khám lâm sàng (Ưu đãi mua gói trị liệu > 1.000.000đ).` 
            : null)
    };

    const invoice = await receptionistRepository.createInvoiceDirect(invoiceData);
    return invoice;
  }

  async processPayment(data: any) {
    const { hoa_don_id, phuong_thuc, so_tien_nhan, ghi_chu } = data;
    const hd = await receptionistRepository.getInvoiceById(hoa_don_id);
    if (!hd) throw new Error('Không tìm thấy hóa đơn');

    const tong_tien = Number(hd.tong_tien_thanh_toan);
    const da_thanh_toan_truoc = Number(hd.da_thanh_toan);
    const tien_nhan = Number(so_tien_nhan);
    const loai_thanh_toan = hd.loai_thanh_toan;
    const so_buoi_goi = Number(hd.so_buoi_goi) || 1;

    let da_thanh_toan_moi = 0;
    let trang_thai_moi = '';
    let chi_phi_kham = 0;
    let giam_tru = 0;

    if (hd.cuoc_hen_id) {
      const appt = await receptionistRepository.getAppointmentWithServicePrice(hd.cuoc_hen_id);
      if (appt) {
        chi_phi_kham = Number(appt.don_gia);
      }

      const paidExam = await receptionistRepository.getPaidInvoiceAmountForAppointment(hd.cuoc_hen_id);
      // If the exam was waived, the paid exam fee is treated as a deduction
      if (paidExam > 0 && ['tra_thang', 'tra_gop'].includes(loai_thanh_toan) && (Number(hd.tong_tien_goc) - paidExam) >= 1000000) {
        giam_tru = paidExam;
      }
    }

    if (da_thanh_toan_truoc === 0) {
      // First payment
      if (loai_thanh_toan === 'tra_gop') {
        const totalPackage = tong_tien + giam_tru;
        const requiredDot1 = Math.round(totalPackage / 2) - giam_tru;
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
      } else if (loai_thanh_toan === 'tung_buoi') {
        const requiredDot1 = chi_phi_kham;
        if (tien_nhan < requiredDot1) {
          throw new Error(`Số tiền nhận không đủ cho buổi khám lâm sàng (tối thiểu ${requiredDot1.toLocaleString()}đ)`);
        }

        if (tien_nhan >= tong_tien) {
          da_thanh_toan_moi = tien_nhan;
          trang_thai_moi = 'da_thanh_toan';
        } else {
          da_thanh_toan_moi = tien_nhan;
          trang_thai_moi = 'dang_tra_tung_buoi';
        }
      } else {
        if (tien_nhan < tong_tien) {
          throw new Error(`Số tiền nhận không đủ (yêu cầu ${tong_tien.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = tien_nhan;
        trang_thai_moi = 'da_thanh_toan';
      }
    } else {
      // Subsequent payment (e.g. paying remaining/installment 2 or subsequent sessions)
      const remaining = tong_tien - da_thanh_toan_truoc;
      if (loai_thanh_toan === 'tung_buoi') {
        const perSessionPrice = Math.round((tong_tien - chi_phi_kham) / so_buoi_goi);
        const requiredAmount = Math.min(perSessionPrice, remaining);
        if (tien_nhan < requiredAmount) {
          throw new Error(`Số tiền nhận không đủ thanh toán cho buổi tiếp theo (yêu cầu tối thiểu ${requiredAmount.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = da_thanh_toan_truoc + tien_nhan;
        trang_thai_moi = da_thanh_toan_moi >= tong_tien ? 'da_thanh_toan' : 'dang_tra_tung_buoi';
      } else {
        if (tien_nhan < remaining) {
          throw new Error(`Số tiền nhận không đủ thanh toán nợ (yêu cầu ${remaining.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = da_thanh_toan_truoc + tien_nhan;
        trang_thai_moi = 'da_thanh_toan';
      }
    }

    const maGiaoDich = `GD${Math.floor(10000000 + Math.random() * 90000000)}`;
    await receptionistRepository.processPaymentPartial(
      hoa_don_id, 
      maGiaoDich, 
      tien_nhan, 
      da_thanh_toan_moi, 
      trang_thai_moi, 
      phuong_thuc,
      ghi_chu
    );

    // Update linked treatment plan status on first payment
    if (hd.lich_dieu_tri_id && da_thanh_toan_truoc === 0) {
      const statusToSet = hd.loai_hoa_don === 'dich_vu_don' ? 'da_thanh_toan' : 'dang_dieu_tri';
      await receptionistRepository.updateTreatmentPlanStatus(hd.lich_dieu_tri_id, statusToSet);
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

  async getActivePackages() {
    return receptionistRepository.getActivePackages();
  }

  async getAutoVouchers() {
    return receptionistRepository.getAutoApplyVouchers();
  }

  async searchCustomers(query: string) {
    return receptionistRepository.searchCustomers(query);
  }

  async getCustomerTreatmentPlans(customerId: string) {
    return receptionistRepository.getCustomerTreatmentPlans(customerId);
  }

  async getCompletedAppointments() {
    return receptionistRepository.getCompletedAppointments();
  }

  async getAppointmentBillingInfo(id: string) {
    return receptionistRepository.getAppointmentBillingInfo(id);
  }
}

export default new ReceptionistService();
