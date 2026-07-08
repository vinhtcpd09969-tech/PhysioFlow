import api from '../../../api/axios';

export interface RatePayload {
  cuoc_hen_id: string;
  diem_so: number;
  nhan_xet?: string;
}

// Logged-in Customer APIs
export const getPendingRatingAppointments = () => 
  api.get('/client/pending-ratings');

export const rateAppointment = (id: string, data: { so_sao: number; nhan_xet?: string }) => 
  api.post(`/client/appointments/${id}/rate`, data);

export const updateProfile = (data: { ho_ten: string; so_dien_thoai: string }) =>
  api.put('/auth/profile', data);
