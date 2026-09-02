// Định dạng tiền tệ/số điện thoại dùng chung — KHÔNG import từ frontend/src/shared/utils/ (bản mồ
// côi từ lần migrate FSD dở dang, xem CLAUDE.md mục "Nợ kỹ thuật đã biết").
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '0đ';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0đ';
  return `${num.toLocaleString('vi-VN')}đ`;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Đếm ngược tới 1 mốc thời gian, tự chọn đơn vị theo độ lớn còn lại (ngày+giờ / giờ+phút / phút /
 * giây) — trước đây luôn cố định "N ngày M giờ" nên hạn còn vài phút (vd cửa sổ kích hoạt rút ngắn
 * lúc test) hiện sai thành "Còn 0 ngày 0 giờ", vô nghĩa. Dùng chung cho mọi nơi đếm ngược hạn kích
 * hoạt (PatientEmrDetail.tsx, PackageStatusBadge.tsx) — sửa 1 chỗ, khỏi lệch công thức giữa các nơi.
 */
export function formatCountdown(deadline: string | Date): { text: string; urgent: boolean } {
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return { text: 'Đã hết hạn', urgent: true };
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (days >= 1) return { text: `Còn ${days} ngày ${hours} giờ`, urgent: false };
  if (hours >= 1) return { text: `Còn ${hours} giờ ${minutes} phút`, urgent: true };
  if (minutes >= 1) return { text: `Còn ${minutes} phút`, urgent: true };
  return { text: `Còn ${seconds} giây`, urgent: true };
}
