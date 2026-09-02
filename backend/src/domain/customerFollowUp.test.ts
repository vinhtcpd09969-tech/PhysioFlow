import { describe, expect, it } from 'vitest';
import { daysSince, needsFollowUp } from './customerFollowUp';

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

describe('needsFollowUp', () => {
  it('chưa hoàn thành buổi nào (soBuoiDaDung=0) -> không cần liên hệ', () => {
    expect(needsFollowUp({
      trangThaiGoi: 'dang_dieu_tri',
      soBuoiDaDung: 0,
      lastCompletedAt: null,
      hasUpcomingAppointment: false,
      staleDays: 5,
    })).toBe(false);
  });

  it('đã hoàn thành 1 buổi nhưng chưa đủ staleDays -> không cần liên hệ', () => {
    expect(needsFollowUp({
      trangThaiGoi: 'dang_dieu_tri',
      soBuoiDaDung: 1,
      lastCompletedAt: daysAgo(2),
      hasUpcomingAppointment: false,
      staleDays: 5,
    })).toBe(false);
  });

  it('đúng biên daysSince === staleDays -> cần liên hệ (>=, không phải >)', () => {
    expect(needsFollowUp({
      trangThaiGoi: 'dang_dieu_tri',
      soBuoiDaDung: 1,
      lastCompletedAt: daysAgo(5),
      hasUpcomingAppointment: false,
      staleDays: 5,
    })).toBe(true);
  });

  it('đủ ngày nhưng đã có lịch hẹn tương lai chưa hủy -> không cần liên hệ', () => {
    expect(needsFollowUp({
      trangThaiGoi: 'dang_dieu_tri',
      soBuoiDaDung: 1,
      lastCompletedAt: daysAgo(10),
      hasUpcomingAppointment: true,
      staleDays: 5,
    })).toBe(false);
  });

  it.each(['hoan_thanh', 'huy', 'cho_kich_hoat'])(
    'trang_thai gói khác dang_dieu_tri (%s) -> không cần liên hệ dù các điều kiện khác đều thỏa',
    (trangThaiGoi) => {
      expect(needsFollowUp({
        trangThaiGoi,
        soBuoiDaDung: 3,
        lastCompletedAt: daysAgo(10),
        hasUpcomingAppointment: false,
        staleDays: 5,
      })).toBe(false);
    }
  );

  it('áp dụng đúng khi là buổi thứ 5/8 (không riêng buổi 1) -> cần liên hệ', () => {
    expect(needsFollowUp({
      trangThaiGoi: 'dang_dieu_tri',
      soBuoiDaDung: 5,
      lastCompletedAt: daysAgo(7),
      hasUpcomingAppointment: false,
      staleDays: 5,
    })).toBe(true);
    expect(needsFollowUp({
      trangThaiGoi: 'dang_dieu_tri',
      soBuoiDaDung: 8,
      lastCompletedAt: daysAgo(6),
      hasUpcomingAppointment: false,
      staleDays: 5,
    })).toBe(true);
  });

  it('ngưỡng staleDays khác nhau (3 và 7 ngày) áp dụng đúng', () => {
    expect(needsFollowUp({
      trangThaiGoi: 'dang_dieu_tri',
      soBuoiDaDung: 1,
      lastCompletedAt: daysAgo(4),
      hasUpcomingAppointment: false,
      staleDays: 3,
    })).toBe(true);
    expect(needsFollowUp({
      trangThaiGoi: 'dang_dieu_tri',
      soBuoiDaDung: 1,
      lastCompletedAt: daysAgo(4),
      hasUpcomingAppointment: false,
      staleDays: 7,
    })).toBe(false);
  });
});

describe('daysSince', () => {
  it('làm tròn xuống số ngày đã qua', () => {
    expect(daysSince(daysAgo(5))).toBe(5);
  });

  it('trả số âm cho ngày trong tương lai', () => {
    const future = new Date(Date.now() + 2 * 86400000);
    expect(daysSince(future)).toBeLessThan(0);
  });
});
