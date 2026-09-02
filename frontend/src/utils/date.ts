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
 * Format khoảng cách thời gian tới 1 mốc ISO thành nhãn tương đối (Hôm nay/Hôm qua/N ngày trước).
 * Dùng chung cho các cột "Lần cuối dùng dịch vụ" ở bảng danh sách khách hàng/bệnh nhân.
 */
export function formatDaysAgo(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Chưa từng sử dụng';
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}
