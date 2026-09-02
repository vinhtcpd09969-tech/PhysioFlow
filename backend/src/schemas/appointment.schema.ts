import { z } from 'zod';
import { validateEmail } from '../utils/validators';

const staffIdSchema = z.union([
  z.number().int(),
  z.string().regex(/^\d+$/).transform(Number)
]).optional().nullable();

const ngaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)');
const buoiSchema = z.enum(['sang', 'chieu'], { required_error: 'Buổi (sáng/chiều) là bắt buộc', invalid_type_error: 'Buổi không hợp lệ' });

export const createAppointmentSchema = z.object({
  body: z.object({
    khach_hang_id: z.string().uuid('ID Khách hàng không hợp lệ').optional().nullable(),
    ho_ten_khach: z.string().optional().nullable(),
    so_dien_thoai: z.string().optional().nullable(),
    gioi_tinh_khach: z.string().optional().nullable(),
    email: z.string().optional().nullable().superRefine((val, ctx) => {
      if (val && val.trim() !== '') {
        const res = validateEmail(val);
        if (!res.isValid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: res.message || 'Địa chỉ email không hợp lệ.',
          });
        }
      }
    }),
    goi_dich_vu_id: z.string().uuid().optional().nullable(),
    dich_vu_id: z.string().uuid().optional().nullable(),
    bac_si_id: staffIdSchema,
    ky_thuat_vien_id: staffIdSchema,
    chuyen_gia_id: staffIdSchema,
    phong_id: z.union([z.string(), z.number()]).optional().nullable(),
    ngay: ngaySchema,
    buoi: buoiSchema,
    ghi_chu_dat_lich: z.string().optional().nullable(),
    ly_do_kham: z.string().optional().nullable(),
    loai_lich: z.string().optional().nullable(),
    dang_ky_goi_id: z.string().optional().nullable(),
    phac_do_dieu_tri_id: z.string().uuid().optional().nullable(),
    so_thu_tu_buoi: z.number().optional().nullable(),
    lich_dat_id: z.string().uuid().optional().nullable(),
    trang_thai: z.string().optional().nullable(),
    trang_thai_thanh_toan: z.enum(['chua_thanh_toan', 'dang_cho_thanh_toan', 'da_thanh_toan']).optional().nullable(),
    hoa_don_id: z.string().uuid().optional().nullable(),
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
    ngay: ngaySchema,
    buoi: buoiSchema,
    trieu_chung: z.string().optional().nullable(),
    ly_do_kham: z.string().optional(),
    anh_dinh_kem_url: z.string().optional(),
    goi_dich_vu_id: z.string().uuid('Gói dịch vụ/Lịch khám là bắt buộc'),
    phac_do_dieu_tri_id: z.string().uuid().optional().nullable(),
    so_thu_tu_buoi: z.number().int().positive().optional().nullable(),
    trang_thai_thanh_toan: z.enum(['chua_thanh_toan', 'dang_cho_thanh_toan', 'da_thanh_toan']).optional().nullable(),
    hinh_thuc_thanh_toan: z.string().optional().nullable(),
    ma_voucher: z.string().optional().nullable(),
  })
});

export const updateAppointmentStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID Lịch hẹn không hợp lệ'),
  }),
  body: z.object({
    trang_thai: z.enum(['da_xac_nhan', 'da_checkin', 'dang_kham', 'cho_tai_luong_gia', 'hoan_thanh', 'da_huy', 'khong_den'], {
      required_error: 'Trạng thái là bắt buộc',
      invalid_type_error: 'Trạng thái không hợp lệ'
    }),
    bac_si_id: staffIdSchema,
    chuyen_gia_id: staffIdSchema,
    ky_thuat_vien_id: staffIdSchema,
    phong_id: z.union([z.string(), z.number()]).optional().nullable(),
    // A7 — đổi lịch chỉ còn ngày+buổi: buổi mới đi kèm để cột `buoi` không lệch với
    // ngay_gio_bat_dau/ngay_gio_ket_thuc (2 nguồn sự thật cho cùng 1 khái niệm sẽ lệch nhau ngay
    // lần đổi lịch đầu tiên nếu chỉ cập nhật timestamp mà quên cột này).
    buoi: buoiSchema.optional(),
    ngay_gio_bat_dau: z.string().datetime({ message: 'Ngày giờ bắt đầu không hợp lệ' }).optional().nullable(),
    ngay_gio_ket_thuc: z.string().datetime({ message: 'Ngày giờ kết thúc không hợp lệ' }).optional().nullable(),
    ghi_chu_noi_bo: z.string().optional().nullable(),
  })
}).refine(data => {
  const isCancelledOrNoShow = ['da_huy', 'khong_den'].includes(data.body.trang_thai);
  const effectiveReason = data.body.ghi_chu_noi_bo;
  if (isCancelledOrNoShow && (!effectiveReason || !effectiveReason.trim())) {
    return false;
  }
  return true;
}, {
  message: 'Lý do hủy/vắng mặt là bắt buộc.',
  path: ['body', 'ghi_chu_noi_bo']
});
