import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface ServiceSelectProps {
  services: any[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export const ServiceSelect: React.FC<ServiceSelectProps> = ({
  services,
  value,
  onChange,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = services.find((s: any) => String(s.id) === String(value));

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 border rounded-xl text-sm text-left flex items-center justify-between gap-3 transition-all outline-none ${
          disabled
            ? 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
            : open
              ? 'bg-white dark:bg-zinc-900 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/15 cursor-pointer text-slate-800 dark:text-zinc-100'
              : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 cursor-pointer text-slate-800 dark:text-zinc-100'
        }`}
      >
        {selected ? (
          <span className="min-w-0 flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-zinc-100 truncate">{selected.ten_goi}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded shrink-0">
              {selected.thoi_luong_phut}p
            </span>
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 shrink-0">
              {formatCurrency(selected.don_gia)}
            </span>
          </span>
        ) : (
          <span className="font-semibold text-slate-400 dark:text-zinc-400">Vui lòng chọn dịch vụ...</span>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 dark:text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {services.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 text-center py-6">Không có dịch vụ phù hợp.</p>
          )}
          {services.map((svc: any) => {
            const isActive = String(svc.id) === String(value);
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => {
                  onChange(String(svc.id));
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 ring-1 ring-emerald-500/25 dark:ring-emerald-500/50' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/80'
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-xs font-black truncate ${isActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-zinc-100'}`}>
                    {svc.ten_goi}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      ⏳ {svc.thoi_luong_phut} phút
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(svc.don_gia)}
                    </span>
                  </div>
                </div>
                {isActive && <Check size={15} className="text-emerald-600 shrink-0 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
