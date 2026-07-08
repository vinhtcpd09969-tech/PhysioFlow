interface PackageRowProps {
  pkg: any;
  categories: any[];
  currencyFormatter: Intl.NumberFormat;
  onEdit: (pkg: any) => void;
  onDelete: (pkg: any) => void;
}

export function PackageRow({
  pkg,
  categories,
  currencyFormatter,
  onEdit,
  onDelete
}: PackageRowProps) {
  const isInactive = pkg.trang_thai !== 'hoat_dong';

  const catObj = categories.find(c => String(c.id) === String(pkg.danh_muc_id));
  const catName = catObj ? catObj.ten_danh_muc : 'Không phân loại';

  return (
    <div 
      className={`group relative bg-gradient-to-b from-white to-zinc-50/30 border border-zinc-200/90 rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-emerald-250 hover:shadow-[0_20px_50px_rgba(16,185,129,0.05)] hover:-translate-y-1.5 active:scale-[0.995] cursor-pointer ${
        isInactive ? 'opacity-70' : ''
      }`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('select') || target.closest('a') || window.getSelection()?.toString()) {
          return;
        }
        onEdit(pkg);
      }}
    >
      {/* Left accent bar on hover */}
      <div className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-2xl scale-y-50 group-hover:scale-y-100 opacity-0 group-hover:opacity-100 transition-all duration-300 origin-center shadow-sm bg-primary shadow-emerald-400/50"></div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-6 lg:gap-4">
        
        {/* 1. THÔNG TIN GÓI */}
        <div className="col-span-12 lg:col-span-5 min-w-0 flex gap-4">
          {/* Thumbnail Image */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-zinc-150 overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center relative shadow-sm">
            <img 
              src={pkg.anh_goi || '/goi/images/kham_sang_loc.png'} 
              className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ease-out" 
              alt={pkg.ten_goi} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/goi/images/kham_sang_loc.png';
              }}
            />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[9px] text-teal-850 font-black bg-teal-50 border border-teal-150/60 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs">
                <svg className="w-3.5 h-3.5 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2 2v12m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{catName}</span>
              </span>
            </div>
            
            <h4 className="font-heading font-black text-[13.5px] sm:text-[14px] text-secondary tracking-tight hover:text-primary transition-colors mt-0.5 duration-200 leading-snug">
              {pkg.ten_goi}
            </h4>
            {(pkg.quy_trinh || pkg.muc_tieu) && (
              <p className="text-[11px] text-zinc-450 mt-1 font-medium line-clamp-1">{pkg.quy_trinh || pkg.muc_tieu}</p>
            )}
          </div>
        </div>

        {/* 2. SỐ BUỔI & THỜI LƯỢNG */}
        <div className="col-span-12 lg:col-span-2 shrink-0 flex flex-col items-start lg:items-center gap-1">
          <span className="text-sm font-black text-secondary">{pkg.tong_so_buoi} buổi</span>
          <span className="text-[10px] text-zinc-400 font-bold bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-md">
            ⏱️ {pkg.thoi_luong_buoi_phut || pkg.thoi_luong_phut || 60} phút/buổi
          </span>
        </div>

        {/* 3. ĐƠN GIÁ TRỌN GÓI */}
        <div className="col-span-12 lg:col-span-2 shrink-0 flex flex-col items-start lg:items-center">
          <span className="font-black text-primary text-sm select-all">
            {currencyFormatter.format(pkg.gia_tien || pkg.gia_goi || pkg.don_gia)}đ
          </span>
        </div>

        {/* 4. TRẠNG THÁI */}
        <div className="col-span-12 lg:col-span-1 shrink-0 flex lg:justify-center">
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl border shadow-2xs ${
            pkg.trang_thai === 'hoat_dong'
              ? 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20 shadow-inner'
              : 'bg-zinc-100 text-zinc-400 border-zinc-200 shadow-inner'
          }`}>
            <span className="relative flex h-2 w-2">
              {pkg.trang_thai === 'hoat_dong' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${pkg.trang_thai === 'hoat_dong' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
            </span>
            <span>{pkg.trang_thai === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}</span>
          </span>
        </div>

        {/* 5. THAO TÁC QUẢN TRỊ */}
        <div className="col-span-12 lg:col-span-2 shrink-0 flex items-center lg:justify-end gap-2">
          <button
            onClick={() => onEdit(pkg)}
            className="px-3 py-2 border border-zinc-200 hover:border-primary/30 hover:bg-primary-container text-zinc-655 hover:text-primary rounded-xl transition-all duration-200 active:scale-95 bg-white shadow-2xs font-bold text-[9.5px]"
          >
            SỬA ĐỔI
          </button>

          <button
            onClick={() => onDelete(pkg)}
            className="p-2 border border-zinc-200 hover:border-amber-300 hover:bg-amber-50/50 text-zinc-400 hover:text-amber-500 rounded-xl transition-all duration-200 active:scale-95 bg-white shadow-2xs"
            title="Ngưng sử dụng gói"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
