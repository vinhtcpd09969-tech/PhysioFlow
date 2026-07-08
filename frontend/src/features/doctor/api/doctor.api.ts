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
  trang_thai: 'cho_kham' | 'dang_kham' | 'hoan_thanh' | 'da_huy';
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
}

export interface PatientMedicalRecord {
  id: string;
  chan_doan: string;
  chong_chi_dinh: string;
  ghi_chu: string;
  thoi_gian_tao: string;
  lich_dat_id: string;
  ma_lich_dat: string;
  ten_bac_si: string;
  khuyen_nghi_dich_vu?: string;
  khuyen_nghi_goi?: string;
}

export interface TreatmentSession {
  id: string;
  so_thu_tu_buoi: number;
  trang_thai: 'cho_tri_lieu' | 'dang_tri_lieu' | 'hoan_thanh' | 'vang_mat';
  thoi_gian_bat_dau?: string;
  thoi_gian_ket_thuc?: string;
  danh_gia_truoc_buoi?: string;
  danh_gia_sau_buoi?: string;
  danh_gia_hieu_qua?: string;
  canh_bao_dac_biet?: string;
  ai_tom_tat_ngan?: string;
  ten_ky_thuat_vien?: string;
}

export interface TreatmentPlan {
  id: string;
  ma_lich_dieu_tri: string;
  loai_dieu_tri: 'dich_vu' | 'goi';
  tong_so_buoi: number;
  so_buoi_da_dung: number;
  trang_thai: 'dang_dieu_tri' | 'hoan_thanh' | 'tam_dung';
  thoi_gian_tao: string;
  ten_dich_vu?: string;
  ten_goi?: string;
  chan_doan?: string;
  sessions: TreatmentSession[];
}

export interface PatientProfile {
  medicalRecords: PatientMedicalRecord[];
  treatmentPlans: TreatmentPlan[];
}

export interface ServiceItem {
  id: string;
  ten_dich_vu: string;
  mo_ta?: string;
  gia_hien_tai: number;
}

export interface PackageItem {
  id: string;
  ten_goi: string;
  mo_ta?: string;
  gia_goi: number;
}

export interface ClinicalAssessmentPayload {
  lich_dat_id: string;
  chan_doan: string;
  chong_chi_dinh: string;
  goi_dich_vu_id?: string | null;
  dich_vu_id?: string | null;
  ghi_chu?: string | null;
}

// --- API Calls ---
export const getQueue = () => api.get<DoctorQueueItem[]>('/doctor/queue');

export const getAppointments = (startDate?: string, endDate?: string) => 
  api.get<DoctorAppointment[]>('/doctor/appointments', { params: { startDate, endDate } });

export const getAppointmentDetail = (id: string) => 
  api.get<DoctorQueueItem & { 
    ho_so_benh_an_id?: string; 
    chan_doan?: string; 
    chong_chi_dinh?: string; 
    ghi_chu?: string; 
    goi_dich_vu_id?: string; 
    dich_vu_id?: string;
    vas_truoc?: number;
    vas_sau?: number;
  }>(`/doctor/appointments/${id}`);

export const getPatientProfile = (patientId: string) => 
  api.get<PatientProfile>(`/doctor/patients/${patientId}/profile`);

export const getServices = () => api.get<ServiceItem[]>('/doctor/services');

export const getPackages = () => api.get<PackageItem[]>('/doctor/packages');

export const saveAssessment = (payload: ClinicalAssessmentPayload) => 
  api.post<{ success: boolean; message: string; medicalRecordId: string }>('/doctor/appointments/assess', payload);

export interface DoctorSchedule {
  id: string;
  nguoi_dung_id: string;
  ngay: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  trang_thai: 'hoat_dong' | 'tam_nghi';
}

export const getDoctorSchedules = () => api.get<DoctorSchedule[]>('/doctor/schedules');

export interface PatientInfo {
  id: string;
  nguoi_dung_id: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  avatar_url?: string;
  has_chong_chi_dinh?: boolean;
}

export const getPatients = () => api.get<PatientInfo[]>('/doctor/patients');
