import { X } from 'lucide-react';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomFormData: {
    ten_phong: string;
    ma_phong: string;
    loai_phong: string;
    trang_thai: string;
    mo_ta: string;
    suc_chua: number | '';
  };
  setRoomFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  allRoomTypes: { value: string; label: string; }[];
}

export function RoomFormModal({
  isOpen,
  onClose,
  roomFormData,
  setRoomFormData,
  onSubmit,
  allRoomTypes
}: RoomFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-teal-900 text-white px-6 py-5 flex justify-between items-center flex-shrink-0">
          <div>
            <span className="text-[9px] font-black text-teal-350 uppercase tracking-widest block mb-0.5">THIẾT LẬP VẬN HÀNH</span>
            <h3 className="font-extrabold text-base uppercase tracking-wider">
              Khai báo phòng mới
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tên phòng khám / điều trị *</label>
            <input 
              type="text" 
              required
              placeholder="Ví dụ: Phòng trị liệu Laser, Phòng khám số 3..."
              value={roomFormData.ten_phong}
              onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
              className="w-full border border-slate-200/80 bg-slate-50/50 focus:bg-white p-3.5 text-sm font-semibold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mã phòng y tế *</label>
            <input 
              type="text" 
              required
              placeholder="Ví dụ: PK-01, TL-05..."
              value={roomFormData.ma_phong}
              onChange={(e) => setRoomFormData({ ...roomFormData, ma_phong: e.target.value.toUpperCase().trim() })}
              className="w-full border border-slate-200/80 bg-slate-50/50 focus:bg-white p-3.5 text-sm font-mono font-bold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phân loại phòng chức năng</label>
            <select 
              value={roomFormData.loai_phong}
              onChange={(e) => setRoomFormData({ ...roomFormData, loai_phong: e.target.value })}
              className="w-full border border-slate-200/80 bg-slate-50/50 focus:bg-white p-3.5 text-sm font-bold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all"
            >
              {allRoomTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50 space-y-2">
            <label className="block text-[10px] font-bold text-teal-800 uppercase tracking-widest">
              {roomFormData.loai_phong === 'phong_tri_lieu' ? 'SỨC CHỨA TỐI ĐA (GIƯỜNG TRỊ LIỆU) *' : 'SỨC CHỨA TỐI ĐA (BÁC SĨ TRỰC CA) *'}
            </label>
            <div className="relative">
              <input 
                type="number"
                min={1}
                max={20}
                required
                value={roomFormData.suc_chua}
                onChange={(e) => {
                  const val = e.target.value;
                  setRoomFormData({ 
                     ...roomFormData, 
                     suc_chua: val === '' ? '' : Math.max(1, parseInt(val) || 1)
                  });
                }}
                className="w-full border border-slate-200 bg-white p-3 text-sm font-bold rounded-xl focus:outline-none focus:border-teal-800 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 pointer-events-none uppercase">
                {roomFormData.loai_phong === 'phong_tri_lieu' ? 'Giường' : 'Nhân sự'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              {roomFormData.loai_phong === 'phong_tri_lieu' 
                ? 'Dùng để gán đồng thời nhiều kỹ thuật viên trực tiếp phục vụ trong ca trực.' 
                : 'Dùng để giới hạn số lượng bác sĩ khám bệnh đồng thời trong một ca trực.'}
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mô tả / Ghi chú trang thiết bị</label>
            <textarea 
              value={roomFormData.mo_ta}
              onChange={(e) => setRoomFormData({ ...roomFormData, mo_ta: e.target.value })}
              placeholder="Ghi chú thiết bị có sẵn (ví dụ: máy laser, giường điện kéo giãn...) hoặc vệ sinh phòng trực..."
              rows={3}
              className="w-full border border-slate-200/80 bg-slate-50/50 focus:bg-white p-3.5 text-sm font-medium rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all placeholder-slate-400"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 flex-shrink-0 font-bold">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-3 border border-slate-200 text-slate-505 hover:bg-slate-50 text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
