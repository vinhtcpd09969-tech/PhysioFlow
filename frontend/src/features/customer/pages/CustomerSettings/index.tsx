import { useState, useEffect, useMemo } from 'react';
import { useAuthStore, useAuthActions } from '../../../../stores/authStore';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';
import { updateProfile, getMe, getMyReviews } from '../../api/customer.api';
import toast from 'react-hot-toast';
import { 
  User,
  Save,
  Check,
  Loader2,
  Camera,
  Award,
  MessageSquare,
} from 'lucide-react';

import { ReviewsTab } from './components/ReviewsTab';
import { SecurityPasswordForm } from './components/SecurityPasswordForm';
import { SpecialistProfileDrawer } from './components/SpecialistProfileDrawer';

export default function CustomerSettings() {
  const { user } = useAuthStore();
  const { updateUser } = useAuthActions();
  const [activeSection, setActiveSection] = useState<'general' | 'reviews'>('general');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Specialist slide-in panel state
  const [showExpertForm, setShowExpertForm] = useState(false);

  const isExpert = [3, 4].includes(Number(user?.vai_tro_id));
  const isCustomer = user?.vai_tro_id === 1 || user?.vai_tro_id === 0 || !user?.vai_tro_id; // Default to true if user role is not loaded yet to prevent flashing
  const [hoTen, setHoTen] = useState(user?.ho_ten || '');
  const email = user?.email || '';
  const [soDienThoai, setSoDienThoai] = useState(user?.so_dien_thoai || '');
  const [gioiTinh, setGioiTinh] = useState(user?.gioi_tinh || 'nam');
  const [diaChi, setDiaChi] = useState(user?.dia_chi || '');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [anhDaiDien, setAnhDaiDien] = useState(user?.anh_dai_dien || '');
  const [soNamKinhNghiem, setSoNamKinhNghiem] = useState(user?.ho_so_chuyen_gia?.so_nam_kinh_nghiem || 0);
  const [bangCapChungChi, setBangCapChungChi] = useState('');
  const [anhChungChiList, setAnhChungChiList] = useState<string[]>([]);
  const [moTa, setMoTa] = useState(user?.ho_so_chuyen_gia?.mo_ta || '');
  const [moTaTab, setMoTaTab] = useState<'edit' | 'preview'>('edit');
  const [theManh, setTheManh] = useState<string[]>(user?.ho_so_chuyen_gia?.the_manh || []);
  const [theManhInput, setTheManhInput] = useState('');
  const [ngaySinh, setNgaySinh] = useState('');

  // Reviews states
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [serviceReviews, setServiceReviews] = useState<any[]>([]);
  const [staffReviews, setStaffReviews] = useState<any[]>([]);
  const [pendingServiceReviews, setPendingServiceReviews] = useState<any[]>([]);
  const [pendingStaffReviews, setPendingStaffReviews] = useState<any[]>([]);

  const loadMyReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await getMyReviews();
      setServiceReviews(res.data.serviceReviews || []);
      setStaffReviews(res.data.staffReviews || []);
      setPendingServiceReviews(res.data.pendingServiceReviews || []);
      setPendingStaffReviews(res.data.pendingStaffReviews || []);
    } catch (err) {
      console.error('Lỗi nạp đánh giá:', err);
      toast.error('Không thể tải danh sách đánh giá.');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'reviews' && isCustomer) {
      loadMyReviews();
    }
  }, [activeSection, isCustomer]);



  // Fetch latest database profile on mount
  useEffect(() => {
    async function loadLatestProfile() {
      try {
        const res = await getMe();
        updateUser(res.data);
      } catch (err) {
        console.error('Lỗi khi nạp thông tin tài khoản:', err);
      }
    }
    loadLatestProfile();
  }, []);

  // Update local states when store user changes
  useEffect(() => {
    if (user) {
      setHoTen(user.ho_ten);
      setSoDienThoai(user.so_dien_thoai || '');
      setGioiTinh(user.gioi_tinh || 'nam');
      setDiaChi(user.dia_chi || '');
      setAnhDaiDien(user.anh_dai_dien || '');
      setSoNamKinhNghiem(user.ho_so_chuyen_gia?.so_nam_kinh_nghiem || 0);
      setMoTa(user.ho_so_chuyen_gia?.mo_ta || '');
      setTheManh(user.ho_so_chuyen_gia?.the_manh || []);

      if (user.ngay_sinh) {
        const d = new Date(user.ngay_sinh);
        if (!isNaN(d.getTime())) {
          setNgaySinh(d.toISOString().split('T')[0]);
        } else {
          setNgaySinh('');
        }
      } else {
        setNgaySinh('');
      }

      // Định dạng chuẩn: chuỗi JSON { text: string, images: string[] } (đã chuẩn hóa toàn bộ dữ liệu DB).
      // Vẫn giữ try/catch phòng hờ dữ liệu chỉnh sửa tay không đúng định dạng.
      const rawCert = user.ho_so_chuyen_gia?.bang_cap_chung_chi || '';
      if (rawCert) {
        try {
          const parsed = JSON.parse(rawCert);
          setBangCapChungChi(parsed.text || '');
          setAnhChungChiList(Array.isArray(parsed.images) ? parsed.images : []);
        } catch {
          setBangCapChungChi(rawCert);
          setAnhChungChiList([]);
        }
      } else {
        setBangCapChungChi('');
        setAnhChungChiList([]);
      }
    }
  }, [user]);

  // Handle avatar upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnhDaiDien(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle certificate image upload
  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Kích thước tệp chứng chỉ không được vượt quá 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnhChungChiList(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCertImage = (index: number) => {
    setAnhChungChiList(prev => prev.filter((_, idx) => idx !== index));
  };

  const addTheManh = () => {
    const value = theManhInput.trim();
    if (!value) return;
    if (theManh.length >= 6) {
      toast.error('Chỉ được thêm tối đa 6 thế mạnh chuyên sâu');
      return;
    }
    if (theManh.includes(value)) {
      toast.error('Thế mạnh này đã được thêm rồi');
      return;
    }
    setTheManh(prev => [...prev, value]);
    setTheManhInput('');
  };

  const removeTheManh = (index: number) => {
    setTheManh(prev => prev.filter((_, idx) => idx !== index));
  };

  // Dynamic Avatar preview
  const avatarSrc = useMemo(() => {
    if (anhDaiDien) return anhDaiDien;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(hoTen || 'Staff')}&backgroundType=gradientLinear&fontSize=45`;
  }, [anhDaiDien, hoTen]);

  // Dirty check: Chỉ sáng nút lưu khi thông tin cá nhân thực sự thay đổi
  // Dirty check: Chỉ sáng nút lưu khi thông tin cá nhân thực sự thay đổi
  const isProfileDirty = useMemo(() => {
    if (!user) return false;
    const userBirth = user.ngay_sinh ? new Date(user.ngay_sinh).toISOString().split('T')[0] : '';
    const baseDirty = (
      hoTen.trim() !== (user.ho_ten || '').trim() ||
      soDienThoai.trim() !== (user.so_dien_thoai || '').trim() ||
      (isCustomer && (
        gioiTinh !== (user.gioi_tinh || 'nam') ||
        diaChi.trim() !== (user.dia_chi || '').trim() ||
        ngaySinh !== userBirth
      )) ||
      (!isCustomer && anhDaiDien !== (user.anh_dai_dien || ''))
    );
    if (baseDirty) return true;
    if (isExpert) {
      const rawCert = user.ho_so_chuyen_gia?.bang_cap_chung_chi || '';
      let parsedCertText = '';
      let parsedCertImages: string[] = [];
      if (rawCert) {
        try {
          const p = JSON.parse(rawCert);
          parsedCertText = p.text || '';
          parsedCertImages = Array.isArray(p.images) ? p.images : [];
        } catch {
          parsedCertText = rawCert;
        }
      }
      const expertDirty = (
        soNamKinhNghiem !== (user.ho_so_chuyen_gia?.so_nam_kinh_nghiem || 0) ||
        moTa.trim() !== (user.ho_so_chuyen_gia?.mo_ta || '').trim() ||
        bangCapChungChi.trim() !== parsedCertText.trim() ||
        JSON.stringify(anhChungChiList) !== JSON.stringify(parsedCertImages) ||
        JSON.stringify(theManh) !== JSON.stringify(user.ho_so_chuyen_gia?.the_manh || [])
      );
      if (expertDirty) return true;
    }
    return false;
  }, [user, hoTen, soDienThoai, gioiTinh, diaChi, ngaySinh, anhDaiDien, isCustomer, isExpert, soNamKinhNghiem, moTa, bangCapChungChi, anhChungChiList, theManh]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }
    if (!soDienThoai.trim()) {
      toast.error('Số điện thoại không được để trống');
      return;
    }
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    if (!phoneRegex.test(soDienThoai.trim())) {
      toast.error('Số điện thoại không hợp lệ (Ví dụ: 0987654321 hoặc +84987654321)');
      return;
    }

    setShowConfirmDialog(true);
  };

  const executeSaveGeneral = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      // 1. Gộp bằng cấp & danh sách ảnh chứng chỉ thành chuỗi JSON
      const certValue = isExpert ? JSON.stringify({
        text: bangCapChungChi,
        images: anhChungChiList
      }) : '';

      // 2. Cập nhật hồ sơ thông tin cá nhân
      const payload: any = {
        ho_ten: hoTen,
        so_dien_thoai: soDienThoai,
      };

      if (isCustomer) {
        payload.gioi_tinh = gioiTinh;
        payload.dia_chi = diaChi;
        payload.ngay_sinh = ngaySinh || null;
      } else {
        payload.anh_dai_dien = anhDaiDien || null;
      }

      if (isExpert) {
        payload.so_nam_kinh_nghiem = soNamKinhNghiem;
        payload.bang_cap_chung_chi = certValue;
        payload.mo_ta = moTa;
        payload.the_manh = theManh;
      }

      await updateProfile(payload);
      
      // Cập nhật client state
      const updateData: any = {
        ho_ten: hoTen,
        so_dien_thoai: soDienThoai,
        anh_dai_dien: !isCustomer ? (anhDaiDien || null) : user?.anh_dai_dien,
        ho_so_chuyen_gia: isExpert ? {
          so_nam_kinh_nghiem: soNamKinhNghiem,
          bang_cap_chung_chi: certValue,
          mo_ta: moTa,
          the_manh: theManh
        } : null
      };

      if (isCustomer) {
        updateData.gioi_tinh = gioiTinh;
        updateData.dia_chi = diaChi;
        updateData.ngay_sinh = ngaySinh || null;
      }

      updateUser(updateData);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      toast.success('Cập nhật thông tin tài khoản thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi cập nhật thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roleId?: number) => {
    if (roleId === 4) return 'Chuyên viên tư vấn';
    if (roleId === 3) return 'Kỹ thuật viên';
    if (roleId === 2) return 'Lễ tân';
    if (roleId === 6) return 'Quản lý';
    if (roleId === 5) return 'Quản trị viên';
    return 'Khách hàng';
  };

  return (
    <div className="w-full space-y-6 font-jakarta pb-12 animate-fade-in">
      
      {/* 1. Full-Width 50/50 Navigation Header */}
      <div className="w-full bg-slate-100/90 dark:bg-zinc-800/90 p-1.5 rounded-2xl shadow-xs border border-slate-200/50 dark:border-zinc-700/60">
        <div className={`w-full grid ${isCustomer ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
          <button
            type="button"
            onClick={() => {
              setActiveSection('general');
              setShowExpertForm(false);
            }}
            className={`w-full py-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
              activeSection === 'general'
                ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-850/50'
            }`}
          >
            <User size={16} />
            <span>Tài khoản & Bảo mật</span>
          </button>
          {isCustomer && (
            <button
              type="button"
              onClick={() => setActiveSection('reviews')}
              className={`w-full py-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
                activeSection === 'reviews'
                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-850/50'
              }`}
            >
              <MessageSquare size={16} />
              <span>Đánh giá của tôi</span>
              {(pendingServiceReviews.length + pendingStaffReviews.length) > 0 && (
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in duration-300 shadow-sm">
          <Check size={16} className="shrink-0 text-emerald-600" />
          Đã ghi nhận toàn bộ các thiết lập thay đổi của bạn thành công!
        </div>
      )}

      {activeSection === 'general' && (
        <div className="w-full space-y-6">
          {!showExpertForm ? (
            <div className="space-y-6">
              {/* 1. Form thông tin cơ bản với Avatar tròn tích hợp */}
              <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/70 dark:border-zinc-800 p-6 md:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    {/* Avatar tròn: Khách hàng dùng Avatar chữ cái cố định; Nhân sự có chức năng đổi ảnh */}
                    {isCustomer ? (
                      <div className="size-16 sm:size-18 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-xl flex items-center justify-center shrink-0 border-2 border-teal-500/30 shadow-sm uppercase select-none">
                        {hoTen ? hoTen.split(' ').slice(-2).map(n => n[0]).join('') : 'KH'}
                      </div>
                    ) : (
                      <div className="relative group size-16 sm:size-18 rounded-full overflow-hidden border-2 border-teal-500/30 hover:border-teal-500 transition-all duration-300 shrink-0 shadow-sm">
                        <img 
                          src={avatarSrc} 
                          alt="Avatar" 
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera size={16} />
                          <span className="text-[8px] font-bold mt-0.5">Đổi ảnh</span>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                          Thông tin cơ bản
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                          <span className="size-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                          {getRoleBadge(user?.vai_tro_id)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                        {isCustomer ? 'Cập nhật thông tin cá nhân và tài khoản y tế' : 'Rê chuột vào ảnh tròn để tải lên ảnh đại diện mới'}
                      </p>
                    </div>
                  </div>

                  {isExpert && (
                    <button
                      type="button"
                      onClick={() => setShowExpertForm(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-950/40 dark:to-emerald-950/20 hover:from-teal-500/20 hover:to-emerald-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Award size={15} />
                      <span>Chỉnh sửa hồ sơ chuyên môn</span>
                    </button>
                  )}
                </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        required
                        value={hoTen}
                        onChange={(e) => setHoTen(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        value={soDienThoai}
                        onChange={(e) => setSoDienThoai(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      />
                    </div>

                    {isCustomer && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Giới tính
                          </label>
                          <select
                            value={gioiTinh}
                            onChange={(e) => setGioiTinh(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors cursor-pointer"
                          >
                            <option value="nam">Nam</option>
                            <option value="nu">Nữ</option>
                            <option value="khac">Khác</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Ngày sinh
                          </label>
                          <CustomDatePicker
                            value={ngaySinh}
                            onChange={(val) => setNgaySinh(val)}
                            placeholder="dd/mm/yyyy"
                            maxDate={new Date().toISOString().split('T')[0]}
                            align="right"
                            showPresets={false}
                            className="w-full"
                            buttonClassName="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {isCustomer && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Địa chỉ
                      </label>
                      <input
                        type="text"
                        value={diaChi}
                        onChange={(e) => setDiaChi(e.target.value)}
                        placeholder="Địa chỉ cư trú hiện tại..."
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Vai trò hệ thống
                      </label>
                      <input
                        type="text"
                        disabled
                        value={getRoleBadge(user?.vai_tro_id)}
                        className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={loading || !isProfileDirty}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Lưu thay đổi thông tin
                    </button>
                  </div>
                </form>

                {/* 2. Form đổi mật khẩu bằng OTP */}
                <SecurityPasswordForm email={email} />
              </div>
            ) : (
              /* Specialist Profile Drawer */
              <SpecialistProfileDrawer
                onBack={() => setShowExpertForm(false)}
                onSubmit={handleSaveGeneral}
                loading={loading}
                soNamKinhNghiem={soNamKinhNghiem}
                setSoNamKinhNghiem={setSoNamKinhNghiem}
                moTa={moTa}
                setMoTa={setMoTa}
                moTaTab={moTaTab}
                setMoTaTab={setMoTaTab}
                theManh={theManh}
                theManhInput={theManhInput}
                setTheManhInput={setTheManhInput}
                addTheManh={addTheManh}
                removeTheManh={removeTheManh}
                bangCapChungChi={bangCapChungChi}
                setBangCapChungChi={setBangCapChungChi}
                anhChungChiList={anhChungChiList}
                handleCertFileChange={handleCertFileChange}
                removeCertImage={removeCertImage}
              />
            )}
          </div>
      )}


        {activeSection === 'reviews' && isCustomer && (
          <ReviewsTab
            reviewsLoading={reviewsLoading}
            serviceReviews={serviceReviews}
            staffReviews={staffReviews}
            pendingServiceReviews={pendingServiceReviews}
            pendingStaffReviews={pendingStaffReviews}
            onRefresh={loadMyReviews}
          />
        )}

      {/* Save Settings Confirm Modal */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Lưu thay đổi cài đặt?"
        message="Bạn có chắc chắn muốn lưu lại toàn bộ thay đổi đối với cài đặt tài khoản này không?"
        confirmLabel="Lưu thay đổi"
        cancelLabel="Hủy bỏ"
        type="warning"
        onConfirm={executeSaveGeneral}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}
