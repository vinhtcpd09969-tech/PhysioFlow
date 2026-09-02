import { describe, expect, it } from 'vitest';
import {
  calculateDiscountPercent,
  calculatePackageCancellationRefund,
  describePaymentTransaction,
  getMinPaymentRequired,
  resolveNoShowOutcome,
} from './billing';

describe('getMinPaymentRequired', () => {
  it('trả thẳng -> luôn yêu cầu 100% bất kể buổi thứ mấy', () => {
    expect(getMinPaymentRequired('tra_thang', 5_000_000, 10, 1)).toBe(5_000_000);
    expect(getMinPaymentRequired('tra_thang', 5_000_000, 10, 9)).toBe(5_000_000);
  });

  it('trả từng buổi -> lũy kế theo số buổi đã dùng', () => {
    const packageTotal = 1_000_000;
    const sessionPrice = Math.round(packageTotal / 10);
    expect(getMinPaymentRequired('tung_buoi', packageTotal, 10, 1)).toBe(0);
    expect(getMinPaymentRequired('tung_buoi', packageTotal, 10, 4)).toBe(3 * sessionPrice);
  });
});

describe('calculateDiscountPercent', () => {
  it('tính động từ số tiền giảm thực tế khi có basePrice', () => {
    expect(calculateDiscountPercent(1_000_000, 100_000, 'tra_thang')).toBe(10);
  });

  it('fallback về hằng số mặc định khi basePrice = 0', () => {
    expect(calculateDiscountPercent(0, 0, 'tra_thang')).toBe(10);
    expect(calculateDiscountPercent(0, 0, 'tung_buoi')).toBe(0);
  });
});

describe('calculatePackageCancellationRefund', () => {
  it('gói 5.130.000đ, mới đóng 2.565.000đ, phạt 10% trên giá gói đã chốt', () => {
    const result = calculatePackageCancellationRefund({
      tongTienGoc: 5_130_000,
      soTienDaDong: 2_565_000,
      giaThanhToanGoi: 5_130_000,
      soBuoiDung: 0,
      tongSoBuoi: 10,
      chiPhiKham: 0,
      hasExam: false,
      hasPaidSeparateExam: false,
      phiPhatPercent: 10,
    });

    expect(result.phiPhatThucTe).toBe(513_000);
    expect(result.soTienHoanTra).toBe(2_565_000 - 513_000);
  });
});

describe('resolveNoShowOutcome', () => {
  it('hủy -> trả về finalStatus da_huy và 0 điểm uy tín', () => {
    expect(resolveNoShowOutcome('da_huy', null, false)).toEqual({ finalStatus: 'da_huy', reputationPenalty: 0 });
  });

  it('không đến -> trả về finalStatus khong_den và 0 điểm uy tín', () => {
    expect(resolveNoShowOutcome('khong_den', null, false)).toEqual({ finalStatus: 'khong_den', reputationPenalty: 0 });
  });
});

describe('describePaymentTransaction', () => {
  it('KHAM/LE trả trực tiếp -> không gọi là "trọn gói"', () => {
    const result = describePaymentTransaction({ loaiHoaDon: 'KHAM', hinhThuc: null, dot: 'tron_goi' });
    expect(result.dien_giai).toBe('Thanh toán trực tiếp');
    expect(result.ty_le_phan_tram).toBe(100);
  });

  it('LIEU_TRINH trả thẳng -> "trọn gói 100%"', () => {
    const result = describePaymentTransaction({ loaiHoaDon: 'LIEU_TRINH', hinhThuc: 'tra_thang', dot: 'tron_goi' });
    expect(result.dien_giai).toBe('Thanh toán trọn gói 100%');
  });

  it('trả từng buổi -> ghi đúng số thứ tự buổi và % theo tổng số buổi', () => {
    const result = describePaymentTransaction({
      loaiHoaDon: 'LIEU_TRINH',
      hinhThuc: 'tung_buoi',
      dot: 'buoi_le',
      soBuoiThuTu: 3,
      tongSoBuoi: 10,
    });
    expect(result.dien_giai).toBe('Thanh toán cho buổi trị liệu số 3');
    expect(result.ty_le_phan_tram).toBe(10);
    expect(result.so_buoi_thu_tu).toBe(3);
  });
});
