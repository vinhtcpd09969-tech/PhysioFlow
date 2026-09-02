import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import { requireActiveShift } from '../middlewares/shiftGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as adminController from '../controllers/admin.controller';
import * as appointmentController from '../controllers/appointment.controller';
import { uploadImage } from '../controllers/upload.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import {
  packageSchema,
  staffSchema,
  roomSchema,
  equipmentSchema,
  scheduleSchema,
} from '../schemas/admin.schema';
import {
  refundSchema,
  packageRefundSchema,
  expirePackageNoRefundSchema,
} from '../schemas/finance.schema';
import { voucherSchema } from '../schemas/marketing.schema';
import { articleSchema } from '../schemas/article.schema';
import { createAppointmentSchema, updateAppointmentStatusSchema } from '../schemas/appointment.schema';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(verifyToken);

// ─── NHÂN SỰ ─────────────────────────────────────────────────────────────────
router.get('/staff/available', authorizeRoles(2, 3, 4, 5, 6), adminController.getAvailableStaff);
router.get('/staff', authorizeRoles(2, 3, 4, 5, 6), adminController.getStaff);
router.post('/staff', authorizeRoles(5), validate(staffSchema), adminController.createStaff);
router.put('/staff/:id', authorizeRoles(5), adminController.updateStaff);
router.patch('/staff/:id/status', authorizeRoles(5), adminController.updateStaffStatus);
router.delete('/staff/:id/avatar', authorizeRoles(5), adminController.deleteStaffAvatar);
router.post('/staff/:id/update-password', authorizeRoles(5), adminController.updateStaffPassword);
router.post('/staff/send-security-otp', authorizeRoles(5), adminController.sendAdminOTP);

// ─── GÓI ĐIỀU TRỊ ─────────────────────────────────────────────────────────────
router.get('/packages', authorizeRoles(2, 3, 4, 5, 6), adminController.getPackages);
router.post('/packages', authorizeRoles(5, 6), validate(packageSchema), adminController.createPackage);
router.put('/packages/:id', authorizeRoles(5, 6), validate(packageSchema), adminController.updatePackage);
router.delete('/packages/:id', authorizeRoles(5, 6), adminController.deletePackage);

// ─── PHÒNG KHÁM ────────────────────────────────────────────────────────────────
router.get('/rooms', authorizeRoles(2, 3, 4, 5, 6), adminController.getRooms);
router.post('/rooms', authorizeRoles(5, 6), validate(roomSchema), adminController.createRoom);
router.put('/rooms/:id', authorizeRoles(5, 6), validate(roomSchema), adminController.updateRoom);
router.delete('/rooms/:id', authorizeRoles(5, 6), adminController.deleteRoom);

// ─── THIẾT BỊ ──────────────────────────────────────────────────────────────────
router.get('/equipment', authorizeRoles(2, 3, 4, 5, 6), adminController.getEquipment);
router.post('/equipment', authorizeRoles(5, 6), validate(equipmentSchema), adminController.createEquipment);
router.put('/equipment/:id', authorizeRoles(5, 6), validate(equipmentSchema), adminController.updateEquipment);
router.delete('/equipment/:id', authorizeRoles(5, 6), adminController.deleteEquipment);

// ─── LỊCH LÀM VIỆC ────────────────────────────────────────────────────────────
router.get('/schedules', authorizeRoles(2, 3, 4, 5, 6), adminController.getSchedules);
router.post('/schedules', authorizeRoles(5, 6), validate(scheduleSchema), adminController.createSchedule);
router.put('/schedules/:id', authorizeRoles(5, 6), validate(scheduleSchema), adminController.updateSchedule);
router.delete('/schedules/:id', authorizeRoles(5, 6), adminController.deleteSchedule);

// ─── KHÁCH HÀNG ────────────────────────────────────────────────────────────────
router.get('/customers', authorizeRoles(2, 4, 5, 6), adminController.getCustomers);
// /overview, /treatment-plans, /completed-single-visits khai báo TRƯỚC /:id để không bị route :id nuốt mất làm id.
router.get('/customers/overview', authorizeRoles(5, 6), adminController.getCustomersOverview);
router.get('/customers/treatment-plans', authorizeRoles(5, 6), adminController.getTreatmentPlans);
router.get('/customers/completed-single-visits', authorizeRoles(5, 6), adminController.getCompletedSingleVisits);
router.get('/customers/:id/emr', authorizeRoles(5, 6), adminController.getCustomerEmr);
router.get('/customers/:id/lock-impact', authorizeRoles(5, 6), adminController.getCustomerLockImpact);
router.put('/customers/:id', authorizeRoles(5, 6), adminController.updateCustomer);
router.patch('/customers/:id/toggle-lock', authorizeRoles(5, 6), adminController.toggleCustomerLock);

// ─── HỒ SƠ ĐIỀU TRỊ ───────────────────────────────────────────────────────────
router.get('/medical-records', authorizeRoles(4, 5, 6), adminController.getMedicalRecords);

// ─── TÀI CHÍNH ────────────────────────────────────────────────────────────────
router.get('/invoices', authorizeRoles(2, 5, 6), adminController.getInvoices);
router.get('/payments', authorizeRoles(2, 5, 6), adminController.getPayments);
router.post('/payments/:id/refund', authorizeRoles(5, 6), validate(refundSchema), adminController.handleRefund);
router.post('/invoices/:id/refund-package', authorizeRoles(5, 6), validate(packageRefundSchema), adminController.handlePackageRefund);
router.post('/invoices/:id/expire-no-refund', authorizeRoles(5, 6), validate(expirePackageNoRefundSchema), adminController.handleExpirePackageNoRefund);

// ─── BÀI VIẾT (BLOG) ──────────────────────────────────────────────────────────
router.get('/articles', authorizeRoles(5, 6), adminController.getArticles);
router.get('/articles/:id', authorizeRoles(5, 6), adminController.getArticleById);
router.post('/articles', authorizeRoles(5, 6), validate(articleSchema), adminController.createArticle);
router.put('/articles/:id', authorizeRoles(5, 6), validate(articleSchema), adminController.updateArticle);
router.delete('/articles/:id', authorizeRoles(5, 6), adminController.deleteArticle);

// ─── UPLOAD ẢNH ────────────────────────────────────────────────────────────────
router.post('/uploads/image', authorizeRoles(5, 6), uploadMiddleware.single('image'), uploadImage);

// ─── MARKETING ─────────────────────────────────────────────────────────────────
router.get('/vouchers', authorizeRoles(2, 5, 6), adminController.getVouchers);
router.post('/vouchers', authorizeRoles(5, 6), validate(voucherSchema), adminController.createVoucher);
router.put('/vouchers/:id', authorizeRoles(5, 6), adminController.updateVoucher);
router.delete('/vouchers/:id', authorizeRoles(5, 6), adminController.deleteVoucher);

router.get('/feedback', authorizeRoles(2, 5, 6), adminController.getFeedback);
router.post('/feedback/service/:id/reply', authorizeRoles(2, 5, 6), adminController.replyServiceFeedback);
router.post('/feedback/staff/:id/reply', authorizeRoles(2, 5, 6), adminController.replyStaffFeedback);
router.post('/feedback/:type/:id/analyze', authorizeRoles(2, 5, 6), adminController.analyzeFeedback);

// ─── BÁO CÁO ──────────────────────────────────────────────────────────────────
router.get('/analytics/summary', authorizeRoles(2, 5, 6), adminController.getDashboardSummary);
router.get('/analytics/revenue', authorizeRoles(5, 6), adminController.getRevenueStats);
router.get('/analytics/performance', authorizeRoles(5, 6), adminController.getStaffPerformance);
router.get('/analytics/top-packages', authorizeRoles(5, 6), adminController.getTopPackages);
router.get('/analytics/top-vip-customers', authorizeRoles(5, 6), adminController.getTopVipCustomers);

// ─── LỊCH HẸN (ADMIN MASTER VIEW) ─────────────────────────────────────────────
router.get('/appointments', authorizeRoles(2, 4, 5, 6), appointmentController.getAllAppointments);
router.get('/appointments/staff-budget', authorizeRoles(5, 6), appointmentController.getStaffBudgetForBuoi);
router.post('/appointments', authorizeRoles(2, 5, 6), validate(createAppointmentSchema), appointmentController.createAppointment);
router.patch('/appointments/:id/status', authorizeRoles(2, 4, 5, 6), validate(updateAppointmentStatusSchema), appointmentController.updateAppointmentStatus);
router.post('/appointments/:id/push-back', authorizeRoles(2, 5, 6), requireActiveShift, appointmentController.pushBackAppointment);
router.delete('/appointments/break-time', authorizeRoles(5, 6), appointmentController.cancelBreakTimeAppointments);
router.post('/appointments/:id/keep-alive', authorizeRoles(2, 5, 6), appointmentController.keepAliveAppointment);

export default router;
