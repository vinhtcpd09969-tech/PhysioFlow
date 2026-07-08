import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment
} from '../../api/admin.api';

interface Equipment {
  id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  ngay_mua?: string;
  trang_thai: string;
  ghi_chu?: string;
}

export default function ManageEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Form state
  const [equipmentFormData, setEquipmentFormData] = useState({
    ma_thiet_bi: '',
    ten_thiet_bi: '',
    ngay_mua: '',
    trang_thai: 'san_sang',
    ghi_chu: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const eqRes = await getEquipment();
      setEquipment(eqRes.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thiết bị:', error);
      toast.error('Không thể kết nối API thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = equipment.length;
    const ready = equipment.filter(e => e.trang_thai === 'san_sang').length;
    const maintenance = equipment.filter(e => e.trang_thai === 'dang_bao_tri' || e.trang_thai === 'hong').length;
    return { total, ready, maintenance };
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(eq => {
      const query = searchQuery.toLowerCase();
      const matchSearch = eq.ten_thiet_bi.toLowerCase().includes(query) ||
        eq.ma_thiet_bi.toLowerCase().includes(query);
      if (!matchSearch) return false;

      if (selectedStatus !== 'all') {
        if (eq.trang_thai !== selectedStatus) return false;
      }

      return true;
    });
  }, [equipment, searchQuery, selectedStatus]);

  const handleOpenEquipmentModal = (eq: Equipment | null = null) => {
    if (eq) {
      setEditingEquipment(eq);
      setEquipmentFormData({
        ma_thiet_bi: eq.ma_thiet_bi,
        ten_thiet_bi: eq.ten_thiet_bi,
        ngay_mua: eq.ngay_mua ? eq.ngay_mua.substring(0, 10) : '',
        trang_thai: eq.trang_thai,
        ghi_chu: eq.ghi_chu || ''
      });
    } else {
      setEditingEquipment(null);
      setEquipmentFormData({
        ma_thiet_bi: 'TB-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        ten_thiet_bi: '',
        ngay_mua: new Date().toISOString().substring(0, 10),
        trang_thai: 'san_sang',
        ghi_chu: ''
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
        ghi_chu: equipmentFormData.ghi_chu || null
      };

      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, dataToSend);
        toast.success('Cập nhật thiết bị thành công!');
      } else {
        await createEquipment(dataToSend);
        toast.success('Thêm thiết bị mới thành công!');
      }
      setIsEquipmentModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || 'Lỗi khi lưu thông tin thiết bị.';
      toast.error(msg);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này khỏi hệ thống?')) {
      try {
        await deleteEquipment(id);
        toast.success('Đã xóa thiết bị thành công.');
        loadData();
      } catch (error) {
        toast.error('Lỗi khi xóa thiết bị.');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 relative animate-[fadeIn_0.4s_ease-out] font-sans text-slate-800">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-teal-950 tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8 text-teal-850" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            QUẢN LÝ THIẾT BỊ Y TẾ
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-medium tracking-wide uppercase">Kiểm định kỹ thuật máy móc & điều phối công nghệ trị liệu tại Office Care</p>
        </div>

        <div>
          <button
            onClick={() => handleOpenEquipmentModal()}
            className="bg-teal-800 hover:bg-teal-900 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-95 shadow-sm"
          >
            + THÊM THIẾT BỊ MỚI
          </button>
        </div>
      </div>

      {/* Statistics panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border p-5 bg-white border-slate-200 hover:shadow-md transition-all duration-300 rounded-none">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tổng Số Thiết Bị</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.total}</span>
            <span className="text-xs text-slate-400">máy móc đang quản lý</span>
          </div>
        </div>

        <div className="border p-5 bg-white border-slate-200 hover:shadow-md transition-all duration-300 rounded-none">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Đang hoạt động</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-850 tracking-tight">{stats.ready}</span>
            <span className="text-xs text-slate-400">máy móc sẵn sàng sử dụng</span>
          </div>
        </div>

        <div className="border p-5 bg-white border-slate-200 hover:shadow-md transition-all duration-300 rounded-none">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Đang Bảo Trì / Hỏng</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700 tracking-tight">{stats.maintenance}</span>
            <span className="text-xs text-slate-400">cần sửa chữa hoặc kiểm định</span>
          </div>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-none grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên máy hoặc mã thiết bị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-250/70 p-2.5 pl-9 text-xs font-semibold rounded-none focus:outline-none focus:border-teal-800 transition-colors placeholder-slate-400"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-white border border-slate-250/70 p-2.5 text-xs font-black uppercase tracking-wider rounded-none focus:outline-none focus:border-teal-800 transition-colors cursor-pointer"
          >
            <option value="all">🔍 Tất cả trạng thái</option>
            <option value="san_sang">🟢 Sẵn sàng</option>
            <option value="dang_su_dung">⚡ Đang sử dụng</option>
            <option value="dang_bao_tri">🛠️ Đang bảo trì</option>
            <option value="hong">❌ Hỏng / Sự cố</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="border border-slate-200 bg-white overflow-hidden rounded-none shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
            ⏳ Đang đồng bộ hóa thiết bị y tế...
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold italic text-xs">
            Không tìm thấy thiết bị nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest select-none">
                  <th className="p-4 pl-6 w-32">Mã thiết bị</th>
                  <th className="p-4">Tên thiết bị y khoa</th>
                  <th className="p-4 w-44">Ngày mua</th>
                  <th className="p-4 text-center w-40">Trạng thái</th>
                  <th className="p-4 pr-6 text-right w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipment.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors group text-xs">
                    <td className="p-4 pl-6 font-mono font-bold text-slate-500">{eq.ma_thiet_bi}</td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-800">{eq.ten_thiet_bi}</div>
                      {eq.ghi_chu && <div className="text-[11px] text-slate-400 italic mt-0.5">{eq.ghi_chu}</div>}
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      {eq.ngay_mua ? new Date(eq.ngay_mua).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                        eq.trang_thai === 'san_sang'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : eq.trang_thai === 'dang_su_dung'
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            : eq.trang_thai === 'dang_bao_tri'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {eq.trang_thai === 'san_sang' ? 'Sẵn sàng' : eq.trang_thai === 'dang_su_dung' ? 'Đang dùng' : eq.trang_thai === 'dang_bao_tri' ? 'Bảo trì' : 'Hỏng / Sự cố'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        <button
                          onClick={() => handleOpenEquipmentModal(eq)}
                          className="p-1 text-slate-400 hover:text-teal-800 transition-colors"
                          title="Sửa thông tin"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa thiết bị"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Equipment */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border-2 border-slate-950 shadow-2xl max-w-md w-full flex flex-col overflow-hidden rounded-none">
            {/* Modal Header */}
            <div className="border-b-2 border-slate-950 bg-slate-950 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest block mb-0.5">
                  {editingEquipment ? 'Hạ tầng y tế' : 'Đăng ký thiết bị'}
                </span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  {editingEquipment ? 'Hiệu chỉnh thiết bị' : 'Thêm thiết bị mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsEquipmentModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEquipmentSubmit} className="p-6 space-y-4 text-slate-800 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mã thiết bị (Độc nhất)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: LASER-01, SHOCK-02..."
                  value={equipmentFormData.ma_thiet_bi}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ma_thiet_bi: e.target.value })}
                  className="w-full border border-slate-300 p-2.5 font-bold rounded-none focus:outline-none focus:border-slate-950 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tên thiết bị</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy Laser trị liệu công suất cao..."
                  value={equipmentFormData.ten_thiet_bi}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ten_thiet_bi: e.target.value })}
                  className="w-full border border-slate-300 p-2.5 font-bold rounded-none focus:outline-none focus:border-slate-950 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Trạng thái</label>
                  <select
                    value={equipmentFormData.trang_thai}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, trang_thai: e.target.value })}
                    className="w-full border border-slate-300 p-2.5 font-bold rounded-none focus:outline-none focus:border-slate-950 transition-colors cursor-pointer"
                  >
                    <option value="san_sang">Sẵn sàng</option>
                    <option value="dang_su_dung">Đang sử dụng</option>
                    <option value="dang_bao_tri">Đang bảo trì</option>
                    <option value="hong">Hỏng / Sự cố</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ngày mua</label>
                  <input
                    type="date"
                    value={equipmentFormData.ngay_mua}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ngay_mua: e.target.value })}
                    className="w-full border border-slate-300 p-2.5 font-semibold rounded-none focus:outline-none focus:border-slate-950 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ghi chú / Mô tả</label>
                <textarea
                  value={equipmentFormData.ghi_chu}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ghi_chu: e.target.value })}
                  placeholder="Thông tin chi tiết về tình trạng máy..."
                  rows={3}
                  className="w-full border border-slate-300 p-2.5 font-semibold rounded-none focus:outline-none focus:border-slate-950 transition-colors"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-black uppercase tracking-wider transition-colors rounded-none active:scale-95"
                >
                  {editingEquipment ? 'Lưu thông tin' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
