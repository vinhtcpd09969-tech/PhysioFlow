import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkUserHasActiveShiftToday, requireActiveShift } from './shiftGuard.middleware';
import { pool } from '../config/db';
import { ForbiddenError } from '../utils/appError';

vi.mock('../config/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('shiftGuard.middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkUserHasActiveShiftToday', () => {
    it('should return true immediately for Admin (role 6)', async () => {
      const result = await checkUserHasActiveShiftToday(1, 6);
      expect(result.hasShift).toBe(true);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should return true immediately for Manager (role 5)', async () => {
      const result = await checkUserHasActiveShiftToday(2, 5);
      expect(result.hasShift).toBe(true);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should return false for Customer (role 1)', async () => {
      const result = await checkUserHasActiveShiftToday(3, 1);
      expect(result.hasShift).toBe(false);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should query DB and return true if specialist has an active shift today', async () => {
      const mockShift = { id: 10, nhan_su_id: 4, gio_bat_dau: '07:00:00', gio_ket_thuc: '16:00:00', phong_id: 1, trang_thai: 'hoat_dong' };
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [mockShift] } as any);

      const result = await checkUserHasActiveShiftToday(4, 4);
      expect(result.hasShift).toBe(true);
      expect(result.shiftInfo).toEqual(mockShift);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should query DB and return false if technician does not have an active shift today', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      const result = await checkUserHasActiveShiftToday(5, 3);
      expect(result.hasShift).toBe(false);
      expect(result.shiftInfo).toBeNull();
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('requireActiveShift middleware', () => {
    it('should allow Admin to proceed without a shift', async () => {
      const req: any = { user: { id: 1, vai_tro_id: 6 } };
      const res: any = {};
      const next = vi.fn();

      await requireActiveShift(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow staff with active shift to proceed', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id: 10 }] } as any);
      const req: any = { user: { id: 4, vai_tro_id: 4 } };
      const res: any = {};
      const next = vi.fn();

      await requireActiveShift(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should block staff without active shift with ForbiddenError', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);
      const req: any = { user: { id: 4, vai_tro_id: 4 } };
      const res: any = {};
      const next = vi.fn();

      await requireActiveShift(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.message).toContain('Bạn không có ca trực phân công hôm nay');
    });
  });
});
