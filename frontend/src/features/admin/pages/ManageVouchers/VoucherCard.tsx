import { Calendar, Check, Copy, Edit3 } from 'lucide-react';
import { formatVoucherPaymentMethods } from '../../../../utils/voucherPaymentMethod';

export interface Voucher {
  id: string;
  ma_voucher: string;
  ten_chien_dich: string;
  loai_giam: 'phan_tram' | 'so_tien_co_dinh';
  gia_tri_giam: number;
  giam_toi_da: number | null;
  don_hang_toi_thieu: number;
  so_luong_toi_da: number | null;
  ngay_bat_dau: string;
  ngay_het_han: string | null;
  trang_thai: 'hoat_dong' | 'tam_dung' | 'sap_ra_mat' | 'het_han' | 'vo_hieu';
  dang_kich_hoat?: boolean;
  yeu_cau_thanh_toan: string[];
  tu_dong_ap_dung?: boolean;
  loai_goi_ap_dung?: string[];
}

interface VoucherCardProps {
  v: Voucher;
  copiedId: string | null;
  handleCopyCode: (code: string, id: string) => void;
  handleToggleVoucherStatus: (v: Voucher) => void;
  onEdit: (v: Voucher) => void;
  formatCurrency: (amount: number) => string;
  formatCurrencyShort: (amount: number) => string;
  formatDate: (dateStr: string) => string;
}

export function VoucherCard({
  v,
  copiedId,
  handleCopyCode,
  handleToggleVoucherStatus,
  onEdit,
  formatCurrency,
  formatCurrencyShort,
  formatDate
}: VoucherCardProps) {
  const paymentMethodLabel = formatVoucherPaymentMethods(v.yeu_cau_thanh_toan);
  const isExpired = v.ngay_het_han && new Date(v.ngay_het_han) < new Date();
  const isUpcoming = new Date(v.ngay_bat_dau) > new Date();
  
  let computedStatus = v.trang_thai;
  if (isExpired) computedStatus = 'het_han';
  else if (v.trang_thai === 'vo_hieu' || v.dang_kich_hoat === false || v.trang_thai === 'tam_dung') computedStatus = 'tam_dung';
  else if (isUpcoming && v.trang_thai === 'hoat_dong') computedStatus = 'sap_ra_mat';

  return (
    <div 
      className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl flex flex-col sm:flex-row shadow-soft-ui hover:shadow-soft-ui-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden min-h-[180px]"
    >
      {/* Left Side of Ticket (Coupon Tag) */}
      <div className="sm:w-44 border-b sm:border-b-0 sm:border-r border-dashed border-slate-200/80 dark:border-zinc-800 p-6 flex flex-col items-center justify-center relative min-h-[140px] rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl bg-gradient-to-br from-teal-50/5 to-primary/10 dark:from-zinc-900 dark:to-zinc-950">
        
        {/* Circle cutouts for ticket look */}
        <div className="hidden sm:block absolute -top-3.5 -right-3.5 w-7 h-7 bg-background border border-slate-200 dark:border-zinc-800 rounded-full z-10" />
        <div className="hidden sm:block absolute -bottom-3.5 -right-3.5 w-7 h-7 bg-background border border-slate-200 dark:border-zinc-800 rounded-full z-10" />
        
        <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 font-heading text-primary dark:text-emerald-400">
          MÃ GIẢM GIÁ
        </span>
        <div className="text-3xl font-black text-secondary dark:text-zinc-100 font-heading tracking-tight flex items-baseline gap-0.5">
          {v.loai_giam === 'phan_tram' ? (
            <>
              {v.gia_tri_giam}<span className="text-lg font-bold text-primary dark:text-emerald-400">%</span>
            </>
          ) : (
            <span className="text-2xl">{formatCurrencyShort(v.gia_tri_giam)}</span>
          )}
        </div>
        {v.giam_toi_da && (
          <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-semibold mt-1 text-center">
            Tối đa {formatCurrencyShort(v.giam_toi_da)}
          </span>
        )}

        {/* Copiable Code pill */}
        <div 
          onClick={() => handleCopyCode(v.ma_voucher, v.id)}
          className={`mt-4 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all select-none ${
            copiedId === v.id 
              ? 'bg-emerald-500 text-white border border-emerald-500' 
              : 'bg-white dark:bg-zinc-950 text-teal-600 dark:text-teal-300 border border-teal-200/80 dark:border-zinc-800 hover:bg-teal-50 dark:hover:bg-zinc-800'
          }`}
        >
          {copiedId === v.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-teal-500/70 dark:text-teal-400" />}
          {v.ma_voucher}
        </div>
      </div>

      {/* Right Side of Ticket (Voucher details) */}
      <div className="flex-1 p-6 flex flex-col justify-between bg-white dark:bg-zinc-900 sm:rounded-r-3xl">
        <div>
          {/* Badge Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                computedStatus === 'hoat_dong' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' :
                computedStatus === 'sap_ra_mat' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' :
                computedStatus === 'het_han' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' :
                'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}>
                {computedStatus === 'hoat_dong' ? '🔥 Đang chạy' :
                 computedStatus === 'sap_ra_mat' ? '⏳ Sắp hoạt động' :
                 computedStatus === 'het_han' ? '⌛ Đã hết hạn' : '⏸️ Tạm ngưng'}
              </span>

              {v.tu_dong_ap_dung && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                  ✨ Tự động trừ tiền
                </span>
              )}

              {v.loai_goi_ap_dung && !v.loai_goi_ap_dung.includes('tat_ca') && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  Gói: {v.loai_goi_ap_dung.map(l => l === 'LIEU_TRINH' ? 'Liệu trình' : l === 'KHAM' ? 'Lượng giá' : l === 'LE' ? 'Dịch vụ lẻ' : l).join(', ')}
                </span>
              )}

              {paymentMethodLabel && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                  Chỉ {paymentMethodLabel}
                </span>
              )}
            </div>

            {/* Toggle status */}
            <button
              onClick={() => handleToggleVoucherStatus(v)}
              title={computedStatus === 'hoat_dong' ? 'Ngưng sử dụng mã giảm giá' : 'Kích hoạt lại mã giảm giá'}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                computedStatus === 'hoat_dong' || computedStatus === 'sap_ra_mat' ? 'bg-teal-500' : 'bg-slate-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  computedStatus === 'hoat_dong' || computedStatus === 'sap_ra_mat' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <h3 className="font-extrabold text-slate-900 dark:text-zinc-100 text-sm md:text-base mb-1 group-hover:text-teal-600 transition-colors">
            {v.ten_chien_dich || 'Chiến dịch ưu đãi'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
            Áp dụng cho đơn hàng từ <span className="font-black text-slate-800 dark:text-zinc-200">{formatCurrency(v.don_hang_toi_thieu)}</span>.
          </p>
        </div>

        {/* Details */}
        <div className="mt-4 pt-4 border-t border-slate-100/80 space-y-3">
          <div className="flex justify-between text-[11px] text-slate-550">
            <span>Giới hạn lượt dùng:</span>
            <span className="font-semibold text-slate-707">
              {v.so_luong_toi_da ? `${v.so_luong_toi_da} lượt / khách hàng` : 'Không giới hạn'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              <span>Hạn dùng: {formatDate(v.ngay_bat_dau)} - {v.ngay_het_han ? formatDate(v.ngay_het_han) : 'Vô thời hạn'}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(v)}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
