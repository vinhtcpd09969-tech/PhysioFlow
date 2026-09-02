import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import { Stethoscope, PhoneCall } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';

import { AppointmentInfoModal } from '../../../../components/appointments';
import { AppointmentsFilterBar } from '../../../../components/appointments/ui/AppointmentsFilterBar';
import { AppointmentKpiCards } from '../../../../components/appointments/ui/AppointmentKpiCards';
import { CapacityView } from '../../../../components/appointments/ui/CapacityView';
import { SpecialistFlowBoard } from '../../components/SpecialistFlowBoard';

import { getAppointments, DoctorAppointment } from '../../api/doctor.api';
import { computeAppointmentKpiBuckets, KPI_BUCKET_STATUSES, KPI_BUCKET_LABELS, AppointmentKpiBuckets } from '../../../../utils/appointmentKpi';
import { ActiveFilterChip } from '../../../../components/appointments/ui/ActiveFilterChip';

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);

  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state for viewing finished/cancelled appointments
  const [selectedApt, setSelectedApt] = useState<any>(null);

  // Confirm Modal state for Checked-in ca
  const [confirmApt, setConfirmApt] = useState<any>(null);

  useEffect(() => {
    const pending = (location.state as any)?.pendingConfirmAppointment;
    if (pending) {
      setConfirmApt(pending);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  // Filter States - Mặc định viewMode là 'timeline' để mở ngay Bảng Flow Board giống Lễ tân (Ảnh 3)
  const [timeRange] = useState<'today' | '7days' | 'month' | 'custom'>('7days');
  const [viewMode, setViewMode] = useState<'timeline' | 'capacity'>('timeline');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const [statusFilter, setStatusFilter] = useState<Exclude<keyof AppointmentKpiBuckets, 'total'> | null>(null);

  const activeInterval = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [startDate, endDate]);

  // Fetch appointments and schedules
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startIso = activeInterval.start.toISOString();
      const endIso = activeInterval.end.toISOString();
      
      const apptRes = await getAppointments(startIso, endIso);
      setAppointments(apptRes.data);
    } catch (error) {
      console.error('Lỗi khi tải lịch khám:', error);
    } finally {
      setLoading(false);
    }
  }, [activeInterval]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // B2/B11/B19 — poll lặng lẽ mỗi 8s (cùng nhịp với useAppointmentsData bên Lễ tân/Admin) để nhân sự
  // thấy kịp thời khi Lễ tân "Đẩy xuống" một khách từ máy khác (khác trình duyệt/thiết bị — không
  // còn tín hiệu localStorage tức thời nữa, xem cảnh báo ở AGENTS.md §2.5). KHÔNG gọi setLoading, chỉ
  // âm thầm cập nhật appointments — tránh nhấp nháy spinner toàn màn hình mỗi 8 giây.
  useEffect(() => {
    const startIso = activeInterval.start.toISOString();
    const endIso = activeInterval.end.toISOString();
    const interval = setInterval(() => {
      getAppointments(startIso, endIso)
        .then((res) => setAppointments(res.data))
        .catch((err) => console.error('Silent refresh failed:', err));
    }, 8000);
    return () => clearInterval(interval);
  }, [activeInterval]);

  // QUY TẮC HIỂN THỊ CẨN MẬT (VISIBILITY RULES):
  // 1. Ca đặt "Bất kỳ" (nhan_su_id IS NULL): Mọi Bác sĩ trong ca đều thấy.
  // 2. Ca đặt chọn đích danh Bác sĩ A (nhan_su_id = A): CHỈ Bác sĩ A thấy. Bác sĩ B sẽ KHÔNG THẤY!
  const doctorVisibleAppointments = useMemo(() => {
    const currentUserIdStr = String(user?.id);
    return appointments.filter(a => {
      const aptStaffId = (a as any).bac_si_id || (a as any).nhan_su_id;
      if (aptStaffId && String(aptStaffId) !== currentUserIdStr) {
        return false; // Lịch của Bác sĩ khác -> ẨN BỎ
      }
      return true; // Lịch của mình HOẶC "Bất kỳ" -> HIỂN THỊ
    });
  }, [appointments, user?.id]);

  const kpiStats = useMemo(() => computeAppointmentKpiBuckets(doctorVisibleAppointments), [doctorVisibleAppointments]);

  const searchedAppointments = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    return doctorVisibleAppointments.filter(a => {
      const matchSearch = !lower ||
        a.ten_khach_hang?.toLowerCase().includes(lower) ||
        a.ma_lich_dat?.toLowerCase().includes(lower) ||
        a.so_dien_thoai?.toLowerCase().includes(lower);
      const matchStatus = !statusFilter || KPI_BUCKET_STATUSES[statusFilter].includes(a.trang_thai);
      return matchSearch && matchStatus;
    });
  }, [doctorVisibleAppointments, searchTerm, statusFilter]);

  const mappedAppointments = useMemo(() => {
    return searchedAppointments.map(apt => ({
      ...apt,
      loai_lich: (apt as any).loai_lich || 'kham_moi',
      bac_si_id: (apt as any).bac_si_id || (apt as any).nhan_su_id || null,
      chuyen_gia_id: (apt as any).chuyen_gia_id || (apt as any).bac_si_id || (apt as any).nhan_su_id || null,
    }));
  }, [searchedAppointments]);

  const handleOpenDetailModal = useCallback((apt: any) => {
    if (['dang_kham', 'da_checkin'].includes(apt.trang_thai)) {
      setConfirmApt(apt);
    } else {
      setSelectedApt(apt);
    }
  }, []);

  const handleCallIn = (apt: any) => {
    toast.success(`🔊 Đã phát tín hiệu gọi khách hàng ${apt.ten_khach_hang} vào phòng!`);
  };

  const handleOpenDesk = (aptId: string) => {
    navigate(`/doctor/appointments/${aptId}/assess`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jakarta">
      
      {/* KPI METRIC CARDS — Chỉ hiện khi ở view Bảng công suất */}
      {viewMode === 'capacity' && (
        <>
          <AppointmentKpiCards
            role="doctor"
            kpis={kpiStats}
            viewMode={viewMode}
            timeRange={timeRange}
            activeType="kham"
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

      {/* FILTER BAR */}
      <AppointmentsFilterBar
        startDate={startDate}
        endDate={endDate}
        onSelectDateRange={handleSelectDateRange}
        handleNavigateRange={handleNavigateRange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        activeType="kham"
        onToggleType={() => {}}
        canToggleType={false}
        setViewMode={setViewMode}
      />

      {/* WORKBOARD: TODAY FLOW BOARD (GIỐNG LỄ TÂN ĐƯỢC CHUYÊN BIỆT CHO BÁC SĨ) */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-24 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang đồng bộ lịch trình Chuyên viên...</p>
        </div>
      ) : (
        <>
          {viewMode === 'timeline' ? (
            <SpecialistFlowBoard
              appointments={mappedAppointments as any}
              currentUserId={user?.id || ''}
              selectedDateStr={format(startDate, 'yyyy-MM-dd')}
              searchTerm={searchTerm}
              onOpenDetailModal={handleOpenDetailModal}
              onRefresh={loadData}
            />
          ) : (
            <CapacityView
              selectedDate={startDate}
              setSelectedDate={(d) => {
                setStartDate(d);
                setEndDate(d);
                setViewMode('timeline');
              }}
              setViewMode={setViewMode}
              appointments={mappedAppointments}
              timeRange="custom"
              startDate={startDate}
              endDate={endDate}
              activeType="kham"
              searchTerm={searchTerm}
              onSelectAppointment={(id: string) => {
                const apt = appointments.find(a => String(a.id) === String(id));
                if (apt) handleOpenDetailModal(apt);
              }}
              activeStatusLabel={statusFilter ? KPI_BUCKET_LABELS[statusFilter] : null}
            />
          )}
        </>
      )}

      {/* Detail Modal cho ca đã hoàn thành / hủy */}
      <AppointmentInfoModal appointment={selectedApt} onClose={() => setSelectedApt(null)} />

      {/* Modal xác nhận chuyển sang Bàn Tư Vấn khi click ca Đã check-in */}
      {confirmApt && (() => {
        const isStarted = confirmApt.trang_thai === 'dang_kham';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative space-y-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`size-12 rounded-2xl flex items-center justify-center ${isStarted ? 'bg-amber-50 dark:bg-amber-955/30 text-amber-500 animate-pulse' : 'bg-teal-50 dark:bg-teal-955/30 text-[#0D9488]'}`}>
                  <Stethoscope size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase tracking-wide">
                    {isStarted ? 'Ca hẹn đang thực hiện' : 'Xác nhận Khách đã vào phòng'}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold leading-relaxed">
                    Khách hàng: <span className="text-slate-900 dark:text-zinc-100 font-black">{confirmApt.ten_khach_hang}</span>
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-955/30 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50">
                    💡 Vui lòng đảm bảo khách hàng đã có mặt trong phòng trước khi bấm mở bàn làm việc.
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => handleCallIn(confirmApt)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
                  >
                    <PhoneCall size={15} />
                    <span>📞 Phát tín hiệu Gọi vào phòng (Báo Lễ tân)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const aptId = confirmApt.id;
                      setConfirmApt(null);
                      handleOpenDesk(String(aptId));
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Stethoscope size={15} />
                    <span>🩺 Mở Bàn Tư Vấn / Lượng Giá Riêng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmApt(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer mt-1"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
