import { Star, X } from 'lucide-react';

interface PendingRatingBannerProps {
  pendingRatingAppts: any[];
  hideReviewBanner: boolean;
  onDismiss: () => void;
  onOpenRating: (app: any) => void;
}

export function PendingRatingBanner({
  pendingRatingAppts,
  hideReviewBanner,
  onDismiss,
  onOpenRating
}: PendingRatingBannerProps) {
  if (hideReviewBanner || !pendingRatingAppts || pendingRatingAppts.length === 0) return null;

  const app = pendingRatingAppts[0];

  return (
    <div className="relative bg-gradient-to-r from-amber-50/90 via-orange-50/90 to-yellow-50/90 border border-amber-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 animate-in slide-in-from-top-3 duration-300">
      <div className="flex items-start gap-3 min-w-0 flex-1 pr-6 sm:pr-0">
        <div className="size-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
          <Star className="fill-amber-500 text-amber-500" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-xs text-slate-800 leading-tight flex items-center gap-1.5">
            🔔 Góp ý chất lượng y khoa
          </h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
            Bạn vừa hoàn thành trị liệu <strong>{app.ten_dich_vu}</strong>{app.ten_bac_si ? ` cùng chuyên viên/KTV ${app.ten_bac_si}` : ''}. Hãy dành 1 phút đóng góp ý kiến nhé!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => onOpenRating(app)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
        >
          Đánh giá ngay
        </button>

        <button
          type="button"
          title="Tắt thông báo này"
          onClick={onDismiss}
          className="p-1.5 text-amber-700/60 hover:text-amber-900 hover:bg-amber-100/70 rounded-lg transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
