import { Users, Calendar, AlertTriangle, Building2 } from 'lucide-react';

interface Stats {
  activeToday: number;
  emptyShifts: number;
  coverage: number;
}

interface SchedulesKpisProps {
  stats: Stats;
  totalSchedules?: number;
  conflictCount?: number;
  totalRooms?: number;
}

export function SchedulesKpis({ 
  stats, 
  totalSchedules = 0, 
  conflictCount = 0, 
  totalRooms = 0 
}: SchedulesKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* 1. Trực ca hôm nay */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm border border-teal-500/20 flex items-center justify-between transition-all hover:shadow-md">
        <div className="space-y-1 text-left">
          <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider">Nhân sự trực hôm nay</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-heading font-black">{stats.activeToday}</h3>
            <span className="text-xs font-bold text-teal-200">người</span>
          </div>
          <p className="text-[10px] text-teal-100/80 font-medium">Đã sẵn sàng tại phòng trực</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20">
          <Users size={24} />
        </div>
      </div>

      {/* 2. Tổng ca đã xếp tuần này */}
      <div className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between transition-all hover:shadow-md">
        <div className="space-y-1 text-left">
          <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Tổng ca xếp tuần này</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-heading font-black text-slate-800 dark:text-zinc-100">{totalSchedules}</h3>
            <span className="text-xs font-bold text-slate-450 dark:text-zinc-400">ca làm</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <span>● Đang vận hành ổn định</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/30">
          <Calendar size={22} />
        </div>
      </div>

      {/* 3. Cảnh báo xung đột */}
      <div className={`rounded-2xl p-5 shadow-xs border transition-all hover:shadow-md flex items-center justify-between ${
        conflictCount > 0 
          ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
          : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-zinc-100'
      }`}>
        <div className="space-y-1 text-left">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${conflictCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            Cảnh báo trùng ca
          </p>
          <div className="flex items-baseline gap-1.5">
            <h3 className={`text-2xl font-heading font-black ${conflictCount > 0 ? 'text-rose-700' : 'text-slate-800 dark:text-zinc-100'}`}>
              {conflictCount}
            </h3>
            <span className={`text-xs font-bold ${conflictCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>trường hợp</span>
          </div>
          <p className={`text-[10px] font-semibold ${conflictCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {conflictCount > 0 ? '⚠️ Cần điều chỉnh ngay' : '✓ Không có xung đột'}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
          conflictCount > 0 
            ? 'bg-rose-100 text-rose-600 border-rose-200' 
            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
        }`}>
          <AlertTriangle size={22} />
        </div>
      </div>

      {/* 4. Phòng chuyên khoa */}
      <div className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between transition-all hover:shadow-md">
        <div className="space-y-1 text-left">
          <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Phòng trực sẵn sàng</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-heading font-black text-slate-800 dark:text-zinc-100">{totalRooms}</h3>
            <span className="text-xs font-bold text-slate-450 dark:text-zinc-400">phòng</span>
          </div>
          <p className="text-[10px] text-teal-600 font-semibold">Khả dụng</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
          <Building2 size={22} />
        </div>
      </div>
    </div>
  );
}
export default SchedulesKpis;
