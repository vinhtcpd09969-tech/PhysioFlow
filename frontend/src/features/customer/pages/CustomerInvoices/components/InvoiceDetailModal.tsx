import { useState } from 'react';
import { User, Building, Activity, Receipt, ChevronDown, Phone, ShieldAlert, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import { canRefundPackage, calculatePackageRefund } from '../../../../../utils/billing';
import { PackageRefundBreakdown } from '../../../../../components/billing/PackageRefundBreakdown';
import type { CustomerInvoice, CustomerPayment } from '../../../api/customer.api';

interface InvoiceDetailModalProps {
  invoice: CustomerInvoice;
  payments: CustomerPayment[];
  onClose: () => void;
  onOpenPolicy: () => void;
  /** Mở sẵn bảng xem trước hoàn tiền — dùng khi nhảy tới từ nút "Hủy liệu trình" ở trang Hồ sơ trị liệu. */
  autoOpenRefund?: boolean;
}

/** Chi tiết hóa đơn — CHỈ XEM cho khách hàng, bố cục và số liệu giống y hệt trang Admin
 * (admin/pages/ManageFinance/components/InvoiceDetailModal.tsx), chỉ khác: không có nút thao tác
 * nào (Hoàn tiền / Thu tiền / Xác nhận hủy) — nơi Admin bấm "Hoàn tiền" để xử lý, ở đây bấm để CHỈ
 * XEM trước bảng tính, kèm ghi chú liên hệ phòng khám nếu có nhu cầu hủy thật. */
export function InvoiceDetailModal({ invoice, payments, onClose, onOpenPolicy, autoOpenRefund }: InvoiceDetailModalProps) {
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isRefundPanelOpen, setIsRefundPanelOpen] = useState(!!autoOpenRefund);
  const usedSessions = invoice.so_buoi_da_dung || 0;
  const penaltyPercent = 10;

  const invoicePayments = payments.filter(
    (p) => p.hoa_don_id === invoice.id || p.ma_hoa_don === invoice.ma_hoa_don
  );

  const formatLongDate = (dStr: any) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  };

  const remainingDebt = invoice.trang_thai === 'da_hoan_tien'
    ? 0
    : Math.max(0, Number(invoice.tong_tien_thanh_toan) - Number(invoice.da_thanh_toan));

  // Y hệt công thức admin — xem chú thích đầy đủ ở
  // admin/pages/ManageFinance/components/InvoiceDetailModal.tsx, khớp
  // backend/src/domain/billing.ts::calculatePackageCancellationRefund().
  const isPackage = !!invoice.phac_do_dieu_tri_id;
  const so_tien_giam_voucher = Number(invoice.so_tien_giam_voucher || 0);
  const tong_tien_goc = Number(invoice.tong_tien_goc || invoice.tong_tien_thanh_toan || 0);
  const gia_goc_goi = tong_tien_goc;
  const tongChiPhiLucMuaGoi = Math.max(0, gia_goc_goi - so_tien_giam_voucher);

  // Dùng chung công thức với Admin qua canRefundPackage() (utils/billing.ts) — bản cũ tự chép
  // logic riêng ở đây thiếu hẳn điều kiện "gói đã quá hạn sử dụng", khiến bảng xem trước hoàn tiền
  // vẫn hiện cho gói đã bị hệ thống tự khóa vì quá hạn.
  const canRefund = canRefundPackage(invoice);
  const isTungBuoiPackage = isPackage && invoice.hinh_thuc_thanh_toan_goi === 'tung_buoi';

  const totalPaid = Number(invoice.da_thanh_toan);
  const totalSessions = Number(invoice.tong_so_buoi || 10);
  const refundCalc = calculatePackageRefund({
    totalPaid,
    packagePrice: tong_tien_goc,
    voucherDiscount: so_tien_giam_voucher,
    usedSessions,
    totalSessions,
    penaltyPercent
  });

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-zinc-150 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
              <Receipt size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-secondary">Hóa đơn {invoice.ma_hoa_don}</h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                Khởi tạo: {new Date(invoice.ngay_tao).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors text-lg leading-none">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-5">
            {/* Top 3 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <User size={13} className="text-primary" /> Thông tin khách hàng
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Họ và tên:</span>
                    <span className="text-secondary font-black">{invoice.ten_khach_hang}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Số điện thoại:</span>
                    <span className="text-secondary font-bold">{invoice.so_dien_thoai || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <Building size={13} className="text-primary" /> Sản phẩm điều trị
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 shrink-0">Chi tiết:</span>
                    <span className="text-secondary font-black text-right leading-snug" title={invoice.ten_dich_vu || ''}>
                      {invoice.ten_dich_vu || 'Buổi Lượng giá / Dịch vụ lẻ'}
                      {isPackage && ` (${totalSessions} buổi)`}
                    </span>
                  </div>
                  {invoice.hinh_thuc_thanh_toan_goi && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Hình thức:</span>
                      <span className="text-primary font-black uppercase tracking-wider text-[9px] bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                        {invoice.hinh_thuc_thanh_toan_goi.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <Activity size={13} className="text-primary" /> Trạng thái tài chính
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tổng cần thu:</span>
                    <span className="text-secondary font-black">{formatCurrency(invoice.tong_tien_thanh_toan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Đã thanh toán:</span>
                    <span className="text-emerald-700 font-bold">{formatCurrency(invoice.da_thanh_toan)}</span>
                  </div>
                  {remainingDebt > 0 && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>Dư nợ còn lại:</span>
                      <span>{formatCurrency(remainingDebt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="pb-1 border-b border-zinc-100 flex items-center justify-between gap-2">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={13} className="text-primary" /> Lịch sử ghi nhận giao dịch thanh toán
                  </h3>
                  {invoicePayments.length > 0 && (
                    <span className="text-[9px] font-bold text-zinc-350 italic normal-case">Bấm vào 1 dòng để xem chi tiết dòng tiền</span>
                  )}
                </div>
                {invoicePayments.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">Chưa ghi nhận giao dịch thanh toán nào cho hóa đơn này.</p>
                ) : (
                  <div className="border border-zinc-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-zinc-50 border-b border-zinc-150 text-zinc-500 font-bold">
                        <tr>
                          <th className="px-3 py-2.5">Mã GD</th>
                          <th className="px-3 py-2.5">Loại</th>
                          <th className="px-3 py-2.5">Số tiền</th>
                          <th className="px-3 py-2.5">Phương thức</th>
                          <th className="px-3 py-2.5">Thời gian</th>
                          <th className="px-2 py-2.5 w-6" aria-hidden="true" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-650">
                        {invoicePayments.map((p) => {
                          const isSelected = selectedTxId === p.id;
                          return (
                            <tr
                              key={p.id}
                              onClick={() => setSelectedTxId(isSelected ? null : p.id)}
                              className={`hover:bg-zinc-50/40 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/60 font-bold' : ''}`}
                            >
                              <td className="px-3 py-2 font-mono text-zinc-400 text-[10px]">{p.ma_giao_dich}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap ${
                                    p.loai_giao_dich === 'HOAN_TIEN'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                  }`}
                                >
                                  {p.loai_giao_dich === 'HOAN_TIEN' ? 'Hoàn tiền' : 'Thanh toán'}
                                </span>
                              </td>
                              <td className={`px-3 py-2 font-black tabular-nums ${p.loai_giao_dich === 'HOAN_TIEN' ? 'text-emerald-600' : 'text-secondary'}`}>
                                {formatCurrency(Math.abs(Number(p.so_tien)))}
                              </td>
                              <td className="px-3 py-2 capitalize text-[10px]">
                                {p.phuong_thuc === 'tien_mat' ? '💵 Tiền mặt' : p.phuong_thuc === 'chuyen_khoan' ? '🏦 Chuyển khoản' : '💳 Thẻ/POS'}
                              </td>
                              <td className="px-3 py-2 text-zinc-500 text-[10px]">{new Date(p.thoi_gian_giao_dich).toLocaleString('vi-VN')}</td>
                              <td className="px-2 py-2">
                                <ChevronDown size={12} className={`text-zinc-350 transition-transform duration-200 ${isSelected ? 'rotate-180 text-primary' : ''}`} />
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
                          <div className="text-[10px] text-zinc-400 italic text-center py-2 bg-zinc-50/30 border border-zinc-150 border-dashed rounded-xl">
                            💡 Click chọn một giao dịch ở trên để xem phân tích chi tiết dòng tiền từng bước.
                          </div>
                        );
                      }

                      if (selectedTx.loai_giao_dich === 'HOAN_TIEN') {
                        const analysis = selectedTx.chi_tiet;
                        if (!analysis) {
                          return (
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150 border-dashed text-zinc-400 text-[11px] italic text-center">
                              Giao dịch trước nâng cấp hệ thống — không có dữ liệu chi tiết.
                            </div>
                          );
                        }

                        // Khách cần thấy được TRỪ NHỮNG KHOẢN GÌ mới ra số tiền hoàn — nhưng bằng
                        // ngôn ngữ đời thường (không đánh số 1/2.1/2.2, không ký hiệu đại số A/B, và
                        // KHÔNG kèm ghi chú ghi nhận doanh thu nội bộ — đó là nghiệp vụ kế toán của
                        // phòng khám, xem bản Admin để đối soát).
                        const totalDeduct = Number(analysis.chi_phi_buoi_dung) + Number(analysis.phi_phat_thuc_te) + Number(analysis.exam_fee_to_charge);

                        return (
                          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 text-xs font-semibold space-y-3.5 shadow-sm animate-in fade-in duration-200">
                            <div className="flex justify-between items-center pb-2 border-b border-emerald-100/65">
                              <span className="font-black text-emerald-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                📊 Chi tiết giao dịch hoàn tiền ({selectedTx.ma_giao_dich})
                              </span>
                              <span className="text-[9px] bg-emerald-200/50 text-emerald-800 px-1.5 py-0.5 rounded font-black">ĐÃ HOÀN TIỀN</span>
                            </div>

                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center text-zinc-700 font-bold">
                                <span>Bạn đã thanh toán trước đó:</span>
                                <strong className="text-secondary font-black text-sm">{formatCurrency(analysis.so_tien_da_dong)}</strong>
                              </div>

                              <div className="pl-3 border-l-2 border-emerald-200 space-y-1.5 text-[11px] text-zinc-650">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Các khoản đã trừ</p>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Chi phí {analysis.so_buoi_dung}/{analysis.tong_so_buoi} buổi đã sử dụng:</span>
                                  <span>-{formatCurrency(analysis.chi_phi_buoi_dung)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Phí hủy gói giữa chừng ({analysis.phi_phat_percent}%):</span>
                                  <span>-{formatCurrency(analysis.phi_phat_thuc_te)}</span>
                                </div>
                                {Number(analysis.exam_fee_to_charge) > 0 && (
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="text-zinc-500 text-left max-w-[280px]">
                                      Buổi Lượng giá chức năng
                                      {invoice.ngay_kham ? ` · ca thực hiện ${formatLongDate(invoice.ngay_kham)}` : ''}:
                                    </span>
                                    <span className="shrink-0">-{formatCurrency(analysis.exam_fee_to_charge)}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-dashed border-emerald-200/60 font-bold text-zinc-700">
                                <span>Tổng cộng bị trừ:</span>
                                <span>-{formatCurrency(totalDeduct)}</span>
                              </div>

                              <div className="flex justify-between items-center pt-2.5 border-t border-emerald-200 font-black text-emerald-800 text-xs">
                                <span>Đã hoàn lại cho bạn:</span>
                                <span className="text-emerald-600 font-black text-sm">+{formatCurrency(analysis.so_tien_hoan_tra)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const chiTiet = selectedTx.chi_tiet;
                      const txContent = chiTiet?.dien_giai || chiTiet?.mo_ta || (selectedTx.phuong_thuc === 'chuyen_khoan' ? 'Thanh toán trực tuyến (PayOS / Chuyển khoản QR)' : 'Thanh toán trực tiếp');
                      const percentPaid = chiTiet?.ty_le_phan_tram ? `${chiTiet.ty_le_phan_tram}%` : '100%';

                      return (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-250 text-emerald-950 text-xs font-semibold space-y-3 shadow-sm animate-in fade-in duration-200">
                          <div className="flex justify-between items-center pb-2 border-b border-emerald-100/65">
                            <span className="font-black text-emerald-850 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                              📊 Chi tiết giao dịch thanh toán ({selectedTx.ma_giao_dich})
                            </span>
                            <span className="text-[9px] bg-emerald-200/50 text-emerald-800 px-1.5 py-0.5 rounded font-black">PAYMENT</span>
                          </div>

                          <div className="space-y-2 text-zinc-700">
                            <div className="flex justify-between items-center font-bold">
                              <span>1. Số tiền thực đóng:</span>
                              <strong className="text-emerald-700 font-black text-sm">+{formatCurrency(selectedTx.so_tien)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">2. Nội dung giao dịch:</span>
                              <span className="font-semibold text-zinc-800">{txContent}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">3. Tỷ lệ thanh toán đợt này:</span>
                              <span className="font-semibold text-zinc-800">{percentPaid}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">4. Phương thức giao dịch:</span>
                              <span className="font-semibold text-zinc-800 capitalize">
                                {selectedTx.phuong_thuc === 'tien_mat' ? 'Tiền mặt' : selectedTx.phuong_thuc === 'chuyen_khoan' ? 'Chuyển khoản (QR)' : 'Thẻ / POS'}
                              </span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-emerald-100/65 space-y-1.5 text-[11px] text-zinc-650">
                              <div className="font-black text-emerald-850 uppercase tracking-wider text-[9px] mb-1">
                                🔍 Phân tích chi tiết hóa đơn lúc mua:
                              </div>
                              {isPackage ? (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Giá gốc gói trị liệu:</span>
                                    <span className="font-semibold">{formatCurrency(gia_goc_goi)}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">{invoice.loai_goi === 'LE' ? 'Giá gốc dịch vụ lẻ:' : 'Phí buổi Lượng giá:'}</span>
                                    <span className="font-semibold">{formatCurrency(tong_tien_goc || Number(invoice.tong_tien_thanh_toan))}</span>
                                  </div>
                                </>
                              )}
                              {so_tien_giam_voucher > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                  <span>
                                    Mã giảm giá
                                    {invoice.ma_voucher_ap_dung ? <> <strong className="font-bold">{invoice.ma_voucher_ap_dung}</strong></> : ''}
                                    {invoice.ten_voucher_ap_dung ? ` (${invoice.ten_voucher_ap_dung})` : ''}:
                                  </span>
                                  <span className="font-semibold">-{formatCurrency(so_tien_giam_voucher)}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-dashed border-emerald-250/60 pt-1.5 font-bold text-zinc-800">
                                <span>Tổng chi phí cần thu:</span>
                                <span>{formatCurrency(isPackage ? tongChiPhiLucMuaGoi : Number(invoice.tong_tien_thanh_toan))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Package refund preview — CHỈ hiện khi bấm nút, giống hành vi "Hoàn tiền" của Admin */}
              {isPackage && canRefund && (
                <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                      <ShieldAlert size={16} className="text-amber-500 stroke-[2.5]" />
                      <span>Chính sách Hủy gói & Hoàn tiền</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRefundPanelOpen((o) => !o)}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw size={11} /> {isRefundPanelOpen ? 'Ẩn bảng tính' : 'Xem trước hoàn tiền'}
                    </button>
                  </div>

                  {isRefundPanelOpen && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      <PackageRefundBreakdown calculation={refundCalc} />
                    </div>
                  )}

                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
                    <Phone size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-secondary leading-relaxed">
                        Vui lòng liên hệ trung tâm để hủy gói liệu trình và hoàn tiền.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenPolicy}
                        className="text-[11px] font-black text-primary hover:underline uppercase tracking-wider"
                      >
                        Xem chính sách →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isPackage && !canRefund && (
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
                  <Phone size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-secondary leading-relaxed">
                      {isTungBuoiPackage
                        ? 'Gói thanh toán theo hình thức từng buổi không áp dụng hoàn tiền. Vui lòng liên hệ trung tâm nếu cần hỗ trợ.'
                        : 'Gói này đã kết thúc (hủy/hoàn tiền/quá hạn) — xem chi tiết trong lịch sử giao dịch phía trên. Mọi thắc mắc vui lòng liên hệ trung tâm.'}
                    </p>
                    <button
                      type="button"
                      onClick={onOpenPolicy}
                      className="text-[11px] font-black text-primary hover:underline uppercase tracking-wider"
                    >
                      Xem chính sách →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
