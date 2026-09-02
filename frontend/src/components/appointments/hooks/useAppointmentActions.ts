import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { createAppointment, updateAppointmentStatus } from '../../../features/admin/api/admin.api';
import toast from 'react-hot-toast';
import { Appointment } from '../types';

// A7 — đổi lịch chỉ còn ngày + buổi, bỏ hẳn giờ cụ thể. Mốc buổi danh nghĩa PHẢI khớp đúng
// GIO_NHAN_KHACH ở backend (domain/capacity.ts) — lịch hẹn theo buổi lưu ngay_gio_bat_dau/
// ngay_gio_ket_thuc là TRỌN buổi (vd 07:30-12:00), không phải khung giờ riêng của dịch vụ.
const BUOI_WINDOW: Record<'sang' | 'chieu', { batDau: string; ketThuc: string }> = {
  sang: { batDau: '07:30', ketThuc: '12:00' },
  chieu: { batDau: '12:00', ketThuc: '20:00' },
};

interface UseAppointmentActionsProps {
  appointments: Appointment[];
  services: any[];
  packages?: any[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: 'timeline' | 'capacity';
  setViewMode: (mode: 'timeline' | 'capacity') => void;
  timeRange: 'today' | '7days' | 'month' | 'custom';
  setTimeRange: (range: 'today' | '7days' | 'month' | 'custom') => void;
  refetch: () => Promise<void>;
  navigate?: (path: string) => void;
  roleView: 'manager' | 'receptionist' | 'doctor';
  isDemoMode?: boolean;
  setDemoApts?: React.Dispatch<React.SetStateAction<Appointment[]>>;
  activeType?: 'kham' | 'dieu_tri';
  setActiveType?: (type: 'kham' | 'dieu_tri') => void;
}

export function useAppointmentActions({
  appointments,
  services,
  packages: _packages,
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
  timeRange,
  setTimeRange,
  refetch,
  navigate,
  roleView,
  isDemoMode = false,
  setDemoApts,
  activeType,
  setActiveType
}: UseAppointmentActionsProps) {
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('khach_hang_id'));
  });
  const [walkInTime, setWalkInTime] = useState<string>('09:00');

  // Assignment State in Detail Modal
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [assignRoomId, setAssignRoomId] = useState<string>('');
  const [assignStatus, setAssignStatus] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Reschedule State (A7 — chỉ ngày + buổi)
  const [selectedBuoi, setSelectedBuoi] = useState<'sang' | 'chieu' | ''>('');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const handleOpenDetailModal = useCallback((apt: Appointment) => {
    if (roleView === 'doctor') {
      if (['dang_kham', 'da_checkin'].includes(apt.trang_thai)) {
        if (navigate) {
          navigate(`/doctor/appointments/${apt.id}/assess`);
          return;
        }
      }
    }
    setSelectedAppointment(apt);
    setAssignStatus(apt.trang_thai);
    setAssignStaffId(apt.bac_si_id ? String(apt.bac_si_id) : '');
    setAssignRoomId(apt.phong_id ? String(apt.phong_id) : '');

    // Buổi/ngày hiện tại làm giá trị khởi điểm cho panel đổi lịch
    const date = new Date(apt.ngay_gio_bat_dau);
    setSelectedBuoi((apt.buoi as 'sang' | 'chieu') || '');
    setRescheduleDate(format(date, 'yyyy-MM-dd'));
    
    setIsWalkInModalOpen(false); // Close Walk-in Booking Form to show detail modal cleanly
    setIsDetailModalOpen(true);
  }, [roleView, navigate]);

  const handleUpdateAppointment = useCallback(async (e?: React.FormEvent, note?: string) => {
    if (e) e.preventDefault();
    if (!selectedAppointment) return;

    // Trạng thái luôn lấy đúng giá trị Admin/Lễ tân chọn tường minh ở dropdown (assignStatus) —
    // KHÔNG tự suy diễn/ghi đè sang "Đã xác nhận" chỉ vì vừa gán xong nhân sự+phòng. Trước đây có
    // logic tự nhảy trạng thái ở đây, khiến việc chỉ gán nhân sự (để dropdown ở "Chưa xác nhận")
    // vẫn bị tự động xác nhận ngoài ý muốn — dropdown đã có sẵn lựa chọn "Đã xác nhận" tường minh,
    // không cần suy đoán thay người dùng.
    if (isDemoMode && setDemoApts) {
      const finalStatus = assignStatus;
      setDemoApts(prev => prev.map(apt =>
        String(apt.id) === String(selectedAppointment.id)
          ? { 
              ...apt, 
              trang_thai: finalStatus, 
              bac_si_id: assignStaffId || null, 
              chuyen_gia_id: assignStaffId || null, 
              phong_id: assignRoomId || null
            }
          : apt
      ));
      toast.success('MÔ PHỎNG: Cập nhật ca khám thành công');
      setIsDetailModalOpen(false);
      return;
    }

    try {
      setIsAssigning(true);

      const finalStatus = assignStatus;

      // A7 — đổi lịch chỉ còn ngày + buổi: dựng lại ngay_gio_bat_dau/ngay_gio_ket_thuc từ mốc
      // buổi danh nghĩa (KHÔNG phải giờ tự chọn) khi buổi hoặc ngày thay đổi.
      let finalNgayGioBatDau: string | null = null;
      let finalNgayGioKetThuc: string | null = null;
      let finalBuoi: 'sang' | 'chieu' | null = null;

      const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
      const origDateStr = format(origStart, 'yyyy-MM-dd');
      const origBuoi = selectedAppointment.buoi as 'sang' | 'chieu' | undefined;

      const isBuoiOrDateChanged = !!selectedBuoi && (selectedBuoi !== origBuoi || rescheduleDate !== origDateStr);
      if (isBuoiOrDateChanged) {
        const baseDateStr = rescheduleDate || origDateStr;
        const window = BUOI_WINDOW[selectedBuoi as 'sang' | 'chieu'];
        finalNgayGioBatDau = new Date(`${baseDateStr}T${window.batDau}:00`).toISOString();
        finalNgayGioKetThuc = new Date(`${baseDateStr}T${window.ketThuc}:00`).toISOString();
        finalBuoi = selectedBuoi as 'sang' | 'chieu';
      }

      const isCancelled = ['da_huy', 'khong_den'].includes(finalStatus);

      // Lễ tân không có quyền đổi nhân sự (business rule "Quyền đổi nhân sự") và không có UI nào để
      // sửa assignStaffId — luôn giữ NGUYÊN nhân sự đã gán của lịch, không suy theo state cục bộ này
      // (phòng trường hợp assignStaffId bị bên khác clear ngoài ý muốn, tránh lặp lại lỗi đã gặp:
      // Lễ tân chỉ đổi buổi mà lại làm rỗng nhan_su_id trong DB).
      const origStaffIdForSave = selectedAppointment.bac_si_id ? String(selectedAppointment.bac_si_id) : '';
      const staffIdForSave = roleView === 'receptionist' ? origStaffIdForSave : assignStaffId;

      await updateAppointmentStatus(String(selectedAppointment.id), {
        trang_thai: finalStatus,
        bac_si_id: isCancelled ? null : (staffIdForSave || null),
        chuyen_gia_id: isCancelled ? null : (staffIdForSave || null),
        phong_id: isCancelled ? null : (assignRoomId || null),
        ghi_chu_noi_bo: note || cancelReason || null,
        ...(finalNgayGioBatDau && { ngay_gio_bat_dau: finalNgayGioBatDau }),
        ...(finalNgayGioKetThuc && { ngay_gio_ket_thuc: finalNgayGioKetThuc }),
        ...(finalBuoi && { buoi: finalBuoi })
      });

      toast.success('Cập nhật thông tin ca trực thành công');
      setIsDetailModalOpen(false);
      await refetch();
    } catch (error: any) {
      console.error('Failed to update:', error);
      toast.error(error.response?.data?.message || 'Lỗi cập nhật ca trực');
    } finally {
      setIsAssigning(false);
    }
  }, [selectedAppointment, assignStatus, assignStaffId, assignRoomId, refetch, isDemoMode, setDemoApts, selectedBuoi, rescheduleDate, cancelReason, roleView]);

  const handleBookWalkIn = useCallback(async (payload: any) => {
    const isExamCheckinPaymentRequired = payload.shouldPayNow;
    const cleanPayload = { ...payload };
    delete cleanPayload.shouldPayNow;

    const statusLabel = cleanPayload.trang_thai === 'da_checkin' 
      ? 'đã Check-in' 
      : (cleanPayload.trang_thai === 'da_xac_nhan' ? 'đã xác nhận' : 'chờ gán nhân sự');

    if (isDemoMode && setDemoApts) {
      const newApt: Appointment = {
        id: `demo_${Date.now()}`,
        ma_lich_dat: `LH-W${Math.floor(100 + Math.random() * 900)}`,
        ten_khach_hang: cleanPayload.ho_ten_khach || "Khách Vãng Lai",
        so_dien_thoai: cleanPayload.so_dien_thoai || "0900000000",
        ngay_gio_bat_dau: cleanPayload.ngay_gio_bat_dau,
        ngay_gio_ket_thuc: cleanPayload.ngay_gio_ket_thuc,
        trang_thai: cleanPayload.trang_thai || "da_xac_nhan",
        bac_si_id: cleanPayload.bac_si_id || null,
        phong_id: cleanPayload.phong_id || null,
        ten_dich_vu: services.find(s => String(s.id) === String(cleanPayload.dich_vu_id))?.ten_dich_vu || "Dịch vụ phòng khám",
        loai_lich: cleanPayload.loai_lich || "kham_moi"
      };
      setDemoApts(prev => [...prev, newApt]);
      toast.success(`MÔ PHỎNG: Đăng ký lịch hẹn thành công (Trạng thái: ${statusLabel})!`);
      setIsWalkInModalOpen(false);
      return;
    }

    try {
      setBookingLoading(true);
      const res = await createAppointment(cleanPayload);
      await refetch();
      const createdAppt = res?.data;

      setIsWalkInModalOpen(false);
      if (isExamCheckinPaymentRequired && createdAppt?.id && navigate) {
        const billingRoute = roleView === 'receptionist' ? '/receptionist/billing' : '/admin/quick-billing';
        toast.success('💳 Ca Lượng giá bắt buộc thu tiền trước khi Check-in. Vui lòng hoàn tất thu tiền!');
        navigate(`${billingRoute}?lich_dat_id=${createdAppt.id}`);
      } else {
        toast.success(`Đăng ký lịch hẹn thành công (Trạng thái: ${statusLabel})!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đăng ký lịch hẹn');
    } finally {
      setBookingLoading(false);
    }
  }, [refetch, isDemoMode, setDemoApts, services, roleView, navigate]);

  const handleUpdateAppointmentFields = useCallback(async (appointmentId: string, updatedFields: any, successMessage: string = 'Đã cập nhật phân bổ lịch trình') => {
    if (isDemoMode && setDemoApts) {
      setDemoApts(prev => prev.map(apt =>
        String(apt.id) === String(appointmentId)
          ? { ...apt, ...updatedFields }
          : apt
      ));
      toast.success(`MÔ PHỎNG: ${successMessage}`);
      return;
    }

    const toastId = toast.loading('Đang cập nhật...');
    try {
      await updateAppointmentStatus(appointmentId, updatedFields);
      toast.success(successMessage, { id: toastId });
      await refetch();
    } catch (error: any) {
      console.error('Lỗi khi điều phối kéo thả:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật lịch hẹn, vui lòng thử lại.', { id: toastId });
    }
  }, [refetch, isDemoMode, setDemoApts]);

  const scrollToAppointment = useCallback((aptId: string) => {
    const apt = appointments.find(a => String(a.id) === String(aptId));
    if (!apt) {
      const el = document.getElementById(`appointment-card-${aptId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const doScroll = (retries = 15) => {
      const element = document.getElementById(`appointment-card-${aptId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (retries > 0) {
        setTimeout(() => doScroll(retries - 1), 150);
      }
    };

    let needsTransition = false;

    // Tự động chuyển tab Khám / Điều trị dựa vào loai_lich của lịch hẹn
    if (setActiveType && activeType) {
      if (apt.loai_lich === 'kham_moi' && activeType !== 'kham') {
        setActiveType('kham');
        needsTransition = true;
      } else if ((apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don') && activeType !== 'dieu_tri') {
        setActiveType('dieu_tri');
        needsTransition = true;
      }
    }

    // Enforce switching to timeline (daily view) of that date so it is guaranteed to show
    if (viewMode !== 'timeline') {
      setViewMode('timeline');
      needsTransition = true;
    }

    if (timeRange !== 'today') {
      setTimeRange('today');
      setSelectedDate(aptDate);
      needsTransition = true;
    }

    if (needsTransition) {
      // Slower transition timeout to give React route/state rendering enough time
      setTimeout(() => doScroll(15), 600);
    } else {
      doScroll(15);
    }
  }, [appointments, selectedDate, viewMode, timeRange, setSelectedDate, setViewMode, setTimeRange, activeType, setActiveType]);

  return {
    selectedAppointment,
    setSelectedAppointment,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isWalkInModalOpen,
    setIsWalkInModalOpen,
    walkInTime,
    setWalkInTime,

    assignStaffId,
    setAssignStaffId,
    assignRoomId,
    setAssignRoomId,
    assignStatus,
    setAssignStatus,
    isAssigning,
    bookingLoading,

    handleOpenDetailModal,
    handleUpdateAppointment,
    handleBookWalkIn,
    handleUpdateAppointmentFields,
    scrollToAppointment,
    cancelReason,
    setCancelReason,
    selectedBuoi,
    setSelectedBuoi,
    rescheduleDate,
    setRescheduleDate
  };
}

