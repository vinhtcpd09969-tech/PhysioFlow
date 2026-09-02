/**
 * Quy tắc chuyển trạng thái lịch hẹn dành riêng cho Lễ tân trên UI — mirror 1:1 với
 * `backend/src/domain/appointmentStatus.ts` (2 phía không dùng chung runtime nên phải trùng
 * lặp thủ công; sửa bên nào nhớ sửa bên kia).
 *
 * A10 (06/08/2026): bỏ hẳn khái niệm "chưa xác nhận"/"chờ xác nhận" — mọi lịch vào thẳng
 * `da_xac_nhan` lúc tạo (Phase 1), nên Lễ tân không còn hành động "Xác nhận" nào cả.
 */
import { CANCELLED_STATUSES, NO_SHOW_STATUSES } from '../../../../utils/appointmentKpi';

const IN_PROGRESS_LOCKED_STATUSES = ['dang_kham', 'hoan_thanh'];
const TERMINAL_STATUSES = [...CANCELLED_STATUSES, ...NO_SHOW_STATUSES];

export interface ReceptionistStatusOption {
  value: string;
  label: string;
}

export function hasAssignedStaff(apt: { bac_si_id?: unknown; chuyen_gia_id?: unknown } | null | undefined): boolean {
  return !!apt?.bac_si_id || !!apt?.chuyen_gia_id;
}

export function isReceptionistLockedStatus(currentStatus: string): boolean {
  return IN_PROGRESS_LOCKED_STATUSES.includes(currentStatus) || TERMINAL_STATUSES.includes(currentStatus);
}

export function getReceptionistActionOptions(
  currentStatus: string,
  _hasAssignedStaff: boolean
): ReceptionistStatusOption[] {
  if (currentStatus === 'da_xac_nhan') {
    return [
      { value: 'da_checkin', label: 'Check-in' },
      { value: 'khong_den', label: 'Không đến' },
      { value: 'da_huy', label: 'Hủy' },
    ];
  }
  if (currentStatus === 'da_checkin') {
    return [
      { value: 'khong_den', label: 'Không đến (Vắng mặt)' },
      { value: 'da_huy', label: 'Hủy lịch' },
    ];
  }
  if (currentStatus === 'cho_tai_luong_gia') {
    return [
      { value: 'da_checkin', label: 'Check-in tái lượng giá' },
      { value: 'da_huy', label: 'Hủy' },
    ];
  }
  return [];
}

/** Chỉ các giá trị target (không kèm nhãn) — dùng để validate `handleSubmit`. */
export function getReceptionistAllowedTargets(currentStatus: string, hasAssignedStaff: boolean): string[] {
  return getReceptionistActionOptions(currentStatus, hasAssignedStaff).map((opt) => opt.value);
}
