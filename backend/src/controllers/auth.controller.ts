import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/appError';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    ...result
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json({
    success: true,
    message: 'Đăng nhập thành công',
    ...result
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyEmail(req.body);
  res.json({
    success: true,
    message: 'Xác thực email thành công',
    ...result
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  res.json({
    success: true,
    ...result
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user.id);
  res.json({
    success: true,
    ...user
  });
});

export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resendOTP(req.body.email);
  res.json({
    success: true,
    ...result
  });
});

export const checkEmail = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.checkEmail(req.body.email);
  res.json({
    success: true,
    ...result
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body.email);
  res.json({
    success: true,
    ...result
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);
  res.json({
    success: true,
    ...result
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { ho_ten, so_dien_thoai, anh_dai_dien, so_nam_kinh_nghiem, bang_cap_chung_chi, mo_ta, the_manh, gioi_tinh, dia_chi, ngay_sinh } = req.body;
  const parsedExp = so_nam_kinh_nghiem !== undefined ? parseInt(so_nam_kinh_nghiem, 10) : undefined;
  const parsedTheManh = Array.isArray(the_manh)
    ? the_manh.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 6)
    : undefined;

  const updatedUser = await authService.updateProfile(req.user.id, {
    ho_ten,
    so_dien_thoai,
    anh_dai_dien,
    so_nam_kinh_nghiem: isNaN(parsedExp as number) ? undefined : parsedExp,
    bang_cap_chung_chi,
    mo_ta,
    the_manh: parsedTheManh,
    gioi_tinh,
    dia_chi,
    ngay_sinh
  });

  res.json({
    success: true,
    message: 'Cập nhật thông tin thành công',
    user: updatedUser
  });
});

export const sendChangePasswordOTP = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.sendChangePasswordOTP(req.user.id);
  res.json({
    success: true,
    ...result
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { otp, oldPassword, newPassword } = req.body;
  if (!newPassword) {
    throw new BadRequestError('Vui lòng nhập mật khẩu mới');
  }
  if (!otp && !oldPassword) {
    throw new BadRequestError('Vui lòng cung cấp mã OTP xác thực');
  }
  const result = await authService.changePassword(req.user.id, { otp, oldPassword, newPassword });
  res.json({
    success: true,
    ...result
  });
});

export const getMyShiftToday = asyncHandler(async (req: Request, res: Response) => {
  const { checkUserHasActiveShiftToday } = await import('../middlewares/shiftGuard.middleware');
  const userId = req.user.id;
  const roleId = Number(req.user.vai_tro_id);
  const result = await checkUserHasActiveShiftToday(userId, roleId);
  res.json({
    success: true,
    hasShiftToday: result.hasShift,
    shiftInfo: result.shiftInfo
  });
});

