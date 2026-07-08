import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Schedule, Staff, Room } from '../types';
import { useScheduleForm } from '../hooks/useScheduleForm';
import { getAvatarInitials } from '../constants';

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
    isDoctor,
    isTechnician,
    availableRoomsForRole,
    disabledShiftsForSelected,
    handleShiftTypeChange,
    fillFormForCreation,
    fillFormForEditing,
    onSubmit
  } = useScheduleForm({
    staff,
    rooms,
    schedules,
    editingSchedule,
    setSelectedShiftType,
    onSuccess
  });

  // Pre-fill form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (editingSchedule) {
      fillFormForEditing(editingSchedule);
    } else if (prefilledStaffId) {
      fillFormForCreation(prefilledStaffId, prefilledDate || undefined);
    }
  }, [isOpen, editingSchedule, prefilledStaffId, prefilledDate, fillFormForEditing, fillFormForCreation]);

  const selectedDate = watch('ngay');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">
            {editingSchedule ? 'Chỉnh sửa ca trực' : 'Phân công ca trực'}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1.5 shadow-sm border border-gray-100 transition-colors hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nhân sự</label>
              <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 flex items-center gap-3 select-none">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  {getAvatarInitials(selectedStaffName)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{selectedStaffName}</p>
                  <p className="text-xs text-teal-600 font-medium">{selectedStaffRole}</p>
                </div>
              </div>
              <input type="hidden" {...register('nguoi_dung_id')} />
              {errors.nguoi_dung_id && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.nguoi_dung_id.message}</p>}
            </div>

            {editingSchedule && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 select-none">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin ca trực hiện tại</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">KHUNG GIỜ LÀM:</span>
                    <p className="font-extrabold text-slate-800">
                      {editingSchedule.gio_bat_dau?.slice(0, 5)} - {editingSchedule.gio_ket_thuc?.slice(0, 5)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">PHÒNG & GIƯỜNG:</span>
                    <p className="font-extrabold text-slate-800">
                      {editingSchedule.ma_phong ? editingSchedule.ma_phong : 'Chưa gán phòng'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày trực *</label>
              <input 
                type="date" 
                disabled={isPastDate}
                {...register('ngay')} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm font-medium text-gray-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
              />
              {errors.ngay && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.ngay.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ca trực thiết lập *</label>
              <select 
                value={selectedShiftType} 
                disabled={isPastDate}
                onChange={e => handleShiftTypeChange(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-255 text-gray-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {!disabledShiftsForSelected.morning && (
                  <option value="morning">
                    🌅 Ca Sáng ({selectedStaffRole === 'Lễ tân' ? '07:00 - 12:00' : '07:00 - 16:00'})
                  </option>
                )}
                {!disabledShiftsForSelected.afternoon && (
                  <option value="afternoon">
                    ☀️ Ca Chiều ({selectedStaffRole === 'Lễ tân' ? '12:00 - 20:00' : '11:00 - 20:00'})
                  </option>
                )}
                <option value="tam_nghi">🌴 Nghỉ phép / Tạm nghỉ</option>
              </select>
            </div>

            {watch('trang_thai') === 'hoat_dong' && (isDoctor || isTechnician) && (
              <div>
                <label className="block text-sm font-bold mb-1.5 font-sans uppercase text-[11px] tracking-wider text-slate-500">
                  {isDoctor ? 'Phòng khám bệnh' : 'Phòng trị liệu'} *
                </label>
                <select
                  disabled={isPastDate}
                  {...register('phong_id', {
                    setValueAs: (v) => (v === "" ? null : Number(v))
                  })}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm font-bold text-gray-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.phong_id ? 'border-rose-300' : 'border-gray-200'}`}
                >
                  <option value="">
                    {isDoctor ? '-- Chọn phòng khám --' : '-- Chọn phòng trị liệu --'}
                  </option>
                  {availableRoomsForRole.map(r => (
                    <option key={r.id} value={r.id} disabled={r.isFull}>
                      {r.ten_phong} ({r.ma_phong}) ({r.occupancy || 0}/{r.suc_chua || 1}){r.isFull ? ' - Hết chỗ' : ''}
                    </option>
                  ))}
                </select>
                {errors.phong_id && (
                  <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.phong_id.message}</p>
                )}
              </div>
            )}
            
            {/* Hidden fields to save hours on submit */}
            <input type="hidden" {...register('gio_bat_dau')} />
            <input type="hidden" {...register('gio_ket_thuc')} />
            <input type="hidden" {...register('trang_thai')} />
          </div>

          {isPastDate && (
            <div className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl text-left select-none mb-4">
              ⚠️ Ca trực này ở ngày trong quá khứ nên chỉ cho phép xem thông tin.
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            {editingSchedule && !isPastDate ? (
              <button 
                type="button" 
                onClick={onDeleteSchedule} 
                className="px-4 py-2.5 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl font-bold text-sm transition-colors"
              >
                Xóa ca trực
              </button>
            ) : <div />}
            <div className="flex gap-3 ml-auto">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-sm transition-colors"
              >
                {isPastDate ? 'Đóng' : 'Hủy'}
              </button>
              {!isPastDate && (
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold text-sm transition-colors shadow-sm shadow-teal-600/20"
                >
                  {editingSchedule ? 'Cập nhật' : 'Lưu phân công'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
export default ScheduleFormModal;
