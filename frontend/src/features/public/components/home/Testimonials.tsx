import { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import ScrollReveal from '../effects/ScrollReveal';
import { getPublicTestimonials } from '../../api/public.api';
import { censorText } from '../../../../utils/profanity';

interface Testimonial {
  id: string;
  ho_ten: string;
  nhan_xet: string;
  so_sao: number;
  gioi_tinh: string | null;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const response = await getPublicTestimonials();
        setTestimonials(response.data);
      } catch (err) {
        console.error('Lỗi khi lấy đánh giá:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  const getGradient = (gender: string | null) => {
    if (gender === 'nam') return 'from-[#3B82F6] to-[#2EC4B6]';
    if (gender === 'nu') return 'from-[#FF9F1C] to-[#F59E0B]';
    return 'from-[#14B8A6] to-[#2EC4B6]';
  };

  const getInitial = (name: string) => {
    if (!name) return 'K';
    const parts = name.split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  if (loading || testimonials.length === 0) {
    return null;
  }

  // Duplicate list to make infinite marquee effect seamless
  const marqueeItems = [...testimonials, ...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="py-10 lg:py-12 bg-slate-50/30 dark:bg-slate-950/30 border-t border-b border-slate-100 dark:border-slate-800 relative overflow-hidden font-jakarta transition-colors">
      {/* Background Decorative Circles */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[300px] bg-[#14B8A6]/5 rounded-full blur-[80px] z-0"></div>
      <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-[#FF9F1C]/3 rounded-full blur-[70px] z-0"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 lg:mb-10">
          <ScrollReveal>
            <span className="text-[11px] font-bold tracking-wider text-[#0D9488] dark:text-teal-300 bg-[#14B8A6]/10 px-3.5 py-1 rounded-full inline-block mb-2 shadow-2xs">
              💌 Đánh giá từ bệnh nhân
            </span>
            <h2 className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 dark:text-white tracking-tight leading-snug">
              Hành Trình Hồi Phục Đầy Cảm Hứng
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-1.5 text-xs sm:text-sm leading-relaxed">
              Đánh giá thực tế từ bệnh nhân đã hoàn thành phác đồ phục hồi sức khỏe cột sống &amp; cơ xương khớp tại OfficeCare.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Infinite Horizontal Marquee Carousel */}
      <div className="w-full overflow-hidden py-4 relative">
        {/* Left & Right fading masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F9FAFB] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F9FAFB] to-transparent z-10 pointer-events-none"></div>

        <div className="flex gap-6 animate-marquee whitespace-nowrap hover:[animation-play-state:paused] cursor-pointer">
          {marqueeItems.map((t, idx) => (
            <div 
              key={`${t.id}-${idx}`} 
              className="inline-block whitespace-normal bg-white rounded-[32px] p-8 border border-slate-100/80 shadow-[0_15px_40px_rgba(15,23,42,0.015)] w-[360px] shrink-0 relative flex flex-col justify-between h-[240px] group transition-all duration-300 hover:shadow-[0_25px_50px_rgba(15,23,42,0.05)] hover:-translate-y-1"
            >
              {/* Quote decoration */}
              <div className="absolute top-6 right-8 text-slate-100 group-hover:text-teal-50 transition-colors">
                <Quote size={40} className="stroke-[1.5]" />
              </div>

              <div className="space-y-4 relative z-10">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(t.so_sao || 5)].map((_, i) => (
                    <Star key={i} size={14} fill="#FF9F1C" className="text-[#FF9F1C] border-none" />
                  ))}
                </div>

                {/* Feedback text */}
                <p className="text-slate-600 text-xs md:text-sm font-semibold leading-relaxed line-clamp-4">
                  "{censorText(t.nhan_xet)}"
                </p>
              </div>

              {/* Profile row */}
              <div className="flex items-center gap-4 border-t border-slate-100/80 pt-4 mt-auto relative z-10">
                <div className={`w-10 h-10 bg-gradient-to-br ${getGradient(t.gioi_tinh)} rounded-full flex items-center justify-center font-black text-white text-xs shadow-sm`}>
                  {getInitial(t.ho_ten)}
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-slate-900 leading-tight">
                    {t.ho_ten}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-extrabold mt-0.5 uppercase tracking-wider">
                    {t.gioi_tinh === 'nam' ? 'Bệnh nhân Nam' : t.gioi_tinh === 'nu' ? 'Bệnh nhân Nữ' : 'Bệnh nhân'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
