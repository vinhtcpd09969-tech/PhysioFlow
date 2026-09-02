/**
 * Bản sao phía frontend của các quy tắc thanh toán gói — PHẢI khớp đúng `backend/src/domain/billing.ts`.
 */

export const DEFAULT_CANCELLATION_PENALTY_PERCENT = 10;

/**
 * Số tiền tối thiểu khách phải đóng trước khi đặt/thực hiện buổi thứ `sessionNum`.
 */
export function getMinPaymentRequired(
  hinhThuc: string,
  packageTotal: number,
  totalSessions: number,
  sessionNum: number
): number {
  if (hinhThuc === 'tra_thang') {
    return packageTotal;
  }
  if (hinhThuc === 'tung_buoi') {
    const sessionPrice = Math.round(packageTotal / totalSessions);
    return Math.min(packageTotal, (sessionNum - 1) * sessionPrice);
  }
  return 0;
}

/**
 * Số tiền CẦN THU THÊM cho buổi thứ `sessionNum` của gói trả từng buổi (tung_buoi).
 */
export function getTungBuoiSessionDue(
  packageTotal: number,
  totalSessions: number,
  sessionNum: number,
  alreadyPaid: number
): number {
  const sessionPrice = totalSessions > 0 ? Math.round(packageTotal / totalSessions) : packageTotal;
  const cumulativeRequired = sessionNum >= totalSessions ? packageTotal : sessionNum * sessionPrice;
  return Math.max(0, cumulativeRequired - alreadyPaid);
}

/** Trạng thái phác đồ coi như đã chấm dứt vĩnh viễn — không đặt lịch, không thu thêm tiền. */
const CANCELLED_PLAN_STATUSES = ['huy', 'da_huy'];

/**
 * Gói đã bị hủy (kèm hoàn tiền) hay chưa.
 */
export function isPlanCancelled(plan: {
  trang_thai?: string | null;
  hoa_don_trang_thai?: string | null;
  trang_thai_hoa_don_goi?: string | null;
} | null | undefined): boolean {
  if (!plan) return false;
  if (CANCELLED_PLAN_STATUSES.includes(String(plan.trang_thai || ''))) return true;
  const invoiceStatus = String(plan.hoa_don_trang_thai || plan.trang_thai_hoa_don_goi || '');
  return invoiceStatus === 'da_hoan_tien';
}

/**
 * Gói đã quá hạn sử dụng.
 */
export function isPlanExpired(plan: {
  trang_thai?: string | null;
  han_su_dung?: string | null;
} | null | undefined): boolean {
  if (!plan || !plan.han_su_dung) return false;
  if (plan.trang_thai !== 'dang_dieu_tri') return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  const hanStr = new Date(plan.han_su_dung).toISOString().slice(0, 10);
  return hanStr < todayStr;
}

/**
 * Khách đã đóng đủ tiền để được đặt/thực hiện buổi thứ `sessionNum` chưa.
 */
export function isSessionPaymentSatisfied(
  plan: {
    loai_goi?: string | null;
    hinh_thuc_thanh_toan_goi?: string | null;
    tong_tien_phai_tra?: number | string | null;
    so_tien_da_tra?: number | string | null;
    tong_so_buoi?: number | string | null;
    tong_tien_goc?: number | string | null;
    so_tien_giam_voucher?: number | string | null;
    trang_thai?: string | null;
    hoa_don_trang_thai?: string | null;
    trang_thai_hoa_don_goi?: string | null;
  },
  _sessionNum?: number
): boolean {
  if (plan?.loai_goi === 'LE') return true;
  if (isPlanCancelled(plan)) return true;

  const hinhThuc = plan?.hinh_thuc_thanh_toan_goi || 'tra_thang';
  if (hinhThuc === 'tra_thang') {
    return Number(plan?.so_tien_da_tra || 0) >= Number(plan?.tong_tien_phai_tra || 0);
  }
  if (hinhThuc === 'tung_buoi') {
    // Với gói trả từng buổi: thanh toán linh hoạt theo từng ca (tại quầy lúc check-in hoặc sau ca trị liệu).
    // Khách hàng không bị chặn đặt lịch buổi tiếp theo.
    return true;
  }
  return false;
}

/**
 * Lịch hẹn/buổi này còn cần thu tiền hay không.
 */
export function isPaymentDue(apt: {
  trang_thai_thanh_toan?: string | null;
  trang_thai_hoa_don_goi?: string | null;
  loai_lich?: string | null;
  loai_goi?: string | null;
  hinh_thuc_thanh_toan_goi?: string | null;
  so_thu_tu_buoi?: number | string | null;
  tong_so_buoi_goi?: number | string | null;
  so_tien_da_tra_goi?: number | string | null;
  tong_tien_phai_tra_goi?: number | string | null;
  tong_tien_goc_goi?: number | string | null;
}): boolean {
  const hinhThuc = apt.hinh_thuc_thanh_toan_goi;

  // Nếu là gói trả từng buổi: tính chính xác theo số tiền đã tích lũy và số thứ tự buổi
  if (hinhThuc === 'tung_buoi') {
    const soThuTu = Number(apt.so_thu_tu_buoi || 1);
    const tongSoBuoi = Number(apt.tong_so_buoi_goi || 10);
    const daTra = Number(apt.so_tien_da_tra_goi || 0);
    const phaiTra = Number(apt.tong_tien_phai_tra_goi || 0);
    return getTungBuoiSessionDue(phaiTra, tongSoBuoi, soThuTu, daTra) > 0;
  }

  const DONE_INVOICE_STATUSES = ['da_thanh_toan', 'da_hoan_tien'];
  if (DONE_INVOICE_STATUSES.includes(apt.trang_thai_thanh_toan || '') || DONE_INVOICE_STATUSES.includes(apt.trang_thai_hoa_don_goi || '')) {
    return false;
  }

  const isRetailOrExam = ['kham_moi', 'KHAM', 'dich_vu_don', 'DICH_VU_LE'].includes(apt.loai_lich || '') || apt.loai_goi === 'LE';

  if (isRetailOrExam) {
    if (!hinhThuc) {
      return apt.trang_thai_thanh_toan !== 'da_thanh_toan';
    }
    const giaGocGoi = Number(apt.tong_tien_goc_goi || 0);
    const isWaived = hinhThuc === 'tra_thang' && giaGocGoi >= 1_000_000;
    if (isWaived) return false;
  }

  const daTra = Number(apt.so_tien_da_tra_goi || 0);
  const phaiTra = Number(apt.tong_tien_phai_tra_goi || 0);

  if (hinhThuc === 'tra_thang' || !hinhThuc) {
    return daTra < phaiTra;
  }

  return false;
}

/**
 * Gói liệu trình còn đủ điều kiện đi qua luồng "Hủy gói & hoàn tiền" thông thường hay không.
 */
export function canRefundPackage(invoice: {
  phac_do_dieu_tri_id?: string | null;
  loai_goi?: string | null;
  hinh_thuc_thanh_toan_goi?: string | null;
  trang_thai?: string | null;
  han_su_dung?: string | null;
  trang_thai_phac_do?: string | null;
}): boolean {
  if (!invoice.phac_do_dieu_tri_id) return false;
  if (invoice.loai_goi !== 'LIEU_TRINH') return false;
  if (invoice.hinh_thuc_thanh_toan_goi === 'tung_buoi') return false;
  if (invoice.trang_thai === 'da_hoan_tien') return false;
  if (['huy', 'hoan_thanh'].includes(invoice.trang_thai_phac_do || '')) return false;

  const isOverdue = !!invoice.han_su_dung && new Date(invoice.han_su_dung) < new Date();
  if (isOverdue) return false;

  return true;
}

/**
 * Danh sách "ca cần thanh toán" hiển thị cho lễ tân.
 */
export function isAwaitingPaymentForList(apt: Parameters<typeof isPaymentDue>[0] & {
  trang_thai?: string | null;
}): boolean {
  if (['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat', 'dang_kham'].includes(apt.trang_thai || '')) return false;

  const isRetailOrExam = ['kham_moi', 'KHAM', 'dich_vu_don', 'DICH_VU_LE'].includes(apt.loai_lich || '') || apt.loai_goi === 'LE';
  const isSessionStarted = apt.trang_thai === 'hoan_thanh';

  if ((isRetailOrExam || apt.hinh_thuc_thanh_toan_goi === 'tung_buoi') && !isSessionStarted) {
    return false;
  }

  return isPaymentDue(apt);
}

export interface PackageRefundCalculationParams {
  totalPaid: number;
  packagePrice: number;
  voucherDiscount?: number;
  usedSessions: number;
  totalSessions: number;
  penaltyPercent?: number;
  examFeeToCharge?: number;
}

export interface PackageRefundCalculationResult {
  giaGocGoi: number;
  soTienDaDong: number;
  giaThanhToanGoi: number;
  totalSessions: number;
  usedSessions: number;
  perSessionCost: number;
  usedSessionsCost: number;
  penaltyPercent: number;
  penaltyAmount: number;
  examFeeToCharge: number;
  totalDeduction: number;
  estimatedRefund: number;
  keptRevenue: number;
  shortfall: number;
  isRefundable: boolean;
}

/**
 * Tính toán số tiền hoàn trả cho gói liệu trình hủy giữa chừng — Single Source of Truth
 */
export function calculatePackageRefund(params: PackageRefundCalculationParams): PackageRefundCalculationResult {
  const totalPaid = Math.max(0, Number(params.totalPaid || 0));
  const giaGocGoi = Math.max(0, Number(params.packagePrice || 0));
  const voucherDiscount = Math.max(0, Number(params.voucherDiscount || 0));
  const giaThanhToanGoi = Math.max(0, giaGocGoi - voucherDiscount);
  const totalSessions = Math.max(1, Number(params.totalSessions || 10));
  const usedSessions = Math.max(0, Number(params.usedSessions || 0));
  const penaltyPercent = Number(params.penaltyPercent ?? DEFAULT_CANCELLATION_PENALTY_PERCENT);
  const examFeeToCharge = Math.max(0, Number(params.examFeeToCharge || 0));

  const perSessionCost = totalSessions > 0 ? Math.round(giaThanhToanGoi / totalSessions) : 0;
  const usedSessionsCost = Math.round((giaThanhToanGoi * usedSessions) / totalSessions);
  const penaltyAmount = Math.round((giaThanhToanGoi * penaltyPercent) / 100);
  const totalDeduction = usedSessionsCost + penaltyAmount + examFeeToCharge;
  const estimatedRefund = Math.max(0, totalPaid - totalDeduction);
  const keptRevenue = totalPaid - estimatedRefund;
  const shortfall = Math.max(0, totalDeduction - totalPaid);

  return {
    giaGocGoi,
    soTienDaDong: totalPaid,
    giaThanhToanGoi,
    totalSessions,
    usedSessions,
    perSessionCost,
    usedSessionsCost,
    penaltyPercent,
    penaltyAmount,
    examFeeToCharge,
    totalDeduction,
    estimatedRefund,
    keptRevenue,
    shortfall,
    isRefundable: estimatedRefund > 0
  };
}

