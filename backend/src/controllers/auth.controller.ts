import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { loginSchema, registerSchema, verifyEmailSchema, refreshTokenSchema } from '../schemas/auth.schema';
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
