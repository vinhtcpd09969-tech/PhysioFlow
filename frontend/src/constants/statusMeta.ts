/**
 * Single Source of Truth cho toàn bộ Metadata và Badge hiển thị Trạng thái trên Frontend
 * Khớp chuẩn theo AGENTS.md §2.1
 */

export interface StatusMetaItem {
  label: string;
  cls: string;
  dotColor?: string;
  textColor?: string;
}

/**
 * Trạng thái Phác đồ / Gói liệu trình
 */
export const TREATMENT_PLAN_STATUS_META: Record<string, StatusMetaItem> = {
  dang_dieu_tri: {
    label: 'Đang điều trị',
    cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  hoan_thanh: {
    label: 'Hoàn thành',
    cls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  da_huy: {
    label: 'Đã hủy',
    cls: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  },
  tam_dung: {
    label: 'Tạm dừng',
    cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  }
};

/**
 * Trạng thái Hóa đơn tài chính
 */
export const INVOICE_STATUS_META: Record<string, StatusMetaItem> = {
  da_thanh_toan: {
    label: 'Đã thanh toán',
    cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  chua_thanh_toan: {
    label: 'Chờ thanh toán',
    cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  dang_cho_thanh_toan: {
    label: 'Đang chờ thanh toán',
    cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  dang_tra_tung_buoi: {
    label: 'Đang trả từng buổi',
    cls: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
  },
  da_hoan_tien: {
    label: 'Đã hoàn tiền',
    cls: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  },
  da_huy: {
    label: 'Đã hủy',
    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200'
  }
};

/**
 * Phân loại Gói / Dịch vụ
 */
export const SERVICE_TYPE_META: Record<string, { label: string }> = {
  LIEU_TRINH: { label: 'Gói liệu trình' },
  LE: { label: 'Dịch vụ lẻ' },
  KHAM: { label: 'Buổi Lượng giá' }
};

/**
 * 7 Trạng thái Lâm sàng chuẩn mực của Cuộc hẹn theo AGENTS.md §2.1
 */
export const APPOINTMENT_STATUS_META: Record<string, StatusMetaItem> = {
  da_xac_nhan: {
    label: 'Đã xác nhận',
    cls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  da_checkin: {
    label: 'Đã check-in',
    cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  dang_kham: {
    label: 'Đang thực hiện',
    cls: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
  },
  cho_tai_luong_gia: {
    label: 'Chờ tái lượng giá',
    cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  hoan_thanh: {
    label: 'Hoàn thành',
    cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
  },
  da_huy: {
    label: 'Đã hủy',
    cls: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  },
  khong_den: {
    label: 'Không đến',
    cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
  }
};
