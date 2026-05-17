import api from './axios';

// Categories & Services
export const getCategories = () => api.get('/admin/categories');
export const createCategory = (data: any) => api.post('/admin/categories', data);
export const getServices = () => api.get('/admin/services');
export const createService = (data: any) => api.post('/admin/services', data);

// Packages
export const getPackages = () => api.get('/admin/packages');
export const createPackage = (data: any) => api.post('/admin/packages', data);

// Staff & Customers
export const getStaff = () => api.get('/admin/staff');
export const createStaff = (data: any) => api.post('/admin/staff', data);
export const updateStaffStatus = (id: string, trang_thai: string) => api.patch(`/admin/staff/${id}/status`, { trang_thai });
export const getCustomers = () => api.get('/admin/customers');

// Rooms & Equipment
export const getRooms = () => api.get('/admin/rooms');
export const getEquipment = () => api.get('/admin/equipment');
export const createEquipment = (data: any) => api.post('/admin/equipment', data);

// Schedules
export const getSchedules = () => api.get('/admin/schedules');
export const createSchedule = (data: any) => api.post('/admin/schedules', data);

// Medical Records
export const getMedicalRecords = () => api.get('/admin/medical-records');

// Audit
export const getAuditLogs = () => api.get('/admin/audit-logs');
