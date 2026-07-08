import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from '../repositories/auth.repository';
import { sendOTP, sendForgotPasswordOTP } from '../utils/mailer';

class AuthService {
  private generateAccessToken(user: any) {
    return jwt.sign(
      { id: user.id, email: user.email, vai_tro_id: user.vai_tro_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );
  }

  private generateRefreshToken(user: any) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d' }
    );
  }

  async register(data: any) {
    // 1. Check if email already exists
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('Email đã được đăng ký sử dụng');
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    // 3. Create customer account
    const newUser = await authRepository.createUser({
      ho_ten: data.ho_ten,
      email: data.email,
      mat_khau_hash: hash
    });

    // 4. Generate & Save OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    await authRepository.saveOTP(data.email, otp, expiresAt);

    // 5. Send verification email (fire-and-forget to avoid blocking user response)
    sendOTP(data.email, otp, data.ho_ten).catch((err) => {
      console.error('Lỗi gửi email OTP bất đồng bộ khi đăng ký:', err);
    });

    return {
      message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra hòm thư email để nhận mã OTP xác thực.',
      email: data.email
    };
  }

  async login(data: any) {
    const user = await authRepository.findActiveUserByEmail(data.email);
    if (!user) throw new Error('Email hoặc mật khẩu không chính xác');

    if (user.trang_thai !== 'hoat_dong') throw new Error('Tài khoản đã bị khóa hoặc vô hiệu hóa');

    const isVerified = (user as any).trang_thai !== 'cho_kich_hoat';
    if (!isVerified) {
      const error = new Error('Tài khoản chưa được xác thực email') as any;
      error.requiresVerification = true;
      error.email = user.email;
      throw error;
    }

    if (!user.mat_khau_hash) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(data.password, user.mat_khau_hash);
    if (!isMatch) throw new Error('Email hoặc mật khẩu không chính xác');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const isCustomer = user.vai_tro_id === 1;
    await authRepository.saveRefreshToken(String(user.id), refreshToken, expiresAt, isCustomer);
    await authRepository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        vai_tro_id: user.vai_tro_id,
        avatar_url: null
      }
    };
  }

  async verifyEmail(data: any) {
    const validOTP = await authRepository.findValidOTP(data.email, data.otp);
    if (!validOTP) throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn');

    const user = await authRepository.verifyEmail(data.email);
    if (!user) throw new Error('Người dùng không tồn tại');

    await authRepository.deleteOTPsByEmail(data.email);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const isCustomer = user.vai_tro_id === 1;
    await authRepository.saveRefreshToken(String(user.id), refreshToken, expiresAt, isCustomer);
    await authRepository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        vai_tro_id: user.vai_tro_id,
        avatar_url: null
      }
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as any;
      const validToken = await authRepository.findValidRefreshToken(token);
      if (!validToken) throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');

      const user = await authRepository.findUserById(decoded.id);
      if (!user) throw new Error('Người dùng không tồn tại hoặc bị vô hiệu hóa');

      const newAccessToken = this.generateAccessToken(user);
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Refresh token không hợp lệ');
    }
  }

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async resendOTP(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw new Error('Người dùng không tồn tại');
    
    const isVerified = (user as any).trang_thai !== 'cho_kich_hoat';
    if (isVerified) throw new Error('Tài khoản đã được xác thực email trước đó');

    // Tạo mã OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Xóa các OTP cũ và lưu OTP mới
    await authRepository.deleteOTPsByEmail(email);
    await authRepository.saveOTP(email, otp, expiresAt);
    
    // Gửi email OTP bất đồng bộ để tránh làm chậm yêu cầu gửi lại
    sendOTP(email, otp, user.ho_ten).catch((err) => {
      console.error('Lỗi gửi email OTP bất đồng bộ khi gửi lại:', err);
    });

    return { message: 'Đã gửi lại mã OTP mới. Vui lòng kiểm tra email.' };
  }

  async checkEmail(email: string) {
    const user = await authRepository.findUserByEmail(email);
    return {
      exists: !!user,
      da_xac_thuc_email: user ? (user.trang_thai !== 'cho_kich_hoat') : false
    };
  }

  async forgotPassword(email: string) {
    const user = await authRepository.findActiveUserByEmail(email);
    if (!user) throw new Error('Người dùng không tồn tại');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await authRepository.deleteOTPsByEmail(email);
    await authRepository.saveOTP(email, otp, expiresAt);

    sendForgotPasswordOTP(email, otp, user.ho_ten).catch((err) => {
      console.error('Lỗi gửi email OTP khôi phục mật khẩu bất đồng bộ:', err);
    });

    return { message: 'Đã gửi mã OTP khôi phục mật khẩu. Vui lòng kiểm tra email của bạn.' };
  }

  async resetPassword(data: any) {
    const validOTP = await authRepository.findValidOTP(data.email, data.otp);
    if (!validOTP) throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn');

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(data.newPassword, salt);

    const updatedUser = await authRepository.updatePassword(data.email, newHash);
    if (!updatedUser) throw new Error('Người dùng không tồn tại');

    await authRepository.deleteOTPsByEmail(data.email);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' };
  }

  async updateProfile(userId: string | number, data: { ho_ten: string; so_dien_thoai: string }) {
    if (!data.ho_ten) throw new Error('Họ tên không được để trống');
    return authRepository.updateProfile(userId, data);
  }
}

export default new AuthService();
