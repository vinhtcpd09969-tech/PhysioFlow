import { Request, Response } from 'express';
import appointmentService from '../services/appointment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, NotFoundError } from '../utils/appError';

// Lấy danh sách lịch hẹn
export const getAllAppointments = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : undefined;
  const appointments = await appointmentService.getAllAppointments(userRole);
  res.json(appointments);
});

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentService.createAppointment({
    ...req.body,
    nguoi_tao_id: req.user?.id ? Number(req.user.id) : null
  });
  res.status(201).json(appointment);
});

// Tạo lịch hẹn từ Website (Public)
export const createPublicAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentService.createPublicAppointment(req.body);
  res.status(201).json(appointment);
});

// Cập nhật trạng thái
export const updateAppointmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const actorRoleId = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : undefined;

  const appointment = await appointmentService.updateAppointmentStatus(id, req.body, actorRoleId);
  res.json(appointment);
});

// B11 (bản Lễ tân) — đẩy 1 lịch hẹn xuống cuối hàng đợi (khách rời chỗ chờ, không phải "không đến")
export const pushBackAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await appointmentService.pushBackAppointment(id);
  res.json(result);
});

// Lấy danh sách lịch hẹn của Khách hàng đang đăng nhập
export const getCustomerAppointments = asyncHandler(async (req: Request, res: Response) => {
  const nguoi_dung_id = (req as any).user.id;
  const appointments = await appointmentService.getCustomerAppointments(nguoi_dung_id);
  res.json(appointments);
});

// Khách hàng tự hủy lịch hẹn của mình
export const cancelCustomerAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const nguoi_dung_id = (req as any).user.id;
  const lyDoHuy = req.body.ghi_chu_noi_bo as string;

  if (!lyDoHuy) {
    throw new BadRequestError('Vui lòng cung cấp lý do hủy lịch hẹn.');
  }

  const appointment = await appointmentService.cancelCustomerAppointment(id, nguoi_dung_id, lyDoHuy);
  res.json({ success: true, message: 'Đã hủy lịch hẹn thành công.', appointment });
});

// Khách hàng tự đổi lịch hẹn đã thanh toán của mình
export const rescheduleCustomerAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const nguoi_dung_id = (req as any).user.id;
  const { new_date, new_buoi, new_staff_id } = req.body;

  if (!new_date || !new_buoi) {
    throw new BadRequestError('Vui lòng chọn ngày và buổi mới.');
  }

  const appointment = await appointmentService.rescheduleCustomerAppointment(id, nguoi_dung_id, new_date, new_buoi, new_staff_id);
  res.json({ success: true, message: 'Đổi lịch hẹn thành công.', appointment });
});

// Hủy tự động tất cả các lịch nằm trong giờ nghỉ trưa
export const cancelBreakTimeAppointments = asyncHandler(async (req: Request, res: Response) => {
  const result = await appointmentService.cancelBreakTimeAppointments();
  res.json({
    success: true,
    message: `Đã hủy tự động ${result.cancelled_count} lịch hẹn nằm trong giờ nghỉ trưa.`,
    cancelledCount: result.cancelled_count
  });
});

// Sức chứa 2 buổi (sáng/chiều) cho 1 ngày
export const getBuoiAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { date, userId, phone, dichVuId, dich_vu_id } = req.query;
  if (!date || typeof date !== 'string') {
    throw new BadRequestError('Thiếu tham số ngày (date=YYYY-MM-DD)');
  }
  const serviceId = (typeof dichVuId === 'string' ? dichVuId : (typeof dich_vu_id === 'string' ? dich_vu_id : undefined));
  const result = await appointmentService.getBuoiAvailability(
    date,
    serviceId,
    typeof userId === 'string' ? userId : undefined,
    typeof phone === 'string' ? phone : undefined
  );

  let isPhoneTakenByOther = false;
  if (typeof userId === 'string' && userId && typeof phone === 'string' && phone.trim()) {
    isPhoneTakenByOther = await appointmentService.checkPhoneTakenByOther(phone.trim(), userId);
  }

  res.json({ ...result, isPhoneTakenByOther });
});

// B15 — ngân sách phút còn lại của từng nhân sự cho 1 buổi/ngày
export const getStaffBudgetForBuoi = asyncHandler(async (req: Request, res: Response) => {
  const { date, buoi, loai, excludeApptId } = req.query;
  if (typeof date !== 'string' || (buoi !== 'sang' && buoi !== 'chieu') || typeof loai !== 'string') {
    throw new BadRequestError('Thiếu hoặc sai tham số date/buoi/loai');
  }
  const result = await appointmentService.getStaffBudgetForBuoi(
    date,
    buoi,
    loai,
    typeof excludeApptId === 'string' ? excludeApptId : undefined
  );
  res.json(result);
});

export const getActiveDoctorDates = asyncHandler(async (req: Request, res: Response) => {
  const dates = await appointmentService.getActiveDoctorDates();
  res.json({ dates });
});

// Lấy danh sách dịch vụ công khai cho khách hàng đặt lịch trực tiếp
export const getPublicServices = asyncHandler(async (req: Request, res: Response) => {
  const services = await appointmentService.getPublicServices();
  res.json(services);
});

// Lấy chi tiết lịch hẹn công khai
export const getPublicAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new BadRequestError('Mã lịch hẹn không hợp lệ.');
  }

  const appointment = await appointmentService.getPublicAppointmentById(id);
  if (!appointment) {
    throw new NotFoundError('Không tìm thấy thông tin lịch hẹn.');
  }

  res.json(appointment);
});

export const getCustomerMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const nguoi_dung_id = (req as any).user.id;
  const record = await appointmentService.getCustomerMedicalRecord(nguoi_dung_id);
  res.json(record);
});

export const getCustomerTreatmentSessions = asyncHandler(async (req: Request, res: Response) => {
  const nguoi_dung_id = (req as any).user.id;
  const sessions = await appointmentService.getCustomerTreatmentSessions(nguoi_dung_id);
  res.json(sessions);
});

export const getCustomerInvoices = asyncHandler(async (req: Request, res: Response) => {
  const nguoi_dung_id = (req as any).user.id;
  const data = await appointmentService.getCustomerInvoices(nguoi_dung_id);
  res.json(data);
});

export const keepAliveAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const appointment = await appointmentService.keepAliveAppointment(id);
  res.json({ success: true, appointment });
});
