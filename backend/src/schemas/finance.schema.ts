import { z } from 'zod';

export const refundSchema = z.object({
  body: z.object({
    ly_do_hoan_tien: z.string().min(1, 'Lý do hoàn tiền là bắt buộc'),
    so_tien_hoan: z.number().positive('Số tiền hoàn phải lớn hơn 0').optional()
  })
});

export const updateInvoiceStatusSchema = z.object({
  body: z.object({
    trang_thai: z.enum(['chua_thanh_toan', 'thanh_toan_mot_phan', 'da_thanh_toan', 'da_hoan_tien']),
    ghi_chu: z.string().optional()
  })
});

// A15b — bỏ `phi_phat` khỏi input: tỉ lệ phạt không còn do Admin gõ tay, đọc snapshot
// `hoa_don.ti_le_phat_huy_goi` ghi tại thời điểm bán gói (xem admin.repository.ts::handlePackageRefund).
export const packageRefundSchema = z.object({
  body: z.object({
    so_buoi_dung: z.number().min(0, 'Số buổi dùng phải lớn hơn hoặc bằng 0'),
    ly_do: z.string().optional()
  })
});

export const expirePackageNoRefundSchema = z.object({
  body: z.object({
    ly_do: z.string().optional()
  })
});
