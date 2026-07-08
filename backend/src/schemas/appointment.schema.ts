import { z } from 'zod';

const staffIdSchema = z.union([
  z.number().int(),
  z.string().regex(/^\d+$/).transform(Number)
]).optional().nullable();

export const createAppointmentSchema = z.object({
  body: z.object({
    khach_hang_id: z.string().uuid('ID Khách hàng không hợp lệ').optional().nullable(),
    ho_ten_khach: z.string().optional(),
    so_dien_thoai: z.string().optional(),
    gioi_tinh_khach: z.string().optional(),
    email: z.string().optional(),
    goi_dich_vu_id: z.string().uuid().optional().nullable(),
    dich_vu_id: z.string().uuid().optional().nullable(),
    bac_si_id: staffIdSchema,
    ky_thuat_vien_id: staffIdSchema,
    chuyen_gia_id: staffIdSchema,
    phong_id: z.union([z.string(), z.number()]).optional().nullable(),
    ngay_gio_bat_dau: z.string().datetime({ message: 'Ngày giờ bắt đầu không hợp lệ' }),
    ngay_gio_ket_thuc: z.string().datetime({ message: 'Ngày giờ kết thúc không hợp lệ' }),
    ghi_chu_dat_lich: z.string().optional(),
    ly_do_kham: z.string().optional(),
    loai_lich: z.string().optional(),
    dang_ky_goi_id: z.string().optional().nullable(),
    phac_do_dieu_tri_id: z.string().uuid().optional().nullable(),
    so_thu_tu_buoi: z.number().optional().nullable(),
    lich_dat_id: z.string().uuid().optional().nullable(),
    trang_thai: z.string().optional(),
  }).refine(data => data.khach_hang_id || (data.ho_ten_khach && data.so_dien_thoai), {
    message: 'Phải cung cấp ID khách hàng hoặc thông tin khách vãng lai (họ tên, sđt)'
  })
});

export const createPublicAppointmentSchema = z.object({
  body: z.object({
    nguoi_dung_id: staffIdSchema,
    nhan_su_id: staffIdSchema,
    khach_hang_id: z.string().uuid().optional().nullable(),
    ho_ten_khach: z.string({ required_error: 'Họ tên là bắt buộc' })
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .refine(val => /^[\p{L}\s']{2,}$/u.test(val.trim()), 'Họ tên chỉ được chứa chữ cái và khoảng trắng'),
    so_dien_thoai: z.string({ required_error: 'Số điện thoại là bắt buộc' })
      .regex(/^(03|05|07|08|09)[0-9]{8}$/, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09'),
    gioi_tinh_khach: z.enum(['nam', 'nu', 'khac']).optional(),
    ngay_gio_bat_dau: z.string().datetime({ message: 'Ngày giờ bắt đầu không hợp lệ' }),
    trieu_chung: z.string({ required_error: 'Mô tả triệu chứng là bắt buộc' })
      .min(10, 'Mô tả triệu chứng phải có ít nhất 10 ký tự'),
    ly_do_kham: z.string().optional(),
    anh_dinh_kem_url: z.string().optional(),
    goi_dich_vu_id: z.string().uuid('Gói dịch vụ/Lịch khám là bắt buộc'),
    temp_hold_id: z.string().optional(),
  }).refine((data) => {
    const batDau = new Date(data.ngay_gio_bat_dau);
    const minTime = new Date(Date.now() + 60 * 60 * 1000);
    return batDau >= minTime;
  }, {
    message: 'Thời gian bắt đầu lịch khám phải sau thời điểm hiện tại ít nhất 1 tiếng',
    path: ['ngay_gio_bat_dau']
  })
});

export const updateAppointmentStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID Lịch hẹn không hợp lệ'),
  }),
  body: z.object({
    trang_thai: z.enum(['chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'hoan_thanh', 'cho_huy', 'da_huy', 'khong_den'], {
      required_error: 'Trạng thái là bắt buộc',
      invalid_type_error: 'Trạng thái không hợp lệ'
    }),
    bac_si_id: staffIdSchema,
    chuyen_gia_id: staffIdSchema,
    ky_thuat_vien_id: staffIdSchema,
    phong_id: z.union([z.string(), z.number()]).optional().nullable(),
    ngay_gio_bat_dau: z.string().datetime({ message: 'Ngày giờ bắt đầu không hợp lệ' }).optional().nullable(),
    ngay_gio_ket_thuc: z.string().datetime({ message: 'Ngày giờ kết thúc không hợp lệ' }).optional().nullable(),
    ly_do_huy: z.string().optional().nullable(),
  })
});

export const updateMedicalRecordSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID Lịch khám không hợp lệ'),
  }),
  body: z.object({
    chan_doan: z.string().optional(),
    chong_chi_dinh: z.string().optional(),
    khuyen_nghi_goi_id: z.string().uuid().optional().nullable(),
  })
});
