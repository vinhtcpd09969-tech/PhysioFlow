import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Settings
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';

import { AppointmentDetailModal, WalkInBookingModal } from '../../../../components/appointments';
import { pushBackAppointment } from '../../api/admin.api';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

// Import Module Hooks & UI Components
import { useAppointmentsData } from '../../../../components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../../../components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../../../components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../../../components/appointments/ui/AppointmentsFilterBar';
import { CapacityView } from '../../../../components/appointments/ui/CapacityView';
import { TodayFlowBoard } from '../../../../components/appointments/ui/TodayFlowBoard';
import { computeAppointmentKpiBuckets, KPI_BUCKET_STATUSES, KPI_BUCKET_LABELS, AppointmentKpiBuckets } from '../../../../utils/appointmentKpi';
import { ActiveFilterChip } from '../../../../components/appointments/ui/ActiveFilterChip';
import { RoleView, ViewMode } from '../../../../components/appointments/types';
import { unassignAppointmentStaff } from '../../../receptionist/api/receptionist.api';
import { StaffWorkloadModal } from '../../../receptionist/components/StaffWorkloadModal';

// Import Local Components
import { CommandPalette } from './CommandPalette';

export default function ManageAppointments() {
  const location = useLocation();
  const navigate = useNavigate();

  // Chế độ Mô phỏng dữ liệu giúp kiểm thử
  const isDemoMode = false;
  const [demoApts, setDemoApts] = useState<any[]>([]);

  // Chế độ xem vai trò phục vụ kiểm thử (Test) hoặc vai trò thực tế của route
  const roleView: RoleView = (() => {
    if (window.location.pathname.startsWith('/receptionist')) {
      return 'receptionist';
    }
    if (window.location.pathname.startsWith('/doctor')) {
      return 'doctor';
    }
    return 'manager';
  })();
  const [selectedDocSimId, setSelectedDocSimId] = useState<string>('');
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);
  const [pendingUnassignApt, setPendingUnassignApt] = useState<any | null>(null);

  // State quản lý việc gọi dữ liệu từ Custom Hook
  const {
    appointments,
    staffList,
    roomsList,
    services,
    packages,
    schedulesList,
    loading,
    refetch
  } = useAppointmentsData(false);

  // Filters State: Dynamic Start Date & End Date Range
  const [startDate, setStartDate] = useState<Date>(() => {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('startDate') || params.get('date');
    if (startParam) {
      const parsedDate = new Date(startParam);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    const params = new URLSearchParams(window.location.search);
    const endParam = params.get('endDate');
    if (endParam) {
      const parsedDate = new Date(endParam);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Nếu có khach_hang_id (đặt lịch nhanh), mặc định xem Hôm nay (1 ngày)
    if (params.get('khach_hang_id')) {
      return today;
    }
    return addDays(today, 6); // Mặc định 7 ngày (Hôm nay + 6 ngày)
  });

  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      return viewParam as ViewMode;
    }
    if (params.get('khach_hang_id')) {
      return 'timeline';
    }
    return 'capacity';
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const focusTimerRef = useRef<any>(null);

  // Local Filter for staff/doctor in Timeline view
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);

  // Lọc theo 1 trạng thái cụ thể khi bấm thẻ KPI (AppointmentKpiCards.tsx) — độc lập với KPI,
  // không thu hẹp số liệu trên thẻ, chỉ thu hẹp danh sách hiển thị bên dưới. Không có 'total' vì
  // thẻ Tổng ca không dùng để lọc.
  const [statusFilter, setStatusFilter] = useState<Exclude<keyof AppointmentKpiBuckets, 'total'> | null>(null);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Choose list of appointments to use based on mode
  const appointmentsToUse = isDemoMode ? demoApts : (appointments || []);
  const staffToUse = staffList || [];
  const roomsToUse = roomsList || [];
  const schedulesToUse = schedulesList || [];

  // Actions custom hook
  const {
    selectedAppointment,
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
  } = useAppointmentActions({
    appointments: appointmentsToUse,
    services,
    packages,
    selectedDate: startDate,
    setSelectedDate: (d: Date) => {
      setStartDate(d);
      setEndDate(d);
    },
    viewMode,
    setViewMode,
    timeRange: 'custom',
    setTimeRange: () => {},
    refetch,
    navigate,
    roleView,
    isDemoMode,
    setDemoApts,
    activeType,
    setActiveType
  });

  const handleCloseWalkInModal = useCallback(() => {
    setIsWalkInModalOpen(false);
    const newParams = new URLSearchParams(location.search);
    newParams.delete('khach_hang_id');
    newParams.delete('goi_dich_vu_id');
    newParams.delete('phac_do_id');
    newParams.delete('buoi');
    const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
    if (location.search !== newSearch) {
      navigate(location.pathname + newSearch, { replace: true });
    }
  }, [location.search, location.pathname, navigate, setIsWalkInModalOpen]);

  // Keyboard shortcut listener for Ctrl+K command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync role view to localStorage and custom event for AdminLayout
  useEffect(() => {
    localStorage.setItem('admin-test-role-view', roleView);
    window.dispatchEvent(new CustomEvent('admin-test-role-view-change', { detail: roleView }));
    return () => {
      localStorage.removeItem('admin-test-role-view');
      window.dispatchEvent(new CustomEvent('admin-test-role-view-change', { detail: 'manager' }));
    };
  }, [roleView]);

  const bookingFormRef = useRef<HTMLDivElement>(null);

  // Auto-scroll xuống form Đặt lịch tại quầy khi mở form từ đường dẫn / đặt lịch tiếp theo
  useEffect(() => {
    if (isWalkInModalOpen && bookingFormRef.current) {
      const timer = setTimeout(() => {
        bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isWalkInModalOpen]);

  // Synchronize state with URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startParam = params.get('startDate') || params.get('date');
    const endParam = params.get('endDate');
    const viewParam = params.get('view');

    if (startParam) {
      const parsedDate = new Date(startParam);
      if (!isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
        setStartDate(parsedDate);
      }
    }

    if (endParam) {
      const parsedDate = new Date(endParam);
      if (!isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd')) {
        setEndDate(parsedDate);
      }
    }

    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      if (viewParam !== viewMode) {
        setViewMode(viewParam as ViewMode);
      }
    }

    const typeParam = params.get('type');
    if (typeParam === 'kham' || typeParam === 'dieu_tri') {
      setActiveType(typeParam);
    }

    const khId = params.get('khach_hang_id');
    const svcId = params.get('goi_dich_vu_id');
    const phacDoId = params.get('phac_do_id');
    if (khId && (svcId || phacDoId || khId.length > 0)) {
      setActiveType('dieu_tri');
      setIsWalkInModalOpen(true);
      if (!startParam && !endParam) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setStartDate(today);
        setEndDate(today);
        setViewMode('timeline');
      }
    }
  }, [location.search, roleView, setActiveType, setIsWalkInModalOpen, startDate, endDate, viewMode]);

  // Update URL when states change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('startDate', format(startDate, 'yyyy-MM-dd'));
    params.set('endDate', format(endDate, 'yyyy-MM-dd'));
    params.set('view', viewMode);
    
    const newSearch = `?${params.toString()}`;
    if (location.search !== newSearch) {
      navigate(location.pathname + newSearch, { replace: true });
    }
  }, [startDate, endDate, viewMode, navigate, location.pathname]);

  // Navigate to corresponding routes when simulator role changes
  useEffect(() => {
    if (roleView === 'manager' && !location.pathname.startsWith('/admin')) {
      navigate(`/admin/appointments${location.search}`);
    } else if (roleView === 'receptionist' && !location.pathname.startsWith('/receptionist')) {
      navigate(`/receptionist/appointments${location.search}`);
    } else if (roleView === 'doctor' && !location.pathname.startsWith('/doctor')) {
      navigate(`/doctor/appointments${location.search}`);
    }
  }, [roleView, location.pathname, location.search, navigate]);

  // Set default doctor
  useEffect(() => {
    if (staffToUse.length > 0 && !selectedDocSimId) {
      const doctors = staffToUse.filter(s => s.vai_tro === 'Bác sĩ');
      if (doctors.length > 0) {
        setSelectedDocSimId(String(doctors[0].id));
      }
    }
  }, [staffToUse, selectedDocSimId]);

  // Tự động reset bộ lọc và đóng form khi chuyển đổi tab (lịch khám <=> lịch điều trị)
  useEffect(() => {
    setSelectedStaffFilter(null);
    setStatusFilter(null);
    const params = new URLSearchParams(window.location.search);
    if (!params.get('khach_hang_id')) {
      setIsWalkInModalOpen(false);
    }
  }, [activeType, setIsWalkInModalOpen]);

  const handleSelectDateRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    if (isSameDay(start, end)) {
      setViewMode('timeline');
    } else {
      setViewMode('capacity');
    }
  };

  const handleNavigateRange = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setStartDate(today);
      setEndDate(addDays(today, 6));
      return;
    }

    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(0, 0, 0, 0);
    const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const stepDays = viewMode === 'timeline' ? 1 : diffDays;

    if (direction === 'next') {
      setStartDate(prev => addDays(prev, stepDays));
      setEndDate(prev => addDays(prev, stepDays));
    } else {
      setStartDate(prev => addDays(prev, -stepDays));
      setEndDate(prev => addDays(prev, -stepDays));
    }
  };

  const formattedSelectedDate = format(startDate, 'yyyy-MM-dd');

  const getKpiAppointments = () => {
    const filterByStaff = (apt: any) => !selectedStaffFilter || String(apt.bac_si_id) === String(selectedStaffFilter);

    if (viewMode === 'timeline') {
      return appointmentsToUse.filter(apt => {
        const aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
        return aptDateStr === formattedSelectedDate && filterByStaff(apt);
      });
    } else {
      const startBound = new Date(startDate);
      startBound.setHours(0, 0, 0, 0);
      const endBound = new Date(endDate);
      endBound.setHours(23, 59, 59, 999);
      return appointmentsToUse.filter(apt => {
        const aptDate = new Date(apt.ngay_gio_bat_dau || '');
        return aptDate >= startBound && aptDate <= endBound && filterByStaff(apt);
      });
    }
  };

  const kpiAppointments = getKpiAppointments();

  const kpis = computeAppointmentKpiBuckets(kpiAppointments);

  // A5 — 1 màn hình duy nhất cho mọi ngày đơn lẻ, dùng chung với Lễ tân: viewMode 'timeline' (dù
  // đang xem hôm nay hay ngày khác) luôn dùng TodayFlowBoard (nhóm dòng chảy) — không còn rơi về
  // AppointmentCalendar cũ (dạng slot-giờ). Chỉ "Bảng công suất" (nhiều ngày) mới khác, có 8 thẻ KPI
  // + danh sách tổng hợp riêng — đúng góp ý "lễ tân và admin xem lịch không khác gì nhau".
  const isCapacityView = viewMode === 'capacity';

  const dayAppointmentsForBoard = useMemo(() => {
    const dayStr = format(startDate, 'yyyy-MM-dd');
    return appointmentsToUse.filter((apt) => format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd') === dayStr);
  }, [appointmentsToUse, startDate]);

  const handleQuickCheckin = async (apt: any) => {
    await handleUpdateAppointmentFields(String(apt.id), { trang_thai: 'da_checkin' }, `Đã check-in cho ${apt.ten_khach_hang || apt.ho_ten_khach || 'khách hàng'}`);
  };

  // B11 — đẩy khách xuống cuối hàng đợi (đi vệ sinh/bỏ về tạm...), không đổi trạng thái.
  const handlePushBack = async (apt: any) => {
    try {
      await pushBackAppointment(String(apt.id));
      toast(`Đã đẩy ${apt.ten_khach_hang || apt.ho_ten_khach || 'khách'} xuống cuối hàng đợi.`, { icon: '⬇' });
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật hàng đợi.');
    }
  };

  // Tự tay chuyển "Không đến" cho ca đã check-in (đã gọi/đẩy nhiều lần mà khách vẫn không tới).
  const handleMarkNoShow = async (apt: any) => {
    await handleUpdateAppointmentFields(String(apt.id), { trang_thai: 'khong_den' }, `Đã đánh dấu ${apt.ten_khach_hang || apt.ho_ten_khach || 'khách'} không đến`);
  };

  // Giải phóng chỉ định đích danh, chuyển về Hàng đợi chung
  const handleUnassignStaff = (apt: any) => {
    setPendingUnassignApt(apt);
  };

  const handleConfirmUnassign = async () => {
    if (!pendingUnassignApt) return;
    const customerName = pendingUnassignApt.ten_khach_hang || pendingUnassignApt.ho_ten_khach || pendingUnassignApt.ho_ten || 'khách hàng';
    try {
      await unassignAppointmentStaff(String(pendingUnassignApt.id));
      toast.success(`🎉 Đã chuyển ca của ${customerName} sang trạng thái Nhân sự: Bất kỳ thành công!`);
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể giải phóng chỉ định nhân sự.');
    } finally {
      setPendingUnassignApt(null);
    }
  };

  // Chỉ còn kiểm tra CA TRỰC — bỏ kiểm tra "trùng giờ" giữa 2 lịch hẹn của cùng nhân sự.
  // Lý do: từ khi đặt lịch chuyển sang mô hình theo BUỔI, mọi lịch hẹn trong cùng 1 buổi đều
  // mang cùng mốc ngay_gio_bat_dau/ngay_gio_ket_thuc NOMINAL, nên 1 nhân sự có ≥2 lịch trong
  // cùng buổi là bình thường (phục vụ tuần tự qua hàng đợi), không phải xung đột.
  const getIsDoctorUnavailable = (apt: any, doc: any) => {
    if (!doc) return false;

    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;

    const staffSchedules = schedulesToUse.filter(s =>
      String(s.nguoi_dung_id) === String(doc.id) &&
      s.ngay === aptDateStr
    );

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    return !activeSchedule;
  };

  const managerMascotApts = appointmentsToUse.filter(apt => {
    const isClinical = apt.loai_lich === 'kham_moi' || apt.loai_lich === 'dich_vu_don';
    const isActive = apt.trang_thai === 'da_xac_nhan';
    if (!isClinical || !isActive) return false;

    const hasNoDoctor = !apt.bac_si_id;
    if (hasNoDoctor) return true;

    const doc = staffToUse.find(s => String(s.id) === String(apt.bac_si_id));
    const isDocUnavailable = doc ? getIsDoctorUnavailable(apt, doc) : true;

    return isDocUnavailable;
  }).sort((a, b) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());

  const mascotTargetAppointments = managerMascotApts;

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const [focusedAppointmentId, setFocusedAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const aptIdParam = params.get('appointmentId');
    const typeParam = params.get('type') as 'kham' | 'dieu_tri' | null;

    if (params.get('triggerFocus') === 'true' && !loading) {
      const targetId = aptIdParam || (mascotTargetAppointments.length > 0 ? String(mascotTargetAppointments[0].id) : null);
      if (targetId) {
        setIsWalkInModalOpen(false);
        setFocusedAppointmentId(targetId);

        // Tự động chuyển tab Lượng giá / Điều trị khớp với ca hẹn cần focus
        if (typeParam === 'kham' || typeParam === 'dieu_tri') {
          setActiveType(typeParam);
        } else {
          const targetApt = (appointmentsToUse || []).find(a => String(a.id) === String(targetId));
          if (targetApt) {
            const neededType = targetApt.loai_lich === 'kham_moi' ? 'kham' : 'dieu_tri';
            setActiveType(neededType);
          }
        }

        // Xóa NGAY triggerFocus & appointmentId khỏi URL để không dính khi chuyển tab hoặc đổi ngày
        const cleanParams = new URLSearchParams(location.search);
        cleanParams.delete('triggerFocus');
        cleanParams.delete('appointmentId');
        cleanParams.delete('type');
        cleanParams.delete('date');
        cleanParams.delete('range');
        cleanParams.set('startDate', format(startDate, 'yyyy-MM-dd'));
        cleanParams.set('endDate', format(endDate, 'yyyy-MM-dd'));
        cleanParams.set('view', viewMode);
        navigate(`${location.pathname}?${cleanParams.toString()}`, { replace: true });

        if (focusTimerRef.current) {
          clearTimeout(focusTimerRef.current);
        }

        focusTimerRef.current = setTimeout(() => {
          setFocusedAppointmentId(null);
        }, 4000);
      }
    }
  }, [location.search, mascotTargetAppointments, navigate, location.pathname, loading, setIsWalkInModalOpen, appointmentsToUse, startDate, endDate, viewMode]);

  // Danh sách nhân sự theo đúng vai trò đang chọn (Chuyên viên PHCN hoặc KTV) — nguồn cho dropdown lọc trong TodayFlowBoard.
  const onDutyStaffOptions = useMemo(() => {
    const isKham = activeType === 'kham';
    return staffToUse
      .filter((s) => {
        const roleId = Number((s as any).vai_tro_id);
        if (isKham) {
          return roleId === 4 || s.vai_tro === 'Chuyên viên PHCN' || s.vai_tro === 'Bác sĩ';
        } else {
          return roleId === 3 || s.vai_tro === 'Kỹ thuật viên';
        }
      })
      .map((doc) => ({
        id: String(doc.id),
        name: doc.ho_ten,
        avatar_url: doc.anh_dai_dien || (doc as any).avatar_url,
        avatarUrl: doc.anh_dai_dien || (doc as any).avatar_url
      }));
  }, [staffToUse, activeType]);

  const commandShortcuts = [
    {
      id: 'view_today',
      name: 'Xem Lịch trình Hôm nay',
      icon: <CalendarIcon size={14} />,
      shortcut: 'T',
      action: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        handleSelectDateRange(today, today);
      }
    },
    {
      id: 'view_week',
      name: 'Xem 7 ngày tới',
      icon: <CalendarDays size={14} />,
      shortcut: 'W',
      action: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        handleSelectDateRange(today, addDays(today, 6));
      }
    },
    {
      id: 'walk_in',
      name: 'Đăng ký Khách vãng lai (Walk-In)',
      icon: <Settings size={14} />,
      shortcut: 'N',
      action: () => {
        setWalkInTime('09:00');
        setIsWalkInModalOpen(true);
      }
    },
    {
      id: 'toggle_theme',
      name: 'Chuyển đổi giao diện Sáng / Tối',
      icon: <Settings size={14} />,
      shortcut: 'L',
      action: () => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        } else {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
        window.dispatchEvent(new Event('theme-change'));
      }
    }
  ];

  if (loading && appointmentsToUse.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#0D9488] border-r-2 border-[#0D9488]/20 dark:border-t-[#0D9488]"></div>
        <p className="text-slate-505 dark:text-zinc-400 font-medium text-sm">Đang đồng bộ hóa hệ thống lịch trình...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full font-jakarta">
      {/* KPI METRIC CARDS — chỉ hiện ở "Bảng công suất" (nhiều ngày): statusFilter mà các thẻ này
          set không tác động tới TodayFlowBoard (bảng dòng chảy có anchor-nav riêng, cố ý không lọc
          theo trạng thái — cùng lý do đã áp cho ReceptionistAppointments). */}
      {isCapacityView && (
        <AppointmentKpiCards
          role="admin"
          kpis={kpis}
          viewMode={viewMode}
          timeRange="custom"
          activeType={activeType}
          activeStatusFilter={statusFilter}
          onSelectStatus={setStatusFilter}
        />
      )}

          {/* Nếu mở form đặt lịch tại quầy hoặc xem bảng công suất thì hiển thị thanh bộ lọc độc lập */}
          {(isWalkInModalOpen || viewMode === 'capacity') && (
            <AppointmentsFilterBar
              startDate={startDate}
              endDate={endDate}
              appointments={dayAppointmentsForBoard || appointmentsToUse}
              onSelectDateRange={(start, end) => {
                handleCloseWalkInModal();
                setFocusedAppointmentId(null);
                if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
                handleSelectDateRange(start, end);
              }}
              handleNavigateRange={(direction) => {
                handleCloseWalkInModal();
                setFocusedAppointmentId(null);
                if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
                handleNavigateRange(direction);
              }}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              viewMode={viewMode}
              activeType={activeType}
              onToggleType={() => {
                handleCloseWalkInModal();
                setFocusedAppointmentId(null);
                if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
                setActiveType(prev => prev === 'kham' ? 'dieu_tri' : 'kham');
              }}
              canToggleType={true}
              setViewMode={(mode) => {
                handleCloseWalkInModal();
                setViewMode(mode);
              }}
              onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
            />
          )}

          {/* MAIN WORKBOARD */}
          <div className="w-full">
            {selectedStaffFilter && (
                <div className="mb-4">
                  <ActiveFilterChip
                    label={`Lịch ${activeType === 'kham' ? 'Chuyên viên tư vấn' : 'Kỹ thuật viên'}: ${staffToUse.find(s => String(s.id) === String(selectedStaffFilter))?.ho_ten || 'Chuyên gia'}`}
                    onClear={() => setSelectedStaffFilter(null)}
                  />
                </div>
              )}

              {isCapacityView && statusFilter && (
                <div className="mb-4">
                  <ActiveFilterChip
                    label={`Đang lọc: ${KPI_BUCKET_LABELS[statusFilter]}`}
                    onClear={() => setStatusFilter(null)}
                  />
                </div>
              )}

              {isWalkInModalOpen ? (
                <div ref={bookingFormRef} className="scroll-mt-6">
                  <WalkInBookingModal
                    roomsList={roomsToUse}
                    staffList={staffToUse}
                    appointments={appointmentsToUse}
                    schedulesList={schedulesToUse}
                    servicesList={services}
                    onClose={handleCloseWalkInModal}
                    onSubmitApi={handleBookWalkIn}
                    bookingLoading={bookingLoading}
                    initialTime={walkInTime}
                    activeType={activeType}
                    isReceptionist={roleView === 'receptionist'}
                    selectedDateStr={formattedSelectedDate}
                    initialCustomerId={new URLSearchParams(location.search).get('khach_hang_id') || undefined}
                    initialServiceId={new URLSearchParams(location.search).get('goi_dich_vu_id') || undefined}
                    onDateChange={(d) => {
                      setStartDate(d);
                      setEndDate(d);
                    }}
                  />
                </div>
              ) : (
                <>
                  {viewMode === 'timeline' && (
                    <TodayFlowBoard
                      filterBar={
                        <AppointmentsFilterBar
                          embedded={true}
                          startDate={startDate}
                          endDate={endDate}
                          appointments={dayAppointmentsForBoard || appointmentsToUse}
                          onSelectDateRange={(start, end) => {
                            handleCloseWalkInModal();
                            setFocusedAppointmentId(null);
                            if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
                            handleSelectDateRange(start, end);
                          }}
                          handleNavigateRange={(direction) => {
                            handleCloseWalkInModal();
                            setFocusedAppointmentId(null);
                            if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
                            handleNavigateRange(direction);
                          }}
                          searchTerm={searchTerm}
                          setSearchTerm={setSearchTerm}
                          viewMode={viewMode}
                          activeType={activeType}
                          onToggleType={() => {
                            handleCloseWalkInModal();
                            setFocusedAppointmentId(null);
                            if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
                            setActiveType(prev => prev === 'kham' ? 'dieu_tri' : 'kham');
                          }}
                          canToggleType={true}
                          setViewMode={(mode) => {
                            handleCloseWalkInModal();
                            setViewMode(mode);
                          }}
                          onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
                        />
                      }
                      appointments={dayAppointmentsForBoard}
                      activeType={activeType}
                      searchTerm={searchTerm}
                      staffList={staffToUse}
                      schedulesList={schedulesToUse}
                      selectedDateStr={formattedSelectedDate}
                      onOpenDetailModal={handleOpenDetailModal}
                      onQuickCheckin={handleQuickCheckin}
                      onPushBack={handlePushBack}
                      onMarkNoShow={handleMarkNoShow}
                      onUnassign={handleUnassignStaff}
                      onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
                      focusAppointmentId={focusedAppointmentId || undefined}
                      staffFilterId={selectedStaffFilter}
                      staffFilterOptions={onDutyStaffOptions}
                      onStaffFilterChange={setSelectedStaffFilter}
                      onOpenWorkloadModal={() => setIsWorkloadModalOpen(true)}
                    />
                  )}

                  {viewMode === 'capacity' && (
                    <CapacityView
                      selectedDate={startDate}
                      setSelectedDate={(d) => {
                        setStartDate(d);
                        setEndDate(d);
                        setViewMode('timeline');
                      }}
                      setViewMode={setViewMode}
                      appointments={appointmentsToUse.filter(apt =>
                        (activeType === 'kham'
                          ? apt.loai_lich === 'kham_moi'
                          : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don')) &&
                        (!statusFilter || KPI_BUCKET_STATUSES[statusFilter].includes(apt.trang_thai)) &&
                        (!selectedStaffFilter || String(apt.bac_si_id) === String(selectedStaffFilter))
                      )}
                      timeRange="custom"
                      startDate={startDate}
                      endDate={endDate}
                      activeType={activeType}
                      searchTerm={searchTerm}
                      onSelectAppointment={scrollToAppointment}
                      activeStatusLabel={statusFilter ? KPI_BUCKET_LABELS[statusFilter] : null}
                      selectedStaffFilter={selectedStaffFilter}
                      staffList={staffToUse}
                      onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
                    />
                  )}
                </>
              )}
          </div>

      {/* GLOBAL MODALS */}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          selectedAppointment={selectedAppointment}
          roomsList={roomsToUse}
          staffList={staffToUse}
          activeRole={roleView}
          assignRoomId={assignRoomId}
          setAssignRoomId={setAssignRoomId}
          assignStaffId={assignStaffId}
          setAssignStaffId={setAssignStaffId}
          assignStatus={assignStatus}
          setAssignStatus={setAssignStatus}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          isAssigning={isAssigning}
          onClose={() => setIsDetailModalOpen(false)}
          onSave={handleUpdateAppointment}
          appointments={appointmentsToUse}
          schedulesList={schedulesToUse}
          isReceptionistOverride={false}
          selectedBuoi={selectedBuoi}
          setSelectedBuoi={setSelectedBuoi}
          rescheduleDate={rescheduleDate}
          setRescheduleDate={setRescheduleDate}
        />
      )}{/* COMMAND PALETTE (CTRL+K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandShortcuts}
        appointments={appointmentsToUse}
        onOpenDetailModal={handleOpenDetailModal}
      />

      <StaffWorkloadModal
        isOpen={isWorkloadModalOpen}
        onClose={() => setIsWorkloadModalOpen(false)}
        dateStr={formattedSelectedDate}
      />

      <ConfirmDialog
        isOpen={!!pendingUnassignApt}
        title="Xác nhận chuyển sang Nhân sự: Bất kỳ"
        message={
          pendingUnassignApt ? (
            <div className="space-y-2 text-left">
              <p>
                Bạn có chắc chắn muốn chuyển cuộc hẹn của khách hàng{' '}
                <strong className="text-slate-900 dark:text-zinc-100">
                  {pendingUnassignApt.ten_khach_hang || pendingUnassignApt.ho_ten_khach || 'khách hàng'}
                </strong>{' '}
                từ ca của <strong>{pendingUnassignApt.ten_ky_thuat_vien || pendingUnassignApt.bac_si_ten || pendingUnassignApt.ten_bac_si || pendingUnassignApt.ten_nhan_su || 'nhân sự'}</strong> sang trạng thái <strong>Nhân sự: Bất kỳ</strong> không?
              </p>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-955/40 border border-amber-200/80 dark:border-amber-800/60 text-xs font-semibold text-amber-900 dark:text-amber-300">
                Sau khi chuyển, cuộc hẹn sẽ được tiếp nhận bởi nhân sự rảnh tiếp theo khi họ bấm Gọi vào.
              </div>
            </div>
          ) : ''
        }
        confirmLabel="Đồng ý chuyển"
        cancelLabel="Hủy"
        type="warning"
        onConfirm={handleConfirmUnassign}
        onCancel={() => setPendingUnassignApt(null)}
      />
    </div>
  );
}
