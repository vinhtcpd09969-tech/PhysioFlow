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

export function RoomCard({ room }: RoomCardProps) {
  const isUnderMaintenance = room.trang_thai === 'bao_tri';
  const isAvailable = room.trang_thai === 'san_sang' || room.trang_thai === 'trong';
  const isOccupied = room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach';

  return (
    <Link 
      to={`/admin/rooms/${room.id}`}
      className={`border bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative flex flex-col justify-between group overflow-hidden ${
        isUnderMaintenance 
          ? 'border-amber-200/80 hover:border-amber-400' 
          : isOccupied 
            ? 'border-cyan-200/80 hover:border-cyan-400'
            : 'border-slate-200/60 hover:border-teal-500'
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
        <div className="flex justify-between items-start border-b border-slate-100/80 pb-4 mb-4">
          <div className="space-y-1">
            <span className="bg-slate-900 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
              {room.ma_phong || 'Chưa có mã'}
            </span>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mt-2.5 group-hover:text-teal-900 transition-colors">
              {room.ten_phong}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {renderRoomIcon(room.loai_phong)}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
            isAvailable 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : isOccupied 
                ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
                : room.trang_thai === 'ngung_hoat_dong'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
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
          <p className="text-xs text-slate-505 font-medium leading-relaxed line-clamp-2 mb-4 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
            {room.mo_ta}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100/80 pt-4 mt-4 z-10">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {room.loai_phong === 'phong_tri_lieu' || room.loai_phong === 'tri_lieu'
              ? `Giường tối đa: ${room.suc_chua || 1}` 
              : `Sức chứa: ${room.suc_chua || 1} bác sĩ`}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-teal-800 transition-colors flex items-center gap-1">
          Cấu hình phòng <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
        </span>
      </div>
    </Link>
  );
}
