import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { checkEmailExists, register as registerApi } from '../api/auth.api';
import { toast } from 'react-hot-toast';
import { validateEmail } from '../../../utils/validators';

export const registerSchema = z.object({
  ho_ten: z.string().min(1, 'Vui lòng không để trống họ tên').min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().min(1, 'Vui lòng không để trống email').superRefine((val, ctx) => {
    const res = validateEmail(val);
    if (!res.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.message || 'Email không đúng định dạng',
      });
    }
  }),
  so_dien_thoai: z.string().min(1, 'Vui lòng không để trống số điện thoại').regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, 'Số điện thoại không hợp lệ (vd: 0912345678)'),
  gioi_tinh: z.enum(['nam', 'nu', 'khac'], { message: 'Vui lòng chọn giới tính' }),
  ngay_sinh: z.string().min(1, 'Vui lòng chọn ngày sinh').refine((val) => new Date(val) <= new Date(), {
    message: 'Ngày sinh không thể là ngày trong tương lai'
  }),
  dia_chi: z.string().optional(),
  password: z.string().min(1, 'Vui lòng không để trống mật khẩu').min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  dong_y_dieu_khoan: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục'
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export interface UseRegisterStateReturn {
  form: UseFormReturn<RegisterFormValues>;
  isSuccess: boolean;
  setIsSuccess: (success: boolean) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  serverError: string | null;
  setServerError: (error: string | null) => void;
  onSubmit: (data: RegisterFormValues) => Promise<void>;
  isSubmitting: boolean;
  registeredEmail: string;
}

export function useRegisterState(): UseRegisterStateReturn {
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const form = useForm<RegisterFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ho_ten: '',
      email: '',
      so_dien_thoai: '',
      gioi_tinh: undefined,
      ngay_sinh: '',
      dia_chi: '',
      password: '',
      confirmPassword: '',
      dong_y_dieu_khoan: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError(null);

      const emailCheck = await checkEmailExists(data.email);
      if (emailCheck.data.exists) {
        const errorMsg = 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.';
        setServerError(errorMsg);
        toast.error(errorMsg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      await registerApi({
        ho_ten: data.ho_ten,
        email: data.email,
        so_dien_thoai: data.so_dien_thoai,
        gioi_tinh: data.gioi_tinh,
        ngay_sinh: data.ngay_sinh,
        dia_chi: data.dia_chi || undefined,
        password: data.password,
        dong_y_dieu_khoan: data.dong_y_dieu_khoan,
      });

      setRegisteredEmail(data.email);
      toast.success('Đăng ký tài khoản thành công! Một mã OTP đã được gửi đến email của bạn.');
      setIsSuccess(true);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại sau.';
      setServerError(errMsg);
      toast.error(errMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return {
    form,
    isSuccess,
    setIsSuccess,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    serverError,
    setServerError,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
    registeredEmail,
  };
}
