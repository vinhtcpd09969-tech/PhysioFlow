import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, Award, Calendar, Star, CheckCircle2, ShieldCheck, Newspaper, User, ArrowLeft } from 'lucide-react';
import { getPublicSpecialistById, getPublicSpecialists, getPublicArticles, getPublicSpecialistReviews } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import ScrollReveal from '../components/effects/ScrollReveal';
import { resolveImageUrl } from '../../../utils/imageUrl';
import { censorText } from '../../../utils/profanity';

interface Specialist {
  id: number;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  anh_dai_dien: string | null;
  vai_tro: string;
  so_nam_kinh_nghiem: number | null;
  bang_cap_chung_chi: string | null;
  mo_ta: string | null;
  the_manh: string[] | null;
  trung_binh_sao?: number | string;
  tong_danh_gia?: number;
}

interface ArticleSummary {
  id: string;
  slug: string;
  tieu_de: string;
  tom_tat: string;
  anh_bia: string | null;
  ngay_dang: string | null;
}

const isDoctorRole = (vaiTro: string) =>
  vaiTro.toLowerCase().includes('bác sĩ') || vaiTro.toLowerCase().includes('doctor');

export default function SpecialistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState<string | null>(null);
  const [otherSpecialists, setOtherSpecialists] = useState<Specialist[]>([]);
  const [latestArticles, setLatestArticles] = useState<ArticleSummary[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    async function fetchDetails() {
      try {
        if (id) {
          const response = await getPublicSpecialistById(id);
          setSpecialist(response.data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy chi tiết chuyên gia:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  useEffect(() => {
    async function fetchReviews() {
      try {
        if (id) {
          setReviewsLoading(true);
          const response = await getPublicSpecialistReviews(id);
          setReviews(response.data || []);
        }
      } catch (err) {
        console.error('Lỗi khi lấy đánh giá:', err);
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();
  }, [id]);

  useEffect(() => {
    async function fetchExtras() {
      try {
        const [specRes, articleRes] = await Promise.all([
          getPublicSpecialists(),
          getPublicArticles(),
        ]);
        setOtherSpecialists((specRes.data || []).filter((s: Specialist) => s.id.toString() !== id?.toString()).slice(0, 4));
        setLatestArticles((articleRes.data || []).slice(0, 3));
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu liên quan:', err);
      }
    }
    fetchExtras();
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!specialist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-jakarta bg-slate-50">
        <p className="text-slate-500 font-extrabold text-lg mb-4">Không tìm thấy chuyên gia y khoa.</p>
        <Link to="/specialists" className="bg-[#14B8A6] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider">
          Trở lại danh sách
        </Link>
      </div>
    );
  }

  const isDoctor = isDoctorRole(specialist.vai_tro);

  // Định dạng chuẩn: chuỗi JSON { text: string, images: string[] } (đã chuẩn hóa toàn bộ dữ liệu DB).
  // Vẫn giữ try/catch phòng hờ dữ liệu chỉnh sửa tay không đúng định dạng.
  let certText = '';
  let certificates: string[] = [];

  if (specialist.bang_cap_chung_chi) {
    try {
      const parsed = JSON.parse(specialist.bang_cap_chung_chi);
      certText = parsed.text || '';
      certificates = Array.isArray(parsed.images) ? parsed.images : [];
    } catch {
      certText = specialist.bang_cap_chung_chi;
    }
  }

  const certItems = certText.split('\n').map(s => s.trim()).filter(Boolean);
  const specializations = specialist.the_manh && specialist.the_manh.length > 0 ? specialist.the_manh : [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6 font-jakarta">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Sleek E-Commerce Standard Breadcrumb Bar */}
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/specialists'))}
            className="inline-flex items-center gap-1.5 text-[#0D9488] font-extrabold hover:text-[#0b7a70] transition-colors cursor-pointer mr-1 bg-teal-50/80 px-3 py-1.5 rounded-lg border border-teal-100/60"
          >
            <ArrowLeft size={14} />
            <span>Quay lại</span>
          </button>
          <span>/</span>
          <Link to="/specialists" className="hover:text-[#0D9488] transition-colors">Đội ngũ chuyên gia</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-sm">{specialist.ho_ten}</span>
        </div>

        {/* Compact & Unified Hero Header Card */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-[0_10px_35px_rgba(15,23,42,0.03)] p-6 md:p-7 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-7 items-center md:items-start relative z-10">
            
            {/* Compact Portrait Container */}
            <div className="w-52 h-64 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative shadow-2xs">
              {specialist.anh_dai_dien ? (
                <img
                  src={specialist.anh_dai_dien}
                  alt={specialist.ho_ten}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                  <User size={56} strokeWidth={1.5} />
                </div>
              )}
            </div>

            {/* Core Info & Merged Bio/Strengths */}
            <div className="flex-1 space-y-3.5 text-center md:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border inline-flex items-center gap-1 ${
                    isDoctor
                      ? 'bg-teal-50 text-[#0D9488] border-teal-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    <span>{isDoctor ? '🩺' : '💆'}</span>
                    <span>{isDoctor ? 'Chuyên viên tư vấn' : 'Kỹ thuật viên'}</span>
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span>{Number(specialist.trung_binh_sao || 5).toFixed(1)} ({specialist.tong_danh_gia || 0} đánh giá)</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                    <Award size={12} className="text-[#0D9488]" />
                    <span>{specialist.so_nam_kinh_nghiem || 1} năm kinh nghiệm</span>
                  </div>
                </div>

                <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 leading-snug pt-1">
                  {specialist.ho_ten}
                </h1>
              </div>

              {/* Specialty Strengths Tags */}
              {specializations.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Thế mạnh:</span>
                  {specializations.map((tag, idx) => (
                    <span key={idx} className="bg-[#0D9488]/8 text-[#0D9488] border border-[#0D9488]/15 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio Summary inside Hero */}
              <p className="text-xs text-slate-650 font-normal leading-relaxed whitespace-pre-line line-clamp-3 pt-0.5">
                {specialist.mo_ta || 'Chuyên viên Phục hồi chức năng &amp; Cơ xương khớp, nhiều năm kinh nghiệm lượng giá chức năng và thiết kế kế hoạch trị liệu bảo tồn cho khách hàng văn phòng.'}
              </p>

              {/* Contacts & Compact Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mr-2">
                  <span className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> {specialist.email}</span>
                  <span className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> {specialist.so_dien_thoai || '0901 000 106'}</span>
                </div>

                <a
                  href={`tel:${specialist.so_dien_thoai || '0398655332'}`}
                  className="border border-slate-200 hover:border-[#0D9488] text-slate-700 hover:text-[#0D9488] px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 bg-slate-50"
                >
                  <Phone size={13} />
                  <span>Gọi tư vấn</span>
                </a>
                
                <Link
                  to="/booking"
                  state={{ selectedDoctorId: specialist.id, isKtv: !isDoctor }}
                  className="bg-[#0D9488] hover:bg-[#0b7a70] text-white px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 shadow-sm shadow-teal-500/20 flex items-center gap-1.5"
                >
                  <Calendar size={13} />
                  <span>Đặt lịch hẹn ngay</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Streamlined Certifications & Degrees Card */}
        {certItems.length > 0 && (
          <div className="bg-white rounded-[24px] p-5 md:p-6 border border-slate-200/80 shadow-2xs mb-8 space-y-5 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full inline-block">
                🩺 Bằng Cấp &amp; Chứng Chỉ Hành Nghề
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {certItems.map((item, idx) => (
                <div key={idx} className="flex gap-2.5 items-start bg-slate-50/80 p-3.5 rounded-xl border border-slate-150/80 hover:border-teal-500/30 transition-colors">
                  <CheckCircle2 size={16} className="text-[#0D9488] shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-xs font-semibold leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            {/* Certificate Images Gallery */}
            {certificates.length > 0 && (
              <div className="border-t border-slate-100 pt-4 mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  📋 Hình ảnh chứng nhận thực tế
                </p>
                <div className="flex flex-wrap gap-4">
                  {certificates.map((certPath, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveCert(resolveImageUrl(certPath))}
                      className="w-full sm:w-60 md:w-64 aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-[#0D9488] cursor-pointer group relative shadow-2xs transition-all duration-200"
                    >
                      <img
                        src={resolveImageUrl(certPath)}
                        alt={`Chứng chỉ ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 flex items-center justify-center transition-all">
                        <span className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#0D9488] shadow-sm">
                          🔍 Xem ảnh
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Static Credibility Banner: Tiêu chuẩn nhân sự y khoa OfficeCare (Màu nhẹ nhàng theo hệ thống) */}
        <div className="bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 rounded-[28px] p-6 md:p-8 text-slate-900 shadow-sm mb-8 border border-teal-200/70">
          <div className="text-center space-y-1.5 mb-6 max-w-2xl mx-auto">
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-black tracking-wider px-3 py-1 rounded-full uppercase">
              Tiêu chuẩn nhân sự y khoa OfficeCare
            </span>
            <h3 className="font-heading font-extrabold text-lg md:text-xl text-slate-900">
              Cam Kết Chất Lượng &amp; Năng Lực Trị Liệu 1:1
            </h3>
            <p className="text-slate-600 text-xs font-medium leading-relaxed">
              Đảm bảo 100% nhân sự chuyên khoa tuân thủ quy chuẩn y tế nghiêm ngặt, mang đến kết quả phục hồi tối ưu cho bệnh nhân.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 text-left">
            <div className="bg-white/90 border border-teal-100 p-5 rounded-2xl space-y-2 shadow-2xs">
              <div className="size-8 rounded-xl bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center font-black text-xs">01</div>
              <h4 className="font-extrabold text-xs md:text-sm text-slate-900">100% Chứng Chỉ Hành Nghề</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                Tất cả Chuyên viên tư vấn và Kỹ thuật viên đều tốt nghiệp chính quy Đại học Y Dược và sở hữu chứng chỉ hành nghề chính thức.
              </p>
            </div>

            <div className="bg-white/90 border border-teal-100 p-5 rounded-2xl space-y-2 shadow-2xs">
              <div className="size-8 rounded-xl bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center font-black text-xs">02</div>
              <h4 className="font-extrabold text-xs md:text-sm text-slate-900">Đào Tạo Công Nghệ Châu Âu</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                Được tập huấn định kỳ kỹ thuật giải phóng điểm đau IASTM, vận hành máy sóng xung kích Shockwave và Laser cường độ cao 30W.
              </p>
            </div>

            <div className="bg-white/90 border border-teal-100 p-5 rounded-2xl space-y-2 shadow-2xs">
              <div className="size-8 rounded-xl bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center font-black text-xs">03</div>
              <h4 className="font-extrabold text-xs md:text-sm text-slate-900">Bảo Mật &amp; Tận Tâm 1:1</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                Khách hàng được Chuyên viên và KTV trực tiếp theo dõi chỉ số phục hồi xuyên suốt phác đồ, bảo mật 100% thông tin lịch sử điều trị.
              </p>
            </div>
          </div>
        </div>

        {/* Full-width Reviews Section */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4 mt-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
                💬 Phản Hồi Từ Bệnh Nhân
              </span>
              {reviews.length > 0 && (
                <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>
                    {(reviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)}/5.0
                  </span>
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500">
              {reviews.length} đánh giá
            </span>
          </div>

          {reviewsLoading ? (
            <div className="text-center py-4 text-xs font-bold text-slate-400 animate-pulse">
              Đang tải đánh giá...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-400">Chưa có phản hồi nào cho chuyên gia này.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2.5">
                {(currentPage === 1 ? reviews.slice(0, 5) : reviews).map((rev) => (
                  <div key={rev.id} className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200/60 rounded-2xl transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-teal-100/80 text-[#0D9488] font-black text-xs flex items-center justify-center shrink-0">
                          {rev.name?.charAt(0) || 'K'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs leading-none">{rev.name}</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            {new Date(rev.date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-400 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={11} 
                            className={i < rev.rating ? 'fill-amber-400 stroke-none' : 'text-slate-200 fill-slate-200 stroke-none'} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-700 text-xs font-normal leading-relaxed italic pl-1">
                      "{censorText(rev.comment)}"
                    </p>
                    {rev.reply && (
                      <div className="bg-emerald-50/60 border-l-2 border-[#0D9488] rounded-r-xl p-2.5 text-xs space-y-0.5 ml-2">
                        <p className="font-extrabold text-slate-800 text-[11px]">
                          Phản hồi từ OfficeCare:
                        </p>
                        <p className="text-slate-600 italic text-[11px]">"{rev.reply}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* View All / Collapse Button */}
              {reviews.length > 5 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => (prev === 1 ? 2 : 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-[#0D9488] rounded-xl text-xs font-black transition-all cursor-pointer border border-slate-200/80"
                  >
                    <span>{currentPage === 1 ? `Xem tất cả ${reviews.length} đánh giá` : 'Thu gọn đánh giá'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chuyên gia nổi bật */}
        {otherSpecialists.length > 0 && (
          <ScrollReveal>
            <div className="mt-16">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck size={18} className="text-[#0D9488]" />
                <h2 className="font-heading font-black text-lg md:text-xl text-slate-900">Chuyên Gia Nổi Bật Khác</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {otherSpecialists.map((spec) => {
                  const specIsDoctor = isDoctorRole(spec.vai_tro);
                  return (
                    <motion.div
                      key={spec.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-[28px] border border-slate-100 p-4 shadow-sm transition-all duration-300"
                    >
                      <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-[#14B8A6]/15 bg-slate-100 mb-3">
                        {spec.anh_dai_dien ? (
                          <img
                            src={spec.anh_dai_dien}
                            alt={spec.ho_ten}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <User size={32} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${specIsDoctor ? 'text-[#0D9488]' : 'text-blue-600'}`}>
                        {specIsDoctor ? 'Chuyên viên tư vấn' : 'Kỹ thuật viên'}
                      </span>
                      <h3 className="font-heading font-black text-sm text-slate-900 leading-tight mb-3">{spec.ho_ten}</h3>
                      <Link
                        to={`/specialists/${spec.id}`}
                        className="block text-center border border-slate-200 hover:border-[#14B8A6] text-slate-700 hover:text-[#0D9488] font-bold py-2 rounded-xl text-[9px] uppercase tracking-wider transition-all duration-300"
                      >
                        Xem hồ sơ
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Nghiên cứu & Bài viết mới */}
        {latestArticles.length > 0 && (
          <ScrollReveal>
            <div className="mt-16">
              <div className="flex items-center gap-2 mb-6">
                <Newspaper size={18} className="text-[#0D9488]" />
                <h2 className="font-heading font-black text-lg md:text-xl text-slate-900">Nghiên Cứu & Bài Viết Mới</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {latestArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/tin-tuc/${article.slug}`}
                    className="group bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                      {article.anh_bia ? (
                        <img src={resolveImageUrl(article.anh_bia)} alt={article.tieu_de} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">OfficeCare</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-black text-xs text-slate-900 line-clamp-2 group-hover:text-[#0D9488] transition-colors">
                        {article.tieu_de}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Lightbox Certificate Modal */}
      {activeCert && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveCert(null)}
        >
          <div className="max-w-4xl max-h-[85vh] relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center">
            <img
              src={activeCert}
              alt="Bằng cấp phóng to"
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setActiveCert(null)}
              className="absolute top-4 right-4 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full p-2 border border-slate-800 hover:scale-105 transition-all text-xs font-black uppercase"
            >
              Đóng ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
