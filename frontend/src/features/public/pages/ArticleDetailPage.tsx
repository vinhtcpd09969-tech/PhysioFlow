import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  Share2, 
  Bookmark, 
  ThumbsUp,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  Award,
  ChevronRight
} from 'lucide-react';
import { MOCK_ARTICLES, ArticleDetail } from '../../../data/articlesData';
import toast from 'react-hot-toast';

// Helper to extract plain text from HTML content for Text-to-Speech
const getPlainTextFromHtml = (htmlString: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  
  // Audio Speech Synthesis state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  
  // Prefetch voices when component mounts and clean up on unmount
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (typeof window !== 'undefined' && synth) {
      synth.getVoices(); // Trigger load
      const handleVoicesChanged = () => {
        synth.getVoices();
      };
      synth.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        synth.removeEventListener('voiceschanged', handleVoicesChanged);
        synth.cancel();
      };
    }
  }, []);

  // Find article details
  useEffect(() => {
    setLoading(true);
    const foundArticle = MOCK_ARTICLES.find(a => a.id === id);
    if (foundArticle) {
      setArticle(foundArticle);
    } else {
      toast.error('Không tìm thấy bài viết này.');
      navigate('/articles');
    }
    setLoading(false);
  }, [id, navigate]);

  // Set Document Title for SEO
  useEffect(() => {
    if (article) {
      document.title = `${article.title} - Kiến thức Y khoa | Office Care`;
    }
  }, [article]);

  // Scroll reveal animation handler
  useEffect(() => {
    if (loading || !article) return;

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
  }, [loading, article]);

  // Get related articles (same category or others, max 2)
  const relatedArticles = article 
    ? MOCK_ARTICLES.filter(a => a.id !== article.id && a.category === article.category).slice(0, 2)
    : [];

  const fallbackArticles = relatedArticles.length > 0 
    ? relatedArticles 
    : article 
      ? MOCK_ARTICLES.filter(a => a.id !== article.id).slice(0, 2)
      : [];

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết bài viết!', {
      icon: '🔗',
      duration: 3000
    });
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      toast.success('Cảm ơn bạn đã yêu thích bài viết này!', {
        icon: '❤️',
        duration: 2500
      });
    }
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    if (!bookmarked) {
      toast.success('Đã lưu bài viết vào danh sách đọc!', {
        icon: '🔖',
        duration: 2500
      });
    }
  };

  // Web Speech API Voice Reading Handler
  const handlePlayPause = () => {
    if (!article) return;
    const synth = window.speechSynthesis;

    if (isPlaying) {
      synth.pause();
      setIsPlaying(false);
      toast.success('Đã tạm dừng giọng đọc.', { icon: '⏸️' });
    } else {
      if (synth.paused && currentUtterance) {
        synth.resume();
        setIsPlaying(true);
        toast.success('Tiếp tục phát giọng đọc...', { icon: '▶️' });
      } else {
        // Cancel any existing playing utterance
        synth.cancel();

        const cleanText = getPlainTextFromHtml(article.content);
        const speechText = `${article.title}. Tóm tắt: ${article.summary}. Nội dung chi tiết: ${cleanText}`;
        
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'vi-VN';
        
        // Find Vietnamese voice if available
        const voices = synth.getVoices();
        const viVoice = voices.find(voice => voice.lang.toLowerCase().includes('vi'));
        if (viVoice) {
          utterance.voice = viVoice;
        }

        // Set properties
        utterance.volume = isMuted ? 0 : 1;
        utterance.rate = 1.05; // Slightly faster for natural reading flow

        // Update progress bar on word boundaries
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            const charIndex = event.charIndex;
            const progress = (charIndex / speechText.length) * 100;
            setAudioProgress(progress);
          }
        };

        utterance.onend = () => {
          setIsPlaying(false);
          setAudioProgress(100);
          toast.success('Đã đọc xong toàn bộ bài viết!', { icon: '✨' });
        };

        utterance.onerror = (e) => {
          if (e.error !== 'interrupted') {
            setIsPlaying(false);
            console.error('Speech error:', e);
          }
        };

        setCurrentUtterance(utterance);
        synth.speak(utterance);
        setIsPlaying(true);
        toast.success('Đang phát giọng đọc bài viết...', { icon: '🔊' });
      }
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    
    if (isPlaying && currentUtterance) {
      currentUtterance.volume = nextMuted ? 0 : 1;
    }
    toast(nextMuted ? 'Đã tắt tiếng' : 'Đã bật tiếng', { icon: nextMuted ? '🔇' : '🔊' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-3" />
        <p className="font-bold text-slate-400 text-sm">Đang tải nội dung bài viết...</p>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32 font-body relative overflow-x-hidden">
      {/* Localized Styles for Premium Typography and Animations */}
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
        
        /* Drop Cap Styling */
        .article-body-content p:first-of-type::first-letter {
          font-size: 3.8rem;
          font-weight: 900;
          color: #2EC4B6;
          float: left;
          line-height: 0.85;
          margin-right: 0.6rem;
          margin-top: 0.2rem;
        }

        /* Editorial Blockquotes styling */
        .article-body-content blockquote {
          position: relative;
          padding: 1.5rem 2rem;
          margin: 2.5rem 0;
          background-color: #E8F8F2/30;
          border-left: 4px solid #2EC4B6;
          border-radius: 0 24px 24px 0;
          font-style: italic;
          font-weight: 600;
          color: #0f172a;
        }

        /* Fake Soundwave Height Fluctuation Keyframes */
        @keyframes wave1 {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes wave2 {
          0%, 100% { height: 8px; }
          50% { height: 22px; }
        }
        @keyframes wave3 {
          0%, 100% { height: 6px; }
          50% { height: 18px; }
        }
        .wave-bar-1 { animation: wave1 0.8s ease-in-out infinite; }
        .wave-bar-2 { animation: wave2 0.6s ease-in-out infinite; }
        .wave-bar-3 { animation: wave3 1.0s ease-in-out infinite; }
      `}</style>



      {/* Desktop Floating Interaction Dock - Positioned at Left Margin */}
      <div className="hidden xl:flex flex-col items-center gap-5 fixed left-10 top-1/2 -translate-y-1/2 z-40 bg-white border border-slate-100 p-4 rounded-full shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <button 
          onClick={handleLike}
          className={`p-3 rounded-full border transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${
            liked 
              ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm' 
              : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50/20'
          }`}
          title="Yêu thích"
        >
          <ThumbsUp size={16} className={liked ? 'fill-rose-500 stroke-rose-500 animate-pulse' : ''} />
        </button>

        <button 
          onClick={handleBookmark}
          className={`p-3 rounded-full border transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${
            bookmarked 
              ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm' 
              : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50/20'
          }`}
          title="Lưu lại"
        >
          <Bookmark size={16} className={bookmarked ? 'fill-amber-500 stroke-amber-500' : ''} />
        </button>

        <div className="w-8 h-px bg-slate-100" />

        <button 
          onClick={handleShare}
          className="p-3 rounded-full border bg-slate-50/50 border-slate-100 text-slate-400 hover:text-primary hover:bg-teal-50/30 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
          title="Chia sẻ liên kết"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* 1. Cinematic Hero Section (Dark Theme for Wow contrast) */}
      <section className="bg-slate-900 text-white pt-36 pb-32 md:pb-44 relative overflow-hidden">
        {/* Decorative Grid Lines Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60"></div>
        <div className="absolute -left-36 -bottom-36 w-96 h-96 bg-[#2EC4B6]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Breadcrumb (White/Teal text) */}
          <nav className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-350 mb-8 uppercase tracking-widest">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to="/articles" className="hover:text-primary transition-colors">Bài viết</Link>
            <span>/</span>
            <span className="text-[#2EC4B6] font-bold">{article.category}</span>
          </nav>

          {/* Article Category Pill */}
          <div className="inline-flex items-center gap-1.5 bg-[#2EC4B6]/15 text-[#2EC4B6] border border-[#2EC4B6]/30 text-[10px] font-black uppercase tracking-widest px-4.5 py-2 rounded-full mb-6 shadow-sm">
            ✦ Chuyên khoa {article.category} ✦
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-black tracking-tight leading-normal md:leading-normal lg:leading-normal uppercase max-w-4xl mx-auto mb-8 text-white drop-shadow-sm">
            {article.title}
          </h1>

          {/* Metadata Grid */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300 text-xs font-bold border-t border-white/10 pt-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#2EC4B6]" />
              <span>Thời gian đọc: {article.readTime}</span>
            </div>
            <div className="w-1 h-1 bg-white/30 rounded-full hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="text-[#2EC4B6]" />
              <span>Xuất bản: {article.publishDate}</span>
            </div>
            <div className="w-1 h-1 bg-white/30 rounded-full hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <Eye size={15} className="text-[#2EC4B6]" />
              <span>Lượt xem: 1,240</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Floating Overlapping Cover Image Card (Betrays expected layout grid) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="relative -mt-16 md:-mt-24 rounded-[32px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.12)] border-4 border-white aspect-video md:aspect-21/9 group">
          <img 
            src={article.coverImage} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          />
          {/* Subtle Bottom Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: Rich Article Content Block & Dynamic Audio Summary */}
          <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-100 p-6 md:p-12 shadow-[0_20px_50px_rgba(15,23,42,0.015)] space-y-8">
            
            {/* Dynamic AI Audio summary box (Wow Micro-interaction) */}
            <div className="bg-[#E8F8F2]/40 border border-[#2EC4B6]/10 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#2EC4B6]/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#2EC4B6] flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
                  <Volume2 size={22} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-wider mb-0.5">Tóm tắt âm thanh (AI Voice)</h4>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Nghe tóm tắt y khoa nhanh trong {article.readTime}</p>
                </div>
              </div>

              {/* Player control panel */}
              <div className="flex items-center gap-4 flex-1 max-w-xs md:max-w-none">
                {/* Visual Audio Waveform */}
                <div className="flex items-end gap-1 h-6 shrink-0 w-24">
                  {[1, 2, 3, 2, 1, 2, 3, 2, 1, 2].map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-1 rounded-full bg-primary/70 transition-all duration-300 ${
                        isPlaying 
                          ? idx % 3 === 0 
                            ? 'wave-bar-1' 
                            : idx % 3 === 1 
                              ? 'wave-bar-2' 
                              : 'wave-bar-3'
                          : 'h-1.5'
                      }`}
                      style={{
                        height: isPlaying ? undefined : '6px'
                      }}
                    />
                  ))}
                </div>

                {/* Progress slider bar */}
                <div className="relative flex-1 h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#2EC4B6] rounded-full transition-all duration-300"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>

                {/* Buttons controls */}
                <div className="flex items-center gap-2">
                  {/* Mute button */}
                  <button 
                    onClick={handleMuteToggle}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-secondary transition-colors"
                    title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                  >
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>

                  {/* Play/Pause Button */}
                  <button
                    onClick={handlePlayPause}
                    className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
                    title={isPlaying ? 'Tạm dừng' : 'Nghe đọc bài viết'}
                  >
                    {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Text Content */}
            <article 
              className="prose max-w-none text-slate-650 text-xs md:text-sm font-semibold leading-relaxed article-body-content space-y-6 pt-4"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags area */}
            <div className="pt-10 border-t border-slate-100">
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-4">Mở rộng kiến thức về bài viết:</span>
              <div className="flex flex-wrap gap-2.5">
                {article.tags.map((tag, tIdx) => (
                  <span 
                    key={tIdx}
                    className="bg-[#E8F8F2] hover:bg-[#2EC4B6]/15 text-[#2EC4B6] border border-[#2EC4B6]/15 hover:border-[#2EC4B6]/30 text-xs font-black px-6 py-2.5 rounded-full uppercase tracking-wider transition-all cursor-pointer shadow-3xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR: Sticky Expert Advisor & clinical actions */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-8">
            
            {/* Refined Medical Advisor / Reviewer Badge Card */}
            <div className="reveal-on-scroll bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.02)] space-y-6 relative overflow-hidden">
              {/* Corner Verified Logo */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full flex items-start justify-end p-4 pointer-events-none">
                <CheckCircle2 size={16} className="text-primary" />
              </div>

              <div className="text-center space-y-4">
                <span className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-primary/20 inline-block">
                  ✓ Tham vấn y khoa
                </span>

                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-4">
                    {/* Multi-layered border design */}
                    <div className="absolute inset-0 rounded-full border-[3px] border-primary/25 animate-pulse" />
                    <img 
                      src={article.authorAvatar} 
                      alt={article.authorName} 
                      className="w-full h-full object-cover rounded-full p-1 bg-white"
                    />
                    <div className="absolute bottom-0 right-0 bg-[#2EC4B6] text-white p-1 rounded-full border-2 border-white shadow-md">
                      <Award size={12} />
                    </div>
                  </div>
                  
                  <h3 className="font-heading font-black text-lg text-secondary leading-tight mb-1 flex items-center gap-1.5 justify-center">
                    {article.authorName}
                  </h3>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {article.authorRole}
                  </p>
                </div>

                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Thông tin y khoa được biên soạn và kiểm chứng lâm sàng bởi Bác sĩ chuyên khoa tại Office Care nhằm đảm bảo tính an toàn và tính hiệu quả khoa học cao nhất.
                </p>

                <div className="pt-2">
                  <Link
                    to={`/specialists/${article.authorId}`}
                    className="border border-slate-900 hover:bg-slate-900 text-slate-900 hover:text-white text-center font-extrabold py-3.5 w-full rounded-full text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                  >
                    <span>Xem thông tin bác sĩ</span>
                    <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Direct Booking Clinic CTA (Dark Slate with pulsing ring) */}
            <div className="reveal-on-scroll bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg border border-slate-800 space-y-4">
              <div className="absolute -right-20 -bottom-20 w-44 h-44 bg-[#2EC4B6]/15 rounded-full blur-2xl pointer-events-none"></div>
              
              <span className="text-[#2EC4B6] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#2EC4B6]" /> Liệu pháp cá nhân hoá
              </span>
              
              <h3 className="font-heading font-black text-xl uppercase tracking-tight leading-snug">
                Chấm dứt cơn đau mỏi văn phòng kéo dài
              </h3>
              
              <p className="text-slate-350 text-[11px] font-semibold leading-relaxed">
                Đăng ký ngay một buổi lượng giá lâm sàng ban đầu để bác sĩ trực tiếp phân tích tư thế cột sống và chỉ định chuyên viên phù hợp cho bạn.
              </p>
              
              <div className="pt-2">
                <Link
                  to="/booking"
                  className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-extrabold py-4 w-full rounded-full text-xs uppercase tracking-widest shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5 group/cta"
                >
                  Đặt lịch khám ngay
                  <ArrowRight size={14} className="group-hover/cta:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Related articles (micro-hover translate transitions) */}
            <div className="reveal-on-scroll bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.015)] space-y-6">
              <h4 className="font-heading font-black text-secondary text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-primary rounded-full block" /> Bài viết khuyên đọc
              </h4>

              <div className="space-y-4">
                {fallbackArticles.map(rel => (
                  <Link
                    key={rel.id}
                    to={`/articles/${rel.id}`}
                    className="block group space-y-1.5 p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/30 transition-all duration-300"
                  >
                    <span className="text-[9px] text-[#2EC4B6] font-black uppercase tracking-wider">{rel.category}</span>
                    <h5 className="font-heading font-black text-secondary group-hover:text-primary transition-colors text-xs leading-snug line-clamp-2">
                      {rel.title}
                    </h5>
                    <p className="text-slate-400 text-[10px] font-semibold leading-relaxed truncate">
                      {rel.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Mobile Sticky Bottom Interaction Bar */}
      <div className="fixed bottom-0 left-0 right-0 xl:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 py-3.5 px-6 flex items-center justify-around z-40 shadow-[0_-10px_35px_rgba(0,0,0,0.04)]">
        <button 
          onClick={handleLike}
          className={`p-2.5 rounded-full border transition-all flex items-center gap-2 text-xs font-bold ${
            liked 
              ? 'bg-rose-50 border-rose-200 text-rose-600' 
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <ThumbsUp size={14} className={liked ? 'fill-rose-500 stroke-rose-500' : ''} />
          <span>Thích</span>
        </button>

        <button 
          onClick={handleBookmark}
          className={`p-2.5 rounded-full border transition-all flex items-center gap-2 text-xs font-bold ${
            bookmarked 
              ? 'bg-amber-50 border-amber-200 text-amber-600' 
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <Bookmark size={14} className={bookmarked ? 'fill-amber-500 stroke-amber-500' : ''} />
          <span>Lưu lại</span>
        </button>

        <button 
          onClick={handleShare}
          className="p-2.5 rounded-full border bg-white border-slate-200 text-slate-500 flex items-center gap-2 text-xs font-bold"
        >
          <Share2 size={14} />
          <span>Chia sẻ</span>
        </button>
      </div>

    </div>
  );
}
