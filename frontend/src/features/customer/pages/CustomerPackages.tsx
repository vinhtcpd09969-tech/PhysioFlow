import { useState } from 'react';
import { 
  Package, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  FileText, 
  ShieldCheck,
  Percent
} from 'lucide-react';

export default function CustomerPackages() {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // Mock data for purchased packages
  const purchasedPackages = [
    {
      id: 'pkg-1',
      name: 'Gói Trị Liệu Cổ Vai Gáy Chuyên Sâu',
      totalSessions: 10,
      completedSessions: 8,
      purchaseDate: '01/05/2026',
      status: 'hoat_dong',
      gia_niem_yet: 5500000,
      da_thanh_toan: 4950000, // Giảm 10% do trả thẳng
      hinh_thuc_thanh_toan: 'tra_thang',
      uu_dai_ap_dung: 'Khuyến mãi Hè 2024 (Giảm 10% trả thẳng)'
    }
  ];

  // Mock billing invoices
  const invoices = [
    {
      id: 'HD-2026-0985',
      date: '01/05/2026',
      packageName: 'Gói Trị Liệu Cổ Vai Gáy Chuyên Sâu',
      totalPrice: 5500000,
      discount: 550000,
      finalPrice: 4950000,
      paidAmount: 4950000,
      dueAmount: 0,
      status: 'da_thanh_toan',
      method: 'Chuyển khoản Ngân hàng',
      transactionId: 'FT2612189432'
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-secondary flex items-center gap-2.5">
          <Package className="text-primary" size={32} />
          Gói điều trị & Thanh toán
        </h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý các gói trị liệu đã đăng ký và theo dõi thông tin tài chính cá nhân.</p>
      </div>

      {/* Package Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Purchased Packages Details */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-heading font-bold text-lg text-secondary flex items-center gap-2">
            <CheckCircle size={20} className="text-primary" />
            Gói dịch vụ đang kích hoạt
          </h2>

          {purchasedPackages.map((pkg) => {
            const percent = (pkg.completedSessions / pkg.totalSessions) * 100;
            return (
              <div 
                key={pkg.id} 
                className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden"
              >
                {/* Visual Glow Status */}
                <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang hoạt động
                </span>

                <h3 className="font-heading font-black text-xl text-secondary max-w-[70%] mb-1">
                  {pkg.name}
                </h3>
                <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-6">
                  <Calendar size={13} /> Ngày mua: {pkg.purchaseDate}
                </p>

                {/* Progress bar */}
                <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-400 uppercase tracking-wider">Tiến trình buổi trị liệu</span>
                    <span className="font-black text-secondary">{pkg.completedSessions} / {pkg.totalSessions} Buổi</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 pt-1">
                    <span>Đã hoàn thành {percent}% liệu trình</span>
                    <span className="text-primary font-bold">{pkg.totalSessions - pkg.completedSessions} buổi còn lại</span>
                  </div>
                </div>

                {/* Promotional application info */}
                <div className="flex items-start gap-3 bg-primary/5 border border-primary/10 rounded-2xl p-4 text-xs text-primary">
                  <Percent size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold">Ưu đãi thanh toán đã áp dụng:</p>
                    <p className="font-medium text-gray-600 mt-1">{pkg.uu_dai_ap_dung}</p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Invoice Summary widget */}
        <div className="space-y-6">
          <h2 className="font-heading font-bold text-lg text-secondary flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Tóm tắt Hóa đơn
          </h2>

          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase">Tổng chi phí gói</span>
              <span className="font-heading font-black text-secondary text-base">
                {formatCurrency(purchasedPackages[0].gia_niem_yet)}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-green-600">
              <span className="font-bold">Ưu đãi giảm giá (-)</span>
              <span className="font-bold">
                -{formatCurrency(purchasedPackages[0].gia_niem_yet - purchasedPackages[0].da_thanh_toan)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-sm font-bold text-secondary">Tổng số tiền trả thẳng</span>
              <span className="font-heading font-extrabold text-primary text-lg">
                {formatCurrency(purchasedPackages[0].da_thanh_toan)}
              </span>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-700">
              <ShieldCheck size={18} className="flex-shrink-0" />
              <span className="font-bold">Đã hoàn tất thanh toán 100%. Không có công nợ phát sinh.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Invoice list History */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
        <h2 className="font-heading font-bold text-lg text-secondary mb-6 flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          Lịch sử hóa đơn giao dịch
        </h2>

        <div className="space-y-4">
          {invoices.map((inv) => (
            <div 
              key={inv.id}
              className="bg-zinc-50 rounded-2xl border border-zinc-150 overflow-hidden hover:bg-white hover:shadow-md transition-all"
            >
              <button 
                onClick={() => setSelectedInvoice(selectedInvoice === inv.id ? null : inv.id)}
                className="w-full text-left p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-secondary text-sm">{inv.id}</span>
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Đã thanh toán
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                      <span>Ngày lập: {inv.date}</span>
                      <span>•</span>
                      <span>Phương thức: {inv.method}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 sm:ml-auto">
                  <div className="text-right">
                    <p className="font-extrabold text-secondary text-sm">{formatCurrency(inv.finalPrice)}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Mã GD: {inv.transactionId}</p>
                  </div>
                  <ChevronRight size={16} className={`text-zinc-300 transition-transform duration-200 ${selectedInvoice === inv.id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Invoice details breakdown */}
              {selectedInvoice === inv.id && (
                <div className="px-5 pb-5 pt-2 border-t border-zinc-150 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-4">
                    <div className="space-y-2">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider block">Chi tiết Hóa đơn</span>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Nội dung:</span>
                        <span className="font-bold text-secondary">{inv.packageName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Giá niêm yết:</span>
                        <span className="font-semibold text-secondary">{formatCurrency(inv.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Giảm giá áp dụng:</span>
                        <span className="font-semibold text-green-600">-{formatCurrency(inv.discount)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider block">Trạng thái thanh toán</span>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Số tiền phải trả:</span>
                        <span className="font-bold text-secondary">{formatCurrency(inv.finalPrice)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Đã thanh toán:</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(inv.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Dư nợ còn lại:</span>
                        <span className="font-bold text-secondary">{formatCurrency(inv.dueAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
