import { Ticket, X } from 'lucide-react';
import { Voucher } from './VoucherCard';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingVoucher: Partial<Voucher> | null;
  yeuCauThanhToan: 'tat_ca' | 'tra_thang' | 'tra_gop';
  setYeuCauThanhToan: (val: 'tat_ca' | 'tra_thang' | 'tra_gop') => void;
  formatLocalDate: (date: Date) => string;
}

export function VoucherFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingVoucher,
  yeuCauThanhToan,
  setYeuCauThanhToan,
  formatLocalDate
}: VoucherFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-slate-800">
              {editingVoucher?.id ? 'Chỉnh sửa Ưu đãi / Voucher' : 'Thiết lập chiến dịch mới'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="ma_voucher" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mã Voucher *
              </label>
              <input 
                id="ma_voucher"
                name="ma_voucher"
                defaultValue={editingVoucher?.ma_voucher || ''}
                required
                placeholder="VD: CHUNGHE2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all bg-slate-50/30"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="ten_chien_dich" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tên chiến dịch *
              </label>
              <input 
                id="ten_chien_dich"
                name="ten_chien_dich"
                defaultValue={editingVoucher?.ten_chien_dich || ''}
                required
                placeholder="VD: Tri ân khách hàng"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>
            
            <div>
              <label htmlFor="loai_giam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Loại giảm trừ
              </label>
              <select 
                id="loai_giam"
                name="loai_giam"
                defaultValue={editingVoucher?.loai_giam || 'phan_tram'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer"
              >
                <option value="phan_tram">Phần trăm (%)</option>
                <option value="so_tien_co_dinh">Số tiền cố định (VNĐ)</option>
              </select>
            </div>
            <div>
              <label htmlFor="gia_tri_giam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Giá trị giảm *
              </label>
              <input 
                id="gia_tri_giam"
                name="gia_tri_giam"
                type="number"
                defaultValue={editingVoucher?.gia_tri_giam || ''}
                required
                placeholder="Ví dụ: 10 (%) hoặc 100000 (đ)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30 font-semibold text-secondary"
              />
            </div>

            <div>
              <label htmlFor="giam_toi_da" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Giảm tối đa (VNĐ)
              </label>
              <input 
                id="giam_toi_da"
                name="giam_toi_da"
                type="number"
                defaultValue={editingVoucher?.giam_toi_da || ''}
                placeholder="Để trống nếu không giới hạn"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>
            <div>
              <label htmlFor="don_hang_toi_thieu" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Đơn tối thiểu (VNĐ)
              </label>
              <input 
                id="don_hang_toi_thieu"
                name="don_hang_toi_thieu"
                type="number"
                defaultValue={editingVoucher?.don_hang_toi_thieu || 0}
                placeholder="Ví dụ: 200000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>

            <div>
              <label htmlFor="so_luong_toi_da" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Số lượng tối đa áp dụng
              </label>
              <input 
                id="so_luong_toi_da"
                name="so_luong_toi_da"
                type="number"
                defaultValue={editingVoucher?.so_luong_toi_da || ''}
                placeholder="Để trống nếu không giới hạn"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>
            <div>
              <label htmlFor="trang_thai" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Trạng thái hoạt động
              </label>
              <select 
                id="trang_thai"
                name="trang_thai"
                defaultValue={editingVoucher?.trang_thai || 'hoat_dong'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer"
              >
                <option value="hoat_dong">Kích hoạt</option>
                <option value="tam_dung">Tạm dừng</option>
              </select>
            </div>

            <div>
              <label htmlFor="ngay_bat_dau" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ngày bắt đầu *
              </label>
              <input 
                id="ngay_bat_dau"
                name="ngay_bat_dau"
                type="date"
                defaultValue={editingVoucher?.ngay_bat_dau ? editingVoucher.ngay_bat_dau.split('T')[0] : formatLocalDate(new Date())}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>
            <div>
              <label htmlFor="ngay_het_han" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ngày hết hạn
              </label>
              <input 
                id="ngay_het_han"
                name="ngay_het_han"
                type="date"
                defaultValue={editingVoucher?.ngay_het_han ? editingVoucher.ngay_het_han.split('T')[0] : ''}
                placeholder="Không giới hạn"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>

            {/* Hình thức thanh toán yêu cầu */}
            <div className="col-span-2 border-t border-slate-100 pt-5">
              <label htmlFor="yeu_cau_thanh_toan" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Yêu cầu Hình thức thanh toán
              </label>
              <select 
                id="yeu_cau_thanh_toan"
                value={yeuCauThanhToan}
                onChange={(e) => setYeuCauThanhToan(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer font-bold"
              >
                <option value="tat_ca">Tất cả hình thức</option>
                <option value="tra_thang">Chỉ trả thẳng 100%</option>
                <option value="tra_gop">Chỉ trả góp</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3.5">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-650 font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/95 shadow-lg shadow-teal-500/20 transition-all text-sm"
            >
              {editingVoucher?.id ? 'Lưu thay đổi' : 'Kích hoạt ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
