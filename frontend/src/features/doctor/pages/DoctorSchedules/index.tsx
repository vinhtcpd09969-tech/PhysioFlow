import { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar, AlertCircle, Sparkles, CheckCircle2, Moon } from 'lucide-react';
import { getDoctorSchedules, DoctorSchedule } from '../../api/doctor.api';

export default function DoctorSchedules() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hoat_dong' | 'tam_nghi'>('all');

  useEffect(() => {
    async function loadSchedules() {
      setLoading(true);
      try {
        const res = await getDoctorSchedules();
        setSchedules(res.data);
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
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  // Lọc lịch làm việc
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (filter === 'all') return true;
      return s.trang_thai === filter;
    });
  }, [schedules, filter]);

  // Kiểm tra ca trực có phải hôm nay không
  const isToday = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString('fr-CA'); // YYYY-MM-DD
    return dateStr.substring(0, 10) === todayStr;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-secondary dark:text-zinc-100 tracking-tight uppercase">Lịch trực cá nhân</h1>
          <p className="text-zinc-450 dark:text-zinc-550 text-[10px] font-bold uppercase mt-0.5">Quản lý thời gian biểu và ca làm việc</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm'
                : 'text-zinc-455 hover:text-secondary dark:hover:text-zinc-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('hoat_dong')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              filter === 'hoat_dong'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm'
                : 'text-zinc-455 hover:text-secondary dark:hover:text-zinc-200'
            }`}
          >
            Đang trực
          </button>
          <button
            onClick={() => setFilter('tam_nghi')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              filter === 'tam_nghi'
                ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-sm'
                : 'text-zinc-455 hover:text-secondary dark:hover:text-zinc-200'
            }`}
          >
            Lịch nghỉ
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-24 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải lịch trực...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-400 dark:text-zinc-550 flex flex-col items-center justify-center gap-3 shadow-sm">
          <AlertCircle size={32} className="text-zinc-300" />
          <p className="text-xs font-bold">Không tìm thấy lịch trực nào khớp với bộ lọc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((schedule) => {
            const current = isToday(schedule.ngay);
            const active = schedule.trang_thai === 'hoat_dong';
            
            return (
              <div 
                key={schedule.id} 
                className={`bg-white dark:bg-zinc-900 p-5 rounded-3xl border transition-all hover:shadow-md relative overflow-hidden flex items-center justify-between ${
                  current 
                    ? 'border-primary ring-2 ring-primary/10 shadow-[0_4px_20px_rgba(var(--color-primary),0.05)]' 
                    : 'border-zinc-100 dark:border-zinc-800'
                }`}
              >
                {/* Special indicator for today's duty */}
                {current && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1.5 shadow-sm">
                    <Sparkles size={8} fill="currentColor" />
                    Hôm nay
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    active 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50' 
                      : 'bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100/50'
                  }`}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wide">
                        {getDayOfWeek(schedule.ngay)}
                      </h4>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono font-bold">
                        {formatDate(schedule.ngay)}
                      </span>
                    </div>

                    <p className="text-[10px] font-extrabold text-zinc-555 dark:text-zinc-450 mt-1.5 flex items-center gap-1">
                      <Clock size={12} className="text-zinc-400" />
                      Ca trực: <span className="text-secondary dark:text-zinc-250 font-bold">{schedule.gio_bat_dau.substring(0, 5)} - {schedule.gio_ket_thuc.substring(0, 5)}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-4">
                  {active ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-955/15 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                      <CheckCircle2 size={10} />
                      Làm việc
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-955/15 text-rose-500 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30">
                      <Moon size={10} />
                      Tạm nghỉ
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
