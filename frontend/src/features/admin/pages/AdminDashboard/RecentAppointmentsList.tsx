import { ChevronRight } from 'lucide-react';

interface RecentAppointmentsListProps {
  recentAppointments: any[];
  onViewSchedule?: () => void;
}

export function RecentAppointmentsList({ recentAppointments, onViewSchedule }: RecentAppointmentsListProps) {
  return (
    <div 
      className="bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui flex flex-col opacity-0 animate-slide-up"
      style={{ animationDelay: '350ms' }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-extrabold text-secondary">Lịch hẹn gần đây</h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Các lịch hẹn mới nhất hôm nay</p>
        </div>
        <button className="text-primary text-xs font-bold hover:underline">Xem tất cả</button>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-1 scrollbar-thin">
        {recentAppointments.length === 0 ? (
          <p className="text-zinc-400 text-xs italic text-center py-12 font-bold">Không có lịch hẹn gần đây.</p>
        ) : (
          recentAppointments.map((appt) => (
            <div key={appt.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100/50 hover:border-zinc-200/80 transition-all duration-200 group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  {appt.ten_khach_hang?.charAt(0) || 'K'}
                </div>
                <div className="max-w-[120px] sm:max-w-none">
                  <p className="text-xs font-bold text-secondary truncate">{appt.ten_khach_hang}</p>
                  <p className="text-[10px] text-zinc-400 font-bold mt-0.5 truncate">{appt.ten_dich_vu}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold text-secondary">
                  {appt.ngay_gio_bat_dau ? new Date(appt.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1 inline-block ${
                  appt.trang_thai === 'cho_xac_nhan' 
                    ? 'bg-amber-50 text-accent' 
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {appt.trang_thai === 'cho_xac_nhan' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button onClick={onViewSchedule} className="w-full mt-6 py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-zinc-100">
        Xem lịch trình <ChevronRight size={14} />
      </button>
    </div>
  );
}
