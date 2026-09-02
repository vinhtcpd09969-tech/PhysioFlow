import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  User,
  Phone,
  Mail,
  Shield,
  Key,
  Sparkles,
  X,
  Check,
  Loader2,
  ArrowLeft,
  Upload,
  Camera,
  Send,
  ShieldAlert
} from 'lucide-react';
import { updateStaff, updateStaffPassword, uploadImage, getStaff, sendAdminOTP } from '../../../api/admin.api';
import { useAuthStore, useAuthActions } from '../../../../../stores/authStore';
import { getRoleLabel, getRoleStyle } from './StaffTable';

interface StaffDetailViewProps {
  selectedStaff: any;
  setSelectedStaff: (staff: any | null) => void;
  setStaffList: (list: any[]) => void;
  onToggleStatus: (staff: any) => void;
  onDeleteAvatar: (staff: any) => void;
}

export function StaffDetailView({
  selectedStaff,
  setSelectedStaff,
  setStaffList,
  onToggleStatus,
  onDeleteAvatar,
}: StaffDetailViewProps) {
  const { user: currentUser } = useAuthStore();
  const { updateUser } = useAuthActions();

  const isSelf = Boolean(
    currentUser &&
    (String(selectedStaff.id) === String(currentUser.id) ||
      (selectedStaff.email && selectedStaff.email === currentUser.email))
  );

  const isAdmin = Number(selectedStaff.vai_tro_id) === 5;

  const [isEditMode, setIsEditMode] = useState(false);
  const [editTab, setEditTab] = useState<'basic' | 'specialist'>('basic');
  const [saveLoading, setSaveLoading] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Admin Security OTP States
  const [emailOtp, setEmailOtp] = useState('');
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);

  const [passwordOtp, setPasswordOtp] = useState('');
  const [isSendingPassOtp, setIsSendingPassOtp] = useState(false);
  const [passOtpCountdown, setPassOtpCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (emailOtpCountdown > 0) {
      timer = setTimeout(() => setEmailOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailOtpCountdown]);

  useEffect(() => {
    let timer: any;
    if (passOtpCountdown > 0) {
      timer = setTimeout(() => setPassOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [passOtpCountdown]);

  const handleSendEmailOtp = async () => {
    try {
      setIsSendingEmailOtp(true);
      const res = await sendAdminOTP('CHANGE_EMAIL');
      toast.success(res.data?.message || 'Đã gửi mã OTP về email hiện tại của Admin');
      setEmailOtpCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi mã OTP');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleSendPassOtp = async () => {
    try {
      setIsSendingPassOtp(true);
      const res = await sendAdminOTP('CHANGE_PASSWORD');
      toast.success(res.data?.message || 'Đã gửi mã OTP về email của bạn');
      setPassOtpCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi mã OTP');
    } finally {
      setIsSendingPassOtp(false);
    }
  };

  // Edit fields
  const [editHoTen, setEditHoTen] = useState(selectedStaff.ho_ten || '');
  const [editEmail, setEditEmail] = useState(selectedStaff.email || '');
  const [editSoDienThoai, setEditSoDienThoai] = useState(selectedStaff.so_dien_thoai || '');
  const [editAnhDaiDien, setEditAnhDaiDien] = useState<string | null>(selectedStaff.anh_dai_dien || null);
  const [editVaiTroId, setEditVaiTroId] = useState(selectedStaff.vai_tro_id || 2);
  const [editExperience, setEditExperience] = useState(selectedStaff.so_nam_kinh_nghiem || 0);

  // Certificates & description
  const [editCert, setEditCert] = useState(() => {
    try {
      const parsed = JSON.parse(selectedStaff.bang_cap_chung_chi || '{}');
      return parsed.text || (typeof parsed === 'string' ? parsed : '');
    } catch {
      return selectedStaff.bang_cap_chung_chi || '';
    }
  });

  const [editCertImages, setEditCertImages] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(selectedStaff.bang_cap_chung_chi || '{}');
      return Array.isArray(parsed.images) ? parsed.images : [];
    } catch {
      return [];
    }
  });

  const [uploadingCert, setUploadingCert] = useState(false);
  const [editDescription, setEditDescription] = useState(selectedStaff.mo_ta || '');
  const [moTaTab, setMoTaTab] = useState<'edit' | 'preview'>('edit');
  const [editTheManh, setEditTheManh] = useState<string[]>(() => {
    if (Array.isArray(selectedStaff.the_manh)) return selectedStaff.the_manh;
    if (typeof selectedStaff.the_manh === 'string') {
      try {
        const parsed = JSON.parse(selectedStaff.the_manh);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return selectedStaff.the_manh.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
  });
  const [theManhInput, setTheManhInput] = useState('');

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setEditAnhDaiDien(base64);
      if (!isEditMode) setIsEditMode(true);
      toast.success('Đã chọn ảnh đại diện mới. Bấm "Lưu lại" để lưu thay đổi.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddTheManh = () => {
    const value = theManhInput.trim();
    if (!value) return;
    if (editTheManh.includes(value)) {
      toast.error('Thế mạnh này đã được thêm rồi');
      return;
    }
    setEditTheManh(prev => [...prev, value]);
    setTheManhInput('');
  };

  const handleRemoveTheManh = (indexToRemove: number) => {
    setEditTheManh(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCertFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }
    try {
      setUploadingCert(true);
      const res = await uploadImage(file, 'specialist');
      const url = res.data.url;
      setEditCertImages(prev => [...prev, url]);
      toast.success('Tải ảnh chứng chỉ thành công!');
    } catch (error) {
      console.error('Error uploading cert image:', error);
      toast.error('Không thể tải ảnh chứng chỉ lên.');
    } finally {
      setUploadingCert(false);
    }
  };

  const removeCertImage = (indexToRemove: number) => {
    setEditCertImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaveLoading(true);
      
      const isEmailChanged = editEmail.trim().toLowerCase() !== (selectedStaff.email || '').trim().toLowerCase();
      if (isAdmin && isEmailChanged) {
        if (!emailOtp || emailOtp.trim().length !== 6) {
          toast.error('Vui lòng nhập mã OTP 6 số gửi về email hiện tại của Admin để đổi email.');
          setSaveLoading(false);
          return;
        }
      }

      const certValue = [3, 4].includes(editVaiTroId) ? JSON.stringify({
        text: editCert,
        images: editCertImages
      }) : '';

      const payload: any = {
        ho_ten: editHoTen,
        email: editEmail,
        so_dien_thoai: editSoDienThoai,
        vai_tro_id: editVaiTroId,
        anh_dai_dien: editAnhDaiDien,
        so_nam_kinh_nghiem: [3, 4].includes(editVaiTroId) ? editExperience : undefined,
        bang_cap_chung_chi: [3, 4].includes(editVaiTroId) ? certValue : undefined,
        mo_ta: [3, 4].includes(editVaiTroId) ? editDescription : undefined,
        the_manh: [3, 4].includes(editVaiTroId) ? editTheManh : undefined,
        otp: (isAdmin && isEmailChanged) ? emailOtp.trim() : undefined,
      };

      await updateStaff(selectedStaff.id, payload);
      toast.success('Cập nhật thông tin nhân sự thành công!');
      setIsEditMode(false);
      setEmailOtp('');
      
      if (isSelf) {
        updateUser({
          ho_ten: editHoTen,
          email: editEmail,
          so_dien_thoai: editSoDienThoai,
          anh_dai_dien: editAnhDaiDien,
          avatar_url: editAnhDaiDien
        });
      }

      const res = await getStaff();
      setStaffList(res.data);
      const updated = res.data.find((s: any) => s.id === selectedStaff.id);
      if (updated) {
        setSelectedStaff(updated);
        setEditAnhDaiDien(updated.anh_dai_dien || null);
      }
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhân sự.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (isAdmin) {
      if (!oldPassword) {
        toast.error('Vui lòng nhập mật khẩu hiện tại.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        toast.error('Mật khẩu mới phải từ 6 ký tự trở lên.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Xác nhận mật khẩu mới không khớp.');
        return;
      }
      if (!passwordOtp || passwordOtp.trim().length !== 6) {
        toast.error('Vui lòng nhập mã OTP 6 số gửi về email của bạn.');
        return;
      }
    } else {
      if (!newPassword || newPassword.length < 6) {
        toast.error('Mật khẩu mới phải từ 6 ký tự trở lên.');
        return;
      }
    }

    try {
      setIsUpdatingPassword(true);
      await updateStaffPassword(selectedStaff.id, {
        oldPassword: isAdmin ? oldPassword : '',
        password: newPassword,
        otp: isAdmin ? passwordOtp.trim() : undefined
      });
      toast.success('Cập nhật mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtp('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật mật khẩu');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const currentAvatar = editAnhDaiDien !== null ? editAnhDaiDien : selectedStaff.anh_dai_dien;
  const avatarUrl = currentAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedStaff.ho_ten)}&backgroundType=gradientLinear&fontSize=45`;

  return (
    <div className="space-y-4 pb-8 text-zinc-800 dark:text-zinc-250 font-sans text-sm min-h-[600px] animate-in fade-in slide-in-from-right duration-300">
      {/* COMPACT UNIFIED HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedStaff(null);
              setIsEditMode(false);
            }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-zinc-500 hover:text-primary shrink-0"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>

          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0 group/avatar size-12 rounded-full overflow-hidden border-2 border-primary/30 shadow-xs">
              <img
                src={avatarUrl}
                alt={selectedStaff.ho_ten}
                className="size-full object-cover"
              />

              {currentAvatar ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteAvatar(selectedStaff);
                  }}
                  title="Xóa ảnh đại diện"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer z-10"
                >
                  <X size={16} className="text-rose-400" />
                  <span className="text-[7.5px] font-black uppercase mt-0.5 text-rose-300">Xóa ảnh</span>
                </button>
              ) : (
                <label 
                  title="Tải ảnh đại diện mới"
                  className="absolute inset-0 bg-black/55 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer z-10"
                >
                  <Camera size={16} className="text-teal-300" />
                  <span className="text-[7.5px] font-black uppercase mt-0.5 tracking-tighter">Tải ảnh</span>
                  <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-secondary dark:text-zinc-200 leading-none">{selectedStaff.ho_ten}</span>
                <span className={`px-2 py-0.5 border rounded-lg text-[8.5px] font-extrabold uppercase tracking-widest ${getRoleStyle(selectedStaff.vai_tro_id)}`}>
                  {getRoleLabel(selectedStaff.vai_tro_id)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wide ${
                  selectedStaff.trang_thai === 'hoat_dong'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400'
                }`}>
                  {selectedStaff.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Khóa'}
                </span>
              </div>
              <span className="text-[11px] text-zinc-450 dark:text-zinc-500 font-semibold block mt-1">{selectedStaff.email}</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex gap-2">
          {Number(selectedStaff.vai_tro_id) !== 5 && (
            <button
              onClick={() => onToggleStatus(selectedStaff)}
              className={`px-3.5 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                selectedStaff.trang_thai === 'hoat_dong'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200/50 dark:bg-rose-955/15 dark:text-rose-400'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200/50 dark:bg-emerald-955/15 dark:text-emerald-400'
              }`}
            >
              {selectedStaff.trang_thai === 'hoat_dong' ? <><Lock size={12} /> Khóa tài khoản</> : <><Unlock size={12} /> Mở khóa hoạt động</>}
            </button>
          )}

          {!isEditMode ? (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              Bật chỉnh sửa
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(false);
                }}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all animate-in fade-in"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={saveLoading}
                onClick={handleSaveDetails}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 animate-in fade-in"
              >
                {saveLoading ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                Lưu lại
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SINGLE COMBINED WORKSPACE CARD */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
        {[3, 4].includes(editVaiTroId) && (
          <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setEditTab('basic')}
              className={`px-4 py-2 text-[9.5px] font-black tracking-wider rounded-lg uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                editTab === 'basic'
                  ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-200/20'
                  : 'text-zinc-450 hover:text-zinc-700'
              }`}
            >
              <User size={12} /> Thông tin cá nhân
            </button>
            <button
              type="button"
              onClick={() => setEditTab('specialist')}
              className={`px-4 py-2 text-[9.5px] font-black tracking-wider rounded-lg uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                editTab === 'specialist'
                  ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-200/20'
                  : 'text-zinc-450 hover:text-zinc-700'
              }`}
            >
              <Sparkles size={12} className="text-primary animate-pulse" /> Hồ sơ chuyên môn
            </button>
          </div>
        )}

        {editTab === 'basic' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">Địa chỉ email (Tên tài khoản)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-zinc-450 size-4" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    disabled={!isEditMode}
                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ${
                      isEditMode 
                        ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800' 
                        : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-850'
                    }`}
                  />
                </div>
                <span className="text-[8px] text-zinc-400 block italic leading-normal">
                  {isEditMode ? '* Có thể cập nhật địa chỉ email đăng nhập.' : '* Địa chỉ email đăng nhập do Admin quản lý.'}
                </span>

                {/* Khối xác thực OTP khi Admin đổi sang Email Mới */}
                {isEditMode && isAdmin && editEmail.trim().toLowerCase() !== (selectedStaff.email || '').trim().toLowerCase() && (
                  <div className="mt-2.5 p-3.5 bg-amber-50/90 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[10px] font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                        Xác thực đổi email Admin qua OTP gửi về: <span className="underline font-mono">{selectedStaff.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={isSendingEmailOtp || emailOtpCountdown > 0}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-300 disabled:text-zinc-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-1"
                      >
                        {isSendingEmailOtp ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                        {isSendingEmailOtp ? 'Đang gửi...' : emailOtpCountdown > 0 ? `Gửi lại (${emailOtpCountdown}s)` : 'Gửi mã OTP'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Nhập mã OTP 6 số gửi về email hiện tại..."
                        className="w-full bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/20 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">Họ và tên nhân sự</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-zinc-450 size-4" />
                  <input
                    type="text"
                    value={editHoTen}
                    onChange={(e) => setEditHoTen(e.target.value)}
                    disabled={!isEditMode}
                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ${
                      isEditMode 
                        ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800' 
                        : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-950/20 dark:border-zinc-850'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-455 dark:text-zinc-550 uppercase tracking-wider block">Số điện thoại liên hệ</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 text-zinc-455 size-4" />
                  <input
                    type="text"
                    value={editSoDienThoai}
                    onChange={(e) => setEditSoDienThoai(e.target.value)}
                    disabled={!isEditMode}
                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ${
                      isEditMode 
                        ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800' 
                        : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-850'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-455 dark:text-zinc-550 uppercase tracking-wider block">Vai trò làm việc</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3.5 text-zinc-455 size-4" />
                  <select
                    value={editVaiTroId}
                    onChange={(e) => setEditVaiTroId(Number(e.target.value))}
                    disabled={!isEditMode || isSelf || isAdmin}
                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ${
                      isEditMode && !isSelf && !isAdmin
                        ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800 cursor-pointer' 
                        : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-850'
                    }`}
                  >
                    {isAdmin ? (
                      <option value={5}>Admin</option>
                    ) : (
                      <>
                        <option value={2}>Lễ tân</option>
                        <option value={3}>Kỹ thuật viên</option>
                        <option value={4}>Chuyên viên tư vấn</option>
                        <option value={6}>Quản lý</option>
                      </>
                    )}
                  </select>
                </div>
                {isSelf && (
                  <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 block italic mt-1">
                    * Bạn không thể tự thay đổi vai trò Admin của chính mình.
                  </span>
                )}
              </div>
            </div>

            {/* Password Section */}
            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 mt-6">
              <div>
                <h5 className="text-[10px] font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                  <Key size={14} className="text-primary" /> Mật khẩu đăng nhập
                </h5>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal font-medium">
                  {isAdmin 
                    ? 'Để thay đổi mật khẩu Admin, vui lòng nhập mật khẩu cũ và mã OTP gửi về email xác nhận.' 
                    : 'Nhập mật khẩu mới bên dưới để thay đổi mật khẩu đăng nhập của nhân sự này.'}
                </p>
              </div>

              {isAdmin ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Mật khẩu hiện tại (Mật khẩu cũ)"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      {showOldPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Xác nhận mật khẩu mới"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* OTP Xác thực đổi mật khẩu Admin */}
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-900/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                        <ShieldAlert size={13} className="text-teal-600 shrink-0" />
                        Mã OTP gửi về email: <span className="underline font-mono">{selectedStaff.email}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleSendPassOtp}
                        disabled={isSendingPassOtp || passOtpCountdown > 0}
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-300 disabled:text-zinc-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-1"
                      >
                        {isSendingPassOtp ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                        {isSendingPassOtp ? 'Đang gửi...' : passOtpCountdown > 0 ? `Gửi lại (${passOtpCountdown}s)` : 'Gửi mã OTP'}
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={passwordOtp}
                      onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Nhập mã OTP 6 chữ số từ email..."
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleUpdatePassword}
                      disabled={isUpdatingPassword || !oldPassword || !newPassword || !confirmPassword || newPassword.length < 6 || !passwordOtp || passwordOtp.length !== 6}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:dark:bg-zinc-800 disabled:dark:text-zinc-600 font-black text-[10px] rounded-xl tracking-wider transition-all cursor-pointer select-none uppercase shadow-xs flex items-center justify-center gap-1.5 h-[38px]"
                    >
                      {isUpdatingPassword ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Check size={12} />}
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="relative flex-1 w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••• (Nhập mật khẩu mới từ 6 ký tự)"
                      className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword || !newPassword || newPassword.length < 6}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:dark:bg-zinc-800 disabled:dark:text-zinc-600 font-black text-[10px] rounded-xl tracking-wider transition-all cursor-pointer select-none uppercase shadow-xs shrink-0 w-full sm:w-auto h-[38px] flex items-center justify-center"
                  >
                    {isUpdatingPassword ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
                Số năm kinh nghiệm làm việc thực tế
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={editExperience}
                  onChange={(e) => setEditExperience(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  disabled={!isEditMode}
                  className={`w-24 border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-center ${
                    isEditMode
                      ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800'
                      : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-855'
                  }`}
                />
                <span className="text-xs text-zinc-555 dark:text-zinc-400 font-semibold">năm hoạt động lâm sàng</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">
                  Mô tả tóm tắt hồ sơ năng lực chuyên môn (Đầy đủ và Chi tiết)
                </label>
                
                <div className="flex bg-zinc-100 dark:bg-zinc-850 rounded-lg p-0.5 w-fit select-none">
                  <button
                    type="button"
                    onClick={() => setMoTaTab('edit')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      moTaTab === 'edit'
                        ? 'bg-white dark:bg-zinc-900 text-secondary dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-455 dark:text-zinc-500 hover:text-secondary'
                    }`}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoTaTab('preview')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      moTaTab === 'preview'
                        ? 'bg-white dark:bg-zinc-900 text-[#14B8A6] shadow-xs'
                        : 'text-zinc-455 dark:text-zinc-500 hover:text-secondary'
                    }`}
                  >
                    Xem trước
                  </button>
                </div>
              </div>

              {moTaTab === 'edit' ? (
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={!isEditMode}
                  placeholder="Hãy viết giới thiệu đầy đủ về bản thân, kinh nghiệm điều trị và thế mạnh của bạn..."
                  rows={8}
                  className={`w-full border rounded-2xl px-4 py-3.5 text-xs font-semibold outline-none resize-y leading-relaxed ${
                    isEditMode
                      ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800'
                      : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-555 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-855'
                  }`}
                />
              ) : (
                <div className="w-full bg-zinc-50/20 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-6 min-h-[180px] transition-all">
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] mb-4">
                    🔬 HỒ SƠ CHUYÊN MÔN
                  </h2>
                  <p className="text-slate-700 dark:text-zinc-300 text-sm md:text-[14px] font-medium leading-relaxed whitespace-pre-line text-left">
                    {editDescription.trim() || 'Chưa nhập thông tin hồ sơ chuyên môn...'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-wider block">
                Thế mạnh chuyên sâu (tối đa 6 thẻ, hiển thị công khai trên hồ sơ)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editTheManh.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    {tag}
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTheManh(idx)}
                        className="text-primary/60 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa thế mạnh này"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
                {editTheManh.length === 0 && (
                  <span className="text-[10px] text-zinc-400 font-semibold">Chưa có thế mạnh nào được thêm.</span>
                )}
              </div>
              {isEditMode && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={theManhInput}
                    onChange={(e) => setTheManhInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTheManh();
                      }
                    }}
                    placeholder="Ví dụ: Trị liệu bằng tay (Manual Therapy)..."
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-secondary dark:text-zinc-200 font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddTheManh}
                    className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">
                  Văn bằng / Chứng chỉ y khoa (Dạng văn bản)
                </label>
                <textarea 
                  value={editCert}
                  onChange={(e) => setEditCert(e.target.value)}
                  disabled={!isEditMode}
                  placeholder="Ví dụ: Cử nhân Phục hồi chức năng - Đại học Y Dược TP.HCM..."
                  rows={6}
                  className={`w-full border rounded-2xl px-4 py-3.5 text-xs font-semibold outline-none resize-none leading-relaxed ${
                    isEditMode
                      ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800'
                      : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-855'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-455 dark:text-zinc-555 uppercase tracking-wider block">
                  Tệp ảnh Chứng chỉ đính kèm (Có thể thêm nhiều ảnh)
                </label>
                
                <div className="grid grid-cols-2 gap-3 min-h-[110px] items-start">
                  {editCertImages.map((certSrc, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-950 group shadow-sm">
                      <img src={certSrc} alt={`Cert ${idx + 1}`} className="size-full object-cover rounded-lg" />
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => removeCertImage(idx)}
                          className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full size-5 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-sm"
                          title="Xóa ảnh chứng chỉ này"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}

                  {isEditMode && (
                    <label className="border-2 border-dashed border-zinc-250 dark:border-zinc-800 hover:border-primary/45 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-primary/5 transition-all text-center aspect-video shadow-inner">
                      {uploadingCert ? (
                        <Loader2 className="animate-spin text-primary size-5" />
                      ) : (
                        <Upload className="text-primary size-5" />
                      )}
                      <span className="text-[8px] font-black uppercase text-secondary dark:text-zinc-350">
                        {uploadingCert ? 'Đang tải...' : 'Tải tệp ảnh'}
                      </span>
                      <input type="file" accept="image/*" onChange={handleCertFileChange} className="hidden" disabled={uploadingCert} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
