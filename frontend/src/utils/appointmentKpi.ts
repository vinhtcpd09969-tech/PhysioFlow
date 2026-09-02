// Nguồn sự thật duy nhất cho việc gộp trạng thái lịch hẹn (cuoc_hen.trang_thai) — dùng chung
// giữa Admin, Lễ tân, Bác sĩ, KTV để 4 actor nhìn cùng 1 con số cho cùng 1 khái niệm.
// Cập nhật A10 (06/08/2026): bỏ `chua_xac_nhan`/`cho_xac_nhan` (không còn khái niệm chờ xác
// nhận — mọi lịch vào thẳng `da_xac_nhan`) và `check_in`/`giu_cho` (rác từ mô hình cũ); thêm
// `cho_tai_luong_gia` (B5) và các biến thể có phạt vào nhóm hủy/không đến (đồng bộ với
// `TERMINAL_STATUSES` ở backend `domain/appointmentStatus.ts`).
export const CHECKED_IN_STATUSES = ['da_checkin'];
export const CANCELLED_STATUSES = ['da_huy', 'da_huy_phat'];
export const NO_SHOW_STATUSES = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'];

export interface AppointmentKpiBuckets {
  total: number;
  daXacNhan: number;
  daCheckin: number;
  dangKham: number;
  choTaiLuongGia: number;
  hoanThanh: number;
  daHuy: number;
  khongDen: number;
}

/** Map từ tên bucket KPI sang danh sách trang_thai thật — dùng để lọc danh sách lịch hẹn khi
 * bấm 1 thẻ KPI (AppointmentKpiCards.tsx) thay vì chỉ hiển thị số. Không có "total" vì thẻ Tổng
 * ca không dùng để lọc. */
export const KPI_BUCKET_STATUSES: Record<Exclude<keyof AppointmentKpiBuckets, 'total'>, string[]> = {
  daXacNhan: ['da_xac_nhan'],
  daCheckin: CHECKED_IN_STATUSES,
  dangKham: ['dang_kham'],
  choTaiLuongGia: ['cho_tai_luong_gia'],
  hoanThanh: ['hoan_thanh'],
  daHuy: CANCELLED_STATUSES,
  khongDen: NO_SHOW_STATUSES,
};

/** Nhãn hiển thị cho chip "Đang lọc: ..." — dùng chung cho cả 4 trang Lịch hẹn thay vì mỗi trang
 * tự viết lại. */
export const KPI_BUCKET_LABELS: Record<Exclude<keyof AppointmentKpiBuckets, 'total'>, string> = {
  daXacNhan: 'Đã xác nhận',
  daCheckin: 'Đã check-in',
  dangKham: 'Đang thực hiện',
  choTaiLuongGia: 'Chờ tái lượng giá',
  hoanThanh: 'Hoàn thành',
  daHuy: 'Đã hủy',
  khongDen: 'Không đến',
};

/** Tính đủ 7 nhóm từ 1 danh sách lịch hẹn đã lọc sẵn theo khoảng ngày/loại đang xem — mỗi actor
 * (AppointmentKpiCards.tsx) tự chọn hiển thị bao nhiêu trong số 7 field này. */
export function computeAppointmentKpiBuckets(appointments: Array<{ trang_thai?: string | null }>): AppointmentKpiBuckets {
  const count = (statuses: string[]) => appointments.filter((a) => statuses.includes(a.trang_thai || '')).length;

  return {
    total: appointments.length,
    daXacNhan: count(['da_xac_nhan']),
    daCheckin: count(CHECKED_IN_STATUSES),
    dangKham: count(['dang_kham']),
    choTaiLuongGia: count(['cho_tai_luong_gia']),
    hoanThanh: count(['hoan_thanh']),
    daHuy: count(CANCELLED_STATUSES),
    khongDen: count(NO_SHOW_STATUSES),
  };
}
