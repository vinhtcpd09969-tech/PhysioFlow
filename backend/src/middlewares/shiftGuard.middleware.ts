import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { ForbiddenError } from '../utils/appError';

export async function checkUserHasActiveShiftToday(userId: number | string, roleId: number): Promise<{ hasShift: boolean; shiftInfo: any }> {
  // Admin (6) & Manager (5) are superusers -> always have full permissions
  if (Number(roleId) === 5 || Number(roleId) === 6) {
    return { hasShift: true, shiftInfo: null };
  }

  // Customer (1) doesn't have staff shifts
  if (Number(roleId) === 1) {
    return { hasShift: false, shiftInfo: null };
  }

  const { rows } = await pool.query(
    `SELECT id, nhan_su_id, ngay_truc, gio_bat_dau, gio_ket_thuc, phong_id, trang_thai
     FROM lich_truc_nhan_su
     WHERE nhan_su_id = $1::integer
       AND ngay_truc = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
       AND trang_thai = 'hoat_dong'
     ORDER BY gio_bat_dau ASC
     LIMIT 1`,
    [userId]
  );

  if (rows.length > 0) {
    return { hasShift: true, shiftInfo: rows[0] };
  }

  return { hasShift: false, shiftInfo: null };
}

export const requireActiveShift = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const roleId = Number(req.user?.vai_tro_id);

    if (!userId) {
      return next(new ForbiddenError('Vui lòng đăng nhập để thực hiện thao tác này.'));
    }

    const { hasShift } = await checkUserHasActiveShiftToday(userId, roleId);
    if (!hasShift) {
      return next(new ForbiddenError('Bạn không có ca trực phân công hôm nay để thực hiện thao tác này. Vui lòng liên hệ Quản lý để được xếp ca trực.'));
    }

    next();
  } catch (error) {
    next(error);
  }
};
