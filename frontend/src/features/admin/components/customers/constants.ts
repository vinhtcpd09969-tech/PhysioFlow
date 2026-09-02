import type { TreatmentPlanStatus } from './types';

// Nhãn trạng thái THẬT của 1 gói liệu trình — dùng ở khối "Gói liệu trình" (tab "Hồ sơ điều trị").
export const PLAN_STATUS_META: Record<TreatmentPlanStatus, { label: string }> = {
  dang_dieu_tri: { label: 'Đang điều trị' },
  qua_han: { label: 'Quá hạn' },
  hoan_thanh: { label: 'Hoàn thành' },
  huy: { label: 'Đã hủy' }
};
export const DEFAULT_PAGE_SIZE = 20;

// Khối "Ca khám & dịch vụ lẻ hoàn thành" nằm phía trên "Gói liệu trình" trong cùng 1 màn hình —
// trang nhỏ hơn để không phải cuộn quá xa mới thấy khối liệu trình bên dưới.
export const SINGLE_VISIT_PAGE_SIZE = 8;
