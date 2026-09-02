import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { CustomDatePicker } from '../../../CustomDatePicker';

export const BUOI_INFO: Record<'sang' | 'chieu', { label: string; batDau: string; ketThuc: string; khungGio: string }> = {
  sang: { label: 'Buổi sáng', batDau: '07:30', ketThuc: '12:00', khungGio: '07:30 - 12:00' },
  chieu: { label: 'Buổi chiều', batDau: '12:00', ketThuc: '20:00', khungGio: '12:00 - 20:00' },
};

interface RescheduleSectionProps {
  rescheduleDate: string;
  setRescheduleDate: (date: string) => void;
  todayStr: string;
  maxDateStr: string;
  selectedBuoi: 'sang' | 'chieu' | '';
  setSelectedBuoi: (buoi: 'sang' | 'chieu') => void;
  selectedAppointment: any;
  origDateStr: string;
  getBuoiStaffCount: (buoi: 'sang' | 'chieu', dateStr: string) => number;
  isBuoiAllowed: (buoi: 'sang' | 'chieu') => boolean;
}

export const RescheduleSection: React.FC<RescheduleSectionProps> = ({
  rescheduleDate,
  setRescheduleDate,
  todayStr,
  maxDateStr,
  selectedBuoi,
  setSelectedBuoi,
  selectedAppointment,
  origDateStr,
  getBuoiStaffCount,
  isBuoiAllowed
}) => {
  return (
    <div className="md:col-span-5 md:border-l md:border-slate-100 dark:md:border-zinc-800/80 md:pl-6 space-y-5 flex flex-col justify-start">
      <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100 dark:border-zinc-800/40">
        <h4 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
          Đổi lịch
        </h4>
        <p className="text-[10px] text-slate-450 dark:text-zinc-555 font-semibold leading-relaxed">
          Chọn ngày và buổi mới (A7 — không còn chọn giờ cụ thể)
        </p>
      </div>

      {/* Date selector (limited to 1 month range) */}
      <div className="space-y-1.5 select-none">
        <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          Chọn ngày mới
        </label>
        <CustomDatePicker
          value={rescheduleDate}
          minDate={todayStr}
          maxDate={maxDateStr}
          onChange={(date) => setRescheduleDate(date)}
          buttonClassName="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
        />
      </div>

      {/* Chọn buổi */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          Chọn buổi mới
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {(['sang', 'chieu'] as const).map((buoi) => {
            const availableStaffCount = getBuoiStaffCount(buoi, rescheduleDate);
            const isSelected = selectedBuoi === buoi;
            const isAllowed = isBuoiAllowed(buoi);
            const isCurrentBuoi = buoi === selectedAppointment.buoi && rescheduleDate === origDateStr;

            let bgClass = '';
            let textClass = '';
            let label = '';

            if (isCurrentBuoi) {
              bgClass = isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400';
              label = 'Buổi hiện tại';
            } else if (!isAllowed) {
              bgClass = 'bg-slate-50 dark:bg-zinc-800/10 border-slate-100 dark:border-zinc-850 opacity-40 cursor-not-allowed';
              textClass = 'text-slate-400 dark:text-zinc-555';
              label = 'Đã qua giờ nhận khách';
            } else if (availableStaffCount === 0) {
              bgClass = 'bg-slate-50 dark:bg-zinc-800/10 border-slate-150 dark:border-zinc-850 opacity-50 cursor-not-allowed';
              textClass = 'text-slate-400 dark:text-zinc-555';
              label = 'Hết chỗ';
            } else if (isSelected) {
              bgClass = 'bg-emerald-600 border-emerald-600 text-white shadow-md';
              label = 'Buổi muốn đổi';
            } else if (availableStaffCount === 1) {
              bgClass = 'bg-amber-50/50 dark:bg-amber-955/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-450 hover:border-amber-400';
              label = 'Còn 1 nhân sự';
            } else {
              bgClass = 'bg-white dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 hover:border-emerald-400 dark:hover:border-emerald-500 text-slate-800 dark:text-zinc-200';
              label = `Còn ${availableStaffCount} nhân sự`;
            }

            const Icon = buoi === 'sang' ? Sun : Moon;

            return (
              <button
                key={buoi}
                type="button"
                disabled={!isAllowed || (availableStaffCount === 0 && !isCurrentBuoi)}
                onClick={() => setSelectedBuoi(buoi)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${bgClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h5 className={`text-xs font-black leading-snug ${textClass || (isSelected ? 'text-white' : 'text-slate-800 dark:text-zinc-100')}`}>
                      {BUOI_INFO[buoi].label}
                    </h5>
                    <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-zinc-500'}`}>
                      {BUOI_INFO[buoi].khungGio}
                    </p>
                  </div>
                </div>

                <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : isCurrentBuoi
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                      : 'bg-slate-100 dark:bg-zinc-700/60 text-slate-500 dark:text-zinc-400'
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/80 space-y-1">
        <p className="font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1">
          <Sparkles size={12} className="text-teal-600 dark:text-teal-400" />
          <span>Lưu ý khi đổi buổi:</span>
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Khách hàng sẽ được xếp số thứ tự mới trong buổi vừa chọn.</li>
          <li>Nhân sự sẽ được giữ nguyên hoặc gán mới nếu người cũ không trực ca đó.</li>
        </ul>
      </div>
    </div>
  );
};
