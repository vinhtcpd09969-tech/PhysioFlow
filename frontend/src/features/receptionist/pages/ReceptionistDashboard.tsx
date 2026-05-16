import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Search,
  Filter,
  Plus
} from 'lucide-react';
import api from '../../../api/axios';

// Moved KanbanColumn out of the main component to prevent re-renders
const KanbanColumn = ({ title, count, color, children }: any) => (
  <div className="flex-1 min-w-[300px] bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100">
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-2">
        <div className={`size-2 rounded-full ${color}`}></div>
        <h3 className="font-semibold text-secondary">{title}</h3>
      </div>
      <span className="text-xs font-bold text-zinc-400 bg-white px-2 py-0.5 rounded-full border border-zinc-100">
        {count}
      </span>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

export default function ReceptionistDashboard() {
  const [dashboardData, setDashboardData] = useState({
    appointments: [],
    stats: {
      pending: 0,
      active: 0,
      completed: 0
    },
    isLoaded: false
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/receptionist/dashboard');
      setDashboardData({
        appointments: Array.isArray(res.data.appointments) ? res.data.appointments : [],
        stats: res.data.stats || { pending: 0, active: 0, completed: 0 },
        isLoaded: true
      });
    } catch (error) {
      console.error('Lỗi tải dữ liệu lễ tân:', error);
    }
  };

  const { appointments, stats, isLoaded } = dashboardData;

  if (!isLoaded) return <div className="p-8 text-zinc-500">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-secondary tracking-tight">Điều phối Lễ tân</h1>
          <p className="text-zinc-500 mt-1">Hôm nay có <span className="text-primary font-semibold">{appointments.length}</span> lịch hẹn cần điều phối.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="size-8 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                👤
              </div>
            ))}
            <div className="size-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold">
              +5
            </div>
          </div>
          <button className="bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus size={18} /> Đón khách mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-5">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Users size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Chờ khảo sát</p>
            <h3 className="text-2xl font-bold text-secondary">{stats.pending}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-5">
          <div className="size-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Đang điều trị</p>
            <h3 className="text-2xl font-bold text-secondary">{stats.active}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-5">
          <div className="size-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Hoàn thành</p>
            <h3 className="text-2xl font-bold text-secondary">{stats.completed}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100 focus-within:border-primary/30 transition-colors">
          <Search size={18} className="text-zinc-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm tên khách hàng, số điện thoại..." 
            className="bg-transparent border-none outline-none text-sm w-full text-secondary placeholder-zinc-400"
          />
        </div>
        <button className="p-3 text-zinc-500 hover:bg-zinc-50 rounded-xl transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-6">
        <KanbanColumn title="Chờ khảo sát" count={stats.pending} color="bg-primary">
          {appointments.reduce((acc: any[], appt: any) => {
            if (appt.trang_thai === 'Cho khao sat') {
              acc.push(<AppointmentCard key={appt.id} appt={appt} />);
            }
            return acc;
          }, [])}
        </KanbanColumn>
        
        <KanbanColumn title="Đang điều trị" count={stats.active} color="bg-amber-500">
          {appointments.reduce((acc: any[], appt: any) => {
            if (appt.trang_thai === 'Dang dieu tri') {
              acc.push(<AppointmentCard key={appt.id} appt={appt} />);
            }
            return acc;
          }, [])}
        </KanbanColumn>
        
        <KanbanColumn title="Đã hoàn thành" count={stats.completed} color="bg-emerald-500">
          {appointments.reduce((acc: any[], appt: any) => {
            if (appt.trang_thai === 'Hoan thanh') {
              acc.push(<AppointmentCard key={appt.id} appt={appt} />);
            }
            return acc;
          }, [])}
        </KanbanColumn>
      </div>
    </div>
  );
}

function AppointmentCard({ appt }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-xs group-hover:bg-primary group-hover:text-white transition-colors">
            {appt.ten_khach_hang.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-secondary text-sm">{appt.ten_khach_hang}</h4>
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{appt.gio}</p>
          </div>
        </div>
        <button className="text-zinc-300 hover:text-zinc-600">
          <Calendar size={16} />
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span className="size-1.5 rounded-full bg-zinc-300"></span>
          <span className="font-medium">{appt.ten_dich_vu}</span>
        </div>
        {appt.bac_si && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="size-1.5 rounded-full bg-primary/40"></span>
            <span>BS: {appt.bac_si}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
        <div className="flex -space-x-1.5">
          <div className="size-6 rounded-full border border-white bg-zinc-100"></div>
          <div className="size-6 rounded-full border border-white bg-zinc-200"></div>
        </div>
        <button className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary hover:text-white transition-all uppercase tracking-tight">
          Chi tiết
        </button>
      </div>
    </div>
  );
}
