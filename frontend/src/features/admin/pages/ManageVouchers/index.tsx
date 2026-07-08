import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  AlertCircle
} from 'lucide-react';
import api from '../../../../api/axios';

// Local subcomponents & types
import { VoucherCard, Voucher } from './VoucherCard';
import { VoucherFormModal } from './VoucherFormModal';

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ManageVouchers() {
  // Data States
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  
  // UI States
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Partial<Voucher> | null>(null);
  
  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Payment requirements states inside Modal
  const [yeuCauThanhToan, setYeuCauThanhToan] = useState<'tat_ca' | 'tra_thang' | 'tra_gop'>('tat_ca');

  // Modal confirm state
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    if (editingVoucher) {
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

  const handleCopyCode = (code: string, id: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // --- VOUCHER ACTIONS ---
  const handleVoucherSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const payload = {
      ...data,
      gia_tri_giam: Number(data.gia_tri_giam),
      giam_toi_da: data.giam_toi_da ? Number(data.giam_toi_da) : null,
      don_hang_toi_thieu: Number(data.don_hang_toi_thieu),
      so_luong_toi_da: data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null,
      yeu_cau_thanh_toan: yeuCauThanhToan,
    };

    const message = 'Chiến dịch ưu đãi này sẽ áp dụng toàn cục cho tất cả hóa đơn thanh toán.';
    const title = editingVoucher?.id ? 'Xác nhận Cập nhật' : 'Xác nhận Kích hoạt';

    setConfirmModalData({
      isOpen: true,
      title,
      message: `${message} Bạn có chắc chắn muốn hoàn tất thao tác này không?`,
      onConfirm: async () => {
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
      }
    });
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
    
    const isExpired = v.ngay_het_han && new Date(v.ngay_het_han) < new Date();
    const isUpcoming = new Date(v.ngay_bat_dau) > new Date();
    let computedStatus = v.trang_thai;
    if (isExpired) computedStatus = 'het_han';
    else if (isUpcoming && v.trang_thai === 'hoat_dong') computedStatus = 'sap_ra_mat';

    const matchesStatus = statusFilter === 'all' || computedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const activeVouchersCount = vouchers.filter(v => v.trang_thai === 'hoat_dong').length;
  const pausedVouchersCount = vouchers.filter(v => v.trang_thai === 'tam_dung').length;
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
            <p className="text-slate-500 text-sm mt-0.5">Quản lý thống nhất toàn bộ mã giảm giá áp dụng trên hóa đơn.</p>
          </div>
        </div>
        
        <button 
          onClick={() => { 
            setEditingVoucher({}); 
            setYeuCauThanhToan('tat_ca');
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
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mã Voucher tạm dừng</span>
            <span className="text-2xl font-extrabold text-secondary mt-0.5 block">{pausedVouchersCount} Mã</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft-ui flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <Ticket className="w-5 h-5" />
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
          filteredVouchers.map((v) => (
            <VoucherCard
              key={v.id}
              v={v}
              copiedId={copiedId}
              handleCopyCode={handleCopyCode}
              handleToggleVoucherStatus={handleToggleVoucherStatus}
              onEdit={(voucher) => {
                setEditingVoucher(voucher);
                setIsVoucherModalOpen(true);
              }}
              onDelete={handleVoucherDelete}
              formatCurrency={formatCurrency}
              formatCurrencyShort={formatCurrencyShort}
              formatDate={formatDate}
            />
          ))
        ) : (
          <div className="col-span-full bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center text-slate-500 space-y-3">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Chưa thiết lập bất kỳ chiến dịch tiếp thị nào</p>
            <p className="text-xs text-slate-400">Vui lòng điều chỉnh bộ lọc hoặc tạo chiến dịch marketing mới.</p>
          </div>
        )}
      </div>

      {/* --- MODAL CRUD VOUCHER --- */}
      <VoucherFormModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        onSubmit={handleVoucherSubmit}
        editingVoucher={editingVoucher}
        yeuCauThanhToan={yeuCauThanhToan}
        setYeuCauThanhToan={setYeuCauThanhToan}
        formatLocalDate={formatLocalDate}
      />

      {/* Confirmation Dialog Popup */}
      {confirmModalData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-xl">
              <AlertCircle className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{confirmModalData.title}</h3>
            <p className="text-sm text-slate-505 leading-relaxed">{confirmModalData.message}</p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-655 font-semibold hover:bg-slate-50 transition-colors text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModalData.onConfirm();
                  setConfirmModalData(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/95 shadow-md shadow-teal-500/10 transition-colors text-sm"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
