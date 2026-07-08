export type RoleView = 'manager' | 'receptionist' | 'doctor';
export type ReceptionistTab = 'pending_contact' | 'today_schedule';
export type TimeRange = 'today' | '7days' | 'month' | 'custom';
export type ViewMode = 'timeline' | 'capacity';

export interface Appointment {
  id: string | number;
  ma_lich_dat: string;
  khach_hang_id?: string | number | null;
  ten_khach_hang: string;
  ho_ten_khach?: string;
  so_dien_thoai: string;
  gioi_tinh_khach?: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  ly_do_kham?: string;
  anh_dinh_kem_url?: string;
  trang_thai: string;
  thoi_gian_tao?: string;
  han_xac_nhan?: string;
  bac_si_id?: string | number | null;
  phong_id?: string | number | null;
  ten_dich_vu?: string;
  dich_vu_id?: string | number | null;
  loai_lich?: string;
}

export interface Staff {
  id: string | number;
  ho_ten: string;
  vai_tro: string;
}

export interface Room {
  id: string | number;
  ten_phong: string;
  loai_phong: string;
  suc_chua: number;
}
