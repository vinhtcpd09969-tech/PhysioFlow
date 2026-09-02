import { Request, Response } from 'express';
import { payos } from '../config/payos';
import receptionistRepository from '../repositories/receptionist';
import billingService from '../services/billing.service';

export const payosWebhookHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const webhookData = await payos.webhooks.verify(req.body);

    if (webhookData) {
      const orderCode = webhookData.orderCode;
      const amount = webhookData.amount;
      const description = webhookData.description || '';

      // Extract prefix from description (e.g. "TTHD cf1539b5 TRANVINH" or "TTHDcf1539b5")
      let prefix = '';
      if (description.startsWith('TTHD')) {
        const normalizedDesc = description.replace(/\s+/g, ' ').trim();
        const parts = normalizedDesc.split(' ');
        if (parts[1]) {
          prefix = parts[1].toLowerCase();
        } else {
          prefix = normalizedDesc.replace('TTHD', '').toLowerCase();
        }
      } else {
        // Fallback to orderCode hex mapping for backward compatibility
        prefix = orderCode.toString(16).padStart(7, '0');
      }

      // Find invoice in DB
      const hd = await receptionistRepository.getInvoiceByUuidPrefix(prefix);
      if (!hd) {
        console.error(`Không tìm thấy hóa đơn cho prefix: ${prefix} (orderCode: ${orderCode})`);
        return res.status(404).json({ message: 'Không tìm thấy hóa đơn khớp với mã thanh toán' });
      }

      console.log(`Tìm thấy hóa đơn ${hd.id} từ orderCode ${orderCode}. Tiến hành cập nhật thanh toán...`);

      // Process payment with 'chuyen_khoan' method and received amount via BillingService
      await billingService.processPayment({
        hoa_don_id: hd.id,
        phuong_thuc: 'chuyen_khoan',
        so_tien_nhan: amount.toString()
      });

      return res.json({ status: 'success', message: 'Thanh toán được ghi nhận thành công' });
    }

    return res.status(400).json({ error: 'Chữ ký không hợp lệ' });
  } catch (error: any) {
    console.error('Lỗi khi xử lý webhook PayOS:', error);
    res.status(500).json({ message: 'Lỗi server khi xử lý webhook PayOS', error: error.message });
  }
};
