import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Play, 
  Search, 
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { getQueue, DoctorQueueItem } from '../../api/doctor.api';

// --- StatCard Component ---
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

const StatCard = ({ title, value, icon, colorClass, bgClass }: StatCardProps) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
    <div className={`size-12 rounded-2xl flex items-center justify-center ${bgClass} ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-zinc-550 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-extrabold text-secondary dark:text-zinc-100 mt-1">{value}</h3>
    </div>
  </div>
);

// --- QueueRow Component (Optimized row for patients queue list) ---
interface QueueRowProps {
  item: DoctorQueueItem;
  onAssess: (appointmentId: string) => void;
}

const QueueRow = ({ item, onAssess }: QueueRowProps) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getGenderText = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'nam': return 'Nam';
      case 'nu':
      case 'nữ': return 'Nữ';
      default: return 'Khác';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'dang_kham') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
          <span className="size-1.5 rounded-full bg-amber-500 animate-ping"></span>
          Đang khám
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/5 dark:bg-primary/10 text-primary border border-primary/20">
        Chờ khám
      </span>
    );
  };

  return (
    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-100 dark:border-zinc-800/50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500">
          {item.ma_lich_dat}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shadow-inner">
            {(item.ten_khach_hang || item.ho_ten_khach || 'K').charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-xs font-bold text-secondary dark:text-zinc-100">
              {item.ten_khach_hang || item.ho_ten_khach}
            </h4>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              {getGenderText(item.gioi_tinh || item.gioi_tinh_khach)} • {item.so_dien_thoai || item.sdt_khach_hang}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs text-secondary dark:text-zinc-300 font-semibold">
          <Clock size={14} className="text-zinc-400" />
          {formatTime(item.ngay_gio_bat_dau)}
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-xs text-zinc-650 dark:text-zinc-350 line-clamp-1 font-medium">
          {item.ly_do_kham || 'Khám tổng quát / Điều trị vật lý trị liệu'}
        </p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(item.trang_thai)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button
          onClick={() => onAssess(item.id)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            item.trang_thai === 'dang_kham'
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
              : 'bg-primary hover:bg-primary/95 text-white shadow-primary/10'
          }`}
        >
          <Play size={12} fill="currentColor" />
          {item.trang_thai === 'dang_kham' ? 'Tiếp tục khám' : 'Vào khám'}
        </button>
      </td>
    </tr>
  );
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<DoctorQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getQueue();
      setQueue(res.data);
    } catch (error) {
      console.error('Lỗi khi lấy hàng đợi khám:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Tự động làm mới mỗi 60 giây để đồng bộ danh sách check-in từ lễ tân
    const timer = setInterval(() => fetchQueue(true), 60000);
    return () => clearInterval(timer);
  }, [fetchQueue]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQueue();
  };

  const handleAssess = (appointmentId: string) => {
    navigate(`/doctor/appointments/${appointmentId}/assess`);
  };

  // Tính toán số liệu thống kê bằng useMemo để tối ưu hiệu năng
  const stats = useMemo(() => {
    const totalToday = queue.length;
    const waiting = queue.filter(item => item.trang_thai === 'cho_kham').length;
    const active = queue.filter(item => item.trang_thai === 'dang_kham').length;
    return { totalToday, waiting, active };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    return queue.filter(item => {
      const name = (item.ten_khach_hang || item.ho_ten_khach || '').toLowerCase();
      const phone = (item.so_dien_thoai || item.sdt_khach_hang || '');
      const search = searchTerm.toLowerCase();
      return name.includes(search) || phone.includes(search);
    });
  }, [queue, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
            Xin chào Bác sĩ!
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold mt-1">
            Hôm nay bạn có <span className="text-primary font-extrabold">{stats.totalToday}</span> bệnh nhân trong danh sách chờ khám.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Làm mới hàng chờ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Tổng ca chờ khám"
          value={stats.totalToday}
          icon={<Users size={22} />}
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <StatCard
          title="Đang trong buồng khám"
          value={stats.active}
          icon={<Clock size={22} />}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/30"
        />
        <StatCard
          title="Chờ gọi khám"
          value={stats.waiting}
          icon={<UserCheck size={22} />}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-900/30"
        />
      </div>

      {/* Main Queue List */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-secondary dark:text-zinc-100 uppercase tracking-wider">Hàng đợi khám hôm nay</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase mt-0.5">Tiến trình tiếp nhận bệnh nhân thực tế</p>
          </div>

          <div className="relative w-full md:max-w-xs group">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-primary transition-colors">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bệnh nhân chờ..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-secondary dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-wider">Đang tải danh sách chờ khám...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-3">
            <div className="size-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-2xl">
              📭
            </div>
            <div>
              <p className="text-xs font-bold text-secondary dark:text-zinc-300">Không tìm thấy bệnh nhân nào trong hàng chờ</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
                {searchTerm ? 'Vui lòng thay đổi từ khóa tìm kiếm' : 'Lễ tân chưa check-in ca khám nào chỉ định cho bạn'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/35 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Mã số</th>
                  <th className="px-6 py-4">Bệnh nhân</th>
                  <th className="px-6 py-4">Giờ hẹn</th>
                  <th className="px-6 py-4">Lý do khám</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((item) => (
                  <QueueRow key={item.id} item={item} onAssess={handleAssess} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
