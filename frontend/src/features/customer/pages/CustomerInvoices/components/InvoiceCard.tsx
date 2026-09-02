import { Calendar, ChevronRight, Package, Stethoscope, Wrench } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { INVOICE_STATUS_META } from '@/constants/statusMeta';
import type { CustomerInvoice } from '../../../api/customer.api';

interface InvoiceCardProps {
  invoice: CustomerInvoice;
  onOpen: (invoice: CustomerInvoice) => void;
}

const TYPE_META: Record<string, { label: string; icon: typeof Package }> = {
  LIEU_TRINH: { label: 'Gói liệu trình', icon: Package },
  LE: { label: 'Dịch vụ lẻ', icon: Wrench },
  KHAM: { label: 'Buổi Lượng giá', icon: Stethoscope },
};

export function InvoiceCard({ invoice, onOpen }: InvoiceCardProps) {
  const statusMeta = INVOICE_STATUS_META[invoice.trang_thai] || { label: invoice.trang_thai, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  const typeMeta = TYPE_META[invoice.loai_goi || 'KHAM'] || TYPE_META.KHAM;
  const TypeIcon = typeMeta.icon;
  const dateStr = new Date(invoice.ngay_tao).toLocaleDateString('vi-VN');

  return (
    <button
      type="button"
      onClick={() => onOpen(invoice)}
      className="w-full text-left bg-white rounded-2xl border border-slate-200/80 hover:border-teal-500/50 p-4.5 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4 group cursor-pointer"
    >
      {/* Left Icon & Information */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-[#0D9488] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
          <TypeIcon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
              {invoice.ma_hoa_don}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Calendar size={11} /> {dateStr}
            </span>
            <span className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
          </div>

          <h4 className="text-sm font-extrabold text-slate-800 truncate group-hover:text-[#0D9488] transition-colors">
            {invoice.ten_dich_vu || 'Buổi Lượng giá / Dịch vụ lẻ'}
          </h4>
        </div>
      </div>

      {/* Right Price & Paid Status */}
      <div className="flex items-center gap-3.5 shrink-0 text-right">
        <div>
          <p className="text-base font-black text-slate-900 tracking-tight">
            {formatCurrency(invoice.tong_tien_thanh_toan)}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Đã đóng: <span className="text-slate-700 font-bold">{formatCurrency(invoice.da_thanh_toan)}</span>
          </p>
        </div>

        <div className="size-8 rounded-full border border-slate-200 text-slate-400 group-hover:border-teal-500 group-hover:text-teal-600 group-hover:bg-teal-50 flex items-center justify-center transition-all shrink-0">
          <ChevronRight size={16} />
        </div>
      </div>
    </button>
  );
}
