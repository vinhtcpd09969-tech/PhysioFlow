import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  Eye,
  Activity,
  Calendar,
  Wrench,
  Cpu,
  ShieldCheck,
  Tag,
  Building2,
  FileText,
  X,
  Save,
} from 'lucide-react';
import {
  getEquipment,
  createEquipment,
  updateEquipment
} from '../../api/admin.api';
import { format } from 'date-fns';
import api from '../../../../api/axios';
import { CustomSelect } from '../../../../components/CustomSelect';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';

interface Equipment {
  id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  ngay_mua?: string;
  trang_thai: string;
  ghi_chu?: string;
  phong_id?: number | null;
  ten_phong?: string;
}

// Utility to calculate local YYYY-MM-DD date string without timezone offsets
const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ManageEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  // Sorting helper states
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Modals state
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Form state
  const [equipmentFormData, setEquipmentFormData] = useState<{
    ma_thiet_bi: string;
    ten_thiet_bi: string;
    ngay_mua: string;
    trang_thai: string;
    ghi_chu: string;
    phong_id: string | number;
  }>({
    ma_thiet_bi: '',
    ten_thiet_bi: '',
    ngay_mua: '',
    trang_thai: 'san_sang',
    ghi_chu: '',
    phong_id: ''
  });

  const [rooms, setRooms] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const eqRes = await getEquipment();
      
      const normalized = (eqRes.data || []).map((eq: any) => {
        let normalizedStatus = eq.trang_thai;
        if (eq.trang_thai === 'dang_su_dung' || eq.trang_thai === 'hoat_dong') normalizedStatus = 'san_sang';
        if (eq.trang_thai === 'bao_tri' || eq.trang_thai === 'tam_dung') normalizedStatus = 'dang_bao_tri';
        if (eq.trang_thai === 'hong' || eq.trang_thai === 'da_xoa' || eq.trang_thai === 'ngung_hoat_dong') normalizedStatus = 'ngung_su_dung';
        return {
          ...eq,
          trang_thai: normalizedStatus || 'san_sang'
        };
      });

      setEquipment(normalized);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thiết bị:', error);
      toast.error('Không thể kết nối API thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    api.get('/admin/rooms').then(res => setRooms(res.data || [])).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const total = equipment.length;
    const ready = equipment.filter(e => e.trang_thai === 'san_sang').length;
    const maintenance = equipment.filter(e => e.trang_thai === 'dang_bao_tri').length;
    const discontinued = equipment.filter(e => e.trang_thai === 'ngung_su_dung').length;
    return { total, ready, maintenance, discontinued };
  }, [equipment]);

  const processedEquipment = useMemo(() => {
    const filtered = equipment.filter(eq => {
      const query = searchQuery.toLowerCase();
      const matchSearch = eq.ten_thiet_bi.toLowerCase().includes(query) ||
        eq.ma_thiet_bi.toLowerCase().includes(query);
      if (!matchSearch) return false;

      if (selectedStatus !== 'all') {
        if (eq.trang_thai !== selectedStatus) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const aDeleted = a.trang_thai === 'ngung_su_dung';
      const bDeleted = b.trang_thai === 'ngung_su_dung';

      if (aDeleted && !bDeleted) return 1;
      if (!aDeleted && bDeleted) return -1;

      if (a.id === newlyCreatedId) return -1;
      if (b.id === newlyCreatedId) return 1;

      return a.ten_thiet_bi.localeCompare(b.ten_thiet_bi);
    });
  }, [equipment, searchQuery, selectedStatus, newlyCreatedId]);

  const handleOpenEquipmentModal = (eq: Equipment | null = null) => {
    if (eq) {
      setEditingEquipment(eq);
      setEquipmentFormData({
        ma_thiet_bi: eq.ma_thiet_bi,
        ten_thiet_bi: eq.ten_thiet_bi,
        ngay_mua: eq.ngay_mua ? eq.ngay_mua.substring(0, 10) : '',
        trang_thai: eq.trang_thai || 'san_sang',
        ghi_chu: eq.ghi_chu || '',
        phong_id: eq.phong_id || ''
      });
    } else {
      setEditingEquipment(null);
      setEquipmentFormData({
        ma_thiet_bi: 'TB-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        ten_thiet_bi: '',
        ngay_mua: getLocalDateString(),
        trang_thai: 'san_sang',
        ghi_chu: '',
        phong_id: ''
      });
    }
    setIsEquipmentModalOpen(true);
  };

  const handleEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentFormData.ma_thiet_bi.trim()) {
      toast.error('Vui lòng nhập mã thiết bị.');
      return;
    }
    if (!equipmentFormData.ten_thiet_bi.trim()) {
      toast.error('Vui lòng nhập tên thiết bị.');
      return;
    }

    try {
      const dataToSend = {
        ma_thiet_bi: equipmentFormData.ma_thiet_bi.trim(),
        ten_thiet_bi: equipmentFormData.ten_thiet_bi.trim(),
        ngay_mua: equipmentFormData.ngay_mua || null,
        trang_thai: equipmentFormData.trang_thai,
        ghi_chu: equipmentFormData.ghi_chu || null,
        phong_id: equipmentFormData.phong_id ? Number(equipmentFormData.phong_id) : null
      };

      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, dataToSend);
        toast.success('Cập nhật thiết bị thành công!');
      } else {
        const res = await createEquipment(dataToSend);
        toast.success('Thêm thiết bị mới thành công!');
        if (res?.data?.id) {
          setNewlyCreatedId(res.data.id);
        }
      }
      setIsEquipmentModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || 'Lỗi khi lưu thông tin thiết bị.';
      toast.error(msg);
    }
  };

  const roomOptions = useMemo(() => [
    { value: '', label: '-- Chưa gán phòng (Lưu kho) --', icon: '📦' },
    ...rooms
      .filter((r: any) => r.loai_phong === 'phong_tri_lieu' || r.loai_phong === 'phong_dieu_tri')
      .map((r: any) => ({
        value: String(r.id),
        label: `${r.ten_phong} (${r.ma_phong})`,
        icon: '🏢'
      }))
  ], [rooms]);

  const statusOptions = useMemo(() => [
    { value: 'san_sang', label: '🟢 Sẵn sàng hoạt động' },
    { value: 'dang_bao_tri', label: '🛠️ Đang bảo trì, sửa chữa' },
    { value: 'ngung_su_dung', label: '🚫 Ngưng sử dụng (Thanh lý/Hỏng)' },
  ], []);

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-slate-800 font-sans">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tổng số thiết bị</span>
            <span className="text-2xl font-black text-slate-800 mt-2 block">{stats.total}</span>
          </div>
          <div className="size-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Cpu size={20} className="stroke-[2.25]" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Sẵn sàng</span>
            <span className="text-2xl font-black text-emerald-700 mt-2 block">{stats.ready}</span>
          </div>
          <div className="size-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck size={20} className="stroke-[2.25]" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Đang bảo trì</span>
            <span className="text-2xl font-black text-amber-700 mt-2 block">{stats.maintenance}</span>
          </div>
          <div className="size-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Wrench size={20} className="stroke-[2.25]" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">Ngưng sử dụng</span>
            <span className="text-2xl font-black text-rose-700 mt-2 block">{stats.discontinued}</span>
          </div>
          <div className="size-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <Activity size={20} className="stroke-[2.25]" />
          </div>
        </div>
      </div>

      {/* Filters and Action Toolbar */}
      <div className="relative z-20 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4.5 h-4.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên máy hoặc mã số..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 pl-9 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-all placeholder-slate-400"
              />
            </div>

            <div className="w-full sm:w-52">
              <CustomSelect
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: 'all', label: 'Tất cả trạng thái' },
                  { value: 'san_sang', label: 'Sẵn sàng', icon: '🟢' },
                  { value: 'dang_bao_tri', label: 'Đang bảo trì', icon: '🛠️' },
                  { value: 'ngung_su_dung', label: 'Ngưng sử dụng', icon: '🚫' },
                ]}
                fullWidth
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => handleOpenEquipmentModal()}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={16} className="stroke-[2.5]" />
              Thêm thiết bị mới
            </button>
          </div>
        </div>
      </div>

      {/* Equipment View Render */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs shadow-sm animate-pulse">
          ⏳ Đang đồng bộ hóa thiết bị y tế...
        </div>
      ) : processedEquipment.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-12 text-center text-slate-400 font-semibold italic text-xs shadow-sm">
          Không tìm thấy thiết bị nào phù hợp.
        </div>
      ) : (
        /* TABLE MODE */
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider select-none text-[11px]">
                  <th className="p-4 pl-6 w-36 text-left">Mã máy</th>
                  <th className="p-4 text-left">Tên thiết bị y tế</th>
                  <th className="p-4 w-48 text-left">Vị trí phòng</th>
                  <th className="p-4 w-36 text-center">Ngày mua</th>
                  <th className="p-4 w-36 text-center">Trạng thái</th>
                  <th className="p-4 pr-6 w-28 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {processedEquipment.map((eq) => {
                  const isDiscontinued = eq.trang_thai === 'ngung_su_dung';
                  const isNew = eq.id === newlyCreatedId;

                  return (
                    <tr
                      key={eq.id}
                      onClick={() => handleOpenEquipmentModal(eq)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group ${
                        isDiscontinued ? 'bg-slate-50/30 dark:bg-zinc-900/30 opacity-75' : ''
                      } ${isNew ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-semibold shadow-sm' : ''}`}
                    >
                      <td className="p-4 pl-6 font-mono font-bold text-slate-500 dark:text-zinc-400 text-left align-middle">
                        <div className="flex flex-col">
                          <span>{eq.ma_thiet_bi}</span>
                          {isNew && (
                            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mt-0.5">Mới tạo</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-left align-middle">
                        <div className="font-extrabold text-slate-800 dark:text-zinc-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {eq.ten_thiet_bi}
                        </div>
                        {eq.ghi_chu && (
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500 italic mt-0.5 font-normal">
                            {eq.ghi_chu}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-zinc-300 text-left align-middle">
                        {eq.ten_phong ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-black">
                            🏢 {eq.ten_phong}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 font-normal italic">
                            Chưa phân phòng
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-600 dark:text-zinc-300 text-center align-middle">
                        {eq.ngay_mua ? format(new Date(eq.ngay_mua), 'dd/MM/yyyy') : '—'}
                      </td>
                      <td className="p-4 text-center align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                          eq.trang_thai === 'san_sang'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : eq.trang_thai === 'dang_bao_tri'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                        }`}>
                          <span className={`size-1.5 rounded-full ${
                            eq.trang_thai === 'san_sang' 
                              ? 'bg-emerald-500 animate-pulse' 
                              : eq.trang_thai === 'dang_bao_tri' 
                                ? 'bg-amber-500 animate-pulse' 
                                : 'bg-slate-400'
                          }`} />
                          {eq.trang_thai === 'san_sang' ? 'Sẵn sàng' : eq.trang_thai === 'dang_bao_tri' ? 'Đang bảo trì' : 'Ngưng sử dụng'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center align-middle">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEquipmentModal(eq);
                          }}
                          className="size-8 inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-300 border border-slate-200/80 dark:border-zinc-700/80 hover:border-teal-300 transition-all cursor-pointer shadow-2xs group/btn"
                          title="Xem chi tiết & Hiệu chỉnh"
                        >
                          <Eye size={15} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Equipment */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200 overflow-y-auto font-sans">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200/80 dark:border-zinc-800 shadow-2xl max-w-xl w-full animate-in zoom-in-95 duration-200 my-auto overflow-visible relative">
            {/* Modal Header */}
            <div className="px-7 py-5 border-b border-zinc-150/80 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent rounded-t-[31px]">
              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner shrink-0">
                  <Cpu size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-heading tracking-tight">
                    {editingEquipment ? 'Hiệu Chỉnh Thiết Bị' : 'Thêm Thiết Bị Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                    {editingEquipment ? 'Cập nhật cấu hình và vị trí phân bổ máy' : 'Đăng ký thông tin thiết bị y tế và phòng phân bổ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEquipmentModalOpen(false)}
                className="size-9 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition-all hover:rotate-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEquipmentSubmit} className="p-7 space-y-4 text-xs">
              {/* Row 1: Mã thiết bị & Ngày mua (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag size={13} className="text-teal-600 dark:text-teal-400" />
                    <span>Mã thiết bị (Độc nhất) <b className="text-rose-500">*</b></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TB-XXXXX"
                    value={equipmentFormData.ma_thiet_bi}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ma_thiet_bi: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-mono font-bold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} className="text-teal-600 dark:text-teal-400" />
                    <span>Ngày mua / Nhập kho</span>
                  </label>
                  <CustomDatePicker
                    value={equipmentFormData.ngay_mua}
                    onChange={(val) => setEquipmentFormData({ ...equipmentFormData, ngay_mua: val })}
                    placeholder="dd/mm/yyyy"
                    align="right"
                    maxDate={getLocalDateString()}
                    buttonClassName="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Row 2: Tên thiết bị (Full width) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu size={13} className="text-teal-600 dark:text-teal-400" />
                  <span>Tên thiết bị y tế <b className="text-rose-500">*</b></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy Laser trị liệu công suất cao..."
                  value={equipmentFormData.ten_thiet_bi}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ten_thiet_bi: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-bold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400"
                />
              </div>

              {/* Row 3: Vị trí phòng & Trạng thái (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={13} className="text-teal-600 dark:text-teal-400" />
                    <span>Phòng / Vị trí bố trí</span>
                  </label>
                  <CustomSelect
                    value={String(equipmentFormData.phong_id || '')}
                    onChange={(val) => setEquipmentFormData({ ...equipmentFormData, phong_id: val })}
                    options={roomOptions}
                    fullWidth
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={13} className="text-teal-600 dark:text-teal-400" />
                    <span>Trạng thái thiết bị</span>
                  </label>
                  <CustomSelect
                    value={equipmentFormData.trang_thai}
                    onChange={(val) => setEquipmentFormData({ ...equipmentFormData, trang_thai: val })}
                    options={statusOptions}
                    fullWidth
                  />
                </div>
              </div>

              {/* Row 4: Ghi chú */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-teal-600 dark:text-teal-400" />
                  <span>Ghi chú / Tình trạng máy</span>
                </label>
                <textarea
                  value={equipmentFormData.ghi_chu}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ghi_chu: e.target.value })}
                  placeholder="Thông tin chi tiết về tình trạng máy, lịch bảo trì hoặc thông số kỹ thuật..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-zinc-100 font-semibold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-150/80 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-teal-600/25 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{editingEquipment ? 'Lưu thay đổi' : 'Thêm mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
