import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Sun, Moon } from 'lucide-react';
import api from '../api/axios';
import { MascotWidget } from '../components/MascotWidget';

export default function ReceptionistLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [pendingContactCount, setPendingContactCount] = useState<number>(0);
  const [earliestPendingId, setEarliestPendingId] = useState<string | null>(null);
  const [earliestPendingDate, setEarliestPendingDate] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get('/admin/appointments');
        const appointments = res.data || [];
        const graceTimeMs = 10 * 60 * 1000;
        const pendingApts = appointments.filter((apt: any) => {
          const createdAt = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
          const isGracePassed = createdAt > 0 && (createdAt + graceTimeMs <= Date.now());
          return apt.trang_thai === 'chua_xac_nhan' && isGracePassed;
        });
        setPendingContactCount(pendingApts.length);
        if (pendingApts.length > 0) {
          pendingApts.sort((a: any, b: any) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());
          setEarliestPendingId(pendingApts[0].id);
          const targetDate = pendingApts[0].ngay_gio_bat_dau ? pendingApts[0].ngay_gio_bat_dau.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '' : '';
          setEarliestPendingDate(targetDate);
        } else {
          setEarliestPendingId(null);
          setEarliestPendingDate(null);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách ca cần liên hệ:', err);
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard (Lịch hôm nay)', path: '/receptionist', icon: '📊' },
    { name: 'Lập hóa đơn & Gói', path: '/receptionist/billing', icon: '💵' },
    { name: 'Lịch hẹn', path: '/receptionist/appointments', icon: '📅' },
    { name: 'Đăng ký Khách vãng lai', path: '/receptionist/walk-in', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 text-secondary dark:text-zinc-100 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-zinc-400 flex flex-col shrink-0 border-r border-zinc-800">
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
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    {item.path === '/receptionist/appointments' && pendingContactCount > 0 && (
                      <span className="animate-bounce inline-flex items-center justify-center w-5 h-5 text-[9px] font-black text-white bg-rose-500 rounded-full border border-rose-455">
                        {pendingContactCount}
                      </span>
                    )}
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
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-background dark:bg-zinc-950 transition-colors duration-300">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-secondary dark:text-zinc-100">
            {navItems.find(item => item.path === location.pathname)?.name || 'Receptionist Portal'}
          </h2>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(nextTheme);
                localStorage.setItem('theme', nextTheme);
                window.dispatchEvent(new Event('theme-change'));
              }}
              title={theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {isClient ? new Date().toLocaleDateString('vi-VN') : ''}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 bg-background dark:bg-zinc-950 transition-colors duration-300">
          <Outlet />
        </div>
      </main>

      {/* Floating Mascot Widget for Receptionist - Alerting of unconfirmed bookings needing contact */}
      <MascotWidget
        count={pendingContactCount}
        onClick={() => {
          if (earliestPendingId && earliestPendingDate) {
            navigate(`/receptionist/appointments?date=${earliestPendingDate}&range=today&view=timeline&appointmentId=${earliestPendingId}&triggerFocus=true`);
          } else {
            navigate('/receptionist/appointments?triggerFocus=true');
          }
        }}
        tooltipText={`Có ${pendingContactCount} ca khám chưa xác nhận quá 10 phút cần liên hệ!`}
        badgeColor="rose"
      />
    </div>
  );
}
