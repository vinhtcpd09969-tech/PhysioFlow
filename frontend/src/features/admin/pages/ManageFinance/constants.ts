// Mapping trạng thái dùng chung cho FinanceKpiCards, InvoiceTable, PaymentTable và InvoiceDetailModal —
// giữ nguyên bảng màu emerald(thành công)/amber(chờ)/rose(hoàn tiền)/zinc(trung tính) đã đúng chuẩn,
// chỉ tập trung lại 1 nơi duy nhất thay vì định nghĩa cục bộ trong index.tsx như trước.
export const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    da_thanh_toan: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    thanh_cong: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    chua_thanh_toan: 'bg-amber-50 text-amber-700 border border-amber-250/50',
    dang_tra_tung_buoi: 'bg-sky-50 text-sky-700 border border-sky-200/50',
    da_hoan_tien: 'bg-rose-50 text-rose-700 border border-rose-200/50',
    cho_xu_ly: 'bg-zinc-50 text-zinc-700 border border-zinc-200',
  };
  return badges[status] || 'bg-zinc-50 text-zinc-700 border border-zinc-200';
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  da_thanh_toan: 'Đã thanh toán',
  chua_thanh_toan: 'Chưa thanh toán',
  dang_tra_tung_buoi: 'Đang trả từng buổi',
  da_hoan_tien: 'Đã hoàn tiền',
};

export const INVOICE_PENDING_STATUSES = ['dang_tra_tung_buoi'];

export const INVOICE_STATUS_OPTIONS = [
  { value: 'da_thanh_toan', label: 'Đã thanh toán' },
  { value: 'con_no', label: 'Còn nợ / Đang thanh toán' },
  { value: 'da_hoan_tien', label: 'Đã hoàn tiền' },
];

// Bảng giao_dich_thanh_toan KHÔNG có cột trang_thai (xem schema.prisma) — thứ thật sự phân biệt
// 1 dòng giao dịch là loai_giao_dich (THANH_TOAN/HOAN_TIEN), không phải "trạng thái". Trước đây
// UI lọc/hiện badge theo pay.trang_thai (trường không tồn tại, luôn undefined) nên luôn rỗng.
export const TRANSACTION_TYPE_META: Record<string, { label: string; badge: string }> = {
  THANH_TOAN: { label: 'Thanh toán', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  HOAN_TIEN: { label: 'Hoàn tiền', badge: 'bg-rose-50 text-rose-700 border border-rose-200/50' },
};

export const PAYMENT_TYPE_OPTIONS = [
  { value: 'THANH_TOAN', label: 'Thanh toán' },
  { value: 'HOAN_TIEN', label: 'Hoàn tiền' },
];

export const INVOICE_TYPE_OPTIONS = [
  { value: '100', label: 'Trả thẳng 100% / Dịch vụ lẻ' },
  { value: 'tung_buoi', label: 'Trả từng buổi' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'tien_mat', label: 'Tiền mặt' },
  { value: 'chuyen_khoan', label: 'Chuyển khoản' },
];

export const DATE_FILTER_OPTIONS = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7days', label: '7 ngày qua' },
  { value: 'thisMonth', label: 'Tháng này' },
];

export const FINANCE_PAGE_SIZE = 10;
