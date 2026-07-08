import api from '../../../api/axios';

// Walk-in booking
export const walkInBooking = (data: any) => api.post('/receptionist/walk-in', data);
export const resendEmail = (id: string) => api.post(`/receptionist/appointments/${id}/resend-email`);

// Dashboard data
export const getDashboardData = () => api.get('/receptionist/dashboard');

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
export const getMedicalRecords = () => api.get('/admin/medical-records');
