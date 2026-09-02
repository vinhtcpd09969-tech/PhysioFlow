import { Request, Response } from 'express';
import doctorService from '../services/doctor.service';
import adminService from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, UnauthorizedError } from '../utils/appError';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    vai_tro_id: number;
  };
}

// GET /api/doctor/queue
export const getQueue = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  const queue = await doctorService.getQueue(userId, userRole);
  res.json(queue);
});

// GET /api/doctor/appointments
export const getAppointments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  
  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  const appointments = await doctorService.getAppointments(userId, userRole, startDate, endDate);
  res.json(appointments);
});

// GET /api/doctor/patients/:patientId/profile
export const getPatientProfile = asyncHandler(async (req: Request, res: Response) => {
  let { patientId } = req.params as { patientId: string };
  const userRole = Number((req as any).user?.vai_tro_id || 0);
  const userId = String((req as any).user?.id || '');

  // Nếu là Khách hàng (role 1), mặc định lấy hồ sơ của chính mình nếu patientId là 'me' hoặc rỗng
  if (userRole === 1 && (!patientId || patientId === 'me' || patientId === 'my-profile')) {
    patientId = userId;
  }

  if (!patientId) throw new BadRequestError('Thiếu ID khách hàng.');
  const profile = await doctorService.getPatientMedicalProfile(patientId);
  res.json(profile);
});

// GET /api/doctor/appointments/:id
export const getAppointmentDetail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id;
  if (!id) throw new BadRequestError('Thiếu ID lịch hẹn.');
  const detail = await doctorService.getAppointmentDetail(id, userId);
  res.json(detail);
});

// POST /api/doctor/appointments/assess
export const saveAssessment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const {
    lich_dat_id, chan_doan, chong_chi_dinh, goi_dich_vu_id, goi_dich_vu_ids, ghi_chu,
    resolvePendingConflict, is_reassessment, han_tai_kham,
    vas_score, rom_data, mmt_data
  } = req.body;

  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  if (!lich_dat_id) throw new BadRequestError('Thiếu mã lịch khám.');

  const finalChanDoan = chan_doan?.trim() || 'Chưa điền';
  const finalChongChiDinh = chong_chi_dinh?.trim() || 'Chưa điền';
  const finalGhiChu = ghi_chu?.trim() || null;

  try {
    const result = await doctorService.saveAssessment(userId, {
      lich_dat_id,
      chan_doan: finalChanDoan,
      chong_chi_dinh: finalChongChiDinh,
      goi_dich_vu_id: goi_dich_vu_id || null,
      goi_dich_vu_ids: goi_dich_vu_ids || (goi_dich_vu_id ? [goi_dich_vu_id] : []),
      ghi_chu: finalGhiChu,
      resolvePendingConflict,
      is_reassessment: Boolean(is_reassessment),
      han_tai_kham: han_tai_kham || null,
      vas_score: vas_score != null ? Number(vas_score) : null,
      rom_data: rom_data || null,
      mmt_data: mmt_data || null,
    });

    res.json({
      message: is_reassessment ? 'Hẹn tái khám thành công! Lịch hẹn đã chuyển sang Chờ tái lượng giá.' : 'Ghi nhận kết luận lượng giá và hoàn thành ca khám thành công!',
      ...result,
    });
  } catch (error: any) {
    if (error.errorCode === 'ACTIVE_LIEU_TRINH_CONFLICT' || error.errorCode === 'PENDING_LIEU_TRINH_CONFLICT') {
      return res.status(409).json({
        message: error.message,
        errorCode: error.errorCode,
      });
    }
    throw error;
  }
});

// POST /api/doctor/appointments/draft
export const saveAssessmentDraft = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const {
    lich_dat_id, chan_doan, chong_chi_dinh, ghi_chu,
    vas_score, rom_data, mmt_data, selected_package_id, selected_package_ids
  } = req.body;

  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  if (!lich_dat_id) throw new BadRequestError('Thiếu mã lịch khám.');

  const result = await doctorService.saveAssessmentDraft(userId, {
    lich_dat_id,
    chan_doan,
    chong_chi_dinh,
    ghi_chu,
    vas_score: vas_score != null ? Number(vas_score) : undefined,
    rom_data,
    mmt_data,
    selected_package_id,
    selected_package_ids: selected_package_ids || (selected_package_id ? [selected_package_id] : []),
  });

  res.json({
    message: 'Đã lưu nháp kết quả lượng giá.',
    ...result,
  });
});

// GET /api/doctor/packages
export const getPackages = asyncHandler(async (req: Request, res: Response) => {
  const packages = await adminService.getPackages();
  // Lọc ra các gói liệu trình (LIEU_TRINH) đang hoạt động
  const activePackages = packages.filter((pkg: any) => pkg.loai_goi === 'LIEU_TRINH' && pkg.trang_thai === 'hoat_dong');
  res.json(activePackages);
});

// GET /api/doctor/schedules
export const getSchedules = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  const schedules = await doctorService.getSchedules(userId);
  res.json(schedules);
});

// GET /api/doctor/patients
export const getPatients = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  const patients = await doctorService.getPatients(userId);
  res.json(patients);
});

// POST /api/doctor/queue/:id/call-in
export const callInPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
  const { id } = req.params as { id: string };
  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  const result = await doctorService.callInPatient(id, userId, userRole);
  res.json(result);
});

// POST /api/doctor/queue/:id/mark-absent
export const markPatientAbsent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
  const { id } = req.params as { id: string };
  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  const result = await doctorService.markPatientAbsent(id, userId, userRole);
  res.json(result);
});

// GET /api/doctor/active-session
export const getActiveSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('Không xác định được danh tính người dùng.');
  const activeSession = await doctorService.getActiveSession(userId);
  res.json(activeSession);
});
