import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Plus
} from 'lucide-react';
import api from '../../../../api/axios';

// Import subcomponents
import { StatCard } from './StatCard';
import { RevenueChart } from './RevenueChart';
import { RecentAppointmentsList } from './RecentAppointmentsList';
import { StaffPerformanceGrid } from './StaffPerformanceGrid';

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
  const navigate = useNavigate();
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
          <button 
            onClick={() => navigate('/admin/staff')} 
            className="bg-primary hover:bg-[#25A89C] text-white px-4 py-2.5 rounded-[14px] font-bold text-xs transition-all shadow-soft-button flex items-center gap-2"
          >
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
        <RevenueChart revenueData={revenueData} isClient={isClient} />
        <RecentAppointmentsList 
          recentAppointments={recentAppointments} 
          onViewSchedule={() => navigate('/admin/appointments')} 
        />
      </div>

      {/* Staff Performance Section */}
      <StaffPerformanceGrid performanceData={performanceData} />
    </div>
  );
}
