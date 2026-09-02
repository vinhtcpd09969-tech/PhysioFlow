import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/appError';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next(new UnauthorizedError('Vui lòng đăng nhập để tiếp tục.'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next(new UnauthorizedError('Định dạng mã xác thực (Token) không hợp lệ.'));
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // { id, vai_tro_id, email }
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
    }
    return next(new UnauthorizedError('Mã xác thực không hợp lệ. Vui lòng đăng nhập lại.'));
  }
};

export const authorizeRoles = (...roles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.map(Number).includes(Number(req.user.vai_tro_id))) {
      return next(new ForbiddenError('Bạn không có quyền truy cập vào tài nguyên này.'));
    }
    next();
  };
};

export const optionalVerifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // Không có token -> đi tiếp dưới dạng Khách vãng lai
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next();
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (err) {
    // Token không hợp lệ hoặc hết hạn -> Báo lỗi để thiết bị client biết và xử lý
    return next(new UnauthorizedError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'));
  }
};

export default {
  verifyToken,
  authorizeRoles,
  optionalVerifyToken
};
