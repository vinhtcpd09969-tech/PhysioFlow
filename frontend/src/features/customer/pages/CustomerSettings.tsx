import { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  ShieldAlert,
  Save,
  Check
} from 'lucide-react';

export default function CustomerSettings() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Form states
  const [hoTen, setHoTen] = useState(user?.ho_ten || 'Tuấn Khải Phan');
  const email = user?.email || 'VanNgoc67@yahoo.com';
  const [soDienThoai, setSoDienThoai] = useState((user as any)?.so_dien_thoai || '0248 1408 1678');
  const [diaChi, setDiaChi] = useState('128 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội');

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification states
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyZalo, setNotifyZalo] = useState(true);

  const handleSave = (e: any) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-secondary flex items-center gap-2.5">
          <Settings className="text-primary" size={32} />
          Cài đặt tài khoản
        </h1>
        <p className="text-gray-500 text-sm mt-1">Cập nhật thông tin cá nhân, bảo mật tài khoản và tùy chọn nhận thông báo.</p>
      </div>

      {/* Main Settings Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Navigation Links */}
        <div className="lg:col-span-1 bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 h-fit space-y-1">
          {[
            { id: 'profile', name: 'Thông tin cá nhân', icon: <User size={18} /> },
            { id: 'security', name: 'Mật khẩu & Bảo mật', icon: <Lock size={18} /> },
            { id: 'notifications', name: 'Cài đặt thông báo', icon: <Bell size={18} /> }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-left outline-none ${
                activeSection === sec.id
                  ? 'bg-primary/5 text-primary'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-secondary'
              }`}
            >
              {sec.icon}
              {sec.name}
            </button>
          ))}
        </div>

        {/* Right Side: Section Forms */}
        <div className="lg:col-span-3 bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          
          {savedSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-300">
              <Check size={16} /> Lưu cài đặt tài khoản thành công!
            </div>
          )}

          {activeSection === 'profile' && (
            <form onSubmit={handleSave} className="space-y-5">
              <h2 className="font-heading font-bold text-lg text-secondary border-b border-gray-100 pb-3 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Thông tin cá nhân
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="hoTenInput" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Họ và tên</label>
                  <input 
                    id="hoTenInput"
                    type="text" 
                    value={hoTen}
                    onChange={(e) => setHoTen(e.target.value)}
                    className="w-full bg-zinc-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-sm text-secondary font-medium outline-none transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sdtInput" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Số điện thoại</label>
                  <input 
                    id="sdtInput"
                    type="text" 
                    value={soDienThoai}
                    onChange={(e) => setSoDienThoai(e.target.value)}
                    className="w-full bg-zinc-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-sm text-secondary font-medium outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emailInput" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Địa chỉ Email</label>
                <input 
                  id="emailInput"
                  type="email" 
                  value={email}
                  disabled
                  className="w-full bg-zinc-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400 font-medium outline-none cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 font-bold tracking-wide">Email đã được xác thực chính chủ. Liên hệ Lễ tân nếu muốn thay đổi.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="diaChiInput" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Địa chỉ liên hệ</label>
                <input 
                  id="diaChiInput"
                  type="text" 
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                  className="w-full bg-zinc-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-sm text-secondary font-medium outline-none transition-colors"
                  required
                />
              </div>

              <button 
                type="submit"
                className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-xs"
              >
                <Save size={16} /> Lưu thông tin cá nhân
              </button>
            </form>
          )}

          {activeSection === 'security' && (
            <form onSubmit={handleSave} className="space-y-5">
              <h2 className="font-heading font-bold text-lg text-secondary border-b border-gray-100 pb-3 flex items-center gap-2">
                <Lock size={20} className="text-primary" />
                Mật khẩu & Bảo mật
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="oldPasswordInput" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Mật khẩu hiện tại</label>
                  <input 
                    id="oldPasswordInput"
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Gõ mật khẩu đang dùng"
                    className="w-full bg-zinc-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-sm text-secondary font-medium outline-none transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="newPasswordInput" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Mật khẩu mới</label>
                    <input 
                      id="newPasswordInput"
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-zinc-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-sm text-secondary font-medium outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirmPasswordInput" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nhập lại mật khẩu mới</label>
                    <input 
                      id="confirmPasswordInput"
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Xác nhận trùng khớp"
                      className="w-full bg-zinc-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-sm text-secondary font-medium outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#FFF9E6] p-4 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                <ShieldAlert size={18} className="flex-shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-bold">Lưu ý bảo mật:</p>
                  <p className="font-medium text-gray-600 mt-0.5">Không dùng mật khẩu quá dễ đoán (như 123456). Mật khẩu an toàn giúp bảo mật hồ sơ bệnh lý của bạn.</p>
                </div>
              </div>

              <button 
                type="submit"
                className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-xs"
              >
                <Save size={16} /> Cập nhật mật khẩu
              </button>
            </form>
          )}

          {activeSection === 'notifications' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="font-heading font-bold text-lg text-secondary border-b border-gray-100 pb-3 flex items-center gap-2">
                <Bell size={20} className="text-primary" />
                Cài đặt kênh thông báo nhắc lịch
              </h2>

              <div className="space-y-4">
                {[
                  {
                    state: notifySMS,
                    setter: setNotifySMS,
                    title: 'Tin nhắn di động (SMS)',
                    desc: 'Nhắc lịch tự động qua số điện thoại đăng ký trước 2 tiếng.'
                  },
                  {
                    state: notifyZalo,
                    setter: setNotifyZalo,
                    title: 'Trợ lý Zalo OA',
                    desc: 'Nhận tin nhắn Zalo tương tác nhắc lịch và nhận ghi chú buổi tập.'
                  },
                  {
                    state: notifyEmail,
                    setter: setNotifyEmail,
                    title: 'Thư điện tử (Email)',
                    desc: 'Nhận thư điện tử gửi chẩn đoán lâm sàng của bác sĩ và sao kê hóa đơn.'
                  }
                ].map((item, index) => (
                  <div 
                    key={index}
                    onClick={() => item.setter(!item.state)}
                    className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-zinc-50 hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-secondary">{item.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>

                    <button 
                      type="button"
                      className={`size-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                        item.state 
                          ? 'bg-primary border-primary text-white scale-110' 
                          : 'border-gray-300 text-transparent'
                      }`}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                type="submit"
                className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-xs"
              >
                <Save size={16} /> Lưu tùy chọn thông báo
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
