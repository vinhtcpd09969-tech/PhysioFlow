import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatFullDate, isSlotInPast, isSlotUrgent } from '../../constants';
import { convertToVietnamUtcIso } from '../../../../../../utils/date';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Step3DateTimeSpecialistProps {
  selectedDate: string;
  selectedTime: string;
  setTimeField: (time: string) => void;
  bookingType: 'kham' | 'dich_vu';
  bookedSlots: string[];
  specialists: any[];
  slotAvailability: Record<string, number[]>;
  selectedStaffId: string;
  setSelectedStaffId: (id: string) => void;
  hasExistingClinicalExam: boolean;
  duration: number;
  setActiveStep: (step: number) => void;
  tempHoldId: string;
  services: any[];
  selectedServiceId: string;
  user: any;
}

export function Step3DateTimeSpecialist({
  selectedDate,
  selectedTime,
  setTimeField,
  bookingType,
  bookedSlots,
  specialists,
  slotAvailability,
  selectedStaffId,
  setSelectedStaffId,
  hasExistingClinicalExam,
  duration,
  setActiveStep,
  tempHoldId,
  services,
  selectedServiceId,
  user
}: Step3DateTimeSpecialistProps) {
  const location = useLocation();
  const interval = duration;

  const handleNextStep = async () => {
    if (selectedDate && selectedTime) {
      const slotStart = selectedTime.split(' - ')[0];
      const ngay_gio_bat_dau = convertToVietnamUtcIso(selectedDate, slotStart);
      try {
        const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
        const targetDichVuId = bookingType === 'dich_vu' ? selectedServiceId : (examService?.id || null);

        await fetch(`${BASE_URL}/client/appointments/hold`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: tempHoldId,
            ngay_gio_bat_dau,
            goi_dich_vu_id: targetDichVuId,
            nhan_su_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
            khach_hang_id: user?.id || null,
            so_dien_thoai: user?.so_dien_thoai || null
          })
        });
      } catch (err) {
        console.error('Failed to create temporary hold:', err);
      }
    }
    setActiveStep(4);
  };

  const { morningSlots, afternoonSlots, eveningSlots } = useMemo(() => {
    if (!selectedDate) {
      return { morningSlots: [], afternoonSlots: [], eveningSlots: [] };
    }

    const generateSlots = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      const slots: string[] = [];
      let current = new Date();
      current.setHours(startHour, startMinute, 0, 0);

      const end = new Date();
      end.setHours(endHour, endMinute, 0, 0);

      while (true) {
        const slotStart = new Date(current);
        const slotNextStart = new Date(current.getTime() + interval * 60000);

        if (slotNextStart.getTime() > end.getTime()) {
          break;
        }

        const formatTime = (d: Date) => {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };

        const slotEnd = new Date(slotStart.getTime() + duration * 60000);
        slots.push(`${formatTime(slotStart)} - ${formatTime(slotEnd)}`);
        current = slotNextStart;
      }
      return slots;
    };

    return {
      morningSlots: generateSlots(8, 0, 12, 0),
      afternoonSlots: generateSlots(12, 0, 18, 0),
      eveningSlots: generateSlots(18, 0, 20, 0)
    };
  }, [selectedDate, interval]);

  const availableSpecialists = useMemo(() => {
    if (!selectedTime) {
      return specialists;
    }
    const slotStartKey = selectedTime.split(' - ')[0];
    const availableIds = slotAvailability[slotStartKey] || [];
    return specialists.filter(spec => availableIds.includes(spec.id));
  }, [specialists, slotAvailability, selectedTime]);

  return (
    <motion.div
      key="time-step"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
          <Clock className="text-[#2EC4B6]" size={20} />
          {bookingType === 'kham' ? 'Chọn giờ khám lâm sàng' : 'Chọn giờ trị liệu'}
        </h3>
        <p className="text-xs font-medium text-slate-400">
          Khung giờ trống cho ngày {formatFullDate(selectedDate)}
        </p>
      </div>

      {hasExistingClinicalExam && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold animate-fade-in">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold uppercase tracking-wider text-rose-800 text-[10px]">Cảnh báo: Đạt giới hạn đặt lịch</p>
            <p className="mt-0.5 font-medium text-rose-700">
              Bạn đã đạt giới hạn đặt tối đa 3 dịch vụ ngày <span className="font-extrabold text-rose-900">{formatFullDate(selectedDate)}</span>. Vui lòng chọn ngày khác hoặc liên hệ hotline <span className="font-extrabold text-slate-900">0398 655 332</span> để được hỗ trợ sắp xếp.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6 pt-2">
        {/* Morning slots */}
        {morningSlots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Buổi sáng (08:00 - 12:00)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {morningSlots.map((time) => {
                const isBooked = bookedSlots.includes(time.split(' - ')[0]);
                const isPast = isSlotInPast(time.split(' - ')[0], selectedDate);
                const isDisabled = isBooked || isPast;
                const isSelected = selectedTime === time;

                return (
                  <button
                    type="button"
                    key={time}
                    disabled={isDisabled}
                    onClick={() => setTimeField(time)}
                    className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                      ${isDisabled
                        ? 'bg-slate-50/50 border-slate-105 text-slate-300/80 cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                      }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Afternoon slots */}
        {afternoonSlots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Buổi chiều (12:00 - 18:00)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {afternoonSlots.map((time) => {
                const isBooked = bookedSlots.includes(time.split(' - ')[0]);
                const isPast = isSlotInPast(time.split(' - ')[0], selectedDate);
                const isDisabled = isBooked || isPast;
                const isSelected = selectedTime === time;

                return (
                  <button
                    type="button"
                    key={time}
                    disabled={isDisabled}
                    onClick={() => setTimeField(time)}
                    className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                      ${isDisabled
                        ? 'bg-slate-50/50 border-slate-105 text-slate-300/80 cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                      }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Evening slots */}
        {eveningSlots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-750" /> Buổi tối (18:00 - 20:00)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {eveningSlots.map((time) => {
                const isBooked = bookedSlots.includes(time.split(' - ')[0]);
                const isPast = isSlotInPast(time.split(' - ')[0], selectedDate);
                const isDisabled = isBooked || isPast;
                const isSelected = selectedTime === time;

                return (
                  <button
                    type="button"
                    key={time}
                    disabled={isDisabled}
                    onClick={() => setTimeField(time)}
                    className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                      ${isDisabled
                        ? 'bg-slate-50/50 border-slate-105 text-slate-300/80 cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                      }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown chọn nhân sự (Bác sĩ/KTV) */}
      <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-[20px] mt-6 space-y-3 font-jakarta">
        <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest">
          {bookingType === 'kham' ? '👨‍⚕️ Bác sĩ thực hiện lượng giá' : '💆 Kỹ thuật viên trị liệu'}
        </label>
        <div className="relative">
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            disabled={!selectedTime}
            className="w-full bg-white border border-slate-200 text-slate-700 font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-sm focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]/20 transition-all cursor-pointer disabled:bg-slate-100/60 disabled:cursor-not-allowed"
          >
            <option value="">
              {selectedTime 
                ? `Hệ thống chọn sau (Chưa chỉ định - Có ${availableSpecialists.length} chuyên gia phù hợp)` 
                : 'Vui lòng chọn khung giờ để hiển thị danh sách chuyên gia'}
            </option>
            {availableSpecialists.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.ho_ten} {spec.id === Number(location.state?.selectedDoctorId) ? '(Chuyên gia được chọn ban đầu)' : ''}
              </option>
            ))}
          </select>
        </div>
        {selectedTime && (
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
            {availableSpecialists.length > 0
              ? `Khung giờ ${selectedTime} có ${availableSpecialists.length} chuyên gia phù hợp ca trực và chưa bận lịch.`
              : 'Không có chuyên gia nào phù hợp cho khung giờ này. Vui lòng chọn khung giờ khác hoặc liên hệ hotline.'}
          </p>
        )}
      </div>

      {selectedTime && isSlotUrgent(selectedTime.split(' - ')[0], selectedDate) && (
        <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold animate-fade-in mt-4">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold uppercase tracking-wider text-amber-800 text-[10px]">Cảnh báo: Lịch hẹn cận giờ (Dưới 2 tiếng)</p>
            <p className="mt-0.5 font-medium text-amber-700">
              Khung giờ bạn chọn bắt đầu rất gần thời điểm hiện tại. Vui lòng di chuyển sớm để có mặt trước 10 phút. Hotline hỗ trợ gấp: <span className="font-extrabold text-slate-900">0398 655 332</span>.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          disabled={!selectedTime || (hasExistingClinicalExam && bookingType === 'kham')}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Điền Thông Tin
        </button>
      </div>
    </motion.div>
  );
}
