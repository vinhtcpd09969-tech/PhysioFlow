import api from '../../../api/axios';
import { PatientProfile, DoctorQueueItem, DoctorAppointment } from '../../doctor/api/doctor.api';

export interface TreatmentLogItem {
  luc: string;
  noi_dung: string;
  phut?: number;
}

export interface TreatmentRecordPayload {
  lich_dat_id: string;
  vas_truoc: number;
  vas_sau: number;
  ghi_chu?: string | null;
  du_lieu_tri_lieu?: { nhat_ky: TreatmentLogItem[] } | null;
}

// KTV API calls
export const getAppointments = (startDate?: string, endDate?: string) =>
  api.get<DoctorAppointment[]>('/technician/appointments', { params: { startDate, endDate } });

// confirmOvertime — truyền true khi KTV đã xác nhận muốn mở bàn 2 dù dự kiến xong sau giờ tan ca
// (xem SHIFT_OVERTIME_WARNING ở ClinicalAssessment/index.tsx). Không truyền = lần gọi đầu, có thể
// bị chặn mềm để hỏi lại.
export const getAppointmentDetail = (id: string, confirmOvertime?: boolean) =>
  api.get<DoctorQueueItem & {
    ho_so_benh_an_id?: string;
    chan_doan?: string;
    chong_chi_dinh?: string;
    ghi_chu?: string;
    vas_truoc?: number;
    vas_sau?: number;
    du_lieu_tri_lieu?: { nhat_ky: TreatmentLogItem[] } | null;
    goi_dich_vu_id?: string;
    dich_vu_id?: string;
    phac_do_dieu_tri_id?: string | null;
    so_thu_tu_buoi?: number | null;
    ten_dich_vu?: string | null;
    pd_tong_so_buoi?: number | null;
    quy_trinh?: string | null;
    mo_ta_goi?: string | null;
  }>(`/technician/appointments/${id}`, confirmOvertime ? { params: { confirmOvertime: true } } : undefined);

export const getPatientProfile = (patientId: string) =>
  api.get<PatientProfile>(`/doctor/patients/${patientId}/profile`); // Hồ sơ bệnh lịch sử có thể dùng chung của doctor

// A1b — KTV có thể có TỐI ĐA 2 bàn trị liệu đang mở cùng lúc, nên trả về MẢNG (0-2 phần tử), khác
// với /doctor/active-session (Chuyên viên vẫn giới hạn 1, trả về object|null).
export const getActiveSession = () =>
  api.get<Array<{ id: string; ma_lich_dat: string; ten_khach_hang: string }>>('/technician/active-session');

export const saveTreatmentRecord = (payload: TreatmentRecordPayload) =>
  api.post<{ success: boolean; message: string; medicalRecordId: string }>('/technician/appointments/assess', payload);

// Lưu nháp (không hoàn thành ca) — gọi định kỳ trong lúc KTV đang làm, để rời trang giữa chừng vẫn
// khôi phục lại đúng dữ liệu khi mở lại bàn này (xem TechnicianTreatmentDesk.tsx).
export const saveTreatmentDraft = (payload: TreatmentRecordPayload) =>
  api.post<{ success: boolean }>('/technician/appointments/draft', payload);
