import api from '../../../api/axios';

export interface RegisterPayload {
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  gioi_tinh: string;
  ngay_sinh: string;
  dia_chi?: string;
  password: string;
  dong_y_dieu_khoan: boolean;
}

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data);

export const checkEmailExists = (email: string) =>
  api.post('/auth/check-email', { email });

export const register = (data: RegisterPayload) =>
  api.post('/auth/register', data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (data: { email: string; otp: string; newPassword: string }) =>
  api.post('/auth/reset-password', data);
