import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  X, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle
} from 'lucide-react';
import { format, startOfWeek, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

import AppointmentCalendar from '../../../admin/components/appointments/AppointmentCalendar';
import { AppointmentsFilterBar } from '../../../admin/components/appointments/ui/AppointmentsFilterBar';
import { CapacityView } from '../../../admin/components/appointments/ui/CapacityView';
import { getAppointments, getDoctorSchedules, DoctorAppointment, DoctorSchedule } from '../../api/doctor.api';

const STATUS_CONFIG: any = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-955/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30' },
  da_checkin: { label: 'Đã check-in', color: 'bg-teal-50 text-teal-700 dark:bg-teal-955/30 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30' },
  cho_kham: { label: 'Chờ khám', color: 'bg-blue-50 text-blue-700 dark:bg-blue-955/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' },
  dang_kham: { label: 'Đang khám', color: 'bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 animate-pulse' },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' },
  da_huy: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 dark:bg-rose-955/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' },
  khong_den: { label: 'Không đến', color: 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400' }
};

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state for viewing finished/cancelled appointments
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Confirm Modal state for Checked-in ca
  const [confirmApt, setConfirmApt] = useState<any>(null);

  // Filter States
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'custom'>('today');
  const [viewMode, setViewMode] = useState<'timeline' | 'capacity'>('timeline');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Calculate Active Interval
  const activeInterval = useMemo(() => {
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
    } else { // month
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }, [selectedDate, timeRange]);

  // Fetch appointments and schedules
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startIso = activeInterval.start.toISOString();
      const endIso = activeInterval.end.toISOString();
      
      const [apptRes, schedRes] = await Promise.all([
        getAppointments(startIso, endIso),
        getDoctorSchedules()
      ]);
      
      setAppointments(apptRes.data);
      setSchedules(schedRes.data);
    } catch (error) {
      console.error('Lỗi khi tải lịch hẹn bác sĩ:', error);
    } finally {
      setLoading(false);
    }
  }, [activeInterval]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate dates
  const handleNavigateDay = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
      return;
    }

    const amount = timeRange === 'month' ? 1 : timeRange === '7days' ? 7 : 1;
    if (timeRange === 'month') {
      const monthFn = direction === 'next' ? addMonths : subMonths;
      setSelectedDate(prev => monthFn(prev, 1));
    } else {
      const fn = direction === 'next' ? addDays : subDays;
      setSelectedDate(prev => fn(prev, amount));
    }
  };

  // Giả lập staffList chứa chính bác sĩ đang đăng nhập để hiển thị 1 cột trên calendar
  const staffList = useMemo(() => {
    if (!user) return [];
    return [
      {
        id: user.id,
        chuyen_gia_id: user.id, // Doctor ID matches User ID in doctor layout resolve logic
        ho_ten: user.ho_ten || 'Bác sĩ',
        vai_tro: 'Bác sĩ'
      }
    ];
  }, [user]);

  // Ánh xạ schedules sang định dạng mà AppointmentCalendar hiểu
  const schedulesList = useMemo(() => {
    return schedules.map(s => ({
      nguoi_dung_id: s.nguoi_dung_id,
      ngay: s.ngay.substring(0, 10), // Tránh giờ giấc đằng sau nếu có
      gio_bat_dau: s.gio_bat_dau,
      gio_ket_thuc: s.gio_ket_thuc,
      trang_thai: s.trang_thai
    }));
  }, [schedules]);

  // Tính toán số liệu thống kê ca khám cho Bác sĩ dựa trên activeInterval
  const kpiStats = useMemo(() => {
    // Total Confirmed counts everything except unconfirmed (cho_xac_nhan, chua_xac_nhan) and cancelled (da_huy)
    const totalConfirmed = appointments.filter(a => 
      ['da_xac_nhan', 'da_checkin', 'cho_kham', 'dang_kham', 'hoan_thanh', 'khong_den'].includes(a.trang_thai)
    ).length;
    // Waiting is "da_checkin" and "cho_kham"
    const waiting = appointments.filter(a => ['da_checkin', 'cho_kham'].includes(a.trang_thai)).length;
    const completed = appointments.filter(a => a.trang_thai === 'hoan_thanh').length;
    const cancelled = appointments.filter(a => ['da_huy', 'khong_den'].includes(a.trang_thai)).length;

    const baseCount = appointments.length;
    const getPercentage = (val: number) => {
      if (baseCount <= 0) return 0;
      return Math.min(Math.round((val / baseCount) * 100), 100);
    };

    return {
      total: totalConfirmed,
      waiting,
      completed,
      cancelled,
      waitingPct: getPercentage(waiting),
      completedPct: getPercentage(completed),
      cancelledPct: getPercentage(cancelled)
    };
  }, [appointments]);

  // Search filter
  const searchedAppointments = useMemo(() => {
    if (!searchTerm.trim()) return appointments;
    const lower = searchTerm.toLowerCase();
    return appointments.filter(a => 
      a.ten_khach_hang?.toLowerCase().includes(lower) ||
      a.ma_lich_dat?.toLowerCase().includes(lower) ||
      a.so_dien_thoai?.toLowerCase().includes(lower)
    );
  }, [appointments, searchTerm]);

  // Mapped appointments for CapacityView compatibility
  const mappedAppointments = useMemo(() => {
    return searchedAppointments.map(apt => ({
      ...apt,
      loai_lich: 'kham_moi',
      bac_si_id: user?.id,
      chuyen_gia_id: user?.id
    }));
  }, [searchedAppointments, user]);

  // Daily filtered appointments for the timeline view
  const filteredAppointmentsForDay = useMemo(() => {
    const selectedDateStr = selectedDate.toLocaleDateString('fr-CA');
    return searchedAppointments.filter(apt => {
      const aptDateStr = new Date(apt.ngay_gio_bat_dau).toLocaleDateString('fr-CA');
      return aptDateStr === selectedDateStr;
    });
  }, [searchedAppointments, selectedDate]);

  // Khi bác sĩ click vào 1 card hẹn trên calendar
  const handleOpenDetailModal = useCallback((apt: any) => {
    if (['cho_kham', 'dang_kham', 'da_checkin'].includes(apt.trang_thai)) {
      setConfirmApt(apt);
    } else {
      setSelectedApt(apt);
      setIsDetailOpen(true);
    }
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top filter bar inherited from Admin style */}
      <AppointmentsFilterBar
        timeRange={timeRange}
        setTimeRange={(range) => {
          setTimeRange(range);
          if (range === 'today') {
            setViewMode('timeline');
          } else {
            setViewMode('capacity');
          }
        }}
        startDateOfWeek={activeInterval.start}
        endDateOfWeek={activeInterval.end}
        handleNavigateDay={handleNavigateDay}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        selectedDate={selectedDate}
        activeType="kham"
        onToggleType={() => {}}
      />

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng ca khám (Đã xác nhận) */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="p-[1px] bg-gradient-to-br from-slate-200/60 dark:from-zinc-800 to-transparent hover:from-[#14B8A6]/30 dark:hover:from-[#14B8A6]/20 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(15,23,42,0.02)] transition-all duration-300"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-[23px] p-5 h-full flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#14B8A6]/2 rounded-full blur-2xl group-hover:bg-[#14B8A6]/5 transition-all duration-300 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-slate-400 dark:text-zinc-550 text-[10px] font-black uppercase tracking-wider block">
                  Tổng ca khám
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl xl:text-4xl font-jakarta font-black text-slate-800 dark:text-zinc-100">
                    {kpiStats.total}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-555 font-bold">ca</span>
                </div>
              </div>
              <div className="relative size-10 flex items-center justify-center shrink-0 bg-[#0D9488]/10 rounded-full">
                <Calendar className="text-[#0D9488]" size={18} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] font-black text-[#0D9488] uppercase tracking-wide">
                Tổng ca đã xác nhận
              </span>
              <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-555 bg-slate-55 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800/50">
                100% đạt
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Chờ khám */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="p-[1px] bg-gradient-to-br from-slate-200/60 dark:from-zinc-800 to-transparent hover:from-[#14B8A6]/30 dark:hover:from-[#14B8A6]/20 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(15,23,42,0.02)] transition-all duration-300"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-[23px] p-5 h-full flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#14B8A6]/2 rounded-full blur-2xl group-hover:bg-[#14B8A6]/5 transition-all duration-300 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-slate-400 dark:text-zinc-550 text-[10px] font-black uppercase tracking-wider block">
                  Chờ khám
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl xl:text-4xl font-jakarta font-black text-slate-800 dark:text-zinc-100">
                    {kpiStats.waiting}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-555 font-bold">ca</span>
                </div>
              </div>
              <div className="relative size-10 flex items-center justify-center shrink-0 bg-amber-500/10 rounded-full">
                <AlertCircle className="text-amber-500" size={18} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wide">
                Bệnh nhân đã check-in chờ khám
              </span>
              <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-555 bg-slate-55 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800/50">
                {kpiStats.waitingPct}% đạt
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Đã hoàn thành */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="p-[1px] bg-gradient-to-br from-slate-200/60 dark:from-zinc-800 to-transparent hover:from-[#14B8A6]/30 dark:hover:from-[#14B8A6]/20 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(15,23,42,0.02)] transition-all duration-300"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-[23px] p-5 h-full flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#14B8A6]/2 rounded-full blur-2xl group-hover:bg-[#14B8A6]/5 transition-all duration-300 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-slate-400 dark:text-zinc-550 text-[10px] font-black uppercase tracking-wider block">
                  Đã hoàn thành
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl xl:text-4xl font-jakarta font-black text-slate-800 dark:text-zinc-100">
                    {kpiStats.completed}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-555 font-bold">ca</span>
                </div>
              </div>
              <div className="relative size-10 flex items-center justify-center shrink-0 bg-emerald-500/10 rounded-full">
                <CheckCircle2 className="text-emerald-500" size={18} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wide">
                Đã khám xong
              </span>
              <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-555 bg-slate-55 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800/50">
                {kpiStats.completedPct}% đạt
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Hủy / Vắng mặt */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="p-[1px] bg-gradient-to-br from-slate-200/60 dark:from-zinc-800 to-transparent hover:from-[#14B8A6]/30 dark:hover:from-[#14B8A6]/20 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(15,23,42,0.02)] transition-all duration-300"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-[23px] p-5 h-full flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#14B8A6]/2 rounded-full blur-2xl group-hover:bg-[#14B8A6]/5 transition-all duration-300 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-slate-400 dark:text-zinc-555 text-[10px] font-black uppercase tracking-wider block">
                  Hủy / Vắng mặt
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl xl:text-4xl font-jakarta font-black text-slate-800 dark:text-zinc-100">
                    {kpiStats.cancelled}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-555 font-bold">ca</span>
                </div>
              </div>
              <div className="relative size-10 flex items-center justify-center shrink-0 bg-rose-500/10 rounded-full">
                <HelpCircle className="text-rose-500" size={18} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wide">
                Hủy hoặc vắng mặt
              </span>
              <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-555 bg-slate-55 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800/50">
                {kpiStats.cancelledPct}% đạt
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Navigation Indicator for Timeline view */}
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
            <span>Xem Bảng công suất tuần/tháng</span>
          </button>

          <div className="text-xs font-bold text-slate-505 dark:text-zinc-400 flex items-center gap-2 self-end sm:self-center">
            <span>Đang xem lịch khám ngày:</span>
            <span className="bg-teal-55 dark:bg-teal-955/20 text-[#0d9488] dark:text-teal-450 px-2.5 py-1 rounded-xl border border-teal-100/30 font-black uppercase tracking-wide">
              {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })}
            </span>
          </div>
        </div>
      )}

      {/* Calendar Area */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-24 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang đồng bộ lịch trình...</p>
        </div>
      ) : (
        <>
          {viewMode === 'timeline' ? (
            <AppointmentCalendar
              timeSlots={TIME_SLOTS}
              appointments={filteredAppointmentsForDay}
              allAppointments={searchedAppointments}
              statusConfig={STATUS_CONFIG}
              handleOpenDetailModal={handleOpenDetailModal}
              staffList={staffList}
              schedulesList={schedulesList}
              selectedDateStr={selectedDate.toLocaleDateString('fr-CA')}
              viewMode="doctor"
              currentStaffId={user?.id}
            />
          ) : (
            <CapacityView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setViewMode={setViewMode}
              appointments={mappedAppointments}
              timeRange={timeRange}
              activeType="kham"
            />
          )}
        </>
      )}

      {/* Detail Modal for Finished/Cancelled Appointments */}
      {isDetailOpen && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
                  {selectedApt.ma_lich_dat}
                </span>
                <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase mt-2">Thông tin ca khám</h3>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-secondary dark:text-zinc-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Tên bệnh nhân</p>
                  <p className="font-bold text-sm mt-1">{selectedApt.ten_khach_hang}</p>
                </div>
                <div>
                  <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Số điện thoại</p>
                  <p className="font-bold text-sm mt-1">{selectedApt.so_dien_thoai}</p>
                </div>
              </div>

              <div>
                <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Giờ hẹn khám</p>
                <p className="font-bold mt-1 text-primary">
                  {new Date(selectedApt.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedApt.ngay_gio_ket_thuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div>
                <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Lý do khám bệnh</p>
                <p className="mt-1 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 font-medium">
                  {selectedApt.ly_do_kham || 'Không có ghi chú lý do.'}
                </p>
              </div>

              {selectedApt.chan_doan && (
                <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Chẩn đoán lâm sàng</p>
                    <p className="mt-1 font-bold text-slate-800 dark:text-zinc-200">
                      {selectedApt.chan_doan}
                    </p>
                  </div>

                  {selectedApt.chong_chi_dinh && (
                    <div>
                      <p className="text-rose-500 font-bold uppercase tracking-wider text-[9px]">Chống chỉ định điều trị</p>
                      <p className="mt-1 font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/20 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-900/20">
                        {selectedApt.chong_chi_dinh}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-right">
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Checked-in Appointments */}
      {confirmApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="size-12 bg-teal-50 dark:bg-teal-950/30 rounded-full flex items-center justify-center text-[#0D9488]">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase">Xác nhận vào ca</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                  Bệnh nhân: <span className="text-slate-800 dark:text-zinc-200">{confirmApt.ten_khach_hang}</span>
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {confirmApt.ten_dich_vu}
                </p>
              </div>
              
              <p className="text-xs font-bold text-secondary dark:text-zinc-355">
                Bạn đã sẵn sàng cho ca khám này chưa?
              </p>

              <div className="flex items-center gap-3 w-full pt-3">
                <button
                  onClick={() => setConfirmApt(null)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-355 py-2.5 rounded-xl font-bold transition-all text-xs"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const aptId = confirmApt.id;
                    setConfirmApt(null);
                    navigate(`/doctor/appointments/${aptId}/assess`);
                  }}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-bold transition-all text-xs shadow-md shadow-primary/10"
                >
                  Mở bàn khám
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
