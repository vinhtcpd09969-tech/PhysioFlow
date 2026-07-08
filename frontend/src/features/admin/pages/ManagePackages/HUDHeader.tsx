interface HUDHeaderProps {
  totalCount: number;
  activeCount: number;
  khamCount: number;
  leCount: number;
  lieuTrinhCount: number;
  avgSessions: number;
  onOpenCategory: () => void;
  onOpenAddPackage: () => void;
}

export function HUDHeader({
  totalCount,
  activeCount,
  khamCount,
  leCount,
  lieuTrinhCount,
  avgSessions,
  onOpenCategory,
  onOpenAddPackage
}: HUDHeaderProps) {
  return (
    <>
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-heading tracking-wider text-primary uppercase font-bold">Không gian làm việc</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-secondary tracking-tight">CẤU HÌNH GÓI DỊCH VỤ</h2>
          <p className="text-zinc-550 text-xs mt-1">Quản lý định giá, phân loại và cấu trúc phác đồ điều trị của các gói dịch vụ</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCategory}
            className="bg-white hover:bg-slate-50 border border-zinc-255 active:scale-95 text-slate-705 px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2"
          >
            📂 QUẢN LÝ DANH MỤC
          </button>

          <button
            onClick={onOpenAddPackage}
            className="bg-primary hover:bg-primary/90 hover:shadow-soft-button active:scale-95 text-white px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2"
          >
            [+] TẠO GÓI DỊCH VỤ MỚI
          </button>
        </div>
      </div>

      {/* KPI HUD Panel - Premium 5-Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-white to-teal-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-primary/30 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TỔNG THIẾT LẬP</p>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 text-[10px] font-bold">Gói</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-secondary">{totalCount}</h3>
            <span className="text-[9px] text-teal-705 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-150">Đang chạy: {activeCount}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-indigo-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-indigo-200/50 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KHÁM & TƯ VẤN</p>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-650 border border-indigo-100 text-[10px] font-bold">Kham</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-secondary">{khamCount}</h3>
            <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150">Dịch vụ</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-teal-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-teal-300/50 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GÓI LẺ TRỊ LIỆU</p>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold">Le</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-secondary">{leCount}</h3>
            <span className="text-[9px] text-teal-800 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-150">Đơn buổi</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-emerald-300/50 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LIỆU TRÌNH CHUYÊN SÂU</p>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">Regimen</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-secondary">{lieuTrinhCount}</h3>
            <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150">Đa buổi</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-white to-amber-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-amber-300/50 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SỐ BUỔI TRUNG BÌNH</p>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">Session</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-secondary">{avgSessions}</h3>
            <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-150">Buổi / Gói</span>
          </div>
        </div>
      </div>
    </>
  );
}
