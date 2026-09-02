import { Link } from 'react-router-dom';
import { DoorOpen, Users } from 'lucide-react';
export interface Room {
  id: string | number;
  ten_phong: string;
  ma_phong: string;
  loai_phong: string;
  trang_thai: string;
  mo_ta?: string;
  suc_chua?: number;
}

interface RoomCardProps {
  room: Room;
  equipmentList?: any[];
}

const renderRoomIcon = (type: string) => {
  if (type === 'phong_tri_lieu' || type === 'phong_tri_lieu_chuan' || type === 'tri_lieu' || type === 'phong_dac_biet') {
    return (
      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-850 shadow-inner group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6v12M6 12h12" />
        </svg>
      </div>
    );
  }
  if (type === 'phong_kham' || type === 'kham_benh') {
    return (
      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-inner group-hover:bg-slate-600 group-hover:text-white transition-all duration-300">
      <DoorOpen className="w-6 h-6" />
    </div>
  );
};

export function RoomCard({ room, equipmentList }: RoomCardProps) {
  const isUnderMaintenance = room.trang_thai === 'bao_tri';
  const isAvailable = room.trang_thai === 'san_sang' || room.trang_thai === 'trong';
  const isOccupied = room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach';

  return (
    <Link 
      to={`/admin/rooms/${room.id}`}
      className={`border bg-white dark:bg-zinc-900 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative flex flex-col justify-between group overflow-hidden ${
        isUnderMaintenance 
          ? 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400' 
          : isOccupied 
            ? 'border-cyan-200/80 dark:border-cyan-900/60 hover:border-cyan-400'
            : 'border-slate-200/60 dark:border-zinc-800 hover:border-teal-500'
      }`}
    >
      {/* Visual patterns */}
      <div className="absolute inset-0 opacity-[0.01] group-hover:opacity-[0.03] transition-opacity pointer-events-none select-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id={`grid-${room.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#grid-${room.id})`} />
        </svg>
      </div>

      <div className="z-10 w-full">
        <div className="flex justify-between items-start border-b border-slate-100/80 dark:border-zinc-800 pb-4 mb-4">
          <div className="space-y-1">
            <span className="bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-200 font-mono text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
              {room.ma_phong || 'Chưa có mã'}
            </span>
            <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight mt-2.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {room.ten_phong}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {renderRoomIcon(room.loai_phong)}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-widest">Trạng thái</span>
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
            isAvailable 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
              : isOccupied 
                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' 
                : room.trang_thai === 'ngung_hoat_dong'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isAvailable 
                ? 'bg-emerald-500 animate-pulse' 
                : isOccupied
                  ? 'bg-cyan-500 animate-pulse'
                  : room.trang_thai === 'ngung_hoat_dong'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
            }`}></span>
            {isAvailable ? 'Sẵn sàng' : isOccupied ? 'Đang hoạt động' : room.trang_thai === 'ngung_hoat_dong' ? 'Ngừng dùng' : 'Bảo trì'}
          </span>
        </div>

        {room.mo_ta && (
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed line-clamp-2 mb-3 bg-slate-50/50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-slate-100/50 dark:border-zinc-700/60">
            {room.mo_ta}
          </p>
        )}

        {/* Equipment availability banner / pills */}
        {room.loai_phong === 'phong_kham' || room.loai_phong === 'kham_benh' ? (
          <div className="mb-4 bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 text-[11px] font-semibold text-slate-400 dark:text-zinc-400 flex items-center gap-1.5">
            <span className="shrink-0 text-slate-400">🚫</span>
            <span>Không có thiết bị khả dụng (Phòng lượng giá chức năng)</span>
          </div>
        ) : (
          <div className="mb-4 bg-indigo-50/50 dark:bg-indigo-955/30 p-2.5 rounded-xl border border-indigo-100/60 dark:border-indigo-800/40 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 font-extrabold text-[10px] uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <span>🔌 Thiết bị tại phòng</span>
              </span>
              <span className="bg-indigo-500/20 px-2 py-0.2 rounded-full font-mono text-[9px] text-indigo-700 dark:text-indigo-300 font-black">
                {(equipmentList || []).filter(e => String(e.phong_id) === String(room.id) && e.trang_thai !== 'ngung_su_dung').length} thiết bị
              </span>
            </div>
            {((equipmentList || []).filter(e => String(e.phong_id) === String(room.id) && e.trang_thai !== 'ngung_su_dung')).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {((equipmentList || []).filter(e => String(e.phong_id) === String(room.id) && e.trang_thai !== 'ngung_su_dung')).map((eq: any) => (
                  <span
                    key={eq.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-indigo-200/80 dark:border-indigo-700/60 text-[10px] font-bold text-slate-800 dark:text-zinc-200 shadow-2xs"
                  >
                    <span className="text-[8px]">{eq.trang_thai === 'dang_bao_tri' || eq.trang_thai === 'tam_dung' ? '⚠️' : '✓'}</span>
                    <span>{eq.ten_thiet_bi}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-indigo-400 dark:text-indigo-400 italic font-medium">Chưa có thiết bị nào được gán vào phòng này.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100/80 dark:border-zinc-800 pt-4 mt-4 z-10">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-400 font-bold">
          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
          <span>
            {room.loai_phong === 'phong_tri_lieu' || room.loai_phong === 'tri_lieu'
              ? `Giường tối đa: ${room.suc_chua || 1}` 
              : `Sức chứa: ${room.suc_chua || 1} chuyên viên`}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors flex items-center gap-1">
          Cấu hình phòng <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
        </span>
      </div>
    </Link>
  );
}
