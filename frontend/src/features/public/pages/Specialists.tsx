import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Briefcase, Search, X, Sparkles } from 'lucide-react';
import { getPublicSpecialists } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import ScrollReveal from '../components/effects/ScrollReveal';

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
  the_manh?: string[] | null;
  trung_binh_sao?: number | string;
  tong_danh_gia?: number;
}

const isDoctorRole = (vaiTro: string) =>
  vaiTro.toLowerCase().includes('bác sĩ') || 
  vaiTro.toLowerCase().includes('doctor') || 
  vaiTro.toLowerCase().includes('lượng giá') ||
  vaiTro.toLowerCase().includes('tư vấn');

const getRoleDisplay = (vaiTro: string) => {
  if (isDoctorRole(vaiTro)) return 'Chuyên viên tư vấn';
  return 'Kỹ thuật viên';
};

const STATS_DATA = [
  { value: '15+', label: 'CHUYÊN VIÊN & KTV', desc: 'Tốt nghiệp chính quy' },
  { value: '10+', label: 'NĂM KINH NGHIỆM', desc: 'Thực tiễn điều trị PHCN' },
  { value: '15.000+', label: 'KHÁCH HÀNG HÀI LÒNG', desc: 'Phục hồi sức khỏe cột sống' },
  { value: '100%', label: 'CHỨNG CHỈ Y KHOA', desc: 'Đạt chuẩn đào tạo chuyên sâu' }
];

export default function Specialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'ALL' | 'DOCTOR' | 'TECH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchSpecialists() {
      try {
        const response = await getPublicSpecialists();
        setSpecialists(response.data);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách chuyên gia:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSpecialists();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const filteredSpecialists = specialists.filter(s => {
    if (filterRole === 'DOCTOR' && !isDoctorRole(s.vai_tro)) return false;
    if (filterRole === 'TECH' && isDoctorRole(s.vai_tro)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.ho_ten.toLowerCase().includes(q);
      const matchDegree = s.bang_cap_chung_chi && s.bang_cap_chung_chi.toLowerCase().includes(q);
      const matchDesc = s.mo_ta && s.mo_ta.toLowerCase().includes(q);
      return matchName || matchDegree || matchDesc;
    }
    return true;
  });

  const allCount = specialists.length;
  const doctorCount = specialists.filter(s => isDoctorRole(s.vai_tro)).length;
  const techCount = specialists.filter(s => !isDoctorRole(s.vai_tro)).length;

  const PILLS: { key: 'ALL' | 'DOCTOR' | 'TECH'; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả chuyên gia', count: allCount },
    { key: 'DOCTOR', label: 'Chuyên viên tư vấn', count: doctorCount },
    { key: 'TECH', label: 'Kỹ thuật viên', count: techCount },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'OC';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F8FBFA] dark:bg-zinc-950 pb-24 font-jakarta">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12">

        {/* Majestic Header & Value Metrics */}
        <div className="text-center space-y-4 mb-8 max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 dark:border-teal-800/60 text-[#0D9488] dark:text-teal-300 font-extrabold text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xs">
              <Sparkles size={13} className="text-[#0D9488]" />
              <span>Đội Ngũ Chuyên Gia &amp; Kỹ Thuật Viên</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
              Tận tâm như <span className="text-[#0D9488]">Người thân</span>, <br className="hidden sm:inline" />
              Chuyên nghiệp chuẩn <span className="text-blue-600 dark:text-blue-400">Y khoa</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="text-slate-600 dark:text-zinc-400 font-medium text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl mx-auto">
              OfficeCare tự hào quy tụ đội ngũ 100% Chuyên viên tư vấn &amp; Kỹ thuật viên tốt nghiệp chính quy, được đào tạo chuyên sâu về phục hồi chức năng cột sống và tư thế công thái học văn phòng.
            </p>
          </ScrollReveal>

          {/* Floating 4-Column Stats Box (Spacious & Luxurious) */}
          <ScrollReveal delay={180}>
            <div className="pt-4 max-w-5xl mx-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.04)] backdrop-blur-sm grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-zinc-800">
                {STATS_DATA.map((stat, idx) => (
                  <div key={idx} className={`space-y-1 ${idx > 1 ? 'pt-4 lg:pt-0' : ''}`}>
                    <span className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent block tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 block">
                      {stat.label}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium block">
                      {stat.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Search & Segmented Filter Control Bar */}
        <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/80 dark:border-zinc-800 p-4 md:p-5 mb-10 shadow-[0_10px_35px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Realtime Search Input */}
            <div className="relative w-full lg:w-96 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm tên chuyên gia, chứng chỉ, chuyên môn..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 focus:border-[#0D9488] focus:bg-white dark:focus:bg-zinc-900 rounded-2xl text-xs text-slate-800 dark:text-zinc-100 font-semibold placeholder-slate-400 outline-none transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Segmented Filter Pills */}
            <div className="w-full lg:w-auto bg-slate-100/90 dark:bg-zinc-800 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {PILLS.map(pill => {
                const isActive = filterRole === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setFilterRole(pill.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20 font-extrabold scale-[1.02]'
                        : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-white/80 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {pill.label}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                    }`}>{pill.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ProMax 4-Column Responsive Grid (Compact, High-Density, Balanced Cards) */}
        {filteredSpecialists.length === 0 ? (
          <div className="text-center py-24 text-slate-400 dark:text-zinc-500 font-semibold text-sm bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
            Không tìm thấy chuyên gia nào phù hợp với từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSpecialists.map((spec, idx) => {
              const isDoctor = isDoctorRole(spec.vai_tro);
              const roleTitle = getRoleDisplay(spec.vai_tro);
              const excerpt = spec.mo_ta || 'Chuyên sâu lượng giá chức năng vận động và phục hồi cột sống văn phòng.';
              
              return (
                <ScrollReveal key={spec.id} delay={(idx % 4) * 60}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(13,148,136,0.12)' }}
                    className="bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/80 dark:border-zinc-800 p-5 shadow-sm hover:border-[#0D9488]/50 transition-all duration-300 flex flex-col h-full group"
                  >
                    {/* Portrait Image Container (Clean 4/3 Aspect Ratio with Smart Fallback) */}
                    <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-200/60 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/80 mb-4 shrink-0 relative group-hover:shadow-inner">
                      {spec.anh_dai_dien ? (
                        <img
                          src={spec.anh_dai_dien}
                          alt={spec.ho_ten}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-500/15 via-slate-100 to-teal-500/5 dark:from-teal-950/40 dark:to-zinc-800 text-teal-700 dark:text-teal-300 space-y-1">
                          <span className="text-2xl font-black font-heading tracking-wider">
                            {getInitials(spec.ho_ten)}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            {roleTitle}
                          </span>
                        </div>
                      )}

                      {/* Floating Rating Badge - Only render when real reviews exist */}
                      {Boolean(spec.tong_danh_gia && spec.tong_danh_gia > 0) && (
                        <div className="absolute bottom-2.5 right-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md border border-white/60 dark:border-zinc-700/60 flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span className="text-[11px] font-black text-slate-800 dark:text-zinc-100">
                            {Number(spec.trung_binh_sao || 5).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Specialist Information */}
                    <div className="flex-1 flex flex-col text-left space-y-2.5">
                      
                      {/* Role Pill */}
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${
                          isDoctor
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-teal-300 border-teal-200 dark:border-teal-800/60'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                        }`}>
                          <span>{isDoctor ? '🩺' : '💆'}</span>
                          <span>{roleTitle}</span>
                        </span>
                      </div>

                      {/* Specialist Name */}
                      <h3 className="font-heading font-black text-base text-slate-900 dark:text-zinc-100 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {spec.ho_ten}
                      </h3>

                      {/* Experience Info */}
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                        <Briefcase size={13} className="text-[#0D9488] shrink-0" />
                        <span>{spec.so_nam_kinh_nghiem || 1} năm kinh nghiệm điều trị</span>
                      </div>

                      {/* Excerpt */}
                      <p className="text-xs text-slate-600 dark:text-zinc-400 font-normal leading-relaxed line-clamp-2 pt-0.5 flex-1">
                        {excerpt}
                      </p>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-3 mt-auto border-t border-slate-100 dark:border-zinc-800/80">
                        <Link
                          to={`/specialists/${spec.id}`}
                          className="bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-bold py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-center text-center cursor-pointer"
                        >
                          <span>Xem hồ sơ</span>
                        </Link>
                        <Link
                          to="/booking"
                          state={{ selectedDoctorId: spec.id, isKtv: !isDoctor }}
                          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black py-2.5 rounded-xl text-xs transition-all duration-200 shadow-md shadow-teal-600/20 active:scale-95 flex items-center justify-center text-center cursor-pointer"
                        >
                          <span>Đặt lịch</span>
                        </Link>
                      </div>

                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
