import { useState } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface DetailHeaderProps {
  maLichDat: string;
  tenKhachHang: string;
  soDienThoai: string;
  ngayGioBatDau: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
  onClose: () => void;
  selectedTimeSlot: string;
  setSelectedTimeSlot: (val: string) => void;
  timeSlotsList: string[];
  durationMs: number;
  tenDichVu?: string;
}

export function DetailHeader({
  maLichDat,
  tenKhachHang,
  soDienThoai,
  ngayGioBatDau,
  onClose,
  selectedTimeSlot,
  setSelectedTimeSlot,
  timeSlotsList,
  durationMs,
  tenDichVu
}: DetailHeaderProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);

  return (
    <>
      {/* Header Modal */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 transition-colors duration-300">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-zinc-150">
            Hồ sơ Lịch hẹn <span className="text-emerald-600 dark:text-emerald-450">#{maLichDat}</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold mt-1">Thông tin chi tiết và điều phối phòng khám</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Thông tin nhanh khách hàng */}
      <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-slate-150 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Khách hàng</label>
          <span className="text-sm font-black text-slate-800 dark:text-zinc-150 block mt-0.5">{tenKhachHang}</span>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-550 uppercase tracking-wider block">Số điện thoại</label>
          <span className="text-sm font-bold text-slate-800 dark:text-zinc-150 block mt-0.5">{soDienThoai}</span>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-455 dark:text-zinc-500 uppercase tracking-wider block">Dịch vụ đặt</label>
          <span className="text-sm font-black text-slate-800 dark:text-zinc-150 block mt-0.5 truncate max-w-[140px]" title={tenDichVu || 'Khám y tế mới'}>
            {tenDichVu || 'Khám y tế mới'}
          </span>
          <span className="text-[10px] text-slate-450 dark:text-zinc-500 block font-semibold mt-0.5">
            ⏳ {Math.round(durationMs / 60000)} phút
          </span>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-550 uppercase tracking-wider block">Khung giờ hẹn</label>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {!isEditingTime ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-450 font-mono bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-lg">
                  {selectedTimeSlot} - {(() => {
                    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
                    const date = new Date(2000, 0, 1, hours, minutes);
                    const end = new Date(date.getTime() + durationMs);
                    return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
                  })()}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTime(true)}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
                  title="Thay đổi khung giờ hẹn"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                >
                  {timeSlotsList.map(slot => {
                    const [hours, minutes] = slot.split(':').map(Number);
                    const date = new Date(2000, 0, 1, hours, minutes);
                    const end = new Date(date.getTime() + durationMs);
                    const slotEndStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
                    return (
                      <option key={slot} value={slot}>
                        {slot} - {slotEndStr}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={() => setIsEditingTime(false)}
                  className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center"
                  title="Xác nhận giờ mới"
                >
                  <Check size={12} />
                </button>
              </div>
            )}
            
            {(() => {
              const dateObj = new Date(ngayGioBatDau);
              if (isValid(dateObj)) {
                return (
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    ({format(dateObj, 'dd/MM/yyyy')})
                  </span>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
