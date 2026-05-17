import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useState, useEffect } from 'react';

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
    { name: 'Tổng quan', path: '/admin', icon: '📊' },
    { name: 'Lịch hẹn', path: '/admin/appointments', icon: '📅', searchPlaceholder: 'Tìm kiếm lịch hẹn...' },
    { name: 'Ca làm việc', path: '/admin/schedules', icon: '🕒' },
    { name: 'Khách hàng', path: '/admin/customers', icon: '👤', searchPlaceholder: 'Tìm kiếm khách hàng...' },
    { name: 'Hồ sơ điều trị', path: '/admin/medical-records', icon: '📋', searchPlaceholder: 'Tìm kiếm hồ sơ...' },
    { name: 'Nhân sự', path: '/admin/staff', icon: '👥', searchPlaceholder: 'Tìm kiếm nhân sự...' },
    { name: 'Dịch vụ & Danh mục', path: '/admin/services', icon: '💼', searchPlaceholder: 'Tìm kiếm dịch vụ...' },
    { name: 'Gói điều trị', path: '/admin/packages', icon: '📦', searchPlaceholder: 'Tìm kiếm gói điều trị...' },
    { name: 'Phòng & Thiết bị', path: '/admin/rooms-equipment', icon: '🔑', searchPlaceholder: 'Tìm kiếm phòng, thiết bị...' },
    { name: 'Tài chính', path: '/admin/finance', icon: '💰' },
    { name: 'Marketing', path: '/admin/marketing', icon: '📢' },
    { name: 'Đánh giá', path: '/admin/feedback', icon: '⭐' },
    { name: 'Nhật ký hệ thống', path: '/admin/audit', icon: '📝' },
  ];

  const currentItem = navItems.find(item => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar - Sleek Dark Theme */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 border-r border-slate-800 shadow-xl z-30">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
          <div className="size-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <span className="text-teal-400 font-bold text-lg">🏥</span>
          </div>
          <div>
            <h1 className="text-md font-bold text-white tracking-tight flex items-center gap-1.5">
              PHYSIOFLOW <span className="text-teal-400 font-semibold text-xs bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">2026</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Phục hồi chức năng</p>
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
                    className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-teal-500/10 text-teal-400 font-semibold border-l-4 border-teal-500' 
                        : 'hover:bg-slate-800/60 hover:text-white border-l-4 border-transparent'
                    }`}
                  >
                    <span className={`mr-3 text-base transition-transform group-hover:scale-110 duration-200 ${isActive ? 'grayscale-0' : 'grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100'}`}>{item.icon}</span>
                    <span className="text-xs font-semibold tracking-wide uppercase">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold shadow-inner">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.email || 'admin@physioflow.com'}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Quản trị viên</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header - Premium Design with Search and Actions */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 shrink-0 shadow-sm z-20 sticky top-0">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <h2 className="text-md font-extrabold text-slate-800 tracking-tight shrink-0">
              {currentItem?.name || 'Tổng quan'}
            </h2>
            
            {/* Dynamic Search Bar */}
            {currentItem?.searchPlaceholder && (
              <div className="relative max-w-md w-full hidden md:block group animate-fade-in">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input 
                  type="text" 
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={currentItem.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder-slate-400 shadow-inner"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <span className="text-xs text-slate-400 font-semibold hidden lg:inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Môi trường: <span className="font-bold text-teal-600">Production</span>
            </span>

            {/* Actions: Notification & Help */}
            <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
              <button className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span className="absolute top-1 right-1 size-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800">Admin Physio</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Quản trị viên</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=120&h=120"
                alt="Admin Avatar"
                className="w-9 h-9 rounded-full object-cover border-2 border-teal-500/20 shadow-md"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
