export type PackageStatus = 'cho_kich_hoat' | 'dang_dieu_tri' | 'hoan_thanh' | 'huy';

export interface CurrentPackageInfo {
  trang_thai: PackageStatus;
  ten_goi: string;
  han_kich_hoat?: string | null;
  so_buoi_da_dung?: number;
  tong_so_buoi?: number;
}

// Lý do cần liên hệ — suy ra từ dữ liệu, KHÔNG lưu DB, chỉ để gợi ý cho Lễ tân biết ai cần gọi
// trước. 2 lý do loại trừ nhau (luật "1 khách 1 liệu trình tại 1 thời điểm").
export type ContactReason =
  | { type: 'cho_kich_hoat'; goi_dich_vu_id?: string | null; cuoc_hen_id?: string | null }
  | { type: 'lau_chua_quay_lai' };

export interface CustomerRosterItem {
  id: string;
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string;
  email: string | null;
  trang_thai: string;
  goi_hien_tai: CurrentPackageInfo | null;
  last_used_at: string | null;
  ly_do_lien_he: ContactReason | null;
}

export interface RosterMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CustomerHistoryPlan {
  id: string;
  goi_dich_vu_id: string;
  tong_so_buoi: number;
  so_buoi_da_dung: number;
  trang_thai: PackageStatus;
  ngay_kich_hoat: string | null;
  han_su_dung?: string | null;
  ten_goi: string;
  loai_goi: string;
  cuoc_hen_id?: string;
  han_kich_hoat?: string | null;
  // Field thanh toán — cần cho isSessionPaymentSatisfied() (utils/billing.ts) để biết buổi tiếp
  // theo có đang bị chặn vì chưa đóng tiền/buổi hiện tại (tung_buoi) hay không.
  hoa_don_id?: string | null;
  hinh_thuc_thanh_toan_goi?: string | null;
  tong_tien_phai_tra?: number | string | null;
  so_tien_da_tra?: number | string | null;
  tong_tien_goc?: number | string | null;
  so_tien_giam_voucher?: number | string | null;
  trang_thai_hoa_don_goi?: string | null;
}

export interface CustomerHistoryAppointment {
  id: string;
  phac_do_dieu_tri_id: string | null;
  so_thu_tu_buoi: number | null;
  goi_dich_vu_id: string | null;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  loai: string;
  trang_thai: string;
  ten_dich_vu: string | null;
}

export interface CustomerHistoryDetail {
  id: string;
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string;
  email: string | null;
  trang_thai: string;
  ngay_sinh: string | null;
  gioi_tinh: string | null;
  dia_chi: string | null;
  plans: CustomerHistoryPlan[];
  appointments: CustomerHistoryAppointment[];
  ly_do_lien_he: ContactReason | null;
  last_used_at: string | null;
}
