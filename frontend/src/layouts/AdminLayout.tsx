import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Zap, 
  Clock, 
  User, 
  FileText, 
  Users, 
  Briefcase, 
  Package, 
  Key, 
  DollarSign, 
  Megaphone, 
  Star, 
  ClipboardList,
  LogOut,
  Search,
  Bell,
  HelpCircle
} from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');

  // Synchronize searchValue when URL query changes
  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    if (val.trim()) {
      setSearchParams({ q: val });
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tổng quan', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Lịch hẹn khám', path: '/admin/appointments', icon: <Calendar size={18} />, searchPlaceholder: 'Tìm kiếm lịch hẹn khám...' },
    { name: 'Lịch điều trị', path: '/admin/treatments', icon: <Zap size={18} />, searchPlaceholder: 'Tìm kiếm lịch điều trị...' },
    { name: 'Ca làm việc', path: '/admin/schedules', icon: <Clock size={18} /> },
    { name: 'Khách hàng', path: '/admin/customers', icon: <User size={18} />, searchPlaceholder: 'Tìm kiếm khách hàng...' },
    { name: 'Hồ sơ điều trị', path: '/admin/medical-records', icon: <FileText size={18} />, searchPlaceholder: 'Tìm kiếm hồ sơ...' },
    { name: 'Nhân sự', path: '/admin/staff', icon: <Users size={18} />, searchPlaceholder: 'Tìm kiếm nhân sự...' },
    { name: 'Dịch vụ & Danh mục', path: '/admin/services', icon: <Briefcase size={18} />, searchPlaceholder: 'Tìm kiếm dịch vụ...' },
    { name: 'Gói', path: '/admin/packages', icon: <Package size={18} />, searchPlaceholder: 'Tìm kiếm gói...' },
    { name: 'Phòng & Thiết bị', path: '/admin/rooms-equipment', icon: <Key size={18} />, searchPlaceholder: 'Tìm kiếm phòng, thiết bị...' },
    { name: 'Tài chính', path: '/admin/finance', icon: <DollarSign size={18} /> },
    { name: 'Marketing', path: '/admin/marketing', icon: <Megaphone size={18} /> },
    { name: 'Đánh giá', path: '/admin/feedback', icon: <Star size={18} /> },
    { name: 'Nhật ký hệ thống', path: '/admin/audit', icon: <ClipboardList size={18} /> },
  ];

  const currentItem = navItems.find(item => item.path === location.pathname);

  return (
    <div className="h-screen overflow-hidden bg-background flex font-body text-secondary">
      {/* Sidebar - Soft UI Light Theme */}
      <aside className="w-64 bg-white text-zinc-500 flex flex-col shrink-0 border-r border-zinc-100 shadow-sm z-30">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-100 bg-white">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">🏥</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-secondary tracking-tight flex items-center gap-1.5">
              OFFICE CARE <span className="text-primary font-bold text-[9px] bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">2026</span>
            </h1>
            <p className="text-[8px] text-zinc-400 font-extrabold tracking-widest uppercase mt-0.5">Phục hồi chức năng</p>
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto pr-1 scrollbar-thin">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-2.5 rounded-[14px] transition-all duration-200 group border-l-4 ${
                      isActive 
                        ? 'bg-primary/5 text-primary font-bold border-primary shadow-sm' 
                        : 'border-transparent hover:bg-zinc-50 hover:text-secondary'
                    }`}
                  >
                    <span className={`mr-3 transition-transform group-hover:scale-110 duration-200 ${isActive ? 'text-primary' : 'text-zinc-400 group-hover:text-secondary'}`}>
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-bold tracking-wide uppercase">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-zinc-100 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-secondary truncate">{user?.email || 'admin@officecare.com'}</p>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Quản trị viên</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-[14px] bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 border border-zinc-100 hover:border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-2 text-zinc-600"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header - Premium Design with Search and Actions */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-8 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-secondary tracking-tight shrink-0">
              {currentItem?.name || 'Tổng quan'}
            </h2>
            
            {/* Dynamic Search Bar */}
            {currentItem?.searchPlaceholder && (
              <div className="relative max-w-md w-full hidden md:block group animate-fade-in">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={currentItem.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-semibold text-secondary placeholder-zinc-400"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <span className="text-xs text-zinc-400 font-semibold hidden lg:inline-flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-100">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Môi trường: <span className="font-bold text-primary">Production</span>
            </span>

            {/* Actions: Notification & Help */}
            <div className="flex items-center gap-3 border-l border-zinc-100 pl-6">
              <button className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-50 text-zinc-500 transition-colors">
                <Bell size={18} />
                <span className="absolute top-1 right-1 size-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-50 text-zinc-500 transition-colors">
                <HelpCircle size={18} />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-secondary">Admin Physio</p>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Quản trị viên</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=120&h=120"
                alt="Admin Avatar"
                className="w-9 h-9 rounded-full object-cover border border-primary/20 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
