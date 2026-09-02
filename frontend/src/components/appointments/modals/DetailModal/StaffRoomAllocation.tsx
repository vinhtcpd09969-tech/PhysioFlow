import { useState, useRef, useEffect } from 'react';
import { Users, Building2, Check, ChevronDown, X } from 'lucide-react';
import { resolveImageUrl } from '../../../../utils/imageUrl';

interface StaffRoomAllocationProps {
  selectedAppointment: any;
  resolvedRoomName: string;
  resolvedRoom: any;
  targetRole: string;
  assignStaffId: string;
  setAssignStaffId: (val: string) => void;
  assignStatus: string;
  isReceptionist: boolean;
  isLocked?: boolean;
  isReassignAllowed: boolean;
  buoi: 'sang' | 'chieu';
  staffBudget: Record<string, { conLai: number; soKhachSongSong: number }> | null;
  serviceDurationMinutes: number;
  staffList: any[];
  schedulesList: any[];
  aptDateStr: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
  appointments?: any[];
  onUnassignStaff?: () => void;
}

export function StaffRoomAllocation({
  selectedAppointment,
  resolvedRoomName,
  resolvedRoom,
  targetRole,
  assignStaffId,
  setAssignStaffId,
  assignStatus: _assignStatus,
  isReceptionist: _isReceptionist,
  isLocked = false,
  isReassignAllowed,
  buoi,
  staffBudget,
  serviceDurationMinutes,
  staffList,
  schedulesList,
  aptDateStr,
  aptStartHourStr,
  aptEndHourStr,
  appointments = [],
  onUnassignStaff: _onUnassignStaff
}: StaffRoomAllocationProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  const hasAssignedStaff = !!selectedAppointment?.bac_si_id || !!selectedAppointment?.chuyen_gia_id || !!selectedAppointment?.nhan_su_id;
  const isEditable = isReassignAllowed && !(_isReceptionist && (hasAssignedStaff || isLocked));

  const getStaffDutyStatus = (staff: any) => {
    if (!schedulesList || schedulesList.length === 0) {
      return { hasDuty: true, label: '', isPartial: false };
    }

    const staffSchedules = schedulesList.filter(s =>
      String(s.nguoi_dung_id) === String(staff.id) &&
      s.ngay === aptDateStr
    );

    if (staffSchedules.length === 0) {
      return { hasDuty: false, label: 'Không trực hôm nay', isPartial: false };
    }

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) {
      return { hasDuty: false, label: 'Nghỉ phép cả ngày', isPartial: false };
    }

    const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
    const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (aptDateStr === todayStr) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const [endH, endM] = dutyEnd.split(':').map(Number);
      if (nowMinutes >= endH * 60 + endM) {
        return { hasDuty: false, label: `Đã tan ca (${dutyStart}-${dutyEnd}) — không còn tại phòng khám`, isPartial: false };
      }
    }

    const overlaps = dutyStart < aptEndHourStr && dutyEnd > aptStartHourStr;
    if (!overlaps) {
      return { hasDuty: false, label: `ca trực ${dutyStart}-${dutyEnd} không trùng buổi này`, isPartial: false };
    }

    const isPartial = dutyStart > aptStartHourStr || dutyEnd < aptEndHourStr;
    return { hasDuty: true, label: `Trực: ${dutyStart} – ${dutyEnd}`, isPartial, dutyEnd, dutyStart };
  };

  const getDangKhamCount = (staffId: any) => {
    return appointments.filter((apt) => {
      if (String(apt.id) === String(selectedAppointment.id)) return false;
      if (apt.trang_thai !== 'dang_kham') return false;
      if (apt.buoi !== buoi) return false;
      const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
      if (String(assignedId) !== String(staffId)) return false;
      try {
        const d = new Date(apt.ngay_gio_bat_dau);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dStr === aptDateStr;
      } catch (e) {
        return false;
      }
    }).length;
  };

  const getAvatarInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'NV';
    const clean = name.trim();
    if (!clean) return 'NV';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayedStaff = staffList
    .filter(s => s.vai_tro === targetRole)
    .filter(staff => {
      const assignedId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id;
      const isCurrentlyAssigned = assignedId && String(staff.id) === String(assignedId);

      const staffSchedules = schedulesList.filter(s =>
        String(s.nguoi_dung_id) === String(staff.id) &&
        s.ngay === aptDateStr
      );
      const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
      const isOnShift = activeSchedule !== undefined;

      if (isCurrentlyAssigned) return true;
      if (!isOnShift) return false;
      return true;
    });

  // Find currently selected staff
  const currentAssignedStaff = staffList.find(s => String(s.id) === String(assignStaffId));
  const staffDuty = currentAssignedStaff ? getStaffDutyStatus(currentAssignedStaff) : null;
  const staffAptsCount = currentAssignedStaff ? appointments.filter(apt => {
    const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
    let aptDStr = '';
    try {
      const d = new Date(apt.ngay_gio_bat_dau);
      aptDStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch (e) { }
    return String(assignedId) === String(currentAssignedStaff.id) &&
      aptDStr === aptDateStr &&
      apt.trang_thai !== 'da_huy' &&
      apt.trang_thai !== 'khong_den';
  }).length : 0;

  const roleTitle = targetRole === 'Bác sĩ' ? 'Chuyên viên tư vấn phụ trách' : 'Kỹ thuật viên phụ trách';
  const roleButtonLabel = targetRole === 'Bác sĩ' ? 'Đổi chuyên viên' : 'Đổi kỹ thuật viên';
  const roomTitle = selectedAppointment.loai_lich === 'kham_moi' ? 'Phòng lượng giá chức năng' : 'Phòng trị liệu';
  
  const displayRoomName = resolvedRoomName && resolvedRoomName !== 'Chưa chỉ định'
    ? resolvedRoomName
    : (selectedAppointment.loai_lich === 'kham_moi' ? 'Phòng Lượng Giá Phục Hồi Chức Năng' : 'Phòng Trị Liệu & Phục Hồi Chức Năng');

  const displayRoomSubtitle = resolvedRoom
    ? (selectedAppointment.loai_lich === 'kham_moi' ? 'Phân theo ca chuyên viên PHCN' : 'Phân theo ca KTV')
    : 'Tự động phân bổ khi nhận ca';

  return (
    <div className="space-y-3 font-jakarta select-none relative" ref={pickerRef}>
      {/* 2 Equal Columns side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        
        {/* 1. THẺ NHÂN SỰ PHỤ TRÁCH (BÊN TRÁI) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
            {roleTitle}
          </label>

          {currentAssignedStaff ? (
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 p-3.5 flex flex-col justify-between gap-2 shadow-2xs min-h-[96px]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {currentAssignedStaff.anh_dai_dien ? (
                    <img
                      src={resolveImageUrl(currentAssignedStaff.anh_dai_dien)}
                      alt={currentAssignedStaff.ho_ten}
                      className="size-10 rounded-full object-cover shrink-0 border-2 border-emerald-500 shadow-xs"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 border-2 border-emerald-500 shadow-xs">
                      {getAvatarInitials(currentAssignedStaff.ho_ten)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        {currentAssignedStaff.ho_ten}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                        {staffAptsCount} ca
                      </span>
                    </div>

                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Sẵn sàng</span>
                    </p>
                  </div>
                </div>

                {isEditable && (
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(!isPickerOpen)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs border ${
                      isPickerOpen
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                    }`}
                  >
                    <Users size={12} />
                    <span>{roleButtonLabel}</span>
                    <ChevronDown size={11} className={`transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {staffDuty && staffDuty.hasDuty && (
                <div className="pt-1.5 border-t border-emerald-200/60 dark:border-emerald-900/40">
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 leading-snug">
                    ⚠️ {staffDuty.label}{staffDuty.isPartial ? ` (đến ${staffDuty.dutyEnd})` : ''}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-emerald-400 dark:border-emerald-600/60 bg-emerald-50/15 dark:bg-emerald-950/15 p-3.5 flex flex-col justify-between gap-2 shadow-2xs min-h-[96px]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-300 dark:border-emerald-700">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      Bất kỳ (Hàng chờ chung)
                    </p>
                    <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
                      Không gán đích danh · Nhân sự rảnh tự nhận
                    </p>
                  </div>
                </div>

                {isEditable && (
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(!isPickerOpen)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs border ${
                      isPickerOpen
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                    }`}
                  >
                    <Users size={12} />
                    <span>Chọn nhân sự</span>
                    <ChevronDown size={11} className={`transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. THẺ PHÒNG THỰC HIỆN (BÊN PHẢI) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
            {roomTitle}
          </label>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 flex items-center gap-3 shadow-2xs min-h-[96px]">
            <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
              <Building2 size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                {displayRoomName}
              </p>
              <div className="mt-1">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg font-medium inline-block border border-slate-200/60 dark:border-zinc-700/60">
                  {displayRoomSubtitle}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* DROPDOWN POPUP: DANH SÁCH CHỌN NHÂN SỰ */}
      {isPickerOpen && isEditable && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850/90 border border-slate-200 dark:border-zinc-700 shadow-xl space-y-3 animate-fade-in z-20">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/70 dark:border-zinc-700">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-teal-600" />
              <span>Chọn nhân sự phụ trách hoặc Hàng chờ</span>
            </span>
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="size-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
            {/* Lựa chọn 1: Bất kỳ (Hàng chờ chung) */}
            <div
              onClick={() => {
                setAssignStaffId('');
                setIsPickerOpen(false);
              }}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                !assignStaffId
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs font-bold ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-300'
              }`}
            >
              <div className="size-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">Bất kỳ (Hàng chờ chung)</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">Nhân sự rảnh tự nhận ca</p>
              </div>
              {!assignStaffId && <Check size={16} className="text-emerald-600 shrink-0 stroke-[3]" />}
            </div>

            {/* Danh sách các nhân sự */}
            {displayedStaff.map((staff) => {
              const staffId = staff.id;
              const duty = getStaffDutyStatus(staff);
              const isSelected = String(assignStaffId) === String(staffId);

              const budgetInfo = staffBudget ? staffBudget[String(staffId)] : null;
              const soKhachSongSong = budgetInfo?.soKhachSongSong ?? 1;
              const dangKhamCount = getDangKhamCount(staffId);
              const isParallelFull = dangKhamCount >= soKhachSongSong;
              const hasEnoughBudget = !staffBudget || !budgetInfo || budgetInfo.conLai >= serviceDurationMinutes;

              const isAvailable = duty.hasDuty && !isParallelFull && hasEnoughBudget;

              let blockReason: string | null = null;
              if (!duty.hasDuty) {
                blockReason = duty.label || 'Không trực hôm nay';
              } else if (isParallelFull) {
                blockReason = `Đang bận đủ ${dangKhamCount}/${soKhachSongSong} ca song song`;
              } else if (!hasEnoughBudget && budgetInfo) {
                blockReason = `Chỉ còn ${budgetInfo.conLai} phút (cần ${serviceDurationMinutes}p)`;
              }

              const staffAptsCount = appointments.filter(apt => {
                const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
                let aptDStr = '';
                try {
                  const d = new Date(apt.ngay_gio_bat_dau);
                  aptDStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } catch (e) { }
                return String(assignedId) === String(staffId) &&
                  aptDStr === aptDateStr &&
                  apt.trang_thai !== 'da_huy' &&
                  apt.trang_thai !== 'khong_den';
              }).length;

              return (
                <div
                  key={staff.id}
                  onClick={() => {
                    if (isAvailable) {
                      setAssignStaffId(String(staffId));
                      setIsPickerOpen(false);
                    }
                  }}
                  className={`p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${
                    !isAvailable
                      ? 'bg-slate-100/80 dark:bg-zinc-800/40 border-slate-200/60 dark:border-zinc-800/60 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs font-bold cursor-pointer ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-emerald-300 cursor-pointer'
                  }`}
                >
                  {staff.anh_dai_dien ? (
                    <img
                      src={resolveImageUrl(staff.anh_dai_dien)}
                      alt={staff.ho_ten}
                      className="size-9 rounded-full object-cover shrink-0 border"
                    />
                  ) : (
                    <div className="size-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center font-bold text-xs shrink-0 border">
                      {getAvatarInitials(staff.ho_ten)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        {staff.ho_ten}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                        {staffAptsCount} ca
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        !isAvailable
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60'
                      }`}>
                        {isAvailable ? '● Sẵn sàng' : 'Không khả dụng'}
                      </span>

                      {isAvailable && duty.label && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-snug">
                          ⚠️ {duty.label}{duty.isPartial ? ` (đến ${duty.dutyEnd})` : ''}
                        </span>
                      )}
                    </div>

                    {/* HIỂN THỊ ĐẦY ĐỦ LÝ DO MÀU ĐỎ - KHÔNG BỊ CẮT CHỮ NỮA */}
                    {!isAvailable && blockReason && (
                      <p className="text-[11px] leading-snug break-words text-rose-600 dark:text-rose-400 font-medium mt-1">
                        ❌ {blockReason}
                      </p>
                    )}
                  </div>

                  {isSelected && <Check size={16} className="text-emerald-600 shrink-0 stroke-[3] mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
