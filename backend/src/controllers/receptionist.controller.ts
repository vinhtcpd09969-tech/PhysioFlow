import { Request, Response } from 'express';
import receptionistService from '../services/receptionist.service';

// GET /api/receptionist/today-appointments
export const getTodayAppointments = async (req: Request, res: Response) => {
  try {
    const kanbanData = await receptionistService.getTodayAppointments();
    res.json(kanbanData);
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn hôm nay:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/dashboard
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const data = await receptionistService.getDashboardData();
    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu dashboard lễ tân:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// PATCH /api/receptionist/appointments/:id/status
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { trang_thai } = req.body;
    const appointment = await receptionistService.updateAppointmentStatus(id, trang_thai);
    res.json(appointment);
  } catch (error: any) {
    console.error('Lỗi cập nhật trạng thái:', error);
    if (error.message === 'Không tìm thấy lịch hẹn') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'ROOM_UNAVAILABLE') {
      return res.status(400).json({ message: 'Không có phòng trống cho dịch vụ này tại thời điểm hiện tại.' });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/stats
export const getReceptionistStats = async (req: Request, res: Response) => {
  try {
    const stats = await receptionistService.getReceptionistStats();
    res.json(stats);
  } catch (error) {
    console.error('Lỗi thống kê:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/walk-in
export const handleWalkInBooking = async (req: Request, res: Response) => {
  try {
    const result = await receptionistService.handleWalkInBooking(req.body);
    res.json({ message: 'Tạo lịch thành công', ...result });
  } catch (error: any) {
    console.error('Lỗi Walk-in booking:', error);
    if (error.message === 'ROOM_UNAVAILABLE') {
      return res.status(400).json({ message: 'Không có phòng trống cho dịch vụ này tại thời điểm hiện tại.' });
    }
    res.status(500).json({ message: 'Lỗi server khi tạo lịch' });
  }
};

// POST /api/receptionist/billing
export const createBillingFromAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { lich_dat_id } = req.body;
    const result = await receptionistService.createBillingFromAppointment(lich_dat_id);
    res.json({ message: 'Tạo hóa đơn thành công', hoa_don: result });
  } catch (error: any) {
    console.error('Lỗi khi tạo hóa đơn:', error);
    if (error.message === 'Lịch hẹn không hợp lệ hoặc chưa hoàn thành') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/payment
export const processPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.processPayment(req.body);
    res.json({ message: 'Thanh toán thành công', ...result });
  } catch (error: any) {
    console.error('Lỗi thanh toán:', error);
    if (error.message === 'Không tìm thấy hóa đơn') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Số tiền nhận không đủ')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/billing/calculate
export const calculateBilling = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.calculateBilling(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi tính hóa đơn:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/receptionist/billing/create
export const createBillingDirect = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.createBillingDirect(req.body);
    res.json({ message: 'Tạo hóa đơn thành công', hoa_don: result });
  } catch (error: any) {
    console.error('Lỗi tạo hóa đơn direct:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/receptionist/sessions/:id/services
export const updateSessionServices = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { services } = req.body;
    const result = await receptionistService.updateSessionServices(id, services);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi cập nhật dịch vụ buổi trị liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/sessions/:id/services
export const getSessionServices = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const result = await receptionistService.getSessionServices(id);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy dịch vụ buổi trị liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
