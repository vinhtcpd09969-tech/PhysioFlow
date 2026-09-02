import type { CurrentPackageInfo } from '../types';
import { formatCountdown } from '@/utils/format';
import { TREATMENT_PLAN_STATUS_META } from '@/constants/statusMeta';

export function PackageStatusBadge({ goi }: { goi: CurrentPackageInfo | null }) {
  if (!goi) {
    return <span className="text-xs text-slate-400 font-bold italic">Chưa có liệu trình</span>;
  }
  const meta = TREATMENT_PLAN_STATUS_META[goi.trang_thai] || { label: goi.trang_thai, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  const countdown = goi.trang_thai === 'cho_kich_hoat' && goi.han_kich_hoat ? formatCountdown(goi.han_kich_hoat) : null;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${meta.cls}`}>
        {meta.label}
      </span>
      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-snug break-words">
        {goi.ten_goi}
      </span>
      {goi.trang_thai === 'dang_dieu_tri' && typeof goi.so_buoi_da_dung === 'number' && (
        <span className="text-[11px] font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-800 w-fit mt-0.5">
          Buổi {goi.so_buoi_da_dung} / {goi.tong_so_buoi}
        </span>
      )}
      {countdown && (
        <span className={`text-[10px] font-bold ${countdown.urgent ? 'text-rose-600' : 'text-amber-700'}`}>
          ⏱ {countdown.text}
        </span>
      )}
    </div>
  );
}
