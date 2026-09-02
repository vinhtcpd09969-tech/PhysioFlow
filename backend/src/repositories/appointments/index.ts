import { Pool, PoolClient } from 'pg';
import bookingRepo, { assertTreatmentPlanCanBookSession, calculateConfirmationDeadline, getVnDateString, getVnNowParts, isBuoiDaQua, resolveKhungGioNominalBuoi } from './booking.repository';
import lifecycleRepo, { updateCompletedSessionsCount } from './lifecycle.repository';
import queryRepo from './query.repository';
import { Buoi, KetQuaKiemTraDatLich } from '../../domain/capacity';
import { LoaiCuocHen } from '../../domain/types';

// Standalone utility function exports for direct imports
export {
  updateCompletedSessionsCount,
  assertTreatmentPlanCanBookSession,
  calculateConfirmationDeadline,
  getVnDateString,
  getVnNowParts,
  isBuoiDaQua,
  resolveKhungGioNominalBuoi
};

/**
 * Unified Facade for Appointment Repositories:
 * Delegates to:
 * - AppointmentBookingRepository (Booking creation & capacity checks)
 * - AppointmentLifecycleRepository (Status transitions & lifecycle workflows)
 * - AppointmentQueryRepository (Appointments & medical record queries)
 */
export class AppointmentRepository {
  // --- Query Operations ---
  async getAllAppointments(userRole?: number) {
    return queryRepo.getAllAppointments(userRole);
  }

  async getPublicServices() {
    return queryRepo.getPublicServices();
  }

  async getActiveDoctorDates(): Promise<string[]> {
    return queryRepo.getActiveDoctorDates();
  }

  async getPublicAppointmentById(id: string) {
    return queryRepo.getPublicAppointmentById(id);
  }

  async getCustomerAppointments(customer_id: string) {
    return queryRepo.getCustomerAppointments(customer_id);
  }

  async getCustomerMedicalRecord(customer_id: string) {
    return queryRepo.getCustomerMedicalRecord(customer_id);
  }

  async getCustomerTreatmentSessions(customer_id: string) {
    return queryRepo.getCustomerTreatmentSessions(customer_id);
  }

  async getCustomerInvoices(customer_id: string) {
    return queryRepo.getCustomerInvoices(customer_id);
  }

  async getCustomerPayments(customer_id: string) {
    return queryRepo.getCustomerPayments(customer_id);
  }

  // --- Booking & Capacity Operations ---
  async checkBuoiCapacity(params: {
    ngay: string;
    buoi: Buoi;
    loaiCuocHen: LoaiCuocHen | string;
    thoiLuongPhut: number;
    nhanSuId?: number | null;
    excludeApptId?: string;
  }): Promise<KetQuaKiemTraDatLich> {
    return bookingRepo.checkBuoiCapacity(params);
  }

  async getBuoiAvailability(dateStr: string, dichVuId?: string, userId?: string, phone?: string) {
    return bookingRepo.getBuoiAvailability(dateStr, dichVuId, userId, phone);
  }

  async getStaffBudgetForBuoi(dateStr: string, buoi: Buoi, loaiCuocHen: LoaiCuocHen | string, excludeApptId?: string) {
    return bookingRepo.getStaffBudgetForBuoi(dateStr, buoi, loaiCuocHen, excludeApptId);
  }

  async checkCustomerActiveLimit(khach_hang_id: string | null, so_dien_thoai: string | null): Promise<boolean> {
    return bookingRepo.checkCustomerActiveLimit(khach_hang_id, so_dien_thoai);
  }

  async checkCoLichChoTaiLuongGia(khach_hang_id: string | null, so_dien_thoai: string | null): Promise<boolean> {
    return bookingRepo.checkCoLichChoTaiLuongGia(khach_hang_id, so_dien_thoai);
  }

  async checkCustomerHasSameServiceInBuoi(
    khach_hang_id: string | null,
    so_dien_thoai: string | null,
    dichVuId: string,
    dateStr: string,
    buoi: 'sang' | 'chieu'
  ): Promise<boolean> {
    return bookingRepo.checkCustomerHasSameServiceInBuoi(khach_hang_id, so_dien_thoai, dichVuId, dateStr, buoi);
  }

  async checkCustomerHasClinicalExamOnDate(khach_hang_id: string | null, so_dien_thoai: string | null, dateStr: string): Promise<boolean> {
    return bookingRepo.checkCustomerHasClinicalExamOnDate(khach_hang_id, so_dien_thoai, dateStr);
  }

  async checkPhoneTakenByOther(phone: string, excludeUserId: string): Promise<boolean> {
    return bookingRepo.checkPhoneTakenByOther(phone, excludeUserId);
  }

  async createAppointment(ma_lich_dat: string, data: any) {
    return bookingRepo.createAppointment(ma_lich_dat, data);
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    return bookingRepo.createPublicAppointment(ma_lich_dat, data);
  }

  // --- Lifecycle & State Operations ---
  async updateCompletedSessionsCount(db: Pool | PoolClient, phac_do_dieu_tri_id: string): Promise<void> {
    return lifecycleRepo.updateCompletedSessionsCount(db, phac_do_dieu_tri_id);
  }

  async updateAppointmentStatus(id: string, data: {
    trang_thai: string;
    bac_si_id?: string | null;
    chuyen_gia_id?: string | null;
    ky_thuat_vien_id?: string | null;
    ngay_gio_bat_dau?: string | null;
    ngay_gio_ket_thuc?: string | null;
    buoi?: 'sang' | 'chieu';
    ghi_chu_noi_bo?: string | null;
    phong_id?: string | number | null;
  }, actorRoleId?: number) {
    return lifecycleRepo.updateAppointmentStatus(id, data, actorRoleId);
  }

  async pushBackAppointment(cuocHenId: string): Promise<{ so_lan_goi_khong_co_mat: number }> {
    return lifecycleRepo.pushBackAppointment(cuocHenId);
  }

  async cancelCustomerAppointment(id: string, customer_id: string, lyDoHuy: string) {
    return lifecycleRepo.cancelCustomerAppointment(id, customer_id, lyDoHuy);
  }

  async rescheduleCustomerAppointment(id: string, customer_id: string, new_date: string, new_buoi: 'sang' | 'chieu', new_staff_id?: number | null) {
    return lifecycleRepo.rescheduleCustomerAppointment(id, customer_id, new_date, new_buoi, new_staff_id);
  }

  async cancelBreakTimeAppointments(): Promise<{ cancelled_count: number }> {
    return lifecycleRepo.cancelBreakTimeAppointments();
  }
}

export default new AppointmentRepository();
