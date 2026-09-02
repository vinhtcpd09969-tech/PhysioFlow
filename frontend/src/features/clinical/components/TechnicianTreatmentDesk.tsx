import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  FileText,
  Zap,
  Activity,
  AlertTriangle,
  Stethoscope,
  ArrowUpRight,
} from 'lucide-react';
import { TreatmentLogItem } from '../../technician/api/technician.api';
import toast from 'react-hot-toast';

interface TechnicianTreatmentDeskProps {
  patientName: string;
  appointmentDetail?: {
    id?: string;
    khach_hang_id?: string;
    phac_do_dieu_tri_id?: string | null;
    chan_doan?: string;
    chong_chi_dinh?: string;
    ghi_chu?: string;
    ghi_chu_chuyen_vien?: string;
    chuyen_vien_chi_dinh?: string;
    ten_bac_si?: string;
    ma_lich_kham_goc?: string;
    ngay_luong_gia?: string;
    ten_dich_vu?: string | null;
    quy_trinh?: string | null;
    mo_ta_goi?: string | null;
    thoi_luong_phut?: number | null;
    so_thu_tu_buoi?: number | null;
    pd_tong_so_buoi?: number | null;
    vas_truoc?: number;
    vas_sau?: number;
    du_lieu_tri_lieu?: { nhat_ky: TreatmentLogItem[] } | null;
  } | null;
  onCompleteTreatment: (data: {
    vas_truoc: number;
    vas_sau: number;
    ghi_chu: string;
    du_lieu_tri_lieu: { nhat_ky: TreatmentLogItem[] };
  }) => Promise<void>;
  onSaveDraft?: (data: {
    vas_truoc: number;
    vas_sau: number;
    ghi_chu: string;
    du_lieu_tri_lieu: { nhat_ky: TreatmentLogItem[] };
  }) => void;
  onViewAssessment?: () => void;
}

// Wong-Baker Faces mapping chuẩn đồng bộ với Bàn Lượng Giá
const WONG_BAKER_FACES = [
  { score: 0, face: '😊', label: 'Không đau', desc: 'Hoàn toàn thoải mái' },
  { score: 2, face: '🙂', label: 'Đau nhẹ', desc: 'Đau ít, không ảnh hưởng sinh hoạt' },
  { score: 4, face: '😐', label: 'Đau vừa', desc: 'Đau gây khó chịu nhẹ' },
  { score: 6, face: '🙁', label: 'Đau nhức', desc: 'Ảnh hưởng tập trung / giấc ngủ' },
  { score: 8, face: '😣', label: 'Đau nặng', desc: 'Khó vận động, đau nhói' },
  { score: 10, face: '😭', label: 'Cực độ', desc: 'Không thể chịu đựng' },
];

const VERBAL_OPTIONS = [
  { score: 0, label: 'Không đau' },
  { score: 2, label: 'Đau rất nhẹ' },
  { score: 4, label: 'Đau vừa phải' },
  { score: 6, label: 'Đau khó chịu' },
  { score: 8, label: 'Đau dữ dội' },
  { score: 10, label: 'Đau không chịu nổi' },
];

export function TechnicianTreatmentDesk({
  patientName,
  appointmentDetail,
  onCompleteTreatment,
  onSaveDraft,
  onViewAssessment,
}: TechnicianTreatmentDeskProps) {
  // Parse quy trình kỹ thuật chuẩn của gói từ DB (phân tách bằng dấu chấm phẩy hoặc xuống dòng)
  const packageSteps = (() => {
    const rawProtocol = appointmentDetail?.quy_trinh || '';
    if (!rawProtocol.trim()) {
      return [
        { name: 'Chườm nóng & Massage cổ - vai - gáy - lưng: Nhiệt trị liệu làm mềm cơ kết hợp xoa bóp chuyên sâu giảm đau mỏi vùng vai gáy và lưng.', icon: '♨️' },
        { name: 'Massage chân & bắp chân: Xoa bóp day ấn nhẹ chi dưới giúp giảm cảm giác nặng chân, tê mỏi và hỗ trợ tuần hoàn máu.', icon: '🦵' },
        { name: 'Massage đầu & Kéo giãn cơ toàn thân: Massage thư giãn thần kinh vùng đầu kết hợp kéo giãn linh hoạt các khớp cơ toàn cơ thể.', icon: '💆' },
        { name: 'Nhiệt trị liệu phục hồi: Tác động nhiệt sâu giúp giãn cơ tối đa, duy trì hiệu quả thư giãn và phục hồi thể trạng.', icon: '🔥' },
      ];
    }

    const lines = rawProtocol.split(/[;\n\r]+/).map(s => s.trim()).filter(Boolean);
    const icons = ['♨️', '🦵', '💆', '🔥', '⚡', '🩹', '🧘', '🩺'];
    return lines.map((line, idx) => ({
      name: line.replace(/^[\d+.\-–*•]\s*/, ''),
      icon: icons[idx % icons.length]
    }));
  })();

  const [vasMode, setVasMode] = useState<'faces' | 'verbal' | 'numeric'>('faces');
  const [vasTruoc, setVasTruoc] = useState<number>(appointmentDetail?.vas_truoc ?? 4);
  const [vasSau, setVasSau] = useState<number>(appointmentDetail?.vas_sau ?? 2);
  const [notes, setNotes] = useState<string>(appointmentDetail?.ghi_chu || '');
  const [logs, setLogs] = useState<TreatmentLogItem[]>(
    appointmentDetail?.du_lieu_tri_lieu?.nhat_ky || []
  );

  // Loading & Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [triedSubmitWithoutLogs, setTriedSubmitWithoutLogs] = useState(false);

  const draftKey = appointmentDetail?.id ? ('draft_treat_' + appointmentDetail.id) : ('draft_treat_' + patientName.trim().replace(/\s+/g, '_'));

  // Khôi phục nháp từ sessionStorage nếu vừa chuyển tab hoặc rời trang quay lại
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vasTruoc != null) setVasTruoc(parsed.vasTruoc);
        if (parsed.vasSau != null) setVasSau(parsed.vasSau);
        if (parsed.notes != null) setNotes(parsed.notes);
        if (Array.isArray(parsed.logs)) setLogs(parsed.logs);
      }
    } catch (e) {}
  }, [draftKey]);

  // Tự động lưu nháp (debounce ~1.5s) sang server & lưu tức thì sang sessionStorage
  const isFirstRender = useRef(true);
  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ vasTruoc, vasSau, notes, logs }));
    } catch (e) {}

    if (!onSaveDraft) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onSaveDraft({ vas_truoc: vasTruoc, vas_sau: vasSau, ghi_chu: notes, du_lieu_tri_lieu: { nhat_ky: logs } });
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vasTruoc, vasSau, notes, logs, draftKey]);

  // Tích chọn tất cả các bước theo quy trình gói (1-click)
  const handleSelectAllPackageProtocol = () => {
    setTriedSubmitWithoutLogs(false);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newItems: TreatmentLogItem[] = packageSteps.map(step => ({
      luc: timeStr,
      noi_dung: step.name
    }));
    setLogs(prev => {
      const existingNames = new Set(prev.map(p => p.noi_dung));
      const filteredNew = newItems.filter(i => !existingNames.has(i.noi_dung));
      const nextLogs = [...prev, ...filteredNew];
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ vasTruoc, vasSau, notes, logs: nextLogs }));
      } catch (e) {}
      if (onSaveDraft) {
        onSaveDraft({ vas_truoc: vasTruoc, vas_sau: vasSau, ghi_chu: notes, du_lieu_tri_lieu: { nhat_ky: nextLogs } });
      }
      return nextLogs;
    });
  };

  // Tick / Untick 1 bước trong gói (Lưu tức thì 0ms)
  const togglePackageStep = (name: string) => {
    setTriedSubmitWithoutLogs(false);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => {
      const exists = prev.some(l => l.noi_dung === name);
      const nextLogs = exists
        ? prev.filter(l => l.noi_dung !== name)
        : [...prev, { luc: timeStr, noi_dung: name }];
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ vasTruoc, vasSau, notes, logs: nextLogs }));
      } catch (e) {}
      if (onSaveDraft) {
        onSaveDraft({ vas_truoc: vasTruoc, vas_sau: vasSau, ghi_chu: notes, du_lieu_tri_lieu: { nhat_ky: nextLogs } });
      }
      return nextLogs;
    });
  };

  // Kiểm tra tính hợp lệ trước khi mở Modal xác nhận hoàn thành
  const handleOpenCompleteModal = () => {
    if (logs.length === 0) {
      setTriedSubmitWithoutLogs(true);
      toast.error('Vui lòng tích chọn ít nhất 1 quy trình / thao tác kỹ thuật trước khi hoàn thành ca trị liệu!');
      const el = document.getElementById('technician-protocol-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setTriedSubmitWithoutLogs(false);
    setShowConfirmModal(true);
  };

  // Nộp ca trị liệu
  const handleSubmit = async () => {
    if (logs.length === 0) {
      setTriedSubmitWithoutLogs(true);
      setShowConfirmModal(false);
      toast.error('Vui lòng tích chọn ít nhất 1 quy trình / thao tác kỹ thuật trước khi hoàn thành!');
      return;
    }
    setSubmitting(true);
    try {
      await onCompleteTreatment({
        vas_truoc: vasTruoc,
        vas_sau: vasSau,
        ghi_chu: notes,
        du_lieu_tri_lieu: { nhat_ky: logs },
      });
      try {
        sessionStorage.removeItem(draftKey);
      } catch (e) {}
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const deltaVas = vasTruoc - vasSau;
  const isTreatmentPlanPackage = Boolean(
    appointmentDetail?.phac_do_dieu_tri_id || (appointmentDetail?.so_thu_tu_buoi && appointmentDetail.so_thu_tu_buoi > 0)
  );

  return (
    <div className="w-full space-y-6 pt-1 font-jakarta text-left">
      
      {/* KHỐI 0: CHỈ ĐỊNH TỪ CHUYÊN VIÊN PHCN */}
      {isTreatmentPlanPackage && (
        <div className="flex flex-wrap items-center gap-2.5 pb-5 border-b border-slate-100 dark:border-zinc-800 text-xs">
          <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800 shrink-0">
            <Stethoscope size={15} />
          </span>
          <span className="font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
            <span>Gói chỉ định bởi chuyên viên:</span>
            <strong className="text-slate-900 dark:text-zinc-100 font-black mr-1">
              {appointmentDetail?.chuyen_vien_chi_dinh || appointmentDetail?.ten_bac_si || 'Chuyên viên PHCN'}
            </strong>
          </span>

          {onViewAssessment && (
            <button
              type="button"
              onClick={onViewAssessment}
              className="px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 font-bold text-[11px] transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              title="Chuyển sang tab Lịch sử điều trị để xem chi tiết buổi lượng giá"
            >
              <FileText size={13} />
              <span>Xem buổi lượng giá</span>
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* KHỐI 1: THANG ĐO ĐAU VAS TRƯỚC & SAU TRỊ LIỆU (ĐỒNG BỘ 100% VỚI BÀN LƯỢNG GIÁ) */}
      <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-cyan-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              1. Thang đo điểm đau VAS (Trước & Sau trị liệu):
            </h4>
          </div>

          {/* Switch mode nhập VAS */}
          <div className="flex bg-slate-200 dark:bg-zinc-700 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setVasMode('faces')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                vasMode === 'faces' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Mặt cười (Wong-Baker)
            </button>
            <button
              type="button"
              onClick={() => setVasMode('verbal')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                vasMode === 'verbal' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Mô tả lời nói
            </button>
            <button
              type="button"
              onClick={() => setVasMode('numeric')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                vasMode === 'numeric' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Thang số (0-10)
            </button>
          </div>
        </div>

        {/* 1.1 VAS TRƯỚC KHI BẮT ĐẦU */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              • Mức đau TRƯỚC khi bắt đầu: <strong className="text-rose-600 dark:text-rose-400 text-sm ml-1">{vasTruoc}/10</strong>
            </span>
          </div>

          {vasMode === 'faces' && (
            <div className="grid grid-cols-6 gap-2">
              {WONG_BAKER_FACES.map((f) => (
                <button
                  key={f.score}
                  type="button"
                  onClick={() => setVasTruoc(f.score)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    vasTruoc === f.score
                      ? 'bg-rose-500/10 dark:bg-rose-955/40 border-2 border-rose-600 dark:border-rose-500 shadow-sm scale-105'
                      : 'bg-white/80 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-rose-300'
                  }`}
                >
                  <div className="text-2xl">{f.face}</div>
                  <div className="text-[11px] font-bold mt-1 text-slate-800 dark:text-zinc-100">{f.score} điểm</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">{f.label}</div>
                </button>
              ))}
            </div>
          )}

          {vasMode === 'verbal' && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {VERBAL_OPTIONS.map((v) => (
                <button
                  key={v.score}
                  type="button"
                  onClick={() => setVasTruoc(v.score)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    vasTruoc === v.score
                      ? 'bg-rose-500/10 dark:bg-rose-955/40 border-2 border-rose-600 dark:border-rose-500 shadow-sm'
                      : 'bg-white/80 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-rose-300'
                  }`}
                >
                  <div className="text-sm font-bold text-rose-800 dark:text-rose-300">{v.score} điểm</div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-300 mt-0.5">{v.label}</div>
                </button>
              ))}
            </div>
          )}

          {vasMode === 'numeric' && (
            <div className="pt-2 px-2 space-y-2">
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vasTruoc}
                onChange={(e) => setVasTruoc(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>0 (Không đau)</span>
                <span>5 (Đau vừa)</span>
                <span>10 (Cực độ)</span>
              </div>
            </div>
          )}
        </div>

        {/* 1.2 VAS SAU KHI KẾT THÚC */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              • Mức đau SAU khi kết thúc ca: <strong className="text-emerald-600 dark:text-emerald-400 text-sm ml-1">{vasSau}/10</strong>
            </span>
          </div>

          {vasMode === 'faces' && (
            <div className="grid grid-cols-6 gap-2">
              {WONG_BAKER_FACES.map((f) => (
                <button
                  key={f.score}
                  type="button"
                  onClick={() => setVasSau(f.score)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    vasSau === f.score
                      ? 'bg-emerald-500/10 dark:bg-emerald-955/40 border-2 border-emerald-600 dark:border-emerald-500 shadow-sm scale-105'
                      : 'bg-white/80 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-2xl">{f.face}</div>
                  <div className="text-[11px] font-bold mt-1 text-slate-800 dark:text-zinc-100">{f.score} điểm</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">{f.label}</div>
                </button>
              ))}
            </div>
          )}

          {vasMode === 'verbal' && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {VERBAL_OPTIONS.map((v) => (
                <button
                  key={v.score}
                  type="button"
                  onClick={() => setVasSau(v.score)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    vasSau === v.score
                      ? 'bg-emerald-500/10 dark:bg-emerald-955/40 border-2 border-emerald-600 dark:border-emerald-500 shadow-sm'
                      : 'bg-white/80 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{v.score} điểm</div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-300 mt-0.5">{v.label}</div>
                </button>
              ))}
            </div>
          )}

          {vasMode === 'numeric' && (
            <div className="pt-2 px-2 space-y-2">
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vasSau}
                onChange={(e) => setVasSau(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>0 (Không đau)</span>
                <span>5 (Đau vừa)</span>
                <span>10 (Cực độ)</span>
              </div>
            </div>
          )}
        </div>

        {/* Delta VAS badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <div>
              <span className="font-bold text-slate-700 dark:text-zinc-200">Hiệu quả giảm đau buổi trị liệu:</span>
              <span className="font-medium text-slate-500 dark:text-zinc-400 ml-1">
                {deltaVas > 0
                  ? `Mức đau giảm ${deltaVas} điểm (${vasTruoc} → ${vasSau})`
                  : deltaVas === 0
                  ? `Mức đau giữ nguyên (${vasTruoc}/10)`
                  : `Mức đau tăng nhẹ ${Math.abs(deltaVas)} điểm (${vasTruoc} → ${vasSau})`}
              </span>
            </div>
          </div>
          {deltaVas > 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs shadow-sm">
              -{Math.round((deltaVas / (vasTruoc || 1)) * 100)}% đau
            </span>
          )}
        </div>
      </div>

      {/* KHỐI 2: NHẬT KÝ THAO TÁC KỸ THUẬT TRỊ LIỆU (ĐỒNG BỘ KHỐI ROM/MMT) */}
      <div
        id="technician-protocol-card"
        className="space-y-4 pb-6 border-b border-slate-100 dark:border-zinc-800"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-cyan-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              2. Nhật ký thao tác kỹ thuật trị liệu: *
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-955/50 px-3 py-1 rounded-full border border-teal-200/60 font-mono">
              {logs.length} / {packageSteps.length} kỹ thuật đã chọn
            </span>
            <button
              type="button"
              onClick={handleSelectAllPackageProtocol}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <Zap size={14} /> Tích chọn tất cả
            </button>
          </div>
        </div>

        {/* THÔNG BÁO LỖI NẾU CHƯA CHỌN MÀ BẤM HOÀN THÀNH */}
        {triedSubmitWithoutLogs && logs.length === 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-955/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle size={17} className="text-rose-600 shrink-0" />
            <span>Vui lòng tích chọn các thao tác kỹ thuật đã thực hiện dưới đây trước khi hoàn thành ca trị liệu!</span>
          </div>
        )}

        {/* CHECKLIST CÁC BƯỚC CỦA GÓI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {packageSteps.map(step => {
            const isLogged = logs.some(l => l.noi_dung === step.name);
            return (
              <button
                key={step.name}
                type="button"
                onClick={() => togglePackageStep(step.name)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isLogged
                    ? 'bg-teal-50/80 dark:bg-teal-955/40 border-teal-400 dark:border-teal-700 text-teal-950 dark:text-teal-100 font-bold shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-xs leading-relaxed">{step.name}</span>
                </div>
                <div className={`size-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                  isLogged ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800'
                }`}>
                  {isLogged && <CheckCircle2 size={13} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KHỐI 3: GHI CHÚ DIỄN TIẾN CA TRỊ LIỆU */}
      <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-slate-600 dark:text-zinc-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
            3. Ghi chú diễn tiến & dặn dò KTV:
          </h4>
        </div>

        <textarea
          rows={3}
          placeholder="Nhập ghi chú phản ứng của khách hàng, mức đáp ứng trị liệu, dặn dò KTV cho các buổi tiếp theo..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 leading-relaxed resize-none shadow-2xs"
        />
      </div>

      {/* KHỐI 4: NÚT HOÀN THÀNH CA TRỊ LIỆU */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={handleOpenCompleteModal}
          className="px-8 py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <CheckCircle2 size={18} />
          <span>HOÀN THÀNH CA TRỊ LIỆU</span>
        </button>
      </div>

      {/* MODAL XÁC NHẬN HOÀN THÀNH */}
      {showConfirmModal && (() => {
        const plannedDuration = appointmentDetail?.thoi_luong_phut || 60;
        const startTimeIso = (appointmentDetail as any)?.thoi_gian_bat_dau || (appointmentDetail as any)?.thoi_gian_goi_vao || (appointmentDetail as any)?.thoi_gian_checkin;
        const startMs = startTimeIso ? new Date(startTimeIso).getTime() : Date.now();
        const elapsedMinutes = Math.max(1, Math.floor((Date.now() - startMs) / 60000));
        const earlyMinutes = plannedDuration - elapsedMinutes;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
                <CheckCircle2 size={28} />
                <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-jakarta uppercase tracking-wider">
                  Xác Nhận Hoàn Thành Trị Liệu
                </h3>
              </div>

              {earlyMinutes > 0 && (
                <div className="bg-amber-50/90 dark:bg-amber-955/50 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-left shadow-xs">
                  <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-extrabold text-amber-900 dark:text-amber-200">
                      ⚡ Ca hẹn dự kiến hoàn thành sớm
                    </p>
                    <p className="text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      Bạn đang hoàn thành sớm trước <strong className="text-amber-950 dark:text-amber-100 font-black">{earlyMinutes} phút</strong> so với dự kiến (ca dự kiến {plannedDuration} phút).
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800 text-left">
                Bạn có chắc muốn kết thúc ca trị liệu cho bệnh nhân <strong className="text-slate-900 dark:text-zinc-100">{patientName}</strong>?<br />
                • Thang đau VAS: <strong className="text-rose-600 font-bold">{vasTruoc}</strong> → <strong className="text-emerald-600 font-bold">{vasSau}</strong><br />
                • Kỹ thuật thực hiện: <strong className="text-teal-600 font-bold">{logs.length} thao tác</strong>
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Xác nhận hoàn thành</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
