import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRooms, 
  updateRoom
} from '../../api/admin.api';
import { Building2, Tag, Layers, Users, FileText, ArrowLeft, Save, RotateCcw, Cpu, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';
import { CustomSelect } from '../../../../components/CustomSelect';

interface Room {
  id: string | number;
  ten_phong: string;
  ma_phong: string;
  loai_phong: string;
  trang_thai: string;
  mo_ta?: string;
  suc_chua?: number;
}

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms for Editing Room Info
  const [roomFormData, setRoomFormData] = useState({
    ten_phong: '',
    ma_phong: '',
    loai_phong: 'phong_tri_lieu',
    trang_thai: 'san_sang',
    mo_ta: '',
    suc_chua: 1
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getRooms();
      setRooms(res.data || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chi tiết phòng:', error);
      toast.error('Không thể tải thông tin phòng từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Find current room
  const currentRoom = useMemo(() => {
    return rooms.find(r => r.id.toString() === id);
  }, [rooms, id]);

  const [roomEquipment, setRoomEquipment] = useState<any[]>([]);

  // Sync form data with database state when currentRoom loads
  useEffect(() => {
    if (currentRoom) {
      setRoomFormData({
        ten_phong: currentRoom.ten_phong,
        ma_phong: currentRoom.ma_phong,
        loai_phong: currentRoom.loai_phong,
        trang_thai: currentRoom.trang_thai,
        mo_ta: currentRoom.mo_ta || '',
        suc_chua: currentRoom.suc_chua || 1
      });

      api.get('/admin/equipment')
        .then(res => {
          const list = (res.data || []).filter((e: any) => String(e.phong_id) === String(currentRoom.id));
          setRoomEquipment(list);
        })
        .catch(() => {});
    }
  }, [currentRoom]);

  const handleResetForm = () => {
    if (!currentRoom) return;
    setRoomFormData({
      ten_phong: currentRoom.ten_phong,
      ma_phong: currentRoom.ma_phong,
      loai_phong: currentRoom.loai_phong,
      trang_thai: currentRoom.trang_thai,
      mo_ta: currentRoom.mo_ta || '',
      suc_chua: currentRoom.suc_chua || 1
    });
    toast.success('Đã khôi phục thông tin ban đầu.');
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;
    try {
      await updateRoom(currentRoom.id.toString(), roomFormData);
      toast.success('Cập nhật thông tin phòng thành công!');
      loadData();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin phòng.';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-teal-800 font-sans">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="font-bold text-xs tracking-widest uppercase text-slate-400">Đang tải thông tin hạ tầng y tế...</p>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="py-24 text-center font-sans max-w-md mx-auto">
        <div className="size-14 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Không tìm thấy phòng!</h3>
        <p className="text-slate-500 text-xs mt-2 leading-relaxed">Phòng trực y tế này có thể không tồn tại hoặc đã được gỡ bỏ khỏi hệ thống.</p>
        <button 
          onClick={() => navigate('/admin/rooms')}
          className="mt-6 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Quay lại danh sách phòng
        </button>
      </div>
    );
  }

  const isCurrentlyOccupied = currentRoom.trang_thai === 'dang_dung' || currentRoom.trang_thai === 'dang_co_khach';

  const statusOptions = [
    { value: 'san_sang', label: '🟢 Sẵn sàng', disabled: isCurrentlyOccupied },
    { value: 'dang_co_khach', label: '🔵 Có khách (Đang dùng)', disabled: true },
    { value: 'bao_tri', label: '🛠️ Bảo trì', disabled: isCurrentlyOccupied },
    { value: 'ngung_hoat_dong', label: '🚫 Ngừng hoạt động', disabled: isCurrentlyOccupied },
  ];

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-700 dark:text-zinc-300 max-w-5xl mx-auto px-4 animate-fade-in">
      
      {/* Top Back Navigation */}
      <div>
        <button 
          type="button"
          onClick={() => navigate('/admin/rooms')}
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 hover:text-teal-800 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại sơ đồ phòng trực</span>
        </button>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-7 py-5 border-b border-slate-150 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner shrink-0">
              <Building2 size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-black text-slate-900 dark:text-zinc-100 font-heading tracking-tight">
                  {currentRoom.ten_phong}
                </h2>
                <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 uppercase">
                  {currentRoom.ma_phong}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                Cập nhật thông số vận hành, mã phòng và sức chứa chuyên môn
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-3 py-1 rounded-xl">
            Tự động đồng bộ
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRoomSubmit} className="p-7 space-y-5 text-xs">
          {/* Row 1: Tên phòng & Mã phòng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Tên phòng lượng giá / trị liệu <b className="text-rose-500">*</b></span>
              </label>
              <input 
                type="text" 
                required
                value={roomFormData.ten_phong}
                onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-bold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Mã phòng y tế <b className="text-rose-500">*</b></span>
              </label>
              <input 
                type="text" 
                required
                value={roomFormData.ma_phong}
                onChange={(e) => setRoomFormData({ ...roomFormData, ma_phong: e.target.value.toUpperCase().trim() })}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-mono font-black outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400"
              />
            </div>
          </div>

          {/* Row 2: Trạng thái & Sức chứa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Trạng thái hoạt động</span>
              </label>
              <CustomSelect
                value={roomFormData.trang_thai}
                onChange={(val) => setRoomFormData({ ...roomFormData, trang_thai: val })}
                options={statusOptions}
                fullWidth
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={13} className="text-teal-600 dark:text-teal-400" />
                <span>
                  {roomFormData.loai_phong === 'phong_tri_lieu' ? 'Sức chứa (Số giường trị liệu)' : 'Sức chứa (Số chuyên viên trực)'} <b className="text-rose-500">*</b>
                </span>
              </label>
              <div className="relative">
                <input 
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={roomFormData.suc_chua}
                  onChange={(e) => setRoomFormData({ ...roomFormData, suc_chua: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-black outline-none focus:ring-4 transition-all shadow-2xs"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase pointer-events-none">
                  {roomFormData.loai_phong === 'phong_tri_lieu' ? 'Giường trị liệu' : 'Chuyên viên'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Mô tả / Ghi chú */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={13} className="text-teal-600 dark:text-teal-400" />
              <span>Mô tả chi tiết trang thiết bị / Ghi chú</span>
            </label>
            <textarea 
              value={roomFormData.mo_ta}
              onChange={(e) => setRoomFormData({ ...roomFormData, mo_ta: e.target.value })}
              placeholder="Ghi chú vệ sinh phòng trực, mô tả chi tiết máy móc thiết bị có sẵn phục vụ trị liệu..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-zinc-100 font-medium outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={handleResetForm}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục ban đầu</span>
            </button>
            <button 
              type="submit" 
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-teal-600/25 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>

      {/* DANH SÁCH THIẾT BỊ Y TẾ ĐƯỢC GÁN VÀO PHÒNG NÀY */}
      {currentRoom?.loai_phong === 'phong_tri_lieu' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Cpu size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Thiết Bị Y Tế Tại Phòng ({roomEquipment.length} thiết bị)
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Danh mục máy móc điều trị đang bố trí tại phòng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/equipment')}
              className="text-xs font-extrabold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1.5 cursor-pointer bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-xl transition-all"
            >
              <span>Quản lý gán thiết bị</span>
              <ExternalLink size={12} />
            </button>
          </div>

          {roomEquipment.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roomEquipment.map((tb: any) => (
                <div key={tb.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between hover:border-teal-500/40 transition-all shadow-2xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">{tb.ma_thiet_bi}</span>
                    <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100">{tb.ten_thiet_bi}</h4>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border tracking-wider ${
                    tb.trang_thai === 'dang_bao_tri' || tb.trang_thai === 'tam_dung'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/40 dark:text-amber-300'
                      : tb.trang_thai === 'ngung_su_dung'
                        ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-955/40 dark:text-emerald-300'
                  }`}>
                    {tb.trang_thai === 'dang_bao_tri' || tb.trang_thai === 'tam_dung' ? 'Bảo trì' : tb.trang_thai === 'ngung_su_dung' ? 'Ngưng dùng' : 'Sẵn sàng'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
              Chưa có thiết bị y tế nào được gán vào phòng trị liệu này. Bấm "Quản lý gán thiết bị" để phân bổ máy.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
