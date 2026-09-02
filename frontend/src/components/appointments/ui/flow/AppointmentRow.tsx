import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Phone,
  Clock3,
  CheckCircle2,
  DollarSign,
  Eye,
  Volume2,
  ArrowDownToLine,
  UserX,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Appointment, Staff } from '../../types';
import { statusConfig } from '../../appointmentStatusConfig';
import { isPaymentDue } from '../../../../utils/billing';
import { useAuthStore } from '../../../../stores/authStore';
import { PaymentBadge, StaffCell } from './PaymentBadge';

const BUOI_LABEL: Record<string, string> = { sang: 'Sáng', chieu: 'Chiều' };
const TERMINAL_STATUSES = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'];

function fmtMinutes(mins: number): string {
  if (mins <= 0) return '0p';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}p` : ''}` : `${m}p`;
}

export type RowVariant = 'chua_den' | 'dang_cho' | 'dang_lam' | 'xong' | 'ngoai_le';

export function AppointmentRow({
  apt,
  variant,
  staffList,
  schedulesList,
  allAppointments = [],
  onOpenDetailModal,
  onQuickCheckin,
  onPushBack,
  onMarkNoShow,
  onUnassign,
  onPayment,
  focusAppointmentId,
}: {
  apt: Appointment;
  variant: RowVariant;
  staffList: Staff[];
  schedulesList?: any[];
  allAppointments?: Appointment[];
  onOpenDetailModal: (apt: Appointment) => void;
  onQuickCheckin: (apt: Appointment) => void;
  onPushBack?: (apt: Appointment) => void;
  onMarkNoShow?: (apt: Appointment) => void;
  onUnassign?: (apt: Appointment) => void;
  onPayment?: (apt: Appointment) => void;
  focusAppointmentId?: string;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const billingRoute = user?.vai_tro_id === 2 ? '/receptionist/billing' : '/admin/quick-billing';
  const meta = statusConfig[apt.trang_thai] || { label: apt.trang_thai, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
  const isExam =
    String((apt as any).loai || (apt as any).loai_goi || '').toUpperCase().includes('KHAM') ||
    String(apt.ten_dich_vu || '').toLowerCase().includes('lượng giá') ||
    String(apt.ten_dich_vu || '').toLowerCase().includes('khám');
  const isPackageSession = Boolean(apt.so_thu_tu_buoi || (apt as any).phac_do_dieu_tri_id || apt.loai_goi === 'LIEU_TRINH');
  const waitMinutes = apt.thoi_gian_checkin
    ? Math.max(0, Math.round((Date.now() - new Date(apt.thoi_gian_checkin).getTime()) / 60000))
    : null;

  const isCalledIn = !!apt.thoi_gian_goi_vao && apt.trang_thai === 'da_checkin';
  const missedCalls = apt.so_lan_goi_khong_co_mat || 0;
  
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (focusAppointmentId && String(apt.id) === String(focusAppointmentId)) {
      setHighlighted(true);
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`appointment-card-${apt.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      const fadeTimer = setTimeout(() => {
        setHighlighted(false);
      }, 4500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(fadeTimer);
      };
    } else {
      setHighlighted(false);
    }
  }, [focusAppointmentId, apt.id]);

  return (
    <div
      id={`appointment-card-${apt.id}`}
      className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 last:border-b-0 transition-all duration-300 ${
        highlighted
          ? 'relative z-20 -translate-y-1.5 scale-[1.015] bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 dark:from-amber-950/80 dark:via-amber-900/60 dark:to-amber-950/80 border-amber-400 dark:border-amber-500 ring-4 ring-amber-400/40 dark:ring-amber-500/30 shadow-2xl shadow-amber-500/25 rounded-2xl my-1.5'
          : isCalledIn
            ? 'bg-amber-50/70 dark:bg-amber-955/30 border-amber-200 dark:border-amber-800/60'
            : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
      }`}
    >
      {/* Buổi + trạng thái */}
      <div className="w-[100px] shrink-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {apt.buoi ? BUOI_LABEL[apt.buoi] : '—'}
          </span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border w-fit shadow-2xs ${meta.color}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {/* Khách hàng */}
      <div className="w-[165px] shrink-0 min-w-0 flex items-center gap-2">
        <div className="relative shrink-0">
          <div className="size-9 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center border border-slate-200/60 dark:border-zinc-700 shadow-2xs">
            {(apt.ten_khach_hang || apt.ho_ten_khach || 'K').trim().split(/\s+/).pop()?.[0] || 'K'}
          </div>
          {apt.so_thu_tu_hang_doi != null && apt.trang_thai !== 'hoan_thanh' && (
            <span className="absolute -top-2 -left-2 size-6 rounded-full bg-slate-800 dark:bg-zinc-600 text-white font-mono font-black text-[11px] flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-sm">
              {apt.so_thu_tu_hang_doi}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">{apt.ten_khach_hang || apt.ho_ten_khach}</p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
            <Phone size={10} />
            {apt.so_dien_thoai}
          </p>
        </div>
      </div>

      {/* Dịch vụ / gói */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
            {apt.ten_dich_vu || 'Lượng giá Chức năng PHCN'}
          </span>
          {Number((apt as any).thoi_luong_phut) > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 border border-slate-200/80 dark:border-zinc-700 shrink-0">
              <Clock3 size={10} className="text-slate-400" />
              {Number((apt as any).thoi_luong_phut)} phút
            </span>
          )}
          {Boolean(isExam && ((apt as any).is_reassessment || (apt as any).trang_thai_cu === 'cho_tai_luong_gia' || apt.trang_thai === 'cho_tai_luong_gia')) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-2xs shrink-0">
              <Sparkles size={11} /> 🔄 TÁI LƯỢNG GIÁ
            </span>
          )}
          {isPackageSession && (
            <span className="text-[10px] font-black text-[#0d766e] dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-teal-200/50 shrink-0">
              Buổi {apt.so_thu_tu_buoi}/{apt.tong_so_buoi_goi ?? '?'}
            </span>
          )}
        </div>
        
        {/* DỰ BÁO GIỜ XONG CHO CA ĐANG THỰC HIỆN */}
        {variant === 'dang_lam' && (() => {
          const duration = Number((apt as any).thoi_luong_phut) || 30;
          const startMs = ((apt as any).thoi_gian_bat_dau || apt.ngay_gio_bat_dau) ? new Date((apt as any).thoi_gian_bat_dau || apt.ngay_gio_bat_dau).getTime() : Date.now();
          const finishMs = startMs + duration * 60000;
          const finishTimeStr = format(new Date(finishMs), 'HH:mm');

          return (
            <p className="text-[11px] font-black text-teal-800 dark:text-teal-300 flex items-center gap-1.5 mt-1 bg-teal-50 dark:bg-teal-955/50 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800/60 w-fit">
              <span>⏰ DỰ KIẾN XONG: <strong>{finishTimeStr}</strong> ({duration}p)</span>
            </p>
          );
        })()}

        {variant === 'dang_cho' && (
          <div className="flex items-center gap-2 flex-wrap mt-1 text-[10.5px]">
            {waitMinutes !== null && (
              <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                <Clock3 size={11} /> Chờ {fmtMinutes(waitMinutes)}
              </span>
            )}

            {/* B23 — DỰ BÁO GIỜ GỌI VÀO */}
            {(() => {
              const staffId = apt.bac_si_id || (apt as any).nhan_su_id || (apt as any).ky_thuat_vien_id;
              const allWaiting = (allAppointments || [])
                .filter(a => a.trang_thai === 'da_checkin' || a.trang_thai === 'cho_tai_luong_gia')
                .sort((a, b) => {
                  const isReA = (a as any).is_reassessment || a.trang_thai === 'cho_tai_luong_gia';
                  const isReB = (b as any).is_reassessment || b.trang_thai === 'cho_tai_luong_gia';
                  if (isReA && !isReB) return -1;
                  if (!isReA && isReB) return 1;
                  return new Date(a.thoi_gian_checkin || a.thoi_gian_tao || 0).getTime() - new Date(b.thoi_gian_checkin || b.thoi_gian_tao || 0).getTime();
                });

              let estimatedWaitMins = 0;
              let isFreeNow = false;

              if (staffId) {
                const activeSession = (allAppointments || []).find(a => 
                  String(a.bac_si_id || (a as any).nhan_su_id || (a as any).ky_thuat_vien_id) === String(staffId) && 
                  a.trang_thai === 'dang_kham'
                );

                let currentSessionRemaining = 0;
                if (activeSession) {
                  const duration = Number((activeSession as any).thoi_luong_phut) || 30;
                  const startMs = ((activeSession as any).thoi_gian_bat_dau || activeSession.ngay_gio_bat_dau) ? new Date((activeSession as any).thoi_gian_bat_dau || activeSession.ngay_gio_bat_dau).getTime() : Date.now();
                  const elapsedMins = Math.floor((Date.now() - startMs) / 60000);
                  currentSessionRemaining = Math.max(1, duration - elapsedMins);
                }

                const staffQueue = allWaiting.filter(a => String(a.bac_si_id || (a as any).nhan_su_id || (a as any).ky_thuat_vien_id) === String(staffId));
                const posInQueue = staffQueue.findIndex(a => String(a.id) === String(apt.id));

                let queueBeforeMins = 0;
                if (posInQueue > 0) {
                  for (let i = 0; i < posInQueue; i++) {
                    queueBeforeMins += Number((staffQueue[i] as any).thoi_luong_phut) || 30;
                  }
                }

                estimatedWaitMins = currentSessionRemaining + queueBeforeMins;
                if (!activeSession && posInQueue === 0) {
                  isFreeNow = true;
                }
              } else {
                const workingStaffIds = new Set(
                  (allAppointments || [])
                    .filter(a => a.trang_thai === 'dang_kham')
                    .map(a => String(a.bac_si_id || (a as any).nhan_su_id || (a as any).ky_thuat_vien_id))
                );

                const commonQueue = allWaiting.filter(a => !a.bac_si_id && !(a as any).nhan_su_id);
                const posInCommonQueue = commonQueue.findIndex(a => String(a.id) === String(apt.id));
                const availableStaffCount = staffList.filter(s => !workingStaffIds.has(String(s.id))).length;

                if (availableStaffCount > 0 && posInCommonQueue < availableStaffCount) {
                  isFreeNow = true;
                  estimatedWaitMins = 0;
                } else {
                  const activeSessions = (allAppointments || []).filter(a => a.trang_thai === 'dang_kham');
                  if (activeSessions.length > 0) {
                    const remainingTimes = activeSessions.map(a => {
                      const duration = Number((a as any).thoi_luong_phut) || 30;
                      const startMs = ((a as any).thoi_gian_bat_dau || a.ngay_gio_bat_dau) ? new Date((a as any).thoi_gian_bat_dau || a.ngay_gio_bat_dau).getTime() : Date.now();
                      const elapsedMins = Math.floor((Date.now() - startMs) / 60000);
                      return Math.max(1, duration - elapsedMins);
                    });
                    const minRemainingMins = Math.min(...remainingTimes);
                    const extraAhead = Math.max(0, posInCommonQueue - (availableStaffCount || 0));
                    const staffCountOnDuty = Math.max(1, staffList.length);
                    const extraWaitMins = Math.floor((extraAhead * 30) / staffCountOnDuty);

                    estimatedWaitMins = minRemainingMins + extraWaitMins;
                  } else {
                    isFreeNow = true;
                  }
                }
              }

              const projectedTimeMs = Date.now() + estimatedWaitMins * 60000;
              const projectedTimeStr = format(new Date(projectedTimeMs), 'HH:mm');

              const duration = Number(apt.thoi_luong_phut) || (apt.loai_lich === 'kham_moi' || apt.loai_lich === 'luong_gia' ? 30 : 60);
              const projectedEndMs = projectedTimeMs + duration * 60000;
              const projectedEndDate = new Date(projectedEndMs);
              const projectedEndStr = format(projectedEndDate, 'HH:mm');
              const projectedEndMins = projectedEndDate.getHours() * 60 + projectedEndDate.getMinutes();

              // Ca sáng kết thúc lúc 12:00 (720 phút), Ca chiều / đóng cửa kết thúc lúc 20:00 (1200 phút)
              const isMorning = apt.buoi === 'sang';
              const cutoffMins = isMorning ? 12 * 60 : 20 * 60;
              const cutoffStr = isMorning ? '12:00' : '20:00';
              const isOvertime = projectedEndMins > cutoffMins;
              const overtimeMins = isOvertime ? projectedEndMins - cutoffMins : 0;

              return (
                <>
                  <span className={`font-extrabold flex items-center gap-1 ${
                    isFreeNow ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-zinc-350'
                  }`}>
                    <span>• ⏱️ Dự kiến gọi: <strong className={isFreeNow ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-zinc-200'}>
                      {isFreeNow ? 'Ngay bây giờ (Sẵn sàng)' : `~${projectedTimeStr} (sau ~${estimatedWaitMins}p)`}
                    </strong></span>
                  </span>
                  {isOvertime && (
                    <span className="font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      • ⚠️ Dự kiến xong ~{projectedEndStr} (Lố ca {cutoffStr} ~{overtimeMins}p)
                    </span>
                  )}
                </>
              );
            })()}

            {(missedCalls > 0 || isCalledIn) && (() => {
              const currentCallNum = isCalledIn ? missedCalls + 1 : missedCalls;
              if (currentCallNum === 0) return null;
              return (
                <span className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-1">
                  • <AlertCircle size={11} /> Đã gọi {currentCallNum} lần
                </span>
              );
            })()}
          </div>
        )}

        {/* B22 — DỰ BÁO HẠN ĐẾN MUỘN NHẤT */}
        {variant === 'chua_den' && (() => {
          if (apt.trang_thai === 'cho_tai_luong_gia' || (apt as any).han_tai_kham) {
            let formattedDeadline = '';
            let isOverdue = false;

            const textToSearch = `${(apt as any).ghi_chu || ''} ${(apt as any).ghi_chu_noi_bo || ''} ${(apt as any).chan_doan || ''} ${(apt as any).ly_do_kham || ''}`;
            
            const matchExplicit = textToSearch.match(/\[Hạn tái lượng giá:\s*([^\]]+)\]/i) 
              || textToSearch.match(/(\d{1,2}:\d{2}\s+ngày\s+\d{1,2}\/\d{1,2}\/\d{4})/i);

            if (matchExplicit && matchExplicit[1]) {
              formattedDeadline = matchExplicit[1].trim();
            } else if ((apt as any).han_tai_kham) {
              const raw = String((apt as any).han_tai_kham).trim();
              const datePart = raw.split('T')[0].split(' ')[0];
              let dStr = '';
              if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [y, m, d] = datePart.split('-');
                dStr = `${d}/${m}/${y}`;
              } else {
                dStr = datePart;
              }

              const sourceTime = apt.thoi_gian_bat_dau || apt.thoi_gian_checkin || apt.thoi_gian_tao;
              if (sourceTime) {
                try {
                  const tDate = new Date(sourceTime);
                  const hh = String(tDate.getHours()).padStart(2, '0');
                  const mm = String(tDate.getMinutes()).padStart(2, '0');
                  formattedDeadline = `${hh}:${mm} ngày ${dStr}`;
                } catch {
                  formattedDeadline = dStr;
                }
              } else {
                formattedDeadline = dStr;
              }
            } else {
              const baseDate = apt.thoi_gian_bat_dau || apt.thoi_gian_checkin || apt.thoi_gian_tao;
              const d = baseDate ? new Date(baseDate) : new Date();
              d.setDate(d.getDate() + 3);
              const hh = String(d.getHours()).padStart(2, '0');
              const mm = String(d.getMinutes()).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const MM = String(d.getMonth() + 1).padStart(2, '0');
              const yyyy = d.getFullYear();
              formattedDeadline = `${hh}:${mm} ngày ${dd}/${MM}/${yyyy}`;
            }

            return (
              <p className={`text-[10px] font-extrabold flex items-center gap-1 mt-0.5 ${
                isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-800 dark:text-amber-300'
              }`}>
                <Clock3 size={11} className={isOverdue ? 'text-rose-600 shrink-0' : 'text-amber-600 shrink-0'} />
                <span>
                  ⏱️ Hạn quay lại muộn nhất: <strong className={`font-black ${isOverdue ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-zinc-100'}`}>{formattedDeadline}</strong>
                  {isOverdue && ' (⚠️ Đã quá hạn)'}
                </span>
              </p>
            );
          }

          const duration = Number((apt as any).thoi_luong_phut) || 30;
          const isSang = apt.buoi === 'sang' || (apt.ngay_gio_bat_dau && new Date(apt.ngay_gio_bat_dau).getHours() < 12);
          const latestMins = (isSang ? 12 * 60 : 20 * 60) - duration;
          const latestHours = Math.floor(latestMins / 60);
          const latestRemMins = latestMins % 60;
          const latestTimeStr = `${latestHours}h${latestRemMins < 10 ? '0' : ''}${latestRemMins}`;

          const hasStaffAssigned = Boolean(apt.ten_ky_thuat_vien || apt.bac_si_id);
          let caKetThuc = apt.ca_gio_ket_thuc;
          let caBatDau = apt.ca_gio_bat_dau;

          if ((!caKetThuc || !caBatDau) && schedulesList && schedulesList.length > 0 && apt.bac_si_id) {
            const aptDateStr = apt.ngay_gio_bat_dau ? String(apt.ngay_gio_bat_dau).split('T')[0].split(' ')[0] : '';
            const matchingShift = schedulesList.find((s: any) =>
              String(s.nguoi_dung_id || s.nhan_su_id) === String(apt.bac_si_id) &&
              (!aptDateStr || s.ngay === aptDateStr) &&
              s.trang_thai === 'hoat_dong'
            );
            if (matchingShift) {
              caKetThuc = caKetThuc || matchingShift.gio_ket_thuc?.substring(0, 5);
              caBatDau = caBatDau || matchingShift.gio_bat_dau?.substring(0, 5);
            }
          }

          const isEarlyShiftEnd = !isSang && hasStaffAssigned && !!caKetThuc && caKetThuc < '20:00';
          const isLateShiftStart = isSang && hasStaffAssigned && !!caBatDau && caBatDau > '07:30';

          return (
            <div className="space-y-0.5 mt-0.5">
              <p className="text-[10px] text-teal-700 dark:text-teal-400 font-extrabold flex items-center gap-1">
                <Clock3 size={11} className="text-teal-600 shrink-0" />
                <span>⏱️ Hạn đến muộn nhất: <strong className="font-black text-slate-900 dark:text-zinc-100">{latestTimeStr}</strong> ({duration}p)</span>
              </p>
              {isEarlyShiftEnd && (
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold flex items-center gap-1">
                  <AlertCircle size={11} className="text-amber-600 shrink-0" />
                  <span>⚠️ Lưu ý: Nhân sự được chọn chỉ làm đến <strong className="font-black text-amber-900 dark:text-amber-200">{caKetThuc}</strong></span>
                </p>
              )}
              {isLateShiftStart && (
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold flex items-center gap-1">
                  <AlertCircle size={11} className="text-amber-600 shrink-0" />
                  <span>⚠️ Lưu ý: Nhân sự được chọn bắt đầu ca từ <strong className="font-black text-amber-900 dark:text-amber-200">{caBatDau}</strong></span>
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Nhân sự / Phòng */}
      <div className="w-[200px] shrink-0 space-y-1">
        {isCalledIn && (() => {
          const currentCallNum = missedCalls + 1;
          const callTimeStr = apt.thoi_gian_goi_vao ? format(new Date(apt.thoi_gian_goi_vao), 'HH:mm') : '';
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-955/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs w-fit tracking-wide animate-pulse max-w-full">
              <Volume2 size={11} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">
                {currentCallNum > 1
                  ? `🔔 Đã gọi lần ${currentCallNum}${callTimeStr ? ` lúc ${callTimeStr}` : ''}`
                  : `🔔 Đã gọi lúc ${callTimeStr || 'ngay bây giờ'}`}
              </span>
            </span>
          );
        })()}
        <StaffCell
          apt={apt}
          staffList={staffList}
          canUnassign={Boolean((variant === 'dang_cho' || variant === 'chua_den') && (apt.bac_si_id != null || (apt as any).nhan_su_id != null))}
          onUnassign={onUnassign}
        />
      </div>

      {/* Thanh toán */}
      <div className="w-[85px] shrink-0 flex items-center justify-center">
        {!TERMINAL_STATUSES.includes(apt.trang_thai) && <PaymentBadge apt={apt} />}
      </div>

      {/* Thao tác */}
      <div className="w-[175px] shrink-0 flex items-center justify-center gap-1.5">
        {variant === 'chua_den' && (
          apt.trang_thai === 'cho_tai_luong_gia' ? (
            (() => {
              const isExpired = apt.han_tai_kham && new Date(apt.han_tai_kham).getTime() < Date.now();
              if (isExpired) {
                return (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-[10.5px] border border-slate-200 dark:border-zinc-700 whitespace-nowrap select-none">
                    Đã hết hạn tái lượng giá
                  </span>
                );
              }
              return (
                <button
                  type="button"
                  onClick={() => onQuickCheckin(apt)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  title="Khách quay lại tái lượng giá — Check-in vào đầu hàng đợi"
                >
                  <CheckCircle2 size={14} /> CHECK-IN
                </button>
              );
            })()
          ) : (apt.loai_lich === 'kham_moi' || isExam) && isPaymentDue(apt) ? (
            <button
              type="button"
              onClick={() => onPayment ? onPayment(apt) : navigate(`${billingRoute}?lich_dat_id=${apt.id}`)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Thu tiền Lượng giá"
            >
              <DollarSign size={13} /> THU TIỀN
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onQuickCheckin(apt)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 size={14} /> CHECK-IN
            </button>
          )
        )}

        {/* Tab Đang chờ: CHỈ ca Lượng giá chưa thanh toán mới hiện nút Thu tiền nhanh (Trị liệu/Gói thu linh hoạt, mở popup để thu) */}
        {variant === 'dang_cho' && isExam && isPaymentDue(apt) && (
          <button
            type="button"
            onClick={() => onPayment ? onPayment(apt) : navigate(`${billingRoute}?lich_dat_id=${apt.id}`)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Thu tiền Lượng giá để mở khóa nút Bắt đầu khám"
          >
            <DollarSign size={12} /> THU TIỀN
          </button>
        )}

        {/* Tab Đã xong: Hiện nút Thu tiền cho mọi ca đã hoàn thành nhưng chưa thanh toán */}
        {variant === 'xong' && isPaymentDue(apt) && (
          <button
            type="button"
            onClick={() => onPayment ? onPayment(apt) : navigate(`${billingRoute}?lich_dat_id=${apt.id}`)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Khách đã làm xong — Thu tiền trước khi ra về"
          >
            <DollarSign size={12} /> THU TIỀN
          </button>
        )}

        {/* Nút Đẩy xuống cuối hàng đợi — Không giới hạn số lần đẩy */}
        {variant === 'dang_cho' && onPushBack && (
          <button
            type="button"
            onClick={() => onPushBack(apt)}
            title="Khách chưa có mặt — Đẩy xuống cuối hàng đợi"
            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/60 font-extrabold text-[10.5px] flex items-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <ArrowDownToLine size={12} /> ĐẨY XUỐNG
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenDetailModal(apt)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 font-extrabold text-[10.5px] flex items-center gap-1 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Eye size={12} /> XEM
        </button>
      </div>
    </div>
  );
}

export function ColumnHeaderRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50/80 dark:bg-zinc-855/60 border-b border-slate-200/60 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
      <div className="w-[100px] shrink-0">Buổi/TT</div>
      <div className="w-[165px] shrink-0">Khách hàng</div>
      <div className="flex-1 min-w-[320px]">Dịch vụ / Gói</div>
      <div className="w-[200px] shrink-0">Nhân sự / Phòng</div>
      <div className="w-[85px] shrink-0 text-center">Thanh toán</div>
      <div className="w-[175px] shrink-0 text-center">Thao tác</div>
    </div>
  );
}
