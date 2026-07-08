interface SchedulesHeaderProps {
  selectedMonday: Date;
  onMondayChange: (monday: Date) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
}

export function SchedulesHeader({
  selectedMonday,
  onMondayChange,
  roleFilter,
  onRoleFilterChange,
  searchQuery,
  onSearchQueryChange
}: SchedulesHeaderProps) {
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

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 select-none">
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
            className="bg-white border border-gray-200 text-xs font-semibold rounded-xl pl-8 pr-4 py-2 text-gray-700 outline-none focus:border-teal-500 shadow-sm w-48 placeholder-gray-400"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>

        {/* Dynamic Calendar Week Selector */}
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 items-center">
          <button 
            type="button"
            onClick={handlePrevWeek} 
            className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors focus:outline-none"
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
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-all ${
                isCurrentWeek 
                  ? 'bg-[#0d9488]/10 text-[#0d9488] border-teal-500/20 shadow-sm' 
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
              }`}
            >
              Tuần này
            </button>
          </div>

          <button 
            type="button"
            onClick={handleNextWeek} 
            className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors focus:outline-none"
            title="Tuần sau"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <select 
          value={roleFilter} 
          onChange={e => onRoleFilterChange(e.target.value)} 
          className="bg-white border border-gray-200 text-xs font-black uppercase tracking-wider rounded-xl px-4 py-2 text-gray-700 outline-none focus:border-teal-500 shadow-sm"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="Bác sĩ">Bác sĩ</option>
          <option value="Lễ tân">Lễ tân</option>
          <option value="Kỹ thuật viên">Kỹ thuật viên</option>
        </select>
      </div>
    </div>
  );
}
export default SchedulesHeader;
