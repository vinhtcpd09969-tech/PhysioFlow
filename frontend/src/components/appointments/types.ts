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
  thoi_gian_checkin?: string | null;
  thoi_gian_bat_dau?: string | null;
  han_tai_kham?: string | null;
  ghi_chu?: string | null;
  han_xac_nhan?: string;
  buoi?: 'sang' | 'chieu';
  thoi_luong_phut?: number;
  bac_si_id?: string | number | null;
  phong_id?: string | number | null;
  ten_dich_vu?: string;
  ten_ky_thuat_vien?: string | null;
  ten_phong?: string | null;
  ca_gio_bat_dau?: string | null;
  ca_gio_ket_thuc?: string | null;
  dich_vu_id?: string | number | null;
  loai_lich?: string;
  loai_goi?: string;
  trang_thai_thanh_toan?: string;
  trang_thai_hoa_don_goi?: string;
  hinh_thuc_thanh_toan_goi?: string;
  so_thu_tu_buoi?: number;
  tong_so_buoi_goi?: number;
  so_tien_da_tra_goi?: number;
  tong_tien_phai_tra_goi?: number;
  thoi_gian_goi_vao?: string | null;
  so_lan_goi_khong_co_mat?: number;
  so_thu_tu_hang_doi?: number | null;
}

export interface Staff {
  id: string | number;
  ho_ten: string;
  vai_tro: string;
  anh_dai_dien?: string | null;
}

export interface Room {
  id: string | number;
  ten_phong: string;
  loai_phong: string;
  suc_chua: number;
}
