import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { CustomDatePicker } from '../../../../../components/CustomDatePicker';

interface RescheduleAppointmentModalProps {
  rescheduleAppt: any | null;
  rescheduleDate: string;
  setRescheduleDate: (val: string) => void;
  rescheduleBuoi: 'sang' | 'chieu';
  setRescheduleBuoi: (val: 'sang' | 'chieu') => void;
  rescheduleSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function RescheduleAppointmentModal({
  rescheduleAppt,
  rescheduleDate,
  setRescheduleDate,
  rescheduleBuoi,
  setRescheduleBuoi,
  rescheduleSubmitting,
  onClose,
  onSubmit
}: RescheduleAppointmentModalProps) {
  if (!rescheduleAppt) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Đổi Lịch Hẹn Trực Tuyến</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Mã lịch: <span className="font-mono text-teal-600 font-bold">{rescheduleAppt.ma_lich_dat}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                1. Chọn Ngày Hẹn / Trị Liệu Mới *
              </label>
              <CustomDatePicker
                value={rescheduleDate}
                onChange={(val: string) => setRescheduleDate(val)}
                minDate={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                2. Chọn Buổi Mới *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRescheduleBuoi('sang')}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    rescheduleBuoi === 'sang'
                      ? 'border-teal-500 bg-teal-50 text-teal-900 font-black ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">🌅 Buổi Sáng</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">07:30 – 12:00</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRescheduleBuoi('chieu')}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    rescheduleBuoi === 'chieu'
                      ? 'border-teal-500 bg-teal-50 text-teal-900 font-black ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">🌆 Buổi Chiều</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">12:00 – 20:00</div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={rescheduleSubmitting || !rescheduleDate}
              onClick={onSubmit}
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-2xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              {rescheduleSubmitting ? 'Đang đổi...' : 'Xác nhận đổi lịch'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
