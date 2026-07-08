import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Timer, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../../../api/axios';
import { toast } from 'react-hot-toast';

interface ForgotPasswordFlowProps {
  onSuccess: (email: string) => void;
  onCancel: () => void;
  initialEmail?: string;
}

export default function ForgotPasswordFlow({
  onSuccess,
  onCancel,
  initialEmail = '',
}: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState(initialEmail);
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotTimer, setForgotTimer] = useState(600);
  const [isSendingForgotOTP, setIsSendingForgotOTP] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotResendSuccess, setForgotResendSuccess] = useState(false);
  const [isResendingForgot, setIsResendingForgot] = useState(false);
  const [serverError, setServerError] = useState('');

  const forgotInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer effect for OTP
  useEffect(() => {
    if (step !== 2 || forgotTimer <= 0) return;
    const interval = setInterval(() => {
      setForgotTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, forgotTimer]);

  const handleForgotOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return false;

    const newOtp = [...forgotOtp];
    newOtp[index] = value.substring(value.length - 1);
    setForgotOtp(newOtp);

    if (newOtp[index] !== '' && index < 5) {
      forgotInputRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (forgotOtp[index] === '' && index > 0) {
        const newOtp = [...forgotOtp];
        newOtp[index - 1] = '';
        setForgotOtp(newOtp);
        forgotInputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...forgotOtp];
        newOtp[index] = '';
        setForgotOtp(newOtp);
      }
    }
  };

  const handleForgotOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const splitOtp = pastedData.split('');
      setForgotOtp(splitOtp);
      forgotInputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleSendForgotOTP = async () => {
    if (!forgotEmail) {
      setServerError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setServerError('Email không hợp lệ');
      return;
    }

    setIsSendingForgotOTP(true);
    setServerError('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      toast.success('Mã OTP khôi phục mật khẩu đã được gửi!');
      setStep(2);
      setForgotTimer(600);
      setForgotOtp(['', '', '', '', '', '']);
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSendingForgotOTP(false);
    }
  };

  const handleResendForgotOTP = async () => {
    setIsResendingForgot(true);
    setForgotResendSuccess(false);
    setServerError('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotResendSuccess(true);
      setForgotTimer(600);
      setForgotOtp(['', '', '', '', '', '']);
      if (forgotInputRefs.current[0]) {
        forgotInputRefs.current[0].focus();
      }
      setTimeout(() => setForgotResendSuccess(false), 5000);
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setIsResendingForgot(false);
    }
  };

  const handleResetPassword = async () => {
    const otpValue = forgotOtp.join('');
    if (otpValue.length !== 6) {
      setServerError('Vui lòng nhập đủ 6 chữ số OTP');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setServerError('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    setIsResettingPassword(true);
    setServerError('');
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: otpValue,
        newPassword: forgotNewPassword,
      });
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      onSuccess(forgotEmail);
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-header info inside card */}
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight font-jakarta">
          {step === 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}
        </h2>
        <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed font-sans">
          {step === 1 
            ? 'Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP xác nhận.' 
            : `Nhập mã OTP 6 chữ số gửi tới ${forgotEmail} và thiết lập mật khẩu mới.`}
        </p>
      </div>

      {/* Step 1: Input Email */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-2">
            <label htmlFor="forgot_email" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">Địa chỉ Email</label>
            <input
              id="forgot_email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendForgotOTP();
                }
              }}
              className="w-full bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-zinc-900 text-sm font-sans"
              placeholder="name@example.com"
            />
          </div>

          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-650 rounded-2xl text-xs font-semibold leading-relaxed font-sans animate-in fade-in duration-200">
              {serverError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-1/3 border border-zinc-250 hover:bg-zinc-50 text-zinc-600 font-bold rounded-2xl py-4 transition-all duration-300 text-sm flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={15} />
              <span>Hủy</span>
            </button>
            <button
              type="button"
              onClick={handleSendForgotOTP}
              disabled={isSendingForgotOTP}
              className="flex-1 bg-gradient-to-r from-[#10B981] to-[#0D9488] hover:opacity-95 active:scale-[0.97] text-white font-bold rounded-2xl py-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm hover:translate-y-[-2px]"
            >
              {isSendingForgotOTP ? (
                <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
              ) : (
                <>
                  <span>Gửi mã OTP</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Verification code and password reset */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-650 font-semibold mb-2 transition-colors focus:outline-none font-sans"
          >
            <ArrowLeft size={12} />
            <span>Thay đổi email</span>
          </button>

          {forgotResendSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl text-xs font-semibold leading-relaxed animate-in fade-in duration-200 font-sans">
              <CheckCircle2 size={15} className="inline mr-1 text-emerald-600" />
              Đã gửi lại mã OTP thành công!
            </div>
          )}

          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-650 rounded-2xl text-xs font-semibold leading-relaxed font-sans animate-in fade-in duration-200">
              <ShieldAlert size={15} className="inline mr-1 text-red-500" />
              {serverError}
            </div>
          )}

          {/* OTP inputs */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">Mã xác thực OTP</label>
            <div className="flex justify-between gap-1.5">
              {forgotOtp.map((data, index) => (
                <input
                  ref={el => (forgotInputRefs.current[index] = el)}
                  className="w-10 h-12 text-center text-lg font-bold bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 rounded-xl outline-none transition-all duration-200 text-zinc-900 shadow-sm font-sans"
                  type="text"
                  maxLength={1}
                  key={index}
                  value={data}
                  onChange={e => handleForgotOtpChange(e.target, index)}
                  onFocus={e => e.target.select()}
                  onKeyDown={e => handleForgotOtpKeyDown(e, index)}
                  onPaste={handleForgotOtpPaste}
                />
              ))}
            </div>
          </div>

          {/* New Password input */}
          <div className="space-y-2">
            <label htmlFor="forgot_password" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">Mật khẩu mới</label>
            <div className="relative">
              <input
                id="forgot_password"
                type={showForgotNewPassword ? "text" : "password"}
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleResetPassword();
                  }
                }}
                className="w-full bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-zinc-900 text-sm pr-12 font-sans"
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 transition-colors focus:outline-none"
              >
                {showForgotNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Timer display */}
          <div className="text-center bg-zinc-50 border border-zinc-100 py-2.5 px-4 rounded-xl w-fit mx-auto shadow-sm">
            <p className="text-[11px] text-zinc-400 font-medium font-sans flex items-center gap-1.5">
              <Timer size={13} className="text-[#10B981]" />
              <span>Mã có hiệu lực:</span>
              <span className="font-mono font-bold text-zinc-700">{Math.floor(forgotTimer / 60)}:{(forgotTimer % 60).toString().padStart(2, '0')}</span>
            </p>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isResettingPassword}
            className="w-full bg-gradient-to-r from-[#10B981] to-[#0D9488] hover:opacity-95 active:scale-[0.97] text-white font-bold rounded-2xl py-4 px-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm hover:translate-y-[-2px]"
          >
            {isResettingPassword ? (
              <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
            ) : (
              <>
                <Send size={15} />
                <span>Xác nhận đặt lại</span>
              </>
            )}
          </button>

          {/* Resend option */}
          <div className="text-center pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleResendForgotOTP}
              disabled={isResendingForgot || forgotTimer > 540}
              className="text-[#10B981] font-bold text-xs hover:opacity-85 hover:underline disabled:opacity-50 disabled:no-underline transition-all flex items-center gap-1.5 mx-auto focus:outline-none font-sans"
            >
              {isResendingForgot ? (
                <>
                  <span className="inline-block border-2 border-emerald-500/30 border-t-[#10B981] rounded-full w-3 h-3 animate-spin"></span>
                  <span>Đang gửi lại...</span>
                </>
              ) : forgotTimer > 540 ? (
                <span>Gửi lại mã sau {forgotTimer - 540}s</span>
              ) : (
                <span>Gửi lại mã OTP qua Email</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
