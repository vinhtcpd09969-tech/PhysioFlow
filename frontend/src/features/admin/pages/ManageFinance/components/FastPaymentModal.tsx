import React, { useState } from 'react';
import { Receipt, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import { ConfirmDialog } from '../../../../../components/ConfirmDialog';
import { useAuthStore } from '../../../../../stores/authStore';
import { useActiveShiftCheck } from '../../../../../hooks/useActiveShiftCheck';
import toast from 'react-hot-toast';
import type { Invoice } from '../hooks/useFinanceDashboard';

interface FastPaymentModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  method: string;
  setMethod: (method: string) => void;
  received: string;
  setReceived: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  loading: boolean;
}

export const FastPaymentModal: React.FC<FastPaymentModalProps> = ({
  invoice,
  onClose,
  onSubmit,
  method,
  setMethod,
  received,
  setReceived,
  note,
  setNote,
  loading,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { hasShiftToday, isSuperUser } = useActiveShiftCheck();
  if (!invoice) return null;

  const isRefundedOrCancelled = invoice.trang_thai === 'da_hoan_tien' || invoice.trang_thai === 'da_huy';
  const tongPhaiTra = Number(invoice.tong_tien_thanh_toan || 0);
  const daThanhToan = Number(invoice.da_thanh_toan || 0);
  const requiredAmount = isRefundedOrCancelled ? 0 : tongPhaiTra - daThanhToan;
  const quickCashOptions = [200000, 500000, 1000000, 2000000, 5000000];

  const isPackage = !!invoice.phac_do_dieu_tri_id;
  const hinhThuc = invoice.hinh_thuc_thanh_toan_goi || '';

  const giaGocGoi = Number(invoice.tong_tien_goc || 0);
  const giamVoucher = Number(invoice.so_tien_giam_voucher || 0);

  const tongSoBuoi = Number(invoice.tong_so_buoi || invoice.so_buoi_goi || 0);
  const soBuoiDaDung = Number(invoice.so_buoi_da_dung || 0);

  const hinhThucLabel =
    hinhThuc === 'tra_thang' ? 'Trả thẳng' :
    hinhThuc === 'tung_buoi' ? 'Từng buổi' : null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(user?.vai_tro_id) === 2 && !hasShiftToday && !isSuperUser) {
      toast.error('Bạn không có ca trực phân công hôm nay để thực hiện thu ngân tại quầy.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    setShowConfirmModal(false);
    onSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const cleanReceived = received.replace(/\D/g, '');
  const amountToConfirm = method === 'tien_mat' && cleanReceived ? Number(cleanReceived) : requiredAmount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-jakarta">
      <form
        onSubmit={handleFormSubmit}
        className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-zinc-150 dark:border-zinc-800 text-left animate-in zoom-in-95 duration-200 my-auto"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="size-9 bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 rounded-xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-800">
              <CreditCard size={17} />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Ghi nhận thanh toán — {invoice.ma_hoa_don}
              </h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                {invoice.ten_khach_hang}
                {invoice.so_dien_thoai ? ` · ${invoice.so_dien_thoai}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* CỘT TRÁI — Biên lai y khoa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <Receipt className="text-teal-600 dark:text-teal-400 size-4" />
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-tight">Biên lai y khoa</h4>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 rounded-2xl p-4 space-y-1">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                {isPackage ? 'Gói điều trị đã đăng ký' : 'Nội dung thanh toán'}
              </p>
              <p className="text-slate-900 dark:text-white font-black text-xs leading-normal">
                {invoice.ten_dich_vu || 'Dịch vụ y tế'}
                {isPackage && tongSoBuoi > 0 ? ` (${tongSoBuoi} buổi)` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                {hinhThucLabel && (
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 text-[9px] font-black uppercase tracking-wider rounded-lg border border-teal-200 dark:border-teal-800">
                    {hinhThucLabel}
                  </span>
                )}
                {isPackage && tongSoBuoi > 0 && (
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 text-[9px] font-black uppercase tracking-wider rounded-lg">
                    Đã dùng {soBuoiDaDung}/{tongSoBuoi} buổi
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold text-zinc-650 dark:text-zinc-300">
              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>{isPackage ? 'Giá gốc gói:' : 'Giá gốc:'}</span>
                <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(giaGocGoi)}</span>
              </div>

              {giamVoucher > 0 && (
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Mã giảm giá (Voucher):</span>
                  <span>-{formatCurrency(giamVoucher)}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 font-bold text-slate-900 dark:text-white">
                <span>Tổng giá trị hóa đơn:</span>
                <span className="font-mono font-black">{formatCurrency(tongPhaiTra)}</span>
              </div>

              {daThanhToan > 0 && (
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Đã thanh toán:</span>
                  <span>-{formatCurrency(daThanhToan)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-900 dark:text-white bg-teal-50/80 dark:bg-teal-950/60 p-3.5 rounded-2xl border border-teal-200 dark:border-teal-800">
                <span>Cần thu bây giờ:</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono font-black text-sm">{formatCurrency(requiredAmount)}</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI — Form thu tiền */}
          <div className="space-y-4 md:border-l md:border-zinc-100 dark:md:border-zinc-800 md:pl-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <CreditCard className="text-teal-600 dark:text-teal-400 size-4" />
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-tight">Thông tin giao dịch</h4>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fastPayMethod" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Hình thức thanh toán
              </label>
              <select
                id="fastPayMethod"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-teal-600 outline-none transition-all"
              >
                <option value="tien_mat">💵 Tiền mặt</option>
                <option value="chuyen_khoan">🏦 Chuyển khoản ngân hàng (Quét mã VietQR tự động qua PayOS)</option>
              </select>
            </div>

            {method === 'tien_mat' && (() => {
              const receivedNum = Number(received.replace(/\D/g, '') || 0);
              const isShortage = receivedNum > 0 && receivedNum < requiredAmount;
              const currentQuickOptions = Array.from(new Set([requiredAmount, ...quickCashOptions]))
                .filter(val => val > 0)
                .sort((a, b) => a - b);

              return (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <label htmlFor="fastPayReceived" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Số tiền khách đưa (VND) *
                    </label>
                    <input
                      id="fastPayReceived"
                      type="text"
                      value={received ? Number(received.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                      onChange={(e) => setReceived(e.target.value.replace(/\D/g, ''))}
                      placeholder="VD: 500.000"
                      required
                      className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all outline-none border ${
                        isShortage
                          ? 'bg-rose-50/20 border-rose-350 text-rose-900 focus:bg-white focus:border-rose-500'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:bg-white focus:border-teal-600'
                      }`}
                    />
                    {isShortage && (
                      <p className="text-[10.5px] text-rose-600 font-extrabold flex items-center gap-1 mt-1">
                        ⚠️ Còn thiếu {formatCurrency(requiredAmount - receivedNum)} để hoàn thành thanh toán
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentQuickOptions.map(val => {
                      const isActive = val === receivedNum;
                      const isExact = val === requiredAmount;

                      let btnStyle = '';
                      if (isActive) {
                        btnStyle = 'bg-teal-600 border-teal-600 text-white shadow-sm';
                      } else if (isExact) {
                        btnStyle = 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-600 hover:text-white';
                      } else {
                        btnStyle = 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-teal-600 hover:text-white';
                      }

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReceived(val.toString())}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all border cursor-pointer ${btnStyle}`}
                        >
                          {formatCurrency(val)}
                          {isExact && !isActive && <span className="text-[8px] font-bold ml-1 opacity-80">(Cần thu)</span>}
                        </button>
                      );
                    })}
                  </div>

                  {receivedNum > requiredAmount && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/40 rounded-xl p-3 text-[10.5px] font-bold flex justify-between">
                      <span>Tiền thừa thối khách:</span>
                      <span>{formatCurrency(receivedNum - requiredAmount)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-1.5">
              <label htmlFor="fastPayNote" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Ghi chú giao dịch
              </label>
              <textarea
                id="fastPayNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi nhận lưu ý..."
                rows={2}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-teal-600 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider transition-all cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={loading || (Number(user?.vai_tro_id) === 2 && !hasShiftToday && !isSuperUser)}
                title={Number(user?.vai_tro_id) === 2 && !hasShiftToday && !isSuperUser ? 'Bạn không có ca trực phân công hôm nay để thu tiền' : undefined}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                {loading ? 'Đang xử lý...' : method === 'chuyen_khoan' ? 'Tiếp tục quét mã QR' : 'Xác nhận thu'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Xác nhận thu tiền thanh toán"
        message={
          method === 'chuyen_khoan'
            ? `Mở cổng thanh toán QR PayOS để thu ${formatCurrency(amountToConfirm)} cho khách hàng "${invoice.ten_khach_hang}" (Mã HĐ: ${invoice.ma_hoa_don})? Hóa đơn chỉ được đánh dấu đã thu sau khi hệ thống xác nhận tiền đã về qua webhook.`
            : `Bạn có chắc chắn muốn xác nhận thu ${formatCurrency(amountToConfirm)} cho khách hàng "${invoice.ten_khach_hang}" (Mã HĐ: ${invoice.ma_hoa_don}) qua hình thức Tiền mặt?`
        }
        confirmLabel={method === 'chuyen_khoan' ? 'Mở cổng thanh toán QR' : 'Đồng ý & Thu tiền'}
        cancelLabel="Kiểm tra lại"
        type="success"
        onConfirm={handleFinalConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default FastPaymentModal;
