import React from 'react';
import { AlertTriangle, Plus, Sun, Sunset, Moon, UserX } from 'lucide-react';
import { Schedule, Staff, WeekDate } from '../types';
import { getAvatarInitials } from '../constants';

interface SchedulesGridProps {
  weekDates: WeekDate[];
  groupedStaff: Record<string, Staff[]>;
  schedules: Schedule[];
  conflicts: any[];
  highlightCell?: { staffId: string; dateStr: string } | null;
  onOpenModal: (userId: string, dateStr?: string) => void;
  onOpenEditModal: (sched: Schedule) => void;
}

export function SchedulesGrid({
  weekDates,
  groupedStaff,
  schedules,
  conflicts,
  highlightCell,
  onOpenModal,
  onOpenEditModal
}: SchedulesGridProps) {

  const todayDateStr = React.useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const renderShiftBadge = (sched: Schedule) => {
    const isConflict = conflicts.some(
      c => c.id === sched.nguoi_dung_id && 
      c.dowLabel === (weekDates.find(d => d.fullDateStr === sched.ngay)?.label || sched.ngay)
    );
    
    let label = 'Ca Sáng'; 
    let colorClass = 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-teal-200/80 dark:border-teal-800/60 hover:border-teal-400 hover:shadow-xs';
    let ShiftIcon = Sun;
    let iconColor = 'text-amber-500';
    
    if (sched.trang_thai === 'tam_nghi') {
      label = 'Nghỉ phép'; 
      colorClass = 'bg-rose-50/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:border-rose-350';
      ShiftIcon = UserX;
      iconColor = 'text-rose-500';
    } else {
      const hour = parseInt(sched.gio_bat_dau.split(':')[0]);
      if (hour >= 11 && hour < 16) {
        label = 'Ca Chiều'; 
        colorClass = 'bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/60 dark:to-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 hover:shadow-xs';
        ShiftIcon = Sunset;
        iconColor = 'text-indigo-500';
      } else if (hour >= 16) {
        label = 'Ca Tối'; 
        colorClass = 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 hover:shadow-xs';
        ShiftIcon = Moon;
        iconColor = 'text-amber-600';
      }
    }

    if (isConflict && sched.trang_thai !== 'tam_nghi') {
      colorClass = 'bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 border-dashed animate-pulse hover:border-rose-500';
      label = `Trùng ca (${label})`;
    }

    const isPastDate = sched.ngay < todayDateStr;

    if (isPastDate) {
      return (
        <div 
          key={sched.id} 
          className="text-xs font-bold border border-slate-200/60 dark:border-zinc-700/50 p-2 rounded-xl text-center mb-1.5 shadow-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-400 cursor-not-allowed select-none opacity-75 flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-1.5">
            <ShiftIcon size={13} className="opacity-60 shrink-0" />
            <span className="uppercase tracking-wider font-black text-[10px]">{label}</span>
          </div>
          {sched.trang_thai !== 'tam_nghi' && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] whitespace-nowrap">
              {sched.ma_phong && (
                <span className="bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.2 rounded text-[9px] font-black text-slate-600 dark:text-zinc-300">
                  {sched.ma_phong}
                </span>
              )}
              <span className="font-mono tracking-tight">{sched.gio_bat_dau.slice(0, 5)} - {sched.gio_ket_thuc.slice(0, 5)}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        key={sched.id} 
        onClick={(e) => { e.stopPropagation(); onOpenEditModal(sched); }}
        className={`text-xs font-bold border p-2 rounded-xl text-center mb-1.5 shadow-2xs transition-all cursor-pointer flex flex-col items-center gap-1 hover:scale-[1.02] ${colorClass}`}
        title={`Click để chỉnh sửa ca trực (${sched.gio_bat_dau.slice(0, 5)} - ${sched.gio_ket_thuc.slice(0, 5)})`}
      >
        <div className="flex items-center gap-1.5">
          <ShiftIcon size={13} className={`${iconColor} shrink-0`} />
          <span className="uppercase tracking-wider font-black text-[10px]">{label}</span>
        </div>
        {sched.trang_thai !== 'tam_nghi' && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] whitespace-nowrap">
            {sched.ma_phong && (
              <span className="bg-white/90 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[9px] font-black text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 shadow-2xs">
                {sched.ma_phong}
              </span>
            )}
            <span className="font-mono font-bold tracking-tight opacity-95">{sched.gio_bat_dau.slice(0, 5)} - {sched.gio_ket_thuc.slice(0, 5)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900/90 rounded-[24px] shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden font-jakarta">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px] table-fixed">
          <colgroup>
            <col className="w-[18%] min-w-[160px]" />
            {weekDates.map(d => (
              <col key={d.key} className="w-[11.71%]" />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-50/50 dark:bg-zinc-900/80 select-none">
              <th className="p-3.5 font-black text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider border-b border-r border-gray-100 dark:border-zinc-800">
                Nhân viên
              </th>
              {weekDates.map(d => (
                <th 
                  key={d.key} 
                  className={`p-2 text-center border-b border-r border-gray-100 dark:border-zinc-800 transition-all ${
                    d.isToday 
                      ? 'bg-teal-50/60 dark:bg-teal-950/40 border-b-2 border-b-teal-500 text-teal-700 dark:text-teal-300 font-extrabold' 
                      : 'border-b-gray-100 dark:border-b-zinc-800 text-gray-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center min-h-[52px]">
                    {d.isToday ? (
                      <span className="text-[9px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-100/90 dark:bg-teal-900/70 px-2 py-0.5 rounded-full mb-1 select-none shadow-2xs">
                        Hôm nay
                      </span>
                    ) : (
                      <div className="h-[18px]" />
                    )}
                    <div className="flex items-center gap-1.5">
                      {d.isToday && (
                        <span className="size-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                      )}
                      <span className={`font-black text-sm leading-tight ${d.isToday ? 'text-teal-700 dark:text-teal-300' : 'text-gray-800 dark:text-zinc-200'}`}>
                        {d.label}
                      </span>
                    </div>
                    <div className={`text-[11px] leading-tight mt-0.5 ${d.isToday ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-500 dark:text-zinc-400 font-medium'}`}>
                      {d.dateStr}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {['Bác sĩ', 'Lễ tân', 'Kỹ thuật viên'].map(role => {
              const roleStaff = groupedStaff[role];
              if (!roleStaff || roleStaff.length === 0) return null;
              
              return (
                <React.Fragment key={role}>
                  <tr className="bg-gray-50 dark:bg-zinc-800/80 select-none">
                    <td colSpan={8} className="py-2.5 px-4 text-[11px] font-black text-gray-600 dark:text-teal-400 uppercase tracking-wider">
                      {role === 'Bác sĩ' ? 'Chuyên viên tư vấn' : role} ({roleStaff.length})
                    </td>
                  </tr>
                  {roleStaff.map(staff => {
                    const isStaffConflict = conflicts.some(c => c.id === staff.id);
                    return (
                      <tr key={staff.id} id={`staff-row-${staff.id}`} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors group border-b border-gray-100 dark:border-zinc-800 last:border-none">
                        <td className="p-3.5 border-r border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 group-hover:bg-gray-50/50 dark:group-hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center text-xs font-black shrink-0 shadow-2xs border border-slate-200/80 dark:border-zinc-700 select-none">
                              {getAvatarInitials(staff.ho_ten)}
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-zinc-100 whitespace-nowrap block" title={staff.ho_ten}>
                                {staff.ho_ten}
                              </span>
                              {isStaffConflict && <AlertTriangle size={14} className="text-rose-500 shrink-0" />}
                            </div>
                          </div>
                        </td>
                        {weekDates.map(dow => {
                          const cellSchedules = schedules.filter(s => s.nguoi_dung_id === staff.id && s.ngay === dow.fullDateStr);
                          const isPastDate = dow.fullDateStr < todayDateStr;
                          const isHighlighted = Boolean(
                            highlightCell &&
                            highlightCell.staffId === staff.id &&
                            highlightCell.dateStr === dow.fullDateStr
                          );

                          return (
                            <td 
                              key={dow.key} 
                              id={`schedule-cell-${staff.id}-${dow.fullDateStr}`}
                              className={`p-2 border-r border-gray-100 dark:border-zinc-800 align-top transition-all duration-300 relative ${
                                isHighlighted
                                  ? 'bg-emerald-100/70 dark:bg-emerald-950/70 ring-2 ring-emerald-500 rounded-lg shadow-sm'
                                  : dow.isToday 
                                    ? 'bg-teal-50/20 dark:bg-teal-950/20 ring-1 ring-teal-500/10' 
                                    : 'bg-white dark:bg-zinc-900'
                              } group-hover:bg-gray-50/50 dark:group-hover:bg-zinc-800/40`}
                            >
                              {cellSchedules.length > 0 ? (
                                cellSchedules.map(renderShiftBadge)
                              ) : (
                                !isPastDate ? (
                                  <div 
                                    onClick={() => onOpenModal(staff.id, dow.fullDateStr)}
                                    className="h-full min-h-[44px] rounded-xl border border-transparent hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/30 dark:hover:bg-zinc-800/60 border-dashed flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 text-gray-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400"
                                    title="Thêm ca trực"
                                  >
                                    <Plus size={16} />
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[44px]" />
                                )
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default SchedulesGrid;
