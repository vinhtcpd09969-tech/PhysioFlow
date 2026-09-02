import React from 'react';
import { motion } from 'framer-motion';

interface DetailConfirmationModalProps {
  showConfirmType: 'save' | 'cancel' | null;
  setShowConfirmType: (val: 'save' | 'cancel' | null) => void;
  customCancelReason: string;
  setCustomCancelReason: (val: string) => void;
  assignStatus: string;
  isStatusChanged: boolean;
  isRescheduled: boolean;
  onConfirm: () => void;
}

export const DetailConfirmationModal: React.FC<DetailConfirmationModalProps> = ({
  showConfirmType,
  setShowConfirmType,
  customCancelReason,
  setCustomCancelReason,
  assignStatus,
  isStatusChanged,
  isRescheduled,
  onConfirm
}) => {
  if (!showConfirmType) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-zinc-800 text-center space-y-4"
      >
        <div className="size-12 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
          {showConfirmType === 'cancel' ? '⚠️' : '❓'}
        </div>
        
        <div className="space-y-1.5">
          <h5 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
            {showConfirmType === 'cancel' 
              ? 'Hủy lịch hẹn' 
              : assignStatus === 'da_checkin' && isStatusChanged
                ? 'Check-in khách hàng'
                : 'Xác nhận thay đổi'}
          </h5>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed animate-fade-in">
            {(() => {
              if (showConfirmType === 'cancel') {
                return 'Bạn có chắc chắn muốn hủy lịch hẹn này không? Vui lòng nhập lý do bên dưới:';
              }

              if (isStatusChanged) {
                if (assignStatus === 'da_checkin') {
                  return 'Bạn có muốn check-in cho khách ngay bây giờ không?';
                }
                if (assignStatus === 'dang_kham') {
                  return 'Bạn có muốn chuyển lịch hẹn sang trạng thái đang thực hiện không?';
                }
                if (assignStatus === 'hoan_thanh') {
                  return 'Bạn có muốn hoàn thành lịch hẹn này không?';
                }
                if (assignStatus === 'da_huy') {
                  return 'Bạn có muốn hủy lịch hẹn này không?';
                }
                if (assignStatus === 'khong_den') {
                  return 'Bạn có muốn xác nhận khách không đến cho lịch hẹn này không?';
                }
                if (assignStatus === 'da_xac_nhan') {
                  return 'Bạn có muốn xác nhận lịch hẹn này không?';
                }
              }

              if (isRescheduled) {
                return 'Bạn có muốn đổi lịch hẹn này sang ngày/giờ mới không?';
              }

              return 'Bạn có chắc chắn muốn lưu thay đổi của lịch hẹn này không?';
            })()}
          </p>
        </div>

        {showConfirmType === 'cancel' && (
          <textarea
            value={customCancelReason}
            onChange={(e) => setCustomCancelReason(e.target.value)}
            placeholder="Nhập lý do hủy lịch tại đây..."
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold"
          />
        )}

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowConfirmType(null);
              setCustomCancelReason('');
            }}
            className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-855 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2 text-white text-xs font-bold rounded-xl transition-colors ${
              showConfirmType === 'cancel' 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            Đồng ý
          </button>
        </div>
      </motion.div>
    </div>
  );
};
