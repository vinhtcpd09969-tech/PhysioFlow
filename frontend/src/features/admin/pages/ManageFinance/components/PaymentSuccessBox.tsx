import React from 'react';
import { CalendarRange } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';

interface PaymentSuccessBoxProps {
  paymentSuccessData: any;
  phuongThuc: string;
  user: any;

  onComplete: () => void;
  navigate: (path: string) => void;
}

export const PaymentSuccessBox: React.FC<PaymentSuccessBoxProps> = ({
  paymentSuccessData,
  phuongThuc,
  user,

  onComplete,
  navigate,
}) => {
  if (!paymentSuccessData) return null;

  return (
    <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-zinc-150 shadow-lg p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner font-extrabold">
        ✓
      </div>
      
      <div className="space-y-2">
        <h2 className="font-heading font-black text-secondary text-xl">Thanh Toán Thành Công!</h2>
        <p className="text-zinc-500 text-xs font-semibold">
          Hóa đơn cho khách hàng <span className="text-secondary font-bold">{paymentSuccessData.tenKhachHang}</span> đã được thanh toán.
        </p>
      </div>

      <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 space-y-3.5 text-left text-xs font-semibold text-zinc-650">
        <div className="flex justify-between border-b border-zinc-100 pb-2">
          <span>Mã hóa đơn:</span>
          <span className="text-secondary font-bold font-mono">
            {paymentSuccessData.hoaDon?.ma_hoa_don || 'HD-' + paymentSuccessData.hoaDon?.id?.substring(0, 8)}
          </span>
        </div>
        {/* Số tiền THỰC THU của giao dịch này (Đợt 1 của trả góp chỉ là 50%), không phải tổng
            giá trị hóa đơn — hai con số này khác nhau ở trả góp và trả từng buổi. */}
        <div className="flex justify-between border-b border-zinc-100 pb-2">
          <span>Số tiền đã thu:</span>
          <span className="text-primary font-black text-sm">
            {formatCurrency(Number(paymentSuccessData.soTienDaThu ?? paymentSuccessData.hoaDon?.so_tien_da_tra ?? 0))}
          </span>
        </div>

        {Number(paymentSuccessData.soTienConLai || 0) > 0 && (
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <span>Còn lại của hóa đơn:</span>
            <span className="text-amber-700 font-black text-sm">
              {formatCurrency(Number(paymentSuccessData.soTienConLai))}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Hình thức thanh toán:</span>
          <span className="text-secondary font-bold">
            {phuongThuc === 'tien_mat' ? '💵 Tiền mặt' : phuongThuc === 'chuyen_khoan' ? '🏦 Chuyển khoản' : '💳 Thẻ/POS'}
          </span>
        </div>
      </div>

      {paymentSuccessData.khuyenNghiGoiId && paymentSuccessData.khuyenNghiLoaiGoi === 'LE' && (
        <div className="bg-amber-50 border border-amber-200/85 rounded-2xl p-5 space-y-4 text-left animate-in slide-in-from-bottom duration-250">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 text-xl shrink-0">💡</span>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-amber-955">Chỉ định dịch vụ lẻ từ Chuyên viên tư vấn</h4>
              <p className="text-[11px] text-amber-800 leading-normal font-semibold">
                Chuyên viên tư vấn đã chỉ định khách hàng thực hiện thêm dịch vụ lẻ:
              </p>
              <p className="text-xs font-black text-amber-900 mt-1">
                👉 {paymentSuccessData.khuyenNghiTenGoi || 'Dịch vụ lẻ chỉ định'}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              const calendarPath = Number(user?.vai_tro_id) === 2 ? '/receptionist/appointments' : '/admin/appointments';
              navigate(`${calendarPath}?khach_hang_id=${paymentSuccessData.khachHangId}&goi_dich_vu_id=${paymentSuccessData.khuyenNghiGoiId}&range=today&view=timeline`);
            }}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CalendarRange size={16} /> Đặt lịch hẹn ngay
          </button>
        </div>
      )}

      {/* nextSessionNum === null có 2 nghĩa khác nhau: (a) không áp dụng, hoặc (b) buổi vừa thanh
          toán chính là buổi CUỐI của gói (không còn buổi tiếp theo để gợi ý — gói đã xong). Trước
          đây không phân biệt 2 trường hợp, khiến buổi cuối hiện nhầm gợi ý "Đặt lịch Buổi 1" (như
          thể vừa đăng ký gói mới). Nhánh LE (dịch vụ lẻ) không phụ thuộc buổi số nên luôn hiện. */}
      {paymentSuccessData.daDangKyGoiId
        && (paymentSuccessData.daDangKyGoiLoai === 'LE' || paymentSuccessData.nextSessionNum) && (
        <div className="bg-emerald-50 border border-emerald-200/85 rounded-2xl p-5 space-y-4 text-left animate-in slide-in-from-bottom duration-250">
          <div className="flex items-start gap-3">
            <span className="text-emerald-600 text-xl shrink-0">📅</span>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-emerald-955">
                {paymentSuccessData.daDangKyGoiLoai === 'LE'
                  ? 'Đặt lịch hẹn dịch vụ ngay'
                  : (paymentSuccessData.nextSessionNum && paymentSuccessData.nextSessionNum > 1
                      ? `Đặt lịch hẹn Buổi ${paymentSuccessData.nextSessionNum} tiếp theo`
                      : 'Đặt lịch hẹn Buổi 1 nhanh')}
              </h4>
              <p className="text-[11px] text-emerald-800 leading-normal font-semibold">
                {paymentSuccessData.daDangKyGoiLoai === 'LE'
                  ? 'Đăng ký dịch vụ thành công! Bạn có muốn đặt lịch hẹn thực hiện dịch vụ ngay bây giờ không?'
                  : (paymentSuccessData.nextSessionNum && paymentSuccessData.nextSessionNum > 1
                      ? `Thanh toán thành công! Bạn có muốn đặt lịch hẹn cho buổi điều trị tiếp theo (Buổi ${paymentSuccessData.nextSessionNum}) ngay bây giờ không?`
                      : 'Đăng ký gói thành công! Bạn có muốn đặt lịch hẹn cho buổi điều trị đầu tiên (Buổi 1) ngay bây giờ không?')}
              </p>
              <p className="text-xs font-black text-emerald-900 mt-1">
                👉 {paymentSuccessData.daDangKyGoiTen || 'Gói liệu trình chuyên sâu'}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              const calendarPath = Number(user?.vai_tro_id) === 2 ? '/receptionist/appointments' : '/admin/appointments';
              navigate(`${calendarPath}?khach_hang_id=${paymentSuccessData.khachHangId}&goi_dich_vu_id=${paymentSuccessData.daDangKyGoiId}&range=today&view=timeline`);
            }}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CalendarRange size={16} /> 
            {paymentSuccessData.daDangKyGoiLoai === 'LE'
              ? 'Đặt lịch hẹn ngay'
              : (paymentSuccessData.nextSessionNum && paymentSuccessData.nextSessionNum > 1
                  ? `Đặt lịch hẹn Buổi ${paymentSuccessData.nextSessionNum} ngay`
                  : 'Đặt lịch hẹn Buổi 1 ngay')}
          </button>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            onComplete();
            const calendarPath = Number(user?.vai_tro_id) === 2 ? '/receptionist/appointments' : '/admin/appointments';
            navigate(`${calendarPath}?range=today&view=timeline`);
          }}
          className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <CalendarRange size={16} /> Quay lại hàng chờ hôm nay
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200/80 active:scale-[0.98] text-secondary text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-zinc-200"
        >
          Quản lý tài chính
        </button>
      </div>
    </div>
  );
};
export default PaymentSuccessBox;
