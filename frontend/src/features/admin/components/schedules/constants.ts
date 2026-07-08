import { WeekDate } from './types';

export const DOW_KEYS = ['thu_2', 'thu_3', 'thu_4', 'thu_5', 'thu_6', 'thu_7', 'chu_nhat'];

export const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getWeekDates = (selectedWeek: 'current' | 'next' | 'after_next'): WeekDate[] => {
  const dates: WeekDate[] = [];
  const current = new Date();
  const day = current.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);
  
  if (selectedWeek === 'next') {
    monday.setDate(monday.getDate() + 7);
  } else if (selectedWeek === 'after_next') {
    monday.setDate(monday.getDate() + 14);
  }
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push({
      key: DOW_KEYS[i],
      label: DOW_KEYS[i] === 'chu_nhat' ? 'CN' : `T${i + 2}`,
      dateStr: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      isToday: d.toDateString() === new Date().toDateString(),
      fullDateStr: formatLocalDate(d)
    });
  }
  return dates;
};

export const getAvatarInitials = (name: string): string => {
  if (!name) return 'NV';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};
