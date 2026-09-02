import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuthStore, useAuthActions } from '../../../stores/authStore';
import { agreeTerms } from '../../customer/api/customer.api';
import { toast } from 'react-hot-toast';
import { useBookingState } from '../components/booking/hooks/useBookingState';
import { calculateVoucherDiscount } from '../../admin/pages/ManageFinance/components/VoucherPicker';
import { BookingServiceSection } from '../components/booking/ui/sections/BookingServiceSection';
import { BookingDateTimeStaffSection } from '../components/booking/ui/sections/BookingDateTimeStaffSection';
import { BookingCustomerFormSection } from '../components/booking/ui/sections/BookingCustomerFormSection';
import { BookingPaymentSection } from '../components/booking/ui/sections/BookingPaymentSection';
import { BookingSummaryCard } from '../components/booking/ui/sections/BookingSummaryCard';
import { BookingTermsModal } from '../components/booking/ui/sections/BookingTermsModal';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state || {}) as { bookingType?: 'kham' | 'dich_vu'; selectedServiceId?: string; from?: string };

  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { updateUser } = useAuthActions();

  // Terms acceptance modal gate for accounts missing timestamp
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [agreeingLoading, setAgreeingLoading] = useState(false);

  // Modal Terms popup state for online payment terms agreement
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [modalTermsChecked, setModalTermsChecked] = useState(false);

  // Initialize booking type & selected service
  const [bookingType, setBookingType] = useState<'kham' | 'dich_vu'>(navState.bookingType || 'kham');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(navState.selectedServiceId ? String(navState.selectedServiceId) : '');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const initializedFromNavRef = useRef(false);

  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [specialists, setSpecialists] = useState<any[]>([]);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'tai_quay' | 'payos'>('tai_quay');
  const [payTermsAccepted, setPayTermsAccepted] = useState(false);

  // Official PayOS SDK response data & polling timer states
  const [payosData, setPayosData] = useState<any | null>(null);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosTimeLeft, setPayosTimeLeft] = useState(600); // 10 minutes (600s)
  const pollingTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const isCreatingBookingRef = useRef(false);

  // Vouchers state for Online payment
  const [activeVouchers, setActiveVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);

  const {
    state,
    buoiAvailability,
    isPhoneTakenByOther,
    setDateField,
    setBuoiField,
    setFormField,
    setSubmitting
  } = useBookingState(user, bookingType, selectedServiceId, services);

  const { selectedDate, selectedBuoi, isSubmitting, formData } = state;

  const selectedService = services.find(s => String(s.id) === String(selectedServiceId));
  const serviceDuration = Number(selectedService?.thoi_luong_phut) || 30;

  const staffList = useMemo(() => {
    if (buoiAvailability.nhanSu.length === 0) return specialists;
    if (!selectedBuoi) return [];
    return buoiAvailability.nhanSu.filter((ns: any) => {
      const conLai = selectedBuoi === 'sang' ? ns.conLaiSang : ns.conLaiChieu;
      return conLai >= serviceDuration;
    });
  }, [buoiAvailability.nhanSu, selectedBuoi, serviceDuration, specialists]);
  const selectedStaffObj = staffList.find(s => String(s.id) === selectedStaffId);

  useEffect(() => {
    setSelectedStaffId('');
  }, [selectedBuoi]);

  // Intercept Route: Ensure user authentication & client role
  useEffect(() => {
    setIsClient(true);
    if (isAuthenticated() && user) {
      const roleId = Number(user.vai_tro_id);
      if (roleId !== 1 && roleId !== 0) {
        toast.error('Tài khoản nhân sự không thể sử dụng chức năng đặt lịch của Khách hàng. Vui lòng đăng ký tài khoản khách hàng riêng.');
        const defaultRoute = roleId === 5 || roleId === 6 ? '/admin' : roleId === 2 ? '/receptionist' : roleId === 4 ? '/doctor' : '/technician/appointments';
        navigate(defaultRoute, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Enforce PayOS Online payment if customer has >= 2 no-shows
  useEffect(() => {
    if (buoiAvailability?.buoc_thanh_toan_online && paymentMethod !== 'payos') {
      setPaymentMethod('payos');
    }
  }, [buoiAvailability?.buoc_thanh_toan_online, paymentMethod]);

  // Fetch list of services & staff
  useEffect(() => {
    setServicesLoading(true);
    fetch(`${BASE_URL}/client/services`)
      .then(res => res.json())
      .then(data => setServices(data || []))
      .catch(err => console.error('Lỗi tải danh sách dịch vụ:', err))
      .finally(() => setServicesLoading(false));

    fetch(`${BASE_URL}/client/specialists`)
      .then(res => res.json())
      .then(data => setSpecialists(data || []))
      .catch(err => console.error('Lỗi tải danh sách nhân sự:', err));
  }, []);

  // Smart auto-selection: Prioritize passed navigation state service on first load, otherwise default
  useEffect(() => {
    if (services.length === 0) return;

    if (!initializedFromNavRef.current && navState.selectedServiceId) {
      const matched = services.find(s => String(s.id) === String(navState.selectedServiceId));
      if (matched) {
        const isExam = matched.loai_goi === 'KHAM' || matched.loai_dich_vu === 'KHAM';
        setBookingType(isExam ? 'kham' : 'dich_vu');
        setSelectedServiceId(String(matched.id));
        initializedFromNavRef.current = true;
        return;
      }
    }
    initializedFromNavRef.current = true;

    if (bookingType === 'kham') {
      const cur = services.find(s => String(s.id) === String(selectedServiceId));
      if (!cur || (cur.loai_goi !== 'KHAM' && cur.loai_dich_vu !== 'KHAM')) {
        const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
        if (examService) setSelectedServiceId(String(examService.id));
      }
    } else {
      const cur = services.find(s => String(s.id) === String(selectedServiceId));
      if (!cur || cur.loai_goi === 'KHAM' || cur.loai_dich_vu === 'KHAM') {
        const regularService = services.find(s => s.loai_goi !== 'KHAM' && s.loai_dich_vu !== 'KHAM');
        if (regularService) setSelectedServiceId(String(regularService.id));
      }
    }
  }, [bookingType, services, navState.selectedServiceId]);

  const handleSetBookingType = (type: 'kham' | 'dich_vu') => {
    setBookingType(type);
    if (type === 'kham') {
      const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
      if (examService) setSelectedServiceId(String(examService.id));
    } else {
      const regularService = services.find(s => s.loai_goi !== 'KHAM' && s.loai_dich_vu !== 'KHAM');
      if (regularService) setSelectedServiceId(String(regularService.id));
    }
    setSelectedStaffId('');
  };

  // Fetch active vouchers for Client Online booking
  useEffect(() => {
    const url = user?.id 
      ? `${BASE_URL}/client/vouchers/active?khach_hang_id=${user.id}` 
      : `${BASE_URL}/client/vouchers/active`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const list = data.vouchers || [];
        setActiveVouchers(list);
      })
      .catch(err => console.error('Lỗi tải voucher client:', err));
  }, [user?.id]);

  // Price calculations
  const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
  const rawPrice = selectedService 
    ? Number(selectedService.don_gia) 
    : (bookingType === 'kham' ? Number(examService?.don_gia || 0) : 0);

  const handleApplyVoucher = async (code: string, isSilent = false) => {
    const matched = activeVouchers.find((v: any) => v.ma_voucher?.toUpperCase() === code.trim().toUpperCase());
    if (matched) {
      setSelectedVoucher(matched);
      if (!isSilent) toast.success(`Đã áp dụng mã "${matched.ma_voucher}"!`);
    } else {
      try {
        const res = await api.post('/client/vouchers/apply', {
          ma_voucher: code,
          khach_hang_id: user?.id,
          loai_thanh_toan: 'tra_thang',
          kenh: 'online',
          loai_goi: bookingType === 'kham' ? 'KHAM' : 'LE',
        });
        if (res.data?.voucher) {
          setSelectedVoucher(res.data.voucher);
          if (!isSilent) toast.success(`Đã áp dụng mã "${res.data.voucher.ma_voucher}"!`);
        }
      } catch (err: any) {
        if (!isSilent) toast.error(err.response?.data?.message || 'Mã giảm giá không tồn tại hoặc chưa thỏa điều kiện.');
      }
    }
  };

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
  };

  const discountAmount = selectedVoucher ? calculateVoucherDiscount(selectedVoucher, rawPrice) : 0;
  const finalPrice = Math.max(0, rawPrice - discountAmount);

  // Trigger PayOS Link creation via official PayOS SDK backend endpoint
  useEffect(() => {
    if (paymentMethod === 'payos' && payTermsAccepted && finalPrice > 0) {
      setPayosLoading(true);
      fetch(`${BASE_URL}/client/payment/create-payos-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          phone: formData.so_dien_thoai || user?.so_dien_thoai || '0987654321',
          description: `DAT LICH ${formData.so_dien_thoai || 'OFFICECARE'}`
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.qrCode || data.checkoutUrl) {
            setPayosData(data);
          } else {
            toast.error(data.message || 'Không thể khởi tạo mã QR PayOS');
          }
        })
        .catch(err => {
          console.error('Lỗi khởi tạo PayOS link:', err);
          toast.error('Lỗi kết nối khởi tạo mã QR PayOS');
        })
        .finally(() => setPayosLoading(false));
    } else {
      setPayosData(null);
    }
  }, [paymentMethod, payTermsAccepted, finalPrice, formData.so_dien_thoai, user]);

  // Reset terms agreement when switching back to Cash at Counter
  useEffect(() => {
    if (paymentMethod === 'tai_quay') {
      setPayTermsAccepted(false);
      setPayosData(null);
    }
  }, [paymentMethod]);

  // Real-time PayOS Webhook Polling & 10-minute Countdown Timer
  useEffect(() => {
    if (!payosData || !payosData.orderCode) {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setPayosTimeLeft(600);
      return;
    }

    setPayosTimeLeft(600);
    isCreatingBookingRef.current = false;

    countdownTimerRef.current = setInterval(() => {
      setPayosTimeLeft((prev) => {
        if (prev <= 1) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          toast.error('Mã thanh toán QR PayOS đã hết hạn (quá 10 phút)! Vui lòng thử lại.');
          setPayosData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollingTimerRef.current = setInterval(async () => {
      if (isCreatingBookingRef.current) return;
      try {
        const res = await fetch(`${BASE_URL}/client/payment/status/${payosData.orderCode}`);
        const data = await res.json();
        if (data && (data.paid || data.status === 'PAID' || data.status === 'PAID_SUCCESS')) {
          isCreatingBookingRef.current = true;
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          toast.success('🎉 Hệ thống đã nhận tiền chuyển khoản PayOS thành công!');
          await executeBookingCreation('payos');
        }
      } catch (err) {
        console.error('Lỗi kiểm tra thanh toán PayOS:', err);
      }
    }, 3000);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [payosData]);

  // Reset session and staff when service or booking type changes
  useEffect(() => {
    setBuoiField('');
    setSelectedStaffId('');
  }, [selectedServiceId, bookingType, setBuoiField]);

  const validateFormFields = (): boolean => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày!');
      return false;
    }
    if (!selectedBuoi) {
      toast.error('Vui lòng chọn buổi (Sáng hoặc Chiều)!');
      return false;
    }
    const nameTrimmed = (formData.ho_ten_khach || user?.ho_ten || '').trim();
    const phoneTrimmed = (formData.so_dien_thoai || user?.so_dien_thoai || '').trim();
    const symptomTrimmed = formData.trieu_chung.trim();

    if (!nameTrimmed) {
      toast.error('Thông tin họ tên tài khoản không hợp lệ!');
      return false;
    }

    if (!phoneTrimmed) {
      toast.error('Thông tin số điện thoại tài khoản không hợp lệ!');
      return false;
    }

    if (bookingType === 'kham') {
      if (!symptomTrimmed) {
        toast.error('Vui lòng nhập lý do đến lượng giá / triệu chứng!');
        return false;
      }
    }

    if (isPhoneTakenByOther) {
      toast.error('Số điện thoại tài khoản đã thuộc về hồ sơ khách hàng khác — vui lòng cập nhật lại trước khi thanh toán.');
      return false;
    }
    return true;
  };

  const handleAgreeTermsModalGate = async () => {
    if (!acceptedTerms) return;
    setAgreeingLoading(true);
    try {
      await agreeTerms();
      updateUser({ ngay_dong_y_dieu_khoan: new Date().toISOString() });
      toast.success('Xác nhận đồng ý điều khoản dịch vụ thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi ghi nhận đồng ý điều khoản. Vui lòng thử lại.');
    } finally {
      setAgreeingLoading(false);
    }
  };

  const handleConfirmModalTerms = () => {
    if (!validateFormFields()) return;
    if (!modalTermsChecked) {
      toast.error('Vui lòng tích chọn đồng ý với tất cả điều khoản dịch vụ & thanh toán!');
      return;
    }
    setPayTermsAccepted(true);
    setIsTermsModalOpen(false);
    toast.success('Đã xác nhận đồng ý điều khoản! Đang khởi tạo mã QR PayOS...');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormField(e.target.name, e.target.value);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận tệp hình ảnh (.jpg, .png, .webp)!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormField('anh_dinh_kem_url', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormField('anh_dinh_kem_url', '');
  };

  const executeBookingCreation = async (method: 'payos' | 'tai_quay') => {
    if (isSubmitting) return;
    if (!selectedBuoi || (selectedBuoi !== 'sang' && selectedBuoi !== 'chieu')) {
      toast.error('Vui lòng chọn buổi (Buổi Sáng hoặc Buổi Chiều) trước khi hoàn tất đặt lịch.');
      return;
    }
    const toastId = toast.loading(method === 'payos' ? 'Đang tự động kích hoạt lịch hẹn...' : 'Đang gửi đăng ký lịch hẹn...');
    setSubmitting(true);

    try {
      const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
      const targetDichVuId = bookingType === 'dich_vu' ? selectedServiceId : (examService?.id || services[0]?.id);
      const payNow = method === 'payos';

      const response = await fetch(`${BASE_URL}/client/appointments/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ho_ten_khach: user?.ho_ten || formData.ho_ten_khach,
          so_dien_thoai: user?.so_dien_thoai || formData.so_dien_thoai,
          ngay: selectedDate,
          buoi: selectedBuoi,
          khach_hang_id: user?.id,
          nhan_su_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
          goi_dich_vu_id: targetDichVuId,
          trieu_chung: bookingType === 'dich_vu' ? `Đặt lịch gói lẻ: ${selectedService?.ten_dich_vu || 'Dịch vụ lẻ PHCN'}` : formData.trieu_chung,
          ly_do_kham: bookingType === 'dich_vu' ? `Trị liệu lẻ: ${selectedService?.ten_dich_vu || 'Không rõ'}` : (formData.ly_do_kham || 'Lượng giá chức năng ban đầu'),
          trang_thai: 'da_xac_nhan',
          trang_thai_thanh_toan: payNow ? 'da_thanh_toan' : 'chua_thanh_toan',
          hinh_thuc_thanh_toan: method,
          ma_voucher: selectedVoucher ? selectedVoucher.ma_voucher : null
        }),
      });

      if (response.ok) {
        if (user && user.ngay_dong_y_dieu_khoan === null) {
          await agreeTerms().catch(() => {});
          updateUser({ ngay_dong_y_dieu_khoan: new Date().toISOString() });
        }

        await response.json();
        toast.success(payNow ? '🎉 Thanh toán PayOS thành công & Lịch hẹn đã được xác nhận!' : 'Đăng ký lịch hẹn thành công!', { id: toastId });

        navigate('/appointments');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Không thể đăng ký lịch hẹn. Hãy thử lại.', { id: toastId });
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ trị liệu!', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormFields()) return;

    if (paymentMethod === 'payos' && !payTermsAccepted) {
      toast.error('Bạn vui lòng tích xem & đồng ý Điều khoản thanh toán để tiếp tục!');
      return;
    }

    await executeBookingCreation(paymentMethod);
  };

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-4 relative overflow-hidden font-jakarta">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[500px] w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-[36px] p-8 sm:p-10 border border-teal-100 dark:border-zinc-800 shadow-2xl shadow-teal-950/20 z-10 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="relative inline-flex mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30 text-white transform -rotate-3 hover:rotate-0 transition-all duration-300">
              <Sparkles size={38} className="animate-pulse" />
            </div>
          </div>

          <div className="inline-block px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-[11px] font-black uppercase tracking-wider mb-3">
            Bảo vệ hồ sơ & Chuẩn hóa lịch hẹn
          </div>

          <h3 className="font-heading font-black text-2xl sm:text-[26px] text-slate-900 dark:text-white text-center mb-3 tracking-tight leading-snug">
            Chào mừng bạn đến với OfficeCare 🌿
          </h3>
          
          <p className="text-slate-600 dark:text-zinc-400 font-medium text-xs sm:text-sm leading-relaxed text-center mb-6 px-1">
            Quý khách vui lòng đăng nhập hoặc đăng ký tài khoản để bắt đầu đặt lịch lượng giá & trị liệu cá nhân hóa.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs py-3.5 px-5 rounded-2xl flex-1 text-center transition-all cursor-pointer shadow-2xs"
            >
              Quay về Trang chủ
            </button>
            <button
              onClick={() => navigate('/login', { state: { from: '/booking' } })}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-xs tracking-wide py-3.5 px-6 rounded-2xl flex-1 text-center transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Đăng nhập / Đăng ký</span>
              <span className="text-sm">➔</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const payosQrImgUrl = payosData
    ? `https://img.vietqr.io/image/${payosData.bin || 'MB'}-${payosData.accountNumber || '0358966332'}-compact2.png?amount=${payosData.amount}&addInfo=${encodeURIComponent(payosData.description)}&accountName=${encodeURIComponent(payosData.accountName || 'PHONG KHAM PHCN OFFICECARE')}`
    : '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-6 pb-20 px-4 sm:px-6 lg:px-8 font-jakarta">
      {/* Terms consent modal gate for new accounts */}
      <BookingTermsModal
        isOpen={!!user && user.ngay_dong_y_dieu_khoan === null}
        onClose={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        checked={acceptedTerms}
        setChecked={setAcceptedTerms}
        onConfirm={handleAgreeTermsModalGate}
        loading={agreeingLoading}
      />

      {/* Online payment terms popup modal */}
      <BookingTermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        checked={modalTermsChecked}
        setChecked={setModalTermsChecked}
        onConfirm={handleConfirmModalTerms}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-3 max-w-4xl mx-auto pt-2 pb-2">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 px-4 py-1.5 rounded-full shadow-2xs">
            <span className="text-teal-600 text-xs">🏥</span>
            <span className="text-[10px] sm:text-[11px] font-black text-teal-800 uppercase tracking-wider">
              Dịch vụ Phục hồi Chức năng Y khoa Chuẩn Quốc Tế
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            Đặt Lịch Hẹn <span className="text-teal-600">Lượng Giá &amp; Trị Liệu PHCN</span>
          </h1>

          {/* Stepper Cards Header */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-2xl border-2 border-teal-200 bg-teal-50/70 transition-all flex items-center gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-xs bg-teal-600 text-white">1</div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-teal-700">Bước 1</p>
                <p className="text-xs font-black text-slate-900 truncate">Gói Dịch Vụ</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl border-2 border-sky-200 bg-sky-50/70 transition-all flex items-center gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-xs bg-sky-600 text-white">2</div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-sky-700">Bước 2</p>
                <p className="text-xs font-black text-slate-900 truncate">Buổi &amp; Thời Gian</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/70 transition-all flex items-center gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-xs bg-indigo-600 text-white">3</div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-indigo-700">Bước 3</p>
                <p className="text-xs font-black text-slate-900 truncate">Thông Tin Khách</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 transition-all flex items-center gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-xs bg-emerald-600 text-white">4</div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-emerald-700">Bước 4</p>
                <p className="text-xs font-black text-slate-900 truncate">Thanh Toán &amp; Đặt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Unified Booking Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 8-cols */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-8 shadow-xs text-left">
              {/* Section 1: Service Type & Item Selection */}
              <BookingServiceSection
                bookingType={bookingType}
                setBookingType={handleSetBookingType}
                selectedServiceId={selectedServiceId}
                setSelectedServiceId={setSelectedServiceId}
                services={services}
                servicesLoading={servicesLoading}
              />

              {/* Section 2: Date, Session, Staff Selection */}
              <BookingDateTimeStaffSection
                selectedDate={selectedDate}
                setDateField={setDateField}
                selectedBuoi={selectedBuoi}
                setBuoiField={setBuoiField}
                buoiAvailability={buoiAvailability}
                serviceDuration={serviceDuration}
                selectedService={selectedService}
                bookingType={bookingType}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                setSelectedStaffId={setSelectedStaffId}
              />

              {/* Section 3: Customer Information */}
              <BookingCustomerFormSection
                user={user}
                formData={formData}
                handleChange={handleChange}
                bookingType={bookingType}
                isPhoneTakenByOther={isPhoneTakenByOther}
                handleFile={handleFile}
                removeImage={removeImage}
              />

              {/* Section 4: Payment Methods, Voucher, PayOS */}
              <BookingPaymentSection
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                buoiAvailability={buoiAvailability}
                validateFormFields={validateFormFields}
                selectedVoucher={selectedVoucher}
                handleApplyVoucher={handleApplyVoucher}
                handleRemoveVoucher={handleRemoveVoucher}
                rawPrice={rawPrice}
                discountAmount={discountAmount}
                finalPrice={finalPrice}
                activeVouchers={activeVouchers}
                user={user}
                bookingType={bookingType}
                payTermsAccepted={payTermsAccepted}
                setPayTermsAccepted={setPayTermsAccepted}
                setIsTermsModalOpen={setIsTermsModalOpen}
                payosLoading={payosLoading}
                payosData={payosData}
                payosQrImgUrl={payosQrImgUrl}
                payosTimeLeft={payosTimeLeft}
              />

              {/* Submit CTA Button (Only shown for Cash at Counter) */}
              {paymentMethod === 'tai_quay' && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting || isPhoneTakenByOther}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-jakarta font-black text-sm uppercase tracking-widest rounded-2xl h-16 shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={18} /> Đang xử lý đăng ký...
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> Xác nhận đăng ký lượt lượng giá (Thanh toán tại quầy)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Summary Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <BookingSummaryCard
              bookingType={bookingType}
              selectedService={selectedService}
              selectedDate={selectedDate}
              isClient={isClient}
              selectedBuoi={selectedBuoi}
              selectedStaffObj={selectedStaffObj}
              paymentMethod={paymentMethod}
              selectedVoucher={selectedVoucher}
              discountAmount={discountAmount}
              finalPrice={finalPrice}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
