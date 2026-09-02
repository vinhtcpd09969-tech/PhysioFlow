import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, CheckCircle2, Calendar, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../../api/axios';
import { useAuthStore } from '../../../../stores/authStore';
import { printDashboardReport } from '../../../../utils/reportPdfPrinter';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodLabel: string;
  rangeInfo?: {
    startDate: string;
    endDate: string;
    bucket: 'day' | 'month' | 'year';
    label: string;
  };
  stats?: any;
  performanceData?: any[];
}

const REPORT_SECTIONS = [
  { id: 'kpi', label: 'Tổng quan KPI doanh thu & khách hàng', desc: 'Doanh thu thuần, lượt khách mới, tỷ lệ hủy ca' },
  { id: 'revenue', label: 'Biểu đồ phân tích doanh thu', desc: 'Xu hướng tài chính theo mốc thời gian đã lọc' },
  { id: 'packages', label: 'Top gói dịch vụ phổ biến', desc: 'Xếp hạng gói trị liệu và khám được chọn nhiều nhất' },
  { id: 'vip', label: 'Top 5 khách hàng VIP', desc: 'Khách hàng có tổng chi tiêu cao nhất trong kỳ' },
  { id: 'staff', label: 'Top nhân sự hoàn thành ca', desc: 'Năng suất điều trị của Chuyên viên & Kỹ thuật viên' },
];

export function ExportReportModal({
  isOpen,
  onClose,
  periodLabel,
  rangeInfo,
  stats,
  performanceData = []
}: ExportReportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const user = useAuthStore((state) => state.user);

  if (!isOpen) return null;

  const handleConfirmExport = async () => {
    try {
      setIsExporting(true);

      // Fetch supplementary report details in parallel
      const [topPackagesRes, topVipRes, revenueRes] = await Promise.all([
        api.get('/admin/analytics/top-packages').catch(() => ({ data: [] })),
        api.get('/admin/analytics/top-vip-customers').catch(() => ({ data: [] })),
        rangeInfo?.startDate && rangeInfo?.endDate
          ? api.get('/admin/analytics/revenue', {
              params: {
                startDate: rangeInfo.startDate,
                endDate: rangeInfo.endDate,
                bucket: rangeInfo.bucket || 'month'
              }
            }).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] })
      ]);

      const topPackages = Array.isArray(topPackagesRes.data) ? topPackagesRes.data : [];
      const topVip = Array.isArray(topVipRes.data) ? topVipRes.data : [];
      const revenueTimeline = Array.isArray(revenueRes.data) ? revenueRes.data : [];

      const creatorName = user?.ho_ten || (user as any)?.ten || 'Trần Công Vinh (Quản trị viên)';

      printDashboardReport({
        periodLabel: periodLabel || rangeInfo?.label || 'Kỳ thống kê hiện tại',
        generatedDate: new Date(),
        creatorName,
        stats: stats || {},
        revenueTimeline,
        topPackages,
        topVipCustomers: topVip,
        staffPerformance: (performanceData || []).map((s: any) => ({
          id: String(s.id || s.name),
          ho_ten: s.name || s.ho_ten || 'Nhân sự',
          vai_tro: s.role || s.vai_tro || 'Chuyên viên',
          completed_count: Number(s.sessions || s.completed_count || 0),
          avg_rating: s.avg_rating || 5.0
        }))
      });

      toast.success('Đã mở trang in/xuất file PDF báo cáo thành công!');
      onClose();
    } catch (err: any) {
      console.error('Error generating PDF report:', err);
      toast.error('Có lỗi xảy ra khi tạo báo cáo PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-slate-200/90 dark:border-zinc-800 overflow-hidden z-10 my-8"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner shrink-0">
                <FileText size={22} className="stroke-[2.25]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-heading tracking-tight">
                  Xuất báo cáo tổng quan
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                  Tải xuống tài liệu phân tích quản trị định dạng PDF
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all hover:rotate-90 cursor-pointer shadow-2xs"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Period Banner */}
            <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Calendar size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-xs font-black text-teal-900 dark:text-teal-200 truncate">
                  Kỳ báo cáo: <b className="text-teal-700 dark:text-teal-300">{periodLabel || 'Mặc định'}</b>
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white shrink-0 shadow-xs">
                A4 PDF
              </span>
            </div>

            {/* Content List */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                Nội dung bao gồm trong báo cáo:
              </span>
              <div className="space-y-2">
                {REPORT_SECTIONS.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800/80 flex items-start gap-3 transition-colors shadow-2xs"
                  >
                    <div className="mt-0.5 size-4 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={13} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">
                        {sec.label}
                      </p>
                      <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                        {sec.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-5 py-2.5 text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-750 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmExport}
              disabled={isExporting}
              className="px-6 py-2.5 text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-teal-600/25 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang tạo PDF...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Xuất PDF</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ExportReportModal;
