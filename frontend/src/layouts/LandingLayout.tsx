import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, LayoutDashboard, ChevronDown, Menu, X, Calendar, Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import GlobalAuthModal from '../components/GlobalAuthModal';

export default function LandingLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGlobalAuthModal, setShowGlobalAuthModal] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => {
      setShowGlobalAuthModal(true);
    };
    window.addEventListener('trigger-global-auth-modal', handleOpenModal);
    return () => {
      window.removeEventListener('trigger-global-auth-modal', handleOpenModal);
    };
  }, []);

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      setShowGlobalAuthModal(true);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen font-body flex flex-col bg-background">
      {/* Floating Glassmorphic Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 sm:px-6 lg:px-8 ${isScrolled ? 'py-3' : 'py-5'}`}>
        <header className={`max-w-7xl mx-auto w-full px-6 h-16 sm:h-20 transition-all duration-500 rounded-full flex items-center justify-between ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-md border border-slate-100 shadow-lg' 
            : 'bg-white/40 backdrop-blur-sm border border-transparent shadow-none'
        }`}>
          
          {/* Logo */}
          <div className="flex items-center gap-3.5">
            <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-jakarta font-black text-xl shadow-inner">
                O
              </div>
              <div className="flex flex-col">
                <span className="font-jakarta font-black text-base text-secondary tracking-tight leading-none uppercase">
                  Office Care
                </span>
                <span className="text-[9px] text-primary font-jakarta font-extrabold uppercase tracking-widest leading-none mt-1">
                  Premium Rehab
                </span>
              </div>
            </Link>

            {/* Status indicator in Navbar */}
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-3.5 py-1 text-[10px] font-bold text-emerald-600 tracking-wide uppercase font-jakarta">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
              </span>
              <span>Mở cửa (7:30 - 20:30)</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Trang chủ</Link>
            <Link to="/services" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Dịch vụ</Link>
            <Link to="/specialists" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Chuyên gia</Link>
          </nav>

          {/* Auth Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/booking" 
              onClick={handleBookingClick} 
              className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-xs font-jakarta font-extrabold px-5 py-3 rounded-full shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar size={14} />
              Đặt lịch
            </Link>

            {isAuthenticated() && user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-3 hover:bg-white/80 py-1.5 px-2.5 rounded-full border border-transparent hover:border-slate-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full border border-primary/20 p-0.5 overflow-hidden">
                    <img 
                      src={user.avatar_url || "https://i.pravatar.cc/150?img=11"} 
                      alt="Avatar" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-jakarta font-bold text-secondary leading-tight">{user.ho_ten}</p>
                    <p className="text-[10px] text-gray-400 font-jakarta font-bold">Cá nhân</p>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-[24px] shadow-soft-ui border border-slate-100 py-2 animate-slide-up">
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-jakarta font-bold text-secondary hover:bg-slate-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className="text-primary" />
                      Quản lý tài khoản
                    </Link>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-jakarta font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors px-4 py-2">
                Đăng nhập
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-secondary p-2 hover:bg-slate-100 rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden w-full mt-2 bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-100 shadow-lg px-6 py-6 flex flex-col gap-3 animate-slide-up">
            <Link to="/" className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
            <Link to="/services" className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Dịch vụ</Link>
            <Link to="/specialists" className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Chuyên gia</Link>
            
            <div className="mt-4 flex flex-col gap-2.5">
              <Link 
                to="/booking" 
                onClick={(e) => { setIsMobileMenuOpen(false); handleBookingClick(e); }} 
                className="flex items-center justify-center bg-primary hover:bg-[#25A89C] text-white text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] shadow-soft-button transition-all cursor-pointer"
              >
                Đặt lịch
              </Link>
              {isAuthenticated() && user ? (
                <>
                  <Link to="/dashboard" className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-secondary text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    <LayoutDashboard size={18} /> Quản lý tài khoản
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all">
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link to="/login" className="flex items-center justify-center text-secondary bg-slate-50 hover:bg-slate-100 text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Sleek Premium Compact Footer (Light Theme) */}
      <footer className="bg-slate-50 text-slate-600 border-t border-slate-200/60 pt-12 pb-6 mt-auto text-xs font-jakarta">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-white font-jakarta font-black text-base shadow-sm">
                  O
                </div>
                <div className="flex flex-col">
                  <span className="font-jakarta font-black text-sm text-slate-800 tracking-tight leading-none uppercase">
                    Office Care
                  </span>
                  <span className="text-[8px] text-primary font-jakarta font-black uppercase tracking-widest leading-none mt-1">
                    Premium Rehab
                  </span>
                </div>
              </Link>
              <p className="text-slate-500 text-xs leading-relaxed">
                Giải pháp phục hồi chức năng cột sống và cơ xương khớp chuyên sâu, xóa tan những cơn đau thắt cơ của giới văn phòng.
              </p>
              <div className="flex gap-2">
                <a href="#" className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 hover:text-primary">
                  <Facebook size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 hover:text-primary">
                  <Instagram size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 hover:text-primary">
                  <Youtube size={14} />
                </a>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-jakarta font-bold text-xs tracking-wider text-slate-800 uppercase">Dịch Vụ</h4>
              <ul className="space-y-2 text-slate-500">
                <li><Link to="/services" className="hover:text-primary transition-colors">Khám Lâm Sàng</Link></li>
                <li><Link to="/services" className="hover:text-primary transition-colors">Điều Trị Lẻ</Link></li>
                <li><Link to="/services" className="hover:text-primary transition-colors">Liệu Trình Chuyên Sâu</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-jakarta font-bold text-xs tracking-wider text-slate-800 uppercase">Hỗ Trợ</h4>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Liên hệ hỗ trợ</a></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-jakarta font-bold text-xs tracking-wider text-slate-800 uppercase">Vị Trí & Liên Hệ</h4>
              <div className="space-y-2 text-slate-500">
                <p className="flex items-start gap-2 leading-relaxed">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-primary" />
                  <span>Khu đô thị Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0 text-primary" />
                  <span>1900 1234</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="shrink-0 text-primary" />
                  <span>hello@officecare.com</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-slate-400">
            <p>© 2026 Office Care. Đã đăng ký bản quyền. Chuẩn y tế 5 sao.</p>
            <p>Therapeutic Precision for the Modern Professional.</p>
          </div>
        </div>
      </footer>

      {/* Global Authentication Interceptor Modal */}
      <GlobalAuthModal isOpen={showGlobalAuthModal} onClose={() => setShowGlobalAuthModal(false)} />
    </div>
  );
}
