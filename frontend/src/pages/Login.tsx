import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError('');
      const response = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      // Navigate based on role
      if (user.vai_tro_id === 4) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-background">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
        <div className="absolute top-8 left-8 sm:left-16 lg:left-24 font-heading font-bold text-primary text-xl tracking-wide">
          PHYSIOFLOW
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 flex gap-8 border-b border-gray-200">
            <span className="pb-2 border-b-2 border-primary text-primary font-semibold text-sm">Đăng nhập</span>
            <span className="pb-2 text-gray-400 font-semibold text-sm cursor-pointer hover:text-gray-600 transition-colors">Đăng ký</span>
          </div>

          <h1 className="font-heading text-[32px] lg:text-[48px] font-bold text-secondary leading-tight mb-2">Chào mừng trở lại</h1>
          <p className="text-[16px] text-gray-500 mb-8">Theo dõi hành trình phục hồi của bạn</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-gray-500 mb-2">SỐ ĐIỆN THOẠI / EMAIL</label>
              <input
                {...register('email')}
                type="text"
                className="w-full bg-[#F1F5F9] border border-transparent focus:bg-white focus:border-primary rounded-[16px] px-4 py-3 outline-none transition-all duration-300 text-[16px]"
                placeholder="Nhập email hoặc số điện thoại"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-gray-500">MẬT KHẨU</label>
                <Link to="#" className="text-[12px] font-semibold text-primary hover:text-opacity-80">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-[#F1F5F9] border border-transparent focus:bg-white focus:border-primary rounded-[16px] px-4 py-3 outline-none transition-all duration-300 text-[16px]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-semibold rounded-[16px] py-3 hover:bg-opacity-90 transition-all duration-300 shadow-[0_4px_14px_0_rgba(46,196,182,0.39)] disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>

            <div className="relative flex items-center justify-center mt-8">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-background px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider absolute">HOẶC TIẾP TỤC VỚI</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button type="button" className="flex items-center justify-center gap-2 border border-gray-200 rounded-[16px] py-3 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 border border-gray-200 rounded-[16px] py-3 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold">Facebook</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel - Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] relative overflow-hidden items-center justify-center p-12">
        {/* Ambient shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-accent opacity-20 rounded-full blur-3xl"></div>
        
        {/* Abstract human figure placeholder */}
        <div className="relative w-full h-full max-h-[600px] flex items-center justify-center">
          <div className="w-64 h-64 bg-gradient-to-tr from-primary to-accent opacity-30 rounded-full blur-2xl absolute"></div>
          
          {/* Testimonial Card - Glassmorphism */}
          <div className="absolute bottom-10 left-10 right-10 bg-white/80 backdrop-blur-[20px] border border-white/50 rounded-[24px] p-8 shadow-[0_8px_32px_0_rgba(15,23,42,0.1)]">
            <div className="text-primary text-4xl font-serif leading-none mb-2">"</div>
            <p className="text-secondary text-[18px] leading-[1.6] mb-6 relative z-10">
              "PhysioFlow đã thay đổi hoàn toàn cách tôi tiếp cận quá trình phục hồi. Giao diện trực quan và các bài tập được cá nhân hóa giúp tôi cảm thấy được hỗ trợ mỗi ngày."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-semibold text-secondary">Nguyễn Văn A</h4>
                <p className="text-sm text-gray-500">Bệnh nhân phục hồi chức năng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
