export const timeSlots = [
  '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export const fullDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Generate available date list for the next 14 days
export const generateAvailableDates = (): Date[] => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + i);
    dates.push(nextDate);
  }
  return dates;
};

// Mock consistent spots available based on date string
export const getMockAvailableSlots = (dateStr: string): number => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 5) + 3; // 3 to 7 spots remaining
};

export const MIN_BOOKING_BUFFER_MINUTES = 60; // 1 hour buffer to prevent last-minute bookings

export const isSlotInPast = (timeStr: string, selectedDate: string): boolean => {
  const todayStr = formatLocalDate(new Date());
  if (selectedDate !== todayStr) return false;
  const now = new Date();
  const [slotHour, slotMinute] = timeStr.split(':').map(Number);
  
  const slotTime = new Date(now);
  slotTime.setHours(slotHour, slotMinute, 0, 0);
  
  const diffMins = (slotTime.getTime() - now.getTime()) / (1000 * 60);
  return diffMins < MIN_BOOKING_BUFFER_MINUTES;
};

export const isSlotUrgent = (timeStr: string, selectedDate: string): boolean => {
  const todayStr = formatLocalDate(new Date());
  if (selectedDate !== todayStr || !timeStr) return false;
  const now = new Date();
  const [slotHour, slotMinute] = timeStr.split(':').map(Number);
  
  const slotTime = new Date(now);
  slotTime.setHours(slotHour, slotMinute, 0, 0);
  
  const diffMins = (slotTime.getTime() - now.getTime()) / (1000 * 60);
  return diffMins > 0 && diffMins <= 120; // urgent if starting within 2 hours
};

export const getVietnameseDay = (date: Date): string => {
  const day = date.getDay();
  if (day === 0) return 'CN';
  return `T${day + 1}`;
};

export const formatFullDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return fullDateFormatter.format(new Date(dateString));
  } catch (e) {
    return dateString;
  }
};
