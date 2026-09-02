import { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle2, Moon, Sparkles, RotateCcw, DoorOpen } from 'lucide-react';
import { getDoctorSchedules, DoctorSchedule } from '@/features/doctor/api/doctor.api';
import { CustomDatePicker } from '@/components/CustomDatePicker';

export default function StaffSchedules() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'hoat_dong' | 'tam_nghi'>('all');

  useEffect(() => {
    async function loadSchedules() {
      setLoading(true);
      try {
        const res = await getDoctorSchedules();
        setSchedules(res.data || []);
      } catch (error) {
        console.error('Lỗi khi tải lịch trực:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, []);

  // Chuyển chuỗi ngày sang Thứ tiếng Việt
  const getDayOfWeek = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDay();
      switch (day) {
        case 0: return 'Chủ Nhật';
        case 1: return 'Thứ Hai';
        case 2: return 'Thứ Ba';
        case 3: return 'Thứ Tư';
        case 4: return 'Thứ Năm';
        case 5: return 'Thứ Sáu';
        case 6: return 'Thứ Bảy';
        default: return '';
      }
    } catch {
      return '';
    }
  };

  // Định dạng ngày hiển thị dd/mm/yyyy
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const todayStr = useMemo(() => new Date().toLocaleDateString('fr-CA'), []); // YYYY-MM-DD

  const isToday = (dateStr: string) => {
    return dateStr.substring(0, 10) === todayStr;
  };

  // Ca trực hôm nay
  const todayShift = useMemo(() => {
    return schedules.find(s => isToday(s.ngay) && s.trang_thai === 'hoat_dong');
  }, [schedules, todayStr]);

  // Kiểm tra có đang áp dụng bộ lọc khoảng thời gian tùy chỉnh hay không
  const isCustomRange = Boolean(startDate || endDate);

  // Danh sách ca trực theo phạm vi thời gian (Khoảng ngày tùy chọn HOẶC Mặc định 10 ca từ hôm nay)
  const rangeSchedules = useMemo(() => {
    let list = [...schedules];

    if (isCustomRange) {
      if (startDate) {
        list = list.filter(s => s.ngay.substring(0, 10) >= startDate);
      }
      if (endDate) {
        list = list.filter(s => s.ngay.substring(0, 10) <= endDate);
      }
      list.sort((a, b) => new Date(a.ngay).getTime() - new Date(b.ngay).getTime());
    } else {
      // Mặc định: từ hôm nay trở đi trong tương lai, lấy tối đa 10 ca
      list = list
        .filter(s => s.ngay.substring(0, 10) >= todayStr)
        .sort((a, b) => new Date(a.ngay).getTime() - new Date(b.ngay).getTime())
        .slice(0, 10);
    }

    return list;
  }, [schedules, startDate, endDate, isCustomRange, todayStr]);

  // Thống kê tự động theo phạm vi thời gian đang hiển thị
  const dynamicStats = useMemo(() => {
    const total = rangeSchedules.length;
    const workCount = rangeSchedules.filter(s => s.trang_thai === 'hoat_dong').length;
    const offCount = rangeSchedules.filter(s => s.trang_thai === 'tam_nghi').length;
    return { total, workCount, offCount };
  }, [rangeSchedules]);

  // Danh sách sau khi lọc thêm theo Trạng thái (Đi làm / Nghỉ)
  const finalFilteredSchedules = useMemo(() => {
    if (statusFilter === 'all') return rangeSchedules;
    return rangeSchedules.filter(s => s.trang_thai === statusFilter);
  }, [rangeSchedules, statusFilter]);

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
  };

  return (
    <div className="w-full space-y-6 font-jakarta pb-12 animate-fade-in">

      {/* 1. Header Trang & Ca Trực Hôm Nay */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="size-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">Thời gian biểu chuyên môn</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-jakarta tracking-tight">
            LỊCH TRỰC CÁ NHÂN
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">
            {isCustomRange
              ? `Hiển thị ca trực từ ${startDate ? formatDate(startDate) : 'trước đây'} đến ${endDate ? formatDate(endDate) : 'tương lai'}`
              : 'Tự động hiển thị 10 ca trực tiếp theo từ hôm nay'}
          </p>
        </div>

        {/* Highlight ca trực hôm nay (nếu có) */}
        {todayShift && (
          <div className="flex items-center gap-2.5 bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow-sm text-xs font-black shrink-0">
            <Sparkles size={14} className="animate-pulse" />
            <span>
              Hôm nay: {todayShift.gio_bat_dau.substring(0, 5)} - {todayShift.gio_ket_thuc.substring(0, 5)}
              {todayShift.ten_phong ? ` • ${todayShift.ten_phong}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* 2. Toolbar Bố cục: Bộ lọc Ngày (Từ ngày -> Đến ngày) + Thống kê tự động + Lọc trạng thái */}
      <div className="bg-slate-50/70 dark:bg-zinc-900/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">

        {/* Nhóm 1: Chọn khoảng thời gian với CustomDatePicker tiếng Việt (dd/MM/yyyy) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 pl-3 pr-1 py-1 rounded-xl border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Từ:</span>
            <CustomDatePicker
              value={startDate}
              maxDate={endDate || undefined}
              placeholder="Chọn ngày bắt đầu"
              onChange={(val) => {
                setStartDate(val);
                if (endDate && val && endDate < val) {
                  setEndDate(val);
                }
              }}
              align="left"
              className="w-38"
              buttonClassName="bg-transparent border-0 hover:bg-slate-100/70 dark:hover:bg-zinc-700/60 px-2 py-1 shadow-none"
            />
          </div>

          <span className="text-slate-400 dark:text-zinc-600 font-bold text-xs">→</span>

          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 pl-3 pr-1 py-1 rounded-xl border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Đến:</span>
            <CustomDatePicker
              value={endDate}
              minDate={startDate || undefined}
              placeholder="Chọn ngày kết thúc"
              onChange={(val) => setEndDate(val)}
              align="left"
              className="w-38"
              buttonClassName="bg-transparent border-0 hover:bg-slate-100/70 dark:hover:bg-zinc-700/60 px-2 py-1 shadow-none"
            />
          </div>

          {isCustomRange && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Quay lại mặc định 10 ca sắp tới"
            >
              <RotateCcw size={12} />
              <span>10 ca sắp tới</span>
            </button>
          )}
        </div>

        {/* Nhóm 2: Thống kê tự động theo khoảng đã chọn & Lọc trạng thái */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Thống kê tự động */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs flex items-center gap-1.5">
              <span className="text-[10px] uppercase text-emerald-500 font-black">Đi làm:</span>
              <strong className="font-mono text-sm">{dynamicStats.workCount}</strong>
              <span className="text-[10px]">ca</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 font-bold text-rose-600 dark:text-rose-300 shadow-2xs flex items-center gap-1.5">
              <span className="text-[10px] uppercase text-rose-400 font-black">Nghỉ:</span>
              <strong className="font-mono text-sm">{dynamicStats.offCount}</strong>
              <span className="text-[10px]">ca</span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 font-bold text-slate-600 dark:text-zinc-400 shadow-2xs">
              <span className="text-[10px] uppercase text-slate-400 font-black mr-1">Tổng:</span>
              <strong className="font-mono text-sm text-slate-900 dark:text-white">{dynamicStats.total}</strong>
            </div>
          </div>

          {/* Lọc trạng thái */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('hoat_dong')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${statusFilter === 'hoat_dong'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
                }`}
            >
              Đi làm
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('tam_nghi')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${statusFilter === 'tam_nghi'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
                }`}
            >
              Nghỉ
            </button>
          </div>
        </div>
      </div>

      {/* 3. Danh sách Ca Trực */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
          <div className="size-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải lịch trực...</p>
        </div>
      ) : finalFilteredSchedules.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
          <AlertCircle size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">
            {isCustomRange
              ? 'Không tìm thấy ca trực nào trong khoảng thời gian đã chọn'
              : 'Hiện chưa có ca trực nào trong 10 ca tiếp theo'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {finalFilteredSchedules.map((schedule) => {
            const current = isToday(schedule.ngay);
            const active = schedule.trang_thai === 'hoat_dong';

            return (
              <div
                key={schedule.id}
                className={`p-4 rounded-2xl border transition-all hover:shadow-xs flex items-center justify-between gap-3 ${current
                    ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/60 ring-2 ring-teal-500/20'
                    : 'bg-white dark:bg-zinc-900 border-slate-200/70 dark:border-zinc-800'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${current
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : active
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900'
                        : 'bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-200/50'
                    }`}>
                    <Calendar size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight">
                        {getDayOfWeek(schedule.ngay)}
                      </h4>
                      <span className="text-[10.5px] text-slate-400 dark:text-zinc-500 font-mono font-medium">
                        {formatDate(schedule.ngay)}
                      </span>
                      {current && (
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-teal-600 text-white">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1">
                        <Clock size={11} className="text-teal-600" />
                        <span>{schedule.gio_bat_dau.substring(0, 5)} - {schedule.gio_ket_thuc.substring(0, 5)}</span>
                      </p>

                      {schedule.ten_phong && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60 shadow-2xs">
                          <DoorOpen size={10} className="text-teal-600 dark:text-teal-400" />
                          <span>{schedule.ten_phong}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {active ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                      <CheckCircle2 size={10} /> Đi làm
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 border border-rose-200/60">
                      <Moon size={10} /> Nghỉ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
