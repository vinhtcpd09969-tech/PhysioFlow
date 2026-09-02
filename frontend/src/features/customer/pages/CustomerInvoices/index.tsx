import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { useCustomerInvoices } from './hooks/useCustomerInvoices';
import { InvoiceCard } from './components/InvoiceCard';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { TermsOfServiceModal } from '../../components/TermsOfServiceModal';

type TypeFilter = 'all' | 'LIEU_TRINH' | 'other';

const FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'LIEU_TRINH', label: 'Gói liệu trình' },
  { key: 'other', label: 'Buổi Lượng giá & Dịch vụ lẻ' },
];

export default function CustomerInvoices() {
  const { invoices, payments, loading, selectedInvoice, setSelectedInvoice } = useCustomerInvoices();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showPolicy, setShowPolicy] = useState(false);
  const [searchParams] = useSearchParams();
  const [autoOpenRefund, setAutoOpenRefund] = useState(false);

  // Nhảy tới từ nút "Hủy liệu trình" ở trang Hồ sơ trị liệu (?invoice=<hoa_don_id>&refund=1)
  const deepLinkApplied = useRef(false);
  useEffect(() => {
    if (deepLinkApplied.current || loading || invoices.length === 0) return;
    const invoiceId = searchParams.get('invoice');
    if (!invoiceId) return;
    deepLinkApplied.current = true;
    const match = invoices.find((i) => i.id === invoiceId);
    if (match) {
      setSelectedInvoice(match);
      setAutoOpenRefund(searchParams.get('refund') === '1');
    }
  }, [loading, invoices, searchParams, setSelectedInvoice]);

  const filteredInvoices = useMemo(() => {
    if (typeFilter === 'all') return invoices;
    if (typeFilter === 'LIEU_TRINH') return invoices.filter((i) => i.loai_goi === 'LIEU_TRINH');
    return invoices.filter((i) => i.loai_goi !== 'LIEU_TRINH');
  }, [invoices, typeFilter]);



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-zinc-500">Đang tải hóa đơn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-body">
      {/* Header & Filter Controls (Sleek, Compact Layout with Zero Whitespace Overflow) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 px-1">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-[#0D9488] flex items-center justify-center shrink-0 shadow-2xs">
            <Receipt size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 font-heading">Hóa đơn của tôi</h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
              Toàn bộ hóa đơn lượng giá, dịch vụ lẻ và gói liệu trình đã phát sinh tại OfficeCare.
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 shrink-0 self-start sm:self-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTypeFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                typeFilter === f.key ? 'bg-[#034e3a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-zinc-200 py-16 text-center text-zinc-400">
          <Receipt size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-xs font-bold uppercase tracking-wide">Chưa có hóa đơn nào phù hợp</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} onOpen={setSelectedInvoice} />
          ))}
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          payments={payments}
          onClose={() => setSelectedInvoice(null)}
          onOpenPolicy={() => setShowPolicy(true)}
          autoOpenRefund={autoOpenRefund}
        />
      )}

      <TermsOfServiceModal open={showPolicy} onClose={() => setShowPolicy(false)} />
    </div>
  );
}
