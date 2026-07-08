import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '../shared/ScrollReveal';
import { getPublicSpecialists } from '../../api/public.api';

interface Specialist {
  id: number;
  ho_ten: string;
  vai_tro: string;
  anh_dai_dien: string | null;
  so_nam_kinh_nghiem: number | null;
}

export default function Specialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpecialists() {
      try {
        const response = await getPublicSpecialists();
        // Limit to top 3 specialists for the home page showcase
        setSpecialists(response.data.slice(0, 3));
      } catch (err) {
        console.error('Lỗi khi lấy danh sách chuyên gia:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSpecialists();
  }, []);


  const getRating = (id: number) => {
    const seed = (id * 7) % 5;
    if (seed === 0) return "5.0 (85+ Đánh giá)";
    if (seed === 1) return "4.9 (120+ Đánh giá)";
    if (seed === 2) return "4.8 (95+ Đánh giá)";
    return "4.9 (110+ Đánh giá)";
  };

  if (loading || specialists.length === 0) {
    return null;
  }

  return (
    <section className="py-xxl bg-slate-50/50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-black tracking-widest uppercase text-xs mb-3 font-jakarta">Đội ngũ của chúng tôi</h2>
            <h3 className="font-jakarta text-3xl md:text-4xl font-extrabold text-secondary mb-4 leading-tight">Chuyên Gia Hàng Đầu</h3>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
            <p className="text-slate-500 font-medium text-sm md:text-base mt-4">
              Đội ngũ y bác sĩ và kỹ thuật viên vật lý trị liệu có bằng cấp chuyên môn cao, hơn 10 năm kinh nghiệm đồng hành cùng bạn.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specialists.map((specialist, idx) => (
            <ScrollReveal key={specialist.id} delay={idx * 100}>
              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)" }}
                className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-100 transition-all duration-300 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="relative mb-6 rounded-[32px] overflow-hidden aspect-[4/3] bg-slate-200">
                    <img 
                      className="w-full h-full object-cover" 
                      src={specialist.anh_dai_dien || "https://i.pravatar.cc/150?img=11"} 
                      alt={specialist.ho_ten}
                    />
                    <div className="absolute bottom-4 left-4 bg-primary text-white px-3 py-1.5 rounded-full font-jakarta text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <Star size={11} fill="white" /> {getRating(specialist.id)}
                    </div>
                  </div>
                  <h4 className="font-jakarta font-black text-lg text-secondary mb-0.5">{specialist.ho_ten}</h4>
                  <p className="font-jakarta text-[11px] text-primary font-bold mb-3">
                    {specialist.vai_tro} • {specialist.so_nam_kinh_nghiem ? `${specialist.so_nam_kinh_nghiem} năm kinh nghiệm` : 'Chuyên gia'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {specialist.vai_tro.toLowerCase().includes('bác sĩ') ? (
                      <>
                        <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 font-jakarta text-[9px] font-extrabold rounded-full border border-slate-100">#Cột_sống</span>
                        <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 font-jakarta text-[9px] font-extrabold rounded-full border border-slate-100">#Cơ_xương_khớp</span>
                        <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 font-jakarta text-[9px] font-extrabold rounded-full border border-slate-100">#Lượng_giá</span>
                      </>
                    ) : (
                      <>
                        <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 font-jakarta text-[9px] font-extrabold rounded-full border border-slate-100">#Trị_liệu_tay</span>
                        <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 font-jakarta text-[9px] font-extrabold rounded-full border border-slate-100">#Giải_cơ_sâu</span>
                        <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 font-jakarta text-[9px] font-extrabold rounded-full border border-slate-100">#Vật_lý_trị_liệu</span>
                      </>
                    )}
                  </div>
                </div>

                <Link 
                  to="/booking" 
                  state={{ 
                    selectedDoctorId: specialist.id,
                    isKtv: !(specialist.vai_tro.toLowerCase().includes('bác sĩ') || specialist.vai_tro.toLowerCase().includes('doctor'))
                  }}
                  className="w-full block text-center py-2.5 font-jakarta font-extrabold border border-primary text-primary hover:bg-primary hover:text-white rounded-xl transition-all text-xs cursor-pointer"
                >
                  Đặt lịch
                </Link>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
