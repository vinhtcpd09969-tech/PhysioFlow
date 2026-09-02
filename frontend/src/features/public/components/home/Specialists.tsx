import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '../effects/ScrollReveal';
import { getPublicSpecialists } from '../../api/public.api';

interface Specialist {
  id: number;
  ho_ten: string;
  vai_tro: string;
  anh_dai_dien: string | null;
  so_nam_kinh_nghiem: number | null;
}

const isDoctorRole = (vaiTro: string) => {
  const lower = (vaiTro || '').toLowerCase();
  return lower.includes('bác sĩ') || lower.includes('doctor') || lower.includes('lượng giá') || lower.includes('tư vấn') || lower.includes('bac_si');
};

const getRoleName = (vaiTro: string) => {
  if (isDoctorRole(vaiTro)) return 'Chuyên viên tư vấn';
  return 'Kỹ thuật viên';
};

export default function Specialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpecialists() {
      try {
        const response = await getPublicSpecialists();
        setSpecialists(response.data.slice(0, 3));
      } catch (err) {
        console.error('Lỗi khi lấy danh sách chuyên gia:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSpecialists();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'OC';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading || specialists.length === 0) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16 bg-white dark:bg-zinc-900 border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-12 space-y-2">
            <span className="bg-[#0D9488]/10 text-[#0D9488] dark:text-teal-300 border border-[#0D9488]/20 font-black tracking-wider text-[11px] px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs uppercase">
              <Award size={13} /> Đội ngũ y tế uy tín
            </span>
            <h3 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight">
              Hội Đồng Chuyên Gia Hàng Đầu
            </h3>
            <p className="text-slate-600 dark:text-zinc-400 font-medium text-xs sm:text-sm leading-relaxed">
              Các Chuyên viên tư vấn và Kỹ thuật viên nhiều năm kinh nghiệm, luôn tận tâm đồng hành trong từng ca phục hồi.
            </p>
          </div>
        </ScrollReveal>

        {/* 3 Featured Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {specialists.map((specialist, idx) => {
            const isDoctor = isDoctorRole(specialist.vai_tro);
            const roleDisplay = getRoleName(specialist.vai_tro);

            return (
              <ScrollReveal key={specialist.id} delay={idx * 100}>
                <motion.div 
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(13, 148, 136, 0.12)" }}
                  className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 shadow-sm border border-slate-200/80 dark:border-zinc-800 transition-all duration-300 flex flex-col justify-between h-full hover:border-teal-500/50 group"
                >
                  <div>
                    {/* Portrait Image (Clean, No Fake Rating Overlay) */}
                    <div className="relative mb-5 rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700">
                      {specialist.anh_dai_dien ? (
                        <img 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          src={specialist.anh_dai_dien} 
                          alt={specialist.ho_ten}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-500/15 via-slate-100 to-teal-500/5 dark:from-teal-950/40 dark:to-zinc-800 text-teal-700 dark:text-teal-300 space-y-1">
                          <span className="text-2xl font-black font-heading tracking-wider">
                            {getInitials(specialist.ho_ten)}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            {roleDisplay}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Role & Years of experience */}
                    <span className={`text-[11px] font-black tracking-wider block mb-1.5 uppercase ${
                      isDoctor ? 'text-[#0D9488] dark:text-teal-400' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {roleDisplay} • {specialist.so_nam_kinh_nghiem ? `${specialist.so_nam_kinh_nghiem} năm kinh nghiệm` : 'Chuyên gia y tế'}
                    </span>

                    {/* Full Name */}
                    <h4 className="font-heading font-black text-lg md:text-xl text-slate-900 dark:text-zinc-100 mb-3 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {specialist.ho_ten}
                    </h4>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {isDoctor ? (
                        <>
                          <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-teal-300 font-extrabold text-[10px] rounded-lg border border-teal-500/20">#Cột_sống</span>
                          <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-teal-300 font-extrabold text-[10px] rounded-lg border border-teal-500/20">#Cơ_xương_khớp</span>
                          <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-teal-300 font-extrabold text-[10px] rounded-lg border border-teal-500/20">#Lượng_giá</span>
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] rounded-lg border border-blue-500/20">#Trị_liệu_tay</span>
                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] rounded-lg border border-blue-500/20">#Giải_cơ_sâu</span>
                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] rounded-lg border border-blue-500/20">#Vật_lý_trị_liệu</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Booking CTA */}
                  <Link 
                    to="/booking" 
                    state={{ 
                      selectedDoctorId: specialist.id,
                      isKtv: !isDoctor
                    }}
                    className="w-full text-center py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95"
                  >
                    <span>Đặt lịch lượng giá với chuyên gia</span>
                    <ChevronRight size={14} />
                  </Link>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
