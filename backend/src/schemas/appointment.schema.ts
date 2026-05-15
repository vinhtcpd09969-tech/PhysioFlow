import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    khach_hang_id: z.string().uuid('ID Khách hàng không hợp lệ'),
    dich_vu_id: z.string().uuid('ID Dịch vụ không hợp lệ'),
    ky_thuat_vien_id: z.string().uuid('ID KTV không hợp lệ').optional().nullable(),
    phong_id: z.string().optional().nullable(),
    ngay_gio_bat_dau: z.string().datetime({ message: 'Ngày giờ bắt đầu không hợp lệ' }),
    ngay_gio_ket_thuc: z.string().datetime({ message: 'Ngày giờ kết thúc không hợp lệ' }),
    ghi_chu_dat_lich: z.string().optional(),
  })
});

export const createPublicAppointmentSchema = z.object({
  body: z.object({
    ho_ten_khach: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    so_dien_thoai: z.string().min(10, 'Số điện thoại không hợp lệ'),
    gioi_tinh_khach: z.enum(['nam', 'nu', 'khac']).optional(),
    ngay_gio_bat_dau: z.string().datetime({ message: 'Ngày giờ bắt đầu không hợp lệ' }),
    trieu_chung: z.string().optional(),
    ly_do_kham: z.string().optional(),
    anh_dinh_kem_url: z.string().optional(),
  })
});

export const updateAppointmentStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID Lịch hẹn không hợp lệ'),
  }),
  body: z.object({
    trang_thai: z.enum(['cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'hoan_thanh', 'da_huy', 'khong_den'], {
      required_error: 'Trạng thái là bắt buộc',
      invalid_type_error: 'Trạng thái không hợp lệ'
    })
  })
});
