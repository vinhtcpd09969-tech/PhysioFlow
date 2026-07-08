/**
 * Converts a date and time string (both in Vietnam local time) into a UTC ISO string.
 * Vietnam is in UTC+7 timezone.
 *
 * @param dateStr Format: "YYYY-MM-DD"
 * @param timeStr Format: "HH:mm" or "HH:mm:ss"
 * @returns ISO string in UTC representing the local time in Vietnam
 */
export function convertToVietnamUtcIso(dateStr: string, timeStr: string): string {
  const actualTime = timeStr.includes(' - ') ? timeStr.split(' - ')[0] : timeStr;
  const [year, month, day] = dateStr.split('-');
  const timeParts = actualTime.split(':');
  const hours = timeParts[0];
  const minutes = timeParts[1] || '00';

  const utcDate = new Date(Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hours, 10),
    parseInt(minutes, 10),
    0
  ));

  // Subtract 7 hours to get the actual UTC time (Vietnam is UTC+7)
  return new Date(utcDate.getTime() - 7 * 60 * 60 * 1000).toISOString();
}

/**
 * Format a local Date object to "YYYY-MM-DD" string.
 */
export const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns Vietnamese day label (T2..T7, CN) for a given Date.
 */
export const getVietnameseDay = (date: Date): string => {
  const day = date.getDay();
  if (day === 0) return 'CN';
  return `T${day + 1}`;
};

/**
 * Returns "Tháng MM, YYYY" string for calendar header.
 */
export const getMonthYearString = (date: Date): string => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `Tháng ${m}, ${y}`;
};

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isPast: boolean;
  isActive: boolean;
}

/**
 * Generate a standard 42-cell calendar grid (Mon–Sun) for a given month.
 * @param viewDate  The month to display
 * @param activeDates  Array of "YYYY-MM-DD" strings considered active/selectable
 */
export const generateMonthGrid = (viewDate: Date, activeDates: string[]): CalendarDay[] => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  let startOffset = firstDayOfMonth.getDay() - 1; // Mon=0 ... Sun=6
  if (startOffset < 0) startOffset = 6;

  const days: CalendarDay[] = [];
  const todayStr = formatLocalDate(new Date());

  const gridStartDate = new Date(firstDayOfMonth);
  gridStartDate.setDate(firstDayOfMonth.getDate() - startOffset);

  for (let i = 0; i < 42; i++) {
    const currentCellDate = new Date(gridStartDate);
    currentCellDate.setDate(gridStartDate.getDate() + i);

    const dateStr = formatLocalDate(currentCellDate);
    const isPast = dateStr < todayStr;
    const isActive = activeDates.includes(dateStr);

    days.push({
      date: currentCellDate,
      dateStr,
      isCurrentMonth: currentCellDate.getMonth() === month,
      isPast,
      isActive,
    });
  }

  return days;
};

/**
 * Generate a list of the next `count` days starting from today.
 */
export const generateAvailableDates = (count = 14): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const next = new Date();
    next.setDate(today.getDate() + i);
    dates.push(next);
  }
  return dates;
};
