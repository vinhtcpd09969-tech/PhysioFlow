import { z } from 'zod';

// --- Dịch vụ & Danh mục ---
export const categorySchema = z.object({
  body: z.object({
    ten_danh_muc: z.string().min(1, 'Tên danh mục là bắt buộc'),
    mo_ta: z.string().optional(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong')
  })
});

export const serviceSchema = z.object({
  body: z.object({
    danh_muc_id: z.number().int().positive('Danh mục không hợp lệ'),
    ten_dich_vu: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
    mo_ta: z.string().optional(),
    thoi_gian_uoc_tinh: z.number().int().positive('Thời gian ước tính phải lớn hơn 0'),
    don_gia: z.number().min(0, 'Đơn giá không hợp lệ').optional().default(0),
    thiet_bi_yeu_cau: z.string().optional(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong'),
    loai_dich_vu: z.enum(['chinh', 'bo_sung']).default('chinh')
  })
});

// --- Gói điều trị ---
export const packageSchema = z.object({
  body: z.object({
    danh_muc_id: z.number().int().positive('Danh mục không hợp lệ').optional().nullable(),
    ten_goi: z.string().min(1, 'Tên gói là bắt buộc'),
    ma_goi: z.string().optional(),
    mo_ta: z.string().optional(),
    tong_so_buoi: z.number().int().positive('Số buổi phải lớn hơn 0'),
    gia_tien: z.number().min(0, 'Giá tiền không hợp lệ'),
    han_dung_thang: z.number().int().positive('Hạn dùng phải lớn hơn 0').default(6),
    chi_tiet_dich_vu: z.array(z.object({
      dich_vu_id: z.string().uuid('ID dịch vụ không hợp lệ'),
      so_buoi: z.number().int().positive('Số buổi dịch vụ phải lớn hơn 0')
    })).default([]),
    hien_thi_website: z.boolean().default(true),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong'),
    loai_goi: z.enum(['linh_dong', 'lieu_trinh']).default('lieu_trinh')
  })
});

// --- Quản lý Nhân sự ---
export const staffSchema = z.object({
  body: z.object({
    ho_ten: z.string().min(1, 'Họ tên là bắt buộc'),
    email: z.string().email('Email không hợp lệ'),
    mat_khau: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    vai_tro_id: z.number().int().positive('Vai trò không hợp lệ (2=Lễ tân, 3=KTV, 4=Bác sĩ, 5=Admin)'),
    so_dien_thoai: z.string().optional(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong')
  })
});

// --- Quản lý Thiết bị y tế ---
export const equipmentSchema = z.object({
  body: z.object({
    ten_thiet_bi: z.string().min(1, 'Tên thiết bị là bắt buộc'),
    loai_thiet_bi: z.string().optional(),
    ngay_mua: z.string().optional(),
    ngay_bao_tri_tiep_theo: z.string().optional(),
    trang_thai: z.enum(['san_sang', 'dang_su_dung', 'dang_bao_tri', 'hong']).default('san_sang'),
    phong_id_hien_tai: z.number().int().positive().nullable().optional(),
    ghi_chu: z.string().optional()
  })
});

// --- Quản lý Lịch làm việc ---
export const scheduleSchema = z.object({
  body: z.object({
    nguoi_dung_id: z.string().uuid('ID nhân viên không hợp lệ'),
    ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)'),
    gio_bat_dau: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ bắt đầu không hợp lệ (HH:mm)'),
    gio_ket_thuc: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ kết thúc không hợp lệ (HH:mm)'),
    trang_thai: z.enum(['hoat_dong', 'tam_nghi']).default('hoat_dong')
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
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong')
  })
});
