import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { List, ArrowLeft, Clock, Share2, Check, Bookmark, Sparkles, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicArticleBySlug, getPublicArticles } from '../api/public.api';
import { resolveImageUrl } from '../../../utils/imageUrl';
import LoadingScreen from '../../../components/LoadingScreen';

const DANH_MUC_LABELS: Record<string, string> = {
  suc_khoe: 'Sức khỏe văn phòng',
  dieu_tri: 'Phác đồ điều trị',
  tin_tuc: 'Tin tức y khoa',
  khuyen_mai: 'Ưu đãi & Gói tập',
  phong_ngua: 'Bài tập phòng ngừa'
};

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function estimateReadMinutes(html: string): number {
  if (!html) return 3;
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>('');
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copiedShare, setCopiedShare] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch Article Detail & Related Articles
  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await getPublicArticleBySlug(slug);
        const artData = res.data;
        setArticle(artData);

        if (artData) {
          const relRes = await getPublicArticles(artData.danh_muc);
          const filteredRel = (relRes.data || [])
            .filter((a: any) => a.slug !== slug)
            .slice(0, 5);
          setRelatedArticles(filteredRel);
        }
      } catch (error) {
        toast.error('Không tìm thấy bài viết này.');
        navigate('/tin-tuc');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, navigate]);

  // Extract Table of Contents & Attach IDs to DOM Headings once content renders
  useEffect(() => {
    if (!article || !article.noi_dung) return;

    // Small delay to ensure dangerouslySetInnerHTML has rendered into contentRef DOM
    const timer = setTimeout(() => {
      if (!contentRef.current) return;
      const headings = contentRef.current.querySelectorAll('h2, h3');
      const items: TocItem[] = [];

      headings.forEach((el, idx) => {
        const id = `article-section-${idx}`;
        el.id = id;
        el.classList.add('scroll-mt-28'); // Ensures offset below sticky header bar

        const text = el.textContent?.trim() || '';
        if (text) {
          items.push({
            id,
            text,
            level: el.tagName.toUpperCase() === 'H2' ? 2 : 3
          });
        }
      });

      setToc(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [article]);

  // Track scroll position & active heading highlight
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }

      if (!toc.length || !contentRef.current) return;
      const headings = contentRef.current.querySelectorAll('h2, h3');
      let currentActive = '';

      headings.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) {
          currentActive = el.id;
        }
      });

      setActiveId(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  // Smooth scroll to targeted TOC section with header offset
  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    toast.success('Đã sao chép liên kết bài viết!');
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const getFontSizeClass = () => {
    if (fontSizeLevel === 'large') return 'text-base leading-relaxed';
    if (fontSizeLevel === 'xlarge') return 'text-lg leading-relaxed';
    return 'text-sm sm:text-base leading-relaxed';
  };

  if (loading) return <LoadingScreen message="Đang tải bài viết y khoa..." />;
  if (!article) return null;

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const imageUrl = resolveImageUrl(article.hinh_anh);
  const articleTitle = article.meta_title || article.tieu_de;
  const articleDesc = article.meta_description || article.tom_tat;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: article.tieu_de,
    description: articleDesc,
    image: imageUrl,
    datePublished: article.ngay_tao || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Trung tâm Phục hồi Chức năng OfficeCare'
    },
    publisher: {
      '@type': 'Organization',
      name: 'OfficeCare',
      logo: {
        '@type': 'ImageObject',
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl
    }
  };

  return (
    <div className="bg-slate-50/60 min-h-screen pb-16 font-jakarta">
      <Helmet>
        <title>{articleTitle} | OfficeCare Phục Hồi Chức Năng</title>
        <meta name="description" content={articleDesc} />
        {article.meta_keywords && <meta name="keywords" content={article.meta_keywords} />}
        {pageUrl && <link rel="canonical" href={pageUrl} />}

        {/* OpenGraph / Facebook / Zalo */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={articleTitle} />
        <meta property="og:description" content={articleDesc} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        {pageUrl && <meta property="og:url" content={pageUrl} />}
        <meta property="og:site_name" content="OfficeCare" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={articleTitle} />
        <meta name="twitter:description" content={articleDesc} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}

        {/* Google Structured Data JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100 z-50">
        <div
          className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/tin-tuc'))}
            className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-extrabold transition-colors cursor-pointer mr-1"
          >
            <ArrowLeft size={14} />
            <span>Quay lại</span>
          </button>
          <span>/</span>
          <Link to="/" className="hover:text-teal-700 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/tin-tuc" className="hover:text-teal-700 transition-colors">Kiến thức y khoa</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-xs sm:max-w-md">
            {article.tieu_de}
          </span>
        </nav>

        {/* ========================================================================= */}
        {/* 2-COLUMN LAYOUT: MAIN ARTICLE BODY (8 COLS) + SIDEBAR (4 COLS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT MAIN ARTICLE BODY (8 COLUMNS) */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* Main Article Container with Title, Excerpt, Toolbar & Content */}
            <article className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-2xs space-y-6">
              
              {/* Category & Badge Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-teal-50 text-teal-700 border border-teal-200/80 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                  {DANH_MUC_LABELS[article.danh_muc] || article.danh_muc}
                </span>
                <span className="bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold tracking-tight px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Sparkles size={12} className="text-amber-500 shrink-0" />
                  <span>Tham vấn chuyên môn y khoa</span>
                </span>
              </div>

              {/* Main Article Title */}
              <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight leading-[1.25]">
                {article.tieu_de}
              </h1>

              {/* Lead Excerpt / Summary (if available) */}
              {article.tom_tat && (
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed italic border-l-3 border-teal-500 pl-4 py-1.5 bg-slate-50/50 rounded-r-2xl">
                  {article.tom_tat}
                </p>
              )}

              {/* Quick Reading Toolbar inside Card */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/70 p-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 pl-1">Cỡ chữ:</span>
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel('normal')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      fontSizeLevel === 'normal'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel('large')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      fontSizeLevel === 'large'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel('xlarge')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      fontSizeLevel === 'xlarge'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    A++
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBookmarked(!isBookmarked);
                      toast.success(isBookmarked ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết vào danh sách yêu thích!');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Bookmark size={13} className={isBookmarked ? 'fill-amber-500' : ''} />
                    <span>{isBookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    {copiedShare ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Main HTML Content */}
              <div className="pt-2 border-t border-slate-100">
              <style>{`
                .article-body-content img {
                  max-height: 480px !important;
                  width: auto !important;
                  max-width: 100% !important;
                  margin: 1.75rem auto !important;
                  border-radius: 16px !important;
                  border: 1px solid #e2e8f0 !important;
                  object-fit: contain !important;
                  display: block !important;
                  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07) !important;
                }
                .article-body-content h2 {
                  font-size: 1.35rem !important;
                  font-weight: 800 !important;
                  color: #0f172a !important;
                  margin-top: 2rem !important;
                  margin-bottom: 0.75rem !important;
                  line-height: 1.35 !important;
                  scroll-margin-top: 6.5rem !important;
                }
                .article-body-content h3 {
                  font-size: 1.15rem !important;
                  font-weight: 700 !important;
                  color: #1e293b !important;
                  margin-top: 1.5rem !important;
                  margin-bottom: 0.5rem !important;
                  line-height: 1.4 !important;
                  scroll-margin-top: 6.5rem !important;
                }
                .article-body-content p {
                  margin-bottom: 1.1rem !important;
                  color: #334155 !important;
                }
                .article-body-content ul, .article-body-content ol {
                  margin: 1rem 0 !important;
                  padding-left: 1.5rem !important;
                  color: #334155 !important;
                }
                .article-body-content li {
                  margin-bottom: 0.5rem !important;
                }
                .article-body-content blockquote {
                  border-left: 4px solid #0d9488 !important;
                  background-color: #f0fdfa !important;
                  padding: 1rem 1.25rem !important;
                  border-radius: 0 16px 16px 0 !important;
                  font-style: italic !important;
                  color: #134e4a !important;
                  margin: 1.5rem 0 !important;
                }
              `}</style>
              <div
                ref={contentRef}
                className={`article-body-content prose prose-slate max-w-none prose-a:text-teal-700 prose-a:font-bold hover:prose-a:underline ${getFontSizeClass()}`}
                dangerouslySetInnerHTML={{ __html: article.noi_dung }}
              />
              </div>
            </article>

            {/* Author Credibility Footer Card */}
            <div className="bg-gradient-to-r from-teal-50/70 to-emerald-50/70 rounded-3xl p-5 sm:p-6 border border-teal-100 shadow-2xs flex flex-col sm:flex-row gap-4 items-center">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white border border-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                BS
              </div>
              <div className="space-y-1 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest bg-white/80 px-2.5 py-0.5 rounded-full border border-teal-200/60 shadow-2xs">
                    Hội đồng Y Khoa Biên Soạn
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  {article.nguoi_dung?.ho_ten || 'Ban Biên Tập Y Khoa OfficeCare'}
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Nội dung bài viết được xây dựng và kiểm duyệt chặt chẽ bởi đội ngũ Chuyên viên tư vấn Phục hồi chức năng OfficeCare, đảm bảo cung cấp kiến thức chuẩn y khoa, hữu ích và an toàn cho người đọc.
                </p>
              </div>
            </div>
          </main>

          {/* RIGHT STICKY SIDEBAR (4 COLUMNS) */}
          <aside className="lg:col-span-4 space-y-6 sticky top-24">
            
            {/* Widget 1: Table of Contents (Mục lục tự động) */}
            {toc.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <List size={15} className="text-teal-600" />
                    <span>Mục Lục Bài Viết</span>
                  </h4>
                  <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                    {toc.length} mục
                  </span>
                </div>
                
                <ul className="space-y-1.5 max-h-[45vh] overflow-y-auto scrollbar-thin pr-1">
                  {toc.map(item => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => scrollToHeading(item.id)}
                        className={`text-left text-xs transition-all duration-200 block w-full py-1.5 px-3 rounded-xl cursor-pointer ${
                          activeId === item.id
                            ? 'font-black bg-teal-50 text-teal-700 border border-teal-200/80 translate-x-1 shadow-2xs'
                            : 'font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        } ${item.level === 3 ? 'pl-5 text-[11px] text-slate-500' : ''}`}
                      >
                        {item.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Widget 2: CTA Đặt Lịch Lượng Giá Chuyên Sâu */}
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden space-y-3.5">
              <div className="absolute -right-6 -bottom-6 size-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
              <span className="inline-block bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                Phục Hồi Cột Sống
              </span>
              <h4 className="text-base font-black leading-snug">
                Bạn đang gặp cơn đau mỏi vai gáy hoặc cột sống?
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Đăng ký buổi lượng giá chuyên sâu 1:1 cùng Chuyên viên tư vấn để xác định nguyên nhân gốc rễ và phác đồ điều trị phù hợp.
              </p>
              <Link
                to="/booking"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-sm transition-all transform active:scale-98"
              >
                <span>Đặt lịch lượng giá ngay</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Widget 3: Bài Viết Cùng Chủ Đề */}
            {relatedArticles.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={15} className="text-teal-600" />
                    <span>Bài Viết Cùng Chủ Đề</span>
                  </h4>
                  <Link to="/tin-tuc" className="text-xs font-bold text-teal-700 hover:underline">
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-3">
                  {relatedArticles.map((relArt) => (
                    <Link
                      key={relArt.id}
                      to={`/tin-tuc/${relArt.slug}`}
                      className="group flex items-start gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 mt-0.5">
                        {relArt.anh_bia ? (
                          <img
                            src={resolveImageUrl(relArt.anh_bia)}
                            alt={relArt.tieu_de}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">
                            OfficeCare
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-teal-700 transition-colors leading-snug line-clamp-2">
                          {relArt.tieu_de}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock size={11} className="text-teal-600" />
                          {estimateReadMinutes(relArt.noi_dung)} phút đọc
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </aside>

        </div>

      </div>
    </div>
  );
}
