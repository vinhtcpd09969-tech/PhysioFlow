import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Award, ShieldCheck, Layers, BookOpen, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { getPublicServices, getPublicPackages, getPublicCategories } from '../../../api/client.api';
import toast from 'react-hot-toast';
import ClinicBannerSlider from '../../../components/ClinicBannerSlider';

interface Service {
  id: string;
  danh_muc_id: string;
  ten_dich_vu: string;
  mo_ta_ngan: string;
  mo_ta_chi_tiet: string;
  thoi_luong_phut: number;
  don_gia: number | string;
  hinh_anh_url: string;
  loai_dich_vu: string;
  loai_dich_vu_ho_tro: string[] | string;
}

interface Package {
  id: string;
  ten_goi: string;
  ma_goi: string;
  mo_ta: string;
  tong_so_buoi: number;
  gia_tien: number | string;
  gia_goc?: number | string;
  han_dung_thang: number;
  chi_tiet_dich_vu: any;
  danh_muc_id?: string | number;
  ten_danh_muc?: string;
}

interface Category {
  id: string | number;
  ten_danh_muc: string;
  mo_ta: string;
  loai_danh_muc: string;
  thu_tu_hien_thi: number;
}

interface GroupedPackage {
  baseName: string;
  mo_ta: string;
  danh_muc_id?: string | number;
  levels: {
    [levelName: string]: Package;
  };
}

// Subcomponent to render a grouped package card with tabs and expandable details
function GroupedPackageCard({ 
  groupedPackage, 
  services,
  handleBookingClick,
  onViewDetails
}: { 
  groupedPackage: GroupedPackage; 
  services: Service[];
  handleBookingClick: (e: React.MouseEvent) => void;
  onViewDetails: () => void;
}) {
  // Find available levels and sort them (BASIC -> STANDARD -> INTENSIVE)
  const availableLevels = Object.keys(groupedPackage.levels).sort((a, b) => {
    const order = ['BASIC', 'STANDARD', 'INTENSIVE'];
    return order.indexOf(a) - order.indexOf(b);
  });

  // Default to first available level
  const [selectedLevel, setSelectedLevel] = useState<string>(availableLevels[0] || 'BASIC');

  const activePkg = groupedPackage.levels[selectedLevel] || Object.values(groupedPackage.levels)[0];

  const getPackageServices = (pkg: Package) => {
    try {
      const detail = typeof pkg.chi_tiet_dich_vu === 'string' ? JSON.parse(pkg.chi_tiet_dich_vu) : pkg.chi_tiet_dich_vu;
      if (Array.isArray(detail)) {
        return detail.map((d: any) => {
          const svc = services.find(s => s.id.toString() === d.dich_vu_id.toString());
          return {
            name: svc ? svc.ten_dich_vu : 'Liệu pháp trị liệu',
            so_buoi: d.so_buoi || d.so_lan_toi_da_trong_goi,
            mo_ta: svc ? svc.mo_ta_ngan : 'Dịch vụ phục hồi chức năng chuyên sâu.'
          };
        });
      }
    } catch (e) {
      // ignore
    }
    return [];
  };

  const includedServices = getPackageServices(activePkg);

  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '';
    const numPrice = typeof price === 'string' ? parseInt(price, 10) : price;
    if (isNaN(numPrice)) return price.toString();
    if (numPrice === 0) return 'Liên hệ';
    return numPrice.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 hover:border-[#FF9F1C]/25 shadow-[0_15px_40px_rgba(15,23,42,0.02)] hover:shadow-[0_25px_50px_rgba(15,23,42,0.06)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative group">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            {activePkg.ma_goi}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500" /> Cam kết hiệu quả
          </div>
        </div>

        {/* Base Package Title */}
        <h3 className="font-heading font-black text-xl md:text-2xl text-slate-900 group-hover:text-primary transition-colors leading-tight mb-3">
          {groupedPackage.baseName}
        </h3>
        
        {/* Level Tabs Selection */}
        <div className="flex gap-1 p-1 bg-slate-100/80 border border-slate-200/30 rounded-xl w-fit mb-5">
          {availableLevels.map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                selectedLevel === lvl
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Dynamic Level Description */}
        <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
          {activePkg.mo_ta}
        </p>

        {/* Expandable Details Button */}
        <button
          type="button"
          onClick={onViewDetails}
          className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 p-4 rounded-2xl border border-slate-100 text-[10px] font-black uppercase text-[#2EC4B6] hover:text-[#25A89C] tracking-wider transition-all mb-6 select-none shadow-xs group/btn"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <BookOpen size={13} className="text-[#2EC4B6]" /> Phác đồ chi tiết ({includedServices.length} liệu pháp)
          </span>
          <span className="font-extrabold text-[11px] flex items-center gap-0.5">
            Xem chi tiết <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
          </span>
        </button>
      </div>

      {/* Card Footer */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-2xl md:text-3xl font-black text-slate-900">
              {formatPrice(activePkg.gia_tien)}
            </span>
            <span className="text-slate-400 text-xs font-bold"> / {activePkg.tong_so_buoi} buổi</span>
          </div>
          
          {activePkg.gia_goc && (
            <div className="text-right">
              <span className="text-xs text-slate-400 line-through font-semibold block">
                {formatPrice(activePkg.gia_goc)}
              </span>
              <span className="text-[10px] text-emerald-500 font-extrabold uppercase">
                Tiết kiệm 20%
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/booking"
            onClick={handleBookingClick}
            className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-primary/20"
          >
            Đăng ký nhận phác đồ
          </Link>
          
          <div className="flex items-center justify-center gap-2 border border-slate-200 rounded-2xl bg-slate-50 text-[10px] text-slate-400 font-bold uppercase shrink-0">
            ⏳ Hạn dùng: {activePkg.han_dung_thang} tháng
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { activeTab?: 'services' | 'packages' } | null;

  const [activeTab, setActiveTab] = useState<'services' | 'packages'>(state?.activeTab || 'services');
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Separate category states
  const [selectedServiceCatId, setSelectedServiceCatId] = useState<string>('all');
  const [selectedPackageCatId, setSelectedPackageCatId] = useState<string>('all');
  
  const [loading, setLoading] = useState<boolean>(true);

  const getPackageSlug = (baseName: string): string => {
    const nameLower = baseName.toLowerCase();
    if (nameLower.includes('đốt sống cổ') || (nameLower.includes('cổ') && !nameLower.includes('cổ tay') && !nameLower.includes('vai và lưng trên'))) {
      return 'co-vai-gay';
    }
    if (nameLower.includes('vai và lưng trên') || nameLower.includes('khớp vai')) {
      return 'vai-lung-tren';
    }
    if (nameLower.includes('thắt lưng') || (nameLower.includes('lưng') && !nameLower.includes('lưng trên'))) {
      return 'that-lung';
    }
    if (nameLower.includes('tư thế') || nameLower.includes('chỉnh dáng')) {
      return 'chinh-tu-the';
    }
    // Clean slug for other packages: lowercase, strip special characters, replace spaces with dashes
    return baseName
      .toLowerCase()
      .replace(/[^a-z0-9\sđáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  // Sync tab state if location state changes
  useEffect(() => {
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resCats, resSvcs, resPkgs] = await Promise.all([
          getPublicCategories(),
          getPublicServices(),
          getPublicPackages()
        ]);
        
        setCategories(resCats.data || []);
        setServices(resSvcs.data || []);
        setPackages(resPkgs.data || []);
      } catch (error) {
        console.error('Error fetching services details:', error);
        toast.error('Lỗi khi tải danh mục dịch vụ.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll-reveal Intersection Observer
  useEffect(() => {
    if (loading) return;

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
  }, [loading, activeTab, selectedServiceCatId, selectedPackageCatId]);

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-global-auth-modal'));
    }
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '';
    const numPrice = typeof price === 'string' ? parseInt(price, 10) : price;
    if (isNaN(numPrice)) return price.toString();
    if (numPrice === 0) return 'Liên hệ';
    return numPrice.toLocaleString('vi-VN') + ' đ';
  };

  const getServiceBenefits = (service: Service): string[] => {
    try {
      if (typeof service.loai_dich_vu_ho_tro === 'string') {
        const parsed = JSON.parse(service.loai_dich_vu_ho_tro);
        if (Array.isArray(parsed)) return parsed;
      } else if (Array.isArray(service.loai_dich_vu_ho_tro)) {
        return service.loai_dich_vu_ho_tro;
      }
    } catch (e) {
      // ignore
    }
    return [service.mo_ta_ngan || 'Hỗ trợ phục hồi tối ưu.'];
  };

  const getCategoryEmoji = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('cổ') || lower.includes('vai') || lower.includes('gáy')) return '⚡';
    if (lower.includes('thắt lưng') || lower.includes('cột sống') || lower.includes('lưng')) return '🦴';
    if (lower.includes('tư thế') || lower.includes('thái học') || lower.includes('chỉnh')) return '📐';
    if (lower.includes('thư giãn') || lower.includes('stress') || lower.includes('wellness')) return '🧘‍♂️';
    if (lower.includes('vận động') || lower.includes('linh hoạt')) return '🤸‍♂️';
    if (lower.includes('tay') || lower.includes('cơ')) return '💪';
    if (lower.includes('giảm đau') || lower.includes('phục hồi cơ')) return '🩹';
    if (lower.includes('chuyên sâu')) return '🩺';
    if (lower.includes('kéo giãn')) return '🏃‍♂️';
    return '🩺';
  };

  // Helper to extract base name and level from package name
  const getBaseNameAndLevel = (name: string) => {
    const upperName = name.toUpperCase();
    let level = 'BASIC';
    let baseName = name;
    
    if (upperName.includes(' - BASIC')) {
      level = 'BASIC';
      baseName = name.substring(0, upperName.indexOf(' - BASIC'));
    } else if (upperName.includes(' - STANDARD')) {
      level = 'STANDARD';
      baseName = name.substring(0, upperName.indexOf(' - STANDARD'));
    } else if (upperName.includes(' - INTENSIVE')) {
      level = 'INTENSIVE';
      baseName = name.substring(0, upperName.indexOf(' - INTENSIVE'));
    } else {
      const parts = name.split(' - ');
      if (parts.length > 1) {
        level = parts[parts.length - 1].toUpperCase();
        baseName = parts.slice(0, -1).join(' - ');
      }
    }
    return { baseName, level };
  };

  const getCategoryName = (catId: string): string => {
    const cat = categories.find(c => c.id.toString() === catId.toString());
    return cat ? cat.ten_danh_muc : 'Dịch vụ';
  };

  // Split categories
  const serviceCategories = categories.filter(c => c.loai_danh_muc === 'dich_vu');
  const packageCategories = categories.filter(c => c.loai_danh_muc === 'goi');

  // Filter services: only show retail ('bo_sung') and match selected category
  const filteredServices = services.filter(s => {
    const isRetail = s.loai_dich_vu === 'bo_sung';
    const matchesCat = selectedServiceCatId === 'all' || s.danh_muc_id.toString() === selectedServiceCatId.toString();
    return isRetail && matchesCat;
  });

  // Filter packages: match selected category
  const filteredPackages = packages.filter(p => {
    return selectedPackageCatId === 'all' || p.danh_muc_id?.toString() === selectedPackageCatId.toString();
  });

  // Group filtered packages by base name
  const groupedPackages = filteredPackages.reduce((acc: { [key: string]: GroupedPackage }, pkg) => {
    const { baseName, level } = getBaseNameAndLevel(pkg.ten_goi);
    if (!acc[baseName]) {
      acc[baseName] = {
        baseName,
        mo_ta: pkg.mo_ta,
        danh_muc_id: pkg.danh_muc_id,
        levels: {}
      };
    }
    acc[baseName].levels[level] = pkg;
    return acc;
  }, {});

  const groupedPackagesList = Object.values(groupedPackages);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-body relative overflow-x-hidden">
      {/* Scroll Reveal Styles */}
      <style>{`
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .reveal-on-scroll.slide-left {
          transform: translateX(-50px) translateY(0);
        }
        .reveal-on-scroll.slide-right {
          transform: translateX(50px) translateY(0);
        }
        .reveal-on-scroll.active-reveal {
          opacity: 1;
          transform: translate(0);
        }
      `}</style>

      {/* Cinematic Banner Slider */}
      <ClinicBannerSlider page="services" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
          <p className="text-primary font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 mb-3">
            <span className="size-1.5 bg-primary rounded-full"></span> Office Care Clinic Catalog
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight leading-tight uppercase">
            Danh Mục Chăm Sóc Sức Khỏe
          </h1>
          <p className="mt-4 text-sm md:text-base text-slate-500 font-semibold leading-relaxed">
            Tra cứu toàn bộ thông tin chi tiết về các dịch vụ trị liệu cơ học riêng lẻ và phác đồ combo trọn gói được cấu hình chuẩn y khoa.
          </p>
        </div>

        {/* Dynamic Dual Main Selector Tabs */}
        <div className="flex justify-center mb-12 animate-slide-up">
          <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm flex items-center">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award size={14} /> Dịch vụ đơn lẻ
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'packages'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={14} /> Gói trị liệu Combo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto py-8">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="bg-white rounded-[32px] p-8 h-48 animate-pulse border border-slate-100 shadow-xs"></div>
            ))}
          </div>
        ) : (
          <div className="animate-fade-in">
            
            {/* VIEW 1: SINGLE SERVICES */}
            {activeTab === 'services' && (
              <div className="space-y-10">
                {/* Category selectors (Dynamic Pills) */}
                {serviceCategories.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedServiceCatId('all')}
                      className={`px-5 py-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 border ${
                        selectedServiceCatId === 'all'
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      Tất cả
                    </button>
                    {serviceCategories.map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedServiceCatId(cat.id.toString())}
                        className={`px-5 py-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 border flex items-center gap-1.5 ${
                          selectedServiceCatId === cat.id.toString()
                            ? 'bg-[#2EC4B6]/10 border-[#2EC4B6]/30 text-primary'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span>{getCategoryEmoji(cat.ten_danh_muc)}</span>
                        <span>{cat.ten_danh_muc}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Staggered dynamic grid of services */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                  {filteredServices.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-[28px] border border-slate-150 shadow-xs">
                      <p className="text-slate-400 font-semibold text-sm">Không tìm thấy dịch vụ nào phù hợp.</p>
                    </div>
                  ) : (
                    filteredServices.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`reveal-on-scroll ${idx % 2 === 0 ? 'slide-left' : 'slide-right'} bg-white rounded-[28px] p-6 md:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 hover:border-teal-500/20 flex flex-col justify-between group`}
                      >
                        <div className="space-y-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="size-12 rounded-2xl bg-teal-50/70 border border-teal-100/50 text-primary flex items-center justify-center text-lg shrink-0">
                                {getCategoryEmoji(getCategoryName(item.danh_muc_id))}
                              </div>
                              <div>
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                                  {getCategoryName(item.danh_muc_id)}
                                </span>
                                <Link to={`/services/${item.id}`}>
                                  <h3 className="font-heading font-extrabold text-lg text-slate-900 group-hover:text-primary transition-colors leading-snug pt-1">
                                    {item.ten_dich_vu}
                                  </h3>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="text-primary font-black text-lg block">
                                {formatPrice(item.don_gia)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">/buổi</span>
                            </div>
                          </div>

                          <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                            {item.mo_ta_ngan}
                          </p>

                          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80 space-y-2.5">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mục tiêu phục hồi:</p>
                            <ul className="space-y-1.5">
                              {getServiceBenefits(item).map((benefit, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium leading-relaxed">
                                  <span className="text-primary mt-0.5 shrink-0">✓</span>
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                            <span className="flex items-center gap-1"><Clock size={12} /> {item.thoi_luong_phut} phút</span>
                            <span>•</span>
                            <span className="text-primary flex items-center gap-0.5">
                              <Sparkles size={11} /> Đạt chuẩn y tế
                            </span>
                          </div>
                          
                          <Link
                            to={`/services/${item.id}`}
                            className="text-xs font-black text-[#2EC4B6] hover:text-[#25A89C] flex items-center gap-1 group/btn"
                          >
                            Xem chi tiết dịch vụ <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: SERVICE PACKAGES COMBO */}
            {activeTab === 'packages' && (
              <div className="space-y-10 max-w-6xl mx-auto">
                {/* Category selectors (Dynamic Pills for Packages) */}
                {packageCategories.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedPackageCatId('all')}
                      className={`px-5 py-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 border ${
                        selectedPackageCatId === 'all'
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      Tất cả
                    </button>
                    {packageCategories.map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedPackageCatId(cat.id.toString())}
                        className={`px-5 py-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 border flex items-center gap-1.5 ${
                          selectedPackageCatId === cat.id.toString()
                            ? 'bg-[#2EC4B6]/10 border-[#2EC4B6]/30 text-primary'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span>{getCategoryEmoji(cat.ten_danh_muc)}</span>
                        <span>{cat.ten_danh_muc}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid of Grouped Packages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {groupedPackagesList.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-[28px] border border-slate-150 shadow-xs">
                      <p className="text-slate-400 font-semibold text-sm">Chưa có gói dịch vụ nào phù hợp.</p>
                    </div>
                  ) : (
                    groupedPackagesList.map((groupedPkg, idx) => (
                      <div
                        key={idx}
                        className={`reveal-on-scroll ${idx % 2 === 0 ? 'slide-left' : 'slide-right'}`}
                      >
                        <GroupedPackageCard 
                          groupedPackage={groupedPkg}
                          services={services}
                          handleBookingClick={handleBookingClick}
                          onViewDetails={() => {
                            const slug = getPackageSlug(groupedPkg.baseName);
                            navigate(`/packages/${slug}`);
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Direct Booking Bottom CTA Banner */}
        <div className="reveal-on-scroll mt-20 bg-secondary rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-soft-ui border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 max-w-5xl mx-auto">
            <div className="max-w-2xl">
              <span className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <CheckCircle2 size={13} /> Tư vấn chuyên sâu chuẩn y khoa
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black text-white leading-tight uppercase tracking-tight mb-4">
                Khởi đầu hành trình phục hồi ngay hôm nay
              </h2>
              <p className="text-slate-400 text-xs md:text-sm font-semibold leading-relaxed">
                Hệ thống tự động điều phối lịch khám cho chuyên gia phù hợp nhất dựa trên mức độ chấn thương và triệu chứng đau mỏi của bạn.
              </p>
            </div>
            
            <Link
              to="/booking"
              onClick={handleBookingClick}
              className="bg-primary hover:bg-[#25A89C] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-full shadow-soft-button hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Calendar size={15} />
              Đặt lịch tư vấn ngay
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
