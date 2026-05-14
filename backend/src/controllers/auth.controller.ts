import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { pool } from '../config/db';
import { loginSchema, refreshTokenSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';

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
    const { rows } = await pool.query('SELECT * FROM nguoi_dung WHERE (email = $1 OR so_dien_thoai = $1) AND deleted_at IS NULL', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email/Số điện thoại hoặc mật khẩu không chính xác' });
    }

    const user = rows[0];

    if (user.trang_thai !== 'hoat_dong') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa' });
    }

    const isMatch = await bcrypt.compare(password, user.mat_khau_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email/Số điện thoại hoặc mật khẩu không chính xác' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

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

    // verify in DB
    const { rows } = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [refreshTokenStr]);
    if (rows.length === 0) {
      return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }

    // get user
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
      'SELECT id, ho_ten, email, so_dien_thoai, vai_tro_id, trang_thai, avatar_url, thoi_gian_tao FROM nguoi_dung WHERE id = $1 AND deleted_at IS NULL',
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
