import api from '../../../api/axios';

export const resendEmail = (id: string) => api.post(`/receptionist/appointments/${id}/resend-email`);

// Appointments
export const getAppointments = () => api.get('/admin/appointments');
export const createAppointment = (data: any) => api.post('/admin/appointments', data);
export const updateAppointmentStatus = (id: string, data: any) => 
  api.patch(`/receptionist/appointments/${id}/status`, data);
export const keepAliveAppointment = (id: string) => 
  api.post(`/receptionist/appointments/${id}/keep-alive`);

// Available staff & resources
export const getStaff = () => api.get('/admin/staff');
export const getPackages = () => api.get('/admin/packages');
export const getRooms = () => api.get('/admin/rooms');
export const getSchedules = () => api.get('/admin/schedules');
export const getCustomers = () => api.get('/admin/customers');

// Customer directory (rút gọn cho Lễ tân — xem lịch sử, không xem lâm sàng, không sửa/khóa)
export const getCustomerRoster = (params: {
  page: number;
  pageSize: number;
  search?: string;
  canLienHe?: boolean;
  staleDays?: number;
}) => api.get('/receptionist/customers/roster', { params });

export const getCustomerHistory = (id: string, staleDays?: number) =>
  api.get(`/receptionist/customers/${id}/history`, { params: { staleDays } });

export interface StaffWorkloadItem {
  nhan_su_id: number;
  ho_ten: string;
  vai_tro_id: number;
  ten_vai_tro: string;
  so_khach_song_song: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  ten_phong: string | null;
  so_ca_dang_lam: number;
  so_ca_cho?: number;
  so_ca_cho_tai_luong_gia?: number;
  thoi_gian_xong_du_kien_muon_nhat: string | null;
}

export interface SweptNoShowItem {
  id: string;
  ma_cuoc_hen: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  ten_dich_vu: string;
  buoi: 'sang' | 'chieu' | string;
  ngay_hen: string;
  trang_thai_thanh_toan: string;
  is_package: boolean;
  is_strike: boolean;
  strike_reason: string;
  customer_strikes_count: number;
  is_customer_locked_postpaid: boolean;
}

export interface SweepNoShowReport {
  total_swept: number;
  unpaid_strikes_count: number;
  paid_noshow_count: number;
  package_noshow_count: number;
  expired_reassessments_count: number;
  items: SweptNoShowItem[];
}

export const getStaffWorkload = (date?: string) => api.get<StaffWorkloadItem[]>('/receptionist/staff-workload', { params: { date } });
export const unassignAppointmentStaff = (id: string) => api.post(`/receptionist/appointments/${id}/unassign`, {});
export const triggerNoShowSweep = () => api.post<{ success: boolean; message: string; data: SweepNoShowReport }>('/receptionist/appointments/sweep-noshow');

