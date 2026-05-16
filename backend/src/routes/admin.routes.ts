import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as adminController from '../controllers/admin.controller';
import * as appointmentController from '../controllers/appointment.controller';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập và có quyền Admin (vai_tro_id = 5)
router.use(verifyToken);
router.use(authorizeRoles(5));

// Danh mục & Dịch vụ
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);

// Gói điều trị
router.get('/packages', adminController.getPackages);
router.post('/packages', adminController.createPackage);

// Nhân sự (Staff)
router.get('/staff', adminController.getStaff);
router.post('/staff', adminController.createStaff);

// Khách hàng
router.get('/customers', adminController.getCustomers);

// Thiết bị
router.get('/equipment', adminController.getEquipment);
router.post('/equipment', adminController.createEquipment);

// Ca làm việc / Lịch làm việc
router.get('/schedules', adminController.getSchedules);
router.post('/schedules', adminController.createSchedule);

// Hồ sơ điều trị (Tra cứu Bệnh án)
router.get('/medical-records', adminController.getMedicalRecords);

// Nhật ký hệ thống (Audit Logs)
router.get('/audit-logs', adminController.getAuditLogs);

// Tài chính (Finance)
router.get('/invoices', adminController.getInvoices);
router.get('/payments', adminController.getPayments);
router.post('/payments/:id/refund', adminController.handleRefund);

// Marketing (Vouchers)
router.get('/vouchers', adminController.getVouchers);
router.post('/vouchers', adminController.createVoucher);
router.put('/vouchers/:id', adminController.updateVoucher);
router.delete('/vouchers/:id', adminController.deleteVoucher);

// Đánh giá (Feedback)
router.get('/feedback', adminController.getFeedback);

// Báo cáo (Analytics)
router.get('/analytics/summary', adminController.getDashboardSummary);
router.get('/analytics/revenue', adminController.getRevenueStats);
router.get('/analytics/performance', adminController.getStaffPerformance);

// Quản lý Lịch hẹn (Admin Master View)
/**
 * @swagger
 * /admin/appointments:
 *   get:
 *     summary: Lấy danh sách tất cả lịch hẹn
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch hẹn
 *   post:
 *     summary: Tạo lịch hẹn mới (Admin/Lễ tân)
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               khach_hang_id: { type: string, format: uuid }
 *               ho_ten_khach: { type: string }
 *               so_dien_thoai: { type: string }
 *               dich_vu_id: { type: string, format: uuid }
 *               ngay_gio_bat_dau: { type: string, format: date-time }
 *               ngay_gio_ket_thuc: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Đã tạo lịch hẹn
 * 
 * /admin/appointments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái lịch hẹn
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trang_thai: { type: string, enum: [cho_xac_nhan, da_xac_nhan, da_checkin, hoan_thanh, da_huy, khong_den] }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get('/appointments', appointmentController.getAllAppointments);
router.post('/appointments', appointmentController.createAppointment);
router.patch('/appointments/:id/status', appointmentController.updateAppointmentStatus);

export default router;
