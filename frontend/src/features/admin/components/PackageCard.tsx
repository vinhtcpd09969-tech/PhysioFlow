

interface PackageCardProps {
  pkg: any;
  currencyFormatter: Intl.NumberFormat;
}

export default function PackageCard({ pkg, currencyFormatter }: PackageCardProps) {
  // Generate consistent mock image
  const getImageUrl = (id: string | number) => {
    const isEven = String(id).charCodeAt(0) % 2 === 0;
    return `https://images.unsplash.com/photo-${isEven ? '1576091160550-21080f0c7324' : '1544367567-0f2fcb009e0b'}?q=80&w=800&auto=format&fit=crop`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 active:scale-[0.98] group cursor-pointer">
      <div className="h-32 bg-slate-200 relative overflow-hidden">
        <img src={getImageUrl(pkg.id)} alt={pkg.ten_goi} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
          <span className={`w-2 h-2 rounded-full ${pkg.trang_thai === 'hoat_dong' ? 'bg-teal-500' : 'bg-slate-400'}`}></span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {pkg.trang_thai === 'hoat_dong' ? (pkg.hien_thi_website ? 'Đang hiển thị' : 'Ẩn trên web') : 'Tạm ngừng'}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs font-bold text-slate-400 mb-1">ID: {pkg.ma_goi}</p>
        <h4 className="text-lg font-bold text-slate-800 leading-tight mb-4">{pkg.ten_goi}</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Số buổi</p>
            <p className="font-bold text-slate-800">{pkg.tong_so_buoi} Buổi</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Thời hạn</p>
            <p className="font-bold text-slate-800">{pkg.han_dung_thang} Tháng</p>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-end pt-4 border-t border-slate-100">
          <span className="text-xl font-bold text-teal-600">{currencyFormatter.format(pkg.gia_tien)}đ</span>
          <button className="text-slate-400 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 w-8 h-8 rounded-lg flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
