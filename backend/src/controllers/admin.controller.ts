import { Request, Response } from 'express';
import { ZodError } from 'zod';
import adminService from '../services/admin.service';
import { categorySchema, serviceSchema, packageSchema, staffSchema } from '../schemas/admin.schema';
import { refundSchema } from '../schemas/finance.schema';
import { voucherSchema } from '../schemas/marketing.schema';
import { logAudit } from '../utils/audit.util';

// --- QUẢN LÝ DỊCH VỤ & DANH MỤC ---

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await adminService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await adminService.getRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phòng', error });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = categorySchema.parse({ body: req.body });
    const category = await adminService.createCategory(body);
    
    await logAudit(req, 'CREATE_CATEGORY', 'CATEGORY', category.id.toString(), body);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await adminService.getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy dịch vụ' });
  }
};

export const createService = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = serviceSchema.parse({ body: req.body });
    const service = await adminService.createService(body);

    await logAudit(req, 'CREATE_SERVICE', 'SERVICE', service.id.toString(), body);
    res.status(201).json(service);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ GÓI ĐIỀU TRỊ ---

export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = await adminService.getPackages();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy gói điều trị' });
  }
};

export const createPackage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = packageSchema.parse({ body: req.body });
    const packageData = await adminService.createPackage(body);

    await logAudit(req, 'CREATE_PACKAGE', 'PACKAGE', packageData.id.toString(), body);
    res.status(201).json(packageData);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ NHÂN SỰ ---

export const getStaff = async (req: Request, res: Response) => {
  try {
    const staff = await adminService.getStaff();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhân sự' });
  }
};

export const createStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = staffSchema.parse({ body: req.body });
    
    const staff = await adminService.createStaff(body);

    const { mat_khau: _, ...logPayload } = body;
    await logAudit(req, 'CREATE_STAFF', 'USER', staff.id, logPayload);

    res.status(201).json(staff);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.message === 'Email đã được sử dụng') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateStaffStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { trang_thai } = req.body;
    
    if (!['hoat_dong', 'vo_hieu'].includes(trang_thai)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const staff = await adminService.updateStaffStatus(id, trang_thai);

    await logAudit(req, 'UPDATE_STAFF_STATUS', 'USER', id, { trang_thai });
    res.json(staff);
  } catch (error: any) {
    if (error.message === 'Không tìm thấy nhân sự') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhân sự' });
  }
};

// --- QUẢN LÝ KHÁCH HÀNG ---

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await adminService.getCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách hàng' });
  }
};

// --- QUẢN LÝ THIẾT BỊ Y TẾ ---

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await adminService.getEquipment();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách thiết bị' });
  }
};

export const createEquipment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = require('../schemas/admin.schema').equipmentSchema.parse({ body: req.body });
    const equipment = await adminService.createEquipment(body);

    await logAudit(req, 'CREATE_EQUIPMENT', 'EQUIPMENT', equipment.id.toString(), body);
    res.status(201).json(equipment);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ LỊCH LÀM VIỆC (CA LÀM VIỆC) ---

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await adminService.getSchedules();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy lịch làm việc' });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = require('../schemas/admin.schema').scheduleSchema.parse({ body: req.body });
    const schedule = await adminService.createSchedule(body);

    await logAudit(req, 'CREATE_SCHEDULE', 'SCHEDULE', schedule.id.toString(), body);
    res.status(201).json(schedule);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ (READ-ONLY) ---

export const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const records = await adminService.getMedicalRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ điều trị' });
  }
};

// --- AUDIT LOGS ---

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await adminService.getAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy audit log' });
  }
};

// --- QUẢN LÝ TÀI CHÍNH (INVOICES & PAYMENTS) ---

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await adminService.getInvoices();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách hóa đơn' });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await adminService.getPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách giao dịch' });
  }
};

export const handleRefund = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = refundSchema.parse({ body: req.body });

    const result = await adminService.handleRefund(id, body);

    await logAudit(req, 'REFUND_PAYMENT', 'PAYMENT', id, { ...body, original_amount: result.originalAmount });
    res.json({ message: 'Hoàn tiền thành công', invoice: result.invoice });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.code) return res.status(error.code).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi xử lý hoàn tiền' });
  }
};

// --- QUẢN LÝ MARKETING (VOUCHERS) ---

export const getVouchers = async (req: Request, res: Response) => {
  try {
    const vouchers = await adminService.getVouchers();
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách voucher' });
  }
};

export const createVoucher = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = voucherSchema.parse({ body: req.body });
    const userId = (req as any).user.id;
    
    const voucher = await adminService.createVoucher(body, userId);

    await logAudit(req, 'CREATE_VOUCHER', 'VOUCHER', voucher.id, body);
    res.status(201).json(voucher);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.message === 'Mã voucher đã tồn tại') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi tạo voucher' });
  }
};

export const updateVoucher = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = voucherSchema.parse({ body: req.body });

    const voucher = await adminService.updateVoucher(id, body);

    await logAudit(req, 'UPDATE_VOUCHER', 'VOUCHER', id, body);
    res.json(voucher);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.message === 'Không tìm thấy voucher') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật voucher' });
  }
};

export const deleteVoucher = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    
    const voucher = await adminService.deleteVoucher(id);

    await logAudit(req, 'DELETE_VOUCHER', 'VOUCHER', id, voucher);
    res.json({ message: 'Xóa voucher thành công' });
  } catch (error: any) {
    if (error.message === 'Không tìm thấy voucher') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi xóa voucher' });
  }
};

// --- QUẢN LÝ ĐÁNH GIÁ (FEEDBACK) ---

export const getFeedback = async (req: Request, res: Response) => {
  try {
    const feedback = await adminService.getFeedback();
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đánh giá' });
  }
};

// --- BÁO CÁO & THỐNG KÊ (ANALYTICS) ---

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const summary = await adminService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy tổng quan dashboard' });
  }
};

export const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getRevenueStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê doanh thu' });
  }
};

export const getStaffPerformance = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getStaffPerformance();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy hiệu suất nhân viên' });
  }
};
