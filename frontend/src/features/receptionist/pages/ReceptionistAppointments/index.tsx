import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Import Shared Components
import AppointmentCalendar from '../../../admin/components/appointments/AppointmentCalendar';
import AppointmentDetailModal from '../../../admin/components/appointments/DetailModal';
import WalkInBookingModal from '../../../admin/components/appointments/WalkInBookingModal';
import TreatmentBookingModal from '../../../admin/components/appointments/TreatmentBookingModal';

// Import Shared Hooks & UI
import { useAppointmentsData } from '../../../admin/components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../../admin/components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../../admin/components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../../admin/components/appointments/ui/AppointmentsFilterBar';
import { PendingContactPanel } from '../../../admin/components/appointments/ui/PendingContactPanel';
import { CapacityView } from '../../../admin/components/appointments/ui/CapacityView';
import { standardTimeSlots, statusConfig } from '../../../admin/components/appointments/constants';
import { ViewMode, TimeRange } from '../../../admin/components/appointments/types';

export default function ReceptionistAppointments() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');

  // Fetch appointments and resources (isReceptionist = true)
  const {
    appointments,
    staffList,
    roomsList,
    schedulesList,
    services,
    packages,
    loading,
    refetch
  } = useAppointmentsData(true);

  // Use the appointment actions hook
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
    isTreatmentModalOpen,
    setIsTreatmentModalOpen,
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
    roleView: 'receptionist',
    isDemoMode: false,
    activeType,
    setActiveType
  });

  const focusTimerRef = useRef<any>(null);

  // Unmount cleanup only
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  // Parse URL search parameters on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    const rangeParam = params.get('range');
    const viewParam = params.get('view');

    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    }
    if (rangeParam && ['today', '7days', 'month'].includes(rangeParam)) {
      setTimeRange(rangeParam as TimeRange);
    }
    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      setViewMode(viewParam as ViewMode);
    }
  }, [location.search]);

  // Handle Mascot redirection focus
  const mascotTargetAppointments = location.search;
  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams(location.search);
    const focusAptId = params.get('appointmentId');
    const triggerFocus = params.get('triggerFocus');

    if (focusAptId && triggerFocus === 'true') {
      setIsWalkInModalOpen(false);
      scrollToAppointment(focusAptId);
      
      // Clean up parameter without re-triggering timers
      const newParams = new URLSearchParams(location.search);
      newParams.delete('triggerFocus');
      const newSearch = `?${newParams.toString()}`;
      navigate(location.pathname + newSearch, { replace: true });
    }
  }, [mascotTargetAppointments, scrollToAppointment, navigate, location.pathname, loading, setIsWalkInModalOpen]);

  // Update URL search parameters when filtering state changes
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

  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

  // Filtered appointments list for the main daily schedule view
  const filteredAppointments = appointments.filter(apt => {
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

    const allowedStatuses = ['chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham', 'hoan_thanh', 'da_huy', 'khong_den'];
    
    // Thêm ca chưa xác nhận đã quá 10 phút
    const graceTimeMs = 10 * 60 * 1000;
    const createdAt = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
    const isGracePassed = createdAt > 0 && (createdAt + graceTimeMs <= Date.now());
    const isOverdueUnconfirmed = apt.trang_thai === 'chua_xac_nhan' && isGracePassed;

    const isAllowed = allowedStatuses.includes(apt.trang_thai) || isOverdueUnconfirmed;
    return isAllowed && matchDate && matchType && matchSearch && apt.trang_thai !== 'giu_cho';
  });

  // Danh sách các ca khám chưa xác nhận đã quá 10 phút (cho toàn bộ các ngày)
  const pendingContactAppointments = appointments.filter(apt => {
    const graceTimeMs = 10 * 60 * 1000;
    const createdAt = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
    const isGracePassed = createdAt > 0 && (createdAt + graceTimeMs <= Date.now());
    return apt.trang_thai === 'chua_xac_nhan' && isGracePassed;
  });

  const getKpiAppointments = () => {
    const matchType = (apt: any) => activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    const interval = getActiveInterval();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.ngay_gio_bat_dau || '');
      return aptDate >= interval.start && aptDate <= interval.end && matchType(apt);
    });
  };
  const kpiAppointments = getKpiAppointments();

  const receptionistKpis = {
    total: kpiAppointments.length,
    pendingContact: kpiAppointments.filter(a => ['chua_xac_nhan', 'cho_xac_nhan'].includes(a.trang_thai)).length,
    assigned: kpiAppointments.filter(a => a.trang_thai === 'hoan_thanh').length,
    checkedIn: kpiAppointments.filter(a => a.trang_thai === 'da_huy').length,
  };

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
            isReceptionist={true}
            kpis={{ total: 0, waiting: 0, completed: 0, cancelled: 0 }}
            receptionistKpis={receptionistKpis}
            viewMode={viewMode}
            timeRange={timeRange}
            activeType={activeType}
          />

          {/* GUIDE BANNER */}
          <AnimatePresence mode="wait">
            {showGuide ? (
              <motion.div
                key="guide-visible"
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-br from-slate-50/80 via-white/80 to-transparent dark:from-zinc-900/60 dark:via-zinc-900/40 dark:to-transparent border border-slate-100 dark:border-zinc-800/80 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-[#0D9488]/4 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100/80 dark:border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 bg-[#0D9488]/10 text-[#0D9488] rounded-xl border border-[#0D9488]/15 dark:bg-teal-950/30 dark:border-teal-900/30">
                        <CalendarIcon size={16} className="animate-pulse" />
                      </span>
                      <h3 className="text-sm font-black uppercase text-slate-800 dark:text-zinc-200 tracking-wider flex items-center gap-2">
                        Quy trình đón tiếp & xác nhận
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase border text-slate-400 bg-slate-55 border-slate-150 dark:text-zinc-400 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                          Lễ tân
                        </span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGuide(false)}
                      className="flex items-center gap-1.5 py-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-455 hover:text-rose-500 dark:text-zinc-450 dark:hover:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-rose-100 dark:hover:border-rose-950/40 transition-all duration-200 cursor-pointer"
                    >
                      <EyeOff size={11} />
                      <span>Ẩn hướng dẫn</span>
                    </button>
                  </div>
                  <div className="mt-4 flex gap-4 items-start">
                    <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-500/10 shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-xs text-slate-655 dark:text-zinc-400 leading-relaxed font-semibold text-left">
                      Lễ tân là trạm liên lạc chính: Theo dõi lịch đặt và tình hình hoạt động của phòng khám, điều phối ca bệnh nhanh, check-in khi khách đến và phân bổ phòng khám phù hợp. Các ca khám cần liên hệ xác nhận sẽ hiển thị ở cột bên phải nếu khách chưa xác nhận email sau 10 phút.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="guide-hidden"
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="flex justify-end mb-4 pr-1"
              >
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-[#0D9488] dark:text-zinc-455 dark:hover:text-teal-450 bg-white/60 hover:bg-[#0D9488]/5 dark:bg-zinc-900/60 dark:hover:bg-teal-950/20 rounded-xl border border-slate-100 dark:border-zinc-800/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_2px_10px_rgba(0,0,0,0.01)] cursor-pointer"
                >
                  <Eye size={13.5} className="text-[#0D9488] animate-pulse" />
                  <span>Hiện quy trình hướng dẫn</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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

              <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-2 self-end sm:self-center">
                <span>Đang xem lịch ngày:</span>
                <span className="font-extrabold text-[#0D9488] uppercase tracking-wide bg-[#0D9488]/5 dark:bg-teal-950/20 px-3 py-1 rounded-lg border border-[#0D9488]/15">
                  {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
            </div>
          )}

          {/* MAIN CALENDAR / TIMELINE WORKSPACE */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 w-full min-w-0">
              {isWalkInModalOpen ? (
                <WalkInBookingModal
                  roomsList={roomsList}
                  staffList={staffList}
                  appointments={appointments}
                  schedulesList={schedulesList}
                  servicesList={services}
                  onClose={() => setIsWalkInModalOpen(false)}
                  onSubmitApi={handleBookWalkIn}
                  bookingLoading={bookingLoading}
                  initialTime={walkInTime}
                  activeType={activeType}
                  isReceptionist={true}
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
                      staffList={staffList}
                      schedulesList={schedulesList}
                      allAppointments={appointments}
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
                      appointments={appointments.filter(apt => 
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
                    <PendingContactPanel
                      pendingAppointments={pendingContactAppointments}
                      onOpenDetailModal={handleOpenDetailModal}
                    />
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
          roomsList={roomsList}
          staffList={staffList}
          activeRole="receptionist"
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
          appointments={appointments}
          schedulesList={schedulesList}
          isReceptionistOverride={true}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
        />
      )}



      {isTreatmentModalOpen && (
        <TreatmentBookingModal
          selectedAppointment={selectedAppointment}
          services={services}
          packages={packages}
          staffList={staffList}
          roomsList={roomsList}
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
    </div>
  );
}
