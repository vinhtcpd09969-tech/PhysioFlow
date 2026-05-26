import { useReducer, useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  User, 
  Info, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00'
];

interface BookingState {
  selectedDate: string;
  selectedTime: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  formData: {
    ho_ten_khach: string;
    so_dien_thoai: string;
    gioi_tinh_khach: string;
    trieu_chung: string;
    ly_do_kham: string;
    anh_dinh_kem_url: string;
  };
}

type BookingAction = 
  | { type: 'SET_DATE', date: string }
  | { type: 'SET_TIME', time: string }
  | { type: 'SET_FORM_FIELD', field: string, value: string }
  | { type: 'SET_SUBMITTING', isSubmitting: boolean }
  | { type: 'SET_SUCCESS', isSuccess: boolean };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, selectedDate: action.date, selectedTime: '' };
    case 'SET_TIME':
      return { ...state, selectedTime: action.time };
    case 'SET_FORM_FIELD':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'SET_SUCCESS':
      return { ...state, isSuccess: action.isSuccess };
    default:
      return state;
  }
}

const fullDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export default function Booking() {
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Custom Datepicker state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const [state, dispatch] = useReducer(bookingReducer, {
    selectedDate: new Date().toISOString().split('T')[0],
    selectedTime: '',
    isSubmitting: false,
    isSuccess: false,
    formData: {
      ho_ten_khach: user?.ho_ten || '',
      so_dien_thoai: (user as any)?.so_dien_thoai || '',
      gioi_tinh_khach: 'nam',
      trieu_chung: '',
      ly_do_kham: '',
      anh_dinh_kem_url: ''
    }
  });

  useEffect(() => {
    setIsClient(true);
    
    // Khôi phục dữ liệu đặt lịch tạm thời (nếu có) sau khi đăng nhập thành công
    const saved = localStorage.getItem('temp_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedDate) dispatch({ type: 'SET_DATE', date: parsed.selectedDate });
        if (parsed.selectedTime) dispatch({ type: 'SET_TIME', time: parsed.selectedTime });
        if (parsed.formData) {
          Object.keys(parsed.formData).forEach(key => {
            if (key === 'ho_ten_khach' && user?.ho_ten) return;
            dispatch({ type: 'SET_FORM_FIELD', field: key, value: parsed.formData[key] });
          });
        }
        toast.success('Đã khôi phục dữ liệu đăng ký lịch hẹn của bạn!');
      } catch (e) {
        console.error('Lỗi khôi phục lịch đặt tạm thời:', e);
      }
      localStorage.removeItem('temp_booking');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    dispatch({ type: 'SET_FORM_FIELD', field: e.target.name, value: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedTime) {
      toast.error('Vui lòng chọn khung giờ khám lâm sàng!');
      return;
    }

    // NẾU CHƯA ĐĂNG NHẬP -> Bật Modal Popup xin ý kiến chuyển hướng
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }

    const toastId = toast.loading('Đang gửi đăng ký lịch hẹn y khoa...');
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    
    const [year, month, day] = state.selectedDate.split('-');
    const [hours, minutes] = state.selectedTime.split(':');
    const ngay_gio_bat_dau = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)).toISOString();

    try {
      const response = await fetch('http://localhost:5000/api/client/appointments/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...state.formData,
          ngay_gio_bat_dau,
          nguoi_dung_id: user?.id,
        }),
      });

      if (response.ok) {
        toast.success('Đăng ký lịch khám thành công!', { id: toastId });
        dispatch({ type: 'SET_SUCCESS', isSuccess: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Không thể tạo lịch hẹn. Hãy thử lại.', { id: toastId });
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ trị liệu!', { id: toastId });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  };

  const handleRedirectToLogin = () => {
    localStorage.setItem('temp_booking', JSON.stringify({
      selectedDate,
      selectedTime,
      formData
    }));
    navigate('/login', { state: { from: '/booking' } });
  };

  const formatFullDate = (dateString: string) => {
    if (!isClient) return '';
    return fullDateFormatter.format(new Date(dateString));
  };

  const { selectedDate, selectedTime, isSubmitting, isSuccess, formData } = state;

  // Custom Grid Calendar Generator
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Pad previous month's days
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Align to Monday
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  };

  const daysGrid = getDaysInMonth(currentMonth);
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayStr = new Date().toISOString().split('T')[0];

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    
    // Prevent moving before current month
    const now = new Date();
    if (direction === 'prev' && newMonth.getFullYear() === now.getFullYear() && newMonth.getMonth() < now.getMonth()) {
      return;
    }
    setCurrentMonth(newMonth);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] shadow-soft-ui-hover p-8 text-center space-y-6 border border-gray-150 animate-slide-up">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center mx-auto shadow-inner border border-emerald-100/50">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-heading font-black text-secondary">Đăng ký thành công!</h2>
          
          <div className="text-sm font-medium text-gray-500 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            Cảm ơn bạn đã lựa chọn <span className="text-primary font-bold">Office Care</span>. Yêu cầu của bạn đã được chuyển tới bộ phận tiếp đón. Chúng tôi sẽ gửi thông báo phê duyệt ngay sau khi Lễ tân xác thực thông tin.
          </div>

          <div className="bg-primary/5 text-primary p-5 rounded-[20px] text-left text-xs border border-primary/10">
            <p className="font-extrabold mb-2 flex items-center gap-1">
              <Info size={14} /> Lưu ý trước khi đến khám:
            </p>
            <ul className="list-disc list-inside space-y-1.5 font-medium text-gray-600">
              <li>Mặc trang phục rộng rãi, co giãn tốt.</li>
              <li>Mang theo chẩn đoán, phim chụp MRI/X-Quang cũ (nếu có).</li>
              <li>Đến trước giờ khám 10 phút để làm hồ sơ y khoa.</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-secondary hover:opacity-90 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Vào Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-primary hover:opacity-90 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
            >
              Quay lại Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Upper quick controls */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 text-zinc-400 hover:text-primary transition-all text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
            Cổng đặt lịch trực tuyến
          </span>
        </div>

        {/* Hero Title */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-3xl sm:text-5xl font-heading font-black text-secondary tracking-tight">
            Đặt Lịch Khám Lượng Giá
          </h1>
          <p className="mt-3 text-base text-gray-500 font-semibold max-w-xl mx-auto leading-relaxed">
            Khám chẩn đoán lâm sàng 5 bước chuyên sâu và lập phác đồ y khoa cá nhân hóa cùng Bác sĩ Chuyên khoa hàng đầu.
          </p>
        </div>

        {/* Booking Interface columns (Asymmetric 33/66 layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Service information & Clinical Details (Anti-Sparsity Expansion) */}
          <div className="lg:col-span-4 space-y-6 animate-slide-up stagger-delay-1">
            
            {/* Main Service Card with Illustration */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-150 overflow-hidden relative group">
              <div className="h-44 bg-gradient-to-br from-secondary to-[#1E293B] relative p-6 flex flex-col justify-end">
                <div className="absolute inset-0 opacity-40 group-hover:scale-105 transition-transform duration-700 overflow-hidden">
                  <img 
                    src="/clinical_examination_illustration_1779796536526.png" 
                    alt="Khám Lâm Sàng" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent"></div>
                </div>
                
                <div className="relative z-10 text-white">
                  <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    PhysioFlow Rehab
                  </span>
                  <h2 className="text-lg font-heading font-black leading-tight mt-2.5">
                    Khám Lâm sàng & Lượng giá
                  </h2>
                  <p className="text-zinc-400 text-[10px] font-bold mt-1">Chẩn đoán nguyên nhân tận gốc</p>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3.5 text-gray-500">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold leading-relaxed">Tầng 3, Tòa nhà ABC, Quận 7, TP. Hồ Chí Minh</span>
                </div>
                
                <div className="flex items-start gap-3.5 text-gray-500">
                  <Activity className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold leading-relaxed">Trị liệu Cơ xương khớp cấp tính, cột sống & phục hồi vận động</span>
                </div>

                <div className="pt-5 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phí khám ban đầu</span>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      Miễn phí 100%
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-[#E6F4F1] text-secondary p-4 rounded-[20px] text-xs border border-primary/10 leading-relaxed font-medium">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Chúng tôi **MIỄN PHÍ 100%** chi phí khám ban đầu cùng Bác sĩ để giúp bạn chẩn đoán chính xác tình trạng đau nhức mà không lo về giá.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rich Content: 5-Step Clinical Process */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-150 p-6 space-y-6">
              <h3 className="text-sm font-heading font-black text-secondary uppercase tracking-wider flex items-center gap-2">
                <Stethoscope size={18} className="text-primary" />
                Quy trình lượng giá 5 bước
              </h3>
              
              <div className="relative border-l border-zinc-100 ml-2.5 pl-5 space-y-5 text-xs text-gray-500">
                <div className="relative">
                  <div className="absolute -left-[26px] top-0 size-3 bg-primary rounded-full border-2 border-white ring-4 ring-primary/10"></div>
                  <h4 className="font-extrabold text-secondary">Bước 1: Tiếp nhận triệu chứng</h4>
                  <p className="mt-1 leading-relaxed text-[11px]">Khai thác lịch sử đau nhức, thói quen sinh hoạt và các vùng nhức mỏi cục bộ.</p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[26px] top-0 size-3 bg-zinc-300 rounded-full border-2 border-white ring-4 ring-zinc-100"></div>
                  <h4 className="font-extrabold text-secondary">Bước 2: Lượng giá tầm vận động (ROM)</h4>
                  <p className="mt-1 leading-relaxed text-[11px]">Đo độ linh hoạt khớp xương, kiểm tra co rút cơ lực bằng thiết bị chuyên khoa.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[26px] top-0 size-3 bg-zinc-300 rounded-full border-2 border-white ring-4 ring-zinc-100"></div>
                  <h4 className="font-extrabold text-secondary">Bước 3: Chẩn đoán hình ảnh y khoa</h4>
                  <p className="mt-1 leading-relaxed text-[11px]">Đọc và đối chiếu kết quả phim X-Quang/MRI cũ để xác định tổn thương thực thể.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[26px] top-0 size-3 bg-zinc-300 rounded-full border-2 border-white ring-4 ring-zinc-100"></div>
                  <h4 className="font-extrabold text-secondary">Bước 4: Hội chẩn cùng Bác sĩ</h4>
                  <p className="mt-1 leading-relaxed text-[11px]">Bác sĩ chuyên khoa chẩn đoán gốc rễ nguyên nhân gây đau nhức lâm sàng.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[26px] top-0 size-3 bg-zinc-300 rounded-full border-2 border-white ring-4 ring-zinc-100"></div>
                  <h4 className="font-extrabold text-secondary">Bước 5: Thiết lập phác đồ cá nhân hóa</h4>
                  <p className="mt-1 leading-relaxed text-[11px]">Xây dựng liệu trình phục hồi, thời gian trị liệu và kế hoạch bài tập chi tiết.</p>
                </div>
              </div>
            </div>

            {/* Quality Commitments */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-150 p-6 space-y-4">
              <h3 className="text-sm font-heading font-black text-secondary uppercase tracking-wider flex items-center gap-2">
                <Award size={18} className="text-primary" />
                Cam kết y khoa tại PhysioFlow
              </h3>
              <ul className="space-y-3 text-[11px] font-semibold text-gray-500 leading-relaxed">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                  Đội ngũ Bác sĩ/KTV 100% có chứng chỉ hành nghề y khoa chuyên môn.
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                  Không chèo kéo dịch vụ, tập trung phục hồi gốc rễ bệnh lý.
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                  Thiết bị hiện đại nhập khẩu đạt chứng nhận an toàn FDA.
                </li>
              </ul>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Form with time slots */}
          <div className="lg:col-span-8 bg-white rounded-[24px] shadow-sm border border-gray-150 p-6 sm:p-8 animate-slide-up stagger-delay-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Step 1: Time selectors */}
              <div className="space-y-6">
                <h3 className="text-lg font-heading font-black text-secondary flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  1. Chọn thời gian khám lâm sàng
                </h3>
                
                {/* Modern Custom Grid Calendar (Bounce & Interaction Effect) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-zinc-50 p-3.5 rounded-xl border border-zinc-150">
                    <span className="text-sm font-black text-secondary uppercase tracking-wider">
                      {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </span>
                    
                    <div className="flex gap-1.5">
                      <button 
                        type="button"
                        onClick={() => handleMonthChange('prev')}
                        className="p-2 bg-white rounded-lg border border-gray-200 text-secondary hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all active:scale-90"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleMonthChange('next')}
                        className="p-2 bg-white rounded-lg border border-gray-200 text-secondary hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all active:scale-90"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Calendar Grid wrapper */}
                  <div className="border border-zinc-100 rounded-2xl p-4 bg-white shadow-xs">
                    {/* Days of week */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-2.5">
                      {weekDays.map(day => (
                        <span key={day} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest py-1 block">
                          {day}
                        </span>
                      ))}
                    </div>
                    
                    {/* Month Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {daysGrid.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} />;
                        
                        const dateStr = day.toISOString().split('T')[0];
                        const isPast = dateStr < todayStr;
                        const isSelected = selectedDate === dateStr;
                        
                        return (
                          <button
                            type="button"
                            key={dateStr}
                            disabled={isPast}
                            onClick={() => dispatch({ type: 'SET_DATE', date: dateStr })}
                            className={`py-3.5 text-xs font-black rounded-xl transition-all duration-250 select-none outline-none relative flex flex-col items-center justify-center
                              ${isPast 
                                ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-40' 
                                : isSelected
                                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-108 active:scale-95 z-10'
                                  : 'bg-white text-secondary border border-zinc-100 hover:border-primary/20 hover:bg-primary/5 hover:text-primary active:scale-95'
                              }`}
                          >
                            <span>{day.getDate()}</span>
                            {dateStr === todayStr && !isSelected && (
                              <span className="absolute bottom-1 size-1 bg-primary rounded-full"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Clock Slot Grid */}
                <div className="space-y-3 pt-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    Khung giờ trống ({formatFullDate(selectedDate)})
                  </label>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        type="button"
                        key={time}
                        onClick={() => dispatch({ type: 'SET_TIME', time })}
                        className={`py-3 px-2 text-xs font-extrabold rounded-xl border transition-all active:scale-95 duration-200
                          ${selectedTime === time 
                            ? 'bg-primary border-primary text-white shadow-xs scale-102 font-black' 
                            : 'bg-zinc-50 border-transparent text-secondary hover:border-primary/20 hover:bg-primary/5 hover:text-primary'
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-gray-150" />

              {/* Step 2: Customer Identity info */}
              <div className="space-y-6">
                <h3 className="text-lg font-heading font-black text-secondary flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  2. Thông tin bệnh nhân liên hệ
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="ho_ten_khach" className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Họ và tên *</label>
                    <input
                      id="ho_ten_khach"
                      type="text"
                      name="ho_ten_khach"
                      required
                      readOnly={!!user?.ho_ten}
                      placeholder="Nguyễn Văn A"
                      className={`w-full rounded-xl p-4 border font-bold text-secondary text-sm outline-none transition-colors ${
                        user?.ho_ten 
                          ? 'bg-zinc-100 text-gray-400 border-zinc-200 cursor-not-allowed' 
                          : 'border-gray-250 focus:border-primary'
                      }`}
                      value={formData.ho_ten_khach}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="so_dien_thoai" className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Số điện thoại *</label>
                    <input
                      id="so_dien_thoai"
                      type="tel"
                      name="so_dien_thoai"
                      required
                      placeholder="0901234567"
                      className="w-full rounded-xl border-gray-250 focus:border-primary p-4 border font-bold text-secondary text-sm outline-none transition-colors"
                      value={formData.so_dien_thoai}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Giới tính</span>
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer group">
                        <input 
                          type="radio" 
                          name="gioi_tinh_khach" 
                          value="nam" 
                          checked={formData.gioi_tinh_khach === 'nam'} 
                          onChange={handleChange} 
                          className="text-primary focus:ring-primary border-zinc-300 w-4 h-4 cursor-pointer" 
                        />
                        <span className="ml-2 text-xs font-bold text-secondary group-hover:text-primary transition-colors">Nam</span>
                      </label>
                      <label className="flex items-center cursor-pointer group">
                        <input 
                          type="radio" 
                          name="gioi_tinh_khach" 
                          value="nu" 
                          checked={formData.gioi_tinh_khach === 'nu'} 
                          onChange={handleChange} 
                          className="text-primary focus:ring-primary border-zinc-300 w-4 h-4 cursor-pointer" 
                        />
                        <span className="ml-2 text-xs font-bold text-secondary group-hover:text-primary transition-colors">Nữ</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-150" />

              {/* Step 3: Symptoms Description */}
              <div className="space-y-6">
                <h3 className="text-lg font-heading font-black text-secondary flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  3. Mô tả tình trạng đau nhức
                </h3>
                
                <div className="space-y-1.5">
                  <label htmlFor="trieu_chung" className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Triệu chứng & Vùng đau nhức (Vị trí, cảm giác tê mỏi...) *
                  </label>
                  <textarea
                    id="trieu_chung"
                    name="trieu_chung"
                    required
                    rows={4}
                    placeholder="VD: Tôi bị đau mỏi thắt lưng lan nhẹ xuống hông phải khi ngồi làm việc lâu, kèm cảm giác căng cứng cơ vào buổi sáng..."
                    className="w-full rounded-xl border-gray-250 focus:border-primary p-4 border font-medium text-secondary text-sm resize-none outline-none transition-colors leading-relaxed"
                    value={formData.trieu_chung}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Submit button layout */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-widest py-4 rounded-xl shadow-xs disabled:opacity-75 disabled:cursor-not-allowed flex justify-center items-center transition-all active:scale-98"
                >
                  {isSubmitting ? 'Đang gửi thông tin đăng ký...' : 'Xác nhận đăng ký lịch khám'}
                </button>
                <p className="text-center text-[10px] font-bold text-zinc-400 mt-4 leading-relaxed">
                  Bằng việc gửi đăng ký lịch hẹn, bạn đã đồng ý với chính sách và quy trình đón tiếp lâm sàng của Office Care.
                </p>
              </div>

            </form>
          </div>
        </div>

      </div>

      {/* POPUP MODAL REQUIRES ACCOUNT */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-md overflow-hidden border border-gray-150 animate-slide-up">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-[20px] flex items-center justify-center mx-auto border border-primary/20">
                <User size={30} />
              </div>
              <h3 className="text-2xl font-heading font-black text-secondary">Đăng nhập thành viên</h3>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                Để bảo vệ an toàn hồ sơ bệnh lý của bạn và thuận tiện cập nhật kết quả sau khám, xin vui lòng đăng nhập hoặc tạo tài khoản trước khi hoàn tất đăng ký.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col gap-3">
              <button 
                onClick={handleRedirectToLogin}
                className="w-full bg-primary hover:opacity-90 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
              >
                Đăng nhập hoặc Tạo tài khoản
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-zinc-50 hover:bg-zinc-100 text-secondary font-bold py-3.5 rounded-xl text-xs border border-gray-200 transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
