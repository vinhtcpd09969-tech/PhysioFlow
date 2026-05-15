import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Phone, User, Info, CheckCircle2, Upload, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00'
];

// Helper to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function Booking() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    ho_ten_khach: '',
    so_dien_thoai: '',
    gioi_tinh_khach: 'nam',
    trieu_chung: '',
    ly_do_kham: '',
    anh_dinh_kem_url: '' // Mocking file upload with a URL string for now
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      alert('Vui lòng chọn giờ khám!');
      return;
    }

    setIsSubmitting(true);
    
    // Combine date and time
    const [year, month, day] = selectedDate.split('-');
    const [hours, minutes] = selectedTime.split(':');
    const ngay_gio_bat_dau = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)).toISOString();

    try {
      const response = await fetch('http://localhost:5000/api/appointments/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ngay_gio_bat_dau,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const error = await response.json();
        alert(error.message || 'Có lỗi xảy ra khi đặt lịch.');
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Đặt lịch thành công!</h2>
          <p className="text-gray-600">
            Cảm ơn bạn đã tin tưởng PhysioFlow. Lễ tân của chúng tôi sẽ gọi điện xác nhận trong vòng 15 phút tới.
          </p>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-left text-sm">
            <p className="font-semibold mb-2">Lời khuyên trước khi đến khám:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Mặc trang phục rộng rãi, thoải mái.</li>
              <li>Mang theo phim chụp X-Quang/MRI (nếu có).</li>
              <li>Đến sớm 10 phút để làm thủ tục.</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Đặt lịch Khám lượng giá</h1>
          <p className="mt-4 text-lg text-gray-600">Chẩn đoán chính xác - Điều trị tận gốc cùng chuyên gia</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: THÔNG TIN DỊCH VỤ */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-40 bg-blue-600 relative">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h2 className="text-xl font-bold leading-tight">Khám Lâm sàng & Lượng giá Y khoa</h2>
                  <p className="text-blue-100 text-sm mt-1">PhysioFlow Clinic</p>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-start space-x-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Tầng 3, Tòa nhà Văn phòng ABC, Quận 1, TP.HCM</span>
                </div>
                
                <div className="flex items-start space-x-3 text-gray-600">
                  <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Trị liệu Cơ xương khớp, Thần kinh cột sống (Vật lý trị liệu)</span>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 font-medium">Phí khám ban đầu</span>
                    <span className="text-xl font-bold text-blue-600">300.000đ</span>
                  </div>
                  <div className="flex items-start space-x-2 bg-blue-50 text-blue-800 p-3 rounded-lg text-xs">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>Miễn phí 100% phí khám nếu khách hàng đăng ký sử dụng bất kỳ dịch vụ hoặc gói trị liệu nào sau khi khám.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <h3 className="font-bold text-gray-900 mb-4">Quy trình thăm khám</h3>
               <ol className="relative border-l border-gray-200 ml-3 space-y-5">
                  <li className="pl-6 relative">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-4 ring-white text-blue-600 text-xs font-bold">1</span>
                    <h4 className="font-medium text-gray-900 text-sm">Điền thông tin đặt lịch</h4>
                  </li>
                  <li className="pl-6 relative">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-4 ring-white text-blue-600 text-xs font-bold">2</span>
                    <h4 className="font-medium text-gray-900 text-sm">Đến phòng khám theo giờ hẹn</h4>
                  </li>
                  <li className="pl-6 relative">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-4 ring-white text-blue-600 text-xs font-bold">3</span>
                    <h4 className="font-medium text-gray-900 text-sm">Bác sĩ khám lượng giá (30-45p)</h4>
                  </li>
                  <li className="pl-6 relative">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-4 ring-white text-blue-600 text-xs font-bold">4</span>
                    <h4 className="font-medium text-gray-900 text-sm">Chỉ định phác đồ & Bắt đầu tập</h4>
                  </li>
               </ol>
            </div>
          </div>

          {/* CỘT PHẢI: FORM ĐẶT LỊCH */}
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Bước 1: Chọn thời gian */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                  1. Chọn thời gian khám
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khám</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full sm:w-1/2 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime(''); // Reset time when date changes
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Giờ khám ({formatDate(new Date(selectedDate))})</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          type="button"
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-1 text-sm font-medium rounded-lg border transition-all
                            ${selectedTime === time 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                              : 'bg-white border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
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
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  2. Thông tin của bạn
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      name="ho_ten_khach"
                      required
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                      value={formData.ho_ten_khach}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      name="so_dien_thoai"
                      required
                      placeholder="0901234567"
                      className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                      value={formData.so_dien_thoai}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                    <div className="flex space-x-6">
                      <label className="flex items-center">
                        <input type="radio" name="gioi_tinh_khach" value="nam" checked={formData.gioi_tinh_khach === 'nam'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-gray-700">Nam</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="gioi_tinh_khach" value="nu" checked={formData.gioi_tinh_khach === 'nu'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-gray-700">Nữ</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Bước 3: Tình trạng bệnh lý */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  3. Tình trạng của bạn
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả triệu chứng (Vùng đau, mức độ) *</label>
                    <textarea
                      name="trieu_chung"
                      required
                      rows={3}
                      placeholder="VD: Tôi bị đau mỏi vai gáy lan xuống cánh tay phải khoảng 2 tuần nay..."
                      className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border resize-none"
                      value={formData.trieu_chung}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hình ảnh/Video triệu chứng (Tùy chọn)
                      <span className="block text-xs font-normal text-gray-500 mt-0.5">Nếu có phim chụp X-Quang, MRI hoặc vị trí sưng đau, hãy tải lên để bác sĩ xem trước.</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            Tải ảnh lên
                          </span>
                          <p className="pl-1">hoặc kéo thả vào đây</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG tối đa 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút Submit */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-700 transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    'Xác nhận Đặt hẹn khám'
                  )}
                </button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Bằng việc đặt hẹn, bạn đồng ý với các <a href="#" className="text-blue-600 hover:underline">Điều khoản dịch vụ</a> của chúng tôi.
                </p>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
