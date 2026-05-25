import adminRepository from '../repositories/admin.repository';
import bcrypt from 'bcryptjs';

class AdminService {
  // --- QUẢN LÝ DỊCH VỤ & DANH MỤC ---
  async getCategories() {
    return adminRepository.getCategories();
  }

  async getRooms() {
    return adminRepository.getRooms();
  }

  async createCategory(data: any) {
    return adminRepository.createCategory(data);
  }

  async getServices() {
    return adminRepository.getServices();
  }

  async createService(data: any) {
    return adminRepository.createService(data);
  }

  async updateService(id: string, data: any) {
    return adminRepository.updateService(id, data);
  }

  async deleteService(id: string) {
    return adminRepository.deleteService(id);
  }

  // --- QUẢN LÝ GÓI ĐIỀU TRỊ ---
  async getPackages() {
    return adminRepository.getPackages();
  }

  async createPackage(data: any) {
    return adminRepository.createPackage(data);
  }

  async updatePackage(id: string, data: any) {
    return adminRepository.updatePackage(id, data);
  }

  async deletePackage(id: string) {
    return adminRepository.deletePackage(id);
  }

  // --- QUẢN LÝ NHÂN SỰ ---
  async getStaff() {
    return adminRepository.getStaff();
  }

  async createStaff(data: any) {
    const existing = await adminRepository.findUserByEmail(data.email);
    if (existing) throw new Error('Email đã được sử dụng');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.mat_khau, salt);

    return adminRepository.createStaff(data, hash);
  }

  async updateStaffStatus(id: string, status: string) {
    const user = await adminRepository.updateStaffStatus(id, status);
    if (!user) throw new Error('Không tìm thấy nhân sự');
    return user;
  }

  // --- QUẢN LÝ KHÁCH HÀNG ---
  async getCustomers() {
    return adminRepository.getCustomers();
  }

  // --- QUẢN LÝ THIẾT BỊ Y TẾ ---
  async getEquipment() {
    return adminRepository.getEquipment();
  }

  async createEquipment(data: any) {
    const ma_thiet_bi = data.ma_thiet_bi || 'TB-' + Math.floor(1000 + Math.random() * 9000);
    return adminRepository.createEquipment(ma_thiet_bi, data);
  }

  // --- QUẢN LÝ LỊCH LÀM VIỆC ---
  async getSchedules() {
    return adminRepository.getSchedules();
  }

  async createSchedule(data: any) {
    return adminRepository.createSchedule(data);
  }

  // --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ ---
  async getMedicalRecords() {
    return adminRepository.getMedicalRecords();
  }

  // --- AUDIT LOGS ---
  async getAuditLogs() {
    return adminRepository.getAuditLogs();
  }

  // --- QUẢN LÝ TÀI CHÍNH ---
  async getInvoices() {
    return adminRepository.getInvoices();
  }

  async getPayments() {
    return adminRepository.getPayments();
  }

  async handleRefund(id: string, data: any) {
    const result = await adminRepository.handleRefund(id, data.ly_do_hoan_tien);
    if (result.error) {
      const err = new Error(result.error) as any;
      err.code = result.code;
      throw err;
    }
    return result;
  }

  // --- QUẢN LÝ MARKETING ---
  async getVouchers() {
    return adminRepository.getVouchers();
  }

  async createVoucher(data: any, userId: string) {
    const existing = await adminRepository.getVoucherByCode(data.ma_voucher);
    if (existing) throw new Error('Mã voucher đã tồn tại');

    return adminRepository.createVoucher(data, userId);
  }

  async updateVoucher(id: string, data: any) {
    const voucher = await adminRepository.updateVoucher(id, data);
    if (!voucher) throw new Error('Không tìm thấy voucher');
    return voucher;
  }

  async deleteVoucher(id: string) {
    const voucher = await adminRepository.deleteVoucher(id);
    if (!voucher) throw new Error('Không tìm thấy voucher');
    return voucher;
  }

  // --- QUẢN LÝ ĐÁNH GIÁ ---
  async getFeedback() {
    return adminRepository.getFeedback();
  }


  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary() {
    return adminRepository.getDashboardSummary();
  }

  async getRevenueStats() {
    return adminRepository.getRevenueStats();
  }

  async getStaffPerformance() {
    return adminRepository.getStaffPerformance();
  }

  async getAvailableStaff(dich_vu_id: string | null, dang_ky_goi_id: string | null, ngay: string, gio_bat_dau: string) {
    return adminRepository.getAvailableStaff(dich_vu_id, dang_ky_goi_id, ngay, gio_bat_dau);
  }
}

export default new AdminService();

