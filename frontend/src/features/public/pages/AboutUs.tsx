import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  CheckCircle2, 
  Target, 
  Heart, 
  Calendar, 
  ArrowRight, 
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  Play,
  Star,
  X
} from 'lucide-react';
import { MOCK_SPECIALISTS } from '../../../data/specialistsData';

// Lightweight animated counter component
function AnimatedCounter({ target, duration = 1500, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function AboutUs() {
  const [activeMilestone, setActiveMilestone] = useState(2);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

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
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Milestone timeline data
  const MILESTONES = [
    {
      year: '2021',
      title: 'Khởi đầu Sứ mệnh',
      desc: 'Office Care được thành lập với chi nhánh đầu tiên, tập trung giải quyết đau mỏi vai gáy chuyên sâu cho nhân viên công nghệ.'
    },
    {
      year: '2023',
      title: 'Phát triển Quy mô',
      desc: 'Nâng cấp phòng khám chuyên sâu với không gian vô trùng đạt chuẩn y khoa và hệ thống trang thiết bị siêu âm hiện đại.'
    },
    {
      year: '2025',
      title: 'Tiên phong Y học Vận động',
      desc: 'Hợp tác chuyển giao công nghệ trị liệu OMT từ Australia, hoàn thiện mô hình phác đồ cá nhân hóa không xâm lấn.'
    },
    {
      year: '2026',
      title: 'Cột mốc Tin yêu',
      desc: 'Đồng hành phục hồi vận động thành công cho hơn 10,000+ bệnh nhân, đạt chỉ số hài lòng dịch vụ tuyệt đối 98%.'
    }
  ];

  // Core values data
  const CORE_VALUES = [
    {
      icon: Target,
      title: 'Chuẩn xác & Cá nhân hóa',
      desc: 'Không áp dụng một công thức chung. Mọi bệnh nhân đều được khám lâm sàng kỹ lưỡng và thiết lập phác đồ trị liệu riêng biệt.'
    },
    {
      icon: ShieldCheck,
      title: 'Y khoa & Minh bạch',
      desc: '100% quy trình tuân thủ tiêu chuẩn y tế quốc tế. Dữ liệu đánh giá và tiến trình phục hồi được báo cáo rõ ràng qua ứng dụng.'
    },
    {
      icon: Heart,
      title: 'Tận tâm & Đồng hành',
      desc: 'Chúng tôi coi việc giải phóng cơn đau của bạn là sứ mệnh. Bác sĩ và KTV luôn theo sát, hướng dẫn tự tập luyện phòng ngừa tái phát.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]/50 pt-28 pb-24 font-body relative overflow-hidden">
      {/* Visual background gradient effects */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#E8F8F2]/30 via-transparent to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-[800px] -right-96 w-[600px] h-[600px] bg-[#2EC4B6]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Dotted Grid Background */}
      <style>{`
        .bg-dotted-grid {
          background-size: 24px 24px;
          background-image: radial-gradient(circle, rgba(15, 23, 42, 0.03) 1.5px, transparent 1.5px);
        }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .reveal-on-scroll.active-reveal {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
        }
        .animate-float-slow {
          animation: float-slow 5s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-slow 5.5s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 7s ease-in-out infinite;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-primary font-extrabold">Giới thiệu</span>
          </div>
        </div>

        {/* Section 1: Hero Storytelling Banner */}
        <div className="reveal-on-scroll bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.025)] p-6 md:p-12 mb-16 relative overflow-hidden">
          {/* Subtle glow effect behind content */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#2EC4B6]/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Left Content column */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1.5 text-primary text-[11px] font-black uppercase tracking-widest bg-[#2EC4B6]/10 px-4 py-1.5 rounded-full">
                <span className="size-1.5 bg-[#2EC4B6] rounded-full animate-pulse"></span>
                Về chúng tôi
              </span>
              <h1 className="font-heading font-black text-secondary text-3xl md:text-4xl lg:text-5xl uppercase tracking-normal leading-[1.3] md:leading-[1.3] lg:leading-[1.3] py-2">
                Kiến tạo kỷ nguyên <br className="hidden md:inline" />
                <span className="text-[#2EC4B6]">Sức khỏe văn phòng</span>
              </h1>
              <p className="text-slate-600 text-sm md:text-base font-semibold leading-relaxed">
                Office Care được thành lập từ khát vọng giải phóng những cơn đau mỏi âm ỉ của hàng triệu nhân viên văn phòng Việt Nam. Chúng tôi tiên phong ứng dụng mô hình Trị liệu vận động chính xác và Vật lý trị liệu chuẩn y khoa, giúp phục hồi cơ xương khớp tận gốc rễ một cách an toàn và bền vững.
              </p>
              
              {/* Highlight list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Chẩn đoán chính xác tận gốc</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Phác đồ OMT không xâm lấn</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Đội ngũ KTV chứng chỉ quốc tế</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Đồng hành trị liệu bền vững</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/booking"
                  className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded-full shadow-soft-button hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={14} />
                  Đặt lịch khám ngay
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/services"
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-center font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded-full border border-slate-200/60 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
                >
                  Tìm hiểu liệu trình
                </Link>
              </div>
            </div>

            {/* Right Interactive Visual column */}
            <div className="lg:col-span-5 relative min-h-[360px] lg:min-h-[420px] flex items-center justify-center mt-6 lg:mt-0">
              {/* Back ambient glowing blob */}
              <div className="absolute w-64 h-64 bg-[#2EC4B6]/10 rounded-full blur-2xl pointer-events-none animate-pulse-glow" />
              
              {/* Main Visual Image container */}
              <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl border border-slate-100 group">
                <img 
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80" 
                  alt="Không gian phòng khám Office Care" 
                  className="w-full h-full object-cover scale-101 group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Card 1: 10,000+ patients */}
              <div className="absolute -top-4 -right-2 md:-right-6 glass-card border border-white/60 rounded-[24px] p-4.5 shadow-xl flex items-center gap-3 max-w-[210px] animate-float-slow select-none animate-delay-1">
                <div className="w-9 h-9 rounded-lg bg-[#2EC4B6]/15 flex items-center justify-center text-[#2EC4B6] shrink-0 font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase text-secondary tracking-wide">10,000+ Bệnh Nhân</h4>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">Đã phục hồi vận động, giải thoát đau mỏi.</p>
                </div>
              </div>

              {/* Floating Card 2: 98% satisfaction (dark glass) */}
              <div className="absolute bottom-10 -right-2 md:-right-8 bg-[#0B1222]/90 backdrop-blur-md border border-slate-800 text-white rounded-[24px] p-4.5 shadow-2xl flex items-center gap-3 max-w-[200px] animate-float-delayed select-none">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-sm font-extrabold">
                  98%
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wide">Sự hài lòng</h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Đánh giá tuyệt đối từ khách hàng.</p>
                </div>
              </div>

              {/* Floating Card 3: Medical standards */}
              <div className="absolute -bottom-4 -left-2 md:-left-8 glass-card border border-white/60 text-secondary rounded-[24px] p-4.5 shadow-xl flex items-center gap-3 max-w-[200px] animate-float-slow select-none">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wide">Chuẩn y khoa</h4>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">Phác đồ OMT quốc tế kiểm định khắt khe.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Clinical Statistics (Count-up Board) */}
        <div className="reveal-on-scroll bg-[#0B1222] border border-slate-800 rounded-[40px] p-8 md:p-12 mb-16 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2EC4B6]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2EC4B6]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
            {/* Stat 1 */}
            <div className="pt-6 lg:pt-0">
              <div className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight flex items-center justify-center gap-0.5">
                <AnimatedCounter target={10000} suffix="+" />
              </div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest mt-2">Bệnh nhân phục hồi</p>
            </div>
            
            {/* Stat 2 */}
            <div className="pt-6 lg:pt-0">
              <div className="text-3xl md:text-5xl font-heading font-black text-[#2EC4B6] tracking-tight flex items-center justify-center gap-0.5">
                <AnimatedCounter target={98} suffix="%" />
              </div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest mt-2">Tỷ lệ hài lòng</p>
            </div>

            {/* Stat 3 */}
            <div className="pt-6 lg:pt-0">
              <div className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight flex items-center justify-center gap-0.5">
                <AnimatedCounter target={15} suffix="+" />
              </div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest mt-2">Bác sĩ & Kỹ thuật viên</p>
            </div>

            {/* Stat 4 */}
            <div className="pt-6 lg:pt-0">
              <div className="text-3xl md:text-5xl font-heading font-black text-[#2EC4B6] tracking-tight flex items-center justify-center gap-0.5">
                <AnimatedCounter target={1} />
              </div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest mt-2">Trung tâm phòng khám</p>
            </div>
          </div>
        </div>

        {/* Section 3: Core Values (Asymmetric Grid) */}
        <div className="mb-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#2EC4B6] font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-1.5 mb-2">
              <span className="size-1.5 bg-[#2EC4B6] rounded-full"></span> Trụ cột giá trị
            </span>
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-black text-secondary uppercase tracking-normal leading-[1.3] md:leading-[1.3] py-1">
              Giá trị cốt lõi tại Office Care
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CORE_VALUES.map((val, idx) => {
              const IconComponent = val.icon;
              return (
                <div 
                  key={idx}
                  className="group bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_12px_35px_rgba(15,23,42,0.01)] hover:shadow-[0_25px_50px_rgba(46,196,182,0.1)] hover:border-[#2EC4B6]/30 hover:-translate-y-2.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Subtle inner decorative glow on hover */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#2EC4B6]/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-[#2EC4B6]/12 transition-all duration-500" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#2EC4B6]/10 group-hover:bg-[#2EC4B6] flex items-center justify-center text-[#2EC4B6] group-hover:text-white transition-all duration-500">
                      <IconComponent size={22} />
                    </div>
                    <h3 className="font-heading font-black text-secondary text-base md:text-lg group-hover:text-[#2EC4B6] transition-colors duration-300">
                      {val.title}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                      {val.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3.5: Featured Specialists Highlight */}
        <div className="reveal-on-scroll mb-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#2EC4B6] font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-1.5 mb-2">
              <span className="size-1.5 bg-[#2EC4B6] rounded-full"></span> Đội ngũ tinh hoa
            </span>
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-black text-secondary uppercase tracking-normal leading-[1.3] md:leading-[1.3] py-1">
              Chuyên gia tiêu biểu tại Office Care
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {MOCK_SPECIALISTS.slice(0, 3).map((sp) => (
              <div 
                key={sp.id}
                className="group bg-white rounded-[32px] p-6 border border-slate-100 shadow-[0_12px_35px_rgba(15,23,42,0.01)] hover:shadow-[0_25px_50px_rgba(46,196,182,0.1)] hover:border-[#2EC4B6]/30 hover:-translate-y-2.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Photo Frame */}
                  <div className="relative aspect-square rounded-[24px] overflow-hidden mb-5 border border-slate-100 shadow-inner group-hover:border-[#2EC4B6]/30 transition-colors duration-500">
                    <img src={sp.avatar} alt={sp.name} className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-3 right-3 bg-[#0F3327] text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 stroke-amber-400" />
                      {sp.rating.toFixed(1)}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="space-y-2">
                    <span className="text-primary text-[10px] font-black uppercase tracking-widest block">{sp.role}</span>
                    <h3 className="font-heading font-black text-secondary text-base group-hover:text-primary transition-colors duration-300">
                      {sp.name}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-bold">
                      {sp.experience} năm kinh nghiệm chuyên sâu
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {sp.tags.map((tg, tIdx) => (
                        <span key={tIdx} className="bg-slate-50 text-slate-500 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-slate-100">
                          {tg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-50">
                  <Link 
                    to={`/specialists/${sp.id}`}
                    className="w-full py-3 bg-[#2EC4B6]/10 hover:bg-[#2EC4B6] text-[#2EC4B6] hover:text-white text-center font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Xem hồ sơ chi tiết
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Interactive Milestone Timeline */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 mb-16 relative bg-dotted-grid">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#2EC4B6] font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-1.5 mb-2">
              <span className="size-1.5 bg-[#2EC4B6] rounded-full"></span> Chặng đường phát triển
            </span>
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-black text-secondary uppercase tracking-normal leading-[1.3] md:leading-[1.3] py-1">
              Hành trình phát triển
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Left: Interactive milestone selection list */}
            <div className="lg:col-span-5 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 shrink-0">
              {MILESTONES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMilestone(idx)}
                  className={`flex items-center gap-4 text-left p-4 rounded-2xl transition-all duration-300 w-full shrink-0 lg:shrink select-none ${
                    idx === activeMilestone 
                      ? 'bg-[#E2FDF2] border border-[#2EC4B6]/20 shadow-xs' 
                      : 'bg-transparent border border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-base font-black px-3 py-1 rounded-full ${
                    idx === activeMilestone ? 'bg-[#2EC4B6] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {item.year}
                  </span>
                  <span className={`text-xs md:text-sm font-black transition-colors ${
                    idx === activeMilestone ? 'text-[#0F5A47]' : 'text-slate-500'
                  }`}>
                    {item.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Milestone description panel with smooth animation */}
            <div className="lg:col-span-7 bg-slate-50/50 border border-slate-100 rounded-[32px] p-8 h-[200px] flex flex-col justify-center animate-slide-up relative">
              <div className="space-y-3">
                <span className="text-primary text-[10px] font-black uppercase tracking-widest">
                  Mốc lịch sử: {MILESTONES[activeMilestone].year}
                </span>
                <h3 className="font-heading font-black text-secondary text-lg uppercase tracking-tight">
                  {MILESTONES[activeMilestone].title}
                </h3>
                <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                  {MILESTONES[activeMilestone].desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4.5: Virtual Tour & Image Gallery */}
        <div className="reveal-on-scroll mb-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#2EC4B6] font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-1.5 mb-2">
              <span className="size-1.5 bg-[#2EC4B6] rounded-full"></span> Không gian y tế
            </span>
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-black text-secondary uppercase tracking-normal leading-[1.3] md:leading-[1.3] py-2">
              Virtual Tour & Không gian phòng khám
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-semibold max-w-xl mx-auto mt-2">
              Khám phá không gian trị liệu chuẩn y khoa, hiện đại, vô trùng và được thiết kế tối ưu mang lại sự thư giãn, hồi phục tốt nhất cho bệnh nhân.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Card 1: Virtual Tour Video (col-span-2) */}
            <div 
              onClick={() => setIsVideoModalOpen(true)}
              className="group relative md:col-span-2 aspect-[16/9] md:aspect-auto md:h-[400px] rounded-[32px] overflow-hidden border border-slate-100 shadow-md cursor-pointer hover:shadow-xl hover:border-primary/20 transition-all duration-500"
            >
              <img 
                src="https://images.unsplash.com/photo-1616391182219-e080b4d1043a?auto=format&fit=crop&w=1200&q=80" 
                alt="Không gian sảnh tiếp đón Office Care" 
                className="w-full h-full object-cover scale-101 group-hover:scale-103 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
              
              {/* Pulsing Play Button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#2EC4B6] text-white flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all duration-300 relative">
                  <span className="absolute inset-0 rounded-full bg-[#2EC4B6]/40 animate-ping"></span>
                  <Play size={24} className="fill-white translate-x-0.5" />
                </div>
                <span className="text-white text-xs font-black uppercase tracking-widest bg-black/30 backdrop-blur-xs px-4 py-1.5 rounded-full border border-white/10">
                  Xem Video Tour Phòng Khám
                </span>
              </div>
            </div>

            {/* Card 2: Private treatment room */}
            <div className="group relative rounded-[32px] overflow-hidden border border-slate-100 shadow-md min-h-[200px] md:h-[400px] hover:shadow-xl hover:border-primary/20 transition-all duration-500">
              <img 
                src="https://images.unsplash.com/photo-1597764690523-15bea4c581c9?auto=format&fit=crop&w=600&q=80" 
                alt="Phòng trị liệu giải cơ Office Care" 
                className="w-full h-full object-cover scale-101 group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[#2EC4B6] text-[9px] font-black uppercase tracking-wider block mb-1">01. PHÒNG TRỊ LIỆU</span>
                <h4 className="text-white text-sm font-black uppercase tracking-wide">Giải cơ chuyên sâu & OMT</h4>
              </div>
            </div>

            {/* Card 3: Modern ultrasound diagnostics */}
            <div className="group relative rounded-[32px] overflow-hidden border border-slate-100 shadow-md min-h-[200px] hover:shadow-xl hover:border-primary/20 transition-all duration-500">
              <img 
                src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80" 
                alt="Trang thiết bị y khoa tại Office Care" 
                className="w-full h-full object-cover scale-101 group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[#2EC4B6] text-[9px] font-black uppercase tracking-wider block mb-1">02. TRANG THIẾT BỊ</span>
                <h4 className="text-white text-sm font-black uppercase tracking-wide">Siêu âm & Xung điện tần số cao</h4>
              </div>
            </div>

            {/* Card 4: Rehabilitation workspace (col-span-2) */}
            <div className="group relative md:col-span-2 rounded-[32px] overflow-hidden border border-slate-100 shadow-md min-h-[200px] hover:shadow-xl hover:border-primary/20 transition-all duration-500">
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80" 
                alt="Khu vực phục hồi vận động Office Care" 
                className="w-full h-full object-cover scale-101 group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[#2EC4B6] text-[9px] font-black uppercase tracking-wider block mb-1">03. KHU VỰC VẬN ĐỘNG</span>
                <h4 className="text-white text-sm font-black uppercase tracking-wide">Không gian phục hồi chức năng & Huấn luyện phòng ngừa tái phát</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Medical & Service Standards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
          <div className="space-y-6">
            <span className="text-primary text-[11px] font-black uppercase tracking-widest bg-[#2EC4B6]/10 px-4 py-1.5 rounded-full inline-block">
              Tiêu chuẩn chất lượng
            </span>
            <h2 className="font-heading font-black text-secondary text-2xl md:text-3xl lg:text-4xl uppercase tracking-normal leading-[1.3] md:leading-[1.3] py-1">
              Đảm bảo chuyên nghiệp <br />
              <span className="text-[#2EC4B6]">Tuyệt đối chuẩn y khoa</span>
            </h2>
            <p className="text-slate-600 text-xs md:text-sm font-semibold leading-relaxed">
              Mỗi liệu trình trị liệu được nghiên cứu bài bản, chuyển giao công nghệ chính thống từ các nền y học thể thao, giải cơ y học hiện đại hàng đầu thế giới. Bệnh nhân luôn nhận được cam kết cao nhất về chất lượng dịch vụ:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={13} />
                </div>
                <span className="text-xs font-bold text-slate-700">100% KTV có chứng chỉ</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={13} />
                </div>
                <span className="text-xs font-bold text-slate-700">Dụng cụ vô trùng 100%</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={13} />
                </div>
                <span className="text-xs font-bold text-slate-700">Trực tiếp Bác sĩ khám</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={13} />
                </div>
                <span className="text-xs font-bold text-slate-700">Hỗ trợ trị liệu tại nhà</span>
              </div>
            </div>
          </div>

          <div className="relative group rounded-[32px] overflow-hidden shadow-lg border border-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80" 
              alt="Bác sĩ đang trị liệu giải cơ cho khách hàng" 
              className="w-full h-full object-cover aspect-[4/3] group-hover:scale-102 transition-transform duration-700" 
            />
          </div>
        </div>

        {/* Section 5.5: Contact & Map Directions */}
        <div className="reveal-on-scroll bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Contact Information Column */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[#2EC4B6] text-[11px] font-black uppercase tracking-widest bg-[#2EC4B6]/10 px-4 py-1.5 rounded-full inline-block">
                Liên hệ & Chỉ đường
              </span>
              <h2 className="font-heading font-black text-secondary text-2xl md:text-3xl uppercase tracking-normal leading-[1.3] py-1">
                Địa chỉ trung tâm <br />
                <span className="text-[#2EC4B6]">Office Care</span>
              </h2>
              <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                Chúng tôi tọa lạc tại vị trí trung tâm, thuận tiện cho việc di chuyển và thăm khám trực tiếp của bạn. Hãy liên hệ hoặc làm theo bản đồ chỉ đường để đến phòng khám dễ dàng nhất.
              </p>

              <div className="space-y-4 pt-2">
                {/* Address Item */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 flex items-center justify-center text-[#2EC4B6] shrink-0 shadow-2xs">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-secondary uppercase tracking-wide">Địa chỉ trung tâm</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">40 Nguyễn Văn Linh, Bình Hiên, Hải Châu, Đà Nẵng</p>
                  </div>
                </div>

                {/* Hotline Item */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 flex items-center justify-center text-[#2EC4B6] shrink-0 shadow-2xs">
                    <Phone size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-secondary uppercase tracking-wide">Hotline đặt lịch</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">1900 6868 - (028) 7300 6868</p>
                  </div>
                </div>

                {/* Email Item */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 flex items-center justify-center text-[#2EC4B6] shrink-0 shadow-2xs">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-secondary uppercase tracking-wide">Hộp thư hỗ trợ</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">support@officecare.vn</p>
                  </div>
                </div>

                {/* Hours Item */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 flex items-center justify-center text-[#2EC4B6] shrink-0 shadow-2xs">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-secondary uppercase tracking-wide">Giờ làm việc</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">8:00 - 20:00 (Tất cả các ngày trong tuần, kể cả ngày Lễ)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map Column */}
            <div className="lg:col-span-7 bg-white/85 backdrop-blur-md p-2 border border-white/60 shadow-[0_20px_50px_rgba(15,23,42,0.04)] rounded-[38px] h-[396px] relative group">
              <div className="w-full h-full rounded-[30px] overflow-hidden relative">
                <iframe 
                  title="Bản đồ chỉ đường Office Care"
                  src="https://maps.google.com/maps?q=40%20Nguy%E1%BB%85n%20V%C4%83n%20Linh,%20B%C3%ACnh%20Hi%C3%AAn,%20H%E1%BA%A3i%20Ch%C3%A2u,%20%C4%90%C3%A0%20N%E1%BA%B5ng&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                  className="w-full h-full border-0 transition-all duration-700" 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Direct Booking CTA Banner */}
        <div className="reveal-on-scroll max-w-7xl mx-auto mb-12">
          <div className="bg-secondary rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-soft-ui border border-slate-800">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#2EC4B6]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2EC4B6]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 max-w-5xl mx-auto">
              <div className="max-w-2xl">
                <span className="text-[#2EC4B6] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3">
                  <CheckCircle2 size={13} /> Giải pháp chăm sóc sức khỏe chủ động
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black text-white leading-[1.3] md:leading-[1.3] uppercase tracking-normal mb-4">
                  Đừng để những cơn đau vai gáy làm phiền bạn
                </h2>
                <p className="text-slate-400 text-xs md:text-sm font-semibold leading-relaxed">
                  Lập kế hoạch khám trị liệu cá nhân cùng chuyên gia tại Office Care ngay hôm nay để lấy lại sự linh hoạt và dẻo dai vốn có.
                </p>
              </div>
              
              <Link
                to="/booking"
                className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-full shadow-soft-button hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Calendar size={15} />
                Đặt lịch hẹn ngay
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Video Tour Modal Overlay */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1222]/85 backdrop-blur-md p-4 transition-opacity duration-300 animate-fade-in">
          <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0B1222] flex items-center justify-center">
            {/* Close Button */}
            <button 
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors border border-white/10"
            >
              <X size={20} />
            </button>
            <iframe
              src="https://www.youtube.com/embed/mo4P6chrmx0?autoplay=1&mute=1&loop=1&playlist=mo4P6chrmx0&rel=0&controls=1"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 rounded-3xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
