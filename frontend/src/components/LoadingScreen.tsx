import { useEffect, useState } from 'react';
import { OfficeCareLogoMark } from './OfficeCareLogo';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    // Show a helpful message if loading takes longer than 3 seconds
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-md transition-all duration-500">
      {/* Ambient background decoration shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-teal-200/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-emerald-200/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex flex-col items-center max-w-sm px-6 text-center z-10">
        {/* Animated Custom Ring with Logo Mark inside */}
        <div className="relative size-20 mb-5 flex items-center justify-center">
          {/* Inner circle pulsing */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-emerald-500 rounded-2xl opacity-20 animate-ping"></div>
          
          {/* Main spinning ring with gradient */}
          <div className="absolute -inset-1.5 border-2 border-slate-100 rounded-3xl"></div>
          <div className="absolute -inset-1.5 border-2 border-t-teal-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-3xl animate-spin"></div>

          <OfficeCareLogoMark size={52} className="relative z-10 drop-shadow-md" />
        </div>

        {/* Text and ambient transitions */}
        <h3 className="font-heading font-black text-slate-800 text-[18px] tracking-tight mb-1 select-none flex items-center gap-1.5">
          OFFICE CARE <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">2026</span>
        </h3>
        <p className="font-sans text-[13px] text-slate-500 font-medium tracking-wide animate-pulse">
          {message || 'Đang tải dữ liệu...'}
        </p>

        {showSlowMessage && (
          <p className="font-sans text-[11px] text-slate-400 mt-4 leading-normal select-none animate-in fade-in duration-500">
            Hệ thống đang chuẩn bị tài nguyên cho bạn nhé, vui lòng chờ trong giây lát!
          </p>
        )}
      </div>
    </div>
  );
}
