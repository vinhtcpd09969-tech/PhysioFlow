import { Newspaper, Award, Bookmark, ArrowUpRight, Sparkles, Quote, ShieldCheck } from 'lucide-react';
import ScrollReveal from '../effects/ScrollReveal';

interface PressArticle {
  id: string;
  publisher: string;
  publisherColor: string;
  publisherBadgeBg: string;
  topAccentGradient: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  readTime: string;
  highlightTag: string;
  linkText: string;
}

const PRESS_ARTICLES: PressArticle[] = [
  {
    id: 'vnexpress-officecare',
    publisher: 'VnExpress',
    publisherColor: 'text-[#9F224E]',
    publisherBadgeBg: 'bg-rose-50 dark:bg-rose-955/40 border-rose-200 dark:border-rose-800 text-[#9F224E] dark:text-rose-300',
    topAccentGradient: 'from-[#9F224E] to-rose-400',
    category: 'Sức Khỏe & Đời Sống',
    date: '15/08/2026',
    title: 'OfficeCare – Mô hình lượng giá chức năng 1:1 giải cứu cột sống cho dân công sở TP.HCM',
    excerpt: 'Thay vì chỉ giảm đau tạm thời, OfficeCare ứng dụng quy trình lượng giá ROM & MMT chuẩn y khoa, kết hợp công nghệ sóng xung kích FDA Châu Âu giúp điều trị triệt để nguyên nhân đau mỏi cổ vai gáy.',
    readTime: '3 phút đọc',
    highlightTag: 'Tiêu Điểm Báo Chí',
    linkText: 'Xem bài viết VnExpress'
  },
  {
    id: 'suckhoedoisong-officecare',
    publisher: 'Sức Khỏe Đời Sống',
    publisherColor: 'text-[#0D9488]',
    publisherBadgeBg: 'bg-teal-50 dark:bg-teal-955/40 border-teal-200 dark:border-teal-800 text-[#0D9488] dark:text-teal-300',
    topAccentGradient: 'from-teal-600 to-emerald-400',
    category: 'Cơ Quan Ngôn Luận Bộ Y Tế',
    date: '28/07/2026',
    title: 'Trị liệu bảo tồn không phẫu thuật: Lối thoát an toàn cho người trẻ bị thoái hóa đốt sống',
    excerpt: 'Đội ngũ chuyên viên tư vấn tại OfficeCare ghi dấu ấn với kỹ thuật giải cơ sâu và di động khớp chuyên sâu, đem lại sự phục hồi tự nhiên không lạm dụng thuốc kháng viêm.',
    readTime: '4 phút đọc',
    highlightTag: 'Chuyên Sâu Y Học',
    linkText: 'Xem phóng sự Y tế'
  },
  {
    id: 'dantri-officecare',
    publisher: 'Báo Dân Trí',
    publisherColor: 'text-[#008848]',
    publisherBadgeBg: 'bg-emerald-50 dark:bg-emerald-955/40 border-emerald-200 dark:border-emerald-800 text-[#008848] dark:text-emerald-300',
    topAccentGradient: 'from-[#008848] to-teal-400',
    category: 'Đời Sống & Sức Khỏe',
    date: '12/06/2026',
    title: 'Hệ thống quản lý điều trị thông minh nâng tầm trải nghiệm phục hồi chức năng văn phòng',
    excerpt: 'Quy trình tiếp đón thông minh, không gian cabin riêng tư và hồ sơ tiến trình điều trị minh bạch giúp bệnh nhân an tâm theo dõi từng bước phục hồi chức năng của cơ thể.',
    readTime: '3 phút đọc',
    highlightTag: 'Đánh Giá 5 Sao',
    linkText: 'Xem nhận định Dân Trí'
  },
  {
    id: 'cafebiz-officecare',
    publisher: 'CafeBiz',
    publisherColor: 'text-[#0A58CA]',
    publisherBadgeBg: 'bg-blue-50 dark:bg-blue-955/40 border-blue-200 dark:border-blue-800 text-[#0A58CA] dark:text-blue-300',
    topAccentGradient: 'from-[#0A58CA] to-cyan-400',
    category: 'Doanh Nhân & Đời Sống',
    date: '05/05/2026',
    title: 'Khi các tập đoàn công nghệ & tài chính chọn OfficeCare chăm sóc sức khỏe cột sống nhân sự',
    excerpt: 'Chăm sóc cột sống công thái học trở thành điểm cộng lớn thu hút nhân tài khi các doanh nghiệp tin tưởng đồng hành cùng OfficeCare để bảo vệ hiệu suất làm việc cho đội ngũ.',
    readTime: '5 phút đọc',
    highlightTag: 'Góc Nhìn Doanh Nghiệp',
    linkText: 'Đọc phóng sự CafeBiz'
  }
];

const PRESS_LOGOS = [
  { name: 'VnExpress', desc: 'Báo tiếng Việt nhiều người xem', color: 'text-[#9F224E]', dot: 'bg-[#9F224E]' },
  { name: 'Báo Dân Trí', desc: 'Cơ quan Bộ LĐ-TB&XH', color: 'text-[#008848]', dot: 'bg-[#008848]' },
  { name: 'Sức Khỏe & Đời Sống', desc: 'Cơ quan Bộ Y Tế', color: 'text-[#0D9488]', dot: 'bg-[#0D9488]' },
  { name: 'Báo Tuổi Trẻ', desc: 'Thông tin đa chiều uy tín', color: 'text-[#C4161C]', dot: 'bg-[#C4161C]' },
  { name: 'CafeBiz', desc: 'Tạp chí Doanh nhân & Đời sống', color: 'text-[#0A58CA]', dot: 'bg-[#0A58CA]' },
  { name: 'VTV Y Tế 24h', desc: 'Kênh thông tin Sức khỏe Quốc gia', color: 'text-[#D92D20]', dot: 'bg-[#D92D20]' }
];

export default function WhyUs() {
  return (
    <section className="py-14 lg:py-20 bg-gradient-to-b from-[#F8FBFA] via-white to-slate-50/80 dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-950 border-b border-slate-200/70 dark:border-zinc-800/80 transition-colors relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 dark:border-teal-800/60 text-[#0D9488] dark:text-teal-300 font-black text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xs">
              <Newspaper size={14} className="text-[#0D9488]" />
              <span>Góc Truyền Thông &amp; Báo Chí</span>
            </div>
            
            <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight leading-tight">
              Mọi Người &amp; Báo Chí Nói Gì Về <span className="text-[#0D9488]">OfficeCare</span>?
            </h2>
            
            <p className="text-slate-600 dark:text-zinc-400 font-medium text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
              Những bài viết, phóng sự chuyên đề và góc nhìn chuyên môn ghi nhận hành trình chuẩn hóa phục hồi chức năng cơ xương khớp bảo tồn – không dùng thuốc cho dân văn phòng.
            </p>
          </div>
        </ScrollReveal>

        {/* Press Logo Strip (Static Trust Bar with Authentic Brand Accent Dots) */}
        <ScrollReveal delay={100}>
          <div className="mb-10 p-6 sm:p-7 rounded-[32px] bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 shadow-[0_4px_20px_rgba(15,23,42,0.03)] backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-5">
              <ShieldCheck size={15} className="text-teal-600" />
              <span className="text-[11px] font-black tracking-widest text-slate-500 dark:text-zinc-400 uppercase">
                Được đưa tin &amp; bảo chứng uy tín bởi các cơ quan truyền thông hàng đầu
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 items-center">
              {PRESS_LOGOS.map((logo, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 text-center hover:border-teal-500/50 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md transition-all duration-200 group cursor-default"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`size-2 rounded-full ${logo.dot}`}></span>
                    <span className={`font-heading font-black text-xs sm:text-sm ${logo.color} dark:text-zinc-100 tracking-tight`}>
                      {logo.name}
                    </span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 dark:text-zinc-400 line-clamp-1 font-medium">
                    {logo.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 4 Featured Press Editorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {PRESS_ARTICLES.map((article, idx) => (
            <ScrollReveal key={article.id} delay={idx * 80 + 120}>
              <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 sm:p-8 border border-slate-200/80 dark:border-zinc-800 shadow-[0_10px_35px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_45px_rgba(13,148,136,0.10)] hover:border-teal-500/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden">
                
                {/* Decorative Top Gradient Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${article.topAccentGradient}`} />

                {/* Subtle Background Quote Decoration */}
                <Quote size={80} className="absolute right-4 bottom-12 text-slate-100/70 dark:text-zinc-800/40 pointer-events-none stroke-[1]" />

                <div className="space-y-4 relative z-10">
                  {/* Card Header: Publisher Badge & Date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-3.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border shadow-2xs ${article.publisherBadgeBg}`}>
                        {article.publisher}
                      </span>
                      <span className="text-[10.5px] font-bold text-slate-400 dark:text-zinc-500">
                        {article.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-955/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-lg shadow-2xs">
                        <Sparkles size={11} className="text-amber-500" />
                        <span>{article.highlightTag}</span>
                      </span>
                      <span className="text-[10.5px] font-bold text-slate-400 dark:text-zinc-500 font-mono">
                        {article.date}
                      </span>
                    </div>
                  </div>

                  {/* Article Title */}
                  <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-zinc-100 leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors pt-1">
                    {article.title}
                  </h3>

                  {/* Article Summary with Quotes */}
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-zinc-300 font-normal leading-relaxed line-clamp-3 bg-slate-50/60 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
                    "{article.excerpt}"
                  </p>
                </div>

                {/* Card Footer: Read time & Interactive link */}
                <div className="pt-5 mt-5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs relative z-10">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <Bookmark size={13} className="text-teal-600 dark:text-teal-400" />
                    <span>{article.readTime}</span>
                  </span>

                  <span className="font-black text-xs text-teal-700 dark:text-teal-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 flex items-center gap-1 transition-transform group-hover:translate-x-1 cursor-pointer">
                    <span>{article.linkText}</span>
                    <ArrowUpRight size={15} />
                  </span>
                </div>

              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
