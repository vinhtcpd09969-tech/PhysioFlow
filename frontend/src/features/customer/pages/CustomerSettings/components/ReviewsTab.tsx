import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ReviewCard, PendingReviewCard } from './ReviewCards';

interface ReviewsTabProps {
  reviewsLoading: boolean;
  serviceReviews: any[];
  staffReviews: any[];
  pendingServiceReviews: any[];
  pendingStaffReviews: any[];
  onRefresh: () => void;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({
  reviewsLoading,
  serviceReviews,
  staffReviews,
  pendingServiceReviews,
  pendingStaffReviews,
  onRefresh,
}) => {
  const [reviewFilterTab, setReviewFilterTab] = useState<'service' | 'staff'>('service');

  if (reviewsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-3xl">
        <Loader2 className="animate-spin text-teal-600 mb-3" size={24} />
        <p className="text-xs font-bold text-slate-400">Đang tải danh sách đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-5">
        {/* Category Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setReviewFilterTab('service')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              reviewFilterTab === 'service'
                ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-sm scale-[1.01]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>📦 Đánh giá dịch vụ</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                reviewFilterTab === 'service'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                  : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
              }`}
            >
              {serviceReviews.length}
            </span>
            {pendingServiceReviews.length > 0 && (
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" title="Có ca chờ đánh giá" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setReviewFilterTab('staff')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              reviewFilterTab === 'staff'
                ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-sm scale-[1.01]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>🩺 Kỹ thuật viên &amp; Chuyên viên</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                reviewFilterTab === 'staff'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                  : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
              }`}
            >
              {staffReviews.length}
            </span>
            {pendingStaffReviews.length > 0 && (
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" title="Có ca chờ đánh giá" />
            )}
          </button>
        </div>

        {/* Tab 1: Service Reviews */}
        {reviewFilterTab === 'service' && (
          <div className="space-y-4">
            {pendingServiceReviews.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 px-1 flex items-center gap-1.5">
                  ⚡ Ca dịch vụ vừa hoàn thành cần bạn đánh giá:
                </h4>
                {pendingServiceReviews.map((p) => (
                  <PendingReviewCard
                    key={p.goi_dich_vu_id}
                    title={p.service_name}
                    avatar={p.service_avatar}
                    cuocHenId={p.cuoc_hen_id}
                    type="service"
                    onSubmitted={onRefresh}
                  />
                ))}
              </div>
            )}

            {serviceReviews.length === 0 && pendingServiceReviews.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-3xl text-xs font-semibold text-slate-400 italic">
                Bạn chưa có đánh giá nào cho chất lượng dịch vụ.
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {serviceReviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    id={rev.id}
                    title={rev.service_name}
                    avatar={rev.service_avatar}
                    rating={rev.rating}
                    comment={rev.comment || ''}
                    reply={rev.reply}
                    date={rev.date}
                    type="service"
                    onUpdated={onRefresh}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Staff Reviews */}
        {reviewFilterTab === 'staff' && (
          <div className="space-y-4">
            {pendingStaffReviews.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 px-1 flex items-center gap-1.5">
                  ⚡ Nhân sự vừa phục vụ bạn cần đánh giá:
                </h4>
                {pendingStaffReviews.map((p) => (
                  <PendingReviewCard
                    key={p.nhan_su_id}
                    title={p.staff_name}
                    avatar={p.staff_avatar}
                    cuocHenId={p.cuoc_hen_id}
                    type="staff"
                    onSubmitted={onRefresh}
                  />
                ))}
              </div>
            )}

            {staffReviews.length === 0 && pendingStaffReviews.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-3xl text-xs font-semibold text-slate-400 italic">
                Bạn chưa có đánh giá nào cho nhân sự phục vụ.
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {staffReviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    id={rev.id}
                    title={rev.staff_name}
                    avatar={rev.staff_avatar}
                    rating={rev.rating}
                    comment={rev.comment || ''}
                    reply={rev.reply}
                    date={rev.date}
                    type="staff"
                    onUpdated={onRefresh}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
