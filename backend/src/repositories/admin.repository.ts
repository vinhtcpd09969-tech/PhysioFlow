import { pool } from '../config/db';

class AdminRepository {
  // --- QUẢN LÝ DỊCH VỤ & DANH MỤC ---
  async getCategories() {
    const { rows } = await pool.query('SELECT * FROM danh_muc_dich_vu ORDER BY id ASC');
    return rows;
  }

  async createCategory(data: { ten_danh_muc: string; mo_ta?: string; trang_thai: string }) {
    const { rows } = await pool.query(
      'INSERT INTO danh_muc_dich_vu (ten_danh_muc, mo_ta, trang_thai) VALUES ($1, $2, $3) RETURNING *',
      [data.ten_danh_muc, data.mo_ta, data.trang_thai]
    );
    return rows[0];
  }

  async getServices() {
    const { rows } = await pool.query(`
      SELECT dv.*, dm.ten_danh_muc 
      FROM dich_vu dv
      JOIN danh_muc_dich_vu dm ON dv.danh_muc_id = dm.id
      ORDER BY dv.danh_muc_id, dv.ten_dich_vu
    `);
    return rows;
  }

  async createService(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO dich_vu (danh_muc_id, ten_dich_vu, mo_ta, thoi_gian_uoc_tinh, thiet_bi_yeu_cau, trang_thai) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.danh_muc_id, data.ten_dich_vu, data.mo_ta, data.thoi_gian_uoc_tinh, data.thiet_bi_yeu_cau, data.trang_thai]
    );
    return rows[0];
  }

  // --- QUẢN LÝ GÓI ĐIỀU TRỊ ---
  async getPackages() {
    const { rows } = await pool.query('SELECT * FROM goi_dieu_tri ORDER BY gia_tien ASC');
    return rows;
  }

  async createPackage(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO goi_dieu_tri (ten_goi, mo_ta, tong_so_buoi, gia_tien, trang_thai) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.ten_goi, data.mo_ta, data.tong_so_buoi, data.gia_tien, data.trang_thai]
    );
    return rows[0];
  }

  // --- QUẢN LÝ NHÂN SỰ ---
  async getStaff() {
    const { rows } = await pool.query(`
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.trang_thai, vt.ten_hien_thi as vai_tro, ktv.id as ky_thuat_vien_id
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ky_thuat_vien ktv ON nd.id = ktv.nguoi_dung_id
      WHERE nd.vai_tro_id IN (2, 3, 4, 5) AND nd.deleted_at IS NULL
      ORDER BY nd.vai_tro_id, nd.ho_ten
    `);
    return rows;
  }

  async findUserByEmail(email: string) {
    const { rows } = await pool.query('SELECT id FROM nguoi_dung WHERE email = $1', [email]);
    return rows[0];
  }

  async createStaff(data: any, hash: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, so_dien_thoai, trang_thai, da_xac_thuc_email) 
         VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id, ho_ten, email`,
        [data.ho_ten, data.email, hash, data.vai_tro_id, data.so_dien_thoai, data.trang_thai]
      );
      
      if (data.vai_tro_id === 3) {
        await client.query('INSERT INTO ky_thuat_vien (nguoi_dung_id) VALUES ($1)', [rows[0].id]);
      }
      
      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateStaffStatus(id: string, status: string) {
    const { rows } = await pool.query(
      'UPDATE nguoi_dung SET trang_thai = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return rows[0];
  }

  // --- QUẢN LÝ KHÁCH HÀNG ---
  async getCustomers() {
    const { rows } = await pool.query(`
      SELECT kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh, kh.dia_chi,
             nd.id as nguoi_dung_id, 
             COALESCE(nd.ho_ten, 'Khách vãng lai') as ho_ten, 
             nd.email, 
             nd.so_dien_thoai, 
             nd.trang_thai, 
             COALESCE(nd.thoi_gian_tao, kh.thoi_gian_tao) as created_at
      FROM khach_hang kh
      LEFT JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      WHERE nd.id IS NULL OR nd.deleted_at IS NULL
      ORDER BY kh.thoi_gian_tao DESC
    `);
    return rows;
  }

  // --- QUẢN LÝ THIẾT BỊ Y TẾ ---
  async getEquipment() {
    const { rows } = await pool.query(`
      SELECT tb.*, p.ten_phong 
      FROM thiet_bi_y_te tb
      LEFT JOIN phong p ON tb.phong_id_hien_tai = p.id
      ORDER BY tb.thoi_gian_tao DESC
    `);
    return rows;
  }

  async createEquipment(ma_thiet_bi: string, data: any) {
    const { rows } = await pool.query(
      `INSERT INTO thiet_bi_y_te (ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, ngay_mua, ngay_bao_tri_tiep_theo, trang_thai, phong_id_hien_tai, ghi_chu) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [ma_thiet_bi, data.ten_thiet_bi, data.loai_thiet_bi || null, data.ngay_mua || null, data.ngay_bao_tri_tiep_theo || null, data.trang_thai, data.phong_id_hien_tai || null, data.ghi_chu || null]
    );
    return rows[0];
  }

  // --- QUẢN LÝ LỊCH LÀM VIỆC ---
  async getSchedules() {
    const { rows } = await pool.query(`
      SELECT llv.*, nd.ho_ten as ten_ky_thuat_vien
      FROM lich_lam_viec_ktv llv
      JOIN ky_thuat_vien ktv ON llv.ky_thuat_vien_id = ktv.id
      JOIN nguoi_dung nd ON ktv.nguoi_dung_id = nd.id
      ORDER BY nd.ho_ten, llv.thu_trong_tuan
    `);
    return rows;
  }

  async createSchedule(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO lich_lam_viec_ktv (ky_thuat_vien_id, thu_trong_tuan, gio_bat_dau, gio_ket_thuc, trang_thai) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.ky_thuat_vien_id, data.thu_trong_tuan, data.gio_bat_dau, data.gio_ket_thuc, data.trang_thai]
    );
    return rows[0];
  }

  // --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ ---
  async getMedicalRecords() {
    const { rows } = await pool.query(`
      SELECT dg.id, dg.id as ma_danh_gia, dg.ngay_danh_gia, dg.chan_doan_so_bo as chan_doan, dg.trang_thai,
             nd_kh.ho_ten as ten_khach_hang, 'KH' as ma_khach_hang,
             nd_ktv.ho_ten as ten_ky_thuat_vien
      FROM danh_gia dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      JOIN ky_thuat_vien ktv ON dg.ky_thuat_vien_id = ktv.id
      JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      ORDER BY dg.ngay_danh_gia DESC
    `);
    return rows;
  }

  // --- AUDIT LOGS ---
  async getAuditLogs() {
    const { rows } = await pool.query(`
      SELECT a.*, nd.email as user_email 
      FROM system_audit_log a
      LEFT JOIN nguoi_dung nd ON a.user_id = nd.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    return rows;
  }

  // --- QUẢN LÝ TÀI CHÍNH ---
  async getInvoices() {
    const { rows } = await pool.query(`
      SELECT hd.*, nd.ho_ten as ten_khach_hang, nd.so_dien_thoai
      FROM hoa_don hd
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      ORDER BY hd.ngay_tao DESC
    `);
    return rows;
  }

  async getPayments() {
    const { rows } = await pool.query(`
      SELECT tt.*, hd.ma_hoa_don, nd.ho_ten as ten_khach_hang
      FROM thanh_toan tt
      JOIN hoa_don hd ON tt.hoa_don_id = hd.id
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      ORDER BY tt.thoi_gian_giao_dich DESC
    `);
    return rows;
  }

  async handleRefund(id: string, ly_do: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: payments } = await client.query('SELECT * FROM thanh_toan WHERE id = $1', [id]);
      if (payments.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy giao dịch', code: 404 };
      }
      const originalPayment = payments[0];

      if (originalPayment.trang_thai === 'da_hoan_tien') {
        await client.query('ROLLBACK');
        return { error: 'Giao dịch này đã được hoàn tiền trước đó', code: 400 };
      }

      await client.query('UPDATE thanh_toan SET trang_thai = \'da_hoan_tien\', ghi_chu = $1 WHERE id = $2',
        [`Hoàn tiền: ${ly_do}`, id]);

      const { rows: invoices } = await client.query(
        'UPDATE hoa_don SET trang_thai = \'da_hoan_tien\', da_thanh_toan = da_thanh_toan - $1 WHERE id = $2 RETURNING *',
        [originalPayment.so_tien, originalPayment.hoa_don_id]
      );

      await client.query('COMMIT');
      return { success: true, invoice: invoices[0], originalAmount: originalPayment.so_tien };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // --- QUẢN LÝ MARKETING ---
  async getVouchers() {
    const { rows } = await pool.query('SELECT * FROM voucher ORDER BY thoi_gian_tao DESC');
    return rows;
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query('SELECT id FROM voucher WHERE ma_voucher = $1', [code]);
    return rows[0];
  }

  async createVoucher(data: any, userId: string) {
    const { rows } = await pool.query(
      `INSERT INTO voucher (ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, ap_dung_cho, so_luong_toi_da, ngay_bat_dau, ngay_het_han, trang_thai, tao_boi) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [data.ma_voucher, data.ten_chien_dich, data.loai_giam, data.gia_tri_giam, data.giam_toi_da, data.don_hang_toi_thieu, data.ap_dung_cho, data.so_luong_toi_da, data.ngay_bat_dau, data.ngay_het_han, data.trang_thai, userId]
    );
    return rows[0];
  }

  async updateVoucher(id: string, data: any) {
    const { rows } = await pool.query(
      `UPDATE voucher SET 
        ten_chien_dich = $1, loai_giam = $2, gia_tri_giam = $3, giam_toi_da = $4, 
        don_hang_toi_thieu = $5, ap_dung_cho = $6, so_luong_toi_da = $7, 
        ngay_bat_dau = $8, ngay_het_han = $9, trang_thai = $10
       WHERE id = $11 RETURNING *`,
      [data.ten_chien_dich, data.loai_giam, data.gia_tri_giam, data.giam_toi_da, data.don_hang_toi_thieu, data.ap_dung_cho, data.so_luong_toi_da, data.ngay_bat_dau, data.ngay_het_han, data.trang_thai, id]
    );
    return rows[0];
  }

  async deleteVoucher(id: string) {
    const { rows } = await pool.query('DELETE FROM voucher WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }

  // --- QUẢN LÝ ĐÁNH GIÁ ---
  async getFeedback() {
    const { rows } = await pool.query(`
      SELECT dg.*, nd_kh.ho_ten as ten_khach_hang, nd_ktv.ho_ten as ten_ky_thuat_vien, dv.ten_dich_vu
      FROM danh_gia_dich_vu dg
      JOIN buoi_tri_lieu btl ON dg.buoi_tri_lieu_id = btl.id
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      JOIN ky_thuat_vien ktv ON dg.ky_thuat_vien_id = ktv.id
      JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      ORDER BY dg.thoi_gian_danh_gia DESC
    `);
    return rows;
  }

  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary() {
    const queries = [
      pool.query('SELECT COUNT(*) FROM khach_hang'),
      pool.query('SELECT COUNT(*) FROM lich_dat WHERE trang_thai = \'cho_xac_nhan\''),
      pool.query('SELECT SUM(da_thanh_toan) FROM hoa_don'),
      pool.query('SELECT COUNT(*) FROM ky_thuat_vien WHERE trang_thai = \'hoat_dong\'')
    ];
    const results = await Promise.all(queries);
    return {
      total_customers: results[0].rows[0].count,
      pending_appointments: results[1].rows[0].count,
      total_revenue: results[2].rows[0].sum || 0,
      active_staff: results[3].rows[0].count
    };
  }

  async getRevenueStats() {
    const { rows } = await pool.query(`
      SELECT 
        TO_CHAR(ngay_thanh_toan, 'YYYY-MM') as month,
        SUM(so_tien) as revenue
      FROM thanh_toan
      WHERE trang_thai = 'thanh_cong'
        AND thoi_gian_giao_dich >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `);
    return rows;
  }

  async getStaffPerformance() {
    const { rows } = await pool.query(`
      SELECT 
        nd.ho_ten as name,
        COUNT(btl.id) as sessions
      FROM buoi_tri_lieu btl
      JOIN ky_thuat_vien ktv ON btl.ky_thuat_vien_id = ktv.id
      JOIN nguoi_dung nd ON ktv.nguoi_dung_id = nd.id
      WHERE btl.trang_thai = 'hoan_thanh'
        AND btl.thoi_gian_bat_dau >= DATE_TRUNC('month', NOW())
      GROUP BY nd.ho_ten
      ORDER BY sessions DESC
      LIMIT 5
    `);
    return rows;
  }
}

export default new AdminRepository();
