import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../../../stores/authStore';
import { 
  updateAppointmentStatus as updateAppointmentStatusAdmin,
  keepAliveAppointment as keepAliveAppointmentAdmin
} from '../../../api/admin.api';
import { 
  updateAppointmentStatus as updateAppointmentStatusRec,
  keepAliveAppointment as keepAliveAppointmentRec,
  resendEmail
} from '../../../../receptionist/api/receptionist.api';


// Import subcomponents
import { DetailHeader } from './DetailHeader';
import { TreatmentHistory } from './TreatmentHistory';
import { StaffRoomAllocation } from './StaffRoomAllocation';
import { SymptomNotes } from './SymptomNotes';
import { DetailFooter } from './DetailFooter';

interface AppointmentDetailModalProps {
  selectedAppointment: any;
  roomsList: any[];
  staffList: any[];
  activeRole: string;
  assignRoomId: string;
  setAssignRoomId: (val: string) => void;
  assignStaffId: string;
  setAssignStaffId: (val: string) => void;
  assignStatus: string;
  setAssignStatus: (val: string) => void;
  cancelReason?: string;
  setCancelReason?: (val: string) => void;
  isAssigning: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onOpenTreatment?: (type?: 'single' | 'package', recId?: string) => void;
  appointments?: any[];
  onSuccess?: () => void;
  schedulesList?: any[];
  hideBilling?: boolean;
  isReceptionistOverride?: boolean;
  selectedTimeSlot: string;
  setSelectedTimeSlot: (val: string) => void;
}

export default function AppointmentDetailModal({
  selectedAppointment,
  roomsList,
  staffList,
  activeRole: _activeRole,
  assignRoomId,
  setAssignRoomId,
  assignStaffId,
  setAssignStaffId,
  assignStatus,
  setAssignStatus,
  cancelReason: _cancelReason,
  setCancelReason,
  isAssigning,
  onClose,
  onSave,
  appointments = [],
  onSuccess,
  schedulesList = [],
  hideBilling = false,
  isReceptionistOverride,
  selectedTimeSlot,
  setSelectedTimeSlot
}: AppointmentDetailModalProps) {
  const { user } = useAuthStore();
  
  const isReceptionist = isReceptionistOverride !== undefined 
    ? isReceptionistOverride 
    : (Number(user?.vai_tro_id) === 2);
    
  const targetRole = selectedAppointment?.loai_lich === 'kham_moi' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const [localGhiChuNoiBo, setLocalGhiChuNoiBo] = useState<string>(selectedAppointment?.ghi_chu_noi_bo || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [showConfirmType, setShowConfirmType] = useState<'save' | 'cancel' | 'receptionist_confirm' | null>(null);
  const [customCancelReason, setCustomCancelReason] = useState<string>('');

  const resolvedRoom = roomsList.find(r => String(r.id) === String(assignRoomId));
  const resolvedRoomName = resolvedRoom?.ten_phong || selectedAppointment.ten_phong || 'Chưa chỉ định';
  const isUnconfirmedState = isReceptionist && ['cho_xac_nhan', 'chua_xac_nhan'].includes(selectedAppointment.trang_thai);

  const handleResendEmail = async () => {
    setIsSendingEmail(true);
    const toastId = toast.loading('Đang gửi lại email xác nhận...');
    try {
      await resendEmail(selectedAppointment.id);
      toast.success('Đã gửi lại email xác nhận thành công!', { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Không thể gửi lại email xác nhận.', { id: toastId });
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    setLocalGhiChuNoiBo(selectedAppointment?.ghi_chu_noi_bo || '');
  }, [selectedAppointment]);

  // Keep-alive heartbeat effect
  useEffect(() => {
    if (
      selectedAppointment &&
      !selectedAppointment.bac_si_id &&
      !selectedAppointment.chuyen_gia_id &&
      ['cho_xac_nhan', 'chua_xac_nhan'].includes(selectedAppointment.trang_thai) &&
      false
    ) {
      const sendKeepAlive = async () => {
        try {
          await (isReceptionist ? keepAliveAppointmentRec : keepAliveAppointmentAdmin)(selectedAppointment.id);
          console.log('[Keep-Alive] Đã gia hạn giữ chỗ lịch hẹn thêm 5 phút');
          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error('[Keep-Alive] Lỗi khi gia hạn giữ chỗ:', error);
        }
      };

      sendKeepAlive();
      const interval = setInterval(sendKeepAlive, 3 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [selectedAppointment, onSuccess]);

  if (!selectedAppointment) return null;

  // Logic kiểm tra trùng lịch (Overlap)
  const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 < e2 && e1 > s2;
  };

  const appendCallLog = (logText: string) => {
    const vnTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const newLog = `[${vnTimeStr}] ${logText}\n`;
    setLocalGhiChuNoiBo(prev => prev + newLog);
  };

  const currentStart = selectedAppointment.ngay_gio_bat_dau;
  const currentEnd = selectedAppointment.ngay_gio_ket_thuc;
  const durationMs = new Date(currentEnd).getTime() - new Date(currentStart).getTime();

  // Phân tích ca trực của nhân viên ngày hôm nay
  const aptDate = new Date(selectedAppointment.ngay_gio_bat_dau);
  const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
  
  const getLocalTimeStr = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const aptStartHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_bat_dau);
  const aptEndHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_ket_thuc);

  // States for dynamic slot-driven clinical times
  const [newStartHourStr, setNewStartHourStr] = useState<string>(aptStartHourStr);
  const [newEndHourStr, setNewEndHourStr] = useState<string>(aptEndHourStr);

  useEffect(() => {
    if (!selectedTimeSlot) return;
    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    const end = new Date(date.getTime() + durationMs);
    setNewStartHourStr(selectedTimeSlot);
    setNewEndHourStr(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
  }, [selectedTimeSlot, durationMs]);

  // Check overlap for the newly selected slot
  const getIsoStringForTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(selectedAppointment.ngay_gio_bat_dau);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const newStartIso = getIsoStringForTime(selectedTimeSlot);
  const newEndIso = new Date(new Date(newStartIso).getTime() + durationMs).toISOString();

  const overlappingApts = appointments.filter(apt => 
    apt.id !== selectedAppointment.id && 
    apt.trang_thai !== 'da_huy' &&
    apt.trang_thai !== 'khong_den' &&
    isOverlapping(newStartIso, newEndIso, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
  );

  const occupiedStaffIds = overlappingApts.map(apt => apt.bac_si_id || apt.chuyen_gia_id).filter(Boolean);

  // Tự động phân phòng dựa trên ca trực của nhân viên khi gán
  useEffect(() => {
    if (!assignStaffId) return;

    const staffSchedule = (schedulesList || []).find(s => 
      String(s.nguoi_dung_id) === String(assignStaffId) &&
      s.ngay === aptDateStr &&
      s.trang_thai === 'hoat_dong' &&
      s.gio_bat_dau.substring(0, 5) <= newStartHourStr &&
      s.gio_ket_thuc.substring(0, 5) >= newEndHourStr
    );

    if (staffSchedule && staffSchedule.phong_id) {
      setAssignRoomId(String(staffSchedule.phong_id));
    }
  }, [assignStaffId, schedulesList, aptDateStr, newStartHourStr, newEndHourStr, setAssignRoomId]);

  // Helper check availability of a staff on a custom time slot
  const checkStaffAvailability = (staffId: string | number, slotStartStr: string) => {
    if (!staffId) return true;

    // 1. Check working schedule shift
    if (schedulesList && schedulesList.length > 0) {
      const staffSchedules = schedulesList.filter(s => 
        String(s.nguoi_dung_id) === String(staffId) && 
        s.ngay === aptDateStr &&
        s.trang_thai === 'hoat_dong'
      );
      
      if (staffSchedules.length === 0) return false;

      const activeSchedule = staffSchedules[0];
      const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
      const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

      const [startH, startM] = slotStartStr.split(':').map(Number);
      const startDate = new Date(2000, 0, 1, startH, startM);
      const endDate = new Date(startDate.getTime() + durationMs);
      const slotEndStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      const isWithinShift = dutyStart <= slotStartStr && dutyEnd >= slotEndStr;
      if (!isWithinShift) return false;
    }

    // 2. Check overlap with other appointments
    const [startH, startM] = slotStartStr.split(':').map(Number);
    const targetStart = new Date(2000, 0, 1, startH, startM).getTime();
    const targetEnd = targetStart + durationMs;

    const overlap = appointments.some(apt => {
      if (String(apt.id) === String(selectedAppointment.id)) return false;
      if (['da_huy', 'khong_den'].includes(apt.trang_thai)) return false;

      const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
      if (!assignedId || String(assignedId) !== String(staffId)) return false;

      const aptD = new Date(apt.ngay_gio_bat_dau);
      const aptDStr = `${aptD.getFullYear()}-${String(aptD.getMonth() + 1).padStart(2, '0')}-${String(aptD.getDate()).padStart(2, '0')}`;
      if (aptDStr !== aptDateStr) return false;

      const aptS = new Date(apt.ngay_gio_bat_dau);
      const aptSStr = `${String(aptS.getHours()).padStart(2, '0')}:${String(aptS.getMinutes()).padStart(2, '0')}`;
      const [aptSH, aptSM] = aptSStr.split(':').map(Number);
      const aptSMs = new Date(2000, 0, 1, aptSH, aptSM).getTime();
      
      const aptE = new Date(apt.ngay_gio_ket_thuc);
      const aptEStr = `${String(aptE.getHours()).padStart(2, '0')}:${String(aptE.getMinutes()).padStart(2, '0')}`;
      const [aptEH, aptEM] = aptEStr.split(':').map(Number);
      const aptEMs = new Date(2000, 0, 1, aptEH, aptEM).getTime();

      return targetStart < aptEMs && targetEnd > aptSMs;
    });

    return !overlap;
  };

  const currentStaff = staffList.find(s => String(s.id) === String(assignStaffId));
  const currentStaffName = currentStaff ? currentStaff.ho_ten : 'nhân sự';
  const isStaffUnavailable = assignStaffId ? !checkStaffAvailability(assignStaffId, selectedTimeSlot) : false;

  const now = new Date();
  const isToday = aptDateStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const generateDynamicSlots = () => {
    const intervalMins = Math.round(durationMs / 60000);
    
    const generateBlock = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      const blockSlots: string[] = [];
      const current = new Date();
      current.setHours(startHour, startMinute, 0, 0);

      const end = new Date();
      end.setHours(endHour, endMinute, 0, 0);

      while (true) {
        const slotNextStart = new Date(current.getTime() + intervalMins * 60000);
        if (slotNextStart.getTime() > end.getTime()) {
          break;
        }

        const formatTime = (d: Date) => {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };

        blockSlots.push(formatTime(current));
        current.setTime(slotNextStart.getTime());
      }
      return blockSlots;
    };

    return [
      ...generateBlock(8, 0, 12, 0),
      ...generateBlock(12, 0, 18, 0),
      ...generateBlock(18, 0, 20, 0)
    ];
  };

  const dynamicTimeSlots = generateDynamicSlots();

  const isSlotAllowed = (slot: string) => {
    if (slot === aptStartHourStr) return true;
    if (isToday) {
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      const slotTime = new Date(now);
      slotTime.setHours(slotHour, slotMinute, 0, 0);
      
      const diffMins = (slotTime.getTime() - now.getTime()) / (1000 * 60);
      if (diffMins < 60) return false;
    }
    return true;
  };

  const receptionistTimeSlots = dynamicTimeSlots.filter(slot => 
    slot === aptStartHourStr || (
      isSlotAllowed(slot) && 
      checkStaffAvailability(assignStaffId, slot)
    )
  );

  const adminTimeSlots = dynamicTimeSlots.filter(slot => 
    slot === aptStartHourStr || isSlotAllowed(slot)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!['da_huy', 'khong_den', 'chua_xac_nhan', 'cho_xac_nhan', 'cho_huy'].includes(assignStatus)) {
      if (!assignRoomId) {
        toast.error('Vui lòng chọn phòng thực hiện!');
        return;
      }
      if (!assignStaffId) {
        toast.error(
          targetRole === 'Bác sĩ' 
            ? 'Vui lòng chọn Bác sĩ phụ trách!' 
            : 'Vui lòng chọn Kỹ thuật viên phụ trách!'
        );
        return;
      }
    }

    if (isStaffUnavailable) {
      toast.error(`Khung giờ này nhân sự ${currentStaffName} không đáp ứng được. Vui lòng chọn nhân sự khác hoặc đổi giờ!`);
      return;
    }

    if (assignStatus === 'da_huy') {
      setShowConfirmType('cancel');
    } else {
      setShowConfirmType('save');
    }
  };

  const handleConfirmAction = async () => {
    if (showConfirmType === 'receptionist_confirm') {
      setShowConfirmType(null);
      const toastId = toast.loading('Đang cập nhật trạng thái...');
      try {
        // Compute new start/end date times
        let finalNgayGioBatDau: string | null = null;
        let finalNgayGioKetThuc: string | null = null;
        const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
        const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
        const newStart = new Date(origStart);
        newStart.setHours(hours, minutes, 0, 0);
        const newEnd = new Date(newStart.getTime() + durationMs);

        if (newStart.getTime() !== origStart.getTime()) {
          finalNgayGioBatDau = newStart.toISOString();
          finalNgayGioKetThuc = newEnd.toISOString();
        }

        const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
        await updateFn(selectedAppointment.id, {
          trang_thai: 'cho_xac_nhan',
          ghi_chu_noi_bo: localGhiChuNoiBo,
          ...(finalNgayGioBatDau && { ngay_gio_bat_dau: finalNgayGioBatDau }),
          ...(finalNgayGioKetThuc && { ngay_gio_ket_thuc: finalNgayGioKetThuc })
        });
        toast.success('Đã xác nhận lịch hẹn thành công!', { id: toastId });
        onClose();
        if (onSuccess) onSuccess();
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái', { id: toastId });
      }
    } else if (showConfirmType === 'cancel') {
      const trimmedReason = customCancelReason.trim();
      if (!trimmedReason) {
        toast.error('Vui lòng nhập lý do hủy lịch!');
        return;
      }
      setShowConfirmType(null);
      setCustomCancelReason('');

      if (isReceptionist) {
        const toastId = toast.loading('Đang hủy lịch...');
        try {
          // Compute new start/end date times
          let finalNgayGioBatDau: string | null = null;
          let finalNgayGioKetThuc: string | null = null;
          const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
          const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
          const newStart = new Date(origStart);
          newStart.setHours(hours, minutes, 0, 0);
          const newEnd = new Date(newStart.getTime() + durationMs);

          if (newStart.getTime() !== origStart.getTime()) {
            finalNgayGioBatDau = newStart.toISOString();
            finalNgayGioKetThuc = newEnd.toISOString();
          }

          const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
          await updateFn(selectedAppointment.id, {
            trang_thai: 'da_huy',
            ghi_chu_noi_bo: localGhiChuNoiBo,
            ly_do_huy: trimmedReason,
            ...(finalNgayGioBatDau && { ngay_gio_bat_dau: finalNgayGioBatDau }),
            ...(finalNgayGioKetThuc && { ngay_gio_ket_thuc: finalNgayGioKetThuc })
          });
          toast.success('Đã hủy lịch hẹn thành công!', { id: toastId });
          onClose();
          if (onSuccess) onSuccess();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || 'Lỗi khi hủy lịch hẹn', { id: toastId });
        }
      } else {
        if (setCancelReason) {
          setCancelReason(trimmedReason);
        }
        setTimeout(() => {
          onSave({ preventDefault: () => {} } as React.FormEvent);
        }, 0);
      }
    } else if (showConfirmType === 'save') {
      setShowConfirmType(null);
      onSave({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-955/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
        className="bg-white dark:bg-zinc-900 rounded-[32px] max-w-xl w-full flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden border border-slate-100 dark:border-zinc-800/80 transition-colors duration-300 max-h-[90vh] relative"
      >
        {/* Custom Confirmation Dialog Overlay */}
        {showConfirmType && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-zinc-800 text-center space-y-4"
            >
              <div className="size-12 rounded-full bg-amber-50 dark:bg-amber-955/30 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
                {showConfirmType === 'cancel' ? '⚠️' : '❓'}
              </div>
              
              <div className="space-y-1.5">
                <h5 className="font-extrabold text-sm text-slate-800 dark:text-zinc-150 uppercase tracking-wide">
                  {showConfirmType === 'cancel' ? 'Hủy lịch hẹn' : 'Xác nhận thay đổi'}
                </h5>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {showConfirmType === 'cancel' 
                    ? 'Bạn có chắc chắn muốn hủy lịch hẹn này không? Vui lòng nhập lý do bên dưới:'
                    : showConfirmType === 'receptionist_confirm'
                      ? 'Bạn có chắc chắn muốn xác nhận lịch hẹn này không?'
                      : 'Bạn có chắc chắn muốn lưu thay đổi của lịch hẹn này không?'}
                </p>
              </div>

              {showConfirmType === 'cancel' && (
                <textarea
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy lịch tại đây..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-250 dark:border-zinc-850 rounded-xl text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold"
                />
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmType(null);
                    setCustomCancelReason('');
                  }}
                  className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-855 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`flex-1 py-2 text-white text-xs font-bold rounded-xl transition-colors ${
                    showConfirmType === 'cancel' 
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Đồng ý
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <DetailHeader
          maLichDat={selectedAppointment.ma_lich_dat}
          tenKhachHang={selectedAppointment.ten_khach_hang}
          soDienThoai={selectedAppointment.so_dien_thoai}
          ngayGioBatDau={selectedAppointment.ngay_gio_bat_dau}
          aptStartHourStr={aptStartHourStr}
          aptEndHourStr={aptEndHourStr}
          onClose={onClose}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
          timeSlotsList={isReceptionist ? receptionistTimeSlots : adminTimeSlots}
          durationMs={durationMs}
          tenDichVu={selectedAppointment.ten_dich_vu}
        />

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            <TreatmentHistory
              loaiLich={selectedAppointment.loai_lich}
              chanDoan={selectedAppointment.chan_doan}
              chongChiDinh={selectedAppointment.chong_chi_dinh}
            />

            {/* Warning Message if selected staff is unavailable */}
            {isStaffUnavailable && (
              <div className="text-xs text-rose-700 dark:text-rose-455 font-medium leading-relaxed bg-rose-50 dark:bg-rose-955/10 p-3 rounded-xl border border-rose-150 dark:border-rose-900/30 flex items-start gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                <span>⚠️</span>
                <span>
                  Khung giờ này nhân sự <strong>{currentStaffName}</strong> không đáp ứng được (trùng lịch khác hoặc ngoài ca trực). Vui lòng chọn nhân sự khác hoặc đổi giờ!
                </span>
              </div>
            )}

            <SymptomNotes
              selectedAppointment={selectedAppointment}
              isUnconfirmedState={isUnconfirmedState}
              isSendingEmail={isSendingEmail}
              handleResendEmail={handleResendEmail}
              appendCallLog={appendCallLog}
              localGhiChuNoiBo={localGhiChuNoiBo}
              setLocalGhiChuNoiBo={setLocalGhiChuNoiBo}
            />

            {!isReceptionist && (
              <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Trạng thái lịch hẹn (Quản lý)
                </label>
                <select
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="chua_xac_nhan">Chưa xác nhận</option>
                  <option value="cho_xac_nhan">Chờ gán nhân sự (Chờ xác nhận)</option>
                  <option value="da_xac_nhan">Đã xác nhận</option>
                  <option value="da_checkin">Đã check-in</option>
                  <option value="dang_kham">Đang khám</option>
                  <option value="hoan_thanh">Hoàn thành</option>
                  <option value="da_huy">Đã hủy</option>
                  <option value="khong_den">Không đến</option>
                </select>
              </div>
            )}

            <StaffRoomAllocation
              selectedAppointment={selectedAppointment}
              resolvedRoomName={resolvedRoomName}
              resolvedRoom={resolvedRoom}
              targetRole={targetRole}
              assignStaffId={assignStaffId}
              setAssignStaffId={setAssignStaffId}
              assignStatus={assignStatus}
              isReceptionist={isReceptionist}
              staffList={staffList}
              schedulesList={schedulesList}
              aptDateStr={aptDateStr}
              aptStartHourStr={newStartHourStr}
              aptEndHourStr={newEndHourStr}
              occupiedStaffIds={occupiedStaffIds}
            />
          </div>

          {/* Fixed Footer */}
          <div className="p-6 bg-slate-50/30 dark:bg-zinc-900/30 border-t border-slate-100 dark:border-zinc-800/80">
            <DetailFooter
              selectedAppointment={selectedAppointment}
              isReceptionist={isReceptionist}
              hideBilling={hideBilling}
              isAssigning={isAssigning}
              onClose={onClose}
              onSuccess={onSuccess}
              assignStaffId={assignStaffId}
              assignRoomId={assignRoomId}
              localGhiChuNoiBo={localGhiChuNoiBo}
              isUnconfirmedState={isUnconfirmedState}
              setAssignStatus={setAssignStatus}
              setCancelReason={setCancelReason}
              setShowConfirmType={setShowConfirmType}
            />
          </div>
        </form>
      </motion.div>
    </div>
  );
}
