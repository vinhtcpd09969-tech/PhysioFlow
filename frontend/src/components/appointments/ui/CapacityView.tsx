import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { User, MapPin, ChevronRight, Calendar, Search } from 'lucide-react';
import { statusConfig } from '../appointmentStatusConfig';
import { getSmartSearchScore } from '../../../utils/smartSearch';

interface CapacityViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  setViewMode: (view: 'timeline' | 'capacity') => void;
  appointments: any[];
  timeRange?: 'today' | '7days' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  activeType: 'kham' | 'dieu_tri';
  searchTerm?: string;
  onSelectAppointment?: (aptId: string) => void;
  activeStatusLabel?: string | null;
  selectedStaffFilter?: string | null;
  staffList?: any[];
  onOpenWalkInModal?: () => void;
}

const removeAccents = (str: string) => {
  const combiningMarks = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  return (str || '').normalize('NFD').replace(combiningMarks, '').toLowerCase();
};

export function CapacityView({
  selectedDate,
  setSelectedDate,
  setViewMode,
  appointments,
  timeRange,
  startDate,
  endDate,
  activeType,
  searchTerm = '',
  onSelectAppointment,
  activeStatusLabel = null,
  selectedStaffFilter = null,
  staffList = []
}: CapacityViewProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 7;

  // Reset page when range or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [timeRange, startDate, endDate, searchTerm, activeStatusLabel, selectedStaffFilter]);

  // Sinh danh sách ngày dựa trên khoảng thời gian
  const getDaysRange = () => {
    if (startDate && endDate) {
      const daysArr: Date[] = [];
      let curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      while (curr <= end) {
        daysArr.push(new Date(curr));
        curr = addDays(curr, 1);
      }
      return daysArr;
    }
    if (timeRange === 'today') {
      return [selectedDate];
    }
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  };

  const days = getDaysRange();

  // Phân trang danh sách ngày (Tự động phân trang 7 ngày/trang nếu tổng số ngày > 7)
  const totalItems = days.length;
  const isPaginated = totalItems > pageSize;
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

    // Tách các ca hợp lệ (chiếm công suất/thực tế phục vụ) và ca đã hủy / vắng mặt
    const activeApts = dayApts.filter(apt => apt.trang_thai !== 'da_huy' && apt.trang_thai !== 'khong_den');
    const cancelledCount = dayApts.filter(apt => apt.trang_thai === 'da_huy').length;
    const noShowCount = dayApts.filter(apt => apt.trang_thai === 'khong_den').length;

    const activeRooms = Array.from(new Set(activeApts.map(apt => apt.phong_id).filter(Boolean)));
    const activeDocs = Array.from(new Set(activeApts.map(apt => apt.bac_si_id || apt.nhan_su_id).filter(Boolean)));

    const maxDailyCapacity = 20; // 20 slots max
    // Tỉ lệ lấp đầy tính theo số ca thực tế hoạt động
    const percentage = Math.min(Math.round((activeApts.length / maxDailyCapacity) * 100), 100);

    // Xác định mức độ tải dựa trên tải thực tế
    let loadLevel = 'Thấp';
    if (percentage >= 75) {
      loadLevel = 'Cao';
    } else if (percentage >= 35) {
      loadLevel = 'Trung bình';
    }

    return {
      totalCount: dayApts.length,
      activeCount: activeApts.length,
      cancelledCount,
      noShowCount,
      percentage,
      loadLevel,
      activeRoomsCount: activeRooms.length,
      activeDocsCount: activeDocs.length,
      activeDocsList: Array.from(new Set(activeDocs.map(id => {
        const staffObj = staffList?.find(s => s.id === id || s.nhan_su_id === id);
        const aptWithDoc = activeApts.find(apt => apt.bac_si_id === id || apt.nhan_su_id === id || apt.ky_thuat_vien_id === id);
        const fullName = staffObj?.ho_ten || staffObj?.ten || aptWithDoc?.ten_ky_thuat_vien || aptWithDoc?.ten_bac_si || aptWithDoc?.ten_nhan_su || aptWithDoc?.ho_ten_nhan_su;
        const prefix = activeType === 'kham' ? 'CV. ' : 'KTV. ';
        if (fullName) {
          const parts = fullName.trim().split(' ');
          const lastName = parts[parts.length - 1];
          return `${prefix}${lastName}`;
        }
        return `${prefix}Nhân viên`;
      })))
    };
  };

  const handleCardClick = (day: Date) => {
    setSelectedDate(day);
    setViewMode('timeline');
  };

  // Tìm kiếm xuyên suốt toàn bộ khoảng thời gian đang tải (không giới hạn theo tuần/tháng đang xem).
  // Khi có lọc theo trạng thái (activeStatusLabel) — appointments truyền vào đã lọc sẵn ở trang
  // cha — cũng chuyển sang hiện danh sách phẳng này thay vì thẻ gộp theo ngày, vì gộp theo ngày
  // không cho thấy rõ kết quả lọc còn lại là những ca nào.
  const cleanSearch = removeAccents(searchTerm.trim());
  const hasActiveFilter = !!cleanSearch || !!activeStatusLabel || !!selectedStaffFilter;

  let resultsList = appointments.slice();
  // Lọc theo bác sĩ/KTV hoặc theo trạng thái phải tôn trọng đúng khoảng ngày đang xem (giống cách
  // các thẻ theo ngày bên dưới đã làm) — appointments truyền vào từ trang cha chỉ mới lọc theo
  // loại/trạng thái/nhân sự, CHƯA lọc theo ngày. Riêng tìm kiếm tự do theo tên/mã/SĐT (không kèm lọc
  // nhân sự/trạng thái nào khác) vẫn cố tình tìm xuyên suốt toàn bộ dữ liệu đã tải, để không bỏ lỡ
  // khách nằm ngoài khung ngày đang hiển thị.
  if ((selectedStaffFilter || activeStatusLabel) && startDate && endDate) {
    const startBound = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endBound = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    resultsList = resultsList.filter(apt => {
      const aptDate = new Date(apt.ngay_gio_bat_dau || '');
      return aptDate >= startBound && aptDate <= endBound;
    });
  }
  if (cleanSearch) {
    resultsList = resultsList
      .map(apt => {
        const nameScore = getSmartSearchScore(apt.ten_khach_hang || '', searchTerm);
        const codeScore = (apt.ma_lich_dat || '').toLowerCase().includes(cleanSearch) ? 80 : 0;
        const phoneScore = (apt.so_dien_thoai || '').includes(searchTerm.trim()) ? 80 : 0;
        const score = Math.max(nameScore, codeScore, phoneScore);
        return { apt, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.apt);
  }
  if (!cleanSearch) {
    resultsList = resultsList.sort((a, b) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());
  }
  // Giới hạn 30 chỉ áp dụng khi đang gõ tìm kiếm (tránh danh sách quá dài khi gõ nhầm 1 ký tự) —
  // lọc theo trạng thái thì hiện đủ, vì mục đích là để duyệt hết kết quả.
  if (cleanSearch) {
    resultsList = resultsList.slice(0, 30);
  }

  const resultsPageSize = 8;
  const resultsTotalItems = resultsList.length;
  const resultsTotalPages = Math.ceil(resultsTotalItems / resultsPageSize);
  const resultsStartIndex = (currentPage - 1) * resultsPageSize;
  const resultsEndIndex = resultsStartIndex + resultsPageSize;
  const paginatedResults = resultsList.slice(resultsStartIndex, resultsEndIndex);

  if (hasActiveFilter) {
    const selectedStaff = selectedStaffFilter && staffList
      ? staffList.find(s => String(s.id) === String(selectedStaffFilter))
      : null;
    const staffName = selectedStaff
      ? `${activeType === 'kham' ? 'CV.' : 'KTV.'} ${selectedStaff.ho_ten}`
      : 'chuyên gia';

    const headerText = cleanSearch && activeStatusLabel
      ? `${resultsList.length} lịch hẹn khớp "${searchTerm.trim()}" trong nhóm ${activeStatusLabel}`
      : cleanSearch
        ? (resultsList.length > 0 ? `Tìm thấy ${resultsList.length} lịch hẹn khớp "${searchTerm.trim()}"` : `Không tìm thấy lịch hẹn nào khớp "${searchTerm.trim()}"`)
        : activeStatusLabel
          ? (resultsList.length > 0 ? `${resultsList.length} lịch hẹn thuộc nhóm ${activeStatusLabel}` : `Không có lịch hẹn nào thuộc nhóm ${activeStatusLabel} trong khoảng đang xem`)
          : (resultsList.length > 0 ? `Tìm thấy ${resultsList.length} lịch hẹn của ${staffName}` : `Không có lịch hẹn nào của ${staffName} trong khoảng đang xem`);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 px-1">
          <Search size={13} />
          <span>{headerText}</span>
        </div>

        {paginatedResults.map((apt) => {
          const aptDate = new Date(apt.ngay_gio_bat_dau || '');
          return (
            <motion.div
              key={apt.id}
              whileHover={{ x: 4, scale: 1.005 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={() => onSelectAppointment && onSelectAppointment(String(apt.id))}
              className="p-4 bg-white dark:bg-zinc-900 border border-slate-150/80 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:border-[#0D9488]/30 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400 shrink-0">
                  <Calendar size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-zinc-150 truncate">{apt.ten_khach_hang}</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                    {format(aptDate, 'eeee, dd/MM/yyyy', { locale: vi })} · {format(aptDate, 'HH:mm')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {(() => {
                  const status = statusConfig[apt.trang_thai] || { label: apt.trang_thai, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${status.color}`}>
                      {status.icon}
                      <span>{status.label}</span>
                    </span>
                  );
                })()}
                <span className="font-mono text-[10px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800/50">
                  {apt.ma_lich_dat}
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">{apt.so_dien_thoai}</span>
                <div className="size-8 rounded-full bg-slate-55/50 dark:bg-zinc-800/80 flex items-center justify-center text-slate-400 shrink-0">
                  <ChevronRight size={14} className="stroke-[3]" />
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Results Pagination Controls */}
        {resultsTotalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-150/80 dark:border-zinc-800/80 p-3.5 rounded-2xl shadow-sm select-none mt-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Hiển thị <span className="font-extrabold text-slate-800 dark:text-zinc-200">{resultsStartIndex + 1}-{Math.min(resultsEndIndex, resultsTotalItems)}</span> trong số <span className="font-extrabold text-slate-800 dark:text-zinc-200">{resultsTotalItems}</span> lịch hẹn
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
                Trang {currentPage} / {resultsTotalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === resultsTotalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, resultsTotalPages))}
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-700 dark:text-zinc-200">
                      {stats.activeCount} {activeType === 'kham' ? 'ca lượng giá' : 'ca điều trị'}
                    </span>
                    {(stats.cancelledCount > 0 || stats.noShowCount > 0) && (
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500">
                        ({[
                          stats.cancelledCount > 0 ? `${stats.cancelledCount} hủy` : '',
                          stats.noShowCount > 0 ? `${stats.noShowCount} vắng` : ''
                        ].filter(Boolean).join(', ')})
                      </span>
                    )}
                  </div>
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
                  {activeType === 'kham' ? 'Chuyên viên trực' : 'Kỹ thuật viên trực'}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-zinc-350">
                  <User size={13} className="text-slate-400 shrink-0" />
                  <span>{stats.activeDocsCount} {activeType === 'kham' ? 'Chuyên viên' : 'Kỹ thuật viên'}</span>
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
