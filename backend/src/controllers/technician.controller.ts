import { Request, Response } from 'express';
import technicianService from '../services/technician.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    vai_tro_id: number;
  };
}

// GET /api/technician/queue
export const getQueue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const queue = await technicianService.getQueue(userId);
    res.json(queue);
  } catch (error: any) {
    console.error('Lỗi khi lấy hàng đợi trị liệu KTV:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/technician/appointments
export const getAppointments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    
    const appointments = await technicianService.getAppointments(userId, startDate, endDate);
    res.json(appointments);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách lịch hẹn KTV:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/technician/appointments/:id
export const getAppointmentDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id) {
      return res.status(400).json({ message: 'Thiếu ID lịch hẹn.' });
    }
    const detail = await technicianService.getAppointmentDetail(id);
    res.json(detail);
  } catch (error: any) {
    console.error('Lỗi khi lấy chi tiết ca trị liệu KTV:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/technician/appointments/assess
export const saveTreatmentRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { lich_dat_id, vas_truoc, vas_sau, ghi_chu } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    if (!lich_dat_id) {
      return res.status(400).json({ message: 'Thiếu ID ca trị liệu.' });
    }
    if (vas_truoc === undefined || vas_sau === undefined) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ lượng giá VAS trước và sau buổi.' });
    }

    const result = await technicianService.saveTreatmentRecord(userId, {
      lich_dat_id,
      vas_truoc: Number(vas_truoc),
      vas_sau: Number(vas_sau),
      ghi_chu
    });
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi khi lưu kết quả buổi trị liệu KTV:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/technician/schedules
export const getSchedules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const schedules = await technicianService.getSchedules(userId);
    res.json(schedules);
  } catch (error: any) {
    console.error('Lỗi khi lấy lịch trực KTV:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};
