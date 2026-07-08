import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '../shared/ScrollReveal';
import { getPublicTopServices } from '../../api/public.api';

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
          desc: p.quy_trinh || p.muc_tieu || (p.loai_goi === 'KHAM' ? 'Dịch vụ lượng giá lâm sàng và thăm khám chuyên sâu.' : 'Liệu trình phục hồi toàn diện cá nhân hóa theo phác đồ bác sĩ.'),
          image: p.anh_goi || (p.loai_goi === 'KHAM' ? '/goi/images/kham_sang_loc.png' : p.loai_goi === 'LE' ? '/goi/images/laser_tri_lieu.png' : '/goi/images/giai_co_sau.png'),
          price: p.don_gia === 0 ? 'Liên hệ' : Number(p.don_gia).toLocaleString('vi-VN') + ' đ',
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
      // Lieu trinh needs kham first
      navigate('/booking', { state: { bookingType: 'kham' } });
    }
  };

  if (loading || services.length === 0) {
    return null;
  }

  return (
    <section id="services" className="py-xxl bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-primary font-black tracking-widest uppercase text-xs mb-3 font-jakarta">Dịch vụ phục hồi</h2>
            <h3 className="font-jakarta text-3xl md:text-4xl font-extrabold text-secondary mb-2">Dịch Vụ Nổi Bật Tại Phòng Khám</h3>
            <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl mx-auto">
              Các dịch vụ y khoa được tin dùng nhiều nhất của chúng tôi để giúp giải quyết nhanh cơn đau mỏi cơ xương khớp.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)" }}
                className="bg-[#F9FAFB] rounded-[32px] overflow-hidden group border border-slate-200/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 md:h-56 overflow-hidden relative bg-slate-200">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter saturate-[1.05]" 
                      src={service.image} 
                      alt={service.title}
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                      {service.duration}
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <h4 className="font-jakarta font-black text-lg text-secondary leading-snug">{service.title}</h4>
                    <p className="font-jakarta text-xs text-slate-400 font-semibold leading-relaxed line-clamp-3">
                      {service.desc}
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Chi phí</p>
                    <span className="text-primary font-jakarta font-black text-sm">{service.price}</span>
                  </div>
                  <button 
                    onClick={() => handleServiceClick(service)}
                    className="text-xs font-black text-primary group-hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                  >
                    {service.loai_goi === 'KHAM' ? 'Đăng ký khám' : service.loai_goi === 'LE' ? 'Đăng ký trị liệu' : 'Đặt lịch khám'} 
                    <ArrowRight size={12} />
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
