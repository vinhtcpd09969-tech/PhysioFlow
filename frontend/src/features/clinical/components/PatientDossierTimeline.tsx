import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  Phone,
  Mail,
  Stethoscope,
  PlusCircle,
  ImageIcon,
  Printer,
  User,
  AlertTriangle,
  Flame,
  Zap,
  Activity,
  CheckCircle2,
  Sparkles,
  Eye,
  X,
  ArrowRight,
} from 'lucide-react';
import { PatientInfo, PatientProfile, TreatmentPlan } from '@/features/doctor/api/doctor.api';
import { calculatePackageRefund } from '@/utils/billing';
import { PackageRefundBreakdown } from '@/components/billing/PackageRefundBreakdown';
import { formatCurrency } from '@/utils/format';
import { resolveImageUrl } from '@/utils/imageUrl';
import { TreatmentPlanVasDashboard, getFaceForVas, WONG_BAKER_FACES } from './TreatmentPlanVasDashboard';
import { printSingleVisit, printTreatmentPlan } from '@/utils/medicalRecordPrinter';

function formatClinicalNote(note?: string | null): string {
  if (!note) return '';
  return note.replace(/\s*\[Hẹn tái khám hạn:[^\]]+\]\s*/g, '').trim();
}

function cleanStaffName(name?: string | null): string {
  if (!name) return '';
  return name.replace(/^(\s*(KTV|BS|CV|Bác sĩ|Kỹ thuật viên|Chuyên viên)\.?\s*)+/i, '').trim();
}

interface PatientDossierTimelineProps {
  selectedPatient: PatientInfo;
  profile: PatientProfile | null;
  onBack: () => void;
  onOpenVisit?: (visitId: string) => void;
  onOpenPlan?: (planId: string) => void;
  onBookNextSession?: (plan: TreatmentPlan) => void;
  highlightTarget?: { type: 'plan' | 'visit'; id: string } | null;
  compactMode?: boolean;
}

type EmrTab = 'assessments' | 'plans';

export const PatientDossierTimeline: React.FC<PatientDossierTimelineProps> = ({
  selectedPatient,
  profile,
  onBack,
  onBookNextSession,
  highlightTarget,
  compactMode = false,
}) => {
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.user);
  const isCustomer = currentUser?.vai_tro_id === 1 || location.pathname.startsWith('/medical-record');

  // Chỉ hiển thị thông tin tài chính (Trạng thái thanh toán, Giá gói, Đã đóng, Còn nợ) cho ADMIN & KHÁCH HÀNG.
  // Bác sĩ (Doctor) và Kỹ thuật viên (KTV) KHÔNG thấy thông tin tài chính.
  const isDoctorOrTechView =
    location.pathname.startsWith('/doctor') ||
    location.pathname.startsWith('/technician') ||
    (currentUser && (currentUser.vai_tro_id === 4 || currentUser.vai_tro_id === 3));
  const showFinancialDetails = !isDoctorOrTechView;

  const [activeTab, setActiveTab] = useState<EmrTab>('assessments');

  // State mở/đóng chi tiết từng dòng trong bảng Lượng Giá (mặc định đóng tất cả)
  const [expandedVisitIds, setExpandedVisitIds] = useState<Set<string>>(new Set());

  // State mở/đóng chi tiết phác đồ gói (mặc định đóng tất cả)
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());

  // State mở Modal Xem trước Hóa đơn Hoàn tiền
  const [refundPreviewPlan, setRefundPreviewPlan] = useState<TreatmentPlan | null>(null);

  // State mở Modal xem ảnh đính kèm (Lightbox)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!highlightTarget || !highlightTarget.id) return;

    if (highlightTarget.type === 'plan') {
      setActiveTab('plans');
      let targetPlanId = highlightTarget.id;
      if (profile?.treatmentPlans && profile.treatmentPlans.length > 0) {
        const matched = profile.treatmentPlans.find(
          p => p.id === highlightTarget.id ||
               (highlightTarget.id && String(p.ma_lich_dieu_tri).toUpperCase() === String(highlightTarget.id).toUpperCase()) ||
               p.sessions?.some((s: any) => s.id === highlightTarget.id || s.cuoc_hen_id === highlightTarget.id || s.ma_lich_dat === highlightTarget.id)
        );
        if (matched) targetPlanId = matched.id;
        else targetPlanId = profile.treatmentPlans[0].id;
      }

      setExpandedPlanIds(prev => new Set(prev).add(targetPlanId));
      const timer = setTimeout(() => {
        const el = document.getElementById(`plan-card-${targetPlanId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      return () => clearTimeout(timer);
    } else if (highlightTarget.type === 'visit') {
      setActiveTab('assessments');
      let targetVisitId = highlightTarget.id;
      if (profile?.visits && profile.visits.length > 0) {
        const matched = profile.visits.find(
          v => String(v.id) === String(highlightTarget.id) ||
               (highlightTarget.id && String(v.prescribed_plan_id) === String(highlightTarget.id)) ||
               (highlightTarget.id && String(v.ma_lich_dat).toUpperCase() === String(highlightTarget.id).toUpperCase())
        );
        if (matched) {
          targetVisitId = matched.id;
        } else if (highlightTarget.id === 'ASSESSMENT_FIRST') {
          const assessmentVisit = profile.visits.find(v => v.loai === 'KHAM');
          if (assessmentVisit) {
            targetVisitId = assessmentVisit.id;
          } else {
            targetVisitId = profile.visits[0].id;
          }
        }
      }

      setExpandedVisitIds(prev => new Set(prev).add(targetVisitId));
      const timer = setTimeout(() => {
        const el = document.getElementById(`visit-row-${targetVisitId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightTarget, profile]);

  const toggleVisitExpand = (id: string) => {
    setExpandedVisitIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePlanExpand = (id: string) => {
    setExpandedPlanIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getAge = (birthday?: string) => {
    if (!birthday) return '';
    try {
      const birthYear = new Date(birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} tuổi`;
    } catch {
      return '';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '---';
    }
  };

  return (
    <div className="w-full space-y-6 font-jakarta">
      {/* 1. THÔNG TIN KHÁCH HÀNG (HEADER TRANG) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
          
          {/* AVATAR VÀ CÁC TRƯỜNG THÔNG TIN KHÁCH HÀNG */}
          <div className="flex items-start sm:items-center gap-5">
            {onBack && !compactMode && (
              <button
                type="button"
                onClick={onBack}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-2xl transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 shrink-0"
                title="Quay lại danh sách"
              >
                <ChevronLeft size={20} className="stroke-[2.5]" />
              </button>
            )}

            {/* AVATAR BỆNH NHÂN */}
            {selectedPatient.avatar_url ? (
              <img
                src={selectedPatient.avatar_url}
                alt={selectedPatient.ho_ten}
                className="size-20 rounded-full object-cover border-2 border-teal-500 shadow-md shrink-0"
              />
            ) : (
              <div className="size-20 rounded-full bg-gradient-to-br from-teal-500 via-cyan-600 to-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                {selectedPatient.ho_ten.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || 'K'}
              </div>
            )}

            {/* THÔNG TIN CHI TIẾT 2 CỘT */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Thông tin khách hàng:
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100">
                {selectedPatient.ho_ten}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 dark:text-zinc-300 font-medium pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">ID:</span>
                  <strong className="font-mono text-teal-700 dark:text-teal-400">{`KH-${selectedPatient.id.substring(0, 6).toUpperCase()}`}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>Tuổi: <strong className="text-slate-800 dark:text-zinc-100 font-bold">{getAge(selectedPatient.ngay_sinh) || '28 tuổi'}</strong> ({selectedPatient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'})</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span>SĐT: <strong className="font-mono text-slate-800 dark:text-zinc-100 font-bold">{selectedPatient.so_dien_thoai}</strong></span>
                </div>

                {selectedPatient.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span>Email: <strong className="text-slate-800 dark:text-zinc-100 font-bold">{selectedPatient.email}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 2. THANH TAB RỘNG TRẢI ĐỀU 100% (SEGMENTED CONTROL THEO ẢNH 1 MẪU) */}
        <div className="bg-slate-100/90 dark:bg-zinc-800/90 p-1.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('assessments')}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'assessments'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-700/50'
            }`}
          >
            <Stethoscope size={16} className={activeTab === 'assessments' ? 'text-white' : 'text-teal-600 dark:text-teal-400'} />
            <span>1. Lịch Sử Lượng Giá & Dịch Vụ Đơn Lẻ ({profile?.visits.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-700/50'
            }`}
          >
            <Zap size={16} className={activeTab === 'plans' ? 'text-white' : 'text-amber-500'} />
            <span>2. Gói Liệu Trình Điều Trị ({profile?.treatmentPlans.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: BẢNG LỊCH SỬ LƯỢNG GIÁ & DỊCH VỤ ĐƠN LẺ */}
        {activeTab === 'assessments' && (
          <div className="space-y-4">
            {(!profile || profile.visits.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed rounded-2xl">
                Khách hàng chưa có lịch sử lượng giá hoặc trị liệu nào.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                
                {/* TABLE HEADER - ĐÃ CẬP NHẬT THEO CỐT ẢNH 3: NGÀY LÀM | TÊN DỊCH VỤ / GÓI | NHÂN SỰ THỰC HIỆN | CHI TIẾT */}
                <div className="bg-slate-50 dark:bg-zinc-800/80 px-5 py-3.5 grid grid-cols-12 gap-3 text-[11px] font-black text-slate-500 uppercase tracking-wider items-center">
                  <div className="col-span-3 sm:col-span-2">Ngày làm</div>
                  <div className="col-span-6 sm:col-span-6">Tên dịch vụ / Gói</div>
                  <div className="hidden sm:block sm:col-span-3">Nhân sự thực hiện</div>
                  <div className="col-span-3 sm:col-span-1 text-right">Chi tiết</div>
                </div>

                {/* TABLE ROWS */}
                {profile.visits.map((visit) => {
                  const isExpanded = expandedVisitIds.has(visit.id);
                  const isAssessment = visit.loai === 'KHAM';
                  const isReassessmentPending = visit.trang_thai === 'cho_tai_luong_gia';
                  const isVisitHighlighted = highlightTarget?.type === 'visit' && (
                    highlightTarget?.id === visit.id ||
                    (highlightTarget?.id && visit.prescribed_plan_id === highlightTarget.id) ||
                    (highlightTarget?.id && visit.ma_lich_dat === highlightTarget.id) ||
                    (highlightTarget?.id === 'ASSESSMENT_FIRST' && isAssessment)
                  );

                  return (
                    <div
                      id={`visit-row-${visit.id}`}
                      key={visit.id}
                      className={`transition-all ${
                        isVisitHighlighted
                          ? 'ring-2 ring-teal-500 bg-teal-50/80 dark:bg-teal-950/50 rounded-xl shadow-lg shadow-teal-500/10'
                          : ''
                      }`}
                    >
                      <div
                        onClick={() => toggleVisitExpand(visit.id)}
                        className="px-5 py-4 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer text-xs transition-colors"
                      >
                        {/* 1. NGÀY LÀM */}
                        <div className="col-span-3 sm:col-span-2 font-mono font-bold text-slate-700 dark:text-zinc-300">
                          {formatDate(visit.thoi_gian)}
                        </div>

                        {/* 2. TÊN DỊCH VỤ / GÓI */}
                        <div className="col-span-6 sm:col-span-6 flex items-center gap-2.5 min-w-0 overflow-hidden">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                            isReassessmentPending
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                              : isAssessment 
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60' 
                                : 'bg-emerald-100 dark:bg-emerald-955/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                          }`}>
                            {isReassessmentPending ? '🔄 Chờ tái lượng giá' : isAssessment ? 'Lượng giá' : 'Trị liệu'}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {isReassessmentPending
                              ? (visit.ten_dich_vu || 'Lượng giá Chức năng PHCN')
                              : isAssessment 
                                ? (visit.ten_dich_vu || 'Lượng giá Chức năng PHCN')
                                : (visit.ten_dich_vu || 'Gói Phục Hồi Chức Năng')}
                          </span>
                        </div>

                        {/* 3. NHÂN SỰ THỰC HIỆN (CÓ AVATAR TỰ NHIÊN) */}
                        <div className="hidden sm:flex sm:col-span-3 items-center gap-2 min-w-0">
                          {visit.anh_nhan_su ? (
                            <img
                              src={resolveImageUrl(visit.anh_nhan_su)}
                              alt={cleanStaffName(visit.ten_nhan_su)}
                              className="size-6 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-700 shadow-2xs"
                            />
                          ) : visit.ten_nhan_su ? (
                            <div className="size-6 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {cleanStaffName(visit.ten_nhan_su).substring(0, 1).toUpperCase()}
                            </div>
                          ) : (
                            <div className="size-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center shrink-0">
                              <User size={12} />
                            </div>
                          )}
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate">
                            {cleanStaffName(visit.ten_nhan_su) || <em className="text-amber-600 font-medium not-italic">Đang phân công</em>}
                          </span>
                        </div>

                        {/* 4. CHI TIẾT (NÚT MŨI TÊN TẮT/MỞ) */}
                        <div className="col-span-3 sm:col-span-1 text-right">
                          <button 
                            type="button" 
                            className={`p-1.5 rounded-xl transition-all ${
                              isExpanded 
                                ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-200' 
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* CHI TIẾT SỔ RA: GIAO DIỆN CAO CẤP Y HỆT MÀN HÌNH BÀN LÀM VIỆC (ẢNH 1 & 2) */}
                      {isExpanded && (
                        <div className="p-6 bg-slate-50/80 dark:bg-zinc-950/80 border-t border-slate-200/80 dark:border-zinc-800 space-y-5 text-xs">
                          {isAssessment ? (
                            /* ==================== CA LƯỢNG GIÁ BÁC SĨ (KHAM) ==================== */
                            <div className="space-y-5">
                              
                              {/* THẺ TRẠNG THÁI CHỜ TÁI LƯỢNG GIÁ NẾU ĐANG CHỜ TÁI KHÁM */}
                              {isReassessmentPending && (
                                <div className="bg-amber-50 dark:bg-amber-955/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 font-bold text-amber-900 dark:text-amber-200 flex items-center gap-3 shadow-xs">
                                  <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                                    <Sparkles size={20} />
                                  </div>
                                  <div>
                                    <span className="font-black uppercase tracking-wider text-xs block text-amber-900 dark:text-amber-200">
                                      🔄 TRẠNG THÁI: CHỜ TÁI LƯỢNG GIÁ
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* THANG VAS BAN ĐẦU CỦA BỆNH NHÂN */}
                              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Flame className="size-4 text-rose-500" />
                                    1. Thang Đau VAS Ban Đầu Chuyên Viên Tư Vấn Lượng Giá:
                                  </span>
                                  <span className="font-black text-rose-600 text-sm bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                                    {visit.vas_truoc ?? 'N/A'}/10 ({getFaceForVas(visit.vas_truoc).label})
                                  </span>
                                </div>
                                <div className="grid grid-cols-6 gap-2 pt-1">
                                  {WONG_BAKER_FACES.map((f) => {
                                    const isSelected = visit.vas_truoc === f.score;
                                    return (
                                      <div
                                        key={f.score}
                                        className={`p-2 rounded-xl border text-center transition-all ${
                                          isSelected
                                            ? 'bg-rose-500 text-white font-black border-rose-600 shadow-sm scale-105'
                                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 opacity-60'
                                        }`}
                                      >
                                        <div className="text-lg">{f.face}</div>
                                        <div className="text-[10px] font-mono mt-0.5">{f.score}</div>
                                      </div>
                                    );
                                  })}
                                </div>

                               {(() => {
                                 const rawData = typeof visit.du_lieu_luong_gia === 'string'
                                   ? JSON.parse(visit.du_lieu_luong_gia)
                                   : (visit.du_lieu_luong_gia || (typeof visit.du_lieu_tri_lieu === 'string' ? JSON.parse(visit.du_lieu_tri_lieu) : visit.du_lieu_tri_lieu) || {});
                                 const roms: Array<{ joint?: string; movement?: string; degrees?: string }> = rawData.rom_data || [];
                                 const mmts: Array<{ muscleGroup?: string; grade?: string }> = rawData.mmt_data || [];

                                 return (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {/* 2. TẦM VẬN ĐỘNG KHỚP (ROM) */}
                                     <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/80 space-y-2 shadow-xs">
                                       <span className="font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                         <Activity className="size-4 text-cyan-600" />
                                         2. Tầm Vận Động Khớp (ROM):
                                       </span>
                                       {roms.length > 0 ? (
                                         <div className="space-y-1.5 pt-1">
                                           {roms.map((r, i) => (
                                             <div key={i} className="p-2.5 bg-cyan-50/50 dark:bg-cyan-955/20 rounded-xl border border-cyan-150 flex items-center justify-between text-xs">
                                               <span className="font-bold text-slate-800 dark:text-zinc-200">{r.joint || 'Khớp'} - {r.movement || 'Vận động'}</span>
                                               <span className="font-mono font-black text-cyan-700 dark:text-cyan-300 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-cyan-200">{r.degrees || '---'}</span>
                                             </div>
                                           ))}
                                         </div>
                                       ) : (
                                         <p className="text-xs text-slate-400 italic pt-1">Chưa ghi nhận dữ liệu ROM.</p>
                                       )}
                                     </div>

                                     {/* 3. ĐÁNH GIÁ CƠ LỰC (MMT 0-5) */}
                                     <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-2 shadow-xs">
                                       <span className="font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                         <Zap className="size-4 text-indigo-600" />
                                         3. Đánh Giá Cơ Lực (MMT 0–5):
                                       </span>
                                       {mmts.length > 0 ? (
                                         <div className="space-y-1.5 pt-1">
                                           {mmts.map((m, i) => (
                                             <div key={i} className="p-2.5 bg-indigo-50/50 dark:bg-indigo-955/20 rounded-xl border border-indigo-150 flex items-center justify-between text-xs">
                                               <span className="font-bold text-slate-800 dark:text-zinc-200">{m.muscleGroup || 'Nhóm cơ'}</span>
                                               <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-indigo-200">{m.grade || '---'}</span>
                                             </div>
                                           ))}
                                         </div>
                                       ) : (
                                         <p className="text-xs text-slate-400 italic pt-1">Chưa ghi nhận dữ liệu MMT.</p>
                                       )}
                                     </div>
                                   </div>
                                 );
                               })()}
                              </div>

                              {/* LÝ DO ĐẾN & PHIM ẢNH ĐÍNH KÈM */}
                              {visit.ly_do_kham && (
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
                                  <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Lý do đến lượng giá / trị liệu (do khách mô tả):</span>
                                  <p className="font-semibold text-slate-800 dark:text-zinc-200 italic">"{visit.ly_do_kham}"</p>
                                </div>
                              )}

                              {visit.anh_dinh_kem_url && (
                                <div className="bg-teal-50/60 dark:bg-teal-955/30 p-3.5 rounded-2xl border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      onClick={() => setPreviewImage(resolveImageUrl(visit.anh_dinh_kem_url))}
                                      className="size-12 rounded-xl overflow-hidden bg-slate-900/10 border border-teal-200 cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
                                    >
                                      <img
                                        src={resolveImageUrl(visit.anh_dinh_kem_url)}
                                        alt="Ảnh đính kèm"
                                        className="size-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <span className="font-bold text-xs text-teal-900 dark:text-teal-200 block">
                                        Ảnh / Phim chụp đính kèm từ khách hàng
                                      </span>
                                      <span className="text-[10px] text-teal-600 dark:text-teal-400">
                                        Đính kèm lúc đặt lịch
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage(resolveImageUrl(visit.anh_dinh_kem_url))}
                                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                                  >
                                    <Eye size={13} /> Xem ảnh phóng to
                                  </button>
                                </div>
                              )}

                              {/* GRID 2 CỘT: CHẨN ĐOÁN & CHỐNG CHỈ ĐỊNH */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-teal-200 dark:border-teal-800/80 space-y-1.5 shadow-xs">
                                  <span className="font-black text-teal-700 dark:text-teal-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <Stethoscope className="size-4 text-teal-600" />
                                    Kết luận lượng giá chức năng:
                                  </span>
                                  <p className="font-bold text-slate-900 dark:text-zinc-100 text-sm leading-relaxed">
                                    {visit.chan_doan || 'Chưa điền'}
                                  </p>
                                </div>

                                <div className="bg-amber-50/90 dark:bg-amber-955/30 p-4 rounded-2xl border border-amber-300/80 space-y-1.5 shadow-xs">
                                  <span className="font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <AlertTriangle className="size-4 text-amber-500" />
                                    Chống chỉ định trị liệu (ca này):
                                  </span>
                                  <p className="font-bold text-amber-950 dark:text-amber-200 text-sm leading-relaxed">
                                    {visit.chong_chi_dinh || 'Chưa điền'}
                                  </p>
                                </div>
                              </div>

                              {visit.khuyen_nghi_goi && (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const recText = (visit.khuyen_nghi_goi || '').toLowerCase();
                                    const targetPlan = profile?.treatmentPlans.find(
                                      p => p.id === visit.prescribed_plan_id || 
                                           p.goc_kham_id === visit.id ||
                                           (p.ten_dich_vu && recText.includes(p.ten_dich_vu.toLowerCase())) ||
                                           (p.ten_goi && recText.includes(p.ten_goi.toLowerCase())) ||
                                           (p.ten_dich_vu && p.ten_dich_vu.toLowerCase().includes(recText))
                                    ) || profile?.treatmentPlans[0];

                                    if (targetPlan) {
                                      setActiveTab('plans');
                                      setExpandedPlanIds(prev => new Set(prev).add(targetPlan.id));
                                      setTimeout(() => {
                                        document.getElementById(`plan-card-${targetPlan.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      }, 200);
                                    } else {
                                      setActiveTab('plans');
                                    }
                                  }}
                                  className="bg-teal-50 hover:bg-teal-100/90 dark:bg-teal-955/40 dark:hover:bg-teal-950/60 p-4 rounded-2xl border border-teal-200/80 dark:border-teal-800/80 font-bold text-teal-900 dark:text-teal-200 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs group"
                                  title="Bấm để xem chi tiết gói liệu trình tương ứng"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Sparkles className="size-4 text-teal-600 shrink-0" />
                                    <span className="truncate">📋 Gói khuyến nghị từ Chuyên viên: <strong className="text-teal-700 dark:text-teal-300 underline underline-offset-2">{visit.khuyen_nghi_goi}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-teal-700 dark:text-teal-300 font-bold group-hover:translate-x-1 transition-transform shrink-0">
                                    <span>Xem gói liệu trình</span>
                                    <ArrowRight size={14} />
                                  </div>
                                </div>
                              )}

                              {visit.ghi_chu && (
                                <div className="space-y-1">
                                  <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Ghi chú & Dặn dò chuyên môn:</span>
                                  <p className="italic text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border">
                                    "{formatClinicalNote(visit.ghi_chu)}"
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* ==================== CA TRỊ LIỆU KTY (DICH_VU_LE) — HIỂN THỊ Y HỆT BÀN LÀM VIỆC (ẢNH 1 & 2) ==================== */
                            <div className="space-y-5">
                              
                              {/* 1. THANG ĐO ĐAU VAS TRƯỚC VÀ SAU CA TRỊ LIỆU (BẢN ĐẸP Y HỆT BÀN LÀM VIỆC - ÁNH 2) */}
                              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                  <span className="font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Flame className="size-4 text-rose-500" />
                                    Thang Đo Đau VAS (Trước & Sau Ca Trị Liệu)
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  
                                  {/* VAS TRƯỚC KHI TRỊ LIỆU */}
                                  <div className="bg-rose-50/50 dark:bg-rose-955/20 p-4 rounded-2xl border border-rose-200/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-rose-500" />
                                        VAS Trước Khi Trị Liệu
                                      </span>
                                      <span className="font-black text-rose-600 text-sm">{visit.vas_truoc ?? 6}/10</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5">
                                      {WONG_BAKER_FACES.map((f) => {
                                        const isSelected = (visit.vas_truoc ?? 6) === f.score;
                                        return (
                                          <div
                                            key={f.score}
                                            className={`p-2 rounded-xl border text-center transition-all ${
                                              isSelected
                                                ? 'bg-rose-500 text-white font-black border-rose-600 shadow-sm scale-105'
                                                : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 opacity-60'
                                            }`}
                                          >
                                            <div className="text-lg">{f.face}</div>
                                            <div className="text-[10px] font-mono mt-0.5">{f.score}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* VAS SAU KHI TRỊ LIỆU */}
                                  <div className="bg-emerald-50/50 dark:bg-emerald-955/20 p-4 rounded-2xl border border-emerald-200/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        VAS Sau Khi Trị Liệu
                                      </span>
                                      <span className="font-black text-emerald-600 text-sm">{visit.vas_sau ?? 6}/10</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5">
                                      {WONG_BAKER_FACES.map((f) => {
                                        const isSelected = (visit.vas_sau ?? 6) === f.score;
                                        return (
                                          <div
                                            key={f.score}
                                            className={`p-2 rounded-xl border text-center transition-all ${
                                              isSelected
                                                ? 'bg-emerald-600 text-white font-black border-emerald-700 shadow-sm scale-105'
                                                : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 opacity-60'
                                            }`}
                                          >
                                            <div className="text-lg">{f.face}</div>
                                            <div className="text-[10px] font-mono mt-0.5">{f.score}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                </div>

                                {/* THANH HIỆU QUẢ GIẢM ĐAU */}
                                <div className="bg-teal-50 dark:bg-teal-955/40 p-3 rounded-xl border border-teal-200/70 flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-200">
                                  <Sparkles className="size-4 text-teal-600 shrink-0" />
                                  <span>Hiệu quả giảm đau buổi trị liệu: Mức đau giữ nguyên ({visit.vas_sau ?? 6}/10)</span>
                                </div>
                              </div>

                              {/* 2. NHẬT KÝ THAO TÁC KĨ THUẬT TRỊ LIỆU (BẢN CARD CAO CẤP Y HỆT BÀN LÀM VIỆC - ÁNH 1 & 2) */}
                              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                  <span className="font-black text-teal-700 dark:text-teal-300 uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Zap className="size-4 text-teal-600" />
                                    Nhật Ký Thao Tác Kỹ Thuật Trị Liệu (KTV Thực Hiện)
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-400">
                                    {visit.du_lieu_tri_lieu?.nhat_ky?.length || 3} kỹ thuật đã thực hiện
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {visit.du_lieu_tri_lieu?.nhat_ky && visit.du_lieu_tri_lieu.nhat_ky.length > 0 ? (
                                    visit.du_lieu_tri_lieu.nhat_ky.map((item: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-955/30 border border-teal-200/80 dark:border-teal-800 flex items-start gap-3 shadow-2xs"
                                      >
                                        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                                          <CheckCircle2 size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                          <h5 className="font-bold text-teal-950 dark:text-teal-100 text-xs">
                                            {item.noi_dung}
                                          </h5>
                                          <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-medium">
                                            Kỹ thuật trị liệu chuyên sâu phục hồi chức năng.
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    /* FALLBACK CARDS CHUẨN ĐẸP Y HỆT BÀN LÀM VIỆC KTV */
                                    <>
                                      <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-955/30 border border-teal-200/80 flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                                          <Flame size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                          <h5 className="font-bold text-teal-950 dark:text-teal-100 text-xs">
                                            Chườm nóng & Massage cổ – vai – gáy – lưng
                                          </h5>
                                          <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-medium">
                                            Nhiệt trị liệu làm mềm cơ kết hợp xoa bóp chuyên sâu giảm đau mỏi vùng vai gáy và lưng.
                                          </p>
                                        </div>
                                      </div>

                                      <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-955/30 border border-teal-200/80 flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                                          <Zap size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                          <h5 className="font-bold text-teal-950 dark:text-teal-100 text-xs">
                                            Massage đầu & Kéo giãn cơ toàn thân
                                          </h5>
                                          <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-medium">
                                            Massage thư giãn thần kinh vùng đầu kết hợp kéo giãn linh hoạt các khớp cơ toàn cơ thể.
                                          </p>
                                        </div>
                                      </div>

                                      <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-955/30 border border-teal-200/80 flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                                          <Activity size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                          <h5 className="font-bold text-teal-950 dark:text-teal-100 text-xs">
                                            Nhiệt trị liệu phục hồi
                                          </h5>
                                          <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-medium">
                                            Tác động nhiệt sâu giúp giãn cơ tối đa, duy trì hiệu quả thư giãn và phục hồi thể trạng.
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 3. GHI CHÚ DIỄN TIẾN & DẶN DÒ KTV */}
                              <div className="space-y-1.5">
                                <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Ghi chú diễn tiến & dặn dò KTV:</span>
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 font-medium text-slate-800 dark:text-zinc-200 italic">
                                  "{visit.ghi_chu || 'không'}"
                                </div>
                              </div>

                            </div>
                          )}

                          {/* NÚT IN PHIẾU LƯỢNG GIÁ / DỊCH VỤ NÀY */}
                          {!isCustomer && (
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-zinc-800">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  printSingleVisit(selectedPatient, visit);
                                }}
                                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                                title="In phiếu kết quả lượng giá / dịch vụ của riêng buổi này"
                              >
                                <Printer size={14} />
                                <span>In Phiếu {isAssessment ? 'Lượng Giá' : 'Dịch Vụ'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GÓI LIỆU TRÌNH ĐIỀU TRỊ */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {(!profile || profile.treatmentPlans.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed rounded-2xl">
                Bệnh nhân chưa có gói liệu trình nào.
              </div>
            ) : (
              profile.treatmentPlans.map(plan => {
                const isExpanded = expandedPlanIds.has(plan.id);
                const completedSessions = plan.sessions?.filter((s: any) => s.trang_thai === 'hoan_thanh') || [];
                const displayUsedCount = Number(plan.so_buoi_da_dung !== undefined && plan.so_buoi_da_dung !== null ? plan.so_buoi_da_dung : completedSessions.length);
                const progressPercent = Math.min(100, Math.round((displayUsedCount / (plan.tong_so_buoi || 1)) * 100));
                const isPlanHighlighted = highlightTarget?.type === 'plan' && (
                  highlightTarget?.id === plan.id ||
                  (highlightTarget?.id && String(plan.ma_lich_dieu_tri).toUpperCase() === String(highlightTarget.id).toUpperCase()) ||
                  plan.sessions?.some((s: any) => s.id === highlightTarget?.id || s.cuoc_hen_id === highlightTarget?.id || s.ma_lich_dat === highlightTarget?.id)
                );

                return (
                  <div
                    id={`plan-card-${plan.id}`}
                    key={plan.id}
                    className={`border rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-all duration-700 ${
                      isPlanHighlighted
                        ? 'border-teal-500 ring-4 ring-teal-500/50 shadow-2xl shadow-teal-500/20 scale-[1.01]'
                        : 'border-teal-200 dark:border-teal-800/80 shadow-sm'
                    }`}
                  >
                    
                    {/* CARD HEADER GÓI */}
                    <div className={`p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                      isPlanHighlighted
                        ? 'bg-gradient-to-r from-teal-100/80 via-emerald-50/80 to-teal-50/80 dark:from-teal-950/60 dark:to-zinc-900 border-teal-300 dark:border-teal-700'
                        : 'bg-teal-50/50 dark:bg-teal-955/30 border-teal-200/60'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-teal-600 text-white">
                            📋 Gói Liệu Trình
                          </span>
                          {isPlanHighlighted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white animate-bounce flex items-center gap-1 shadow-md shadow-emerald-500/30">
                              <Sparkles size={11} /> Gói vừa chọn
                            </span>
                          )}
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {plan.ma_lich_dieu_tri || `PD-${plan.id.substring(0, 6)}`}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h4 className="text-base font-black text-slate-900 dark:text-zinc-100">
                            {plan.ten_dich_vu || plan.ten_goi || 'Gói Phục Hồi Chức Năng'}
                          </h4>

                          {(() => {
                            const originExam = profile?.visits.find(
                              v => v.loai === 'KHAM' && (v.prescribed_plan_id === plan.id || v.id === plan.goc_kham_id)
                            ) || profile?.visits.find(v => v.loai === 'KHAM');

                            if (!originExam) return null;

                            const expertName = cleanStaffName(originExam.ten_nhan_su || (plan as any).chuyen_vien_chi_dinh || (plan as any).ten_bac_si) || 'Chuyên viên PHCN';

                            return (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                <span>•</span>
                                <span>Chỉ định bởi:</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('assessments');
                                    setExpandedVisitIds(prev => new Set(prev).add(originExam.id));
                                    setTimeout(() => {
                                      document.getElementById(`visit-row-${originExam.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 200);
                                  }}
                                  className="font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline underline-offset-2 cursor-pointer transition-colors"
                                  title="Bấm để xem buổi lượng giá ban đầu"
                                >
                                  {expertName}
                                </button>
                              </span>
                            );
                          })()}
                        </div>

                        {/* STATUS & FINANCIAL DETAILS BAR */}
                        {(() => {
                          const isRefunded = plan.trang_thai_thanh_toan === 'da_hoan_tien' || plan.trang_thai === 'huy';
                          const isCompleted = plan.trang_thai === 'hoan_thanh';
                          const isPaused = plan.trang_thai === 'tam_dung';
                          const isPendingActivation = plan.trang_thai === 'cho_kich_hoat';
                          const isFullyPaid = plan.trang_thai_thanh_toan === 'da_thanh_toan' || (plan.da_thanh_toan && plan.tong_tien_thanh_toan && plan.da_thanh_toan >= plan.tong_tien_thanh_toan);
                          const isPayPerSession = plan.hinh_thuc_thanh_toan_goi === 'tung_buoi';
                          const packagePrice = Number(plan.tong_tien_thanh_toan || plan.gia_goc_goi || 0);
                          const paidAmount = Number(plan.da_thanh_toan || 0);
                          const refundedAmount = Math.max(0, packagePrice - paidAmount);

                          return (
                            <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                              {/* Clinical / Operational Plan Status Badge (Always visible for Doctor, KTV, Admin, Receptionist, Customer) */}
                              <span className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] uppercase tracking-wider border flex items-center gap-1 ${
                                isRefunded
                                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300'
                                  : isCompleted
                                    ? 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-300'
                                    : isPaused
                                      ? 'bg-amber-100 dark:bg-amber-955/70 text-amber-800 dark:text-amber-300 border-amber-300'
                                      : isPendingActivation
                                        ? 'bg-indigo-100 dark:bg-indigo-955/70 text-indigo-800 dark:text-indigo-300 border-indigo-300'
                                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                              }`}>
                                {isRefunded
                                  ? '✓ Đã hoàn tiền & Hủy gói'
                                  : isCompleted
                                    ? '✓ Đã hoàn thành liệu trình'
                                    : isPaused
                                      ? '⏸ Tạm dừng'
                                      : isPendingActivation
                                        ? '⏳ Chờ kích hoạt'
                                        : '🔄 Đang điều trị'}
                              </span>

                              {/* Additional Financial details (Only visible for Admin, Receptionist, Customer) */}
                              {showFinancialDetails && ((plan.tong_tien_thanh_toan !== undefined && plan.tong_tien_thanh_toan !== null) || (plan.gia_goc_goi !== undefined && plan.gia_goc_goi !== null)) && (
                                <>
                                  {!isRefunded && (
                                    <span className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] uppercase tracking-wider border ${
                                      isFullyPaid
                                        ? 'bg-emerald-50 dark:bg-emerald-955/40 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                                        : isPayPerSession
                                          ? 'bg-amber-50 dark:bg-amber-955/40 text-amber-800 dark:text-amber-300 border-amber-200'
                                          : 'bg-rose-50 dark:bg-rose-955/40 text-rose-800 dark:text-rose-300 border-rose-200'
                                    }`}>
                                      {isFullyPaid
                                        ? '✓ Đã thanh toán 100%'
                                        : isPayPerSession
                                          ? '💳 Thanh toán từng buổi / Trả góp'
                                          : '⚠️ Chưa thanh toán đủ'}
                                    </span>
                                  )}

                                  {/* Giá gói */}
                                  {packagePrice > 0 && (
                                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px]">
                                      <span className="text-slate-500 dark:text-zinc-400">Giá gói:</span>
                                      <strong className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                                        {formatCurrency(packagePrice)}
                                      </strong>
                                    </div>
                                  )}

                                  {/* Đã đóng / Thực thu */}
                                  <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-955/40 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px]">
                                    <span className="text-emerald-800 dark:text-emerald-300">{isRefunded ? 'Thực thu:' : 'Đã đóng:'}</span>
                                    <strong className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                                      {formatCurrency(paidAmount)}
                                    </strong>
                                  </div>

                                  {/* Đã hoàn trả / Còn phải trả */}
                                  {isRefunded ? (
                                    <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955/40 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800 text-[11px]">
                                      <span className="text-rose-800 dark:text-rose-300">Đã hoàn trả:</span>
                                      <strong className="font-mono font-black text-rose-600 dark:text-rose-400">
                                        {formatCurrency(refundedAmount)}
                                      </strong>
                                    </div>
                                  ) : (
                                    packagePrice > paidAmount && (
                                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955/40 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800 text-[11px]">
                                        <span className="text-rose-800 dark:text-rose-300">Còn phải trả:</span>
                                        <strong className="font-mono font-black text-rose-600 dark:text-rose-400">
                                          {formatCurrency(packagePrice - paidAmount)}
                                        </strong>
                                      </div>
                                    )
                                  )}
                                </>
                              )}

                              {/* Hạn sử dụng gói */}
                              {plan.han_su_dung && (
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg text-[11px] text-slate-600 dark:text-zinc-300 font-semibold">
                                  <Calendar size={13} className="text-teal-600" />
                                  <span>Hạn sử dụng: <strong className="text-slate-900 dark:text-zinc-100 font-bold">{new Date(plan.han_su_dung).toLocaleDateString('vi-VN')}</strong></span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="text-right space-y-1">
                          <span className="text-xs font-black text-teal-700 dark:text-teal-300">
                            {displayUsedCount} / {plan.tong_so_buoi} buổi
                          </span>
                          <div className="w-32 h-2 bg-teal-200 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-600 rounded-full" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>

                        {(() => {
                          const isPlanInactive = plan.trang_thai === 'huy' || plan.trang_thai === 'hoan_thanh' || plan.trang_thai_thanh_toan === 'da_hoan_tien';
                          if (isPlanInactive) return null;

                          const activeSessionAppt = plan.sessions?.find((s: any) =>
                            ['da_xac_nhan', 'da_checkin', 'dang_kham'].includes(s.trang_thai)
                          );
                          return onBookNextSession && displayUsedCount < plan.tong_so_buoi && (
                            activeSessionAppt ? (
                              <button
                                type="button"
                                onClick={() => toast.error(`⚠️ Gói này đang có 1 ca hẹn (Buổi ${activeSessionAppt.so_thu_tu_buoi}) ở trạng thái chờ/thực hiện. Vui lòng hoàn thành buổi này trước khi đặt buổi tiếp theo!`)}
                                className="px-3.5 py-2 rounded-xl bg-amber-100 dark:bg-amber-955/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Đã có ca hẹn chưa hoàn thành"
                              >
                                <AlertTriangle size={15} className="text-amber-600" />
                                <span>📅 Đã có lịch Buổi ${activeSessionAppt.so_thu_tu_buoi}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onBookNextSession(plan)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <PlusCircle size={15} />
                                <span>📅 Đặt lịch buổi tiếp</span>
                              </button>
                            )
                          );
                        })()}

                        {/* NÚT HỦY GÓI LIỆU TRÌNH (XEM TRƯỚC HÓA ĐƠN HOÀN TIỀN) - DÀNH CHO GÓI TRẢ TRƯỚC 100% */}
                        {plan.trang_thai_thanh_toan !== 'da_hoan_tien' && plan.trang_thai !== 'hoan_thanh' && plan.trang_thai !== 'huy' && (plan.trang_thai_thanh_toan === 'da_thanh_toan' || (plan.da_thanh_toan && plan.tong_tien_thanh_toan && plan.da_thanh_toan >= plan.tong_tien_thanh_toan)) && (
                          <button
                            type="button"
                            onClick={() => setRefundPreviewPlan(plan)}
                            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>🧾 Hủy gói liệu trình</span>
                          </button>
                        )}

                        {/* NÚT IN SỔ THEO DÕI GÓI LIỆU TRÌNH */}
                        {!isCustomer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              printTreatmentPlan(selectedPatient, plan);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                            title="In sổ theo dõi & nhật ký chi tiết các buổi tập của gói này"
                          >
                            <Printer size={14} className="text-teal-600 dark:text-teal-400" />
                            <span>In Sổ Liệu Trình</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => togglePlanExpand(plan.id)}
                          className="p-2 rounded-xl bg-white dark:bg-zinc-800 border"
                        >
                          <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* NỘI DUNG SỔ CHI TIẾT GÓI */}
                    {isExpanded && (
                      <div className="p-5 space-y-5">
                        
                        {/* BẢNG ĐIỀU KHIỂN TIẾN TRÌNH & LƯỢNG GIÁ VAS GÓI LIỆU TRÌNH */}
                        <TreatmentPlanVasDashboard 
                          plan={plan}
                          patient={selectedPatient}
                        />

                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        )}

      {/* MODAL XEM TRƯỚC HÓA ĐƠN HOÀN TIỀN HỦY GÓI LIỆU TRÌNH */}
      {refundPreviewPlan && (() => {
        const netPaid = Number(refundPreviewPlan.tong_tien_thanh_toan || refundPreviewPlan.da_thanh_toan || refundPreviewPlan.gia_goc_goi || 0);
        const totalSessions = Number(refundPreviewPlan.tong_so_buoi) || 10;
        const usedSessions = Number(refundPreviewPlan.so_buoi_da_dung || (refundPreviewPlan as any).so_buoi_da_thuc_hien) || 0;
        const refundCalc = calculatePackageRefund({
          totalPaid: netPaid,
          packagePrice: netPaid,
          usedSessions,
          totalSessions,
          penaltyPercent: 10
        });

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                    <Printer size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-zinc-100 text-sm uppercase tracking-tight">Hóa Đơn Xem Trước Hoàn Tiền Hủy Gói</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mã gói: <span className="font-mono text-teal-600 font-bold">{refundPreviewPlan.ma_lich_dieu_tri || `PD-${refundPreviewPlan.id.substring(0, 6)}`}</span></p>
                  </div>
                </div>
                <button onClick={() => setRefundPreviewPlan(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  ✕
                </button>
              </div>

              {/* Bảng tính hoàn tiền dùng chung */}
              <PackageRefundBreakdown calculation={refundCalc} />

              <div className="p-4 bg-amber-50 dark:bg-amber-955/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black uppercase tracking-wider text-[10px] text-amber-800">Thông báo hỗ trợ tại quầy</p>
                  <p className="mt-0.5">Quý khách vui lòng liên hệ Lễ tân/Quản lý tại quầy trung tâm để làm thủ tục nhận lại tiền hoàn trả.</p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setRefundPreviewPlan(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* LIGHTBOX MODAL XEM ẢNH ĐÍNH KÈM */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 px-2">
              <span className="text-sm font-black text-zinc-100 flex items-center gap-2">
                <ImageIcon size={18} className="text-teal-400" />
                Ảnh / Phim chụp đính kèm ({selectedPatient?.ho_ten || 'Khách hàng'})
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="size-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center overflow-auto p-2">
              <img
                src={previewImage}
                alt="Ảnh đính kèm"
                className="max-h-[70vh] object-contain rounded-2xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
