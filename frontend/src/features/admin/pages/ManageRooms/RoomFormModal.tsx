import { X, Building2, Tag, Layers, Users, FileText, Plus, Minus, Check } from 'lucide-react';
import { CustomSelect } from '../../../../components/CustomSelect';

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

  const currentCapacity = typeof roomFormData.suc_chua === 'number' ? roomFormData.suc_chua : 1;

  const handleStepCapacity = (delta: number) => {
    const nextVal = Math.max(1, Math.min(20, currentCapacity + delta));
    setRoomFormData({ ...roomFormData, suc_chua: nextVal });
  };

  const roomTypeOptions = allRoomTypes.map(t => ({
    value: t.value,
    label: t.label,
    icon: t.value === 'phong_kham' ? '🩺' : '💆'
  }));

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200 overflow-y-auto font-sans">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200/80 dark:border-zinc-800 shadow-2xl max-w-xl w-full animate-in zoom-in-95 duration-200 my-auto overflow-visible relative">
        
        {/* Modal Header */}
        <div className="px-7 py-5 border-b border-zinc-150/80 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent rounded-t-[31px]">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner shrink-0">
              <Building2 size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-heading tracking-tight">
                Khai Báo Phòng Trực Mới
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                Thiết lập cabin điều trị hoặc phòng lượng giá chức năng
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="size-9 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition-all hover:rotate-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={onSubmit} className="p-7 space-y-4 text-xs">
          {/* Row 1: Tên phòng & Mã phòng (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Tên phòng <b className="text-rose-500">*</b></span>
              </label>
              <input 
                type="text" 
                required
                placeholder="Phòng Trị Liệu Laser, Lượng Giá 01..."
                value={roomFormData.ten_phong}
                onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-bold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Mã phòng <b className="text-rose-500">*</b></span>
              </label>
              <input 
                type="text" 
                required
                placeholder="TL-01, PK-01..."
                value={roomFormData.ma_phong}
                onChange={(e) => setRoomFormData({ ...roomFormData, ma_phong: e.target.value.toUpperCase().trim() })}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-mono font-black outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400"
              />
            </div>
          </div>

          {/* Row 2: Phân loại phòng & Sức chứa tối đa (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Phân loại chức năng</span>
              </label>
              <CustomSelect
                value={roomFormData.loai_phong}
                onChange={(val) => setRoomFormData({ ...roomFormData, loai_phong: val })}
                options={roomTypeOptions}
                fullWidth
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={13} className="text-teal-600 dark:text-teal-400" />
                <span>
                  {roomFormData.loai_phong === 'phong_tri_lieu' ? 'Số giường trị liệu' : 'Số chuyên viên trực'} <b className="text-rose-500">*</b>
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepCapacity(-1)}
                  className="size-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Minus size={15} />
                </button>
                <div className="relative flex-1">
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
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 px-3 text-center text-xs font-black text-slate-900 dark:text-zinc-100 outline-none focus:border-teal-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 dark:text-zinc-500 pointer-events-none uppercase">
                    {roomFormData.loai_phong === 'phong_tri_lieu' ? 'Giường' : 'KTV'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepCapacity(1)}
                  className="size-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Mô tả chi tiết */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={13} className="text-teal-600 dark:text-teal-400" />
              <span>Mô tả trang thiết bị / Ghi chú</span>
            </label>
            <textarea 
              value={roomFormData.mo_ta}
              onChange={(e) => setRoomFormData({ ...roomFormData, mo_ta: e.target.value })}
              placeholder="Ghi chú thiết bị có sẵn (ví dụ: máy laser, giường điện kéo giãn...) hoặc vệ sinh phòng trực..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-zinc-100 font-medium outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-150/80 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-teal-600/25 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Check size={16} />
              <span>Xác nhận khai báo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
