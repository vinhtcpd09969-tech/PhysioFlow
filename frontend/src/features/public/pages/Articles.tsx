import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Search, X, Flame, Mail, ArrowRight, UserCheck, Sparkles, BookOpen } from 'lucide-react';
import { getPublicArticles } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import { resolveImageUrl } from '../../../utils/imageUrl';

const DANH_MUC_FILTERS = [
  { value: 'ALL', label: 'Tất cả bài viết' },
  { value: 'suc_khoe', label: 'Sức khỏe văn phòng' },
  { value: 'dieu_tri', label: 'Phác đồ điều trị' },
  { value: 'tin_tuc', label: 'Tin tức y khoa' },
  { value: 'khuyen_mai', label: 'Ưu đãi & Gói tập' },
  { value: 'phong_ngua', label: 'Bài tập phòng ngừa' }
];

const TRENDING_TAGS = ['#ThoátVịĐĩaĐệm', '#ĐauVaiGáy', '#YogaVănPhòng', '#ChấnThươngThểThao', '#NắnChỉnhCộtSống'];

function estimateReadMinutes(html: string): number {
  if (!html) return 3;
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function Articles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [danhMuc, setDanhMuc] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await getPublicArticles(danhMuc === 'ALL' ? undefined : danhMuc);
        setArticles(res.data || []);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách bài viết:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [danhMuc]);

  if (loading) return <LoadingScreen />;

  // Dynamic Filtering by Search + Tag
  const filteredArticles = articles.filter(art => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.tieu_de?.toLowerCase().includes(q);
      const matchSummary = art.tom_tat?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary) return false;
    }
    if (selectedTag) {
      const tagClean = selectedTag.replace('#', '').toLowerCase();
      const matchTitle = art.tieu_de?.toLowerCase().includes(tagClean);
      const matchSummary = art.tom_tat?.toLowerCase().includes(tagClean);
      if (!matchTitle && !matchSummary) return false;
    }
    return true;
  });

  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const mainGridArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : filteredArticles;
  const trendingReads = articles.slice(0, 4);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
      setTimeout(() => {
        setNewsletterSubmitted(false);
        setNewsletterEmail('');
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 pt-6 font-jakarta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Hero Section */}
        <div className="mb-8 text-center space-y-3 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <BookOpen size={13} /> TRUNG TÂM TRI THỨC Y KHOA OFFICECARE
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-[34px] text-slate-900 tracking-tight leading-tight">
            Kiến Thức &amp; Phác Đồ <span className="text-[#0D9488]">Phục Hồi Chuyên Sâu</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed max-w-2xl mx-auto">
            Tổng hợp các bài viết tham vấn từ Hội đồng Chuyên viên tư vấn &amp; Kỹ thuật viên Phục hồi chức năng. Cập nhật giải pháp khoa học cho sức khỏe xương khớp văn phòng.
          </p>
        </div>

        {/* Search & Filter Control Bar */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-4 sm:p-5 mb-8 shadow-[0_10px_35px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Realtime Search Bar */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm bài viết, triệu chứng, giải pháp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0D9488] focus:bg-white rounded-2xl text-xs text-slate-800 font-semibold placeholder-slate-400 outline-none transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Segmented Pills */}
            <div className="w-full lg:w-auto bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {DANH_MUC_FILTERS.map((opt) => {
                const isActive = danhMuc === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setDanhMuc(opt.value);
                      setSelectedTag(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trending Disease Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame size={13} className="text-amber-500" /> Xu hướng:
            </span>
            {TRENDING_TAGS.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="text-[11px] font-bold text-rose-500 hover:underline ml-1"
              >
                Xóa lọc tag
              </button>
            )}
          </div>
        </div>

        {/* Asymmetric 2-Column Main Hub Layout (Main Content 8 Cols + Sidebar 4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT MAIN STREAM (8 COLUMNS) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Top Featured Hero Card */}
            {featuredArticle && (
              <div
                onClick={() => navigate(`/tin-tuc/${featuredArticle.slug}`)}
                className="group bg-white rounded-[28px] border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-[#0D9488]/40 transition-all duration-300 cursor-pointer overflow-hidden relative"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-6 aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 relative shrink-0">
                    <span className="absolute top-3 left-3 bg-[#0D9488] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg z-10 shadow-sm flex items-center gap-1">
                      <Sparkles size={12} /> Bài viết nổi bật
                    </span>
                    {featuredArticle.anh_bia ? (
                      <img
                        src={resolveImageUrl(featuredArticle.anh_bia)}
                        alt={featuredArticle.tieu_de}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                        OfficeCare Medical Article
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-6 space-y-3 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-teal-50 text-[#0D9488] border border-teal-200/60 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        Tham vấn y khoa
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Clock size={12} className="text-[#0D9488]" /> {estimateReadMinutes(featuredArticle.noi_dung)} phút đọc
                      </span>
                    </div>

                    <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 leading-snug group-hover:text-[#0D9488] transition-colors">
                      {featuredArticle.tieu_de}
                    </h2>

                    <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3">
                      {featuredArticle.tom_tat}
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-teal-100 text-[#0D9488] font-black text-[10px] flex items-center justify-center">
                          BS
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">Hội đồng Y Khoa OfficeCare</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0D9488] group-hover:translate-x-1 transition-transform">
                        Đọc bài <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid (2-Column inside Main Stream) */}
            {mainGridArticles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[28px] border border-dashed border-slate-200 text-slate-400 font-semibold text-xs">
                Chưa tìm thấy bài viết phù hợp với tìm kiếm của bạn.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {mainGridArticles.map((article: any) => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/tin-tuc/${article.slug}`)}
                    className="group bg-white rounded-[28px] border border-slate-200/80 p-5 shadow-sm hover:shadow-lg hover:border-[#0D9488]/40 transition-all duration-300 flex flex-col h-full cursor-pointer"
                  >
                    <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200/70 bg-slate-100 mb-4 shrink-0 relative">
                      {article.anh_bia ? (
                        <img
                          src={resolveImageUrl(article.anh_bia)}
                          alt={article.tieu_de}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          OfficeCare
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col text-left space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#0D9488]" />{' '}
                          {article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-[#0D9488]" /> {estimateReadMinutes(article.noi_dung)} phút
                        </span>
                      </div>

                      <h3 className="font-heading font-extrabold text-sm text-slate-900 leading-snug group-hover:text-[#0D9488] transition-colors line-clamp-2 pt-0.5">
                        {article.tieu_de}
                      </h3>

                      <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2 flex-1">
                        {article.tom_tat}
                      </p>

                      <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-[#0D9488]">
                        <span>Xem chi tiết</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT STICKY SIDEBAR (4 COLUMNS) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            
            {/* Widget 1: Top Bài Viết Đọc Nhiều Nhất (Trending Reads) */}
            <div className="bg-white rounded-[28px] border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Flame className="text-amber-500 shrink-0" size={18} />
                <h3 className="font-heading font-black text-sm text-slate-900 uppercase tracking-tight">
                  Bài Viết Đọc Nhiều Nhất
                </h3>
              </div>

              <div className="space-y-3.5">
                {trendingReads.map((trArticle, idx) => (
                  <div
                    key={trArticle.id}
                    onClick={() => navigate(`/tin-tuc/${trArticle.slug}`)}
                    className="flex items-start gap-3 group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-heading font-black text-lg text-slate-300 group-hover:text-[#0D9488] shrink-0 w-6">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#0D9488] transition-colors leading-snug line-clamp-2">
                        {trArticle.tieu_de}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {estimateReadMinutes(trArticle.noi_dung)} phút đọc
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Đăng Ký Nhận Bản Tin Y Khoa (Medical Newsletter) */}
            <div className="bg-gradient-to-br from-teal-900 to-emerald-950 text-white rounded-[28px] p-6 shadow-md relative overflow-hidden space-y-3.5">
              <div className="size-10 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center mb-2 border border-white/10">
                <Mail size={20} />
              </div>
              <h3 className="font-heading font-black text-base leading-tight">
                Nhận Lời Khuyên Y Khoa Hàng Tuần
              </h3>
              <p className="text-slate-300 text-xs font-normal leading-relaxed">
                Đăng ký nhận bài tập phục hồi chức năng và mẹo phòng ngừa đau mỏi từ Chuyên viên tư vấn OfficeCare.
              </p>

              {newsletterSubmitted ? (
                <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-3 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <UserCheck size={16} /> Đã đăng ký thành công!
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="Nhập email của bạn..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:bg-white/20 transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0b7a70] text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                  >
                    Đăng Ký Nhận Bản Tin
                  </button>
                </form>
              )}
            </div>

            {/* Widget 3: Card Tư Vấn Trực Tiếp Chuyên Viên (Doctor Booking Banner) */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/70 rounded-[28px] p-5 text-left space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-amber-600" />
                <h4 className="font-heading font-black text-xs uppercase tracking-wider text-amber-900">
                  Cần Tư Vấn Phục Hồi?
                </h4>
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                Đặt lịch lượng giá 1:1 trực tiếp với Chuyên viên tư vấn để nhận kế hoạch phục hồi cá nhân hóa.
              </p>
              <button
                type="button"
                onClick={() => navigate('/booking')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-sm text-center block"
              >
                Đặt Lịch Lượng Giá 1:1
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
