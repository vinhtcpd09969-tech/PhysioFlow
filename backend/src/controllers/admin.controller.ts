import { Request, Response } from 'express';
import { ZodError } from 'zod';
import adminService from '../services/admin.service';
import { packageSchema, staffSchema, roomSchema, equipmentSchema } from '../schemas/admin.schema';
import { refundSchema } from '../schemas/finance.schema';
import { voucherSchema } from '../schemas/marketing.schema';

// --- QUẢN LÝ PHÒNG KHÁM ---

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await adminService.getRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phòng', error });
  }
};

export const createRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = roomSchema.parse({ body: req.body });
    const room = await adminService.createRoom(body);
    res.status(201).json(room);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server khi tạo phòng', error });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = roomSchema.parse({ body: req.body });
    const room = await adminService.updateRoom(id, body);
    res.json(room);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật phòng', error });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const room = await adminService.deleteRoom(id);
    res.json({ message: 'Xóa phòng thành công', room });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa phòng', error });
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

    res.status(201).json(packageData);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updatePackage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = packageSchema.parse({ body: req.body });
    const packageData = await adminService.updatePackage(id, body);

    res.json(packageData);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deletePackage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    await adminService.deletePackage(id);

    res.json({ message: 'Xóa gói điều trị thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa gói điều trị' });
  }
};

// --- QUẢN LÝ DANH MỤC GÓI ---
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await adminService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách danh mục' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await adminService.createCategory(req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo danh mục' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const category = await adminService.updateCategory(id, req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật danh mục' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await adminService.deleteCategory(id);
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa danh mục' });
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
    const { body } = equipmentSchema.parse({ body: req.body });
    const equipment = await adminService.createEquipment(body);

    res.status(201).json(equipment);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error?.statusCode === 400) return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi tạo thiết bị' });
  }
};

export const updateEquipment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = equipmentSchema.parse({ body: req.body });
    const equipment = await adminService.updateEquipment(id, body);

    res.json(equipment);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error?.statusCode === 400) return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật thiết bị', error });
  }
};

export const deleteEquipment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const equipment = await adminService.deleteEquipment(id);

    res.json({ message: 'Xóa thiết bị thành công', equipment });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa thiết bị', error });
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

    res.status(201).json(schedule);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const schedule = await adminService.updateSchedule(id, req.body);
    res.json(schedule);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Lỗi server khi cập nhật lịch trực' });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    await adminService.deleteSchedule(id);
    res.json({ message: 'Xóa lịch trực thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa lịch trực' });
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

export const getAvailableStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dich_vu_id, dang_ky_goi_id, ngay, gio_bat_dau } = req.query as {
      dich_vu_id?: string;
      dang_ky_goi_id?: string;
      ngay?: string;
      gio_bat_dau?: string;
    };

    if (!ngay || !gio_bat_dau) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày hoặc giờ bắt đầu' });
    }

    const availableStaff = await adminService.getAvailableStaff(
      dich_vu_id || null,
      dang_ky_goi_id || null,
      ngay,
      gio_bat_dau
    );

    res.json(availableStaff);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách kỹ thuật viên khả dụng:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy kỹ thuật viên khả dụng' });
  }
};