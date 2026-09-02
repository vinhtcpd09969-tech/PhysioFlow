import React from 'react';
import { ShieldCheck, Coins, X, User, Receipt, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName: string;
  itemName: string;
  totalAmount: number;
  paymentMethod: string;
  receivedAmount: number;
  changeAmount: number;
  note: string;
  loading: boolean;
  actionText?: string;
}

export const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  itemName,
  totalAmount,
  paymentMethod,
  receivedAmount,
  changeAmount,
  note,
  loading,
  actionText = 'Xác nhận & Thu tiền',
}) => {
  if (!isOpen) return null;

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'tien_mat':
        return '💵 Tiền mặt tại quầy';
      case 'chuyen_khoan':
        return '🏦 Chuyển khoản ngân hàng (VietQR)';
      case 'the':
        return '💳 Quẹt thẻ máy POS';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-left font-jakarta">
        
        {/* Header Banner Pro Max */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 text-white relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white shadow-xs">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base uppercase tracking-wide">XÁC NHẬN THU TIỀN Y KHOA</h3>
                  <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-white/30">
                    Sổ Sách Y Tế
                  </span>
                </div>
                <p className="text-xs text-teal-50 font-semibold mt-0.5">Kiểm tra thông tin giao dịch tài chính trước khi ghi nhận.</p>
              </div>
            </div>

            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 active:scale-95 rounded-xl transition-all cursor-pointer text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-7 space-y-5">
          
          {/* Patient and Service Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4.5 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-extrabold flex items-center gap-1.5 shrink-0">
                <User size={15} className="text-teal-600 dark:text-teal-400" /> Khách hàng:
              </span>
              <span className="text-slate-900 dark:text-white font-extrabold text-sm truncate">{patientName}</span>
            </div>
            
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-extrabold flex items-center gap-1.5 shrink-0 mt-0.5">
                <Receipt size={15} className="text-teal-600 dark:text-teal-400" /> Nội dung thu:
              </span>
              <span className="text-slate-900 dark:text-white font-extrabold text-right leading-relaxed max-w-[270px]" title={itemName}>
                {itemName}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 font-extrabold flex items-center gap-1.5 shrink-0">
                <CreditCard size={15} className="text-teal-600 dark:text-teal-400" /> Hình thức thu:
              </span>
              <span className="text-teal-700 dark:text-teal-300 font-extrabold bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
                {getMethodLabel(paymentMethod)}
              </span>
            </div>
          </div>

          {/* Cash detailed breakdown */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                Tổng số tiền cần thu:
              </span>
              <span className="text-2xl font-mono font-black text-teal-600 dark:text-teal-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {paymentMethod === 'tien_mat' && totalAmount > 0 && (
              <div className="border-t border-slate-200/80 dark:border-slate-700 pt-3 space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-extrabold">Số tiền khách đưa:</span>
                  <span className="text-slate-900 dark:text-white font-black font-mono text-sm">{formatCurrency(receivedAmount)}</span>
                </div>
                {changeAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-100/70 dark:bg-emerald-950/80 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800">
                    <span className="flex items-center gap-1.5"><Sparkles size={15} /> Tiền thừa thối lại khách:</span>
                    <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(changeAmount)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes summary */}
          {note.trim() && (
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ghi chú phòng khám</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 italic">
                "{note}"
              </div>
            </div>
          )}

          {/* Warning banner */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 rounded-xl shrink-0">
              <Coins size={18} />
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
              Giao dịch sau khi xác nhận sẽ được lưu trực tiếp vào sổ sách hệ thống, tự động kích hoạt phác đồ trị liệu và <strong className="font-extrabold text-amber-900 dark:text-amber-200">không thể tự ý sửa đổi</strong>. Vui lòng kiểm tra kỹ số tiền thực tế nhận được tại quầy.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider rounded-2xl transition-all cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{actionText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPaymentModal;
