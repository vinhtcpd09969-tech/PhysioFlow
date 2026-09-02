import { useState, useRef, useEffect } from 'react';
import { Users, ShieldCheck, UserCheck, Activity, ChevronDown, Check } from 'lucide-react';

interface SchedulesHeaderProps {
  selectedMonday: Date;
  onMondayChange: (monday: Date) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'Tất cả vai trò', icon: Users },
  { value: 'Bác sĩ', label: 'Chuyên viên tư vấn', icon: ShieldCheck },
  { value: 'Lễ tân', label: 'Lễ tân', icon: UserCheck },
  { value: 'Kỹ thuật viên', label: 'Kỹ thuật viên', icon: Activity },
];

export function SchedulesHeader({
  selectedMonday,
  onMondayChange,
  roleFilter,
  onRoleFilterChange,
  searchQuery,
  onSearchQueryChange
}: SchedulesHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatWeekRange = (monday: Date) => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const pad = (n: number) => String(n).padStart(2, '0');
    
    const monStr = `${pad(monday.getDate())}/${pad(monday.getMonth() + 1)}`;
    const sunStr = `${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}/${sunday.getFullYear()}`;
    
    return `${monStr} – ${sunStr}`;
  };

  const getTodayMonday = () => {
    const current = new Date();
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(current.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  };

  const isCurrentWeek = selectedMonday.toDateString() === getTodayMonday().toDateString();

  const handlePrevWeek = () => {
    const d = new Date(selectedMonday);
    d.setDate(d.getDate() - 7);
    onMondayChange(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedMonday);
    d.setDate(d.getDate() + 7);
    onMondayChange(d);
  };

  const handleJumpToCurrent = () => {
    onMondayChange(getTodayMonday());
  };

  const selectedOption = ROLE_OPTIONS.find((opt) => opt.value === roleFilter) || ROLE_OPTIONS[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 select-none font-jakarta">
      <div className="flex flex-col text-left">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
          Bảng phân ca làm việc
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Search Staff Name */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            placeholder="Tìm theo tên nhân sự..."
            className="bg-white border border-gray-200 text-xs font-semibold rounded-xl pl-8 pr-4 py-2.5 text-gray-700 outline-none focus:border-teal-500 shadow-xs w-52 placeholder-gray-400"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>

        {/* Dynamic Calendar Week Selector */}
        <div className="flex bg-white rounded-xl shadow-xs border border-slate-200 p-1 items-center">
          <button 
            type="button"
            onClick={handlePrevWeek} 
            className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors focus:outline-none cursor-pointer"
            title="Tuần trước"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="px-3 text-xs font-black text-slate-850 text-center min-w-[210px] select-none capitalize flex items-center justify-center gap-2">
            {isCurrentWeek && (
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
            )}
            <span>Tuần: {formatWeekRange(selectedMonday)}</span>
            
            <button 
              type="button"
              onClick={handleJumpToCurrent} 
              title={isCurrentWeek ? 'Đang ở tuần hiện tại' : 'Bấm để quay về tuần hiện tại'}
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-all ${
                isCurrentWeek 
                  ? 'bg-[#0d9488]/10 text-[#0d9488] border-teal-500/20 shadow-xs' 
                  : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900 cursor-pointer'
              }`}
            >
              {isCurrentWeek ? 'Tuần này' : 'Về tuần này'}
            </button>
          </div>

          <button 
            type="button"
            onClick={handleNextWeek} 
            className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors focus:outline-none cursor-pointer"
            title="Tuần sau"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Custom Premium Role Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-teal-500 text-xs font-black uppercase tracking-wider rounded-xl px-4 py-2.5 text-slate-800 dark:text-zinc-100 outline-none shadow-xs flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <SelectedIcon size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">{selectedOption.label}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = roleFilter === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onRoleFilterChange(opt.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-955/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1 rounded-lg ${isSelected ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                        <Icon size={14} />
                      </div>
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-teal-600 dark:text-teal-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default SchedulesHeader;

