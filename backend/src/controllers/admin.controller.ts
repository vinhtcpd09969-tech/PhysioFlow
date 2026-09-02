import { Request, Response } from 'express';
import adminService from '../services/admin.service';
import authRepository from '../repositories/auth';
import { sendAdminSecurityOTP } from '../utils/mailer';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/appError';

// --- QUẢN LÝ PHÒNG KHÁM ---

export const getRooms = asyncHandler(async (req: Request, res: Response) => {
  const rooms = await adminService.getRooms();
  res.json(rooms);
});

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await adminService.createRoom(req.body);
  res.status(201).json(room);
});

export const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const room = await adminService.updateRoom(id, req.body);
  res.json(room);
});

export const deleteRoom = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const room = await adminService.deleteRoom(id);
  res.json({ message: 'Xóa phòng thành công', room });
});

// --- QUẢN LÝ GÓI ĐIỀU TRỊ ---

export const getPackages = asyncHandler(async (req: Request, res: Response) => {
  const packages = await adminService.getPackages();
  res.json(packages);
});

export const createPackage = asyncHandler(async (req: Request, res: Response) => {
  const packageData = await adminService.createPackage(req.body);
  res.status(201).json(packageData);
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const packageData = await adminService.updatePackage(id, req.body);
  res.json(packageData);
});

export const deletePackage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await adminService.deletePackage(id);
  res.json({ message: 'Xóa gói điều trị thành công' });
});

// --- QUẢN LÝ NHÂN SỰ ---

export const getStaff = asyncHandler(async (req: Request, res: Response) => {
  const staff = await adminService.getStaff();
  res.json(staff);
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const staff = await adminService.createStaff(req.body);
  res.status(201).json(staff);
});

export const updateStaffStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { trang_thai } = req.body;

  if (!['hoat_dong', 'vo_hieu'].includes(trang_thai)) {
    throw new BadRequestError('Trạng thái không hợp lệ');
  }

  const updatedStaff = await adminService.updateStaffStatus(id, trang_thai);
  res.json(updatedStaff);
});

export const getAvailableStaff = asyncHandler(async (req: Request, res: Response) => {
  const { dich_vu_id, dang_ky_goi_id, ngay, gio_bat_dau } = req.query as Record<string, string | undefined>;
  const staff = await adminService.getAvailableStaff(
    dich_vu_id || null,
    dang_ky_goi_id || null,
    ngay || new Date().toISOString().split('T')[0],
    gio_bat_dau || '08:00'
  );
  res.json(staff);
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const updatedStaff = await adminService.updateStaffDetails(id, req.body);
  res.json(updatedStaff);
});

export const deleteStaffAvatar = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const updatedStaff = await adminService.deleteStaffAvatar(id);
  res.json({ message: 'Xóa ảnh đại diện thành công', staff: updatedStaff });
});

export const updateStaffPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { newPassword, otpCode } = req.body;
  const currentAdmin = (req as any).user;

  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('Mật khẩu mới phải có ít nhất 6 ký tự.');
  }
  if (!otpCode) {
    throw new BadRequestError('Vui lòng cung cấp mã OTP xác thực an toàn.');
  }

  const validOTP = await authRepository.findValidOTP(currentAdmin.email, otpCode);
  if (!validOTP) {
    throw new BadRequestError('Mã OTP không hợp lệ hoặc đã hết hạn.');
  }

  await authRepository.deleteOTPsByEmail(currentAdmin.email);
  const updated = await adminService.updateStaffPassword(id, newPassword);
  res.json({ message: 'Cập nhật mật khẩu nhân sự thành công!', staff: updated });
});

export const sendAdminOTP = asyncHandler(async (req: Request, res: Response) => {
  const currentAdmin = (req as any).user;
  const { actionTitle } = req.body;

  if (!actionTitle) {
    throw new BadRequestError('Tiêu đề hành động là bắt buộc.');
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await authRepository.saveOTP(currentAdmin.email, otpCode, expiresAt);
  await sendAdminSecurityOTP(currentAdmin.email, otpCode, actionTitle, currentAdmin.ho_ten || 'Quản trị viên');
  res.json({ message: 'Mã xác thực an toàn đã được gửi đến email quản trị của bạn.' });
});

// --- QUẢN LÝ KHÁCH HÀNG ---

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const customers = await adminService.getCustomers();
  res.json(customers);
});

export const getCustomersOverview = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '10', search = '', status, repTier } = req.query as Record<string, string | undefined>;
  const statusArr = status ? status.split(',') : [];
  const overview = await adminService.getCustomersOverview({
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    search,
    status: statusArr,
    repTier: repTier as any,
  });
  res.json(overview);
});

export const getCustomerEmr = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const emr = await adminService.getCustomerEmr(id);
  res.json(emr);
});

export const getCustomerLockImpact = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const impact = await adminService.getCustomerLockImpact(id);
  res.json(impact);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const updatedCustomer = await adminService.updateCustomer(id, req.body);
  res.json(updatedCustomer);
});

export const toggleCustomerLock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { isLocked } = req.body;
  const result = await adminService.updateCustomerLock(id, Boolean(isLocked));
  res.json(result);
});

export const getTreatmentPlans = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '10', search = '', status } = req.query as Record<string, string | undefined>;
  const plans = await adminService.getTreatmentPlansOverview({
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    search,
    status,
  });
  res.json(plans);
});

export const getCompletedSingleVisits = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '10', search = '', loai } = req.query as Record<string, string | undefined>;
  const visits = await adminService.getCompletedSingleVisits({
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    search,
    loai,
  });
  res.json(visits);
});

// --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ ---

export const getMedicalRecords = asyncHandler(async (req: Request, res: Response) => {
  const records = await adminService.getMedicalRecords();
  res.json(records);
});

// --- QUẢN LÝ THIẾT BỊ ---

export const getEquipment = asyncHandler(async (req: Request, res: Response) => {
  const equipment = await adminService.getEquipment();
  res.json(equipment);
});

export const createEquipment = asyncHandler(async (req: Request, res: Response) => {
  const equipment = await adminService.createEquipment(req.body);
  res.status(201).json(equipment);
});

export const updateEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const equipment = await adminService.updateEquipment(id, req.body);
  res.json(equipment);
});

export const deleteEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const equipment = await adminService.deleteEquipment(id);
  res.json({ message: 'Xóa thiết bị thành công', equipment });
});

// --- QUẢN LÝ LỊCH LÀM VIỆC (CA LÀM VIỆC) ---

export const getSchedules = asyncHandler(async (req: Request, res: Response) => {
  const schedules = await adminService.getSchedules();
  res.json(schedules);
});

export const createSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await adminService.createSchedule(req.body);
  res.status(201).json(schedule);
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const schedule = await adminService.updateSchedule(id, req.body);
  res.json(schedule);
});

export const deleteSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await adminService.deleteSchedule(id);
  res.json({ message: 'Xóa lịch làm việc thành công' });
});

// --- QUẢN LÝ TÀI CHÍNH ---

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const invoices = await adminService.getInvoices();
  res.json(invoices);
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await adminService.getPayments();
  res.json(payments);
});

export const handleRefund = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await adminService.handleRefund(id, req.body);
  res.json({ message: 'Hoàn tiền thành công', invoice: result.invoice });
});

export const handlePackageRefund = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = (req as any).user;
  const userId = user ? Number(user.id) : 1;

  const result = await adminService.handlePackageRefund(id, req.body, userId);
  res.json({
    message: 'Hủy gói và hoàn tiền thành công',
    invoice: result.invoice,
    so_tien_hoan_tra: result.so_tien_hoan_tra
  });
});

export const handleExpirePackageNoRefund = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = (req as any).user;
  const userId = user ? Number(user.id) : 1;

  const result = await adminService.expirePackageNoRefund(id, req.body, userId);
  res.json({
    message: 'Đã hủy gói do quá hạn sử dụng (không hoàn tiền)',
    invoice: result.invoice,
    so_tien_giu_lai: result.so_tien_giu_lai
  });
});

// --- QUẢN LÝ MARKETING (VOUCHERS) ---

export const getVouchers = asyncHandler(async (req: Request, res: Response) => {
  const vouchers = await adminService.getVouchers();
  res.json(vouchers);
});

export const createVoucher = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const voucher = await adminService.createVoucher(req.body, userId);
  res.status(201).json(voucher);
});

export const updateVoucher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const voucher = await adminService.updateVoucher(id, req.body);
  res.json(voucher);
});

export const deleteVoucher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await adminService.deleteVoucher(id);
  res.json({ message: 'Xóa voucher thành công' });
});

// --- QUẢN LÝ PHẢN HỒI & ĐÁNH GIÁ (FEEDBACK) ---

export const getFeedback = asyncHandler(async (req: Request, res: Response) => {
  const feedback = await adminService.getFeedback();
  res.json(feedback);
});

export const replyServiceFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const noi_dung_tra_loi = (req.body?.phanHoi ?? req.body?.noi_dung_tra_loi ?? req.body?.phan_hoi ?? req.body?.noi_dung ?? '') as string;
  const user = (req as any).user;

  if (!noi_dung_tra_loi?.trim()) {
    throw new BadRequestError('Nội dung phản hồi không được để trống');
  }

  const result = await adminService.replyServiceFeedback(id, noi_dung_tra_loi.trim(), user.id);
  res.json(result);
});

export const replyStaffFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const noi_dung_tra_loi = (req.body?.phanHoi ?? req.body?.noi_dung_tra_loi ?? req.body?.phan_hoi ?? req.body?.noi_dung ?? '') as string;
  const user = (req as any).user;

  if (!noi_dung_tra_loi?.trim()) {
    throw new BadRequestError('Nội dung phản hồi không được để trống');
  }

  const result = await adminService.replyStaffFeedback(id, noi_dung_tra_loi.trim(), user.id);
  res.json(result);
});

export const analyzeFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params as { type: 'service' | 'staff'; id: string };
  const result = await adminService.analyzeFeedback(type, id);
  res.json({ message: 'Phân tích cảm xúc thành công', data: result });
});

// --- BÁO CÁO THỐNG KÊ (ANALYTICS & DASHBOARD) ---

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const { range, startDate, endDate } = req.query as Record<string, string | undefined>;
  const summary = await adminService.getDashboardSummary(range, startDate, endDate);
  res.json(summary);
});

export const getRevenueStats = asyncHandler(async (req: Request, res: Response) => {
  const { range, startDate, endDate, bucket } = req.query as Record<string, string | undefined>;
  const stats = await adminService.getRevenueStats(range, startDate, endDate, bucket);
  res.json(stats);
});

export const getStaffPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const performance = await adminService.getStaffPerformance(startDate, endDate);
  res.json(performance);
});

export const getTopPackages = asyncHandler(async (req: Request, res: Response) => {
  const packages = await adminService.getTopPackages();
  res.json(packages);
});

export const getTopVipCustomers = asyncHandler(async (req: Request, res: Response) => {
  const customers = await adminService.getTopVipCustomers();
  res.json(customers);
});

// --- QUẢN LÝ BÀI VIẾT & TIN TỨC (ARTICLES CMS) ---

export const getArticles = asyncHandler(async (req: Request, res: Response) => {
  const { danh_muc, trang_thai, search } = req.query as { danh_muc?: string; trang_thai?: string; search?: string };
  const articles = await adminService.getArticles({ danh_muc, trang_thai, search });
  res.json(articles);
});

export const getArticleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const article = await adminService.getArticleById(id);
  res.json(article);
});

export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id ? Number((req as any).user.id) : 1;
  const article = await adminService.createArticle(req.body, userId);
  res.status(201).json(article);
});

export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const article = await adminService.updateArticle(id, req.body);
  res.json(article);
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await adminService.deleteArticle(id);
  res.json({ message: 'Đã xóa bài viết thành công' });
});