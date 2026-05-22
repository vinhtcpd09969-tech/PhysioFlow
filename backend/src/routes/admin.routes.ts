import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as adminController from '../controllers/admin.controller';
import * as appointmentController from '../controllers/appointment.controller';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập và có quyền Admin (vai_tro_id = 5) hoặc Quản lý (vai_tro_id = 6)
router.use(verifyToken);
router.use(authorizeRoles(5, 6));

// Danh mục & Dịch vụ
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Phòng lâm sàng (Rooms)
router.get('/rooms', adminController.getRooms);

// Gói điều trị
router.get('/packages', adminController.getPackages);
router.post('/packages', adminController.createPackage);
router.put('/packages/:id', adminController.updatePackage);
router.delete('/packages/:id', adminController.deletePackage);

// Nhân sự (Staff)
router.get('/staff/available', adminController.getAvailableStaff);
router.get('/staff', adminController.getStaff);
router.post('/staff', adminController.createStaff);
router.patch('/staff/:id/status', adminController.updateStaffStatus);

// Khách hàng
router.get('/customers', adminController.getCustomers);

// Thiết bị
router.get('/equipment', adminController.getEquipment);
router.post('/equipment', adminController.createEquipment);

// Ca làm việc / Lịch làm việc
/**
 * @swagger
 * /admin/schedules:
 *   get:
 *     summary: Lấy danh sách lịch trực của toàn bộ nhân sự (Bác sĩ, KTV, Lễ tân)
 *     tags: [Admin - Lịch trực]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch làm việc kèm vai trò và họ tên nhân sự
 *   post:
 *     summary: Tạo lịch trực mới cho nhân sự
 *     tags: [Admin - Lịch trực]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nguoi_dung_id
 *               - thu_trong_tuan
 *               - gio_bat_dau
 *               - gio_ket_thuc
 *             properties:
 *               nguoi_dung_id: { type: string, format: uuid, description: "ID của người dùng (nhân sự)" }
 *               thu_trong_tuan: { type: string, enum: [thu_2, thu_3, thu_4, thu_5, thu_6, thu_7, chu_nhat] }
 *               gio_bat_dau: { type: string, example: "08:00" }
 *               gio_ket_thuc: { type: string, example: "17:00" }
 *               trang_thai: { type: string, enum: [hoat_dong, tam_nghi], default: hoat_dong }
 *     responses:
 *       201:
 *         description: Đã xếp lịch trực thành công
 */
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

// Quản lý Ưu đãi Thanh toán
router.get('/payment-promotions', adminController.getPaymentPromotions);
router.post('/payment-promotions', adminController.createPaymentPromotion);
router.put('/payment-promotions/:id', adminController.updatePaymentPromotion);
router.delete('/payment-promotions/:id', adminController.deletePaymentPromotion);

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
router.put('/appointments/:id/medical-record', appointmentController.updateMedicalRecord);

export default router;
