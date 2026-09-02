import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import {
  ArrowLeft,
  Clock3,
  User,
  FileText,
  ShieldCheck,
  QrCode,
  Banknote,
  Lock,
  CalendarCheck,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '../../../../utils/format';
import { generateInvoiceHtml, generateTransactionReceiptHtml } from '../../../../utils/invoicePrinter';
import { useActiveShiftCheck } from '../../../../hooks/useActiveShiftCheck';
import toast from 'react-hot-toast';

// Hooks
import { useCheckout } from './hooks/useCheckout';
import { useFinanceDashboard } from './hooks/useFinanceDashboard';
import type { Invoice, Payment } from './hooks/useFinanceDashboard';

// Components
import FastPaymentModal from './components/FastPaymentModal';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import OverduePackagePanel from './components/OverduePackagePanel';
import PaymentSuccessBox from './components/PaymentSuccessBox';
import ConfirmPaymentModal from './components/ConfirmPaymentModal';
import QRWebhookModal from './components/QRWebhookModal';
import VoucherPicker from './components/VoucherPicker';
import { FinanceKpiCards } from './components/FinanceKpiCards';
import { FinanceFilterBar } from './components/FinanceFilterBar';
import { InvoiceTable } from './components/InvoiceTable';
import { PaymentTable } from './components/PaymentTable';

export default function ManageFinance() {
  const { user } = useAuthStore();
  const { hasShiftToday, isSuperUser } = useActiveShiftCheck();
  const isAdminOrManager = Number(user?.vai_tro_id) === 5 || Number(user?.vai_tro_id) === 6;

  const navigate = useNavigate();
  const location = useLocation();
  const baseFinanceRoute = Number(user?.vai_tro_id) === 2 ? '/receptionist/billing' : '/admin/finance';

  // Parse Query Parameters
  const params = new URLSearchParams(location.search);
  const queryLichDatId = params.get('lich_dat_id');
  const queryCustomerId = params.get('customer_id');
  const queryGoiDichVuId = params.get('goi_dich_vu_id');
  const queryHoaDonId = params.get('hoa_don_id');
  const queryDraftWalkin = params.get('draft_walkin');
  const isCheckoutMode = !!queryLichDatId || (!!queryCustomerId && !!queryGoiDichVuId) || queryDraftWalkin === 'true';

  // Hooks
  const checkout = useCheckout(queryLichDatId, isCheckoutMode, queryCustomerId, queryGoiDichVuId);
  const dashboard = useFinanceDashboard(isCheckoutMode);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Deep-link ?hoa_don_id=... — mở thẳng chi tiết hóa đơn (dùng cho nút "Đóng Đợt 2" từ
  // Hồ sơ điều trị / chi tiết lịch hẹn, vì Đợt 2 chỉ thu được trên hóa đơn gói đã tồn tại).
  const openedInvoiceRef = useRef<string | null>(null);
  useEffect(() => {
    if (!queryHoaDonId || dashboard.invoices.length === 0) return;
    if (openedInvoiceRef.current === queryHoaDonId) return;
    const matched = dashboard.invoices.find((inv) => inv.id === queryHoaDonId);
    if (matched) {
      openedInvoiceRef.current = queryHoaDonId;
      dashboard.setSelectedInvoice(matched);
    }
  }, [queryHoaDonId, dashboard.invoices]);

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
    if (checkout.checkoutTab === 'package') {
      checkout.handleThanhToanPackage(dummyEvent);
    } else {
      checkout.handleThanhToanSingle(dummyEvent);
    }
  };

  // Print invoice helper
  const handlePrint = (inv: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(generateInvoiceHtml(inv));
    printWindow.document.close();
  };

  // In biên nhận cho ĐÚNG 1 giao dịch (không phải cả hóa đơn)
  const handlePrintTransaction = (inv: Invoice, pay: Payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(generateTransactionReceiptHtml(inv, pay));
    printWindow.document.close();
  };

  // ----------------------------------------------------
  // RENDER CHECKOUT MODE
  // ----------------------------------------------------
  if (isCheckoutMode) {
    if (checkout.paymentSuccessData) {
      return (
        <PaymentSuccessBox
          paymentSuccessData={checkout.paymentSuccessData}
          phuongThuc={checkout.state.phuongThuc}
          user={user}
          navigate={navigate}
          onComplete={() => {
            sessionStorage.removeItem('draft_walkin_checkin');
            checkout.setPaymentSuccessData(null);
            checkout.setFeedbackLyDo('');
            checkout.setSelectedPackage(null);
            checkout.dispatch({ type: 'RESET_HOA_DON' });
            navigate(baseFinanceRoute);
            dashboard.fetchDashboardData();
          }}
        />
      );
    }

    const fallbackBasePrice = Number((checkout.selectedPackage as any)?.don_gia || checkout.selectedPackage?.gia_ban || checkout.selectedConsultation?.don_gia_dich_vu || 0);

    const totalRequired = checkout.checkoutTab === 'package'
      ? (checkout.calculatedData
        ? (checkout.dangKyGoi && checkout.loaiThanhToan === 'tung_buoi'
          ? Number(checkout.calculatedData.so_tien_dot_1 || 0)
          : Number(checkout.calculatedData.tong_tien_thanh_toan || 0))
        : (checkout.dangKyGoi && checkout.loaiThanhToan === 'tung_buoi'
          ? 0
          : fallbackBasePrice))
      : (checkout.state.hoaDon ? Number(checkout.state.hoaDon.tong_tien_thanh_toan) : fallbackBasePrice);

    const received = Number(checkout.state.soTienNhan || 0);
    const isShortage = checkout.state.phuongThuc === 'tien_mat' && totalRequired > 0 && received > 0 && received < totalRequired;
    const changeAmount = checkout.state.phuongThuc === 'tien_mat' && received > totalRequired ? (received - totalRequired) : 0;

    const quickCashOptions = Array.from(new Set([totalRequired, 200000, 500000, 1000000, 2000000, 5000000]))
      .filter(val => val > 0)
      .sort((a, b) => a - b);

    const hasLockedTarget = !!checkout.selectedConsultation?.khuyen_nghi_goi_id ||
      !!checkout.selectedConsultation?.goi_dich_vu_id;

    const handleBackNavigation = () => {
      sessionStorage.removeItem('draft_walkin_checkin');
      if (location.state?.from) {
        navigate(location.state.from);
      } else if (Number(user?.vai_tro_id) === 2 || window.location.pathname.startsWith('/receptionist')) {
        navigate('/receptionist/appointments');
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(baseFinanceRoute);
      }
    };

    const loaiLichLabel = (() => {
      const loaiLich = String(checkout.selectedConsultation?.loai_lich || '').toUpperCase();
      const loaiGoi = String(checkout.selectedConsultation?.loai_goi || checkout.selectedPackage?.loai_goi || '').toUpperCase();
      if (loaiLich === 'KHAM_MOI' || loaiLich === 'KHAM') return 'Lượng giá PHCN';
      if (loaiLich === 'TAI_KHAM') return 'Lượng giá bổ sung';
      if (loaiLich.includes('LE') || loaiLich === 'DICH_VU_LE' || loaiLich === 'DICH_VU_DON' || loaiGoi === 'LE') return 'Dịch vụ lẻ';
      return 'Trị liệu phác đồ';
    })();

    const currentItemName = checkout.checkoutTab === 'single'
      ? (checkout.state.hoaDon?.ten_dich_vu || checkout.state.hoaDon?.ten_item || checkout.selectedConsultation?.ten_dich_vu || 'Buổi Lượng Giá PHCN (Chuyên sâu)')
      : (!checkout.dangKyGoi
        ? (checkout.calculatedData?.ten_item || checkout.selectedConsultation?.ten_dich_vu || 'Buổi Lượng Giá PHCN (Chuyên sâu)')
        : (checkout.calculatedData?.ten_goi || checkout.selectedPackage?.ten_goi || 'Gói trị liệu PHCN'));

    const currentItemPrice = checkout.checkoutTab === 'single'
      ? Number(checkout.state.hoaDon?.tong_tien_goc ?? checkout.state.hoaDon?.tong_tien_thanh_toan ?? checkout.selectedConsultation?.don_gia_dich_vu ?? 0)
      : Number(
          checkout.calculatedData?.gia_goc_goi ||
          checkout.calculatedData?.gia_goc ||
          (checkout.selectedPackage as any)?.don_gia ||
          checkout.selectedPackage?.gia_goi ||
          checkout.selectedConsultation?.don_gia_dich_vu ||
          checkout.packages.find((p: any) => p.loai_goi === 'KHAM')?.don_gia ||
          0
        );

    const tongSoBuoi = checkout.calculatedData?.so_buoi_goi || checkout.selectedPackage?.tong_so_buoi || 1;
    const packageTotalAfterDiscount = Number(checkout.calculatedData?.tong_tien_goi_sau_giam ?? checkout.calculatedData?.tong_tien_thanh_toan ?? currentItemPrice);
    const donGiaTheoBuoi = checkout.calculatedData?.don_gia_theo_buoi || (tongSoBuoi > 0 ? Math.round(packageTotalAfterDiscount / tongSoBuoi) : 0);

    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 font-jakarta text-left pb-12">
        {/* TOP BAR / PAGE HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackNavigation}
              title="Quay lại"
              className="p-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95 flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {checkout.dangKyGoi ? 'Biên Lai Gói Liệu Trình' : 'Biên Lai Dịch Vụ'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Hoàn tất thanh toán và xuất hóa đơn thu ngân tại quầy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck size={14} className="text-teal-600 dark:text-teal-400" />
              <span>{loaiLichLabel}</span>
            </span>
          </div>
        </div>

        {/* SHIFT WARNING IF RECEPTIONIST HAS NO SHIFT */}
        {Number(user?.vai_tro_id) === 2 && !hasShiftToday && !isSuperUser && (
          <div className="p-4 rounded-3xl bg-amber-50/90 dark:bg-amber-955/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <Clock3 size={18} />
            </span>
            <div className="space-y-0.5 text-left">
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                ☕ Chế độ tra cứu hồ sơ (Lễ tân không có ca trực hôm nay)
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-semibold">
                Hôm nay bạn không có ca trực được phân công tại quầy lễ tân. Chức năng xác nhận thu tiền mặt/POS tại quầy được tạm khóa an toàn để tránh ghi nhận nhầm dòng tiền của quầy. Vui lòng liên hệ Quản lý để được xếp ca trực nếu bạn đang trực thay.
              </p>
            </div>
          </div>
        )}

        {/* MAIN CHECKOUT FORM (2 COLUMNS: LEFT 7 SPAN, RIGHT 5 SPAN) */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(user?.vai_tro_id) === 2 && !hasShiftToday && !isSuperUser) {
              toast.error('Bạn không có ca trực phân công hôm nay để thực hiện thu ngân tại quầy.');
              return;
            }
            if (totalRequired === 0) {
              checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: '0' });
            }
            setShowConfirmModal(true);
          }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
        >
          {/* LEFT COLUMN: 1 KHUNG HÓA ĐƠN Y TẾ LIỀN MẠCH (60% WIDTH) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6 text-left">
            
            {/* Section 1: Thông tin khách hàng */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                    <User size={15} />
                  </span>
                  <span>Thông tin khách hàng</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Họ và tên khách hàng
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {checkout.selectedConsultation?.ten_khach_hang || 'Khách vãng lai'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Số điện thoại
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                    {checkout.selectedConsultation?.sdt_khach_hang || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Bảng kê chi tiết dịch vụ & Gói trị liệu */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                    <FileText size={15} />
                  </span>
                  <span>Bảng kê chi tiết dịch vụ</span>
                </div>

                {checkout.dangKyGoi && (checkout.calculatedData?.so_buoi_goi || checkout.selectedPackage?.tong_so_buoi) && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
                    Liệu trình {checkout.calculatedData?.so_buoi_goi || checkout.selectedPackage?.tong_so_buoi} buổi
                  </span>
                )}
              </div>

              {/* Package dropdown IF package is not pre-locked */}
              {checkout.dangKyGoi && !hasLockedTarget && (
                <div className="space-y-1.5 pb-1">
                  <label htmlFor="selectedPackage" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {checkout.selectedPackage?.loai_goi === 'LE' ? 'Dịch vụ lẻ được chỉ định *' : 'Gói trị liệu được chỉ định *'}
                  </label>
                  <select
                    id="selectedPackage"
                    value={checkout.selectedPackage?.id || ''}
                    onChange={(e) => {
                      const matched = checkout.packages.find(p => String(p.id) === e.target.value);
                      checkout.setSelectedPackage(matched || null);
                    }}
                    required
                    disabled={hasLockedTarget}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer disabled:opacity-60 shadow-xs"
                  >
                    <option value="">-- Chọn gói trị liệu --</option>
                    {checkout.packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.ten_goi} ({formatCurrency(pkg.don_gia)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Hạng mục dịch vụ</th>
                      <th className="py-3 px-3 text-center">Số lượng</th>
                      <th className="py-3 px-3 text-right">Đơn giá</th>
                      <th className="py-3 px-4 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-200">
                    <tr>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold block text-slate-900 dark:text-white">
                          {currentItemName}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono">1</td>
                      <td className="py-3.5 px-3 text-right font-mono">
                        {formatCurrency(currentItemPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(currentItemPrice)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tóm tắt chân hóa đơn */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Phiếu thu y tế OfficeCare • Thu ngân tại quầy</span>
                </div>
                <div className="font-mono text-slate-700 dark:text-slate-200 text-xs">
                  Tổng chi phí: <strong className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(currentItemPrice)}</strong>
                </div>
              </div>

              {/* CẤU HÌNH HÌNH THỨC THANH TOÁN (CHỈ KHI LÀ GÓI LIỆU TRÌNH) */}
              {checkout.dangKyGoi && checkout.selectedPackage?.loai_goi !== 'LE' && (
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Hình thức thanh toán gói
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => checkout.setLoaiThanhToan('tra_thang')}
                      className={`py-3 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        checkout.loaiThanhToan === 'tra_thang'
                          ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <CalendarCheck size={14} />
                      <span>Trả Thẳng (100%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => checkout.setLoaiThanhToan('tung_buoi')}
                      className={`py-3 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        checkout.loaiThanhToan === 'tung_buoi'
                          ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Clock3 size={14} />
                      <span>Trả Từng Buổi</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: TRẠM THANH TOÁN (STICKY POS SIDEBAR 40% WIDTH) */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl text-left">
              
              {/* 1. Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight">Tổng quan thanh toán</h3>
                    <p className="text-[9.5px] text-slate-400 font-bold">Biên lai tạm tính tại quầy thu ngân</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-955/60 dark:text-emerald-400 dark:border-emerald-800">
                  <ShieldCheck size={11} /> Chuẩn y tế
                </span>
              </div>

              {/* 2. Chi tiết tính tiền (Tạm tính + Voucher gộp 1 dòng) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Tạm tính (Giá niêm yết):</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{formatCurrency(currentItemPrice)}</span>
                </div>

                {/* Voucher Selector (Khi đã áp dụng sẽ hiển thị 1 dòng gọn gàng gộp tên mã và số tiền giảm) */}
                {checkout.checkoutTab === 'package' && (
                  <div className="pt-0.5">
                    <VoucherPicker
                      appliedVoucher={checkout.appliedVoucher}
                      onApply={checkout.handleApplyVoucher}
                      onRemove={checkout.handleRemoveVoucher}
                      disabled={false}
                      orderValue={currentItemPrice}
                      loaiThanhToan={checkout.dangKyGoi ? checkout.loaiThanhToan : 'tra_thang'}
                      khachHangId={checkout.selectedConsultation?.khach_hang_id}
                      kenh="tai_quay"
                      loaiGoi={
                        checkout.dangKyGoi && checkout.selectedPackage
                          ? (checkout.selectedPackage.loai_goi === 'LE' ? 'LE' : 'LIEU_TRINH')
                          : 'KHAM'
                      }
                    />
                  </div>
                )}

                {/* Nếu chọn trả từng buổi: hiển thị đơn giá mỗi buổi */}
                {checkout.dangKyGoi && checkout.loaiThanhToan === 'tung_buoi' && (
                  <div className="flex justify-between items-center text-teal-800 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/40 px-3 py-2 rounded-xl border border-teal-200/70 dark:border-teal-800/70">
                    <span className="font-extrabold text-xs">💰 Chi phí chia theo từng buổi ({tongSoBuoi} buổi):</span>
                    <span className="font-mono font-black text-xs text-teal-700 dark:text-teal-300">
                      {formatCurrency(donGiaTheoBuoi)} <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400">/ buổi</span>
                    </span>
                  </div>
                )}
              </div>

              {/* 3. TỔNG CỘNG PHẢI THANH TOÁN (KẾT QUẢ CUỐI CÙNG) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/90 to-emerald-50/90 dark:from-teal-950/60 dark:to-emerald-950/60 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-teal-800 dark:text-teal-300 tracking-wider block">
                    TỔNG CỘNG PHẢI THANH TOÁN
                  </span>
                  <span className="text-[10px] font-bold text-teal-600/90 dark:text-teal-400">
                    {checkout.dangKyGoi && checkout.loaiThanhToan === 'tung_buoi'
                      ? `Đợt 1 cần thu: 0đ (Thu theo từng buổi: ${formatCurrency(donGiaTheoBuoi)}/buổi)`
                      : 'Đã khấu trừ các khoản ưu đãi'}
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight shrink-0 drop-shadow-xs">
                  {formatCurrency(totalRequired)}
                </div>
              </div>

              {/* 7. PHƯƠNG THỨC THANH TOÁN (GRID 2 CỘT GỌN GÀNG) */}
              <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Phương thức thanh toán *
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Radio 1: QR PayOS */}
                  <div
                    onClick={() => checkout.dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: 'chuyen_khoan' })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      checkout.state.phuongThuc === 'chuyen_khoan'
                        ? 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-500 ring-2 ring-teal-500/20 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 shrink-0">
                      <QrCode size={14} />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-black block text-slate-900 dark:text-white truncate">QR PayOS</span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">Quét mã tức thì</span>
                    </div>
                  </div>

                  {/* Radio 2: Cash */}
                  <div
                    onClick={() => checkout.dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: 'tien_mat' })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      checkout.state.phuongThuc === 'tien_mat'
                        ? 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-500 ring-2 ring-teal-500/20 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                      <Banknote size={14} />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-black block text-slate-900 dark:text-white truncate">Tiền Mặt</span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">Thu tại quầy</span>
                    </div>
                  </div>
                </div>

                {/* Tiền mặt inputs */}
                {checkout.state.phuongThuc === 'tien_mat' && totalRequired > 0 && (
                  <div className="space-y-2.5 pt-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <div className="space-y-1">
                      <label htmlFor="soTienNhan" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Số tiền khách đưa (VND) *
                      </label>
                      <input 
                        id="soTienNhan"
                        type="text" 
                        placeholder="VD: 200.000"
                        value={checkout.state.soTienNhan ? Number(checkout.state.soTienNhan.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: raw });
                        }}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-black transition-all outline-none ${
                          isShortage 
                            ? 'bg-rose-50 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-teal-500'
                        }`}
                      />
                      {isShortage && (
                        <p className="text-[11px] text-rose-600 font-extrabold flex items-center gap-1 mt-1">
                          ⚠️ Còn thiếu {formatCurrency(totalRequired - received)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {quickCashOptions.map(val => {
                        const isActive = val === received;
                        const isExact = val === totalRequired;

                        return (
                          <button 
                            key={val} 
                            type="button"
                            onClick={() => checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: val.toString() })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                                : isExact
                                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-600 hover:text-white'
                            }`}
                          >
                            {formatCurrency(val)}
                            {isExact && !isActive && <span className="text-[9px] font-bold ml-1 opacity-80">(Đủ)</span>}
                          </button>
                        );
                      })}
                    </div>

                    {changeAmount > 0 && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs font-extrabold flex justify-between items-center shadow-xs">
                        <span>💵 Tiền thối lại khách:</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(changeAmount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Ghi chú nội bộ */}
                <div className="space-y-1 pt-0.5">
                  <label htmlFor="feedbackLyDo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Ghi chú thu ngân (nếu có)
                  </label>
                  <input 
                    id="feedbackLyDo"
                    type="text"
                    placeholder="Ghi nhận phản hồi hoặc lưu ý..."
                    value={checkout.feedbackLyDo}
                    onChange={(e) => checkout.setFeedbackLyDo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* 8. Nút bấm Xác nhận to ở cuối */}
              <button
                type="submit"
                disabled={
                  checkout.state.loading ||
                  (Number(user?.vai_tro_id) === 2 && !hasShiftToday && !isSuperUser) ||
                  (checkout.checkoutTab === 'package' ? (checkout.calculating || !checkout.calculatedData) : !checkout.state.hoaDon)
                }
                title={Number(user?.vai_tro_id) === 2 && !hasShiftToday && !isSuperUser ? 'Bạn không có ca trực phân công hôm nay để thu tiền' : undefined}
                className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2 border border-teal-400/40"
              >
                {checkout.state.loading
                  ? 'Đang xử lý...'
                  : (checkout.state.phuongThuc === 'chuyen_khoan'
                    ? '📲 TẠO MÃ QR PAYOS TỰ ĐỘNG'
                    : (totalRequired === 0 ? 'Kích hoạt phác đồ & Đặt lịch' : '🖨️ XÁC NHẬN THANH TOÁN & IN PHIẾU THU'))
                }
              </button>

              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1">
                <Lock size={11} /> Giao dịch được mã hóa và bảo mật an toàn y tế
              </p>
            </div>
          </div>
        </form>

        <ConfirmPaymentModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSubmit}
          patientName={checkout.selectedConsultation?.ten_khach_hang || ''}
          itemName={
            checkout.checkoutTab === 'package'
              ? (checkout.dangKyGoi
                ? (checkout.selectedPackage?.ten_goi || 'Gói trị liệu')
                : (checkout.calculatedData?.ten_item || 'Phí lượng giá'))
              : (checkout.state.hoaDon?.ten_dich_vu || 'Phí lượng giá/Buổi trị liệu')
          }
          totalAmount={totalRequired}
          paymentMethod={checkout.state.phuongThuc}
          receivedAmount={received}
          changeAmount={changeAmount}
          note={checkout.feedbackLyDo}
          loading={checkout.state.loading}
          actionText={totalRequired === 0 ? 'Kích hoạt phác đồ & Đặt lịch' : 'Xác nhận & Thu tiền'}
        />

        {checkout.activePayOSInvoice && (
          <QRWebhookModal
            hoaDonId={checkout.activePayOSInvoice.invoice.id}
            amount={checkout.activePayOSInvoice.amount}
            soThuTuBuoi={checkout.activePayOSInvoice.so_thu_tu_buoi}
            onClose={() => checkout.setActivePayOSInvoice(null)}
            onSuccess={(paidInvoice) => checkout.handlePayOSSuccess(paidInvoice)}
          />
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER FINANCE DASHBOARD
  // ----------------------------------------------------
  const filteredInvoices = dashboard.getFilteredInvoices();
  const filteredPayments = dashboard.getFilteredPayments();
  // Gói liệu trình đã quá hạn sử dụng, khách không phản hồi — xem docs/BUSINESS_RULES.md mục
  // "Hủy gói quá hạn sử dụng (không hoàn tiền)". Cả admin lẫn lễ tân đều thấy để dễ liên lạc thử
  // trước, nhưng chỉ Admin thấy/bấm được nút hủy trong InvoiceDetailModal.
  const overdueInvoices = dashboard.invoices.filter((inv) =>
    !!inv.phac_do_dieu_tri_id &&
    !!inv.han_su_dung &&
    new Date(inv.han_su_dung) < new Date() &&
    !['da_hoan_tien', 'da_huy'].includes(inv.trang_thai) &&
    !['huy', 'hoan_thanh'].includes(inv.trang_thai_phac_do || '')
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 text-left font-jakarta">
      {/* KPI Metrics Strip */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <FinanceKpiCards kpis={dashboard.kpis} />
      </div>

      {/* Overdue Treatment Package Alert Panel (for both Receptionist & Admin) */}
      <OverduePackagePanel
        invoices={overdueInvoices}
        onOpenDetail={(inv) => dashboard.setSelectedInvoice(inv)}
      />

      {/* Filter and Tab Navigation Bar */}
      <FinanceFilterBar
        activeTab={dashboard.activeTab}
        onTabChange={dashboard.setActiveTab}
        invoiceCount={filteredInvoices.length}
        paymentCount={filteredPayments.length}
        searchTerm={dashboard.searchTerm}
        onSearchChange={dashboard.setSearchTerm}
        statusFilter={dashboard.statusFilter}
        onStatusChange={dashboard.setStatusFilter}
        itemTypeFilter={dashboard.itemTypeFilter}
        onItemTypeChange={dashboard.setItemTypeFilter}
        methodFilter={dashboard.methodFilter}
        onMethodChange={dashboard.setMethodFilter}
        dateFilter={dashboard.dateFilter}
        onDateChange={dashboard.setDateFilter}
        startDate={dashboard.startDate}
        onStartDateChange={dashboard.setStartDate}
        endDate={dashboard.endDate}
        onEndDateChange={dashboard.setEndDate}
      />

      {/* Main Data Tables Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-6">
        {dashboard.activeTab === 'invoices' ? (
          <InvoiceTable
            invoices={filteredInvoices}
            loading={dashboard.dashboardLoading}
            page={dashboard.page}
            pageSize={dashboard.pageSize}
            onPageChange={dashboard.setPage}
            onSelectInvoice={(inv) => dashboard.setSelectedInvoice(inv)}
          />
        ) : (
          <PaymentTable
            payments={filteredPayments}
            allPayments={dashboard.payments}
            invoices={dashboard.invoices}
            loading={dashboard.dashboardLoading}
            isAdminOrManager={isAdminOrManager}
            page={dashboard.page}
            pageSize={dashboard.pageSize}
            onPageChange={dashboard.setPage}
            onOpenRefund={(inv) => dashboard.setSelectedInvoice(inv)}
          />
        )}
      </div>

      {/* Modals Container */}
      <FastPaymentModal
        invoice={dashboard.fastPayInvoice}
        onClose={() => dashboard.setFastPayInvoice(null)}
        onSubmit={dashboard.handleFastPaySubmit}
        method={dashboard.fastPayMethod}
        setMethod={dashboard.setFastPayMethod}
        received={dashboard.fastPayReceived}
        setReceived={dashboard.setFastPayReceived}
        note={dashboard.fastPayNote}
        setNote={dashboard.setFastPayNote}
        loading={dashboard.fastPayLoading}
      />

      {dashboard.selectedInvoice && (
        <InvoiceDetailModal
          invoice={dashboard.selectedInvoice}
          payments={dashboard.payments}
          isAdminOrManager={isAdminOrManager}
          onClose={() => dashboard.setSelectedInvoice(null)}
          onPrint={handlePrint}
          onPrintTransaction={handlePrintTransaction}
          onOpenFastPay={(inv) => {
            dashboard.setFastPayInvoice(inv);
            dashboard.setSelectedInvoice(null);
          }}
          onRefund={dashboard.handleRefund}
          onPackageRefund={dashboard.handlePackageRefund}
          onExpireNoRefund={dashboard.handleExpireNoRefund}
        />
      )}
    </div>
  );
}
