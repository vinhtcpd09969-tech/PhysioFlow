import { Calendar, Check, Copy, Edit3, Trash2 } from 'lucide-react';

export interface Voucher {
  id: string;
  ma_voucher: string;
  ten_chien_dich: string;
  loai_giam: 'phan_tram' | 'so_tien_co_dinh';
  gia_tri_giam: number;
  giam_toi_da: number | null;
  don_hang_toi_thieu: number;
  so_luong_toi_da: number | null;
  so_luong_da_dung: number;
  ngay_bat_dau: string;
  ngay_het_han: string | null;
  trang_thai: 'hoat_dong' | 'tam_dung' | 'sap_ra_mat' | 'het_han';
  yeu_cau_thanh_toan: 'tat_ca' | 'tra_thang' | 'tra_gop';
}

interface VoucherCardProps {
  v: Voucher;
  copiedId: string | null;
  handleCopyCode: (code: string, id: string) => void;
  handleToggleVoucherStatus: (v: Voucher) => void;
  onEdit: (v: Voucher) => void;
  onDelete: (id: string) => void;
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
  onDelete,
  formatCurrency,
  formatCurrencyShort,
  formatDate
}: VoucherCardProps) {
  const capacityPercent = v.so_luong_toi_da ? (v.so_luong_da_dung / v.so_luong_toi_da) * 100 : 0;
  const isExpired = v.ngay_het_han && new Date(v.ngay_het_han) < new Date();
  const isUpcoming = new Date(v.ngay_bat_dau) > new Date();
  
  let computedStatus = v.trang_thai;
  if (isExpired) computedStatus = 'het_han';
  else if (isUpcoming && v.trang_thai === 'hoat_dong') computedStatus = 'sap_ra_mat';

  return (
    <div 
      className="group relative bg-white border border-slate-200 rounded-3xl flex flex-col sm:flex-row shadow-soft-ui hover:shadow-soft-ui-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden min-h-[180px]"
    >
      {/* Left Side of Ticket (Coupon Tag) */}
      <div className="sm:w-44 border-b sm:border-b-0 sm:border-r border-dashed border-slate-200/80 p-6 flex flex-col items-center justify-center relative min-h-[140px] rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl bg-gradient-to-br from-teal-50/5 to-primary/10">
        
        {/* Circle cutouts for ticket look */}
        <div className="hidden sm:block absolute -top-3.5 -right-3.5 w-7 h-7 bg-background border border-slate-200 rounded-full z-10" />
        <div className="hidden sm:block absolute -bottom-3.5 -right-3.5 w-7 h-7 bg-background border border-slate-200 rounded-full z-10" />
        
        <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 font-heading text-primary">
          MÃ GIẢM GIÁ
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

        {/* Copiable Code pill */}
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
                'bg-slate-55 text-slate-500 border-slate-200'
              }`}>
                {computedStatus === 'hoat_dong' ? 'Đang chạy' :
                 computedStatus === 'tam_dung' ? 'Tạm dừng' :
                 computedStatus === 'sap_ra_mat' ? 'Sắp hoạt động' : 'Hết hạn'}
              </span>

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

          <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-primary transition-colors">
            {v.ten_chien_dich || 'Chiến dịch ưu đãi'}
          </h3>
          <p className="text-xs text-slate-505 leading-relaxed">
            Áp dụng cho đơn hàng từ <span className="font-semibold text-slate-700">{formatCurrency(v.don_hang_toi_thieu)}</span>.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Áp dụng cho toàn bộ hóa đơn thanh toán</span>
          </div>
        </div>

        {/* Progress Bar & Details */}
        <div className="mt-4 pt-4 border-t border-slate-100/80 space-y-3">
          <div>
            <div className="flex justify-between text-[11px] text-slate-550 mb-1">
              <span>Lượt đã dùng:</span>
              <span className="font-semibold text-slate-707">
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
                onClick={() => onEdit(v)}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(v.id)}
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
}
