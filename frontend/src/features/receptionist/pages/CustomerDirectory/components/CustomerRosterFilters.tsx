import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Check } from 'lucide-react';

interface CustomerRosterFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  canLienHe: boolean;
  onToggleCanLienHe: () => void;
  staleDays: number;
  onStaleDaysChange: (value: number) => void;
}

const STALE_OPTIONS = [
  { value: 3, label: '≥ 3 ngày' },
  { value: 5, label: '≥ 5 ngày' },
  { value: 7, label: '≥ 7 ngày' },
  { value: 14, label: '≥ 14 ngày' },
  { value: 30, label: '≥ 30 ngày' },
];

function CustomStaleDaysDropdown({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = STALE_OPTIONS.find((o) => o.value === value) || STALE_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block font-jakarta">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all border shadow-xs cursor-pointer ${
          disabled
            ? 'bg-slate-50 border-slate-200/60 text-slate-300 opacity-50 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-teal-500 text-teal-700 ring-2 ring-teal-500/10 shadow-md'
            : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
        title="Ngưỡng ngày cho nhóm 'lâu chưa quay lại'"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-1.5 z-50 animate-fade-in font-jakarta">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2.5 py-1 mb-0.5">
            Ngưỡng chưa tới
          </div>
          {STALE_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-black'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="text-teal-600 dark:text-teal-400 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CustomerRosterFilters({
  searchInput,
  onSearchChange,
  canLienHe,
  onToggleCanLienHe,
  staleDays,
  onStaleDaysChange,
}: CustomerRosterFiltersProps) {
  return (
    <div className="relative z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[24px] shadow-xl shadow-slate-200/30 dark:shadow-none p-4 lg:p-5 font-jakarta">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại, mã khách hàng…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-xs font-extrabold rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleCanLienHe}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border cursor-pointer ${
              canLienHe
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bell size={13} />
            Cần liên hệ
          </button>

          <CustomStaleDaysDropdown
            value={staleDays}
            onChange={onStaleDaysChange}
            disabled={!canLienHe}
          />
        </div>
      </div>
    </div>
  );
}
