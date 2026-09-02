import prisma from '../config/prisma';
import appointmentRepository from '../repositories/appointments';

class AppointmentService {
  async getAllAppointments(userRole?: number) {
    return appointmentRepository.getAllAppointments(userRole);
  }

  async createAppointment(data: any) {
    const ma_lich_dat = `LH${Math.floor(100000 + Math.random() * 900000)}`;
    return appointmentRepository.createAppointment(ma_lich_dat, data);
  }

  async createPublicAppointment(data: any) {
    const ma_lich_dat = `LH${Math.floor(100000 + Math.random() * 900000)}`;
    return appointmentRepository.createPublicAppointment(ma_lich_dat, data);
  }

  async getAppointmentById(id: string) {
    return appointmentRepository.getPublicAppointmentById(id);
  }

  async updateAppointmentStatus(id: string, data: any, actorRoleId?: number) {
    const updated = await appointmentRepository.updateAppointmentStatus(id, data, actorRoleId);
    return updated;
  }

  // B11 (bản Lễ tân) — đẩy khách xuống cuối hàng đợi khi Lễ tân trực tiếp thấy khách rời chỗ chờ.
  async pushBackAppointment(id: string) {
    return appointmentRepository.pushBackAppointment(id);
  }

  async getPublicServices() {
    return appointmentRepository.getPublicServices();
  }

  async getActiveDoctorDates() {
    return appointmentRepository.getActiveDoctorDates();
  }

  async getBuoiAvailability(dateStr: string, dichVuId?: string, userId?: string, phone?: string) {
    return appointmentRepository.getBuoiAvailability(dateStr, dichVuId, userId, phone);
  }

  async getStaffBudgetForBuoi(dateStr: string, buoi: 'sang' | 'chieu', loai: string, excludeApptId?: string) {
    return appointmentRepository.getStaffBudgetForBuoi(dateStr, buoi, loai, excludeApptId);
  }

  async getCustomerAppointments(khach_hang_id: string) {
    return appointmentRepository.getCustomerAppointments(khach_hang_id);
  }

  async cancelCustomerAppointment(id: string, khach_hang_id: string, lyDoHuy: string) {
    const updated = await appointmentRepository.cancelCustomerAppointment(id, khach_hang_id, lyDoHuy);
    return updated;
  }

  async rescheduleCustomerAppointment(id: string, khach_hang_id: string, new_date: string, new_buoi: 'sang' | 'chieu', new_staff_id?: number | null) {
    return appointmentRepository.rescheduleCustomerAppointment(id, khach_hang_id, new_date, new_buoi, new_staff_id);
  }

  async getCustomerMedicalRecord(nguoi_dung_id: string) {
    try {
      const res = await appointmentRepository.getCustomerMedicalRecord(nguoi_dung_id);
      return res || { khach_hang: null, lich_su_kham: [], goi_dieu_tri: [], dieu_tri_le: [] };
    } catch (err) {
      console.error('Error fetching customer medical record legacy:', err);
      return { khach_hang: null, lich_su_kham: [], goi_dieu_tri: [], dieu_tri_le: [] };
    }
  }

  async getCustomerTreatmentSessions(nguoi_dung_id: string) {
    return appointmentRepository.getCustomerTreatmentSessions(nguoi_dung_id);
  }

  async getCustomerInvoices(nguoi_dung_id: string) {
    const [invoices, payments] = await Promise.all([
      appointmentRepository.getCustomerInvoices(nguoi_dung_id),
      appointmentRepository.getCustomerPayments(nguoi_dung_id),
    ]);
    return { invoices, payments };
  }

  async cancelBreakTimeAppointments() {
    return appointmentRepository.cancelBreakTimeAppointments();
  }

  async checkCustomerHasClinicalExamOnDate(khach_hang_id: string | undefined, so_dien_thoai: string | undefined, dateStr: string) {
    return appointmentRepository.checkCustomerHasClinicalExamOnDate(khach_hang_id || null, so_dien_thoai || null, dateStr);
  }

  async checkPhoneTakenByOther(phone: string, excludeUserId: string) {
    return appointmentRepository.checkPhoneTakenByOther(phone, excludeUserId);
  }

  async getPublicAppointmentById(id: string) {
    return appointmentRepository.getPublicAppointmentById(id);
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

}

export default new AppointmentService();
