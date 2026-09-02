import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

export interface CustomSelectOption {
  value: string | number;
  label: string;
  icon?: ReactNode | string;
  badge?: string;
  description?: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string | number;
  onChange: (val: any) => void;
  placeholder?: string;
  label?: string;
  align?: 'left' | 'right';
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  error?: boolean | string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  label,
  align = 'left',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  fullWidth = false,
  disabled = false,
  error
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (label || placeholder);
  const isSelected = selectedOption !== undefined && selectedOption.value !== '' && selectedOption.value !== 0 && selectedOption.value !== 'all' && selectedOption.value !== 'Tất cả';

  return (
    <div
      ref={containerRef}
      className={`relative ${isOpen ? 'z-50' : 'z-10'} ${fullWidth ? 'w-full' : 'inline-block'} text-left ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between gap-2.5 cursor-pointer border shadow-2xs outline-none focus:ring-4 ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'
            : error
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-400 text-slate-800 dark:text-zinc-100 ring-rose-500/15'
            : isOpen
            ? 'bg-white dark:bg-zinc-900 border-teal-500 text-slate-800 dark:text-zinc-100 ring-teal-500/15'
            : isSelected
            ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 text-teal-850 dark:text-teal-200'
            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
        } ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon && (
            <span className="text-sm leading-none shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 ${
              fullWidth ? 'w-full min-w-[200px]' : 'min-w-[220px] max-w-sm'
            } bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-slate-400/20 dark:shadow-none p-1.5 z-50 space-y-0.5 max-h-64 overflow-y-auto font-sans backdrop-blur-md ${menuClassName}`}
          >
            {options.map((opt) => {
              const isItemActive = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isItemActive
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    {opt.icon && <span className="text-sm shrink-0">{opt.icon}</span>}
                    <div className="truncate">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span
                          className={`text-[10px] font-normal block truncate ${
                            isItemActive ? 'text-teal-100' : 'text-slate-400 dark:text-zinc-500'
                          }`}
                        >
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {isItemActive && <CheckCircle2 size={14} className="text-white shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomSelect;
