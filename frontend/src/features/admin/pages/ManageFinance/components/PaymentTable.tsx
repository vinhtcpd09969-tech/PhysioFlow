import { formatCurrency } from '../../../../../utils/format';
import { canRefundPackage } from '../../../../../utils/billing';
import { Pagination } from '../../../../../components/Pagination';
import { TableSkeleton } from './TableSkeleton';
import type { Invoice, Payment } from '../hooks/useFinanceDashboard';
import { Landmark, RotateCcw, CheckCircle2, MinusCircle } from 'lucide-react';

interface PaymentTableProps {
  payments: Payment[];
  allPayments: Payment[];
  invoices: Invoice[];
  loading: boolean;
  isAdminOrManager: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onOpenRefund: (invoice: Invoice) => void;
}

const METHOD_LABEL: Record<string, string> = {
  tien_mat: '💵 Tiền mặt',
  chuyen_khoan: '🏦 Chuyển khoản',
  the: '💳 Thẻ/POS'
};

const isAlreadyRefunded = (payment: Payment, allPayments: Payment[]) => {
  return allPayments.some(
    (p) => p.hoa_don_id === payment.hoa_don_id && p.loai_giao_dich === 'HOAN_TIEN'
  );
};

const getRefundEligibility = (payment: Payment, invoices: Invoice[]) => {
  const invoice = invoices.find((inv) => inv.id === payment.hoa_don_id) || null;
  if (!invoice) return { invoice: null, eligible: false };
  return { invoice, eligible: canRefundPackage(invoice) };
};

export function PaymentTable({ payments, allPayments, invoices, loading, isAdminOrManager, page, pageSize, onPageChange, onOpenRefund }: PaymentTableProps) {
  const total = payments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagePayments = payments.slice((page - 1) * pageSize, page * pageSize);
  const columns = isAdminOrManager ? 7 : 6;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden text-left select-none font-jakarta">
      {loading ? (
        <TableSkeleton columns={columns} />
      ) : total === 0 ? (
        <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-xs font-bold italic flex flex-col items-center gap-2">
          <Landmark size={32} className="text-slate-300 dark:text-slate-600 stroke-[1.5]" />
          <span>Chưa ghi nhận giao dịch thanh toán nào khớp bộ lọc.</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  <th className="p-4">Mã GD</th>
                  <th className="p-4">Mã hóa đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Số tiền</th>
                  <th className="p-4">Phương thức</th>
                  <th className="p-4">Người thu</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagePayments.map((pay) => {
                  const { invoice, eligible } = pay.loai_giao_dich === 'THANH_TOAN' ? getRefundEligibility(pay, invoices) : { invoice: null, eligible: false };
                  const canRefundThis = eligible && !isAlreadyRefunded(pay, allPayments);
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group">
                      <td className="p-4 font-bold text-slate-400 dark:text-slate-500 text-xs">{pay.ma_giao_dich}</td>
                      <td className="p-4">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          {pay.ma_hoa_don}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900 dark:text-white text-xs">{pay.ten_khach_hang}</td>
                      <td className={`p-4 font-black text-xs md:text-sm whitespace-nowrap ${pay.loai_giao_dich === 'HOAN_TIEN' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {pay.loai_giao_dich === 'HOAN_TIEN' ? '−' : '+'}{formatCurrency(Math.abs(Number(pay.so_tien)))}
                      </td>
                      <td className="p-4 text-xs text-slate-700 dark:text-slate-300 font-bold">
                        {METHOD_LABEL[pay.phuong_thuc] || '🏦 Chuyển khoản'}
                      </td>
                      <td className="p-4 text-xs">
                        {pay.ten_nhan_vien_thuc_hien ? (
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px]">{pay.ten_nhan_vien_thuc_hien}</span>
                            {pay.vai_tro_nhan_vien && (
                              <span className="text-[9.5px] text-teal-600 dark:text-teal-400 font-bold">{pay.vai_tro_nhan_vien}</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800">
                            🌐 Khách hàng (Online)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {canRefundThis && invoice ? (
                          <button
                            onClick={() => onOpenRefund(invoice)}
                            title="Mở hóa đơn để hủy gói & hoàn tiền theo đúng công thức đối soát"
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-800 cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs active:scale-95"
                          >
                            <RotateCcw size={12} />
                            Hoàn tiền
                          </button>
                        ) : pay.loai_giao_dich === 'HOAN_TIEN' || (eligible && isAlreadyRefunded(pay, allPayments)) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-black bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800">
                            <CheckCircle2 size={12} /> Đã hoàn trả
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold italic">
                            <MinusCircle size={12} className="text-slate-300" /> Không áp dụng
                          </span>
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

export default PaymentTable;
