import receptionistRepository from '../repositories/receptionist';
import { pool } from '../config/db';
import { checkReceptionistTransition, isReceptionistLockedStatus } from '../domain/appointmentStatus';
import { needsFollowUp } from '../domain/customerFollowUp';
import { ForbiddenError, NotFoundError } from '../utils/appError';
import billingService from './billing.service';

/**
 * RECEPTIONIST SERVICE (Phân hệ Lễ tân: Tiếp đón, Check-in, Hàng đợi & Khách hàng)
 * 
 * Chịu trách nhiệm về:
 * 1. Quản lý trạng thái ca hẹn & check-in tại quầy (`updateAppointmentStatus`).
 * 2. Tra cứu & quản lý danh sách khách hàng (`searchCustomers`, `getCustomerRoster`, `getCustomerHistory`).
 * 3. Quản lý phân bổ ca trực nhân sự tại quầy (`getStaffWorkload`, `unassignAppointmentStaff`).
 * 4. Chuyển tiếp các tác vụ thanh toán sang BillingService độc lập.
 */
class ReceptionistService {
  async updateAppointmentStatus(id: string, trang_thai: string, ghi_chu_noi_bo?: string) {
    const currentApt = await pool.query('SELECT trang_thai, nhan_su_id FROM cuoc_hen WHERE id = $1', [id]);
    if (currentApt.rows.length === 0) throw new NotFoundError('Không tìm thấy lịch hẹn');
    const currentStatus = currentApt.rows[0].trang_thai;

    if (isReceptionistLockedStatus(currentStatus)) {
      throw new ForbiddenError(
        'Không thể thay đổi lịch hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc.'
      );
    }

    if (trang_thai !== currentStatus) {
      const check = checkReceptionistTransition(currentStatus, trang_thai, !!currentApt.rows[0].nhan_su_id);
      if (!check.allowed) {
        throw new ForbiddenError(check.reason);
      }
    }

    const appointment = await receptionistRepository.updateAppointmentStatus(id, trang_thai, ghi_chu_noi_bo);
    if (!appointment) throw new NotFoundError('Không tìm thấy lịch hẹn');

    return appointment;
  }

  // --- QUẢN LÝ KHÁCH HÀNG & HỒ SƠ ---
  async searchCustomers(query: string) {
    return receptionistRepository.searchCustomers(query);
  }

  async getCustomerTreatmentPlans(customerId: string) {
    return receptionistRepository.getCustomerTreatmentPlans(customerId);
  }

  async getCustomerRoster(filters: {
    page: number;
    pageSize: number;
    search: string;
    canLienHe: boolean;
    staleDays: number;
  }) {
    return receptionistRepository.getCustomerRoster(filters);
  }

  async getCustomerHistory(customerId: string, staleDays: number) {
    const record: any = await receptionistRepository.getCustomerHistory(customerId);
    if (!record) throw new NotFoundError('Không tìm thấy khách hàng');

    const pendingPlan = record.plans.find((p: any) => p.trang_thai === 'cho_kich_hoat');
    const activePlan = record.plans.find((p: any) => p.trang_thai === 'dang_dieu_tri');
    let lyDoLienHe: any = null;

    if (pendingPlan) {
      lyDoLienHe = { type: 'cho_kich_hoat' };
    } else if (activePlan) {
      const sessions = record.appointments.filter((a: any) => a.phac_do_dieu_tri_id === activePlan.id);
      const completedTimes = sessions
        .filter((a: any) => a.trang_thai === 'hoan_thanh')
        .map((a: any) => new Date(a.ngay_gio_bat_dau).getTime());
      const lastCompletedAt = completedTimes.length ? new Date(Math.max(...completedTimes)) : null;
      const hasUpcoming = sessions.some((a: any) =>
        new Date(a.ngay_gio_bat_dau) > new Date() && !['da_huy', 'huy'].includes(a.trang_thai)
      );
      const canLienHe = needsFollowUp({
        trangThaiGoi: activePlan.trang_thai,
        soBuoiDaDung: activePlan.so_buoi_da_dung,
        lastCompletedAt,
        hasUpcomingAppointment: hasUpcoming,
        staleDays
      });
      if (canLienHe) lyDoLienHe = { type: 'lau_chua_quay_lai' };
    }

    const completedAny = record.appointments
      .filter((a: any) => a.trang_thai === 'hoan_thanh')
      .map((a: any) => new Date(a.ngay_gio_bat_dau).getTime());
    const lastUsedAt = completedAny.length ? new Date(Math.max(...completedAny)).toISOString() : null;

    return { ...record, ly_do_lien_he: lyDoLienHe, last_used_at: lastUsedAt };
  }

  async getStaffWorkload(targetDate: string) {
    return receptionistRepository.getStaffWorkload(targetDate);
  }

  async unassignAppointmentStaff(id: string) {
    const result = await receptionistRepository.unassignAppointmentStaff(id);
    if (!result) {
      throw new NotFoundError('Không thể rút chỉ định nhân sự ca này (ca đã bắt đầu hoặc không tồn tại).');
    }
    return result;
  }

  async getCustomerNameById(customerId: string): Promise<string> {
    return receptionistRepository.getCustomerNameById(customerId);
  }

  async getActivePackages() {
    return receptionistRepository.getActivePackages();
  }

  // --- BILLING DELEGATION (Ủy quyền sang BillingService độc lập) ---
  createBillingFromAppointment(lich_dat_id: string) {
    return billingService.createBillingFromAppointment(lich_dat_id);
  }

  calculateBilling(data: any) {
    return billingService.calculateBilling(data);
  }

  getActiveVouchers(khach_hang_id?: string) {
    return billingService.getActiveVouchers(khach_hang_id);
  }

  applyVoucher(ma_voucher: string, loai_thanh_toan?: string, khach_hang_id?: string, kenh?: 'online' | 'tai_quay', loai_goi?: 'KHAM' | 'LE' | 'LIEU_TRINH') {
    return billingService.applyVoucher(ma_voucher, loai_thanh_toan, khach_hang_id, kenh, loai_goi);
  }

  createBillingDirect(data: any) {
    return billingService.createBillingDirect(data);
  }

  processPayment(data: any) {
    return billingService.processPayment(data);
  }

  getRequiredPaymentAmount(hoa_don_id: string, so_thu_tu_buoi?: number) {
    return billingService.getRequiredPaymentAmount(hoa_don_id, so_thu_tu_buoi);
  }

  getBillingInfoByPackage(customerId: string, packageId: string) {
    return billingService.getBillingInfoByPackage(customerId, packageId);
  }

  getAppointmentBillingInfo(id: string) {
    return billingService.getAppointmentBillingInfo(id);
  }

  checkPackagePayment(customerId: string, packageId: string) {
    return billingService.checkPackagePayment(customerId, packageId);
  }

  markPayOSLinkCreated(hoa_don_id: string) {
    return billingService.markPayOSLinkCreated(hoa_don_id);
  }

  revertPayOSPending(hoa_don_id: string) {
    return billingService.revertPayOSPending(hoa_don_id);
  }
}

export default new ReceptionistService();
