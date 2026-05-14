import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { pool } from '../config/db';

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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM nguoi_dung WHERE email = $1 AND deleted_at IS NULL', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];

    if (user.trang_thai !== 'hoat_dong') {
      return res.status(403).json({ message: 'Account is locked or inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.mat_khau_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
      message: 'Login successful',
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
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<any> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
    
    // verify in DB
    const { rows } = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [refreshToken]);
    if (rows.length === 0) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    // get user
    const userRows = await pool.query('SELECT * FROM nguoi_dung WHERE id = $1 AND deleted_at IS NULL', [decoded.id]);
    if (userRows.rows.length === 0) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    const user = userRows.rows[0];
    const newAccessToken = generateAccessToken(user);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
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
