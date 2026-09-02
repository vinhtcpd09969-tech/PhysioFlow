import { AnimatePresence, motion } from 'framer-motion';
import { TERMS_OF_SERVICE, TERMS_EFFECTIVE_DATE } from '@/constants/termsContent';

interface TermsOfServiceModalProps {
  open: boolean;
  onClose: () => void;
}

/** Modal xem "Điều khoản dịch vụ & Quy định sử dụng" đầy đủ — cùng nội dung/kiểu dáng với popup
 * ở trang Đăng ký (Register.tsx), tách ra dùng chung cho các nơi chỉ cần XEM chính sách (không có
 * bước đồng ý/xác nhận như lúc đăng ký tài khoản). */
export function TermsOfServiceModal({ open, onClose }: TermsOfServiceModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col font-jakarta"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-heading font-black text-lg md:text-xl text-slate-900">
                  Điều khoản dịch vụ & Quy định sử dụng
                </h3>
                <p className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider mt-1">
                  Hiệu lực từ: {TERMS_EFFECTIVE_DATE}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 text-xs text-slate-600 font-semibold leading-relaxed">
              {TERMS_OF_SERVICE.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-black text-slate-800 text-sm">{section.heading}</h4>
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-slate-650">{p}</p>
                  ))}
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1">
                      {section.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="text-slate-650">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-teal-500/10 hover:shadow-[0_8px_20px_rgba(20,184,166,0.2)]"
              >
                Đã hiểu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
