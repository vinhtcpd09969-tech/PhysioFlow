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

const COLORS = ['#2EC4B6', '#FF9F1C', '#10B981', '#3B82F6'];

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
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

  if (!isLoaded) return <div className="p-8 text-zinc-500 font-semibold animate-pulse">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="space-y-8">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary tracking-tight">Hệ thống Quản trị</h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mt-1">Chào mừng quay trở lại. Tổng quan hoạt động của phòng khám hôm nay.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white text-secondary border border-zinc-200 px-4 py-2.5 rounded-[14px] font-bold text-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-md">
            Xuất báo cáo
          </button>
          <button className="bg-primary hover:bg-[#25A89C] text-white px-4 py-2.5 rounded-[14px] font-bold text-xs transition-all shadow-soft-button flex items-center gap-2">
            <Plus size={16} /> Thêm nhân sự mới
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng khách hàng"
          value={stats?.total_customers || 0}
          change="+12% tháng này"
          icon={<Users className="text-primary" size={20} />}
          color="bg-primary/10"
          delay="100ms"
        />
        <StatCard
          title="Đang chờ xác nhận"
          value={stats?.pending_appointments || 0}
          change="Cần xác nhận"
          icon={<Calendar className="text-accent" size={20} />}
          color="bg-accent/10"
          delay="150ms"
        />
        <StatCard
          title="Doanh thu tổng"
          value={isClient ? currencyFormatter.format(Number(stats?.total_revenue || 0)) : '0 đ'}
          change="+18.4% tuần này"
          icon={<DollarSign className="text-emerald-500" size={20} />}
          color="bg-emerald-50"
          delay="200ms"
        />
        <StatCard
          title="KTV Hoạt động"
          value={stats?.active_staff || 0}
          change="+2 nhân viên"
          icon={<TrendingUp className="text-cyan-500" size={20} />}
          color="bg-cyan-50"
          delay="250ms"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Revenue Bar Chart */}
        <div 
          className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui opacity-0 animate-slide-up"
          style={{ animationDelay: '300ms' }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-extrabold text-secondary">Doanh thu 6 tháng qua</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Biểu đồ doanh số theo từng tháng</p>
            </div>
            <select className="bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2 text-xs font-bold text-zinc-500 outline-none hover:bg-zinc-100 transition-colors">
              <option>6 tháng gần đây</option>
            </select>
          </div>
          <div className="h-[320px] w-full">
            {isClient && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData.length > 0 ? revenueData : []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', 
                      padding: '12px 16px', 
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    formatter={(val) => [currencyFormatter.format(Number(val)), 'Doanh thu']}
                  />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={32}>
                    {revenueData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Recent Appointments List */}
        <div 
          className="bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui flex flex-col opacity-0 animate-slide-up"
          style={{ animationDelay: '350ms' }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-extrabold text-secondary">Lịch hẹn gần đây</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Các lịch hẹn mới nhất hôm nay</p>
            </div>
            <button className="text-primary text-xs font-bold hover:underline">Xem tất cả</button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-1 scrollbar-thin">
            {recentAppointments.length === 0 ? (
              <p className="text-zinc-400 text-xs italic text-center py-12 font-bold">Không có lịch hẹn gần đây.</p>
            ) : (
              recentAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100/50 hover:border-zinc-200/80 transition-all duration-200 group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                      {appt.ten_khach_hang?.charAt(0) || 'K'}
                    </div>
                    <div className="max-w-[120px] sm:max-w-none">
                      <p className="text-xs font-bold text-secondary truncate">{appt.ten_khach_hang}</p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-0.5 truncate">{appt.ten_dich_vu}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-secondary">{appt.ngay_gio_bat_dau ? new Date(appt.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1 inline-block ${
                      appt.trang_thai === 'cho_xac_nhan' 
                        ? 'bg-amber-50 text-accent' 
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {appt.trang_thai === 'cho_xac_nhan' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button className="w-full mt-6 py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-zinc-100">
            Xem lịch trình <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Staff Performance Section */}
      <div 
        className="bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui opacity-0 animate-slide-up"
        style={{ animationDelay: '400ms' }}
      >
        <div className="mb-8">
          <h3 className="text-lg font-extrabold text-secondary">Hiệu suất KTV (Tháng này)</h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Xếp hạng kỹ thuật viên xuất sắc dựa trên số ca phục hồi thành công</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {performanceData.map((staff, idx) => (
            <div 
              key={staff.name} 
              className="p-6 rounded-2xl bg-zinc-50/50 hover:bg-white border border-zinc-100/50 hover:border-zinc-200/80 hover:shadow-soft-ui hover:-translate-y-1 flex flex-col items-center text-center group transition-all duration-300"
            >
              <div className="size-12 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center text-lg mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                {['🥇', '🥈', '🥉', '👤', '👤'][idx] || '👤'}
              </div>
              <p className="font-bold text-secondary text-xs truncate w-full">{staff.name}</p>
              <p className="text-primary font-extrabold text-xl mt-1">{staff.sessions}</p>
              <p className="text-zinc-400 text-[8px] uppercase font-extrabold tracking-widest">Buổi thực hiện</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon, color, delay }: any) {
  return (
    <div 
      className="bg-white p-6 rounded-3xl border border-zinc-100/80 shadow-soft-ui hover:shadow-soft-ui-hover hover:-translate-y-1 transition-all duration-300 opacity-0 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-2xl ${color} flex items-center justify-center text-xl shadow-inner`}>
          {icon}
        </div>
        <span className="text-emerald-500 text-[10px] font-bold bg-emerald-50/80 px-2.5 py-1 rounded-lg">
          {change}
        </span>
      </div>
      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-extrabold text-secondary tracking-tight">{value}</h3>
    </div>
  );
}
