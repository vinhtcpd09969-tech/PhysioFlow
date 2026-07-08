import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatLocalDate, getMockAvailableSlots, getVietnameseDay } from '../../constants';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Step2DatePickerProps {
  selectedDate: string;
  setDateField: (date: string) => void;
  bookingType: 'kham' | 'dich_vu';
  hasExistingClinicalExam: boolean;
  setShowBlockWarning: (show: boolean) => void;
  setActiveStep: (step: number) => void;
  selectedServiceId: string;
  services: any[];
  duration: number;
}

export function Step2DatePicker({
  selectedDate,
  setDateField,
  bookingType,
  hasExistingClinicalExam,
  setShowBlockWarning,
  setActiveStep,
  selectedServiceId,
  services,
  duration
}: Step2DatePickerProps) {
  const dateContainerRef = useRef<HTMLDivElement>(null);

  const datesList = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate);
    }
    return dates;
  }, []);

  const scrollDates = (direction: 'left' | 'right') => {
    if (dateContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      dateContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      key="date-step"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left"
    >
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
            <CalendarIcon className="text-[#2EC4B6]" size={20} />
            Chọn ngày lượng giá
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Xem danh sách các ngày còn chỗ trống dưới đây.
          </p>
        </div>
        
        {/* Scrolling controls for desktop */}
        <div className="hidden sm:flex gap-1">
          <button
            type="button"
            onClick={() => scrollDates('left')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollDates('right')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Date Cards Horizontal Container */}
      <div
        ref={dateContainerRef}
        className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-2 px-2 hide-scrollbar snap-x"
      >
        {datesList.map((dateItem) => {
          const dateStr = formatLocalDate(dateItem);
          const spots = getMockAvailableSlots(dateStr);
          const isSelected = selectedDate === dateStr;
          const isClosed = spots === 0;

          return (
            <button
              type="button"
              key={dateStr}
              disabled={isClosed}
              onClick={() => setDateField(dateStr)}
              className={`flex-shrink-0 w-24 h-24 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 relative snap-start outline-none
                ${isClosed
                  ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                  : isSelected
                    ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-lg shadow-[#2EC4B6]/25 scale-[1.04] z-10'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-slate-50/50 hover:scale-[1.02]'
                }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                {dateStr === formatLocalDate(new Date()) ? 'Hôm nay' : getVietnameseDay(dateItem)}
              </span>
              <span className="text-2xl font-jakarta font-black mt-1">
                {dateItem.getDate()}
              </span>
              
              {isClosed && (
                <span className="text-[9px] font-extrabold mt-1.5 px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-400">
                  Nghỉ
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={() => {
            if (hasExistingClinicalExam) {
              setShowBlockWarning(true);
              return;
            }

            const toastId = toast.loading('Đang kiểm tra lịch làm việc...');
            const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
            const targetDichVuId = bookingType === 'dich_vu' ? selectedServiceId : (examService?.id || '');

            fetch(`${BASE_URL}/client/appointments/booked-slots?date=${selectedDate}&duration=${duration}&dichVuId=${targetDichVuId}`)
              .then(res => res.json())
              .then(data => {
                toast.dismiss(toastId);
                const specialists = data.specialists || [];
                if (specialists.length === 0) {
                  const dateParts = selectedDate.split('-');
                  const formattedDate = `${dateParts[2]}/${dateParts[1]}`;
                  const staffType = bookingType === 'kham' ? 'bác sĩ' : 'kỹ thuật viên';
                  toast.error(`Ngày ${formattedDate} không khả dụng vì chưa có ${staffType} trực làm việc. Vui lòng chọn ngày khác.`);
                } else {
                  setActiveStep(3);
                }
              })
              .catch(() => {
                toast.dismiss(toastId);
                // Fallback
                setActiveStep(3);
              });
          }}
          disabled={!selectedDate}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Chọn Khung Giờ
        </button>
      </div>
    </motion.div>
  );
}
