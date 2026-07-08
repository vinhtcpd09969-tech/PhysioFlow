/**
 * @swagger
 * tags:
 *   name: Lễ tân - Receptionist
 *   description: API dành cho Lễ tân - tiếp đón, đặt lịch hộ, xuất hóa đơn và xử lý thanh toán
 */

/**
 * @swagger
 * /receptionist/today-appointments:
 *   get:
 *     summary: Lấy danh sách lịch hẹn trong ngày hôm nay
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch hẹn hôm nay theo thứ tự giờ
 */

/**
 * @swagger
 * /receptionist/dashboard:
 *   get:
 *     summary: Lấy dữ liệu tổng quan bảng điều khiển lễ tân
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu dashboard (số lịch hẹn hôm nay, chờ xử lý, đang điều trị)
 */

/**
 * @swagger
 * /receptionist/appointments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái lịch hẹn (xác nhận, hoàn thành, hủy, ...)
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch hẹn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trang_thai:
 *                 type: string
 *                 enum: [cho_xac_nhan, da_xac_nhan, dang_kham, hoan_thanh, da_huy, khong_den]
 *                 example: da_xac_nhan
 *               ghi_chu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */

/**
 * @swagger
 * /receptionist/appointments/{id}/resend-email:
 *   post:
 *     summary: Gửi lại email xác nhận lịch hẹn cho khách hàng
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch hẹn
 *     responses:
 *       200:
 *         description: Email xác nhận đã được gửi lại
 */

/**
 * @swagger
 * /receptionist/stats:
 *   get:
 *     summary: Lấy thống kê hoạt động của lễ tân
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê số lịch hẹn, doanh thu, khách hàng mới, ...
 */

/**
 * @swagger
 * /receptionist/walk-in:
 *   post:
 *     summary: Đặt lịch trực tiếp tại quầy (khách vãng lai)
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ho_ten
 *               - so_dien_thoai
 *               - ngay_gio_bat_dau
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 example: Trần Thị C
 *               so_dien_thoai:
 *                 type: string
 *                 example: "0912345678"
 *               ngay_gio_bat_dau:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-01T09:00:00+07:00"
 *               bac_si_id:
 *                 type: string
 *                 description: UUID của bác sĩ được phân công
 *               phong_id:
 *                 type: integer
 *                 description: ID phòng khám
 *               ghi_chu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo lịch hẹn tại quầy thành công
 */

/**
 * @swagger
 * /receptionist/billing:
 *   post:
 *     summary: Tạo hóa đơn từ lịch hẹn
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lich_dat_id:
 *                 type: string
 *                 description: ID lịch hẹn cần xuất hóa đơn
 *     responses:
 *       201:
 *         description: Hóa đơn được tạo thành công
 */

/**
 * @swagger
 * /receptionist/payment:
 *   post:
 *     summary: Xử lý thanh toán hóa đơn
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hoa_don_id:
 *                 type: string
 *               phuong_thuc:
 *                 type: string
 *                 enum: [tien_mat, chuyen_khoan, the_ngan_hang]
 *                 example: tien_mat
 *               so_tien_thanh_toan:
 *                 type: number
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Thanh toán thành công
 */

/**
 * @swagger
 * /receptionist/treatment-plans/confirm:
 *   post:
 *     summary: Xác nhận phác đồ điều trị và tạo các buổi điều trị
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lich_dat_id:
 *                 type: string
 *               goi_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Phác đồ điều trị đã được xác nhận
 */

/**
 * @swagger
 * /receptionist/billing/calculate:
 *   post:
 *     summary: Tính toán tổng hóa đơn (áp dụng voucher, gói)
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kết quả tính toán hóa đơn
 */

/**
 * @swagger
 * /receptionist/billing/create:
 *   post:
 *     summary: Tạo hóa đơn trực tiếp
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Hóa đơn được tạo thành công
 */

/**
 * @swagger
 * /receptionist/sessions/{id}/services:
 *   post:
 *     summary: Cập nhật danh sách dịch vụ cho một buổi trị liệu
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ đã được cập nhật
 *   get:
 *     summary: Lấy danh sách dịch vụ trong một buổi trị liệu
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ của buổi trị liệu
 */

/**
 * @swagger
 * /receptionist/packages:
 *   get:
 *     summary: Lấy danh sách gói điều trị cho lễ tân
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách gói điều trị
 */

/**
 * @swagger
 * /receptionist/completed-consultations:
 *   get:
 *     summary: Lấy danh sách buổi khám lâm sàng đã hoàn thành (chờ xuất hóa đơn)
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách buổi khám đã hoàn thành
 */

/**
 * @swagger
 * /receptionist/auto-vouchers:
 *   get:
 *     summary: Lấy danh sách voucher tự động áp dụng
 *     tags: [Lễ tân - Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách voucher đang hoạt động có thể áp dụng tự động
 */
