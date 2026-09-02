import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuthStore } from '../../../../stores/authStore';
import {
  updateAppointmentStatus as updateAppointmentStatusAdmin,
  getStaffBudgetForBuoi
} from '../../../../features/admin/api/admin.api';
import {
  updateAppointmentStatus as updateAppointmentStatusRec,
  resendEmail,
  unassignAppointmentStaff
} from '../../../../features/receptionist/api/receptionist.api';
import { StatusHistoryModal } from '../StatusHistoryModal';
import { getReceptionistActionOptions, getReceptionistAllowedTargets, hasAssignedStaff, isReceptionistLockedStatus } from './receptionistStatusRules';

// Import subcomponents
import { DetailHeader } from './DetailHeader';
import { StaffRoomAllocation } from './StaffRoomAllocation';
import { SymptomNotes } from './SymptomNotes';
import { DetailFooter } from './DetailFooter';
import { DetailConfirmationModal } from './DetailConfirmationModal';
import { RescheduleSection, BUOI_INFO } from './RescheduleSection';
import { StatusAndBillingSection } from './StatusAndBillingSection';

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
  onSave: (e: React.FormEvent, note?: string) => void;
  appointments?: any[];
  onSuccess?: () => void;
  schedulesList?: any[];
  hideBilling?: boolean;
  isReceptionistOverride?: boolean;
  selectedBuoi: 'sang' | 'chieu' | '';
  setSelectedBuoi: (val: 'sang' | 'chieu' | '') => void;
  rescheduleDate: string;
  setRescheduleDate: (val: string) => void;
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
  hideBilling: _hideBilling = false,
  isReceptionistOverride,
  selectedBuoi,
  setSelectedBuoi,
  rescheduleDate,
  setRescheduleDate
}: AppointmentDetailModalProps) {
  const { user } = useAuthStore();
  
  const isReceptionist = isReceptionistOverride !== undefined 
    ? isReceptionistOverride 
    : (Number(user?.vai_tro_id) === 2);
    
  const targetRole = selectedAppointment?.loai_lich === 'kham_moi' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const [localGhiChuNoiBo, setLocalGhiChuNoiBo] = useState<string>(selectedAppointment?.ghi_chu_noi_bo || '');
  const [rescheduleError, setRescheduleError] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsEditingStatus(false);
  }, [selectedAppointment]);

  const handleNoteChange = (val: string) => {
    setLocalGhiChuNoiBo(val);
    if (val.trim()) {
      setRescheduleError('');
    }
  };

  const handleStatusChange = (val: string) => {
    setAssignStatus(val);
    setRescheduleError('');
  };

  const handleUndoStatusChange = () => {
    setAssignStatus(selectedAppointment.trang_thai);
    setRescheduleError('');
  };

  const [showConfirmType, setShowConfirmType] = useState<'save' | 'cancel' | null>(null);
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const resolvedRoom = roomsList.find(r => String(r.id) === String(assignRoomId));
  const resolvedRoomName = resolvedRoom?.ten_phong || selectedAppointment.ten_phong || 'Chưa chỉ định';
  const staffAssigned = hasAssignedStaff(selectedAppointment);
  const isReceptionistLocked = isReceptionist && isReceptionistLockedStatus(selectedAppointment.trang_thai);
  const receptionistActionOptions = getReceptionistActionOptions(selectedAppointment.trang_thai, staffAssigned);

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

  if (!selectedAppointment) return null;

  const appendCallLog = (logText: string) => {
    const vnTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const newLog = `[${vnTimeStr}] ${logText}\n`;
    setLocalGhiChuNoiBo(prev => prev + newLog);
  };

  const currentStart = selectedAppointment.ngay_gio_bat_dau;
  const currentEnd = selectedAppointment.ngay_gio_ket_thuc;
  const durationMs = new Date(currentEnd).getTime() - new Date(currentStart).getTime();

  const checkStaffOnDutyForBuoi = (staffId: string | number, dateStr: string, buoi: 'sang' | 'chieu') => {
    if (!staffId || !schedulesList || schedulesList.length === 0) return true;
    const window = BUOI_INFO[buoi];
    return schedulesList.some(s =>
      String(s.nguoi_dung_id) === String(staffId) &&
      s.ngay === dateStr &&
      s.trang_thai === 'hoat_dong' &&
      s.gio_bat_dau.substring(0, 5) < window.ketThuc &&
      s.gio_ket_thuc.substring(0, 5) > window.batDau
    );
  };

  const checkStaffBusyForBuoi = (staffId: string | number, dateStr: string, buoi: 'sang' | 'chieu') => {
    if (!staffId) return false;
    return appointments.some(apt => {
      if (String(apt.id) === String(selectedAppointment.id)) return false;
      if (apt.trang_thai !== 'dang_kham') return false;
      const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
      if (!assignedId || String(assignedId) !== String(staffId)) return false;
      if (apt.buoi !== buoi) return false;
      const aptD = new Date(apt.ngay_gio_bat_dau);
      const aptDStr = `${aptD.getFullYear()}-${String(aptD.getMonth() + 1).padStart(2, '0')}-${String(aptD.getDate()).padStart(2, '0')}`;
      return aptDStr === dateStr;
    });
  };

  const checkStaffAvailableForBuoi = (staffId: string | number, dateStr: string, buoi: 'sang' | 'chieu' | '') => {
    if (!staffId || !buoi) return true;
    return checkStaffOnDutyForBuoi(staffId, dateStr, buoi) && !checkStaffBusyForBuoi(staffId, dateStr, buoi);
  };

  const getLocalTimeStr = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const aptStartHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_bat_dau);
  const aptEndHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_ket_thuc);

  const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
  const origDateStr = format(origStart, 'yyyy-MM-dd');
  const isRescheduled = !!(selectedBuoi && rescheduleDate && (selectedBuoi !== selectedAppointment.buoi || rescheduleDate !== origDateStr));
  const isStatusChanged = assignStatus !== selectedAppointment.trang_thai;
  const isCancelledOrNoShowStatus = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(assignStatus);
  const origStaffId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id || '';
  const currentStaffId = assignStaffId || '';
  const isStaffChanged = String(currentStaffId) !== String(origStaffId);
  const isNoteRequired = isRescheduled || isStaffChanged || isCancelledOrNoShowStatus || (isReceptionist && isStatusChanged);

  const effectiveBuoi: 'sang' | 'chieu' = (selectedBuoi || selectedAppointment.buoi || 'sang') as 'sang' | 'chieu';
  const newStartHourStr = BUOI_INFO[effectiveBuoi].batDau;
  const newEndHourStr = BUOI_INFO[effectiveBuoi].ketThuc;

  useEffect(() => {
    if (isReceptionist || !selectedBuoi || !assignStaffId) return;
    if (!checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi)) {
      setAssignStaffId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuoi, rescheduleDate]);

  const isReassignAllowed = !isReceptionist
    ? !['hoan_thanh', 'da_huy'].includes(assignStatus)
    : ['da_xac_nhan', 'da_checkin', 'dang_kham'].includes(selectedAppointment.trang_thai);

  const [staffBudget, setStaffBudget] = useState<Record<string, { conLai: number; soKhachSongSong: number }> | null>(null);
  useEffect(() => {
    if (isReceptionist || !effectiveBuoi || !rescheduleDate) {
      setStaffBudget(null);
      return;
    }
    let cancelled = false;
    getStaffBudgetForBuoi(rescheduleDate, effectiveBuoi, selectedAppointment.loai_lich, selectedAppointment.id)
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, { conLai: number; soKhachSongSong: number }> = {};
        (res.data || []).forEach((s: any) => {
          map[String(s.nhanSuId)] = { conLai: s.conLai, soKhachSongSong: s.soKhachSongSong };
        });
        setStaffBudget(map);
      })
      .catch(() => { if (!cancelled) setStaffBudget(null); });
    return () => { cancelled = true; };
  }, [isReceptionist, effectiveBuoi, rescheduleDate, selectedAppointment.loai_lich, selectedAppointment.id]);

  useEffect(() => {
    if (!assignStaffId) return;

    const staffSchedule = (schedulesList || []).find(s =>
      String(s.nguoi_dung_id) === String(assignStaffId) &&
      s.ngay === rescheduleDate &&
      s.trang_thai === 'hoat_dong' &&
      s.gio_bat_dau.substring(0, 5) < newEndHourStr &&
      s.gio_ket_thuc.substring(0, 5) > newStartHourStr
    );

    if (staffSchedule && staffSchedule.phong_id) {
      setAssignRoomId(String(staffSchedule.phong_id));
    } else if (!assignRoomId && roomsList && roomsList.length > 0) {
      const matchingRoom = roomsList.find(r =>
        selectedAppointment.loai_lich === 'kham_moi'
          ? (r.loai_phong === 'phong_kham' || r.loai_phong === 'phong_luong_gia')
          : (r.loai_phong === 'phong_tri_lieu' || r.loai_phong === 'phong_dieu_tri')
      );
      if (matchingRoom) {
        setAssignRoomId(String(matchingRoom.id));
      }
    }
  }, [assignStaffId, schedulesList, rescheduleDate, newStartHourStr, newEndHourStr, setAssignRoomId, assignRoomId, roomsList, selectedAppointment.loai_lich]);

  const currentStaff = staffList.find(s => String(s.id) === String(assignStaffId));
  const currentStaffName = currentStaff ? currentStaff.ho_ten : 'nhân sự';

  const isCurrentStaffUnavailableAtNewSlot = !!(selectedBuoi && assignStaffId && !checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi));
  const isStaffUnavailable = !!(selectedBuoi && assignStaffId) && !checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi);

  const now = new Date();
  const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = rescheduleDate === todayLocalStr;

  const isBuoiAllowed = (buoi: 'sang' | 'chieu') => {
    const isOrigBuoiDate = buoi === selectedAppointment.buoi && rescheduleDate === origDateStr;
    if (isOrigBuoiDate) return true;
    if (!isToday) return true;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = BUOI_INFO[buoi].ketThuc.split(':').map(Number);
    return nowMinutes < h * 60 + m;
  };

  const getBuoiStaffCount = (buoi: 'sang' | 'chieu', dateStr: string) => {
    let staffToFilter = targetRole === 'Bác sĩ'
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    const assignedStaffId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id;
    if (isReceptionist && assignedStaffId) {
      staffToFilter = staffToFilter.filter(s => String(s.id) === String(assignedStaffId));
    }

    return staffToFilter.filter(doc => checkStaffAvailableForBuoi(doc.id, dateStr, buoi)).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReceptionist && isReceptionistLocked) {
      toast.error('Không thể thay đổi trạng thái của ca hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc!');
      return;
    }
    if (isReceptionist && isStatusChanged) {
      const allowedTargets = getReceptionistAllowedTargets(selectedAppointment.trang_thai, staffAssigned);
      if (!allowedTargets.includes(assignStatus)) {
        toast.error('Lễ tân không có quyền chuyển lịch hẹn sang trạng thái này!');
        return;
      }
    }
    
    if (isNoteRequired) {
      const currentNote = localGhiChuNoiBo.trim();
      const dbNote = (selectedAppointment.ghi_chu_noi_bo || '').trim();

      const triggerValidationError = (msg: string) => {
        setRescheduleError(msg);
        setTimeout(() => {
          noteTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          noteTextareaRef.current?.focus();
        }, 50);
      };

      if (!currentNote) {
        triggerValidationError('Vui lòng nhập ghi chú nội bộ mới cho hành động này!');
        return;
      }
      if (dbNote && currentNote === dbNote) {
        triggerValidationError('Vui lòng nhập ghi chú mới (không được trùng với nội dung ghi chú cũ)!');
        return;
      }
    }
    
    if (isCurrentStaffUnavailableAtNewSlot && isReceptionist) {
      setAssignStaffId('');
      setAssignStatus('da_xac_nhan');
    }

    const currentStaffIdToCheck = isCurrentStaffUnavailableAtNewSlot && isReceptionist ? '' : assignStaffId;

    if (!['da_huy', 'khong_den', 'cho_huy'].includes(assignStatus)) {
      if (['dang_kham', 'hoan_thanh'].includes(assignStatus)) {
        if (!currentStaffIdToCheck) {
          toast.error(
            targetRole === 'Bác sĩ' 
              ? 'Vui lòng chọn Chuyên viên tư vấn phụ trách!' 
              : 'Vui lòng chọn Kỹ thuật viên phụ trách!'
          );
          return;
        }
        if (!assignRoomId) {
          toast.error('Vui lòng chọn phòng thực hiện!');
          return;
        }
      }
    }

    if (isStaffUnavailable && isReceptionist && !isCurrentStaffUnavailableAtNewSlot) {
      toast.error(`Khung giờ này nhân sự ${currentStaffName} không đáp ứng được. Vui lòng chọn nhân sự khác hoặc đổi giờ!`);
      return;
    }

    if (assignStatus === 'da_huy' && (!localGhiChuNoiBo || !localGhiChuNoiBo.trim())) {
      setShowConfirmType('cancel');
    } else {
      setShowConfirmType('save');
    }
  };

  const handleConfirmAction = async () => {
    if (showConfirmType === 'cancel') {
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
          const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
          await updateFn(selectedAppointment.id, {
            trang_thai: 'da_huy',
            ghi_chu_noi_bo: localGhiChuNoiBo || trimmedReason || null
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
          onSave({ preventDefault: () => {} } as React.FormEvent, localGhiChuNoiBo);
        }, 0);
      }
    } else if (showConfirmType === 'save') {
      setShowConfirmType(null);
      
      if (isCurrentStaffUnavailableAtNewSlot && isReceptionist) {
        setAssignStaffId('');
        setAssignStatus('da_xac_nhan');
      }

      setTimeout(() => {
        onSave({ preventDefault: () => {} } as React.FormEvent, localGhiChuNoiBo);
      }, 50);
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const maxDateStr = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
        className={`bg-white dark:bg-zinc-900 rounded-[28px] w-full flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200/90 dark:border-zinc-800 transition-all duration-300 max-h-[92vh] relative ${isRescheduling ? 'max-w-6xl' : 'max-w-4xl'}`}
      >
        {/* Custom Confirmation Dialog Overlay */}
        <DetailConfirmationModal
          showConfirmType={showConfirmType}
          setShowConfirmType={setShowConfirmType}
          customCancelReason={customCancelReason}
          setCustomCancelReason={setCustomCancelReason}
          assignStatus={assignStatus}
          isStatusChanged={isStatusChanged}
          isRescheduled={isRescheduled}
          onConfirm={handleConfirmAction}
        />

        {/* Top Close Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden pt-3">
          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 md:grid md:grid-cols-12 md:gap-6 space-y-5 md:space-y-0 scrollbar-thin">
            
            {/* Left Column - Dossier & Allocation */}
            <div className={`${isRescheduling ? 'md:col-span-7' : 'md:col-span-12'} space-y-5 overflow-y-visible`}>
              
              {/* 1. THÔNG TIN LỊCH HẸN */}
              <DetailHeader
                maLichDat={selectedAppointment.ma_lich_dat}
                tenKhachHang={selectedAppointment.ten_khach_hang}
                soDienThoai={selectedAppointment.so_dien_thoai || selectedAppointment.sdt_khach_hang}
                ngayGioBatDau={selectedAppointment.ngay_gio_bat_dau}
                aptStartHourStr={aptStartHourStr}
                aptEndHourStr={aptEndHourStr}
                durationMs={durationMs}
                thoiLuongPhut={Number(selectedAppointment.thoi_luong_phut) || (selectedAppointment as any).thoi_luong || (selectedAppointment as any).thoi_luong_buoi_phut || 0}
                tenDichVu={selectedAppointment.ten_dich_vu}
                soThuTuBuoi={selectedAppointment.so_thu_tu_buoi}
                tongSoBuoiGoi={selectedAppointment.tong_so_buoi_goi}
                loaiGoi={selectedAppointment.loai_goi}
                isRescheduling={isRescheduling}
                setIsRescheduling={setIsRescheduling}
                selectedBuoi={selectedBuoi}
                rescheduleDate={rescheduleDate}
                currentBuoi={selectedAppointment.buoi}
                trangThai={selectedAppointment.trang_thai}
              />

              {isStaffUnavailable && !isCurrentStaffUnavailableAtNewSlot && (
                <div className="text-xs text-rose-700 dark:text-rose-455 font-medium leading-relaxed bg-rose-50 dark:bg-rose-955/10 p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-900/30 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 shadow-2xs">
                  <span>⚠️</span>
                  <span>
                    Khung giờ này nhân sự <strong>{currentStaffName}</strong> không đáp ứng được (trùng lịch khác hoặc ngoài ca trực). Vui lòng chọn nhân sự khác hoặc đổi giờ!
                  </span>
                </div>
              )}

              <SymptomNotes
                selectedAppointment={selectedAppointment}
                isSendingEmail={isSendingEmail}
                handleResendEmail={handleResendEmail}
                appendCallLog={appendCallLog}
              />

              {/* 2. TRẠNG THÁI & THANH TOÁN */}
              <StatusAndBillingSection
                selectedAppointment={selectedAppointment}
                assignStatus={assignStatus}
                isEditingStatus={isEditingStatus}
                setIsEditingStatus={setIsEditingStatus}
                handleStatusChange={handleStatusChange}
                handleUndoStatusChange={handleUndoStatusChange}
                setIsStatusHistoryOpen={setIsStatusHistoryOpen}
                isReceptionist={isReceptionist}
                isReceptionistLocked={isReceptionistLocked}
                receptionistActionOptions={receptionistActionOptions}
                onClose={onClose}
              />

              {/* 3. ĐIỀU PHỐI NHÂN SỰ & PHÒNG */}
              <StaffRoomAllocation
                selectedAppointment={selectedAppointment}
                resolvedRoomName={resolvedRoomName}
                resolvedRoom={resolvedRoom}
                targetRole={targetRole}
                assignStaffId={assignStaffId}
                setAssignStaffId={setAssignStaffId}
                assignStatus={assignStatus}
                isReceptionist={isReceptionist}
                isLocked={isReceptionistLocked}
                isReassignAllowed={isReassignAllowed}
                buoi={effectiveBuoi}
                staffBudget={staffBudget}
                serviceDurationMinutes={Number(selectedAppointment.thoi_luong_phut) || 0}
                staffList={staffList}
                schedulesList={schedulesList}
                aptDateStr={rescheduleDate}
                aptStartHourStr={newStartHourStr}
                aptEndHourStr={newEndHourStr}
                appointments={appointments}
                onUnassignStaff={async () => {
                  try {
                    await unassignAppointmentStaff(String(selectedAppointment.id));
                    toast.success('Đã rút khỏi đích danh và đưa ca hẹn về Hàng chờ chung.');
                    onSuccess?.();
                    onClose();
                  } catch (err: any) {
                    console.error('Lỗi khi rút chỉ định nhân sự:', err);
                    toast.error(err?.response?.data?.message || 'Không thể rút chỉ định nhân sự.');
                  }
                }}
              />

              {/* 4. GHI CHÚ NỘI BỘ */}
              <div className="space-y-2 font-jakarta select-none">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Ghi chú nội bộ {isNoteRequired && <span className="text-rose-500">*</span>}
                </label>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-2xs relative">
                  <textarea
                    ref={noteTextareaRef}
                    rows={3}
                    maxLength={500}
                    value={localGhiChuNoiBo}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    disabled={isReceptionistLocked}
                    placeholder="Nhập ghi chú nội bộ (lý do hủy, ghi chú cuộc gọi, ghi chú ca trực, v.v.)..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-zinc-200 outline-none resize-none leading-relaxed placeholder:text-slate-400 font-medium"
                  />
                  <div className="flex justify-end pt-1">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-medium">
                      {localGhiChuNoiBo.length}/500
                    </span>
                  </div>
                </div>
                {rescheduleError && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1">⚠️ {rescheduleError}</p>
                )}
              </div>

            </div>

            {/* Right Column - Live Reschedule Workspace */}
            {isRescheduling && (
              <RescheduleSection
                rescheduleDate={rescheduleDate}
                setRescheduleDate={setRescheduleDate}
                todayStr={todayStr}
                maxDateStr={maxDateStr}
                selectedBuoi={selectedBuoi}
                setSelectedBuoi={setSelectedBuoi}
                selectedAppointment={selectedAppointment}
                origDateStr={origDateStr}
                getBuoiStaffCount={getBuoiStaffCount}
                isBuoiAllowed={isBuoiAllowed}
              />
            )}
          </div>

          {/* Footer actions */}
          <DetailFooter
            selectedAppointment={selectedAppointment}
            isReceptionist={isReceptionist}
            isReceptionistLocked={isReceptionistLocked}
            hideBilling={false}
            isAssigning={isAssigning}
            onClose={onClose}
            onSuccess={onSuccess}
            assignStaffId={assignStaffId}
            assignRoomId={assignRoomId}
            assignStatus={assignStatus}
            localGhiChuNoiBo={localGhiChuNoiBo}
            appointments={appointments}
          />
        </form>

        {/* History Modal */}
        <StatusHistoryModal
          isOpen={isStatusHistoryOpen}
          onClose={() => setIsStatusHistoryOpen(false)}
          appointment={selectedAppointment}
        />
      </motion.div>
    </div>
  );
}
