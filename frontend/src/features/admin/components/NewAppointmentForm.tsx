import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, FileText, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../api/axios';

const schema = z.object({
  bookingMode: z.enum(['existing', 'walk_in']),
  
  khach_hang_id: z.string().optional(),
  
  ho_ten_khach: z.string().optional(),
  so_dien_thoai: z.string().optional(),
  gioi_tinh_khach: z.string().optional(),
  
  dich_vu_id: z.string().min(1, 'Vui lòng chọn dịch vụ'),
  ky_thuat_vien_id: z.string().optional(),
  ngay_bat_dau: z.string().min(1, 'Vui lòng chọn ngày'),
  gio_bat_dau: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
  gio_ket_thuc: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
  ly_do_kham: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.bookingMode === 'existing' && !data.khach_hang_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng chọn khách hàng',
      path: ['khach_hang_id'],
    });
  }
  if (data.bookingMode === 'walk_in') {
    if (!data.ho_ten_khach) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc', path: ['ho_ten_khach'] });
    }
    if (!data.so_dien_thoai) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc', path: ['so_dien_thoai'] });
    }
  }
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewAppointmentForm({ isOpen, onClose, onSuccess }: Props) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bookingMode: 'existing',
      gioi_tinh_khach: 'nam',
      gio_bat_dau: '09:00',
      gio_ket_thuc: '10:00'
    }
  });

  const bookingMode = watch('bookingMode');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [custRes, servRes, staffRes] = await Promise.all([
        axiosInstance.get('/admin/customers'),
        axiosInstance.get('/admin/services'),
        axiosInstance.get('/admin/staff')
      ]);
      setCustomers(custRes.data);
      setServices(servRes.data);
      setStaff(staffRes.data.filter((s: any) => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'Bác sĩ'));
    } catch (error) {
      console.error('Lỗi tải dữ liệu form', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const payload: any = {
        dich_vu_id: data.dich_vu_id,
        ngay_gio_bat_dau: new Date(`${data.ngay_bat_dau}T${data.gio_bat_dau}:00`).toISOString(),
        ngay_gio_ket_thuc: new Date(`${data.ngay_bat_dau}T${data.gio_ket_thuc}:00`).toISOString(),
        ky_thuat_vien_id: data.ky_thuat_vien_id || undefined,
        ly_do_kham: data.ly_do_kham,
        ma_lich_dat: `BK${Math.floor(1000 + Math.random() * 9000)}`
      };

      if (data.bookingMode === 'existing') {
        payload.khach_hang_id = data.khach_hang_id;
      } else {
        payload.ho_ten_khach = data.ho_ten_khach;
        payload.so_dien_thoai = data.so_dien_thoai;
        payload.gioi_tinh_khach = data.gioi_tinh_khach;
      }

      await axiosInstance.post('/admin/appointments', payload);
      toast.success('Đặt lịch thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi tạo lịch:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Layered Background Blur (Premium feel) */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-over Panel (Sharp geometry) */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-teal-600" size={20} />
              Đặt lịch mới
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Sắp xếp cuộc hẹn cho khách hàng</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="appointmentForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Mode Selection */}
            <div className="flex p-1 bg-slate-100 rounded-sm">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium transition-all ${bookingMode === 'existing' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setValue('bookingMode', 'existing')}
              >
                Khách đã có tài khoản
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium transition-all ${bookingMode === 'walk_in' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setValue('bookingMode', 'walk_in')}
              >
                Khách vãng lai
              </button>
            </div>

            {/* Customer Info Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <User size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Thông tin Khách hàng</h3>
              </div>
              
              {bookingMode === 'existing' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Chọn Khách hàng *</label>
                  <select 
                    {...register('khach_hang_id')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                  >
                    <option value="">-- Tìm khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.khach_hang_id} value={c.khach_hang_id}>
                        {c.ho_ten} - {c.so_dien_thoai}
                      </option>
                    ))}
                  </select>
                  {errors.khach_hang_id && <p className="text-red-500 text-xs mt-1">{errors.khach_hang_id.message}</p>}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ tên *</label>
                    <input 
                      type="text"
                      {...register('ho_ten_khach')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.ho_ten_khach && <p className="text-red-500 text-xs mt-1">{errors.ho_ten_khach.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại *</label>
                      <input 
                        type="tel"
                        {...register('so_dien_thoai')}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                        placeholder="09..."
                      />
                      {errors.so_dien_thoai && <p className="text-red-500 text-xs mt-1">{errors.so_dien_thoai.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Giới tính</label>
                      <select 
                        {...register('gioi_tinh_khach')}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                      >
                        <option value="nam">Nam</option>
                        <option value="nu">Nữ</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Service & Time Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Calendar size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Chi tiết Lịch hẹn</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dịch vụ *</label>
                <select 
                  {...register('dich_vu_id')}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.ten_dich_vu}</option>
                  ))}
                </select>
                {errors.dich_vu_id && <p className="text-red-500 text-xs mt-1">{errors.dich_vu_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kỹ thuật viên (Tuỳ chọn)</label>
                <select 
                  {...register('ky_thuat_vien_id')}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                >
                  <option value="">-- Để trống nếu chưa chỉ định --</option>
                  {staff.map(s => (
                    <option key={s.ky_thuat_vien_id || s.id} value={s.ky_thuat_vien_id || ''}>{s.ho_ten}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày *</label>
                  <input 
                    type="date"
                    {...register('ngay_bat_dau')}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                  />
                  {errors.ngay_bat_dau && <p className="text-red-500 text-xs mt-1">{errors.ngay_bat_dau.message}</p>}
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Giờ BĐ *</label>
                  <input 
                    type="time"
                    {...register('gio_bat_dau')}
                    className="w-full px-2 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Giờ KT *</label>
                  <input 
                    type="time"
                    {...register('gio_ket_thuc')}
                    className="w-full px-2 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Note Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <FileText size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Thông tin thêm</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Lý do khám / Ghi chú</label>
                <textarea 
                  {...register('ly_do_kham')}
                  rows={3}
                  placeholder="Triệu chứng, yêu cầu đặc biệt..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors text-sm resize-none"
                />
              </div>
            </section>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            type="submit"
            form="appointmentForm"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Đang lưu...' : 'Xác nhận Đặt lịch'}
          </button>
        </div>
      </div>
    </>
  );
}
