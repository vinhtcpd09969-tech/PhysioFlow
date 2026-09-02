import React, { useState, useEffect } from 'react';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { sendChangePasswordOTP, changePassword } from '../../../api/customer.api';
import toast from 'react-hot-toast';

interface SecurityPasswordFormProps {
  email: string;
}

export const SecurityPasswordForm: React.FC<SecurityPasswordFormProps> = ({ email }) => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    try {
      setIsSendingOtp(true);
      await sendChangePasswordOTP();
      toast.success('Mã OTP đã được gửi đến email của bạn.');
      setOtpCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi mã OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const isPasswordDirty = Boolean(otp || newPassword || confirmPassword);

  const handleResetForm = () => {
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error('Vui lòng nhập mã OTP.');
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Xác nhận mật khẩu không khớp.');
    }

    try {
      setPasswordLoading(true);
      await changePassword({ otp, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      handleResetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePasswordSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/70 dark:border-zinc-800 p-6 md:p-8 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-teal-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Đổi mật khẩu
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 italic">Xác thực qua mã OTP Email</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Mã xác thực OTP (Gửi về {email})
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Nhập 6 chữ số OTP..."
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp || otpCountdown > 0}
              className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer shrink-0"
            >
              {isSendingOtp ? (
                <Loader2 size={14} className="animate-spin" />
              ) : otpCountdown > 0 ? (
                `Gửi lại (${otpCountdown}s)`
              ) : (
                'Nhận mã OTP'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 pr-9 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 pr-9 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3">
        {isPasswordDirty && (
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={passwordLoading}
          className="px-6 py-2.5 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {passwordLoading && <Loader2 size={14} className="animate-spin" />}
          Cập nhật mật khẩu
        </button>
      </div>
    </form>
  );
};
