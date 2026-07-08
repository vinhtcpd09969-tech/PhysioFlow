import { useState, useEffect, useMemo, useCallback } from 'react';
import { getSchedules, getStaff, getRooms, deleteSchedule } from '../../../api/admin.api';
import { Schedule, Staff, Room } from '../types';
import toast from 'react-hot-toast';

const removeDiacritics = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export function useSchedulesState() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonday, setSelectedMonday] = useState<Date>(() => getMonday(new Date()));
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [schedRes, staffRes, roomsRes] = await Promise.all([
        getSchedules(),
        getStaff(),
        getRooms()
      ]);
      setSchedules(schedRes.data || []);
      setStaff((staffRes.data || []).filter((s: any) => ['Kỹ thuật viên', 'Bác sĩ', 'Lễ tân'].includes(s.vai_tro) && s.trang_thai === 'hoat_dong'));
      setRooms(roomsRes.data || []);
    } catch (error) {
      console.error('Error fetching schedules data:', error);
      toast.error('Không thể tải dữ liệu lịch trực');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const weekDates = useMemo(() => {
    const dates: any[] = [];
    const dowKeys = ['thu_2', 'thu_3', 'thu_4', 'thu_5', 'thu_6', 'thu_7', 'chu_nhat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedMonday);
      d.setDate(selectedMonday.getDate() + i);
      dates.push({
        key: dowKeys[i],
        label: dowKeys[i] === 'chu_nhat' ? 'CN' : `T${i + 2}`,
        dateStr: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        isToday: d.toDateString() === today.toDateString(),
        fullDateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      });
    }
    return dates;
  }, [selectedMonday]);

  // Derived state calculations: groupedStaff, conflicts, stats
  const { groupedStaff, conflicts, stats } = useMemo(() => {
    // 1. Filter staff by role and search query with smart diacritic normalization
    let filtered = staff;
    if (roleFilter !== 'all') {
      filtered = staff.filter(s => s.vai_tro === roleFilter);
    }
    if (searchQuery.trim() !== '') {
      const q = removeDiacritics(searchQuery).toLowerCase().trim();
      filtered = filtered.filter(s => removeDiacritics(s.ho_ten).toLowerCase().includes(q));
    }

    // 2. Group by role
    const grouped: Record<string, Staff[]> = { 'Bác sĩ': [], 'Lễ tân': [], 'Kỹ thuật viên': [] };
    filtered.forEach(s => {
      if (grouped[s.vai_tro]) grouped[s.vai_tro].push(s);
    });

    // 3. Detect conflicts
    const conflictList: any[] = [];
    const staffSchedules: Record<string, Schedule[]> = {};
    schedules.forEach(s => {
      const key = `${s.nguoi_dung_id}-${s.ngay}`;
      if (!staffSchedules[key]) {
        staffSchedules[key] = [];
      }
      staffSchedules[key].push(s);
    });

    Object.values(staffSchedules).forEach(list => {
      if (list.length > 1) {
        const activeList = list.filter(s => s.trang_thai === 'hoat_dong');
        if (activeList.length > 1) {
          const first = activeList[0];
          const second = activeList[1];
          const staffMember = staff.find(st => String(st.id) === String(first.nguoi_dung_id));
          if (staffMember) {
            const dateObj = weekDates.find(d => d.fullDateStr === first.ngay);
            const dowLabel = dateObj ? dateObj.label : first.ngay;
            conflictList.push({
              id: first.nguoi_dung_id,
              name: staffMember.ho_ten,
              dowLabel,
              dateStr: first.ngay,
              time1: `${first.gio_bat_dau}-${first.gio_ket_thuc}`,
              time2: `${second.gio_bat_dau}-${second.gio_ket_thuc}`
            });
          }
        }
      }
    });

    // 4. Calculate Stats
    const getLocalVietnamDate = () => {
      const now = new Date();
      const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      return localTime.toISOString().split('T')[0];
    };
    const todayDateStr = getLocalVietnamDate();

    const activeToday = schedules.filter(s => s.ngay === todayDateStr && s.trang_thai === 'hoat_dong').length;
    
    // To only count coverage for the currently viewed week's schedules
    const currentWeekDates = weekDates.map(d => d.fullDateStr);
    
    // Filter to only count from today onwards (todayDateStr)
    const futureWeekDates = currentWeekDates.filter(dateStr => dateStr >= todayDateStr);

    const expectedShifts = Math.round(staff.length * 6 * (futureWeekDates.length / 7));
    const futureSchedules = schedules.filter(s => futureWeekDates.includes(s.ngay));
    const currentActiveShifts = futureSchedules.filter(s => s.trang_thai === 'hoat_dong').length;
    const coverage = expectedShifts > 0 ? Math.min(100, Math.round((currentActiveShifts / expectedShifts) * 100)) : 0;
    const emptyShifts = Math.max(0, expectedShifts - currentActiveShifts);

    return { 
      groupedStaff: grouped, 
      conflicts: conflictList,
      stats: { activeToday, emptyShifts, coverage }
    };
  }, [staff, schedules, roleFilter, weekDates, searchQuery]);

  const weeklyStatsByStaff = useMemo(() => {
    const currentWeekDates = weekDates.map(d => d.fullDateStr);
    const weeklySchedules = schedules.filter(s => currentWeekDates.includes(s.ngay));

    const statsMap: Record<string, { name: string; role: string; morning: number; afternoon: number; off: number }> = {};

    const filteredStaffForStats = searchQuery.trim() !== ''
      ? staff.filter(s => removeDiacritics(s.ho_ten).toLowerCase().includes(removeDiacritics(searchQuery).toLowerCase().trim()))
      : staff;

    filteredStaffForStats.forEach(s => {
      statsMap[s.id] = {
        name: s.ho_ten,
        role: s.vai_tro,
        morning: 0,
        afternoon: 0,
        off: 7
      };
    });

    weeklySchedules.forEach(s => {
      if (!statsMap[s.nguoi_dung_id]) return;
      if (s.trang_thai === 'hoat_dong') {
        const hour = parseInt(s.gio_bat_dau.split(':')[0]);
        if (hour >= 11) {
          statsMap[s.nguoi_dung_id].afternoon++;
        } else {
          statsMap[s.nguoi_dung_id].morning++;
        }
      }
    });

    // Post-process off days: Off = 7 - (S + C)
    Object.values(statsMap).forEach(st => {
      st.off = 7 - (st.morning + st.afternoon);
    });

    const groupedStats: Record<string, any[]> = { 'Bác sĩ': [], 'Lễ tân': [], 'Kỹ thuật viên': [] };
    Object.values(statsMap).forEach(st => {
      if (groupedStats[st.role]) {
        groupedStats[st.role].push(st);
      }
    });

    return groupedStats;
  }, [staff, schedules, weekDates, searchQuery]);

  const handleDeleteScheduleById = useCallback(async (id: string | number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ca trực này?')) {
      try {
        await deleteSchedule(String(id));
        toast.success('Xóa ca trực thành công!');
        await fetchData();
        return true;
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa');
        return false;
      }
    }
    return false;
  }, [fetchData]);

  return {
    schedules,
    staff,
    rooms,
    loading,
    selectedMonday,
    setSelectedMonday,
    roleFilter,
    setRoleFilter,
    weekDates,
    groupedStaff,
    conflicts,
    stats,
    weeklyStatsByStaff,
    handleDeleteScheduleById,
    fetchData,
    searchQuery,
    setSearchQuery
  };
}
