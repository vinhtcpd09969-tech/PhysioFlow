import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-10 h-10 text-rose-600 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-10 h-10 text-emerald-600" />;
      case 'info':
        return <HelpCircle className="w-10 h-10 text-sky-600" />;
      default:
        return <HelpCircle className="w-10 h-10 text-amber-600" />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 focus:ring-rose-500/25 shadow-rose-600/25 text-white';
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 focus:ring-emerald-500/25 shadow-emerald-600/25 text-white';
      case 'info':
        return 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 focus:ring-sky-500/25 shadow-sky-600/25 text-white';
      default:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:ring-amber-500/25 shadow-amber-500/25 text-white';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative w-full max-w-md bg-white border border-zinc-150 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col items-center text-center space-y-4"
          >
            {/* Top Icon Area */}
            <div className={`p-4 rounded-full bg-slate-50/80 border border-zinc-100 flex items-center justify-center shrink-0`}>
              {getIcon()}
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h3 className="font-heading font-black text-lg text-slate-800 tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-zinc-500 font-medium text-xs leading-relaxed max-w-sm">
                {message}
              </p>
            </div>

            {/* Buttons Group */}
            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-slate-650 font-bold rounded-xl text-xs transition-all active:scale-95 border border-zinc-200"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2.5 text-white font-black rounded-xl text-xs shadow-lg transition-all active:scale-95 focus:ring-4 outline-none ${getButtonStyles()}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
