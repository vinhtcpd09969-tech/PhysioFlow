import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../api/axios';
import {
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Receipt,
  ShieldAlert,
  ArrowLeft,
  User
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';
import { OfficeCareLogo } from '../components/OfficeCareLogo';

// Default Silhouette Avatar (Chuẩn Facebook SVG Avatar)
function DefaultAvatar() {
  return (
    <div className="size-full bg-slate-100 flex items-center justify-center rounded-full text-slate-400">
      <User className="size-3/4 text-slate-400" />
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync profile on mount
  useEffect(() => {
    if (user?.id) {
      api.get('/auth/me')
        .then(res => {
          if (res.data) updateUser(res.data);
        })
        .catch(() => { });
    }
  }, [user?.id, updateUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Lịch hẹn', path: '/appointments', icon: <Calendar size={20} />, roles: [1, 2, 4] },
    { name: 'Hồ sơ điều trị', path: '/medical-record', icon: <FileText size={20} />, roles: [1] },
    { name: 'Hóa đơn', path: '/invoices', icon: <Receipt size={20} />, roles: [1] },
    { name: 'Cài đặt', path: '/settings', icon: <Settings size={20} />, roles: [1, 2, 3, 4] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.map(Number).includes(Number(user.vai_tro_id)));

  const avatarSrc = (user?.anh_dai_dien || user?.avatar_url) ? resolveImageUrl(user.anh_dai_dien || user.avatar_url!) : null;

  return (
    <div className="min-h-screen bg-background flex font-body">

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white text-zinc-500 fixed h-full z-20 border-r border-zinc-100 shadow-xs">
        <div className="h-16 flex items-center px-3.5 border-b border-zinc-100 bg-white">
          <OfficeCareLogo size={32} badgeText="2026" subText="PHỤC HỒI CHỨC NĂNG" />
        </div>

        {/* Back to Landing Page Button - Redesigned Pro Max */}
        <div className="p-3 border-b border-slate-100">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-teal-50/80 text-slate-600 hover:text-[#0D9488] border border-slate-200/60 hover:border-teal-200/80 transition-all text-xs font-black uppercase tracking-wider group shadow-2xs"
          >
            <span className="p-1 rounded-xl bg-white group-hover:bg-[#0D9488]/10 text-slate-500 group-hover:text-[#0D9488] transition-colors border border-slate-200/60 group-hover:border-teal-200/60">
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            </span>
            <span className="truncate">Quay lại Trang chủ</span>
          </NavLink>
        </div>

        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wide transition-all duration-200 group ${isActive
                  ? 'bg-[#0D9488]/15 text-[#0D9488] shadow-2xs font-black'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold'
                }`
              }
            >
              <span className="transition-transform group-hover:scale-110 duration-200">
                {item.icon}
              </span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[14px] bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 border border-zinc-100 hover:border-rose-200 text-xs font-bold transition-all text-zinc-600 cursor-pointer"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsMobileMenuOpen(false); }}
          role="button"
          tabIndex={0}
          aria-label="Close mobile menu"
        >
          <aside
            className="w-64 bg-white h-full p-4 flex flex-col border-r border-zinc-100 shadow-lg"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            role="none"
          >
            <div className="flex justify-between items-center mb-6 px-2">
              <OfficeCareLogo size={32} badgeText="" subText="" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-secondary">
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-[14px] font-bold text-[11px] tracking-wide uppercase transition-all border-l-4 ${isActive ? 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]' : 'border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-secondary'
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <NavLink
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[14px] bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-[#0D9488] border border-slate-200 text-xs font-bold transition-all mb-2"
            >
              <ArrowLeft size={15} /> Quay lại Trang chủ
            </NavLink>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[14px] bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 border border-zinc-100 hover:border-rose-200 text-xs font-bold transition-all text-zinc-600"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-secondary p-2 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>

            {/* Context Badge replacing useless search bar */}
            <div className="hidden sm:flex items-center gap-2 text-slate-500 text-xs font-bold">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cổng Thông Tin Y Khoa Cá Nhân</span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 group-hover:text-[#0D9488] transition-colors">{user?.ho_ten || 'Người dùng'}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  {Number(user?.vai_tro_id) === 1 ? 'Khách hàng' :
                    Number(user?.vai_tro_id) === 2 ? 'Lễ tân' :
                      Number(user?.vai_tro_id) === 3 ? 'Kỹ thuật viên' :
                        Number(user?.vai_tro_id) === 4 ? 'Chuyên viên' :
                          Number(user?.vai_tro_id) === 5 ? 'Quản trị viên' :
                            Number(user?.vai_tro_id) === 6 ? 'Quản lý' : 'Khách hàng'}
                </p>
              </div>

              {/* User Avatar: Clean SVG Silhouette Default instead of random Pravatar photo */}
              <div className="size-10 rounded-full border-2 border-[#0D9488]/20 p-0.5 overflow-hidden group-hover:border-[#0D9488] transition-colors shadow-2xs">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user?.ho_ten || 'Avatar'}
                    className="size-full object-cover rounded-full"
                    onError={(e) => {
                      // Fallback if avatar URL fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <DefaultAvatar />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 w-full max-w-7xl mx-auto space-y-6">
          {user?.isDefaultPassword && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4.5 rounded-[20px] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                  <ShieldAlert size={20} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-350 uppercase tracking-wide">Cảnh báo bảo mật tài khoản</h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400/90 font-semibold leading-relaxed mt-0.5">
                    Tài khoản của bạn đang sử dụng mật khẩu mặc định (<strong>123456</strong>) do nhân sự OfficeCare cấp. Vui lòng cập nhật mật khẩu mới ngay lập tức để bảo vệ hồ sơ bệnh án cá nhân của mình!
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-600/15 cursor-pointer whitespace-nowrap"
              >
                Đổi mật khẩu ngay
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>


    </div>
  );
}
