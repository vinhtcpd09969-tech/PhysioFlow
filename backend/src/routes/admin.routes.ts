import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as adminController from '../controllers/admin.controller';
import * as appointmentController from '../controllers/appointment.controller';
import * as treatmentRecordController from '../controllers/treatment-record.controller';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(verifyToken);

// ─── NHÂN SỰ ─────────────────────────────────────────────────────────────────
router.get('/staff/available', authorizeRoles(2, 3, 4, 5, 6), adminController.getAvailableStaff);
router.get('/staff', authorizeRoles(2, 3, 4, 5, 6), adminController.getStaff);
router.post('/staff', authorizeRoles(5), adminController.createStaff);
router.patch('/staff/:id/status', authorizeRoles(5), adminController.updateStaffStatus);

// ─── GÓI ĐIỀU TRỊ ─────────────────────────────────────────────────────────────
router.get('/packages', authorizeRoles(2, 3, 4, 5, 6), adminController.getPackages);
router.post('/packages', authorizeRoles(5, 6), adminController.createPackage);
router.put('/packages/:id', authorizeRoles(5, 6), adminController.updatePackage);
router.delete('/packages/:id', authorizeRoles(5, 6), adminController.deletePackage);

// ─── DANH MỤC GÓI ─────────────────────────────────────────────────────────────
router.get('/categories', authorizeRoles(2, 3, 4, 5, 6), adminController.getCategories);
router.post('/categories', authorizeRoles(5, 6), adminController.createCategory);
router.put('/categories/:id', authorizeRoles(5, 6), adminController.updateCategory);
router.delete('/categories/:id', authorizeRoles(5, 6), adminController.deleteCategory);

// ─── PHÒNG KHÁM ────────────────────────────────────────────────────────────────
router.get('/rooms', authorizeRoles(2, 3, 4, 5, 6), adminController.getRooms);
router.post('/rooms', authorizeRoles(5, 6), adminController.createRoom);
router.put('/rooms/:id', authorizeRoles(5, 6), adminController.updateRoom);
router.delete('/rooms/:id', authorizeRoles(5, 6), adminController.deleteRoom);

// ─── THIẾT BỊ ──────────────────────────────────────────────────────────────────
router.get('/equipment', authorizeRoles(2, 3, 4, 5, 6), adminController.getEquipment);
router.post('/equipment', authorizeRoles(5, 6), adminController.createEquipment);
router.put('/equipment/:id', authorizeRoles(5, 6), adminController.updateEquipment);
router.delete('/equipment/:id', authorizeRoles(5, 6), adminController.deleteEquipment);
// ─── LỊCH LÀM VIỆC ────────────────────────────────────────────────────────────
router.get('/schedules', authorizeRoles(2, 3, 4, 5, 6), adminController.getSchedules);
router.post('/schedules', authorizeRoles(5, 6), adminController.createSchedule);
router.put('/schedules/:id', authorizeRoles(5, 6), adminController.updateSchedule);
router.delete('/schedules/:id', authorizeRoles(5, 6), adminController.deleteSchedule);

// ─── KHÁCH HÀNG ────────────────────────────────────────────────────────────────
router.get('/customers', authorizeRoles(2, 4, 5, 6), adminController.getCustomers);

// ─── HỒ SƠ ĐIỀU TRỊ ───────────────────────────────────────────────────────────
router.get('/medical-records', authorizeRoles(2, 4, 5, 6), adminController.getMedicalRecords);

// ─── TÀI CHÍNH ────────────────────────────────────────────────────────────────
router.get('/invoices', authorizeRoles(2, 5, 6), adminController.getInvoices);
router.get('/payments', authorizeRoles(2, 5, 6), adminController.getPayments);
router.post('/payments/:id/refund', authorizeRoles(5, 6), adminController.handleRefund);

// ─── MARKETING ─────────────────────────────────────────────────────────────────
router.get('/vouchers', authorizeRoles(2, 5, 6), adminController.getVouchers);
router.post('/vouchers', authorizeRoles(5, 6), adminController.createVoucher);
router.put('/vouchers/:id', authorizeRoles(5, 6), adminController.updateVoucher);
router.delete('/vouchers/:id', authorizeRoles(5, 6), adminController.deleteVoucher);

router.get('/feedback', authorizeRoles(5, 6), adminController.getFeedback);

// ─── BÁO CÁO ──────────────────────────────────────────────────────────────────
router.get('/analytics/summary', authorizeRoles(2, 5, 6), adminController.getDashboardSummary);
router.get('/analytics/revenue', authorizeRoles(5, 6), adminController.getRevenueStats);
router.get('/analytics/performance', authorizeRoles(5, 6), adminController.getStaffPerformance);

// ─── LỊCH HẸN (ADMIN MASTER VIEW) ─────────────────────────────────────────────
router.get('/appointments', authorizeRoles(2, 4, 5, 6), appointmentController.getAllAppointments);
router.post('/appointments', authorizeRoles(2, 5, 6), appointmentController.createAppointment);
router.patch('/appointments/:id/status', authorizeRoles(2, 4, 5, 6), appointmentController.updateAppointmentStatus);
router.put('/appointments/:id/medical-record', authorizeRoles(4, 5, 6), appointmentController.updateMedicalRecord);
router.delete('/appointments/break-time', authorizeRoles(5, 6), appointmentController.cancelBreakTimeAppointments);
router.get('/appointments/watchdog/status', authorizeRoles(5, 6), appointmentController.getWatchdogStatus);
router.post('/appointments/watchdog/run', authorizeRoles(5, 6), appointmentController.runWatchdogManually);
router.post('/appointments/:id/keep-alive', authorizeRoles(2, 5, 6), appointmentController.keepAliveAppointment);

// ─── HỒ SƠ ĐIỀU TRỊ (NEW WORKFLOW) ────────────────────────────────────────────
router.get('/treatment-records', authorizeRoles(2, 3, 4, 5, 6), treatmentRecordController.getTreatmentRecords);
router.post('/treatment-records', authorizeRoles(4, 5, 6), treatmentRecordController.createTreatmentRecord);
router.patch('/treatment-records/:id/assign', authorizeRoles(2, 5, 6), treatmentRecordController.assignTreatmentRecord);

export default router;
