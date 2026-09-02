import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface AppointmentRatingModalProps {
  ratingApptId: string | null;
  activeAppt: any | null;
  ratingStarsService: number;
  setRatingStarsService: (stars: number) => void;
  ratingCommentService: string;
  setRatingCommentService: (val: string) => void;
  ratingStarsStaff: number;
  setRatingStarsStaff: (stars: number) => void;
  ratingCommentStaff: string;
  setRatingCommentStaff: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function AppointmentRatingModal({
  ratingApptId,
  activeAppt,
  ratingStarsService,
  setRatingStarsService,
  ratingCommentService,
  setRatingCommentService,
  ratingStarsStaff,
  setRatingStarsStaff,
  ratingCommentStaff,
  setRatingCommentStaff,
  onClose,
  onSubmit
}: AppointmentRatingModalProps) {
  if (!ratingApptId) return null;

  const isPackage = activeAppt?.loai_goi === 'LIEU_TRINH';
  const isPackageFinished = activeAppt?.phac_do_status === 'hoan_thanh' || activeAppt?.phac_do_status === 'huy';
  const canRateService = !isPackage || isPackageFinished;
  const hasExistingServiceReview = !!activeAppt?.rating_service_id;
  const hasExistingStaffReview = !!activeAppt?.rating_staff_id;
  const isEditingAny = hasExistingServiceReview || hasExistingStaffReview;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white text-slate-800 rounded-[32px] border border-slate-100 max-w-lg w-full p-6 md:p-8 shadow-2xl relative z-10 font-jakarta max-h-[90vh] overflow-y-auto space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-13 h-13 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-xs">
              <Star size={26} fill="currentColor" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">
              {isEditingAny ? 'Sửa đánh giá trị liệu' : 'Đánh giá trị liệu'}
            </h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed px-2">
              {isEditingAny
                ? 'Bạn đã đánh giá mục này trước đó — nội dung bên dưới là đánh giá cũ, chỉnh sửa rồi gửi lại để cập nhật.'
                : 'Ý kiến đóng góp khách quan của bạn giúp chúng tôi liên tục cải tiến chất lượng phác đồ và phục vụ tốt hơn.'}
            </p>
          </div>

          <div className="space-y-6 divide-y divide-slate-100">
            {/* 1. SERVICE QUALITY RATING */}
            <div className="space-y-4 pt-4 first:pt-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider text-left">
                  1. Chất lượng Dịch vụ ({activeAppt?.ten_dich_vu || 'Khám Lâm Sàng & Lượng Giá'})
                </h4>
                {hasExistingServiceReview && (
                  <span className="text-[9px] bg-teal-50 text-teal-600 font-black px-2.5 py-0.5 rounded-full uppercase border border-teal-100">
                    Đã đánh giá — đang sửa
                  </span>
                )}
                {!canRateService && (
                  <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2.5 py-0.5 rounded-full uppercase">
                    Khóa
                  </span>
                )}
              </div>

              {!canRateService ? (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 text-center space-y-2">
                  <div className="flex justify-center gap-1 opacity-40">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={20} className="text-zinc-300 fill-zinc-200" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-extrabold leading-normal">
                    🔒 Bạn có thể đánh giá gói liệu trình này khi hoàn thành toàn bộ lộ trình trị liệu.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center items-center gap-2 bg-amber-50/50 py-2.5 px-4 rounded-2xl border border-amber-100/60 w-fit mx-auto">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStarsService(star)}
                        className="p-1 hover:scale-110 active:scale-95 transition-all text-amber-400 cursor-pointer"
                      >
                        <Star
                          size={28}
                          fill={star <= ratingStarsService ? "#FF9F1C" : "none"}
                          stroke={star <= ratingStarsService ? "#FF9F1C" : "currentColor"}
                          className="stroke-[1.5]"
                        />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label htmlFor="nhanXetService" className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">
                      Nhận xét về gói dịch vụ
                    </label>
                    <textarea
                      id="nhanXetService"
                      rows={3}
                      value={ratingCommentService}
                      onChange={(e) => setRatingCommentService(e.target.value)}
                      placeholder="Bạn có hài lòng về quy trình trị liệu, hiệu quả dịch vụ, cơ sở vật chất và trang thiết bị không? Hãy chia sẻ trải nghiệm của bạn..."
                      className="w-full bg-slate-50/70 border border-slate-200/80 focus:border-[#14B8A6] focus:bg-white focus:ring-4 focus:ring-[#14B8A6]/10 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed resize-none outline-none text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-normal min-h-[96px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. STAFF QUALITY RATING */}
            <div className="space-y-4 pt-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider text-left">
                  2. Kỹ thuật viên / Chuyên viên ({activeAppt?.ten_ky_thuat_vien || 'Phụ trách'})
                </h4>
                {hasExistingStaffReview && (
                  <span className="text-[9px] bg-teal-50 text-teal-600 font-black px-2.5 py-0.5 rounded-full uppercase border border-teal-100 shrink-0">
                    Đã đánh giá — đang sửa
                  </span>
                )}
              </div>

              <div className="flex justify-center items-center gap-2 bg-amber-50/50 py-2.5 px-4 rounded-2xl border border-amber-100/60 w-fit mx-auto">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStarsStaff(star)}
                    className="p-1 hover:scale-110 active:scale-95 transition-all text-amber-400 cursor-pointer"
                  >
                    <Star
                      size={28}
                      fill={star <= ratingStarsStaff ? "#FF9F1C" : "none"}
                      stroke={star <= ratingStarsStaff ? "#FF9F1C" : "currentColor"}
                      className="stroke-[1.5]"
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="nhanXetStaff" className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">
                  Nhận xét về KTV / Chuyên viên
                </label>
                <textarea
                  id="nhanXetStaff"
                  rows={3}
                  value={ratingCommentStaff}
                  onChange={(e) => setRatingCommentStaff(e.target.value)}
                  placeholder="Bạn có hài lòng về nhân sự khi làm việc không? Thái độ phục vụ, tay nghề chuyên môn của chuyên viên / KTV như thế nào..."
                  className="w-full bg-slate-50/70 border border-slate-200/80 focus:border-[#14B8A6] focus:bg-white focus:ring-4 focus:ring-[#14B8A6]/10 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed resize-none outline-none text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-normal min-h-[96px]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={onSubmit}
              className="bg-[#FF9F1C] hover:bg-[#e88f13] text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center"
            >
              {isEditingAny ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-2xl border border-slate-200/60 transition-all cursor-pointer flex items-center justify-center"
            >
              Hủy bỏ
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
