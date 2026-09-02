import { Edit3, User, Phone, Mail, Calendar, MapPin, X, Save } from 'lucide-react';
import type { CustomerEditForm } from '../hooks/useCustomerActions';
import { CustomDatePicker } from '../../../../../components/CustomDatePicker';

interface EditCustomerModalProps {
  isOpen: boolean;
  form: CustomerEditForm;
  onChange: (form: CustomerEditForm) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditCustomerModal({ isOpen, form, onChange, onSave, onCancel }: EditCustomerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in font-jakarta">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-2xl max-w-xl w-full space-y-6 animate-scale-up relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Cập Nhật Thông Tin Khách Hàng
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Full Name */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5">
              <User size={13} className="text-teal-600 dark:text-teal-400" />
              Họ và tên khách hàng
            </label>
            <input
              type="text"
              placeholder="Nhập họ và tên..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              value={form.ho_ten}
              onChange={(e) => onChange({ ...form, ho_ten: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5">
              <Phone size={13} className="text-teal-600 dark:text-teal-400" />
              Số điện thoại
            </label>
            <input
              type="text"
              placeholder="039x xxx xxx"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              value={form.so_dien_thoai}
              onChange={(e) => onChange({ ...form, so_dien_thoai: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5">
              <Mail size={13} className="text-teal-600 dark:text-teal-400" />
              Địa chỉ Email
            </label>
            <input
              type="email"
              placeholder="khachhang@gmail.com"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5">
              Giới tính
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
              value={form.gioi_tinh}
              onChange={(e) => onChange({ ...form, gioi_tinh: e.target.value })}
            >
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
              <option value="khac">Khác</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5">
              <Calendar size={13} className="text-teal-600 dark:text-teal-400" />
              Ngày sinh
            </label>
            <CustomDatePicker
              value={form.ngay_sinh}
              onChange={(val) => onChange({ ...form, ngay_sinh: val })}
              placeholder="dd/mm/yyyy"
              maxDate={new Date().toISOString().split('T')[0]}
              align="right"
              showPresets={false}
              className="w-full"
              buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5">
              <MapPin size={13} className="text-teal-600 dark:text-teal-400" />
              Địa chỉ thường trú
            </label>
            <input
              type="text"
              placeholder="Nhập địa chỉ nhà / văn phòng..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              value={form.dia_chi}
              onChange={(e) => onChange({ ...form, dia_chi: e.target.value })}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex-[2] py-3.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 active:scale-95"
          >
            <Save size={16} />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
