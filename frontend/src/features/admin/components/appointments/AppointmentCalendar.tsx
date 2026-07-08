import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Plus, Coffee, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentCalendarProps {
  timeSlots: string[];
  appointments: any[];
  statusConfig: any;
  handleOpenDetailModal: (apt: any) => void;
  roomsList?: any[];
  staffList?: any[];
  schedulesList?: any[];
  allAppointments?: any[];
  selectedDateStr?: string;
  onOpenWalkInModal?: (time: string) => void;
  onUpdateAppointment?: (appointmentId: string, updatedFields: any) => Promise<void>;
  viewMode?: 'admin' | 'doctor';
  currentStaffId?: string;
  hideUnassignedColumn?: boolean;
}

export default function AppointmentCalendar({
  appointments,
  statusConfig,
  handleOpenDetailModal,
  staffList = [],
  selectedDateStr = '',
  onOpenWalkInModal,
  onUpdateAppointment: _onUpdateAppointment,
  viewMode = 'admin',
  schedulesList = [],
  allAppointments = []
}: AppointmentCalendarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const getStaffDutyStatus = (staff: any) => {
    if (!schedulesList || schedulesList.length === 0) {
      return { hasDuty: true, label: '' };
    }

    const staffSchedules = schedulesList.filter(s => 
      String(s.nguoi_dung_id) === String(staff.id) && 
      s.ngay === selectedDateStr
    );

    if (staffSchedules.length === 0) {
      return { hasDuty: false, label: 'Không trực hôm nay' };
    }

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) {
      return { hasDuty: false, label: 'Nghỉ phép cả ngày' };
    }

    return { hasDuty: true, label: '' };
  };

  const getIsDoctorUnavailable = (apt: any, doc: any) => {
    if (!doc) return false;
    
    // Check ca trực
    const duty = getStaffDutyStatus(doc);
    if (!duty.hasDuty) return true;

    // Check overlap
    const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
      const s1 = new Date(start1).getTime();
      const e1 = new Date(end1).getTime();
      const s2 = new Date(start2).getTime();
      const e2 = new Date(end2).getTime();
      return s1 < e2 && e1 > s2;
    };

    const isOccupied = allAppointments.some(otherApt => 
      otherApt.id !== apt.id && 
      otherApt.trang_thai !== 'da_huy' &&
      otherApt.trang_thai !== 'khong_den' &&
      String(otherApt.bac_si_id) === String(doc.id) &&
      isOverlapping(apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc, otherApt.ngay_gio_bat_dau, otherApt.ngay_gio_ket_thuc)
    );

    return isOccupied;
  };

  // Update current time every minute for the NOW indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isToday = selectedDateStr === format(currentTime, 'yyyy-MM-dd');

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, apt: any) => {
    e.dataTransfer.setData('text/plain', apt.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Logic 1: Sắp xếp cuộc hẹn và nhóm chúng theo giờ bắt đầu chính xác
  const timelineRows = React.useMemo(() => {
    const sortedApts = [...appointments].sort((a, b) => 
      new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime()
    );

    // Group by exact start time
    const grouped: Record<string, { start: string; end: string; startMs: number; endMs: number; apts: any[] }> = {};
    
    sortedApts.forEach(apt => {
      const startDate = new Date(apt.ngay_gio_bat_dau);
      const startStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
      
      const endDate = new Date(apt.ngay_gio_ket_thuc);
      const endStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();
      
      if (!grouped[startStr]) {
        grouped[startStr] = {
          start: startStr,
          end: endStr,
          startMs,
          endMs,
          apts: []
        };
      }
      grouped[startStr].apts.push(apt);
      
      // Update max end time for parallel appointments
      if (endMs > grouped[startStr].endMs) {
        grouped[startStr].end = endStr;
        grouped[startStr].endMs = endMs;
      }
    });

    const groupedKeys = Object.keys(grouped).sort();
    
    const rows: Array<{
      type: 'appointment' | 'gap';
      id: string;
      startTimeStr: string;
      endTimeStr: string;
      durationMins?: number;
      appointments?: any[];
    }> = [];

    // Clinic standard hours (08:00 - 20:00)
    const baseDate = selectedDateStr ? new Date(selectedDateStr + 'T00:00:00') : new Date();
    const dayStartMs = new Date(baseDate).setHours(8, 0, 0, 0);
    const dayEndMs = new Date(baseDate).setHours(20, 0, 0, 0);

    let lastEndMs = dayStartMs;

    groupedKeys.forEach(startStr => {
      const group = grouped[startStr];
      
      // Check for gap before this group
      if (group.startMs > lastEndMs) {
        const gapDuration = Math.round((group.startMs - lastEndMs) / 60000);
        if (gapDuration >= 5) {
          const gapStart = new Date(lastEndMs);
          const gapEnd = new Date(group.startMs);
          rows.push({
            type: 'gap',
            id: `gap-${lastEndMs}-${group.startMs}`,
            startTimeStr: `${String(gapStart.getHours()).padStart(2, '0')}:${String(gapStart.getMinutes()).padStart(2, '0')}`,
            endTimeStr: `${String(gapEnd.getHours()).padStart(2, '0')}:${String(gapEnd.getMinutes()).padStart(2, '0')}`,
            durationMins: gapDuration
          });
        }
      }

      // Add appointment group row
      rows.push({
        type: 'appointment',
        id: `group-${startStr}`,
        startTimeStr: group.start,
        endTimeStr: group.end,
        appointments: group.apts
      });

      if (group.endMs > lastEndMs) {
        lastEndMs = group.endMs;
      }
    });

    // Check for gap at the end of the day
    if (dayEndMs > lastEndMs) {
      const gapDuration = Math.round((dayEndMs - lastEndMs) / 60000);
      if (gapDuration >= 5) {
        const gapStart = new Date(lastEndMs);
        const gapEnd = new Date(dayEndMs);
        rows.push({
          type: 'gap',
          id: `gap-${lastEndMs}-${dayEndMs}`,
          startTimeStr: `${String(gapStart.getHours()).padStart(2, '0')}:${String(gapStart.getMinutes()).padStart(2, '0')}`,
          endTimeStr: `${String(gapEnd.getHours()).padStart(2, '0')}:${String(gapEnd.getMinutes()).padStart(2, '0')}`,
          durationMins: gapDuration
        });
      }
    }

    return rows;
  }, [appointments, selectedDateStr]);

  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-zinc-800 overflow-hidden transition-all duration-300">
      <table className="w-full border-collapse text-left relative table-fixed">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-zinc-800/20 text-slate-400 dark:text-zinc-555 text-[10px] font-black uppercase tracking-wider border-b border-slate-150/60 dark:border-zinc-800/80 select-none">
            <th className="w-28 p-4 text-center border-r border-slate-100 dark:border-zinc-800/50">Thời gian</th>
            <th className="p-4">Danh sách phân bổ lịch trình</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 relative">
          {timelineRows.length > 0 ? (
            timelineRows.map((row) => {
              const isGap = row.type === 'gap';

              // NOW Indicator Calculation for this row
              let isCurrentTimeInRow = false;
              let offsetPercent = 0;
              
              if (isToday && selectedDateStr) {
                const nowH = currentTime.getHours();
                const nowM = currentTime.getMinutes();
                const nowMins = nowH * 60 + nowM;

                const [startH, startM] = row.startTimeStr.split(':').map(Number);
                const [endH, endM] = row.endTimeStr.split(':').map(Number);
                
                const rowStartMins = startH * 60 + startM;
                const rowEndMins = endH * 60 + endM;

                if (nowMins >= rowStartMins && nowMins < rowEndMins) {
                  isCurrentTimeInRow = true;
                  offsetPercent = ((nowMins - rowStartMins) / (rowEndMins - rowStartMins)) * 100;
                }
              }

              return (
                <tr 
                  key={row.id} 
                  className={`relative group/row ${isGap ? 'bg-slate-50/30 dark:bg-zinc-955/5' : 'hover:bg-slate-50/20 dark:hover:bg-zinc-800/10 transition-colors'}`}
                >
                  {/* Trục thời gian bên trái */}
                  <td className="p-4 text-center border-r border-slate-100 dark:border-zinc-800/50 font-mono text-xs font-black text-slate-500 dark:text-zinc-400 bg-slate-50/10 dark:bg-zinc-900/5 select-none w-28 align-middle">
                    {/* NOW Indicator Line overlay */}
                    {isCurrentTimeInRow && (
                      <div 
                        className="absolute left-0 right-0 h-[1.5px] bg-rose-500 pointer-events-none z-30 flex items-center justify-start" 
                        style={{ top: `${offsetPercent}%` }}
                      >
                        <span className="bg-rose-500 text-white font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.5)] tracking-wider -translate-y-1/2 ml-2 select-none animate-pulse">
                          NOW
                        </span>
                        <div className="w-full h-[1.5px] bg-gradient-to-r from-rose-500 via-rose-500/80 to-transparent shadow-[0_0_6px_rgba(239,68,68,0.2)]"></div>
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-black text-slate-800 dark:text-zinc-200">
                        {isGap ? <Coffee size={11} className="text-amber-500" /> : <Clock size={11} className="text-emerald-500" />}
                        <span>{row.startTimeStr}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-zinc-550 font-semibold">
                        đến {row.endTimeStr}
                      </div>
                    </div>
                  </td>

                  {/* Nội dung danh sách / khoảng trống */}
                  <td className="p-3.5 align-middle">
                    {isGap ? (
                      <div 
                        onClick={() => onOpenWalkInModal && onOpenWalkInModal(row.startTimeStr)}
                        className="group/gap flex items-center justify-between py-3 px-4 border border-dashed border-slate-200 dark:border-zinc-800/80 hover:border-emerald-350 dark:hover:border-emerald-850 hover:bg-slate-50/60 dark:hover:bg-zinc-855/10 rounded-2xl cursor-pointer transition-all duration-300 select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 group-hover/gap:bg-emerald-500 transition-colors" />
                          <span className="text-xs font-semibold text-slate-400 dark:text-zinc-550 group-hover/gap:text-slate-600 dark:group-hover/gap:text-zinc-300">
                            Trống lịch <span className="font-extrabold text-slate-550 dark:text-zinc-400 group-hover/gap:text-emerald-600">{row.durationMins} phút</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          className="opacity-0 group-hover/gap:opacity-100 flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-xl border border-emerald-100 dark:border-emerald-900/30 transition-all active:scale-95"
                        >
                          <Plus size={10} className="stroke-[3]" /> Thêm ca hẹn
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                        {row.appointments?.map(apt => {
                          const assignedDoc = staffList.find(s => String(s.id) === String(apt.bac_si_id));
                          const isDocUnavailable = assignedDoc ? getIsDoctorUnavailable(apt, assignedDoc) : false;
                          return (
                            <AppointmentCard 
                              key={apt.id} 
                              apt={apt} 
                              statusConfig={statusConfig} 
                              onClick={() => handleOpenDetailModal(apt)}
                              onDragStart={handleDragStart}
                              viewMode={viewMode}
                              assignedDoc={assignedDoc}
                              isDocUnavailable={isDocUnavailable}
                            />
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={2} className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-semibold italic select-none">
                Không có dữ liệu lịch hẹn nào cho ngày hôm nay.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Subcomponent: Countdown Timer
function CountdownTimer({ hanXacNhan, onExpire }: { hanXacNhan: string; onExpire?: () => void }) {
  const calculateTimeLeft = () => {
    if (!hanXacNhan) return 0;
    const diff = new Date(hanXacNhan).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hanXacNhan, onExpire]);

  if (timeLeft <= 0) {
    return <span className="text-red-500 font-extrabold text-[9px] animate-pulse">Quá hạn</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  let colorClass = 'text-amber-600 bg-amber-50 dark:bg-amber-955/20 border border-amber-200/20';
  if (minutes < 5) {
    colorClass = 'text-rose-600 bg-rose-50 dark:bg-rose-955/20 animate-pulse font-extrabold border border-rose-250/20';
  } else if (minutes < 10) {
    colorClass = 'text-orange-600 bg-orange-50 dark:bg-orange-955/20 font-bold border border-orange-200/20';
  }

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-mono ${colorClass}`}>
      <span>⏳</span>
      <span>{timeStr}</span>
    </span>
  );
}

// Subcomponent: Appointment Card (Premium Glassmorphic card styling, simplified - removed quick action buttons)
function AppointmentCard({
  apt,
  statusConfig,
  onClick,
  onDragStart,
  viewMode = 'admin',
  assignedDoc,
  isDocUnavailable = false
}: {
  apt: any;
  statusConfig: any;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, apt: any) => void;
  onUpdateAppointment?: (appointmentId: string, updatedFields: any) => Promise<void>;
  viewMode?: 'admin' | 'doctor';
  assignedDoc?: any;
  isDocUnavailable?: boolean;
}) {
  const rawStatus = statusConfig[apt.trang_thai] || statusConfig.cho_xac_nhan;
  const status = {
    ...rawStatus,
    label: apt.trang_thai === 'cho_xac_nhan' 
      ? (apt.loai_lich === 'dich_vu_don' ? 'Chờ gán KTV' : 'Chờ gán Bác sĩ')
      : rawStatus.label
  };
  const isUnassigned = !apt.bac_si_id;
  const isCheckedIn = apt.trang_thai === 'da_checkin';
  const isPending = ['cho_xac_nhan', 'chua_xac_nhan'].includes(apt.trang_thai);
  
  const showCountdown = false;

  return (
    <div
      id={`appointment-card-${apt.id}`}
      draggable={viewMode !== 'doctor'}
      onDragStart={(e) => onDragStart(e, apt)}
      onClick={onClick}
      className={`p-3.5 bg-white dark:bg-zinc-900 border ${viewMode === 'doctor' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} transition-all duration-300 rounded-[18px] relative flex flex-col justify-between min-h-[110px] group/card hover:-translate-y-0.5 hover:shadow-lg select-none ${
        ['da_huy', 'khong_den'].includes(apt.trang_thai)
          ? 'opacity-85 border-slate-200 bg-slate-50/50 dark:bg-zinc-955/20 dark:border-zinc-850/80 cursor-pointer'
          : isCheckedIn
            ? 'border-teal-350 dark:border-teal-850 ring-2 ring-[#0D9488]/10 dark:ring-[#0D9488]/5 bg-[#0D9488]/2 dark:bg-[#0D9488]/2'
            : (isUnassigned || isDocUnavailable) && !isPending
              ? 'border-rose-500 ring-2 ring-rose-500/10 dark:ring-rose-500/5 bg-rose-55/10 dark:bg-rose-955/5 animate-pulse'
              : isUnassigned && isPending
                ? 'border-rose-100 dark:border-rose-900/30 hover:border-rose-300' 
                : 'border-slate-100 dark:border-zinc-800 hover:border-[#14B8A6]/30'
      }`}
    >
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800/50">
            {apt.ma_lich_dat}
          </span>
          <div className="flex items-center gap-1.5">
            {isCheckedIn && (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D9488] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0D9488]"></span>
              </span>
            )}
            {apt.trang_thai === 'dang_kham' && (
              <span className="flex items-center justify-center text-emerald-600 dark:text-emerald-455 bg-emerald-100/50 dark:bg-emerald-955/40 p-1 rounded-full border border-emerald-250 ring-2 ring-emerald-500/15 animate-pulse">
                <Stethoscope size={10} className="stroke-[2.5]" />
              </span>
            )}
            <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
        
        <div className="text-xs font-black text-slate-800 dark:text-zinc-150 line-clamp-1 group-hover/card:text-[#0D9488] transition-colors duration-200">
          {apt.ten_khach_hang}
        </div>
        
        <div className="text-[9.5px] text-slate-405 dark:text-zinc-550 line-clamp-1 font-bold mt-0.5">
          {apt.ten_dich_vu}
        </div>
        
        {/* Lý do hủy/không đến nếu có */}
        {['da_huy', 'khong_den'].includes(apt.trang_thai) && apt.ly_do_huy && (
          <div className="mt-1 text-[8.5px] italic text-rose-500 dark:text-rose-455 font-bold line-clamp-1">
            Lý do: {apt.ly_do_huy}
          </div>
        )}
        
        {/* Doctor/KTV badge inside the card if assigned or locked */}
        {assignedDoc && !isDocUnavailable ? (
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-black text-[#0D9488] dark:text-teal-400 bg-[#0D9488]/5 dark:bg-teal-950/20 px-2 py-0.5 rounded border border-[#0D9488]/15 dark:border-teal-900/20 select-none">
            <span className="size-1 bg-[#0D9488] rounded-full" />
            <span>{apt.loai_lich === 'dich_vu_don' || apt.loai_lich === 'dieu_tri' ? 'KTV.' : 'BS.'} {assignedDoc.ho_ten}</span>
            {['chua_xac_nhan', 'cho_xac_nhan'].includes(apt.trang_thai) && (
              <span className="text-[8px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded ml-1.5 font-black border border-amber-200 uppercase tracking-wide">Chưa xác nhận</span>
            )}
          </div>
        ) : (
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-black text-rose-600 dark:text-rose-455 bg-rose-55/50 dark:bg-rose-955/20 px-2 py-0.5 rounded border border-rose-220/20 select-none">
            <span className="size-1 bg-rose-500 rounded-full animate-pulse" />
            <span>Chờ gán {apt.loai_lich === 'dich_vu_don' || apt.loai_lich === 'dieu_tri' ? 'kỹ thuật viên' : 'bác sĩ'}</span>
          </div>
        )}
      </div>

      {/* Floating Detailed Hover Info Tooltip Panel */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900 dark:bg-zinc-955 text-white text-[10px] p-3 rounded-xl shadow-xl w-60 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-800 dark:border-zinc-800">
        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0.5 h-0.5 border-t-[6px] border-t-slate-900 border-x-[6px] border-x-transparent" />
        <p className="font-black text-xs text-white border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
          <span>Chi tiết ca hẹn</span>
          <span className="text-[9px] font-mono text-[#14B8A6]">{apt.ma_lich_dat}</span>
        </p>
        <p className="font-bold text-[11px] mb-1">📞 SDT: <span className="text-slate-350">{apt.so_dien_thoai}</span></p>
        <p className="font-bold text-[11px] mb-1">🩺 Dịch vụ: <span className="text-slate-350">{apt.ten_dich_vu}</span></p>
        {apt.ly_do_kham && (
          <p className="text-[10px] text-slate-450 italic mt-1 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/20 line-clamp-2">
            "{apt.ly_do_kham}"
          </p>
        )}
      </div>
 
      {/* Footer Area - Static layout, no translation or hover-collapse */}
      <div className="mt-2.5 pt-2 border-t border-slate-50 dark:border-zinc-800/80 flex items-center justify-between gap-1 select-none">
        {apt.ten_phong ? (
          <div className="flex items-center gap-1 text-[9px] text-[#0d766e] dark:text-emerald-450 font-black bg-[#0D9488]/5 dark:bg-emerald-955/20 px-2 py-0.5 rounded border border-[#0D9488]/15 dark:border-teal-900/20">
            <MapPin size={9} className="text-[#0D9488]" />
            <span>{apt.ten_phong}</span>
          </div>
        ) : (
          <div />
        )}

        {showCountdown && (
          <CountdownTimer hanXacNhan={apt.han_xac_nhan} />
        )}
      </div>
    </div>
  );
}
