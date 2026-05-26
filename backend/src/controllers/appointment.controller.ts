import { Request, Response } from 'express';
import { ZodError } from 'zod';
import appointmentService from '../services/appointment.service';
import { createAppointmentSchema, updateAppointmentStatusSchema, createPublicAppointmentSchema, updateMedicalRecordSchema } from '../schemas/appointment.schema';

// Lấy danh sách lịch hẹn
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await appointmentService.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo lịch hẹn mới
export const createAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = createAppointmentSchema.parse({ body: req.body });
    const appointment = await appointmentService.createAppointment(validated.body);
    return res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    // Xử lý lỗi trùng lịch từ database (EXCLUDE USING gist)
    if (error.constraint === 'no_overlap_ktv') {
      return res.status(400).json({ message: 'Kỹ thuật viên đã có lịch trong khung giờ này.' });
    }
    if (error.constraint === 'no_overlap_phong') {
      return res.status(400).json({ message: 'Phòng đã được đặt trong khung giờ này.' });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo lịch hẹn từ Website (Public)
export const createPublicAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = createPublicAppointmentSchema.parse({ body: req.body });
    const appointment = await appointmentService.createPublicAppointment(validated.body);
    return res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi tạo lịch hẹn public:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật trạng thái
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = updateAppointmentStatusSchema.parse({ params: req.params, body: req.body });
    const { id } = validated.params;

    const appointment = await appointmentService.updateAppointmentStatus(id, validated.body);
    return res.json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message === 'Không tìm thấy lịch hẹn') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật hồ sơ bệnh án (Bác sĩ)
export const updateMedicalRecord = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = updateMedicalRecordSchema.parse({ params: req.params, body: req.body });
    const { id } = validated.params;

    const appointment = await appointmentService.updateMedicalRecord(id, validated.body);
    return res.json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi cập nhật hồ sơ bệnh án:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message === 'Không tìm thấy lịch khám để cập nhật hồ sơ') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy danh sách lịch hẹn của Khách hàng đang đăng nhập
export const getCustomerAppointments = async (req: Request, res: Response): Promise<any> => {
  try {
    const nguoi_dung_id = (req as any).user.id;
    const appointments = await appointmentService.getCustomerAppointments(nguoi_dung_id);
    return res.json(appointments);
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn của khách hàng:', error);
    return res.status(500).json({ message: 'Lỗi server khi truy vấn lịch hẹn.' });
  }
};

// Khách hàng tự hủy lịch hẹn của mình
export const cancelCustomerAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const nguoi_dung_id = (req as any).user.id;
    const ly_do_huy = req.body.ly_do_huy as string;

    if (!ly_do_huy) {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do hủy lịch hẹn.' });
    }

    const appointment = await appointmentService.cancelCustomerAppointment(id, nguoi_dung_id, ly_do_huy);
    return res.json({ success: true, message: 'Đã hủy lịch hẹn thành công.', appointment });
  } catch (error: any) {
    console.error('Lỗi khi khách hàng hủy lịch:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server khi hủy lịch hẹn.' });
  }
};
