import { motion } from 'framer-motion';
import { Calendar, CalendarCheck, Stethoscope, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { AppointmentKpiBuckets } from '../../../utils/appointmentKpi';

type FilterableBucketKey = Exclude<keyof AppointmentKpiBuckets, 'total'>;

interface AppointmentKpiCardsProps {
  role: 'admin' | 'receptionist' | 'doctor' | 'technician';
  kpis: AppointmentKpiBuckets;
  viewMode: 'timeline' | 'capacity';
  timeRange: 'today' | '7days' | 'month' | 'custom';
  activeType: 'kham' | 'dieu_tri';
  activeStatusFilter?: FilterableBucketKey | null;
  onSelectStatus?: (key: FilterableBucketKey | null) => void;
}

export function AppointmentKpiCards({
  role,
  kpis,
  viewMode,
  timeRange,
  activeType,
  activeStatusFilter = null,
  onSelectStatus
}: AppointmentKpiCardsProps) {
  const { total, daXacNhan, daCheckin, dangKham, choTaiLuongGia, hoanThanh, daHuy, khongDen } = kpis;

  const getPercentage = (value: number, base: number) => {
    if (base <= 0) return 0;
    return Math.min(Math.round((value / base) * 100), 100);
  };

  const cardVariants = {
    initial: { opacity: 0, y: 15 },
    animate: (idx: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
        delay: idx * 0.08
      }
    })
  };

  // Determine active dynamic subtitle label based on view mode and time range selection
  const rangeLabel =
    viewMode === 'timeline'
      ? 'ngày này'
      : timeRange === 'month'
        ? 'tháng này'
        : 'tuần này';

  const isKham = activeType === 'kham';
  const isStaff = role === 'doctor' || role === 'technician';

  // Định nghĩa đủ 7 thẻ theo đúng 7 nhóm trạng thái dùng chung (utils/appointmentKpi.ts) — mỗi
  // actor chỉ chọn hiển thị 1 tập con (xem `stats` bên dưới), giữ nguyên màu/icon khớp với
  // appointmentStatusConfig.ts để nhất quán với badge trạng thái ở mọi nơi khác trong app.
  const allCards: Record<'total' | FilterableBucketKey, any> = {
    total: {
      key: 'total',
      title: isStaff
        ? (isKham ? 'TỔNG CA LƯỢNG GIÁ' : 'TỔNG CA TRỊ LIỆU')
        : (isKham ? 'TỔNG CA LƯỢNG GIÁ' : 'TỔNG CA TRỊ LIỆU'),
      value: total,
      unitLabel: 'Ca hẹn',
      subtext: isStaff ? `Tổng ca được giao ${rangeLabel}` : (isKham ? `Tổng ca lượng giá ${rangeLabel}` : `Tổng ca trị liệu ${rangeLabel}`),
      pct: 100,
      bgStyle: 'bg-teal-500/10 dark:bg-teal-950/30 border-teal-500/20 shadow-lg shadow-teal-500/5',
      iconBoxStyle: 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-400/40 shadow-[0_0_12px_rgba(20,184,166,0.3)]',
      barGradient: 'bg-gradient-to-r from-teal-500 to-cyan-400',
      icon: <Calendar size={20} />
    },
    daCheckin: {
      key: 'daCheckin',
      title: 'ĐANG CHỜ',
      value: daCheckin,
      unitLabel: 'Khách hàng',
      subtext: isKham ? 'Đang chờ lượng giá' : 'Đang chờ trị liệu',
      pct: getPercentage(daCheckin, total),
      bgStyle: 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 shadow-lg shadow-amber-500/5',
      iconBoxStyle: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      barGradient: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      icon: <Clock size={20} />
    },
    dangKham: {
      key: 'dangKham',
      title: isKham ? 'ĐANG LƯỢNG GIÁ' : 'ĐANG TRỊ LIỆU',
      value: dangKham,
      unitLabel: 'Khách hàng',
      subtext: isKham ? 'Đang gặp chuyên viên' : 'Đang trị liệu với KTV',
      pct: getPercentage(dangKham, total),
      bgStyle: 'bg-cyan-500/10 dark:bg-cyan-950/30 border-cyan-500/20 shadow-lg shadow-cyan-500/5',
      iconBoxStyle: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
      barGradient: 'bg-gradient-to-r from-cyan-500 to-teal-400',
      icon: <Stethoscope size={20} />
    },
    daXacNhan: {
      key: 'daXacNhan',
      title: 'ĐÃ XÁC NHẬN',
      value: daXacNhan,
      unitLabel: 'Lịch hẹn',
      subtext: 'Đã xác nhận hôm nay',
      pct: getPercentage(daXacNhan, total),
      bgStyle: 'bg-indigo-500/10 dark:bg-indigo-950/30 border-indigo-500/20 shadow-lg shadow-indigo-500/5',
      iconBoxStyle: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]',
      barGradient: 'bg-gradient-to-r from-indigo-500 to-blue-400',
      icon: <CalendarCheck size={20} />
    },
    choTaiLuongGia: {
      key: 'choTaiLuongGia',
      title: 'CHỜ TÁI LƯỢNG GIÁ',
      value: choTaiLuongGia,
      unitLabel: 'Khách hàng',
      subtext: 'Chờ khách quay lại',
      pct: getPercentage(choTaiLuongGia, total),
      bgStyle: 'bg-purple-500/10 dark:bg-purple-950/30 border-purple-500/20 shadow-lg shadow-purple-500/5',
      iconBoxStyle: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
      barGradient: 'bg-gradient-to-r from-purple-500 to-pink-400',
      icon: <RotateCcw size={20} />
    },
    hoanThanh: {
      key: 'hoanThanh',
      title: 'HOÀN THÀNH',
      value: hoanThanh,
      unitLabel: 'Ca hẹn',
      subtext: 'Đã hoàn thành',
      pct: getPercentage(hoanThanh, total),
      bgStyle: 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/20 shadow-lg shadow-emerald-500/5',
      iconBoxStyle: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      barGradient: 'bg-gradient-to-r from-emerald-500 to-green-400',
      icon: <CheckCircle2 size={20} />
    },
    daHuy: {
      key: 'daHuy',
      title: 'ĐÃ HỦY',
      value: daHuy,
      unitLabel: 'Ca hủy',
      subtext: 'Đã hủy lịch',
      pct: getPercentage(daHuy, total),
      bgStyle: 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/20 shadow-lg shadow-rose-500/5',
      iconBoxStyle: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-400/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
      barGradient: 'bg-gradient-to-r from-rose-500 to-red-400',
      icon: <XCircle size={20} />
    },
    khongDen: {
      key: 'khongDen',
      title: 'KHÔNG ĐẾN',
      value: khongDen,
      unitLabel: 'Vắng mặt',
      subtext: 'Khách không đến',
      pct: getPercentage(khongDen, total),
      bgStyle: 'bg-slate-500/10 dark:bg-slate-950/30 border-slate-500/20 shadow-lg shadow-slate-500/5',
      iconBoxStyle: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-400/40 shadow-[0_0_12px_rgba(100,116,139,0.3)]',
      barGradient: 'bg-gradient-to-r from-slate-500 to-zinc-400',
      icon: <AlertTriangle size={20} />
    }
  };

  const cardKeys: Array<'total' | FilterableBucketKey> = isStaff
    ? ['daXacNhan', 'daCheckin', 'hoanThanh', 'khongDen']
    : ['hoanThanh', 'daXacNhan', 'daHuy', 'khongDen'];

  const stats = cardKeys.map((key) => allCards[key]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, idx) => {
        const isClickable = !!onSelectStatus && stat.key !== 'total';
        const isSelected = isClickable && stat.key === activeStatusFilter;
        const isDimmed = isClickable && !!activeStatusFilter && !isSelected;

        return (
          <motion.div
            key={idx}
            custom={idx}
            initial="initial"
            animate="animate"
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.015 }}
            onClick={isClickable ? () => onSelectStatus!(isSelected ? null : (stat.key as FilterableBucketKey)) : undefined}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectStatus!(isSelected ? null : (stat.key as FilterableBucketKey)); } } : undefined}
            style={isSelected ? { outline: '2px solid #0d9488' } : undefined}
            className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 ${stat.bgStyle} ${isClickable ? 'cursor-pointer outline-none' : ''} ${isDimmed ? 'opacity-40' : ''}`}
          >
            {/* Top Bar: Icon Box + Title */}
            <div className="flex items-center gap-3">
              <div className={`size-11 rounded-2xl flex items-center justify-center border shadow-xs ${stat.iconBoxStyle}`}>
                {stat.icon}
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                {stat.title}
              </span>
            </div>

            {/* Big Number + Unit */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-jakarta font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                {String(stat.value).padStart(2, '0')}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                {stat.unitLabel}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full h-1.5 bg-slate-200/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${stat.barGradient}`}
                style={{ width: `${Math.max(stat.pct, 10)}%` }}
              />
            </div>

            {/* Bottom Subtext */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-zinc-400">
              <span>{stat.subtext}</span>
              <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">{stat.pct}%</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
