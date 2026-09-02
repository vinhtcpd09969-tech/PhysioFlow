import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  X,
  MessageSquare,
  Award,
  Edit3,
  Quote,
  Clock,
  RefreshCw
} from 'lucide-react';
import { censorText } from '../../../../../utils/profanity';

export interface Feedback {
  id: string;
  ten_khach_hang: string;
  ten_ky_thuat_vien: string;
  vai_tro_nhan_su?: string | null;
  ma_vai_tro_nhan_su?: string | null;
  ten_dich_vu: string;
  so_sao_tong: number | null;
  so_sao_ktv: number | null;
  nhan_xet: string;
  hieu_qua_dieu_tri?: string;
  thoi_gian_danh_gia: string;
  phan_hoi_nhan_xet: string | null;
  ten_nguoi_phan_hoi: string | null;
  ngay_phan_hoi: string | null;
  loai_danh_gia: 'service' | 'staff';
  cam_xuc: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | null;
  do_tin_cay: number | null;
  ly_do_cam_xuc: string | null;
  de_xuat_hanh_dong: string | null;
  de_xuat_phan_hoi: string | null;
}

export const getStaffRoleLabel = (feedback: Feedback) => {
  if (feedback.loai_danh_gia === 'service') return 'Dịch vụ đã thực hiện';
  if (feedback.ma_vai_tro_nhan_su === 'bac_si' || feedback.ma_vai_tro_nhan_su === 'chuyen_vien') {
    return 'Chuyên viên tư vấn';
  }
  if (feedback.vai_tro_nhan_su) {
    return feedback.vai_tro_nhan_su;
  }
  return 'Kỹ thuật viên';
};

interface FeedbackDetailModalProps {
  selectedFeedback: Feedback | null;
  onClose: () => void;
  replyText: string;
  setReplyText: (text: string) => void;
  isEditingReply: boolean;
  setIsEditingReply: (editing: boolean) => void;
  submittingReply: boolean;
  analyzingId: string | null;
  handleRegenerateAIDraft: (f: Feedback) => void;
  handleSendReply: () => void;
  formatDate: (isoString: string) => string;
}

export function FeedbackDetailModal({
  selectedFeedback,
  onClose,
  replyText,
  setReplyText,
  isEditingReply,
  setIsEditingReply,
  submittingReply,
  analyzingId,
  handleRegenerateAIDraft,
  handleSendReply,
  formatDate
}: FeedbackDetailModalProps) {
  if (!selectedFeedback) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Dialog Content (Center Popup) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden z-10 my-8 flex flex-col font-sans"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-teal-900/5 to-transparent flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
                {selectedFeedback.ten_khach_hang ? selectedFeedback.ten_khach_hang.charAt(0).toUpperCase() : 'K'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-zinc-100 font-jakarta">
                    {selectedFeedback.ten_khach_hang || 'Khách hàng'}
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50">
                    {selectedFeedback.loai_danh_gia === 'service' ? 'Đánh giá dịch vụ' : 'Đánh giá nhân sự'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                  <Clock size={13} /> {formatDate(selectedFeedback.thoi_gian_danh_gia)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-xs font-sans">
            {/* Banner Overview */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-500/5 via-emerald-500/5 to-slate-50 dark:from-teal-950/40 dark:to-zinc-950/60 rounded-3xl border border-teal-500/20 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex items-baseline gap-1 bg-amber-500/10 dark:bg-amber-950/40 px-3.5 py-2 rounded-2xl border border-amber-500/20 shrink-0">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                    {((selectedFeedback.loai_danh_gia === 'service' ? selectedFeedback.so_sao_tong : selectedFeedback.so_sao_ktv) || 0)}.0
                  </span>
                  <span className="text-xs font-bold text-amber-600/70">/ 5★</span>
                </div>
                <div>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const val = (selectedFeedback.loai_danh_gia === 'service' ? selectedFeedback.so_sao_tong : selectedFeedback.so_sao_ktv) || 0;
                      return (
                        <Star
                          key={i}
                          size={16}
                          className={i < val ? 'fill-amber-400 stroke-none' : 'text-slate-200 dark:text-zinc-700 fill-slate-200 dark:fill-zinc-700 stroke-none'}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 block mt-0.5">
                    Đánh giá của khách hàng
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <Award size={18} className="text-teal-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                    {selectedFeedback.loai_danh_gia === 'service'
                      ? 'Dịch vụ đã thực hiện'
                      : getStaffRoleLabel(selectedFeedback)}
                  </span>
                  <span className="font-extrabold text-xs text-teal-800 dark:text-teal-300 block">
                    {selectedFeedback.loai_danh_gia === 'service'
                      ? selectedFeedback.ten_dich_vu
                      : selectedFeedback.ten_ky_thuat_vien}
                  </span>
                </div>
              </div>
            </div>

            {/* Content & Sentiment */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2 font-jakarta">
                <MessageSquare size={14} className="text-teal-600" />
                <span>Nội dung nhận xét</span>
              </h4>

              <div className="p-5 bg-slate-50/80 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800 rounded-3xl space-y-4 shadow-2xs">
                <div className="relative">
                  <Quote size={24} className="text-teal-600/20 absolute top-0 right-0 pointer-events-none" />
                  <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-zinc-100 italic pr-8 font-sans">
                    {selectedFeedback.nhan_xet?.trim() ? (
                      `"${censorText(selectedFeedback.nhan_xet)}"`
                    ) : (
                      <span className="not-italic text-slate-400">Khách hàng không để lại nhận xét chi tiết bằng văn bản.</span>
                    )}
                  </p>
                </div>

                {selectedFeedback.cam_xuc && (
                  <div className="pt-4 border-t border-slate-200/60 dark:border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedFeedback.cam_xuc === 'POSITIVE' ? (
                          <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            <span className="text-base leading-none">😊</span>
                            <span>Cảm xúc: TÍCH CỰC</span>
                          </div>
                        ) : selectedFeedback.cam_xuc === 'NEGATIVE' ? (
                          <div className="flex items-center gap-2 text-xs font-black text-rose-800 dark:text-rose-200 bg-rose-500/10 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-500/20">
                            <span className="text-base leading-none">🙁</span>
                            <span>Cảm xúc: TIÊU CỰC</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-zinc-200 bg-amber-500/10 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-amber-500/20">
                            <span className="text-base leading-none">😐</span>
                            <span>Cảm xúc: TRUNG TÍNH</span>
                          </div>
                        )}
                      </div>

                      {selectedFeedback.do_tin_cay && (
                        <span className="text-xs font-bold text-slate-400">
                          Độ tin cậy: <b className="text-teal-600 dark:text-teal-400">{Math.round(selectedFeedback.do_tin_cay * 100)}%</b>
                        </span>
                      )}
                    </div>

                    {selectedFeedback.ly_do_cam_xuc && (
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                        {selectedFeedback.ly_do_cam_xuc}
                      </p>
                    )}

                    {selectedFeedback.de_xuat_hanh_dong && (
                      <div className="pt-2.5 border-t border-slate-200/40 dark:border-zinc-800/60">
                        <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
                          💡 Khuyến nghị xử lý
                        </span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {selectedFeedback.de_xuat_hanh_dong}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Response Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2 font-jakarta">
                  <Send size={14} className="text-teal-600" />
                  <span>Phản hồi từ Trung tâm OfficeCare</span>
                </h4>

                {selectedFeedback.phan_hoi_nhan_xet && !isEditingReply && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingReply(true);
                      setReplyText(selectedFeedback.phan_hoi_nhan_xet || '');
                    }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Chỉnh sửa phản hồi</span>
                  </button>
                )}
              </div>

              {selectedFeedback.phan_hoi_nhan_xet && !isEditingReply ? (
                <div className="p-4 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/60 rounded-3xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-teal-600" />
                      {selectedFeedback.ten_nguoi_phan_hoi || 'Quản trị viên OfficeCare'}
                    </span>
                    {selectedFeedback.ngay_phan_hoi && (
                      <span className="font-medium text-[11px]">{formatDate(selectedFeedback.ngay_phan_hoi)}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-200 leading-relaxed font-medium pt-1 italic font-sans">
                    "{selectedFeedback.phan_hoi_nhan_xet}"
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập nội dung phản hồi y khoa gửi tới khách hàng..."
                    className="w-full p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 leading-relaxed shadow-inner font-sans"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedFeedback.de_xuat_phan_hoi && replyText !== selectedFeedback.de_xuat_phan_hoi && (
                      <button
                        type="button"
                        onClick={() => setReplyText(selectedFeedback.de_xuat_phan_hoi || '')}
                        className="px-3.5 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-teal-200/50"
                      >
                        <Sparkles size={13} className="text-teal-600" />
                        <span>Dùng câu trả lời gợi ý</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRegenerateAIDraft(selectedFeedback)}
                      disabled={analyzingId === selectedFeedback.id}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200/60 dark:border-zinc-700 disabled:opacity-50"
                    >
                      {analyzingId === selectedFeedback.id ? (
                        <Loader2 size={13} className="animate-spin text-teal-600" />
                      ) : (
                        <RefreshCw size={13} className="text-teal-600" />
                      )}
                      <span>Gợi ý phản hồi khác</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          {(!selectedFeedback.phan_hoi_nhan_xet || isEditingReply) && (
            <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 flex items-center justify-between gap-3">
              {isEditingReply && selectedFeedback.phan_hoi_nhan_xet ? (
                <button
                  type="button"
                  onClick={() => setIsEditingReply(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
                >
                  Hủy chỉnh sửa
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleSendReply}
                disabled={submittingReply || !replyText.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {submittingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{selectedFeedback.phan_hoi_nhan_xet ? 'Cập nhật phản hồi' : 'Gửi phản hồi cho khách'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
