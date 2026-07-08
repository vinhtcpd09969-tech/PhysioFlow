import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, ArrowLeft, Send, Timer } from 'lucide-react';
import axiosInstance from '../../../api/axios';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';
import AuthVisualPanel from '../components/AuthVisualPanel';

const WelcomeToast = ({ t, user }: { t: any; user: any }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setActive(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!t.visible) {
      setActive(false);
    }
  }, [t.visible]);

  return (
    <div
      style={{
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className={`max-w-md w-full bg-white rounded-[24px] pointer-events-auto flex ring-1 ring-black/5 p-5 border border-[#0D9488]/20 bg-gradient-to-r from-white to-[#F0FDF4]
        transition-all duration-700 transform font-jakarta
        ${active ? 'translate-y-0 opacity-100 scale-100 shadow-[0_20px_50px_rgba(15,23,42,0.08)]' : '-translate-y-12 opacity-0 scale-90'}`}
    >
      <div className="flex-1 w-0 p-1">
        <div className="flex items-center">
          <div className="flex-shrink-0 pt-0.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0D9488] to-[#0D9488] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
              {user.ho_ten.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-bold text-[#0F172A]">
              Xác thực tài khoản thành công! ✨
            </p>
            <p className="mt-1 text-xs text-zinc-500 font-medium leading-relaxed font-sans">
              Chào mừng bạn đến với OffiCare. Hồ sơ bệnh án và lịch hẹn của bạn đã sẵn sàng!
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-zinc-100 pl-3 ml-3 items-center">
        <button
          onClick={() => {
            setActive(false);
            setTimeout(() => toast.dismiss(t.id), 500);
          }}
          className="border border-transparent rounded-xl px-2 py-1 flex items-center justify-center text-xs font-bold text-[#0D9488] hover:bg-emerald-500/5 focus:outline-none transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  // References to input fields for focus shifting
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return false;

    const newOtp = [...otp];
    // Only take the last character typed
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input if value is filled
    if (newOtp[index] !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Clear previous input and focus on it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const splitOtp = pastedData.split('');
      setOtp(splitOtp);
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Vui lòng nhập đủ 6 ký số OTP');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await axiosInstance.post('/auth/verify-email', {
        email,
        otp: otpValue
      });

      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);

      // Custom Premium Welcome Toast
      toast.custom((t) => <WelcomeToast t={t} user={user} />, { duration: 6000 });
      
      const from = (location.state as any)?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra và thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setError(null);
    
    try {
      await axiosInstance.post('/auth/resend-otp', { email });
      setResendSuccess(true);
      setTimeLeft(600); // Reset timer to 10 minutes
      setOtp(['', '', '', '', '', '']); // Clear input
      inputRefs.current[0]?.focus(); // Refocus first input
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
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
            <div className="size-4.5 rounded-full border-2 border-[#0D9488] flex items-center justify-center bg-[#0D9488]/10">
              <div className="size-1 bg-[#0D9488]"></div>
            </div>
            <span>Office<span className="text-[#0D9488] font-light">Care</span></span>
          </div>
        </div>

        {/* Card Body */}
        <div className="w-full max-w-[460px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 md:p-10 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.08)] hover:border-[#14B8A6]/20 transition-all duration-500">
          
          {/* Header Back Icon */}
          <div className="mb-6 flex justify-end border-b border-zinc-150/40 pb-3">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-xs text-zinc-400 hover:text-[#0D9488] font-bold transition-colors focus:outline-none font-sans"
            >
              Đăng ký mới
            </button>
          </div>

          {/* Form Header Info */}
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight">Xác thực tài khoản</h2>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed font-sans">
              Mã xác thực gồm 6 chữ số đã được gửi tới:<br />
              <span className="font-semibold text-[#0F172A] break-all">{email}</span>
            </p>
          </div>

          {/* Errors Notice */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-200 font-sans">
              <ShieldAlert size={16} className="shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Resend Success Notice */}
          {resendSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-200 font-sans">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              <span>Đã gửi lại mã OTP thành công! Vui lòng kiểm tra hộp thư (hoặc hòm thư rác).</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            
            {/* OTP 6-Digit input boxes */}
            <div className="flex justify-between gap-2">
              {otp.map((data, index) => {
                return (
                  <input
                    ref={el => (inputRefs.current[index] = el)}
                    className="w-11 h-13 md:w-12 md:h-14 text-center text-xl font-bold bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 rounded-2xl outline-none transition-all duration-200 text-zinc-900 shadow-sm font-sans"
                    type="text"
                    name="otp"
                    maxLength={1}
                    key={index}
                    value={data}
                    onChange={e => handleChange(e.target, index)}
                    onFocus={e => e.target.select()}
                    onKeyDown={e => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                  />
                );
              })}
            </div>

            {/* OTP Timeout badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-semibold bg-zinc-50 border border-zinc-100 py-2.5 px-4 rounded-2xl w-fit mx-auto shadow-sm">
              <Timer size={14} className={timeLeft <= 60 ? 'text-red-500 animate-spin' : 'text-[#0D9488]'} />
              <span className="font-sans">Mã có hiệu lực: </span>
              <span className={`font-mono font-bold text-sm ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-[#0F172A]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Verify Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || timeLeft <= 0}
              className="w-full bg-gradient-to-r from-[#0D9488] to-[#0D9488] hover:opacity-95 active:scale-[0.97] text-white font-bold rounded-2xl py-4 px-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm hover:translate-y-[-2px] hover:shadow-[0_12px_24px_rgba(16,185,129,0.15)]"
            >
              {isSubmitting ? (
                <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Xác thực ngay</span>
                </>
              )}
            </button>

            {/* Resend actions block */}
            <div className="text-center pt-4 border-t border-zinc-100">
              <p className="text-zinc-400 text-xs mb-2.5 font-sans">Không nhận được mã xác thực?</p>
              <button 
                type="button"
                onClick={handleResend}
                disabled={isResending || timeLeft > 540} // Disallow resending immediately
                className="text-[#0D9488] font-bold text-xs hover:opacity-85 hover:underline disabled:opacity-50 disabled:no-underline transition-all flex items-center gap-1.5 mx-auto focus:outline-none font-sans"
              >
                {isResending ? (
                  <>
                    <span className="inline-block border-2 border-emerald-500/30 border-t-[#10B981] rounded-full w-3 h-3 animate-spin"></span>
                    <span>Đang gửi lại...</span>
                  </>
                ) : timeLeft > 540 ? (
                  <span>Gửi lại mã OTP sau {formatTime(timeLeft - 540)}</span>
                ) : (
                  <span>Gửi lại mã OTP qua Email</span>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}
