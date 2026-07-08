import { z } from 'zod';

// --- Gói dịch vụ ---
export const packageSchema = z.object({
  body: z.object({
    ten_goi: z.string().min(1, 'Tên gói/dịch vụ là bắt buộc'),
    loai_goi: z.enum(['KHAM', 'LE', 'LIEU_TRINH'], { required_error: 'Loại gói không hợp lệ (KHAM, LE, LIEU_TRINH)' }),
    danh_muc_goi_id: z.string().uuid('ID danh mục không hợp lệ').optional().nullable(),
    tong_so_buoi: z.number().int().min(1, 'Số buổi tối thiểu là 1').default(1),
    thoi_luong_phut: z.number().int().min(1, 'Thời lượng tối thiểu là 1').default(30),
    don_gia: z.number().min(0, 'Đơn giá không hợp lệ'),
    don_gia_theo_buoi: z.number().min(0, 'Đơn giá theo buổi không hợp lệ'),
    quy_trinh: z.string().min(1, 'Quy trình trị liệu là bắt buộc'),
    muc_tieu: z.string().min(1, 'Mục tiêu trị liệu là bắt buộc'),
    trang_thai: z.enum(['hoat_dong', 'tam_ngung']).default('hoat_dong'),
    anh_goi: z.string().optional().nullable()
  })
});

// --- Quản lý Nhân sự ---
export const staffSchema = z.object({
  body: z.object({
    ho_ten: z.string().min(1, 'Họ tên là bắt buộc'),
    email: z.string().email('Email không hợp lệ'),
    mat_khau: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    vai_tro_id: z.number().int().positive('Vai trò không hợp lệ (2=Lễ tân, 3=KTV, 4=Bác sĩ, 5=Admin, 6=Quản lý)'),
    so_dien_thoai: z.string().optional(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong')
  })
});

// --- Quản lý Thiết bị y tế ---
export const equipmentSchema = z.object({
  body: z.object({
    ma_thiet_bi: z.string().min(1, 'Mã thiết bị là bắt buộc'),
    ten_thiet_bi: z.string().min(1, 'Tên thiết bị là bắt buộc'),
    ngay_mua: z.string().optional().nullable(),
    trang_thai: z.enum(['san_sang', 'dang_su_dung', 'dang_bao_tri', 'hong']).default('san_sang'),
    ghi_chu: z.string().optional().nullable()
  })
});

// --- Quản lý Lịch làm việc ---
export const scheduleSchema = z.object({
  body: z.object({
    nguoi_dung_id: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(Number)], { required_error: 'ID nhân viên là bắt buộc' }),
    ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)'),
    gio_bat_dau: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ bắt đầu không hợp lệ (HH:mm)'),
    gio_ket_thuc: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ kết thúc không hợp lệ (HH:mm)'),
    trang_thai: z.enum(['hoat_dong', 'tam_nghi']).default('hoat_dong'),
    phong_id: z.union([z.string(), z.number()], { required_error: 'Phòng làm việc là bắt buộc' })
  })
});

// --- Quản lý Ưu đãi Thanh toán ---
export const paymentPromotionSchema = z.object({
  body: z.object({
    ten_uu_dai: z.string().min(1, 'Tên ưu đãi là bắt buộc'),
    phan_tram_tra_thang: z.number().int().min(0).max(100).default(10),
    phan_tram_tra_gop: z.number().int().min(0).max(100).default(5),
    ngay_bat_dau: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
    ngay_het_han: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hết hạn không hợp lệ (YYYY-MM-DD)').optional().nullable(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong'),
    goi_dich_vu_ids: z.any().optional()
  })
});

export const roomSchema = z.object({
  body: z.object({
    ten_phong: z.string().min(1, 'Tên phòng là bắt buộc'),
    ma_phong: z.string().optional().nullable(),
    loai_phong: z.string().optional().nullable(),
    loai_dich_vu_ho_tro: z.any().optional().nullable(),
    mo_ta: z.string().optional().nullable(),
    trang_thai: z.string().default('san_sang'),
    suc_chua: z.number().int().min(1).optional().default(1)
  })
});
