import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Clock, 
  Calendar, 
  ArrowRight,
  Filter,
  ChevronRight
} from 'lucide-react';
import { MOCK_ARTICLES } from '../../../data/articlesData';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'cot-song', label: 'Cột Sống' },
  { id: 'van-phong', label: 'Văn Phòng' },
  { id: 'than-kinh', label: 'Thần Kinh' },
  { id: 'the-thao', label: 'Thể Thao' },
  { id: 'tu-the', label: 'Tư Thế' },
  { id: 'hau-phau', label: 'Hậu Phẫu' }
];

// Helper to map category id to database string
const mapCategory = (id: string): string => {
  switch (id) {
    case 'cot-song': return 'Cột Sống';
    case 'van-phong': return 'Văn Phòng';
    case 'than-kinh': return 'Thần Kinh';
    case 'the-thao': return 'Thể Thao';
    case 'tu-the': return 'Tư Thế';
    case 'hau-phau': return 'Hậu Phẫu';
    default: return 'all';
  }
};

export default function Articles() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(7);

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
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [selectedCategory, searchQuery, visibleCount]);

  // Set Document Title for SEO
  useEffect(() => {
    document.title = 'Kiến thức Y khoa & Phục hồi chức năng | Office Care';
  }, []);

  // Filter & Search articles
  const filteredArticles = useMemo(() => {
    let result = [...MOCK_ARTICLES];

    // Category filter
    if (selectedCategory !== 'all') {
      const dbCategoryName = mapCategory(selectedCategory);
      result = result.filter(art => art.category === dbCategoryName);
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        art => 
          art.title.toLowerCase().includes(query) || 
          art.summary.toLowerCase().includes(query) || 
          art.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [selectedCategory, searchQuery]);

  // Featured article (first one in the filtered list)
  const featuredArticle = useMemo(() => {
    return filteredArticles.length > 0 ? filteredArticles[0] : null;
  }, [filteredArticles]);

  // Other grid articles (excluding the featured one)
  const gridArticles = useMemo(() => {
    return featuredArticle ? filteredArticles.filter(a => a.id !== featuredArticle.id) : [];
  }, [filteredArticles, featuredArticle]);

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
      `}</style>

      {/* Visual background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-[#E8F8F2]/30 via-transparent to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10 pt-20">
        
        {/* Navigation Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-400 mb-4 select-none">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="mx-2 text-slate-350">/</span>
          <span className="text-secondary font-bold">Kiến thức Y khoa</span>
        </nav>

        {/* Page Header */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-secondary uppercase tracking-tight mb-4">
            Kiến thức y khoa
          </h1>
          <div className="w-16 h-1 bg-primary rounded-full mb-4"></div>
          <p className="text-sm md:text-base text-slate-500 font-semibold leading-relaxed">
            Khám phá các cẩm nang, nghiên cứu khoa học và cẩm nang tự tập luyện phục hồi chấn thương tại chỗ được bảo trợ chuyên môn bởi đội ngũ bác sĩ và kỹ thuật viên tại Office Care.
          </p>
        </div>

        {/* 2. Custom Advanced Filters Bar */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 md:p-6 mb-12 shadow-[0_15px_40px_rgba(15,23,42,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Category Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-2">
              <Filter size={14} className="text-primary" /> Chuyên ngành:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setVisibleCount(7);
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

          {/* Right: Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-slate-400 text-secondary"
            />
          </div>
        </div>

        {/* 3. Featured Article (Big Card) */}
        {featuredArticle && searchQuery.trim() === '' && selectedCategory === 'all' && (
          <div className="reveal-on-scroll bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-10 mb-12 group overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Featured Cover Photo */}
              <div className="lg:col-span-6 overflow-hidden rounded-[32px] aspect-video relative">
                <img 
                  src={featuredArticle.coverImage} 
                  alt={featuredArticle.title} 
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                  ★ Nổi bật
                </div>
              </div>

              {/* Featured Info */}
              <div className="lg:col-span-6 space-y-5">
                <div className="flex flex-wrap gap-2.5 items-center">
                  <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-primary/20">
                    {featuredArticle.category}
                  </span>
                  <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                    <Clock size={14} className="text-primary" /> {featuredArticle.readTime}
                  </span>
                  <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                    <Calendar size={14} className="text-primary" /> {featuredArticle.publishDate}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-heading font-black text-secondary leading-tight uppercase group-hover:text-primary transition-colors duration-300">
                  <Link to={`/articles/${featuredArticle.id}`}>
                    {featuredArticle.title}
                  </Link>
                </h2>

                <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                  {featuredArticle.summary}
                </p>

                {/* Author Badge */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={featuredArticle.authorAvatar} 
                      alt={featuredArticle.authorName} 
                      className="size-9 rounded-full object-cover border border-primary/25"
                    />
                    <div>
                      <p className="text-[11px] font-black text-secondary uppercase tracking-wider leading-none">{featuredArticle.authorName}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{featuredArticle.authorRole}</p>
                    </div>
                  </div>

                  <Link 
                    to={`/articles/${featuredArticle.id}`}
                    className="bg-[#0F3327] hover:bg-[#154637] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-sm transition-all duration-300 flex items-center gap-1.5"
                  >
                    Đọc bài viết <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. Grid Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-xs">
              <BookOpen size={40} className="mx-auto text-slate-350 mb-4" />
              <p className="text-slate-400 font-bold text-sm">Không tìm thấy bài viết nào phù hợp.</p>
            </div>
          ) : (
            // Show only part of list for pagination
            (searchQuery.trim() !== '' || selectedCategory !== 'all' ? filteredArticles : gridArticles)
              .slice(0, visibleCount)
              .map((art, idx) => (
                <div
                  key={art.id}
                  className="reveal-on-scroll bg-white rounded-[28px] border border-slate-100 hover:border-primary/25 shadow-[0_15px_40px_rgba(15,23,42,0.02)] hover:shadow-soft-ui-hover hover:-translate-y-1.5 transition-all duration-500 p-6 flex flex-col justify-between group"
                  style={{ transitionDelay: `${(idx % 3) * 100}ms` }}
                >
                  <div className="space-y-4">
                    {/* Cover photo */}
                    <div className="aspect-video rounded-2xl overflow-hidden relative">
                      <img 
                        src={art.coverImage} 
                        alt={art.title} 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 bg-[#0F3327]/85 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                        {art.category}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-primary" /> {art.readTime}
                      </span>
                      <span>{art.publishDate}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-black text-base md:text-lg text-secondary group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      <Link to={`/articles/${art.id}`}>
                        {art.title}
                      </Link>
                    </h3>

                    {/* Summary */}
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-3">
                      {art.summary}
                    </p>
                  </div>

                  {/* Footer Author & CTA */}
                  <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold overflow-hidden">
                        <img src={art.authorAvatar} alt={art.authorName} className="size-full object-cover" />
                      </div>
                      <span className="text-[10px] font-black text-secondary uppercase tracking-wider">{art.authorName}</span>
                    </div>

                    <Link 
                      to={`/articles/${art.id}`}
                      className="text-primary hover:text-[#25A89C] text-xs font-black uppercase tracking-wider flex items-center gap-0.5 group/link"
                    >
                      Xem thêm <ChevronRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Pagination Trigger Button */}
        {filteredArticles.length > visibleCount && (
          <div className="flex justify-center mt-14 reveal-on-scroll">
            <button
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 group shadow-sm"
            >
              <span>Xem thêm bài viết</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
