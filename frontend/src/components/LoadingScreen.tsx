import { useEffect, useState } from 'react';

export default function LoadingScreen() {
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
        {/* Animated Custom Ring (PhysioFlow Premium Aesthetic) */}
        <div className="relative w-16 h-16 mb-6">
          {/* Inner circle pulsing */}
          <div className="absolute inset-2 bg-gradient-to-tr from-teal-400 to-emerald-500 rounded-full opacity-20 animate-ping"></div>
          
          {/* Main spinning ring with gradient */}
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-teal-500 border-r-emerald-500 rounded-full animate-spin"></div>
        </div>

        {/* Text and ambient transitions */}
        <h3 className="font-sans font-bold text-slate-800 text-[18px] tracking-wide mb-1 select-none">
          OFFICE CARE
        </h3>
        <p className="font-sans text-[13px] text-slate-500 font-medium tracking-wide animate-pulse">
          Đang tải dữ liệu...
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
