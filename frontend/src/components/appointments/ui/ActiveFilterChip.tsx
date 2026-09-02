import { X } from 'lucide-react';

interface ActiveFilterChipProps {
  label: string;
  onClear: () => void;
}

/** Chip hiển thị 1 bộ lọc đang bật (nhân sự, trạng thái, ...) kèm nút xóa — tách ra dùng chung
 * cho cả 4 trang Lịch hẹn thay vì lặp lại cùng 1 khối JSX (nguồn gốc: filter nhân sự của Admin). */
export function ActiveFilterChip({ label, onClear }: ActiveFilterChipProps) {
  return (
    <div className="flex items-center justify-between bg-teal-550/10 dark:bg-teal-955/20 border border-teal-500/30 p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <div className="size-2 rounded-full bg-teal-500 animate-pulse" />
        <span className="text-xs font-black text-slate-800 dark:text-zinc-150 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <button
        onClick={onClear}
        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-rose-500 hover:text-rose-600 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-955/20 dark:hover:bg-rose-955/30 rounded-xl border border-rose-250/20 dark:border-rose-900/30 transition-all uppercase tracking-wider"
      >
        <X size={12} className="stroke-[3]" />
        <span>Hủy lọc</span>
      </button>
    </div>
  );
}

export default ActiveFilterChip;
