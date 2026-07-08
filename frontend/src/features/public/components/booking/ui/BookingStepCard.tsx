import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Phone } from 'lucide-react';
import { BookingState } from '../types';
import { Step1TypeSelection } from './steps/Step1TypeSelection';
import { Step2DatePicker } from './steps/Step2DatePicker';
import { Step3DateTimeSpecialist } from './steps/Step3DateTimeSpecialist';
import { Step4CustomerForm } from './steps/Step4CustomerForm';
import { Step5Confirmation } from './steps/Step5Confirmation';

interface BookingStepCardProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  bookingType: 'kham' | 'dich_vu';
  setBookingType: (type: 'kham' | 'dich_vu') => void;
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  services: any[];
  servicesLoading: boolean;
  state: BookingState;
  bookedSlots: string[];
  specialists: any[];
  slotAvailability: Record<string, number[]>;
  selectedStaffId: string;
  setSelectedStaffId: (id: string) => void;
  hasExistingClinicalExam: boolean;
  onViewAppointments: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleGenderChange: (gender: string) => void;
  handleFile: (file: File) => void;
  removeImage: () => void;
  setDateField: (date: string) => void;
  setTimeField: (time: string) => void;
  isSubmitting: boolean;
  user: any;
  tempHoldId: string;
  onTimeout?: () => void;
}

export function BookingStepCard({
  activeStep,
  setActiveStep,
  bookingType,
  setBookingType,
  selectedServiceId,
  setSelectedServiceId,
  services,
  servicesLoading,
  state,
  bookedSlots,
  specialists,
  slotAvailability,
  selectedStaffId,
  setSelectedStaffId,
  hasExistingClinicalExam,
  onViewAppointments,
  onChange,
  handleGenderChange,
  handleFile,
  removeImage,
  setDateField,
  setTimeField,
  isSubmitting,
  user,
  tempHoldId,
  onTimeout
}: BookingStepCardProps) {
  const { selectedDate, selectedTime, formData } = state;
  const [showBlockWarning, setShowBlockWarning] = useState<boolean>(false);

  // Auto-calculate service duration
  const duration = React.useMemo(() => {
    if (bookingType === 'kham') {
      return 30; // default for medical exams
    }
    const selectedService = services.find(s => s.id === selectedServiceId);
    return selectedService?.thoi_luong_phut || 30;
  }, [bookingType, selectedServiceId, services]);

  // Hide block warning when user changes date
  React.useEffect(() => {
    setShowBlockWarning(false);
  }, [selectedDate]);

  return (
    <>
      {/* Dynamic Overlay Modal with premium spring animation, glassmorphism, and branded elements */}
      <AnimatePresence>
        {showBlockWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with high-end glass blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlockWarning(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
              transition={{ duration: 0.3 }}
            />

            {/* Backdrop glow shapes behind modal for rich aesthetics */}
            <div className="absolute w-[300px] h-[300px] bg-[#2EC4B6]/10 rounded-full blur-[80px] -translate-x-12 -translate-y-12 pointer-events-none z-0 animate-pulse" />
            <div className="absolute w-[250px] h-[250px] bg-rose-500/5 rounded-full blur-[60px] translate-x-12 translate-y-12 pointer-events-none z-0" />

            {/* Modal Container Card - Premium Shadow & Scale Spring Entry */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", damping: 26, stiffness: 360 }}
              className="relative max-w-[500px] w-full bg-white/95 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border border-slate-100/80 shadow-[0_40px_90px_-15px_rgba(15,23,42,0.28)] z-10 text-center"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowBlockWarning(false)}
                className="absolute top-7 right-7 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-300 z-20"
              >
                <X size={18} />
              </button>

              {/* Office Care Branding Header */}
              <div className="flex justify-center items-center gap-3 mb-8 select-none">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#2EC4B6]/10 border border-[#2EC4B6]/25 text-[#2EC4B6] font-jakarta font-black text-2xl shadow-inner shadow-[#2EC4B6]/5 transition-transform hover:scale-105 duration-300">
                  O
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-jakarta font-black text-base text-slate-800 tracking-tight leading-none uppercase">
                    Office Care
                  </span>
                  <span className="text-[9px] text-[#2EC4B6] font-jakarta font-extrabold uppercase tracking-widest leading-none mt-1">
                    Premium Rehab
                  </span>
                </div>
              </div>

              {/* Title with Gradient Text */}
              <h3 className="font-jakarta font-black text-xl sm:text-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-700 bg-clip-text text-transparent mb-5 tracking-tight leading-snug">
                Lịch Hẹn Đã Đạt Giới Hạn
              </h3>

              {/* Warning Card Container */}
              <div className="bg-rose-50/40 border border-rose-100/50 rounded-[24px] p-5 text-left mb-6 shadow-[inset_0_1px_2px_rgba(244,63,94,0.02)]">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100/70 border border-rose-200/50 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                    <AlertTriangle size={18} strokeWidth={2.3} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-jakarta font-extrabold uppercase tracking-wider text-rose-800 text-[9px]">
                      Đạt giới hạn đặt lịch
                    </p>
                    <p className="text-slate-600 font-jakarta font-semibold text-xs sm:text-[13px] leading-relaxed">
                      Bạn đã đạt tối đa lượt khám của ngày <span className="text-rose-600 font-extrabold">{selectedDate ? selectedDate.split('-').reverse().slice(0, 2).join('/') : ''}</span>. Vui lòng liên hệ hotline để được hỗ trợ sắp xếp lịch khám phù hợp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hotline Action Row */}
              <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/15">
                    <Phone size={16} className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Hotline Hỗ Trợ 24/7</p>
                    <p className="text-sm font-jakarta font-black text-slate-800 mt-1 leading-none">0398 655 332</p>
                  </div>
                </div>
                <a 
                  href="tel:0398655332"
                  className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-jakarta font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-sm"
                >
                  Gọi ngay
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowBlockWarning(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-jakarta font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl flex-1 text-center transition-all active:scale-[0.98]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockWarning(false);
                    onViewAppointments();
                  }}
                  className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-jakarta font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl flex-1 text-center transition-all shadow-[0_4px_14px_rgba(46,196,182,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-[0_6px_20px_rgba(46,196,182,0.35)]"
                >
                  Lịch khám của tôi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Render Steps */}
      {activeStep === 1 && (
        <Step1TypeSelection
          bookingType={bookingType}
          setBookingType={setBookingType}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          services={services}
          servicesLoading={servicesLoading}
          setActiveStep={setActiveStep}
        />
      )}

      {activeStep === 2 && (
        <Step2DatePicker
          selectedDate={selectedDate}
          setDateField={setDateField}
          bookingType={bookingType}
          hasExistingClinicalExam={hasExistingClinicalExam}
          setShowBlockWarning={setShowBlockWarning}
          setActiveStep={setActiveStep}
          selectedServiceId={selectedServiceId}
          services={services}
          duration={duration}
        />
      )}

      {activeStep === 3 && (
        <Step3DateTimeSpecialist
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          setTimeField={setTimeField}
          bookingType={bookingType}
          bookedSlots={bookedSlots}
          specialists={specialists}
          slotAvailability={slotAvailability}
          selectedStaffId={selectedStaffId}
          setSelectedStaffId={setSelectedStaffId}
          hasExistingClinicalExam={hasExistingClinicalExam}
          duration={duration}
          setActiveStep={setActiveStep}
          tempHoldId={tempHoldId}
          services={services}
          selectedServiceId={selectedServiceId}
          user={user}
        />
      )}

      {activeStep === 4 && (
        <Step4CustomerForm
          formData={formData}
          onChange={onChange}
          handleGenderChange={handleGenderChange}
          handleFile={handleFile}
          removeImage={removeImage}
          selectedDate={selectedDate}
          bookingType={bookingType}
          hasExistingClinicalExam={hasExistingClinicalExam}
          user={user}
          setActiveStep={setActiveStep}
          selectedTime={selectedTime}
          selectedServiceId={selectedServiceId}
          services={services}
          duration={duration}
          tempHoldId={tempHoldId}
          onTimeout={onTimeout}
        />
      )}

      {activeStep === 5 && (
        <Step5Confirmation
          bookingType={bookingType}
          selectedServiceId={selectedServiceId}
          services={services}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedStaffId={selectedStaffId}
          specialists={specialists}
          formData={formData}
          setActiveStep={setActiveStep}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
