import { Check, Minus, X, Clock3 } from 'lucide-react';
import { resolveImageUrl } from '@/utils/imageUrl';

// Trạng thái buổi/phác đồ: map trực tiếp enum thật của cuoc_hen.trang_thai / phac_do_dieu_tri.trang_thai,
// không phỏng đoán theo "có tồn tại record hay không". Dùng chung cho cả trang Hồ sơ điều trị và bàn khám.
export const SESSION_STATUS_META: Record<string, { label: string; ring: string; text: string; dot: string; Icon: typeof Check }> = {
  hoan_thanh: { label: 'Hoàn thành', ring: 'border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', Icon: Check },
  khong_den: { label: 'Không đến', ring: 'border-slate-300 dark:border-slate-600', text: 'text-slate-400 dark:text-slate-500', dot: 'bg-slate-400', Icon: Minus },
  khach_khong_den: { label: 'Không đến', ring: 'border-slate-300 dark:border-slate-600', text: 'text-slate-400 dark:text-slate-500', dot: 'bg-slate-400', Icon: Minus },
  khach_khong_den_phat: { label: 'Không đến', ring: 'border-slate-300 dark:border-slate-600', text: 'text-slate-400 dark:text-slate-500', dot: 'bg-slate-400', Icon: Minus },
  da_huy: { label: 'Đã hủy', ring: 'border-rose-400', text: 'text-rose-500 dark:text-rose-400', dot: 'bg-rose-500', Icon: X },
  huy: { label: 'Đã hủy', ring: 'border-rose-400', text: 'text-rose-500 dark:text-rose-400', dot: 'bg-rose-500', Icon: X },
  da_huy_phat: { label: 'Đã hủy', ring: 'border-rose-400', text: 'text-rose-500 dark:text-rose-400', dot: 'bg-rose-500', Icon: X },
};
export const DEFAULT_SESSION_STATUS = { label: 'Chưa diễn ra', ring: 'border-dashed border-slate-300 dark:border-slate-700', text: 'text-slate-400 dark:text-slate-550', dot: 'bg-slate-300', Icon: Clock3 };
export const getSessionStatusMeta = (trangThai: string) => SESSION_STATUS_META[trangThai] || DEFAULT_SESSION_STATUS;

/** Avatar nhân sự bọc vòng màu trạng thái + icon nhỏ đè góc — "nhân vật hóa" timeline thay vì badge chữ. */
export function StaffAvatar({ name, avatarUrl, size = 40, statusMeta }: {
  name?: string | null; avatarUrl?: string | null; size?: number; statusMeta?: { ring: string; dot: string; Icon: typeof Check };
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`w-full h-full rounded-full border-2 ${statusMeta?.ring || 'border-slate-200 dark:border-slate-700'} overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary font-black`}
        style={{ fontSize: size * 0.38 }}
      >
        {avatarUrl ? (
          <img src={resolveImageUrl(avatarUrl)} alt={name || ''} className="w-full h-full object-cover" />
        ) : initial}
      </div>
      {statusMeta && (
        <div className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full ${statusMeta.dot} flex items-center justify-center ring-2 ring-white dark:ring-slate-900`}>
          <statusMeta.Icon size={9} className="text-white stroke-[3]" />
        </div>
      )}
    </div>
  );
}
