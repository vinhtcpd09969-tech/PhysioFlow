import { Request, Response, NextFunction } from 'express';

// Sử dụng bộ nhớ RAM (In-Memory Map) để lưu vết lượt gọi của IP/User trong ngày
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const aiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000; // 24 giờ

  let limit = 5; // Mặc định khách chưa đăng nhập được hỏi tối đa 5 câu
  let key = '';

  if (req.user && req.user.id) {
    // Người dùng đã đăng nhập
    limit = 50; // Thành viên được hỏi tối đa 50 câu/ngày
    key = `user_${req.user.id}`;
  } else {
    // Khách vãng lai
    limit = 5;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    key = `guest_${String(ip)}`;
  }

  const record = requestCounts.get(key);

  if (!record) {
    // Lượt gọi đầu tiên
    requestCounts.set(key, {
      count: 1,
      resetTime: now + ONE_DAY,
    });
    return next();
  }

  if (now > record.resetTime) {
    // Quá 24h, reset lại bộ đếm cho Key này
    record.count = 1;
    record.resetTime = now + ONE_DAY;
    return next();
  }

  if (record.count >= limit) {
    // Vượt quá hạn mức
    const remainingTime = Math.ceil((record.resetTime - now) / (60 * 60 * 1000)); // Tính số giờ còn lại
    const message = req.user
      ? `Bạn đã hết lượt hỏi AI trong ngày hôm nay (Tối đa ${limit} câu/ngày). Vui lòng quay lại sau ${remainingTime} giờ.`
      : `Khách vãng lai chỉ được hỏi tối đa ${limit} câu/ngày. Bạn vui lòng đăng ký/đăng nhập tài khoản để được hỏi thêm nhé!`;
    
    return res.status(429).json({
      success: false,
      message,
    });
  }

  // Tăng bộ đếm
  record.count += 1;
  next();
};
