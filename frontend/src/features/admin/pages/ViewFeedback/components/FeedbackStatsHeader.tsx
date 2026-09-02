import { MessageSquare, Star, CheckCircle2 } from 'lucide-react';

interface FeedbackStatsHeaderProps {
  currentTabStats: { avg: number; count: number };
  sentimentBreakdown: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    positivePct: number;
    negativePct: number;
  };
  responseRate: {
    total: number;
    replied: number;
    pct: number;
  };
}

export function FeedbackStatsHeader({
  currentTabStats,
  sentimentBreakdown,
  responseRate
}: FeedbackStatsHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-teal-900/5 via-emerald-900/5 to-cyan-900/5 dark:from-teal-950/30 dark:to-zinc-900/50 backdrop-blur-xl border border-teal-500/15 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      {/* Left KPI Highlights */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-7 text-xs">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
            <MessageSquare size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Tổng Đánh Giá</span>
            <span className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">{currentTabStats.count} <span className="text-xs font-semibold text-slate-400">lượt</span></span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200/80 dark:bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-inner">
            <Star size={20} className="fill-amber-400 stroke-none" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Điểm Trung Bình</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{currentTabStats.avg}</span>
              <span className="text-xs font-bold text-slate-400">/ 5.0 ★</span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200/80 dark:bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner text-xl">
            😊
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Tích Cực</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{sentimentBreakdown.positivePct}% <span className="text-xs font-semibold text-slate-400">({sentimentBreakdown.positive} ca)</span></span>
          </div>
        </div>

        {sentimentBreakdown.negative > 0 && (
          <>
            <div className="h-8 w-px bg-slate-200/80 dark:bg-zinc-800 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner text-xl animate-pulse">
                🙁
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">Cần Ưu Tiên</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{sentimentBreakdown.negative} <span className="text-xs font-semibold text-rose-400">ca tiêu cực</span></span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Response Progress Metric */}
      <div className="bg-white/80 dark:bg-zinc-900/80 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800 shadow-xs min-w-[220px]">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
            <CheckCircle2 size={13} className="text-teal-600" /> Tiến độ xử lý
          </span>
          <span className="text-teal-700 dark:text-teal-400 font-black text-sm">{responseRate.pct}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${responseRate.pct}%` }}
          />
        </div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1.5 text-right">
          Đã tương tác {responseRate.replied} / {responseRate.total} đánh giá
        </p>
      </div>
    </div>
  );
}
