import { useState, useRef, useEffect } from 'react';
import { Users, Check } from 'lucide-react';
import { Staff } from '../../types';
import { resolveImageUrl } from '../../../../utils/imageUrl';

export function StaffSelectDropdown({
  value,
  options,
  staffList,
  onChange,
  roleLabel
}: {
  value: string | number | null;
  options: Array<{ id: string | number; name: string; avatarUrl?: string; avatar_url?: string }>;
  staffList: Staff[];
  onChange: (id: string | number | null) => void;
  roleLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const getStaffAvatar = (staffId: string | number, optionAvatar?: string) => {
    if (optionAvatar) return resolveImageUrl(optionAvatar);
    const found = staffList.find(s => String(s.id) === String(staffId)) as any;
    if (found) {
      const url = found.anh_dai_dien || found.avatar_url || found.avatarUrl;
      if (url) return resolveImageUrl(url);
    }
    return null;
  };

  const selectedOption = options.find(o => String(o.id) === String(value));
  const selectedAvatar = value ? getStaffAvatar(value, selectedOption?.avatarUrl || selectedOption?.avatar_url) : null;

  return (
    <div ref={wrapperRef} className="relative shrink-0 w-full lg:w-72 rounded-2xl border p-4 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100 truncate">
          LỌC THEO {roleLabel.toUpperCase()}
        </span>
        <span className="text-[9px] font-mono text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200/60 font-black shrink-0">
          {options.length} NHÂN SỰ
        </span>
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl hover:border-teal-500/50 transition-all cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {!value ? (
            <div className="size-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-[#0d9488] dark:text-teal-400 flex items-center justify-center shrink-0 font-bold border border-teal-200/50">
              <Users size={16} />
            </div>
          ) : selectedAvatar ? (
            <img
              src={selectedAvatar}
              alt={selectedOption?.name}
              className="size-8 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-zinc-700"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          ) : (
            <div className="size-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {(selectedOption?.name || 'N').trim().split(/\s+/).pop()?.[0] || 'N'}
            </div>
          )}

          <div className="min-w-0">
            <span className="block text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
              {value ? selectedOption?.name : `Tất cả ${roleLabel}`}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium truncate">
              {value ? 'Đang lọc theo nhân sự này' : 'Hiển thị toàn bộ ca hẹn'}
            </span>
          </div>
        </div>
        <div className="size-5 rounded-md flex items-center justify-center text-slate-400 group-hover:text-teal-600 shrink-0">
          <span className="text-[10px]">▼</span>
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-xl z-50 p-2 max-h-72 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(null); setIsOpen(false); }}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
              !value ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0d9488] font-black' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#0d9488] flex items-center justify-center font-bold text-xs">
                <Users size={14} />
              </div>
              <span className="text-xs font-bold">Tất cả {roleLabel}</span>
            </div>
            {!value && <Check size={14} className="text-[#0d9488]" />}
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

          <div className="space-y-1">
            {options.map((opt) => {
              const avatar = getStaffAvatar(opt.id, opt.avatarUrl || opt.avatar_url);
              const isSelected = String(value) === String(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onChange(opt.id); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    isSelected ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0d9488] font-black' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={opt.name}
                        className="size-7 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="size-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {opt.name.trim().split(/\s+/).pop()?.[0] || 'N'}
                      </div>
                    )}
                    <span className="text-xs font-bold truncate">{opt.name}</span>
                  </div>

                  {isSelected && <Check size={14} className="text-[#0d9488] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
