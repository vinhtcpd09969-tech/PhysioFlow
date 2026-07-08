import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../stores/authStore';
import api from '../../../../api/axios';
import { 
  FileText, 
  Activity, 
  User, 
  ChevronRight, 
  Calendar, 
  Clipboard, 
  Search,
  Sparkles,
  HeartPulse
} from 'lucide-react';

export default function CustomerProfile() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'record' | 'sessions'>('record');
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const [medicalRecord, setMedicalRecord] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [recordRes, sessionsRes] = await Promise.all([
          api.get('/client/medical-record'),
          api.get('/client/treatment-sessions')
        ]);
        setMedicalRecord(recordRes.data);
        setSessions(sessionsRes.data);
      } catch (err) {
        console.error('Lỗi khi tải bệnh án & buổi trị liệu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2 border-primary/20"></div>
        <p className="text-zinc-500 font-medium text-sm">Đang tải bệnh án điện tử...</p>
      </div>
    );
  }

  const filteredSessions = sessions.filter(session => {
    const term = searchTerm.toLowerCase();
    return (
      String(session.so_thu_tu_buoi).includes(term) ||
      (session.ten_ky_thuat_vien && session.ten_ky_thuat_vien.toLowerCase().includes(term)) ||
      (session.ten_dich_vu && session.ten_dich_vu.toLowerCase().includes(term))
    );
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-secondary flex items-center gap-2.5">
            <HeartPulse className="text-primary" size={32} />
            Hồ sơ Sức khỏe & Điều trị
          </h1>
          <p className="text-gray-500 text-sm mt-1">Hồ sơ điều trị điện tử và lịch trình phục hồi chi tiết của bạn tại Office Care.</p>
        </div>
        
        {/* Quick Identity Card */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            {user?.ho_ten?.charAt(0) || 'K'}
          </div>
          <div>
            <p className="font-bold text-secondary text-sm">{user?.ho_ten || 'Khách hàng'}</p>
            <p className="text-xs text-gray-400">Mã BN: BN-2026-{user?.id?.substring(0, 4).toUpperCase() || '7752'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('record')}
          className={`px-6 py-3.5 font-heading font-bold text-sm tracking-wide transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'record'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-secondary'
          }`}
        >
          <Clipboard size={18} />
          Hồ sơ điều trị điện tử
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-3.5 font-heading font-bold text-sm tracking-wide transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-secondary'
          }`}
        >
          <Activity size={18} />
          Nhật ký trị liệu ({sessions.length} buổi)
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'record' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {!medicalRecord ? (
            <div className="lg:col-span-3 bg-white rounded-[24px] p-12 shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center space-y-4">
              <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                <Clipboard size={32} />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-secondary">Chưa có Bệnh án điện tử</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Bạn chưa có hồ sơ bệnh án nào được thiết lập. Hãy đăng ký khám với bác sĩ để bắt đầu liệu trình điều trị của mình.
              </p>
            </div>
          ) : (
            <>
              {/* Main Diagnosis Info */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Diagnosis Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <FileText size={20} />
                    </div>
                    <h2 className="font-heading font-bold text-lg text-secondary">Chẩn đoán Lâm sàng</h2>
                  </div>
                  
                  <h3 className="font-heading font-extrabold text-xl text-primary mb-3">
                    {medicalRecord.chan_doan || 'Chưa có kết luận chẩn đoán'}
                  </h3>
                  
                  <div className="space-y-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                    <div>
                      <span className="font-bold text-secondary block mb-1">Triệu chứng hiện tại:</span>
                      <p className="leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                        {medicalRecord.trieu_chung || 'Chưa ghi nhận thông tin triệu chứng.'}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-secondary block mb-1">Liệu trình chỉ định:</span>
                      <p className="leading-relaxed">{medicalRecord.phuong_phap_dieu_tri || 'Chưa có phương pháp được chỉ định.'}</p>
                    </div>
                  </div>
                </div>

                {/* Doctor Note */}
                {medicalRecord.ghi_chu && (
                  <div className="bg-[#E6F4F1] rounded-[24px] p-6 border border-primary/10 relative">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="bg-white p-1.5 rounded-lg text-primary shadow-sm">
                        <Sparkles size={18} />
                      </div>
                      <h2 className="font-heading font-bold text-lg text-secondary">Lời khuyên của Bác sĩ điều trị</h2>
                    </div>
                    <p className="text-secondary text-sm leading-relaxed font-medium italic">
                      "{medicalRecord.ghi_chu}"
                    </p>
                    
                    <div className="flex justify-between items-center mt-6 border-t border-primary/10 pt-4 text-xs font-semibold text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> Ngày lập hồ sơ: {new Date(medicalRecord.ngay_danh_gia).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-secondary font-bold">{medicalRecord.ten_bac_si || 'Bác sĩ điều trị'}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Package Details */}
              <div className="space-y-6">
                
                {/* Treatment Package Info Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 space-y-4">
                  <h2 className="font-heading font-bold text-lg text-secondary flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Gói điều trị chỉ định
                  </h2>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs">
                      <span className="font-bold text-zinc-500">Tên gói:</span>
                      <span className="font-bold text-secondary text-right">{medicalRecord.ten_goi || 'Trị liệu dịch vụ lẻ'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs">
                      <span className="font-bold text-zinc-500">Loại điều trị:</span>
                      <span className="font-bold text-primary">
                        {medicalRecord.loai_goi === 'lieu_trinh' ? 'Liệu trình chuyên sâu' : 'Trị liệu lẻ'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs">
                      <span className="font-bold text-zinc-500">Số buổi chỉ định:</span>
                      <span className="font-bold text-secondary">{medicalRecord.so_luong_buoi || 1} buổi</span>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs">
                      <span className="font-bold text-zinc-500">Chi phí gói:</span>
                      <span className="font-bold text-emerald-600">
                        {medicalRecord.gia_tien 
                          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(medicalRecord.gia_tien))
                          : 'Miễn phí / Dùng thử'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs">
                      <span className="font-bold text-zinc-500">Trạng thái hồ sơ:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        medicalRecord.trang_thai === 'da_dieu_phoi' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {medicalRecord.trang_thai === 'da_dieu_phoi' ? 'Đã điều phối' : 'Đang chờ xử lý'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      ) : (
        /* Sessions logs timeline styling */
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-bold text-lg text-secondary">Hồ sơ nhật ký điều trị chi tiết</h2>
            <div className="relative w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm buổi, KTV, dịch vụ..." 
                className="bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-1.5 text-xs w-full focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-[24px] p-12 shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center space-y-4">
              <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                <Activity size={32} />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-secondary">Chưa có Nhật ký trị liệu</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Bạn chưa thực hiện buổi trị liệu nào. Hãy đặt lịch hẹn và hoàn thành buổi trị liệu đầu tiên để xem nhật ký điều trị.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session, index) => (
                <div 
                  key={session.id || index} 
                  className="bg-zinc-50 rounded-2xl border border-zinc-150 transition-all hover:bg-white hover:shadow-md overflow-hidden"
                >
                  <button
                    onClick={() => setSelectedSession(selectedSession === session.so_thu_tu_buoi ? null : session.so_thu_tu_buoi)}
                    className="w-full text-left p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-heading font-black text-sm flex items-center justify-center">
                        #{session.so_thu_tu_buoi || (sessions.length - index)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-secondary text-sm">Buổi trị liệu số {session.so_thu_tu_buoi || (sessions.length - index)}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            session.trang_thai === 'hoan_thanh' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {session.trang_thai === 'hoan_thanh' ? 'Hoàn thành' : 'Đang thực hiện'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {new Date(session.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}
                          </span>
                          {session.ten_ky_thuat_vien && (
                            <span className="flex items-center gap-1">
                              <User size={12} /> KTV: {session.ten_ky_thuat_vien}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-primary group sm:ml-auto">
                      <span>{selectedSession === session.so_thu_tu_buoi ? 'Thu gọn' : 'Xem chi tiết'}</span>
                      <ChevronRight size={16} className={`transition-transform duration-200 ${selectedSession === session.so_thu_tu_buoi ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Session expanded details */}
                  {selectedSession === session.so_thu_tu_buoi && (
                    <div className="px-5 pb-5 pt-1 border-t border-zinc-150 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm pt-4">
                        <div className="md:col-span-2 space-y-3">
                          <span className="font-bold text-secondary text-xs uppercase tracking-wider text-gray-400 block">Nội dung trị liệu & Tóm tắt</span>
                          <p className="text-gray-600 bg-white p-3.5 rounded-xl border border-zinc-200 leading-relaxed text-xs">
                            {session.ai_tom_tat_ngan || 'Kỹ thuật viên chưa cập nhật tóm tắt buổi trị liệu.'}
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <span className="font-bold text-secondary text-xs uppercase tracking-wider text-gray-400 block">Dịch vụ thực hiện</span>
                          <div className="bg-white p-3.5 rounded-xl border border-zinc-200 text-xs font-bold text-primary">
                            {session.ten_dich_vu || 'Dịch vụ trị liệu chính'}
                          </div>
                          {session.canh_bao_dac_biet && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-150 text-[11px] font-semibold">
                              ⚠️ Cảnh báo đặc biệt: {session.canh_bao_dac_biet}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
