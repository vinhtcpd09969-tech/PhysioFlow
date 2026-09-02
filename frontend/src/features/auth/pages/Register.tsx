import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterState } from '../hooks/useRegisterState';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthVisualPanel from '../components/AuthVisualPanel';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { TERMS_OF_SERVICE, TERMS_EFFECTIVE_DATE } from '@/constants/termsContent';

const todayStr = new Date().toISOString().split('T')[0];

const genderOptions: { value: 'nam' | 'nu' | 'khac'; label: string }[] = [
  { value: 'nam', label: 'Nam' },
  { value: 'nu', label: 'Nữ' },
  { value: 'khac', label: 'Khác' },
];

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    form,
    isSuccess,
    setIsSuccess,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    serverError,
    onSubmit,
    isSubmitting,
    registeredEmail,
  } = useRegisterState();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const selectedGender = watch('gioi_tinh');

  const handleBack = () => window.history.back();

  // Terms of Service Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalAgreed, setModalAgreed] = useState(false);

  const handleMainCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const isCurrentlyChecked = watch('dong_y_dieu_khoan');
    if (!isCurrentlyChecked) {
      e.preventDefault(); // Intercept to show the modal first
      setModalAgreed(false); // Reset check state in modal
      setShowTermsModal(true);
    }
  };

  const handleModalSubmit = () => {
    setValue('dong_y_dieu_khoan', true, { shouldValidate: true });
    setShowTermsModal(false);
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row text-[#0F172A] relative overflow-hidden font-jakarta p-6 gap-6 justify-between items-center">
      {/* Full-screen Background Image with clean light clinical oak wood tone */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0 select-none pointer-events-none"
      >
        <img
          src="/images/therapist_treatment_banner.png"
          alt="Clinic Rehab Background"
          className="w-full h-full object-cover object-right-bottom lg:object-center filter brightness-[1.02]"
        />
        {/* Fine vignette overlay fading from pristine soft white to transparent */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="absolute inset-0 bg-gradient-to-r from-slate-50/95 via-slate-50/70 to-transparent z-10"
        ></motion.div>
      </motion.div>

      {/* HUD High-tech Grid Background */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-10"
      ></motion.div>

      {/* Floating dynamic particles */}
      <div className="absolute top-[20%] left-[15%] size-1.5 bg-[#14B8A6]/15 rounded-full animate-float z-10"></div>
      <div className="absolute bottom-[30%] left-[25%] size-2 bg-[#22C55E]/8 rounded-full animate-float stagger-delay-3 z-10"></div>
      <div className="absolute top-[55%] left-[45%] size-1 bg-[#14B8A6]/20 rounded-full animate-float stagger-delay-6 z-10"></div>

      {/* LEFT 58% storytelling visual panel */}
      <AuthVisualPanel onBack={handleBack} showBack={!isSuccess} />

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
            <span>{isSuccess ? 'Đăng nhập' : 'Trở về'}</span>
          </button>

          <div className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="size-4.5 rounded-full border-2 border-[#0D9488] flex items-center justify-center bg-[#0D9488]/10">
              <div className="size-1 bg-[#0D9488]"></div>
            </div>
            <span>Office<span className="text-[#0D9488] font-light">Care</span></span>
          </div>
        </div>

        {/* Floating Glassmorphic Authentication Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] my-auto bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 md:p-10 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.08)] hover:border-[#14B8A6]/20 transition-all duration-500"
        >
          {!isSuccess && (
            <>
              {/* Auth Screen Header Tabs */}
              <div className="mb-6 flex gap-6 border-b border-slate-100 w-full">
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

              <div className="space-y-2 mb-6">
                <h3 className="font-jakarta text-xl font-black text-[#0F172A] tracking-tight">Tạo tài khoản mới</h3>
              </div>


            </>
          )}

          {serverError && !isSuccess && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-655 rounded-2xl text-xs font-semibold leading-relaxed flex gap-2 items-start animate-in fade-in duration-200">
              <ShieldAlert size={16} className="shrink-0 text-red-500 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {!isSuccess ? (
            <motion.form
              key="register-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Họ và tên */}
              <div className="space-y-2">
                <label htmlFor="ho_ten" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Họ và tên</label>
                <input
                  {...register('ho_ten')}
                  id="ho_ten"
                  type="text"
                  autoComplete="name"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm font-semibold"
                  placeholder="Nguyễn Văn A"
                />
                {errors.ho_ten && <p className="text-red-500 text-xs font-semibold mt-1">{errors.ho_ten.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Địa chỉ Email</label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm font-semibold"
                  placeholder="name@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>}
              </div>

              {/* Số điện thoại */}
              <div className="space-y-2">
                <label htmlFor="so_dien_thoai" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Số điện thoại</label>
                <input
                  {...register('so_dien_thoai')}
                  id="so_dien_thoai"
                  type="tel"
                  autoComplete="tel"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm font-semibold"
                  placeholder="0xxxxxxxxx"
                />
                {errors.so_dien_thoai && <p className="text-red-500 text-xs font-semibold mt-1">{errors.so_dien_thoai.message}</p>}
              </div>

              {/* Giới tính & Ngày sinh */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Giới tính</label>
                  <div className="flex gap-1.5">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue('gioi_tinh', opt.value, { shouldValidate: true })}
                        className={`flex-1 py-3.5 rounded-xl text-[11px] font-bold transition-all border duration-200 active:scale-95
                          ${selectedGender === opt.value
                            ? 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6] border-transparent text-white shadow-md shadow-teal-500/15 font-extrabold'
                            : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {errors.gioi_tinh && <p className="text-red-500 text-xs font-semibold mt-1">{errors.gioi_tinh.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="ngay_sinh" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày sinh</label>
                  <Controller
                    control={form.control}
                    name="ngay_sinh"
                    render={({ field }) => (
                      <CustomDatePicker
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="dd/mm/yyyy"
                        maxDate={todayStr}
                        align="right"
                        showPresets={false}
                        className="w-full"
                        buttonClassName="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-4 py-[13px] outline-none transition-all duration-300 text-slate-800 text-sm font-semibold"
                      />
                    )}
                  />
                  {errors.ngay_sinh && <p className="text-red-500 text-xs font-semibold mt-1">{errors.ngay_sinh.message}</p>}
                </div>
              </div>

              {/* Địa chỉ (không bắt buộc) */}
              <div className="space-y-2">
                <label htmlFor="dia_chi" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Địa chỉ <span className="normal-case text-slate-350 font-semibold">(không bắt buộc)</span>
                </label>
                <input
                  {...register('dia_chi')}
                  id="dia_chi"
                  type="text"
                  autoComplete="street-address"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-slate-800 text-sm font-semibold"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                />
              </div>

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
                    placeholder="Nhập lại mật khẩu"
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

              {/* Terms of Service consent checkbox */}
              <div className="space-y-1.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    {...register('dong_y_dieu_khoan')}
                    type="checkbox"
                    onClick={handleMainCheckboxClick}
                    className="mt-0.5 size-4 rounded border-slate-300 text-[#0D9488] focus:ring-[#14B8A6]/30 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Tôi đã đọc và đồng ý với{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setModalAgreed(false);
                        setShowTermsModal(true);
                      }}
                      className="text-[#0D9488] font-bold hover:underline inline-block focus:outline-none"
                    >
                      Điều khoản dịch vụ
                    </button>{' '}
                    của Office Care.
                  </span>
                </label>
                {errors.dong_y_dieu_khoan && <p className="text-red-500 text-xs font-semibold">{errors.dong_y_dieu_khoan.message}</p>}
              </div>

              <motion.button
                whileHover={{ scale: 1.015, translateY: -1 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
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

              <div className="pt-4 border-t border-slate-100 text-center">
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
            </motion.form>
          ) : (
            <motion.div
              key="register-success"
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

              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-jakarta font-black uppercase tracking-widest transition-colors duration-200 mt-2"
              >
                <ArrowLeft size={13} className="text-[#0D9488]" />
                <span>Quay lại chỉnh sửa</span>
              </button>
            </motion.div>
          )}
        </motion.div>

      </div>

      {/* Premium Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col font-jakarta"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="font-heading font-black text-lg md:text-xl text-slate-900">
                    Điều khoản dịch vụ & Quy định sử dụng
                  </h3>
                  <p className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider mt-1">
                    Hiệu lực từ: {TERMS_EFFECTIVE_DATE}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="size-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-colors focus:outline-none"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 text-xs text-slate-600 font-semibold leading-relaxed">
                {TERMS_OF_SERVICE.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="font-black text-slate-800 text-sm">{section.heading}</h4>
                    {section.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="text-slate-650">{p}</p>
                    ))}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {section.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="text-slate-650">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer Agreement & Confirmation */}
              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 space-y-4 shrink-0">
                <label className="flex items-start gap-2.5 cursor-pointer select-none p-3.5 bg-white border border-slate-150 rounded-2xl shadow-sm hover:border-[#14B8A6]/30 transition-all duration-300">
                  <input
                    type="checkbox"
                    checked={modalAgreed}
                    onChange={(e) => setModalAgreed(e.target.checked)}
                    className="mt-0.5 size-4.5 rounded border-slate-300 text-[#0D9488] focus:ring-[#14B8A6]/30 cursor-pointer"
                  />
                  <span className="text-xs text-slate-650 font-black leading-relaxed">
                    Tôi đã đọc kỹ và đồng ý với tất cả điều khoản dịch vụ của OfficeCare.
                  </span>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleModalSubmit}
                    disabled={!modalAgreed}
                    className="flex-1 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-teal-500/10 hover:shadow-[0_8px_20px_rgba(20,184,166,0.2)] disabled:opacity-50 disabled:shadow-none"
                  >
                    Đồng ý & Xác nhận
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
