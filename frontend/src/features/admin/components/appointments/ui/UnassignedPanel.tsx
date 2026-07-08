import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UnassignedPanelProps {
  unassignedAppointments: any[];
  onOpenDetailModal: (apt: any) => void;
}

export function UnassignedPanel({ unassignedAppointments, onOpenDetailModal }: UnassignedPanelProps) {
  if (unassignedAppointments.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-br from-amber-50/40 to-orange-50/10 dark:from-amber-950/5 dark:to-orange-950/5 border border-amber-200/70 dark:border-amber-900/40 p-5 rounded-2xl shadow-[0_4px_24px_rgba(245,158,11,0.06)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)] hover:border-amber-350 transition-all duration-300 space-y-4 relative overflow-hidden">
      {/* Soft pulse glow background decorative element */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-2xl animate-pulse" />
      
      <div className="flex items-center justify-between pb-2.5 border-b border-amber-100/60 dark:border-amber-900/30">
        <h3 className="text-sm font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle size={16} className="text-amber-500 animate-pulse shrink-0" /> 
          Chờ phân bổ bác sĩ
        </h3>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-450 border border-amber-200/50">
          {unassignedAppointments.length} ca
        </span>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {unassignedAppointments.map((apt) => (
          <div
            key={apt.id}
            onClick={() => onOpenDetailModal(apt)}
            className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-100 dark:border-amber-900/20 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-1.5 group relative"
          >
            {/* Pulsing left-side active stripe */}
            <div className="absolute top-0 left-0 h-full w-1 bg-amber-500 group-hover:bg-amber-600 transition-colors" />

            <div className="flex justify-between items-center pl-1.5">
              <span className="text-xs font-black text-slate-800 dark:text-zinc-200 capitalize">
                {apt.ten_khach_hang}
              </span>
              <span className="font-mono text-[9px] bg-amber-50/50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-100/40 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 font-bold">
                {apt.ma_lich_dat}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-zinc-400 font-bold pl-1.5">
              <span className="flex items-center gap-1 font-extrabold text-slate-700 dark:text-zinc-300">
                ⏰ Khung giờ: {format(new Date(apt.ngay_gio_bat_dau), 'HH:mm')}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity font-black uppercase text-[8px] tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-100/30">
                Phân bổ ngay ➜
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
