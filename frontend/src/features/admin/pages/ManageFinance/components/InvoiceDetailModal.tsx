import React, { useState } from 'react';
import { User, Building, Activity, Receipt, RotateCcw, Printer, CreditCard, ShieldAlert, CalendarX, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import { canRefundPackage, calculatePackageRefund } from '../../../../../utils/billing';
import { PackageRefundBreakdown } from '../../../../../components/billing/PackageRefundBreakdown';
import type { Invoice, Payment } from '../hooks/useFinanceDashboard';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  payments: Payment[];
  isAdminOrManager: boolean;
  onClose: () => void;
  onPrint: (invoice: Invoice) => void;
  onPrintTransaction: (invoice: Invoice, payment: Payment) => void;
  onOpenFastPay: (invoice: Invoice) => void;
  onRefund: (paymentId: string) => void;
  onPackageRefund?: (invoiceId: string, usedSessions: number, penalty: number, reason: string) => Promise<void>;
  onExpireNoRefund?: (invoiceId: string, reason: string) => Promise<void>;
}



export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  payments,
  isAdminOrManager,
  onClose,
  onPrint,
  onPrintTransaction,
  onOpenFastPay,
  onRefund,
  onPackageRefund,
  onExpireNoRefund,
}) => {
  if (!invoice) return null;

  const [isRefundPanelOpen, setIsRefundPanelOpen] = useState(false);
  const usedSessions = invoice.so_buoi_da_dung || 0;
  const penaltyPercent = 10;
  const [refundReason, setRefundReason] = useState<string>('Hủy gói theo yêu cầu của khách hàng');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [expireReason, setExpireReason] = useState('');
  const [submittingExpire, setSubmittingExpire] = useState(false);
  const [showConfirmExpireModal, setShowConfirmExpireModal] = useState(false);

  const invoicePayments = payments.filter(
    (p) => p.hoa_don_id === invoice.id || p.ma_hoa_don === invoice.ma_hoa_don
  );

  const formatLongDate = (dStr: any) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) {
      return '';
    }
  };



  // Gói hủy-không-hoàn (quá hạn) không cần loại trừ riêng ở đây nữa: backend đã chốt
  // tong_tien_phai_tra = so_tien_da_tra cho trường hợp đó, nên phép trừ dưới tự ra 0 — chỉ còn
  // da_hoan_tien cần loại trừ tay vì tong_tien_thanh_toan vẫn giữ nguyên giá gốc trong khi
  // so_tien_da_tra đã giảm xuống phần giữ lại (không phải "còn nợ").
  const remainingDebt = invoice.trang_thai === 'da_hoan_tien'
    ? 0
    : Math.max(0, Number(invoice.tong_tien_thanh_toan) - Number(invoice.da_thanh_toan));

  // Dựa trên dữ liệu thật trả về từ backend (admin.repository.ts:getInvoices) — không đoán/hardcode.
  const isPackage = !!invoice.phac_do_dieu_tri_id;

  const so_tien_giam_voucher = Number(invoice.so_tien_giam_voucher || 0);

  const tong_tien_goc = Number(invoice.tong_tien_goc || invoice.tong_tien_thanh_toan || 0);
  const gia_goc_goi = tong_tien_goc;
  const tongChiPhiLucMuaGoi = Math.max(0, gia_goc_goi - so_tien_giam_voucher);

  // Gói đã quá hạn sử dụng, khách không phản hồi — khác hẳn hủy chủ động (canRefund): áp dụng
  // cho CẢ 3 hình thức thanh toán (kể cả từng buổi), không hoàn tiền, giữ toàn bộ đã đóng.
  // Xem docs/BUSINESS_RULES.md mục "Hủy gói quá hạn sử dụng (không hoàn tiền)".
  const isPackageOverdue = isPackage &&
                    !!invoice.han_su_dung &&
                    new Date(invoice.han_su_dung) < new Date() &&
                    !['da_hoan_tien', 'da_huy'].includes(invoice.trang_thai) &&
                    !['huy', 'hoan_thanh'].includes(invoice.trang_thai_phac_do || '');

  // Refund eligibility check (Only pre-paid packages: LIEU_TRINH and hinh_thuc is tra_thang)
  // — gói đã quá hạn sử dụng KHÔNG được hủy theo luồng hoàn tiền thông thường nữa (chỉ còn đúng 1
  // lối ra: "Hủy do quá hạn sử dụng", không hoàn tiền — xem isPackageOverdue).
  // Dùng chung công thức với PaymentTable.tsx (tab Lịch sử giao dịch) qua canRefundPackage() — 2
  // nơi từng tự chép logic riêng và lệch nhau (PaymentTable.tsx thiếu hẳn điều kiện đã đóng sổ/quá
  // hạn), khiến nút "Hoàn tiền" vẫn hiện cho hóa đơn đã bị tự động hủy do quá hạn sử dụng.
  const canRefund = canRefundPackage(invoice);

  // Refund preview — khớp đúng công thức calculatePackageCancellationRefund() ở backend:
  // phạt 10% trên gia_thanh_toan_goi (giá gói đã chốt theo hình thức thanh toán) — CỐ ĐỊNH
  // Tính toán hoàn tiền qua helper dùng chung
  const totalPaid = Number(invoice.da_thanh_toan);
  const refundCalc = calculatePackageRefund({
    totalPaid,
    packagePrice: tong_tien_goc,
    voucherDiscount: so_tien_giam_voucher,
    usedSessions,
    totalSessions: Number(invoice.tong_so_buoi || 10),
    penaltyPercent
  });
  const estimatedRefund = refundCalc.estimatedRefund;
  const keptRevenue = refundCalc.keptRevenue;

  const handleRefundSubmit = () => {
    if (!onPackageRefund) return;
    setShowConfirmCancelModal(true);
  };

  const executeRefund = async () => {
    if (!onPackageRefund) return;
    setSubmittingRefund(true);
    try {
      await onPackageRefund(invoice.id, usedSessions, penaltyPercent, refundReason);
      setShowConfirmCancelModal(false);
      setIsRefundPanelOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleExpireSubmit = () => {
    if (!onExpireNoRefund) return;
    setShowConfirmExpireModal(true);
  };

  const executeExpire = async () => {
    if (!onExpireNoRefund) return;
    setSubmittingExpire(true);
    try {
      await onExpireNoRefund(invoice.id, expireReason);
      setShowConfirmExpireModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingExpire(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-zinc-150 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-left text-secondary dark:text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-primary/10 dark:bg-primary/20 text-primary dark:text-teal-400 rounded-2xl shadow-inner">
              <Receipt size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-secondary dark:text-zinc-100 flex items-center gap-2">
                Chi tiết Hóa đơn {invoice.ma_hoa_don}
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-400 font-bold uppercase tracking-wide">
                Khởi tạo ngày: {new Date(invoice.ngay_tao).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-100 transition-colors text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-5">
            {/* Top 3 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer block */}
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-150 dark:border-zinc-700/80 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-700/60 flex items-center gap-1.5">
                  <User size={13} className="text-primary dark:text-teal-400" />
                  Thông tin khách hàng
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 dark:text-zinc-400">Họ và tên:</span>
                    <span className="text-secondary dark:text-zinc-100 font-black">{invoice.ten_khach_hang}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 dark:text-zinc-400">Số điện thoại:</span>
                    <span className="text-secondary dark:text-zinc-100 font-bold">{invoice.so_dien_thoai || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Service block */}
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-150 dark:border-zinc-700/80 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-700/60 flex items-center gap-1.5">
                  <Building size={13} className="text-primary dark:text-teal-400" />
                  Gói dịch vụ
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650 dark:text-zinc-300">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 dark:text-zinc-400 shrink-0">Chi tiết:</span>
                    <span className="text-secondary dark:text-zinc-100 font-black text-right leading-snug" title={invoice.ten_dich_vu}>
                      {invoice.ten_dich_vu || 'Phí lượng giá chức năng/Buổi lẻ'}
                      {isPackage && ` (${Number(invoice.tong_so_buoi || 10)} buổi)`}
                    </span>
                  </div>
                  {invoice.hinh_thuc_thanh_toan_goi && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400 dark:text-zinc-400">Hình thức:</span>
                      <span className="text-primary dark:text-teal-300 font-black uppercase tracking-wider text-[9px] bg-primary/10 dark:bg-teal-950/60 border border-primary/20 dark:border-teal-800 px-1.5 py-0.5 rounded">
                        {invoice.hinh_thuc_thanh_toan_goi.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Status Summary block */}
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-150 dark:border-zinc-700/80 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-700/60 flex items-center gap-1.5">
                  <Activity size={13} className="text-primary dark:text-teal-400" />
                  Trạng thái tài chính
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 dark:text-zinc-400">Tổng cần thu:</span>
                    <span className="text-secondary dark:text-zinc-100 font-black">{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 dark:text-zinc-400">Đã thanh toán:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(Number(invoice.da_thanh_toan))}</span>
                  </div>
                  {remainingDebt > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                      <span>Dư nợ còn lại:</span>
                      <span>{formatCurrency(remainingDebt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ghi chú snapshot */}
            {invoice.ghi_chu && (
              <div className="p-3.5 bg-zinc-50/70 dark:bg-zinc-800/70 border border-zinc-150 dark:border-zinc-700 rounded-2xl">
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Ghi chú</p>
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 leading-relaxed">{invoice.ghi_chu}</p>
              </div>
            )}

            {/* Transaction History & Refund Panel (Full width) */}
            <div className="space-y-4">
              {/* Lịch sử ghi nhận giao dịch thanh toán */}
              <div className="space-y-3">
                <div className="pb-1 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={13} className="text-primary dark:text-teal-400" />
                    Lịch sử ghi nhận giao dịch thanh toán
                  </h3>
                  {invoicePayments.length > 0 && (
                    <span className="text-[9px] font-bold text-zinc-350 dark:text-zinc-500 italic normal-case">Bấm vào 1 dòng để xem chi tiết dòng tiền</span>
                  )}
                </div>
                {invoicePayments.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Chưa ghi nhận giao dịch thanh toán nào cho hóa đơn này.</p>
                ) : (
                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-150 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold">
                        <tr>
                          <th className="px-3 py-2.5">Mã GD</th>
                          <th className="px-3 py-2.5">Số tiền</th>
                          <th className="px-3 py-2.5">Phương thức</th>
                          <th className="px-3 py-2.5">Thời gian</th>
                          <th className="px-2 py-2.5 w-6" aria-hidden="true" />
                          <th className="px-3 py-2.5 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-semibold text-zinc-650 dark:text-zinc-300">
                        {invoicePayments.map((p) => {
                          const isSelected = selectedTxId === p.id;
                          return (
                            <tr
                              key={p.id}
                              onClick={() => {
                                setSelectedTxId(isSelected ? null : p.id);
                                setIsRefundPanelOpen(false);
                              }}
                              className={`hover:bg-zinc-50/40 dark:hover:bg-zinc-800/40 cursor-pointer transition-all ${
                                isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40 font-bold' : ''
                              }`}
                            >
                              <td className="px-3 py-2 font-mono text-zinc-400 dark:text-zinc-500 text-[10px]">{p.ma_giao_dich}</td>
                              <td className={`px-3 py-2 font-black tabular-nums ${p.loai_giao_dich === 'HOAN_TIEN' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                {p.loai_giao_dich === 'HOAN_TIEN' ? '−' : '+'}{formatCurrency(Math.abs(Number(p.so_tien)))}
                              </td>
                              <td className="px-3 py-2 capitalize text-[10px]">
                                {p.phuong_thuc === 'tien_mat'
                                  ? '💵 Tiền mặt'
                                  : p.phuong_thuc === 'chuyen_khoan'
                                  ? '🏦 Chuyển khoản'
                                  : '💳 Thẻ/POS'}
                              </td>
                              <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400 text-[10px]">{new Date(p.thoi_gian_giao_dich).toLocaleString('vi-VN')}</td>
                              <td className="px-2 py-2">
                                <ChevronDown
                                  size={12}
                                  className={`text-zinc-350 dark:text-zinc-500 transition-transform duration-200 ${isSelected ? 'rotate-180 text-primary dark:text-teal-400' : ''}`}
                                />
                              </td>
                              <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2.5">
                                  {isAdminOrManager && (
                                    p.loai_giao_dich === 'THANH_TOAN' && invoice.trang_thai !== 'da_hoan_tien' && canRefund ? (
                                      <button
                                        onClick={() => {
                                          if (isPackage) {
                                            setIsRefundPanelOpen(true);
                                            setSelectedTxId(null);
                                          } else {
                                            onRefund(p.id);
                                          }
                                        }}
                                        className="text-[10px] font-black text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <RotateCcw size={10} /> Hoàn tiền
                                      </button>
                                    ) : p.loai_giao_dich === 'HOAN_TIEN' ? (
                                      <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold italic">Đã hoàn trả</span>
                                    ) : (
                                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">—</span>
                                    )
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onPrintTransaction(invoice, p)}
                                    title="In biên nhận giao dịch này"
                                    className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-primary dark:hover:text-teal-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Printer size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {invoicePayments.length > 0 && (
                  <div className="mt-3">
                    {(() => {
                      const selectedTx = invoicePayments.find((tx) => tx.id === selectedTxId);
                      if (!selectedTx) {
                        return (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 italic text-center py-2 bg-zinc-50/30 dark:bg-zinc-800/30 border border-zinc-150 dark:border-zinc-800 border-dashed rounded-xl">
                            💡 Click chọn một giao dịch ở trên để xem phân tích chi tiết dòng tiền từng bước.
                          </div>
                        );
                      }

                      if (selectedTx.loai_giao_dich === 'HOAN_TIEN') {
                        return <PackageRefundBreakdown calculation={selectedTx.chi_tiet as any} />;
                      } else {
                        const chiTiet = selectedTx.chi_tiet;
                        const txContent = chiTiet?.dien_giai || 'Giao dịch thanh toán (dữ liệu cũ, trước nâng cấp hệ thống)';
                        const percentPaid = chiTiet ? `${chiTiet.ty_le_phan_tram}%` : 'Không rõ (giao dịch cũ)';

                        return (
                          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-100 text-xs font-semibold space-y-3 shadow-sm animate-in fade-in duration-200">
                            <div className="flex justify-between items-center pb-2 border-b border-emerald-100/65 dark:border-emerald-900/50">
                              <span className="font-black text-emerald-850 dark:text-emerald-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                📊 Chi tiết giao dịch thanh toán ({selectedTx.ma_giao_dich})
                              </span>
                              <span className="text-[9px] bg-emerald-200/50 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-black">PAYMENT</span>
                            </div>
                            
                            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
                              <div className="flex justify-between items-center font-bold">
                                <span>1. Số tiền thực đóng:</span>
                                <strong className="text-emerald-700 dark:text-emerald-400 font-black text-sm">+{formatCurrency(selectedTx.so_tien)}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500 dark:text-zinc-400">2. Nội dung giao dịch:</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{txContent}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500 dark:text-zinc-400">3. Tỷ lệ thanh toán đợt này:</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{percentPaid}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500 dark:text-zinc-400">4. Phương thức giao dịch:</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                                  {selectedTx.phuong_thuc === 'tien_mat'
                                    ? 'Tiền mặt'
                                    : selectedTx.phuong_thuc === 'chuyen_khoan'
                                    ? 'Chuyển khoản'
                                    : 'Thẻ / POS'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-500 dark:text-zinc-400">5. Người thu:</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                  {selectedTx.ten_nhan_vien_thuc_hien ? (
                                    <>
                                      <span className="text-teal-800 dark:text-teal-300 font-bold">{selectedTx.ten_nhan_vien_thuc_hien}</span>
                                      {selectedTx.vai_tro_nhan_vien && (
                                        <span className="text-[9px] bg-teal-100/80 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 px-1.5 py-0.2 rounded font-black uppercase">
                                          {selectedTx.vai_tro_nhan_vien}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                      🌐 Khách hàng (Thanh toán trực tuyến)
                                    </span>
                                  )}
                                </span>
                              </div>

                              {/* Billing Calculation Details */}
                              <div className="mt-3 pt-3 border-t border-emerald-100/65 dark:border-emerald-900/50 space-y-1.5 text-[11px] text-zinc-650 dark:text-zinc-400">
                                <div className="font-black text-emerald-850 dark:text-emerald-300 uppercase tracking-wider text-[9px] mb-1">
                                  🔍 Phân tích chi tiết hóa đơn lúc mua:
                                </div>
                                {isPackage ? (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500 dark:text-zinc-400">Giá gốc gói trị liệu:</span>
                                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(gia_goc_goi)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500 dark:text-zinc-400">{invoice.loai_goi === 'LE' ? 'Giá gốc dịch vụ lẻ:' : 'Phí lượng giá chức năng:'}</span>
                                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(tong_tien_goc || Number(invoice.tong_tien_thanh_toan))}</span>
                                    </div>
                                  </>
                                )}
                                {so_tien_giam_voucher > 0 && (
                                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                                    <span>
                                      Mã giảm giá
                                      {invoice.ma_voucher_ap_dung ? <> <strong className="font-bold">{invoice.ma_voucher_ap_dung}</strong></> : ''}
                                      {invoice.ten_voucher_ap_dung ? ` (${invoice.ten_voucher_ap_dung})` : ''}:
                                    </span>
                                    <span className="font-semibold">-{formatCurrency(so_tien_giam_voucher)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-dashed border-emerald-250/60 dark:border-emerald-800/60 pt-1.5 font-bold text-zinc-800 dark:text-zinc-100">
                                  <span>Tổng chi phí cần thu:</span>
                                  <span>{formatCurrency(isPackage ? tongChiPhiLucMuaGoi : Number(invoice.tong_tien_thanh_toan))}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>

              {/* Advanced Package Refund Panel (rendered inline inside Right Column when triggered) */}
              {isRefundPanelOpen && isAdminOrManager && isPackage && canRefund && (
                <div className="border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-100 font-black text-xs uppercase tracking-wider">
                      <ShieldAlert size={16} className="text-amber-500 stroke-[2.5]" />
                      <span>Nghiệp vụ Hủy gói & Hoàn tiền chuyên sâu</span>
                    </div>
                    <button
                      onClick={() => setIsRefundPanelOpen(false)}
                      className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase tracking-widest cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Số buổi đã sử dụng (Tự động)</label>
                        <input
                          type="number"
                          value={usedSessions}
                          disabled
                          className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-400 font-bold cursor-not-allowed outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Phí phạt hủy gói (%) (Cố định)</label>
                        <input
                          type="number"
                          value={penaltyPercent}
                          disabled
                          className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-400 font-bold cursor-not-allowed outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Lý do hủy gói & hoàn tiền</label>
                      <input
                        type="text"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Nhập lý do hoàn trả..."
                        className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none font-bold text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
                      />
                    </div>

                    {/* BẢNG TÍNH HOÀN TIỀN DÙNG CHUNG */}
                    <PackageRefundBreakdown calculation={refundCalc} />

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRefundPanelOpen(false)}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="button"
                        onClick={handleRefundSubmit}
                        disabled={submittingRefund || estimatedRefund === 0}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {submittingRefund ? 'Đang xử lý...' : 'Xác nhận hủy & Hoàn tiền'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <button
            onClick={() => onPrint(invoice)}
            className="px-4 py-2 bg-zinc-150 hover:bg-zinc-200 text-zinc-650 hover:text-secondary text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Printer size={14} /> In hóa đơn
          </button>

          <div className="flex gap-2">
            {isAdminOrManager && isPackageOverdue && (
              <button
                onClick={handleExpireSubmit}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CalendarX size={14} /> Hủy do quá hạn sử dụng
              </button>
            )}
            {/* Trả từng buổi KHÔNG được thu tự do ở đây — "Dư nợ còn lại" gồm cả các buổi tương
                lai chưa tới, thu thẳng số này sẽ thu dư/sai buổi. Từng buổi phải đi qua đúng luồng
                checkout theo buổi (customer_id + goi_dich_vu_id, dùng getTungBuoiSessionDue) — nút
                "Thanh toán" ở danh sách phác đồ/lịch hẹn tương ứng, không phải hóa đơn tổng này. */}
            {remainingDebt > 0 && invoice.hinh_thuc_thanh_toan_goi !== 'tung_buoi' && (
              <button
                onClick={() => onOpenFastPay(invoice)}
                className="px-5 py-2.5 bg-primary hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CreditCard size={14} /> Thu tiền ngay
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold rounded-xl transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {showConfirmCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="size-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-black text-secondary text-base">Xác Nhận Hủy Gói & Hoàn Tiền</h3>
              <p className="text-zinc-500 text-xs font-semibold leading-normal">
                Bạn có chắc chắn muốn hủy gói dịch vụ này không? Hành động này sẽ cập nhật trạng thái phác đồ và không thể hoàn tác.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-left text-xs font-semibold space-y-2 text-zinc-650">
              <div className="flex justify-between">
                <span>Số tiền hoàn trả lại cho khách:</span>
                <span className="text-rose-600 font-bold text-sm">{formatCurrency(estimatedRefund)}</span>
              </div>
              <div className="flex justify-between">
                <span>Doanh thu giữ lại thực tế:</span>
                <span className="text-secondary font-bold">{formatCurrency(keptRevenue)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmCancelModal(false)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200/80 active:scale-[0.98] text-secondary text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-zinc-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeRefund}
                disabled={submittingRefund}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {submittingRefund ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmExpireModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="size-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              <CalendarX size={22} />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-black text-secondary text-base">Xác nhận Hủy Gói Do Quá Hạn Sử Dụng</h3>
              <p className="text-zinc-500 text-xs font-semibold leading-normal">
                Gói đã quá hạn sử dụng và khách không còn phản hồi. Hành động này sẽ <strong className="text-zinc-800">giữ lại toàn bộ số tiền đã đóng, không hoàn trả</strong>, và không thể hoàn tác.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-left text-xs font-semibold space-y-2 text-zinc-650">
              <div className="flex justify-between">
                <span>Hạn sử dụng:</span>
                <span className="text-secondary font-bold">{formatLongDate(invoice.han_su_dung)}</span>
              </div>
              <div className="flex justify-between">
                <span>Số tiền đã đóng (giữ lại toàn bộ):</span>
                <span className="text-zinc-800 font-bold text-sm">{formatCurrency(Number(invoice.da_thanh_toan))}</span>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Lý do (không bắt buộc)</label>
              <input
                type="text"
                value={expireReason}
                onChange={(e) => setExpireReason(e.target.value)}
                placeholder="Vd: đã gọi 3 lần không nghe máy, nhắn tin không phản hồi..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none font-bold"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmExpireModal(false)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200/80 active:scale-[0.98] text-secondary text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-zinc-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeExpire}
                disabled={submittingExpire}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {submittingExpire ? 'Đang xử lý...' : 'Xác nhận hủy, không hoàn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InvoiceDetailModal;
