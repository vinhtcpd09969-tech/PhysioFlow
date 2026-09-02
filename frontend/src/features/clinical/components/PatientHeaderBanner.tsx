import { useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Eye, X, FileText, Phone } from 'lucide-react';
import { resolveImageUrl } from '../../../utils/imageUrl';

interface PatientHeaderBannerProps {
  patient: {
    id: string;
    khach_hang_id?: string;
    ma_khach_hang?: string;
    ten_khach_hang: string;
    so_dien_thoai?: string;
    tuoi?: number;
    gioi_tinh?: string;
    ly_do_kham?: string;
    anh_dinh_kem_url?: string;
    anh_dinh_kem?: string;
    vas_truoc?: number;
    trang_thai: string;
    ten_dich_vu?: string;
    so_thu_tu_buoi?: number | null;
    pd_tong_so_buoi?: number | null;
    thoi_luong_phut?: number;
    thoi_gian_bat_dau?: string | null;
  } | null;
  onBack?: () => void;
  isKtvMode?: boolean;
  compactMode?: boolean;
}

export function PatientHeaderBanner({ patient, onBack, isKtvMode = false }: PatientHeaderBannerProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!patient) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 text-center text-slate-400 dark:text-zinc-500">
        <p className="text-xs font-semibold">Chọn bệnh nhân từ hàng đợi để bắt đầu.</p>
      </div>
    );
  }

  const attachedImgUrl = patient.anh_dinh_kem_url || patient.anh_dinh_kem ? resolveImageUrl(patient.anh_dinh_kem_url || patient.anh_dinh_kem!) : null;

  return (
    <div className="w-full space-y-4 font-jakarta border-b border-slate-100 dark:border-zinc-800 pb-5">
      {/* HEADER HÀNG ĐẦU: AVATAR, THÔNG TIN & BADGES */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-all cursor-pointer shadow-xs hover:scale-105 shrink-0"
              title="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="size-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
            {(patient.ten_khach_hang || 'K').trim().split(/\s+/).pop()?.[0] || 'K'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-zinc-100 truncate">
                {patient.ten_khach_hang}
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0d766e] dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
                {patient.ma_khach_hang || 'KH-88392'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5 truncate">
              <span>{patient.gioi_tinh || 'Khác'}</span>
              <span>·</span>
              <span>{patient.tuoi ? `${patient.tuoi} tuổi` : 'Chưa ghi nhận tuổi'}</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Phone size={11} className="text-slate-400" />
                <strong className="text-slate-800 dark:text-zinc-200 font-bold">{patient.so_dien_thoai || '0365488995'}</strong>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* DỰ KIẾN XONG */}
          <div className="px-3.5 py-2 rounded-2xl text-xs font-black bg-teal-500/15 text-[#0d766e] dark:text-teal-300 border border-teal-300 dark:border-teal-700/80 flex items-center gap-1.5 shadow-2xs">
            <span>⏰</span>
            <span>
              DỰ KIẾN XONG: <strong className="font-mono text-xs">{
                (() => {
                  const dbStart = patient.thoi_gian_bat_dau;
                  let startTime: number;
                  if (dbStart) {
                    startTime = new Date(dbStart).getTime();
                    try { localStorage.setItem(`exam_start_time_${patient.id}`, String(startTime)); } catch (e) {}
                  } else {
                    const storedStart = localStorage.getItem(`exam_start_time_${patient.id}`);
                    if (storedStart) {
                      startTime = Number(storedStart);
                    } else {
                      startTime = Date.now();
                      try { localStorage.setItem(`exam_start_time_${patient.id}`, String(startTime)); } catch (e) {}
                    }
                  }
                  const duration = patient.thoi_luong_phut || (patient as any).thoi_gian_phut || 30;
                  const targetTime = new Date(startTime + duration * 60 * 1000);
                  const hh = String(targetTime.getHours()).padStart(2, '0');
                  const mm = String(targetTime.getMinutes()).padStart(2, '0');
                  return `${hh}:${mm}`;
                })()
              }</strong>
              <span className="opacity-70 font-normal ml-1 font-mono">({patient.thoi_luong_phut || 30}p)</span>
            </span>
          </div>

          {/* CẢNH BÁO CA QUÁ GIỜ DỰ KIẾN */}
          {(() => {
            if (patient.trang_thai !== 'dang_kham' || !patient.thoi_gian_bat_dau) return null;
            const startTime = new Date(patient.thoi_gian_bat_dau).getTime();
            const duration = Number(patient.thoi_luong_phut) || (patient as any).thoi_gian_phut || 30;
            const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
            if (elapsedMinutes <= duration) return null;

            return (
              <div className="px-3.5 py-2 rounded-2xl text-xs font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/80 flex items-center gap-1.5 shadow-2xs animate-pulse">
                <span>⚠️</span>
                <span>
                  CA QUÁ GIỜ <span className="font-mono text-xs font-bold">({elapsedMinutes}/{duration}p)</span>
                </span>
              </div>
            );
          })()}

          <span className="px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 shadow-2xs">
            {patient.ten_dich_vu || 'Lượng giá PHCN Chuyên sâu'}
            {patient.so_thu_tu_buoi ? ` (Buổi ${patient.so_thu_tu_buoi}${patient.pd_tong_so_buoi ? `/${patient.pd_tong_so_buoi}` : ''})` : ''}
          </span>
        </div>
      </div>

      {/* DỮ LIỆU ĐỘNG THỰC TẾ: LÝ DO ĐẾN KHÁM & ẢNH ĐÍNH KÈM (ẨN KHI KHÔNG PHẢI BÁC SĨ KHÁM BAN ĐẦU) */}
      {!isKtvMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs">
          <div className="md:col-span-2 p-3.5 bg-slate-50/80 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 flex items-start gap-2.5">
            <div className="size-8 rounded-xl bg-teal-100/70 dark:bg-teal-950/60 text-[#0d9488] flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={16} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                Lý do đến lượng giá / trị liệu (Khách hàng mô tả):
              </span>
              <p className="font-bold text-slate-800 dark:text-zinc-100 leading-relaxed">
                {patient.ly_do_kham || 'Lập lịch nhanh tại quầy lễ tân'}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/80 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-indigo-100/70 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ImageIcon size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-wider block">
                  Ảnh / Phim đính kèm:
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate block">
                  {attachedImgUrl ? 'Có 1 ảnh đính kèm' : 'Chưa có ảnh gửi trước'}
                </span>
              </div>
            </div>

            {attachedImgUrl && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Eye size={13} /> Xem ảnh
              </button>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL XEM ẢNH ĐÍNH KÈM */}
      {isPreviewOpen && attachedImgUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 px-2">
              <span className="text-sm font-black text-zinc-100 flex items-center gap-2">
                <ImageIcon size={18} className="text-teal-400" />
                Ảnh đính kèm chẩn đoán của {patient.ten_khach_hang}
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="size-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center overflow-auto p-2">
              <img
                src={attachedImgUrl}
                alt="Ảnh đính kèm"
                className="max-h-[70vh] object-contain rounded-2xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
