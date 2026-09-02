import React from 'react';
import { CalendarCheck, MapPin, Stethoscope, RotateCcw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Nguồn cấu hình DUY NHẤT cho 7 trạng thái lâm sàng thật của `cuoc_hen.trang_thai` (A5b/A10,
 * 06/08/2026) — thay thế 2 bảng lệch nhau trước đây (`statusConfig` 9 chuỗi gồm cả
 * `chua_xac_nhan`/`cho_xac_nhan`/`giu_cho` đã bỏ, và `getClinicalStatusConfig` có thêm
 * `cho_kham` — trạng thái không tồn tại trong DB, chỉ sống ở tầng giao diện cũ).
 *
 * `dang_kham` dùng chung nhãn "Đang thực hiện" cho cả bàn lượng giá lẫn bàn trị liệu (A10c) —
 * không còn phân nhánh theo actor như bản `getClinicalStatusConfig` cũ.
 *
 * `da_huy_phat`/`khach_khong_den`/`khach_khong_den_phat` là biến thể có phạt của
 * `da_huy`/`khong_den` (xem `TERMINAL_STATUSES` ở backend `domain/appointmentStatus.ts`) — dùng
 * chung màu/icon với trạng thái gốc vì với người xem đó vẫn là "đã hủy"/"không đến".
 */
export const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-955/10 dark:text-blue-450 dark:border-blue-900/30', icon: React.createElement(CalendarCheck, { size: 13, className: "text-blue-500" }) },
  da_checkin: { label: 'Đã check-in', color: 'bg-teal-50 text-teal-700 border-teal-200/50 dark:bg-teal-955/10 dark:text-teal-450 dark:border-teal-900/30', icon: React.createElement(MapPin, { size: 13, className: "text-teal-500" }) },
  dang_kham: { label: 'Đang thực hiện', color: 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-955/10 dark:text-emerald-400 dark:border-emerald-900/30', icon: React.createElement(Stethoscope, { size: 13, className: "text-emerald-500" }) },
  cho_tai_luong_gia: { label: 'Chờ tái lượng giá', color: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-955/10 dark:text-amber-450 dark:border-amber-900/30', icon: React.createElement(RotateCcw, { size: 13, className: "text-amber-500" }) },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800 border-emerald-200/60 dark:bg-emerald-955/20 dark:text-emerald-455 dark:border-emerald-900/30', icon: React.createElement(CheckCircle2, { size: 13, className: "text-emerald-600" }) },
  da_huy: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-150/40 dark:bg-rose-955/10 dark:text-rose-455 dark:border-rose-900/30', icon: React.createElement(XCircle, { size: 13, className: "text-rose-500" }) },
  khong_den: { label: 'Không đến', color: 'bg-slate-100 text-slate-400 border-slate-200/50 dark:bg-zinc-800/20 dark:text-zinc-500 dark:border-zinc-850/80', icon: React.createElement(AlertTriangle, { size: 13, className: "text-slate-400" }) },
};
// Biến thể có phạt — cùng màu/icon với trạng thái gốc.
statusConfig.da_huy_phat = statusConfig.da_huy;
statusConfig.khach_khong_den = statusConfig.khong_den;
statusConfig.khach_khong_den_phat = statusConfig.khong_den;
