import api from '../../../api/axios';
import { PatientProfile, DoctorQueueItem, DoctorAppointment, DoctorSchedule } from '../../doctor/api/doctor.api';

export interface TreatmentRecordPayload {
  lich_dat_id: string;
  vas_truoc: number;
  vas_sau: number;
  ghi_chu?: string | null;
}

// KTV API calls
export const getQueue = () => 
  api.get<DoctorQueueItem[]>('/technician/queue');

export const getAppointments = (startDate?: string, endDate?: string) => 
  api.get<DoctorAppointment[]>('/technician/appointments', { params: { startDate, endDate } });

export const getAppointmentDetail = (id: string) => 
  api.get<DoctorQueueItem & { 
    ho_so_benh_an_id?: string; 
    chan_doan?: string; 
    chong_chi_dinh?: string; 
    ghi_chu?: string; 
    vas_truoc?: number; 
    vas_sau?: number; 
    goi_dich_vu_id?: string; 
    dich_vu_id?: string 
  }>(`/technician/appointments/${id}`);

export const getPatientProfile = (patientId: string) => 
  api.get<PatientProfile>(`/doctor/patients/${patientId}/profile`); // Hồ sơ bệnh lịch sử có thể dùng chung của doctor

export const saveTreatmentRecord = (payload: TreatmentRecordPayload) => 
  api.post<{ success: boolean; message: string; medicalRecordId: string }>('/technician/appointments/assess', payload);

export const getTechnicianSchedules = () => 
  api.get<DoctorSchedule[]>('/technician/schedules');
