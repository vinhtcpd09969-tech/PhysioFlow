import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Info, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useRegisterState } from '../hooks/useRegisterState';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthVisualPanel from '../components/AuthVisualPanel';

const stepMeta = [
  { title: "Thông tin cá nhân", desc: "Tên thật của bạn là gì?" },
  { title: "Thông tin liên hệ", desc: "Địa chỉ Email của bạn?" },
  { title: "Xác thực tài khoản", desc: "Thiết lập mật khẩu an toàn" },
  { title: "Hoàn tất đăng ký", desc: "Tài khoản đã sẵn sàng!" }
];

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    form,
    step,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    serverError,
    checkingEmail,
    handleNextStep,
    handlePrevStep,
    onSubmit,
    isSubmitting,
    registeredEmail,
  } = useRegisterState();

  const { register, handleSubmit, formState: { errors } } = form;

  const handleBack = () => {
    if (step > 1 && step < 4) {
      handlePrevStep();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row text-[#0F172A] relative overflow-hidden font-jakarta p-6 gap-6 justify-between items-center">
      {/* Full-screen Background Image with clean light clinical oak wood tone */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img 
          src="/images/therapist_treatment_banner.png" 
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
      <AuthVisualPanel onBack={handleBack} showBack={step < 4} />

      {/* RIGHT 40% Form container with responsive center canvas */}
      <div className="w-full lg:w-[40%] h-full flex items-center justify-center p-2 sm:p-4 z-20 relative bg-transparent lg:overflow-y-auto">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden absolute top-6 left-6 flex flex-col gap-2 z-30">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-slate-505 hover:text-slate-900 font-semibold transition-colors focus:outline-none w-fit"
          >
            <ArrowLeft size={13} className="text-[#0D9488]" />
            <span>{step === 4 ? 'Đăng nhập' : 'Trở về'}</span>
          </button>
          
          <div className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="size-4.5 rounded-full border-2 border-[#0D9488] flex items-center justify-center bg-[#0D9488]/10">
              <div className="size-1 bg-[#0D9488]"></div>
            </div>
            <span>Office<span className="text-[#0D9488] font-light">Care</span></span>
          </div>
        </div>

        {/* Floating Glassmorphic Authentication Card */}
        <div className="w-full max-w-[460px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 md:p-10 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.08)] hover:border-[#14B8A6]/20 transition-all duration-500">
          {step < 4 && (
            <>
              {/* Auth Screen Header Tabs */}
              <div className="mb-5 flex gap-6 border-b border-slate-100 w-full">
                <Link 
                  to="/login" 
                  state={location.state} 
                  className="pb-3 text-slate-400 font-jakarta font-bold text-sm cursor-pointer hover:text-slate-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <span className="pb-3 border-b-2 border-[#0D9488] text-[#0D9488] font-jakarta font-black text-sm select-none">
                  Đăng ký
                </span>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#0D9488]">
                  <span>Bước {step}/3</span>
                  <span className="text-slate-400">{stepMeta[step - 1].title}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: "33%" }}
                    animate={{ width: `${(step / 3) * 100}%` }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] h-full rounded-full"
                  />
                </div>
              </div>

              {location.state?.from === '/booking' && step === 1 && (
                <div className="mb-5 p-4 bg-teal-50/50 border border-[#14B8A6]/15 text-slate-700 rounded-2xl text-xs flex items-start gap-2.5 shadow-sm animate-pulse-custom">
                  <Info className="shrink-0 mt-0.5 text-[#0D9488]" size={16} />
                  <div>
                    <p className="font-extrabold text-slate-900 font-jakarta">Tạo tài khoản trị liệu</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-semibold">
                      Thiết lập tài khoản để đồng bộ hóa hồ sơ bệnh án và lưu trữ bệnh án lâu dài nhé!
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {serverError && step < 4 && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-655 rounded-2xl text-xs font-semibold leading-relaxed flex gap-2 items-start animate-in fade-in duration-200">
              <ShieldAlert size={16} className="shrink-0 text-red-500 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Họ tên */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h3 className="font-jakarta text-xl font-black text-[#0F172A] tracking-tight">Tên của bạn là gì?</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 font-semibold">Vui lòng điền họ và tên thật để lưu giữ hồ sơ bệnh án.</p>
                    
                    <label htmlFor="ho_ten" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Họ và tên</label>
                    <input
                      {...register('ho_ten')}
                      id="ho_ten"
                      type="text"
                      autoComplete="name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNextStep();
                        }
                      }}
                      className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm font-semibold"
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.ho_ten && <p className="text-red-500 text-xs font-semibold mt-1">{errors.ho_ten.message}</p>}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015, translateY: -1 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleNextStep}
                    className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white font-jakarta font-extrabold text-xs uppercase tracking-widest rounded-2xl h-14 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 hover:shadow-[0_12px_32px_rgba(20,184,166,0.25)]"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight size={14} />
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Email */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center gap-1.5 text-xs text-slate-505 hover:text-slate-900 font-semibold mb-2 transition-colors focus:outline-none"
                  >
                    <ArrowLeft size={12} className="text-[#0D9488]" />
                    <span>Quay lại</span>
                  </button>

                  <div className="space-y-2">
                    <h3 className="font-jakarta text-xl font-black text-[#0F172A] tracking-tight">Địa chỉ Email của bạn?</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 font-semibold">Email dùng để nhận mã xác thực OTP kích hoạt tài khoản.</p>
                    
                    <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Địa chỉ Email</label>
                    <input
                      {...register('email')}
                      id="email"
                      type="email"
                      autoComplete="email"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNextStep();
                        }
                      }}
                      className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm font-semibold"
                      placeholder="name@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015, translateY: -1 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleNextStep}
                    disabled={checkingEmail}
                    className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white font-jakarta font-extrabold text-xs uppercase tracking-widest rounded-2xl h-14 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 hover:shadow-[0_12px_32px_rgba(20,184,166,0.25)] disabled:opacity-50"
                  >
                    {checkingEmail ? (
                      <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
                    ) : (
                      <>
                        <span>Tiếp tục</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* Step 3: Mật khẩu */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center gap-1.5 text-xs text-slate-505 hover:text-slate-900 font-semibold mb-2 transition-colors focus:outline-none"
                  >
                    <ArrowLeft size={12} className="text-[#0D9488]" />
                    <span>Quay lại</span>
                  </button>

                  <div className="space-y-3">
                    <h3 className="font-jakarta text-xl font-black text-[#0F172A] tracking-tight">Thiết lập mật khẩu</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 font-semibold">Nhập mật khẩu và xác nhận cho tài khoản của bạn.</p>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Mật khẩu</label>
                      <div className="relative">
                        <input
                          {...register('password')}
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm pr-12 font-semibold"
                          placeholder="Tối thiểu 6 ký tự"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-xs font-semibold mt-1">{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Xác nhận mật khẩu</label>
                      <div className="relative">
                        <input
                          {...register('confirmPassword')}
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm pr-12 font-semibold"
                          placeholder="Nhập lại mật khẩu để khớp"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-red-500 text-xs font-semibold mt-1">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015, translateY: -1 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white font-jakarta font-extrabold text-xs uppercase tracking-widest rounded-2xl h-14 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 hover:shadow-[0_12px_32px_rgba(20,184,166,0.25)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
                    ) : (
                      <>
                        <span>Tạo tài khoản</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* Step 4: Hoàn tất */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="space-y-6 text-center py-4"
                >
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping"></div>
                      <CheckCircle2 size={64} className="text-[#22C55E] relative z-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-jakarta text-2xl font-black text-[#0F172A] tracking-tight">Đăng ký thành công!</h3>
                    <p className="text-slate-500 text-xs leading-relaxed px-2 font-medium">
                      Hồ sơ của bạn đã được khởi tạo trên hệ thống phục hồi OfficeCare. Chúng tôi đã gửi một mã xác thực OTP 6 chữ số tới hòm thư:
                    </p>
                    <p className="font-extrabold text-[#0D9488] text-sm break-all select-all font-jakarta py-1">
                      {registeredEmail}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-400 font-semibold text-left">
                    💡 <span className="text-slate-600 font-bold">Lưu ý:</span> Mã OTP có hiệu lực trong vòng 10 phút. Nếu không thấy thư, vui lòng kiểm tra mục Thư rác (Spam) hoặc nhấp "Gửi lại mã" trên màn hình tiếp theo.
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}`, { state: location.state, replace: true })}
                    className="w-full bg-[#0F172A] hover:bg-slate-900 text-white font-jakarta font-extrabold text-xs uppercase tracking-widest rounded-2xl h-14 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                  >
                    <span>Xác thực ngay</span>
                    <ArrowRight size={14} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {step < 4 && (
              <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-bold">
                  Đã có tài khoản?{' '}
                  <Link 
                    to="/login" 
                    state={location.state} 
                    className="text-[#0D9488] font-jakarta font-black hover:underline transition-all"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
