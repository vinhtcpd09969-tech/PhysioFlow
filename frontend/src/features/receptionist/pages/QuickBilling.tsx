import { useReducer, useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  Info,
  Calendar,
  User,
  Activity,
  TrendingDown,
  Gift,
  Coins,
  Receipt,
  Sparkles,
  Users
} from 'lucide-react';

interface BillingState {
  lichDatId: string;
  soTienNhan: string;
  phuongThuc: string;
  hoaDon: any | null;
  loading: boolean;
}

type BillingAction = 
  | { type: 'SET_FIELD', field: keyof BillingState, value: any }
  | { type: 'SET_HOA_DON', hoaDon: any }
  | { type: 'RESET_HOA_DON' }
  | { type: 'SET_LOADING', loading: boolean };

function billingReducer(state: BillingState, action: BillingAction): BillingState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_HOA_DON':
      return { ...state, hoaDon: action.hoaDon, loading: false };
    case 'RESET_HOA_DON':
      return { ...state, hoaDon: null, soTienNhan: '', lichDatId: '' };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function QuickBilling() {
  const [state, dispatch] = useReducer(billingReducer, {
    lichDatId: '',
    soTienNhan: '',
    phuongThuc: 'tien_mat',
    hoaDon: null,
    loading: false
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Tab & Package states
  const [activeTab, setActiveTab] = useState<'single' | 'package'>('package');
  const [packages, setPackages] = useState<any[]>([]);
  const [completedConsultations, setCompletedConsultations] = useState<any[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [loaiThanhToan, setLoaiThanhToan] = useState<'tra_thang' | 'tra_gop'>('tra_thang');
  const [maVoucher, setMaVoucher] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [calculatedData, setCalculatedData] = useState<any | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [feedbackLyDo, setFeedbackLyDo] = useState('');
  const [vouchers, setVouchers] = useState<any[]>([]);

  // Find active auto-applied vouchers targeted to this package
  const activePromo = useMemo(() => {
    if (!selectedPackage || !vouchers.length) return null;

    const now = new Date();

    // Find auto-applied voucher for straight payment (tra_thang)
    const straightPromo = vouchers.find((v: any) => {
      const startDate = new Date(v.ngay_bat_dau);
      const endDate = v.ngay_het_han ? new Date(v.ngay_het_han) : null;
      const isTimeActive = now >= startDate && (!endDate || now <= endDate);

      return v.trang_thai === 'hoat_dong' &&
        v.tu_dong_ap_dung === true &&
        isTimeActive &&
        (v.yeu_cau_thanh_toan === 'tra_thang' || v.yeu_cau_thanh_toan === 'tat_ca') &&
        (v.ap_dung_cho === 'tat_ca' || (Array.isArray(v.goi_dich_vu_ids) && v.goi_dich_vu_ids.includes(selectedPackage.id)));
    }) || null;

    // Find auto-applied voucher for installment (tra_gop)
    const installmentPromo = vouchers.find((v: any) => {
      const startDate = new Date(v.ngay_bat_dau);
      const endDate = v.ngay_het_han ? new Date(v.ngay_het_han) : null;
      const isTimeActive = now >= startDate && (!endDate || now <= endDate);

      return v.trang_thai === 'hoat_dong' &&
        v.tu_dong_ap_dung === true &&
        isTimeActive &&
        (v.yeu_cau_thanh_toan === 'tra_gop' || v.yeu_cau_thanh_toan === 'tat_ca') &&
        (v.ap_dung_cho === 'tat_ca' || (Array.isArray(v.goi_dich_vu_ids) && v.goi_dich_vu_ids.includes(selectedPackage.id)));
    }) || null;

    if (!straightPromo && !installmentPromo) return null;

    return {
      straightPromo,
      installmentPromo
    };
  }, [selectedPackage, vouchers]);

  const isLocked = !!new URLSearchParams(location.search).get('lich_dat_id');

  // Quick cash list
  const quickCashOptions = [200000, 500000, 1000000, 2000000, 5000000];

  useEffect(() => {
    fetchPackageBillingData();
  }, []);

  const fetchPackageBillingData = async () => {
    try {
      const [pkgRes, consRes, vouchersRes] = await Promise.all([
        axiosInstance.get('/receptionist/packages'),
        axiosInstance.get('/receptionist/completed-consultations'),
        axiosInstance.get('/receptionist/auto-vouchers')
      ]);
      setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : []);
      setCompletedConsultations(Array.isArray(consRes.data) ? consRes.data : []);
      setVouchers(Array.isArray(vouchersRes.data) ? vouchersRes.data : []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu quầy thanh toán:', err);
    }
  };

  // Auto select from redirect parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryLichDatId = params.get('lich_dat_id');
    if (queryLichDatId && completedConsultations.length > 0) {
      const matched = completedConsultations.find(c => String(c.id) === String(queryLichDatId));
      if (matched) {
        setSelectedConsultation(matched);
        setActiveTab('package'); // Always route to package tab
        
        // Auto-select recommended package if it is loaded
        if (matched.khuyen_nghi_goi_id && packages.length > 0) {
          const matchedPkg = packages.find(p => String(p.id) === String(matched.khuyen_nghi_goi_id));
          if (matchedPkg) {
            setSelectedPackage(matchedPkg);
          }
        }
      }
    }
  }, [completedConsultations, packages, location.search]);

  // Automatically load invoice for single service checkout if patient is fixed
  useEffect(() => {
    if (activeTab === 'single' && selectedConsultation && !state.hoaDon && !state.loading) {
      const autoLoadSingleInvoice = async () => {
        dispatch({ type: 'SET_LOADING', loading: true });
        const toastId = toast.loading('Đang tự động lập hóa đơn dịch vụ lẻ...');
        try {
          const res = await axiosInstance.post('/receptionist/billing', { lich_dat_id: selectedConsultation.id });
          dispatch({ type: 'SET_HOA_DON', hoaDon: res.data.hoa_don });
          toast.success('Đã lập hóa đơn dịch vụ lẻ thành công!', { id: toastId });
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Lỗi lập hóa đơn dịch vụ lẻ', { id: toastId });
          dispatch({ type: 'SET_LOADING', loading: false });
        }
      };
      autoLoadSingleInvoice();
    }
  }, [activeTab, selectedConsultation, state.hoaDon, state.loading]);

  // Run calculation when package, voucher, or payment type changes
  useEffect(() => {
    if (activeTab === 'package' && selectedPackage) {
      triggerCalculation();
    }
  }, [selectedPackage, loaiThanhToan, appliedVoucher, activeTab]);

  const triggerCalculation = async () => {
    setCalculating(true);
    try {
      const res = await axiosInstance.post('/receptionist/billing/calculate', {
        item_type: 'goi',
        item_id: selectedPackage.id,
        loai_thanh_toan: loaiThanhToan,
        ma_voucher: maVoucher || null
      });
      setCalculatedData(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi tính tiền gói trị liệu');
      setAppliedVoucher(null);
      setMaVoucher('');
    } finally {
      setCalculating(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!selectedPackage) {
      toast.error('Vui lòng chọn gói trị liệu trước khi áp dụng voucher!');
      return;
    }
    if (!maVoucher.trim()) {
      toast.error('Vui lòng nhập mã voucher!');
      return;
    }
    const toastId = toast.loading('Đang xác thực voucher...');
    try {
      const res = await axiosInstance.post('/receptionist/billing/calculate', {
        item_type: 'goi',
        item_id: selectedPackage.id,
        loai_thanh_toan: loaiThanhToan,
        ma_voucher: maVoucher
      });
      setCalculatedData(res.data);
      setAppliedVoucher({ ma_voucher: maVoucher, so_tien_giam: res.data.so_tien_giam_voucher });
      toast.success('Áp dụng voucher thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện', { id: toastId });
      setAppliedVoucher(null);
      setMaVoucher('');
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setMaVoucher('');
    toast.success('Đã hủy áp dụng voucher');
  };

  // Single appointment payment flow
  const handleTaoHoaDonSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Đang tìm kiếm lịch hẹn & tạo hóa đơn...');
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await axiosInstance.post('/receptionist/billing', { lich_dat_id: state.lichDatId });
      dispatch({ type: 'SET_HOA_DON', hoaDon: res.data.hoa_don });
      toast.success('Đã lập hóa đơn thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi tra cứu lịch khám. Vui lòng kiểm tra lại mã!', { id: toastId });
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  // Handle transaction payment submission
  const handleThanhToanSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.hoaDon) return;
    
    const totalAmount = Number(state.hoaDon.tong_tien_thanh_toan);
    const receivedAmount = Number(state.soTienNhan);
    if (state.phuongThuc === 'tien_mat' && receivedAmount < totalAmount) {
      toast.error('Số tiền nhận của khách hàng chưa đủ để thanh toán!');
      return;
    }

    if (selectedConsultation && !feedbackLyDo.trim()) {
      toast.error('Vui lòng nhập lý do khách không hài lòng về gói!');
      return;
    }

    const toastId = toast.loading('Đang ghi nhận giao dịch thanh toán...');
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: state.hoaDon.id,
        so_tien_nhan: state.phuongThuc === 'tien_mat' ? state.soTienNhan : totalAmount.toString(),
        phuong_thuc: state.phuongThuc,
        ghi_chu: feedbackLyDo ? `Khách không hài lòng gói: ${feedbackLyDo}` : undefined
      });
      toast.success('Giao dịch thanh toán y khoa đã hoàn tất thành công!', { id: toastId });
      setTimeout(() => {
        setFeedbackLyDo('');
        setSelectedConsultation(null);
        dispatch({ type: 'RESET_HOA_DON' });
        navigate('/admin/finance');
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi ghi nhận thanh toán.', { id: toastId });
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  // Package payment submission flow
  const handleThanhToanPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation) {
      toast.error('Vui lòng chọn khách hàng/buổi khám hoàn thành đầu tiên!');
      return;
    }
    if (!selectedPackage) {
      toast.error('Vui lòng chọn gói trị liệu chỉ định!');
      return;
    }
    if (!calculatedData) return;

    const tongCanThu = loaiThanhToan === 'tra_gop' ? Number(calculatedData.so_tien_dot_1) : Number(calculatedData.tong_tien_thanh_toan);
    const receivedAmount = Number(state.soTienNhan);

    if (state.phuongThuc === 'tien_mat' && receivedAmount < tongCanThu) {
      toast.error(`Số tiền nhận chưa đủ! Yêu cầu tối thiểu ${formatCurrency(tongCanThu)}`);
      return;
    }

    const toastId = toast.loading('Đang lập hóa đơn & đăng ký gói trị liệu...');
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      // 1. Create package invoice direct
      const invoiceRes = await axiosInstance.post('/receptionist/billing/create', {
        khach_hang_id: selectedConsultation.khach_hang_id,
        item_type: 'goi',
        item_id: selectedPackage.id,
        loai_thanh_toan: loaiThanhToan,
        ma_voucher: appliedVoucher ? appliedVoucher.ma_voucher : null,
        lich_dat_id: selectedConsultation.id,
        ho_ten_khach: selectedConsultation.ten_khach_hang,
        so_dien_thoai: selectedConsultation.sdt_khach_hang
      });

      const hoaDonMoi = invoiceRes.data.hoa_don;

      // 2. Process payment transaction
      await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: hoaDonMoi.id,
        so_tien_nhan: state.phuongThuc === 'tien_mat' ? state.soTienNhan : tongCanThu.toString(),
        phuong_thuc: state.phuongThuc
      });

      toast.success('Đăng ký & Thanh toán gói trị liệu thành công!', { id: toastId });
      setTimeout(() => {
        // Refresh listings
        fetchPackageBillingData();
        setSelectedConsultation(null);
        setSelectedPackage(null);
        setCalculatedData(null);
        setAppliedVoucher(null);
        setMaVoucher('');
        dispatch({ type: 'RESET_HOA_DON' });
        navigate('/admin/finance');
      }, 1200);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi xử lý thanh toán gói', { id: toastId });
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const formatCurrency = (amount: number) => {
    return currencyFormatter.format(amount);
  };

  const handleSelectCompletedConsultation = (cons: any) => {
    setSelectedConsultation(cons);
    toast.success(`Đã chọn khách hàng: ${cons.ten_khach_hang}`);
  };

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    toast.success(`Đã chọn gói: ${pkg.ten_goi}`);
  };

  const { soTienNhan, phuongThuc, hoaDon, loading } = state;

  // Change computation logic based on active tab
  const getChangeMath = () => {
    let required = 0;
    if (activeTab === 'single') {
      required = hoaDon ? Number(hoaDon.tong_tien_thanh_toan) : 0;
    } else {
      if (calculatedData) {
        required = loaiThanhToan === 'tra_gop' ? Number(calculatedData.so_tien_dot_1) : Number(calculatedData.tong_tien_thanh_toan);
      }
    }
    const received = Number(soTienNhan) || 0;
    return {
      required,
      change: received - required,
      isSufficient: received >= required
    };
  };

  const math = getChangeMath();

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-150/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full pointer-events-none"></div>
        <div className="space-y-1">
          <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Quầy Thu Ngân & Tài Chính
          </span>
          <h2 className="text-2xl font-black text-secondary flex items-center gap-2.5">
            <Coins className="text-primary" size={28} />
            Hệ Thống Lập Hóa Đơn Trị Liệu
          </h2>
          <p className="text-zinc-500 text-xs font-semibold">Lập biên lai khám, nâng cấp gói điều trị, quản lý ưu đãi và dòng tiền lâm sàng.</p>
        </div>
        
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-primary transition-all text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Bàn làm việc Admin
        </button>
      </div>

      {/* Tabs Selection - Soft Premium Clinical Switch */}
      <div className="flex bg-white p-1.5 rounded-xl border border-zinc-200 shadow-sm max-w-md">
        <button
          onClick={() => {
            setActiveTab('package');
            dispatch({ type: 'RESET_HOA_DON' });
            setFeedbackLyDo('');
          }}
          className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'package' ? 'bg-primary text-white shadow-sm' : 'text-zinc-500 hover:text-secondary'
          }`}
        >
          <Sparkles size={14} /> 1. Thanh toán Gói trị liệu
        </button>
        <button
          onClick={() => {
            setActiveTab('single');
            setSelectedPackage(null);
            setCalculatedData(null);
            setFeedbackLyDo('');
          }}
          className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'single' ? 'bg-primary text-white shadow-sm' : 'text-zinc-500 hover:text-secondary'
          }`}
        >
          <Receipt size={14} /> 2. Thanh toán dịch vụ lẻ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Interactive form Column */}
        <div className="lg:col-span-7 space-y-6">

          {activeTab === 'package' && (
            <>
              {/* Step A: Selected customer detail card or completed consultations list */}
              {selectedConsultation ? (
                <div className="bg-white rounded-2xl border border-zinc-150 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Bệnh nhân đang thanh toán
                      </span>
                      <h3 className="font-heading font-black text-secondary text-sm">Thông tin cơ bản</h3>
                    </div>
                    <Users className="text-emerald-500 size-5" />
                  </div>
                  <div className="bg-emerald-50/20 border border-emerald-100 p-4.5 rounded-xl flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold shadow-inner">
                        👤
                      </div>
                      <div>
                        <h4 className="text-secondary font-black text-xs">{selectedConsultation.ten_khach_hang}</h4>
                        <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">SĐT: {selectedConsultation.sdt_khach_hang} | Mã ca: {selectedConsultation.ma_lich_dat}</p>
                        <p className="text-[10px] text-primary font-bold mt-0.5">Chỉ định: {selectedConsultation.ten_dich_vu}</p>
                      </div>
                    </div>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConsultation(null);
                          setSelectedPackage(null);
                          setCalculatedData(null);
                          setAppliedVoucher(null);
                          setMaVoucher('');
                        }}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 hover:bg-rose-100/50 transition-all active:scale-95"
                      >
                        Thay đổi khách
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-150 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Bước A: Chọn buổi khám đã hoàn thành
                      </span>
                      <h3 className="font-heading font-black text-secondary text-sm">Danh sách chẩn đoán & khám buổi đầu tiên</h3>
                    </div>
                    <Users className="text-amber-500 size-5" />
                  </div>

                  {completedConsultations.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                      <p className="text-zinc-400 text-xs font-semibold">Không có lịch hẹn khám hoàn thành chờ lập gói hôm nay.</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Lễ tân có thể kiểm tra trạng thái bệnh nhân trên Bảng điều phối.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                      {completedConsultations.map((cons) => {
                        const isSelected = selectedConsultation?.id === cons.id;
                        return (
                          <div
                            key={cons.id}
                            onClick={() => handleSelectCompletedConsultation(cons)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
                              isSelected 
                                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-secondary text-xs">{cons.ten_khach_hang}</h4>
                                <span className="text-[9px] font-black text-zinc-400 font-mono">{cons.ma_lich_dat}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 font-medium">SĐT: {cons.sdt_khach_hang}</p>
                              <p className="text-[10px] text-primary font-bold">DV: {cons.ten_dich_vu}</p>
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center text-[9px] font-black uppercase text-zinc-400 pt-2 border-t border-zinc-100/60">
                              <span>Ngày khám</span>
                              <span className="text-secondary">{new Date(cons.ngay_gio_bat_dau).toLocaleDateString('vi-VN')}</span>
                            </div>

                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full size-5 flex items-center justify-center text-[9px] font-bold border-2 border-white shadow-sm">
                                ✓
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step B: Visual Packages Selection */}
              {selectedPackage ? (
                <div className="bg-white rounded-2xl border border-zinc-150 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Gói trị liệu được chỉ định
                      </span>
                      <h3 className="font-heading font-black text-secondary text-sm">Gói điều trị đăng ký</h3>
                    </div>
                    <Activity className="text-primary size-5" />
                  </div>
                  <div className="bg-amber-50/20 border border-amber-100 p-4.5 rounded-xl flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold shadow-inner">
                        📦
                      </div>
                      <div>
                        <h4 className="text-secondary font-black text-xs">{selectedPackage.ten_goi}</h4>
                        <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                          Số buổi: {selectedPackage.tong_so_buoi} Buổi | Hạn: {selectedPackage.han_dung_thang || 6} tháng
                        </p>
                        <p className="text-[10px] text-amber-600 font-bold mt-0.5">Giá gói: {formatCurrency(Number(selectedPackage.gia_goi))}</p>
                      </div>
                    </div>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPackage(null);
                          setCalculatedData(null);
                          setAppliedVoucher(null);
                          setMaVoucher('');
                        }}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 hover:bg-rose-100/50 transition-all active:scale-95"
                      >
                        Thay đổi gói
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-150 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Bước B: Chọn gói trị liệu chỉ định
                      </span>
                      <h3 className="font-heading font-black text-secondary text-sm">Danh mục gói phục hồi chức năng</h3>
                    </div>
                    <Activity className="text-primary size-5" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => handleSelectPackage(pkg)}
                          className={`p-4.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
                            isSelected 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                              : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/20'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-black text-secondary text-xs leading-snug group-hover:text-primary transition-colors">
                                {pkg.ten_goi}
                              </h4>
                              <span className="text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md shrink-0 uppercase tracking-tight">
                                {pkg.tong_so_buoi} Buổi
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{pkg.mo_ta || 'Không có mô tả chi tiết cho gói này.'}</p>
                          </div>

                          <div className="mt-4 flex justify-between items-center pt-2.5 border-t border-zinc-100">
                            <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide">Giá trị gói</span>
                            <span className="font-black text-sm text-secondary group-hover:text-primary transition-colors">
                              {formatCurrency(Number(pkg.gia_goi))}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full size-5 flex items-center justify-center text-[9px] font-bold border-2 border-white shadow-sm animate-bounce">
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step C: Billing details and calculations */}
              {selectedPackage && (
                <form onSubmit={handleThanhToanPackage} className="bg-white rounded-2xl border border-zinc-150 shadow-sm p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
                  <div className="space-y-1 border-b border-zinc-100 pb-3">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Bước C: Thiết lập phương thức & tiền thu
                    </span>
                    <h3 className="font-heading font-black text-secondary text-sm">Ghi nhận thông tin thanh toán</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="loaiThanhToan" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hình thức thanh toán gói</label>
                      <select 
                        id="loaiThanhToan"
                        value={loaiThanhToan}
                        onChange={(e: any) => setLoaiThanhToan(e.target.value)}
                        className="w-full px-3 py-3.5 bg-zinc-50 border border-zinc-200 focus:border-primary rounded-xl font-bold text-secondary text-xs outline-none cursor-pointer"
                      >
                        <option value="tra_thang">
                          💳 {activePromo?.straightPromo 
                            ? `Trả thẳng - ${activePromo.straightPromo.ten_chien_dich}` 
                            : 'Trả thẳng (100% Phí)'}
                        </option>
                        <option value="tra_gop">
                          🏦 {activePromo?.installmentPromo 
                            ? `Trả góp - ${activePromo.installmentPromo.ten_chien_dich}` 
                            : 'Trả góp (Đợt 1 - 50% Phí)'}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phuongThucPkg" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hình thức giao dịch</label>
                      <select 
                        id="phuongThucPkg"
                        value={phuongThuc}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: e.target.value })}
                        className="w-full px-3 py-3.5 bg-zinc-50 border border-zinc-200 focus:border-primary rounded-xl font-bold text-secondary text-xs outline-none cursor-pointer"
                      >
                        <option value="tien_mat">💵 Tiền mặt</option>
                        <option value="chuyen_khoan">🏦 Chuyển khoản ngân hàng</option>
                        <option value="the">💳 Thẻ tín dụng/POS</option>
                      </select>
                    </div>
                  </div>

                  {/* Voucher Area */}
                  <div className="space-y-2">
                    <label htmlFor="maVoucher" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Áp dụng mã giảm giá lâm sàng (Voucher)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Gift className="absolute left-3.5 top-3.5 text-zinc-400" size={16} />
                        <input
                          id="maVoucher"
                          type="text"
                          value={maVoucher}
                          disabled={!!appliedVoucher}
                          onChange={(e) => setMaVoucher(e.target.value.toUpperCase())}
                          placeholder="Mã voucher (VD: UUDAI10, PHYSIO50K)"
                          className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-primary rounded-xl font-bold text-secondary text-xs outline-none transition-all uppercase placeholder-zinc-400 disabled:opacity-60"
                        />
                      </div>
                      
                      {appliedVoucher ? (
                        <button
                          type="button"
                          onClick={handleRemoveVoucher}
                          className="px-5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all"
                        >
                          Hủy áp dụng
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyVoucher}
                          className="px-5 bg-primary hover:opacity-90 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all shadow-sm"
                        >
                          Áp dụng
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Smart Cash input (for Cash only) */}
                  {phuongThuc === 'tien_mat' && (
                    <div className="space-y-4 pt-2 border-t border-zinc-100">
                      <div className="space-y-1.5">
                        <label htmlFor="soTienNhanPkg" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Số tiền lễ tân nhận (VNĐ) *</label>
                        <input 
                          id="soTienNhanPkg"
                          required
                          type="number" 
                          value={soTienNhan}
                          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: e.target.value })}
                          placeholder="Nhập số tiền khách đưa"
                          className="w-full px-4 py-4 bg-zinc-50 border border-zinc-250 focus:border-primary rounded-xl font-extrabold text-secondary text-sm outline-none transition-all"
                        />
                      </div>

                      {/* Quick Cash coins */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Gợi ý mệnh giá tiền mặt nhanh</span>
                        <div className="flex flex-wrap gap-2">
                          {quickCashOptions.map((cash) => (
                            <button
                              type="button"
                              key={cash}
                              onClick={() => dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: cash.toString() })}
                              className="py-2 px-3.5 bg-zinc-50 hover:bg-primary/5 hover:text-primary border border-zinc-200 hover:border-primary/20 text-[10px] font-bold rounded-xl transition-all active:scale-95 text-secondary"
                            >
                              {formatCurrency(cash)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cash change dynamic board */}
                      <div className="p-4 rounded-xl border flex justify-between items-center bg-[#F8FAFC] border-zinc-200">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Tiền thừa thối lại</span>
                          <strong className={`text-base font-black ${math.change >= 0 ? 'text-emerald-500' : 'text-amber-600'}`}>
                            {math.change >= 0 ? formatCurrency(math.change) : `Còn thiếu: ${formatCurrency(Math.abs(math.change))}`}
                          </strong>
                        </div>
                        <div className={`p-2.5 rounded-lg border flex items-center justify-center ${math.change >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          {math.change >= 0 ? <CheckCircle2 size={18} /> : <TrendingDown size={18} />}
                        </div>
                      </div>
                    </div>
                  )}

                  {phuongThuc !== 'tien_mat' && (
                    <div className="bg-[#E6F4F1] border border-primary/10 rounded-xl p-4 text-[11px] text-secondary flex items-start gap-2.5 leading-relaxed font-semibold">
                      <Info className="text-primary flex-shrink-0 mt-0.5" size={16} />
                      <p>
                        Đối với hình thức thanh toán **Chuyển khoản** hoặc **Quẹt thẻ POS**, hệ thống sẽ ghi nhận thu đúng số tiền khớp lệnh thanh toán là **{formatCurrency(math.required)}**.
                      </p>
                    </div>
                  )}

                  {/* Submission buttons */}
                  <div className="flex gap-3 pt-2.5">
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedPackage(null);
                        setCalculatedData(null);
                        setAppliedVoucher(null);
                        setMaVoucher('');
                        dispatch({ type: 'RESET_HOA_DON' });
                      }}
                      className="flex-1 py-3.5 text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-xl font-black text-xs uppercase tracking-widest border border-zinc-200 transition-all active:scale-98"
                    >
                      Hủy lựa chọn
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || calculating || !selectedConsultation}
                      className="flex-1 py-3.5 text-white bg-primary hover:opacity-90 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 active:scale-98"
                    >
                      {loading ? 'Đang hoàn tất...' : 'Hoàn tất & Đăng ký gói'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {activeTab === 'single' && (
            <>
              {selectedConsultation && (
                /* Locked Patient card when downgraded */
                <div className="bg-white rounded-2xl border border-zinc-150 shadow-sm p-6 space-y-4 mb-6">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Bệnh nhân hạ cấp gói
                      </span>
                      <h3 className="font-heading font-black text-secondary text-sm">Thông tin bệnh nhân</h3>
                    </div>
                    <Users className="text-amber-500 size-5" />
                  </div>
                  <div className="bg-amber-50/20 border border-amber-100 p-4.5 rounded-xl flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold shadow-inner">
                        👤
                      </div>
                      <div>
                        <h4 className="text-secondary font-black text-xs">{selectedConsultation.ten_khach_hang}</h4>
                        <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">SĐT: {selectedConsultation.sdt_khach_hang} | Mã ca: {selectedConsultation.ma_lich_dat}</p>
                        <p className="text-[10px] text-primary font-bold mt-0.5">Thực hiện: {selectedConsultation.ten_dich_vu}</p>
                      </div>
                    </div>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConsultation(null);
                          dispatch({ type: 'RESET_HOA_DON' });
                          setFeedbackLyDo('');
                        }}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 hover:bg-rose-100/50 transition-all active:scale-95"
                      >
                        Thay đổi khách
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!state.hoaDon ? (
                /* Step 1: Search and Create Invoice (Only if no selectedConsultation exists) */
                !selectedConsultation && (
                  <form onSubmit={handleTaoHoaDonSingle} className="bg-white rounded-2xl border border-zinc-150 p-6 space-y-6 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none"></div>
                    
                    <div className="space-y-1.5 border-b border-zinc-100 pb-3">
                      <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Bước 1: Tra cứu lịch đặt
                      </span>
                      <h3 className="font-heading font-black text-secondary text-sm">Tìm kiếm lịch hẹn hoàn thành</h3>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lichDatId" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nhập mã lịch đặt khám *</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-zinc-400" size={18} />
                        <input 
                          id="lichDatId"
                          required
                          type="text" 
                          value={state.lichDatId}
                          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'lichDatId', value: e.target.value })}
                          placeholder="VD: LD-38294"
                          className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 focus:border-primary rounded-xl font-bold text-secondary text-sm outline-none transition-all focus:bg-white"
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-gray-400 leading-relaxed">
                        Lưu ý: Chỉ những lịch hẹn đã hoàn thành khám/trị liệu buổi đầu tiên và chưa thanh toán mới có thể lập hóa đơn.
                      </p>
                    </div>

                    <button 
                      type="submit" 
                      disabled={state.loading}
                      className="w-full py-4 text-white bg-primary hover:opacity-90 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all shadow-xs disabled:opacity-75"
                    >
                      {state.loading ? 'Đang xác thực dữ liệu...' : 'Xác thực & Lập Hóa Đơn'}
                    </button>
                  </form>
                )
              ) : (
                /* Step 2: Input cash amount & complete transaction */
                <form onSubmit={handleThanhToanSingle} className="bg-white rounded-2xl border border-zinc-150 p-6 space-y-6 relative overflow-hidden shadow-sm">
                  <div className="space-y-1.5 border-b border-zinc-100 pb-3">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Bước 2: Ghi nhận thu tiền
                    </span>
                    <h3 className="font-heading font-black text-secondary text-sm">Xử lý giao dịch thu tiền</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="phuongThuc" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hình thức thanh toán</label>
                      <select 
                        id="phuongThuc"
                        value={state.phuongThuc}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: e.target.value })}
                        className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 focus:border-primary rounded-xl font-bold text-secondary text-sm outline-none transition-all cursor-pointer"
                      >
                        <option value="tien_mat">💵 Tiền mặt</option>
                        <option value="chuyen_khoan">🏦 Chuyển khoản ngân hàng</option>
                        <option value="the">💳 Thẻ tín dụng/POS</option>
                      </select>
                    </div>

                    {state.phuongThuc === 'tien_mat' && (
                      <div className="space-y-1.5">
                        <label htmlFor="soTienNhan" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Số tiền khách đưa (VNĐ) *</label>
                        <input 
                          id="soTienNhan"
                          required
                          type="number" 
                          value={state.soTienNhan}
                          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: e.target.value })}
                          placeholder="VD: 500000"
                          className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 focus:border-primary rounded-xl font-bold text-secondary text-sm outline-none transition-all"
                        />
                      </div>
                    )}

                    {selectedConsultation && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label htmlFor="feedbackLyDo" className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded uppercase tracking-wider block w-fit">
                          Lý do khách không hài lòng về gói * (Lễ tân thu thập phản hồi)
                        </label>
                        <textarea 
                          id="feedbackLyDo"
                          required
                          value={feedbackLyDo}
                          onChange={(e) => setFeedbackLyDo(e.target.value)}
                          placeholder="Note phản hồi của khách hàng tại đây (VD: khách thấy giá đắt, muốn thanh toán theo từng buổi lẻ)..."
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-primary rounded-xl font-bold text-secondary text-xs outline-none transition-all focus:bg-white min-h-[90px]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick Cash selections */}
                  {state.phuongThuc === 'tien_mat' && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Gợi ý mệnh giá tiền mặt nhanh</span>
                      <div className="flex flex-wrap gap-2">
                        {quickCashOptions.map((cash) => (
                          <button
                            type="button"
                            key={cash}
                            onClick={() => dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: cash.toString() })}
                            className="py-2.5 px-4 bg-zinc-50 hover:bg-primary/5 hover:text-primary border border-zinc-200 hover:border-primary/20 text-xs font-bold rounded-xl transition-all active:scale-95 text-secondary"
                          >
                            {formatCurrency(cash)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Automatic Cash change indicator */}
                  {state.phuongThuc === 'tien_mat' && (
                    <div className="p-4 rounded-xl border flex justify-between items-center transition-all bg-[#F8FAFC] border-zinc-200">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Tiền thừa trả khách</span>
                        <strong className={`text-base font-black ${math.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {math.change >= 0 ? formatCurrency(math.change) : `Còn thiếu: ${formatCurrency(Math.abs(math.change))}`}
                        </strong>
                      </div>
                      <div className={`p-2.5 rounded-lg border flex items-center justify-center ${math.change >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                        {math.change >= 0 ? <CheckCircle2 size={18} /> : <TrendingDown size={18} />}
                      </div>
                    </div>
                  )}

                  {state.phuongThuc !== 'tien_mat' && (
                    <div className="bg-[#E6F4F1] border border-primary/10 rounded-xl p-4 text-xs text-secondary flex items-start gap-3 leading-relaxed font-semibold">
                      <Info className="text-primary flex-shrink-0 mt-0.5" size={18} />
                      <p>
                        Đối với hình thức thanh toán **Chuyển khoản** hoặc **Quẹt thẻ POS**, hệ thống sẽ ghi nhận thu đúng số tiền hóa đơn khớp lệnh y khoa là **{formatCurrency(math.required)}**.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3.5 pt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        dispatch({ type: 'RESET_HOA_DON' });
                        setFeedbackLyDo('');
                      }}
                      className="flex-1 py-4 text-secondary bg-zinc-50 hover:bg-zinc-100 rounded-xl font-extrabold text-xs uppercase tracking-widest border border-zinc-200 transition-all active:scale-98"
                    >
                      Hủy hóa đơn
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 py-4 text-white bg-primary hover:opacity-90 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all shadow-xs disabled:opacity-75 active:scale-98"
                    >
                      {loading ? 'Đang hoàn tất...' : 'Hoàn tất giao dịch'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>

        {/* Right Dynamic Receipt Column - Swiss Clinical Thermal Receipt */}
        <div className="lg:col-span-5">
          
          {/* Render receipt if calculatedData (package tab) or hoaDon (single tab) is ready */}
          {((activeTab === 'package' && selectedPackage && calculatedData) || (activeTab === 'single' && hoaDon)) ? (
            <div className="relative group animate-in zoom-in-95 duration-400">
              
              {/* Receipt top teeth cut */}
              <div className="absolute top-0 inset-x-0 h-2 flex justify-between overflow-hidden opacity-90 select-none pointer-events-none z-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={`teeth-top-${i}`} className="w-4 h-4 bg-background rotate-45 transform origin-top-left -mt-2"></div>
                ))}
              </div>

              {/* Thermal clinical paper body */}
              <div className="bg-white px-6 sm:px-8 py-9 shadow-lg border border-zinc-200 rounded-b-[4px] space-y-6 relative overflow-hidden select-none">
                
                {/* Clinic Clinical Header */}
                <div className="text-center space-y-2 pb-5 border-b border-dashed border-zinc-200">
                  <span className="size-10 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center mx-auto text-lg font-bold">🏥</span>
                  <div>
                    <h4 className="font-heading font-black text-secondary text-sm tracking-wide">PHYSIOFLOW CLINIC</h4>
                    <p className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-widest">Biên lai y khoa lâm sàng</p>
                  </div>
                  <div className="text-[9px] text-zinc-400 font-mono tracking-widest">
                    {activeTab === 'package' ? `HD-PKG-${Math.floor(100000 + Math.random() * 900000)}` : hoaDon.ma_hoa_don}
                  </div>
                </div>

                {/* Patient Information Table */}
                <div className="space-y-2.5 text-[10px] font-bold text-zinc-500 border-b border-dashed border-zinc-200 pb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1.5"><User size={13} /> Người nhận:</span>
                    <span className="text-secondary font-black">
                      {activeTab === 'package' ? selectedConsultation?.ten_khach_hang : (hoaDon.ho_ten_khach || 'Khách vãng lai')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Info size={13} /> Số điện thoại:</span>
                    <span className="text-secondary font-black">
                      {activeTab === 'package' ? selectedConsultation?.sdt_khach_hang : (hoaDon.so_dien_thoai || 'Trống')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Calendar size={13} /> Ngày giao dịch:</span>
                    <span className="text-secondary font-black">{new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Items & Services Detailed Block */}
                <div className="space-y-4 border-b border-dashed border-zinc-200 pb-5">
                  <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                    <span>Nội dung chỉ định</span>
                    <span>Đơn giá</span>
                  </div>
                  
                  {activeTab === 'package' ? (
                    <div className="flex justify-between items-start gap-4 text-[11px] font-bold text-zinc-500">
                      <div className="space-y-1">
                        <p className="text-secondary font-black leading-snug">{selectedPackage.ten_goi}</p>
                        <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">
                          Phác đồ trọn gói: {selectedPackage.tong_so_buoi} Buổi | Hạn: {selectedPackage.han_dung_thang || 6} tháng
                        </p>
                      </div>
                      <span className="text-secondary font-black shrink-0">{formatCurrency(Number(calculatedData.gia_goc))}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-4 text-[11px] font-bold text-zinc-500">
                      <div className="space-y-1">
                        <p className="text-secondary font-black leading-snug">{hoaDon.ten_item || 'Khám lâm sàng / Dịch vụ y tế'}</p>
                        <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Số buổi điều trị: {hoaDon.so_buoi_goi || 1} Buổi</p>
                      </div>
                      <span className="text-secondary font-black shrink-0">{formatCurrency(Number(hoaDon.tong_tien_truoc_giam))}</span>
                    </div>
                  )}
                </div>

                {/* Voucher Discounts and Payment phase split */}
                <div className="space-y-2.5 text-[10px] font-bold text-zinc-500 pb-5 border-b border-dashed border-zinc-200">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Tạm tính:</span>
                    <span className="text-secondary font-black">
                      {formatCurrency(Number(activeTab === 'package' ? calculatedData.gia_goc : hoaDon.tong_tien_truoc_giam))}
                    </span>
                  </div>

                  {activeTab === 'package' ? (
                    <>
                      {Number(calculatedData.so_tien_giam_phuong_thuc) > 0 && (
                        <div className="flex justify-between items-center text-emerald-500">
                          <span className="font-extrabold">
                            Ưu đãi tự động ({loaiThanhToan === 'tra_gop' ? activePromo?.installmentPromo?.ten_chien_dich : activePromo?.straightPromo?.ten_chien_dich}):
                          </span>
                          <span className="font-black">-{formatCurrency(Number(calculatedData.so_tien_giam_phuong_thuc))}</span>
                        </div>
                      )}

                      {Number(calculatedData.so_tien_giam_voucher) > 0 && (
                        <div className="flex justify-between items-center text-emerald-500">
                          <span className="font-extrabold">Ưu đãi Voucher ({appliedVoucher?.ma_voucher}):</span>
                          <span className="font-black">-{formatCurrency(Number(calculatedData.so_tien_giam_voucher))}</span>
                        </div>
                      )}
                      
                      {loaiThanhToan === 'tra_gop' && (
                        <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg space-y-1 text-amber-700 text-[9px] leading-relaxed">
                          <div className="flex justify-between font-black">
                            <span>Thanh toán Đợt 1 (50%):</span>
                            <span>{formatCurrency(Number(calculatedData.so_tien_dot_1))}</span>
                          </div>
                          <div className="flex justify-between opacity-80 font-bold border-t border-amber-100/50 pt-1 mt-1">
                            <span>Ghi nợ Đợt 2 (50%):</span>
                            <span>{formatCurrency(Number(calculatedData.so_tien_dot_2))}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {Number(hoaDon.so_tien_giam) > 0 && (
                        <div className="flex justify-between items-center text-emerald-500">
                          <span className="font-extrabold">Ưu đãi lâm sàng:</span>
                          <span className="font-black">-{formatCurrency(Number(hoaDon.so_tien_giam))}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Grand Total due & thối lại */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-secondary uppercase tracking-wider">Số tiền cần thu</span>
                    <strong className="text-xl font-heading font-black text-primary leading-none">
                      {formatCurrency(math.required)}
                    </strong>
                  </div>

                  {phuongThuc === 'tien_mat' && Number(soTienNhan) > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 pt-1.5 border-t border-zinc-100">
                      <span className="text-zinc-400">Tiền thối lại khách:</span>
                      <span className={`font-black ${math.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {math.change >= 0 ? formatCurrency(math.change) : `Còn thiếu: ${formatCurrency(Math.abs(math.change))}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Symbology Security Barcode */}
                <div className="pt-6 text-center space-y-2 select-none pointer-events-none">
                  <div className="h-8 w-48 bg-zinc-800 mx-auto opacity-35" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #000, #000 2px, transparent 2px, transparent 8px)' }}></div>
                  <p className="text-[8px] text-zinc-400 font-extrabold tracking-widest uppercase">PhysioFlow Secure Ledger</p>
                </div>
              </div>

              {/* Receipt bottom teeth cut */}
              <div className="absolute bottom-0 inset-x-0 h-2 flex justify-between overflow-hidden opacity-90 select-none pointer-events-none z-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={`teeth-bottom-${i}`} className="w-4 h-4 bg-background -rotate-45 transform origin-bottom-left -mb-2"></div>
                ))}
              </div>
            </div>
          ) : (
            /* Guideline Instructions card */
            <div className="bg-white rounded-2xl border border-zinc-150 p-6 space-y-6 shadow-sm">
              <h3 className="text-xs font-heading font-black text-secondary uppercase tracking-wider flex items-center gap-2">
                <Info size={16} className="text-primary" />
                Hướng dẫn thu ngân y khoa
              </h3>
              
              <div className="space-y-4 text-xs font-semibold text-zinc-500 leading-relaxed border-t border-zinc-100 pt-4">
                <p>
                  1. **Chọn Tab phù hợp:** Chuyển đổi giữa lập hóa đơn lẻ (khám lâm sàng) hoặc Đăng ký gói phục hồi chức năng trọn gói.
                </p>
                <p>
                  2. **Bước A (Đối với Gói):** Lựa chọn khách hàng từ danh sách các buổi khám chẩn đoán vừa hoàn thành để hệ thống tự điền thông tin.
                </p>
                <p>
                  3. **Bước B (Đối với Gói):** Chọn Gói điều trị tương ứng được bác sĩ lâm sàng khuyên dùng cho khách.
                </p>
                <p>
                  4. **Tính toán & Voucher:** Nhập mã giảm giá và lựa chọn Trả góp 50% nếu khách có nhu cầu. Biên lai nhiệt bên phải sẽ cập nhật tức thời theo thời gian thực.
                </p>
                <p>
                  5. **Xác nhận:** Chọn hình thức giao dịch thực tế (Tiền mặt, Chuyển khoản, Thẻ) và ấn hoàn tất để lưu trữ hóa đơn y khoa an toàn vào hệ thống.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
