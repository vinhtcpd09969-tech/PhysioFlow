import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Search, Stethoscope, Zap, Calendar as CalendarIcon, RotateCcw, ArrowRight, BarChart3 } from 'lucide-react';
import { format, isSameDay, addDays, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';

export type RangePreset = 'today' | '7days' | 'month' | 'custom';

interface AppointmentsFilterBarProps {
  startDate: Date;
  endDate: Date;
  onSelectDateRange: (start: Date, end: Date, preset?: RangePreset) => void;
  handleNavigateRange: (direction: 'next' | 'prev' | 'today') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'timeline' | 'capacity';
  activeType: 'kham' | 'dieu_tri';
  onToggleType: () => void;
  canToggleType?: boolean;
  setViewMode?: (mode: 'timeline' | 'capacity') => void;
  onOpenWalkInModal?: () => void;
  embedded?: boolean;
  appointments?: any[];
}

export function AppointmentsFilterBar({
  startDate,
  endDate,
  onSelectDateRange,
  handleNavigateRange,
  searchTerm,
  setSearchTerm,
  viewMode: _viewMode,
  activeType,
  onToggleType,
  canToggleType = false,
  setViewMode: _setViewMode,
  onOpenWalkInModal,
  embedded = false,
  appointments = []
}: AppointmentsFilterBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerNavDate, setPickerNavDate] = useState<Date>(startDate || new Date());
  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cập nhật nav date và temp range khi props thay đổi hoặc khi mở pop-up
  useEffect(() => {
    setPickerNavDate(startDate || new Date());
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate, isPickerOpen]);

  // Đóng pop-up khi click ngoài hoặc ấn Esc
  useEffect(() => {
    if (!isPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isPickerOpen]);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Tính lưới ô lịch hiển thị trong Pop-up
  const calendarGrid = useMemo(() => {
    const year = pickerNavDate.getFullYear();
    const month = pickerNavDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let dayOfWeek = firstDayOfMonth.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < dayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [pickerNavDate]);

  // Xử lý chọn ngày trên Pop-up Lịch (Range Selection)
  const handleDateClick = (date: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // Chọn mốc bắt đầu mới
      setTempStart(date);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (date < tempStart) {
        setTempStart(date);
        setTempEnd(null);
      } else {
        setTempEnd(date);
        // Tự động áp dụng khoảng ngày vừa chọn
        onSelectDateRange(tempStart, date, 'custom');
        setIsPickerOpen(false);
      }
    }
  };

  // Xác định khoảng thời gian hiện tại khớp với Preset nào
  const currentPreset = useMemo<RangePreset>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(0, 0, 0, 0);

    if (isSameDay(s, e) && isSameDay(s, today)) {
      return 'today';
    }

    const next7DaysEnd = addDays(today, 6);
    if (isSameDay(s, today) && isSameDay(e, next7DaysEnd)) {
      return '7days';
    }

    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    if (isSameDay(s, monthStart) && isSameDay(e, monthEnd)) {
      return 'month';
    }

    return 'custom';
  }, [startDate, endDate]);

  // Số ngày trong khoảng lọc
  const totalDaysCount = useMemo(() => {
    const s = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const e = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const handleApplyPreset = (preset: 'today' | '7days' | 'month') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset === 'today') {
      onSelectDateRange(today, today, 'today');
    } else if (preset === '7days') {
      onSelectDateRange(today, addDays(today, 6), '7days');
    } else if (preset === 'month') {
      onSelectDateRange(startOfMonth(today), endOfMonth(today), 'month');
    }
    setIsPickerOpen(false);
  };

  // Theo dõi mốc thời gian xem lần cuối của từng Tab trong localStorage
  const [lastViewKham, setLastViewKham] = useState<string>(() => {
    return localStorage.getItem('officecare_last_view_kham') || new Date(0).toISOString();
  });
  const [lastViewDieuTri, setLastViewDieuTri] = useState<string>(() => {
    return localStorage.getItem('officecare_last_view_dieu_tri') || new Date(0).toISOString();
  });

  // Tự động cập nhật mốc thời gian của tab hiện tại khi người dùng đang xem
  useEffect(() => {
    const nowIso = new Date().toISOString();
    if (activeType === 'kham') {
      localStorage.setItem('officecare_last_view_kham', nowIso);
      setLastViewKham(nowIso);
    } else {
      localStorage.setItem('officecare_last_view_dieu_tri', nowIso);
      setLastViewDieuTri(nowIso);
    }
  }, [activeType]);

  // Tính số lượng ca chờ check-in và số ca mới phát sinh từ mốc xem lần cuối
  const { khamPendingCount, dieuTriPendingCount, khamNewCount, dieuTriNewCount } = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) {
      return { khamPendingCount: 0, dieuTriPendingCount: 0, khamNewCount: 0, dieuTriNewCount: 0 };
    }

    let khamPending = 0;
    let dieuTriPending = 0;
    let khamNew = 0;
    let dieuTriNew = 0;

    const khamViewTime = new Date(lastViewKham).getTime();
    const dieuTriViewTime = new Date(lastViewDieuTri).getTime();

    appointments.forEach((apt) => {
      const status = String(apt.trang_thai || '').toLowerCase();
      const isPending = status === 'da_xac_nhan' || status === 'chua_den';
      if (!isPending) return;

      const loai = String(apt.loai || '').toLowerCase();
      const loaiDichVu = String(apt.loai_dich_vu || '').toLowerCase();
      const loaiLich = String(apt.loai_lich || '').toLowerCase();

      const isKham = loai === 'kham' || loai === 'kham_moi' || loaiDichVu === 'kham' || loaiLich === 'kham_moi' || loaiLich === 'kham';
      const isDieuTri = loai === 'dieu_tri' || loai === 'dich_vu_le' || loai === 'dich_vu_don' || loaiDichVu === 'dieu_tri' || loaiLich === 'dieu_tri' || loaiLich === 'dich_vu_don' || loaiLich === 'tai_kham';

      const createdAtTime = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : (apt.created_at ? new Date(apt.created_at).getTime() : 0);

      if (isKham) {
        khamPending++;
        if (createdAtTime > khamViewTime) {
          khamNew++;
        }
      } else if (isDieuTri) {
        dieuTriPending++;
        if (createdAtTime > dieuTriViewTime) {
          dieuTriNew++;
        }
      }
    });

    return {
      khamPendingCount: khamPending,
      dieuTriPendingCount: dieuTriPending,
      khamNewCount: khamNew,
      dieuTriNewCount: dieuTriNew
    };
  }, [appointments, lastViewKham, lastViewDieuTri]);

  return (
    <div className={`relative transition-all duration-300 ${
      embedded
        ? 'space-y-4'
        : 'bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-150 dark:border-zinc-800/80 p-4 lg:p-5 space-y-4'
    }`}>
      {/* 2 NÚT TAB TỔ BỐ MỖI NÚT 50% CHIỀU RỘNG MÀN HÌNH (BẤM CHUYỂN CỰC SƯỚNG) */}
      {canToggleType && (
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl border border-slate-200/50 dark:border-zinc-700/80 select-none">
          <button
            type="button"
            onClick={() => {
              if (activeType !== 'kham') {
                const nowIso = new Date().toISOString();
                localStorage.setItem('officecare_last_view_kham', nowIso);
                setLastViewKham(nowIso);
                onToggleType();
              }
            }}
            className={`relative w-full py-3 px-4 text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex flex-wrap items-center justify-center gap-2 active:scale-[0.99] cursor-pointer ${
              activeType === 'kham'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25 border border-teal-500/30'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200/60 bg-white/60 dark:bg-zinc-800/60 border border-slate-200/40 dark:border-zinc-700/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Stethoscope size={18} className="shrink-0" />
              <span>LỊCH LƯỢNG GIÁ CHỨC NĂNG</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Badge số lượng ca chờ check-in */}
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${
                activeType === 'kham'
                  ? 'bg-white/20 text-white border border-white/30 backdrop-blur-xs'
                  : 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60'
              }`}>
                {khamPendingCount} chờ check-in
              </span>

              {/* Badge thông báo ca mới (+N mới) với hiệu ứng Pulse nhấp nháy nổi bật khi ở tab đối diện */}
              {khamNewCount > 0 && activeType !== 'kham' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase bg-rose-500 text-white rounded-full shadow-sm shadow-rose-500/40 animate-pulse border border-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  +{khamNewCount} mới
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeType !== 'dieu_tri') {
                const nowIso = new Date().toISOString();
                localStorage.setItem('officecare_last_view_dieu_tri', nowIso);
                setLastViewDieuTri(nowIso);
                onToggleType();
              }
            }}
            className={`relative w-full py-3 px-4 text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex flex-wrap items-center justify-center gap-2 active:scale-[0.99] cursor-pointer ${
              activeType === 'dieu_tri'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 border border-amber-500/30'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200/60 bg-white/60 dark:bg-zinc-800/60 border border-slate-200/40 dark:border-zinc-700/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap size={18} className="shrink-0" />
              <span>LỊCH ĐIỀU TRỊ VẬT LÝ</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Badge số lượng ca chờ check-in */}
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${
                activeType === 'dieu_tri'
                  ? 'bg-white/20 text-white border border-white/30 backdrop-blur-xs'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
              }`}>
                {dieuTriPendingCount} chờ check-in
              </span>

              {/* Badge thông báo ca mới (+N mới) với hiệu ứng Pulse nhấp nháy nổi bật khi ở tab đối diện */}
              {dieuTriNewCount > 0 && activeType !== 'dieu_tri' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase bg-rose-500 text-white rounded-full shadow-sm shadow-rose-500/40 animate-pulse border border-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  +{dieuTriNewCount} mới
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* HÀNG ĐIỀU KHIỂN BÊN DƯỚI DỌN THEO ĐÚNG THỨ TỰ: Quay lại -> Search -> Đặt lịch mới -> Ô chọn ngày */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Nhóm trái: Quay lại & Ô Tìm kiếm */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap flex-1 min-w-0">
          {_viewMode === 'timeline' ? (
            <button
              type="button"
              onClick={() => {
                if (_setViewMode) _setViewMode('capacity');
                handleApplyPreset('7days');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 hover:bg-[#0D9488]/15 rounded-xl border border-[#0D9488]/20 transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105"
              title="Xem Bảng công suất 7 ngày"
            >
              <BarChart3 size={15} />
              <span>Xem Bảng Công Suất 7 Ngày</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (_setViewMode) _setViewMode('timeline');
                handleApplyPreset('today');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105"
              title="Quay lại xem Hàng đợi Hôm nay"
            >
              <ChevronLeft size={15} className="stroke-[3]" />
              <span>Quay lại Hàng Đợi</span>
            </button>
          )}

          {/* Ô Tìm Kiếm Khách Hàng */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search / Tìm tên khách hàng, mã..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder-slate-400 dark:placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Nhóm phải: Nút Đặt Lịch Mới + Ô Chọn Ngày */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {_viewMode === 'timeline' && onOpenWalkInModal && (
            <button
              type="button"
              onClick={onOpenWalkInModal}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-600/25 shrink-0"
            >
              <span className="text-base font-bold">+</span>
              <span>ĐẶT LỊCH MỚI</span>
            </button>
          )}

          {/* Ô chọn ngày */}
          <div ref={popoverRef} className="relative">
            <div className={`flex items-center justify-between bg-slate-50 dark:bg-zinc-850/60 border rounded-xl p-1 shrink-0 transition-all ${
              currentPreset !== 'custom'
                ? 'border-teal-500/40 dark:border-teal-500/30 ring-2 ring-teal-500/5 dark:ring-teal-500/2 shadow-[0_0_15px_rgba(20,184,166,0.08)] bg-teal-50/5 dark:bg-teal-955/2' 
                : 'border-slate-200/80 dark:border-zinc-800'
            }`}>
              <button 
                type="button"
                onClick={() => handleNavigateRange('prev')} 
                title="Lùi khoảng ngày"
                className="p-2 hover:bg-white dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-300 rounded-lg transition-all focus:outline-none hover:shadow-sm cursor-pointer"
              >
                <ChevronLeft size={15} className="stroke-[2.5]" />
              </button>
              
              {/* Nút bấm mở Lịch chọn khoảng ngày Pop-up */}
              <button
                type="button"
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                title="Nhấn để mở Pop-up lịch chọn khoảng ngày tùy chỉnh"
                className="group px-2.5 py-1.5 hover:bg-white dark:hover:bg-zinc-800 text-xs font-black text-slate-800 dark:text-zinc-150 text-center min-w-[180px] sm:min-w-[200px] select-none capitalize flex items-center justify-center gap-1.5 rounded-lg transition-all border border-transparent hover:border-slate-200/80 dark:hover:border-zinc-700 hover:shadow-xs cursor-pointer"
              >
                <CalendarIcon size={14} className="text-[#0d9488] dark:text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
                
                {currentPreset !== 'custom' && (
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                )}

                {_viewMode === 'timeline' || totalDaysCount === 1 ? (
                  <span className="capitalize font-bold">Ngày: {format(startDate, 'eeee, dd/MM/yyyy', { locale: vi })}</span>
                ) : (
                  <span>{format(startDate, 'dd/MM')} ➔ {format(endDate, 'dd/MM/yyyy')} ({totalDaysCount} ngày)</span>
                )}

                <span className="text-[9px] font-black uppercase text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-500/20">
                  {_viewMode === 'timeline'
                    ? (isSameDay(startDate, new Date()) ? 'Hôm nay' : format(startDate, 'dd/MM'))
                    : (currentPreset === 'today' ? 'Hôm nay' : currentPreset === '7days' ? '7 ngày' : currentPreset === 'month' ? 'Tháng này' : 'Tùy chỉnh')}
                </span>

                <ChevronDown size={13} className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${isPickerOpen ? 'rotate-180 text-teal-600' : 'group-hover:text-slate-600'}`} />
              </button>
              
              <button 
                type="button"
                onClick={() => handleNavigateRange('next')} 
                title="Tiến khoảng ngày"
                className="p-2 hover:bg-white dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-300 rounded-lg transition-all focus:outline-none hover:shadow-sm cursor-pointer"
              >
                <ChevronRight size={15} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Pop-up Date Range Picker Modal Card */}
            {isPickerOpen && (
              <div className="absolute top-full right-0 mt-2.5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-3xl p-4 sm:p-5 w-80 sm:w-84 z-[99999] text-slate-800 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header Navigation */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0d9488] dark:text-teal-400 flex items-center justify-center font-bold">
                      <CalendarIcon size={14} />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 font-jakarta">
                      {monthNames[pickerNavDate.getMonth()]} {pickerNavDate.getFullYear()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPickerNavDate(subMonths(pickerNavDate, 1))}
                      className="size-7 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 font-bold transition-all cursor-pointer"
                      title="Tháng trước"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        setPickerNavDate(today);
                        handleApplyPreset('7days');
                      }}
                      className="px-2 py-1 bg-teal-50 dark:bg-teal-950/40 text-[#0d9488] dark:text-teal-400 hover:bg-teal-100 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1"
                      title="Về 7 ngày tới"
                    >
                      <RotateCcw size={10} />
                      <span>7 Ngày</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerNavDate(addMonths(pickerNavDate, 1))}
                      className="size-7 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 font-bold transition-all cursor-pointer"
                      title="Tháng sau"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                  <span className="text-rose-500">CN</span>
                </div>

                {/* Calendar grid with Range Selection */}
                <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                  {calendarGrid.map((dayItem, idx) => {
                    if (!dayItem) return <div key={`empty-${idx}`} />;

                    const dayTime = dayItem.getTime();
                    const startRangeTime = tempStart ? new Date(tempStart.getFullYear(), tempStart.getMonth(), tempStart.getDate()).getTime() : null;
                    const endRangeTime = tempEnd ? new Date(tempEnd.getFullYear(), tempEnd.getMonth(), tempEnd.getDate()).getTime() : null;

                    const isStart = startRangeTime !== null && dayTime === startRangeTime;
                    const isEnd = endRangeTime !== null && dayTime === endRangeTime;
                    const isInRange = startRangeTime !== null && endRangeTime !== null && dayTime > startRangeTime && dayTime < endRangeTime;
                    const isToday = isSameDay(dayItem, new Date());

                    return (
                      <button
                        key={dayItem.toISOString()}
                        type="button"
                        onClick={() => handleDateClick(dayItem)}
                        className={`h-9 w-full text-xs font-black flex items-center justify-center relative transition-all cursor-pointer ${
                          isStart && isEnd
                            ? 'bg-gradient-to-br from-[#0d9488] to-teal-600 text-white rounded-xl shadow-md shadow-teal-500/25 ring-2 ring-teal-500/30 z-10'
                            : isStart
                            ? 'bg-[#0d9488] text-white rounded-l-xl z-10 font-bold'
                            : isEnd
                            ? 'bg-[#0d9488] text-white rounded-r-xl z-10 font-bold'
                            : isInRange
                            ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-extrabold'
                            : isToday
                            ? 'bg-teal-50/50 dark:bg-teal-950/20 text-[#0d9488] border border-teal-500/30 hover:bg-teal-100 rounded-xl'
                            : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl'
                        }`}
                      >
                        <span>{dayItem.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Status selection footer */}
                <div className="mt-3 pt-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                  {tempStart && !tempEnd ? (
                    <span className="text-slate-700 dark:text-zinc-200 text-[11px] font-medium flex items-center gap-1">
                      <span>Bạn đã chọn <strong className="text-[#0d9488] dark:text-teal-400 font-black">{format(tempStart, 'dd/MM/yyyy')}</strong> ➔ chọn ngày kết thúc</span>
                    </span>
                  ) : tempStart && tempEnd ? (
                    <span className="text-slate-700 dark:text-zinc-200 font-bold flex items-center gap-1">
                      <span>{format(tempStart, 'dd/MM')}</span>
                      <ArrowRight size={11} className="text-teal-600" />
                      <span>{format(tempEnd, 'dd/MM/yyyy')}</span>
                    </span>
                  ) : (
                    <span>Chọn 2 ngày để khoanh vùng</span>
                  )}

                  {tempStart && tempEnd && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDateRange(tempStart, tempEnd, 'custom');
                        setIsPickerOpen(false);
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-[#0d9488] to-teal-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-sm hover:from-[#0b7a70] hover:to-teal-700 cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  )}
                </div>

                {/* Quick Presets Bar inside Popover */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase font-black tracking-wider">Lối tắt:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('today')}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-700 dark:text-zinc-300 hover:text-[#0d9488] rounded-lg transition-all cursor-pointer"
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('7days')}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-700 dark:text-zinc-300 hover:text-[#0d9488] rounded-lg transition-all cursor-pointer"
                    >
                      7 ngày tới
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('month')}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-700 dark:text-zinc-300 hover:text-[#0d9488] rounded-lg transition-all cursor-pointer"
                    >
                      Tháng này
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
