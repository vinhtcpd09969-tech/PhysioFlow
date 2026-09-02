import { ClipboardPlus } from 'lucide-react';
import { PLAN_STATUS_META } from '../../constants';
import type { TreatmentPlanStatus } from '../../types';

const TIER_STYLE: Record<string, { bg: string; color: string }> = {
  none: { bg: 'var(--rc-taupe-soft)', color: 'var(--rc-taupe)' },
  le: { bg: 'var(--rc-taupe-soft)', color: 'var(--rc-taupe)' },
  pending: { bg: 'var(--rc-amber-soft)', color: 'var(--rc-amber)' },
  progress: { bg: 'var(--rc-sage-soft)', color: 'var(--rc-sage)' },
  qua_han: { bg: 'var(--rc-clay-soft)', color: 'var(--rc-clay)' },
  done: { bg: 'var(--rc-moss)', color: 'var(--rc-fog)' },
  cancel: { bg: 'var(--rc-rust-soft)', color: 'var(--rc-rust)' }
};

// Trạng thái 1 liệu trình (phac_do_dieu_tri) dùng chung đúng bảng màu trên qua ánh xạ sang tier
// tương ứng — không rời rạc thêm 1 bộ hex mới.
const PLAN_STATUS_TO_TIER_STYLE: Record<string, string> = {
  dang_dieu_tri: 'progress',
  qua_han: 'qua_han',
  hoan_thanh: 'done',
  huy: 'cancel',
  cho_kich_hoat: 'pending',
  tam_dung: 'pending',
};

// Cột "Trạng thái" ở khối "Gói liệu trình" (tab "Hồ sơ điều trị") — 1 dòng = 1 gói.
export function PlanStatusPill({ status }: { status: TreatmentPlanStatus | string }) {
  const tierKey = (status && PLAN_STATUS_TO_TIER_STYLE[status]) || 'none';
  const style = TIER_STYLE[tierKey] || TIER_STYLE.none;
  const label = (status && PLAN_STATUS_META[status as TreatmentPlanStatus]?.label) || status || 'Khác';

  return (
    <span
      className="recovery-arc-scope inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      <span className="size-1.5 rounded-full shrink-0" style={{ background: 'currentColor' }} />
      {label}
    </span>
  );
}

export function RecordViewButton({ hasRecord, onClick }: { hasRecord?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Xem hồ sơ điều trị"
      className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer shadow-xs shrink-0 ${
        hasRecord
          ? 'bg-teal-50/80 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
          : 'bg-white text-slate-700 border-slate-200/80 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
      }`}
    >
      <ClipboardPlus size={13} className={hasRecord ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'} />
      <span>Hồ sơ</span>
    </button>
  );
}
