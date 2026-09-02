import React from 'react';
import { BUOI_INFO, formatFullDate } from '../../constants';
import { formatCurrency } from '@/utils/format';

interface BookingSummaryCardProps {
  bookingType: 'kham' | 'dich_vu';
  selectedService: any;
  selectedDate: string;
  isClient: boolean;
  selectedBuoi: '' | 'sang' | 'chieu';
  selectedStaffObj: any;
  paymentMethod: 'tai_quay' | 'payos';
  selectedVoucher: any;
  discountAmount: number;
  finalPrice: number;
}

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  bookingType,
  selectedService,
  selectedDate,
  isClient,
  selectedBuoi,
  selectedStaffObj,
  paymentMethod,
  selectedVoucher,
  discountAmount,
  finalPrice,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-5 text-left">
      <div className="space-y-3">
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            bookingType === 'dich_vu'
              ? 'bg-teal-50 text-teal-700 border-teal-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {bookingType === 'dich_vu' ? 'Trị liệu dịch vụ đơn lẻ' : 'Gói tư vấn lượng giá'}
        </span>
        <h3 className="text-base font-black text-slate-900 leading-snug">
          {selectedService?.ten_dich_vu ||
            (bookingType === 'dich_vu'
              ? 'Chọn dịch vụ đơn lẻ'
              : 'Lượng giá PHCN & Đánh giá ROM/VAS/MMT')}
        </h3>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="space-y-3.5 text-xs font-jakarta">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ngày</span>
          <span className="text-slate-900 font-black capitalize">
            {selectedDate && isClient
              ? formatFullDate(selectedDate).split(',').slice(0, 2).join(',')
              : 'Chưa chọn'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Buổi nhận ca</span>
          <span className="text-slate-900 font-black">
            {selectedBuoi
              ? `${BUOI_INFO[selectedBuoi].label} (${BUOI_INFO[selectedBuoi].khung})`
              : 'Chưa chọn'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Nhân sự</span>
          <span className={selectedStaffObj ? 'text-teal-700 font-black' : 'text-slate-900 font-black'}>
            {selectedStaffObj ? selectedStaffObj.ho_ten : 'Chưa chọn'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hình thức trả</span>
          <span className="text-slate-900 font-black">
            {paymentMethod === 'payos' ? '💳 PayOS Online' : '🏪 Tại quầy'}
          </span>
        </div>

        {selectedVoucher && (
          <div className="flex justify-between items-center text-emerald-600 font-bold">
            <span className="uppercase tracking-wider text-[10px]">
              Mã giảm giá ({selectedVoucher.ma_voucher})
            </span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <span className="text-slate-700 font-black uppercase tracking-wider text-xs">Tổng chi phí</span>
          <span className="text-teal-600 bg-teal-50 border-teal-100 font-black px-3 py-1 rounded-full border text-sm">
            {formatCurrency(finalPrice)}
          </span>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Benefits List */}
      <div className="space-y-2 text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quyền lợi đăng ký</p>
        <ul className="space-y-2 text-xs font-bold text-slate-650">
          <li className="flex items-center gap-2">
            <span className="text-teal-600">✓</span>
            <span>Lấy số thứ tự &amp; Phục vụ theo thứ tự check-in</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-teal-600">✓</span>
            <span>Đánh giá tầm vận động (ROM) &amp; Cơ lực (MMT)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-teal-600">✓</span>
            <span>Bảo mật tuyệt đối dữ liệu y tế cá nhân</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
