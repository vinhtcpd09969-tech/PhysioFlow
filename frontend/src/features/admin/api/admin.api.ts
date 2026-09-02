import api from '../../../api/axios';

// Appointments
export const getAppointments = () => api.get('/admin/appointments');
export const createAppointment = (data: any) => api.post('/admin/appointments', data);
export const updateAppointmentStatus = (id: string, data: any) =>
  api.patch(`/admin/appointments/${id}/status`, data);
// B11 (bản Lễ tân) — đẩy khách xuống cuối hàng đợi, không đổi trạng thái (khác updateAppointmentStatus)
export const pushBackAppointment = (id: string) =>
  api.post(`/admin/appointments/${id}/push-back`);
export const keepAliveAppointment = (id: string) =>
  api.post(`/admin/appointments/${id}/keep-alive`);
export const getStaffBudgetForBuoi = (date: string, buoi: 'sang' | 'chieu', loai: string, excludeApptId?: string) =>
  api.get('/admin/appointments/staff-budget', { params: { date, buoi, loai, excludeApptId } });

// Packages
export const getPackages = () => api.get('/admin/packages');
export const createPackage = (data: any) => api.post('/admin/packages', data);
export const updatePackage = (id: string, data: any) => api.put(`/admin/packages/${id}`, data);
export const deletePackage = (id: string) => api.delete(`/admin/packages/${id}`);

// Staff & Customers
export const getStaff = () => api.get('/admin/staff');
export const createStaff = (data: any) => api.post('/admin/staff', data);
export const updateStaff = (id: string, data: any) => api.put(`/admin/staff/${id}`, data);
export const updateStaffStatus = (id: string, trang_thai: string) => api.patch(`/admin/staff/${id}/status`, { trang_thai });
export const deleteStaffAvatar = (id: string) => api.delete(`/admin/staff/${id}/avatar`);
export const updateStaffPassword = (id: string, data: { password?: string; oldPassword?: string; isReset?: boolean; otp?: string }) => api.post(`/admin/staff/${id}/update-password`, data);
export const sendAdminOTP = (action: 'CHANGE_EMAIL' | 'CHANGE_PASSWORD') => api.post('/admin/staff/send-security-otp', { action });
export const getCustomers = () => api.get('/admin/customers');
export const updateCustomer = (id: string, data: any) => api.put(`/admin/customers/${id}`, data);
export const toggleCustomerLock = (id: string, isLocked: boolean) => api.patch(`/admin/customers/${id}/toggle-lock`, { isLocked });
export const getCustomerLockImpact = (id: string) => api.get(`/admin/customers/${id}/lock-impact`);
export const getCustomersOverview = (params: { page: number; pageSize: number; search?: string; status?: string[]; repTier?: string }) =>
  api.get('/admin/customers/overview', { params: { ...params, status: params.status?.join(',') || undefined } });
export const getCustomerEmr = (id: string) => api.get(`/admin/customers/${id}/emr`);
export const getTreatmentPlansOverview = (params: { page: number; pageSize: number; search?: string; status?: string }) =>
  api.get('/admin/customers/treatment-plans', { params });
export const getCompletedSingleVisits = (params: { page: number; pageSize: number; search?: string; loai?: string }) =>
  api.get('/admin/customers/completed-single-visits', { params });

// Rooms & Equipment
export const getRooms = () => api.get('/admin/rooms');
export const createRoom = (data: any) => api.post('/admin/rooms', data);
export const updateRoom = (id: string | number, data: any) => api.put(`/admin/rooms/${id}`, data);
export const getEquipment = () => api.get('/admin/equipment');
export const createEquipment = (data: any) => api.post('/admin/equipment', data);
export const updateEquipment = (id: string, data: any) => api.put(`/admin/equipment/${id}`, data);
export const deleteEquipment = (id: string) => api.delete(`/admin/equipment/${id}`);

// Schedules
export const getSchedules = () => api.get('/admin/schedules');
export const createSchedule = (data: any) => api.post('/admin/schedules', data);
export const updateSchedule = (id: string, data: any) => api.put(`/admin/schedules/${id}`, data);
export const deleteSchedule = (id: string) => api.delete(`/admin/schedules/${id}`);

// Medical Records
export const getMedicalRecords = () => api.get('/admin/medical-records');

// Finance
export const getInvoices = () => api.get('/admin/invoices');
export const handleRefund = (paymentId: string) => api.post(`/admin/payments/${paymentId}/refund`);

// Analytics
export const getDashboardSummary = () => api.get('/admin/analytics/summary');
export const getRevenueStats = () => api.get('/admin/analytics/revenue');

// Articles (Blog)
export const getArticles = (params?: { danh_muc?: string; trang_thai?: string; search?: string }) =>
  api.get('/admin/articles', { params });
export const createArticle = (data: any) => api.post('/admin/articles', data);
export const updateArticle = (id: string, data: any) => api.put(`/admin/articles/${id}`, data);

// Upload ảnh dùng chung (blog | package | specialist)
export const uploadImage = (file: File, type: 'blog' | 'package' | 'specialist' = 'blog') => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post(`/admin/uploads/image?type=${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
