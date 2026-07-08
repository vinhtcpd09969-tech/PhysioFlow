import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Clock, Phone, Loader2, Info } from 'lucide-react';
import { getPublicPackages, getPublicCategories } from '../api/public.api';
import toast from 'react-hot-toast';

interface Package {
  id: string;
  ten_goi: string;
  loai_goi: string;
  tong_so_buoi: number;
  thoi_luong_phut: number;
  don_gia: number | string;
  don_gia_theo_buoi: number | string;
  quy_trinh?: string;
  muc_tieu?: string;
  anh_goi?: string;
  danh_muc_goi_id?: string;
  danh_muc_id?: string;
}

interface Category {
  id: string;
  ten_danh_muc: string;
}

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [pkg, setPkg] = useState<Package | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resPkgs, resCats] = await Promise.all([
          getPublicPackages(),
          getPublicCategories()
        ]);

        const fetchedPackages: Package[] = resPkgs.data || [];
        const fetchedCategories: Category[] = resCats.data || [];
        setCategories(fetchedCategories);

        const foundPkg = fetchedPackages.find(p => p.id.toString() === id?.toString());
        setPkg(foundPkg || null);
      } catch (e) {
        toast.error('Lỗi khi tải thông tin gói liệu trình.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (pkg) {
      document.title = `${pkg.ten_goi} - Liệu trình chuyên sâu | RehabFlow`;
    }
  }, [pkg]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24">
        <Loader2 className="animate-spin w-10 h-10 text-primary mb-3" />
        <p className="font-bold text-slate-400 text-sm">Đang tải thông tin liệu trình...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24 text-center px-4">
        <div className="size-16 rounded-2xl bg-teal-50 flex items-center justify-center text-[#2EC4B6] border border-teal-100 mb-4">
          <Info size={30} />
        </div>
        <h2 className="text-[#0B1222] font-bold text-lg">Không tìm thấy chi tiết liệu trình</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">Liệu trình này không tồn tại hoặc đã ngừng cung cấp.</p>
        <Link to="/services" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#25A89C]">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  const getCategoryName = (): string => {
    const catId = pkg.danh_muc_goi_id || pkg.danh_muc_id;
    if (!catId) return 'Liệu trình';
    const cat = categories.find(c => c.id.toString() === catId.toString());
    return cat ? cat.ten_danh_muc : 'Liệu trình';
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '';
    const numPrice = typeof price === 'string' ? parseInt(price, 10) : price;
    if (isNaN(numPrice)) return price.toString();
    if (numPrice === 0) return 'Liên hệ';
    return numPrice.toLocaleString('vi-VN') + ' đ';
  };

  const handleBooking = () => {
    navigate('/booking', {
      state: {
        bookingType: 'kham',
        packageId: pkg.id
      }
    });
  };

  const quyTrinhSteps = pkg.quy_trinh ? pkg.quy_trinh.split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
  const mucTieuPoints = pkg.muc_tieu ? pkg.muc_tieu.split('\n').map((p: string) => p.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      {/* Visual background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-teal-50/20 via-transparent to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to="/services" className="hover:text-primary transition-colors">Danh mục dịch vụ</Link>
            <span>/</span>
            <span className="text-primary font-extrabold">{pkg.ten_goi}</span>
          </div>

          <Link
            to="/services"
            className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 tracking-wider transition-colors bg-white border border-slate-200/60 px-4.5 py-2.5 rounded-xl shadow-xs"
          >
            ← Danh mục dịch vụ
          </Link>
        </div>

        {/* Section 1: Hero Banner */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.015)] p-6 md:p-12 lg:p-16 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap gap-2.5 items-center">
                <span className="bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-primary/20">
                  {getCategoryName()}
                </span>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                  Đạt chuẩn y khoa
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-heading font-black text-secondary tracking-tight leading-tight uppercase">
                {pkg.ten_goi}
              </h1>

              <div className="flex items-center gap-6 py-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đơn giá trọn gói</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{formatPrice(pkg.don_gia)} <span className="text-sm font-bold text-slate-400">/ {pkg.tong_so_buoi} buổi</span></p>
                </div>
                <div className="w-px h-12 bg-slate-200"></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời lượng mỗi buổi</p>
                  <p className="text-2xl font-black text-secondary mt-1 flex items-center gap-1.5"><Clock size={20} className="text-primary" /> {pkg.thoi_luong_phut} phút</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={handleBooking}
                  className="bg-primary hover:bg-[#25A89C] text-white font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-[0_10px_25px_-5px_rgba(46,196,182,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(46,196,182,0.5)] flex items-center gap-2 group cursor-pointer"
                >
                  Đăng ký thăm khám ngay <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                
                <a
                  href="tel:19001234"
                  className="bg-white border border-slate-200/80 hover:border-primary text-secondary hover:text-primary font-extrabold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 shadow-xs flex items-center gap-2"
                >
                  <Phone size={13} /> Gọi hotline tư vấn
                </a>
              </div>
            </div>

            {/* Hero Photo */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-4/3 md:aspect-video lg:aspect-square rounded-[36px] overflow-hidden shadow-xl border border-white relative group">
                <img
                  src={pkg.anh_goi || '/images/packages/wellness_hero.png'}
                  alt={pkg.ten_goi}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Section 2: Quy trình & Mục tiêu trị liệu (2-column layout in a single card) */}
        <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_8px_30px_rgba(15,23,42,0.015)] p-6 md:p-10 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            
            {/* Left Column: Quy trình trị liệu */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#14B8A6]/10 px-3 py-1 rounded-full">
                  🩺 Quy trình
                </span>
                <h3 className="font-heading font-black text-secondary text-sm md:text-base uppercase tracking-tight">
                  Quy trình trị liệu y khoa
                </h3>
              </div>
              
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2">
                {quyTrinhSteps.map((step: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="size-5 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
                {quyTrinhSteps.length === 0 && (
                  <p className="text-left text-xs text-slate-450 font-bold py-4">
                    Quy trình trị liệu chi tiết đang được cập nhật...
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Mục tiêu trị liệu */}
            <div className="pt-6 md:pt-0 md:pl-8 space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full">
                  🎯 Mục tiêu
                </span>
                <h3 className="font-heading font-black text-secondary text-sm md:text-base uppercase tracking-tight">
                  Mục tiêu & Lợi ích trị liệu
                </h3>
              </div>
              
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2">
                {mucTieuPoints.map((point: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="size-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      ✓
                    </div>
                    <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                      {point}
                    </p>
                  </div>
                ))}
                {mucTieuPoints.length === 0 && (
                  <p className="text-left text-xs text-slate-450 font-bold py-4">
                    Mục tiêu trị liệu chi tiết đang được cập nhật...
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
