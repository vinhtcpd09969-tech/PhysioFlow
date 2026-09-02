import React from 'react';
import { CreditCard, X } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface WalkInPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: any;
  onProceedToPayment: () => void;
  onSaveAsConfirmed: () => void;
}

export const WalkInPaymentModal: React.FC<WalkInPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedService,
  onProceedToPayment,
  onSaveAsConfirmed
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-jakarta relative text-left">
        {/* Nút X đóng modal */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
          title="Đóng / Hủy bỏ"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CreditCard size={24} />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="text-base font-black text-slate-800 dark:text-zinc-100">
            Xác Nhận Thu Tiền Lượng Giá
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
            Theo quy định trung tâm, <strong className="text-slate-700 dark:text-zinc-200">ca Lượng giá bắt buộc phải hoàn tất thu tiền</strong> trước khi đưa khách hàng vào Hàng đợi Check-in.
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 p-4 rounded-2xl text-xs space-y-1">
          <p className="font-bold text-slate-700 dark:text-zinc-300">
            Dịch vụ: <span className="text-emerald-700 dark:text-emerald-400 font-black">{selectedService?.ten_goi || selectedService?.ten_dich_vu || 'Lượng giá PHCN'}</span>
          </p>
          <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm mt-1">
            Số tiền cần thu: {formatCurrency(selectedService?.don_gia ?? selectedService?.gia_dich_vu ?? 0)}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onProceedToPayment}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            <span>CHUYỂN SANG THU TIỀN NGAY</span>
          </button>

          <button
            type="button"
            onClick={onSaveAsConfirmed}
            className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
          >
            Lưu ca ở trạng thái Đặt Trước (Chưa Check-in)
          </button>
        </div>
      </div>
    </div>
  );
};
