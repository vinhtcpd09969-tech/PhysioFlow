import { useState, useEffect, useMemo } from 'react';
import { 
  getRooms, 
  createRoom 
} from '../../api/admin.api';
import { Compass, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Local subcomponents & types
import { RoomCard, Room } from './RoomCard';
import { RoomFormModal } from './RoomFormModal';

const ALL_ROOM_TYPES = [
  { value: 'phong_tri_lieu', label: 'Phòng trị liệu' },
  { value: 'phong_kham', label: 'Phòng khám' }
];

export default function ManageRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [statFilter, setStatFilter] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  
  // Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [roomFormData, setRoomFormData] = useState<{
    ten_phong: string;
    ma_phong: string;
    loai_phong: string;
    trang_thai: string;
    mo_ta: string;
    suc_chua: number | '';
  }>({
    ten_phong: '',
    ma_phong: '',
    loai_phong: 'phong_tri_lieu',
    trang_thai: 'san_sang',
    mo_ta: '',
    suc_chua: 1
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch all rooms
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getRooms();
      setRooms(res.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu hạ tầng:', error);
      showToast('Không thể kết nối dữ liệu máy chủ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalPhysicalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.trang_thai === 'san_sang' || r.trang_thai === 'trong').length;
    const occupiedRooms = rooms.filter(r => r.trang_thai === 'dang_dung' || r.trang_thai === 'dang_co_khach').length;
    const maintenanceRooms = rooms.filter(r => r.trang_thai === 'bao_tri').length;

    return {
      totalPhysicalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms
    };
  }, [rooms]);

  // Filtering Logic
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Type Filter
      if (selectedType !== 'all' && room.loai_phong !== selectedType) return false;

      // Search Filter
      const query = searchQuery.toLowerCase();
      const matchSearch = room.ten_phong.toLowerCase().includes(query) || 
                          (room.ma_phong || '').toLowerCase().includes(query) ||
                          (room.mo_ta && room.mo_ta.toLowerCase().includes(query));
      if (!matchSearch) return false;

      // Quick Stat Filter
      if (statFilter) {
        if (statFilter === 'available' && !(room.trang_thai === 'san_sang' || room.trang_thai === 'trong')) return false;
        if (statFilter === 'occupied' && !(room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach')) return false;
        if (statFilter === 'maintenance' && room.trang_thai !== 'bao_tri') return false;
        if (statFilter === 'inactive' && room.trang_thai !== 'ngung_hoat_dong') return false;
      }

      // Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'san_sang' && !(room.trang_thai === 'san_sang' || room.trang_thai === 'trong')) return false;
        if (selectedStatus === 'dang_dung' && !(room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach')) return false;
        if (selectedStatus === 'bao_tri' && room.trang_thai !== 'bao_tri') return false;
      }

      return true;
    }).sort((a, b) => (a.ma_phong || '').localeCompare(b.ma_phong || ''));
  }, [rooms, selectedType, selectedStatus, searchQuery, statFilter]);

  // Handle Room CRUD
  const handleOpenRoomModal = () => {
    setRoomFormData({
      ten_phong: '',
      ma_phong: '',
      loai_phong: 'phong_tri_lieu',
      trang_thai: 'san_sang',
      mo_ta: '',
      suc_chua: 1
    });
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...roomFormData,
        suc_chua: Number(roomFormData.suc_chua) || 1
      };
      await createRoom(payload);
      showToast('Đăng ký phòng trực thành công!');
      setIsRoomModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Có lỗi xảy ra khi tạo phòng mới.', 'error');
    }
  };

  const translateType = (type: string) => {
    if (type === 'phong_kham' || type === 'kham_benh') return 'Phòng khám';
    if (type === 'phong_tri_lieu' || type === 'phong_tri_lieu_chuan' || type === 'tri_lieu' || type === 'phong_dac_biet') return 'Phòng trị liệu';
    return type;
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-700 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Toast Notifier */}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`px-5 py-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 w-96 backdrop-blur-lg border transition-all duration-300 transform translate-y-0 ${
              t.type === 'success' 
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900' 
                : t.type === 'error' 
                  ? 'bg-rose-50/95 border-rose-200 text-rose-900' 
                  : 'bg-teal-50/95 border-teal-200 text-teal-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : t.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <Info className="w-5 h-5 text-teal-800" />}
              <p className="text-sm font-semibold leading-relaxed">{t.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-teal-50 text-teal-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">Hạ tầng y khoa</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-3">
            Hệ Thống Phòng Khám & Điều Trị
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Quản lý sơ đồ phòng khám lâm sàng, cabin trị liệu và thiết lập sức chứa vận hành</p>
        </div>
        
        <div>
          <button 
            onClick={() => handleOpenRoomModal()}
            className="bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-250"
          >
            + Khai báo phòng trực mới
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => setStatFilter(null)}
          className={`border p-6 cursor-pointer transition-all duration-300 rounded-2xl hover:shadow-lg ${!statFilter ? 'bg-teal-900/5 border-teal-500/50 shadow-md' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">TỔNG SỐ PHÒNG</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalPhysicalRooms}</span>
            <span className="text-xs text-slate-400 font-medium">cabin vận hành</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('available')}
          className={`border p-6 cursor-pointer transition-all duration-300 rounded-2xl hover:shadow-lg ${statFilter === 'available' ? 'bg-emerald-50/50 border-emerald-500/50 shadow-md' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ĐANG TRỐNG</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600 tracking-tight">{stats.availableRooms}</span>
            <span className="text-xs text-slate-400 font-medium">Sẵn sàng nhận khách</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('occupied')}
          className={`border p-6 cursor-pointer transition-all duration-300 rounded-2xl hover:shadow-lg ${statFilter === 'occupied' ? 'bg-cyan-50/50 border-cyan-500/50 shadow-md' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ĐANG BẬN</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-cyan-600 tracking-tight">{stats.occupiedRooms}</span>
            <span className="text-xs text-slate-400 font-medium">Đang điều trị</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('maintenance')}
          className={`border p-6 cursor-pointer transition-all duration-300 rounded-2xl hover:shadow-lg ${statFilter === 'maintenance' ? 'bg-amber-50/50 border-amber-500/50 shadow-md' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ĐANG BẢO TRÌ</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-600 tracking-tight">{stats.maintenanceRooms}</span>
            <span className="text-xs text-slate-400 font-medium">Bảo dưỡng hạ tầng</span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-slate-50/80 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-3">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
            <Compass className="w-5 h-5" />
          </span>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo mã phòng, tên phòng hoặc ghi chú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200/80 bg-white text-sm font-semibold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all placeholder-slate-400"
          />
        </div>

        {/* Room Type Filter */}
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full py-3 px-4 border border-slate-200/80 bg-white text-sm font-bold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all"
        >
          <option value="all">TẤT CẢ LOẠI PHÒNG</option>
          <option value="phong_tri_lieu">PHÒNG TRỊ LIỆU</option>
          <option value="phong_kham">PHÒNG KHÁM</option>
        </select>
      </div>

      {/* Active filters display */}
      {(statFilter || selectedType !== 'all' || selectedStatus !== 'all' || searchQuery) && (
        <div className="flex flex-wrap gap-2.5 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang lọc theo:</span>
          {searchQuery && (
            <span className="bg-slate-100 border border-slate-200/60 px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-2">
              Từ khóa: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </span>
          )}

          {selectedType !== 'all' && (
            <span className="bg-slate-100 border border-slate-200/60 px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-2">
              Loại: {translateType(selectedType)}
              <button onClick={() => setSelectedType('all')} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </span>
          )}
          {statFilter && (
            <span className="bg-teal-50 border border-teal-200 text-teal-900 px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 uppercase tracking-wider">
              {statFilter === 'available' ? 'Phòng trống' : statFilter === 'occupied' ? 'Phòng có khách' : statFilter === 'maintenance' ? 'Đang bảo trì' : 'Chỉ số thống kê'}
              <button onClick={() => setStatFilter(null)} className="text-teal-600 hover:text-teal-950 font-bold">✕</button>
            </span>
          )}
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedStatus('all');
              setStatFilter(null);
            }} 
            className="text-xs font-bold text-teal-800 hover:underline hover:text-teal-900 uppercase tracking-widest ml-auto"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Grid of rooms */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-teal-800">
          <div className="w-12 h-12 border-4 border-teal-800 border-t-transparent animate-spin rounded-full mb-4"></div>
          <p className="font-bold text-xs tracking-widest uppercase text-slate-400">Đang đồng bộ dữ liệu phòng điều trị...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      {/* CREATE NEW ROOM MODAL */}
      <RoomFormModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        roomFormData={roomFormData}
        setRoomFormData={setRoomFormData}
        onSubmit={handleRoomSubmit}
        allRoomTypes={ALL_ROOM_TYPES}
      />
    </div>
  );
}
