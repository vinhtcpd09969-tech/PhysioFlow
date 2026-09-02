export interface CustomerOverviewItem {
  id: string;
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string | null;
  email: string | null;
  trang_thai: string;
  tong_chi_tieu: number;
  ti_le_huy?: number;
  tong_lich?: number;
  so_lich_huy_vang?: number;
  has_record: boolean;
}

export type CustomerStatusFilter = 'locked';

// Cảnh báo (không chặn) hiển thị trước khi admin xác nhận khóa — xem useCustomerActions.ts.
export interface CustomerLockImpact {
  upcomingAppointments: number;
  activePlans: { id: string; ten_goi: string; so_buoi_da_dung: number; tong_so_buoi: number }[];
}


export interface EmrStats {
  lieu_trinh: {
    dang_dieu_tri: number;
    qua_han: number;
    hoan_thanh: number;
    huy: number;
    cho_kich_hoat: number;
    tong: number;
  };
  customers_without_record: number;
}

// --- Tab "Hồ sơ điều trị", khối "Gói liệu trình" — 1 dòng = 1 phac_do_dieu_tri. Chỉ 4 trạng thái
// thật của 1 liệu trình (không có "chờ kích hoạt" — đó là gói chưa từng có dòng phac_do_dieu_tri,
// không thuộc danh sách này).
export type TreatmentPlanStatus = 'dang_dieu_tri' | 'qua_han' | 'hoan_thanh' | 'huy';

export interface TreatmentPlanItem {
  id: string;
  khach_hang_id: string;
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string | null;
  email: string | null;
  ten_goi: string;
  status: TreatmentPlanStatus;
  tong_so_buoi: number;
  so_buoi_da_dung: number;
  ngay_kich_hoat: string | null;
  han_su_dung: string | null;
  ngay_hoan_thanh: string | null;
  ngay_huy: string | null;
}

// --- Tab "Hồ sơ điều trị", khối "Ca khám lẻ hoàn thành" — 1 dòng = 1 cuoc_hen (loại KHAM/DICH_VU_LE,
// đã hoàn thành). Không filter (chỉ 1 trạng thái duy nhất được liệt kê).
export interface CompletedSingleVisitItem {
  id: string;
  khach_hang_id: string;
  ma_khach_hang?: string;
  ho_ten: string;
  so_dien_thoai?: string | null;
  loai: 'KHAM' | 'DICH_VU_LE';
  ten_dich_vu: string | null;
  ngay_gio_bat_dau: string;
  ten_nhan_su: string | null;
}
