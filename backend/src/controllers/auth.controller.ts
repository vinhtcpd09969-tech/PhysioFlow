import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { loginSchema, registerSchema, verifyEmailSchema, refreshTokenSchema, resendOTPSchema, checkEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/appError';

export const register = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse({ body: req.body });
    const result = await authService.register(validated.body);
    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Email đã được sử dụng') {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse({ body: req.body });
    const result = await authService.login(validatedData.body);
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Email hoặc mật khẩu không chính xác') {
      throw new UnauthorizedError(error.message);
    }
    if (error.message === 'Tài khoản đã bị khóa hoặc vô hiệu hóa') {
      throw new ForbiddenError(error.message);
    }
    if (error.requiresVerification) {
      throw new ForbiddenError(error.message, {
        requiresVerification: true,
        email: error.email
      });
    }
    throw error;
  }
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = verifyEmailSchema.parse({ body: req.body });
    const result = await authService.verifyEmail(validatedData.body);
    res.json({
      success: true,
      message: 'Xác thực email thành công',
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Mã OTP không hợp lệ hoặc đã hết hạn' || error.message === 'Người dùng không tồn tại') {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = refreshTokenSchema.parse({ body: req.body });
    const result = await authService.refreshToken(validatedData.body.refreshToken);
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    throw new ForbiddenError(error.message || 'Refresh token không hợp lệ');
  }
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({
      success: true,
      ...user
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      throw new NotFoundError(error.message);
    }
    throw error;
  }
});

export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = resendOTPSchema.parse({ body: req.body });
    const result = await authService.resendOTP(validatedData.body.email);
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại' || error.message === 'Tài khoản đã được xác thực email trước đó') {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
});

export const checkEmail = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = checkEmailSchema.parse({ body: req.body });
  const result = await authService.checkEmail(validatedData.body.email);
  res.json({
    success: true,
    ...result
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = forgotPasswordSchema.parse({ body: req.body });
    const result = await authService.forgotPassword(validatedData.body.email);
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại') {
      throw new NotFoundError(error.message);
    }
    throw error;
  }
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse({ body: req.body });
    const result = await authService.resetPassword(validatedData.body);
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Mã OTP không hợp lệ hoặc đã hết hạn' || error.message === 'Người dùng không tồn tại') {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { ho_ten, so_dien_thoai } = req.body;
    const updatedUser = await authService.updateProfile(req.user.id, { ho_ten, so_dien_thoai });
    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: updatedUser
    });
  } catch (error: any) {
    throw new BadRequestError(error.message || 'Lỗi khi cập nhật thông tin');
  }
});
