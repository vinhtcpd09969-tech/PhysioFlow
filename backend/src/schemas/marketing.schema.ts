import { z } from 'zod';

export const voucherSchema = z.object({
  body: z.object({
    ma_voucher: z.string().optional().nullable(),
    ten_chien_dich: z.string().optional().nullable().default(''),
    loai_giam: z.enum(['phan_tram', 'so_tien_co_dinh']),
    gia_tri_giam: z.coerce.number().positive('Giá trị giảm phải lớn hơn 0'),
    giam_toi_da: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
      z.number().nullable().optional()
    ),
    don_hang_toi_thieu: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
      z.number().min(0).default(0)
    ),
    ap_dung_cho: z.string().optional().default('tat_ca'),
    so_luong_toi_da: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
      z.number().int().nullable().optional()
    ),
    ngay_bat_dau: z.preprocess(
      (val) => (val ? String(val).slice(0, 10) : new Date().toISOString().slice(0, 10)),
      z.string()
    ),
    ngay_het_han: z.preprocess(
      (val) => (!val || val === '' || val === 'null' ? null : String(val).slice(0, 10)),
      z.string().nullable().optional()
    ),
    trang_thai: z.string().optional().default('hoat_dong'),
    tu_dong_ap_dung: z.boolean().optional().default(false),
    loai_goi_ap_dung: z.preprocess(
      (val) => (Array.isArray(val) && val.length > 0 ? val : ['tat_ca']),
      z.array(z.string()).optional().default(['tat_ca'])
    ),
    yeu_cau_thanh_toan: z.preprocess(
      (val) => (Array.isArray(val) && val.length > 0 ? val : ['tat_ca']),
      z.array(z.string()).optional().default(['tat_ca'])
    ),
    dich_vu_ids: z.preprocess(
      (val) => (Array.isArray(val) ? val : []),
      z.array(z.string()).optional().default([])
    ),
    goi_dich_vu_ids: z.preprocess(
      (val) => (Array.isArray(val) ? val : []),
      z.array(z.string()).optional().default([])
    )
  })
    .superRefine((body, ctx) => {
      if (body.loai_giam === 'phan_tram' && body.gia_tri_giam > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gia_tri_giam'],
          message: 'Giá trị giảm theo % không được vượt quá 100',
        });
      }
    })
    .transform((body) => ({
      ...body,
      giam_toi_da: body.loai_giam === 'so_tien_co_dinh' ? null : body.giam_toi_da,
      yeu_cau_thanh_toan: Array.isArray(body.yeu_cau_thanh_toan) && body.yeu_cau_thanh_toan.includes('tat_ca')
        ? ['tat_ca']
        : (body.yeu_cau_thanh_toan || ['tat_ca']),
      loai_goi_ap_dung: Array.isArray(body.loai_goi_ap_dung) && body.loai_goi_ap_dung.includes('tat_ca')
        ? ['tat_ca']
        : (body.loai_goi_ap_dung || ['tat_ca']),
    }))
});
