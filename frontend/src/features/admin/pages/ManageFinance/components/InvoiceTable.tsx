import { formatCurrency } from '../../../../../utils/format';
import { Pagination } from '../../../../../components/Pagination';
import { TableSkeleton } from './TableSkeleton';
import type { Invoice } from '../hooks/useFinanceDashboard';
import { FileText } from 'lucide-react';

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export function InvoiceTable({ invoices, loading, page, pageSize, onPageChange, onSelectInvoice }: InvoiceTableProps) {
  const total = invoices.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageInvoices = invoices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden text-left select-none font-jakarta">
      {loading ? (
        <TableSkeleton columns={6} />
      ) : total === 0 ? (
        <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-xs font-bold italic flex flex-col items-center gap-2">
          <FileText size={32} className="text-slate-300 dark:text-slate-600 stroke-[1.5]" />
          <span>Không tìm thấy hóa đơn nào khớp với bộ lọc dữ liệu.</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10.5px]">
                  <th className="p-4 w-[12%]">Mã HĐ</th>
                  <th className="p-4 w-[20%]">Khách hàng</th>
                  <th className="p-4 w-[32%] text-center">Gói dịch vụ</th>
                  <th className="p-4 w-[18%] text-center">Trạng thái</th>
                  <th className="p-4 w-[10%] font-mono">Thanh toán</th>
                  <th className="p-4 w-[8%] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageInvoices.map((inv) => {
                  const isRefunded = inv.trang_thai === 'da_hoan_tien';
                  const isCanceled = inv.trang_thai === 'da_huy';
                  const isPayPerSession = inv.hinh_thuc_thanh_toan_goi === 'tung_buoi';
                  const isUnpaid = inv.trang_thai === 'chua_thanh_toan' || inv.trang_thai === 'dang_cho_thanh_toan';
                  const isDue = !isRefunded && !isCanceled && (isUnpaid || Number(inv.da_thanh_toan) < Number(inv.tong_tien_thanh_toan));
                  const showCollectBtn = isDue && !isPayPerSession;

                  let statusLabel = 'Đã thanh toán';
                  let statusBadgeCls = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-955/60 dark:text-emerald-300 border-emerald-200/80';

                  if (isRefunded) {
                    statusLabel = 'Đã hoàn tiền';
                    statusBadgeCls = 'bg-rose-50 text-rose-700 dark:bg-rose-955/60 dark:text-rose-300 border-rose-200/80';
                  } else if (isCanceled) {
                    statusLabel = 'Đã hủy';
                    statusBadgeCls = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200';
                  } else if (isPayPerSession) {
                    statusLabel = 'Đang trả từng buổi';
                    statusBadgeCls = 'bg-sky-50 text-sky-800 dark:bg-sky-955/60 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/80';
                  } else if (isDue) {
                    statusLabel = 'Chờ thanh toán';
                    statusBadgeCls = 'bg-amber-50 text-amber-800 dark:bg-amber-955/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80';
                  }

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-all duration-150 group ${
                        isDue
                          ? 'bg-amber-50/50 dark:bg-amber-955/20 border-l-4 border-l-amber-300 dark:border-l-amber-600 hover:bg-amber-100/40 dark:hover:bg-amber-955/35'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* 1. MÃ HĐ */}
                      <td className="p-4 font-mono">
                        <span className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs">
                          {inv.ma_hoa_don || '3008023'}
                        </span>
                      </td>

                      {/* 2. KHÁCH HÀNG */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`size-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 border ${
                            isDue
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-extrabold'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                          }`}>
                            {(inv.ten_khach_hang || 'K').trim().split(/\s+/).pop()?.[0] || 'K'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 dark:text-white text-xs truncate">
                              {inv.ten_khach_hang}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold truncate">
                              {inv.so_dien_thoai || '0912345678'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. GÓI DỊCH VỤ - Hiển thị đầy đủ không bị dấu ... */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs leading-relaxed block max-w-[320px] mx-auto">
                          {inv.ten_dich_vu || 'Gói Trị Liệu Cổ Vai Gáy / Khám'}
                        </span>
                      </td>

                      {/* 4. TRẠNG THÁI */}
                      <td className="p-4 text-center">
                        <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border inline-block whitespace-nowrap ${statusBadgeCls}`}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* 5. THANH TOÁN */}
                      <td className="p-4 font-mono font-black text-xs">
                        <span className={
                          isDue
                            ? 'text-amber-700 dark:text-amber-400 font-black'
                            : 'text-emerald-600 dark:text-emerald-400 font-black'
                        }>
                          {formatCurrency(isRefunded ? inv.da_thanh_toan : inv.tong_tien_thanh_toan)}
                        </span>
                      </td>

                      {/* 6. THAO TÁC */}
                      <td className="p-4 text-right">
                        {showCollectBtn ? (
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
                          >
                            💰 Thu ngay
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-extrabold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto border border-slate-200 dark:border-zinc-700"
                          >
                            👁️ Xem
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={onPageChange} />
          </div>
        </>
      )}
    </div>
  );
}

export default InvoiceTable;
