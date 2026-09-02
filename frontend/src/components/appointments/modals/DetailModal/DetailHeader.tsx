import { Calendar, Clock, User, Timer, Edit2 } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface DetailHeaderProps {
  maLichDat?: string;
  tenKhachHang: string;
  soDienThoai?: string;
  ngayGioBatDau: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
  durationMs: number;
  thoiLuongPhut?: number;
  tenDichVu?: string;
  soThuTuBuoi?: number | null;
  tongSoBuoiGoi?: number | null;
  loaiGoi?: string | null;
  isRescheduling: boolean;
  setIsRescheduling: (val: boolean) => void;
  selectedBuoi?: 'sang' | 'chieu' | '';
  rescheduleDate?: string;
  currentBuoi?: string;
  trangThai?: string;
}

const BUOI_LABEL: Record<string, string> = { sang: 'Buổi sáng', chieu: 'Buổi chiều' };

export function DetailHeader({
  maLichDat,
  tenKhachHang,
  soDienThoai,
  ngayGioBatDau,
  aptStartHourStr,
  aptEndHourStr: _aptEndHourStr,
  durationMs,
  thoiLuongPhut,
  tenDichVu,
  soThuTuBuoi,
  tongSoBuoiGoi,
  loaiGoi,
  isRescheduling,
  setIsRescheduling,
  selectedBuoi,
  rescheduleDate,
  currentBuoi: _currentBuoi,
  trangThai
}: DetailHeaderProps) {
  const isPackageSession = loaiGoi === 'LIEU_TRINH' && !!soThuTuBuoi;
  const durationMinutes = Number(thoiLuongPhut) || (Number(durationMs) > 0 && Math.round(durationMs / 60000) <= 120 ? Math.round(durationMs / 60000) : 0) || (loaiGoi === 'KHAM' ? 30 : 60);

  const RESCHEDULABLE_STATUSES = ['da_xac_nhan', 'da_checkin'];
  const isRescheduleDisabled = !RESCHEDULABLE_STATUSES.includes(trangThai || '');

  const dateObj = new Date(ngayGioBatDau);
  const formattedDate = isValid(dateObj) ? format(dateObj, 'dd/MM/yyyy') : '';

  const normalizedBuoi = (_currentBuoi || '').toLowerCase();
  const effectiveBuoi = (isRescheduling && selectedBuoi)
    ? selectedBuoi
    : (['sang', 'chieu'].includes(normalizedBuoi) ? normalizedBuoi : (aptStartHourStr && parseInt(aptStartHourStr.split(':')[0], 10) < 12 ? 'sang' : 'chieu'));

  const displayTimeRange = effectiveBuoi === 'sang' ? '07:30 – 12:00' : '12:00 – 20:00';
  const displayDate = (isRescheduling && rescheduleDate) ? format(new Date(rescheduleDate), 'dd/MM/yyyy') : formattedDate;

  return (
    <div className="space-y-2 font-jakarta select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Thông tin lịch hẹn
          </label>
          {maLichDat && (
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs">
              #{maLichDat}
            </span>
          )}
        </div>
        {!isRescheduleDisabled && (
          <button
            type="button"
            onClick={() => setIsRescheduling(!isRescheduling)}
            className={`text-xs font-bold transition-all flex items-center gap-1 cursor-pointer mr-6 ${
              isRescheduling ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-teal-600 dark:hover:text-teal-400'
            }`}
          >
            <Edit2 size={12} />
            <span>{isRescheduling ? 'Đang đổi lịch' : 'Đổi lịch hẹn'}</span>
          </button>
        )}
      </div>

      {/* 2 KHUNG 1 DÒNG (2 Columns Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khung 1: Khách hàng & Dịch vụ */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
          {/* Khách hàng */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30 shadow-2xs">
              <User size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium block">Khách hàng</span>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                {tenKhachHang || 'Khách hàng'}
              </p>
              {soDienThoai && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 font-mono">
                    <span>📞</span>
                    <span>{soDienThoai}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-zinc-800 w-full" />

          {/* Dịch vụ */}
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium block">Dịch vụ</span>
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-snug mt-0.5">
              {tenDichVu || 'Lượng giá chức năng cơ xương khớp'}
            </p>
            {isPackageSession && (
              <span className="inline-block text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-900/40 mt-1.5">
                Buổi {soThuTuBuoi} / {tongSoBuoiGoi}
              </span>
            )}
          </div>
        </div>

        {/* Khung 2: Thời gian & Thời lượng */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
          {/* Thời gian */}
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium block">Thời gian hẹn</span>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-900/40 px-3 py-1.5 rounded-xl">
                <Clock size={14} className="text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-mono">
                  {displayTimeRange}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 px-3 py-1.5 rounded-xl">
                <Calendar size={14} className="text-slate-500 dark:text-zinc-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-mono">
                  {displayDate}
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-zinc-800 w-full" />

          {/* Thời lượng */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/30">
              <Timer size={18} />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium block">Thời lượng</span>
              <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {durationMinutes} phút
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule notification banner if active */}
      {isRescheduling && selectedBuoi && rescheduleDate && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2 text-xs font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
          <span>👉 Lịch muốn đổi:</span>
          <span>{BUOI_LABEL[selectedBuoi]} ({format(new Date(rescheduleDate), 'dd/MM/yyyy')})</span>
        </div>
      )}
    </div>
  );
}
