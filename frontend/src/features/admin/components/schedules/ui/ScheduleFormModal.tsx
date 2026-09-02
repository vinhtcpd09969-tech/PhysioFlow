import React, { useEffect, useState } from 'react';
import { X, Calendar, DoorOpen, Check, AlertCircle, Sun, Sunrise, Palmtree, ChevronDown, Sparkles } from 'lucide-react';
import { Schedule, Staff, Room, ScheduleFormValues } from '../types';
import { useScheduleForm } from '../hooks/useScheduleForm';
import { getAvatarInitials } from '../constants';
import { ConfirmDialog } from '../../../../../components/ConfirmDialog';

interface ScheduleFormModalProps {
  isOpen: boolean;
  staff: Staff[];
  rooms: Room[];
  schedules: Schedule[];
  editingSchedule: Schedule | null;
  prefilledStaffId: string | null;
  prefilledDate: string | null;
  selectedShiftType: 'morning' | 'afternoon' | 'tam_nghi';
  setSelectedShiftType: (type: 'morning' | 'afternoon' | 'tam_nghi') => void;
  onClose: () => void;
  onSuccess: () => void;
  onDeleteSchedule: () => void;
}

export function ScheduleFormModal({
  isOpen,
  staff,
  rooms,
  schedules,
  editingSchedule,
  prefilledStaffId,
  prefilledDate,
  selectedShiftType,
  setSelectedShiftType,
  onClose,
  onSuccess,
  onDeleteSchedule
}: ScheduleFormModalProps) {
  const {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    isDoctor,
    isTechnician,
    availableRoomsForRole,
    disabledShiftsForSelected,
    handleShiftTypeChange,
    fillFormForCreation,
    fillFormForEditing,
    validateForm,
    onSubmit
  } = useScheduleForm({
    staff,
    rooms,
    schedules,
    editingSchedule,
    setSelectedShiftType,
    onSuccess
  });

  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<ScheduleFormValues | null>(null);

  // Pre-fill form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setIsRoomDropdownOpen(false);
    if (editingSchedule) {
      fillFormForEditing(editingSchedule);
    } else if (prefilledStaffId) {
      fillFormForCreation(prefilledStaffId, prefilledDate || undefined);
    }
  }, [isOpen, editingSchedule, prefilledStaffId, prefilledDate, fillFormForEditing, fillFormForCreation]);

  const selectedDate = watch('ngay');
  const watchedPhongId = watch('phong_id');
  const todayDateStr = React.useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);
  const isPastDate = !!(selectedDate && selectedDate < todayDateStr);

  const currentUserId = watch('nguoi_dung_id');
  const selectedStaff = staff.find(s => s.id === currentUserId);
  const selectedStaffName = selectedStaff?.ho_ten || '';
  const selectedStaffRole = selectedStaff?.vai_tro || '';

  const selectedRoomObj = availableRoomsForRole.find(r => String(r.id) === String(watchedPhongId));

  const formatDateDisplay = (dStr?: string | null) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
  };

  const handleFormSubmit = async (data: ScheduleFormValues) => {
    if (!validateForm(data)) return;
    if (editingSchedule) {
      setPendingSubmitData(data);
      setIsUpdateConfirmOpen(true);
    } else {
      await onSubmit(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#0D9488] to-teal-700 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="size-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                {editingSchedule ? 'Chỉnh Sửa Ca Trực' : 'Phân Công Ca Trực'}
              </h3>
              <p className="text-[11px] text-teal-100 font-medium">Lập lịch trực y khoa OfficeCare</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto no-scrollbar">
          
          {/* Staff Banner Card */}
          <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/50 dark:from-teal-950/60 dark:to-emerald-950/40 border border-teal-100 dark:border-teal-900/60 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-teal-700/20">
                {getAvatarInitials(selectedStaffName)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{selectedStaffName}</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D9488] dark:text-teal-300">
                  <Sparkles size={11} /> {selectedStaffRole}
                </span>
              </div>
            </div>
            <input type="hidden" {...register('nguoi_dung_id')} />
          </div>

          {/* Date Picker Component */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
              Ngày Trực
            </label>
            <div className="relative">
              <input
                type="date"
                {...register('ngay')}
                disabled={isPastDate}
                min={todayDateStr}
                className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs rounded-2xl px-4 py-3 font-extrabold focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            {errors.ngay && (
              <p className="text-rose-500 text-xs mt-1 font-bold flex items-center gap-1">
                <AlertCircle size={12} /> {errors.ngay.message}
              </p>
            )}
          </div>

          {/* Shift Selection Radios */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
              Chọn Ca Làm Việc
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Ca Sáng */}
              <button
                type="button"
                disabled={isPastDate || disabledShiftsForSelected.morning}
                onClick={() => handleShiftTypeChange('morning')}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedShiftType === 'morning'
                    ? 'border-[#0D9488] bg-teal-50/60 dark:bg-teal-950/40 ring-2 ring-[#0D9488]/20 text-[#0D9488]'
                    : disabledShiftsForSelected.morning
                    ? 'border-slate-100 bg-slate-50 dark:bg-zinc-800/40 text-slate-300 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 bg-white dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Sunrise size={16} className={selectedShiftType === 'morning' ? 'text-[#0D9488]' : 'text-amber-500'} />
                  {selectedShiftType === 'morning' && (
                    <div className="size-4 rounded-full bg-[#0D9488] text-white flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-extrabold">Ca Sáng</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {selectedStaffRole === 'Lễ tân' ? '07:00 – 12:00' : '07:00 – 16:00'}
                  </div>
                </div>
              </button>

              {/* Ca Chiều */}
              <button
                type="button"
                disabled={isPastDate || disabledShiftsForSelected.afternoon}
                onClick={() => handleShiftTypeChange('afternoon')}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedShiftType === 'afternoon'
                    ? 'border-[#0D9488] bg-teal-50/60 dark:bg-teal-950/40 ring-2 ring-[#0D9488]/20 text-[#0D9488]'
                    : disabledShiftsForSelected.afternoon
                    ? 'border-slate-100 bg-slate-50 dark:bg-zinc-800/40 text-slate-300 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 bg-white dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Sun size={16} className={selectedShiftType === 'afternoon' ? 'text-[#0D9488]' : 'text-orange-500'} />
                  {selectedShiftType === 'afternoon' && (
                    <div className="size-4 rounded-full bg-[#0D9488] text-white flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-extrabold">Ca Chiều</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {selectedStaffRole === 'Lễ tân' ? '12:00 – 20:00' : '11:00 – 20:00'}
                  </div>
                </div>
              </button>

              {/* Tạm Nghỉ */}
              <button
                type="button"
                disabled={isPastDate}
                onClick={() => handleShiftTypeChange('tam_nghi')}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedShiftType === 'tam_nghi'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20 text-amber-800'
                    : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 bg-white dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Palmtree size={16} className={selectedShiftType === 'tam_nghi' ? 'text-amber-600' : 'text-slate-400'} />
                  {selectedShiftType === 'tam_nghi' && (
                    <div className="size-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-extrabold">Tạm Nghỉ</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">Nghỉ phép ca này</div>
                </div>
              </button>
            </div>
          </div>

          {/* Room Selector with Dropdown (Only for Doctor/Technician) */}
          {(isDoctor || isTechnician) && selectedShiftType !== 'tam_nghi' && (
            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Phân Phòng Làm Việc *
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  {isDoctor ? 'Phòng Khám Lượng Giá' : 'Phòng Trị Liệu'}
                </span>
              </div>

              {/* Custom Room Select Trigger Button */}
              <div className="relative">
                <button
                  type="button"
                  disabled={isPastDate}
                  onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
                  className={`w-full bg-slate-50 dark:bg-zinc-800/80 border rounded-2xl px-4 py-3 text-left flex justify-between items-center transition-all cursor-pointer ${
                    errors.phong_id 
                      ? 'border-rose-300 ring-2 ring-rose-500/10' 
                      : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 focus:border-[#0D9488]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <DoorOpen size={16} className="text-[#0D9488] shrink-0" />
                    {selectedRoomObj ? (
                      <div className="truncate">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                          {selectedRoomObj.ten_phong} ({selectedRoomObj.ma_phong})
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 ml-2">
                          • Sức chứa: {selectedRoomObj.suc_chua || 1} người
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">-- Chọn phòng làm việc trực tiếp --</span>
                    )}
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isRoomDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isRoomDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 max-h-56 overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150">
                    {availableRoomsForRole.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-bold">
                        Chưa có phòng phù hợp với vai trò này
                      </div>
                    ) : (
                      availableRoomsForRole.map((r: any) => {
                        const isSelected = String(r.id) === String(watchedPhongId);
                        const isFull = r.isFull;

                        return (
                          <button
                            key={r.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => {
                              setValue('phong_id', String(r.id), { shouldValidate: true });
                              setIsRoomDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex justify-between items-center transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0D9488]' 
                                : isFull
                                ? 'bg-slate-50/50 text-slate-300 dark:text-zinc-600 cursor-not-allowed opacity-60'
                                : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold">{r.ten_phong} ({r.ma_phong})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                isFull 
                                  ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              }`}>
                                {r.occupancy || 0}/{r.suc_chua || 1} {r.isFull ? '• Hết chỗ' : '• Trống'}
                              </span>
                              {isSelected && <Check size={12} className="text-[#0D9488]" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Hidden field registered for react-hook-form */}
              <input type="hidden" {...register('phong_id')} />
              {errors.phong_id && (
                <p className="text-rose-500 text-xs mt-1.5 font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.phong_id.message}
                </p>
              )}
            </div>
          )}

          {/* Hidden fields */}
          <input type="hidden" {...register('gio_bat_dau')} />
          <input type="hidden" {...register('gio_ket_thuc')} />
          <input type="hidden" {...register('trang_thai')} />

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-3">
            {editingSchedule && !isPastDate ? (
              <button 
                type="button" 
                onClick={() => setIsDeleteConfirmOpen(true)} 
                className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-extrabold text-xs transition-colors cursor-pointer"
              >
                Xóa Ca Trực
              </button>
            ) : <div />}
            
            <div className="flex gap-2.5 ml-auto">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-extrabold text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              {!isPastDate && (
                <button 
                  type="submit" 
                  className="px-6 py-2.5 text-white bg-[#0D9488] hover:bg-teal-700 rounded-xl font-extrabold text-xs transition-all shadow-md shadow-teal-700/20 cursor-pointer active:scale-98"
                >
                  {editingSchedule ? 'Cập Nhật Ca' : 'Lưu Phân Công'}
                </button>
              )}
            </div>
          </div>

        </form>
      </div>

      {/* Confirmation Dialog for Update */}
      <ConfirmDialog
        isOpen={isUpdateConfirmOpen}
        title="Xác nhận cập nhật ca trực"
        type="warning"
        confirmLabel="Xác nhận cập nhật"
        cancelLabel="Kiểm tra lại"
        message={
          <div className="space-y-2.5 text-left bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 text-xs w-full">
            <p className="text-slate-600 dark:text-zinc-300 font-medium pb-1">
              Bạn có chắc chắn muốn cập nhật phân công ca trực này không?
            </p>
            <div className="flex justify-between border-t border-slate-200/60 dark:border-zinc-700 pt-2">
              <span className="text-slate-500 dark:text-zinc-400">Nhân sự:</span>
              <strong className="text-slate-900 dark:text-zinc-100">{selectedStaffName}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 dark:border-zinc-700 pt-2">
              <span className="text-slate-500 dark:text-zinc-400">Ngày trực:</span>
              <strong className="text-slate-900 dark:text-zinc-100">{formatDateDisplay(selectedDate)}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 dark:border-zinc-700 pt-2">
              <span className="text-slate-500 dark:text-zinc-400">Ca làm việc:</span>
              <strong className="text-teal-700 dark:text-teal-400 font-bold">
                {selectedShiftType === 'morning' ? 'Ca Sáng (07:00 – 16:00)' : selectedShiftType === 'afternoon' ? 'Ca Chiều (11:00 – 20:00)' : 'Tạm nghỉ'}
              </strong>
            </div>
            {selectedRoomObj && selectedShiftType !== 'tam_nghi' && (
              <div className="flex justify-between border-t border-slate-200/60 dark:border-zinc-700 pt-2">
                <span className="text-slate-500 dark:text-zinc-400">Phòng trực:</span>
                <strong className="text-slate-900 dark:text-zinc-100">{selectedRoomObj.ten_phong} ({selectedRoomObj.ma_phong})</strong>
              </div>
            )}
          </div>
        }
        onConfirm={async () => {
          setIsUpdateConfirmOpen(false);
          if (pendingSubmitData) {
            await onSubmit(pendingSubmitData);
            setPendingSubmitData(null);
          }
        }}
        onCancel={() => {
          setIsUpdateConfirmOpen(false);
          setPendingSubmitData(null);
        }}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Xác nhận xóa ca trực"
        type="danger"
        confirmLabel="Xóa ca trực"
        cancelLabel="Hủy bỏ"
        message={
          <div className="space-y-2.5 text-left bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 text-xs w-full">
            <p className="text-rose-900 dark:text-rose-200 font-medium leading-relaxed pb-1">
              Bạn có chắc chắn muốn xóa ca trực này khỏi hệ thống không? Thao tác này sẽ xóa lịch trực đã xếp của nhân sự.
            </p>
            <div className="flex justify-between border-t border-rose-200/60 dark:border-rose-900/40 pt-2">
              <span className="text-slate-600 dark:text-zinc-400">Nhân sự:</span>
              <strong className="text-slate-900 dark:text-zinc-100">{selectedStaffName}</strong>
            </div>
            <div className="flex justify-between border-t border-rose-200/60 dark:border-rose-900/40 pt-2">
              <span className="text-slate-600 dark:text-zinc-400">Ngày trực:</span>
              <strong className="text-slate-900 dark:text-zinc-100">{formatDateDisplay(selectedDate)}</strong>
            </div>
            <div className="flex justify-between border-t border-rose-200/60 dark:border-rose-900/40 pt-2">
              <span className="text-slate-600 dark:text-zinc-400">Ca trực:</span>
              <strong className="text-rose-700 dark:text-rose-300 font-bold">
                {selectedShiftType === 'morning' ? 'Ca Sáng (07:00 – 16:00)' : selectedShiftType === 'afternoon' ? 'Ca Chiều (11:00 – 20:00)' : 'Tạm nghỉ'}
              </strong>
            </div>
          </div>
        }
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDeleteSchedule();
        }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
}

export default ScheduleFormModal;
