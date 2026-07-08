import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Upload, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatFullDate } from '../../constants';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Step4CustomerFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleGenderChange: (gender: string) => void;
  handleFile: (file: File) => void;
  removeImage: () => void;
  selectedDate: string;
  bookingType: 'kham' | 'dich_vu';
  hasExistingClinicalExam: boolean;
  user: any;
  setActiveStep: (step: number) => void;
  selectedTime: string;
  selectedServiceId: string;
  services: any[];
  duration: number;
  tempHoldId?: string;
  onTimeout?: () => void;
}

export function Step4CustomerForm({
  formData,
  onChange,
  handleGenderChange,
  handleFile,
  removeImage,
  selectedDate,
  bookingType,
  hasExistingClinicalExam,
  user,
  setActiveStep,
  selectedTime,
  selectedServiceId,
  services,
  duration,
  tempHoldId,
  onTimeout
}: Step4CustomerFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeout) onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeout]);
  const [errors, setErrors] = useState<{
    ho_ten_khach?: string;
    so_dien_thoai?: string;
    trieu_chung?: string;
  }>({});

  const validateField = (name: string, value: string) => {
    let error = '';
    const trimmed = value.trim();

    if (name === 'ho_ten_khach') {
      if (!trimmed) {
        error = 'Vui lòng nhập Họ và tên!';
      } else {
        const nameRegex = /^[\p{L}\s']{2,}$/u;
        if (!nameRegex.test(trimmed)) {
          error = 'Họ và tên phải có ít nhất 2 ký tự và chỉ chứa chữ cái!';
        }
      }
    } else if (name === 'so_dien_thoai') {
      if (!trimmed) {
        error = 'Vui lòng nhập Số điện thoại!';
      } else {
        const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
        if (!phoneRegex.test(trimmed)) {
          error = 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09!';
        }
      }
    } else if (name === 'trieu_chung') {
      if (!trimmed) {
        error = 'Vui lòng nhập Mô tả triệu chứng!';
      } else if (trimmed.length < 10) {
        error = 'Mô tả triệu chứng phải có ít nhất 10 ký tự!';
      }
    }
    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(e);
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleNextStep = () => {
    const nameTrimmed = formData.ho_ten_khach.trim();
    const phoneTrimmed = formData.so_dien_thoai.trim();
    const symptomTrimmed = formData.trieu_chung.trim();

    const nameError = validateField('ho_ten_khach', nameTrimmed);
    const phoneError = validateField('so_dien_thoai', phoneTrimmed);
    const symptomError = validateField('trieu_chung', symptomTrimmed);

    if (nameError || phoneError || symptomError) {
      setErrors({
        ho_ten_khach: nameError,
        so_dien_thoai: phoneError,
        trieu_chung: symptomError
      });
      return;
    }

    const toastId = toast.loading('Đang kiểm tra trùng lịch hẹn...');
    const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
    const targetDichVuId = bookingType === 'dich_vu' ? selectedServiceId : (examService?.id || '');

    fetch(`${BASE_URL}/client/appointments/booked-slots?date=${selectedDate}&phone=${phoneTrimmed}&duration=${duration}&dichVuId=${targetDichVuId}&excludeSessionId=${tempHoldId}`)
      .then(res => res.json())
      .then(data => {
        toast.dismiss(toastId);
        const bookedList = data.bookedSlots || [];
        const slotStartKey = selectedTime.split(' - ')[0];
        
        if (bookedList.includes(slotStartKey)) {
          toast.error('Bạn đã có lịch hẹn hoặc ca điều trị khác trong khung giờ này. Vui lòng quay lại chọn khung giờ khác.');
        } else {
          setActiveStep(5);
        }
      })
      .catch(() => {
        toast.dismiss(toastId);
        // Fallback
        setActiveStep(5);
      });
  };

  const handleBack = async () => {
    if (tempHoldId) {
      try {
        await fetch(`${BASE_URL}/client/appointments/hold/${tempHoldId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to release hold on back navigation:', err);
      }
    }
    setActiveStep(3);
  };

  return (
    <motion.div
      key="info-step"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
          <UserIcon className="text-[#2EC4B6]" size={20} />
          Thông tin bệnh nhân liên hệ
        </h3>
        <p className="text-xs font-medium text-slate-400">
          Vui lòng nhập thông tin liên hệ và mô tả sơ bộ tình trạng đau nhức.
        </p>
      </div>



      {hasExistingClinicalExam && bookingType === 'kham' && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold animate-fade-in">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold uppercase tracking-wider text-rose-800 text-[10px]">Cảnh báo: Trùng lịch hẹn</p>
            <p className="mt-0.5 font-medium text-rose-700">
              Bạn đang có lịch hẹn ngày <span className="font-extrabold text-rose-900">{formatFullDate(selectedDate)}</span>. Vui lòng liên hệ hotline <span className="font-extrabold text-slate-900">0398 655 332</span> nếu muốn đặt tiếp 1 lịch khác.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
        {/* Name input */}
        <div className="relative">
          <input
            id="ho_ten_khach"
            type="text"
            name="ho_ten_khach"
            required
            placeholder=" "
            disabled={!!user}
            className={`peer block w-full rounded-xl border bg-white px-4 pt-6 pb-2 text-sm font-bold focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
              ${errors.ho_ten_khach
                ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                : 'border-slate-200 focus:border-[#2EC4B6] text-slate-800'
              }`}
            value={formData.ho_ten_khach}
            onChange={handleInputChange}
          />
          <label
            htmlFor="ho_ten_khach"
            className={`absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px]
              ${errors.ho_ten_khach
                ? 'text-rose-400 peer-focus:text-rose-500'
                : 'text-slate-400 peer-focus:text-[#2EC4B6]'
              }`}
          >
            Họ và tên *
          </label>
          {user?.ho_ten && (
            <span className="absolute right-3 top-4 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full select-none">
              Tài khoản
            </span>
          )}
          {errors.ho_ten_khach && (
            <span className="text-[10px] font-extrabold text-rose-500 mt-1 block pl-1">
              {errors.ho_ten_khach}
            </span>
          )}
        </div>

        {/* Phone input */}
        <div className="relative">
          <input
            id="so_dien_thoai"
            type="tel"
            name="so_dien_thoai"
            required
            placeholder=" "
            disabled={!!user}
            className={`peer block w-full rounded-xl border bg-white px-4 pt-6 pb-2 text-sm font-bold focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
              ${errors.so_dien_thoai
                ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                : 'border-slate-200 focus:border-[#2EC4B6] text-slate-800'
              }`}
            value={formData.so_dien_thoai}
            onChange={handleInputChange}
          />
          <label
            htmlFor="so_dien_thoai"
            className={`absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px]
              ${errors.so_dien_thoai
                ? 'text-rose-400 peer-focus:text-rose-500'
                : 'text-slate-400 peer-focus:text-[#2EC4B6]'
              }`}
          >
            Số điện thoại *
          </label>
          {errors.so_dien_thoai && (
            <span className="text-[10px] font-extrabold text-rose-500 mt-1 block pl-1">
              {errors.so_dien_thoai}
            </span>
          )}
        </div>

        {/* Gender Segments */}
        <div className="sm:col-span-2 space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Giới tính
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleGenderChange('nam')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border duration-200 active:scale-98
                ${formData.gioi_tinh_khach === 'nam'
                  ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/10 font-extrabold'
                  : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                }`}
            >
              Nam
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange('nu')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border duration-200 active:scale-98
                ${formData.gioi_tinh_khach === 'nu'
                  ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/10 font-extrabold'
                  : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                }`}
            >
              Nữ
            </button>
          </div>
        </div>

        {/* Symptom Textarea */}
        <div className="sm:col-span-2 relative">
          <textarea
            id="trieu_chung"
            name="trieu_chung"
            required
            rows={4}
            placeholder=" "
            className={`peer block w-full rounded-xl border bg-white px-4 pt-6 pb-2 text-sm font-medium focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm resize-none
              ${errors.trieu_chung
                ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                : 'border-slate-200 focus:border-[#2EC4B6] text-slate-700'
              }`}
            value={formData.trieu_chung}
            onChange={handleInputChange}
          />
          <label
            htmlFor="trieu_chung"
            className={`absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px]
              ${errors.trieu_chung
                ? 'text-rose-400 peer-focus:text-rose-500'
                : 'text-slate-400 peer-focus:text-[#2EC4B6]'
              }`}
          >
            Mô tả triệu chứng, vùng đau nhức (VD: đau mỏi cổ vai gáy...) *
          </label>
          {errors.trieu_chung && (
            <span className="text-[10px] font-extrabold text-rose-500 mt-1 block pl-1">
              {errors.trieu_chung}
            </span>
          )}
        </div>

        {/* Symptom image upload */}
        <div className="sm:col-span-2 space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Ảnh đính kèm triệu chứng (nếu có - tối đa 5MB)
          </span>
          
          {!formData.anh_dinh_kem_url ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 bg-slate-50/50 hover:bg-slate-50
                ${dragActive 
                  ? 'border-[#2EC4B6] bg-[#2EC4B6]/5 scale-[1.01]' 
                  : 'border-slate-200 hover:border-[#2EC4B6]'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileInputChange}
              />
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/60 transition-colors">
                <Upload size={18} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700">Kéo thả ảnh hoặc click để tải lên</p>
                <p className="text-[10px] text-slate-400 font-semibold">Chấp nhận JPG, PNG, WEBP tối đa 5MB</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 border border-slate-200 bg-slate-50/30 rounded-2xl relative group">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative bg-white">
                <img src={formData.anh_dinh_kem_url} alt="Uploaded symptom" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-xs font-bold text-slate-700 truncate font-jakarta">Ảnh triệu chứng đã tải lên</p>
                <p className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1 font-jakarta">
                  <CheckCircle2 size={12} /> Sẵn sàng đính kèm
                </p>
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 flex items-center justify-center transition-all border border-slate-200/60"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
        >
          Quay lại
        </button>
        <button
          type="button"
          disabled={hasExistingClinicalExam && bookingType === 'kham'}
          onClick={handleNextStep}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Xác nhận
        </button>
      </div>
    </motion.div>
  );
}
