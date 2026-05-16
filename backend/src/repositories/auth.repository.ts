import { pool } from '../config/db';

class AuthRepository {
  async findUserByEmail(email: string) {
    const { rows } = await pool.query('SELECT * FROM nguoi_dung WHERE email = $1', [email]);
    return rows[0];
  }

  async findActiveUserByEmail(email: string) {
    const { rows } = await pool.query('SELECT * FROM nguoi_dung WHERE email = $1 AND deleted_at IS NULL', [email]);
    return rows[0];
  }

  async createUser(data: { ho_ten: string, email: string, mat_khau_hash: string }) {
    const { rows } = await pool.query(
      `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email)
       VALUES ($1, $2, $3, 1, 'hoat_dong', FALSE)
       RETURNING id, email`,
      [data.ho_ten, data.email, data.mat_khau_hash]
    );
    return rows[0];
  }

  async saveOTP(email: string, otp: string, expiresAt: Date) {
    await pool.query(
      'INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );
  }

  async findValidOTP(email: string, otp: string) {
    const { rows } = await pool.query(
      'SELECT id FROM otp_codes WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );
    return rows[0];
  }

  async verifyEmail(email: string) {
    const { rows } = await pool.query(
      'UPDATE nguoi_dung SET da_xac_thuc_email = TRUE WHERE email = $1 RETURNING *',
      [email]
    );
    return rows[0];
  }

  async deleteOTPsByEmail(email: string) {
    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    await pool.query(
      'INSERT INTO refresh_tokens (nguoi_dung_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );
  }

  async findValidRefreshToken(token: string) {
    const { rows } = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [token]);
    return rows[0];
  }

  async findUserById(id: string) {
    const { rows } = await pool.query(
      'SELECT id, ho_ten, email, vai_tro_id, trang_thai, avatar_url, thoi_gian_tao FROM nguoi_dung WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return rows[0];
  }

  async updateLastLogin(userId: string) {
    await pool.query('UPDATE nguoi_dung SET lan_dang_nhap_cuoi = NOW() WHERE id = $1', [userId]);
  }
}

export default new AuthRepository();
