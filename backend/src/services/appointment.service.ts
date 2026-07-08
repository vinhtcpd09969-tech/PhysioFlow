import prisma from '../config/prisma';
import appointmentRepository from '../repositories/appointment.repository';
import appointmentWatchdog from './appointment-watchdog.service';

class AppointmentService {
  async getAllAppointments(userRole?: number) {
    return appointmentRepository.getAllAppointments(userRole);
  }

  async createAppointment(data: any) {
    const ma_lich_dat = `LH${Math.floor(100000 + Math.random() * 900000)}`;
    const newApt = await appointmentRepository.createAppointment(ma_lich_dat, data);
    
    // Trigger notification async
    if (newApt) {
      const { default: notificationService } = require('./notification.service');
      notificationService.triggerAppointmentNotification(newApt.id, newApt.trang_thai, newApt).catch((err: any) => {
        console.error('Lỗi khi gửi thông báo lịch hẹn khi tạo:', err);
      });

      // Gửi OTP chỉ khi lịch ở trạng thái chưa xác nhận (cần khách hàng xác thực)
      if (newApt.trang_thai === 'chua_xac_nhan') {
        const otpCode = await this.generateAndSaveOTP(newApt);
        this.sendOTPEmailAsync(newApt, otpCode).catch((err: any) => {
          console.error('Lỗi khi gửi mail xác nhận lịch hẹn khi tạo:', err);
        });
      }
    }

    return newApt;
  }

  async createPublicAppointment(data: any) {
    const ma_lich_dat = `LH${Math.floor(100000 + Math.random() * 900000)}`;
    const newApt = await appointmentRepository.createPublicAppointment(ma_lich_dat, data);
    
    // Trigger notification and confirmation email async
    if (newApt) {
      // 1. Generate and save OTP to DB synchronously to prevent race conditions on redirect
      const otpCode = await this.generateAndSaveOTP(newApt);

      const { default: notificationService } = require('./notification.service');
      notificationService.triggerAppointmentNotification(newApt.id, newApt.trang_thai, newApt).catch((err: any) => {
        console.error('Lỗi khi gửi thông báo lịch hẹn public:', err);
      });

      // 2. Send SMTP email asynchronously in background
      this.sendOTPEmailAsync(newApt, otpCode).catch((err: any) => {
        console.error('Lỗi khi gửi mail xác nhận lịch hẹn public:', err);
      });
    }

    return newApt;
  }

  async getAppointmentById(id: string) {
    return appointmentRepository.getPublicAppointmentById(id);
  }

  async updateAppointmentStatus(id: string, data: any) {
    const updated = await appointmentRepository.updateAppointmentStatus(id, data);
    
    // Trigger notification async
    if (updated) {
      const { default: notificationService } = require('./notification.service');
      notificationService.triggerAppointmentNotification(updated.id, updated.trang_thai, updated).catch((err: any) => {
        console.error('Lỗi khi gửi thông báo cập nhật trạng thái:', err);
      });
    }

    return updated;
  }

  async saveDoctorRecommendation(id: string, data: any) {
    return appointmentRepository.saveDoctorRecommendation(id, data);
  }

  async getPublicServices() {
    return appointmentRepository.getPublicServices();
  }

  async getActiveDoctorDates() {
    return appointmentRepository.getActiveDoctorDates();
  }

  async getBookedSlots(dateStr: string, userId?: string, phone?: string, duration?: number, dichVuId?: string, excludeSessionId?: string) {
    return appointmentRepository.getBookedSlots(dateStr, userId, phone, duration, dichVuId, excludeSessionId);
  }

  async getCustomerAppointments(khach_hang_id: string) {
    return appointmentRepository.getCustomerAppointments(khach_hang_id);
  }

  async cancelCustomerAppointment(id: string, khach_hang_id: string, ly_do_huy: string) {
    const updated = await appointmentRepository.cancelCustomerAppointment(id, khach_hang_id, ly_do_huy);
    
    // Trigger notification async
    if (updated) {
      const { default: notificationService } = require('./notification.service');
      notificationService.triggerAppointmentNotification(updated.id, 'da_huy', updated).catch((err: any) => {
        console.error('Lỗi khi gửi thông báo hủy lịch:', err);
      });
    }

    return updated;
  }

  async getCustomerMedicalRecord(nguoi_dung_id: string) {
    return appointmentRepository.getCustomerMedicalRecord(nguoi_dung_id);
  }

  async getCustomerTreatmentSessions(nguoi_dung_id: string) {
    return appointmentRepository.getCustomerTreatmentSessions(nguoi_dung_id);
  }

  async updateMedicalRecord(id: string, data: any) {
    return appointmentRepository.updateMedicalRecord(id, data);
  }

  async cancelBreakTimeAppointments() {
    return appointmentRepository.cancelBreakTimeAppointments();
  }

  async checkCustomerHasClinicalExamOnDate(khach_hang_id: string | undefined, so_dien_thoai: string | undefined, dateStr: string, excludeSessionId?: string) {
    return appointmentRepository.checkCustomerHasClinicalExamOnDate(khach_hang_id || null, so_dien_thoai || null, dateStr, excludeSessionId);
  }

  async getPublicAppointmentById(id: string) {
    return appointmentRepository.getPublicAppointmentById(id);
  }

  async getWatchdogStatus() {
    const now = new Date();
    const expiredCount = await prisma.cuoc_hen.count({
      where: {
        trang_thai: { in: ['cho_xac_nhan', 'chua_xac_nhan'] },
        nhan_su_id: null,
        ngay_gio_bat_dau: { lt: now }
      }
    });
    const pendingCount = await prisma.cuoc_hen.count({
      where: {
        trang_thai: { in: ['cho_xac_nhan', 'chua_xac_nhan'] },
        nhan_su_id: null
      }
    });
    return { expiredCount, pendingCount };
  }

  async runWatchdogManually() {
    await appointmentWatchdog.runWatchdog();
    return { success: true };
  }

  async keepAliveAppointment(id: string) {
    const appt = await prisma.cuoc_hen.findUnique({
      where: { id }
    });

    if (!appt) {
      throw new Error('Lịch hẹn không tồn tại');
    }

    return appt;
  }

  async confirmEmailAppointment(id: string) {
    const appt = await prisma.cuoc_hen.findUnique({
      where: { id }
    });

    if (!appt) {
      throw new Error('Lịch hẹn không tồn tại');
    }

    if (appt.trang_thai === 'chua_xac_nhan') {
      const targetStatus = appt.nhan_su_id ? 'da_xac_nhan' : 'cho_xac_nhan';
      const updated = await prisma.cuoc_hen.update({
        where: { id },
        data: {
          trang_thai: targetStatus
        }
      });
      return updated;
    }

    return appt;
  }

  async confirmOTPAppointment(id: string, otpCode: string) {
    const appt = await prisma.cuoc_hen.findUnique({
      where: { id },
      include: {
        khach_hang: true
      }
    });

    if (!appt) {
      throw new Error('Lịch hẹn không tồn tại');
    }

    let customerEmail = appt.khach_hang?.email;
    if (!customerEmail && appt.khach_hang?.so_dien_thoai) {
      const customerRes = await prisma.khach_hang.findFirst({
        where: { so_dien_thoai: appt.khach_hang.so_dien_thoai }
      });
      if (customerRes?.email) {
        customerEmail = customerRes.email;
      }
    }

    if (!customerEmail) {
      const sdt = appt.khach_hang?.so_dien_thoai || '0901234567';
      customerEmail = `${sdt}@officecare.placeholder`;
    }

    // Find valid OTP
    const validOtp = await prisma.otp_codes.findFirst({
      where: {
        email: customerEmail,
        otp: otpCode,
        expires_at: {
          gt: new Date()
        }
      }
    });

    if (!validOtp) {
      throw new Error('Mã OTP không chính xác hoặc đã hết hạn.');
    }

    // Delete verified OTP
    await prisma.otp_codes.deleteMany({
      where: {
        email: customerEmail,
        otp: otpCode
      }
    });

    if (appt.trang_thai === 'chua_xac_nhan') {
      const targetStatus = appt.nhan_su_id ? 'da_xac_nhan' : 'cho_xac_nhan';
      const updated = await prisma.cuoc_hen.update({
        where: { id },
        data: {
          trang_thai: targetStatus
        }
      });
      return updated;
    }

    return appt;
  }

  async generateAndSaveOTP(appt: any): Promise<string> {
    let targetEmail = appt.khach_hang?.email;

    if (!targetEmail && appt.khach_hang_id) {
      const cust = await prisma.khach_hang.findUnique({
        where: { id: appt.khach_hang_id }
      });
      if (cust?.email) {
        targetEmail = cust.email;
      }
    }

    if (!targetEmail) {
      const sdt = appt.khach_hang?.so_dien_thoai || '0901234567';
      targetEmail = `${sdt}@officecare.placeholder`;
    }

    // Generate a 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Save to otp_codes table
    await prisma.otp_codes.create({
      data: {
        email: targetEmail,
        otp: otpCode,
        expires_at: expiresAt
      }
    });

    return otpCode;
  }

  async sendOTPEmailAsync(appt: any, otpCode: string) {
    let targetEmail = appt.khach_hang?.email;
    let targetName = appt.khach_hang?.ho_ten || 'Khách hàng';

    if (!targetEmail && appt.khach_hang_id) {
      const cust = await prisma.khach_hang.findUnique({
        where: { id: appt.khach_hang_id }
      });
      if (cust) {
        targetEmail = cust.email;
        targetName = cust.ho_ten;
      }
    }

    if (!targetEmail) {
      const sdt = appt.khach_hang?.so_dien_thoai || '0901234567';
      targetEmail = `${sdt}@officecare.placeholder`;
    }

    let serviceName = 'Khám Lượng Giá Lâm Sàng';
    if (appt.goi_dich_vu_id) {
      const srv = await prisma.goi_dich_vu.findUnique({
        where: { id: appt.goi_dich_vu_id }
      });
      if (srv) {
        serviceName = srv.ten_goi;
      }
    }

    const startDate = new Date(appt.ngay_gio_bat_dau);
    const timeStr = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
    const dateStr = startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

    const { sendBookingConfirmationOTP } = require('../utils/mailer');
    await sendBookingConfirmationOTP(targetEmail, targetName, otpCode, dateStr, timeStr, serviceName);
  }

  async resendConfirmationEmail(id: string) {
    const appt = await prisma.cuoc_hen.findUnique({
      where: { id },
      include: {
        khach_hang: true
      }
    });

    if (!appt) {
      throw new Error('Lịch hẹn không tồn tại');
    }

    const otpCode = await this.generateAndSaveOTP(appt);
    await this.sendOTPEmailAsync(appt, otpCode);
  }

  async createTempHold(data: { session_id: string, ngay_gio_bat_dau: string, goi_dich_vu_id: string, nhan_su_id: number | null, khach_hang_id?: string | null, so_dien_thoai?: string | null }) {
    return appointmentRepository.createTempHold(data);
  }

  async releaseTempHold(session_id: string) {
    return appointmentRepository.releaseTempHold(session_id);
  }
}

export default new AppointmentService();
