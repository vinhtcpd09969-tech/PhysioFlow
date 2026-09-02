/**
 * Quy tắc chuyển trạng thái lịch hẹn (cuoc_hen) dành riêng cho Lễ tân — Admin/Bác sĩ/Quản lý
 * không bị giới hạn bởi file này. Thay thế cho các khối `if` rời rạc trước đây ở
 * `receptionist.service.ts` — nay dùng chung cho CẢ route `/receptionist/...` lẫn
 * `/admin/appointments/:id/status` khi actor là Lễ tân (xem `appointment.repository.ts`).
 *
 * A10 (06/08/2026): bỏ hẳn khái niệm "chưa xác nhận"/"chờ xác nhận" — mọi lịch vào thẳng
 * `da_xac_nhan` lúc tạo (Phase 1). Mirror 1:1 với frontend
 * `components/appointments/DetailModal/receptionistStatusRules.ts` — sửa bên nào nhớ sửa bên kia.
 */

const IN_PROGRESS_LOCKED_STATUSES = ['dang_kham', 'hoan_thanh'];
const CANCELLED_STATUSES = ['da_huy'];
const NO_SHOW_STATUSES = ['khong_den'];
export const TERMINAL_STATUSES = [...CANCELLED_STATUSES, ...NO_SHOW_STATUSES];

export interface ReceptionistTransitionCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Trạng thái mà Lễ tân không còn được thao tác gì nữa trên lịch hẹn (khóa toàn bộ form)
 */
export function isReceptionistLockedStatus(currentStatus: string): boolean {
  return IN_PROGRESS_LOCKED_STATUSES.includes(currentStatus) || TERMINAL_STATUSES.includes(currentStatus);
}

/**
 * Danh sách trạng thái Lễ tân được phép chuyển tới từ `currentStatus` hiện tại.
 */
export function getReceptionistAllowedTargets(currentStatus: string, _hasAssignedStaff: boolean): string[] {
  if (currentStatus === 'da_xac_nhan') {
    return ['da_checkin', 'khong_den', 'da_huy'];
  }
  if (currentStatus === 'da_checkin') {
    return ['khong_den', 'da_huy'];
  }
  if (currentStatus === 'cho_tai_luong_gia') {
    return ['da_checkin', 'da_huy'];
  }
  return [];
}

/**
 * Kiểm tra 1 lần chuyển trạng thái cụ thể có hợp lệ với Lễ tân không.
 */
export function checkReceptionistTransition(
  currentStatus: string,
  targetStatus: string,
  hasAssignedStaff: boolean,
  isRescheduling?: boolean
): ReceptionistTransitionCheck {
  if (targetStatus === currentStatus) {
    return { allowed: true };
  }

  if (targetStatus === 'dang_kham') {
    return { allowed: false, reason: 'Lễ tân không có quyền đưa trạng thái lịch về đang khám.' };
  }
  if (targetStatus === 'hoan_thanh') {
    return { allowed: false, reason: 'Lễ tân không có quyền đưa trạng thái lịch về hoàn thành.' };
  }
  if (currentStatus === 'da_checkin' && targetStatus === 'da_xac_nhan') {
    if (isRescheduling) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Không thể chọn thủ công trạng thái Đã xác nhận cho ca đang check-in trừ khi thao tác đổi lịch (ngày/buổi).' };
  }

  if (isReceptionistLockedStatus(currentStatus)) {
    return {
      allowed: false,
      reason: 'Không thể thay đổi trạng thái của ca hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc.',
    };
  }

  const allowedTargets = getReceptionistAllowedTargets(currentStatus, hasAssignedStaff);
  if (allowedTargets.includes(targetStatus)) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Lễ tân không có quyền chuyển lịch hẹn sang trạng thái này.' };
}
