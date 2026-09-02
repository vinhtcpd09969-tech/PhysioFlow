import { HinhThucThanhToanGoi, LoaiGoi, NoShowAction, PaymentInstallment } from './types';

/** % giảm giá mặc định theo hình thức thanh toán, dùng khi chưa có số tiền giảm thực tế để tính động. */
export const DEFAULT_DISCOUNT_PERCENT: Record<'tra_thang', number> = {
  tra_thang: 10,
};

/**
 * % phạt mặc định khi hủy gói giữa chừng — dùng làm biên an toàn.
 */
export const DEFAULT_CANCELLATION_PENALTY_PERCENT = 10;

/**
 * Số tiền tối thiểu phải trả trước khi đặt/thực hiện buổi thứ `sessionNum`.
 */
export function getMinPaymentRequired(
  hinhThuc: HinhThucThanhToanGoi,
  packageTotal: number,
  totalSessions: number,
  sessionNum: number,
  grossBeforeExamDeduction: number = packageTotal
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

/**
 * % giảm giá hóa đơn: tính động từ số tiền giảm thực tế, fallback về hằng số mặc định.
 */
export function calculateDiscountPercent(
  basePrice: number,
  totalDiscountAmount: number,
  hinhThuc: HinhThucThanhToanGoi
): number {
  if (basePrice > 0) {
    return Math.round((totalDiscountAmount * 100) / basePrice);
  }
  if (hinhThuc === 'tra_thang') return DEFAULT_DISCOUNT_PERCENT.tra_thang;
  return 0;
}

export interface PackageCancellationRefundInput {
  tongTienGoc: number;
  soTienDaDong: number;
  giaThanhToanGoi: number;
  soBuoiDung: number;
  tongSoBuoi: number;
  chiPhiKham: number;
  hasExam: boolean;
  hasPaidSeparateExam: boolean;
  phiPhatPercent: number;
}

export interface PackageCancellationRefundResult {
  giaGocGoi: number;
  giaThanhToanGoi: number;
  chiPhiBuoiDung: number;
  phiPhatThucTe: number;
  examFeeToCharge: number;
  soTienHoanTra: number;
  keptRevenuePackage: number;
}

/**
 * Tính toán hoàn tiền khi hủy gói giữa chừng.
 */
export function calculatePackageCancellationRefund(
  input: PackageCancellationRefundInput
): PackageCancellationRefundResult {
  const {
    tongTienGoc,
    soTienDaDong,
    giaThanhToanGoi,
    soBuoiDung,
    tongSoBuoi,
    chiPhiKham,
    hasExam,
    hasPaidSeparateExam,
    phiPhatPercent,
  } = input;

  const giaGocGoi = tongTienGoc;
  const chiPhiBuoiDung = Math.round((giaThanhToanGoi * soBuoiDung) / tongSoBuoi);
  const phiPhatThucTe = Math.round((giaThanhToanGoi * phiPhatPercent) / 100);
  const examFeeToCharge = hasExam && !hasPaidSeparateExam ? chiPhiKham : 0;
  const tongKhauTru = examFeeToCharge + chiPhiBuoiDung + phiPhatThucTe;
  const soTienHoanTra = Math.max(0, soTienDaDong - tongKhauTru);
  const keptRevenuePackage = soTienDaDong - soTienHoanTra;

  return {
    giaGocGoi,
    giaThanhToanGoi,
    chiPhiBuoiDung,
    phiPhatThucTe,
    examFeeToCharge,
    soTienHoanTra,
    keptRevenuePackage,
  };
}

export interface NoShowOutcome {
  finalStatus: string;
  reputationPenalty: number;
}

/**
 * Xác định trạng thái kết thúc ca (da_huy / khong_den). Đã loại bỏ hoàn toàn phạt điểm uy tín.
 */
export function resolveNoShowOutcome(
  action: NoShowAction,
  _hinhThuc: HinhThucThanhToanGoi | null,
  _isPackageSession: boolean
): NoShowOutcome {
  return {
    finalStatus: action === 'da_huy' ? 'da_huy' : 'khong_den',
    reputationPenalty: 0
  };
}

export interface PaymentTransactionDetail {
  v: 1;
  loai_hoa_don: LoaiGoi | null;
  hinh_thuc_thanh_toan_goi: HinhThucThanhToanGoi | null;
  dot: PaymentInstallment;
  so_buoi_thu_tu: number | null;
  ty_le_phan_tram: number;
  dien_giai: string;
}

/**
 * Mô tả có cấu trúc cho 1 giao dịch THANH_TOAN.
 */
export function describePaymentTransaction(input: {
  loaiHoaDon: LoaiGoi | null;
  hinhThuc: HinhThucThanhToanGoi | null;
  dot: PaymentInstallment;
  soBuoiThuTu?: number | null;
  tongSoBuoi?: number | null;
}): PaymentTransactionDetail {
  const { loaiHoaDon, hinhThuc, dot, soBuoiThuTu = null, tongSoBuoi = null } = input;

  let dienGiai: string;
  let tyLePhanTram: number;

  switch (dot) {
    case 'buoi_le':
      dienGiai = soBuoiThuTu ? `Thanh toán cho buổi trị liệu số ${soBuoiThuTu}` : 'Thanh toán cho 1 buổi trị liệu';
      tyLePhanTram = tongSoBuoi ? Math.round(100 / tongSoBuoi) : 0;
      break;
    case 'phi_kham':
      dienGiai = 'Thanh toán phí khám lâm sàng liên kết';
      tyLePhanTram = 0;
      break;
    case 'con_lai':
      dienGiai = 'Thanh toán nốt số tiền còn lại';
      tyLePhanTram = 0;
      break;
    case 'tron_goi':
    default:
      dienGiai = loaiHoaDon === 'LIEU_TRINH' ? 'Thanh toán trọn gói 100%' : 'Thanh toán trực tiếp';
      tyLePhanTram = 100;
      break;
  }

  return {
    v: 1,
    loai_hoa_don: loaiHoaDon,
    hinh_thuc_thanh_toan_goi: hinhThuc,
    dot,
    so_buoi_thu_tu: soBuoiThuTu,
    ty_le_phan_tram: tyLePhanTram,
    dien_giai: dienGiai,
  };
}
