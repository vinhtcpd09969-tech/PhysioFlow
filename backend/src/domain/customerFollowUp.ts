/** Số ngày mặc định kể từ buổi hoàn thành gần nhất để đánh dấu "Cần liên hệ lại" — Lễ tân có thể
 * chọn ngưỡng khác (3/5/7 ngày) qua bộ lọc ở trang Quản lý khách hàng. */
export const DEFAULT_FOLLOW_UP_STALE_DAYS = 5;

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export interface FollowUpCheckInput {
  trangThaiGoi: string;
  soBuoiDaDung: number;
  lastCompletedAt: Date | null;
  hasUpcomingAppointment: boolean;
  staleDays: number;
}

/**
 * "Cần liên hệ lại": gói đang `dang_dieu_tri`, đã hoàn thành ≥1 buổi (áp dụng sau BẤT KỲ buổi
 * nào, không riêng buổi 1), buổi hoàn thành gần nhất ≥ staleDays ngày, VÀ chưa có lịch hẹn tương
 * lai (chưa hủy) nào cho gói đó.
 * ĐỒNG BỘ THỦ CÔNG với cột can_lien_he trong receptionist.repository.ts::getCustomerRoster —
 * sửa ngưỡng/điều kiện ở đây phải soát lại SQL tương ứng, và ngược lại.
 */
export function needsFollowUp(input: FollowUpCheckInput): boolean {
  const { trangThaiGoi, soBuoiDaDung, lastCompletedAt, hasUpcomingAppointment, staleDays } = input;
  if (trangThaiGoi !== 'dang_dieu_tri') return false;
  if (soBuoiDaDung < 1 || !lastCompletedAt) return false;
  if (hasUpcomingAppointment) return false;
  return daysSince(lastCompletedAt) >= staleDays;
}
