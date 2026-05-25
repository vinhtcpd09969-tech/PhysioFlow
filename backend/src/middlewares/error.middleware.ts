import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. AppError (Operational expected errors)
  if (err instanceof AppError) {
    const responsePayload: Record<string, any> = {
      success: false,
      message: err.message,
    };
    
    // Include extra operational details if they exist (e.g. auth verification status)
    if (err.requiresVerification) {
      responsePayload.requiresVerification = true;
    }
    if (err.email) {
      responsePayload.email = err.email;
    }

    res.status(err.statusCode).json(responsePayload);
    return;
  }

  // 2. ZodError (Schema validation issues)
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: err.errors[0].message,
      errors: err.errors,
    });
    return;
  }

  // 3. JWT Library Errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    });
    return;
  }

  // 4. Default Unknown errors
  console.error('💥 CENTRALIZED UNHANDLED ERROR:', err);

  res.status(500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ.',
  });
};
