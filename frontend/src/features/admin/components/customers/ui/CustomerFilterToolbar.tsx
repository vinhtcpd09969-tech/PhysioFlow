import { Search, Lock, X } from 'lucide-react';

interface CustomerFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  showLockedOnly: boolean;
  onToggleLockedOnly: () => void;
}

export function CustomerFilterToolbar({
  search, onSearchChange, showLockedOnly, onToggleLockedOnly
}: CustomerFilterToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tên, số điện thoại, email hoặc mã khách hàng…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs h-10"
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

      {/* Locked Accounts Toggle Button */}
      <button
        type="button"
        onClick={onToggleLockedOnly}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-xs h-10 ${
          showLockedOnly
            ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/10'
            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <Lock size={14} className={showLockedOnly ? 'text-rose-600' : 'text-slate-400'} />
        <span>Tài khoản bị khóa</span>
        {showLockedOnly && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggleLockedOnly();
            }}
            title="Bỏ lọc tài khoản bị khóa"
            className="ml-0.5 size-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center transition-all cursor-pointer hover:bg-rose-300"
          >
            <X size={10} className="stroke-[3]" />
          </span>
        )}
      </button>
    </div>
  );
}
