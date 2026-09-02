import { useState, useMemo } from 'react';
import {
  PhoneCall,
  Stethoscope,
  Clock,
  Clock3,
  CheckCircle2,
  User,
  Eye,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  BellRing,
  Play,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores/authStore';
import { useActiveShiftCheck } from '../../../hooks/useActiveShiftCheck';
import { playCallInAudioChime } from '../../../utils/callInSignal';
import { callInPatient, markPatientAbsent } from '../api/doctor.api';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

function fmtMinutes(mins: number): string {
  if (mins <= 0) return '0p';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}p` : ''}` : `${m}p`;
}

export interface OvertimeInfo {
  isOvertime: boolean;
  expectedEndTimeStr: string;
  overtimeMinutes: number;
  durationMinutes: number;
  shiftCutoffStr: string;
  shiftName: string;
}

export function calculateOvertime(apt: SpecialistAppointmentItem, isKtv: boolean): OvertimeInfo {
  const duration = apt.thoi_luong_phut || (isKtv ? 60 : 30);
  const now = new Date();
  const currMins = now.getHours() * 60 + now.getMinutes();
  const finishMins = currMins + duration;

  // Ca sáng kết thúc lúc 12:00 (720 phút)
  // Ca chiều & Giờ đóng cửa kết thúc lúc 20:00 (1200 phút)
  const isMorning = apt.buoi === 'sang';
  const shiftCutoffMins = isMorning ? 12 * 60 : 20 * 60;
  const shiftCutoffStr = isMorning ? '12:00' : '20:00';
  const shiftName = isMorning ? 'Ca Sáng (12:00)' : 'Ca Chiều / Giờ đóng cửa (20:00)';

  const finishHour = Math.floor(finishMins / 60) % 24;
  const finishMinute = finishMins % 60;
  const expectedEndTimeStr = `${String(finishHour).padStart(2, '0')}:${String(finishMinute).padStart(2, '0')}`;

  const isOvertime = finishMins > shiftCutoffMins;
  const overtimeMinutes = isOvertime ? finishMins - shiftCutoffMins : 0;

  return {
    isOvertime,
    expectedEndTimeStr,
    overtimeMinutes,
    durationMinutes: duration,
    shiftCutoffStr,
    shiftName
  };
}

export interface SpecialistAppointmentItem {
  id: string;
  ma_lich_dat?: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  gioi_tinh?: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc?: string;
  ly_do_kham?: string;
  trang_thai: string;
  trang_thai_thanh_toan?: string;
  ten_dich_vu?: string;
  bac_si_id?: number | null;
  nhan_su_id?: number | null;
  so_thu_tu_buoi?: number | null;
  tong_so_buoi_goi?: number | null;
  buoi?: 'sang' | 'chieu';
  thoi_gian_checkin?: string | null;
  thoi_gian_goi_vao?: string | null;
  thoi_gian_bat_dau?: string | null;
  thoi_luong_phut?: number;
  so_lan_goi_khong_co_mat?: number;
  so_thu_tu_hang_doi?: number | null;
  trang_thai_cu?: string;
  is_reassessment?: boolean;
  ten_phong?: string;
}

interface SpecialistFlowBoardProps {
  appointments: SpecialistAppointmentItem[];
  currentUserId: string | number;
  selectedDateStr: string;
  searchTerm?: string;
  onOpenDetailModal?: (apt: SpecialistAppointmentItem) => void;
  onRefresh?: () => void;
}

export function SpecialistFlowBoard({
  appointments,
  currentUserId,
  selectedDateStr,
  searchTerm = '',
  onOpenDetailModal,
  onRefresh,
}: SpecialistFlowBoardProps) {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { hasShiftToday, isSuperUser } = useActiveShiftCheck();
  const isKtv = Number(user?.vai_tro_id) === 3;
  const basePath = isKtv ? '/technician/appointments' : '/doctor/appointments';
  const currentUserIdStr = String(currentUserId);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [confirmAbsentApt, setConfirmAbsentApt] = useState<SpecialistAppointmentItem | null>(null);
  const [openDeskConfirmApt, setOpenDeskConfirmApt] = useState<SpecialistAppointmentItem | null>(null);

  // Queue Tab State (Streamlined Pro Max)
  const [queueTab, setQueueTab] = useState<'waiting' | 'completed'>('waiting');

  // QUY TẮC HIỂN THỊ CẨN MẬT (VISIBILITY FILTER):
  // 1. Chỉ lấy các ca của NGÀY ĐANG XEM (selectedDateStr).
  // 2. Ca đặt chọn "Bất kỳ" (nhan_su_id IS NULL) -> Hiển thị cho toàn bộ Chuyên viên trong ca.
  // 3. Ca đặt chọn đích danh Chuyên viên A (nhan_su_id = A) -> CHỈ Chuyên viên A thấy. Chuyên viên B KHÔNG THẤY!
  const doctorAppointments = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();

    return appointments.filter((apt) => {
      // Filter date
      const aptDateStr = format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd');
      if (aptDateStr !== selectedDateStr) return false;

      // Filter Visibility
      const aptStaffId = apt.bac_si_id || apt.nhan_su_id;
      if (aptStaffId && String(aptStaffId) !== currentUserIdStr) {
        return false; // Lịch của Chuyên viên khác -> ẨN BỎ
      }

      // Filter Search
      if (lower) {
        const matchName = apt.ten_khach_hang?.toLowerCase().includes(lower);
        const matchCode = apt.ma_lich_dat?.toLowerCase().includes(lower);
        const matchPhone = apt.so_dien_thoai?.toLowerCase().includes(lower);
        if (!matchName && !matchCode && !matchPhone) return false;
      }

      return true;
    });
  }, [appointments, selectedDateStr, currentUserIdStr, searchTerm]);

  // Phân nhóm ca phục vụ cho Chuyên viên:
  // 1. ĐANG CHỜ TẠI QUẦY (Đã Check-in tại quầy Lễ tân)
  // Ưu tiên đẩy ca TÁI LƯỢNG GIÁ (`is_reassessment` hoặc `trang_thai_cu === 'cho_tai_luong_gia'`) LÊN ĐẦU HÀNG ĐỢI
  const waitingList = useMemo(() => {
    const rawList = doctorAppointments.filter(
      (a) => a.trang_thai === 'da_checkin' || a.trang_thai === 'check_in' || a.trang_thai === 'dang_kham'
    );

    return rawList.sort((a, b) => {
      const isReA = a.is_reassessment || a.trang_thai_cu === 'cho_tai_luong_gia';
      const isReB = b.is_reassessment || b.trang_thai_cu === 'cho_tai_luong_gia';
      if (isReA && !isReB) return -1;
      if (!isReA && isReB) return 1;

      // Đúng nguyên tắc hàng đợi đã chốt: sắp theo `thoi_gian_checkin`. Khách bị "Không vào" (B11)
      // đã được backend tự cập nhật lại mốc này thành NOW() nên tự động rơi xuống cuối — không cần
      // tie-break riêng theo đếm gọi hụt nữa.
      const checkinA = a.thoi_gian_checkin ? new Date(a.thoi_gian_checkin).getTime() : 0;
      const checkinB = b.thoi_gian_checkin ? new Date(b.thoi_gian_checkin).getTime() : 0;
      return checkinA - checkinB;
    });
  }, [doctorAppointments]);

  // 2. ĐÃ HOÀN THÀNH HÔM NAY
  const completedList = useMemo(
    () => doctorAppointments.filter((a) => a.trang_thai === 'hoan_thanh'),
    [doctorAppointments]
  );

  // Phát tín hiệu Gọi vào phòng — B2/B19: ghi nhận thật ở server (thoi_gian_goi_vao, và gán nhân
  // sự nếu ca đang "Bất kỳ") rồi mới phát chuông/toast bằng tên phòng + tên nhân sự THẬT trả về.
  // Không còn phát qua localStorage/BroadcastChannel (chỉ hoạt động cùng 1 trình duyệt) — Lễ tân ở
  // máy khác nhận biết qua polling danh sách lịch hẹn (đã có sẵn, xem TodayFlowBoard), đọc thẳng
  // `thoi_gian_goi_vao` vừa ghi ở đây.
  const handleCallInSignal = async (apt: SpecialistAppointmentItem) => {
    if (pendingActionId) return;
    setPendingActionId(apt.id);
    try {
      const { data } = await callInPatient(apt.id);
      playCallInAudioChime();
      const roomSuffix = data.ten_phong ? ` vào ${data.ten_phong}` : '';
      toast.success(`🔊 Đã mời ${apt.ten_khach_hang}${roomSuffix}!`);
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gọi bệnh nhân — vui lòng thử lại.');
    } finally {
      setPendingActionId(null);
    }
  };

  // B11 — bấm "Không vào": Đẩy khách xuống cuối hàng đợi để gọi lại sau (thao tác chuyển Không đến do Lễ tân quản lý)
  const handleMarkAbsentClick = (apt: SpecialistAppointmentItem) => {
    if (pendingActionId) return;
    setConfirmAbsentApt(apt);
  };

  const runMarkAbsent = async (apt: SpecialistAppointmentItem) => {
    setPendingActionId(apt.id);
    try {
      const { data } = await markPatientAbsent(apt.id);
      const callNum = data?.so_lan_goi_khong_co_mat || 1;
      toast(`Đã đẩy ${apt.ten_khach_hang} xuống cuối hàng đợi (Đã gọi ${callNum} lần).`, { icon: '⬇' });
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật — vui lòng thử lại.');
    } finally {
      setPendingActionId(null);
    }
  };

  // Mở Bàn Tư Vấn / Lượng Giá Riêng / Bàn Trị Liệu KTV
  const handleOpenAssessmentDesk = (apt: SpecialistAppointmentItem) => {
    if (apt.trang_thai === 'dang_kham' || apt.trang_thai === 'cho_tai_luong_gia') {
      navigate(`${basePath}/${apt.id}/assess`);
      return;
    }
    setOpenDeskConfirmApt(apt);
  };

  return (
    <div className="space-y-6">
      {/* QUEUE STATUS PILL TABS TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-2.5 rounded-2xl shadow-xs">
        <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setQueueTab('waiting')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              queueTab === 'waiting'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25 scale-[1.01]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Clock size={14} />
            <span>Đang chờ tại quầy</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              queueTab === 'waiting' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
            }`}>
              {waitingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setQueueTab('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              queueTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 scale-[1.01]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Đã hoàn thành</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              queueTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
            }`}>
              {completedList.length}
            </span>
          </button>
        </div>

        <div className="text-right text-[11px] font-semibold text-slate-500 dark:text-zinc-400 px-2 hidden sm:block">
          {queueTab === 'waiting' ? '⚡ Khách đã check-in quầy, sẵn sàng gọi vào phòng' : '✅ Ca đã hoàn thành hôm nay'}
        </div>
      </div>

      {/* QUEUE CONTENT LIST */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs p-4">
        {!hasShiftToday && !isSuperUser && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <Clock3 size={18} />
            </span>
            <div className="space-y-0.5 text-left">
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                ☕ Chế độ tra cứu hồ sơ (Không có ca trực hôm nay)
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-semibold">
                Hôm nay bạn không có ca trực được phân công trên hệ thống. Các nút thao tác tiếp nhận và điều trị trực tiếp được tạm khóa an toàn. Bạn vẫn có thể xem lịch hẹn và tra cứu hồ sơ bình thường. Nếu bạn đang trực thay đột xuất, vui lòng liên hệ Quản lý để được xếp ca trực.
              </p>
            </div>
          </div>
        )}

        {queueTab === 'waiting' && (
          <div>
            {waitingList.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="size-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
                  <Clock size={22} />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  Hiện không có bệnh nhân nào đang chờ trong hàng đợi.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {waitingList.map((apt) => {
                  const assignedStaffId = apt.bac_si_id || apt.nhan_su_id || (apt as any).chuyen_gia_id;
                  const isAssignedToMe = Boolean(
                    assignedStaffId &&
                    currentUserIdStr &&
                    String(assignedStaffId) !== 'null' &&
                    String(assignedStaffId) !== 'undefined' &&
                    String(assignedStaffId) === String(currentUserIdStr)
                  );
                  const isReassessment = apt.is_reassessment || apt.trang_thai_cu === 'cho_tai_luong_gia';

                  return (
                    <div
                      key={apt.id}
                      className={`py-3.5 px-3 rounded-2xl transition-all flex flex-wrap items-center justify-between gap-4 ${
                        isReassessment
                          ? 'bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 my-1'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`size-11 rounded-2xl flex items-center justify-center font-black text-xs ${
                            isReassessment
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {isReassessment ? <Sparkles size={20} /> : <User size={20} />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Số thứ tự hàng đợi TRONG NGÀY */}
                            {apt.so_thu_tu_hang_doi != null && (
                              <span className="size-6 rounded-lg bg-slate-800 dark:bg-zinc-700 text-white font-mono font-black text-[11px] flex items-center justify-center shrink-0">
                                {apt.so_thu_tu_hang_doi}
                              </span>
                            )}
                            <h5 className="font-black text-sm text-slate-900 dark:text-zinc-100">
                              {apt.ten_khach_hang}
                            </h5>

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              {apt.ma_lich_dat || `LH-${apt.id}`}
                            </span>

                            {/* NHÃN ƯU TIÊN TÁI LƯỢNG GIÁ TỰ ĐỘNG BẬT KHI LỄ TÂN CHECK-IN LẠI CA CŨ */}
                            {isReassessment && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white flex items-center gap-1 animate-pulse">
                                <Sparkles size={11} />
                                <span>🔄 TÁI LƯỢNG GIÁ - ƯU TIÊN GỌI</span>
                              </span>
                            )}

                            {isAssignedToMe ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                                Đích danh bạn
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                                Nhân sự: Bất kỳ
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center flex-wrap gap-x-2 gap-y-1">
                            <span>{apt.ten_dich_vu || 'Lượng giá Chức năng PHCN'} · SĐT: {apt.so_dien_thoai || '---'}</span>
                            {(() => {
                              if (apt.trang_thai !== 'da_checkin') return null;
                              const waitMinutes = apt.thoi_gian_checkin
                                ? Math.max(0, Math.round((Date.now() - new Date(apt.thoi_gian_checkin).getTime()) / 60000))
                                : null;
                              if (waitMinutes === null) return null;
                              return (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/60 px-2 py-0.5 rounded-md border border-amber-200/70 dark:border-amber-900/50 shadow-2xs">
                                  <Clock size={11} /> Chờ {fmtMinutes(waitMinutes)}
                                </span>
                              );
                            })()}
                          </p>

                          {/* B11 — cảnh báo thường trực về số lần gọi không có mặt */}
                          {((apt.so_lan_goi_khong_co_mat || 0) > 0 || !!apt.thoi_gian_goi_vao) && (() => {
                            const missedCount = apt.so_lan_goi_khong_co_mat || 0;
                            const isCallingNow = !!apt.thoi_gian_goi_vao;
                            const currentCallNum = isCallingNow ? missedCount + 1 : missedCount;
                            if (currentCallNum === 0) return null;

                            return (
                              <p className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                                <AlertCircle size={11} />
                                <span>
                                  {currentCallNum >= 2
                                    ? `Đã gọi ${currentCallNum} lần không vào (Đã đẩy xuống cuối hàng đợi)`
                                    : `Đã gọi lần 1`}
                                </span>
                              </p>
                            );
                          })()}

                          {/* Cảnh báo lố giờ ca trực / giờ đóng cửa nếu mở bàn bây giờ */}
                          {(() => {
                            if (apt.trang_thai === 'dang_kham') return null;
                            const ot = calculateOvertime(apt, isKtv);
                            if (!ot.isOvertime) return null;
                            return (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-955/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10.5px] font-extrabold shadow-2xs mt-1 w-fit">
                                <AlertTriangle size={11} className="text-rose-600 shrink-0" />
                                <span>Dự kiến xong: <strong>~{ot.expectedEndTimeStr}</strong> (Lố ca {ot.shiftCutoffStr} ~{ot.overtimeMinutes}p)</span>
                              </div>
                            );
                          })()}

                          {/* Cảnh báo ca đang mở quá giờ dự kiến */}
                          {apt.trang_thai === 'dang_kham' && apt.thoi_gian_bat_dau && (() => {
                            const startTime = new Date(apt.thoi_gian_bat_dau).getTime();
                            const duration = Number(apt.thoi_luong_phut) || (apt as any).thoi_gian_phut || 30;
                            const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
                            if (elapsedMinutes <= duration) return null;

                            return (
                              <p className="text-[10.5px] font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 bg-rose-50 dark:bg-rose-955/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50 w-fit animate-pulse">
                                <AlertCircle size={11} />
                                <span>Ca quá giờ dự kiến ({elapsedMinutes}/{duration}p)</span>
                              </p>
                            );
                          })()}
                        </div>
                      </div>

                      {/* CÁC NÚT THAO TÁC CỦA CHUYÊN VIÊN */}
                      <div className="flex items-center gap-2">
                        {apt.trang_thai !== 'dang_kham' && (
                          apt.thoi_gian_goi_vao ? (
                            <>
                              <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-955/40 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-200/80 dark:border-amber-800/60 select-none cursor-default">
                                <BellRing size={14} className="animate-pulse text-amber-500" />
                                <span>
                                  {(apt.so_lan_goi_khong_co_mat || 0) > 0
                                    ? `🔔 Đã gọi lần ${(apt.so_lan_goi_khong_co_mat || 0) + 1} lúc ${format(new Date(apt.thoi_gian_goi_vao), 'HH:mm')}`
                                    : `🔔 Đã phát tín hiệu gọi vào lúc ${format(new Date(apt.thoi_gian_goi_vao), 'HH:mm')}`}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleMarkAbsentClick(apt)}
                                disabled={!hasShiftToday || pendingActionId === apt.id}
                                title={!hasShiftToday ? 'Bạn không có ca trực phân công hôm nay để thực hiện thao tác này' : undefined}
                                className={`px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/60 transition-all ${
                                  !hasShiftToday ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer disabled:opacity-50'
                                }`}
                              >
                                <AlertCircle size={14} />
                                <span>Không vào</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCallInSignal(apt)}
                              disabled={!hasShiftToday || pendingActionId === apt.id}
                              title={!hasShiftToday ? 'Bạn không có ca trực phân công hôm nay để gọi khám' : undefined}
                              className={`px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-zinc-700 transition-all shadow-2xs ${
                                !hasShiftToday ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer disabled:opacity-50'
                              }`}
                            >
                              <PhoneCall size={14} />
                              <span>
                                {(apt.so_lan_goi_khong_co_mat || 0) > 0
                                  ? `📞 GỌI LẠI (Lần ${(apt.so_lan_goi_khong_co_mat || 0) + 1})`
                                  : '📞 GỌI VÀO'}
                              </span>
                            </button>
                          )
                        )}

                        {(() => {
                          const isCurrentInDesk = Boolean(
                            (apt.trang_thai === 'dang_kham' || apt.trang_thai === 'cho_tai_luong_gia') && isAssignedToMe
                          );

                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenAssessmentDesk(apt)}
                              disabled={!hasShiftToday}
                              title={!hasShiftToday ? 'Bạn không có ca trực phân công hôm nay để mở bàn' : undefined}
                              className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all ${
                                !hasShiftToday
                                  ? 'opacity-40 cursor-not-allowed bg-slate-400 dark:bg-zinc-700'
                                  : isCurrentInDesk
                                  ? 'bg-[#0d9488] hover:bg-[#0b7970] shadow-teal-600/20 ring-2 ring-teal-400/50 animate-pulse-subtle cursor-pointer'
                                  : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20 cursor-pointer'
                              }`}
                            >
                              <Stethoscope size={14} />
                              <span>{isCurrentInDesk ? '🩺 QUAY LẠI BÀN' : '🩺 MỞ BÀN'}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {queueTab === 'completed' && (
          <div>
            {completedList.length === 0 ? (
              <p className="text-xs text-center py-10 font-bold text-slate-400 dark:text-zinc-500">
                Chưa có ca nào hoàn thành hôm nay.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {completedList.map((apt) => (
                  <div key={apt.id} className="py-3.5 px-3 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                          {apt.ten_khach_hang}
                        </h5>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                          {apt.ten_dich_vu || 'Lượng giá Chức năng PHCN'} · Đã hoàn thành hôm nay
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenDetailModal?.(apt)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>Xem hồ sơ</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmAbsentApt}
        title="Xác nhận khách chưa vào phòng"
        message={
          confirmAbsentApt ? (
            <div className="space-y-2 text-left">
              <p>
                Bạn có chắc chắn muốn đẩy khách hàng{' '}
                <strong className="text-slate-900 dark:text-zinc-100">
                  {confirmAbsentApt.ten_khach_hang}
                </strong>{' '}
                xuống cuối hàng đợi để gọi lại sau không?
              </p>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-955/40 border border-amber-200/80 dark:border-amber-800/60 text-xs font-semibold text-amber-900 dark:text-amber-300">
                Khách hàng sẽ được đưa về cuối danh sách chờ và bạn có thể tiếp tục bấm Gọi vào cho ca tiếp theo.
              </div>
            </div>
          ) : ''
        }
        confirmLabel="Đồng ý đẩy xuống"
        cancelLabel="Hủy"
        type="warning"
        onConfirm={() => {
          if (confirmAbsentApt) void runMarkAbsent(confirmAbsentApt);
          setConfirmAbsentApt(null);
        }}
        onCancel={() => setConfirmAbsentApt(null)}
      />

      {/* MODAL XÁC NHẬN BỆNH NHÂN ĐÃ VÀO PHÒNG TRƯỚC KHI MỞ BÀN */}
      {openDeskConfirmApt && (() => {
        const ot = calculateOvertime(openDeskConfirmApt, isKtv);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className={`size-16 rounded-2xl flex items-center justify-center mx-auto font-bold text-2xl shadow-inner border ${
                ot.isOvertime
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 ring-4 ring-amber-500/10'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              }`}>
                {ot.isOvertime ? <AlertTriangle size={34} className="animate-bounce text-amber-500" /> : (isKtv ? <Zap size={34} /> : <Stethoscope size={34} />)}
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                  {isKtv ? 'Xác nhận khách đã vào phòng trị liệu?' : 'Xác nhận khách đã vào phòng?'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold leading-relaxed">
                  Vui lòng xác nhận bệnh nhân <span className="font-black text-emerald-600 dark:text-emerald-400">{openDeskConfirmApt.ten_khach_hang}</span>
                  {openDeskConfirmApt.so_thu_tu_hang_doi != null && <span className="font-black text-amber-600 dark:text-amber-400"> (STT {openDeskConfirmApt.so_thu_tu_hang_doi})</span>} đã có mặt trong phòng trước khi chính thức {isKtv ? 'mở bàn trị liệu và tạo nhật ký kỹ thuật thủ công.' : 'mở bàn làm việc và tạo nhật ký điều trị.'}
                </p>
              </div>

              {/* CẢNH BÁO QUÁ GIỜ CA TRỰC / OFF CA */}
              {ot.isOvertime && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-955/40 border-2 border-amber-400/80 dark:border-amber-500/50 text-left space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-xs">
                    <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                    <span className="uppercase tracking-wider">CẢNH BÁO: CA NÀY SẼ LÀM QUÁ GIỜ CA TRỰC</span>
                  </div>
                  <div className="text-[11.5px] text-slate-700 dark:text-zinc-300 font-medium space-y-1 pl-6">
                    <p>• Dịch vụ: <strong className="font-bold text-slate-900 dark:text-white">{openDeskConfirmApt.ten_dich_vu || 'Trị liệu'}</strong> ({ot.durationMinutes} phút).</p>
                    <p>• Dự kiến hoàn thành lúc: <strong className="font-black text-rose-600 dark:text-rose-400 text-xs">~{ot.expectedEndTimeStr}</strong>.</p>
                    <p>• Vượt quá giờ kết thúc {ot.shiftCutoffStr} khoảng <strong className="font-black text-rose-600 dark:text-rose-400 text-xs">{ot.overtimeMinutes} phút</strong> ({ot.shiftName}).</p>
                  </div>
                  <p className="text-[10.5px] text-amber-900/90 dark:text-amber-200/90 italic font-bold pl-6 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                    💡 Vui lòng xác nhận sẵn sàng làm thêm giờ (overtime) để hoàn tất ca trị liệu cho khách hàng.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpenDeskConfirmApt(null)}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Chưa vào — Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const aptId = openDeskConfirmApt.id;
                    setOpenDeskConfirmApt(null);
                    navigate(`${basePath}/${aptId}/assess`);
                  }}
                  className={`flex-1 py-3.5 px-4 rounded-xl active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    ot.isOvertime
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 ring-2 ring-amber-400/50'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  }`}
                >
                  <Play size={16} />
                  <span>
                    {ot.isOvertime
                      ? `⚡ BẮT ĐẦU (LÀM QUÁ GIỜ ${ot.overtimeMinutes}P)`
                      : (isKtv ? '⚡ Khách đã vào — Bắt đầu trị liệu' : '✅ Khách đã vào — Mở bàn')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
