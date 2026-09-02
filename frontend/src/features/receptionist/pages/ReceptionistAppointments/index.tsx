import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { format, addDays, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';

import { AppointmentDetailModal, WalkInBookingModal } from '../../../../components/appointments';
import { pushBackAppointment } from '../../../admin/api/admin.api';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

// Import Shared Hooks & UI
import { useAppointmentsData } from '../../../../components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../../../components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../../../components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../../../components/appointments/ui/AppointmentsFilterBar';
import { TodayFlowBoard } from '../../../../components/appointments/ui/TodayFlowBoard';
import { CapacityView } from '../../../../components/appointments/ui/CapacityView';
import { computeAppointmentKpiBuckets, KPI_BUCKET_STATUSES, KPI_BUCKET_LABELS, AppointmentKpiBuckets } from '../../../../utils/appointmentKpi';
import { ActiveFilterChip } from '../../../../components/appointments/ui/ActiveFilterChip';
import { ViewMode } from '../../../../components/appointments/types';
import { StaffWorkloadModal } from '../../components/StaffWorkloadModal';
import { getStaffWorkload, unassignAppointmentStaff } from '../../api/receptionist.api';
import { addMinutes } from 'date-fns';

export default function ReceptionistAppointments() {
  const location = useLocation();
  const navigate = useNavigate();

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
    if (params.get('khach_hang_id')) {
      return today;
    }
    return addDays(today, 6);
  });

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
  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');
  // Lễ tân được lọc xem theo nhân sự giống Admin (chỉ không có quyền phân bổ/đổi nhân sự cho lịch).
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);
  const [pendingUnassignApt, setPendingUnassignApt] = useState<any | null>(null);

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

  // Lọc theo 1 trạng thái cụ thể khi bấm thẻ KPI — độc lập với số liệu trên thẻ (xem
  // ManageAppointments/index.tsx cho cùng pattern).
  const [statusFilter, setStatusFilter] = useState<Exclude<keyof AppointmentKpiBuckets, 'total'> | null>(null);

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
    appointments,
    services,
    packages,
    selectedDate: startDate,
    setSelectedDate: (d: Date) => {
      setStartDate(d);
      setEndDate(d);
    },
    viewMode,
    setViewMode,
    timeRange: 'today',
    setTimeRange: () => {},
    refetch,
    navigate,
    roleView: 'receptionist',
    isDemoMode: false,
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

  const focusTimerRef = useRef<any>(null);
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

  // Unmount cleanup only
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  // Parse URL search parameters on load / external navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startParam = params.get('startDate') || params.get('date');
    const endParam = params.get('endDate') || (startParam ? startParam : null);
    const viewParam = params.get('view');

    if (startParam) {
      const parsedDate = new Date(startParam);
      if (!isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
        setStartDate(parsedDate);
        if (!params.get('endDate')) {
          setEndDate(parsedDate);
        }
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
  }, [location.search]);

  const [focusedAppointmentId, setFocusedAppointmentId] = useState<string | null>(null);

  // Handle Mascot redirection focus smoothly without screen jitter
  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams(location.search);
    const focusAptId = params.get('appointmentId');
    const triggerFocus = params.get('triggerFocus');
    const typeParam = params.get('type') as 'kham' | 'dieu_tri' | null;

    if (focusAptId && triggerFocus === 'true') {
      setIsWalkInModalOpen(false);
      setFocusedAppointmentId(focusAptId);

      // Tự động chuyển tab Lượng giá / Điều trị khớp với ca hẹn cần focus
      if (typeParam === 'kham' || typeParam === 'dieu_tri') {
        setActiveType(typeParam);
      } else {
        const targetApt = (appointments || []).find(a => String(a.id) === String(focusAptId));
        if (targetApt) {
          const neededType = targetApt.loai_lich === 'kham_moi' ? 'kham' : 'dieu_tri';
          setActiveType(neededType);
        }
      }

      // Xóa NGAY triggerFocus & appointmentId khỏi URL để không bị dính khi người dùng chuyển tab hoặc đổi ngày
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
  }, [location.search, loading, navigate, location.pathname, setIsWalkInModalOpen, appointments, startDate, endDate, viewMode]);

  // Update URL search parameters when date or view changes (without loop)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // If we're currently in the middle of a triggerFocus, don't interfere
    if (params.get('triggerFocus') === 'true') return;

    const currentStart = params.get('startDate');
    const currentEnd = params.get('endDate');
    const currentView = params.get('view');
    const newStart = format(startDate, 'yyyy-MM-dd');
    const newEnd = format(endDate, 'yyyy-MM-dd');

    if (currentStart !== newStart || currentEnd !== newEnd || currentView !== viewMode) {
      params.set('startDate', newStart);
      params.set('endDate', newEnd);
      params.set('view', viewMode);
      params.delete('date');

      const newSearch = `?${params.toString()}`;
      if (location.search !== newSearch) {
        navigate(location.pathname + newSearch, { replace: true });
      }
    }
  }, [startDate, endDate, viewMode, navigate, location.pathname, location.search]);

  const getKpiAppointments = () => {
    const startBound = new Date(startDate);
    startBound.setHours(0, 0, 0, 0);
    const endBound = new Date(endDate);
    endBound.setHours(23, 59, 59, 999);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.ngay_gio_bat_dau || '');
      return aptDate >= startBound && aptDate <= endBound;
    });
  };
  const kpiAppointments = getKpiAppointments();

  const kpis = computeAppointmentKpiBuckets(kpiAppointments);

  // A5 — 1 màn hình duy nhất cho mọi ngày đơn lẻ: viewMode 'timeline' (dù đang xem hôm nay hay ngày
  // khác) luôn dùng TodayFlowBoard (nhóm dòng chảy) — không còn tách theo "hôm nay"/"ngày khác",
  // không còn rơi về AppointmentCalendar cũ dạng slot-giờ. Chỉ khoảng nhiều ngày (viewMode capacity,
  // "Bảng công suất") mới dùng CapacityView + 4 thẻ KPI riêng.
  const isCapacityView = viewMode === 'capacity';

  const dayTypedAppointments = useMemo(() => {
    const dayStr = format(startDate, 'yyyy-MM-dd');
    return appointments.filter(apt => format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd') === dayStr);
  }, [appointments, startDate]);

  const handleQuickCheckin = async (apt: any) => {
    await handleUpdateAppointmentFields(String(apt.id), { trang_thai: 'da_checkin' }, `Đã check-in cho ${apt.ten_khach_hang || apt.ho_ten_khach || 'khách hàng'}`);

    // Kiểm tra xem ca này có chọn đích danh nhân sự và nhân sự đó đang bận ca khác không
    const assignedId = apt.nhan_su_id || apt.bac_si_id || apt.chuyen_gia_id;
    if (assignedId) {
      try {
        const res = await getStaffWorkload();
        const workload = res.data || [];
        const staffInfo = workload.find((w) => String(w.nhan_su_id) === String(assignedId));
        if (staffInfo && staffInfo.so_ca_dang_lam > 0 && staffInfo.thoi_gian_xong_du_kien_muon_nhat) {
          const finishDate = new Date(staffInfo.thoi_gian_xong_du_kien_muon_nhat);
          const finishStr = format(finishDate, 'HH:mm');
          const estEntryDate = addMinutes(finishDate, 5);
          const estEntryStr = format(estEntryDate, 'HH:mm');
          toast(`⏰ ${staffInfo.ten_vai_tro} ${staffInfo.ho_ten} đang bận ca khác (dự kiến xong ~${finishStr}). Khách hàng dự kiến vào phòng lúc ${estEntryStr} hoặc sớm hơn.`, {
            duration: 7000,
            icon: 'ℹ️'
          });
        }
      } catch (e) {
        console.warn('Lỗi kiểm tra tải nhân sự khi checkin:', e);
      }
    }
  };

  // B11 (bản Lễ tân) — đẩy khách xuống cuối hàng đợi (đi vệ sinh/bỏ về tạm...), không đổi trạng thái.
  const handlePushBack = async (apt: any) => {
    try {
      await pushBackAppointment(String(apt.id));
      toast(`Đã đẩy ${apt.ten_khach_hang || apt.ho_ten_khach || 'khách'} xuống cuối hàng đợi.`, { icon: '⬇' });
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật hàng đợi.');
    }
  };

  // Lễ tân tự tay chuyển "Không đến" cho ca đã check-in (đã gọi/đẩy nhiều lần mà khách vẫn không tới).
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
      toast.success(`🎉 Đã chuyển ${customerName} về Hàng chờ chung thành công!`);
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể giải phóng chỉ định nhân sự.');
    } finally {
      setPendingUnassignApt(null);
    }
  };

  // Danh sách nhân sự theo đúng vai trò đang chọn (Chuyên viên PHCN hoặc KTV) — nguồn cho dropdown lọc trong TodayFlowBoard.
  const onDutyStaffOptions = useMemo(() => {
    const isKham = activeType === 'kham';
    return staffList
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
  }, [staffList, activeType]);

  return (
    <div className="space-y-6 max-w-full font-jakarta">
      {/* KPI METRIC CARDS — chỉ hiện ở "Bảng công suất" (nhiều ngày): statusFilter mà các thẻ này
          set không tác động tới TodayFlowBoard (bảng dòng chảy có nhóm/anchor-nav riêng, cố ý không
          lọc theo trạng thái — xem lý do trong kế hoạch A5), nên giữ card ở màn hình 1 ngày chỉ tạo
          cảm giác "lọc được" trong khi bấm vào không đổi gì trên bảng bên dưới. */}
      {isCapacityView && (
        <>
          <AppointmentKpiCards
            role="receptionist"
            kpis={kpis}
            viewMode={viewMode}
            timeRange="custom"
            activeType={activeType}
            activeStatusFilter={statusFilter}
            onSelectStatus={setStatusFilter}
          />

          {statusFilter && (
            <ActiveFilterChip
              label={`Đang lọc: ${KPI_BUCKET_LABELS[statusFilter]}`}
              onClear={() => setStatusFilter(null)}
            />
          )}
        </>
      )}

          {/* Nếu mở form đặt lịch tại quầy hoặc xem bảng công suất thì hiển thị thanh bộ lọc độc lập */}
          {(isWalkInModalOpen || viewMode === 'capacity') && (
            <AppointmentsFilterBar
              startDate={startDate}
              endDate={endDate}
              appointments={appointments}
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
                    label={`Lịch ${activeType === 'kham' ? 'Chuyên viên tư vấn' : 'Kỹ thuật viên'}: ${staffList.find(s => String(s.id) === String(selectedStaffFilter))?.ho_ten || 'Chuyên gia'}`}
                    onClear={() => setSelectedStaffFilter(null)}
                  />
                </div>
              )}

              {isWalkInModalOpen ? (
                <div ref={bookingFormRef} className="scroll-mt-6">
                  <WalkInBookingModal
                    roomsList={roomsList}
                    staffList={staffList}
                    appointments={appointments}
                    schedulesList={schedulesList}
                    servicesList={services}
                    onClose={() => {
                      setIsWalkInModalOpen(false);
                      const newParams = new URLSearchParams(location.search);
                      newParams.delete('khach_hang_id');
                      newParams.delete('goi_dich_vu_id');
                      newParams.delete('phac_do_id');
                      newParams.delete('buoi');
                      const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
                      navigate(location.pathname + newSearch, { replace: true });
                    }}
                    onSubmitApi={handleBookWalkIn}
                    bookingLoading={bookingLoading}
                    initialTime={walkInTime}
                    activeType={activeType}
                    isReceptionist={true}
                    selectedDateStr={format(startDate, 'yyyy-MM-dd')}
                    initialCustomerId={new URLSearchParams(location.search).get('khach_hang_id') || undefined}
                    initialServiceId={new URLSearchParams(location.search).get('goi_dich_vu_id') || undefined}
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
                          appointments={appointments}
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
                      appointments={dayTypedAppointments}
                      activeType={activeType}
                      searchTerm={searchTerm}
                      staffList={staffList}
                      schedulesList={schedulesList}
                      selectedDateStr={format(startDate, 'yyyy-MM-dd')}
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
                      appointments={appointments.filter(apt =>
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
                      staffList={staffList}
                      onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
                    />
                  )}
                </>
              )}
          </div>

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
          appointments={appointments}
          schedulesList={schedulesList}
          isReceptionistOverride={true}
          selectedBuoi={selectedBuoi}
          setSelectedBuoi={setSelectedBuoi}
          rescheduleDate={rescheduleDate}
          setRescheduleDate={setRescheduleDate}
        />
      )}

      <StaffWorkloadModal
        isOpen={isWorkloadModalOpen}
        onClose={() => setIsWorkloadModalOpen(false)}
        dateStr={format(startDate, 'yyyy-MM-dd')}
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
                từ ca của <strong>{pendingUnassignApt.ten_ky_thuat_vien || pendingUnassignApt.bac_si_ten || pendingUnassignApt.ten_bac_si || pendingUnassignApt.ten_nhan_su || 'nhân sự'}</strong> về <strong>Nhân sự: Bất kỳ</strong> không?
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
