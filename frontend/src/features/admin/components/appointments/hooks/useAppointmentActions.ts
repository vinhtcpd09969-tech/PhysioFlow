import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { createAppointment, updateAppointmentStatus } from '../../../api/admin.api';
import toast from 'react-hot-toast';
import { convertToVietnamUtcIso } from '../../../../../utils/date';
import { Appointment } from '../types';
interface UseAppointmentActionsProps {
  appointments: Appointment[];
  services: any[];
  packages: any[];
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
  packages,
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
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInTime, setWalkInTime] = useState<string>('09:00');

  // Assignment State in Detail Modal
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [assignRoomId, setAssignRoomId] = useState<string>('');
  const [assignStatus, setAssignStatus] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Time Rescheduling State
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Treatment Booking Form State
  const [treatmentType, setTreatmentType] = useState<'single' | 'package'>('single');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedKtvId, setSelectedKtvId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [treatmentDate, setTreatmentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [treatmentTime, setTreatmentTime] = useState<string>('09:00');
  const [bookingLoading, setBookingLoading] = useState(false);

  const handleOpenDetailModal = useCallback((apt: Appointment) => {
    if (roleView === 'doctor') {
      if (['cho_kham', 'dang_kham', 'da_checkin'].includes(apt.trang_thai)) {
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
    
    // Set initial selected time slot
    const date = new Date(apt.ngay_gio_bat_dau);
    const startHourStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    setSelectedTimeSlot(startHourStr);
    
    setIsWalkInModalOpen(false); // Close Walk-in Booking Form to show detail modal cleanly
    setIsDetailModalOpen(true);
  }, [roleView, navigate]);

  const handleOpenTreatmentModal = useCallback((type: 'single' | 'package' | null = null, recId: string | null = null) => {
    if (!selectedAppointment) return;
    setIsDetailModalOpen(false);
    setTreatmentType(type || 'single');
    setSelectedServiceId(type === 'single' && recId ? recId : '');
    setSelectedPackageId(type === 'package' && recId ? recId : '');
    setSelectedKtvId('');
    setSelectedRoomId('');
    setTreatmentDate(format(new Date(), 'yyyy-MM-dd'));
    setTreatmentTime('10:00');
    setIsTreatmentModalOpen(true);
  }, [selectedAppointment]);

  const handleUpdateAppointment = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAppointment) return;

    if (isDemoMode && setDemoApts) {
      let finalStatus = assignStatus;
      if (['chua_xac_nhan', 'cho_xac_nhan'].includes(selectedAppointment.trang_thai) && assignStaffId && assignRoomId) {
        finalStatus = 'da_xac_nhan';
      }
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

      let finalStatus = assignStatus;
      if (['chua_xac_nhan', 'cho_xac_nhan'].includes(selectedAppointment.trang_thai) && assignStaffId && assignRoomId) {
        finalStatus = 'da_xac_nhan';
      }

      // Construct new date strings if selectedTimeSlot has changed
      let finalNgayGioBatDau: string | null = null;
      let finalNgayGioKetThuc: string | null = null;

      const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
      const origEnd = new Date(selectedAppointment.ngay_gio_ket_thuc);
      const durationMs = origEnd.getTime() - origStart.getTime();

      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      const newStart = new Date(origStart);
      newStart.setHours(hours, minutes, 0, 0);
      const newEnd = new Date(newStart.getTime() + durationMs);

      if (newStart.getTime() !== origStart.getTime()) {
        finalNgayGioBatDau = newStart.toISOString();
        finalNgayGioKetThuc = newEnd.toISOString();
      }

      await updateAppointmentStatus(String(selectedAppointment.id), {
        trang_thai: finalStatus,
        bac_si_id: assignStaffId || null,
        chuyen_gia_id: assignStaffId || null,
        phong_id: assignRoomId || null,
        ly_do_huy: finalStatus === 'da_huy' ? cancelReason : null,
        ...(finalNgayGioBatDau && { ngay_gio_bat_dau: finalNgayGioBatDau }),
        ...(finalNgayGioKetThuc && { ngay_gio_ket_thuc: finalNgayGioKetThuc })
      });

      toast.success('Cập nhật thông tin ca trực thành công');
      setIsDetailModalOpen(false);
      await refetch();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Lỗi cập nhật ca trực');
    } finally {
      setIsAssigning(false);
    }
  }, [selectedAppointment, assignStatus, assignStaffId, assignRoomId, refetch, isDemoMode, setDemoApts, selectedTimeSlot, cancelReason]);

  const handleBookTreatment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    const chosenServiceId = treatmentType === 'single' ? selectedServiceId : null;
    const chosenPackageId = treatmentType === 'package' ? selectedPackageId : null;

    if (treatmentType === 'single' && !chosenServiceId) { toast.error('Vui lòng chọn dịch vụ linh động'); return; }
    if (treatmentType === 'package' && !chosenPackageId) { toast.error('Vui lòng chọn liệu trình'); return; }
    if (!selectedKtvId) { toast.error('Vui lòng chọn Chuyên gia y tế'); return; }

    let durationMin = 60; // default to 60 mins
    if (treatmentType === 'single') {
      const service = services.find(s => String(s.id) === String(chosenServiceId));
      if (service) {
        durationMin = Number(service.thoi_luong_phut) || 60;
      }
    } else {
      const pkg = packages.find(p => String(p.id) === String(chosenPackageId));
      if (pkg && pkg.chi_tiet_dich_vu) {
        let items: any[] = [];
        try {
          items = typeof pkg.chi_tiet_dich_vu === 'string'
            ? JSON.parse(pkg.chi_tiet_dich_vu)
            : pkg.chi_tiet_dich_vu;
        } catch (e) {
          console.error('Lỗi parse chi_tiet_dich_vu:', e);
        }
        if (Array.isArray(items)) {
          let sum = 0;
          items.forEach(item => {
            const svc = services.find(s => String(s.id) === String(item.dich_vu_id));
            if (svc) {
              sum += Number(svc.thoi_luong_phut) || 0;
            }
          });
          if (sum > 0) {
            durationMin = sum;
          }
        }
      }
    }

    // Chuyển đổi giờ cục bộ (VN UTC+7) sang UTC đúng chuẩn độc lập với múi giờ trình duyệt
    const [h, m] = treatmentTime.split(':').map(Number);
    const endTotalMins = h * 60 + m + durationMin;
    const endH = Math.floor(endTotalMins / 60) % 24;
    const endM = endTotalMins % 60;
    const endHourStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const startDateTimeStr = convertToVietnamUtcIso(treatmentDate, treatmentTime);
    const endDateTimeStr = convertToVietnamUtcIso(treatmentDate, endHourStr);

    if (isDemoMode && setDemoApts) {
      const newApt: Appointment = {
        id: `demo_${Date.now()}`,
        ma_lich_dat: `LH-DT${Math.floor(100 + Math.random() * 900)}`,
        ten_khach_hang: selectedAppointment.ten_khach_hang,
        so_dien_thoai: selectedAppointment.so_dien_thoai,
        ngay_gio_bat_dau: startDateTimeStr,
        ngay_gio_ket_thuc: endDateTimeStr,
        trang_thai: "da_xac_nhan",
        bac_si_id: selectedKtvId,
        phong_id: selectedRoomId || null,
        ten_dich_vu: treatmentType === 'single'
          ? services.find(s => String(s.id) === String(chosenServiceId))?.ten_dich_vu || "Dịch vụ đơn"
          : packages.find(p => String(p.id) === String(chosenPackageId))?.ten_goi || "Liệu trình trị liệu",
        loai_lich: 'dieu_tri'
      };
      setDemoApts(prev => [...prev, newApt]);
      toast.success('MÔ PHỎNG: Lên lịch ca điều trị thành công!');
      setIsTreatmentModalOpen(false);
      return;
    }

    try {
      setBookingLoading(true);

      const payload = {
        khach_hang_id: selectedAppointment.khach_hang_id,
        ho_ten_khach: selectedAppointment.khach_hang_id ? undefined : selectedAppointment.ten_khach_hang,
        so_dien_thoai: selectedAppointment.khach_hang_id ? undefined : selectedAppointment.so_dien_thoai,
        dich_vu_id: chosenServiceId || null,
        ky_thuat_vien_id: selectedKtvId,
        phong_id: selectedRoomId || null,
        ghi_chu_dat_lich: `Ca trị liệu khởi tạo từ Lịch khám: ${selectedAppointment.ma_lich_dat}`,
        ngay_gio_bat_dau: startDateTimeStr,
        ngay_gio_ket_thuc: endDateTimeStr,
        loai_lich: 'dieu_tri',
        dang_ky_goi_id: chosenPackageId,
        lich_dat_id: selectedAppointment.id
      };

      await createAppointment(payload);
      toast.success('Lên lịch ca điều trị thành công!');
      setIsTreatmentModalOpen(false);
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo ca điều trị');
    } finally {
      setBookingLoading(false);
    }
  }, [selectedAppointment, treatmentType, selectedServiceId, selectedPackageId, selectedKtvId, selectedRoomId, treatmentDate, treatmentTime, services, packages, refetch, isDemoMode, setDemoApts]);

  const handleBookWalkIn = useCallback(async (payload: any) => {
    const statusLabel = payload.trang_thai === 'da_checkin' 
      ? 'đã Check-in' 
      : (payload.trang_thai === 'da_xac_nhan' ? 'đã xác nhận' : 'chờ gán nhân sự');

    if (isDemoMode && setDemoApts) {
      const newApt: Appointment = {
        id: `demo_${Date.now()}`,
        ma_lich_dat: `LH-W${Math.floor(100 + Math.random() * 900)}`,
        ten_khach_hang: payload.ho_ten_khach || "Khách vãng lai",
        so_dien_thoai: payload.so_dien_thoai || "09xxxxxxxx",
        ngay_gio_bat_dau: payload.ngay_gio_bat_dau,
        ngay_gio_ket_thuc: payload.ngay_gio_ket_thuc,
        trang_thai: payload.trang_thai || "cho_xac_nhan",
        bac_si_id: payload.bac_si_id || null,
        phong_id: payload.phong_id || null,
        ten_dich_vu: services.find(s => String(s.id) === String(payload.goi_dich_vu_id))?.ten_dich_vu || "Dịch vụ khám/trị liệu",
        loai_lich: payload.loai_lich || 'kham_moi'
      };
      setDemoApts(prev => [...prev, newApt]);
      toast.success(`MÔ PHỎNG: Lập lịch hẹn thành công (Trạng thái: ${statusLabel})!`);
      setIsWalkInModalOpen(false);
      return;
    }

    try {
      setBookingLoading(true);
      await createAppointment(payload);
      toast.success(`Đăng ký lịch hẹn thành công (Trạng thái: ${statusLabel})!`);
      setIsWalkInModalOpen(false);
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đăng ký lịch hẹn');
    } finally {
      setBookingLoading(false);
    }
  }, [refetch, isDemoMode, setDemoApts, services]);

  const handleUpdateAppointmentFields = useCallback(async (appointmentId: string, updatedFields: any) => {
    if (isDemoMode && setDemoApts) {
      setDemoApts(prev => prev.map(apt => 
        String(apt.id) === String(appointmentId)
          ? { ...apt, ...updatedFields }
          : apt
      ));
      toast.success('MÔ PHỎNG: Đã cập nhật phân bổ lịch trình');
      return;
    }

    try {
      await updateAppointmentStatus(appointmentId, updatedFields);
      toast.success('Đã cập nhật phân bổ lịch trình');
      await refetch();
    } catch (error: any) {
      console.error('Lỗi khi điều phối kéo thả:', error);
      toast.error(error.response?.data?.message || 'Bác sĩ hoặc phòng đã bị trùng vào khung giờ này.');
    }
  }, [refetch, isDemoMode, setDemoApts]);

  const scrollToAppointment = useCallback((aptId: string) => {
    const apt = appointments.find(a => String(a.id) === String(aptId));
    if (!apt) {
      toast.error('Không tìm thấy ca hẹn trên hệ thống.');
      return;
    }

    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const formattedAptDate = format(aptDate, 'yyyy-MM-dd');
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

    const doScroll = (retries = 15) => {
      const element = document.getElementById(`appointment-card-${aptId}`);
      if (element) {
        // Initial scroll instantly to bypass smooth scroll animation conflicts
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        
        // Secondary corrective scroll to handle layout shifts and React DOM reflows
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'auto', block: 'center' });
        }, 150);

        // Highlighting style effects
        element.style.transition = 'all 0.5s ease-in-out';
        element.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.9)';
        element.style.borderColor = '#f59e0b';
        element.style.borderWidth = '2px';
        element.style.transform = 'scale(1.05)';

        setTimeout(() => {
          element.style.boxShadow = '';
          element.style.borderColor = '';
          element.style.borderWidth = '';
          element.style.transform = '';
        }, 2000);
      } else if (retries > 0) {
        // Try again in 150ms to allow React components to fully render
        setTimeout(() => doScroll(retries - 1), 150);
      } else {
        toast.error('Không tìm thấy ca hẹn trên bảng lịch trình.');
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
      needsTransition = true;
    }

    if (formattedAptDate !== formattedSelectedDate) {
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
    isTreatmentModalOpen,
    setIsTreatmentModalOpen,
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

    treatmentType,
    setTreatmentType,
    selectedServiceId,
    setSelectedServiceId,
    selectedPackageId,
    setSelectedPackageId,
    selectedKtvId,
    setSelectedKtvId,
    selectedRoomId,
    setSelectedRoomId,
    treatmentDate,
    setTreatmentDate,
    treatmentTime,
    setTreatmentTime,
    bookingLoading,

    handleOpenDetailModal,
    handleOpenTreatmentModal,
    handleUpdateAppointment,
    handleBookTreatment,
    handleBookWalkIn,
    handleUpdateAppointmentFields,
    scrollToAppointment,
    cancelReason,
    setCancelReason,
    selectedTimeSlot,
    setSelectedTimeSlot
  };
}

