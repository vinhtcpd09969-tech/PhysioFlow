import { Request, Response } from 'express';
import doctorService from '../services/doctor.service';
import adminService from '../services/admin.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    vai_tro_id: number;
  };
}

// GET /api/doctor/queue
export const getQueue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const queue = await doctorService.getQueue(userId, userRole);
    res.json(queue);
  } catch (error: any) {
    console.error('Lỗi khi lấy hàng đợi bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/appointments
export const getAppointments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    
    const appointments = await doctorService.getAppointments(userId, userRole, startDate, endDate);
    res.json(appointments);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách lịch hẹn bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/patients/:patientId/profile
export const getPatientProfile = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params as { patientId: string };
    if (!patientId) {
      return res.status(400).json({ message: 'Thiếu ID khách hàng.' });
    }
    const profile = await doctorService.getPatientMedicalProfile(patientId);
    res.json(profile);
  } catch (error: any) {
    console.error('Lỗi khi lấy hồ sơ bệnh án khách hàng:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/appointments/:id
export const getAppointmentDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id) {
      return res.status(400).json({ message: 'Thiếu ID lịch hẹn.' });
    }
    const detail = await doctorService.getAppointmentDetail(id);
    res.json(detail);
  } catch (error: any) {
    console.error('Lỗi khi lấy chi tiết ca khám:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/doctor/appointments/assess
export const saveAssessment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { lich_dat_id, chan_doan, chong_chi_dinh, goi_dich_vu_id, dich_vu_id, ghi_chu } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    if (!lich_dat_id || !chan_doan) {
      return res.status(400).json({ message: 'Thiếu mã lịch khám hoặc chẩn đoán lâm sàng.' });
    }

    const result = await doctorService.saveAssessment(userId, {
      lich_dat_id,
      chan_doan,
      chong_chi_dinh,
      goi_dich_vu_id,
      ghi_chu,
    });

    res.json({
      message: 'Ghi nhận chẩn đoán lâm sàng và hoàn thành ca khám thành công!',
      ...result,
    });
  } catch (error: any) {
    console.error('Lỗi khi lưu chẩn đoán khám bệnh:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/services
export const getServices = async (req: Request, res: Response) => {
  try {
    const packages = await adminService.getPackages();
    // Lọc ra các gói lẻ (LE) đang hoạt động
    const retailPackages = packages
      .filter((pkg: any) => pkg.loai_goi === 'LE' && pkg.trang_thai === 'hoat_dong')
      .map((pkg: any) => ({
        id: pkg.id,
        ten_dich_vu: pkg.ten_goi,
        don_gia: Number(pkg.don_gia),
        gia_hien_tai: Number(pkg.don_gia),
        thoi_luong_phut: pkg.thoi_luong_phut,
        loai_dich_vu: 'DIEU_TRI',
        dang_hoat_dong: true,
      }));
    res.json(retailPackages);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách dịch vụ cho bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/packages
export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = await adminService.getPackages();
    // Lọc ra các gói liệu trình (LIEU_TRINH) đang hoạt động
    const activePackages = packages.filter((pkg: any) => pkg.loai_goi === 'LIEU_TRINH' && pkg.trang_thai === 'hoat_dong');
    res.json(activePackages);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách gói cho bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/schedules
export const getSchedules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const schedules = await doctorService.getSchedules(userId);
    res.json(schedules);
  } catch (error: any) {
    console.error('Lỗi khi lấy lịch trực của bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/patients
export const getPatients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const patients = await doctorService.getPatients(userId);
    res.json(patients);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách bệnh nhân cho bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};
