import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../api/axios';
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  Activity
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/client/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/client/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, da_doc: true } : n));
      setIsNotifDropdownOpen(false);
      navigate('/appointments');
    } catch (err) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/client/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, da_doc: true })));
    } catch (err) {
      console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', err);
    }
  };

  const toggleNotifDropdown = () => {
    setIsNotifDropdownOpen(!isNotifDropdownOpen);
    if (!isNotifDropdownOpen) {
      fetchNotifications();
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
  };

  useEffect(() => {
    if (user && Number(user.vai_tro_id) === 1) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.da_doc).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: [1, 2, 3, 4] },
    { name: 'Lịch hẹn', path: '/appointments', icon: <Calendar size={20} />, roles: [1, 2, 4] },
    { name: 'Gói điều trị', path: '/packages', icon: <Package size={20} />, roles: [1, 2, 4] },
    { name: 'Bài tập tại nhà', path: '/exercises', icon: <Activity size={20} />, roles: [1] },
    { name: 'Hồ sơ', path: '/profile', icon: <FileText size={20} />, roles: [1, 2, 3, 4] },
    { name: 'Cài đặt', path: '/settings', icon: <Settings size={20} />, roles: [1, 2, 3, 4] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.map(Number).includes(Number(user.vai_tro_id)));

  return (
    <div className="min-h-screen bg-background flex font-body">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white text-zinc-500 fixed h-full z-20 border-r border-zinc-100 shadow-sm">
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

        {/* Back to Landing Page Button */}
        <div className="px-3 pt-4 pb-1 border-b border-zinc-50">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-[12px] text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all text-[11px] font-bold uppercase tracking-wider group"
          >
            <span className="transition-transform group-hover:-translate-x-1 duration-200">←</span>
            Quay lại Trang chủ
          </NavLink>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-[14px] font-bold text-[11px] tracking-wide uppercase transition-all duration-200 group border-l-4 ${
                  isActive 
                    ? 'bg-primary/5 text-primary border-primary shadow-sm' 
                    : 'border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-secondary'
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
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[14px] bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 border border-zinc-100 hover:border-rose-200 text-xs font-bold transition-all text-zinc-600"
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
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">🏥</span>
                </div>
                <h1 className="text-sm font-extrabold text-secondary tracking-tight">
                  OFFICE CARE
                </h1>
              </div>
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
                    `flex items-center gap-3 px-4 py-2.5 rounded-[14px] font-bold text-[11px] tracking-wide uppercase transition-all border-l-4 ${
                      isActive ? 'bg-primary/5 text-primary border-primary' : 'border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-secondary'
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </nav>
            
            <button 
              onClick={handleLogout} 
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[14px] bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 border border-zinc-100 hover:border-rose-200 text-xs font-bold transition-all text-zinc-600 mt-auto"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-secondary p-2 rounded-md hover:bg-zinc-100"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center bg-zinc-50 rounded-full px-4 py-2 border border-zinc-200 w-64 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Search size={18} className="text-zinc-400 mr-2" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="bg-transparent border-none outline-none text-sm w-full text-secondary placeholder-zinc-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Notification Bell Dropdown */}
            {Number(user?.vai_tro_id) === 1 ? (
              <div className="relative">
                <button 
                  onClick={toggleNotifDropdown}
                  className="relative text-zinc-500 hover:text-primary transition-colors p-1"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs select-none">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifDropdownOpen && (
                  <>
                    {/* Transparent Click-Outside Overlay */}
                    <div className="fixed inset-0 z-20" onClick={() => setIsNotifDropdownOpen(false)} />
                    
                    {/* Dropdown Container */}
                    <div className="absolute right-0 mt-3.5 w-80 bg-white/95 backdrop-blur-md border border-zinc-150 rounded-[24px] shadow-lg py-4 z-30 animate-in fade-in slide-in-from-top-3 duration-200">
                      {/* Header */}
                      <div className="px-4.5 pb-3 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-secondary uppercase tracking-wider">Thông báo ({unreadCount})</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] text-primary hover:underline font-bold"
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-zinc-400 text-xs font-semibold">
                            Không có thông báo nào
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <button 
                              key={notif.id}
                              onClick={() => handleMarkAsRead(notif.id)}
                              className={`w-full px-4.5 py-3.5 text-left flex gap-3 transition-colors ${notif.da_doc ? 'hover:bg-zinc-50/50' : 'bg-primary/5 hover:bg-primary/10'}`}
                            >
                              <div className="size-2 bg-primary rounded-full mt-1.5 flex-shrink-0" style={{ visibility: notif.da_doc ? 'hidden' : 'visible' }} />
                              <div className="flex-1 space-y-0.5">
                                <p className="text-xs font-black text-secondary leading-tight">{notif.tieu_de}</p>
                                <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">{notif.noi_dung}</p>
                                <p className="text-[9px] text-zinc-400 font-bold mt-1">{formatTime(notif.thoi_gian_tao)}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4.5 pt-3 border-t border-zinc-100 text-center">
                        <button 
                          onClick={() => {
                            setIsNotifDropdownOpen(false);
                            navigate('/appointments');
                          }}
                          className="text-[10px] text-secondary hover:text-primary font-bold uppercase tracking-wider block w-full"
                        >
                          Xem tất cả lịch hẹn
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button className="relative text-zinc-500 hover:text-primary transition-colors">
                <Bell size={22} />
              </button>
            )}
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-secondary group-hover:text-primary transition-colors">{user?.ho_ten || 'Người dùng'}</p>
                <p className="text-xs text-zinc-500 font-medium">
                  {Number(user?.vai_tro_id) === 1 ? 'Khách hàng' : 
                   Number(user?.vai_tro_id) === 2 ? 'Lễ tân' : 
                   Number(user?.vai_tro_id) === 3 ? 'Kỹ thuật viên' : 
                   Number(user?.vai_tro_id) === 4 ? 'Bác sĩ' : 
                   Number(user?.vai_tro_id) === 5 ? 'Quản trị viên' : 'Khách hàng'}
                </p>

              </div>
              <div className="size-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden group-hover:border-primary transition-colors">
                <img 
                  src={user?.avatar_url || "https://i.pravatar.cc/150?img=11"} 
                  alt="Avatar" 
                  className="size-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
