import { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../../../api/axios';

// Removed unused chartData mock

const COLORS = ['#2EC4B6', '#FF9F1C', '#FF3366', '#4D5BF9'];

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

interface DashboardData {
  stats: {
    total_customers: string | number;
    pending_appointments: string | number;
    total_revenue: string | number;
    active_staff: string | number;
  } | null;
  recentAppointments: any[];
  revenueData: { month: string; revenue: number }[];
  performanceData: { name: string; sessions: number }[];
  isLoaded: boolean;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    recentAppointments: [],
    revenueData: [],
    performanceData: [],
    isLoaded: false
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, appointmentsRes, revenueRes, performanceRes] = await Promise.all([
        api.get('/admin/analytics/summary'),
        api.get('/admin/appointments'),
        api.get('/admin/analytics/revenue'),
        api.get('/admin/analytics/performance')
      ]);

      setData({
        stats: statsRes.data || null,
        recentAppointments: Array.isArray(appointmentsRes.data) ? appointmentsRes.data.slice(0, 5) : [],
        revenueData: Array.isArray(revenueRes.data) ? revenueRes.data : [],
        performanceData: Array.isArray(performanceRes.data) ? performanceRes.data : [],
        isLoaded: true
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const { stats, recentAppointments, revenueData, performanceData, isLoaded } = data;

  if (!isLoaded) return <div className="p-8 text-zinc-500">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-secondary tracking-tight">Hệ thống Quản trị</h1>
          <p className="text-zinc-500 mt-1">Chào mừng quay trở lại. Đây là tổng quan hoạt động của phòng khám hôm nay.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white text-secondary border border-zinc-200 px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-50 transition-all shadow-sm">
            Xuất báo cáo
          </button>
          <button className="bg-primary text-white px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus size={18} /> Thêm nhân sự mới
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng khách hàng"
          value={stats?.total_customers || 0}
          change="+12%"
          icon={<Users className="text-primary" />}
          color="bg-primary/10"
        />
        <StatCard
          title="Đang chờ xác nhận"
          value={stats?.pending_appointments || 0}
          change="+5"
          icon={<Calendar className="text-accent" />}
          color="bg-accent/10"
        />
        <StatCard
          title="Doanh thu tổng"
          value={isClient ? currencyFormatter.format(Number(stats?.total_revenue || 0)) : '0'}
          change="+18.4%"
          icon={<DollarSign className="text-emerald-500" />}
          color="bg-emerald-50"
        />
        <StatCard
          title="KTV Hoạt động"
          value={stats?.active_staff || 0}
          change="+2"
          icon={<TrendingUp className="text-indigo-500" />}
          color="bg-indigo-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-secondary">Doanh thu 6 tháng qua</h3>
            <select className="bg-zinc-50 border-none rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 outline-none">
              <option>6 tháng gần đây</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            {isClient && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData.length > 0 ? revenueData : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => currencyFormatter.format(Number(val))}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                    {revenueData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-secondary">Lịch hẹn gần đây</h3>
            <button className="text-primary text-sm font-semibold hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[350px] scrollbar-hide">
            {recentAppointments.length === 0 ? (
              <p className="text-zinc-400 text-sm italic text-center py-8">Không có lịch hẹn gần đây.</p>
            ) : (
              recentAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-zinc-100 flex items-center justify-center text-secondary font-bold text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                      {appt.ten_khach_hang?.charAt(0) || 'K'}
                    </div>
                    <div className="max-w-[120px]">
                      <p className="text-sm font-bold text-secondary truncate">{appt.ten_khach_hang}</p>
                      <p className="text-xs text-zinc-500 truncate">{appt.ten_dich_vu}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-secondary">{appt.ngay_gio_bat_dau ? new Date(appt.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${appt.trang_thai === 'cho_xac_nhan' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                      {appt.trang_thai?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-3 bg-zinc-50 text-zinc-600 rounded-xl font-semibold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2">
            Xem lịch trình <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Staff Performance Section */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
        <h3 className="text-xl font-semibold text-secondary mb-8">Hiệu suất KTV (Tháng này)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {performanceData.map((staff, idx) => (
            <div key={staff.name} className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center text-center group hover:bg-primary/5 transition-all">
              <div className="size-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                {['🥇', '🥈', '🥉', '👤', '👤'][idx] || '👤'}
              </div>
              <p className="font-bold text-secondary text-sm truncate w-full">{staff.name}</p>
              <p className="text-primary font-bold text-lg">{staff.sessions}</p>
              <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Buổi thực hiện</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-2xl ${color} flex items-center justify-center text-2xl shadow-inner`}>
          {icon}
        </div>
        <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
          {change}
        </span>
      </div>
      <p className="text-zinc-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-secondary">{value}</h3>
    </div>
  );
}
