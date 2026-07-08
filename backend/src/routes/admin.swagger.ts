/**
 * @swagger
 * tags:
 *   - name: Admin - Nhân sự
 *     description: Quản lý nhân viên, vai trò và quyền hạn
 *   - name: Admin - Danh mục & Dịch vụ
 *     description: Quản lý danh mục và dịch vụ điều trị
 *   - name: Admin - Phòng & Thiết bị
 *     description: Quản lý phòng khám và thiết bị y tế
 *   - name: Admin - Lịch hẹn
 *     description: Quản lý toàn bộ lịch hẹn (Admin master view)
 *   - name: Admin - Tài chính
 *     description: Quản lý hóa đơn, thanh toán và hoàn tiền
 *   - name: Admin - Báo cáo
 *     description: Thống kê, báo cáo doanh thu và hiệu suất nhân viên
 */

/**
 * @swagger
 * /admin/staff/available:
 *   get:
 *     summary: Lấy danh sách nhân sự đang sẵn sàng làm việc (để phân công lịch hẹn)
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách nhân sự đang hoạt động
 */

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: Lấy toàn bộ danh sách nhân sự
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách toàn bộ nhân sự trong hệ thống
 *   post:
 *     summary: Tạo tài khoản nhân sự mới (chỉ Admin)
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - ho_ten
 *               - vai_tro_id
 *             properties:
 *               email:
 *                 type: string
 *                 example: bacsi.moi@physioflow.vn
 *               ho_ten:
 *                 type: string
 *                 example: BS. Nguyễn Văn Tuấn
 *               so_dien_thoai:
 *                 type: string
 *                 example: "0923456789"
 *               vai_tro_id:
 *                 type: integer
 *                 description: "2=Lễ tân, 3=KTV, 4=Bác sĩ, 5=Admin, 6=Quản lý"
 *                 example: 4
 *               mat_khau:
 *                 type: string
 *                 example: "TempPass@123"
 *     responses:
 *       201:
 *         description: Tạo tài khoản nhân sự thành công
 */

/**
 * @swagger
 * /admin/staff/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hoạt động của nhân sự (kích hoạt / vô hiệu hóa)
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID nhân sự
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trang_thai:
 *                 type: string
 *                 enum: [hoat_dong, khoa]
 *                 example: khoa
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Lấy danh sách danh mục dịch vụ
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục (khám lâm sàng, điều trị, ...)
 *   post:
 *     summary: Tạo danh mục mới (Admin/Quản lý)
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten_danh_muc:
 *                 type: string
 *                 example: Phục hồi chức năng
 *     responses:
 *       201:
 *         description: Danh mục được tạo thành công
 */

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh mục đã được cập nhật
 *   delete:
 *     summary: Xóa danh mục
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh mục đã được xóa
 */

/**
 * @swagger
 * /admin/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ điều trị
 *   post:
 *     summary: Tạo dịch vụ mới
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten_dich_vu:
 *                 type: string
 *                 example: Sóng xung kích trị liệu (ESWT)
 *               gia:
 *                 type: number
 *                 example: 350000
 *               danh_muc_id:
 *                 type: integer
 *                 example: 2
 *               thoi_luong_phut:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       201:
 *         description: Dịch vụ được tạo thành công
 */

/**
 * @swagger
 * /admin/services/{id}:
 *   put:
 *     summary: Cập nhật thông tin dịch vụ
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa dịch vụ
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/packages:
 *   get:
 *     summary: Lấy danh sách gói điều trị
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách gói điều trị (bao gồm số buổi, tổng giá, dịch vụ đi kèm)
 *   post:
 *     summary: Tạo gói điều trị mới
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Gói điều trị được tạo thành công
 */

/**
 * @swagger
 * /admin/packages/{id}:
 *   put:
 *     summary: Cập nhật gói điều trị
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa gói điều trị
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /admin/rooms:
 *   get:
 *     summary: Lấy danh sách phòng khám và phòng trị liệu
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phòng (kham_benh, tri_lieu, phong_tap, ...)
 *   post:
 *     summary: Tạo phòng khám mới
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Phòng được tạo thành công
 */

/**
 * @swagger
 * /admin/equipment:
 *   get:
 *     summary: Lấy danh sách thiết bị y tế
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thiết bị kèm trạng thái, loại thiết bị
 *   post:
 *     summary: Thêm thiết bị y tế mới
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Thiết bị được thêm thành công
 */

/**
 * @swagger
 * /admin/equipment-types:
 *   get:
 *     summary: Lấy danh sách phân loại thiết bị
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách loại thiết bị
 */

/**
 * @swagger
 * /admin/schedules:
 *   get:
 *     summary: Lấy lịch làm việc của tất cả nhân sự
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch làm việc theo tuần
 *   post:
 *     summary: Tạo ca làm việc mới cho nhân sự
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Ca làm việc được tạo thành công
 */

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Lấy danh sách toàn bộ khách hàng
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khách hàng kèm thông tin cơ bản
 */

/**
 * @swagger
 * /admin/medical-records:
 *   get:
 *     summary: Tra cứu hồ sơ bệnh án của khách hàng
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hồ sơ bệnh án
 */

/**
 * @swagger
 * /admin/invoices:
 *   get:
 *     summary: Lấy danh sách hóa đơn
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hóa đơn kèm trạng thái thanh toán
 */

/**
 * @swagger
 * /admin/payments:
 *   get:
 *     summary: Lấy lịch sử thanh toán
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách giao dịch thanh toán
 */

/**
 * @swagger
 * /admin/payments/{id}/refund:
 *   post:
 *     summary: Xử lý hoàn tiền cho giao dịch
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giao dịch thanh toán
 *     responses:
 *       200:
 *         description: Hoàn tiền thành công
 */

/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     summary: Lấy danh sách voucher khuyến mãi
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách voucher
 *   post:
 *     summary: Tạo voucher mới
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Voucher được tạo thành công
 */

/**
 * @swagger
 * /admin/feedback:
 *   get:
 *     summary: Lấy danh sách đánh giá của khách hàng
 *     tags: [Admin - Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phản hồi và đánh giá từ khách hàng
 */

/**
 * @swagger
 * /admin/analytics/summary:
 *   get:
 *     summary: Lấy tổng quan dashboard (lịch hẹn, doanh thu, khách mới)
 *     tags: [Admin - Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Số liệu tổng quan dashboard
 */

/**
 * @swagger
 * /admin/analytics/revenue:
 *   get:
 *     summary: Thống kê doanh thu theo khoảng thời gian
 *     tags: [Admin - Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-06-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-06-30"
 *     responses:
 *       200:
 *         description: Báo cáo doanh thu chi tiết
 */

/**
 * @swagger
 * /admin/analytics/performance:
 *   get:
 *     summary: Thống kê hiệu suất làm việc của nhân sự
 *     tags: [Admin - Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Báo cáo hiệu suất từng nhân viên
 */

/**
 * @swagger
 * /admin/appointments:
 *   get:
 *     summary: Lấy toàn bộ lịch hẹn trong hệ thống (Admin view)
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc theo ngày (YYYY-MM-DD)
 *       - in: query
 *         name: trang_thai
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái lịch hẹn
 *     responses:
 *       200:
 *         description: Danh sách lịch hẹn toàn hệ thống
 *   post:
 *     summary: Tạo lịch hẹn mới (Staff tạo hộ)
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Lịch hẹn được tạo thành công
 */

/**
 * @swagger
 * /admin/appointments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái lịch hẹn (Admin/Lễ tân)
 *     tags: [Admin - Lịch hẹn]
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
 *         description: Trạng thái đã được cập nhật
 */

/**
 * @swagger
 * /admin/appointments/{id}/medical-record:
 *   put:
 *     summary: Cập nhật hồ sơ bệnh án cho lịch hẹn (KTV/Bác sĩ)
 *     tags: [Admin - Lịch hẹn]
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
 *         description: Hồ sơ bệnh án đã được cập nhật
 */

/**
 * @swagger
 * /admin/appointments/break-time:
 *   delete:
 *     summary: Xóa các lịch giữ chỗ break-time không còn cần thiết
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch break-time đã được dọn dẹp
 */

/**
 * @swagger
 * /admin/appointments/watchdog/status:
 *   get:
 *     summary: Kiểm tra trạng thái watchdog tự động hủy lịch hẹn quá hạn
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trạng thái watchdog (running / stopped, lần chạy cuối)
 */

/**
 * @swagger
 * /admin/appointments/watchdog/run:
 *   post:
 *     summary: Chạy thủ công watchdog để xử lý lịch hẹn quá hạn ngay lập tức
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watchdog đã được chạy, kết quả xử lý được trả về
 */

/**
 * @swagger
 * /admin/appointments/{id}/keep-alive:
 *   post:
 *     summary: Gia hạn thời gian chờ xác nhận của lịch hẹn (không để watchdog tự hủy)
 *     tags: [Admin - Lịch hẹn]
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
 *         description: Lịch hẹn đã được gia hạn
 */

/**
 * @swagger
 * /admin/treatment-records:
 *   get:
 *     summary: Lấy danh sách hồ sơ điều trị
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hồ sơ điều trị toàn hệ thống
 *   post:
 *     summary: Tạo hồ sơ điều trị mới cho bệnh nhân
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Hồ sơ điều trị được tạo thành công
 */

/**
 * @swagger
 * /admin/treatment-records/{id}/assign:
 *   patch:
 *     summary: Phân công KTV/Bác sĩ cho hồ sơ điều trị
 *     tags: [Admin - Lịch hẹn]
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
 *         description: Phân công thành công
 */
