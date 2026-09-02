import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, ChevronDown, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  variant?: 'emerald' | 'subtle' | 'neutral' | 'teal';
  label?: string;
  showPresets?: boolean;
}

export function CustomDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'dd/mm/yyyy',
  className = '',
  buttonClassName = '',
  align = 'right',
  variant = 'neutral',
  showPresets = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const yearsListRef = useRef<HTMLDivElement>(null);

  const currentDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value + 'T00:00:00');
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [navDate, setNavDate] = useState(currentDate);

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setNavDate(d);
      }
    }
  }, [value]);

  // When opening, reset view mode to days
  useEffect(() => {
    if (isOpen) {
      setViewMode('days');
    }
  }, [isOpen]);

  const year = navDate.getFullYear();
  const month = navDate.getMonth();

  const currentYear = new Date().getFullYear();
  const minYear = minDate ? new Date(minDate + 'T00:00:00').getFullYear() : 1930;
  const maxYear = maxDate ? new Date(maxDate + 'T23:59:59').getFullYear() : currentYear + 5;

  const yearsList = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Auto scroll to current year when switching to years mode
  useEffect(() => {
    if (viewMode === 'years' && yearsListRef.current) {
      const selectedYearElem = yearsListRef.current.querySelector('[data-selected="true"]');
      if (selectedYearElem) {
        selectedYearElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [viewMode]);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayIndex = useMemo(() => {
    const day = new Date(year, month, 1).getDay();
    // Monday as first day of week: 0 -> 6 (CN), 1 -> 0 (T2)...
    return day === 0 ? 6 : day - 1;
  }, [year, month]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNavDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNavDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum: number) => {
    const selectedDate = new Date(year, month, dayNum);
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleMonthSelect = (mIdx: number) => {
    setNavDate(new Date(year, mIdx, 1));
    setViewMode('days');
  };

  const handleYearSelect = (yVal: number) => {
    setNavDate(new Date(yVal, month, 1));
    setViewMode('days');
  };

  const handleSelectToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const formattedValue = useMemo(() => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  }, [value]);

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [firstDayIndex, daysInMonth]);

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen]);

  const minDateTime = useMemo(() => {
    if (!minDate) return null;
    return new Date(minDate + 'T00:00:00').getTime();
  }, [minDate]);

  const maxDateTime = useMemo(() => {
    if (!maxDate) return null;
    return new Date(maxDate + 'T23:59:59').getTime();
  }, [maxDate]);

  const todayStr = useMemo(() => new Date().toLocaleDateString('fr-CA'), []);

  return (
    <div ref={wrapperRef} className={`relative font-jakarta text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all w-full cursor-pointer border ${
          isOpen
            ? 'border-teal-500 ring-2 ring-teal-500/20 bg-white dark:bg-zinc-800'
            : variant === 'teal' || variant === 'emerald'
            ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/30 hover:bg-teal-100/60 font-black'
            : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 text-slate-800 dark:text-zinc-100'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
          <span
            className={`text-xs ${
              formattedValue
                ? 'text-slate-900 dark:text-zinc-100 font-bold font-mono tracking-wide'
                : 'text-slate-400 dark:text-zinc-500 font-medium'
            }`}
          >
            {formattedValue || placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 dark:text-zinc-400 transform transition-transform shrink-0 ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`}
        />
      </button>

      {/* Calendar Popup */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xl shadow-slate-900/15 rounded-[24px] p-4 w-[310px] sm:w-[320px] max-w-[calc(100vw-32px)] z-[99999] text-slate-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl`}
        >
          {/* Header Navigation */}
          <div className="flex justify-between items-center mb-3">
            {viewMode === 'days' ? (
              <>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="size-8 rounded-xl bg-slate-50 hover:bg-teal-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200/60 dark:border-zinc-700 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
                  title="Tháng trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Switchers for Month & Year */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('months')}
                    className="px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-teal-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-800 dark:text-zinc-100 hover:text-teal-700 font-extrabold text-xs border border-slate-200/60 dark:border-zinc-700/60 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{monthNames[month]}</span>
                    <ChevronDown size={11} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('years')}
                    className="px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-teal-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-800 dark:text-zinc-100 hover:text-teal-700 font-black text-xs font-mono border border-slate-200/60 dark:border-zinc-700/60 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{year}</span>
                    <ChevronDown size={11} className="text-slate-400" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="size-8 rounded-xl bg-slate-50 hover:bg-teal-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200/60 dark:border-zinc-700 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
                  title="Tháng sau"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="font-extrabold text-xs text-slate-700 dark:text-zinc-200 uppercase tracking-wider pl-1">
                  {viewMode === 'months' ? `Chọn Tháng (${year})` : 'Chọn Năm'}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode('days')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[11px] transition-all cursor-pointer"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>

          {/* VIEW: MONTHS */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {monthNames.map((mName, mIdx) => {
                const isCurrentMonth = mIdx === month;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => handleMonthSelect(mIdx)}
                    className={`py-2.5 px-1 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isCurrentMonth
                        ? 'bg-teal-600 text-white font-black shadow-md shadow-teal-600/30 scale-105'
                        : 'bg-slate-50 hover:bg-teal-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 hover:text-teal-700 font-semibold'
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW: YEARS */}
          {viewMode === 'years' && (
            <div
              ref={yearsListRef}
              className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 py-2 custom-scrollbar"
            >
              {yearsList.map((yVal) => {
                const isCurrentYear = yVal === year;
                return (
                  <button
                    key={yVal}
                    type="button"
                    data-selected={isCurrentYear ? 'true' : 'false'}
                    onClick={() => handleYearSelect(yVal)}
                    className={`py-2 px-1 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                      isCurrentYear
                        ? 'bg-teal-600 text-white font-black shadow-md shadow-teal-600/30 scale-105'
                        : 'bg-slate-50 hover:bg-teal-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 hover:text-teal-700 font-semibold'
                    }`}
                  >
                    {yVal}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW: DAYS */}
          {viewMode === 'days' && (
            <>
              {/* Presets (Hôm nay) */}
              {showPresets && (
                <div className="flex items-center gap-1.5 mb-2.5">
                  <button
                    type="button"
                    onClick={handleSelectToday}
                    className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Hôm nay
                  </button>
                </div>
              )}

              {/* Thứ trong tuần */}
              <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 py-1 bg-slate-50/80 dark:bg-zinc-800/50 rounded-xl">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span className="text-rose-500">CN</span>
              </div>

              {/* Lưới ngày */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {calendarCells.map((cell, idx) => {
                  if (cell === null) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const cellDate = new Date(year, month, cell);
                  const cellTime = cellDate.getTime();
                  const isPast = minDateTime ? cellTime < minDateTime : false;
                  const isFuture = maxDateTime ? cellTime > maxDateTime : false;
                  const isDisabled = isPast || isFuture;

                  const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell).padStart(2, '0')}`;
                  const isCurrentDay = cellDateStr === todayStr;
                  const isSelected = value === cellDateStr;

                  return (
                    <button
                      key={`day-${cell}`}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleDaySelect(cell)}
                      className={`aspect-square w-full rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                        isDisabled
                          ? 'text-slate-300 dark:text-zinc-700 cursor-not-allowed opacity-25'
                          : isSelected
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 font-black ring-2 ring-teal-500/20 scale-105 z-10'
                          : isCurrentDay
                          ? 'border-2 border-teal-500 text-teal-600 dark:text-teal-400 font-black bg-teal-50/60 dark:bg-teal-950/40'
                          : 'hover:bg-teal-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer active:scale-95'
                      }`}
                    >
                      {cell}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer Xóa */}
          {value && (
            <div className="flex items-center justify-end border-t border-slate-100 dark:border-zinc-800/80 pt-2.5 mt-2.5 text-[11px] font-black">
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[10.5px]"
              >
                <X size={12} /> Bỏ chọn ngày
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomDatePicker;
