import prisma from '../../config/prisma';

export class AuthTokenRepository {
  async saveOTP(email: string, otp: string, expiresAt: Date) {
    // Dọn mã OTP hết hạn của MỌI email — không có cron riêng, tận dụng luôn request tạo OTP mới
    // (đăng ký/gửi lại/quên mật khẩu) làm điểm quét.
    await prisma.otp_codes.deleteMany({ where: { expires_at: { lte: new Date() } } });

    await prisma.otp_codes.create({
      data: {
        email,
        otp,
        expires_at: expiresAt,
      }
    });
  }

  async findValidOTP(email: string, otp: string) {
    return prisma.otp_codes.findFirst({
      where: {
        email,
        otp,
        expires_at: {
          gt: new Date()
        }
      },
      select: {
        id: true
      }
    });
  }

  async deleteOTPsByEmail(email: string) {
    await prisma.otp_codes.deleteMany({
      where: { email }
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date, isCustomer: boolean) {
    // Dọn refresh token hết hạn của MỌI người dùng — không có endpoint logout xóa token, nên đây
    // là điểm quét duy nhất (mỗi lần đăng nhập/đăng ký thành công đều tạo token mới).
    await prisma.refresh_tokens.deleteMany({ where: { expires_at: { lte: new Date() } } });

    await prisma.refresh_tokens.create({
      data: {
        nguoi_dung_id: isCustomer ? null : parseInt(userId, 10),
        khach_hang_id: isCustomer ? userId : null,
        token,
        expires_at: expiresAt,
      }
    });
  }

  async findValidRefreshToken(token: string) {
    return prisma.refresh_tokens.findFirst({
      where: {
        token,
        expires_at: {
          gt: new Date()
        }
      }
    });
  }
}

export default new AuthTokenRepository();
