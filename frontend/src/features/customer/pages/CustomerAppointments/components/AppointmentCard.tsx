import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Sparkles,
  MapPin,
  Building2,
  XCircle,
  FileText,
  RefreshCw,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { resolveImageUrl } from '../../../../../utils/imageUrl';

interface AppointmentCardProps {
  app: any;
  currentTime: Date;
  getStatusColorClass: (status: string) => string;
  getCountdownString: (startTimeIso: string, buoi?: string | null) => string;
  onViewTimeline: (app: any) => void;
  onViewTreatmentDetail: (app: any) => void;
  onOpenReschedule: (app: any) => void;
  onOpenCancel: (appId: string) => void;
  onOpenPolicy?: () => void;
}

export const AppointmentCard = forwardRef<HTMLDivElement, AppointmentCardProps>(function AppointmentCard({
  app,
  currentTime,
  getStatusColorClass,
  getCountdownString,
  onViewTimeline,
  onViewTreatmentDetail,
  onOpenReschedule,
  onOpenCancel,
  onOpenPolicy
}: AppointmentCardProps, ref) {
  const gradientStatus = getStatusColorClass(app.trang_thai);
  const docAvatar = resolveImageUrl(app.anh_bac_si);

  const isConfirmed = app.trang_thai === 'da_xac_nhan';
  const isCompleted = app.trang_thai === 'hoan_thanh';
  const isCancelled = ['da_huy', 'khong_den'].includes(app.trang_thai);
  const isPendingReExam = app.trang_thai === 'cho_tai_luong_gia';

  const isPaidOrPending = app.trang_thai_thanh_toan === 'da_thanh_toan' || app.trang_thai_thanh_toan === 'dang_cho_thanh_toan';
  const isPaid = app.trang_thai_thanh_toan === 'da_thanh_toan';

  // Parse Date Info
  const apptDateObj = new Date(app.ngay_gio_bat_dau);
  const dayNum = apptDateObj.getDate();
  const monthNum = apptDateObj.getMonth() + 1;
  const yearNum = apptDateObj.getFullYear();
  const weekdayName = apptDateObj.toLocaleDateString('vi-VN', { weekday: 'long' });

  // Tính thời gian đếm ngược 60 phút tự HỦY (Lịch chưa thanh toán)
  const CANCEL_WINDOW_MS = 60 * 60 * 1000;
  const elapsedSinceBookingMs = app.thoi_gian_tao ? currentTime.getTime() - new Date(app.thoi_gian_tao).getTime() : Infinity;
  const remainingCancelMs = Math.max(0, CANCEL_WINDOW_MS - elapsedSinceBookingMs);
  const remainingCancelSecs = Math.floor(remainingCancelMs / 1000);
  const canSelfCancel = !isPaidOrPending
    && remainingCancelSecs > 0
    && app.trang_thai === 'da_xac_nhan'
    && currentTime.getTime() < new Date(app.ngay_gio_ket_thuc).getTime();

  // Định dạng MM:SS cho nút Hủy Lịch
  const cancelMinsStr = Math.floor(remainingCancelSecs / 60);
  const cancelSecsStr = String(remainingCancelSecs % 60).padStart(2, '0');
  const cancelCountdownLabel = `${cancelMinsStr}:${cancelSecsStr}`;

  // Tính thời gian tự ĐỔI LỊCH (Lịch đã thanh toán)
  const apptDateStr = `${apptDateObj.getFullYear()}-${String(apptDateObj.getMonth() + 1).padStart(2, '0')}-${String(apptDateObj.getDate()).padStart(2, '0')}`;
  const todayStr = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
  const isTodayAppt = apptDateStr === todayStr;
  const isPastDate = apptDateStr < todayStr;

  const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isMorningAppt = app.buoi === 'sang' || apptDateObj.getHours() < 12;
  const cutoffMins = isMorningAppt ? (7 * 60 + 30 + 135) : (12 * 60 + 225); // 9:45 AM hoặc 15:45 PM
  const isPast50PercentCutoff = isPaid && app.trang_thai === 'da_xac_nhan' && (isPastDate || (isTodayAppt && nowMins >= cutoffMins));
  const canSelfReschedule = isPaid && app.trang_thai === 'da_xac_nhan' && !isPastDate;

  // Đếm ngược mốc 50% buổi cho Lịch Đã Thanh Toán diễn ra hôm nay
  const remainingCutoffMins = Math.max(0, cutoffMins - nowMins);
  const remainingCutoffSecs = Math.max(0, remainingCutoffMins * 60 - currentTime.getSeconds());
  const rescheduleMinsStr = Math.floor(remainingCutoffSecs / 60);
  const rescheduleSecsStr = String(remainingCutoffSecs % 60).padStart(2, '0');
  const rescheduleCountdownLabel = `${rescheduleMinsStr}:${rescheduleSecsStr}`;

  // Dòng thông báo Hotline CHỈ HIỂN THỊ KHI HẾT HẠN TỰ THAO TÁC ONLINE
  const showWarningNotice = app.trang_thai === 'da_xac_nhan' && (
    (!isPaidOrPending && remainingCancelSecs <= 0) ||
    (isPaid && (isPast50PercentCutoff || isPastDate))
  );

  const isPackageSession = app.loai_goi === 'LIEU_TRINH' && !!app.so_thu_tu_buoi;

  const getInitials = (fullName: string | null) => {
    if (!fullName) return 'BS';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Helper format lý do hủy / vắng mặt: Bỏ các câu kỹ thuật trong ngoặc đơn
  const formatCancelReason = (rawReason?: string | null) => {
    if (!rawReason) return 'Quá giờ đón tiếp quy định hoặc đã hủy trực tuyến.';
    // Bỏ phần trong ngoặc tròn ở cuối ví dụ (Đã thanh toán online — Phòng khám giữ tiền, không phạt vi phạm)
    const cleaned = rawReason.replace(/\s*\([^)]*\)\s*$/g, '').trim();
    return cleaned || rawReason;
  };

  const isMorningSession = app.buoi === 'sang';
  const durationMins = app.thoi_luong_phut || 30;
  const sessionEndMins = isMorningSession ? (12 * 60) : (20 * 60);
  const latestArrivalMins = sessionEndMins - durationMins;
  const latestH = Math.floor(latestArrivalMins / 60);
  const latestM = latestArrivalMins % 60;
  const latestArrivalStr = `${String(latestH).padStart(2, '0')}:${String(latestM).padStart(2, '0')}`;
  const sessionStartStr = isMorningSession ? '07:30' : '12:00';

  const renderStatusBadge = () => {
    if (['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(app.trang_thai)) {
      return (
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-rose-50 border-rose-200/80 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400">
          Vắng mặt (No-Show)
        </span>
      );
    }
    if (['da_huy', 'da_huy_phat'].includes(app.trang_thai)) {
      return (
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-slate-100 border-slate-200 text-slate-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
          Đã hủy
        </span>
      );
    }
    if (app.trang_thai === 'hoan_thanh') {
      return (
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300">
          Hoàn thành
        </span>
      );
    }
    if (app.trang_thai === 'dang_kham') {
      return (
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300 animate-pulse">
          Đang thực hiện
        </span>
      );
    }
    if (app.trang_thai === 'da_checkin') {
      return (
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300">
          Đã check-in
        </span>
      );
    }
    if (app.trang_thai === 'cho_tai_luong_gia') {
      return (
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-300">
          Chờ tái lượng giá
        </span>
      );
    }
    return (
      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
        isPaid
          ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-900/60 dark:text-teal-300'
          : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
      }`}>
        {isPaid ? 'Đã thanh toán' : 'Đã xác nhận'}
      </span>
    );
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      key={app.id}
      className="bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200/90 dark:border-zinc-800 rounded-3xl hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-300 relative overflow-hidden shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-start gap-5"
    >
      {/* Accent status bar on the left */}
      <div className={`absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-b ${gradientStatus}`} />

      {/* ============================================================ */}
      {/* KHỐI 1: THỜI GIAN & NGÀY THÁNG (LEFT COLUMN) */}
      {/* ============================================================ */}
      <div className="md:w-56 shrink-0 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60">
        <div className="space-y-0.5 text-left">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 capitalize block">
            {weekdayName}, {yearNum}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 font-jakarta tracking-tight">
              {String(dayNum).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
              Tháng {monthNum}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-right md:text-left shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/80">
            <Clock size={12} className="text-teal-600 dark:text-teal-400" />
            <span>{isMorningSession ? 'Sáng (07:30 – 12:00)' : 'Chiều (12:00 – 20:00)'}</span>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 dark:text-zinc-400 block">
            Thời lượng: <strong className="text-slate-700 dark:text-zinc-300">{durationMins} phút</strong>
          </div>
        </div>

        {/* Countdown for Confirmed */}
        {isConfirmed && (
          <div 
            title={getCountdownString(app.ngay_gio_bat_dau, app.buoi)}
            className="w-full text-[10.5px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2 flex items-center justify-center gap-1.5 animate-pulse mt-0.5 text-center leading-snug"
          >
            <span className="shrink-0">⏳</span>
            <span>{getCountdownString(app.ngay_gio_bat_dau, app.buoi)}</span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* KHỐI 2: TOÀN BỘ THÔNG TIN DỊCH VỤ & CỤM NÚT HÀNH ĐỘNG */}
      {/* ============================================================ */}
      <div className="flex-1 space-y-3.5 min-w-0">
        {/* Top Header: Badges (Left) & Action Buttons (Right) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-2.5">
          {/* Badges line */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
              {app.ma_lich_dat}
            </span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
              app.loai_lich === 'kham_moi' || app.loai_goi === 'KHAM'
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300'
                : 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-300'
            }`}>
              {app.loai_lich === 'kham_moi' || app.loai_goi === 'KHAM' ? 'Lượng giá' : 'Trị liệu'}
            </span>
            {isPackageSession && (
              <span className="text-[9px] font-black text-teal-800 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                Buổi {app.so_thu_tu_buoi} / {app.tong_so_buoi_goi ?? '?'}
              </span>
            )}
            {renderStatusBadge()}
          </div>

          {/* Action Buttons Hub (Aligned at Top Right of Content) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onViewTimeline(app)}
              className="bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-bold text-xs py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-slate-300"
            >
              <Clock size={12} className="text-teal-600 dark:text-teal-400" />
              <span>Lịch sử trạng thái</span>
            </button>

            {isCompleted && (
              <button
                type="button"
                onClick={() => onViewTreatmentDetail(app)}
                className="bg-slate-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <FileText size={12} />
                <span>Chi tiết buổi</span>
              </button>
            )}

            {/* NÚT TỰ ĐỔI LỊCH CHO LỊCH ĐÃ THANH TOÁN */}
            {canSelfReschedule && (
              <button
                type="button"
                disabled={isPast50PercentCutoff}
                onClick={() => onOpenReschedule(app)}
                className={`font-bold text-xs py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 ${
                  isPast50PercentCutoff
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-zinc-700 cursor-not-allowed'
                    : 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-pointer shadow-2xs'
                }`}
                title={isPast50PercentCutoff ? 'Đã quá 50% thời lượng buổi hôm nay. Vui lòng gọi hotline 1900 6868.' : 'Tự đổi ngày/buổi mới'}
              >
                <RefreshCw size={12} className={isPast50PercentCutoff ? '' : 'text-teal-600'} />
                <span>
                  {isPast50PercentCutoff
                    ? 'Khóa sát giờ'
                    : isTodayAppt
                    ? `Đổi lịch (${rescheduleCountdownLabel})`
                    : `Đổi lịch`}
                </span>
              </button>
            )}

            {/* NÚT HỦY LỊCH CHO LỊCH CHƯA THANH TOÁN */}
            {app.trang_thai === 'da_xac_nhan' && canSelfCancel && (
              <button
                type="button"
                onClick={() => onOpenCancel(app.id)}
                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-bold text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                title="Tự hủy online trong vòng 60 phút kể từ lúc đăng ký"
              >
                <XCircle size={12} className="text-rose-500" />
                <span>Hủy lịch ({cancelCountdownLabel})</span>
              </button>
            )}
          </div>
        </div>

        {/* Service Title */}
        <div>
          <h3 className="font-heading font-black text-slate-900 dark:text-zinc-100 text-base sm:text-lg leading-snug tracking-tight">
            {app.ten_dich_vu || 'Buổi Lượng Giá Chức Năng Ban Đầu'}
          </h3>
        </div>

        {/* Staff & Room info inline */}
        {!isCancelled && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                {docAvatar ? (
                  <img src={docAvatar} alt={app.ten_ky_thuat_vien} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] font-black text-slate-600 dark:text-zinc-300">{getInitials(app.ten_ky_thuat_vien)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-zinc-500 font-medium">Phụ trách:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {app.ten_ky_thuat_vien || <em className="text-amber-600 font-medium">Đang phân công</em>}
                </span>
                {app.buoi === 'chieu' && app.ca_gio_ket_thuc && app.ca_gio_ket_thuc < '20:00' && (
                  <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100/70 border border-amber-300/80 px-1.5 py-0.5 rounded-md">
                    Trực đến {app.ca_gio_ket_thuc}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
              <Building2 size={13} className="shrink-0 text-slate-400" />
              <span>Phòng: <strong className={app.ten_phong ? 'text-slate-800 dark:text-zinc-200' : 'text-amber-600'}>{app.ten_phong || 'Đang xếp'}</strong></span>
            </div>
          </div>
        )}

        {/* Completed Thank-You Banner */}
        {isCompleted && (
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
            <Heart size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-800 dark:text-emerald-200 block">
                Cảm ơn Quý khách đã tin tưởng và đồng hành cùng trung tâm!
              </span>
              <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 font-medium">
                Buổi trị liệu đã hoàn tất thành công. Chúc Quý khách phục hồi nhanh chóng và duy trì sức khỏe tốt!
              </p>
            </div>
          </div>
        )}

        {/* Cancellation / No-Show Reason Alert */}
        {isCancelled && (
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide">
              <XCircle size={14} />
              <span>{app.trang_thai.includes('huy') ? 'Đã Hủy Lịch Hẹn' : 'Vắng Mặt (No-Show)'}</span>
            </div>
            <p className="text-xs text-rose-800/90 dark:text-rose-300 font-medium leading-relaxed">
              Lý do: {formatCancelReason(app.ghi_chu_noi_bo)}
            </p>
            <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300 flex flex-wrap items-center gap-1">
              <span>Quý khách có bất kỳ thắc mắc về lịch hẹn vui lòng liên hệ hotline <strong className="font-bold text-rose-950 dark:text-rose-100">1900 6868</strong> để được hỗ trợ.</span>
              <button
                type="button"
                onClick={() => onOpenPolicy?.()}
                className="font-black text-teal-700 dark:text-teal-300 underline underline-offset-2 hover:text-teal-900 dark:hover:text-teal-100 cursor-pointer ml-1 inline-flex items-center gap-0.5"
              >
                Xem chính sách
              </button>
            </div>
          </div>
        )}

        {/* Pending Re-Exam Alert */}
        {isPendingReExam && (
          <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
              <Sparkles size={14} className="text-amber-600" />
              <span>Chờ Tái Lượng Giá Sau Khi Chụp Chiếu Ngoài</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
              Quý khách vui lòng mang kết quả phim chụp quay lại quầy lễ tân để tiếp tục phác đồ điều trị.
            </p>
          </div>
        )}

        {/* Notes / Internal Note Box */}
        {!isCancelled && app.ghi_chu_noi_bo && (
          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <span className="font-bold shrink-0">📝 Ghi chú:</span>
            <span className="font-medium italic">"{app.ghi_chu_noi_bo}"</span>
          </div>
        )}

        {/* Hotline Warning Notice */}
        {showWarningNotice && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>
                {isPaid
                  ? (isPastDate ? 'Buổi hẹn đã quá ngày tiếp đón' : 'Đã sát khung giờ tiếp đón')
                  : 'Đã hết thời hạn tự thao tác online'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
              Vui lòng liên hệ Hotline: <strong className="text-slate-900 dark:text-zinc-100 font-bold">1900 6868</strong> hoặc chat với phòng khám để được hỗ trợ trực tiếp.
            </p>
          </div>
        )}

        {/* Always Visible Arrival Guidance & Address */}
        {!isCancelled && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700 space-y-1.5 text-xs">
            <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              💡 Quý khách vui lòng có mặt tại trung tâm từ <strong>{sessionStartStr}</strong> đến <strong>trước {latestArrivalStr}</strong> để được tiếp đón chu đáo nhất.
            </p>
            <div className="flex items-start gap-1.5 text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-200/60 dark:border-zinc-700/60 text-[11px] font-medium">
              <MapPin size={13} className="shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
              <span><strong>Cơ sở OfficeCare:</strong> 123 Nguyễn Văn Cừ, Phường 2, Quận 5, TP. Hồ Chí Minh (Tầng 3)</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
