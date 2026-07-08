interface StaffRoomAllocationProps {
  selectedAppointment: any;
  resolvedRoomName: string;
  resolvedRoom: any;
  targetRole: string;
  assignStaffId: string;
  setAssignStaffId: (val: string) => void;
  assignStatus: string;
  isReceptionist: boolean;
  staffList: any[];
  schedulesList: any[];
  aptDateStr: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
  occupiedStaffIds: any[];
}

export function StaffRoomAllocation({
  selectedAppointment,
  resolvedRoomName,
  resolvedRoom,
  targetRole,
  assignStaffId,
  setAssignStaffId,
  assignStatus,
  isReceptionist,
  staffList,
  schedulesList,
  aptDateStr,
  aptStartHourStr,
  aptEndHourStr,
  occupiedStaffIds
}: StaffRoomAllocationProps) {
  const getStaffDutyStatus = (staff: any) => {
    if (!schedulesList || schedulesList.length === 0) {
      return { hasDuty: true, label: '' };
    }

    const staffSchedules = schedulesList.filter(s => 
      String(s.nguoi_dung_id) === String(staff.id) && 
      s.ngay === aptDateStr
    );

    if (staffSchedules.length === 0) {
      return { hasDuty: false, label: 'Không trực hôm nay' };
    }

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) {
      return { hasDuty: false, label: 'Nghỉ phép cả ngày' };
    }

    const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
    const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

    const isCovered = dutyStart <= aptStartHourStr && dutyEnd >= aptEndHourStr;
    if (!isCovered) {
      return { hasDuty: false, label: `Trực ca ${dutyStart}-${dutyEnd}` };
    }

    return { hasDuty: true, label: `Trực ca ${dutyStart}-${dutyEnd}` };
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return 'NV';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-5">
      <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
        Điều phối lâm sàng
      </h4>

      {/* 1. NHÂN SỰ PHỤ TRÁCH (Đưa lên trước theo yêu cầu) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {targetRole === 'Bác sĩ' ? 'Bác sĩ phụ trách' : 'Kỹ thuật viên phụ trách'}
          </label>
          {assignStaffId && !isReceptionist && (
            <button 
              type="button" 
              onClick={() => setAssignStaffId('')} 
              className="text-[10px] text-rose-500 font-extrabold hover:underline"
            >
              Hủy phân công
            </button>
          )}
        </div>
        {!isReceptionist ? (
          assignStatus === 'chua_xac_nhan' ? (
            <div className="w-full px-4 py-8 bg-slate-50/50 dark:bg-zinc-800/10 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl text-center select-none">
              <div className="text-xl mb-1.5">🔒</div>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Khóa phân bổ Nhân sự</p>
              <p className="text-[10px] text-slate-450 dark:text-zinc-555 mt-1 max-w-[280px] mx-auto leading-relaxed">
                Lịch hẹn này chưa được xác nhận. Vui lòng cập nhật trạng thái lịch hẹn hoặc bấm nút "Xác nhận" ở bên dưới để mở khóa phân công.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
              {(() => {
                const assignedDocId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id;
                return staffList
                  .filter(s => s.vai_tro === targetRole)
                  .filter(staff => {
                    const staffId = staff.id;
                    const isCurrentlyAssigned = assignedDocId && String(staffId) === String(assignedDocId);
                    
                    if (isCurrentlyAssigned) {
                      return true;
                    }
                    
                    const isOccupied = occupiedStaffIds.includes(staffId);
                    const duty = getStaffDutyStatus(staff);
                    return duty.hasDuty && !isOccupied;
                  })
                  .map(staff => {
                    const staffId = staff.id;
                    const isCurrentlyAssigned = assignedDocId && String(staffId) === String(assignedDocId);
                    const duty = getStaffDutyStatus(staff);
                    const isOccupied = occupiedStaffIds.includes(staffId) && !isCurrentlyAssigned;
                    const isAvailable = duty.hasDuty && !occupiedStaffIds.includes(staffId);
                    const isSelected = String(assignStaffId) === String(staffId);
                    const showWarning = isCurrentlyAssigned && !isAvailable;

                    return (
                      <div
                        key={staff.id}
                        onClick={() => (isAvailable || isCurrentlyAssigned) && setAssignStaffId(staffId)}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 select-none cursor-pointer ${
                          showWarning
                            ? `${isSelected ? 'bg-rose-50/30 dark:bg-rose-955/10' : 'bg-white dark:bg-zinc-900'} border-dashed border-rose-500 dark:border-rose-600 animate-pulse ring-2 ring-rose-500/15`
                            : !isAvailable
                              ? 'bg-slate-50 dark:bg-zinc-800/20 border-slate-100 dark:border-zinc-800/50 opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-600 text-emerald-800 dark:text-emerald-355 ring-2 ring-emerald-500/10'
                                : 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 border ${isSelected
                            ? 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-600'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-450 border-slate-200 dark:border-zinc-750'
                          }`}>
                          {getAvatarInitials(staff.ho_ten)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate">{staff.ho_ten}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {showWarning ? (
                              <span className="bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                ⚠️ Đang bận / Sai ca trực - Đã gán
                              </span>
                            ) : (
                              <>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${isOccupied
                                    ? 'bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455'
                                    : !duty.hasDuty
                                      ? 'bg-slate-200 dark:bg-zinc-800 text-slate-650 dark:text-zinc-450'
                                      : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450'
                                  }`}>
                                  {isOccupied
                                    ? 'Trùng lịch'
                                    : !duty.hasDuty
                                      ? (['Đang nghỉ trưa', 'Đang nghỉ tối', 'Nghỉ phép cả ngày'].includes(duty.label) ? duty.label : 'Không trực')
                                      : 'Sẵn sàng'}
                                </span>
                                {duty.label && duty.hasDuty && (
                                  <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-bold truncate">
                                    {duty.label.replace('Trực ca ', '')}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              })()}
            </div>
          )
        ) : (
          <div className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-855 rounded-xl text-sm font-bold text-slate-800 dark:text-zinc-150 flex items-center justify-between">
            <span>
              {selectedAppointment.ten_ky_thuat_vien
                ? (targetRole === 'Bác sĩ'
                  ? `BS. ${selectedAppointment.ten_ky_thuat_vien}`
                  : `KTV. ${selectedAppointment.ten_ky_thuat_vien}`)
                : 'Chưa chỉ định'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Đã phân công</span>
          </div>
        )}
      </div>

      {/* 2. PHÒNG THỰC HIỆN (Đưa xuống dưới nhân sự) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {selectedAppointment.loai_lich === 'kham_moi' ? 'Phòng khám lâm sàng' : 'Phòng trị liệu'}
          </label>
        </div>
        <div className="w-full px-4 py-3.5 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-850 rounded-xl text-sm font-bold text-slate-800 dark:text-zinc-150 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-800 dark:text-zinc-100">{resolvedRoomName}</span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-extrabold">
              {resolvedRoom 
                ? (selectedAppointment.loai_lich === 'kham_moi' ? 'Tự động phân theo ca trực Bác sĩ' : 'Tự động phân theo ca trực KTV')
                : 'Chưa phân phòng'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
