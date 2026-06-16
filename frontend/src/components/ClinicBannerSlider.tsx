import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface ClinicBannerSliderProps {
  page?: 'home' | 'services' | 'specialists';
}

const HOME_SLIDES = [
  {
    image: '/images/physio_clinic_villa.png',
    title: 'Phòng Khám Chuẩn Y Khoa Quốc Tế',
    subtitle: 'Không gian sang trọng, hiện đại, mang lại trải nghiệm thư giãn và trị liệu tối ưu cho từng khách hàng.'
  },
  {
    image: '/images/physio_premium_facility.png',
    title: 'Trang Thiết Bị Trị Liệu Cao Cấp',
    subtitle: 'Đầu tư công nghệ máy móc tiên tiến hàng đầu Châu Âu để rút ngắn thời gian phục hồi lên đến 50%.'
  },
  {
    image: '/images/physio_treatment_room.png',
    title: 'Liệu Trình Chuyên Biệt Cá Nhân Hoá',
    subtitle: 'Đội ngũ bác sĩ và kỹ thuật viên tâm huyết đồng hành suốt quá trình tìm lại cơ thể linh hoạt, khoẻ mạnh.'
  }
];

const SERVICES_SLIDES = [
  {
    image: '/images/physio_treatment_room.png',
    title: 'Dịch Vụ Trị Liệu Chuyên Sâu',
    subtitle: 'Hệ thống phác đồ điều trị được cấu hình chuẩn y khoa cho các bệnh lý xương khớp của dân văn phòng.'
  },
  {
    image: '/images/packages/therapy_manual.png',
    title: 'Liệu Pháp Cơ Học Trị Liệu Bằng Tay',
    subtitle: 'Tác động trực tiếp vào nhóm cơ co quắp, giải toả áp lực cơ đè nén lên dây thần kinh cột sống.'
  },
  {
    image: '/images/packages/therapy_electrical.png',
    title: 'Điện Xung & Siêu Âm Trị Liệu',
    subtitle: 'Ứng dụng sóng âm đa tần hiện đại và dòng xung điện TENS tiêu sưng, cắt cơn đau nhức tại chỗ.'
  }
];

const SPECIALISTS_SLIDES = [
  {
    image: '/images/physio_premium_facility.png',
    title: 'Đội Ngũ Bác Sĩ & KTV Đầu Ngành',
    subtitle: 'Kết nối trực tiếp cùng các chuyên gia hàng đầu về Phục hồi chức năng và Y học thể thao.'
  },
  {
    image: '/images/packages/therapy_stretch.png',
    title: 'Đồng Hành Trị Liệu Cá Nhân Hoá',
    subtitle: 'Lắng nghe, thấu hiểu và cùng bạn thiết lập lối sống linh hoạt, không còn nỗi lo đau mỏi cột sống.'
  }
];

export default function ClinicBannerSlider({ page = 'home' }: ClinicBannerSliderProps) {
  const { isAuthenticated } = useAuthStore();
  const slides = page === 'services' 
    ? SERVICES_SLIDES 
    : page === 'specialists' 
    ? SPECIALISTS_SLIDES 
    : HOME_SLIDES;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset current slide when page changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [page]);

  // Auto-play slider
  useEffect(() => {
    const timer = setInterval(() => {
      handleNextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  const handleNextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const handlePrevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-global-auth-modal'));
    }
  };

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] bg-secondary flex items-center justify-center overflow-hidden">
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
            idx === currentSlide 
              ? 'opacity-100 scale-100 pointer-events-auto' 
              : 'opacity-0 scale-105 pointer-events-none'
          }`}
        >
          {/* Background image overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/70 to-transparent z-10" />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          
          {/* Slider Content */}
          <div className="absolute inset-0 flex items-center z-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="max-w-2xl text-left select-none">
              <span className="inline-block bg-primary/20 text-primary border border-primary/30 text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 mb-5 animate-pulse">
                Office Care Premium Clinic
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-black text-white leading-tight uppercase tracking-tight mb-4 animate-slide-up">
                {slide.title}
              </h2>
              <p className="text-slate-300 text-sm md:text-base font-semibold leading-relaxed mb-8 animate-fade-in stagger-delay-1">
                {slide.subtitle}
              </p>
              
              {/* Premium Booking CTA Button inside Slide */}
              <div className="animate-fade-in stagger-delay-2 flex">
                <Link
                  to="/booking"
                  onClick={handleBookingClick}
                  className="inline-flex items-center gap-2 bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-xs md:text-sm font-black uppercase tracking-widest px-6 py-4 rounded-full shadow-soft-button hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300"
                >
                  <Calendar size={16} />
                  Đặt lịch tư vấn ngay
                  <ArrowRight size={14} className="mt-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Left/Right Arrows */}
      <button
        onClick={handlePrevSlide}
        className="absolute left-6 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white transition-all backdrop-blur-sm hidden sm:block shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={handleNextSlide}
        className="absolute right-6 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white transition-all backdrop-blur-sm hidden sm:block shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Slide Indicators / Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (isAnimating) return;
              setIsAnimating(true);
              setCurrentSlide(idx);
              setTimeout(() => setIsAnimating(false), 800);
            }}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              idx === currentSlide 
                ? 'w-8 bg-primary shadow-soft-button' 
                : 'w-2.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
