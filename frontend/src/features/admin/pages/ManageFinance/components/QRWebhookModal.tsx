import React, { useEffect, useState, useRef } from 'react';
import { QrCode, Clock, ArrowUpRight, X, Copy, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../../../api/axios';
import { formatCurrency } from '../../../../../utils/format';

interface QRWebhookModalProps {
  hoaDonId: string;
  amount: number;
  soThuTuBuoi?: number;
  onClose: () => void;
  onSuccess: (paidInvoice: any) => void;
}

export const QRWebhookModal: React.FC<QRWebhookModalProps> = ({
  hoaDonId,
  amount,
  soThuTuBuoi,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [payosLinkData, setPayosLinkData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [cancelling, setCancelling] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const pollingTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // 1. Create PayOS Payment Link on mount
  useEffect(() => {
    const createLink = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.post('/receptionist/payment/create-payos-link', {
          hoa_don_id: hoaDonId,
          so_thu_tu_buoi: soThuTuBuoi,
        });
        setPayosLinkData(res.data);
        setLoading(false);
      } catch (error: any) {
        console.error('Lỗi khi tạo link PayOS:', error);
        toast.error(error.response?.data?.message || 'Không thể kết nối với cổng thanh toán PayOS');
        onClose();
      }
    };

    createLink();

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [hoaDonId]);

  // 2. Start countdown & polling when payosLinkData is loaded
  useEffect(() => {
    if (!payosLinkData) return;

    // Start countdown
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          clearInterval(pollingTimerRef.current!);
          toast.error('Mã thanh toán QR đã hết hạn!');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start polling status
    pollingTimerRef.current = setInterval(async () => {
      try {
        const orderCodeParam = payosLinkData?.orderCode ? `?orderCode=${payosLinkData.orderCode}` : '';
        const res = await axiosInstance.get(`/receptionist/payment/status/${hoaDonId}${orderCodeParam}`);
        const { trang_thai } = res.data;
        if (trang_thai === 'da_thanh_toan') {
          clearInterval(pollingTimerRef.current!);
          clearInterval(countdownTimerRef.current!);
          toast.success('🎉 Thanh toán thành công qua PayOS!');
          onSuccess(res.data);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
      }
    }, 3000);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [payosLinkData, hoaDonId]);

  // 3. Handle cancel payment
  const handleCancel = async () => {
    try {
      setCancelling(true);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      await axiosInstance.post('/receptionist/payment/cancel-payos-link', {
        hoa_don_id: hoaDonId,
        orderCode: payosLinkData?.orderCode,
        order_code: payosLinkData?.orderCode
      });

      toast.success('Đã hủy giao dịch thanh toán QR');
      onClose();
    } catch (error) {
      console.error('Lỗi khi hủy link PayOS:', error);
      toast.error('Có lỗi xảy ra khi hủy link thanh toán');
      onClose();
    } finally {
      setCancelling(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQRImageUrl = () => {
    if (!payosLinkData) return '';
    const bin = payosLinkData.bin || '970415';
    const accountNumber = payosLinkData.accountNumber || '113366668888';
    const accountName = payosLinkData.accountName || 'PAYOS TEST';
    const desc = payosLinkData.description || `TTHD${hoaDonId.replace(/-/g, '').substring(0, 8).toUpperCase()}`;
    
    return `https://img.vietqr.io/image/${bin}-${accountNumber}-compact.png?amount=${amount}&addInfo=${desc}&accountName=${encodeURIComponent(accountName)}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-left font-jakarta">
        
        {/* Header Bar Pro Max */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white shadow-xs">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base tracking-wide uppercase">CỔNG THANH TOÁN VIETQR PAYOS</h3>
                <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-white/30 backdrop-blur-xs">
                  ⚡ Webhook Real-time
                </span>
              </div>
              <p className="text-xs text-teal-50 font-semibold">Tự động nhận tiền & cập nhật hóa đơn y tế tức thì</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!loading && (
              <div className="hidden sm:flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 text-amber-200 px-3.5 py-1.5 rounded-full text-xs font-black animate-pulse">
                <Clock size={14} />
                <span>Giữ mã: {formatTime(timeLeft)}</span>
              </div>
            )}
            <button 
              type="button" 
              onClick={handleCancel}
              disabled={cancelling}
              className="p-2 hover:bg-white/20 active:scale-95 rounded-xl transition-all cursor-pointer text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content 2-Column Layout */}
        <div className="p-6 md:p-8">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin"></div>
                <QrCode className="absolute inset-0 m-auto text-teal-600 size-6" />
              </div>
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Đang khởi tạo mã VietQR thanh toán chuẩn PayOS...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* LEFT COLUMN (7 cols): Information & Account Details */}
              <div className="md:col-span-7 space-y-5">
                
                {/* Expire countdown badge mobile view */}
                <div className="flex sm:hidden items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 p-3 rounded-2xl text-xs font-bold">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> Thời gian giữ mã:</span>
                  <span className="font-mono text-sm font-black text-amber-600">{formatTime(timeLeft)}</span>
                </div>

                {/* Amount to pay Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/80 via-emerald-50/50 to-slate-50 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider block">
                    Số tiền thanh toán cần thu:
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl md:text-3xl font-black text-teal-600 dark:text-teal-400 font-mono">
                      {formatCurrency(amount)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <ShieldCheck size={12} /> Khóa chính xác
                    </span>
                  </div>
                </div>

                {/* Account & Transfer Info Table */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  
                  {/* Transfer Note (CRITICAL) */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-700">
                    <span className="text-slate-500 font-extrabold text-[11px]">Nội dung chuyển khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <code className="px-2.5 py-1 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-lg font-mono font-black border border-teal-300 dark:border-teal-800 text-xs select-all">
                        {payosLinkData.description}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(payosLinkData.description, 'Nội dung chuyển khoản')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-500 hover:text-teal-600 cursor-pointer"
                        title="Copy nội dung"
                      >
                        {copiedField === 'Nội dung chuyển khoản' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Beneficiary Account */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-700">
                    <span className="text-slate-500 font-extrabold text-[11px]">Chủ tài khoản:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                      {payosLinkData.accountName}
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-700">
                    <span className="text-slate-500 font-extrabold text-[11px]">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                        {payosLinkData.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(payosLinkData.accountNumber, 'Số tài khoản')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-500 hover:text-teal-600 cursor-pointer"
                        title="Copy số tài khoản"
                      >
                        {copiedField === 'Số tài khoản' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Bank Name */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-extrabold text-[11px]">Ngân hàng:</span>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400">
                      {payosLinkData.bin === '970415' ? 'VietinBank (NH Công Thương)' : 'MBBank (NH Quân Đội)'}
                    </span>
                  </div>

                </div>

                {/* Webhook Radar Indicator */}
                <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></div>
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative"></div>
                  </div>
                  <p className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 leading-tight">
                    Hệ thống đang tự động quét chuyển khoản qua Webhook PayOS... Không cần chụp ảnh biên lai.
                  </p>
                </div>

              </div>

              {/* RIGHT COLUMN (5 cols): High-Res VietQR Code Box */}
              <div className="md:col-span-5 flex flex-col items-center justify-center space-y-4">
                
                {/* QR Container with 3D Elevation */}
                <div className="relative p-4 bg-white rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 group">
                  <img 
                    src={getQRImageUrl()} 
                    alt="Mã VietQR Thanh toán" 
                    className="w-60 h-60 md:w-64 md:h-64 object-contain rounded-xl"
                  />
                  
                  {/* Hover Overlay to Open PayOS link directly */}
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-3xl p-4 text-center">
                    <p className="text-white text-xs font-bold mb-3">Mở cổng thanh toán Web PayOS trong tab mới</p>
                    <a 
                      href={payosLinkData.checkoutUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-teal-500/30 cursor-pointer active:scale-95 transition-all"
                    >
                      <span>Mở PayOS Checkout</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                  Quét bằng App Ngân hàng bất kỳ
                </p>

              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-semibold hidden sm:block">
            Nhấn "Hủy thanh toán" nếu khách hàng muốn đổi phương thức thanh toán tiền mặt.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full sm:w-auto px-6 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelling ? 'Đang hủy...' : 'Hủy thanh toán QR'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default QRWebhookModal;

