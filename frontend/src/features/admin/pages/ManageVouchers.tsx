import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Ticket, 
  Calendar, 
  Check, 
  Trash2, 
  Edit3, 
  Copy, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  X,
  CheckSquare,
  Square,
  AlertCircle,
  Layers
} from 'lucide-react';
import api from '../../../api/axios';

interface Voucher {
  id: string;
  ma_voucher: string;
  ten_chien_dich: string;
  loai_giam: 'phan_tram' | 'so_tien_co_dinh';
  gia_tri_giam: number;
  giam_toi_da: number | null;
  don_hang_toi_thieu: number;
  ap_dung_cho: 'tat_ca' | 'dich_vu_cu_the' | 'goi_cu_the';
  so_luong_toi_da: number | null;
  so_luong_da_dung: number;
  ngay_bat_dau: string;
  ngay_het_han: string | null;
  trang_thai: 'hoat_dong' | 'tam_dung' | 'sap_ra_mat' | 'het_han';
  tu_dong_ap_dung: boolean;
  yeu_cau_thanh_toan: 'tat_ca' | 'tra_thang' | 'tra_gop';
  dich_vu_ids: string[];
  goi_dich_vu_ids: string[];
}

interface Service {
  id: string;
  ten_dich_vu: string;
  don_gia: number;
}

interface Package {
  id: string;
  ten_goi: string;
  gia_tien: number;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function ManageVouchers() {
  // Data States
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  
  // UI States
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Partial<Voucher> | null>(null);
  
  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Relation Selector States inside Modal
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectorSearch, setSelectorSearch] = useState('');

  // Auto-apply and payment requirements states inside Modal
  const [tuDongApDung, setTuDongApDung] = useState(false);
  const [yeuCauThanhToan, setYeuCauThanhToan] = useState<'tat_ca' | 'tra_thang' | 'tra_gop'>('tat_ca');

  useEffect(() => {
    fetchVouchers();
    fetchServices();
    fetchPackages();
  }, []);

  useEffect(() => {
    if (editingVoucher) {
      setTuDongApDung(editingVoucher.tu_dong_ap_dung || false);
      setYeuCauThanhToan(editingVoucher.yeu_cau_thanh_toan || 'tat_ca');
    }
  }, [editingVoucher]);

  const fetchVouchers = async () => {
    try {
      const res = await api.get('/admin/vouchers');
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách voucher:', error);
      toast.error('Không thể kết nối với server để lấy danh sách voucher');
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/admin/services');
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách dịch vụ:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await api.get('/admin/packages');
      setPackages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách gói:', error);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // --- VOUCHER ACTIONS ---
  const handleVoucherSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const payload = {
      ...data,
      gia_tri_giam: Number(data.gia_tri_giam),
      giam_toi_da: data.giam_toi_da ? Number(data.giam_toi_da) : null,
      don_hang_toi_thieu: Number(data.don_hang_toi_thieu),
      so_luong_toi_da: data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null,
      tu_dong_ap_dung: tuDongApDung,
      yeu_cau_thanh_toan: yeuCauThanhToan,
      dich_vu_ids: data.ap_dung_cho === 'dich_vu_cu_the' ? selectedServices : [],
      goi_dich_vu_ids: data.ap_dung_cho === 'goi_cu_the' ? selectedPackages : [],
    };

    try {
      if (editingVoucher?.id) {
        await api.put(`/admin/vouchers/${editingVoucher.id}`, payload);
        toast.success('Cập nhật Chiến dịch thành công!');
      } else {
        await api.post('/admin/vouchers', payload);
        toast.success('Tạo Chiến dịch mới thành công!');
      }
      setIsVoucherModalOpen(false);
      setEditingVoucher(null);
      fetchVouchers();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Lỗi khi lưu chiến dịch';
      toast.error(msg);
    }
  };

  const handleToggleVoucherStatus = async (v: Voucher) => {
    const nextStatus = v.trang_thai === 'hoat_dong' ? 'tam_dung' : 'hoat_dong';
    try {
      await api.put(`/admin/vouchers/${v.id}`, {
        ...v,
        trang_thai: nextStatus
      });
      toast.success(`Đã chuyển trạng thái sang ${nextStatus === 'hoat_dong' ? 'Hoạt động' : 'Tạm dừng'}`);
      fetchVouchers();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái chiến dịch');
    }
  };

  const handleVoucherDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chiến dịch ưu đãi này không?')) return;
    try {
      await api.delete(`/admin/vouchers/${id}`);
      toast.success('Đã xóa ưu đãi thành công');
      fetchVouchers();
    } catch (error) {
      toast.error('Lỗi khi xóa ưu đãi');
    }
  };

  // --- HELPERS ---
  const formatCurrency = (amount: number) => {
    return currencyFormatter.format(amount);
  };

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000) {
      return `${amount / 1000000}M`;
    }
    if (amount >= 1000) {
      return `${amount / 1000}K`;
    }
    return amount.toString();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Không giới hạn';
    return new Date(dateStr).toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  // Filters logic
  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = v.ma_voucher?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.ten_chien_dich?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status Filter
    const isExpired = v.ngay_het_han && new Date(v.ngay_het_han) < new Date();
    const isUpcoming = new Date(v.ngay_bat_dau) > new Date();
    let computedStatus = v.trang_thai;
    if (isExpired) computedStatus = 'het_han';
    else if (isUpcoming && v.trang_thai === 'hoat_dong') computedStatus = 'sap_ra_mat';

    const matchesStatus = statusFilter === 'all' || computedStatus === statusFilter;

    // Type Filter
    let matchesType = true;
    if (typeFilter === 'auto') matchesType = v.tu_dong_ap_dung === true;
    else if (typeFilter === 'manual') matchesType = v.tu_dong_ap_dung === false;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const activeVouchersCount = vouchers.filter(v => v.trang_thai === 'hoat_dong' && !v.tu_dong_ap_dung).length;
  const activeAutoPromosCount = vouchers.filter(v => v.trang_thai === 'hoat_dong' && v.tu_dong_ap_dung).length;
  const totalUsedCount = vouchers.reduce((acc, v) => acc + (v.so_luong_da_dung || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-soft-ui">
        <div className="flex items-center gap-4">
          <div className="bg-primary-container p-3.5 rounded-2xl text-primary">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-secondary font-heading tracking-tight">Chiến dịch Marketing & Ưu đãi</h1>
            <p className="text-slate-500 text-sm mt-0.5">Quản lý thống nhất toàn bộ mã giảm giá và ưu đãi chiết khấu tự động.</p>
          </div>
        </div>
        
        <button 
          onClick={() => { 
            setEditingVoucher({}); 
            setSelectedServices([]);
            setSelectedPackages([]);
            setSelectorSearch('');
            setIsVoucherModalOpen(true); 
          }}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold shadow-soft-button hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 text-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Tạo ưu đãi / mã mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft-ui flex items-center gap-4">
          <div className="bg-teal-50 text-teal-600 p-3 rounded-xl">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mã Voucher đang mở</span>
            <span className="text-2xl font-extrabold text-secondary mt-0.5 block">{activeVouchersCount} Mã</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft-ui flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ưu đãi Tự động chạy</span>
            <span className="text-2xl font-extrabold text-secondary mt-0.5 block">{activeAutoPromosCount} Chiến dịch</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft-ui flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tổng lượt đã áp dụng</span>
            <span className="text-2xl font-extrabold text-secondary mt-0.5 block">{totalUsedCount} Lượt</span>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft-ui flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-grow md:flex-initial md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên chiến dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all bg-slate-50/50"
            />
          </div>

          {/* Type Selector Filter */}
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all bg-slate-50/50 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả hình thức</option>
              <option value="auto">Chỉ ưu đãi Tự động</option>
              <option value="manual">Chỉ mã nhập tay (Voucher)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all bg-slate-50/50 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="hoat_dong">Đang chạy</option>
              <option value="tam_dung">Tạm dừng</option>
              <option value="sap_ra_mat">Sắp diễn ra</option>
              <option value="het_han">Đã hết hạn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unified Voucher Card List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredVouchers.length > 0 ? (
          filteredVouchers.map((v) => {
            const capacityPercent = v.so_luong_toi_da ? (v.so_luong_da_dung / v.so_luong_toi_da) * 100 : 0;
            const isExpired = v.ngay_het_han && new Date(v.ngay_het_han) < new Date();
            const isUpcoming = new Date(v.ngay_bat_dau) > new Date();
            
            let computedStatus = v.trang_thai;
            if (isExpired) computedStatus = 'het_han';
            else if (isUpcoming && v.trang_thai === 'hoat_dong') computedStatus = 'sap_ra_mat';

            return (
              <div 
                key={v.id} 
                className="group relative bg-white border border-slate-200 rounded-3xl flex flex-col sm:flex-row shadow-soft-ui hover:shadow-soft-ui-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden min-h-[180px]"
              >
                {/* Left Side of Ticket (Coupon Tag) */}
                <div className={`sm:w-44 border-b sm:border-b-0 sm:border-r border-dashed border-slate-200/80 p-6 flex flex-col items-center justify-center relative min-h-[140px] rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl ${
                  v.tu_dong_ap_dung 
                    ? 'bg-gradient-to-br from-indigo-500/5 to-teal-500/10' 
                    : 'bg-gradient-to-br from-teal-500/5 to-primary/10'
                }`}>
                  
                  {/* Circle cutouts for ticket look */}
                  <div className="hidden sm:block absolute -top-3.5 -right-3.5 w-7 h-7 bg-background border border-slate-200 rounded-full z-10" />
                  <div className="hidden sm:block absolute -bottom-3.5 -right-3.5 w-7 h-7 bg-background border border-slate-200 rounded-full z-10" />
                  
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest mb-1.5 font-heading ${
                    v.tu_dong_ap_dung ? 'text-indigo-600' : 'text-primary'
                  }`}>
                    {v.tu_dong_ap_dung ? 'ƯU ĐÃI TỰ ĐỘNG' : 'MÃ GIẢM GIÁ'}
                  </span>
                  <div className="text-3xl font-black text-secondary font-heading tracking-tight flex items-baseline gap-0.5">
                    {v.loai_giam === 'phan_tram' ? (
                      <>
                        {v.gia_tri_giam}<span className="text-lg font-bold text-primary">%</span>
                      </>
                    ) : (
                      <span className="text-2xl">{formatCurrencyShort(v.gia_tri_giam)}</span>
                    )}
                  </div>
                  {v.giam_toi_da && (
                    <span className="text-[9px] text-slate-500 font-semibold mt-1 text-center">
                      Tối đa {formatCurrencyShort(v.giam_toi_da)}
                    </span>
                  )}

                  {/* Copiable Code pill or Sparkles auto indication */}
                  {v.tu_dong_ap_dung ? (
                    <div className="mt-4 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 shadow-sm flex items-center gap-1.5 select-none">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                      Không cần nhập mã
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleCopyCode(v.ma_voucher, v.id)}
                      className={`mt-4 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all select-none ${
                        copiedId === v.id 
                          ? 'bg-emerald-500 text-white border border-emerald-500' 
                          : 'bg-white text-teal-600 border border-teal-200/80 hover:bg-teal-50'
                      }`}
                    >
                      {copiedId === v.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-teal-500/70" />}
                      {v.ma_voucher}
                    </div>
                  )}
                </div>

                {/* Right Side of Ticket (Voucher details) */}
                <div className="flex-1 p-6 flex flex-col justify-between bg-white sm:rounded-r-3xl">
                  <div>
                    {/* Badge Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                          computedStatus === 'hoat_dong' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          computedStatus === 'tam_dung' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          computedStatus === 'sap_ra_mat' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {computedStatus === 'hoat_dong' ? 'Đang chạy' :
                           computedStatus === 'tam_dung' ? 'Tạm dừng' :
                           computedStatus === 'sap_ra_mat' ? 'Sắp hoạt động' : 'Hết hạn'}
                        </span>

                        {v.tu_dong_ap_dung && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" /> Tự động áp dụng
                          </span>
                        )}

                        {v.yeu_cau_thanh_toan !== 'tat_ca' && (
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                            v.yeu_cau_thanh_toan === 'tra_thang' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {v.yeu_cau_thanh_toan === 'tra_thang' ? 'Chỉ Trả thẳng 100%' : 'Chỉ Trả góp'}
                          </span>
                        )}
                      </div>

                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleVoucherStatus(v)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          v.trang_thai === 'hoat_dong' ? 'bg-teal-500' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            v.trang_thai === 'hoat_dong' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-primary transition-colors">{v.ten_chien_dich || 'Chiến dịch ưu đãi'}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Áp dụng cho đơn hàng từ <span className="font-semibold text-slate-700">{formatCurrency(v.don_hang_toi_thieu)}</span>.
                    </p>

                    {/* Display targeted services or packages */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {v.ap_dung_cho === 'tat_ca' && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Áp dụng cho toàn bộ dịch vụ & gói</span>
                      )}
                      {v.ap_dung_cho === 'dich_vu_cu_the' && (
                        <>
                          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded font-medium">Dịch vụ áp dụng:</span>
                          {v.dich_vu_ids?.map(id => {
                            const s = services.find(srv => srv.id === id);
                            return s ? (
                              <span key={id} className="text-[9px] bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded">{s.ten_dich_vu}</span>
                            ) : null;
                          })}
                        </>
                      )}
                      {v.ap_dung_cho === 'goi_cu_the' && (
                        <>
                          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded font-medium">Gói áp dụng:</span>
                          {v.goi_dich_vu_ids?.map(id => {
                            const p = packages.find(pkg => pkg.id === id);
                            return p ? (
                              <span key={id} className="text-[9px] bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded">{p.ten_goi}</span>
                            ) : null;
                          })}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Details */}
                  <div className="mt-4 pt-4 border-t border-slate-100/80 space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Lượt đã dùng:</span>
                        <span className="font-semibold text-slate-700">
                          {v.so_luong_da_dung} / {v.so_luong_toi_da || '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            v.trang_thai === 'hoat_dong' ? 'bg-primary' : 'bg-slate-300'
                          }`}
                          style={{ width: `${v.so_luong_toi_da ? Math.min(capacityPercent, 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        <span>Hạn dùng: {formatDate(v.ngay_bat_dau)} - {v.ngay_het_han ? formatDate(v.ngay_het_han) : 'Vô thời hạn'}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { 
                            setEditingVoucher(v);
                            setSelectedServices(v.dich_vu_ids || []);
                            setSelectedPackages(v.goi_dich_vu_ids || []);
                            setSelectorSearch('');
                            setIsVoucherModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVoucherDelete(v.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center text-slate-500 space-y-3">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Chưa thiết lập bất kỳ chiến dịch tiếp thị nào</p>
            <p className="text-xs text-slate-400">Vui lòng điều chỉnh bộ lọc hoặc tạo chiến dịch marketing mới.</p>
          </div>
        )}
      </div>

      {/* --- MODAL CRUD VOUCHER --- */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-800">{editingVoucher?.id ? 'Chỉnh sửa Ưu đãi / Voucher' : 'Thiết lập chiến dịch mới'}</h2>
              </div>
              <button 
                onClick={() => setIsVoucherModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleVoucherSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="ma_voucher" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mã Voucher {tuDongApDung ? '(Tự sinh tự động)' : '*'}
                  </label>
                  <input 
                    id="ma_voucher"
                    name="ma_voucher"
                    defaultValue={editingVoucher?.ma_voucher}
                    required={!tuDongApDung}
                    disabled={tuDongApDung}
                    placeholder={tuDongApDung ? "Mã tự động phát sinh ẩn tại DB" : "VD: CHUNGHE2026"}
                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all ${
                      tuDongApDung ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-slate-50/30'
                    }`}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="ten_chien_dich" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên chiến dịch *</label>
                  <input 
                    id="ten_chien_dich"
                    name="ten_chien_dich"
                    defaultValue={editingVoucher?.ten_chien_dich}
                    required
                    placeholder="VD: Chiết khấu thanh toán 10% trả thẳng"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
                  />
                </div>
                
                <div>
                  <label htmlFor="loai_giam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Loại giảm trừ</label>
                  <select 
                    id="loai_giam"
                    name="loai_giam"
                    defaultValue={editingVoucher?.loai_giam || 'phan_tram'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer"
                  >
                    <option value="phan_tram">Phần trăm (%)</option>
                    <option value="so_tien_co_dinh">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gia_tri_giam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Giá trị giảm *</label>
                  <input 
                    id="gia_tri_giam"
                    name="gia_tri_giam"
                    type="number"
                    defaultValue={editingVoucher?.gia_tri_giam}
                    required
                    placeholder="Ví dụ: 10 (%) hoặc 100000 (đ)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30 font-semibold text-secondary"
                  />
                </div>

                <div>
                  <label htmlFor="giam_toi_da" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Giảm tối đa (VNĐ)</label>
                  <input 
                    id="giam_toi_da"
                    name="giam_toi_da"
                    type="number"
                    defaultValue={editingVoucher?.giam_toi_da || ''}
                    placeholder="Để trống nếu không giới hạn"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
                  />
                </div>
                <div>
                  <label htmlFor="don_hang_toi_thieu" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Đơn tối thiểu (VNĐ)</label>
                  <input 
                    id="don_hang_toi_thieu"
                    name="don_hang_toi_thieu"
                    type="number"
                    defaultValue={editingVoucher?.don_hang_toi_thieu || 0}
                    placeholder="Ví dụ: 200000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
                  />
                </div>

                <div>
                  <label htmlFor="so_luong_toi_da" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số lượng tối đa áp dụng</label>
                  <input 
                    id="so_luong_toi_da"
                    name="so_luong_toi_da"
                    type="number"
                    defaultValue={editingVoucher?.so_luong_toi_da || ''}
                    placeholder="Để trống nếu không giới hạn"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
                  />
                </div>
                <div>
                  <label htmlFor="trang_thai" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trạng thái hoạt động</label>
                  <select 
                    id="trang_thai"
                    name="trang_thai"
                    defaultValue={editingVoucher?.trang_thai || 'hoat_dong'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer"
                  >
                    <option value="hoat_dong">Kích hoạt</option>
                    <option value="tam_dung">Tạm dừng</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ngay_bat_dau" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày bắt đầu *</label>
                  <input 
                    id="ngay_bat_dau"
                    name="ngay_bat_dau"
                    type="date"
                    defaultValue={editingVoucher?.ngay_bat_dau ? editingVoucher.ngay_bat_dau.split('T')[0] : new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
                  />
                </div>
                <div>
                  <label htmlFor="ngay_het_han" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày hết hạn</label>
                  <input 
                    id="ngay_het_han"
                    name="ngay_het_han"
                    type="date"
                    defaultValue={editingVoucher?.ngay_het_han ? editingVoucher.ngay_het_han.split('T')[0] : ''}
                    placeholder="Không giới hạn"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
                  />
                </div>

                {/* Advanced configuration for auto-apply / payment methods */}
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                    <div>
                      <span className="block text-xs font-bold text-slate-700">Tự động áp dụng</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">Hệ thống tự tính không cần gõ mã</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTuDongApDung(!tuDongApDung)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        tuDongApDung ? 'bg-indigo-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          tuDongApDung ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label htmlFor="yeu_cau_thanh_toan" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hình thức yêu cầu</label>
                    <select 
                      id="yeu_cau_thanh_toan"
                      value={yeuCauThanhToan}
                      onChange={(e) => setYeuCauThanhToan(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer"
                    >
                      <option value="tat_ca">Tất cả hình thức</option>
                      <option value="tra_thang">Chỉ áp dụng khi Trả thẳng 100%</option>
                      <option value="tra_gop">Chỉ áp dụng khi Trả góp</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scope applicability */}
              <div className="border-t border-slate-100 pt-6">
                <label htmlFor="ap_dung_cho" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phạm vi áp dụng</label>
                <select 
                  id="ap_dung_cho"
                  name="ap_dung_cho"
                  defaultValue={editingVoucher?.ap_dung_cho || 'tat_ca'}
                  onChange={(e) => {
                    setEditingVoucher(prev => ({
                      ...prev,
                      ap_dung_cho: e.target.value as any
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer"
                >
                  <option value="tat_ca">Toàn bộ danh mục & Gói</option>
                  <option value="dich_vu_cu_the">Chỉ định một số Dịch vụ cụ thể</option>
                  <option value="goi_cu_the">Chỉ định một số Gói điều trị cụ thể</option>
                </select>
              </div>

              {/* Dynamic Relation selection panel */}
              {editingVoucher?.ap_dung_cho === 'dich_vu_cu_the' && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Chọn dịch vụ áp dụng</span>
                    <input 
                      type="text"
                      placeholder="Tìm dịch vụ..."
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 focus:border-primary outline-none text-xs w-44 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {services
                      .filter(s => s.ten_dich_vu.toLowerCase().includes(selectorSearch.toLowerCase()))
                      .map(s => {
                        const isChecked = selectedServices.includes(s.id);
                        return (
                          <div 
                            key={s.id}
                            onClick={() => {
                              setSelectedServices(prev => 
                                isChecked ? prev.filter(id => id !== s.id) : [...prev, s.id]
                              );
                            }}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all text-xs ${
                              isChecked 
                                ? 'bg-teal-50 border-primary text-primary font-semibold' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-slate-300" />}
                            <span className="truncate">{s.ten_dich_vu}</span>
                          </div>
                        );
                      })}
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-primary" />
                      <span>Đã chọn <strong className="text-primary font-bold">{selectedServices.length}</strong> dịch vụ.</span>
                    </div>
                  )}
                </div>
              )}

              {editingVoucher?.ap_dung_cho === 'goi_cu_the' && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Chọn gói dịch vụ áp dụng</span>
                    <input 
                      type="text"
                      placeholder="Tìm gói..."
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 focus:border-primary outline-none text-xs w-44 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {packages
                      .filter(p => p.ten_goi.toLowerCase().includes(selectorSearch.toLowerCase()))
                      .map(p => {
                        const isChecked = selectedPackages.includes(p.id);
                        return (
                          <div 
                            key={p.id}
                            onClick={() => {
                              setSelectedPackages(prev => 
                                isChecked ? prev.filter(id => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all text-xs ${
                              isChecked 
                                ? 'bg-teal-50 border-primary text-primary font-semibold' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-slate-300" />}
                            <span className="truncate">{p.ten_goi}</span>
                          </div>
                        );
                      })}
                  </div>
                  {selectedPackages.length > 0 && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-primary" />
                      <span>Đã chọn <strong className="text-primary font-bold">{selectedPackages.length}</strong> gói áp dụng.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3.5">
                <button 
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/95 shadow-lg shadow-teal-500/20 transition-all text-sm"
                >
                  {editingVoucher?.id ? 'Lưu thay đổi' : 'Kích hoạt ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
