export type LoaiGoi = 'KHAM' | 'LE' | 'LIEU_TRINH';

/** Giá trị thật của cuoc_hen.loai trong DB (KHAM_MOI là bí danh cũ của KHAM, giữ để đọc dữ liệu cũ). */
export type LoaiCuocHen = 'KHAM' | 'KHAM_MOI' | 'DICH_VU_LE' | 'DIEU_TRI';

export type HinhThucThanhToanGoi = 'tra_thang' | 'tung_buoi';

export type NoShowAction = 'da_huy' | 'khong_den';

export type PaymentInstallment = 'tron_goi' | 'buoi_le' | 'phi_kham' | 'con_lai';
