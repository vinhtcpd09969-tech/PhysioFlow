import React from 'react';
import { CreditCard, AlertTriangle, QrCode, Loader2, ExternalLink } from 'lucide-react';
import VoucherPicker from '../../../../../admin/pages/ManageFinance/components/VoucherPicker';
import { formatCurrency } from '@/utils/format';

interface BookingPaymentSectionProps {
  paymentMethod: 'tai_quay' | 'payos';
  setPaymentMethod: (method: 'tai_quay' | 'payos') => void;
  buoiAvailability: any;
  validateFormFields: () => boolean;
  selectedVoucher: any;
  handleApplyVoucher: (code: string, isSilent?: boolean) => void;
  handleRemoveVoucher: () => void;
  rawPrice: number;
  discountAmount: number;
  finalPrice: number;
  activeVouchers: any[];
  user: any;
  bookingType: 'kham' | 'dich_vu';
  payTermsAccepted: boolean;
  setPayTermsAccepted: (accepted: boolean) => void;
  setIsTermsModalOpen: (open: boolean) => void;
  payosLoading: boolean;
  payosData: any;
  payosQrImgUrl: string;
  payosTimeLeft: number;
}

export const BookingPaymentSection: React.FC<BookingPaymentSectionProps> = ({
  paymentMethod,
  setPaymentMethod,
  buoiAvailability,
  validateFormFields,
  selectedVoucher,
  handleApplyVoucher,
  handleRemoveVoucher,
  rawPrice,
  discountAmount,
  finalPrice,
  activeVouchers,
  user,
  bookingType,
  payTermsAccepted,
  setPayTermsAccepted,
  setIsTermsModalOpen,
  payosLoading,
  payosData,
  payosQrImgUrl,
  payosTimeLeft,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pb-1">
        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
          <CreditCard size={18} />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
            4. Phương thức thanh toán &amp; Xác nhận
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Chọn thanh toán tại quầy hoặc Thanh toán Online mã QR PayOS
          </p>
        </div>
      </div>

      {/* Payment Option Radios */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
          Chọn phương thức thanh toán *
        </label>

        {buoiAvailability?.buoc_thanh_toan_online && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold mb-3">
            <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-wider text-rose-800 text-[10px]">Yêu cầu thanh toán Online (No-show Enforcement)</p>
              <p className="mt-0.5 font-bold text-rose-700">
                Tài khoản của bạn có từ 2 lần vắng mặt (no-show) trong 60 ngày qua. Quý khách vui lòng chọn <span className="font-extrabold text-rose-900 underline">Thanh toán Online PayOS</span> để hoàn tất đặt lịch.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={!!buoiAvailability?.buoc_thanh_toan_online}
            onClick={() => setPaymentMethod('tai_quay')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              paymentMethod === 'tai_quay'
                ? 'border-teal-500 bg-teal-50/40 text-slate-900 ring-2 ring-teal-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 font-black">🏪</div>
            <div>
              <div className="text-xs font-black">Thanh toán tại quầy</div>
              <div className="text-[10px] text-slate-500 font-medium">
                {buoiAvailability?.buoc_thanh_toan_online ? 'Khóa do dính 2 lần No-show' : 'Thanh toán khi tới trung tâm (Chưa thanh toán)'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (paymentMethod !== 'payos') {
                if (!validateFormFields()) return;
                setPaymentMethod('payos');
              }
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              paymentMethod === 'payos'
                ? 'border-teal-500 bg-teal-50/40 text-slate-900 ring-2 ring-teal-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 font-black">💳</div>
            <div>
              <div className="text-xs font-black">Thanh toán Online (PayOS QR)</div>
              <div className="text-[10px] text-slate-500 font-medium">Quét QR nhận đăng ký ngay (Đã thanh toán)</div>
            </div>
          </button>
        </div>
      </div>

      {/* Online Payment Specific: Voucher, Terms Gate, PayOS QR Display */}
      {paymentMethod === 'payos' && (
        <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
          {/* Voucher Picker */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5">
            <VoucherPicker
              appliedVoucher={selectedVoucher}
              onApply={handleApplyVoucher}
              onRemove={handleRemoveVoucher}
              orderValue={rawPrice}
              loaiThanhToan="tra_thang"
              khachHangId={user?.id}
              kenh="online"
              loaiGoi={bookingType === 'kham' ? 'KHAM' : 'LE'}
              availableVouchers={activeVouchers}
            />
          </div>

          {/* Terms Acceptance Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-start gap-3 cursor-pointer group flex-1">
                <input
                  type="checkbox"
                  checked={payTermsAccepted}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (!validateFormFields()) return;
                      setIsTermsModalOpen(true);
                    } else {
                      setPayTermsAccepted(false);
                    }
                  }}
                  className="mt-0.5 size-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500/20 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-extrabold group-hover:text-teal-700 transition-colors leading-relaxed select-none">
                  Tôi đã xem, hiểu rõ và đồng ý với tất cả Điều khoản thanh toán &amp; Quy định đăng ký tại OfficeCare.
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (!validateFormFields()) return;
                  setIsTermsModalOpen(true);
                }}
                className="text-[11px] font-black text-teal-600 hover:text-teal-800 underline underline-offset-2 shrink-0 cursor-pointer"
              >
                Xem chi tiết
              </button>
            </div>
          </div>

          {/* PayOS SDK QR Display Box */}
          {payTermsAccepted ? (
            payosLoading ? (
              <div className="p-8 bg-teal-50/40 rounded-3xl border border-teal-200 text-center space-y-3">
                <Loader2 className="animate-spin text-teal-600 mx-auto" size={28} />
                <p className="text-xs font-black text-teal-900">Đang khởi tạo mã QR PayOS SDK chính thức từ máy chủ...</p>
              </div>
            ) : payosData ? (
              <div className="rounded-3xl border border-teal-200 overflow-hidden bg-white shadow-md space-y-0 animate-in zoom-in-95 duration-300">
                {/* Header bar matching Receptionist PayOS Modal */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <QrCode size={20} className="text-teal-200 animate-pulse shrink-0" />
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider leading-none">CỔNG THANH TOÁN VIETQR PAYOS</h4>
                      <p className="text-[10px] text-teal-100 font-bold mt-0.5">Tự động nhận tiền &amp; xác nhận lịch hẹn y tế tức thì</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-teal-500/30 text-teal-100 px-2.5 py-0.5 rounded-full border border-teal-400/40">
                      ⚡ WEBHOOK REAL-TIME
                    </span>
                    <span className="text-xs font-black bg-emerald-950/60 text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-400/40 font-mono tracking-wider">
                      ⏱ Giữ mã: {String(Math.floor(payosTimeLeft / 60)).padStart(2, '0')}:{String(payosTimeLeft % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* QR Image */}
                    <div className="size-48 bg-white p-2 rounded-2xl border border-slate-200 shadow-md shrink-0 flex items-center justify-center relative group">
                      <img src={payosQrImgUrl} alt="PayOS QR Transfer" className="w-full h-full object-contain rounded-xl" />
                    </div>

                    {/* PayOS Transfer Details */}
                    <div className="space-y-2 text-xs text-left min-w-0 flex-1">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Ngân hàng nhận</span>
                        <p className="font-black text-slate-900">MB BANK (Ngân hàng Quân Đội)</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Số tài khoản</span>
                        <p className="font-black text-teal-700 text-sm tracking-wider">{payosData.accountNumber || '0358966332'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Tên tài khoản</span>
                        <p className="font-black text-slate-900 uppercase">{payosData.accountName || 'PHONG KHAM PHCN OFFICECARE'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Số tiền cần thanh toán</span>
                        <p className="font-black text-emerald-600 text-base">{formatCurrency(payosData.amount || finalPrice)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Nội dung chuyển khoản chuẩn PayOS</span>
                        <p className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block font-mono text-[11px] select-all">
                          {payosData.description}
                        </p>
                      </div>

                      {payosData.checkoutUrl && (
                        <div className="pt-1">
                          <a
                            href={payosData.checkoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-black text-teal-700 hover:text-teal-900 underline"
                          >
                            Mở cổng PayOS web <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-emerald-600 shrink-0" />
                    <span>Hệ thống tự động lắng nghe Webhook ngân hàng. Ngay khi bạn chuyển khoản thành công, hệ thống sẽ xác nhận lịch ngay.</span>
                  </div>
                </div>
              </div>
            ) : null
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>Vui lòng tích chọn đồng ý điều khoản dịch vụ ở trên để tạo mã QR PayOS thanh toán.</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 mt-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Giá dịch vụ gốc:</span>
          <span>{formatCurrency(rawPrice)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>Giảm giá Voucher:</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 uppercase">Tổng tiền thanh toán:</span>
          <span className="text-base font-black text-teal-600">{formatCurrency(finalPrice)}</span>
        </div>
      </div>
    </div>
  );
};
