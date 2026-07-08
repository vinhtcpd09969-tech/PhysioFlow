import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import LazyImage from '../../../../components/LazyImage';
import ScrollReveal from '../shared/ScrollReveal';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-24 pb-8 lg:pt-28 lg:pb-12 overflow-hidden flex items-center bg-gradient-to-b from-teal-55/20 via-white to-slate-50/50">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Hero Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4 lg:space-y-5 text-left">
            <ScrollReveal delay={100}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-extrabold text-[10px] uppercase tracking-wider shadow-sm border border-primary/5">
                ⚡ Hệ thống trị liệu cơ xương khớp văn phòng
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <h1 className="font-jakarta text-3xl md:text-4xl lg:text-5xl font-black text-secondary leading-[1.15] tracking-tight">
                Ngồi 8 tiếng, đau lưng cổ vai? <br />
                <span className="text-primary">Trị liệu chuyên sâu</span> cùng chuyên gia.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-semibold max-w-xl">
                Giải pháp phục hồi cột sống hiệu quả và an toàn. Nơi kết hợp hoàn hảo giữa công nghệ trị liệu cơ xương khớp tiên tiến nhất và phác đồ điều trị cá nhân hóa.
              </p>
            </ScrollReveal>

            {/* Premium Compact Buttons */}
            <ScrollReveal delay={400}>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link 
                  to="/booking" 
                  className="px-6 py-3 bg-primary hover:bg-[#25A89C] text-white font-jakarta font-extrabold rounded-xl shadow-md hover:scale-[1.02] active:scale-98 transition-all text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar size={14} />
                  Đặt lịch ngay
                </Link>
                <button 
                  onClick={() => navigate('/services')}
                  className="px-6 py-3 border-2 border-[#2EC4B6]/20 hover:border-[#2EC4B6]/40 text-[#0D9488] font-jakarta font-extrabold rounded-xl hover:bg-[#14B8A6]/5 hover:scale-[1.02] active:scale-98 transition-all text-xs cursor-pointer flex items-center gap-1.5"
                >
                  Khám phá dịch vụ
                  <ArrowRight size={12} />
                </button>
              </div>
            </ScrollReveal>

            {/* Social Proof Review Snippet */}
            <ScrollReveal delay={500}>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-100 w-fit">
                <div className="flex text-amber-500 text-xs">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <span>4.9/5 (1,200+ bệnh nhân đã phục hồi thành công)</span>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Visual Image Column */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0 flex justify-center">
            <div className="relative max-w-[380px] w-full px-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 2 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                whileHover={{ rotate: 0, scale: 1.02 }}
                className="bg-primary-container/40 rounded-[32px] p-3 shadow-lg border border-primary/10 transition-transform duration-500 cursor-pointer"
              >
                <div className="relative rounded-[24px] overflow-hidden aspect-[4/3] w-full shadow-inner bg-slate-100">
                  <LazyImage 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuChY7AW6ev6J87eZLl2o4MoOD8BnBBtnPFSB4sYKHKTosht_wFuKieK_jt9CtkyD3kA167GUk8Yv-tUkVT4HN7Y30l1-IvGzK21MPHz2SivO1OybUi6n3NCCiMObQuKtnx2j3jPLLy02O1zGNlbH6Q2vUq-MIs7udDukLlJ6rq88bk56Zx9KQdrvKpHKuGS5t8GE28Cpn03TTkqWiO84_J2E0tCuwpNunaAl4gqM19_WXyeqvQDPUdzHpThmQ9l73Ch6AY7CGkNuv8" 
                    alt="Office Care Premium Clinic" 
                    className="size-full object-cover"
                    wrapperClassName="size-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-50"></div>
                  <div className="absolute bottom-3 left-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 p-2.5 rounded-xl text-white">
                    <p className="text-[8px] uppercase font-bold text-primary-container mb-0.5 tracking-wider font-jakarta">Không gian điều trị</p>
                    <h4 className="text-[10px] font-bold leading-snug font-jakarta">Phòng khám hiện đại, riêng tư mang lại sự thư giãn tuyệt đối</h4>
                  </div>
                </div>
              </motion.div>

              {/* Floating Verified Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute -bottom-4 -left-1 glass-card p-3 rounded-2xl shadow-md hover:shadow-lg max-w-[160px] border border-white/40"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="text-primary animate-pulse" size={16} />
                  <span className="font-jakarta font-bold text-[9px] uppercase text-primary tracking-wider">Chuẩn Y Khoa</span>
                </div>
                <p className="font-jakarta text-[10px] text-secondary/80 leading-relaxed font-bold">Phác đồ cá nhân hóa từ chuyên gia.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
