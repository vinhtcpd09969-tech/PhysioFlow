import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, LayoutDashboard, ChevronDown, Menu, X } from 'lucide-react';

export default function LandingLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen font-body flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="font-heading font-bold text-2xl text-secondary flex items-center gap-2">
            <span className="text-primary">P</span> physio<span className="font-light">waves</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">Trang chủ</Link>
            <Link to="#services" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">Dịch vụ</Link>
            <Link to="#experts" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">Chuyên gia</Link>
            <Link to="#pricing" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">Bảng giá</Link>
          </nav>

          {/* Auth Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated() && user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-3 hover:bg-gray-50 py-2 px-3 rounded-[12px] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
                    <img 
                      src={user.avatar_url || "https://i.pravatar.cc/150?img=11"} 
                      alt="Avatar" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-secondary leading-tight">{user.ho_ten}</p>
                    <p className="text-xs text-gray-500 font-medium">Cá nhân</p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-[16px] shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-secondary hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className="text-primary" />
                      Quản lý tài khoản
                    </Link>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-secondary hover:text-primary transition-colors px-4 py-2">
                  Đăng nhập
                </Link>
                <Link to="/register" className="bg-primary hover:bg-[#25A89C] text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg shadow-primary/20 transition-all">
                  Đăng ký ngay
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-secondary p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-lg px-4 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
            <Link to="/" className="text-base font-semibold text-secondary py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
            <Link to="#services" className="text-base font-semibold text-secondary py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Dịch vụ</Link>
            <Link to="#experts" className="text-base font-semibold text-secondary py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Chuyên gia</Link>
            <Link to="#pricing" className="text-base font-semibold text-secondary py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Bảng giá</Link>
            
            <div className="mt-4 flex flex-col gap-3">
              {isAuthenticated() && user ? (
                <>
                  <Link to="/dashboard" className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-secondary text-sm font-bold px-6 py-3 rounded-xl transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    <LayoutDashboard size={18} /> Quản lý tài khoản
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold px-6 py-3 rounded-xl transition-all">
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center justify-center text-secondary bg-gray-100 hover:bg-gray-200 text-sm font-bold px-6 py-3 rounded-xl transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="flex items-center justify-center bg-primary hover:bg-[#25A89C] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    Đăng ký ngay
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white pt-16 pb-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <Link to="/" className="font-heading font-bold text-3xl text-white flex items-center gap-2 mb-6">
                <span className="text-primary">P</span> physio<span className="font-light">waves</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Giải pháp phục hồi chức năng chuyên sâu dành cho dân văn phòng. Lấy lại sự cân bằng, xua tan cơn đau cổ vai gáy.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 tracking-wide">Dịch Vụ</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">Trị liệu mỏi vai gáy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">Phục hồi thoát vị đĩa đệm</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">Chỉnh hình tư thế</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">Kéo giãn cột sống</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 tracking-wide">Hỗ Trợ</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">Chính sách bảo mật</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">Điều khoản sử dụng</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">Liên hệ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 tracking-wide">Liên Hệ</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-primary">📍</span> 123 Nguyễn Văn Linh, Q.7, TP.HCM
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
          
          <div className="border-t border-gray-800 pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© 2026 Office Care. Đã đăng ký bản quyền.</p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">FB</a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">IG</a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">YT</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
