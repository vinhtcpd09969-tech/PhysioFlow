import { ArrowLeft } from 'lucide-react';

interface BookingHeaderProps {
  onBack: () => void;
}

export function BookingHeader({ onBack }: BookingHeaderProps) {
  return (
    <div className="flex justify-between items-center animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-[#2EC4B6] transition-all text-xs font-jakarta font-extrabold uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>
      <span className="text-[10px] bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/20 px-3.5 py-1.5 rounded-full font-jakarta font-black uppercase tracking-widest shadow-inner">
        Cổng đặt lịch trực tuyến
      </span>
    </div>
  );
}
