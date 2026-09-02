import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '../effects/ScrollReveal';
import { getPublicTopServices } from '../../api/public.api';
import { formatCurrency } from '../../../../utils/format';

interface FeaturedService {
  id: string;
  title: string;
  desc: string;
  image: string;
  price: string;
  duration: string;
  loai_goi: 'KHAM' | 'LE' | 'LIEU_TRINH';
}

export default function ServicesCarousel() {
  const navigate = useNavigate();
  const [services, setServices] = useState<FeaturedService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getPublicTopServices();
        const topServices = res.data.map((p: any) => ({
          id: p.id,
          title: p.ten_goi,
          desc: p.quy_trinh || p.muc_tieu || (p.loai_goi === 'KHAM' ? 'Dịch vụ lượng giá chức năng và tầm soát chuyên sâu.' : 'Liệu trình phục hồi toàn diện cá nhân hóa theo phác đồ chuyên khoa.'),
          image: p.anh_goi || (p.loai_goi === 'KHAM' ? '/images/goi/kham_sang_loc.png' : p.loai_goi === 'LE' ? '/images/goi/laser_tri_lieu.png' : '/images/goi/giai_co_sau.png'),
          price: p.don_gia === 0 ? 'Liên hệ' : formatCurrency(p.don_gia),
          duration: p.loai_goi === 'LIEU_TRINH' ? `${p.tong_so_buoi} buổi` : `${p.thoi_luong_phut} phút`,
          loai_goi: p.loai_goi
        }));
        setServices(topServices);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách dịch vụ nổi bật:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleServiceClick = (service: FeaturedService) => {
    if (service.loai_goi === 'KHAM') {
      navigate('/booking', { state: { bookingType: 'kham', selectedServiceId: service.id } });
    } else if (service.loai_goi === 'LE') {
      navigate('/booking', { state: { bookingType: 'dich_vu', selectedServiceId: service.id } });
    } else {
      navigate('/booking', { state: { bookingType: 'kham' } });
    }
  };

  if (loading || services.length === 0) {
    return null;
  }

  return (
    <section id="services" className="py-10 lg:py-12 bg-slate-50/60 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          <div className="text-center mb-8 lg:mb-10 max-w-2xl mx-auto space-y-1.5">
            <span className="bg-[#0D9488]/10 text-[#0D9488] dark:text-teal-300 border border-[#0D9488]/20 font-bold tracking-wider text-[11px] px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
              <Sparkles size={12} /> Dịch Vụ Y Khoa Nổi Bật
            </span>
            <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 dark:text-white tracking-tight">
              Giải Pháp Trị Liệu Cơ Xương Khớp Chuyên Sâu
            </h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-sm leading-relaxed">
              Các dịch vụ y khoa được tin dùng nhiều nhất của chúng tôi giúp giải quyết nhanh cơn đau mỏi cơ xương khớp văn phòng.
            </p>
          </div>
        </ScrollReveal>

        {/* Services Grid (No unnecessary filter buttons) */}
        <ScrollReveal delay={150}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service, idx) => (
              <motion.div 
                key={service.id || idx}
                whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.06)" }}
                className="bg-white rounded-[28px] overflow-hidden group border border-slate-200/80 transition-all duration-300 flex flex-col justify-between shadow-2xs hover:border-[#0D9488]/40"
              >
                <div>
                  <div className="h-48 md:h-52 overflow-hidden relative bg-slate-100">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      src={service.image} 
                      alt={service.title}
                    />
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white font-black text-[9.5px] tracking-wider px-3 py-1.5 rounded-xl shadow-md border border-white/10 flex items-center gap-1.5">
                      <Clock size={11} className="text-teal-400" />
                      {service.duration}
                    </div>
                  </div>
                  <div className="p-6 space-y-2 text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0D9488] block">
                      {service.loai_goi === 'KHAM' ? 'Lượng giá chuyên sâu 1:1' : service.loai_goi === 'LE' ? 'Trị liệu đơn buổi' : 'Gói phác đồ điều trị'}
                    </span>
                    <h4 className="font-heading font-black text-base text-slate-900 leading-snug line-clamp-2">
                      {service.title}
                    </h4>
                    <p className="font-normal text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {service.desc}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[9.5px] font-semibold text-slate-400">Chi phí điều trị</p>
                    <span className="text-[#0D9488] font-heading font-black text-base">{service.price}</span>
                  </div>
                  <button 
                    onClick={() => handleServiceClick(service)}
                    className="px-4 py-2.5 bg-teal-50 hover:bg-[#0D9488] text-[#0D9488] hover:text-white rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer border border-teal-500/20 shadow-2xs"
                  >
                    <span>{service.loai_goi === 'KHAM' ? 'Đăng ký lượng giá' : 'Đăng ký ngay'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
