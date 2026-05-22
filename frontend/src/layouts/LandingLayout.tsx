import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, LayoutDashboard, ChevronDown, Menu, X, Calendar } from 'lucide-react';

export default function LandingLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
          
          {/* Logo - Elegant Placeholder */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-xl shadow-inner">
              O
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-base text-secondary tracking-tight leading-none uppercase">
                Office Care
              </span>
              <span className="text-[9px] text-primary font-extrabold uppercase tracking-widest leading-none mt-1">
                Premium Rehab
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Trang chủ</Link>
            <a href="/#services" className="text-sm font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Dịch vụ</a>
            <a href="/#pricing" className="text-sm font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Bảng giá</a>
          </nav>

          {/* Auth Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
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
                    <p className="text-xs font-bold text-secondary leading-tight">{user.ho_ten}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Cá nhân</p>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-[24px] shadow-soft-ui border border-slate-100 py-2 animate-slide-up">
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-secondary hover:bg-slate-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className="text-primary" />
                      Quản lý tài khoản
                    </Link>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-bold text-secondary hover:text-primary transition-colors px-4 py-2">
                  Đăng nhập
                </Link>
                <Link to="/booking" className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-xs font-extrabold px-5 py-3 rounded-full shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5">
                  <Calendar size={14} />
                  Đặt lịch tư vấn chuyên sâu
                </Link>
              </div>
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
            <Link to="/" className="text-sm font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
            <a href="/#services" className="text-sm font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Dịch vụ</a>
            <a href="/#pricing" className="text-sm font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Bảng giá</a>
            
            <div className="mt-4 flex flex-col gap-2.5">
              {isAuthenticated() && user ? (
                <>
                  <Link to="/dashboard" className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-secondary text-sm font-bold px-6 py-3 rounded-[16px] transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    <LayoutDashboard size={18} /> Quản lý tài khoản
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold px-6 py-3 rounded-[16px] transition-all">
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center justify-center text-secondary bg-slate-50 hover:bg-slate-100 text-sm font-bold px-6 py-3 rounded-[16px] transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link to="/booking" className="flex items-center justify-center bg-primary hover:bg-[#25A89C] text-white text-sm font-bold px-6 py-3 rounded-[16px] shadow-soft-button transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    Đặt lịch tư vấn chuyên sâu
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-6 hover:opacity-95 transition-opacity">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-xl shadow-inner">
                  O
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-black text-lg text-white tracking-tight leading-none uppercase">
                    Office Care
                  </span>
                  <span className="text-[9px] text-primary font-extrabold uppercase tracking-widest leading-none mt-1">
                    Premium Rehab
                  </span>
                </div>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Giải pháp phục hồi chức năng chuyên sâu dành cho dân văn phòng. Lấy lại sự cân bằng, xua tan cơn đau cổ vai gáy.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-200 mb-6">Dịch Vụ</h4>
              <ul className="space-y-4">
                <li><a href="/#services" className="text-slate-400 hover:text-primary transition-colors text-sm">Khám lượng giá ban đầu</a></li>
                <li><a href="/#services" className="text-slate-400 hover:text-primary transition-colors text-sm">Siêu âm trị liệu</a></li>
                <li><a href="/#services" className="text-slate-400 hover:text-primary transition-colors text-sm">Điện xung trị liệu</a></li>
                <li><a href="/#services" className="text-slate-400 hover:text-primary transition-colors text-sm">Tập vận động thụ động</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-200 mb-6">Hỗ Trợ</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Chính sách bảo mật</a></li>
                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Điều khoản sử dụng</a></li>
                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Liên hệ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-200 mb-6">Liên Hệ</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-primary">📍</span> Khu đô thị Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">📞</span> 1900 1234
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">✉️</span> hello@officecare.com
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">© 2026 Office Care. Đã đăng ký bản quyền.</p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">FB</a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">IG</a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">YT</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
