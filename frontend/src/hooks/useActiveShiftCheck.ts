import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';
import { useAuthStore } from '../stores/authStore';

export function useActiveShiftCheck() {
  const user = useAuthStore((state) => state.user);
  const [hasShiftToday, setHasShiftToday] = useState<boolean>(true);
  const [shiftInfo, setShiftInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const roleId = Number(user?.vai_tro_id);
  const isSuperUser = roleId === 5 || roleId === 6; // Manager & Admin always have full permissions

  const checkShift = useCallback(async () => {
    if (!user || isSuperUser) {
      setHasShiftToday(true);
      setShiftInfo(null);
      return;
    }

    // Only staff roles (2: Receptionist, 3: Technician, 4: Specialist) need shift checks
    if (![2, 3, 4].includes(roleId)) {
      setHasShiftToday(true);
      setShiftInfo(null);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get('/auth/my-shift-today');
      setHasShiftToday(!!res.data?.hasShiftToday);
      setShiftInfo(res.data?.shiftInfo || null);
    } catch (err) {
      console.warn('Lỗi kiểm tra ca trực hôm nay:', err);
      // Giữ true nếu lỗi mạng để không làm sập giao diện
      setHasShiftToday(true);
    } finally {
      setLoading(false);
    }
  }, [user, roleId, isSuperUser]);

  useEffect(() => {
    checkShift();
  }, [checkShift]);

  return {
    hasShiftToday: isSuperUser ? true : hasShiftToday,
    shiftInfo,
    loading,
    isSuperUser,
    refetch: checkShift
  };
}
