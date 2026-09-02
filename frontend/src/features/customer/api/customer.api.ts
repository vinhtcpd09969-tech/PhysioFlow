import api from '../../../api/axios';

// Logged-in Customer APIs
export const getPendingRatingAppointments = () => 
  api.get('/client/appointments/pending-rating');

export const rateAppointment = (id: string, data: { 
  so_sao?: number; 
  nhan_xet?: string;
  rating_dich_vu?: number; 
  comment_dich_vu?: string; 
  rating_ktv?: number; 
  comment_ktv?: string; 
}) => 
  api.post(`/client/appointments/${id}/rate`, data);

export const getMyReviews = () => api.get('/client/reviews/my-reviews');

export const updateServiceReview = (id: string, data: { rating: number; comment?: string }) => 
  api.put(`/client/reviews/service/${id}`, data);

export const updateStaffReview = (id: string, data: { rating: number; comment?: string }) =>
  api.put(`/client/reviews/staff/${id}`, data);

export const updateProfile = (data: {
  ho_ten: string;
  so_dien_thoai: string;
  anh_dai_dien?: string;
  so_nam_kinh_nghiem?: number;
  bang_cap_chung_chi?: string;
  mo_ta?: string;
  the_manh?: string[];
  gioi_tinh?: string;
  dia_chi?: string;
  ngay_sinh?: string | null;
}) => api.put('/auth/profile', data);

export const sendChangePasswordOTP = () =>
  api.post('/auth/send-change-password-otp');

export const changePassword = (data: { otp?: string; newPassword: string; oldPassword?: string }) =>
  api.put('/auth/change-password', data);

export const getMe = () => api.get('/auth/me');

export const getCustomerMedicalRecord = () =>
  api.get('/client/medical-record');

export const agreeTerms = () => api.post('/client/agree-terms');

// --- Hóa đơn của khách hàng (chỉ xem) ---
export interface CustomerInvoice {
  id: string;
  khach_hang_id: string;
  phac_do_dieu_tri_id?: string | null;
  cuoc_hen_id?: string | null;
  tong_tien_goc: number;
  hinh_thuc_thanh_toan_goi?: string | null;
  voucher_id?: string | null;
  so_tien_giam_voucher?: number;
  ma_voucher_ap_dung?: string | null;
  ten_voucher_ap_dung?: string | null;
  tong_tien_thanh_toan: number;
  da_thanh_toan: number;
  trang_thai: string;
  ghi_chu?: string | null;
  ngay_tao: string;
  ngay_kham?: string | null;
  ngay_kham_ket_thuc?: string | null;
  ma_hoa_don: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  so_buoi_da_dung?: number;
  tong_so_buoi?: number;
  han_su_dung?: string | null;
  trang_thai_phac_do?: string | null;
  loai_goi?: string | null;
  ten_dich_vu?: string | null;
  chi_phi_kham?: number;
  ma_hoa_don_kham_rieng?: string | null;
  ngay_thanh_toan_kham_rieng?: string | null;
}

export interface CustomerPayment {
  id: string;
  hoa_don_id: string;
  ma_hoa_don: string;
  so_tien: number;
  loai_giao_dich: string;
  phuong_thuc: string;
  ma_giao_dich: string;
  thoi_gian_giao_dich: string;
  chi_tiet?: Record<string, any> | null;
}

export const getCustomerInvoices = () =>
  api.get<{ invoices: CustomerInvoice[]; payments: CustomerPayment[] }>('/client/invoices');
