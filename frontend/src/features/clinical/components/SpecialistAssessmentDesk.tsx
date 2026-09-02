import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Layers,
  Check,
  Clock,
  Ban,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PackageItem } from '../../../features/doctor/api/doctor.api';
import { formatCurrency } from '../../../utils/format';
import { CustomSelect } from '../../../components/CustomSelect';

const MMT_OPTIONS = [
  { value: '0/5', label: 'Bậc 0/5' },
  { value: '1/5', label: 'Bậc 1/5' },
  { value: '2/5', label: 'Bậc 2/5' },
  { value: '3/5', label: 'Bậc 3/5' },
  { value: '4/5', label: 'Bậc 4/5' },
  { value: '5/5', label: 'Bậc 5/5' },
];

interface RomItem {
  joint: string;
  movement: string;
  degrees: string;
}

interface MmtItem {
  muscleGroup: string;
  grade: string; // 0-5
}

interface AssessmentExtraData {
  vasScore?: number;
  romData?: RomItem[];
  mmtData?: MmtItem[];
  clinicalConclusion?: string;
  contraindications?: string;
}

interface SpecialistAssessmentDeskProps {
  patientName: string;
  packages: PackageItem[];
  appointmentDetail?: any;
  onCompleteAssessment: (data: {
    vasScore: number;
    romData: RomItem[];
    mmtData: MmtItem[];
    clinicalConclusion: string;
    contraindications: string;
    selectedPackageId?: string;
    notes?: string;
  }) => Promise<void>;
  onScheduleReassessment: (limitDate: string, notes?: string, assessmentData?: AssessmentExtraData) => Promise<void>;
  onSaveDraft?: (data: {
    vasScore: number;
    romData: RomItem[];
    mmtData: MmtItem[];
    clinicalConclusion: string;
    contraindications: string;
    selectedPackageId?: string;
  }) => void;
  compactMode?: boolean;
}

export function SpecialistAssessmentDesk({
  patientName,
  packages,
  appointmentDetail,
  onCompleteAssessment,
  onScheduleReassessment,
  onSaveDraft,
}: SpecialistAssessmentDeskProps) {
  // Mode chọn VAS (1: Wong-Baker Mặt Cười, 2: Mô Tả Bằng Lời, 3: Thang Số Slider)
  const [vasMode, setVasMode] = useState<'faces' | 'verbal' | 'numeric'>('faces');
  const [vasScore, setVasScore] = useState<number>(6);

  // Bảng ROM (Tầm vận động) & MMT (Cơ lực)
  const [romList, setRomList] = useState<RomItem[]>([]);
  const [mmtList, setMmtList] = useState<MmtItem[]>([]);

  // Text fields
  const [clinicalConclusion, setClinicalConclusion] = useState('');
  const [contraindications, setContraindications] = useState('');
  const [notes] = useState('');

  // Chỉ định gói (1 gói đề xuất cho ca lượng giá này)
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Modal Hẹn tái khám State
  const [showReassessModal, setShowReassessModal] = useState(false);
  const [reassessDays, setReassessDays] = useState<number>(3);
  const [reassessNotes, setReassessNotes] = useState('');

  // Tính toán thời điểm hết hạn live từ thời điểm hiện tại
  const calculatedDeadline = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + Math.max(1, Number(reassessDays) || 1));
    return d;
  }, [reassessDays]);

  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingReassess, setLoadingReassess] = useState(false);

  // Modal Xác nhận Hoàn thành State
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);

  // Thêm dòng ROM / MMT
  const handleAddRom = () => {
    setRomList([...romList, { joint: 'Khớp cổ', movement: 'Xoay trái', degrees: '40°' }]);
  };
  const handleRemoveRom = (index: number) => {
    setRomList(romList.filter((_, i) => i !== index));
  };

  const handleAddMmt = () => {
    setMmtList([...mmtList, { muscleGroup: 'Nhóm cơ thang', grade: '3/5' }]);
  };
  const handleRemoveMmt = (index: number) => {
    setMmtList(mmtList.filter((_, i) => i !== index));
  };

  const isHydratedRef = useRef(false);
  const hydratedAptIdRef = useRef<string | null>(null);

  const draftKey = useMemo(() => {
    return appointmentDetail?.id
      ? `draft_assess_${appointmentDetail.id}`
      : `draft_assess_${patientName.trim().replace(/\s+/g, '_')}`;
  }, [appointmentDetail?.id, patientName]);

  // Tự động khôi phục bản nháp từ sessionStorage (ƯU TIÊN HÀNG ĐẦU) hoặc pre-fill từ DB (chỉ chạy 1 LẦN duy nhất khi đổi ca)
  useEffect(() => {
    if (!appointmentDetail?.id) return;
    if (hydratedAptIdRef.current === appointmentDetail.id) return;
    hydratedAptIdRef.current = appointmentDetail.id;

    try {
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.vasMode) setVasMode(parsed.vasMode);
        if (parsed.vasScore != null) setVasScore(parsed.vasScore);
        if (parsed.romList) setRomList(parsed.romList);
        if (parsed.mmtList) setMmtList(parsed.mmtList);
        if (parsed.clinicalConclusion != null) setClinicalConclusion(parsed.clinicalConclusion);
        if (parsed.contraindications != null) setContraindications(parsed.contraindications);
        if (parsed.selectedPackageId !== undefined) {
          setSelectedPackageId(parsed.selectedPackageId || '');
        } else if (Array.isArray(parsed.selectedPackageIds) && parsed.selectedPackageIds[0]) {
          setSelectedPackageId(parsed.selectedPackageIds[0]);
        }
        isHydratedRef.current = true;
        return;
      }
    } catch (err) {
      console.error('Lỗi khôi phục bản nháp lượng giá:', err);
    }

    // Nếu CHƯA CÓ bản nháp trong sessionStorage -> Pre-fill từ DB (ca tái lượng giá / ca cũ)
    if (appointmentDetail.vas_truoc != null && appointmentDetail.vas_truoc !== undefined) {
      setVasScore(Number(appointmentDetail.vas_truoc));
    }
    if (appointmentDetail.chan_doan && appointmentDetail.chan_doan !== 'Chưa thể kết luận') {
      setClinicalConclusion(appointmentDetail.chan_doan);
    }
    if (appointmentDetail.chong_chi_dinh && appointmentDetail.chong_chi_dinh !== 'Chưa điền') {
      setContraindications(appointmentDetail.chong_chi_dinh);
    }
    if (appointmentDetail.goi_dich_vu_id) {
      setSelectedPackageId(appointmentDetail.goi_dich_vu_id);
    }

    const rawLuongGia = appointmentDetail.du_lieu_luong_gia;
    if (rawLuongGia) {
      let parsed = typeof rawLuongGia === 'string' ? null : rawLuongGia;
      if (typeof rawLuongGia === 'string') {
        try { parsed = JSON.parse(rawLuongGia); } catch (e) { }
      }
      if (parsed) {
        if (Array.isArray(parsed.rom_data) && parsed.rom_data.length > 0) {
          setRomList(parsed.rom_data);
        }
        if (Array.isArray(parsed.mmt_data) && parsed.mmt_data.length > 0) {
          setMmtList(parsed.mmt_data);
        }
      }
    }
    isHydratedRef.current = true;
  }, [appointmentDetail?.id, draftKey]);

  // Tự động lưu nháp: vừa lưu sessionStorage tức thì, vừa debounce ~1.5s gửi về server (giống hệt KTV)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          vasMode,
          vasScore,
          romList,
          mmtList,
          clinicalConclusion,
          contraindications,
          selectedPackageId,
        })
      );
    } catch (err) { }

    if (!onSaveDraft) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onSaveDraft({
        vasScore,
        romData: romList,
        mmtData: mmtList,
        clinicalConclusion,
        contraindications,
        selectedPackageId: selectedPackageId || undefined,
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [draftKey, vasMode, vasScore, romList, mmtList, clinicalConclusion, contraindications, selectedPackageId, onSaveDraft]);

  // Map các gói đang bị khóa cho bệnh nhân này (do đang điều trị dở hoặc đã chỉ định chưa thanh toán)
  const blockedPackagesMap = useMemo(() => {
    const list = (appointmentDetail as any)?.blocked_packages || [];
    const map = new Map<string, { reason_type: 'dang_dieu_tri' | 'cho_thanh_toan'; message: string; ten_goi: string }>();
    list.forEach((item: any) => {
      map.set(String(item.goi_dich_vu_id), item);
    });
    return map;
  }, [appointmentDetail]);

  // Xử lý nút Hoàn thành (Bật Modal xác nhận)
  const handleSubmitComplete = () => {
    // 1. Kiểm tra ROM
    if (!romList || romList.length === 0 || romList.some(r => !r.joint?.trim() || !r.movement?.trim() || !r.degrees?.trim())) {
      toast.error('Vui lòng thêm ít nhất 1 dòng Tầm vận động khớp (ROM) và điền đầy đủ thông tin!');
      return;
    }
    // 2. Kiểm tra MMT
    if (!mmtList || mmtList.length === 0 || mmtList.some(m => !m.muscleGroup?.trim() || !m.grade?.trim())) {
      toast.error('Vui lòng thêm ít nhất 1 dòng Đánh giá cơ lực (MMT) và điền đầy đủ thông tin!');
      return;
    }
    // 3. Kiểm tra Kết luận lượng giá
    if (!clinicalConclusion.trim()) {
      toast.error('Vui lòng nhập Kết luận lượng giá chức năng!');
      return;
    }
    // 4. Kiểm tra gói bị khóa
    if (selectedPackageId) {
      const blocked = blockedPackagesMap.get(String(selectedPackageId));
      if (blocked) {
        toast.error(
          blocked.reason_type === 'dang_dieu_tri'
            ? `Khách hàng đang điều trị gói "${blocked.ten_goi}" (chưa hoàn thành). Vui lòng chọn gói khác!`
            : `Khách hàng đã được chỉ định gói "${blocked.ten_goi}" (chưa thanh toán). Vui lòng chọn gói khác!`
        );
        return;
      }
    }
    setShowConfirmCompleteModal(true);
  };

  // Thực thi Hoàn thành khi bác sĩ đã bấm xác nhận trên Modal
  const executeCompleteAssessment = async () => {
    setShowConfirmCompleteModal(false);
    setLoadingComplete(true);
    try {
      await onCompleteAssessment({
        vasScore,
        romData: romList,
        mmtData: mmtList,
        clinicalConclusion,
        contraindications,
        selectedPackageId: selectedPackageId || undefined,
        notes,
      });
      sessionStorage.removeItem(draftKey);
      toast.success('Đã hoàn thành lượng giá & gửi chỉ định thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu kết quả lượng giá');
    } finally {
      setLoadingComplete(false);
    }
  };

  // Xử lý Hẹn quay lại (Tái lượng giá - Giải phóng chuyên viên ngay)
  const handleSubmitReassess = async () => {
    const days = Math.max(1, Number(reassessDays) || 1);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    const limitDateIso = format(deadline, 'yyyy-MM-dd');
    const hh = String(deadline.getHours()).padStart(2, '0');
    const mm = String(deadline.getMinutes()).padStart(2, '0');
    const dateStr = format(deadline, 'dd/MM/yyyy');

    const limitNoteText = `[Hạn tái lượng giá: ${hh}:${mm} ngày ${dateStr}]${reassessNotes?.trim() ? ' ' + reassessNotes.trim() : ''}`.trim();

    setLoadingReassess(true);
    try {
      await onScheduleReassessment(limitDateIso, limitNoteText, {
        vasScore,
        romData: romList,
        mmtData: mmtList,
        clinicalConclusion,
        contraindications,
      });
      sessionStorage.removeItem(draftKey);
      setShowReassessModal(false);
      toast.success(`Đã lưu hẹn quay lại (${days} ngày)! Chuyên viên đã được giải phóng để nhận ca mới.`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu hẹn quay lại');
    } finally {
      setLoadingReassess(false);
    }
  };

  return (
    <div className="w-full space-y-6 pt-1 font-jakarta">
      {/* KHỐI 1: THANG ĐO ĐAU VAS WONG-BAKER 3 CÁCH NHẬP */}
      <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-cyan-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              1. Thang đo điểm đau (VAS Pain Scale): <strong className="text-cyan-700 dark:text-cyan-400 text-sm ml-1">{vasScore}/10</strong>
            </h4>
          </div>

          {/* Switch mode nhập VAS */}
          <div className="flex bg-slate-200 dark:bg-zinc-700 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setVasMode('faces')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${vasMode === 'faces' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                }`}
            >
              Mặt cười (Wong-Baker)
            </button>
            <button
              type="button"
              onClick={() => setVasMode('verbal')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${vasMode === 'verbal' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                }`}
            >
              Mô tả lời nói
            </button>
            <button
              type="button"
              onClick={() => setVasMode('numeric')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${vasMode === 'numeric' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                }`}
            >
              Thang số (0-10)
            </button>
          </div>
        </div>

        {/* Render theo mode VAS */}
        {vasMode === 'faces' && (
          <div className="grid grid-cols-6 gap-2 pt-2">
            {[
              { score: 0, face: '😊', label: 'Không đau' },
              { score: 2, face: '🙂', label: 'Đau nhẹ' },
              { score: 4, face: '😐', label: 'Đau vừa' },
              { score: 6, face: '🙁', label: 'Đau nhức' },
              { score: 8, face: '😣', label: 'Đau nặng' },
              { score: 10, face: '😭', label: 'Cực độ' },
            ].map((f) => (
              <button
                key={f.score}
                type="button"
                onClick={() => setVasScore(f.score)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${vasScore === f.score
                    ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border-2 border-cyan-600 dark:border-cyan-500 shadow-sm scale-105'
                    : 'bg-white/80 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-cyan-300'
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
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
            {[
              { score: 0, label: 'Không đau' },
              { score: 2, label: 'Đau rất nhẹ' },
              { score: 4, label: 'Đau vừa phải' },
              { score: 6, label: 'Đau khó chịu' },
              { score: 8, label: 'Đau dữ dội' },
              { score: 10, label: 'Đau không chịu nổi' },
            ].map((v) => (
              <button
                key={v.score}
                type="button"
                onClick={() => setVasScore(v.score)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${vasScore === v.score
                    ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border-2 border-cyan-600 dark:border-cyan-500 shadow-sm'
                    : 'bg-white/80 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-cyan-300'
                  }`}
              >
                <div className="text-sm font-bold text-cyan-800 dark:text-cyan-300">{v.score} điểm</div>
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
              value={vasScore}
              onChange={(e) => setVasScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>0 (Không đau)</span>
              <span>5 (Đau vừa)</span>
              <span>10 (Cực độ)</span>
            </div>
          </div>
        )}
      </div>

      {/* KHỐI 2: ĐO ROM & ĐÁNH GIÁ MMT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
        {/* TẦM VẬN ĐỘNG KHỚP (ROM) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              2. Tầm vận động khớp (ROM): *
            </h4>
            <button
              type="button"
              onClick={handleAddRom}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <Plus size={14} /> Thêm khớp
            </button>
          </div>

          <div className="space-y-2">
            {romList.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400">
                Chưa thêm khớp đo nào. Bấm "+ Thêm khớp" để đo ROM (Bắt buộc).
              </div>
            ) : (
              romList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700"
                >
                  <input
                    type="text"
                    value={item.joint}
                    onChange={(e) => {
                      const next = [...romList];
                      next[idx].joint = e.target.value;
                      setRomList(next);
                    }}
                    placeholder="Vị trí khớp (vd: Khớp cổ)"
                    className="flex-1 p-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl"
                  />
                  <input
                    type="text"
                    value={item.movement}
                    onChange={(e) => {
                      const next = [...romList];
                      next[idx].movement = e.target.value;
                      setRomList(next);
                    }}
                    placeholder="Cử động (vd: Gập / Xoay)"
                    className="flex-1 p-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl"
                  />
                  <input
                    type="text"
                    value={item.degrees}
                    onChange={(e) => {
                      const next = [...romList];
                      next[idx].degrees = e.target.value;
                      setRomList(next);
                    }}
                    placeholder="Độ (vd: 45°)"
                    className="w-20 p-2 text-xs text-center font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRom(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ĐÁNH GIÁ CƠ LỰC (MMT 0-5) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              3. Đánh giá cơ lực (MMT 0-5): *
            </h4>
            <button
              type="button"
              onClick={handleAddMmt}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <Plus size={14} /> Thêm nhóm cơ
            </button>
          </div>

          <div className="space-y-2">
            {mmtList.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400">
                Chưa thêm nhóm cơ nào. Bấm "+ Thêm nhóm cơ" để đánh giá MMT (Bắt buộc).
              </div>
            ) : (
              mmtList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700"
                >
                  <input
                    type="text"
                    value={item.muscleGroup}
                    onChange={(e) => {
                      const next = [...mmtList];
                      next[idx].muscleGroup = e.target.value;
                      setMmtList(next);
                    }}
                    placeholder="Nhóm cơ (vd: Nhóm cơ thang dưới)"
                    className="flex-1 p-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl"
                  />
                  <CustomSelect
                    value={item.grade}
                    onChange={(val) => {
                      const next = [...mmtList];
                      next[idx].grade = val;
                      setMmtList(next);
                    }}
                    options={MMT_OPTIONS}
                    align="right"
                    className="w-28 sm:w-32 shrink-0"
                    buttonClassName="py-2 px-3 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700"
                    menuClassName="!min-w-[140px] w-36"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMmt(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* KHỐI 3: KẾT LUẬN & CHỐNG CHỈ ĐỊNH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <label className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider block mb-1.5">
            4. Kết luận lượng giá chức năng: *
          </label>
          <textarea
            rows={3}
            value={clinicalConclusion}
            onChange={(e) => setClinicalConclusion(e.target.value)}
            placeholder="Mô tả chức năng hạn chế, không gõ chẩn đoán bệnh lý y khoa..."
            className="w-full p-3.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider block mb-1.5">
            5. Chống chỉ định vận động / trị liệu:
          </label>
          <textarea
            rows={3}
            value={contraindications}
            onChange={(e) => setContraindications(e.target.value)}
            placeholder="Các lưu ý chống chỉ định nắn chỉnh, siêu âm hay kéo giãn..."
            className="w-full p-3.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      {/* KHỐI 4: THẺ CHỌN CHỈ ĐỊNH GÓI LIỆU TRÌNH */}
      <div className="space-y-3 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold">
              <Layers size={15} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              6. Chỉ định Gói điều trị / Liệu trình đề xuất:
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {selectedPackageId ? 'Đã chọn 1 gói chỉ định' : 'Chưa chọn gói (Dịch vụ lẻ)'}
          </span>
        </div>

        {/* DANH SÁCH THẺ GÓI LIỆU TRÌNH SANG TRỌNG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* Card Option 1: Không chỉ định gói */}
          <div
            onClick={() => setSelectedPackageId('')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${selectedPackageId === ''
                ? 'bg-white dark:bg-zinc-800 border-2 border-slate-800 dark:border-zinc-300 shadow-sm'
                : 'bg-white/80 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 hover:border-slate-400'
              }`}
          >
            <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedPackageId === '' ? 'border-slate-800 dark:border-zinc-200 bg-slate-800 text-white' : 'border-slate-300 dark:border-zinc-600'
              }`}>
              {selectedPackageId === '' && <Check size={11} />}
            </div>
            <div>
              <h5 className="font-heading text-xs font-bold text-slate-900 dark:text-zinc-100">
                Không chỉ định gói
              </h5>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Chỉ thực hiện dịch vụ lẻ hoặc theo dõi thêm.
              </p>
            </div>
          </div>

          {/* Cards các gói điều trị (chọn 1 gói) */}
          {packages.map((pkg) => {
            const blockedInfo = blockedPackagesMap.get(String(pkg.id));
            const isBlocked = Boolean(blockedInfo);
            const isSelected = selectedPackageId === pkg.id;

            if (isBlocked) {
              return (
                <div
                  key={pkg.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/60 opacity-60 cursor-not-allowed select-none flex items-start gap-3 relative transition-all shadow-none"
                  title={blockedInfo?.message}
                >
                  <div className="size-5 rounded-full border-2 border-slate-300 dark:border-zinc-600 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-slate-400">
                    <Ban size={11} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h5 className="font-heading text-xs font-bold text-slate-500 dark:text-zinc-400 line-clamp-1 line-through">
                        {pkg.ten_goi}
                      </h5>
                      {blockedInfo?.reason_type === 'dang_dieu_tri' ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-100 dark:bg-amber-955/60 text-amber-800 dark:text-amber-300 shrink-0 border border-amber-200/80 dark:border-amber-900/60 flex items-center gap-0.5">
                          <span>🚫 Đang điều trị</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-100 dark:bg-indigo-955/60 text-indigo-800 dark:text-indigo-300 shrink-0 border border-indigo-200/80 dark:border-indigo-900/60 flex items-center gap-0.5">
                          <span>⏳ Chờ thanh toán</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold italic line-clamp-1">
                      {blockedInfo?.message || (blockedInfo?.reason_type === 'dang_dieu_tri'
                        ? 'Khách đang điều trị gói này (chưa xong)'
                        : 'Đã chỉ định ở ca trước (chưa thanh toán)')}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${isSelected
                    ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border-2 border-cyan-600 dark:border-cyan-500 shadow-sm'
                    : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-cyan-300'
                  }`}
              >
                <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300 dark:border-zinc-600'
                  }`}>
                  {isSelected && <Check size={11} />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h5 className="font-heading text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">
                      {pkg.ten_goi}
                    </h5>
                    {pkg.tong_so_buoi && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 shrink-0">
                        {pkg.tong_so_buoi} buổi
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {(pkg.gia_goi || (pkg as any).don_gia) ? formatCurrency(pkg.gia_goi || (pkg as any).don_gia) : 'Chưa có giá'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER: ĐÚNG 2 NÚT KẾT THÚC (HOÀN THÀNH & HẸN QUAY LẠI) */}
      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-end gap-3">
        {/* Nút 2: Hẹn quay lại (Tái lượng giá) */}
        <button
          type="button"
          onClick={() => setShowReassessModal(true)}
          className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
        >
          <RotateCcw size={15} />
          <span>🔄 HẸN QUAY LẠI</span>
        </button>

        {/* Nút 1: Hoàn thành lượng giá */}
        <button
          type="button"
          disabled={loadingComplete}
          onClick={handleSubmitComplete}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 active:scale-98 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          <span>🟢 HOÀN THÀNH LƯỢNG GIÁ</span>
        </button>
      </div>

      {/* MODAL HẸN QUAY LẠI (CHUYỂN SANG CHỜ TÁI LƯỢNG GIÁ & GIẢI PHÓNG SLOT) */}
      {showReassessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-zinc-100">
                  Xác Nhận Hẹn Quay Lại (Tái Lượng Giá)
                </h3>
              </div>
            </div>

            <div className="space-y-4 pt-1 font-jakarta">
              {/* 1. Nhập số ngày thời hạn quay lại */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1.5">
                  1. Thời hạn quay lại (số ngày): *
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={reassessDays}
                    onChange={(e) => setReassessDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 p-3 text-sm font-extrabold text-center bg-purple-50 dark:bg-zinc-800 border-2 border-purple-300 dark:border-purple-700 rounded-2xl text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    ngày (tính từ thời điểm hiện tại)
                  </span>
                </div>

                {/* Live preview thời điểm hết hạn */}
                <div className="mt-3 p-3 rounded-2xl bg-purple-500/10 border border-purple-300/60 dark:border-purple-800/60 text-purple-900 dark:text-purple-200 text-xs font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    Thời hạn hết vào: <strong className="font-extrabold text-purple-700 dark:text-purple-300">{format(calculatedDeadline, 'HH:mm')} ngày {format(calculatedDeadline, 'dd/MM/yyyy')}</strong>
                  </span>
                </div>
              </div>

              {/* 2. Dặn dò khi mang phim/kết quả quay lại */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1.5">
                  2. Dặn dò khi mang phim/kết quả quay lại:
                </label>
                <textarea
                  rows={3}
                  value={reassessNotes}
                  onChange={(e) => setReassessNotes(e.target.value)}
                  placeholder="Khách mang phim X-quang/MRI ngoài đến để xem kết quả..."
                  className="w-full p-3 text-xs font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowReassessModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={loadingReassess}
                onClick={handleSubmitReassess}
                className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50 transition-all shadow-md cursor-pointer"
              >
                {loadingReassess ? 'Đang lưu...' : 'Xác Nhận Hẹn Quay Lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HOÀN THÀNH LƯỢNG GIÁ & CHỈ ĐỊNH */}
      {showConfirmCompleteModal && (() => {
        const selectedPkg = packages.find((p) => String(p.id) === selectedPackageId);
        return (
          <div className="fixed inset-0 z-50 bg-slate-955/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-jakarta">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 className="font-heading text-base font-black uppercase text-slate-900 dark:text-zinc-100 tracking-wide">
                    Xác Nhận Hoàn Tất Lượng Giá & Chỉ Định?
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Bệnh nhân: <span className="font-black text-slate-800 dark:text-zinc-200">{patientName}</span>
                  </p>
                </div>
              </div>

              {/* Tóm tắt thông tin kết quả */}
              <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl p-4 space-y-2.5 text-xs border border-slate-200/60 dark:border-zinc-700/60 font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-zinc-700/50">
                  <span className="font-bold text-slate-500 dark:text-zinc-400">Thang đau VAS:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{vasScore}/10</span>
                </div>

                {/* Tầm vận động khớp (ROM) */}
                <div className="pb-2 border-b border-slate-200/60 dark:border-zinc-700/50">
                  <span className="font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                    Tầm vận động khớp (ROM):
                  </span>
                  {romList && romList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {romList.map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-bold border border-teal-200/60 text-[11px]"
                        >
                          {r.joint}: {r.movement} ({r.degrees})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Chưa đo</span>
                  )}
                </div>

                {/* Đánh giá cơ lực (MMT) */}
                <div className="pb-2 border-b border-slate-200/60 dark:border-zinc-700/50">
                  <span className="font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                    Đánh giá cơ lực (MMT 0-5):
                  </span>
                  {mmtList && mmtList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {mmtList.map((m, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-200/60 text-[11px]"
                        >
                          {m.muscleGroup}: Bậc {m.grade}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Chưa đo</span>
                  )}
                </div>

                <div>
                  <span className="font-bold text-slate-500 dark:text-zinc-400 block mb-0.5">Kết luận lượng giá:</span>
                  <p className="font-bold text-slate-800 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                    {clinicalConclusion}
                  </p>
                </div>

                {contraindications && (
                  <div>
                    <span className="font-bold text-slate-500 dark:text-zinc-400 block mb-0.5">Chống chỉ định:</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 line-clamp-1">
                      {contraindications}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/50 flex justify-between items-center">
                  <span className="font-bold text-slate-500 dark:text-zinc-400">Chỉ định phác đồ / gói:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {selectedPkg ? `${selectedPkg.ten_goi} (${selectedPkg.tong_so_buoi || 10} buổi)` : 'Không chỉ định gói (Dịch vụ lẻ)'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-955/30 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/50">
                ⚠️ Kết quả lượng giá sẽ được lưu vĩnh viễn vào Hồ sơ điều trị của khách hàng và chuyên viên được giải phóng để nhận ca mới.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmCompleteModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                >
                  ↩️ Kiểm tra lại
                </button>
                <button
                  type="button"
                  disabled={loadingComplete}
                  onClick={executeCompleteAssessment}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loadingComplete ? 'Đang hoàn tất...' : '✅ Xác nhận — Hoàn tất ngay'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
