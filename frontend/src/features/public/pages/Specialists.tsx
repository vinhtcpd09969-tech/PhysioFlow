import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  Users,
  ChevronRight,
  Calendar
} from 'lucide-react';
import ClinicBannerSlider from '../../../components/ClinicBannerSlider';
import { MOCK_SPECIALISTS } from '../../../data/specialistsData';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'giam-dau', label: 'Giảm đau' },
  { id: 'phuc-hoi-van-dong', label: 'Phục hồi vận động' },
  { id: 'y-hoc-the-thao', label: 'Y học thể thao' }
];

export default function Specialists() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [visibleCount, setVisibleCount] = useState(6);

  // Scroll reveal animation handler
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
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [selectedCategory, sortBy, visibleCount]);

  // Filter & Sort Specialists
  const filteredAndSortedSpecialists = useMemo(() => {
    let result = [...MOCK_SPECIALISTS];

    // Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(spec => spec.category === selectedCategory);
    }

    // Sorting
    if (sortBy === 'rating-desc') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'experience-desc') {
      result.sort((a, b) => b.experience - a.experience);
    }

    return result;
  }, [selectedCategory, sortBy]);



  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-body relative overflow-x-hidden">
      {/* Scroll Reveal Styles */}
      <style>{`
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
        .slide-fade-enter {
          opacity: 0;
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* 1. Cinematic Banner Slider */}
      <ClinicBannerSlider page="specialists" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
        {/* Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-400 mb-4 select-none">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-secondary font-bold">Kỹ thuật viên</span>
        </nav>

        {/* Page Header */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-secondary uppercase tracking-tight mb-4">
            Đội ngũ chuyên viên
          </h1>
          <div className="w-16 h-1 bg-primary rounded-full mb-4"></div>
          <p className="text-sm md:text-base text-slate-500 font-semibold leading-relaxed">
            Kết nối với các chuyên gia hàng đầu để phục hồi sức khỏe của bạn. Chúng tôi cam kết mang lại sự tận tâm, tinh tế và chính xác trong từng phác đồ trị liệu.
          </p>
        </div>

        {/* 2. Custom Advanced Filters Bar */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 md:p-6 mb-12 shadow-[0_15px_40px_rgba(15,23,42,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Category Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-2">
              <Filter size={14} className="text-primary" /> Lọc theo:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setVisibleCount(6);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:border-slate-300 hover:bg-slate-100/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right: Sort Dropdown */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Sắp xếp:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 focus:outline-none focus:border-primary cursor-pointer pr-10 transition-colors"
              >
                <option value="default">Mặc định</option>
                <option value="rating-desc">Đánh giá cao nhất</option>
                <option value="experience-desc">Kinh nghiệm nhiều nhất</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* 3. Specialists grid with scroll reveals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedSpecialists.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-xs">
              <Users size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400 font-bold text-sm">Không tìm thấy chuyên viên nào phù hợp.</p>
            </div>
          ) : (
            filteredAndSortedSpecialists.slice(0, visibleCount).map((spec, idx) => (
              <div
                key={spec.id}
                className="reveal-on-scroll bg-white rounded-[28px] border border-slate-100/80 hover:border-primary/25 shadow-[0_15px_40px_rgba(15,23,42,0.02)] hover:shadow-soft-ui-hover hover:-translate-y-1.5 transition-all duration-500 p-6 flex flex-col justify-between group relative"
                style={{ transitionDelay: `${(idx % 3) * 100}ms` }}
              >
                <div>
                  {/* Top card metrics */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-500 border border-amber-100 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs">
                      <Star size={12} className="fill-amber-500 stroke-amber-500" />
                      <span>{spec.rating.toFixed(1)}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200/80 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs">
                      <Award size={12} className="text-primary" />
                      <span>{spec.experience} Năm KN</span>
                    </div>
                  </div>

                  {/* Avatar and Info */}
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative w-28 h-28 mb-4">
                      {/* Avatar border with gradient shine on hover */}
                      <div className="absolute inset-0 rounded-full border-[3px] border-primary/20 group-hover:border-primary/60 transition-all duration-500" />
                      <img
                        src={spec.avatar}
                        alt={spec.name}
                        className="w-full h-full object-cover rounded-full p-1 bg-white"
                        loading="lazy"
                      />
                      
                      {/* Status indicator badge */}
                      <div className={`absolute bottom-1 right-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1 border border-white ${
                        spec.status === 'available'
                          ? 'bg-emerald-500' 
                          : spec.status === 'today'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-rose-500'
                      }`}>
                        <span className="w-1 h-1 rounded-full bg-white block" />
                        {spec.statusLabel}
                      </div>
                    </div>

                    <h3 className="font-heading font-black text-xl text-secondary group-hover:text-primary transition-colors leading-tight mb-1">
                      {spec.name}
                    </h3>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      {spec.role}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6 text-center px-2">
                    {spec.description}
                  </p>
                </div>

                {/* Buttons action area */}
                <div className="pt-5 border-t border-slate-100">
                  <Link
                    to={`/specialists/${spec.id}`}
                    className="bg-[#0f3327] hover:bg-[#154637] text-white text-center font-extrabold py-3.5 w-full rounded-xl text-xs uppercase tracking-widest shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    Xem chi tiết
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 4. Show More Button (Pagination) */}
        {filteredAndSortedSpecialists.length > visibleCount && (
          <div className="flex justify-center mt-14 reveal-on-scroll">
            <button
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 group shadow-sm"
            >
              <span>Xem thêm chuyên viên</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* 5. Direct Booking Bottom CTA Banner */}
        <div className="reveal-on-scroll mt-20 bg-secondary rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-soft-ui border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 max-w-5xl mx-auto">
            <div className="max-w-2xl">
              <span className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3">
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
              className="bg-primary hover:bg-[#25A89C] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-full shadow-soft-button hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 shrink-0"
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
