import { formatCurrency } from '../../../../../utils/format';
import { TrendingUp, CheckCircle2, AlertCircle, Receipt } from 'lucide-react';

interface FinanceKpis {
  totalCollected: number;
  paidInvoiceCount: number;
  totalPackageRevenue?: number;
  packageInvoiceCount?: number;
  totalRefunded: number;
  refundCount: number;
  totalInvoices: number;
  fullyPaidPercent: number;
  pendingAmount?: number;
}

interface FinanceKpiCardsProps {
  kpis: FinanceKpis;
}

export function FinanceKpiCards({ kpis }: FinanceKpiCardsProps) {
  const pendingVal = kpis.pendingAmount || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-jakarta">
      {/* 1) TỔNG HÓA ĐƠN */}
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 border border-purple-200 dark:border-purple-800/60 shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 transition-all flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-purple-500" />
            TỔNG HÓA ĐƠN
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 dark:bg-purple-955/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
            <Receipt size={11} /> Hồ sơ
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
            {kpis.totalInvoices || 0} <span className="text-sm font-extrabold opacity-70">Hóa đơn</span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold mt-1">
            Toàn bộ giao dịch phát sinh trong kỳ
          </p>
        </div>
      </div>

      {/* 2) TỔNG DOANH THU */}
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 border border-sky-200 dark:border-sky-800/60 shadow-lg shadow-sky-500/5 hover:shadow-sky-500/10 transition-all flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-24 bg-sky-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
            <span className="size-2 rounded-xs bg-sky-500 rotate-45" />
            TỔNG DOANH THU
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-600 dark:bg-sky-955/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
            <TrendingUp size={11} /> Đã thu
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono tracking-tight">
            {formatCurrency(kpis.totalCollected)}
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold mt-1">
            Tổng số tiền thực tế đã thu từ các hóa đơn
          </p>
        </div>
      </div>

      {/* 3) HÓA ĐƠN HOÀN TẤT */}
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 border border-emerald-200 dark:border-emerald-800/60 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            HÓA ĐƠN HOÀN TẤT
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-955/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 size={11} /> {kpis.fullyPaidPercent}%
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            {kpis.paidInvoiceCount || 0} <span className="text-sm font-extrabold opacity-70">Đã xong</span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold mt-1">
            Hóa đơn đã thanh toán đầy đủ 100%
          </p>
        </div>
      </div>

      {/* 4) CHỜ THU */}
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 border border-amber-200 dark:border-amber-800/60 shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10 transition-all flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" />
            CHỜ THU
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 dark:bg-amber-955/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <AlertCircle size={11} /> Chờ thu
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {formatCurrency(pendingVal)}
          </h3>
          <p className="text-[11px] text-amber-800/70 dark:text-amber-300/70 font-extrabold mt-1">
            (Lượt khám & dịch vụ chưa thu tiền)
          </p>
        </div>
      </div>
    </div>
  );
}

export default FinanceKpiCards;
