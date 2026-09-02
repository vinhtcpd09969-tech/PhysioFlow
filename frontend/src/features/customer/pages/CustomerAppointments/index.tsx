import { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  XCircle,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';
import { StatusHistoryModal } from '../../../../components/appointments';
import { CancelAppointmentModal } from './components/CancelAppointmentModal';
import { RescheduleAppointmentModal } from './components/RescheduleAppointmentModal';
import { AppointmentRatingModal } from './components/AppointmentRatingModal';
import { PendingRatingBanner } from './components/PendingRatingBanner';
import { AppointmentCard } from './components/AppointmentCard';
import { TermsOfServiceModal } from '../../components/TermsOfServiceModal';

interface Appointment {
  id: string;
  phac_do_dieu_tri_id?: string | null;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  buoi?: string | null;
  thoi_luong_phut?: number | null;
  trang_thai: string;
  trang_thai_kham?: string | null;
  trang_thai_thanh_toan?: string | null;
  loai_lich: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  ten_dich_vu: string | null;
  ten_ky_thuat_vien: string | null;
  ten_phong: string | null;
  ca_gio_bat_dau?: string | null;
  ca_gio_ket_thuc?: string | null;
  chan_doan: string | null;
  chong_chi_dinh: string | null;
  ghi_chu_noi_bo: string | null;
  thoi_gian_huy: string | null;
  ly_do_kham: string | null;
  thoi_gian_tao: string;
  han_xac_nhan?: string | null;
  rating_id?: string | null;
  rating_stars?: number | null;
  rating_comment?: string | null;
  rating_service_id?: string | null;
  rating_service_stars?: number | null;
  rating_service_comment?: string | null;
  rating_staff_id?: string | null;
  rating_staff_stars?: number | null;
  rating_staff_comment?: string | null;
  loai_goi?: string;
  phac_do_status?: string;
  anh_bac_si?: string | null;
  so_thu_tu_buoi?: number | null;
  tong_so_buoi_goi?: number | null;
}

export default function CustomerAppointments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lyDoHuy, setLyDoHuy] = useState<string>('');
  const [ratingApptId, setRatingApptId] = useState<string | null>(null);
  const [selectedTimelineAppt, setSelectedTimelineAppt] = useState<any | null>(null);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  // Reschedule Modal States
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleBuoi, setRescheduleBuoi] = useState<'sang' | 'chieu'>('sang');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState<boolean>(false);

  // Separate rating states
  const [ratingStarsService, setRatingStarsService] = useState<number>(5);
  const [ratingCommentService, setRatingCommentService] = useState<string>('');
  const [ratingStarsStaff, setRatingStarsStaff] = useState<number>(5);
  const [ratingCommentStaff, setRatingCommentStaff] = useState<string>('');

  // Pending ratings list for top notification banner
  const [pendingRatingAppts, setPendingRatingAppts] = useState<any[]>([]);
  const [hideReviewBanner, setHideReviewBanner] = useState<boolean>(() => sessionStorage.getItem('hide_review_banner') === 'true');

  const fetchPendingRatings = async () => {
    try {
      const res = await api.get('/client/appointments/pending-rating');
      setPendingRatingAppts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi nạp danh sách chưa đánh giá:', err);
    }
  };

  // Filtering States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam) return;
    setStartDate(dateParam);
    setEndDate(dateParam);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Time ticker state for realtime countdown
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/client/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lịch hẹn:', error);
      toast.error('Không thể tải danh sách lịch hẹn của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPendingRatings();
  }, []);

  const handleRatingSubmit = async () => {
    if (!ratingApptId) return;
    const toastId = toast.loading('Đang gửi đánh giá...');
    try {
      const appt = appointments.find(a => a.id === ratingApptId) || pendingRatingAppts.find(a => a.id === ratingApptId);
      const isPackage = appt?.loai_goi === 'LIEU_TRINH';
      const isPackageFinished = appt?.phac_do_status === 'hoan_thanh' || appt?.phac_do_status === 'huy';
      const canRateService = !isPackage || isPackageFinished;

      await api.post(`/client/appointments/${ratingApptId}/rate`, {
        rating_dich_vu: canRateService ? ratingStarsService : undefined,
        comment_dich_vu: canRateService ? ratingCommentService : undefined,
        rating_ktv: ratingStarsStaff,
        comment_ktv: ratingCommentStaff
      });
      toast.success('Cảm ơn bạn đã gửi đánh giá cho dịch vụ và nhân sự phụ trách!', { id: toastId });
      setRatingApptId(null);
      setRatingStarsService(5);
      setRatingCommentService('');
      setRatingStarsStaff(5);
      setRatingCommentStaff('');
      fetchAppointments();
      fetchPendingRatings();
    } catch (error: any) {
      console.error('Lỗi khi gửi đánh giá:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá.', { id: toastId });
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingId || !lyDoHuy.trim()) {
      toast.error('Vui lòng cung cấp lý do hủy lịch hẹn!');
      return;
    }

    const toastId = toast.loading('Đang gửi yêu cầu hủy lịch hẹn...');
    try {
      await api.patch(`/client/appointments/${cancellingId}/cancel`, { ghi_chu_noi_bo: lyDoHuy });
      toast.success('Đã gửi yêu cầu hủy lịch hẹn! Vui lòng chờ Trung tâm xác nhận.', { id: toastId });
      setCancellingId(null);
      setLyDoHuy('');
      fetchAppointments();
    } catch (error: any) {
      console.error('Lỗi khi hủy lịch hẹn:', error);
      toast.error(error.response?.data?.message || 'Không thể hủy lịch hẹn.', { id: toastId });
    }
  };


  const getCountdownString = (startTimeIso: string, _buoi?: string | null) => {
    const start = new Date(startTimeIso).getTime();
    const diff = start - currentTime.getTime();
    if (diff <= 0) {
      return 'Đang trong giờ đón tiếp';
    }
    const sec = Math.floor(diff / 1000);
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return `Đón khách sau ${parts.join(' ')}`;
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'da_xac_nhan':
        return 'from-[#0D9488] to-[#14B8A6]';
      case 'da_checkin':
        return 'from-teal-500 to-cyan-400';
      case 'dang_kham':
        return 'from-emerald-500 to-teal-400';
      case 'cho_tai_luong_gia':
        return 'from-amber-400 to-yellow-300';
      case 'cho_huy':
        return 'from-rose-500 to-pink-500';
      case 'da_huy':
      case 'da_huy_phat':
      case 'khong_den':
      case 'khach_khong_den':
      case 'khach_khong_den_phat':
        return 'from-rose-600 to-red-500';
      case 'hoan_thanh':
        return 'from-slate-400 to-slate-500';
      default:
        return 'from-zinc-300 to-zinc-400';
    }
  };

  const handleViewTreatmentDetail = (app: Appointment) => {
    if (app.phac_do_dieu_tri_id || app.loai_goi === 'LIEU_TRINH') {
      navigate(`/medical-record?tab=plans&phac_do_id=${app.phac_do_dieu_tri_id || ''}&cuoc_hen_id=${app.id}&ma_lich=${app.ma_lich_dat}`);
    } else {
      navigate(`/medical-record?tab=assessments&cuoc_hen_id=${app.id}&ma_lich=${app.ma_lich_dat}`);
    }
  };

  // Counters & Metrics
  const totalCount = appointments.length;
  const upcomingCount = appointments.filter(app => app.trang_thai === 'da_xac_nhan').length;
  const completedCount = appointments.filter(app => app.trang_thai === 'hoan_thanh').length;
  const cancelledCount = appointments.filter(app => ['da_huy', 'da_huy_phat', 'cho_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(app.trang_thai)).length;

  // Filter & Priority Sorting implementation
  const filteredAppointments = useMemo(() => {
    const isUpcomingStatus = (status: string) => {
      return ['da_xac_nhan', 'da_checkin', 'dang_kham', 'cho_tai_luong_gia', 'cho_huy'].includes(status);
    };

    const sorted = [...appointments].sort((a, b) => {
      const aUpcoming = isUpcomingStatus(a.trang_thai);
      const bUpcoming = isUpcomingStatus(b.trang_thai);

      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      // 1. So sánh ngày hẹn: ngày gần nhất / mới nhất lên đầu
      const timeA = new Date(a.ngay_gio_bat_dau).getTime();
      const timeB = new Date(b.ngay_gio_bat_dau).getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }

      // 2. Cùng ngày hẹn: lịch nào tạo sau cùng thì hiển thị lên đầu
      const createA = a.thoi_gian_tao ? new Date(a.thoi_gian_tao).getTime() : 0;
      const createB = b.thoi_gian_tao ? new Date(b.thoi_gian_tao).getTime() : 0;
      return createB - createA;
    });

    return sorted.filter((app) => {
      if (statusFilter === 'upcoming') {
        if (!isUpcomingStatus(app.trang_thai)) return false;
      } else if (statusFilter === 'completed') {
        if (app.trang_thai !== 'hoan_thanh') return false;
      } else if (statusFilter === 'cancelled') {
        if (!['da_huy', 'da_huy_phat', 'cho_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(app.trang_thai)) return false;
      }

      if (startDate) {
        const start = new Date(startDate + 'T00:00:00').getTime();
        const appTime = new Date(app.ngay_gio_bat_dau).getTime();
        if (appTime < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59').getTime();
        const appTime = new Date(app.ngay_gio_bat_dau).getTime();
        if (appTime > end) return false;
      }

      return true;
    });
  }, [appointments, statusFilter, startDate, endDate]);

  return (
    <div className="space-y-6 font-jakarta text-[#0F172A] min-h-screen bg-slate-50/50 p-2 sm:p-6 rounded-[32px]">
      {/* Unified Hero Header & Filter Toolbar */}
      <div className="rounded-[32px] p-6 md:p-8 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-5">
        {/* Top: Title & Action */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              Quản lý lịch hẹn cá nhân
            </h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/booking')}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-teal-600/20 cursor-pointer shrink-0 active:scale-95"
          >
            <PlusCircle size={16} /> Đặt Lịch Mới
          </motion.button>
        </div>

        {/* Bottom: Unified Filter Bar (Status Pills + Date Range in ONE clean row) */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3.5">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Tất cả lịch', value: 'all', count: totalCount },
              { label: 'Sắp tới', value: 'upcoming', count: upcomingCount },
              { label: 'Đã hoàn thành', value: 'completed', count: completedCount },
              { label: 'Đã hủy & Vắng mặt', value: 'cancelled', count: cancelledCount }
            ].map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-2 cursor-pointer ${
                  statusFilter === pill.value
                    ? 'bg-[#0D9488] text-white border-transparent shadow-xs scale-[1.02]'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/70 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-750'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${
                  statusFilter === pill.value ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}>
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

          {/* Date Filter Range */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Từ:</span>
              <CustomDatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="Chọn ngày"
                align="right"
                className="w-34"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Đến:</span>
              <CustomDatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="Chọn ngày"
                align="right"
                className="w-34"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Xóa bộ lọc ngày"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Pending Reviews Notification Banner */}
        <PendingRatingBanner
          pendingRatingAppts={pendingRatingAppts}
          hideReviewBanner={hideReviewBanner}
          onDismiss={() => {
            setHideReviewBanner(true);
            sessionStorage.setItem('hide_review_banner', 'true');
          }}
          onOpenRating={(app) => {
            setRatingApptId(app.id);
            setRatingStarsService(app.rating_service_stars || 5);
            setRatingCommentService(app.rating_service_comment || '');
            setRatingStarsStaff(app.rating_staff_stars || 5);
            setRatingCommentStaff(app.rating_staff_comment || '');
          }}
        />

        {/* Appointments List (Clean Full-Width List) */}
        {loading ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-16 text-center space-y-4 shadow-sm flex flex-col items-center justify-center">
            <RefreshCw className="animate-spin text-[#0D9488] size-8" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải lịch hẹn...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="size-12 bg-teal-50 border border-teal-100 text-[#0D9488] rounded-xl flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle size={20} />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="font-heading font-black text-sm text-slate-800">Không tìm thấy ca hẹn nào</h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Không có ca hẹn nào được ghi nhận khớp với bộ lọc thời gian này.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((app) => (
                <AppointmentCard
                  key={app.id}
                  app={app}
                  currentTime={currentTime}
                  getStatusColorClass={getStatusColorClass}
                  getCountdownString={getCountdownString}
                  onViewTimeline={(item) => setSelectedTimelineAppt(item)}
                  onViewTreatmentDetail={handleViewTreatmentDetail}
                  onOpenReschedule={(item) => {
                    setRescheduleAppt(item);
                    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    setRescheduleDate(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`);
                    setRescheduleBuoi('sang');
                  }}
                  onOpenCancel={(appId) => setCancellingId(appId)}
                  onOpenPolicy={() => setShowTermsModal(true)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      <CancelAppointmentModal
        cancellingId={cancellingId}
        cancellingAppt={appointments.find(a => a.id === cancellingId)}
        lyDoHuy={lyDoHuy}
        setLyDoHuy={setLyDoHuy}
        onClose={() => {
          setCancellingId(null);
          setLyDoHuy('');
        }}
        onSubmit={handleCancelSubmit}
      />

      {/* RATING MODAL */}
      <AppointmentRatingModal
        ratingApptId={ratingApptId}
        activeAppt={appointments.find(a => a.id === ratingApptId) || pendingRatingAppts.find(a => a.id === ratingApptId)}
        ratingStarsService={ratingStarsService}
        setRatingStarsService={setRatingStarsService}
        ratingCommentService={ratingCommentService}
        setRatingCommentService={setRatingCommentService}
        ratingStarsStaff={ratingStarsStaff}
        setRatingStarsStaff={setRatingStarsStaff}
        ratingCommentStaff={ratingCommentStaff}
        setRatingCommentStaff={setRatingCommentStaff}
        onClose={() => {
          setRatingApptId(null);
          setRatingStarsService(5);
          setRatingCommentService('');
          setRatingStarsStaff(5);
          setRatingCommentStaff('');
        }}
        onSubmit={handleRatingSubmit}
      />

      {/* RESCHEDULE MODAL */}
      <RescheduleAppointmentModal
        rescheduleAppt={rescheduleAppt}
        rescheduleDate={rescheduleDate}
        setRescheduleDate={setRescheduleDate}
        rescheduleBuoi={rescheduleBuoi}
        setRescheduleBuoi={setRescheduleBuoi}
        rescheduleSubmitting={rescheduleSubmitting}
        onClose={() => setRescheduleAppt(null)}
        onSubmit={async () => {
          if (!rescheduleAppt) return;
          try {
            setRescheduleSubmitting(true);
            await api.patch(`/client/appointments/${rescheduleAppt.id}/reschedule`, {
              new_date: rescheduleDate,
              new_buoi: rescheduleBuoi
            });
            toast.success('Đã đổi lịch hẹn thành công!');
            setRescheduleAppt(null);
            fetchAppointments();
          } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || 'Lỗi đổi lịch hẹn');
          } finally {
            setRescheduleSubmitting(false);
          }
        }}
      />

      {/* STATUS HISTORY TIMELINE MODAL */}
      <StatusHistoryModal
        isOpen={!!selectedTimelineAppt}
        onClose={() => setSelectedTimelineAppt(null)}
        appointment={selectedTimelineAppt}
      />

      {/* TERMS OF SERVICE & POLICY MODAL */}
      <TermsOfServiceModal
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
}
