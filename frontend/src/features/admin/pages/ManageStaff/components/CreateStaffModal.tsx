import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, Mail, Lock, ShieldCheck, Phone, Eye, EyeOff, UserPlus } from 'lucide-react';
import { CustomSelect } from '../../../../../components/CustomSelect';
import { validateEmail } from '../../../../../utils/validators';

const staffSchema = z.object({
  ho_ten: z.string().min(1, 'Vui lòng không để trống họ và tên'),
  email: z.string().min(1, 'Vui lòng không để trống email đăng nhập').superRefine((val, ctx) => {
    const res = validateEmail(val);
    if (!res.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.message || 'Email không đúng định dạng',
      });
    }
  }),
  mat_khau: z.string().min(1, 'Vui lòng không để trống mật khẩu').min(6, 'Mật khẩu khởi tạo phải từ 6 ký tự trở lên'),
  vai_tro_id: z.number().refine(val => [2, 3, 4, 6].includes(val), {
    message: 'Vui lòng chọn vai trò làm việc (Lễ tân, KTV, Chuyên viên hoặc Quản lý)'
  }),
  so_dien_thoai: z.string().optional().refine((val) => !val || /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(val), {
    message: 'Số điện thoại không đúng định dạng (vd: 0912345678)'
  }),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

export type StaffFormValues = z.infer<typeof staffSchema>;

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormValues) => Promise<void>;
}

export function CreateStaffModal({ isOpen, onClose, onSubmit }: CreateStaffModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      ho_ten: '',
      email: '',
      mat_khau: '',
      vai_tro_id: 0,
      so_dien_thoai: '',
      trang_thai: 'hoat_dong'
    }
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    setShowPassword(false);
    onClose();
  };

  const onFormSubmit = async (data: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200 overflow-y-auto font-sans">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200/80 dark:border-zinc-800 shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-200 my-8 overflow-visible relative">
        {/* Header */}
        <div className="px-7 py-5 border-b border-zinc-150/80 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent rounded-t-[31px]">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner shrink-0">
              <UserPlus size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-heading tracking-tight">
                Tạo tài khoản Nhân sự
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                Cấp tài khoản làm việc mới cho đội ngũ nhân sự OfficeCare
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="size-9 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition-all hover:rotate-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-7 space-y-5">
          {/* Họ và tên - Full width */}
          <div className="space-y-1.5">
            <label htmlFor="ho_ten" className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-teal-600 dark:text-teal-400" />
              <span>Họ và tên nhân sự <b className="text-rose-500">*</b></span>
            </label>
            <div className="relative">
              <input
                id="ho_ten"
                placeholder="Nhập họ và tên đầy đủ (vd: Nguyễn Văn An)..."
                {...register('ho_ten')}
                className={`w-full bg-slate-50 dark:bg-zinc-950 border ${
                  errors.ho_ten ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/15' : 'border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15'
                } rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-bold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400`}
              />
            </div>
            {errors.ho_ten && <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1 mt-1">⚠️ {errors.ho_ten.message}</p>}
          </div>

          {/* 2-column Grid: Email & Mật khẩu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Email đăng nhập <b className="text-rose-500">*</b></span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="ten_nhan_su@officecare.vn"
                {...register('email')}
                className={`w-full bg-slate-50 dark:bg-zinc-950 border ${
                  errors.email ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/15' : 'border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15'
                } rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-bold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400`}
              />
              {errors.email && <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1 mt-1">⚠️ {errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mat_khau" className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Mật khẩu ban đầu <b className="text-rose-500">*</b></span>
              </label>
              <div className="relative">
                <input
                  id="mat_khau"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự..."
                  {...register('mat_khau')}
                  className={`w-full bg-slate-50 dark:bg-zinc-950 border ${
                    errors.mat_khau ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/15' : 'border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15'
                  } rounded-2xl px-4 py-3 pr-11 text-xs text-slate-800 dark:text-zinc-100 font-bold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.mat_khau && <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1 mt-1">⚠️ {errors.mat_khau.message}</p>}
            </div>
          </div>

          {/* 2-column Grid: Vai trò & Số điện thoại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="vai_tro_id" className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Vai trò làm việc <b className="text-rose-500">*</b></span>
              </label>
              <Controller
                name="vai_tro_id"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={(val) => field.onChange(Number(val))}
                    placeholder="Chọn vai trò làm việc..."
                    fullWidth
                    error={!!errors.vai_tro_id}
                    buttonClassName="py-3 px-4 rounded-2xl bg-slate-50 dark:bg-zinc-950"
                    options={[
                      { value: 0, label: 'Chọn vai trò làm việc...' },
                      { value: 2, label: 'Lễ tân', icon: '🛎️' },
                      { value: 3, label: 'Kỹ thuật viên', icon: '👐' },
                      { value: 4, label: 'Chuyên viên tư vấn', icon: '🩺' },
                      { value: 6, label: 'Quản lý', icon: '👔' },
                    ]}
                  />
                )}
              />
              {errors.vai_tro_id && <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1 mt-1">⚠️ {errors.vai_tro_id.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="so_dien_thoai" className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={13} className="text-teal-600 dark:text-teal-400" />
                <span>Số điện thoại liên hệ</span>
              </label>
              <input
                id="so_dien_thoai"
                placeholder="vd: 0912345678"
                {...register('so_dien_thoai')}
                className={`w-full bg-slate-50 dark:bg-zinc-950 border ${
                  errors.so_dien_thoai ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/15' : 'border-slate-200 dark:border-zinc-800 focus:border-teal-500 ring-teal-500/15'
                } rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-zinc-100 font-bold outline-none focus:ring-4 transition-all shadow-2xs placeholder-slate-400`}
              />
              {errors.so_dien_thoai && <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1 mt-1">⚠️ {errors.so_dien_thoai.message}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={handleClose} 
              className="px-5 py-3 text-slate-600 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-7 py-3 text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-teal-600/25 cursor-pointer disabled:opacity-50 active:scale-98 flex items-center gap-2"
            >
              <UserPlus size={15} />
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
