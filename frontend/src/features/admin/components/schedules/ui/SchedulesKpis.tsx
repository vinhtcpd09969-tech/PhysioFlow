import { User } from 'lucide-react';

interface Stats {
  activeToday: number;
  emptyShifts: number;
  coverage: number;
}

interface SchedulesKpisProps {
  stats: Stats;
}

export function SchedulesKpis({ stats }: SchedulesKpisProps) {
  return (
    <div className="flex select-none">
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-[24px] p-6 shadow-md border border-teal-400/20 flex items-center gap-5 max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/15">
          <User size={28} />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-teal-100 uppercase tracking-wider mb-0.5">Nhân sự trong ngày</p>
          <h3 className="text-3xl font-heading font-black tracking-tight">
            {stats.activeToday} <span className="text-xs font-bold text-teal-200">người</span>
          </h3>
        </div>
      </div>
    </div>
  );
}
export default SchedulesKpis;
