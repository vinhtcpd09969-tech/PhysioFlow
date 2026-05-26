import { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { 
  FileText, 
  Activity, 
  User, 
  ChevronRight, 
  TrendingDown, 
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

  // Mock data for Electronic Medical Record (Bệnh án điện tử)
  const medicalRecord = {
    chan_doan: 'Hội chứng Cổ Vai Gáy cấp tính / Thoái hóa cột sống cổ C5-C6 nhẹ',
    trieu_chung: 'Đau mỏi cổ lan xuống bả vai trái, hạn chế quay đầu sang trái, tê nhẹ ngón tay trỏ.',
    ngay_lap: '24/05/2026',
    bac_si: 'BS. Trần Văn Khám',
    chi_so_ban_dau: {
      vas: 8,
      rom_trai: '45° (Hạn chế nặng)',
      rom_phai: '70° (Bình thường)',
      co_luc: 'Khá (4/5)'
    },
    chi_so_hien_tai: {
      vas: 2,
      rom_trai: '65° (Cải thiện rõ)',
      rom_phai: '75° (Hoàn hảo)',
      co_luc: 'Tốt (5/5)'
    },
    phuong_phap: 'Sóng xung kích (Shockwave), Điện xung giảm đau, di động khớp cột sống cổ C5-C6 kết hợp bài tập kéo giãn cơ thang cơ nâng vai.',
    ghi_chu_bac_si: 'Bệnh nhân đáp ứng rất tốt với sóng xung kích. Đã phục hồi 80% biên độ vận động cổ. Cần tiếp tục duy trì bài tập kéo giãn tại nhà và chườm ấm bả vai.'
  };

  // Mock data for sessions
  const sessions = [
    { number: 8, date: '25/05/2026', ktv: 'KTV Trúc Ly Đặng', score: 2, note: 'Khớp cổ đã di động linh hoạt hơn rất nhiều. Sóng xung kích cường độ 1.8 bar đáp ứng tốt. Cơ vai gáy mềm mại.', exercises: ['Căng cơ vai gáy với dây kháng lực', 'Xoay cổ thụ động nhịp nhàng'] },
    { number: 7, date: '22/05/2026', ktv: 'KTV Trúc Ly Đặng', score: 3, note: 'Tình trạng tê tay đã biến mất hoàn toàn. Đau bả vai trái chỉ xuất hiện khi ngồi máy tính liên tục trên 3 tiếng.', exercises: ['Bài tập kéo dãn cơ thang', 'Xoay khớp vai chủ động'] },
    { number: 6, date: '19/05/2026', ktv: 'KTV Trúc Ly Đặng', score: 4, note: 'Biên độ vận động nghiêng cổ trái tăng thêm 10 độ. Giảm chèn ép rễ thần kinh cổ.', exercises: ['Căng cơ ức đòn chũm cơ nâng vai', 'Bài tập cằm thụt kép cổ'] },
    { number: 5, date: '16/05/2026', ktv: 'KTV Trúc Ly Đặng', score: 5, note: 'Cơ vai bớt co cứng. Đã giảm đau đầu vùng chẩm. Tiếp tục bài tập giải phóng mạc cơ cổ sâu.', exercises: ['Bài tập gập cổ sâu', 'Kéo giãn cơ thang cơ ngực lớn'] },
    { number: 4, date: '12/05/2026', ktv: 'KTV Trúc Ly Đặng', score: 6, note: 'Đau mỏi cổ lan nhẹ xuống cánh tay. Giảm liều sóng xung kích, tăng thời lượng điện xung trị liệu.', exercises: ['Di động cột sống cổ nhẹ nhàng', 'Kéo giãn cơ ngực cơ vai'] },
    { number: 3, date: '09/05/2026', ktv: 'KTV Trúc Ly Đặng', score: 7, note: 'Vẫn còn hạn chế quay cổ sang trái nhiều. Co thắt mạnh cơ nâng vai trái.', exercises: ['Kéo giãn thụ động vùng cổ', 'Chườm nóng hồng ngoại bả vai'] },
    { number: 2, date: '06/05/2026', ktv: 'KTV Trúc Ly Đặng', score: 8, note: 'Bắt đầu liệu trình di động khớp nhẹ nhàng. Bệnh nhân đau nhiều vùng bả vai trái.', exercises: ['Điện xung giảm co thắt cơ', 'Bài tập kéo giãn cơ nông'] },
    { number: 1, date: '03/05/2026', ktv: 'KTV Trúc Ly Đặng', score: 8, note: 'Buổi khám lâm sàng và trị liệu đầu tiên. Cổ cứng, đau chói khi ấn khớp cổ C5.', exercises: ['Giải tỏa cơ bả vai bằng tay', 'Hồng ngoại nhiệt vùng cổ gáy'] }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-secondary flex items-center gap-2.5">
            <HeartPulse className="text-primary" size={32} />
            Hồ sơ Sức khỏe & Bệnh án
          </h1>
          <p className="text-gray-500 text-sm mt-1">Bệnh án điện tử và lịch trình phục hồi chi tiết của bạn tại Office Care.</p>
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
          Bệnh án điện tử
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
                {medicalRecord.chan_doan}
              </h3>
              
              <div className="space-y-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                <div>
                  <span className="font-bold text-secondary block mb-1">Triệu chứng hiện tại:</span>
                  <p className="leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">{medicalRecord.trieu_chung}</p>
                </div>
                <div>
                  <span className="font-bold text-secondary block mb-1">Liệu trình chỉ định:</span>
                  <p className="leading-relaxed">{medicalRecord.phuong_phap}</p>
                </div>
              </div>
            </div>

            {/* Doctor Note */}
            <div className="bg-[#E6F4F1] rounded-[24px] p-6 border border-primary/10 relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="bg-white p-1.5 rounded-lg text-primary shadow-sm">
                  <Sparkles size={18} />
                </div>
                <h2 className="font-heading font-bold text-lg text-secondary">Lời khuyên của Bác sĩ điều trị</h2>
              </div>
              <p className="text-secondary text-sm leading-relaxed font-medium italic">
                "{medicalRecord.ghi_chu_bac_si}"
              </p>
              
              <div className="flex justify-between items-center mt-6 border-t border-primary/10 pt-4 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1"><Calendar size={14} /> Ngày lập hồ sơ: {medicalRecord.ngay_lap}</span>
                <span className="text-secondary font-bold">{medicalRecord.bac_si}</span>
              </div>
            </div>

          </div>

          {/* Clinical Metrics & Recovery Indexes */}
          <div className="space-y-6">
            
            {/* Comparative Health Metrics Card */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <h2 className="font-heading font-bold text-lg text-secondary mb-6 flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Chỉ số Phục hồi
              </h2>
              
              <div className="space-y-6">
                
                {/* VAS Slider Indicator */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mức độ đau (VAS)</span>
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <TrendingDown size={12} /> Giảm {medicalRecord.chi_so_ban_dau.vas - medicalRecord.chi_so_hien_tai.vas} điểm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-center">
                      <span className="text-xs text-red-500 font-semibold block">Ban đầu</span>
                      <span className="text-2xl font-black text-red-600 font-heading">{medicalRecord.chi_so_ban_dau.vas}</span>
                      <span className="text-[10px] text-red-400 block mt-0.5">Đau nặng</span>
                    </div>
                    <div className="bg-green-50/50 border border-green-100 rounded-xl p-3 text-center">
                      <span className="text-xs text-green-500 font-semibold block">Hiện tại</span>
                      <span className="text-2xl font-black text-green-600 font-heading">{medicalRecord.chi_so_hien_tai.vas}</span>
                      <span className="text-[10px] text-green-400 block mt-0.5">Êm dịu</span>
                    </div>
                  </div>
                </div>

                {/* Range of Motion Metrics */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Biên độ vận động cổ (ROM)</span>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 text-xs">
                      <span className="font-bold text-secondary">Xoay cổ trái:</span>
                      <div className="text-right">
                        <span className="text-zinc-400 line-through mr-1.5">{medicalRecord.chi_so_ban_dau.rom_trai}</span>
                        <span className="text-primary font-bold">{medicalRecord.chi_so_hien_tai.rom_trai}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 text-xs">
                      <span className="font-bold text-secondary">Xoay cổ phải:</span>
                      <div className="text-right">
                        <span className="text-zinc-400 mr-1.5">{medicalRecord.chi_so_ban_dau.rom_phai}</span>
                        <span className="text-emerald-500 font-bold">{medicalRecord.chi_so_hien_tai.rom_phai}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 text-xs">
                      <span className="font-bold text-secondary">Cơ lực tay bả vai:</span>
                      <div className="text-right">
                        <span className="text-zinc-400 line-through mr-1.5">{medicalRecord.chi_so_ban_dau.co_luc}</span>
                        <span className="text-primary font-bold">{medicalRecord.chi_so_hien_tai.co_luc}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

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
                placeholder="Tìm buổi, KTV..." 
                className="bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-1.5 text-xs w-full focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div 
                key={index} 
                className="bg-zinc-50 rounded-2xl border border-zinc-150 transition-all hover:bg-white hover:shadow-md overflow-hidden"
              >
                <button
                  onClick={() => setSelectedSession(selectedSession === session.number ? null : session.number)}
                  className="w-full text-left p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-heading font-black text-sm flex items-center justify-center">
                      #{session.number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-secondary text-sm">Buổi trị liệu số {session.number}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          session.score <= 3 ? 'bg-green-100 text-green-700' : session.score <= 6 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          Đau: {session.score}/10
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {session.date}</span>
                        <span className="flex items-center gap-1"><User size={12} /> {session.ktv}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs font-bold text-primary group sm:ml-auto">
                    <span>{selectedSession === session.number ? 'Thu gọn' : 'Xem chi tiết'}</span>
                    <ChevronRight size={16} className={`transition-transform duration-200 ${selectedSession === session.number ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {/* Session expanded details */}
                {selectedSession === session.number && (
                  <div className="px-5 pb-5 pt-1 border-t border-zinc-150 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm pt-4">
                      <div className="md:col-span-2 space-y-3">
                        <span className="font-bold text-secondary text-xs uppercase tracking-wider text-gray-400 block">Ghi nhận của Kỹ thuật viên</span>
                        <p className="text-gray-600 bg-white p-3.5 rounded-xl border border-zinc-200 leading-relaxed text-xs">
                          {session.note}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <span className="font-bold text-secondary text-xs uppercase tracking-wider text-gray-400 block">Bài tập chỉ định tại chỗ</span>
                        <ul className="space-y-2">
                          {session.exercises.map((ex, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-secondary font-medium">
                              <span className="size-1.5 rounded-full bg-primary flex-shrink-0"></span>
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
