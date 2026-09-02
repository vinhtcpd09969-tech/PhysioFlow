import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock3,
  CheckCircle2,
  Users,
  Activity,
  Sun,
  Moon,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Appointment, Staff } from '../types';
import toast from 'react-hot-toast';
import { isAwaitingPaymentForList } from '../../../utils/billing';
import { getSmartSearchScore } from '../../../utils/smartSearch';
import { ConfirmDialog } from '../../ConfirmDialog';
import { playCallInAudioChime } from '../../../utils/callInSignal';
import { useAuthStore } from '../../../stores/authStore';
import { useActiveShiftCheck } from '../../../hooks/useActiveShiftCheck';

import { StaffSelectDropdown } from './flow/StaffSelectDropdown';
import { useSucKhoeCa } from './flow/ShiftHealthWidget';
import { AppointmentRow, ColumnHeaderRow } from './flow/AppointmentRow';

const TERMINAL_STATUSES = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'];

function fmtMinutes(mins: number): string {
  if (mins <= 0) return '0p';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}p` : ''}` : `${m}p`;
}

interface TodayFlowBoardProps {
  /** TOÀN BỘ lịch hẹn của ngày đang xem (cả khám lẫn điều trị, chưa lọc activeType) */
  appointments: Appointment[];
  activeType: 'kham' | 'dieu_tri';
  searchTerm: string;
  staffList: Staff[];
  schedulesList: any[];
  selectedDateStr: string;
  onOpenDetailModal: (apt: Appointment) => void;
  onQuickCheckin: (apt: Appointment) => void;
  onPushBack?: (apt: Appointment) => void;
  onMarkNoShow?: (apt: Appointment) => void;
  onOpenWalkInModal: () => void;
  focusAppointmentId?: string;
  staffFilterId?: string | null;
  staffFilterOptions?: Array<{ id: string; name: string }>;
  onStaffFilterChange?: (id: string | null) => void;
  onOpenWorkloadModal?: () => void;
  onUnassign?: (apt: Appointment) => void;
  filterBar?: React.ReactNode;
}

export function TodayFlowBoard({
  appointments,
  activeType,
  searchTerm,
  staffList,
  schedulesList,
  selectedDateStr,
  onOpenDetailModal,
  onQuickCheckin,
  onPushBack,
  onMarkNoShow,
  onUnassign,
  onOpenWalkInModal: _onOpenWalkInModal,
  focusAppointmentId,
  staffFilterId,
  staffFilterOptions,
  onStaffFilterChange,
  onOpenWorkloadModal,
  filterBar,
}: TodayFlowBoardProps) {
  const user = useAuthStore((state) => state.user);
  const { hasShiftToday, isSuperUser } = useActiveShiftCheck();
  const navigate = useNavigate();
  const billingRoute = user?.vai_tro_id === 2 ? '/receptionist/billing' : '/admin/quick-billing';
  const [activeTab, setActiveTab] = useState<'chua_den' | 'dang_cho' | 'dang_lam' | 'xong' | 'cho_tai_luong_gia' | 'ngoai_le'>('chua_den');
  const [pendingPayment, setPendingPayment] = useState<Appointment | null>(null);

  // Tự động chuyển đến đúng tab của ca hẹn đang được focus (từ mascot hoặc link thông báo)
  useEffect(() => {
    if (!focusAppointmentId) return;
    const targetApt = appointments.find((a) => String(a.id) === String(focusAppointmentId));
    if (!targetApt) return;

    if (targetApt.trang_thai === 'da_checkin') {
      setActiveTab('dang_cho');
    } else if (targetApt.trang_thai === 'dang_kham') {
      setActiveTab('dang_lam');
    } else if (targetApt.trang_thai === 'cho_tai_luong_gia') {
      setActiveTab('cho_tai_luong_gia');
    } else if (targetApt.trang_thai === 'hoan_thanh') {
      setActiveTab('xong');
    } else if (['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(targetApt.trang_thai)) {
      setActiveTab('ngoai_le');
    } else if (targetApt.trang_thai === 'da_xac_nhan') {
      setActiveTab('chua_den');
    }
  }, [focusAppointmentId, appointments]);

  const seenCallInKeys = useRef<Set<string>>(new Set());
  const isFirstCallInScan = useRef(true);

  useEffect(() => {
    const activeCallIns = appointments.filter((a) => a.thoi_gian_goi_vao && a.trang_thai === 'da_checkin');
    const currentKeys = activeCallIns.map((a) => `${a.id}:${a.thoi_gian_goi_vao}`);

    if (isFirstCallInScan.current) {
      currentKeys.forEach((k) => seenCallInKeys.current.add(k));
      isFirstCallInScan.current = false;
      return;
    }

    for (const apt of activeCallIns) {
      const key = `${apt.id}:${apt.thoi_gian_goi_vao}`;
      if (seenCallInKeys.current.has(key)) continue;
      seenCallInKeys.current.add(key);

      playCallInAudioChime();
      toast(() => (
        <div className="flex items-center gap-3 p-1 text-white">
          <div className="size-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20 shrink-0">
            🔊
          </div>
          <div>
            <p className="text-xs font-black tracking-wide text-amber-400 uppercase">CHUYÊN VIÊN ĐÃ GỌI VÀO PHÒNG!</p>
            <p className="text-xs text-slate-100 font-semibold mt-0.5 leading-snug">
              Mời khách hàng <span className="font-black text-amber-300 underline decoration-amber-400/50 underline-offset-2">{apt.ten_khach_hang}</span>
              {apt.so_thu_tu_hang_doi != null ? <span className="font-black text-amber-300 ml-1">(Số {apt.so_thu_tu_hang_doi})</span> : ''}
              {apt.ten_phong ? ` vào ${apt.ten_phong}` : ''}
              {apt.ten_ky_thuat_vien ? ` — ${apt.ten_ky_thuat_vien}` : ''}
            </p>
          </div>
        </div>
      ), {
        duration: 7000,
        style: {
          borderRadius: '16px',
          background: '#0F172A',
          color: '#FFFFFF',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.2)',
          padding: '12px 16px',
        }
      });
    }
  }, [appointments]);

  useEffect(() => {
    if (!focusAppointmentId) return;
    const target = appointments.find((a) => String(a.id) === String(focusAppointmentId));
    if (!target) return;

    if (target.trang_thai === 'da_xac_nhan') {
      setActiveTab('chua_den');
    } else if (target.trang_thai === 'cho_tai_luong_gia') {
      setActiveTab('cho_tai_luong_gia');
    } else if (target.trang_thai === 'da_checkin') {
      setActiveTab('dang_cho');
    } else if (target.trang_thai === 'dang_kham') {
      setActiveTab('dang_lam');
    } else if (target.trang_thai === 'hoan_thanh') {
      setActiveTab('xong');
    } else if (TERMINAL_STATUSES.includes(target.trang_thai)) {
      setActiveTab('ngoai_le');
    }
  }, [focusAppointmentId, appointments]);

  const sucKhoeCa = useSucKhoeCa(appointments, staffList, schedulesList, selectedDateStr, activeType);

  const typedAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchType = activeType === 'kham' ? apt.loai_lich === 'kham_moi' : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
      const matchStaff = !staffFilterId || String(apt.bac_si_id) === String(staffFilterId);
      return matchType && matchStaff;
    });
  }, [appointments, activeType, staffFilterId]);

  const searched = useMemo(() => {
    if (!searchTerm.trim()) return typedAppointments;
    return typedAppointments.filter(
      (apt) =>
        getSmartSearchScore(apt.ten_khach_hang || '', searchTerm) > 0 ||
        (apt.so_dien_thoai || '').includes(searchTerm.trim()) ||
        apt.ma_lich_dat?.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [typedAppointments, searchTerm]);

  const groups = useMemo(() => {
    const chuaDen = searched
      .filter((a) => a.trang_thai === 'da_xac_nhan')
      .sort((a, b) => new Date(a.thoi_gian_tao || 0).getTime() - new Date(b.thoi_gian_tao || 0).getTime());

    const choTaiLuongGia = searched
      .filter((a) => a.trang_thai === 'cho_tai_luong_gia')
      .sort((a, b) => new Date(a.thoi_gian_tao || 0).getTime() - new Date(b.thoi_gian_tao || 0).getTime());

    const dangCho = searched
      .filter((a) => a.trang_thai === 'da_checkin')
      .sort((a, b) => {
        const isReA = (a as any).is_reassessment || a.trang_thai === 'cho_tai_luong_gia' || (a as any).trang_thai_cu === 'cho_tai_luong_gia';
        const isReB = (b as any).is_reassessment || b.trang_thai === 'cho_tai_luong_gia' || (b as any).trang_thai_cu === 'cho_tai_luong_gia';
        if (isReA && !isReB) return -1;
        if (!isReA && isReB) return 1;
        return new Date(a.thoi_gian_checkin || 0).getTime() - new Date(b.thoi_gian_checkin || 0).getTime();
      });

    const dangLam = searched.filter((a) => a.trang_thai === 'dang_kham');

    const xong = searched
      .filter((a) => a.trang_thai === 'hoan_thanh')
      .sort((a, b) => new Date(b.thoi_gian_tao || 0).getTime() - new Date(a.thoi_gian_tao || 0).getTime());

    const ngoaiLe = searched.filter((a) => TERMINAL_STATUSES.includes(a.trang_thai));

    return { chuaDen, choTaiLuongGia, dangCho, dangLam, xong, ngoaiLe };
  }, [searched]);

  const xongChuaThu = groups.xong.filter(isAwaitingPaymentForList).length;

  const [pendingCheckin, setPendingCheckin] = useState<Appointment | null>(null);
  const [pendingOvertimeCheckin, setPendingOvertimeCheckin] = useState<Appointment | null>(null);

  const requestCheckin = (apt: Appointment) => {
    if (user?.vai_tro_id === 2 && !hasShiftToday && !isSuperUser) {
      toast.error('Bạn không có ca trực phân công hôm nay để thực hiện tiếp đón khách tại quầy.');
      return;
    }

    if (user?.vai_tro_id === 2 && apt.ngay_gio_bat_dau) {
      const apptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(apt.ngay_gio_bat_dau));
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      if (apptDateStr > todayStr) {
        const formattedDate = new Date(apt.ngay_gio_bat_dau).toLocaleDateString('vi-VN');
        toast.error(`⚠️ Lễ tân chỉ được phép Check-in cho các ca hẹn trong ngày hôm nay. Không thể check-in vượt thời gian cho ca hẹn ngày ${formattedDate}.`);
        return;
      }
    }

    const duration = Number((apt as any).thoi_luong_phut) || 45;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const CLOSING_MINS = 20 * 60; // 20:00 PM
    if (currentMins + duration > CLOSING_MINS && now.getHours() >= 17) {
      setPendingOvertimeCheckin(apt);
      return;
    }

    setPendingCheckin(apt);
  };

  const [pendingNoShow, setPendingNoShow] = useState<Appointment | null>(null);
  const [pendingPushBackApt, setPendingPushBackApt] = useState<Appointment | null>(null);

  return (
    <div className="space-y-4">
      {user?.vai_tro_id === 2 && !hasShiftToday && !isSuperUser && (
        <div className="p-4 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
            <Clock3 size={18} />
          </span>
          <div className="space-y-0.5 text-left">
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              ☕ Chế độ tra cứu hồ sơ (Lễ tân không có ca trực hôm nay)
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-semibold">
              Hôm nay bạn không có ca trực được phân công tại quầy lễ tân. Các nút tiếp đón (Check-in) và thu tiền tại quầy được tạm khóa an toàn. Bạn vẫn có thể xem lịch hẹn và tra cứu hồ sơ bình thường. Nếu bạn đang trực thay đột xuất, vui lòng liên hệ Quản lý để được xếp ca trực.
            </p>
          </div>
        </div>
      )}

      {/* 1. KHỐI TỔNG HỢP: ĐIỀU HƯỚNG BỘ LỌC + SỨC KHỎE CA TRỰC */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 md:p-5 shadow-xs space-y-4">
        {filterBar}

        {filterBar && (
          <div className="border-t border-slate-100 dark:border-zinc-800/80 my-4" />
        )}

        {/* Card Header Row: tiêu đề + nút mở Modal Tải Nhân Sự */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-black">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>SỨC KHỎE CA TRỰC & NĂNG LỰC PHỤC VỤ</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                Dự báo sức chứa & ngân sách thời gian thực hiện theo ca trong ngày
              </p>
            </div>
          </div>

          {onOpenWorkloadModal && (
            <button
              type="button"
              onClick={onOpenWorkloadModal}
              className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0d9488] dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200/80 dark:border-teal-800/60 font-black text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              title="Xem chi tiết tải làm việc và ca mở của từng nhân sự"
            >
              <Users size={15} />
              <span>📊 Trạng Thái Nhân Sự Ca Trực</span>
            </button>
          )}
        </div>

        {/* Card Body: Ca sáng / Ca chiều + Dropdown lọc nhân sự */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {sucKhoeCa.map((b) => {
              const isSang = b.buoi === 'sang';
              return (
                <div
                  key={b.buoi}
                  className={`rounded-2xl border p-3.5 transition-all ${
                    b.isPast
                      ? 'bg-slate-50/60 dark:bg-zinc-800/20 border-slate-200/60 dark:border-zinc-800 opacity-60'
                      : 'bg-slate-50/40 dark:bg-zinc-800/30 border-slate-200/70 dark:border-zinc-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`size-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSang ? 'bg-amber-100 dark:bg-amber-955/60 text-amber-600' : 'bg-indigo-100 dark:bg-indigo-955/60 text-indigo-600'
                      }`}>
                        {isSang ? <Sun size={14} /> : <Moon size={14} />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                        CA {b.label.toUpperCase()}
                      </span>
                    </div>

                    {b.isCurrent && (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200/60">
                        <span className="size-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        Đang diễn ra
                      </span>
                    )}
                  </div>

                  <div className={`grid gap-2 ${b.roles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {b.roles.map((r) => (
                      <div
                        key={r.label}
                        className={`rounded-xl p-2 text-xs font-bold border transition-all ${
                          r.over
                            ? 'bg-rose-50/80 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border-rose-200/60'
                            : 'bg-emerald-50/70 dark:bg-emerald-955/20 text-emerald-800 dark:text-emerald-300 border-emerald-200/60'
                        }`}
                      >
                        <div className="uppercase tracking-wider text-[9px] font-black opacity-70 mb-0.5">{r.label}</div>
                        <div className="text-xs font-black">
                          công suất <span className="font-mono">{fmtMinutes(r.capacity)}</span> · cần <span className="font-mono">{fmtMinutes(r.demand)}</span>
                        </div>
                        {r.over && <div className="mt-0.5 text-[9.5px] font-extrabold text-rose-600">⚠ Vượt {fmtMinutes(r.demand - r.capacity)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {staffFilterOptions && staffFilterOptions.length > 0 && (
            <StaffSelectDropdown
              value={staffFilterId || null}
              options={staffFilterOptions}
              staffList={staffList}
              onChange={(id) => onStaffFilterChange?.(id === null ? null : String(id))}
              roleLabel={activeType === 'kham' ? 'chuyên viên' : 'KTV'}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!pendingCheckin}
        title="Xác nhận check-in"
        message={
          pendingCheckin
            ? <>Xác nhận khách <strong>{pendingCheckin.ten_khach_hang || pendingCheckin.ho_ten_khach}</strong> đã có mặt tại quầy và đưa vào hàng đợi?</>
            : ''
        }
        confirmLabel="Check-in"
        cancelLabel="Chưa phải"
        type="info"
        onConfirm={() => {
          if (pendingCheckin) onQuickCheckin(pendingCheckin);
          setPendingCheckin(null);
        }}
        onCancel={() => setPendingCheckin(null)}
      />

      <ConfirmDialog
        isOpen={!!pendingNoShow}
        title="Xác nhận KHÔNG ĐẾN"
        message={
          pendingNoShow ? (
            <div className="space-y-2.5 text-left text-xs">
              <p className="text-slate-700 dark:text-zinc-300">
                Xác nhận khách hàng{' '}
                <strong className="text-slate-900 dark:text-zinc-100 font-black">
                  {pendingNoShow.ten_khach_hang || pendingNoShow.ho_ten_khach}
                </strong>{' '}
                KHÔNG ĐẾN buổi hẹn này?
              </p>
              {pendingNoShow.trang_thai_thanh_toan === 'da_thanh_toan' ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-955/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
                  ✅ <strong>Khách đã thanh toán trước:</strong> Phòng khám giữ tiền, không hoàn tiền và <u>KHÔNG tính vi phạm</u> No-Show.
                </div>
              ) : Boolean(pendingNoShow.loai_goi === 'LIEU_TRINH' || pendingNoShow.loai_lich === 'dieu_tri_goi' || (pendingNoShow.tong_so_buoi_goi && pendingNoShow.tong_so_buoi_goi > 1)) ? (
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-955/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 font-semibold leading-relaxed">
                  📦 <strong>Lịch thuộc gói liệu trình:</strong> Không tính vi phạm No-Show khóa quyền đặt lịch.
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-semibold leading-relaxed">
                  ⚠️ <strong>Lịch chưa thanh toán:</strong> Khách sẽ bị tính 1 lần vi phạm No-Show (tích lũy 2 lần trong 60 ngày sẽ bắt buộc thanh toán online qua PayOS).
                </div>
              )}
            </div>
          ) : ''
        }
        confirmLabel="Xác nhận Không đến"
        cancelLabel="Để sau"
        type="danger"
        onConfirm={() => {
          if (pendingNoShow) onMarkNoShow?.(pendingNoShow);
          setPendingNoShow(null);
        }}
        onCancel={() => setPendingNoShow(null)}
      />

      <ConfirmDialog
        isOpen={!!pendingPayment}
        title="Xác nhận thu tiền & xuất hóa đơn"
        message={
          pendingPayment ? (
            <div className="space-y-2 text-left">
              <p>
                Bạn có chắc chắn muốn chuyển sang màn hình thu tiền cho khách hàng{' '}
                <strong className="text-slate-900 dark:text-zinc-100">
                  {pendingPayment.ten_khach_hang || pendingPayment.ho_ten_khach}
                </strong>?
              </p>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-955/40 border border-amber-200/80 dark:border-amber-800/60 text-xs font-semibold text-amber-900 dark:text-amber-300">
                Dịch vụ: <strong>{pendingPayment.ten_dich_vu || 'Lượng giá Chức năng PHCN'}</strong>
              </div>
            </div>
          ) : ''
        }
        confirmLabel="Chuyển đến Thu tiền"
        cancelLabel="Để sau"
        type="info"
        onConfirm={() => {
          if (pendingPayment) {
            navigate(`${billingRoute}?lich_dat_id=${pendingPayment.id}`);
          }
          setPendingPayment(null);
        }}
        onCancel={() => setPendingPayment(null)}
      />

      {/* OVERTIME CHECK-IN WARNING MODAL FOR 20:00 CLOSING CUTOFF */}
      {pendingOvertimeCheckin && (() => {
        const duration = Number((pendingOvertimeCheckin as any).thoi_luong_phut) || 45;
        const now = new Date();
        const finishMinutes = now.getHours() * 60 + now.getMinutes() + duration;
        const finishH = Math.floor(finishMinutes / 60);
        const finishM = finishMinutes % 60;
        const finishTimeStr = `${finishH}:${finishM < 10 ? '0' : ''}${finishM}`;
        const overtimeMins = finishMinutes - 20 * 60;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-amber-200 dark:border-amber-900/60 space-y-5 text-slate-800 dark:text-zinc-100 font-sans">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-955 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 border border-amber-300">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest block">
                    Cảnh báo sát giờ đóng cửa trung tâm
                  </span>
                  <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-100 font-jakarta">
                    Check-in ca quá giờ 20:00 tối
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-955/40 border border-amber-200 dark:border-amber-900/60 text-xs leading-relaxed space-y-2">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  📌 Khách hàng: <strong>{pendingOvertimeCheckin.ten_khach_hang || (pendingOvertimeCheckin as any).ho_ten_khach}</strong> (Dịch vụ {duration} phút)
                </p>
                <p className="text-slate-600 dark:text-zinc-300">
                  Trung tâm chính thức đóng cửa lúc <strong>20:00 (8h00 tối)</strong>. Nếu tiếp nhận check-in bây giờ, thời gian hoàn thành dự kiến là <strong className="text-amber-700 dark:text-amber-300 font-black">{finishTimeStr}</strong> (vượt giờ đóng cửa {overtimeMins} phút).
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Hãy trao đổi với khách và chọn hướng xử lý:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const apt = pendingOvertimeCheckin;
                      setPendingOvertimeCheckin(null);
                      setPendingCheckin(apt);
                    }}
                    className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
                  >
                    🔴 Vẫn Check-in (Làm ngoài giờ)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingOvertimeCheckin(null);
                      toast.success('💡 Hãy sử dụng nút "Đổi lịch" trên thẻ ca hẹn để chọn ngày mới cho khách (Khách không bị phạt no-show).');
                    }}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
                  >
                    🟢 Đổi Lịch Sang Buổi Khác (Không tính No-show)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. KHỐI DANH SÁCH CA HẸN */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs mt-4">
        {/* THANH TAB CHUYỂN TRẠNG THÁI CA HẸN LINH HOẠT */}
        <div className="p-2.5 bg-slate-50/70 dark:bg-zinc-850/60 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 px-0.5">
            {/* TAB 1: CHƯA ĐẾN */}
            <button
              type="button"
              onClick={() => setActiveTab('chua_den')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'chua_den'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50/60 hover:text-indigo-700 hover:border-indigo-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Users size={15} className={activeTab === 'chua_den' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'} />
              <span>CHƯA ĐẾN</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'chua_den'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
              }`}>
                {groups.chuaDen.length}
              </span>
            </button>

            {/* TAB 2: ĐANG CHỜ GỌI VÀO */}
            <button
              type="button"
              onClick={() => setActiveTab('dang_cho')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'dang_cho'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-amber-50/60 hover:text-amber-700 hover:border-amber-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Clock3 size={15} className={activeTab === 'dang_cho' ? 'text-white' : 'text-amber-600 dark:text-amber-400'} />
              <span>ĐANG CHỜ GỌI VÀO</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'dang_cho'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 dark:bg-amber-955/80 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
              }`}>
                {groups.dangCho.length}
              </span>
            </button>

            {/* TAB 3: ĐANG LÀM */}
            <button
              type="button"
              onClick={() => setActiveTab('dang_lam')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'dang_lam'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/25 ring-2 ring-cyan-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-cyan-50/60 hover:text-cyan-700 hover:border-cyan-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Activity size={15} className={activeTab === 'dang_lam' ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'} />
              <span>ĐANG LÀM</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'dang_lam'
                  ? 'bg-white/20 text-white'
                  : 'bg-cyan-100 dark:bg-cyan-955/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60'
              }`}>
                {groups.dangLam.length}
              </span>
            </button>

            {/* TAB 4: ĐÃ XONG */}
            <button
              type="button"
              onClick={() => setActiveTab('xong')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'xong'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-emerald-50/60 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-zinc-700'
              }`}
            >
              <CheckCircle2 size={15} className={activeTab === 'xong' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'} />
              <span>ĐÃ XONG</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'xong'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 dark:bg-emerald-955/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
              }`}>
                {groups.xong.length}
              </span>
              {xongChuaThu > 0 && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse ml-1">
                  ⚠ {xongChuaThu} chưa thu
                </span>
              )}
            </button>

            {/* TAB 5: CHỜ TÁI LƯỢNG GIÁ */}
            {activeType === 'kham' && (
              <button
                type="button"
                onClick={() => setActiveTab('cho_tai_luong_gia')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                  activeTab === 'cho_tai_luong_gia'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 ring-2 ring-purple-500/20'
                    : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-purple-50/60 hover:text-purple-700 hover:border-purple-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Sparkles size={15} className={activeTab === 'cho_tai_luong_gia' ? 'text-white' : 'text-purple-600 dark:text-purple-400'} />
                <span>CHỜ TÁI LƯỢNG GIÁ</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                  activeTab === 'cho_tai_luong_gia'
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-100 dark:bg-purple-955/80 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                }`}>
                  {groups.choTaiLuongGia.length}
                </span>
              </button>
            )}

            {/* TAB 6: NGOẠI LỆ / HỦY */}
            <button
              type="button"
              onClick={() => setActiveTab('ngoai_le')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'ngoai_le'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25 ring-2 ring-rose-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-rose-50/60 hover:text-rose-700 hover:border-rose-200 dark:hover:bg-zinc-700'
              }`}
            >
              <AlertCircle size={15} className={activeTab === 'ngoai_le' ? 'text-white' : 'text-rose-600 dark:text-rose-400'} />
              <span>NGOẠI LỆ / HỦY</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'ngoai_le'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 dark:bg-rose-955/80 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'
              }`}>
                {groups.ngoaiLe.length}
              </span>
            </button>
          </div>
        </div>

        {/* NỘI DUNG DANH SÁCH CA HẸN */}
        {(() => {
          const tabConfig = {
            chua_den: {
              list: groups.chuaDen,
              emptyIcon: Users,
              iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
              emptyText: 'Không có lịch hẹn chưa đến',
              emptySubtitle: 'Tất cả khách hàng đã check-in hoặc chưa có lịch hẹn mới trong ca làm việc.'
            },
            dang_cho: {
              list: groups.dangCho,
              emptyIcon: Clock3,
              iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
              emptyText: 'Hàng đợi đang trống',
              emptySubtitle: 'Không có khách hàng nào đang xếp hàng chờ gọi vào phòng lượng giá / trị liệu.'
            },
            dang_lam: {
              list: groups.dangLam,
              emptyIcon: Activity,
              iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
              emptyText: 'Chưa có ca nào đang thực hiện',
              emptySubtitle: 'Chuyên viên tư vấn và Kỹ thuật viên sẵn sàng tiếp nhận khách hàng tiếp theo.'
            },
            xong: {
              list: groups.xong,
              emptyIcon: CheckCircle2,
              iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
              emptyText: 'Chưa có ca hoàn thành',
              emptySubtitle: 'Các ca lượng giá và trị liệu hoàn thành trong ngày sẽ được tự động chuyển về đây.'
            },
            cho_tai_luong_gia: {
              list: groups.choTaiLuongGia,
              emptyIcon: Sparkles,
              iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
              emptyText: 'Không có ca nào chờ tái lượng giá.',
              emptySubtitle: 'Khách chuyển tuyến ngoài chụp chiếu khi quay lại sẽ xuất hiện tại đây.'
            },
            ngoai_le: {
              list: groups.ngoaiLe,
              emptyIcon: AlertCircle,
              iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
              emptyText: 'Không có ca hẹn ngoại lệ hay bị hủy',
              emptySubtitle: 'Các ca không đến hoặc đã hủy lịch sẽ được lưu trữ tại đây.'
            }
          };

          const currentTab = tabConfig[activeTab] || tabConfig.chua_den;
          const EmptyIcon = currentTab.emptyIcon;

          if (currentTab.list.length === 0) {
            return (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-2 select-none bg-slate-50/20 dark:bg-zinc-900/20">
                <div className={`p-3.5 rounded-2xl ${currentTab.iconBg} shadow-2xs mb-1`}>
                  <EmptyIcon size={26} />
                </div>
                <p className="text-sm font-black text-slate-800 dark:text-zinc-200">{currentTab.emptyText}</p>
                <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 max-w-md">{currentTab.emptySubtitle}</p>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <ColumnHeaderRow />
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {currentTab.list.map((apt) => (
                  <AppointmentRow
                    key={apt.id}
                    apt={apt}
                    variant={activeTab === 'cho_tai_luong_gia' ? 'chua_den' : (activeTab as any)}
                    staffList={staffList}
                    schedulesList={schedulesList}
                    allAppointments={searched}
                    onOpenDetailModal={onOpenDetailModal}
                    onQuickCheckin={requestCheckin}
                    onPushBack={(apt) => setPendingPushBackApt(apt)}
                    onMarkNoShow={activeTab === 'dang_cho' ? setPendingNoShow : onMarkNoShow}
                    onUnassign={onUnassign}
                    onPayment={setPendingPayment}
                    focusAppointmentId={focusAppointmentId}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <ConfirmDialog
        isOpen={!!pendingPushBackApt}
        title="Xác nhận đẩy xuống cuối hàng đợi"
        message={
          pendingPushBackApt ? (
            <div className="space-y-2 text-left">
              <p>
                Bạn có chắc chắn muốn đẩy khách hàng{' '}
                <strong className="text-slate-900 dark:text-zinc-100">
                  {pendingPushBackApt.ten_khach_hang || (pendingPushBackApt as any).ho_ten_khach || 'khách hàng'}
                </strong>{' '}
                xuống cuối hàng đợi để tiếp tục gọi khách hàng tiếp theo không?
              </p>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-955/40 border border-amber-200/80 dark:border-amber-800/60 text-xs font-semibold text-amber-900 dark:text-amber-300">
                Khách hàng này sẽ được dời thời gian check-in về hiện tại và xếp sau các khách hàng đang chờ khác.
              </div>
            </div>
          ) : ''
        }
        confirmLabel="Đồng ý đẩy xuống"
        cancelLabel="Hủy"
        type="warning"
        onConfirm={() => {
          if (pendingPushBackApt && onPushBack) {
            onPushBack(pendingPushBackApt);
          }
          setPendingPushBackApt(null);
        }}
        onCancel={() => setPendingPushBackApt(null)}
      />
    </div>
  );
}
