import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Briefcase, GraduationCap, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { getPublicSpecialists } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';

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
  trung_binh_sao?: number | string;
  tong_danh_gia?: number;
}

export default function Specialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'ALL' | 'DOCTOR' | 'TECH'>('ALL');

  const sliderRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      const cardWidth = container.firstElementChild?.getBoundingClientRect().width || 300;
      const scrollAmount = direction === 'left' ? -(cardWidth + 24) : (cardWidth + 24);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
    if (filterRole === 'DOCTOR') return s.vai_tro.toLowerCase().includes('bác sĩ') || s.vai_tro.toLowerCase().includes('doctor');
    if (filterRole === 'TECH') return s.vai_tro.toLowerCase().includes('kỹ thuật viên') || s.vai_tro.toLowerCase().includes('technician') || s.vai_tro.toLowerCase().includes('ktv');
    return true;
  });

  // Dynamic counts for sidebar indicators
  const allCount = specialists.length;
  const doctorCount = specialists.filter(s => s.vai_tro.toLowerCase().includes('bác sĩ') || s.vai_tro.toLowerCase().includes('doctor')).length;
  const techCount = specialists.filter(s => s.vai_tro.toLowerCase().includes('kỹ thuật viên') || s.vai_tro.toLowerCase().includes('technician') || s.vai_tro.toLowerCase().includes('ktv')).length;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      {/* HUD High-tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-60 z-0"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Tighter Left-aligned Header */}
        <div className="mb-10 max-w-4xl">
          <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3 shadow-sm">
            ✨ ĐỘI NGŨ NHÂN SỰ Y KHOA
          </span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mb-2">
            Đồng Hành Cùng <span className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] bg-clip-text text-transparent">Chuyên Gia</span>
          </h1>
          <p className="text-slate-500 font-semibold text-xs md:text-sm leading-relaxed max-w-2xl">
            Hội tụ các Bác sĩ chuyên khoa Phục hồi chức năng đầu ngành cùng đội ngũ Kỹ thuật viên trị liệu dày dặn kinh nghiệm, tận tâm và chuyên nghiệp.
          </p>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sidebar Filters */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-md p-5 border border-slate-200/50 rounded-3xl shadow-[0_15px_35px_rgba(15,23,42,0.02)] space-y-4">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">
              📂 BỘ LỌC CHUYÊN GIA
            </span>
            
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setFilterRole('ALL')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  filterRole === 'ALL'
                    ? 'bg-[#14B8A6] text-white shadow-md shadow-teal-500/10'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>📂</span> Tất Cả Chuyên Gia
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  filterRole === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{allCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterRole('DOCTOR')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  filterRole === 'DOCTOR'
                    ? 'bg-[#14B8A6] text-white shadow-md shadow-teal-500/10'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>👨‍⚕️</span> Bác Sĩ Chuyên Khoa
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  filterRole === 'DOCTOR' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{doctorCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterRole('TECH')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  filterRole === 'TECH'
                    ? 'bg-[#14B8A6] text-white shadow-md shadow-teal-500/10'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>💆‍♂️</span> Kỹ Thuật Viên
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  filterRole === 'TECH' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{techCount}</span>
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-bold leading-normal">
              💡 Bác sĩ phụ trách chuẩn đoán phác đồ; Kỹ thuật viên trực tiếp thực hiện trị liệu bằng tay.
            </div>
          </div>

          {/* Right Column: Specialists Slider */}
          <div className="lg:col-span-9 relative group/slider">
            
            {/* Navigation buttons at the top right of the section */}
            {filteredSpecialists.length > 2 && (
              <div className="absolute right-4 top-[-48px] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="size-9 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-650 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="size-9 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-650 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div 
              ref={sliderRef}
              className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-smooth pb-4 pr-1"
            >
              {filteredSpecialists.map((spec) => {
                const isDoctor = spec.vai_tro.toLowerCase().includes('bác sĩ') || spec.vai_tro.toLowerCase().includes('doctor');
                return (
                  <div
                    key={spec.id}
                    className="min-w-full md:min-w-[calc(50%-12px)] max-w-full md:max-w-[calc(50%-12px)] snap-start bg-white rounded-[24px] border border-slate-100/80 shadow-[0_8px_25px_rgba(15,23,42,0.01)] hover:shadow-[0_15px_35px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden relative group"
                  >
                    <div>
                      {/* Portrait Box */}
                      <div className="aspect-[16/9] w-full bg-slate-100 overflow-hidden relative">
                        <img
                          src={spec.anh_dai_dien || '/images/default_avatar.png'}
                          alt={spec.ho_ten}
                          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent"></div>
                        
                        {/* Role Badges */}
                        <div className="absolute top-3 left-3">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${
                            isDoctor
                              ? 'bg-[#14B8A6] text-white border-teal-400/30'
                              : 'bg-[#FF9F1C] text-white border-amber-400/30'
                          }`}>
                            {spec.vai_tro}
                          </span>
                        </div>

                        {/* Star Rating Badge */}
                        <div className="absolute top-3 right-3 bg-slate-900/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 text-[9px] font-black text-white shadow-sm border border-white/5">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span>{Number(spec.trung_binh_sao || 5).toFixed(1)} ({spec.tong_danh_gia || 0})</span>
                        </div>

                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-white bg-slate-900/40 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/5">
                            <Briefcase size={10} className="text-[#14B8A6]" />
                            <span>{spec.so_nam_kinh_nghiem || 5} năm kinh nghiệm</span>
                          </div>
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className="p-4">
                        <h3 className="font-heading font-black text-base text-slate-800 group-hover:text-[#0D9488] transition-colors leading-tight mb-2">
                          {spec.ho_ten}
                        </h3>
                        
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-lg">
                          <ShieldCheck size={12} />
                          <span>Chứng chỉ hành nghề Bộ Y Tế</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2.5 mt-2">
                        <Link
                          to={`/specialists/${spec.id}`}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1"
                        >
                          <GraduationCap size={12} />
                          <span>Xem hồ sơ</span>
                        </Link>
                        
                        <Link
                          to="/booking"
                          state={{ selectedDoctorId: spec.id, isKtv: !isDoctor }}
                          className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 shadow-sm shadow-[#2EC4B6]/20"
                        >
                          <span>Đặt lịch khám</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredSpecialists.length === 0 && (
                <div className="w-full text-center py-12 text-slate-400 font-bold">
                  Không có chuyên gia nào thuộc danh mục này.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
