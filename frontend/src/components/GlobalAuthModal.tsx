import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, X } from 'lucide-react';

interface GlobalAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalAuthModal({ isOpen, onClose }: GlobalAuthModalProps) {
  const [active, setActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Trigger dynamic iOS style spring bounce transition slightly after mounting
      const timer = setTimeout(() => setActive(true), 50);
      return () => clearTimeout(timer);
    } else {
      setActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = (path: string) => {
    // Smooth transition out
    setActive(false);
    setTimeout(() => {
      onClose();
      navigate(path, { state: { from: '/booking' } });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dynamic Backdrop with high-end glass blur */}
      <div 
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500 cursor-pointer ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Container Card - Bo góc tối đa rounded-[32px] sm:rounded-[40px] */}
      <div
        style={{
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        className={`relative max-w-[540px] w-full bg-white rounded-[32px] sm:rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-[0_30px_70px_-10px_rgba(15,23,42,0.22)] z-10 transition-all duration-500 transform ${
          active 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-90 opacity-0 -translate-y-12'
        }`}
      >
        {/* Subtle Close Button in Top-Right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-300"
        >
          <X size={20} />
        </button>

        {/* Soft Teal Circular Container with User Icon */}
        <div className="w-20 h-20 bg-[#2EC4B6]/10 text-[#2EC4B6] rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <User size={36} strokeWidth={2.2} />
        </div>

        {/* Modern Bold Typography Header */}
        <h3 className="font-heading font-black text-2xl sm:text-[28px] text-secondary text-center mb-4 tracking-tight leading-snug">
          Đăng ký & Đăng nhập trước
        </h3>

        {/* Subtitle / UX copy explaining exactly why this is needed */}
        <p className="text-slate-500 font-semibold text-sm leading-relaxed text-center mb-10 px-2 max-w-[400px] mx-auto">
          Để tránh mất công điền thông tin lâm sàng cả buổi khi chưa có tài khoản, vui lòng đăng ký hoặc đăng nhập trước để tiếp tục khám lượng giá nhé!
        </p>

        {/* Premium Action Buttons - Side-by-Side on desktop, stacked on mobile */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={() => handleAction('/register')}
            className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold text-[13px] tracking-wide py-4 px-6 rounded-2xl flex-1 text-center transition-all shadow-[0_4px_14px_rgba(46,196,182,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-[0_6px_20px_rgba(46,196,182,0.4)]"
          >
            ĐĂNG KÝ TÀI KHOẢN MỚI
          </button>
          <button
            onClick={() => handleAction('/login')}
            className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-[13px] tracking-wide py-4 px-6 rounded-2xl flex-1 text-center transition-all shadow-[0_4px_14px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-[0_6px_20px_rgba(15,23,42,0.4)]"
          >
            ĐĂNG NHẬP NGAY
          </button>
        </div>
      </div>
    </div>
  );
}
