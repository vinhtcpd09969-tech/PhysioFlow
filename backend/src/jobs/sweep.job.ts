import receptionistRepository from '../repositories/receptionist';
import adminRepository from '../repositories/admin';

/**
 * AUTOMATED MAINTENANCE SWEEP JOB (OfficeCare Background Scheduler)
 * 
 * Tác vụ chạy ngầm định kỳ (Background Job) độc lập với request người dùng:
 * 1. noShowSweep: Tự động chuyển các ca hẹn đã xác nhận nhưng không check-in quá giờ sang 'khong_den'.
 * 2. packageExpirySweep: Tự động hủy các gói liệu trình quá hạn sử dụng (không hoàn tiền).
 * 3. paymentPendingSweep: Tự động đảo các ca hẹn kẹt 'dang_cho_thanh_toan' quá 15 phút về 'chua_thanh_toan'.
 */

const SWEEP_INTERVAL_MS = 60_000; // Mỗi 60 giây quét 1 lần
let isRunning = false;

const runMaintenanceSweeps = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    // 1. Quét lịch hẹn không đến (No-show)
    const noShowCount = await receptionistRepository.sweepNoShowAppointments();
    if (noShowCount > 0) {
      console.log(`⏱ [Sweep Job] Đã tự động đánh dấu "không đến" cho ${noShowCount} lịch hẹn quá giờ nhận khách.`);
    }

    // 2. Quét gói liệu trình hết hạn sử dụng
    const expiredPkgCount = await adminRepository.sweepExpiredPackages();
    if (expiredPkgCount > 0) {
      console.log(`⏱ [Sweep Job] Đã tự động cập nhật ${expiredPkgCount} gói liệu trình quá hạn sử dụng.`);
    }

    // 3. Quét giao dịch thanh toán PayOS treo quá 15 phút
    const pendingPaymentCount = await receptionistRepository.sweepPendingPaymentTimeouts();
    if (pendingPaymentCount > 0) {
      console.log(`⏱ [Sweep Job] Đã tự đảo ${pendingPaymentCount} lịch hẹn kẹt "đang chờ thanh toán" quá hạn về "chưa thanh toán".`);
    }
  } catch (error) {
    console.error('⚠️ [Sweep Job] Lỗi trong quá trình quét bảo trì hệ thống:', error);
  } finally {
    isRunning = false;
  }
};

export const initSweepJob = () => {
  console.log('🤖 Chức năng quét bảo trì hệ thống tự động (Sweep Job) đã khởi động!');
  
  // Chạy lần đầu sau 5 giây khi server khởi động
  setTimeout(runMaintenanceSweeps, 5000);

  // Lặp lại định kỳ mỗi 60 giây
  setInterval(runMaintenanceSweeps, SWEEP_INTERVAL_MS);
};

export default initSweepJob;
