interface PackageRowProps {
  pkg: any;
  currencyFormatter: Intl.NumberFormat;
  onEdit: (pkg: any) => void;
  onDelete: (pkg: any) => void;
  onRestore: (pkg: any) => void;
}

const LOAI_GOI_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  KHAM: { label: 'LƯỢNG GIÁ', bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200/80 dark:border-indigo-800/80' },
  LE: { label: 'DỊCH VỤ LẺ', bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200/80 dark:border-teal-800/80' },
  LIEU_TRINH: { label: 'LIỆU TRÌNH', bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200/80 dark:border-emerald-800/80' }
};

export function PackageRow({
  pkg,
  currencyFormatter,
  onEdit,
  onDelete,
  onRestore
}: PackageRowProps) {
  const isInactive = pkg.trang_thai !== 'hoat_dong';
  const typeConfig = LOAI_GOI_CONFIG[pkg.loai_goi] || {
    label: pkg.loai_goi,
    bg: 'bg-slate-100 dark:bg-zinc-800',
    text: 'text-slate-700 dark:text-zinc-300',
    border: 'border-slate-200 dark:border-zinc-700'
  };

  return (
    <div 
      className={`group relative bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-teal-500/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
        isInactive ? 'opacity-60 bg-slate-50/50' : ''
      }`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('select') || target.closest('a') || window.getSelection()?.toString()) {
          return;
        }
        onEdit(pkg);
      }}
    >
      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4">
        
        {/* 1. THÔNG TIN GÓI */}
        <div className="col-span-12 lg:col-span-5 min-w-0 flex items-center gap-3.5">
          {/* Thumbnail Image */}
          <div className="w-14 h-14 rounded-2xl border border-slate-200/80 dark:border-zinc-700 overflow-hidden shrink-0 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center relative shadow-2xs">
            <img 
              src={pkg.anh_goi || '/images/goi/kham_sang_loc.png'} 
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
              alt={pkg.ten_goi} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/goi/kham_sang_loc.png';
              }}
            />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0 ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                {typeConfig.label}
              </span>
            </div>
            
            <h4 className="font-jakarta font-black text-sm text-slate-900 dark:text-zinc-100 tracking-tight group-hover:text-teal-600 transition-colors leading-snug">
              {pkg.ten_goi}
            </h4>
            {(pkg.quy_trinh || pkg.muc_tieu) && (
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-0.5 font-medium line-clamp-1">{pkg.quy_trinh || pkg.muc_tieu}</p>
            )}
          </div>
        </div>

        {/* 2. SỐ BUỔI & THỜI LƯỢNG */}
        <div className="col-span-12 lg:col-span-2 shrink-0 flex flex-col items-start lg:items-center gap-1">
          <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{pkg.tong_so_buoi} buổi</span>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-zinc-700">
            ⏱️ {pkg.thoi_luong_buoi_phut || pkg.thoi_luong_phut || 60} phút/buổi
          </span>
        </div>

        {/* 3. ĐƠN GIÁ TRỌN GÓI */}
        <div className="col-span-12 lg:col-span-2 shrink-0 flex flex-col items-start lg:items-center">
          <span className="font-mono font-black text-teal-600 dark:text-teal-400 text-sm">
            {currencyFormatter.format(pkg.gia_tien || pkg.gia_goi || pkg.don_gia)}đ
          </span>
        </div>

        {/* 4. TRẠNG THÁI */}
        <div className="col-span-12 lg:col-span-1 shrink-0 flex lg:justify-center">
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border ${
            pkg.trang_thai === 'hoat_dong'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}>
            <span className="relative flex h-1.5 w-1.5">
              {pkg.trang_thai === 'hoat_dong' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pkg.trang_thai === 'hoat_dong' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </span>
            <span>{pkg.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Tạm ngưng'}</span>
          </span>
        </div>

        {/* 5. THAO TÁC QUẢN TRỊ */}
        <div className="col-span-12 lg:col-span-2 shrink-0 flex items-center lg:justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(pkg)}
            className="px-3.5 py-1.5 border border-slate-200 dark:border-zinc-700 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-zinc-200 hover:text-teal-700 rounded-xl transition-all font-black text-[11px] cursor-pointer shadow-2xs"
          >
            Sửa đổi
          </button>

          {pkg.trang_thai === 'hoat_dong' ? (
            <button
              type="button"
              onClick={() => onDelete(pkg)}
              className="p-1.5 border border-slate-200 dark:border-zinc-700 hover:border-amber-400 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Ngưng sử dụng gói"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRestore(pkg)}
              className="p-1.5 border border-slate-200 dark:border-zinc-700 hover:border-emerald-400 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Khôi phục sử dụng gói"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6.578M3.9 9h6.1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
