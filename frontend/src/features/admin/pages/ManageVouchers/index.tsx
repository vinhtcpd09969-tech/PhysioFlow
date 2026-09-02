import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Ticket, 
  Plus, 
  Search, 
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
  
  // Filter States: 'all' | 'hoat_dong' | 'tam_dung' | 'het_han'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Loại giảm trừ + Payment & Service types requirements states inside Modal
  const [loaiGiam, setLoaiGiam] = useState<'phan_tram' | 'so_tien_co_dinh'>('phan_tram');
  const [yeuCauThanhToan, setYeuCauThanhToan] = useState<string[]>(['tat_ca']);
  const [tuDongApDung, setTuDongApDung] = useState<boolean>(false);
  const [loaiGoiApDung, setLoaiGoiApDung] = useState<string[]>(['tat_ca']);

  // Modal confirm state
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    if (editingVoucher) {
      setLoaiGiam(editingVoucher.loai_giam || 'phan_tram');
      setYeuCauThanhToan(
        editingVoucher.yeu_cau_thanh_toan?.length ? editingVoucher.yeu_cau_thanh_toan : ['tat_ca']
      );
      setTuDongApDung(!!editingVoucher.tu_dong_ap_dung);
      setLoaiGoiApDung(editingVoucher.loai_goi_ap_dung?.length ? editingVoucher.loai_goi_ap_dung : ['tat_ca']);
    } else {
      setTuDongApDung(false);
      setLoaiGoiApDung(['tat_ca']);
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
      giam_toi_da: data.loai_giam === 'so_tien_co_dinh' ? null : (data.giam_toi_da ? Number(data.giam_toi_da) : null),
      don_hang_toi_thieu: Number(data.don_hang_toi_thieu),
      so_luong_toi_da: data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null,
      yeu_cau_thanh_toan: (loaiGoiApDung.includes('tat_ca') || loaiGoiApDung.includes('LIEU_TRINH'))
        ? (yeuCauThanhToan.length ? yeuCauThanhToan : ['tat_ca'])
        : ['tat_ca'],
      tu_dong_ap_dung: tuDongApDung,
      loai_goi_ap_dung: loaiGoiApDung.length ? loaiGoiApDung : ['tat_ca'],
      trang_thai: editingVoucher?.id ? (editingVoucher.trang_thai || 'hoat_dong') : 'hoat_dong',
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

  const handleToggleVoucherStatus = (v: Voucher) => {
    const isExpired = !!(v.ngay_het_han && new Date(v.ngay_het_han) < new Date());
    const isEffectivelyOn = v.trang_thai === 'hoat_dong' && !isExpired;

    const applyStatusChange = async (nextStatus: 'hoat_dong' | 'tam_dung') => {
      try {
        await api.put(`/admin/vouchers/${v.id}`, { ...v, trang_thai: nextStatus });
        toast.success(nextStatus === 'hoat_dong' ? 'Đã kích hoạt lại mã giảm giá' : 'Đã ngưng sử dụng mã giảm giá');
        fetchVouchers();
      } catch (error) {
        toast.error('Lỗi khi cập nhật trạng thái chiến dịch');
      }
    };

    if (isEffectivelyOn) {
      setConfirmModalData({
        isOpen: true,
        title: 'Ngưng sử dụng mã giảm giá',
        message: 'Bạn có chắc chắn muốn ngưng sử dụng mã giảm giá này không?',
        confirmLabel: 'Ngưng sử dụng',
        onConfirm: () => applyStatusChange('tam_dung'),
      });
    } else {
      setConfirmModalData({
        isOpen: true,
        title: 'Kích hoạt lại mã giảm giá',
        message: 'Bạn có muốn kích hoạt lại mã giảm giá này không?',
        confirmLabel: 'Kích hoạt lại',
        onConfirm: () => {
          if (isExpired) {
            toast.error('Mã giảm giá đã hết hạn sử dụng. Vui lòng tăng thời hạn (ngày hết hạn) trước khi kích hoạt lại.');
            return;
          }
          applyStatusChange('hoat_dong');
        },
      });
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

  const getVoucherStatus = (v: Voucher): 'hoat_dong' | 'tam_dung' | 'het_han' => {
    const isExpired = !!(v.ngay_het_han && new Date(v.ngay_het_han) < new Date());
    if (isExpired || v.trang_thai === 'het_han') return 'het_han';
    if (v.trang_thai === 'tam_dung' || v.trang_thai === 'vo_hieu' || v.dang_kich_hoat === false) return 'tam_dung';
    return 'hoat_dong';
  };

  // Filters logic
  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = v.ma_voucher?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.ten_chien_dich?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const computedStatus = getVoucherStatus(v);
    const matchesStatus = statusFilter === 'all' || computedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics for 4 cards
  const totalCount = vouchers.length;
  const activeCount = vouchers.filter(v => getVoucherStatus(v) === 'hoat_dong').length;
  const pausedCount = vouchers.filter(v => getVoucherStatus(v) === 'tam_dung').length;
  const expiredCount = vouchers.filter(v => getVoucherStatus(v) === 'het_han').length;

  return (
    <div className="space-y-6">
      {/* Unified Stats, Filter Pill & Action Toolbar (Pro Max Toolbar) */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-3.5 md:p-4 border border-slate-150/70 dark:border-zinc-800 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        {/* Left: Filter Pills with expressive icons and counts */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Tất cả */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md scale-[1.02]'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-750'
            }`}
          >
            <span>🎟️ Tất cả</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              statusFilter === 'all' ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
            }`}>
              {totalCount}
            </span>
          </button>

          {/* Đang chạy */}
          <button
            type="button"
            onClick={() => setStatusFilter('hoat_dong')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              statusFilter === 'hoat_dong'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-750'
            }`}
          >
            <span>🔥 Đang chạy</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              statusFilter === 'hoat_dong' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200'
            }`}>
              {activeCount}
            </span>
          </button>

          {/* Tạm ngưng */}
          <button
            type="button"
            onClick={() => setStatusFilter('tam_dung')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              statusFilter === 'tam_dung'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-750'
            }`}
          >
            <span>⏸️ Tạm ngưng</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              statusFilter === 'tam_dung' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
            }`}>
              {pausedCount}
            </span>
          </button>

          {/* Đã hết hạn */}
          <button
            type="button"
            onClick={() => setStatusFilter('het_han')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              statusFilter === 'het_han'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 scale-[1.02]'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-750'
            }`}
          >
            <span>⌛ Đã hết hạn</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              statusFilter === 'het_han' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200'
            }`}>
              {expiredCount}
            </span>
          </button>
        </div>

        {/* Right: Search box & Action Button */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên chiến dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-xs font-bold transition-all placeholder-slate-400 dark:placeholder-zinc-500 shadow-2xs"
            />
          </div>

          <button
            onClick={() => {
              setEditingVoucher({});
              setLoaiGiam('phan_tram');
              setYeuCauThanhToan(['tat_ca']);
              setIsVoucherModalOpen(true);
            }}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Tạo ưu đãi mới</span>
          </button>
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
              formatCurrency={formatCurrency}
              formatCurrencyShort={formatCurrencyShort}
              formatDate={formatDate}
            />
          ))
        ) : (
          <div className="col-span-full bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center text-slate-500 space-y-3">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Chưa thiết lập bất kỳ chiến dịch tiếp thị nào phù hợp</p>
            <p className="text-xs text-slate-400">Vui lòng chọn thẻ thống kê khác hoặc tìm kiếm với từ khóa mới.</p>
          </div>
        )}
      </div>

      {/* --- MODAL CRUD VOUCHER --- */}
      <VoucherFormModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        onSubmit={handleVoucherSubmit}
        editingVoucher={editingVoucher}
        loaiGiam={loaiGiam}
        setLoaiGiam={setLoaiGiam}
        yeuCauThanhToan={yeuCauThanhToan}
        setYeuCauThanhToan={setYeuCauThanhToan}
        tuDongApDung={tuDongApDung}
        setTuDongApDung={setTuDongApDung}
        loaiGoiApDung={loaiGoiApDung}
        setLoaiGoiApDung={setLoaiGoiApDung}
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
                {confirmModalData.confirmLabel || 'Xác nhận lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
