import React, { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../api/axios';
import { useAuthStore } from '../../../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const loginSchema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export interface UseLoginStateReturn {
  form: UseFormReturn<LoginFormValues>;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  serverError: string;
  setServerError: (error: string) => void;
  onSubmit: (data: LoginFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function useLoginState(WelcomeToastComponent: React.ComponentType<{ t: any; user: any }>): UseLoginStateReturn {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError('');
      const response = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);

      // Custom Premium Welcome Toast using React.createElement for class/function component compatibility
      toast.custom((t) => React.createElement(WelcomeToastComponent, { t, user }), { duration: 5000 });

      const from = (location.state as any)?.from || '/dashboard';
      const roleId = Number(user.vai_tro_id);

      if (roleId === 5) {
        navigate(from === '/dashboard' ? '/admin' : from);
      } else if (roleId === 2) {
        navigate(from === '/dashboard' ? '/receptionist' : from);
      } else if (roleId === 3) {
        navigate(from === '/dashboard' ? '/technician/appointments' : from);
      } else if (roleId === 4) {
        navigate(from === '/dashboard' ? '/doctor' : from);
      } else {
        navigate(from);
      }
    } catch (error: any) {
      if (error.response?.data?.requiresVerification) {
        navigate(`/verify-email?email=${data.email}`, { state: location.state });
      } else {
        setServerError(error.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
      }
    }
  };

  return {
    form,
    showPassword,
    setShowPassword,
    serverError,
    setServerError,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
}
