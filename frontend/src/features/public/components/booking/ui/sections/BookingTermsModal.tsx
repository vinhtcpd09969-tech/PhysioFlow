import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { TERMS_OF_SERVICE, TermsSection } from '@/constants/termsContent';

interface BookingTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  checked: boolean;
  setChecked: (checked: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const BookingTermsModal: React.FC<BookingTermsModalProps> = ({
  isOpen,
  onClose,
  checked,
  setChecked,
  onConfirm,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Điều khoản dịch vụ &amp; Quy định thanh toán
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Vui lòng đọc kỹ các quy định trước khi thanh toán và đặt lịch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Terms Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed text-slate-600 font-medium text-left">
          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 text-teal-950 font-bold space-y-1.5">
            <p>1. Hồ sơ y tế điều trị gắn liền với tài khoản cá nhân, không thể đặt giùm hoặc chuyển nhượng.</p>
            <p>2. Khách hàng vui lòng đến đúng khung giờ của buổi đã đăng ký (Buổi Sáng: 7h30–12h00, Buổi Chiều: 12h00–20h00).</p>
            <p>3. Trong trường hợp có từ 2 lần vắng mặt không báo trước (No-show), hệ thống sẽ yêu cầu thanh toán trực tuyến trước khi đặt lịch lần sau.</p>
            <p>4. Mọi chính sách bảo lưu và hoàn trả thực hiện theo đúng quy định điều khoản dịch vụ của Trung tâm PHCN OfficeCare.</p>
          </div>

          <div className="space-y-4">
            {TERMS_OF_SERVICE.map((section: TermsSection) => (
              <div key={section.heading} className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  {section.heading}
                </h4>
                {section.paragraphs.map((p: string, idx: number) => (
                  <p key={idx} className="text-[11px] text-slate-600 leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                    {section.bullets.map((b: string, idx: number) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="size-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500/20 cursor-pointer"
            />
            <span className="text-xs font-black text-slate-800">
              Tôi đã đọc và đồng ý với tất cả điều khoản trên
            </span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={!checked || loading}
              onClick={onConfirm}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-teal-600 text-white font-black text-xs hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận đồng ý'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
