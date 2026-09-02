interface HUDHeaderProps {
  onOpenAddPackage: () => void;
}

export function HUDHeader({
  onOpenAddPackage
}: HUDHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="size-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">Không gian quản trị</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-jakarta tracking-tight">
          CẤU HÌNH GÓI DỊCH VỤ
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">
          Quản lý định giá, phân loại chuyên môn và cấu trúc phác đồ điều trị của các gói dịch vụ
        </p>
      </div>

      <button
        onClick={onOpenAddPackage}
        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 active:scale-95 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer shrink-0"
      >
        <span>[+] TẠO GÓI DỊCH VỤ MỚI</span>
      </button>
    </div>
  );
}
