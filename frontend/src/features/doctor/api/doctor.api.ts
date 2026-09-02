import api from '../../../api/axios';

// --- interfaces ---
export interface DoctorQueueItem {
  id: string;
  ma_lich_dat: string;
  ho_ten_khach: string;
  so_dien_thoai: string;
  gioi_tinh_khach: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  ly_do_kham: string;
  trang_thai: 'da_checkin' | 'dang_kham' | 'cho_tai_luong_gia' | 'hoan_thanh' | 'da_huy';
  anh_dinh_kem_url?: string;
  khach_hang_id: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  ten_khach_hang?: string;
  sdt_khach_hang?: string;
  avatar_url?: string;
}

export interface DoctorAppointment {
  id: string;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: string;
  ly_do_kham: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  ho_so_benh_an_id?: string;
  chan_doan?: string;
  chong_chi_dinh?: string;
  anh_dinh_kem_url?: string | null;
  khach_hang_id?: string;
  phac_do_dieu_tri_id?: string | null;
  thoi_gian_bat_dau?: string | null;
  nhat_ky_ngay_tao?: string | null;
  so_thu_tu_buoi?: number | null;
  tong_so_buoi_goi?: number | null;
  ten_phong?: string | null;
  thoi_gian_checkin?: string | null;
  thoi_gian_goi_vao?: string | null;
  thoi_luong_phut?: number;
  so_lan_goi_khong_co_mat?: number;
}

// Khám lâm sàng & dịch vụ lẻ gộp chung 1 dòng thời gian (KHÔNG lẫn buổi trong phác đồ) — mirror
// đúng cách tách "Phác đồ điều trị" / "Khám & Dịch vụ lẻ" của trang Admin (PatientEmrDetail.tsx).
export interface PatientVisit {
  id: string;
  loai: 'KHAM' | 'DICH_VU_LE';
  thoi_gian: string;
  ma_lich_dat: string;
  trang_thai: string;
  chan_doan?: string | null;
  chong_chi_dinh?: string | null;
  ly_do_kham?: string | null;
  anh_dinh_kem_url?: string | null;
  ghi_chu?: string | null;
  khuyen_nghi_goi?: string | null;
  ten_dich_vu?: string | null;
  vas_truoc?: number | null;
  vas_sau?: number | null;
  du_lieu_luong_gia?: any;
  du_lieu_tri_lieu?: any;
  ten_nhan_su?: string | null;
  anh_nhan_su?: string | null;
  // Nếu ca khám này đã dẫn tới 1 phác đồ được kích hoạt — id của phác đồ đó để nhảy popup.
  prescribed_plan_id?: string | null;
}

export interface TreatmentSession {
  id: string;
  so_thu_tu_buoi: number;
  // Giá trị thật của cuoc_hen.trang_thai (da_xac_nhan/da_checkin/dang_kham/cho_tai_luong_gia/
  // hoan_thanh/khong_den/da_huy...) — dùng string thay vì union cứng vì còn vài biến thể có phạt
  // (khach_khong_den, da_huy_phat...) không đáng liệt kê hết.
  trang_thai: string;
  thoi_gian_bat_dau?: string;
  thoi_gian_ket_thuc?: string;
  danh_gia_truoc_buoi?: number | null;
  danh_gia_sau_buoi?: number | null;
  danh_gia_hieu_qua?: string;
  canh_bao_dac_biet?: string;
  ai_tom_tat_ngan?: string;
  // id numeric của nhan_su thực hiện buổi — so khớp với người đang đăng nhập để quyết định nhãn
  // "Ghi chú của bạn" hay "Chỉ xem — ghi bởi người khác".
  thuc_hien_id?: number | null;
  ten_ky_thuat_vien?: string;
  anh_ky_thuat_vien?: string;
  du_lieu_tri_lieu?: any;
}

export interface TreatmentPlan {
  id: string;
  ma_lich_dieu_tri: string;
  loai_dieu_tri: 'dich_vu' | 'goi';
  tong_so_buoi: number;
  so_buoi_da_dung: number;
  trang_thai: 'dang_dieu_tri' | 'hoan_thanh' | 'huy' | 'cho_kich_hoat' | 'tam_dung';
  thoi_gian_tao: string;
  ten_dich_vu?: string;
  ten_goi?: string;
  chan_doan?: string;
  // Ca khám đã chỉ định ra phác đồ này (nếu có) + tên bác sĩ chỉ định, để hiện banner liên kết ngược.
  goc_kham_id?: string | null;
  bac_si_chi_dinh?: string | null;
  gia_goc_goi?: number;
  so_tien_giam_voucher?: number;
  tong_tien_thanh_toan?: number;
  da_thanh_toan?: number;
  trang_thai_thanh_toan?: string;
  hinh_thuc_thanh_toan_goi?: string;
  han_su_dung?: string;
  sessions: TreatmentSession[];
}

export interface PatientProfile {
  visits: PatientVisit[];
  treatmentPlans: TreatmentPlan[];
  patient?: PatientInfo;
  assessments?: PatientVisit[];
  plans?: TreatmentPlan[];
}

export interface PackageItem {
  id: string;
  ten_goi: string;
  mo_ta?: string;
  gia_goi: number;
  tong_so_buoi?: number;
  quy_trinh?: string | null;
}

export interface ClinicalAssessmentPayload {
  lich_dat_id: string;
  chan_doan: string;
  chong_chi_dinh: string;
  goi_dich_vu_id?: string | null;
  goi_dich_vu_ids?: string[] | null;
  ghi_chu?: string | null;
  // Bác sĩ đã chọn "xóa chỉ định cũ, dùng gói mới" ở modal xung đột — chỉ gửi lại true khi thực
  // sự cần xóa, không gửi ở lần lưu đầu tiên.
  resolvePendingConflict?: boolean;
  is_reassessment?: boolean;
  han_tai_kham?: string | null;
  vas_score?: number | null;
  rom_data?: any[] | null;
  mmt_data?: any[] | null;
}

export interface BlockedPackage {
  goi_dich_vu_id: string;
  ten_goi: string;
  reason_type: 'dang_dieu_tri' | 'cho_thanh_toan';
  message: string;
}

// Cảnh báo/chặn khi khách đang có chỉ định gói (chưa kích hoạt) hoặc phác đồ (đang điều trị) khác
// còn hiệu lực — trả kèm getAppointmentDetail để bàn khám hiện banner ngay lúc mở ca, không đợi
// tới lúc lưu (xem doctor.repository.ts::getBlockingLieuTrinh).
export interface PackageConflict {
  blocked: boolean;
  type?: 'active_plan' | 'pending_chi_dinh';
  reason?: string;
  ten_goi?: string;
  han_kich_hoat?: string;
  chi_dinh_buoi_id?: string;
}

// --- API Calls ---
export const getAppointments = (startDate?: string, endDate?: string) =>
  api.get<DoctorAppointment[]>('/doctor/appointments', { params: { startDate, endDate } });

export const getDoctorQueue = () =>
  api.get<DoctorQueueItem[]>('/doctor/queue');

export const callInPatient = (id: string) =>
  api.post<{ ten_nhan_su: string | null; ten_phong: string | null }>(`/doctor/queue/${id}/call-in`);

export const markPatientAbsent = (id: string) =>
  api.post<{ so_lan_goi_khong_co_mat: number; shouldFinalize: boolean }>(`/doctor/queue/${id}/mark-absent`);

export const getAppointmentDetail = (id: string) =>
  api.get<DoctorQueueItem & {
    ho_so_benh_an_id?: string;
    chan_doan?: string;
    chong_chi_dinh?: string;
    ghi_chu?: string;
    goi_dich_vu_id?: string;
    goi_dich_vu_ids?: string[];
    danh_sach_goi_chi_dinh?: Array<{
      goi_dich_vu_id: string;
      ten_goi: string;
      don_gia: number;
      tong_so_buoi: number;
    }>;
    vas_truoc?: number;
    vas_sau?: number;
    phac_do_dieu_tri_id?: string | null;
    so_thu_tu_buoi?: number | null;
    ten_dich_vu?: string | null;
    pd_tong_so_buoi?: number | null;
    package_conflict?: PackageConflict | null;
    blocked_packages?: BlockedPackage[];
  }>(`/doctor/appointments/${id}`);

export const getPatientProfile = (patientId: string) => 
  api.get<PatientProfile>(`/doctor/patients/${patientId}/profile`);

export const getPackages = () => api.get<PackageItem[]>('/doctor/packages');

export const getActiveSession = () => 
  api.get<{ id: string; ma_lich_dat: string; ten_khach_hang: string } | null>('/doctor/active-session');

export const saveAssessment = (payload: ClinicalAssessmentPayload) => 
  api.post<{ success: boolean; message: string; medicalRecordId: string }>('/doctor/appointments/assess', payload);

export const saveAssessmentDraft = (payload: {
  lich_dat_id: string;
  chan_doan?: string;
  chong_chi_dinh?: string;
  ghi_chu?: string;
  vas_score?: number;
  rom_data?: any[];
  mmt_data?: any[];
  selected_package_id?: string;
  selected_package_ids?: string[];
}) =>
  api.post<{ success: boolean; message: string }>('/doctor/appointments/draft', payload);

export interface DoctorSchedule {
  id: string;
  nguoi_dung_id: string;
  ngay: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  trang_thai: 'hoat_dong' | 'tam_nghi';
  phong_id?: string | number | null;
  ma_phong?: string | null;
  ten_phong?: string | null;
}

export const getDoctorSchedules = () => api.get<DoctorSchedule[]>('/doctor/schedules');

export interface PatientInfo {
  id: string;
  nguoi_dung_id?: string;
  ma_khach_hang?: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  avatar_url?: string;
  has_chong_chi_dinh?: boolean;
  lan_cuoi_su_dung?: string | null;
}

export const getPatients = () => api.get<PatientInfo[]>('/doctor/patients');
