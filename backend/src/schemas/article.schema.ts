import { z } from 'zod';

export const DANH_MUC_BAI_VIET = ['suc_khoe', 'dieu_tri', 'tin_tuc', 'khuyen_mai', 'phong_ngua'] as const;

export const articleSchema = z.object({
  body: z.object({
    tieu_de: z.string().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề tối đa 200 ký tự'),
    // Không ràng buộc regex ở đây vì service luôn slugify lại trước khi lưu (kể cả rỗng/không hợp lệ)
    slug: z.string().optional().nullable(),
    tom_tat: z.string().min(1, 'Tóm tắt là bắt buộc'),
    noi_dung: z.string().min(1, 'Nội dung là bắt buộc'),
    anh_bia: z.string().optional().nullable(),
    danh_muc: z.enum(DANH_MUC_BAI_VIET, { required_error: 'Danh mục không hợp lệ' }),
    trang_thai: z.enum(['nhap', 'xuat_ban', 'ngung_su_dung']).default('nhap'),
    meta_title: z.string().max(70, 'Tiêu đề SEO tối đa 70 ký tự').optional().nullable(),
    meta_description: z.string().max(160, 'Mô tả SEO tối đa 160 ký tự').optional().nullable(),
    meta_keywords: z.string().max(255).optional().nullable()
  })
});
