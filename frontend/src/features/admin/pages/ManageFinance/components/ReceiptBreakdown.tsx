import React from 'react';
import { Receipt, Tag, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import type { Invoice } from '../hooks/useFinanceDashboard';
import type { CalculatedCheckoutData, AssignedPackage } from '../hooks/useCheckout';

interface ReceiptBreakdownProps {
  checkoutTab: 'package' | 'single';
  hoaDon: Invoice | null;
  dangKyGoi: boolean;
  selectedPackage: AssignedPackage | null;
  calculatedData: CalculatedCheckoutData | null;
  loaiThanhToan: 'tra_thang' | 'tung_buoi';
}

export const ReceiptBreakdown: React.FC<ReceiptBreakdownProps> = ({
  checkoutTab,
  hoaDon,
  dangKyGoi,
  selectedPackage,
  calculatedData,
  loaiThanhToan,
}) => {
  const tongSoBuoi = calculatedData?.so_buoi_goi || selectedPackage?.tong_so_buoi || 1;
  const rawBasePrice = Number((selectedPackage as any)?.don_gia || (selectedPackage as any)?.gia_goi || selectedPackage?.gia_ban || 0);

  const basePrice = checkoutTab === 'single'
    ? Number(hoaDon?.tong_tien_goc || hoaDon?.tong_tien_thanh_toan || 0)
    : (!dangKyGoi
      ? Number(calculatedData?.gia_goc || (selectedPackage as any)?.don_gia || 0)
      : Number(calculatedData?.gia_goc_goi || (selectedPackage as any)?.don_gia || selectedPackage?.gia_ban || 0));

  const totalToPay = checkoutTab === 'single'
    ? Number(hoaDon?.tong_tien_thanh_toan || 0)
    : (!dangKyGoi
      ? Number(calculatedData?.tong_tien_thanh_toan ?? rawBasePrice)
      : (loaiThanhToan === 'tung_buoi'
        ? Number(calculatedData?.so_tien_dot_1 ?? 0)
        : Number(calculatedData?.tong_tien_thanh_toan ?? rawBasePrice)));

  const packageTotalAfterDiscount = Number(calculatedData?.tong_tien_goi_sau_giam ?? calculatedData?.tong_tien_thanh_toan ?? rawBasePrice);
  const donGiaTheoBuoi = calculatedData?.don_gia_theo_buoi || (tongSoBuoi > 0 ? Math.round(packageTotalAfterDiscount / tongSoBuoi) : 0);
  const voucherDiscount = Number(calculatedData?.so_tien_giam_voucher || 0);

  return (
    <div className="space-y-4 text-left font-jakarta">
      {/* Receipt Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
            <Receipt size={18} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Tổng quan đơn hàng</h3>
            <p className="text-[10px] text-slate-400 font-bold">Biên lai tạm tính tại quầy thu ngân</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-955/60 dark:text-emerald-400 dark:border-emerald-800">
          <ShieldCheck size={11} /> Chuẩn y tế
        </span>
      </div>

      {/* Breakdown Calculation Rows */}
      <div className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span>Tạm tính (Giá niêm yết):</span>
          <span className="font-mono font-black text-slate-900 dark:text-white">{formatCurrency(basePrice)}</span>
        </div>

        {voucherDiscount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1"><Tag size={12} /> Voucher giảm giá:</span>
            <span className="font-mono font-black">-{formatCurrency(voucherDiscount)}</span>
          </div>
        )}

        {/* Nếu chọn trả từng buổi: hiển thị rõ đơn giá mỗi buổi sau khi đã chia voucher */}
        {dangKyGoi && loaiThanhToan === 'tung_buoi' && (
          <div className="flex justify-between items-center text-teal-800 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/40 px-3 py-2 rounded-xl border border-teal-200/70 dark:border-teal-800/70">
            <span className="font-extrabold text-[11px]">💰 Chi phí chia theo từng buổi ({tongSoBuoi} buổi):</span>
            <span className="font-mono font-black text-xs text-teal-700 dark:text-teal-300">
              {formatCurrency(donGiaTheoBuoi)} <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400">/ buổi</span>
            </span>
          </div>
        )}

        {/* Total display card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/90 to-emerald-50/90 dark:from-teal-950/60 dark:to-emerald-950/60 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-between gap-3 shadow-xs mt-1">
          <div>
            <span className="text-[10px] font-black uppercase text-teal-800 dark:text-teal-300 tracking-wider block">
              TỔNG CỘNG PHẢI THANH TOÁN
            </span>
            <span className="text-[10px] font-bold text-teal-600/90 dark:text-teal-400">
              {loaiThanhToan === 'tung_buoi'
                ? `Đợt 1 cần thu: 0đ (Thu theo từng buổi ${formatCurrency(donGiaTheoBuoi)}/buổi)`
                : 'Đã khấu trừ các ưu đãi'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight shrink-0 drop-shadow-xs">
            {formatCurrency(totalToPay)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptBreakdown;
