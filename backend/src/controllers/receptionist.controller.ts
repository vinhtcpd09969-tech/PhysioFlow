import { Request, Response } from 'express';
import receptionistService from '../services/receptionist.service';
import receptionistRepository from '../repositories/receptionist';
import appointmentRepository from '../repositories/appointments';
import { DEFAULT_FOLLOW_UP_STALE_DAYS } from '../domain/customerFollowUp';
import { payos } from '../config/payos';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, NotFoundError } from '../utils/appError';

// PATCH /api/receptionist/appointments/:id/status
export const updateAppointmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { trang_thai, ghi_chu_noi_bo } = req.body;
  const effectiveReason = ghi_chu_noi_bo && ghi_chu_noi_bo.trim() ? ghi_chu_noi_bo.trim() : undefined;

  if (['da_huy', 'khong_den'].includes(trang_thai)) {
    if (!effectiveReason) {
      throw new BadRequestError('Lý do hủy/vắng mặt là bắt buộc.');
    }
  }

  const appointment = await receptionistService.updateAppointmentStatus(id, trang_thai, effectiveReason);
  res.json(appointment);
});

// POST /api/receptionist/billing
export const createBillingFromAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { lich_dat_id } = req.body;
  if (!lich_dat_id) {
    throw new BadRequestError('Thiếu ID lịch đặt');
  }

  const result = await receptionistService.createBillingFromAppointment(lich_dat_id);
  res.json({ message: 'Tạo hóa đơn thành công', hoa_don: result });
});

// POST /api/receptionist/payment
export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  const staffId = (req as any).user?.id || (req as any).user?.userId || null;
  const result = await receptionistService.processPayment({
    ...req.body,
    nhan_vien_thuc_hien_id: staffId
  });
  res.json({ message: 'Thanh toán thành công', ...result });
});

// POST /api/receptionist/billing/calculate
export const calculateBilling = asyncHandler(async (req: Request, res: Response) => {
  const result = await receptionistService.calculateBilling(req.body);
  res.json(result);
});

// GET /api/receptionist/vouchers/active
export const getActiveVouchers = asyncHandler(async (req: Request, res: Response) => {
  const khach_hang_id = req.query.khach_hang_id ? String(req.query.khach_hang_id) : undefined;
  const vouchers = await receptionistService.getActiveVouchers(khach_hang_id);
  res.json({ vouchers });
});

// POST /api/receptionist/vouchers/apply
export const applyVoucher = asyncHandler(async (req: Request, res: Response) => {
  const { ma_voucher, loai_thanh_toan, khach_hang_id, kenh, loai_goi } = req.body;
  if (!ma_voucher || !String(ma_voucher).trim()) {
    throw new BadRequestError('Vui lòng nhập mã giảm giá');
  }

  const voucher = await receptionistService.applyVoucher(ma_voucher, loai_thanh_toan, khach_hang_id, kenh, loai_goi);
  res.json({ voucher });
});

// POST /api/receptionist/billing/create
export const createBillingDirect = asyncHandler(async (req: Request, res: Response) => {
  const result = await receptionistService.createBillingDirect(req.body);
  res.json({ message: 'Tạo hóa đơn thành công', hoa_don: result });
});

// GET /api/receptionist/packages
export const getPackagesForReceptionist = asyncHandler(async (req: Request, res: Response) => {
  const result = await receptionistService.getActivePackages();
  res.json(result);
});

// GET /api/receptionist/customers/search
export const searchCustomers = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query.q ? String(req.query.q) : '';
  const result = await receptionistService.searchCustomers(q);
  res.json(result);
});

// GET /api/receptionist/customers/:id/treatment-plans
export const getCustomerTreatmentPlans = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = await receptionistService.getCustomerTreatmentPlans(id);
  res.json(result);
});

// GET /api/receptionist/customers/roster
export const getCustomerRoster = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
  const search = String(req.query.search ?? '').trim();
  const canLienHe = String(req.query.canLienHe ?? '') === 'true';
  const staleDays = Math.max(1, parseInt(String(req.query.staleDays ?? String(DEFAULT_FOLLOW_UP_STALE_DAYS)), 10) || DEFAULT_FOLLOW_UP_STALE_DAYS);

  const result = await receptionistService.getCustomerRoster({ page, pageSize, search, canLienHe, staleDays });
  res.json(result);
});

// GET /api/receptionist/customers/:id/history
export const getCustomerHistory = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const staleDays = Math.max(1, parseInt(String(req.query.staleDays ?? String(DEFAULT_FOLLOW_UP_STALE_DAYS)), 10) || DEFAULT_FOLLOW_UP_STALE_DAYS);
  const result = await receptionistService.getCustomerHistory(id, staleDays);
  res.json(result);
});

// GET /api/receptionist/appointments/:id/billing-info
export const getAppointmentBillingInfo = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = await receptionistService.getAppointmentBillingInfo(id);
  if (!result) {
    throw new NotFoundError('Không tìm thấy lịch hẹn hoặc hóa đơn liên quan');
  }
  res.json(result);
});

// GET /api/receptionist/customers/:id/billing-info-by-package
export const getBillingInfoByPackage = asyncHandler(async (req: Request, res: Response) => {
  const { id: customerId } = req.params;
  const { package_id } = req.query;
  if (!package_id || typeof package_id !== 'string') {
    throw new BadRequestError('Thiếu tham số package_id');
  }

  const result = await receptionistService.getBillingInfoByPackage(customerId as string, package_id as string);
  if (!result) {
    throw new NotFoundError('Không tìm thấy thông tin gói thanh toán');
  }
  res.json(result);
});

// GET /api/receptionist/customers/:id/check-limit
export const checkCustomerLimit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const limitReached = await appointmentRepository.checkCustomerActiveLimit(id, null);
  res.json({ limitReached });
});

// GET /api/receptionist/customers/:id/check-package-payment
export const checkPackagePayment = asyncHandler(async (req: Request, res: Response) => {
  const customerId = String(req.params.id);
  const { package_id: packageId } = req.query;
  if (!packageId || typeof packageId !== 'string') {
    throw new BadRequestError('Thiếu tham số package_id');
  }

  const result = await receptionistService.checkPackagePayment(customerId, packageId);
  res.json(result);
});

// POST /api/receptionist/payment/create-payos-link
export const createPayOSPaymentLink = asyncHandler(async (req: Request, res: Response) => {
  const { hoa_don_id, so_thu_tu_buoi } = req.body;
  const { hd, requiredAmount: amount } = await receptionistService.getRequiredPaymentAmount(hoa_don_id, so_thu_tu_buoi);
  if (amount <= 0) {
    throw new BadRequestError('Hóa đơn đã được thanh toán đầy đủ');
  }

  const hoTen = await receptionistService.getCustomerNameById(hd.khach_hang_id);
  const removeAccents = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9 ]/g, '');
  };
  const cleanName = removeAccents(hoTen).replace(/\s+/g, '').toUpperCase().substring(0, 10);

  const cleanUuid = hoa_don_id.replace(/-/g, '');
  const orderCode = Date.now() % 2000000000;
  const description = `TTHD ${cleanUuid.substring(0, 8).toUpperCase()} ${cleanName}`.substring(0, 25).trim();

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const cancelUrl = `${frontendBaseUrl}/admin/quick-billing`;
  const returnUrl = `${frontendBaseUrl}/admin/quick-billing`;

  const paymentData = {
    orderCode,
    amount,
    description,
    cancelUrl,
    returnUrl,
    expiredAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes
  };

  const paymentLinkRes = await payos.paymentRequests.create(paymentData);
  await receptionistService.markPayOSLinkCreated(hoa_don_id);

  res.json({
    ...paymentLinkRes,
    orderCode,
    amount
  });
});

// POST /api/receptionist/payment/cancel-payos-link
export const cancelPayOSPaymentLink = asyncHandler(async (req: Request, res: Response) => {
  const { hoa_don_id, orderCode, order_code } = req.body;
  let targetOrderCode = orderCode || order_code;

  if (!targetOrderCode && hoa_don_id) {
    const cleanUuid = hoa_don_id.replace(/-/g, '');
    targetOrderCode = parseInt(cleanUuid.substring(0, 7), 16);
  }

  if (targetOrderCode) {
    try {
      await payos.paymentRequests.cancel(Number(targetOrderCode));
    } catch (payosError: any) {
      console.warn('Lỗi từ PayOS khi hủy link (có thể đã hủy trước đó):', payosError.message);
    }
  }

  if (hoa_don_id) {
    await receptionistService.revertPayOSPending(hoa_don_id);
  }

  res.json({ message: 'Đã hủy link thanh toán thành công' });
});

// GET /api/receptionist/payment/status/:id
export const getInvoiceStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orderCode } = req.query;

  let hd = await receptionistRepository.getInvoiceById(id as string);
  if (!hd) {
    throw new NotFoundError('Không tìm thấy hóa đơn');
  }

  if (hd.trang_thai === 'chua_thanh_toan' && orderCode) {
    try {
      const paymentLinkInfo = await payos.paymentRequests.get(Number(orderCode));
      if (paymentLinkInfo.status === 'PAID') {
        console.log(`Polling phát hiện hóa đơn ${hd.id} đã thanh toán trên PayOS. Cập nhật DB...`);
        await receptionistService.processPayment({
          hoa_don_id: hd.id,
          phuong_thuc: 'chuyen_khoan',
          so_tien_nhan: paymentLinkInfo.amountPaid.toString()
        });
        hd = await receptionistRepository.getInvoiceById(id as string);
      }
    } catch (payosErr: any) {
      console.warn('Lỗi khi check status từ PayOS API:', payosErr.message);
    }
  }

  res.json({
    trang_thai: hd?.trang_thai,
    so_tien_da_tra: hd?.da_thanh_toan,
    da_thanh_toan: hd?.da_thanh_toan,
    tong_tien_phai_tra: hd?.tong_tien_thanh_toan,
    tong_tien_thanh_toan: hd?.tong_tien_thanh_toan,
    id: hd?.id
  });
});

// GET /api/receptionist/staff-workload
export const getStaffWorkload = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];
  const workload = await receptionistService.getStaffWorkload(targetDate);
  res.json(workload);
});

// POST /api/receptionist/appointments/:id/unassign
export const unassignAppointmentStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const appointment = await receptionistService.unassignAppointmentStaff(id);
  res.json({ message: 'Đã rút khỏi chỉ định đích danh và đưa ca hẹn về hàng chờ chung.', appointment });
});

// POST /api/receptionist/appointments/sweep-noshow
export const sweepNoShowAppointments = asyncHandler(async (_req: Request, res: Response) => {
  const report = await receptionistRepository.sweepNoShowAppointmentsDetailed();
  res.json({
    success: true,
    message: `Đã quét hoàn tất: ${report.total_swept} ca vắng mặt (${report.unpaid_strikes_count} ca chưa TT tính vi phạm, ${report.paid_noshow_count} ca đã thanh toán).`,
    data: report
  });
});
