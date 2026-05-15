import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { pool } from '../config/db';
import { loginSchema, registerSchema, verifyEmailSchema, refreshTokenSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';
import { sendOTP } from '../utils/mailer';

const generateAccessToken = (user: any) => {
  return jwt.sign(
    { id: user.id, email: user.email, vai_tro_id: user.vai_tro_id },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user: any) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response): Promise<any> => {
  let ho_ten, email, password;
  try {
    const validated = registerSchema.parse({ body: req.body });
    ho_ten = validated.body.ho_ten;
    email = validated.body.email;
    password = validated.body.password;
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(400).json({ message: 'Dữ liệu đầu vào không hợp lệ' });
  }

  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM nguoi_dung WHERE email = $1',
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const salt = await bcrypt.genSalt(10);
    const mat_khau_hash = await bcrypt.hash(password, salt);

    // Insert user with da_xac_thuc_email = false
    const { rows } = await pool.query(
      `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email)
       VALUES ($1, $2, $3, 1, 'hoat_dong', FALSE)
       RETURNING id, email`,
      [ho_ten, email, mat_khau_hash]
    );

    const user = rows[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    await pool.query(
      'INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // Gửi email qua Ethereal
    await sendOTP(email, otp, ho_ten);

    res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP.',
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  let email, password;
  try {
    const validatedData = loginSchema.parse({ body: req.body });
    email = validatedData.body.email;
    password = validatedData.body.password;
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(400).json({ message: 'Dữ liệu đầu vào không hợp lệ' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM v_nguoi_dung_active WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const user = rows[0];

    if (user.trang_thai !== 'hoat_dong') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa' });
    }

    if (!user.da_xac_thuc_email) {
      return res.status(403).json({ 
        message: 'Tài khoản chưa được xác thực email',
        requiresVerification: true,
        email: user.email 
      });
    }

    const isMatch = await bcrypt.compare(password, user.mat_khau_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      'INSERT INTO refresh_tokens (nguoi_dung_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    await pool.query('UPDATE nguoi_dung SET lan_dang_nhap_cuoi = NOW() WHERE id = $1', [user.id]);

    res.json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        vai_tro_id: user.vai_tro_id,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
  let email, otp;
  try {
    const validatedData = verifyEmailSchema.parse({ body: req.body });
    email = validatedData.body.email;
    otp = validatedData.body.otp;
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(400).json({ message: 'Dữ liệu đầu vào không hợp lệ' });
  }

  try {
    // Check OTP
    const { rows: otpRows } = await pool.query(
      'SELECT id FROM otp_codes WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    // Mark email as verified
    const { rows: userRows } = await pool.query(
      'UPDATE nguoi_dung SET da_xac_thuc_email = TRUE WHERE email = $1 RETURNING *',
      [email]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Delete used OTPs for this email
    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

    const user = userRows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      'INSERT INTO refresh_tokens (nguoi_dung_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    await pool.query('UPDATE nguoi_dung SET lan_dang_nhap_cuoi = NOW() WHERE id = $1', [user.id]);

    res.json({
      message: 'Xác thực email thành công',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        vai_tro_id: user.vai_tro_id,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ message: 'Lỗi server khi xác thực email' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<any> => {
  let refreshTokenStr;
  try {
    const validatedData = refreshTokenSchema.parse({ body: req.body });
    refreshTokenStr = validatedData.body.refreshToken;
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(400).json({ message: 'Dữ liệu đầu vào không hợp lệ' });
  }

  try {
    const decoded = jwt.verify(refreshTokenStr, process.env.JWT_REFRESH_SECRET as string) as any;

    const { rows } = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [refreshTokenStr]);
    if (rows.length === 0) {
      return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }

    const userRows = await pool.query('SELECT * FROM nguoi_dung WHERE id = $1 AND deleted_at IS NULL', [decoded.id]);
    if (userRows.rows.length === 0) {
      return res.status(403).json({ message: 'Người dùng không tồn tại hoặc bị vô hiệu hóa' });
    }

    const user = userRows.rows[0];
    const newAccessToken = generateAccessToken(user);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(403).json({ message: 'Refresh token không hợp lệ' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<any> => {
  try {
    const { rows } = await pool.query(
      'SELECT id, ho_ten, email, vai_tro_id, trang_thai, avatar_url, thoi_gian_tao FROM nguoi_dung WHERE id = $1 AND deleted_at IS NULL',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
