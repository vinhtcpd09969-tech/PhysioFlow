import { PhoneCall } from 'lucide-react';
import { format } from 'date-fns';

interface PendingContactPanelProps {
  pendingAppointments: any[];
  onOpenDetailModal: (apt: any) => void;
}

export function PendingContactPanel({ pendingAppointments, onOpenDetailModal }: PendingContactPanelProps) {
  if (pendingAppointments.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
          <PhoneCall size={16} className="text-rose-500 animate-bounce" /> Lịch hẹn cần liên hệ
        </h3>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-100/30">
          {pendingAppointments.length} ca
        </span>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {pendingAppointments.map((apt) => {
          // Tính số phút trễ kể từ thời điểm tạo
          const createdTime = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
          const minsPassed = createdTime > 0 ? Math.floor((Date.now() - createdTime) / 60000) : 0;

          return (
            <div
              key={apt.id}
              onClick={() => onOpenDetailModal(apt)}
              className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-150/70 dark:border-zinc-800/80 hover:border-rose-500 dark:hover:border-rose-500 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-1.5 relative overflow-hidden group"
            >
              {/* Highlight badge for long overdue */}
              <div className="absolute top-0 right-0 h-full w-1 bg-rose-500/20 group-hover:bg-rose-500 transition-colors" />

              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 capitalize flex items-center gap-1">
                  <span className="animate-bounce inline-block">📞</span> {apt.ten_khach_hang}
                </span>
                <span className="font-mono text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700/50 text-slate-500 dark:text-zinc-400">
                  {apt.ma_lich_dat}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-600 dark:text-zinc-450 font-bold">
                  📞 SĐT: <span className="font-black text-slate-800 dark:text-zinc-200">{apt.so_dien_thoai || 'Không có'}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-semibold flex justify-between">
                  <span>📅 Ngày: {format(new Date(apt.ngay_gio_bat_dau), 'dd/MM/yyyy')} ({format(new Date(apt.ngay_gio_bat_dau), 'HH:mm')})</span>
                </p>
                <div className="flex justify-between items-center text-[9px] font-bold mt-1 text-rose-500 dark:text-rose-455">
                  <span>Trễ: {minsPassed} phút</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-black uppercase text-[8px] tracking-wider bg-rose-50 dark:bg-rose-955/20 px-1.5 py-0.5 rounded border border-rose-100/30">
                    Chi tiết ➜
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
