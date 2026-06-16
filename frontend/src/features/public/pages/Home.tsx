import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles,
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  Star, 
  Award,
  Activity,
  Building
} from 'lucide-react';
import ClinicBannerSlider from '../../../components/ClinicBannerSlider';
import { useAuthStore } from '../../../stores/authStore';
import { MOCK_SPECIALISTS } from '../../../data/specialistsData';

const CATEGORY_RATINGS = [
  {
    name: 'Chất lượng Chuyên môn',
    rating: 5.0,
    totalRatings: 485,
    percentage: 100,
    icon: Award
  },
  {
    name: 'Đặt lịch Tiện lợi',
    rating: 4.9,
    totalRatings: 392,
    percentage: 98,
    icon: Calendar
  },
  {
    name: 'Hiệu quả Phục hồi',
    rating: 4.9,
    totalRatings: 310,
    percentage: 98,
    icon: Activity
  },
  {
    name: 'Không gian Trị liệu',
    rating: 5.0,
    totalRatings: 233,
    percentage: 100,
    icon: Building
  }
];

const STAR_DISTRIBUTION = [
  { stars: 5, percentage: 92, count: 1306 },
  { stars: 4, percentage: 6, count: 85 },
  { stars: 3, percentage: 2, count: 29 },
  { stars: 2, percentage: 0, count: 0 },
  { stars: 1, percentage: 0, count: 0 }
];

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-global-auth-modal'));
    }
  };

  // Intersection Observer for scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active-reveal');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="font-body bg-[#F9FAFB] overflow-hidden">
      {/* Scroll Reveal & Marquee Styles */}
      {/* Scroll Reveal & Dashboard Styles */}
      <style>{`
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .reveal-on-scroll.active-reveal {
          opacity: 1;
          transform: translateY(0);
        }
        .bg-dotted-grid {
          background-size: 24px 24px;
          background-image: radial-gradient(circle, rgba(15, 23, 42, 0.04) 1.5px, transparent 1.5px);
        }
      `}</style>
      
      {/* Clinic Banner Slider Hero */}
      <ClinicBannerSlider page="home" />

      {/* 2. DỊCH VỤ NỔI BẬT (Restored to Static Grid Layout) */}
      <section className="reveal-on-scroll py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
            <h2 className="text-[#2EC4B6] font-bold tracking-wider uppercase text-xs mb-3 flex items-center justify-center gap-1.5">
              <span className="size-1.5 bg-[#2EC4B6] rounded-full"></span> DỊCH VỤ NỔI BẬT
            </h2>
            <h3 className="font-heading text-3xl md:text-5xl font-black text-slate-900 mb-4 leading-tight uppercase tracking-tight">Liệu trình điều trị nổi bật</h3>
            <p className="text-slate-500 font-semibold text-sm md:text-base">Các giải pháp trị liệu và phục hồi cơ xương khớp được nghiên cứu và thiết lập chuẩn y khoa cho dân văn phòng.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-[0_15px_45px_rgba(15,23,42,0.02)] hover:shadow-soft-ui-hover hover:-translate-y-1.5 transition-all duration-500 group flex flex-col justify-between">
              <div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src="/images/packages/cervical_spine_hero.png" alt="Trị liệu cổ vai gáy" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 filter saturate-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                </div>
                <div className="p-6 md:p-8 space-y-3">
                  <h4 className="font-heading font-black text-xl text-[#0B1222] group-hover:text-[#2EC4B6] transition-colors">Trị liệu vai gáy</h4>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                    Liệu pháp chuyên sâu giải phóng căng cứng và đau nhức vùng cổ vai gáy cho người làm việc văn phòng.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
                <Link to="/services" state={{ activeTab: 'services' }} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#2EC4B6] hover:text-[#25A89C] group/link">
                  Xem chi tiết <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-[0_15px_45px_rgba(15,23,42,0.02)] hover:shadow-soft-ui-hover hover:-translate-y-1.5 transition-all duration-500 group flex flex-col justify-between">
              <div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src="/images/packages/back_pain_hero.png" alt="Thoát vị đĩa đệm" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 filter saturate-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                </div>
                <div className="p-6 md:p-8 space-y-3">
                  <h4 className="font-heading font-black text-xl text-[#0B1222] group-hover:text-[#2EC4B6] transition-colors">Thoát vị đĩa đệm</h4>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                    Trị liệu giảm áp cơ học giúp giải nén rễ thần kinh thắt lưng và gia tăng độ linh hoạt cột sống.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
                <Link to="/services" state={{ activeTab: 'services' }} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#2EC4B6] hover:text-[#25A89C] group/link">
                  Xem chi tiết <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-[0_15px_45px_rgba(15,23,42,0.02)] hover:shadow-soft-ui-hover hover:-translate-y-1.5 transition-all duration-500 group flex flex-col justify-between">
              <div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src="/images/packages/posture_hero.png" alt="Phục hồi chức năng" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 filter saturate-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                </div>
                <div className="p-6 md:p-8 space-y-3">
                  <h4 className="font-heading font-black text-xl text-[#0B1222] group-hover:text-[#2EC4B6] transition-colors">Phục hồi chức năng</h4>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                    Hỗ trợ hồi phục hệ vận động tối ưu sau các chấn thương, phẫu thuật hoặc phục hồi tư thế lệch chuẩn học đường.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
                <Link to="/services" state={{ activeTab: 'services' }} className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#2EC4B6] hover:text-[#25A89C] group/link">
                  Xem chi tiết <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Premium Call to Action (CTA) Banner to Services catalog */}
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-lg border border-slate-800 mt-16">
            <div className="absolute -right-32 -bottom-32 size-96 bg-[#2EC4B6]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 flex-1 text-center lg:text-left">
                <span className="text-[10px] bg-[#2EC4B6]/20 text-[#2EC4B6] border border-[#2EC4B6]/30 font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  ✦ DANH MỤC KHÁM & TRỊ LIỆU ✦
                </span>
                <h3 className="font-heading font-black text-2xl md:text-3xl text-white">Tra Cứu Dịch Vụ & Lộ Trình Gói</h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
                  Xem chi tiết đơn giá cho từng buổi trị liệu lẻ hoặc các gói combo liệu trình dài ngày giúp phục hồi đau mỏi thắt lưng, vai gáy chuẩn y tế.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
                <Link
                  to="/services"
                  state={{ activeTab: 'services' }}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-center px-6 py-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 hover:shadow-md"
                >
                  Xem dịch vụ lẻ <ArrowRight size={13} />
                </Link>
                <Link
                  to="/services"
                  state={{ activeTab: 'packages' }}
                  className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold text-center px-6 py-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md shadow-[#2EC4B6]/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Sparkles size={13} /> Xem gói combo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CHUYÊN GIA HÀNG ĐẦU */}
      <section className="reveal-on-scroll py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[#2EC4B6] font-bold tracking-wider uppercase text-xs mb-3 flex items-center justify-center gap-1.5">
              <span className="size-1.5 bg-[#2EC4B6] rounded-full"></span> CHUYÊN GIA HÀNG ĐẦU
            </h2>
            <h3 className="font-heading text-3xl md:text-5xl font-black text-[#0B1222] mb-4 leading-tight uppercase tracking-tight">
              Chuyên gia hàng đầu
            </h3>
            <p className="text-slate-500 font-semibold text-sm md:text-base">
              Đội ngũ bác sĩ và kỹ thuật viên chuyên môn cao với tối thiểu 5 năm kinh nghiệm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {MOCK_SPECIALISTS.slice(0, 3).map((exp, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0_15px_40px_rgba(15,23,42,0.02)] hover:shadow-soft-ui-hover hover:-translate-y-1.5 transition-all duration-350 flex flex-col justify-between group"
              >
                <div>
                  {/* Rating block */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                      <Star size={12} className="fill-amber-500 stroke-amber-500" />
                      <span>{exp.rating.toFixed(1)}/5 ({exp.id === '1' ? '120+' : exp.id === '2' ? '95+' : '80+'} Review)</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200/80 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                      <Award size={12} className="text-[#2EC4B6]" />
                      <span>{exp.experience} Năm KN</span>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative w-28 h-28 mb-4">
                      <div className="absolute inset-0 rounded-full border-[3px] border-[#2EC4B6]/20 group-hover:border-[#2EC4B6]/60 transition-all duration-300" />
                      <img 
                        src={exp.avatar} 
                        alt={exp.name} 
                        className="w-full h-full object-cover rounded-full p-1 bg-white" 
                      />
                    </div>
                    <h4 className="font-heading font-black text-xl text-[#0B1222] group-hover:text-[#2EC4B6] transition-colors leading-tight mb-1">
                      {exp.name}
                    </h4>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      {exp.role}
                    </p>

                    {/* Tag buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {exp.tags.map((tg, tIdx) => (
                        <span 
                          key={tIdx} 
                          className="bg-[#E8F8F2] text-[#2EC4B6] text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        >
                          #{tg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-center">
                  <Link 
                    to={`/specialists/${exp.id}`} 
                    className="bg-[#0F3327] hover:bg-[#164938] text-white text-center font-extrabold py-3.5 w-full rounded-xl text-xs uppercase tracking-widest shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    Xem chi tiết
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Link 
              to="/specialists" 
              className="bg-[#2EC4B6]/10 hover:bg-[#2EC4B6] text-[#2EC4B6] hover:text-white border border-[#2EC4B6]/20 hover:border-[#2EC4B6] px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group shadow-sm"
            >
              <span>Xem thêm chuyên viên</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. ĐÁNH GIÁ CHẤT LƯỢNG OFFICE CARE (Ratings Dashboard) */}
      <section className="reveal-on-scroll py-24 bg-[#F9FAFB] bg-dotted-grid border-y border-slate-100 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
              Đánh giá chất lượng Office Care
            </h3>
            <p className="text-slate-500 font-bold text-xs md:text-sm mt-3 uppercase tracking-wider">
              Dữ liệu xếp hạng được tổng hợp minh bạch từ phản hồi của khách hàng
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Left Column: Overall Stats Card */}
            <div className="lg:col-span-5 bg-white rounded-[32px] p-8 md:p-10 border border-slate-100/80 shadow-[0_15px_50px_rgba(15,23,42,0.02)] flex flex-col justify-between transition-all duration-500 hover:shadow-[0_20px_40px_rgba(46,196,182,0.1)] hover:-translate-y-1">
              <div>
                <h4 className="text-slate-400 font-black text-xs uppercase tracking-wider mb-6">Xếp hạng tổng quan</h4>
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl md:text-8xl font-black text-slate-800 tracking-tighter">4.9</span>
                  <div className="space-y-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, sIdx) => (
                        <Star key={sIdx} size={20} className="fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-400 text-xs font-bold">1,420 lượt đánh giá</p>
                  </div>
                </div>
              </div>

              {/* Star breakdown bar chart */}
              <div className="mt-8 space-y-3.5">
                {STAR_DISTRIBUTION.map((dist, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-slate-500 font-bold flex items-center gap-1">
                      {dist.stars} <Star size={12} className="fill-amber-400 stroke-amber-400" />
                    </span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#2EC4B6] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${dist.percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-slate-500 font-semibold">{dist.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Category-specific Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {CATEGORY_RATINGS.map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <div 
                    key={idx}
                    className="group bg-white rounded-[32px] p-6 border border-slate-100/80 shadow-[0_15px_50px_rgba(15,23,42,0.02)] flex flex-col justify-between h-[160px] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(46,196,182,0.12)] hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-[#2EC4B6]/10 group-hover:bg-[#2EC4B6] flex items-center justify-center text-[#2EC4B6] group-hover:text-white transition-all duration-500">
                          <IconComponent size={18} />
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#2EC4B6]/10 text-[#2EC4B6] text-xs font-black px-2.5 py-1 rounded-full">
                          <Star size={11} className="fill-[#2EC4B6] stroke-[#2EC4B6]" />
                          {cat.rating.toFixed(1)}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-heading font-black text-slate-800 text-sm group-hover:text-[#2EC4B6] transition-colors duration-300">
                          {cat.name}
                        </h5>
                        <p className="text-slate-400 text-[10px] font-semibold">
                          {cat.totalRatings} lượt đánh giá
                        </p>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Độ hài lòng</span>
                        <span>{cat.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#2EC4B6] rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Restored Direct Booking Bottom CTA Banner to Original Color Theme */}
      <div className="reveal-on-scroll max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 mt-20">
        <div className="bg-secondary rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-soft-ui border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2EC4B6]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2EC4B6]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 max-w-5xl mx-auto">
            <div className="max-w-2xl">
              <span className="text-[#2EC4B6] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <CheckCircle2 size={13} /> Tư vấn chuyên sâu chuẩn y khoa
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black text-white leading-tight uppercase tracking-tight mb-4">
                Khởi đầu hành trình phục hồi ngay hôm nay
              </h2>
              <p className="text-slate-400 text-xs md:text-sm font-semibold leading-relaxed">
                Hệ thống tự động điều phối lịch khám cho chuyên gia phù hợp nhất dựa trên mức độ chấn thương và triệu chứng đau mỏi của bạn.
              </p>
            </div>
            
            <Link
              to="/booking"
              onClick={handleBookingClick}
              className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-full shadow-soft-button hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Calendar size={15} />
              Đặt lịch tư vấn ngay
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
