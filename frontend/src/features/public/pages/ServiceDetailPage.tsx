import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, Phone, Loader2, Info } from 'lucide-react';
import { getPublicServices, getPublicCategories } from '../../../api/client.api';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  danh_muc_id: string;
  ten_dich_vu: string;
  mo_ta_ngan: string;
  mo_ta_chi_tiet: string;
  thoi_luong_phut: number;
  don_gia: number | string;
  hinh_anh_url: string;
  loai_dich_vu: string;
  loai_dich_vu_ho_tro: string[] | string;
}

interface Category {
  id: string | number;
  ten_danh_muc: string;
  mo_ta: string;
  loai_danh_muc: string;
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showStickyCTA, setShowStickyCTA] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resSvcs, resCats] = await Promise.all([
          getPublicServices(),
          getPublicCategories()
        ]);

        const fetchedServices: Service[] = resSvcs.data || [];
        const fetchedCategories: Category[] = resCats.data || [];
        setCategories(fetchedCategories);

        const foundService = fetchedServices.find(s => s.id.toString() === id?.toString());
        if (foundService) {
          setService(foundService);
        } else {
          toast.error('Không tìm thấy dịch vụ trị liệu này.');
          navigate('/services');
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
        toast.error('Lỗi khi tải thông tin dịch vụ.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Set Document Title for SEO
  useEffect(() => {
    if (service) {
      document.title = `${service.ten_dich_vu} - Trị liệu phục hồi | RehabFlow`;
    }
  }, [service]);

  // Scroll listener for sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      const isPastThreshold = window.scrollY > 400;
      const footer = document.querySelector('footer');
      let isFooterVisible = false;

      if (footer) {
        const rect = footer.getBoundingClientRect();
        isFooterVisible = rect.top < window.innerHeight;
      } else {
        isFooterVisible = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 320;
      }

      if (isPastThreshold && !isFooterVisible) {
        setShowStickyCTA(true);
      } else {
        setShowStickyCTA(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-reveal Intersection Observer
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active-reveal');
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [loading, service]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24">
        <Loader2 className="animate-spin w-10 h-10 text-primary mb-3" />
        <p className="font-bold text-slate-400 text-sm">Đang tải thông tin trị liệu...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24 text-center px-4">
        <div className="size-16 rounded-2xl bg-teal-50 flex items-center justify-center text-[#2EC4B6] border border-teal-100 mb-4">
          <Info size={30} />
        </div>
        <h2 className="text-[#0B1222] font-bold text-lg">Không tìm thấy chi tiết trị liệu</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">Dịch vụ này không tồn tại hoặc đã ngừng cung cấp.</p>
        <Link to="/services" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#25A89C]">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  // Helper to extract service benefits
  const getServiceBenefits = (): string[] => {
    try {
      if (typeof service.loai_dich_vu_ho_tro === 'string') {
        const parsed = JSON.parse(service.loai_dich_vu_ho_tro);
        if (Array.isArray(parsed)) return parsed;
      } else if (Array.isArray(service.loai_dich_vu_ho_tro)) {
        return service.loai_dich_vu_ho_tro;
      }
    } catch (e) {
      // ignore
    }
    return [service.mo_ta_ngan || 'Hỗ trợ phục hồi cơ khớp toàn diện.'];
  };

  const benefits = getServiceBenefits();

  // Helper to get category name
  const getCategoryName = (): string => {
    const cat = categories.find(c => c.id.toString() === service.danh_muc_id.toString());
    return cat ? cat.ten_danh_muc : 'Dịch vụ lẻ';
  };

  // Map service names/categories to beautiful sharp hero images
  const getServiceHeroImage = (): string => {
    const nameLower = service.ten_dich_vu.toLowerCase();
    if (nameLower.includes('đốt sống cổ') || nameLower.includes('đầu cổ vai gáy')) {
      return '/images/packages/cervical_spine_hero.png';
    }
    if (nameLower.includes('thắt lưng') || nameLower.includes('giác hơi') || nameLower.includes('lưng')) {
      if (nameLower.includes('lưng trên') || nameLower.includes('vai')) {
        return '/images/packages/shoulder_back_hero.png';
      }
      return '/images/packages/back_pain_hero.png';
    }
    if (nameLower.includes('cổ tay') || nameLower.includes('khuỷu tay') || nameLower.includes('ép phục hồi')) {
      return '/images/packages/wrist_elbow_hero.png';
    }
    if (nameLower.includes('tư thế') || nameLower.includes('chỉnh dáng')) {
      return '/images/packages/posture_hero.png';
    }
    return '/images/packages/wellness_hero.png';
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '';
    const numPrice = typeof price === 'string' ? parseInt(price, 10) : price;
    if (isNaN(numPrice)) return price.toString();
    if (numPrice === 0) return 'Liên hệ';
    return numPrice.toLocaleString('vi-VN') + ' đ';
  };

  const handleBooking = () => {
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-24 font-body relative overflow-hidden">
      {/* Scroll Reveal Styles */}
      <style>{`
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .reveal-on-scroll.slide-left {
          transform: translateX(-50px) translateY(0);
        }
        .reveal-on-scroll.slide-right {
          transform: translateX(50px) translateY(0);
        }
        .reveal-on-scroll.scale-in {
          transform: scale(0.95) translateY(20px);
        }
        .reveal-on-scroll.active-reveal {
          opacity: 1;
          transform: translate(0) scale(1);
        }
        
        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }
      `}</style>

      {/* Visual background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-teal-50/20 via-transparent to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to="/services" className="hover:text-primary transition-colors">Danh mục dịch vụ</Link>
            <span>/</span>
            <span className="text-primary font-extrabold">{service.ten_dich_vu}</span>
          </div>

          <Link
            to="/services"
            className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 tracking-wider transition-colors bg-white border border-slate-200/60 px-5 py-2.5 rounded-xl shadow-xs"
          >
            ← Danh mục dịch vụ
          </Link>
        </div>

        {/* Section 1: Hero Banner */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 lg:p-16 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap gap-2.5 items-center">
                <span className="bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-primary/20">
                  {getCategoryName()}
                </span>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                  Đạt chuẩn y tế
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-heading font-black text-secondary tracking-tight leading-tight uppercase">
                {service.ten_dich_vu}
              </h1>
              
              <p className="text-slate-500 text-sm md:text-base font-semibold leading-relaxed max-w-2xl">
                {service.mo_ta_chi_tiet || service.mo_ta_ngan}
              </p>

              <div className="flex items-center gap-6 py-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đơn giá trị liệu</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{formatPrice(service.don_gia)} <span className="text-sm font-bold text-slate-400">/ buổi</span></p>
                </div>
                <div className="w-px h-12 bg-slate-200"></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời lượng</p>
                  <p className="text-2xl font-black text-secondary mt-1 flex items-center gap-1.5"><Clock size={20} className="text-primary" /> {service.thoi_luong_phut} phút</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={handleBooking}
                  className="bg-primary hover:bg-[#25A89C] text-white font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-[0_10px_25px_-5px_rgba(46,196,182,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(46,196,182,0.5)] flex items-center gap-2 group"
                >
                  Đặt lịch trị liệu ngay <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                
                <a
                  href="tel:19001234"
                  className="bg-white border border-slate-200/80 hover:border-primary text-secondary hover:text-primary font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-xs flex items-center gap-2"
                >
                  <Phone size={13} /> Gọi hotline tư vấn
                </a>
              </div>
            </div>

            {/* Hero Photo */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-4/3 md:aspect-video lg:aspect-square rounded-[36px] overflow-hidden shadow-xl border border-white relative group">
                <img
                  src={getServiceHeroImage()}
                  alt={service.ten_dich_vu}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Section 2: Mục tiêu phục hồi (Dành cho ai) */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-heading font-black text-secondary uppercase tracking-tight">
              Mục tiêu & Lợi ích trị liệu
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2">
              Các chỉ định lâm sàng và hiệu quả phục hồi sinh học được cam kết sau khi hoàn thành buổi trị liệu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => {
              const icons = ['⚡', '⚠️', '🌊'];
              const titles = ['Kích hoạt sinh học', 'Giải tỏa áp lực', 'Phục hồi toàn diện'];
              const revealClass = idx === 0 
                ? 'reveal-on-scroll slide-left' 
                : idx === 2 
                  ? 'reveal-on-scroll slide-right delay-200' 
                  : 'reveal-on-scroll delay-100';

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-[28px] p-8 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.01)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.03)] hover:-translate-y-1 transition-all duration-300 group ${revealClass}`}
                >
                  <div className="size-12 bg-slate-50 border border-slate-100 group-hover:border-primary/25 rounded-2xl flex items-center justify-center text-xl mb-5 transition-colors group-hover:bg-primary/10 group-hover:text-primary duration-300">
                    {icons[idx % icons.length]}
                  </div>
                  <h3 className="font-heading font-extrabold text-secondary text-base leading-snug mb-3">
                    {titles[idx % titles.length]}
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                    {benefit}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Quy trình trị liệu chuẩn y khoa */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 lg:p-16 mb-16 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full">
              Quy trình chuẩn hóa
            </span>
            <h2 className="text-2xl md:text-3xl font-heading font-black text-secondary uppercase tracking-tight mt-4">
              Quy trình trị liệu 4 bước
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2">
              Các bước can thiệp y khoa khép kín được thực hiện bởi đội ngũ Kỹ thuật viên có chứng chỉ chuyên môn
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {[
              {
                title: 'Bước 1: Khám & Lượng giá',
                desc: 'Bác sĩ hoặc Kỹ thuật viên kiểm tra lâm sàng, xác định các điểm co thắt cơ và mức độ hạn chế vận động khớp.'
              },
              {
                title: 'Bước 2: Chuẩn bị & Làm ấm',
                desc: 'Chiếu đèn hồng ngoại hoặc sử dụng thảo dược ấm để làm giãn nở mao mạch, xoa dịu các thụ thể cảm giác đau.'
              },
              {
                title: 'Bước 3: Trị liệu chuyên sâu',
                desc: 'Áp dụng các kỹ thuật mô mềm giải cơ sâu, di động khớp bằng tay hoặc kết hợp sóng siêu âm/điện xung.'
              },
              {
                title: 'Bước 4: Phục hồi chủ động',
                desc: 'Kéo giãn cơ thụ động củng cố biên độ vận động và hướng dẫn các bài tập tự giãn cơ duy trì hiệu quả tại nhà.'
              }
            ].map((step, idx) => {
              const delayClasses = ['delay-100', 'delay-200', 'delay-300', 'delay-300'];
              return (
                <div 
                  key={idx} 
                  className={`bg-slate-50/50 rounded-3xl p-6 border border-slate-100 hover:border-primary/20 transition-all reveal-on-scroll ${delayClasses[idx]}`}
                >
                  <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="font-heading font-extrabold text-secondary text-sm md:text-base leading-snug mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                    {step.desc}
                  </p>
                </div>
              );
            })}

          </div>
        </div>

        {/* Section 4: Cam kết từ RehabFlow */}
        <div className="mb-16 max-w-5xl mx-auto bg-gradient-to-br from-secondary to-[#151f32] rounded-[40px] px-8 md:px-16 py-12 text-center text-white relative overflow-hidden shadow-xl border border-white/5 reveal-on-scroll scale-in">
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="size-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto text-primary">
              <ShieldCheck size={24} />
            </div>
            
            <h3 className="text-xl md:text-3xl font-heading font-black tracking-tight leading-tight uppercase">
              Cam kết chất lượng chuẩn y khoa
            </h3>
            
            <p className="text-slate-300 text-xs md:text-sm font-semibold max-w-lg mx-auto leading-relaxed">
              Tất cả các buổi trị liệu đơn lẻ tại Office Care Clinic đều được thực hiện theo tiêu chuẩn khắt khe, sử dụng vật tư y tế cao cấp và được kiểm soát trực tiếp bởi các bác sĩ phục hồi chức năng chuyên khoa.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={handleBooking}
                type="button"
                className="w-full sm:w-auto bg-primary hover:bg-[#25A89C] text-white font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-md shadow-primary/25 hover:shadow-primary/35"
              >
                Đặt lịch trị liệu ngay
              </button>
              
              <a
                href="tel:19001234"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95"
              >
                <Phone size={13} /> Gọi hotline 1900 1234
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Sticky CTA capsule that slides up when scrolling down */}
      <div className={`fixed bottom-6 left-6 right-6 z-40 transition-all duration-550 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
        showStickyCTA ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full px-6 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="size-2.5 bg-primary rounded-full animate-pulse shrink-0"></span>
            <div>
              <p className="text-xs font-black text-secondary uppercase tracking-wider">{service.ten_dich_vu}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{formatPrice(service.don_gia)} / buổi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="tel:19001234" 
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-extrabold text-secondary bg-slate-100 hover:bg-slate-200/60 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 border border-slate-200/40 hover:border-slate-300 shadow-xs"
            >
              <Phone size={12} /> <span className="hidden md:inline">1900 1234</span>
            </a>
            <button
              onClick={handleBooking}
              className="bg-primary hover:bg-[#25A89C] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-md shadow-primary/20 flex items-center gap-1.5 group"
            >
              Đặt lịch ngay <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
