import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../api/axios';
import { toast } from 'react-hot-toast';

export const registerSchema = z.object({
  ho_ten: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export interface UseRegisterStateReturn {
  form: UseFormReturn<RegisterFormValues>;
  step: 1 | 2 | 3 | 4;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  serverError: string | null;
  setServerError: (error: string | null) => void;
  checkingEmail: boolean;
  handleNextStep: () => Promise<void>;
  handlePrevStep: () => void;
  onSubmit: (data: RegisterFormValues) => Promise<void>;
  isSubmitting: boolean;
  registeredEmail: string;
}

export function useRegisterState(): UseRegisterStateReturn {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ho_ten: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleNextStep = async () => {
    setServerError(null);
    if (step === 1) {
      const isNameValid = await form.trigger('ho_ten');
      if (isNameValid) {
        setStep(2);
      }
    } else if (step === 2) {
      const isEmailValid = await form.trigger('email');
      if (!isEmailValid) return;

      const emailVal = form.getValues('email');
      setCheckingEmail(true);
      try {
        const response = await api.post('/auth/check-email', { email: emailVal });
        if (response.data.exists) {
          setServerError('Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.');
        } else {
          setStep(3);
        }
      } catch (error: any) {
        setServerError(error.response?.data?.message || 'Lỗi kết nối máy chủ, vui lòng thử lại');
      } finally {
        setCheckingEmail(false);
      }
    } else if (step === 3) {
      // Step 3 is credentials. We trigger both fields.
      const isPasswordValid = await form.trigger('password');
      const isConfirmValid = await form.trigger('confirmPassword');
      if (isPasswordValid && isConfirmValid) {
        // Trigger register form submission
        await form.handleSubmit(onSubmit)();
      }
    }
  };

  const handlePrevStep = () => {
    setServerError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    if (step === 4) setStep(3);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError(null);
      await api.post('/auth/register', {
        ho_ten: data.ho_ten,
        email: data.email,
        password: data.password,
      });

      setRegisteredEmail(data.email);
      toast.success('Đăng ký tài khoản thành công! Một mã OTP đã được gửi đến email của bạn.');
      setStep(4); // Advance to final Success & Completion step
    } catch (error: any) {
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    }
  };

  return {
    form,
    step,
    setStep,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    serverError,
    setServerError,
    checkingEmail,
    handleNextStep,
    handlePrevStep,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
    registeredEmail,
  };
}
