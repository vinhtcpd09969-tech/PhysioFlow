import React, { useReducer, useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, User, Info, CheckCircle2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';

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

// Hoist formatting helpers
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
  
  const [state, dispatch] = useReducer(bookingReducer, {
    selectedDate: new Date().toISOString().split('T')[0],
    selectedTime: '',
    isSubmitting: false,
    isSuccess: false,
    formData: {
      ho_ten_khach: user?.ho_ten || '',
      so_dien_thoai: '',
      gioi_tinh_khach: 'nam',
      trieu_chung: '',
      ly_do_kham: '',
      anh_dinh_kem_url: ''
    }
  });

  useEffect(() => {
    setIsClient(true);
    
    // Khôi phục dữ liệu đặt lịch tạm thời (nếu có) sau khi đăng nhập thành công quay lại
    const saved = localStorage.getItem('temp_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedDate) dispatch({ type: 'SET_DATE', date: parsed.selectedDate });
        if (parsed.selectedTime) dispatch({ type: 'SET_TIME', time: parsed.selectedTime });
        if (parsed.formData) {
          Object.keys(parsed.formData).forEach(key => {
            // Không khôi phục ho_ten_khach nếu đã có thông tin user mới đăng nhập
            if (key === 'ho_ten_khach' && user?.ho_ten) return;
            dispatch({ type: 'SET_FORM_FIELD', field: key, value: parsed.formData[key] });
          });
        }
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
      alert('Vui lòng chọn giờ khám!');
      return;
    }

    // NẾU CHƯA ĐĂNG NHẬP -> Bật Modal Popup xin ý kiến chuyển hướng
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }

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
        dispatch({ type: 'SET_SUCCESS', isSuccess: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const error = await response.json();
        alert(error.message || 'Có lỗi xảy ra khi đặt lịch.');
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  };

  const handleRedirectToLogin = () => {
    // Lưu tạm vào localStorage để đăng nhập xong khôi phục lại
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] shadow-soft-ui-hover p-8 text-center space-y-6 border border-gray-100/50 animate-slide-up">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-secondary font-heading">Đặt lịch thành công!</h2>
          <p className="text-zinc-500 font-semibold text-sm leading-relaxed">
            Cảm ơn bạn đã tin tưởng PhysioWaves. Lễ tân của chúng tôi sẽ gọi điện xác nhận trong vòng 15 phút tới.
          </p>
          <div className="bg-primary/10 text-primary p-5 rounded-[20px] text-left text-sm border border-primary/20">
            <p className="font-bold mb-2">Lời khuyên trước khi đến khám:</p>
            <ul className="list-disc list-inside space-y-1.5 font-semibold text-primary/80">
              <li>Mặc trang phục rộng rãi, thoải mái.</li>
              <li>Mang theo phim chụp X-Quang/MRI (nếu có).</li>
              <li>Đến sớm 10 phút để làm thủ tục.</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary hover:bg-[#25A89C] text-white font-bold py-4 rounded-[16px] shadow-soft-button transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-3xl font-extrabold text-secondary sm:text-5xl font-heading tracking-tight">Đặt lịch Khám lượng giá</h1>
          <p className="mt-4 text-lg text-zinc-500 font-semibold">Chẩn đoán chính xác - Điều trị tận gốc cùng chuyên gia</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: THÔNG TIN DỊCH VỤ - Soft UI Card */}
          <div className="lg:col-span-4 space-y-6 opacity-0 animate-slide-up stagger-delay-2">
            <div className="bg-white rounded-[32px] shadow-soft-ui border border-gray-100/50 overflow-hidden">
              <div className="h-44 bg-gradient-to-br from-secondary to-primary/80 relative p-6 flex flex-col justify-end">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 text-white">
                  <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">Clinic</span>
                  <h2 className="text-xl font-bold leading-tight mt-3">Khám Lâm sàng & Lượng giá Y khoa</h2>
                  <p className="text-white/70 text-xs font-semibold mt-1">PhysioWaves Clinic</p>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-start gap-4 text-zinc-500">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold leading-relaxed">Tầng 3, Tòa nhà Văn phòng ABC, Quận 7, TP.HCM</span>
                </div>
                
                <div className="flex items-start gap-4 text-zinc-500">
                  <Activity className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold leading-relaxed">Trị liệu Cơ xương khớp, Thần kinh cột sống (Vật lý trị liệu)</span>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-zinc-500 font-bold text-sm">Phí khám ban đầu</span>
                    <span className="text-2xl font-extrabold text-primary font-heading">300.000đ</span>
                  </div>
                  <div className="flex items-start gap-3 bg-primary/10 text-primary p-4 rounded-[20px] text-xs border border-primary/20 leading-relaxed font-semibold">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>Miễn phí 100% phí khám nếu khách hàng đăng ký sử dụng bất kỳ dịch vụ hoặc liệu trình nào sau khi khám.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: FORM ĐẶT LỊCH - Soft UI Card */}
          <div className="lg:col-span-8 bg-white rounded-[32px] shadow-soft-ui border border-gray-100/50 p-8 lg:p-10 opacity-0 animate-slide-up stagger-delay-3">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Bước 1: Chọn thời gian */}
              <div>
                <h3 className="text-xl font-bold text-secondary font-heading flex items-center mb-6">
                  <CalendarIcon className="w-5 h-5 mr-3 text-primary" />
                  1. Chọn thời gian khám
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="selectedDate" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-2">Ngày khám</label>
                    <input 
                      id="selectedDate"
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full sm:w-1/2 rounded-[16px] border-zinc-200 shadow-sm focus:border-primary focus:ring-primary p-4 border font-bold text-secondary text-sm transition-all"
                      value={selectedDate}
                      onChange={(e) => dispatch({ type: 'SET_DATE', date: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-3">Giờ khám ({formatFullDate(selectedDate)})</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                      {timeSlots.map((time) => (
                        <button
                          type="button"
                          key={time}
                          onClick={() => dispatch({ type: 'SET_TIME', time })}
                          className={`py-3 px-2 text-sm font-extrabold rounded-[14px] border transition-all active:scale-95 duration-200
                            ${selectedTime === time 
                              ? 'bg-primary border-primary text-white shadow-soft-button scale-105' 
                              : 'bg-zinc-50 border-transparent text-secondary hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
                            }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Bước 2: Thông tin khách hàng */}
              <div>
                <h3 className="text-xl font-bold text-secondary font-heading flex items-center mb-6">
                  <User className="w-5 h-5 mr-3 text-primary" />
                  2. Thông tin của bạn
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="ho_ten_khach" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-2">Họ và tên *</label>
                    <input
                      id="ho_ten_khach"
                      type="text"
                      name="ho_ten_khach"
                      required
                      readOnly={!!user?.ho_ten}
                      placeholder="Nguyễn Văn A"
                      className={`w-full rounded-[16px] shadow-sm focus:border-primary focus:ring-primary p-4 border font-bold text-secondary text-sm transition-all ${user?.ho_ten ? 'bg-zinc-50 text-zinc-400 border-zinc-100 cursor-not-allowed' : 'border-zinc-200'}`}
                      value={formData.ho_ten_khach}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="so_dien_thoai" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-2">Số điện thoại *</label>
                    <input
                      id="so_dien_thoai"
                      type="tel"
                      name="so_dien_thoai"
                      required
                      placeholder="0901234567"
                      className="w-full rounded-[16px] border-zinc-200 shadow-sm focus:border-primary focus:ring-primary p-4 border font-bold text-secondary text-sm transition-all"
                      value={formData.so_dien_thoai}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-3">Giới tính</label>
                    <div className="flex space-x-8">
                      <label className="flex items-center cursor-pointer group">
                        <input type="radio" name="gioi_tinh_khach" value="nam" checked={formData.gioi_tinh_khach === 'nam'} onChange={handleChange} className="text-primary focus:ring-primary border-zinc-300 w-4 h-4" />
                        <span className="ml-2.5 text-sm font-bold text-secondary group-hover:text-primary transition-colors">Nam</span>
                      </label>
                      <label className="flex items-center cursor-pointer group">
                        <input type="radio" name="gioi_tinh_khach" value="nu" checked={formData.gioi_tinh_khach === 'nu'} onChange={handleChange} className="text-primary focus:ring-primary border-zinc-300 w-4 h-4" />
                        <span className="ml-2.5 text-sm font-bold text-secondary group-hover:text-primary transition-colors">Nữ</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Bước 3: Tình trạng bệnh lý */}
              <div>
                <h3 className="text-xl font-bold text-secondary font-heading flex items-center mb-6">
                  <Activity className="w-5 h-5 mr-3 text-primary" />
                  3. Tình trạng của bạn
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="trieu_chung" className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-2">Mô tả triệu chứng (Vùng đau, mức độ) *</label>
                    <textarea
                      id="trieu_chung"
                      name="trieu_chung"
                      required
                      rows={4}
                      placeholder="VD: Tôi bị đau mỏi vai gáy lan xuống cánh tay phải khoảng 2 tuần nay..."
                      className="w-full rounded-[16px] border-zinc-200 shadow-sm focus:border-primary focus:ring-primary p-4 border font-medium text-secondary text-sm resize-none transition-all"
                      value={formData.trieu_chung}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-[#25A89C] text-white font-extrabold text-lg py-4 rounded-[16px] hover:-translate-y-0.5 active:translate-y-0 shadow-soft-button disabled:opacity-75 disabled:cursor-not-allowed flex justify-center items-center transition-all"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đặt hẹn khám'}
                </button>
                <p className="text-center text-xs font-bold text-zinc-400 mt-4">
                  Bằng việc đặt hẹn, bạn đồng ý với các Điều khoản dịch vụ của chúng tôi.
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* POPUP MODAL YÊU CẦU TÀI KHOẢN (PREMIUM CLINICAL DESIGN) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-soft-ui-hover overflow-hidden border border-gray-100 animate-slide-up">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-[20px] flex items-center justify-center mx-auto shadow-inner border border-primary/20">
                <User size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-secondary font-heading">Yêu cầu Đăng nhập</h3>
              <p className="text-sm font-semibold text-zinc-500 leading-relaxed">
                Để bảo mật bệnh án và đồng bộ hóa lịch khám của bạn lên hệ thống, quý khách cần có tài khoản thành viên.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col gap-3">
              <button 
                onClick={handleRedirectToLogin}
                className="w-full bg-primary hover:bg-[#25A89C] text-white font-bold py-4 rounded-[16px] shadow-soft-button transition-all text-sm"
              >
                Đăng nhập / Đăng ký ngay
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-zinc-50 hover:bg-zinc-100 text-secondary font-bold py-4 rounded-[16px] border border-gray-100 transition-all text-sm"
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
