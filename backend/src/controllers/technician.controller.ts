import { Request, Response } from 'express';
import technicianService from '../services/technician.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, UnauthorizedError } from '../utils/appError';

// GET /api/technician/queue
export const getQueue = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  }
  const queue = await technicianService.getQueue(userId);
  res.json(queue);
});

// GET /api/technician/appointments
export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  if (!userId) {
    throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  }

  const appointments = await technicianService.getAppointments(userId, startDate, endDate);
  res.json(appointments);
});

// GET /api/technician/appointments/:id
export const getAppointmentDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id;
  const confirmOvertime = req.query.confirmOvertime === 'true';

  if (!id) {
    throw new BadRequestError('Thiếu ID lịch hẹn.');
  }

  const detail = await technicianService.getAppointmentDetail(id, userId, confirmOvertime);
  res.json(detail);
});

// POST /api/technician/appointments/assess
export const saveTreatmentRecord = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { lich_dat_id, vas_truoc, vas_sau, ghi_chu, du_lieu_tri_lieu } = req.body;

  if (!userId) {
    throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  }
  if (!lich_dat_id) {
    throw new BadRequestError('Thiếu ID ca trị liệu.');
  }
  if (vas_truoc === undefined || vas_sau === undefined) {
    throw new BadRequestError('Vui lòng điền đầy đủ lượng giá VAS trước và sau buổi.');
  }

  const result = await technicianService.saveTreatmentRecord(userId, {
    lich_dat_id,
    vas_truoc: Number(vas_truoc),
    vas_sau: Number(vas_sau),
    ghi_chu: ghi_chu || '',
    du_lieu_tri_lieu
  });
  res.json(result);
});

// POST /api/technician/appointments/draft
export const saveTreatmentDraft = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { lich_dat_id, vas_truoc, vas_sau, ghi_chu, du_lieu_tri_lieu } = req.body;

  if (!userId) {
    throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  }
  if (!lich_dat_id) {
    throw new BadRequestError('Thiếu ID ca trị liệu.');
  }

  const result = await technicianService.saveTreatmentDraft(userId, {
    lich_dat_id,
    vas_truoc: vas_truoc !== undefined ? Number(vas_truoc) : undefined,
    vas_sau: vas_sau !== undefined ? Number(vas_sau) : undefined,
    ghi_chu,
    du_lieu_tri_lieu,
  });
  res.json(result);
});

// GET /api/technician/schedules
export const getSchedules = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  }
  const schedules = await technicianService.getSchedules(userId);
  res.json(schedules);
});

// GET /api/technician/active-session
export const getActiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  }
  const activeSession = await technicianService.getActiveSession(userId);
  res.json(activeSession);
});

// GET /api/technician/workstation-info
export const getWorkstationInfo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  }
  const appointmentId = (req.query.appointment_id as string) || null;
  const info = await technicianService.getWorkstationInfo(userId, appointmentId);
  res.json(info);
});
