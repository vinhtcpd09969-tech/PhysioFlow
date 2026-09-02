import { X, User, Clock, Calendar, FileText, ArrowRight, Timer } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { statusConfig } from '../appointmentStatusConfig';
import { format, isValid } from 'date-fns';

interface AppointmentInfoModalProps {
  appointment: any | null;
  onClose: () => void;
}

export default function AppointmentInfoModal({ appointment, onClose }: AppointmentInfoModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  if (!appointment) return null;

  const aptId = appointment.id || appointment.cuoc_hen_id || appointment.lich_dat_id;
  const maLichDat = appointment.ma_lich_dat || 'LH-000';
  const tenKhachHang = appointment.ten_khach_hang || appointment.ho_ten_khach || 'Khách hàng';
  const soDienThoai = appointment.so_dien_thoai || appointment.sdt_khach_hang || '';
  const tenDichVu = appointment.ten_dich_vu || appointment.dich_vu || 'Lượng giá chức năng & Phục hồi';

  // Format time and date
  let dateStr = '--/--/----';
  let durationMinutes = Number(appointment.thoi_luong_phut) || (appointment as any).thoi_luong || (appointment as any).thoi_luong_buoi_phut || 0;

  if (appointment.ngay_gio_bat_dau) {
    const startDate = new Date(appointment.ngay_gio_bat_dau);
    if (isValid(startDate)) {
      dateStr = format(startDate, 'dd/MM/yyyy');
    }
  }

  const isMorning = appointment.buoi === 'sang' || (appointment.ngay_gio_bat_dau && new Date(appointment.ngay_gio_bat_dau).getHours() < 12);
  const buoiLabel = isMorning ? 'Buổi Sáng (07:30 – 12:00)' : 'Buổi Chiều (12:00 – 20:00)';

  if (!durationMinutes && appointment.ngay_gio_bat_dau && appointment.ngay_gio_ket_thuc) {
    const startMs = new Date(appointment.ngay_gio_bat_dau).getTime();
    const endMs = new Date(appointment.ngay_gio_ket_thuc).getTime();
    if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
      const diffMins = Math.round((endMs - startMs) / 60000);
      if (diffMins <= 120) {
        durationMinutes = diffMins;
      }
    }
  }

  if (!durationMinutes) {
    durationMinutes = (appointment.loai_goi === 'KHAM' || (appointment as any).loai_lich === 'kham_moi' || (appointment as any).loai_lich === 'luong_gia') ? 30 : 60;
  }

  const rawStatus = appointment.trang_thai || 'da_xac_nhan';
  const statusInfo = statusConfig[rawStatus] || {
    label: rawStatus,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null
  };

  // Ca đã kết thúc (hoàn thành/hủy/không đến) — không còn gì để "làm" nữa, đưa về đúng nơi xem lại
  // hồ sơ (Hồ sơ điều trị) thay vì Bàn làm việc (trang dành cho khám/trị liệu đang diễn ra, có nút
  // "Hoàn thành" — mở nhầm vào đây với 1 ca đã xong sẽ cho phép hoàn thành lại, ghi đè dữ liệu cũ).
  const isTerminalStatus = ['hoan_thanh', 'da_huy', 'khong_den'].includes(rawStatus);

  const handleGoToDetail = () => {
    onClose();
    if (!aptId) return;

    const isKtv = Number(user?.vai_tro_id) === 3 || location.pathname.startsWith('/technician');

    if (isTerminalStatus) {
      const recordsPath = isKtv ? '/technician/medical-records' : '/doctor/medical-records';
      if (!appointment.khach_hang_id) {
        navigate(recordsPath);
        return;
      }
      const params = new URLSearchParams({ patientId: String(appointment.khach_hang_id) });

      const loaiUpper = String(appointment.loai || (appointment as any).loai_lich || '').toUpperCase();
      const isExamOrAssessment = ['KHAM', 'KHAM_MOI', 'LUONG_GIA', 'TAI_KHAM'].includes(loaiUpper) || appointment.loai_goi === 'KHAM';
      const isRetailService = ['DICH_VU_LE', 'DICH_VU_DON', 'LE'].includes(loaiUpper) || appointment.loai_goi === 'LE';

      // Chỉ khi là ca trị liệu thuộc gói phác đồ liệu trình ('LIEU_TRINH' / 'DIEU_TRI' hoặc có phac_do_dieu_tri_id / so_thu_tu_buoi) thì mới chuyển sang tab gói ('plan')
      const isPackageAppointment = !isExamOrAssessment && !isRetailService && Boolean(
        appointment.phac_do_dieu_tri_id ||
        appointment.so_thu_tu_buoi ||
        loaiUpper === 'DIEU_TRI' ||
        appointment.loai_goi === 'LIEU_TRINH' ||
        (appointment.ten_dich_vu && appointment.ten_dich_vu.toLowerCase().includes('liệu trình'))
      );

      if (isPackageAppointment) {
        params.set('type', 'plan');
        params.set('itemId', String(appointment.phac_do_dieu_tri_id || aptId));
      } else {
        params.set('type', 'visit');
        params.set('itemId', String(aptId));
      }
      navigate(`${recordsPath}?${params.toString()}`);
      return;
    }

    const targetPath = isKtv
      ? `/technician/appointments/${aptId}/assess`
      : `/doctor/appointments/${aptId}/assess`;

    navigate(targetPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col font-jakarta">
        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-all z-10 cursor-pointer"
          title="Đóng"
        >
          <X size={20} />
        </button>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 pt-6 space-y-4 overflow-y-auto flex-1">
          {/* Section 1: Thông tin lịch hẹn + 2 khung 1 dòng */}
          <div className="space-y-2 select-none">
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
                      {tenKhachHang}
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
                    {tenDichVu}
                  </p>
                  {appointment.so_thu_tu_buoi && (
                    <span className="inline-block text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-900/40 mt-1.5">
                      Buổi {appointment.so_thu_tu_buoi} {appointment.tong_so_buoi_goi ? `/ ${appointment.tong_so_buoi_goi}` : ''}
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
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-sans">
                        {buoiLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 px-3 py-1.5 rounded-xl">
                      <Calendar size={14} className="text-slate-500 dark:text-zinc-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-mono">
                        {dateStr}
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
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium block">Thời lượng dự kiến</span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">
                      {durationMinutes} phút
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Trạng thái lịch hẹn */}
          <div className="space-y-2 select-none">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              TRẠNG THÁI LỊCH HẸN
            </label>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>
          </div>

          {/* Section 3: Ghi chú nội bộ */}
          <div className="space-y-2 select-none">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              GHI CHÚ NỘI BỘ
            </label>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap min-h-[50px]">
                {appointment.ghi_chu_noi_bo || appointment.ly_do_kham || appointment.ghi_chu || 'Không có ghi chú nội bộ.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/70 dark:bg-zinc-900/80 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 font-bold rounded-xl transition-all text-xs cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleGoToDetail}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <FileText size={15} />
            <span>Xem chi tiết</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
