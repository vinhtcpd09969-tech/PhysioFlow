import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  Award, 
  Star, 
  Calendar, 
  Info,
  Loader2,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { MOCK_SPECIALISTS, Specialist } from '../../../data/specialistsData';
import toast from 'react-hot-toast';

export default function SpecialistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);

  useEffect(() => {
    // Simulate slight loading for premium feel transition
    setLoading(true);
    const foundSpecialist = MOCK_SPECIALISTS.find(s => s.id === id);
    if (foundSpecialist) {
      setSpecialist(foundSpecialist);
    } else {
      toast.error('Không tìm thấy chuyên viên này.');
      navigate('/specialists');
    }
    setLoading(false);
  }, [id, navigate]);

  // Set Document Title for SEO
  useEffect(() => {
    if (specialist) {
      document.title = `${specialist.name} - ${specialist.role} | Office Care`;
    }
  }, [specialist]);

  // Scroll reveal Intersection Observer
  useEffect(() => {
    if (loading || !specialist) return;

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
  }, [loading, specialist]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24">
        <Loader2 className="animate-spin w-10 h-10 text-primary mb-3" />
        <p className="font-bold text-slate-400 text-sm">Đang tải hồ sơ chuyên gia...</p>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24 text-center px-4">
        <div className="size-16 rounded-2xl bg-teal-50 flex items-center justify-center text-[#2EC4B6] border border-teal-100 mb-4">
          <Info size={30} />
        </div>
        <h2 className="text-[#0B1222] font-bold text-lg">Không tìm thấy thông tin chuyên gia</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">Hồ sơ chuyên viên này không tồn tại hoặc đã ngừng cộng tác.</p>
        <Link to="/specialists" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#25A89C]">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]/50 pt-28 pb-24 font-body relative overflow-hidden">
      {/* Scroll Reveal Styles */}
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
        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
      `}</style>

      {/* Visual background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-[#E8F8F2]/30 via-transparent to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to="/specialists" className="hover:text-primary transition-colors">Chuyên viên</Link>
            <span>/</span>
            <span className="text-primary font-extrabold">{specialist.name}</span>
          </div>

          <Link
            to="/specialists"
            className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 tracking-wider transition-colors bg-white border border-slate-200/60 px-5 py-2.5 rounded-xl shadow-xs"
          >
            ← Đội ngũ chuyên viên
          </Link>
        </div>

        {/* Section 1: Hero Block */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Image Column */}
            <div className="lg:col-span-4 relative group">
              <div className="aspect-square rounded-[32px] overflow-hidden shadow-md border border-slate-100 relative">
                <img 
                  src={specialist.avatar} 
                  alt={specialist.name} 
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                />
                
                {/* Rating Badge Overlay */}
                <div className="absolute bottom-4 left-4 bg-[#0F3327] text-white px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                  <Star size={13} className="fill-amber-400 stroke-amber-400" />
                  <span>{specialist.rating.toFixed(1)} Rating</span>
                </div>
              </div>
            </div>

            {/* General Info Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-heading font-black text-secondary uppercase tracking-tight">
                  {specialist.name}
                </h1>
                <p className="text-base md:text-lg text-primary font-extrabold tracking-wide">
                  {specialist.role}
                </p>
              </div>

              {/* Quick Metrics */}
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 py-1.5 border-y border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-primary" />
                  <span>{specialist.experience} Năm kinh nghiệm</span>
                </div>
                <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-1.5">
                  <Award size={16} className="text-primary" />
                  <span>Chứng chỉ Quốc tế</span>
                </div>
              </div>

              {/* Professional Expertise Biography */}
              <div className="space-y-3">
                <h3 className="font-heading font-black text-secondary text-sm md:text-base uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full block" />
                  Chuyên môn (Professional Expertise)
                </h3>
                <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                  {specialist.biography}
                </p>
              </div>

              {/* Pathologies Tags */}
              <div className="space-y-3">
                <h3 className="font-heading font-black text-secondary text-xs uppercase tracking-wider">
                  Chuyên về các bệnh lý
                </h3>
                <div className="flex flex-wrap gap-2">
                  {specialist.diseases.map((disease, dIdx) => (
                    <span 
                      key={dIdx}
                      className="bg-[#E8F8F2] text-[#2EC4B6] border border-[#2EC4B6]/10 text-xs font-black px-5 py-2 rounded-full uppercase tracking-wider shadow-2xs hover:shadow-xs transition-shadow duration-300"
                    >
                      {disease}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Split Detailed Info (8:4 layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Education, Articles, Reviews */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Education and Qualifications Block */}
            <div className="reveal-on-scroll bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_12px_35px_rgba(15,23,42,0.01)]">
              <h2 className="font-heading font-black text-secondary text-xl uppercase tracking-tight mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full block" />
                Giấy chứng nhận & Học vấn
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {specialist.education.map((edu, eIdx) => (
                  <div 
                    key={eIdx}
                    className="p-6 bg-[#E8F8F2]/30 border border-[#2EC4B6]/10 rounded-2xl flex gap-4 hover:border-[#2EC4B6]/30 transition-colors duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary border border-slate-100 shrink-0 text-lg shadow-sm">
                      {eIdx === 0 ? '🎓' : '📜'}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-black text-secondary text-sm leading-snug">
                        {edu.degree}
                      </h4>
                      <p className="text-xs text-slate-500 font-bold leading-tight">
                        {edu.school}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {edu.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Articles Block */}
            <div className="reveal-on-scroll bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_12px_35px_rgba(15,23,42,0.01)]">
              <h2 className="font-heading font-black text-secondary text-xl uppercase tracking-tight mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full block" />
                Các bài viết chuyên sâu
              </h2>

              <div className="space-y-4">
                {specialist.articles.map((art) => (
                  <Link
                    key={art.id}
                    to={`/articles/${art.id}`}
                    className="flex flex-col sm:flex-row items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50/20 transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:bg-primary/10 shrink-0 transition-colors duration-300 shadow-2xs">
                      <BookOpen size={18} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{art.readTime}</span>
                        <span className="text-[10px] text-primary font-black uppercase tracking-wider">{art.category}</span>
                      </div>
                      <h4 className="font-heading font-black text-[#0B1222] group-hover:text-primary transition-colors text-sm md:text-base leading-snug">
                        {art.title}
                      </h4>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                        {art.summary}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Reviews Block */}
            <div className="reveal-on-scroll bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_12px_35px_rgba(15,23,42,0.01)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <h2 className="font-heading font-black text-secondary text-xl uppercase tracking-tight flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full block" />
                  Đánh giá từ khách hàng
                </h2>
                
                {/* Aggregate Rating Badge */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, sIdx) => (
                      <Star key={sIdx} size={15} className="fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-black text-secondary">
                    {specialist.rating.toFixed(1)} / 5.0 ({specialist.reviews.length} đánh giá)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialist.reviews.map((rev, rIdx) => (
                  <div 
                    key={rIdx}
                    className="p-5 bg-slate-50/40 border border-slate-100/70 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center text-[#2EC4B6] font-black text-xs shrink-0">
                        {rev.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-heading font-black text-secondary text-xs">{rev.name}</h4>
                        <p className="text-[9px] text-slate-400 font-bold">{rev.disease}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, sIdx) => (
                          <Star key={sIdx} size={12} className="fill-amber-400 stroke-amber-400" />
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full">
                        Đã đánh giá {rev.rating}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Info card */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="reveal-on-scroll bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_15px_45px_rgba(15,23,42,0.025)] space-y-6">
              
              <div className="space-y-2">
                <span className="text-[#2EC4B6] text-[10px] font-black uppercase tracking-widest block">
                  Quy trình Y khoa
                </span>
                <h3 className="font-heading font-black text-secondary text-lg uppercase tracking-tight">
                  Điều phối Chuyên gia
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Nhằm bảo đảm hiệu quả trị liệu cao nhất, Office Care áp dụng quy trình phân công chuyên gia dựa trên chẩn đoán thực tế:
                </p>
              </div>

              {/* Step Flow List */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 before:border-dashed before:border-slate-200">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 size-4 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-500/10 flex items-center justify-center"></div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-secondary uppercase tracking-wide flex items-center gap-1.5">
                      Bước 1: Khám lâm sàng
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Bác sĩ chuyên khoa khám trực tiếp, xác định nguyên nhân cốt lõi gây đau mỏi.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 size-4 rounded-full bg-[#2EC4B6] border-2 border-white ring-4 ring-[#2EC4B6]/10 flex items-center justify-center"></div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-secondary uppercase tracking-wide">
                      Bước 2: Chỉ định phác đồ
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Thiết lập liệu trình cá nhân hóa (Số buổi, kỹ thuật giải cơ, bài tập phục hồi).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 size-4 rounded-full bg-[#0F3327] border-2 border-white ring-4 ring-[#0F3327]/10 flex items-center justify-center"></div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-secondary uppercase tracking-wide">
                      Bước 3: Điều phối chuyên gia
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Điều phối Kỹ thuật viên có tay nghề chuyên sâu và phù hợp nhất với bệnh lý của bạn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Commitments pills */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <p className="text-[10px] font-black text-secondary">Cá nhân hóa</p>
                  <p className="text-[8px] text-slate-400 font-bold mt-0.5">Phác đồ riêng biệt</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <p className="text-[10px] font-black text-secondary">An toàn y khoa</p>
                  <p className="text-[8px] text-slate-400 font-bold mt-0.5">Giám sát chặt chẽ</p>
                </div>
              </div>

              {/* Action booking button */}
              <div className="space-y-3 pt-2">
                <Link
                  to="/booking"
                  className="bg-[#0F3327] hover:bg-[#154637] text-white text-center font-extrabold py-4 w-full rounded-full text-xs uppercase tracking-widest shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Calendar size={14} />
                  Đăng ký khám lâm sàng
                  <ArrowRight size={13} />
                </Link>
                <p className="text-[10px] text-center text-slate-400 font-semibold leading-normal px-2">
                  * Đăng ký khám chung để được xếp phòng khám và bác sĩ phù hợp nhất.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
