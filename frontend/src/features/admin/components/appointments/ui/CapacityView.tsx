import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { User, MapPin, ChevronRight, Calendar } from 'lucide-react';

interface CapacityViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  setViewMode: (view: 'timeline' | 'capacity') => void;
  appointments: any[];
  timeRange: 'today' | '7days' | 'month' | 'custom';
  activeType: 'kham' | 'dieu_tri';
}

export function CapacityView({
  selectedDate,
  setSelectedDate,
  setViewMode,
  appointments,
  timeRange,
  activeType
}: CapacityViewProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 7;


  // Reset page when timeRange changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeRange]);

  // Sinh danh sách ngày dựa trên khoảng thời gian
  const getDaysRange = () => {
    if (timeRange === 'today') {
      return [selectedDate];
    }
    if (timeRange === 'month') {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const totalDays = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      return Array.from({ length: totalDays }).map((_, i) => addDays(start, i));
    }
    // Mặc định hoặc 7 Ngày: Lấy 7 ngày trong tuần của selectedDate
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  };

  const days = getDaysRange();

  // Phân trang danh sách ngày
  const totalItems = days.length;
  const isPaginated = timeRange === 'month' && totalItems > pageSize;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDays = isPaginated ? days.slice(startIndex, endIndex) : days;

  // Tính toán dữ liệu tải của mỗi ngày
  const getDayCapacityDetails = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayApts = appointments.filter(apt => {
      const aptDate = new Date(apt.ngay_gio_bat_dau);
      return format(aptDate, 'yyyy-MM-dd') === dayStr;
    });

    const activeRooms = Array.from(new Set(dayApts.map(apt => apt.phong_id).filter(Boolean)));
    const activeDocs = Array.from(new Set(dayApts.map(apt => apt.bac_si_id).filter(Boolean)));

    const maxDailyCapacity = 20; // 20 slots max
    const percentage = Math.min(Math.round((dayApts.length / maxDailyCapacity) * 100), 100);

    // Xác định mức độ tải
    let loadLevel = 'Thấp';
    if (percentage >= 75) {
      loadLevel = 'Cao';
    } else if (percentage >= 35) {
      loadLevel = 'Trung bình';
    }

    return {
      count: dayApts.length,
      percentage,
      loadLevel,
      activeRoomsCount: activeRooms.length,
      activeDocsCount: activeDocs.length,
      activeDocsList: Array.from(new Set(activeDocs.map(id => {
        const aptWithDoc = dayApts.find(apt => apt.bac_si_id === id);
        if (aptWithDoc?.ten_ky_thuat_vien) {
          const fullName = aptWithDoc.ten_ky_thuat_vien;
          const prefix = activeType === 'kham' ? 'BS. ' : 'KTV. ';
          const parts = fullName.trim().split(' ');
          const lastName = parts[parts.length - 1];
          return `${prefix}${lastName}`;
        }
        if (aptWithDoc?.ten_bac_si) {
          const fullName = aptWithDoc.ten_bac_si;
          const prefix = activeType === 'kham' ? 'BS. ' : 'KTV. ';
          const parts = fullName.trim().split(' ');
          const lastName = parts[parts.length - 1];
          return `${prefix}${lastName}`;
        }
        const prefix = activeType === 'kham' ? 'BS. ' : 'KTV. ';
        if (id === 'doc_1' || id === '20000000-0000-0000-0000-000000000005') return `${prefix}Khoa`;
        if (id === 'doc_2' || id === '20000000-0000-0000-0000-000000000006') return `${prefix}Lan Anh`;
        if (id === 'doc_3' || id === '20000000-0000-0000-0000-000000000007') return `${prefix}Hưng`;
        if (id === 'doc_4' || id === '20000000-0000-0000-0000-000000000008') return `${prefix}Minh`;
        if (id === 'ktv_1' || id === '20000000-0000-0000-0000-000000000009') return `${prefix}Tuấn`;
        if (id === 'ktv_2' || id === '20000000-0000-0000-0000-000000000010') return `${prefix}Trang`;
        return `${prefix}Nhân viên`;
      })))
    };
  };

  const handleCardClick = (day: Date) => {
    setSelectedDate(day);
    setViewMode('timeline');
  };

  return (
    <div className="space-y-4">
      {/* Row List Container */}
      <div className="flex flex-col gap-3">
        {paginatedDays.map((day) => {
          const stats = getDayCapacityDetails(day);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const dayIdStr = day.toISOString();
          
          // Determine status color and text colors
          let colorClass = 'bg-emerald-500';
          let textColor = 'text-emerald-600 dark:text-emerald-400';
          let borderHover = 'hover:border-emerald-500/30';

          if (stats.percentage >= 75) {
            colorClass = 'bg-rose-500';
            textColor = 'text-rose-600 dark:text-rose-400';
            borderHover = 'hover:border-rose-500/30';
          } else if (stats.percentage >= 35) {
            colorClass = 'bg-amber-500';
            textColor = 'text-amber-600 dark:text-amber-400';
            borderHover = 'hover:border-amber-500/30';
          }

          return (
            <motion.div
              key={dayIdStr}
              whileHover={{ x: 4, scale: 1.005 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={() => handleCardClick(day)}
              className={`p-4 bg-white dark:bg-zinc-900 border rounded-2xl transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group relative overflow-hidden ${
                isSelected 
                  ? 'border-slate-800 dark:border-zinc-650 ring-2 ring-slate-800/5 dark:ring-zinc-700/5 shadow-md bg-slate-50/20 dark:bg-zinc-900/80'
                  : `border-slate-150/80 dark:border-zinc-800/80 shadow-sm ${borderHover}`
              }`}
            >
              {/* Highlight bar for selected card */}
              {isSelected && (
                <motion.div 
                  layoutId="activeHighlightBar"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 dark:bg-zinc-600" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Day / Date info Column */}
              <div className="flex items-center gap-3 w-44 shrink-0">
                <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                  isDayToday 
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900' 
                    : 'bg-slate-50 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400'
                }`}>
                  <Calendar size={18} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      isDayToday ? 'text-slate-900 dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-555'
                    }`}>
                      {format(day, 'EEEE', { locale: vi })}
                    </span>
                    {isDayToday && (
                      <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 font-extrabold px-1.5 py-0.5 rounded uppercase">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-150 mt-0.5">
                    {format(day, 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>

              {/* Load Progress Column */}
              <div className="flex-1 min-w-0 max-w-sm flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-500 dark:text-zinc-400">
                    {stats.count} {activeType === 'kham' ? 'ca khám đã đặt' : 'ca điều trị đã đặt'}
                  </span>
                  <span className={`${textColor} font-black font-mono`}>{stats.percentage}% lấp đầy</span>
                </div>
                
                {/* Progress bar container */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-850 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>

                {/* Subtext info */}
                <div className="flex items-center justify-between text-[9px] font-medium text-slate-400 dark:text-zinc-555">
                  <span>Sức chứa: 20 ca/ngày</span>
                  <div className="flex items-center gap-1">
                    <span className={`inline-block size-1.5 rounded-full ${colorClass}`} />
                    <span className="font-bold">Mức tải: {stats.loadLevel}</span>
                  </div>
                </div>
              </div>

              {/* Doctor/KTV On Duty Column */}
              <div className="w-52 shrink-0 flex flex-col justify-center">
                <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider block mb-1">
                  {activeType === 'kham' ? 'Bác sĩ trực' : 'Kỹ thuật viên trực'}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-zinc-350">
                  <User size={13} className="text-slate-400 shrink-0" />
                  <span>{stats.activeDocsCount} {activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên'}</span>
                </div>
                {stats.activeDocsList.length > 0 ? (
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-medium truncate max-w-[190px]">
                    {stats.activeDocsList.join(', ')}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 italic font-medium">
                    Chưa phân ca
                  </p>
                )}
              </div>

              {/* Room On Duty Column */}
              <div className="w-36 shrink-0 flex flex-col justify-center">
                <span className="text-[9px] text-slate-400 dark:text-zinc-555 font-bold uppercase tracking-wider block mb-1">
                  Phòng hoạt động
                </span>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-zinc-350">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span>{stats.activeRoomsCount} Phòng</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                  {stats.activeRoomsCount > 0 ? `Đang mở ${stats.activeRoomsCount} phòng` : 'Chưa có phòng mở'}
                </p>
              </div>

              {/* Chevron Arrow Column */}
              <div className="flex items-center justify-end shrink-0">
                <div className="size-8 rounded-full bg-slate-55/50 dark:bg-zinc-800/80 group-hover:bg-[#0D9488]/10 flex items-center justify-center text-slate-400 group-hover:text-[#0D9488] transition-all border border-slate-150/40 dark:border-zinc-700 shadow-sm">
                  <ChevronRight size={14} className="stroke-[3]" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {isPaginated && (
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-150/80 dark:border-zinc-800/80 p-3.5 rounded-2xl shadow-sm select-none">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Hiển thị <span className="font-extrabold text-slate-800 dark:text-zinc-200">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> trong số <span className="font-extrabold text-slate-800 dark:text-zinc-200">{totalItems}</span> ngày của tháng
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-750 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider rounded-xl border border-slate-200/50 dark:border-zinc-700 transition-all flex items-center gap-1 focus:outline-none"
            >
              Trang trước
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-350 px-2">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-750 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider rounded-xl border border-slate-200/50 dark:border-zinc-700 transition-all flex items-center gap-1 focus:outline-none"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
