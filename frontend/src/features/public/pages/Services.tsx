import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPublicServices, getPublicPackages, getPublicCategories } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';

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
  danh_muc_id?: number | string | null;
  luot_dung: number;
}

interface Category {
  id: string;
  ten_danh_muc: string;
  mo_ta: string | null;
  loai_goi_ap_dung: 'KHAM' | 'LE' | 'LIEU_TRINH';
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<UnifiedService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'KHAM' | 'LE' | 'LIEU_TRINH'>('KHAM');
  const [showLieuTrinhWarning, setShowLieuTrinhWarning] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      const cardWidth = container.firstElementChild?.getBoundingClientRect().width || 400;
      const scrollAmount = direction === 'left' ? -(cardWidth + 24) : (cardWidth + 24);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Reset category filter when changing tab
  const handleTabChange = (tab: 'KHAM' | 'LE' | 'LIEU_TRINH') => {
    setActiveTab(tab);
    setSelectedCategoryId('ALL');
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, packagesRes, categoriesRes] = await Promise.all([
          getPublicServices(),
          getPublicPackages(),
          getPublicCategories()
        ]);
        setCategories(categoriesRes.data);
        
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
          anh_goi: s.anh_goi || (s.loai_dich_vu === 'KHAM' ? '/goi/images/kham_sang_loc.png' : '/goi/images/laser_tri_lieu.png'),
          loai_goi: s.loai_dich_vu === 'KHAM' ? 'KHAM' : 'LE',
          danh_muc_id: s.danh_muc_id,
          luot_dung: Number(s.luot_dung || 0)
        }));

        // Map packages (LIEU_TRINH)
        const packagesMapped = packagesRes.data.map((p: any) => ({
          id: p.id.toString(),
          ten_goi: p.ten_goi,
          ma_goi: p.ma_goi || 'LIEU_TRINH',
          mo_ta: p.quy_trinh || p.muc_tieu || 'Lộ trình phục hồi toàn diện cá nhân hóa theo phác đồ bác sĩ.',
          quy_trinh: p.quy_trinh,
          muc_tieu: p.muc_tieu,
          tong_so_buoi: p.tong_so_buoi,
          gia_tien: Number(p.gia_tien),
          thoi_luong_phut: p.thoi_luong_phut || 60,
          anh_goi: p.anh_goi || '/goi/images/giai_co_sau.png',
          loai_goi: 'LIEU_TRINH',
          danh_muc_id: p.danh_muc_id,
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

  const activeCategories = categories.filter(cat => cat.loai_goi_ap_dung === activeTab);

  const filteredItems = items.filter(item => {
    if (item.loai_goi !== activeTab) return false;
    if (selectedCategoryId !== 'ALL' && item.danh_muc_id !== selectedCategoryId) return false;
    return true;
  });



  // Dynamic counts for sidebar indicators
  const khamCount = items.filter(item => item.loai_goi === 'KHAM').length;
  const leCount = items.filter(item => item.loai_goi === 'LE').length;
  const lieuTrinhCount = items.filter(item => item.loai_goi === 'LIEU_TRINH').length;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      {/* HUD High-tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-60 z-0"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Centered Header */}
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3 shadow-sm">
            ✨ DỊCH VỤ & LIỆU TRÌNH Y KHOA
          </span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mb-3">
            Giải Pháp <span className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] bg-clip-text text-transparent">Trị Liệu & Phục Hồi</span>
          </h1>
          <p className="text-slate-500 font-semibold text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
            Tất cả dịch vụ được chuẩn hóa y khoa với các thiết bị vật lý trị liệu tân tiến nhập khẩu từ Châu Âu cùng phác đồ cá nhân hóa từ chuyên gia.
          </p>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sidebar Filters */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-md p-5 border border-slate-200/50 rounded-3xl shadow-[0_15px_35px_rgba(15,23,42,0.02)] space-y-4">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">
              📂 PHÂN LOẠI DỊCH VỤ
            </span>
            
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleTabChange('KHAM')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'KHAM'
                    ? 'bg-[#14B8A6] text-white shadow-md shadow-teal-500/10'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🩺</span> Khám Lâm Sàng
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  activeTab === 'KHAM' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{khamCount}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('LE')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'LE'
                    ? 'bg-[#14B8A6] text-white shadow-md shadow-teal-500/10'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>⚡</span> Trị Liệu Đơn Buổi
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  activeTab === 'LE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{leCount}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('LIEU_TRINH')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'LIEU_TRINH'
                    ? 'bg-[#14B8A6] text-white shadow-md shadow-teal-500/10'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>💎</span> Liệu Trình Chuyên Sâu
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  activeTab === 'LIEU_TRINH' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{lieuTrinhCount}</span>
              </button>
            </div>

            {activeCategories.length > 0 && (
              <div className="border-t border-slate-150/80 pt-4 space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                  🔍 Chuyên khoa / Danh mục
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('ALL');
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCategoryId === 'ALL'
                        ? 'bg-slate-100 text-slate-900 border border-slate-200'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    👉 Tất cả danh mục
                  </button>
                  {activeCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selectedCategoryId === cat.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      • {cat.ten_danh_muc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-bold leading-normal">
              💡 Bệnh nhân được khuyến nghị khám sàng lọc trước khi tham gia các liệu trình.
            </div>
          </div>

          {/* Right Column: Services Slider */}
          <div className="lg:col-span-9 relative group/slider">
            
            {/* Navigation buttons at the top right of the section */}
            {filteredItems.length > 2 && (
              <div className="absolute right-4 top-[-48px] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="size-9 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="size-9 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div 
              ref={sliderRef}
              className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-smooth pb-4 pr-1"
            >
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="min-w-full md:min-w-[calc(50%-12px)] max-w-full md:max-w-[calc(50%-12px)] snap-start bg-white rounded-[24px] p-4 border border-slate-100/80 shadow-[0_8px_25px_rgba(15,23,42,0.01)] hover:shadow-[0_15px_35px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden relative group"
                >
                  <div>
                    {/* Visual Thumbnail */}
                    <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 relative mb-3">
                      <img
                        src={item.anh_goi || '/goi/images/giai_co_sau.png'}
                        alt={item.ten_goi}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 to-transparent"></div>
                      
                      {item.thoi_luong_phut && (
                        <div className="absolute bottom-2 left-2 bg-slate-900/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 text-[9px] font-bold text-white shadow-sm border border-white/5">
                          <Clock size={10} className="text-[#14B8A6]" />
                          <span>{item.thoi_luong_phut} phút</span>
                        </div>
                      )}

                      <div className="absolute top-2 right-2 bg-slate-900/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-0.5 text-[9px] font-black text-white shadow-sm border border-white/5">
                        <span>🔥 {item.luot_dung || 12} lượt đặt</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-black text-sm text-slate-800 group-hover:text-[#0D9488] transition-colors leading-snug mb-2.5 min-h-[40px] line-clamp-2">
                      {item.ten_goi}
                    </h3>

                    {/* Price and Session info */}
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-base font-black text-slate-900">
                        {item.gia_tien === 0 ? 'Liên hệ' : item.gia_tien.toLocaleString('vi-VN') + ' đ'}
                      </span>
                      {item.loai_goi === 'LIEU_TRINH' && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          / {item.tong_so_buoi} buổi
                        </span>
                      )}
                      {item.loai_goi !== 'LIEU_TRINH' && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          / buổi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.loai_goi === 'LIEU_TRINH') {
                          navigate(`/packages/${item.id}`);
                        } else {
                          navigate(`/services/${item.id}`);
                        }
                      }}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-center font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 border border-slate-200/60 cursor-pointer active:scale-98"
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
                              bookingType: item.loai_goi === 'KHAM' ? 'kham' : 'le',
                              selectedServiceId: item.id 
                            } 
                          });
                        }
                      }}
                      className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-98 shadow-sm shadow-[#2EC4B6]/15"
                    >
                      Đặt Lịch
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="w-full text-center py-12 text-slate-400 font-bold">
                  Không có dịch vụ nào trong mục này.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Gói Liệu Trình Warning Modal */}
      {showLieuTrinhWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-[32px] border border-slate-100 max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
              <h3 className="text-xl font-heading font-black text-slate-900 uppercase tracking-wide">Yêu cầu chỉ định thăm khám</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Gói liệu trình chuyên sâu cần có chỉ định thăm khám lâm sàng từ Bác sĩ chuyên khoa trước khi thực hiện để đảm bảo an toàn & hiệu quả điều trị.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowLieuTrinhWarning(false);
                  navigate('/booking', { state: { bookingType: 'kham' } });
                }}
                className="bg-primary hover:bg-[#25A89C] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-sm transition-all"
              >
                Tiếp tục đặt lịch khám
              </button>
              <button
                type="button"
                onClick={() => setShowLieuTrinhWarning(false)}
                className="bg-zinc-50 hover:bg-zinc-100 text-slate-650 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl border border-zinc-200 transition-all"
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
