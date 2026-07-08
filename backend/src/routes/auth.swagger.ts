/**
 * @swagger
 * tags:
 *   name: Xác thực - Auth
 *   description: API đăng nhập, đăng ký, xác thực email và quản lý phiên
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống
 *     tags: [Xác thực - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@physioflow.vn
 *               password:
 *                 type: string
 *                 example: "Admin@123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token để làm mới session
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     ho_ten:
 *                       type: string
 *                     vai_tro:
 *                       type: string
 *       401:
 *         description: Sai email hoặc mật khẩu
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản khách hàng mới
 *     tags: [Xác thực - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - ho_ten
 *             properties:
 *               email:
 *                 type: string
 *                 example: khachhang@gmail.com
 *               password:
 *                 type: string
 *                 example: "Password@123"
 *               ho_ten:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               so_dien_thoai:
 *                 type: string
 *                 example: "0901234567"
 *     responses:
 *       201:
 *         description: Đăng ký thành công, OTP xác thực được gửi về email
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Xác thực email bằng mã OTP
 *     tags: [Xác thực - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: khachhang@gmail.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Xác thực email thành công
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 */

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Gửi lại mã OTP xác thực email
 *     tags: [Xác thực - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: khachhang@gmail.com
 *     responses:
 *       200:
 *         description: OTP mới đã được gửi về email
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Làm mới JWT access token bằng refresh token
 *     tags: [Xác thực - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGci..."
 *     responses:
 *       200:
 *         description: Trả về access token mới
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 */

/**
 * @swagger
 * /auth/check-email:
 *   post:
 *     summary: Kiểm tra email đã tồn tại trong hệ thống chưa
 *     tags: [Xác thực - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: khachhang@gmail.com
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu (gửi OTP về email)
 *     tags: [Xác thực - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: khachhang@gmail.com
 *     responses:
 *       200:
 *         description: OTP đặt lại mật khẩu đã được gửi về email
 *       404:
 *         description: Email không tồn tại trong hệ thống
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng OTP
 *     tags: [Xác thực - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: khachhang@gmail.com
 *               otp:
 *                 type: string
 *                 example: "654321"
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword@123"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: OTP không hợp lệ
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng đang đăng nhập
 *     tags: [Xác thực - Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin tài khoản hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 ho_ten:
 *                   type: string
 *                 vai_tro:
 *                   type: string
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 */
