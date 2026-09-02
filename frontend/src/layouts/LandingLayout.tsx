import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, ChevronDown, Menu, X, Calendar, MapPin, User, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import GlobalAuthModal from './GlobalAuthModal';
import AIChatBubble from '../features/chat/components/AIChatBubble';
import { resolveImageUrl } from '../utils/imageUrl';
import { TermsOfServiceModal } from '../features/customer/components/TermsOfServiceModal';
import { OfficeCareLogoMark } from '../components/OfficeCareLogo';
import { getPublicServices, getPublicPackages } from '../features/public/api/public.api';

// Official Zalo Logo Vector Component (Clean, Full-bleed Blue Bubble with crisp white Zalo)
function ZaloIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.03 2 11C2 13.6 3.2 15.9 5.2 17.4C4.8 19.3 3.6 20.8 3.5 21C3.3 21.2 3.4 21.6 3.7 21.7C3.8 21.7 3.9 21.7 4 21.7C5.9 21.7 8.1 20.6 9.4 19.6C10.2 19.9 11.1 20 12 20C17.52 20 22 15.97 22 11C22 6.03 17.52 2 12 2Z"
        fill="#0068FF"
      />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="7.5"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="-0.2px"
      >
        Zalo
      </text>
    </svg>
  );
}

// Facebook Vector Component (Matching Circular Full-bleed Blue Badge with Crisp White 'f')
function FacebookIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path
        d="M14.2 8.8H12.8C12.4 8.8 12.1 9.1 12.1 9.5V11.2H14.4L14.1 13.5H12.1V18.5H9.8V13.5H8.2V11.2H9.8V9.5C9.8 7.8 11.1 6.5 12.8 6.5H14.2V8.8Z"
        fill="white"
      />
    </svg>
  );
}

const DEFAULT_FOOTER_SERVICES = [
  { id: 'c1000000-0000-0000-0000-000000000000', ten_goi: 'Lượng Giá Chức Năng Cơ Xương Khớp' },
  { id: 'c1000000-0000-0000-0000-000000000201', ten_goi: 'Liệu Trình Điều Trị Cổ - Vai - Gáy' },
  { id: 'c1000000-0000-0000-0000-000000000202', ten_goi: 'Liệu Trình Điều Trị Đau Lưng Văn Phòng' },
  { id: 'c1000000-0000-0000-0000-000000000203', ten_goi: 'Liệu Trình Cải Thiện Tư Thế Văn Phòng' },
  { id: 'c1000000-0000-0000-0000-000000000204', ten_goi: 'Liệu Trình Phục Hồi Chuyên Sâu' },
  { id: 'c1000000-0000-0000-0000-000000000103', ten_goi: 'Gói Phục Hồi Toàn Diện' },
];

export default function LandingLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGlobalAuthModal, setShowGlobalAuthModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [footerServices, setFooterServices] = useState<{ id: string; ten_goi: string }[]>(DEFAULT_FOOTER_SERVICES);

  useEffect(() => {
    async function loadFooterServices() {
      try {
        const [resSvcs, resPkgs] = await Promise.all([
          getPublicServices(),
          getPublicPackages()
        ]);
        const all = [...(resSvcs.data || []), ...(resPkgs.data || [])];
        const mapped = all
          .filter(s => s.trang_thai === 'hoat_dong' || s.trang_thai === undefined)
          .map(s => ({ id: String(s.id), ten_goi: String(s.ten_goi || s.ten_dich_vu) }))
          .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
          .slice(0, 6);

        if (mapped.length > 0) {
          setFooterServices(mapped);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách dịch vụ footer:', err);
      }
    }
    loadFooterServices();
  }, []);

  // Active Route Detector
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/services') {
      return location.pathname.startsWith('/services') || location.pathname.startsWith('/package');
    }
    if (path === '/specialists') {
      return location.pathname.startsWith('/specialists');
    }
    if (path === '/tin-tuc') {
      return location.pathname.startsWith('/tin-tuc') || location.pathname.startsWith('/bai-viet') || location.pathname.startsWith('/articles');
    }
    if (path === '/gioi-thieu') {
      return location.pathname.startsWith('/gioi-thieu') || location.pathname.startsWith('/about');
    }
    return location.pathname === path;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowGlobalAuthModal(true);
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    const roleId = Number(user.vai_tro_id);
    const roleStr = String((user as any).vai_tro || '').toUpperCase();
    if (roleId === 5 || roleId === 6 || roleStr === 'ADMIN') return '/admin';
    if (roleId === 4 || roleStr === 'BAC_SI') return '/doctor/appointments';
    if (roleId === 3 || roleStr === 'KY_THUAT_VIEN') return '/technician/appointments';
    if (roleId === 2 || roleStr === 'LE_TAN') return '/receptionist/appointments';
    return '/appointments';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800 selection:bg-[#2EC4B6]/20 selection:text-[#2EC4B6]">
      {/* Header Bar */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100 py-3'
            : 'bg-white py-4 border-b border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <OfficeCareLogoMark size={32} className="group-hover:scale-105 transition-transform" />
              <div className="flex flex-col text-left">
                <span className="font-heading font-black text-[18px] text-[#0F172A] leading-tight tracking-tight">
                  OFFICE CARE
                </span>
                <span className="text-[10px] text-[#0D9488] font-jakarta font-extrabold uppercase tracking-widest leading-none mt-0.5">
                  PHỤC HỒI CHỨC NĂNG
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-[20px] border border-slate-200/50">
              <Link
                to="/"
                className={`px-5 py-2 rounded-[14px] text-xs font-jakarta font-extrabold transition-all ${
                  isActive('/')
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Trang Chủ
              </Link>

              <Link
                to="/services"
                className={`px-5 py-2 rounded-[14px] text-xs font-jakarta font-extrabold transition-all ${
                  isActive('/services')
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Gói Dịch Vụ
              </Link>

              <Link
                to="/specialists"
                className={`px-5 py-2 rounded-[14px] text-xs font-jakarta font-extrabold transition-all ${
                  isActive('/specialists')
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Đội Ngũ
              </Link>

              <Link
                to="/tin-tuc"
                className={`px-5 py-2 rounded-[14px] text-xs font-jakarta font-extrabold transition-all ${
                  isActive('/tin-tuc')
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Kiến Thức Y Khoa
              </Link>

              <Link
                to="/gioi-thieu"
                className={`px-5 py-2 rounded-[14px] text-xs font-jakarta font-extrabold transition-all ${
                  isActive('/gioi-thieu')
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Về Chúng Tôi
              </Link>
            </nav>

            {/* User Profile / CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/booking"
                onClick={handleBookingClick}
                className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-xs font-jakarta font-extrabold px-5 py-2.5 rounded-[14px] transition-all shadow-md shadow-[#2EC4B6]/20 flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Calendar size={15} />
                <span>Đặt Lịch</span>
              </Link>

              {isAuthenticated() && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-[16px] hover:bg-slate-100 border border-slate-200/60 transition-all cursor-pointer"
                  >
                    {user.anh_dai_dien ? (
                      <img
                        src={resolveImageUrl(user.anh_dai_dien)}
                        alt={user.ho_ten}
                        className="size-8 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="size-8 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] font-black text-xs flex items-center justify-center">
                        {user.ho_ten?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-extrabold text-[#0F172A] leading-tight max-w-[100px] truncate">
                        {user.ho_ten}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold capitalize">
                        {Number(user.vai_tro_id) === 1 ? 'Cá nhân' : (user as any).vai_tro?.toLowerCase() || 'Thành viên'}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate(getDashboardPath());
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-jakarta font-extrabold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <User size={15} className="text-[#2EC4B6]" />
                        <span>Trang cá nhân</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-jakarta font-extrabold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-[#0F172A] hover:bg-slate-100 text-xs font-jakarta font-extrabold px-4 py-2.5 rounded-[14px] transition-all border border-slate-200"
                >
                  Đăng Nhập
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-24 px-6 flex flex-col space-y-4 animate-in slide-in-from-top duration-200">
          <Link to="/" className="text-base font-jakarta font-extrabold py-3 border-b border-slate-100 text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
            Trang Chủ
          </Link>
          <Link to="/services" className="text-base font-jakarta font-extrabold py-3 border-b border-slate-100 text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
            Gói Dịch Vụ
          </Link>
          <Link to="/specialists" className="text-base font-jakarta font-extrabold py-3 border-b border-slate-100 text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
            Đội Ngũ Chuyên Viên
          </Link>
          <Link to="/tin-tuc" className="text-base font-jakarta font-extrabold py-3 border-b border-slate-100 text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
            Kiến Thức Y Khoa
          </Link>
          <Link to="/gioi-thieu" className="text-base font-jakarta font-extrabold py-3 border-b border-slate-100 text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
            Về Chúng Tôi
          </Link>

          <div className="pt-4 flex flex-col gap-3">
            <Link
              to="/booking"
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                handleBookingClick(e);
              }}
              className="flex items-center justify-center gap-2 bg-[#2EC4B6] text-white text-sm font-jakarta font-extrabold py-3.5 rounded-[16px]"
            >
              <Calendar size={18} />
              <span>Đặt Lịch Ngay</span>
            </Link>

            {isAuthenticated() ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate(getDashboardPath());
                }}
                className="w-full py-3.5 rounded-[16px] bg-slate-100 text-slate-900 font-jakarta font-extrabold text-sm cursor-pointer"
              >
                Trang cá nhân
              </button>
            ) : (
              <Link to="/login" className="flex items-center justify-center text-slate-800 bg-slate-100 text-sm font-jakarta font-extrabold py-3.5 rounded-[16px]" onClick={() => setIsMobileMenuOpen(false)}>
                Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Elegant Gentle Medical Light Footer */}
      <footer className="bg-gradient-to-b from-[#F0F7F5] to-[#E5F2EE] text-slate-600 font-jakarta pt-12 pb-10 mt-auto text-xs border-t border-[#D0E6E2] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          {/* Main 4 Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
            {/* Column 1: Brand & Mission */}
            <div className="md:col-span-4 space-y-4 text-left">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <OfficeCareLogoMark size={32} className="group-hover:scale-105 transition-transform" />
                <div className="flex flex-col text-left">
                  <span className="font-heading font-black text-[18px] text-slate-900 tracking-tight leading-tight">
                    OFFICE CARE
                  </span>
                  <span className="text-[10px] text-[#0D9488] font-black uppercase tracking-widest leading-none mt-0.5">
                    PHỤC HỒI CHỨC NĂNG Y KHOA
                  </span>
                </div>
              </Link>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                Giải pháp phục hồi chức năng cơ xương khớp & cột sống văn phòng chuyên sâu. Kết hợp công nghệ trị liệu Châu Âu và phác đồ cá nhân hóa 1:1 từ Chuyên viên tư vấn.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/80 text-[#0D9488] text-[10px] font-black shadow-2xs">
                  <ShieldCheck size={13} className="text-[#0D9488]" /> Đạt chuẩn Y Tế
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/80 text-[#0D9488] text-[10px] font-black shadow-2xs">
                  ⚡ Phác đồ 1:1
                </span>
              </div>
            </div>

            {/* Column 2: Services */}
            <div className="md:col-span-3 space-y-3.5 text-left">
              <h4 className="font-black text-xs tracking-widest text-slate-900 uppercase border-b border-[#C8E3DE] pb-2">Dịch Vụ Nổi Bật</h4>
              <ul className="space-y-2.5 text-slate-600 font-bold text-xs">
                {footerServices.map((svc) => (
                  <li key={svc.id}>
                    <Link
                      to={`/services/${svc.id}`}
                      className="hover:text-[#0D9488] transition-colors inline-flex items-center gap-1 group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">{svc.ten_goi}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Information */}
            <div className="md:col-span-2 space-y-3.5 text-left">
              <h4 className="font-black text-xs tracking-widest text-slate-900 uppercase border-b border-[#C8E3DE] pb-2">Thông Tin</h4>
              <ul className="space-y-2.5 text-slate-600 font-bold text-xs">
                <li>
                  <Link to="/gioi-thieu" className="hover:text-[#0D9488] transition-colors inline-flex items-center gap-1 group">
                    <span className="group-hover:translate-x-1 transition-transform">Giới thiệu trung tâm</span>
                  </Link>
                </li>
                <li>
                  <Link to="/specialists" className="hover:text-[#0D9488] transition-colors inline-flex items-center gap-1 group">
                    <span className="group-hover:translate-x-1 transition-transform">Hội đồng chuyên gia</span>
                  </Link>
                </li>
                <li>
                  <Link to="/tin-tuc" className="hover:text-[#0D9488] transition-colors inline-flex items-center gap-1 group">
                    <span className="group-hover:translate-x-1 transition-transform">Kiến thức y khoa</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="hover:text-[#0D9488] transition-colors inline-flex items-center gap-1 group text-left cursor-pointer font-bold"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">Điều khoản & Bảo mật</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Location & Contact */}
            <div className="md:col-span-3 space-y-3.5 text-left">
              <h4 className="font-black text-xs tracking-widest text-slate-900 uppercase border-b border-[#C8E3DE] pb-2">
                Vị Trí &amp; Liên Hệ
              </h4>

              <div className="space-y-2.5 text-slate-700 font-semibold text-xs">
                <p className="flex items-start gap-2.5 leading-relaxed">
                  <MapPin size={16} className="shrink-0 mt-0.5 text-[#0D9488]" />
                  <span>Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone size={16} className="shrink-0 text-[#0D9488]" />
                  <a href="tel:0398655332" className="hover:text-[#0D9488] font-black transition-colors">0398 655 332 (Zalo / Hotline)</a>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-2">
                    <Mail size={16} className="shrink-0 text-[#0D9488]" />
                    <a href="mailto:lienhe@officecare.vn" className="hover:text-[#0D9488] transition-colors">lienhe@officecare.vn</a>
                  </span>
                  <span className="text-slate-300 font-normal">|</span>
                  <div className="inline-flex items-center gap-1.5">
                    <a
                      href="https://www.facebook.com/profile.php?id=61591064963268"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                      title="Facebook OfficeCare"
                    >
                      <FacebookIcon className="size-5 shadow-2xs rounded-[5px]" />
                    </a>
                    <a
                      href="https://zalo.me/0398655332"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                      title="Zalo Chat 0398655332"
                    >
                      <ZaloIcon className="size-5 shadow-2xs rounded-[5px]" />
                    </a>
                  </div>
                </div>
                <p className="flex items-center gap-2.5 text-slate-500">
                  <Clock size={16} className="shrink-0 text-[#0D9488]" />
                  <span>08:00 – 20:00 (Tất cả các ngày trong tuần)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#C8E3DE] pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-slate-500 font-semibold pr-0 md:pr-24">
            <p>© 2026 OfficeCare Clinic. Tất cả các quyền được bảo lưu. Đạt chuẩn Y Tế cao cấp.</p>
            <div className="flex items-center gap-4 text-slate-500">
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="hover:text-[#0D9488] transition-colors cursor-pointer font-semibold"
              >
                Điều khoản dịch vụ
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="hover:text-[#0D9488] transition-colors cursor-pointer font-semibold"
              >
                Bảo mật thông tin
              </button>
              <span>•</span>
              <span className="text-[#0D9488] font-bold">officecareclinic.com</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Authentication Interceptor Modal & Terms Popup Modal */}
      <GlobalAuthModal isOpen={showGlobalAuthModal} onClose={() => setShowGlobalAuthModal(false)} />
      <TermsOfServiceModal open={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <AIChatBubble />
    </div>
  );
}
