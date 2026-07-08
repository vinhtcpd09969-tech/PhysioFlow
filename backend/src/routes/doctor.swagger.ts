/**
 * @swagger
 * tags:
 *   name: Bác sĩ - Doctor
 *   description: API dành cho Bác sĩ - xem hàng đợi bệnh nhân, đánh giá, lập phác đồ điều trị
 */

/**
 * @swagger
 * /doctor/queue:
 *   get:
 *     summary: Lấy hàng đợi bệnh nhân đang chờ khám của bác sĩ
 *     tags: [Bác sĩ - Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân đang chờ và đang khám hôm nay
 *       403:
 *         description: Không đủ quyền truy cập (chỉ dành cho Bác sĩ / Admin)
 */

/**
 * @swagger
 * /doctor/appointments:
 *   get:
 *     summary: Lấy tất cả lịch hẹn được phân công cho bác sĩ
 *     tags: [Bác sĩ - Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch hẹn của bác sĩ
 */

/**
 * @swagger
 * /doctor/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ mà bác sĩ có thể chỉ định
 *     tags: [Bác sĩ - Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ
 */

/**
 * @swagger
 * /doctor/packages:
 *   get:
 *     summary: Lấy danh sách gói điều trị để lập phác đồ
 *     tags: [Bác sĩ - Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách gói điều trị
 */

/**
 * @swagger
 * /doctor/schedules:
 *   get:
 *     summary: Lấy lịch làm việc của bác sĩ đang đăng nhập
 *     tags: [Bác sĩ - Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch làm việc theo tuần
 */

/**
 * @swagger
 * /doctor/patients:
 *   get:
 *     summary: Lấy danh sách bệnh nhân từng điều trị với bác sĩ này
 *     tags: [Bác sĩ - Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân
 */

/**
 * @swagger
 * /doctor/appointments/{id}:
 *   get:
 *     summary: Lấy chi tiết một lịch hẹn cụ thể
 *     tags: [Bác sĩ - Doctor]
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
 *         description: Chi tiết lịch hẹn bao gồm thông tin bệnh nhân và hồ sơ bệnh án
 *       404:
 *         description: Không tìm thấy lịch hẹn
 */

/**
 * @swagger
 * /doctor/patients/{patientId}/profile:
 *   get:
 *     summary: Lấy hồ sơ sức khỏe toàn diện của bệnh nhân
 *     tags: [Bác sĩ - Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (khach_hang_id)
 *     responses:
 *       200:
 *         description: Hồ sơ sức khỏe bao gồm lịch sử khám bệnh và các buổi điều trị
 */

/**
 * @swagger
 * /doctor/appointments/assess:
 *   post:
 *     summary: Lưu kết quả đánh giá khám lâm sàng (chẩn đoán, phác đồ điều trị)
 *     tags: [Bác sĩ - Doctor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lich_dat_id
 *             properties:
 *               lich_dat_id:
 *                 type: string
 *                 description: ID lịch hẹn cần ghi đánh giá
 *               chan_doan:
 *                 type: string
 *                 example: Đau vai gáy mạn tính do thoái hóa đốt sống cổ C4-C5
 *               ghi_chu_bac_si:
 *                 type: string
 *                 example: Bệnh nhân đau tăng khi vận động, cần hạn chế gập cổ
 *               goi_id:
 *                 type: integer
 *                 description: ID gói điều trị được đề xuất
 *                 example: 2
 *     responses:
 *       200:
 *         description: Lưu đánh giá thành công
 *       404:
 *         description: Không tìm thấy lịch hẹn
 */
