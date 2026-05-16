import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tổng quan', path: '/admin', icon: '📊' },
    { name: 'Lịch hẹn', path: '/admin/appointments', icon: '📅' },
    { name: 'Ca làm việc', path: '/admin/schedules', icon: '🕒' },
    { name: 'Khách hàng', path: '/admin/customers', icon: '👤' },
    { name: 'Hồ sơ điều trị', path: '/admin/medical-records', icon: '📋' },
    { name: 'Nhân sự', path: '/admin/staff', icon: '👥' },
    { name: 'Dịch vụ & Phòng', path: '/admin/services', icon: '🏥' },
    { name: 'Thiết bị y tế', path: '/admin/equipment', icon: '💻' },
    { name: 'Gói điều trị', path: '/admin/packages', icon: '📦' },
    { name: 'Tài chính', path: '/admin/finance', icon: '💰' },
    { name: 'Marketing', path: '/admin/marketing', icon: '📢' },
    { name: 'Đánh giá', path: '/admin/feedback', icon: '⭐' },
    { name: 'Nhật ký hệ thống', path: '/admin/audit', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-zinc-400 flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-center border-b border-zinc-800">
          <h1 className="text-xl font-semibold text-white tracking-tight">Office Care <span className="text-primary">Admin</span></h1>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-2.5 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center gap-2"
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-secondary">
            {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">Môi trường: <span className="font-semibold text-primary">Production</span></span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
