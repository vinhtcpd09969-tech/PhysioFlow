import { Request, Response } from 'express';
import { pool } from '../config/db';
import { ZodError } from 'zod';
import { createAppointmentSchema, updateAppointmentStatusSchema, createPublicAppointmentSchema } from '../schemas/appointment.schema';

// Lấy danh sách lịch hẹn
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        ld.id, ld.ma_lich_dat, ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc, ld.trang_thai, ld.loai_lich,
        nd_kh.ho_ten AS ten_khach_hang, kh.nguoi_dung_id as khach_hang_id,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        p.ten_phong
      FROM lich_dat ld
      JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN ky_thuat_vien ktv ON ld.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      ORDER BY ld.ngay_gio_bat_dau ASC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo lịch hẹn mới
export const createAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = createAppointmentSchema.parse({ body: req.body });
    const { khach_hang_id, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich } = validated.body;
    
    // Generate ma_lich_dat (e.g., LD-12345)
    const ma_lich_dat = 'LD-' + Math.floor(10000 + Math.random() * 90000);

    const query = `
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, nguoi_tao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'le_tan')
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      ma_lich_dat, khach_hang_id, dich_vu_id, ky_thuat_vien_id || null, phong_id || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich
    ]);
    
    return res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    // Xử lý lỗi trùng lịch từ database (EXCLUDE USING gist)
    if (error.constraint === 'no_overlap_ktv') {
      return res.status(400).json({ message: 'Kỹ thuật viên đã có lịch trong khung giờ này.' });
    }
    if (error.constraint === 'no_overlap_phong') {
      return res.status(400).json({ message: 'Phòng đã được đặt trong khung giờ này.' });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo lịch hẹn từ Website (Public)
export const createPublicAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = createPublicAppointmentSchema.parse({ body: req.body });
    const { ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, trieu_chung, ly_do_kham, anh_dinh_kem_url } = validated.body;
    
    // Generate ma_lich_dat (e.g., LD-12345)
    const ma_lich_dat = 'LD-' + Math.floor(10000 + Math.random() * 90000);
    
    // Mặc định thời lượng khám là 30 phút
    const ngay_gio_ket_thuc = new Date(new Date(ngay_gio_bat_dau).getTime() + 30 * 60000).toISOString();

    const query = `
      INSERT INTO lich_dat (ma_lich_dat, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, trieu_chung, ly_do_kham, anh_dinh_kem_url, nguoi_tao, loai_lich)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'guest', 'kham_moi')
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      ma_lich_dat, ho_ten_khach, so_dien_thoai, gioi_tinh_khach || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, trieu_chung || null, ly_do_kham || null, anh_dinh_kem_url || null
    ]);
    
    return res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error('Lỗi khi tạo lịch hẹn public:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật trạng thái
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = updateAppointmentStatusSchema.parse({ params: req.params, body: req.body });
    const { id } = validated.params;
    const { trang_thai } = validated.body;

    const query = `
      UPDATE lich_dat 
      SET trang_thai = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const { rows } = await pool.query(query, [trang_thai, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }
    
    return res.json(rows[0]);
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};
