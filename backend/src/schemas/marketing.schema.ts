import { z } from 'zod';

export const voucherSchema = z.object({
  body: z.object({
    ma_voucher: z.string().min(1, 'Mã voucher là bắt buộc'),
    ten_chien_dich: z.string().optional(),
    loai_giam: z.enum(['phan_tram', 'so_tien_co_dinh']),
    gia_tri_giam: z.number().positive('Giá trị giảm phải lớn hơn 0'),
    giam_toi_da: z.number().optional().nullable(),
    don_hang_toi_thieu: z.number().min(0).default(0),
    ap_dung_cho: z.enum(['tat_ca', 'dich_vu_don', 'goi_dieu_tri', 'danh_gia']).default('tat_ca'),
    so_luong_toi_da: z.number().int().optional().nullable(),
    ngay_bat_dau: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
    ngay_het_han: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hết hạn không hợp lệ (YYYY-MM-DD)').optional().nullable(),
    trang_thai: z.enum(['hoat_dong', 'tam_dung', 'het_han', 'sap_ra_mat']).default('hoat_dong'),
    dich_vu_ids: z.array(z.string().uuid('ID dịch vụ không hợp lệ')).optional().default([]),
    goi_dich_vu_ids: z.array(z.string().uuid('ID gói không hợp lệ')).optional().default([])
  })
});

