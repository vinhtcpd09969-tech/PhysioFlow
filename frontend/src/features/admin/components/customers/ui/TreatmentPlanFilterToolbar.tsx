import { Search, X } from 'lucide-react';
import { PLAN_STATUS_META } from '../constants';
import type { TreatmentPlanStatus } from '../types';

interface TreatmentPlanFilterToolbarProps {
  activeStatus: TreatmentPlanStatus | 'all';
  onStatusChange: (status: TreatmentPlanStatus | 'all') => void;
  counts: { dang_dieu_tri: number; qua_han: number; hoan_thanh: number; huy: number; tong: number };
  search: string;
  onSearchChange: (value: string) => void;
}

const CHIP_ORDER: (TreatmentPlanStatus | 'all')[] = ['all', 'dang_dieu_tri', 'qua_han', 'hoan_thanh', 'huy'];

function chipLabel(key: TreatmentPlanStatus | 'all') {
  return key === 'all' ? 'Tất cả' : PLAN_STATUS_META[key].label;
}

function chipCount(key: TreatmentPlanStatus | 'all', counts: TreatmentPlanFilterToolbarProps['counts']) {
  if (key === 'all') return counts.dang_dieu_tri + counts.qua_han + counts.hoan_thanh + counts.huy;
  return counts[key];
}

export function TreatmentPlanFilterToolbar({
  activeStatus,
  onStatusChange,
  counts,
  search,
  onSearchChange
}: TreatmentPlanFilterToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tên khách hàng, số điện thoại hoặc tên gói…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs h-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {CHIP_ORDER.map(key => {
          const isActive = activeStatus === key;
          const count = chipCount(key, counts);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onStatusChange(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer h-10 border ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span>{chipLabel(key)}</span>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
