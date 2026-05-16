import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ReceptionistLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard (Lịch hôm nay)', path: '/receptionist', icon: '📊' },
    { name: 'Đăng ký Khách vãng lai', path: '/receptionist/walk-in', icon: '👤' },
    { name: 'Thanh toán & Hóa đơn', path: '/receptionist/billing', icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-zinc-400 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-zinc-800">
          <h1 className="text-xl font-semibold text-white tracking-tight">Office Care <span className="text-primary">Receptionist</span></h1>
        </div>
        
        <nav className="flex-1 py-4">
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
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="size-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                {user?.ho_ten?.charAt(0) || 'R'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.ho_ten || 'Lễ Tân'}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Receptionist</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-secondary">
            {navItems.find(item => item.path === location.pathname)?.name || 'Receptionist Portal'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              {isClient ? new Date().toLocaleDateString('vi-VN') : ''}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
