import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Settings,
  ChevronLeft,
  X
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Import Components
import AppointmentCalendar from '../../components/appointments/AppointmentCalendar';
import AppointmentDetailModal from '../../components/appointments/DetailModal';
import TreatmentBookingModal from '../../components/appointments/TreatmentBookingModal';
import WalkInBookingModal from '../../components/appointments/WalkInBookingModal';

// Import Module Hooks & UI Components
import { useAppointmentsData } from '../../components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../components/appointments/ui/AppointmentsFilterBar';
import { DoctorWorkloadPanel } from '../../components/appointments/ui/DoctorWorkloadPanel';
import { UnassignedPanel } from '../../components/appointments/ui/UnassignedPanel';
import { CapacityView } from '../../components/appointments/ui/CapacityView';
import { standardTimeSlots, statusConfig } from '../../components/appointments/constants';
import { RoleView, ViewMode, TimeRange } from '../../components/appointments/types';

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

  // Filters State
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date();
  });

  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');

  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const params = new URLSearchParams(window.location.search);
    const rangeParam = params.get('range');
    if (rangeParam && ['today', '7days', 'month'].includes(rangeParam)) {
      return rangeParam as TimeRange;
    }
    return '7days';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      return viewParam as ViewMode;
    }
    return 'capacity';
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const focusTimerRef = useRef<any>(null);

  // Local Filter for staff/doctor in Timeline view
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);

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
  } = useAppointmentActions({
    appointments: appointmentsToUse,
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
    isDemoMode,
    setDemoApts,
    activeType,
    setActiveType
  });

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

  // Synchronize state with URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    const viewParam = params.get('view');
    const rangeParam = params.get('range');

    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) {
        setSelectedDate(parsedDate);
      }
    }

    if (rangeParam && ['today', '7days', 'month'].includes(rangeParam)) {
      if (rangeParam !== timeRange) {
        setTimeRange(rangeParam as TimeRange);
      }
    } else if (!rangeParam && viewParam === 'timeline') {
      setTimeRange('today');
    } else if (!rangeParam) {
      setTimeRange('7days');
    }

    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      if (viewParam !== viewMode) {
        setViewMode(viewParam as ViewMode);
      }
    }

    if (!dateParam && !viewParam) {
      if (roleView === 'receptionist' || roleView === 'manager') {
        setViewMode('capacity');
        setSelectedDate(new Date());
      }
    }
  }, [location.search, roleView]);

  // Update URL when states change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    params.set('range', timeRange);
    params.set('view', viewMode);
    
    const newSearch = `?${params.toString()}`;
    if (location.search !== newSearch) {
      navigate(location.pathname + newSearch, { replace: true });
    }
  }, [selectedDate, timeRange, viewMode, navigate, location.pathname]);

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

  const getActiveInterval = () => {
    if (timeRange === 'today') {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (timeRange === '7days') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      start.setHours(0, 0, 0, 0);
      const end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (timeRange === 'month') {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    } else {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      start.setHours(0, 0, 0, 0);
      const end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  };
  const activeInterval = getActiveInterval();

  const handleNavigateDay = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
    } else if (direction === 'next') {
      setSelectedDate(prev => 
        viewMode === 'timeline'
          ? addDays(prev, 1)
          : timeRange === 'month'
            ? addMonths(prev, 1)
            : addDays(prev, 7)
      );
    } else {
      setSelectedDate(prev => 
        viewMode === 'timeline'
          ? subDays(prev, 1)
          : timeRange === 'month'
            ? subMonths(prev, 1)
            : subDays(prev, 7)
      );
    }
  };

  const activeRole = activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

  const filteredAppointments = appointmentsToUse.filter(apt => {
    const aptDate = new Date(apt.ngay_gio_bat_dau || '');
    let matchDate = false;

    if (viewMode === 'timeline') {
      const aptDateStr = format(aptDate, 'yyyy-MM-dd');
      matchDate = aptDateStr === formattedSelectedDate;
    } else {
      matchDate = aptDate >= activeInterval.start && aptDate <= activeInterval.end;
    }

    const matchType = activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    const matchSearch = searchTerm === '' ||
      apt.ma_lich_dat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStaff = !selectedStaffFilter || String(apt.bac_si_id) === String(selectedStaffFilter);

    return matchDate && matchType && matchSearch && matchStaff && apt.trang_thai !== 'giu_cho';
  });

  const getKpiAppointments = () => {
    const matchType = (apt: any) => activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    if (viewMode === 'timeline') {
      return appointmentsToUse.filter(apt => {
        const aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
        return aptDateStr === formattedSelectedDate && matchType(apt);
      });
    } else {
      const interval = getActiveInterval();
      return appointmentsToUse.filter(apt => {
        const aptDate = new Date(apt.ngay_gio_bat_dau || '');
        return aptDate >= interval.start && aptDate <= interval.end && matchType(apt);
      });
    }
  };

  const kpiAppointments = getKpiAppointments();

  const kpis = {
    total: kpiAppointments.length,
    waiting: kpiAppointments.filter(a => a.trang_thai === 'chua_xac_nhan' || a.trang_thai === 'cho_xac_nhan').length,
    completed: kpiAppointments.filter(a => a.trang_thai === 'hoan_thanh').length,
    cancelled: kpiAppointments.filter(a => a.trang_thai === 'da_huy' || a.trang_thai === 'khong_den').length,
  };

  const unassignedAppointments = appointmentsToUse
    .filter(apt => {
      const aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
      const isSelectedDate = aptDateStr === formattedSelectedDate;
      const isClinical = apt.loai_lich === 'kham_moi' || apt.loai_lich === 'dich_vu_don';
      const isWaitingForAssignment = apt.trang_thai === 'cho_xac_nhan';
      const hasNoDoctor = !apt.bac_si_id;
      return isSelectedDate && isClinical && isWaitingForAssignment && hasNoDoctor;
    })
    .sort((a, b) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());

  const getIsDoctorUnavailable = (apt: any, doc: any) => {
    if (!doc) return false;
    
    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
    
    const staffSchedules = schedulesToUse.filter(s => 
      String(s.nguoi_dung_id) === String(doc.id) && 
      s.ngay === aptDateStr
    );

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) return true;

    const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
      const s1 = new Date(start1).getTime();
      const e1 = new Date(end1).getTime();
      const s2 = new Date(start2).getTime();
      const e2 = new Date(end2).getTime();
      return s1 < e2 && e1 > s2;
    };

    const isOccupied = appointmentsToUse.some(otherApt => 
      otherApt.id !== apt.id && 
      otherApt.trang_thai !== 'da_huy' &&
      otherApt.trang_thai !== 'khong_den' &&
      String(otherApt.bac_si_id) === String(doc.id) &&
      isOverlapping(apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc, otherApt.ngay_gio_bat_dau, otherApt.ngay_gio_ket_thuc)
    );

    return isOccupied;
  };

  const managerMascotApts = appointmentsToUse.filter(apt => {
    const isClinical = apt.loai_lich === 'kham_moi' || apt.loai_lich === 'dich_vu_don';
    const isActive = ['cho_xac_nhan', 'da_xac_nhan'].includes(apt.trang_thai);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const aptIdParam = params.get('appointmentId');
    if (params.get('triggerFocus') === 'true' && !loading) {
      const targetId = aptIdParam || (mascotTargetAppointments.length > 0 ? String(mascotTargetAppointments[0].id) : null);
      if (targetId) {
        setIsWalkInModalOpen(false);
        params.delete('triggerFocus');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        navigate(location.pathname + newSearch, { replace: true });

        if (focusTimerRef.current) {
          clearTimeout(focusTimerRef.current);
        }

        focusTimerRef.current = setTimeout(() => {
          scrollToAppointment(targetId);
        }, 500);
      }
    }
  }, [location.search, mascotTargetAppointments, scrollToAppointment, navigate, location.pathname, loading, setIsWalkInModalOpen]);

  const targetWorkloadRole = activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const doctorWorkloads = staffToUse
    .filter(s => s.vai_tro === targetWorkloadRole)
    .map(doc => {
      const docSchedules = schedulesToUse.filter(s =>
        String(s.nguoi_dung_id) === String(doc.id) &&
        s.ngay === formattedSelectedDate &&
        s.trang_thai === 'hoat_dong'
      );
      const hasShift = docSchedules.length > 0;

      const docApts = appointmentsToUse.filter(apt =>
        String(apt.bac_si_id) === String(doc.id) &&
        format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd') === formattedSelectedDate &&
        apt.trang_thai !== 'da_huy' &&
        apt.trang_thai !== 'khong_den'
      );

      const maxSlots = 16;
      const occupiedCount = docApts.length;
      const percentage = maxSlots > 0 ? Math.min(Math.round((occupiedCount / maxSlots) * 100), 100) : 0;

      return {
        id: doc.id,
        chuyen_gia_id: String(doc.id),
        name: doc.ho_ten,
        hasShift,
        occupiedCount,
        maxSlots,
        percentage
      };
    })
    .filter(doc => doc.hasShift);

  const commandShortcuts = [
    {
      id: 'view_today',
      name: 'Xem Lịch trình Hôm nay',
      icon: <CalendarIcon size={14} />,
      shortcut: 'T',
      action: () => {
        setTimeRange('today');
        setViewMode('timeline');
      }
    },
    {
      id: 'view_week',
      name: 'Xem Lịch trình Tuần này',
      icon: <CalendarDays size={14} />,
      shortcut: 'W',
      action: () => {
        setTimeRange('7days');
        setViewMode('capacity');
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

      <AnimatePresence mode="wait">
        <motion.div
          key="unified-appointment-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-6"
        >
          {/* KPI METRIC CARDS */}
          <AppointmentKpiCards
            isReceptionist={false}
            kpis={kpis}
            receptionistKpis={{ total: 0, pendingContact: 0, assigned: 0, checkedIn: 0 }}
            viewMode={viewMode}
            timeRange={timeRange}
            activeType={activeType}
          />

          <AppointmentsFilterBar
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            startDateOfWeek={activeInterval.start}
            endDateOfWeek={activeInterval.end}
            handleNavigateDay={handleNavigateDay}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            viewMode={viewMode}
            selectedDate={selectedDate}
            activeType={activeType}
            onToggleType={() => setActiveType(prev => prev === 'kham' ? 'dieu_tri' : 'kham')}
          />

          {/* DYNAMIC HEADER & BACK NAVIGATION */}
          {viewMode === 'timeline' && (
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-slate-55/40 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/80 p-3 rounded-[20px] backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setTimeRange('7days');
                  setViewMode('capacity');
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 hover:bg-[#0D9488]/15 rounded-xl border border-[#0D9488]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ChevronLeft size={14} className="stroke-[3]" />
                <span>Quay lại Bảng công suất</span>
              </button>

              <div className="text-xs font-bold text-slate-505 dark:text-zinc-400 flex items-center gap-2 self-end sm:self-center">
                <span>Đang xem ngày:</span>
                <span className="bg-teal-55 dark:bg-teal-955/20 text-[#0d9488] dark:text-teal-450 px-2.5 py-1 rounded-xl border border-teal-100/30 font-black uppercase tracking-wide">
                  {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
            </div>
          )}

          {/* MAIN WORKBOARD GRID */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Left Content Area */}
            <div className="flex-1 w-full min-w-0">
              {viewMode === 'timeline' && selectedStaffFilter && (
                <div className="mb-4 flex items-center justify-between bg-teal-550/10 dark:bg-teal-955/20 border border-teal-500/30 p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-150 uppercase tracking-wider">
                      Lịch {activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên'}: {
                        staffToUse.find(s => String(s.id) === String(selectedStaffFilter))?.ho_ten || 'Chuyên gia'
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedStaffFilter(null)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-rose-500 hover:text-rose-600 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-955/20 dark:hover:bg-rose-955/30 rounded-xl border border-rose-250/20 dark:border-rose-900/30 transition-all uppercase tracking-wider"
                  >
                    <X size={12} className="stroke-[3]" />
                    <span>Hủy lọc</span>
                  </button>
                </div>
              )}

              {isWalkInModalOpen ? (
                <WalkInBookingModal
                  roomsList={roomsToUse}
                  staffList={staffToUse}
                  appointments={appointmentsToUse}
                  schedulesList={schedulesToUse}
                  servicesList={services}
                  onClose={() => setIsWalkInModalOpen(false)}
                  onSubmitApi={handleBookWalkIn}
                  bookingLoading={bookingLoading}
                  initialTime={walkInTime}
                  activeType={activeType}
                  isReceptionist={roleView === 'receptionist'}
                  selectedDateStr={formattedSelectedDate}
                />
              ) : (
                <>
                  {viewMode === 'timeline' && (
                    <AppointmentCalendar
                      timeSlots={standardTimeSlots}
                      appointments={filteredAppointments}
                      statusConfig={statusConfig}
                      handleOpenDetailModal={handleOpenDetailModal}
                      staffList={staffToUse}
                      schedulesList={schedulesToUse}
                      allAppointments={appointmentsToUse}
                      selectedDateStr={formattedSelectedDate}
                      onOpenWalkInModal={(time) => {
                        setWalkInTime(time);
                        setIsWalkInModalOpen(true);
                      }}
                      onUpdateAppointment={handleUpdateAppointmentFields}
                      viewMode="admin"
                    />
                  )}

                  {viewMode === 'capacity' && (
                    <CapacityView
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      setViewMode={setViewMode}
                      appointments={appointmentsToUse.filter(apt => 
                        activeType === 'kham'
                          ? apt.loai_lich === 'kham_moi'
                          : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don')
                      )}
                      timeRange={timeRange}
                      activeType={activeType}
                    />
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar (Collapsible) */}
            {viewMode === 'timeline' && (
              <div className="relative shrink-0 flex items-stretch min-h-[400px]">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-teal-500 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-600 shadow-sm transition-all focus:outline-none"
                >
                  <span className="text-[10px] font-black">{isSidebarOpen ? '❯' : '❮'}</span>
                </button>

                {isSidebarOpen ? (
                  <div className="w-80 border-l border-slate-100 dark:border-zinc-800 pl-6 space-y-6 overflow-y-auto animate-in slide-in-from-right-3 duration-200">
                    
                    <UnassignedPanel
                      unassignedAppointments={unassignedAppointments}
                      onOpenDetailModal={handleOpenDetailModal}
                    />
                    <DoctorWorkloadPanel 
                      doctorWorkloads={doctorWorkloads} 
                      activeType={activeType} 
                      selectedStaffId={selectedStaffFilter}
                      onSelectStaff={setSelectedStaffFilter}
                    />
                    
                    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
                      <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase mb-2 tracking-wide">Trạng thái phòng khám</h4>
                      <div className="space-y-2">
                        {roomsToUse.filter(r => r.loai_phong === 'kham_benh' || r.loai_phong === 'phong_kham').map(r => {
                          const isUsed = filteredAppointments.some(a => String(a.phong_id) === String(r.id));
                          return (
                            <div key={r.id} className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-650 dark:text-zinc-400">{r.ten_phong}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                isUsed 
                                  ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400' 
                                  : 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-750 dark:text-emerald-400'
                              }`}>
                                {isUsed ? 'Đang hoạt động' : 'Phòng trống'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="w-4 bg-slate-50/50 dark:bg-zinc-800/10 border-l border-slate-100 dark:border-zinc-800 rounded-r-2xl" />
                )}

              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* GLOBAL MODALS */}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          selectedAppointment={selectedAppointment}
          roomsList={roomsToUse}
          staffList={staffToUse}
          activeRole={activeRole}
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
          onOpenTreatment={handleOpenTreatmentModal}
          appointments={appointmentsToUse}
          schedulesList={schedulesToUse}
          isReceptionistOverride={false}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
        />
      )}

      {isTreatmentModalOpen && (
        <TreatmentBookingModal
          selectedAppointment={selectedAppointment}
          services={services}
          packages={packages}
          staffList={staffToUse}
          roomsList={roomsToUse}
          treatmentType={treatmentType}
          setTreatmentType={setTreatmentType}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          selectedPackageId={selectedPackageId}
          setSelectedPackageId={setSelectedPackageId}
          selectedKtvId={selectedKtvId}
          setSelectedKtvId={setSelectedKtvId}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          treatmentDate={treatmentDate}
          setTreatmentDate={setTreatmentDate}
          treatmentTime={treatmentTime}
          setTreatmentTime={setTreatmentTime}
          bookingLoading={bookingLoading}
          onClose={() => setIsTreatmentModalOpen(false)}
          onSubmit={handleBookTreatment}
        />
      )}



      {/* COMMAND PALETTE (CTRL+K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandShortcuts}
        appointments={appointmentsToUse}
        onOpenDetailModal={handleOpenDetailModal}
      />
    </div>
  );
}
