import * as z from 'zod';

export const scheduleSchema = z.object({
  nguoi_dung_id: z.union([z.string(), z.number()]).refine(val => String(val).trim().length > 0, 'Vui lòng chọn nhân sự'),
  ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)'),
  gio_bat_dau: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ'),
  gio_ket_thuc: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ'),
  trang_thai: z.enum(['hoat_dong', 'tam_nghi']),
  // Bắt buộc chọn phòng chỉ áp dụng cho Bác sĩ/KTV — kiểm tra ở onSubmit (useScheduleForm.ts) vì cần
  // biết vai trò của nhân sự đang chọn, schema này không có thông tin đó. Lễ tân không có ô chọn
  // phòng trên form (xem ScheduleFormModal.tsx), nếu bắt buộc ở đây thì submit sẽ bị chặn âm thầm mà
  // không có ô nào để hiện lỗi errors.phong_id cho Lễ tân thấy — đây chính là bug đã gặp.
  phong_id: z.union([z.string(), z.number(), z.null()]).optional()
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export interface Schedule {
  id: string | number;
  nguoi_dung_id: string;
  ngay: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  trang_thai: 'hoat_dong' | 'tam_nghi';
  phong_id?: number | null;
  ten_nhan_vien?: string;
  vai_tro?: string;
  ma_phong?: string;
}

export interface Staff {
  id: string;
  ho_ten: string;
  vai_tro: string;
}

export interface Room {
  id: string | number;
  ten_phong: string;
  ma_phong: string;
  loai_phong: string;
  suc_chua?: number;
  occupancy?: number;
  isFull?: boolean;
}

export interface WeekDate {
  key: string;
  label: string;
  dateStr: string;
  isToday: boolean;
  fullDateStr: string;
}
