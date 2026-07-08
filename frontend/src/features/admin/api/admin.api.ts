import api from '../../../api/axios';

// Appointments
export const getAppointments = () => api.get('/admin/appointments');
export const createAppointment = (data: any) => api.post('/admin/appointments', data);
export const updateAppointmentStatus = (id: string, data: any) => 
  api.patch(`/admin/appointments/${id}/status`, data);
export const keepAliveAppointment = (id: string) => 
  api.post(`/admin/appointments/${id}/keep-alive`);

// Categories
export const getCategories = () => api.get('/admin/categories');
export const createCategory = (data: any) => api.post('/admin/categories', data);
export const updateCategory = (id: string, data: any) => api.put(`/admin/categories/${id}`, data);
export const deleteCategory = (id: string) => api.delete(`/admin/categories/${id}`);

// Packages
export const getPackages = () => api.get('/admin/packages');
export const createPackage = (data: any) => api.post('/admin/packages', data);
export const updatePackage = (id: string, data: any) => api.put(`/admin/packages/${id}`, data);
export const deletePackage = (id: string) => api.delete(`/admin/packages/${id}`);

// Staff & Customers
export const getStaff = () => api.get('/admin/staff');
export const createStaff = (data: any) => api.post('/admin/staff', data);
export const updateStaffStatus = (id: string, trang_thai: string) => api.patch(`/admin/staff/${id}/status`, { trang_thai });
export const getCustomers = () => api.get('/admin/customers');
export const getAvailableStaff = (params: any) => api.get('/admin/staff/available', { params });

// Rooms & Equipment
export const getRooms = () => api.get('/admin/rooms');
export const createRoom = (data: any) => api.post('/admin/rooms', data);
export const updateRoom = (id: string | number, data: any) => api.put(`/admin/rooms/${id}`, data);
export const deleteRoom = (id: string | number) => api.delete(`/admin/rooms/${id}`);
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

// Vouchers & Marketing
export const getVouchers = () => api.get('/admin/vouchers');
export const createVoucher = (data: any) => api.post('/admin/vouchers', data);
export const updateVoucher = (id: string, data: any) => api.put(`/admin/vouchers/${id}`, data);
export const deleteVoucher = (id: string) => api.delete(`/admin/vouchers/${id}`);

// Finance
export const getInvoices = () => api.get('/admin/invoices');
export const getPayments = () => api.get('/admin/payments');
export const handleRefund = (paymentId: string) => api.post(`/admin/payments/${paymentId}/refund`);

// Feedback
export const getFeedback = () => api.get('/admin/feedback');

// Analytics
export const getDashboardSummary = () => api.get('/admin/analytics/summary');
export const getRevenueStats = () => api.get('/admin/analytics/revenue');
export const getStaffPerformance = () => api.get('/admin/analytics/performance');
