import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Info, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useLoginState } from '../hooks/useLoginState';
import { Link, useLocation } from 'react-router-dom';
import AuthVisualPanel from '../components/AuthVisualPanel';
import ForgotPasswordFlow from '../components/ForgotPasswordFlow';
import { toast } from 'react-hot-toast';

const WelcomeToast = ({ t, user }: { t: any; user: any }) => {
  const [active, setActive] = useState(true);

  return (
    <div
      style={{
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className={`max-w-md w-full bg-white rounded-[24px] pointer-events-auto flex ring-1 ring-black/5 p-5 border border-[#14B8A6]/25 bg-gradient-to-r from-white to-[#F0FDF4]
        transition-all duration-500 transform font-jakarta shadow-[0_20px_50px_rgba(15,23,42,0.08)]
        ${active ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-12 opacity-0 scale-90'}`}
    >
      <div className="flex-1 w-0 p-1">
        <div className="flex items-center">
          <div className="flex-shrink-0 pt-0.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-teal-500/20">
              {user.ho_ten.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-bold text-[#0F172A]">
              Chào mừng bạn trở lại, {user.ho_ten}! ✨
            </p>
            <p className="mt-1 text-xs text-zinc-500 font-medium leading-relaxed font-sans">
              Chúc bạn có một ngày trị liệu hiệu quả và hồi phục nhanh chóng cùng OfficeCare!
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-zinc-100 pl-3 ml-3 items-center">
        <button
          onClick={() => {
            setActive(false);
            setTimeout(() => toast.dismiss(t.id), 300);
          }}
          className="border border-transparent rounded-xl px-2 py-1 flex items-center justify-center text-xs font-bold text-[#14B8A6] hover:bg-teal-500/5 focus:outline-none transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default function Login() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const location = useLocation();

  const {
    form,
    showPassword,
    setShowPassword,
    serverError,
    setServerError,
    onSubmit,
    isSubmitting,
  } = useLoginState(WelcomeToast);

  const { register, handleSubmit, getValues, setValue, formState: { errors } } = form;

  const handleQuickLogin = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'admin123', { shouldValidate: true });
    handleSubmit(onSubmit)();
  };

  const handleBack = () => {
    if (showForgotPassword) {
      setShowForgotPassword(false);
      setServerError('');
    } else {
      window.history.back();
    }
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row text-[#0F172A] relative overflow-hidden font-jakarta p-6 gap-6 justify-between items-center">
      {/* Full-screen Background Image with clean light clinical oak wood tone */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img
          src="/images/therapist_treatment.png"
          alt="Clinic Rehab Background"
          className="w-full h-full object-cover object-right-bottom lg:object-center filter brightness-[1.02]"
        />
        {/* Fine vignette overlay fading from pristine soft white to transparent */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/95 via-slate-50/70 to-transparent z-10"></div>
      </div>

      {/* HUD High-tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-80 z-10"></div>

      {/* Floating dynamic particles */}
      <div className="absolute top-[20%] left-[15%] size-1.5 bg-[#14B8A6]/15 rounded-full animate-float z-10"></div>
      <div className="absolute bottom-[30%] left-[25%] size-2 bg-[#22C55E]/8 rounded-full animate-float stagger-delay-3 z-10"></div>
      <div className="absolute top-[55%] left-[45%] size-1 bg-[#14B8A6]/20 rounded-full animate-float stagger-delay-6 z-10"></div>

      {/* LEFT 58% storytelling visual panel */}
      <AuthVisualPanel onBack={handleBack} showBack={true} />

      {/* RIGHT 40% Form container with responsive center canvas */}
      <div className="w-full lg:w-[40%] h-full flex items-center justify-center p-2 sm:p-4 z-20 relative bg-transparent lg:overflow-y-auto">

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden absolute top-6 left-6 flex flex-col gap-2 z-30">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors focus:outline-none w-fit"
          >
            <ArrowLeft size={13} className="text-[#0D9488]" />
            <span>Trở về</span>
          </button>

          <div className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="size-4.5 rounded-full border-2 border-[#14B8A6] flex items-center justify-center bg-[#14B8A6]/10">
              <div className="size-1 bg-[#14B8A6]"></div>
            </div>
            <span>Office<span className="text-[#0D9488] font-light">Care</span></span>
          </div>
        </div>

        {/* Form Card: Glassmorphism layout with 32px rounded corner and soft shadows */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="w-full max-w-[460px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 md:p-10 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.08)] hover:border-[#14B8A6]/20 transition-all duration-500"
        >
          <AnimatePresence mode="wait">
            {!showForgotPassword ? (
              <motion.div
                key="login-content"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Auth Screen Header */}
                <div className="mb-6 flex gap-6 border-b border-slate-100 w-full">
                  <span className="pb-3 border-b-2 border-[#0D9488] text-[#0D9488] font-jakarta font-black text-sm select-none">
                    Đăng nhập
                  </span>
                  <Link
                    to="/register"
                    state={location.state}
                    className="pb-3 text-slate-400 font-jakarta font-bold text-sm cursor-pointer hover:text-slate-600 transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>

                {location.state?.from === '/booking' && (
                  <div className="mb-6 p-4 bg-teal-50/50 border border-[#14B8A6]/15 text-slate-700 rounded-2xl text-xs flex items-start gap-2.5 shadow-sm animate-pulse-custom">
                    <Info className="shrink-0 mt-0.5 text-[#0D9488]" size={16} />
                    <div>
                      <p className="font-extrabold text-slate-900 font-jakarta">Đồng bộ lịch khám y khoa</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-semibold">
                        Đăng nhập để đồng bộ lịch hẹn và hồ sơ bệnh án cá nhân của bạn nhé!
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="font-jakarta text-2xl font-black text-slate-900 tracking-tight">
                    Chào mừng trở lại
                  </h2>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-semibold">
                    Tiếp tục hành trình phục hồi và quản lý sức khỏe của bạn.
                  </p>
                </div>

                {serverError && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-650 rounded-2xl text-xs font-semibold leading-relaxed flex gap-2 items-start">
                    <ShieldAlert size={16} className="shrink-0 text-red-500 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Địa chỉ Email
                      </label>
                      <input
                        {...register('email')}
                        id="email"
                        type="email"
                        autoComplete="email"
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm font-semibold"
                        placeholder="name@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Mật khẩu
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setServerError('');
                          }}
                          className="text-[10px] font-black text-[#0D9488] hover:opacity-85 focus:outline-none"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          {...register('password')}
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm pr-12 font-semibold"
                          placeholder="Nhập mật khẩu của bạn"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-xs font-semibold mt-1">{errors.password.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Gradient Teal button with Hover Glow and Spring Scale interaction */}
                  <motion.button
                    whileHover={{ scale: 1.015, translateY: -1 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white font-jakarta font-extrabold text-xs uppercase tracking-widest rounded-2xl h-14 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 hover:shadow-[0_12px_32px_rgba(20,184,166,0.25)]"
                  >
                    {isSubmitting ? (
                      <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
                    ) : (
                      <span>Đăng nhập</span>
                    )}
                  </motion.button>

                  <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-bold">
                      Thành viên mới?{' '}
                      <Link
                        to="/register"
                        state={location.state}
                        className="text-[#0D9488] font-jakarta font-black hover:underline transition-all"
                      >
                        Đăng ký ngay
                      </Link>
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-150/70">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-3 flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse"></span>
                      ⚡ ĐĂNG NHẬP NHANH (MÔI TRƯỜNG TEST)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('admin@officecare.vn')}
                        disabled={isSubmitting}
                        className="px-2 py-2.5 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-50"
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('letan1@officecare.vn')}
                        disabled={isSubmitting}
                        className="px-2 py-2.5 rounded-xl text-[10px] font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-50"
                      >
                        Lễ Tân
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('ktv1@officecare.vn')}
                        disabled={isSubmitting}
                        className="px-2 py-2.5 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-50"
                      >
                        KTV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('bacsi1@officecare.vn')}
                        disabled={isSubmitting}
                        className="px-2 py-2.5 rounded-xl text-[10px] font-black bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/50 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-50"
                      >
                        Bác Sĩ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('quanly@officecare.vn')}
                        disabled={isSubmitting}
                        className="px-2 py-2.5 rounded-xl text-[10px] font-black bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-50"
                      >
                        Quản Lý
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('kh1@gmail.com')}
                        disabled={isSubmitting}
                        className="px-2 py-2.5 rounded-xl text-[10px] font-black bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300/50 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-50"
                      >
                        Khách Hàng
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ForgotPasswordFlow
                  initialEmail={getValues('email') || ''}
                  onCancel={() => {
                    setShowForgotPassword(false);
                    setServerError('');
                  }}
                  onSuccess={(email) => {
                    setValue('email', email);
                    setShowForgotPassword(false);
                    setServerError('');
                    toast.success('Mã đặt lại mật khẩu đã được gửi tới email của bạn.');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}
