import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';
import { Search, X, Sparkles } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

import { FilterSelect } from './components/FilterSelect';
import { FeedbackStatsHeader } from './components/FeedbackStatsHeader';
import { FeedbackDetailModal, Feedback } from './components/FeedbackDetailModal';
import { FeedbackTable } from './components/FeedbackTable';

interface AnalyzeResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  reason: string;
  suggestedAction: string;
  draftReply: string;
}

export default function ViewFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'service' | 'staff'>('service');
  const [isClient, setIsClient] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('Tất cả');
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('Tất cả');
  const [selectedStars, setSelectedStars] = useState<string>('Tất cả');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('Tất cả');
  const [selectedResponseStatus, setSelectedResponseStatus] = useState<string>('Tất cả');

  // Center Popup Modal State
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Confirm Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    type?: 'warning' | 'danger' | 'info' | 'success';
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // Multi-select & Actions
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/feedback');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setFeedbacks(list);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const submitReply = async (id: string, loai: 'service' | 'staff', phanHoi: string) => {
    if (!phanHoi.trim()) {
      toast.error('Nội dung phản hồi không được để trống.');
      return false;
    }
    try {
      setSubmittingReply(true);
      await api.post(`/admin/feedback/${loai}/${id}/reply`, { phanHoi, noi_dung_tra_loi: phanHoi });
      toast.success('Gửi phản hồi thành công!');
      fetchFeedback();
      if (selectedFeedback && selectedFeedback.id === id) {
        setSelectedFeedback({
          ...selectedFeedback,
          phan_hoi_nhan_xet: phanHoi,
          ngay_phan_hoi: new Date().toISOString(),
          ten_nguoi_phan_hoi: 'Quản trị viên OfficeCare'
        });
      }
      return true;
    } catch (error: any) {
      toast.error('Không thể gửi phản hồi.');
      return false;
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedFeedback) return;
    const ok = await submitReply(selectedFeedback.id, selectedFeedback.loai_danh_gia, replyText);
    if (ok) {
      setIsEditingReply(false);
      setReplyText('');
    }
  };

  const applyAnalysisResult = (id: string, result: AnalyzeResult) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? {
      ...f,
      cam_xuc: result.sentiment,
      do_tin_cay: result.confidence,
      ly_do_cam_xuc: result.reason,
      de_xuat_hanh_dong: result.suggestedAction,
      de_xuat_phan_hoi: result.draftReply
    } : f));
  };

  const handleAnalyzeOne = async (f: Feedback) => {
    if (analyzingId) return;
    setAnalyzingId(f.id);
    try {
      const res = await api.post(`/admin/feedback/${f.loai_danh_gia}/${f.id}/analyze`);
      const result = res.data.data as AnalyzeResult;
      applyAnalysisResult(f.id, result);
      
      if (selectedFeedback && selectedFeedback.id === f.id) {
        if (!replyText || isEditingReply) {
          setReplyText(result.draftReply || '');
        }
      }
      toast.success('Đã phân tích cảm xúc & gợi ý câu trả lời.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể phân tích đánh giá lúc này.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleRegenerateAIDraft = async (f: Feedback) => {
    if (analyzingId) return;
    setAnalyzingId(f.id);
    try {
      const res = await api.post(`/admin/feedback/${f.loai_danh_gia}/${f.id}/analyze`);
      const result = res.data.data as AnalyzeResult;
      applyAnalysisResult(f.id, result);
      setReplyText(result.draftReply || '');
      toast.success('Đã soạn thảo một mẫu phản hồi mới!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo phản hồi mới lúc này.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleBulkApprove = (ready: Feedback[]) => {
    if (ready.length === 0 || submittingReply) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận gửi phản hồi hàng loạt',
      type: 'info',
      confirmLabel: `Gửi ngay ${ready.length} phản hồi`,
      message: (
        <div className="space-y-3 text-left">
          <p className="text-sm text-slate-700 dark:text-zinc-200 font-medium">
            Hệ thống đã tự động lọc <b>{ready.length}</b> đánh giá <span className="text-amber-600 dark:text-amber-400 font-bold">chưa phản hồi</span> để gửi câu trả lời gợi ý của AI:
          </p>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-zinc-800">
            {ready.map((f, i) => (
              <div key={f.id} className="pt-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-zinc-100">
                  <span>{i + 1}. {f.ten_khach_hang || 'Khách hàng'}</span>
                  <span className="text-teal-600 dark:text-teal-400 text-[11px] font-semibold">
                    {f.cam_xuc === 'POSITIVE' ? '😊 Tích cực' : f.cam_xuc === 'NEGATIVE' ? '🙁 Tiêu cực' : '😐 Trung tính'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 italic text-[11px] mt-0.5 line-clamp-2">
                  "{f.de_xuat_phan_hoi}"
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Hành động này sẽ cập nhật trực tiếp nội dung phản hồi chính thức từ trung tâm OfficeCare cho các khách hàng trên.
          </p>
        </div>
      ),
      onConfirm: async () => {
        setConfirmConfig(null);
        setSubmittingReply(true);
        let successCount = 0;
        for (const f of ready) {
          try {
            await api.post(`/admin/feedback/${f.loai_danh_gia}/${f.id}/reply`, {
              phanHoi: f.de_xuat_phan_hoi,
              noi_dung_tra_loi: f.de_xuat_phan_hoi
            });
            successCount++;
          } catch (error) {
            console.error('Lỗi gửi phản hồi hàng loạt:', error);
          }
        }
        setSubmittingReply(false);

        if (successCount === ready.length) {
          toast.success(`Đã gửi ${successCount} phản hồi thành công!`);
        } else {
          toast.error(`Chỉ gửi thành công ${successCount}/${ready.length} phản hồi.`);
        }
        fetchFeedback();
      }
    });
  };

  const handleOpenDetail = (f: Feedback) => {
    setSelectedFeedback(f);
    setReplyText(f.phan_hoi_nhan_xet || f.de_xuat_phan_hoi || '');
    setIsEditingReply(!f.phan_hoi_nhan_xet);
  };

  const uniqueServices = useMemo(() => {
    const services = feedbacks
      .filter(f => f.so_sao_tong !== null && f.ten_dich_vu)
      .map(f => f.ten_dich_vu);
    return ['Tất cả', ...Array.from(new Set(services))];
  }, [feedbacks]);

  const uniqueSpecialists = useMemo(() => {
    const specialists = feedbacks
      .filter(f => f.so_sao_ktv !== null && f.ten_ky_thuat_vien && f.ten_ky_thuat_vien !== '-')
      .map(f => f.ten_ky_thuat_vien);
    return ['Tất cả', ...Array.from(new Set(specialists))];
  }, [feedbacks]);

  const allServiceFeedbacks = useMemo(() => feedbacks.filter(f => f.so_sao_tong !== null), [feedbacks]);
  const allStaffFeedbacks = useMemo(() => feedbacks.filter(f => f.so_sao_ktv !== null), [feedbacks]);
  const activeAllFeedbacks = activeTab === 'service' ? allServiceFeedbacks : allStaffFeedbacks;

  const filteredFeedbacks = useMemo(() => {
    return activeAllFeedbacks.filter(f => {
      const rating = activeTab === 'service' ? f.so_sao_tong : f.so_sao_ktv;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = f.ten_khach_hang?.toLowerCase().includes(query);
        const matchComment = f.nhan_xet?.toLowerCase().includes(query);
        const matchTarget = activeTab === 'service'
          ? f.ten_dich_vu?.toLowerCase().includes(query)
          : f.ten_ky_thuat_vien?.toLowerCase().includes(query);
        if (!matchName && !matchComment && !matchTarget) return false;
      }

      if (activeTab === 'service') {
        if (selectedService !== 'Tất cả' && f.ten_dich_vu !== selectedService) return false;
      } else {
        if (selectedSpecialist !== 'Tất cả' && f.ten_ky_thuat_vien !== selectedSpecialist) return false;
      }

      if (selectedStars !== 'Tất cả' && rating !== Number(selectedStars)) return false;
      if (selectedSentiment !== 'Tất cả' && f.cam_xuc !== selectedSentiment) return false;
      if (selectedResponseStatus === 'pending' && f.phan_hoi_nhan_xet) return false;
      if (selectedResponseStatus === 'replied' && !f.phan_hoi_nhan_xet) return false;

      return true;
    });
  }, [activeAllFeedbacks, activeTab, searchQuery, selectedService, selectedSpecialist, selectedStars, selectedSentiment, selectedResponseStatus]);

  const allUnrepliedFeedbacks = useMemo(() => {
    return filteredFeedbacks.filter(f => !f.phan_hoi_nhan_xet && f.de_xuat_phan_hoi);
  }, [filteredFeedbacks]);

  const serviceStats = useMemo(() => {
    if (allServiceFeedbacks.length === 0) return { avg: 5.0, count: 0 };
    const sum = allServiceFeedbacks.reduce((acc, f) => acc + (f.so_sao_tong || 0), 0);
    return {
      avg: Number((sum / allServiceFeedbacks.length).toFixed(1)),
      count: allServiceFeedbacks.length
    };
  }, [allServiceFeedbacks]);

  const staffStats = useMemo(() => {
    if (allStaffFeedbacks.length === 0) return { avg: 5.0, count: 0 };
    const sum = allStaffFeedbacks.reduce((acc, f) => acc + (f.so_sao_ktv || 0), 0);
    return {
      avg: Number((sum / allStaffFeedbacks.length).toFixed(1)),
      count: allStaffFeedbacks.length
    };
  }, [allStaffFeedbacks]);

  const currentTabStats = activeTab === 'service' ? serviceStats : staffStats;

  const sentimentBreakdown = useMemo(() => {
    const total = activeAllFeedbacks.length;
    const positive = activeAllFeedbacks.filter(f => f.cam_xuc === 'POSITIVE').length;
    const negative = activeAllFeedbacks.filter(f => f.cam_xuc === 'NEGATIVE').length;
    const neutral = activeAllFeedbacks.filter(f => f.cam_xuc === 'NEUTRAL').length;
    const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;
    const negativePct = total > 0 ? Math.round((negative / total) * 100) : 0;
    return { total, positive, negative, neutral, positivePct, negativePct };
  }, [activeAllFeedbacks]);

  const responseRate = useMemo(() => {
    const total = activeAllFeedbacks.length;
    const replied = activeAllFeedbacks.filter(f => f.phan_hoi_nhan_xet).length;
    return { total, replied, pct: total > 0 ? Math.round((replied / total) * 100) : 0 };
  }, [activeAllFeedbacks]);

  const hasActiveFilters = searchQuery !== '' ||
    selectedService !== 'Tất cả' ||
    selectedSpecialist !== 'Tất cả' ||
    selectedStars !== 'Tất cả' ||
    selectedSentiment !== 'Tất cả' ||
    selectedResponseStatus !== 'Tất cả';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedService('Tất cả');
    setSelectedSpecialist('Tất cả');
    setSelectedStars('Tất cả');
    setSelectedSentiment('Tất cả');
    setSelectedResponseStatus('Tất cả');
  };

  const formatDate = (isoString: string) => {
    if (!isClient) return '';
    const d = new Date(isoString);
    return `${d.toLocaleDateString('vi-VN')} · ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatDateShort = (isoString: string) => {
    if (!isClient) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-5 pb-12 font-sans text-slate-800 dark:text-zinc-100">
      {/* 1. SUMMARY BAR */}
      <FeedbackStatsHeader
        currentTabStats={currentTabStats}
        sentimentBreakdown={sentimentBreakdown}
        responseRate={responseRate}
      />

      {/* 2. SEGMENTED CONTROL TABS */}
      <div className="w-full bg-slate-100/90 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800 shadow-inner grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('service')}
          className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'service'
              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-md shadow-teal-600/10'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
        >
          <span>Đánh giá dịch vụ</span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
            activeTab === 'service'
              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
              : 'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400'
          }`}>
            {serviceStats.count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-md shadow-teal-600/10'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
        >
          <span>Kỹ thuật viên & Chuyên viên</span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
            activeTab === 'staff'
              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
              : 'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400'
          }`}>
            {staffStats.count}
          </span>
        </button>
      </div>

      {/* 3. FILTER TOOLBAR */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm khách hàng, chuyên viên hoặc dịch vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-all shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'service' ? (
            <FilterSelect
              label="Tất cả dịch vụ"
              value={selectedService}
              options={uniqueServices.map(svc => ({ value: svc, label: svc }))}
              onChange={setSelectedService}
              align="left"
            />
          ) : (
            <FilterSelect
              label="Tất cả nhân sự"
              value={selectedSpecialist}
              options={uniqueSpecialists.map(spec => ({ value: spec, label: spec }))}
              onChange={setSelectedSpecialist}
              align="left"
            />
          )}

          <FilterSelect
            label="Tất cả sao"
            value={selectedStars}
            options={[
              { value: 'Tất cả', label: 'Tất cả sao' },
              { value: '5', label: '5 sao (★★★★★)', icon: '⭐' },
              { value: '4', label: '4 sao (★★★★☆)', icon: '⭐' },
              { value: '3', label: '3 sao (★★★☆☆)', icon: '⭐' },
              { value: '2', label: '2 sao (★★☆☆☆)', icon: '⭐' },
              { value: '1', label: '1 sao (★☆☆☆☆)', icon: '⭐' },
            ]}
            onChange={setSelectedStars}
            align="left"
          />

          <FilterSelect
            label="Cảm xúc"
            value={selectedSentiment}
            options={[
              { value: 'Tất cả', label: 'Tất cả cảm xúc' },
              { value: 'POSITIVE', label: 'Tích cực', icon: '😊' },
              { value: 'NEUTRAL', label: 'Trung tính', icon: '😐' },
              { value: 'NEGATIVE', label: 'Tiêu cực', icon: '🙁' },
            ]}
            onChange={setSelectedSentiment}
            align="right"
          />

          <FilterSelect
            label="Trạng thái"
            value={selectedResponseStatus}
            options={[
              { value: 'Tất cả', label: 'Tất cả trạng thái' },
              { value: 'pending', label: 'Chưa phản hồi', icon: '⏳' },
              { value: 'replied', label: 'Đã phản hồi', icon: '✅' },
            ]}
            onChange={setSelectedResponseStatus}
            align="right"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X size={13} />
              <span>Đặt lại</span>
            </button>
          )}

          {/* Nút phản hồi hàng loạt chuyên dụng */}
          <button
            type="button"
            disabled={allUnrepliedFeedbacks.length === 0 || submittingReply}
            onClick={() => handleBulkApprove(allUnrepliedFeedbacks)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap ${
              allUnrepliedFeedbacks.length > 0
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-600/20 active:scale-95 cursor-pointer'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed opacity-75'
            }`}
            title={
              allUnrepliedFeedbacks.length > 0
                ? `Bấm để gửi phản hồi tự động cho ${allUnrepliedFeedbacks.length} đánh giá chưa trả lời (đã có nội dung soạn sẵn)`
                : 'Tất cả đánh giá hiện tại đều đã được phản hồi'
            }
          >
            <Sparkles size={14} className={allUnrepliedFeedbacks.length > 0 ? 'text-amber-300 animate-pulse' : ''} />
            <span>
              {allUnrepliedFeedbacks.length > 0
                ? `Phản hồi hàng loạt (${allUnrepliedFeedbacks.length})`
                : 'Đã phản hồi tất cả'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. FEEDBACK TABLE */}
      <FeedbackTable
        loading={loading}
        filteredFeedbacks={filteredFeedbacks}
        onOpenDetail={handleOpenDetail}
        analyzingId={analyzingId}
        handleAnalyzeOne={handleAnalyzeOne}
        formatDateShort={formatDateShort}
      />

      {/* 5. FEEDBACK DETAIL & AI REPLY MODAL */}
      <FeedbackDetailModal
        selectedFeedback={selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        replyText={replyText}
        setReplyText={setReplyText}
        isEditingReply={isEditingReply}
        setIsEditingReply={setIsEditingReply}
        submittingReply={submittingReply}
        analyzingId={analyzingId}
        handleRegenerateAIDraft={handleRegenerateAIDraft}
        handleSendReply={handleSendReply}
        formatDate={formatDate}
      />

      {/* 6. CONFIRM DIALOG */}
      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type || 'info'}
          confirmLabel={confirmConfig.confirmLabel || 'Xác nhận'}
          cancelLabel="Hủy bỏ"
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}
