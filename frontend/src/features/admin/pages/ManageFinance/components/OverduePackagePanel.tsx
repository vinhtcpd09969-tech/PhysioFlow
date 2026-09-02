import { CalendarX } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Invoice } from '../hooks/useFinanceDashboard';

interface OverduePackagePanelProps {
  invoices: Invoice[];
  onOpenDetail: (invoice: Invoice) => void;
}

const formatDaysOverdue = (hanSuDung?: string | null) => {
  if (!hanSuDung) return '';
  const han = new Date(hanSuDung);
  const now = new Date();
  const days = Math.floor((now.getTime() - han.getTime()) / (1000 * 60 * 60 * 24));
  return days > 0 ? `Quá hạn ${days} ngày` : 'Vừa hết hạn';
};

/**
 * Gói liệu trình đã quá `han_su_dung` (khách không còn phản hồi) — chỉ để admin/lễ tân dễ tìm
 * thấy rồi bấm vào mở đúng hóa đơn. Nút hủy không hoàn thực sự nằm trong InvoiceDetailModal
 * (chỉ Admin thấy/bấm được) — panel này chỉ hiển thị, không có hành động trực tiếp trên thẻ.
 */
export function OverduePackagePanel({ invoices, onOpenDetail }: OverduePackagePanelProps) {
  if (invoices.length === 0) return null;

  return (
    <div className="w-full bg-white border border-amber-200 p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-amber-100">
        <h3 className="text-sm font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarX size={16} className="text-amber-600" /> Gói quá hạn sử dụng cần xử lý
        </h3>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {invoices.length} gói
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            onClick={() => onOpenDetail(inv)}
            className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-150 hover:border-amber-400 hover:bg-amber-50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col gap-1.5"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-black text-slate-800 truncate">{inv.ten_khach_hang}</span>
              <span className="font-mono text-[9px] bg-white px-1.5 py-0.5 rounded border border-amber-150 text-zinc-500 shrink-0">
                {inv.ma_hoa_don}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold truncate">
              {inv.ten_dich_vu || 'Gói trị liệu'}
            </p>
            <div className="flex justify-between items-center text-[9px] font-bold">
              <span className="text-amber-700">{formatDaysOverdue(inv.han_su_dung)}</span>
              <span className="text-zinc-400">Đã đóng: {formatCurrency(inv.da_thanh_toan)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OverduePackagePanel;
