import { describe, expect, it } from 'vitest';
import { checkReceptionistTransition, getReceptionistAllowedTargets, isReceptionistLockedStatus } from './appointmentStatus';

describe('getReceptionistAllowedTargets', () => {
  it('đã xác nhận -> Check-in, Không đến, Hủy', () => {
    expect(getReceptionistAllowedTargets('da_xac_nhan', true)).toEqual(['da_checkin', 'khong_den', 'da_huy']);
  });

  it('đã check-in -> Không đến, Hủy', () => {
    expect(getReceptionistAllowedTargets('da_checkin', true)).toEqual(['khong_den', 'da_huy']);
  });
});

describe('isReceptionistLockedStatus', () => {
  it('khóa khi đang tiến hành (dang_kham)/đã hoàn thành', () => {
    expect(isReceptionistLockedStatus('da_checkin')).toBe(false);
    expect(isReceptionistLockedStatus('dang_kham')).toBe(true);
    expect(isReceptionistLockedStatus('cho_tai_luong_gia')).toBe(false);
    expect(isReceptionistLockedStatus('hoan_thanh')).toBe(true);
  });

  it('khóa khi đã hủy/không đến', () => {
    expect(isReceptionistLockedStatus('da_huy')).toBe(true);
    expect(isReceptionistLockedStatus('khong_den')).toBe(true);
  });

  it('không khóa khi đã xác nhận', () => {
    expect(isReceptionistLockedStatus('da_xac_nhan')).toBe(false);
  });
});

describe('checkReceptionistTransition', () => {
  it('cho phép giữ nguyên trạng thái hiện tại (chỉ sửa ghi chú/nhân sự)', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'da_xac_nhan', true)).toEqual({ allowed: true });
  });

  it('đã check-in -> cho phép chuyển không đến và hủy', () => {
    expect(checkReceptionistTransition('da_checkin', 'khong_den', true)).toEqual({ allowed: true });
    expect(checkReceptionistTransition('da_checkin', 'da_huy', true)).toEqual({ allowed: true });
  });

  it('đã check-in -> chặn thủ công chuyển về đã xác nhận trừ khi đổi lịch', () => {
    expect(checkReceptionistTransition('da_checkin', 'da_xac_nhan', true).allowed).toBe(false);
    expect(checkReceptionistTransition('da_checkin', 'da_xac_nhan', true, true)).toEqual({ allowed: true });
  });

  it('đã hủy -> khóa toàn bộ, không đổi lại được', () => {
    const result = checkReceptionistTransition('da_huy', 'da_xac_nhan', true);
    expect(result.allowed).toBe(false);
  });

  it('không bao giờ cho lễ tân đặt trực tiếp đang khám/hoàn thành', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'dang_kham', true).allowed).toBe(false);
    expect(checkReceptionistTransition('da_xac_nhan', 'hoan_thanh', true).allowed).toBe(false);
  });

  it('đã xác nhận -> check-in hợp lệ', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'da_checkin', true)).toEqual({ allowed: true });
  });

  it('chờ tái lượng giá -> check-in tái khám và hủy đều hợp lệ', () => {
    expect(checkReceptionistTransition('cho_tai_luong_gia', 'da_checkin', true)).toEqual({ allowed: true });
    expect(checkReceptionistTransition('cho_tai_luong_gia', 'da_huy', true)).toEqual({ allowed: true });
  });
});
