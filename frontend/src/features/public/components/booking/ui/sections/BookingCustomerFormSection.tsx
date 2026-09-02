import React from 'react';
import { User, Phone, Info, Upload, X } from 'lucide-react';

interface BookingCustomerFormSectionProps {
  user: any;
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  bookingType: 'kham' | 'dich_vu';
  isPhoneTakenByOther: boolean;
  handleFile: (file: File) => void;
  removeImage: () => void;
}

export const BookingCustomerFormSection: React.FC<BookingCustomerFormSectionProps> = ({
  user,
  formData,
  handleChange,
  bookingType,
  isPhoneTakenByOther,
  handleFile,
  removeImage
}) => {
  return (
    <div className="space-y-5 pb-8 border-b border-slate-100">
      <div className="flex items-center gap-3 pb-1">
        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
          <User size={18} />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
            3. Thông tin người đặt lịch
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Hồ sơ y tế cố định gắn liền với tài khoản cá nhân đã đăng nhập
          </p>
        </div>
      </div>

      {/* Cảnh báo SĐT bị trùng nếu có */}
      {isPhoneTakenByOther && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold">
          <Phone size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black uppercase tracking-wider text-amber-800 text-[10px]">Số điện thoại đã được sử dụng</p>
            <p className="mt-0.5 font-bold text-amber-700">
              Số điện thoại của tài khoản này đã thuộc về một hồ sơ khách hàng khác trong hệ thống. Vui lòng vào trang cá nhân cập nhật lại số điện thoại chính xác trước khi đặt lịch.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Disabled Full Name Input */}
        <div className="space-y-1.5">
          <label htmlFor="hoTenInputDisabled" className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
            Họ và tên tài khoản
          </label>
          <input
            id="hoTenInputDisabled"
            type="text"
            value={user?.ho_ten || formData.ho_ten_khach || ''}
            disabled
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 cursor-not-allowed opacity-85"
          />
        </div>

        {/* Disabled Phone Input */}
        <div className="space-y-1.5">
          <label htmlFor="sdtInputDisabled" className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
            Số điện thoại tài khoản
          </label>
          <input
            id="sdtInputDisabled"
            type="tel"
            value={user?.so_dien_thoai || formData.so_dien_thoai || ''}
            disabled
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 cursor-not-allowed opacity-85"
          />
        </div>

        {/* User Phone Number Note */}
        <div className="sm:col-span-2 p-3 bg-teal-50/60 rounded-2xl border border-teal-100 text-teal-800 text-[11px] font-bold flex items-center gap-2">
          <Info size={15} className="text-teal-600 shrink-0" />
          <span>Quý khách có nhu cầu đổi số điện thoại vui lòng vào trang cá nhân để cập nhật số mới nhất.</span>
        </div>
      </div>

      {/* Triệu chứng & Vị trí đau (chỉ hiện cho khám lượng giá) */}
      {bookingType === 'kham' && (
        <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <label htmlFor="trieuChungArea" className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Mô tả triệu chứng &amp; Vị trí đau *
            </label>
            <textarea
              id="trieuChungArea"
              name="trieu_chung"
              rows={3}
              value={formData.trieu_chung}
              onChange={handleChange}
              placeholder="VD: Đau mỏi vùng cổ vai gáy lan xuống tay phải khi ngồi làm việc máy tính >4 tiếng, xoay cổ bị hạn chế..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition-all leading-relaxed"
            />
          </div>

          {/* Upload Image Section */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Tải ảnh chẩn đoán / Phim X-quang, MRI (Tùy chọn)
            </label>
            {formData.anh_dinh_kem_url ? (
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-teal-200 group shadow-xs">
                <img src={formData.anh_dinh_kem_url} alt="Symptom preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-all cursor-pointer shadow-md"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/60 hover:bg-teal-50/20 rounded-2xl cursor-pointer transition-all">
                <Upload size={24} className="text-teal-600 mb-1" />
                <span className="text-xs font-bold text-slate-700">Tải ảnh triệu chứng hoặc phim chụp</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">Chấp nhận JPG, PNG, WEBP (Tối đa 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
