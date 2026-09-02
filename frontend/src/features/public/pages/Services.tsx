import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, X, Stethoscope, Zap, ShieldCheck, Activity, Flame, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPublicServices, getPublicPackages } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import ScrollReveal from '../components/effects/ScrollReveal';
import { formatCurrency } from '../../../utils/format';

interface UnifiedService {
  id: string;
  ten_goi: string;
  ma_goi: string;
  mo_ta: string;
  tong_so_buoi: number;
  gia_tien: number;
  thoi_luong_phut?: number;
  anh_goi?: string;
  loai_goi: 'KHAM' | 'LE' | 'LIEU_TRINH';
  luot_dung: number;
}

const STATS_DATA = [
  { value: '15.000+', label: 'CA PHỤC HỒI THÀNH CÔNG', desc: 'Giảm đau rõ rệt từ buổi 1' },
  { value: '100%', label: 'PHÁC ĐỒ CÁ NHÂN HÓA', desc: 'Dựa trên lượng giá lâm sàng' },
  { value: 'FDA & CE', label: 'ĐẠT CHUẨN Y TẾ QUỐC TẾ', desc: 'Công nghệ sóng xung kích, Laser Ý' },
  { value: '4.9★', label: 'ĐÁNH GIÁ HÀI LÒNG', desc: 'Từ hơn 10.000 khách hàng' }
];

const TAB_OPTIONS: { key: 'ALL' | 'KHAM' | 'LE' | 'LIEU_TRINH'; label: string; icon: typeof Stethoscope }[] = [
  { key: 'ALL', label: 'Tất Cả', icon: Activity },
  { key: 'KHAM', label: 'Lượng Giá Chức Năng', icon: Stethoscope },
  { key: 'LE', label: 'Trị Liệu Đơn Buổi', icon: Zap },
  { key: 'LIEU_TRINH', label: 'Liệu Trình Chuyên Sâu', icon: ShieldCheck },
];

const TREATMENT_STEPS = [
  {
    step: '01',
    title: 'Lượng Giá Chức Năng',
    desc: 'Chuyên viên PHCN lượng giá chức năng, đánh giá tầm vận động khớp (ROM), cơ lực (MMT) và thang đau VAS để định vị chính xác vùng cơ xương khớp tổn thương.'
  },
  {
    step: '02',
    title: 'Thiết Lập Phác Đồ',
    desc: 'Xây dựng lộ trình cá nhân hóa dựa trên tính chất công việc, cơ địa và ngưỡng chịu đau của bệnh nhân, không áp dụng rập khuôn mẫu số chung.'
  },
  {
    step: '03',
    title: 'Trị Liệu & Tái Đánh Giá',
    desc: 'Kết hợp công nghệ cao với kỹ thuật giải phóng cơ thủ công. Tái đánh giá mức độ giảm đau và biên độ khớp sau mỗi buổi để tinh chỉnh phác đồ kịp thời.'
  }
];

const MEDICAL_TECHS = [
  {
    name: 'Sóng xung kích Shockwave',
    desc: 'Công nghệ tạo sóng âm năng lượng cao, phá vỡ xơ hóa cơ, kích thích tái tạo mạch máu và đẩy nhanh tiến trình tự chữa lành.',
    efficacy: 'Giảm viêm sâu 85%',
    tag: 'Đạt chuẩn FDA'
  },
  {
    name: 'Laser cường độ cao 30W',
    desc: 'Tác động quang sinh học sâu vào mô, tăng cường tuần hoàn và ATP tế bào, giúp giảm đau cấp tính tức thì chỉ sau vài phút.',
    efficacy: 'Cắt cơn đau 90%',
    tag: 'Nhập khẩu Ý'
  },
  {
    name: 'Điện xung trị liệu EMS',
    desc: 'Kích thích thần kinh - cơ qua da, giảm co thắt, hỗ trợ phục hồi sức mạnh và tầm vận động của các nhóm cơ bị tổn thương.',
    efficacy: 'Khôi phục vận động 80%',
    tag: 'Chuẩn Châu Âu'
  },
  {
    name: 'Giải phóng cơ thủ công (Manual Release)',
    desc: 'Kỹ thuật di động mô mềm chuyên sâu kết hợp kéo giãn cơ học bằng tay do chuyên viên thực hiện giúp giải phóng các điểm kích hoạt đau.',
    efficacy: 'Nới lỏng khớp 95%',
    tag: 'Kỹ thuật độc quyền'
  }
];

const MEDICAL_FAQS = [
  {
    q: 'Tần suất thực hiện trị liệu vật lý là bao nhiêu lần một tuần?',
    a: 'Tùy thuộc vào tình trạng cấp tính hay mãn tính, chuyên viên tư vấn sẽ chỉ định tần suất phù hợp. Thông thường từ 2 - 3 buổi/tuần để đảm bảo cơ thể có thời gian phục hồi và đáp ứng tốt với các kích thích vật lý.'
  },
  {
    q: 'Tôi có cần đặt lịch lượng giá trước khi làm liệu trình chuyên sâu không?',
    a: 'Có. Để đảm bảo an toàn và đạt hiệu quả tối ưu, khách hàng bắt buộc phải được lượng giá chức năng bởi Chuyên viên PHCN trước khi bắt đầu bất kỳ liệu trình chuyên sâu nào.'
  },
  {
    q: 'Trị liệu bằng sóng xung kích hay laser công suất cao có đau không?',
    a: 'Các công nghệ này có thể gây cảm giác châm chích nhẹ hoặc mỏi cơ tại vùng đau trong vài phút đầu. Kỹ thuật viên sẽ luôn điều chỉnh mức năng lượng phù hợp với ngưỡng chịu đựng của bạn.'
  },
  {
    q: 'Chính sách bảo hiểm y tế tại OfficeCare như thế nào?',
    a: 'OfficeCare hỗ trợ xuất hóa đơn đỏ VAT và hồ sơ bệnh án chuẩn y khoa để khách hàng thực hiện thanh toán với các đơn vị bảo hiểm bảo lãnh hoặc bảo hiểm tư nhân.'
  }
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<UnifiedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'KHAM' | 'LE' | 'LIEU_TRINH'>('ALL');
  const [showLieuTrinhWarning, setShowLieuTrinhWarning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab: 'ALL' | 'KHAM' | 'LE' | 'LIEU_TRINH') => {
    setActiveTab(tab);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, packagesRes] = await Promise.all([
          getPublicServices(),
          getPublicPackages()
        ]);

        // Map services (KHAM and LE)
        const servicesMapped = servicesRes.data.map((s: any) => ({
          id: s.id.toString(),
          ten_goi: s.ten_dich_vu,
          ma_goi: s.loai_dich_vu === 'KHAM' ? 'KHAM' : 'LE',
          mo_ta: s.quy_trinh || s.muc_tieu || 'Dịch vụ lượng giá lâm sàng và trị liệu chuyên khoa cơ xương khớp.',
          quy_trinh: s.quy_trinh,
          muc_tieu: s.muc_tieu,
          tong_so_buoi: 1,
          gia_tien: Number(s.don_gia),
          thoi_luong_phut: s.thoi_luong_phut,
          anh_goi: s.anh_goi || (s.loai_dich_vu === 'KHAM' ? '/images/goi/kham_sang_loc.png' : '/images/goi/laser_tri_lieu.png'),
          loai_goi: s.loai_dich_vu === 'KHAM' ? 'KHAM' : 'LE',
          luot_dung: Number(s.luot_dung || 0)
        }));

        // Map packages (LIEU_TRINH)
        const packagesMapped = packagesRes.data.map((p: any) => ({
          id: p.id.toString(),
          ten_goi: p.ten_goi,
          ma_goi: p.ma_goi || 'LIEU_TRINH',
          mo_ta: p.quy_trinh || p.muc_tieu || 'Lộ trình phục hồi toàn diện cá nhân hóa theo phác đồ chuyên viên tư vấn.',
          quy_trinh: p.quy_trinh,
          muc_tieu: p.muc_tieu,
          tong_so_buoi: p.tong_so_buoi,
          gia_tien: Number(p.gia_tien),
          thoi_luong_phut: p.thoi_luong_phut || 60,
          anh_goi: p.anh_goi || '/images/goi/giai_co_sau.png',
          loai_goi: 'LIEU_TRINH',
          luot_dung: Number(p.luot_dung || 0)
        }));

        setItems([...servicesMapped, ...packagesMapped]);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách dịch vụ:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const filteredItems = items.filter((item: UnifiedService) => {
    if (activeTab !== 'ALL' && item.loai_goi !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.ten_goi.toLowerCase().includes(q) || (item.mo_ta && item.mo_ta.toLowerCase().includes(q));
    }
    return true;
  });

  const allCount = items.length;
  const khamCount = items.filter((item: UnifiedService) => item.loai_goi === 'KHAM').length;
  const leCount = items.filter((item: UnifiedService) => item.loai_goi === 'LE').length;
  const lieuTrinhCount = items.filter((item: UnifiedService) => item.loai_goi === 'LIEU_TRINH').length;
  const countByTab = { ALL: allCount, KHAM: khamCount, LE: leCount, LIEU_TRINH: lieuTrinhCount };

  return (
    <div className="min-h-screen bg-[#F8FBFA] dark:bg-zinc-950 pb-24 font-jakarta transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12">

        {/* Majestic Header & Value Metrics */}
        <div className="text-center space-y-4 mb-8 max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 dark:border-teal-800/60 text-[#0D9488] dark:text-teal-300 font-extrabold text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xs">
              <Sparkles size={13} className="text-[#0D9488]" />
              <span>Hệ Thống Gói Dịch Vụ &amp; Liệu Trình Y Khoa</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
              Giải Pháp <span className="text-[#0D9488]">Trị Liệu</span>, <br className="hidden sm:inline" />
              Phục Hồi Chuẩn <span className="text-blue-600 dark:text-blue-400">Y Khoa 5★</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="text-slate-600 dark:text-zinc-400 font-medium text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl mx-auto">
              Tất cả gói dịch vụ tại OfficeCare được chuẩn hóa y học quốc tế, kết hợp máy móc công nghệ cao châu Âu và phác đồ chuyên biệt từ hội đồng chuyên môn nhằm tối ưu thời gian lành thương cơ xương khớp cho dân văn phòng.
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

        {/* Search & Filter Hub - Apple/Linear Segmented Control Standard */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-4 md:p-5 mb-10 shadow-[0_10px_35px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Realtime Search Input */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm dịch vụ, triệu chứng đau..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0D9488] focus:bg-white rounded-2xl text-xs text-slate-800 font-semibold placeholder-slate-400 outline-none transition-all duration-200"
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

            {/* Segmented Control Bar (Single Row Scrollable - Never Breaks awkward lines) */}
            <div className="w-full lg:w-auto bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {TAB_OPTIONS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20 font-extrabold scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-white' : 'text-[#0D9488]'} />
                    <span>{tab.label}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>{countByTab[tab.key]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3-Column Responsive Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold text-xs bg-white rounded-[24px] border border-slate-150 shadow-xs">
            Không tìm thấy dịch vụ nào phù hợp với bộ lọc và từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item: UnifiedService, idx: number) => (
              <ScrollReveal key={item.id} delay={(idx % 3) * 100}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-[24px] p-5 border border-slate-150 shadow-[0_4px_20px_rgba(15,23,42,0.01)] transition-all duration-300 flex flex-col h-full overflow-hidden hover:border-[#14B8A6]/40 hover:shadow-[0_15px_40px_-15px_rgba(15,23,42,0.05)] group"
                >
                  <div>
                    {/* Visual Thumbnail */}
                    <div className="aspect-[16/10] w-full rounded-[16px] overflow-hidden bg-slate-100 relative mb-4">
                      <img
                        src={item.anh_goi || '/images/goi/giai_co_sau.png'}
                        alt={item.ten_goi}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>

                      {item.thoi_luong_phut && (
                        <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black text-white shadow-sm border border-white/5 uppercase tracking-wider">
                          <Clock size={10} className="text-[#14B8A6]" />
                          <span>{item.thoi_luong_phut} phút</span>
                        </div>
                      )}

                      {item.luot_dung > 0 && (
                        <div className="absolute top-3 right-3 bg-slate-900/75 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black text-white shadow-sm border border-white/5 uppercase tracking-wider">
                          <Flame size={10} className="text-amber-400" />
                          <span>{item.luot_dung} lượt đặt</span>
                        </div>
                      )}
                    </div>

                    {/* Service Category Tag */}
                    <span className="text-[9.5px] font-bold tracking-wider text-[#0D9488] mb-1 block">
                      {item.loai_goi === 'KHAM' ? 'Lượng giá chuyên sâu' : item.loai_goi === 'LE' ? 'Trị liệu đơn' : 'Liệu trình phục hồi'}
                    </span>

                    {/* Title */}
                    <h3 className="font-heading font-bold text-sm text-slate-800 leading-snug mb-2 line-clamp-2 min-h-[40px]">
                      {item.ten_goi}
                    </h3>

                    {/* Short Description */}
                    <p className="text-slate-500 text-[11px] font-normal leading-relaxed line-clamp-3 mb-4 min-h-[48px]">
                      {item.mo_ta}
                    </p>

                    {/* Bullet Highlights */}
                    <div className="border-t border-slate-100 pt-3.5 mb-5 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-650 font-bold">
                        <span className="size-1 bg-[#14B8A6] rounded-full shrink-0"></span>
                        <span>Đạt chuẩn an toàn y học</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-650 font-bold">
                        <span className="size-1 bg-[#14B8A6] rounded-full shrink-0"></span>
                        <span>KTV chính quy đứng máy</span>
                      </div>
                    </div>
                  </div>

                  {/* Price and Action Buttons */}
                  <div className="mt-auto space-y-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-slate-900">
                        {item.gia_tien === 0 ? 'Liên hệ' : formatCurrency(item.gia_tien)}
                      </span>
                      {item.loai_goi === 'LIEU_TRINH' ? (
                        <span className="text-[10px] text-slate-400 font-bold">/ {item.tong_so_buoi} buổi</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">/ buổi</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.loai_goi === 'LIEU_TRINH') {
                            navigate(`/packages/${item.id}`);
                          } else {
                            navigate(`/services/${item.id}`);
                          }
                        }}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-center font-extrabold py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 border border-slate-200/60 cursor-pointer active:scale-98"
                      >
                        Chi Tiết
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (item.loai_goi === 'LIEU_TRINH') {
                            setShowLieuTrinhWarning(true);
                          } else {
                            navigate('/booking', {
                              state: {
                                bookingType: item.loai_goi === 'KHAM' ? 'kham' : 'dich_vu',
                                selectedServiceId: item.id
                              }
                            });
                          }
                        }}
                        className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-98 shadow-sm shadow-[#2EC4B6]/15"
                      >
                        Đặt Lịch
                      </button>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* SECTION 2: 3-STEP TREATMENT JOURNEY */}
        <div className="mt-10 pt-8 lg:mt-12 lg:pt-10 border-t border-slate-200 space-y-8">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-bold tracking-wider px-3.5 py-1 rounded-full inline-block">
              Hành trình khám chữa bệnh
            </span>
            <h2 className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight leading-snug">
              Quy Trình Trị Liệu Khoa Học Tại OfficeCare
            </h2>
            <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
              Mỗi bệnh nhân tại trung tâm được dẫn dắt bởi một quy trình nghiêm ngặt từ khâu chẩn đoán đến khi phục hồi hoàn toàn chức năng vận động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TREATMENT_STEPS.map((step) => (
              <div key={step.step} className="bg-white rounded-2xl border border-slate-150 p-6 space-y-3 hover:border-[#14B8A6]/40 transition-all duration-300">
                <span className="text-3xl font-bold text-[#14B8A6]/30 font-heading block">{step.step}</span>
                <h3 className="font-bold text-sm text-slate-800 tracking-tight">{step.title}</h3>
                <p className="text-slate-500 text-[11px] font-normal leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: MEDICAL TECHNOLOGY SHOWCASE */}
        <div className="mt-10 pt-8 lg:mt-12 lg:pt-10 border-t border-slate-200 space-y-8">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-bold tracking-wider px-3.5 py-1 rounded-full inline-block">
              Thiết bị công nghệ cao
            </span>
            <h2 className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight leading-snug">
              Hệ Thống Thiết Bị Đạt Chuẩn Y Khoa
            </h2>
            <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
              Chúng tôi đầu tư đồng bộ hệ thống máy móc tân tiến nhập khẩu từ Châu Âu, hỗ trợ đẩy nhanh thời gian lành thương gấp 2 lần.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {MEDICAL_TECHS.map((tech) => (
              <div key={tech.name} className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between gap-4 hover:border-[#14B8A6]/40 transition-all duration-300">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">{tech.name}</h3>
                    <span className="bg-teal-500/10 text-[#0D9488] text-[8.5px] font-bold tracking-wider px-2.5 py-1 rounded-lg border border-teal-500/15 shrink-0">
                      {tech.tag}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] font-normal leading-relaxed">{tech.desc}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9.5px] text-slate-400 font-medium">Hiệu quả lâm sàng:</span>
                  <span className="text-xs font-bold text-[#0D9488]">{tech.efficacy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: FAQ SECTION */}
        <div className="mt-10 pt-8 lg:mt-12 lg:pt-10 border-t border-slate-200 space-y-8">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-bold tracking-wider px-3.5 py-1 rounded-full inline-block">
              Hỏi đáp y khoa
            </span>
            <h2 className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight leading-snug">
              Giải Đáp Thắc Mắc Thường Gặp
            </h2>
            <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
              Các câu hỏi đáp nhanh từ chuyên viên tư vấn giúp quý khách hiểu rõ hơn về lộ trình trị liệu cơ xương khớp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MEDICAL_FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-150 p-6 space-y-2 hover:border-[#14B8A6]/45 transition-all duration-300">
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 leading-snug flex items-start gap-2">
                  <span className="text-[#0D9488] shrink-0 font-bold">Q.</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-slate-500 text-[11px] font-normal leading-relaxed pl-4 border-l-2 border-slate-100">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Gói Liệu Trình Warning Modal */}
      {showLieuTrinhWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-[32px] border border-slate-100 max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setShowLieuTrinhWarning(false)}
              className="absolute top-6 right-6 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-800 tracking-normal">Yêu cầu chỉ định lượng giá</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Gói liệu trình chuyên sâu cần có chỉ định lượng giá chức năng từ Chuyên viên PHCN trước khi thực hiện để đảm bảo an toàn & hiệu quả điều trị.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowLieuTrinhWarning(false);
                  navigate('/booking', { state: { bookingType: 'kham' } });
                }}
                className="bg-primary hover:bg-[#25A89C] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Tiếp tục đặt lịch lượng giá
              </button>
              <button
                type="button"
                onClick={() => setShowLieuTrinhWarning(false)}
                className="bg-zinc-50 hover:bg-zinc-100 text-slate-650 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl border border-zinc-200 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
