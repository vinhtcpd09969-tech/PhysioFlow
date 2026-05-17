import { pool } from '../config/db';

class AppointmentRepository {
  async getAllAppointments() {
    const query = `
      SELECT 
        ld.id, ld.ma_lich_dat, 
        ld.ngay_gio_bat_dau AT TIME ZONE 'UTC' as ngay_gio_bat_dau, 
        ld.ngay_gio_ket_thuc AT TIME ZONE 'UTC' as ngay_gio_ket_thuc, 
        ld.trang_thai, 'kham_moi' as loai_lich,
        COALESCE(nd_kh.ho_ten, ld.ho_ten_khach) AS ten_khach_hang, 
        COALESCE(nd_kh.so_dien_thoai, ld.so_dien_thoai) AS so_dien_thoai,
        kh.nguoi_dung_id as khach_hang_id,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ld.ky_thuat_vien_id,
        ld.phong_id,
        p.ten_phong
      FROM lich_dat ld
      LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      LEFT JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN ky_thuat_vien ktv ON ld.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      
      UNION ALL
      
      SELECT 
        btl.id, 'TR' || UPPER(SUBSTRING(btl.id::text FROM 1 FOR 6)) as ma_lich_dat,
        btl.thoi_gian_bat_dau AT TIME ZONE 'UTC' as ngay_gio_bat_dau, 
        btl.thoi_gian_ket_thuc AT TIME ZONE 'UTC' as ngay_gio_ket_thuc, 
        btl.trang_thai, 'dieu_tri' as loai_lich,
        nd_kh.ho_ten AS ten_khach_hang, 
        nd_kh.so_dien_thoai AS so_dien_thoai,
        kh.nguoi_dung_id as khach_hang_id,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        btl.ky_thuat_vien_id,
        btl.phong_id,
        p.ten_phong
      FROM buoi_tri_lieu btl
      JOIN khach_hang kh ON btl.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      LEFT JOIN ky_thuat_vien ktv ON btl.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON btl.phong_id = p.id
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async createAppointment(ma_lich_dat: string, data: any) {
    const { khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, ly_do_kham, loai_lich, dang_ky_goi_id } = data;
    const query = `
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, ly_do_kham, nguoi_tao, loai_lich, dang_ky_goi_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'le_tan', $13, $14)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      ma_lich_dat, khach_hang_id || null, ho_ten_khach || null, so_dien_thoai || null, gioi_tinh_khach || null, dich_vu_id, ky_thuat_vien_id || null, phong_id || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich || null, ly_do_kham || null, loai_lich || 'kham_moi', dang_ky_goi_id || null
    ]);
    return rows[0];
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    const { nguoi_dung_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, anh_dinh_kem_url } = data;
    
    let khach_hang_id = null;
    if (nguoi_dung_id) {
       const res = await pool.query('SELECT id FROM khach_hang WHERE nguoi_dung_id = $1', [nguoi_dung_id]);
       if (res.rows.length > 0) {
         khach_hang_id = res.rows[0].id;
       }
    }

    const query = `
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, anh_dinh_kem_url, nguoi_tao, loai_lich)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'guest', 'kham_moi')
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      ma_lich_dat, khach_hang_id || null, ho_ten_khach || null, so_dien_thoai || null, gioi_tinh_khach || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham || null, anh_dinh_kem_url || null
    ]);
    return rows[0];
  }

  async updateAppointmentStatus(id: string, data: { trang_thai: string; ky_thuat_vien_id?: string | null; phong_id?: string | number | null }) {
    const updates = ['trang_thai = $1'];
    const values: any[] = [data.trang_thai];
    let paramIndex = 2;

    if (data.ky_thuat_vien_id !== undefined) {
      updates.push(`ky_thuat_vien_id = $${paramIndex}`);
      values.push(data.ky_thuat_vien_id);
      paramIndex++;
    }

    if (data.phong_id !== undefined) {
      updates.push(`phong_id = $${paramIndex}`);
      values.push(data.phong_id);
      paramIndex++;
    }

    values.push(id);
    
    let query = `
      UPDATE lich_dat 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    let { rows } = await pool.query(query, values);
    
    // Nếu không tìm thấy trong lịch đặt (khám mới), có thể nó là buổi trị liệu
    if (rows.length === 0) {
      query = `
        UPDATE buoi_tri_lieu 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      const res = await pool.query(query, values);
      rows = res.rows;
    }
    
    return rows[0];
  }
}

export default new AppointmentRepository();
