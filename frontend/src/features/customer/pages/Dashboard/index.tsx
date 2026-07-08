import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  FileText, 
  MapPin, 
  AlertCircle, 
  ExternalLink,
  ArrowLeft,
  User,
  Stethoscope,
  Info
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(7); // Default to current active session (8th session, 0-indexed is 7)
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [loadingAppt, setLoadingAppt] = useState(true);
  const [hasActiveTreatments, setHasActiveTreatments] = useState(false);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const response = await api.get('/client/appointments');
        const list = response.data || [];
        
        // Kiểm tra xem khách có phác đồ trị liệu đang hoạt động/đã có buổi hoàn thành không
        const completedTreatments = list.filter((app: any) => 
          app.loai_lich === 'dieu_tri' && app.trang_thai === 'hoan_thanh'
        );
        setHasActiveTreatments(completedTreatments.length > 0);

        // Tìm lịch hẹn sắp tới chưa hoàn thành/hủy (bao gồm chưa xác nhận, chờ xác nhận, đã xác nhận)
        const activeAppts = list.filter((app: any) => 
          app.trang_thai === 'chua_xac_nhan' || app.trang_thai === 'cho_xac_nhan' || app.trang_thai === 'da_xac_nhan'
        );
        
        // Sắp xếp theo ngày bắt đầu gần nhất
        activeAppts.sort((a: any, b: any) => 
          new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime()
        );

        setUpcomingAppointment(activeAppts[0] || null);
      } catch (error) {
        console.error('Lỗi khi tải lịch hẹn sắp tới:', error);
      } finally {
        setLoadingAppt(false);
      }
    };
    fetchUpcoming();
  }, []);

  // Mock data for 10 treatment sessions timeline
  const treatmentSessions = [
    { num: 1, name: 'Khám lâm sàng', status: 'completed', date: '03/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Buổi khám lâm sàng & giải tỏa cơ thang nông bả vai.' },
    { num: 2, name: 'Trị liệu Shockwave', status: 'completed', date: '06/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Di động khớp và chạy xung kích giảm đau cục bộ.' },
    { num: 3, name: 'Điện xung trị liệu', status: 'completed', date: '09/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Kéo giãn thụ động và chiếu hồng ngoại nhiệt trị liệu.' },
    { num: 4, name: 'Giải mạc cơ sâu', status: 'completed', date: '12/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Shockwave 1.8 bar, kéo giãn sâu cơ nâng vai.' },
    { num: 5, name: 'Di động khớp cổ', status: 'completed', date: '16/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Giải phóng mạc cơ cổ, bài tập gập cổ sâu phục hồi.' },
    { num: 6, name: 'Tăng biên độ ROM', status: 'completed', date: '19/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Biên độ khớp xoay trái cải thiện 10 độ rõ rệt.' },
    { num: 7, name: 'Giải ép rễ thần kinh', status: 'completed', date: '22/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Bài tập thụt cằm đôi giải ép, tay trái hết tê hoàn toàn.' },
    { num: 8, name: 'Điện xung & Bài tập lực', status: 'active', date: '25/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Hôm nay: Sóng xung kích cường độ cao + bài tập lực dây kháng lực.' },
    { num: 9, name: 'Củng cố cơ bả vai', status: 'pending', date: '28/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Chưa diễn ra: Bài tập gia tăng sức chịu đựng cơ đai vai.' },
    { num: 10, name: 'Đánh giá phục hồi', status: 'pending', date: '31/05/2026', ktv: 'KTV Trúc Ly Đặng', summary: 'Chưa diễn ra: Buổi khám cuối liệu trình để đo đạc chỉ số ROM cuối.' }
  ];

  // Mock VAS paint levels for chart
  const painLogs = [
    { day: 'T2', vas: 8.0, rom: '45°', active: false },
    { day: 'T3', vas: 6.5, rom: '48°', active: false },
    { day: 'T4', vas: 6.0, rom: '52°', active: false },
    { day: 'T5', vas: 4.5, rom: '58°', active: false },
    { day: 'T6', vas: 3.0, rom: '62°', active: false },
    { day: 'T7', vas: 2.5, rom: '65°', active: false },
    { day: 'CN', vas: 1.5, rom: '68°', active: true }
  ];

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Chào buổi sáng';
    if (hr < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Mobile Top Navigation & Back Button */}
      <div className="flex justify-between items-center bg-white p-4 rounded-[20px] border border-gray-100 shadow-xs lg:hidden">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1.5 text-zinc-400 hover:text-primary transition-all text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Quay lại Trang chủ
        </button>
        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase">
          Khách hàng
        </span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-black text-secondary tracking-tight">
            {getGreeting()}, <span className="text-primary">{user?.ho_ten?.split(' ').pop() || 'bạn'}</span>.
          </h1>
          <p className="text-gray-500 text-sm mt-1">Hành trình phục hồi của bạn đang diễn ra rất xuất sắc. Hãy tiếp tục duy trì!</p>
        </div>

        {/* Desktop inline back to home */}
        <button 
          onClick={() => navigate('/')}
          className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-150 hover:bg-zinc-100 hover:border-zinc-200 text-xs font-bold transition-all text-zinc-600 active:scale-95"
        >
          <ExternalLink size={14} /> Quay lại Landing Page
        </button>
      </div>

      {/* Main Grid Layout (Asymmetry 70/30) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {hasActiveTreatments ? (
            <>
              {/* Treatment session Checklist Map (Hành trình 10 buổi) */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-heading font-black text-lg text-secondary">Hành trình Trị liệu 10 Buổi</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Click vào các chấm tròn để xem nội dung từng buổi tập</p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                    Tiến độ: Buổi 8/10
                  </span>
                </div>

                {/* Timeline Row dots */}
                <div className="relative py-4 flex items-center justify-between gap-1 select-none overflow-x-auto scrollbar-none">
                  
                  {/* Central horizontal timeline bar line */}
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-500" 
                      style={{ width: '77%' }}
                    ></div>
                  </div>

                  {/* Dots */}
                  {treatmentSessions.map((session, idx) => (
                    <button
                      key={session.num}
                      onClick={() => setSelectedSessionIndex(idx)}
                      className="relative flex flex-col items-center justify-center min-w-[42px] z-10 focus:outline-none outline-none group"
                    >
                      <div 
                        className={`size-10 rounded-full flex items-center justify-center font-heading font-extrabold text-sm border-2 transition-all duration-300 ${
                          session.status === 'completed'
                            ? 'bg-primary border-primary text-white scale-95 shadow-sm'
                            : session.status === 'active'
                            ? 'bg-white border-primary text-primary scale-110 shadow-md ring-4 ring-primary/20'
                            : 'bg-white border-gray-200 text-gray-400 scale-90 group-hover:border-gray-300'
                        } ${selectedSessionIndex === idx ? 'ring-2 ring-offset-2 ring-primary border-primary' : ''}`}
                      >
                        {session.num}
                      </div>
                      
                      {/* Subtle pulsing glow for active session */}
                      {session.status === 'active' && (
                        <span className="absolute -top-1.5 right-1.5 size-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Detailed Card for Selected session */}
                <div className="mt-5 bg-zinc-50 border border-zinc-150 rounded-2xl p-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Buổi {treatmentSessions[selectedSessionIndex].num}
                      </span>
                      <h3 className="font-heading font-black text-secondary text-sm">
                        {treatmentSessions[selectedSessionIndex].name}
                      </h3>
                    </div>
                    
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-3">
                      <span>Ngày: {treatmentSessions[selectedSessionIndex].date}</span>
                      <span>KTV: {treatmentSessions[selectedSessionIndex].ktv}</span>
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    {treatmentSessions[selectedSessionIndex].summary}
                  </p>
                </div>
              </div>

              {/* Pain VAS & ROM charts comparison widget */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h2 className="font-heading font-black text-lg text-secondary">Giám sát Lâm sàng (VAS & ROM)</h2>
                    <p className="text-xs text-gray-400 mt-0.5">So sánh Mức độ đau đớn (VAS) và Tầm vận động nghiêng xoay cổ (ROM)</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-primary font-extrabold">
                      <span className="size-2 rounded-full bg-primary"></span> Mức độ đau
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-amber-500 font-extrabold ml-3">
                      <span className="size-2 rounded-full bg-accent"></span> Biên độ khớp
                    </span>
                  </div>
                </div>

                {/* Custom Interactive Pain bar chart */}
                <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 relative pt-6 border-b border-gray-100">
                  
                  {/* Horizontal dash grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                    <div className="w-full h-px border-b border-dashed border-gray-100"></div>
                    <div className="w-full h-px border-b border-dashed border-gray-100"></div>
                    <div className="w-full h-px border-b border-dashed border-gray-100"></div>
                    <div className="w-full h-px border-b border-dashed border-gray-100"></div>
                  </div>

                  {painLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className="flex-1 flex flex-col justify-end items-center h-full group z-10"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-36 bg-secondary text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-md transition-all duration-200 pointer-events-none flex flex-col items-center gap-0.5">
                        <span>Đau VAS: {log.vas}/10</span>
                        <span className="text-accent font-black">Biên độ ROM: {log.rom}</span>
                      </div>

                      {/* Dual stack values */}
                      <div className="w-full flex justify-center items-end gap-1.5 h-full pb-2">
                        {/* Pain bar (Teal) */}
                        <div 
                          className={`w-4 bg-primary/20 rounded-t-lg group-hover:bg-primary transition-all duration-300 ${
                            log.active ? 'bg-primary scale-105 shadow-sm' : ''
                          }`}
                          style={{ height: `${(log.vas / 10) * 100}%` }}
                        ></div>
                        
                        {/* ROM bar (Amber/Accent) */}
                        <div 
                          className="w-4 bg-accent/20 rounded-t-lg group-hover:bg-accent transition-all duration-300"
                          style={{ height: `${(parseInt(log.rom) / 90) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Labels beneath chart */}
                <div className="flex justify-between mt-3 px-1 text-xs font-extrabold text-gray-400">
                  {painLogs.map((log, i) => (
                    <span key={i} className={log.active ? 'text-secondary font-black scale-105' : ''}>{log.day}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Clinical welcome guide panel */}
              <div className="bg-white border border-gray-150 p-6 sm:p-8 rounded-[24px] text-zinc-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex justify-between items-center border-b border-gray-150 pb-4 mb-6">
                  <h3 className="text-sm font-heading font-black text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope size={18} className="text-primary" />
                    Quy Trình Lượng Giá Lâm Sàng 5 Bước
                  </h3>
                  <span className="text-[9px] text-zinc-400 font-mono tracking-wider">CLINICAL_PROTOCOL_HUD</span>
                </div>

                <div className="relative border-l border-gray-200 ml-3 pl-6 space-y-6 text-xs text-gray-500">
                  <div className="relative">
                    <div className="absolute -left-[29px] top-0 size-2.5 bg-primary rounded-full ring-4 ring-primary/10"></div>
                    <h4 className="font-extrabold text-secondary">Bước 1: Tiếp nhận triệu chứng y khoa</h4>
                    <p className="mt-1 leading-relaxed text-[11px]">Khai thác lịch sử đau nhức, thói quen sinh hoạt và mức độ nhức mỏi bả vai/cột sống.</p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-[29px] top-0 size-2.5 bg-zinc-300 rounded-full"></div>
                    <h4 className="font-extrabold text-secondary">Bước 2: Lượng giá tầm vận động (ROM)</h4>
                    <p className="mt-1 leading-relaxed text-[11px]">Sử dụng thiết bị chuyên dụng đo độ linh hoạt khớp cổ, vai gáy và mức độ căng cứng cơ lực.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[29px] top-0 size-2.5 bg-zinc-300 rounded-full"></div>
                    <h4 className="font-extrabold text-secondary">Bước 3: Chẩn đoán hình ảnh lâm sàng</h4>
                    <p className="mt-1 leading-relaxed text-[11px]">Đọc và đối chiếu kết quả phim chụp X-Quang/MRI cũ để xác định vị trí thực thể tổn thương.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[29px] top-0 size-2.5 bg-zinc-300 rounded-full"></div>
                    <h4 className="font-extrabold text-secondary">Bước 4: Hội chẩn chuyên khoa cùng Bác sĩ</h4>
                    <p className="mt-1 leading-relaxed text-[11px]">Bác sĩ trực tiếp khám lâm sàng, giải thích nguyên nhân gốc rễ và đưa ra chẩn đoán chính xác.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[29px] top-0 size-2.5 bg-zinc-300 rounded-full"></div>
                    <h4 className="font-extrabold text-secondary">Bước 5: Thiết lập phác đồ cá nhân hóa</h4>
                    <p className="mt-1 leading-relaxed text-[11px]">Lên kế hoạch trị liệu, số lượng buổi tập, bài tập phục hồi chức năng chuyên sâu phù hợp.</p>
                  </div>
                </div>
              </div>

              {/* Patient details HUD Passport */}
              <div className="bg-white border border-gray-150 p-6 rounded-[24px] text-zinc-800 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={15} className="text-primary" />
                    Hồ Sơ Y Khoa Của Bạn // MEDICAL_PASSPORT
                  </h3>
                  <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Thành viên
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-zinc-50 p-3.5 border border-zinc-150 rounded-xl">
                    <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Mã bệnh nhân</span>
                    <span className="text-secondary font-extrabold">{user?.id ? `BN-${user.id.substring(0, 8).toUpperCase()}` : 'N/A'}</span>
                  </div>
                  
                  <div className="bg-zinc-50 p-3.5 border border-zinc-150 rounded-xl">
                    <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Họ và tên</span>
                    <span className="text-secondary font-extrabold">{user?.ho_ten || 'N/A'}</span>
                  </div>

                  <div className="bg-zinc-50 p-3.5 border border-zinc-150 rounded-xl">
                    <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Email liên hệ</span>
                    <span className="text-secondary font-extrabold text-[11px] truncate block">{user?.email || 'N/A'}</span>
                  </div>

                  <div className="bg-zinc-50 p-3.5 border border-zinc-150 rounded-xl">
                    <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Trạng thái hệ thống</span>
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE_MONITOR
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-primary/5 p-4 border border-primary/10 rounded-2xl text-xs text-gray-600 leading-relaxed font-semibold">
                  <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>
                    Hồ sơ bệnh án và nhật ký đo VAS/ROM sẽ tự động được kích hoạt và cập nhật trực tiếp tại đây ngay sau khi bạn kết thúc buổi khám lượng giá ban đầu cùng Bác sĩ.
                  </p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Right Column (Widget Sidebar) */}
        <div className="space-y-6">
          
          {/* Lịch hẹn Vé khám điện tử */}
          <div className="bg-[#E6F4F1] rounded-[24px] p-6 border border-primary/10 relative overflow-hidden group">
            
            {/* Design accents */}
            <div className="absolute -top-12 -right-12 size-32 bg-primary/5 rounded-full pointer-events-none group-hover:scale-110 transition-transform"></div>
            
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={20} className="text-secondary" />
              <h2 className="font-heading font-black text-lg text-secondary">Lịch hẹn Sắp tới</h2>
            </div>
            
            {loadingAppt ? (
              <div className="bg-white rounded-[20px] p-8 text-center border border-gray-100 mb-5">
                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Đang tải lịch hẹn...</p>
              </div>
            ) : upcomingAppointment ? (
              <>
                {/* E-Ticket Card Layout */}
                <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 mb-5 relative">
                  
                  {/* Ticket side notches */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#E6F4F1] rounded-full border-r border-gray-100 z-10"></div>
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#E6F4F1] rounded-full border-l border-gray-100 z-10"></div>

                  <div className="flex justify-between items-center mb-4 border-b border-dashed border-gray-150 pb-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian Khám</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      upcomingAppointment.trang_thai === 'chua_xac_nhan'
                        ? 'text-rose-600 bg-rose-50 border border-rose-200 animate-pulse font-extrabold'
                        : upcomingAppointment.trang_thai === 'cho_xac_nhan'
                        ? 'text-amber-600 bg-amber-50 border border-amber-200' 
                        : 'text-emerald-600 bg-emerald-50 border border-emerald-250'
                    }`}>
                      {upcomingAppointment.trang_thai === 'chua_xac_nhan' ? 'Chờ OTP' : upcomingAppointment.trang_thai === 'cho_xac_nhan' ? 'Chờ duyệt' : 'Đã duyệt'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-secondary text-sm">
                          {new Date(upcomingAppointment.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                          {new Date(upcomingAppointment.ngay_gio_bat_dau).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                      <p className="font-semibold text-gray-500">
                        Dịch vụ: <span className="text-secondary font-bold">{upcomingAppointment.ten_dich_vu || 'Khám Lâm sàng & Lượng giá'}</span>
                      </p>
                      <p className="font-semibold text-gray-500">
                        Chuyên viên: <span className={upcomingAppointment.ten_ky_thuat_vien ? "text-secondary font-bold" : "text-amber-500 font-bold italic"}>
                          {upcomingAppointment.ten_ky_thuat_vien || 'Chờ phân công'}
                        </span>
                      </p>
                      <p className="font-semibold text-zinc-400 flex items-center gap-1">
                        <MapPin size={12} className="text-primary" /> 
                        {upcomingAppointment.ten_phong || 'Phòng khám lâm sàng (Chờ xếp)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => navigate(`/booking/success/${upcomingAppointment.id}`)}
                    className={`font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl border transition-all text-center ${
                      upcomingAppointment.trang_thai === 'chua_xac_nhan'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 animate-pulse'
                        : 'bg-white hover:bg-gray-50 text-secondary border-gray-150'
                    }`}
                  >
                    {upcomingAppointment.trang_thai === 'chua_xac_nhan' ? 'Xác thực OTP' : 'Xem Chi Tiết'}
                  </button>
                  
                  <button 
                    onClick={() => navigate('/appointments')}
                    className="bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl text-center shadow-xs transition-all active:scale-95"
                  >
                    Quản Lý
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-[20px] p-6 text-center border border-gray-100 shadow-xs space-y-4">
                <div className="size-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                  <Calendar size={24} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-secondary text-sm">Chưa có lịch hẹn</p>
                  <p className="text-[10px] text-gray-400 font-semibold max-w-xs mx-auto leading-relaxed">
                    Bạn hiện chưa đăng ký buổi lượng giá lâm sàng nào. Đăng ký ngay để bác sĩ khám miễn phí nhé!
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/booking')}
                  className="w-full bg-primary hover:opacity-95 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Đặt lịch ngay
                </button>
              </div>
            )}

          </div>

          {/* AI Recovery Companion Widget */}
          <div className="bg-gradient-to-br from-[#0B1222] to-[#1E293B] rounded-[24px] p-6 shadow-sm text-white relative overflow-hidden group">
            
            {/* Glowing particle glow background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-2.5 mb-4">
              {/* Pulsing glow AI Avatar */}
              <div className="relative size-7 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-white animate-pulse" />
                <span className="absolute -inset-1.5 bg-primary/25 rounded-xl -z-10 animate-ping"></span>
              </div>
              
              <h3 className="font-heading font-black text-sm text-white flex items-center gap-2">
                Trợ lý AI Care
                <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-full uppercase font-bold tracking-widest">Active</span>
              </h3>
            </div>

            <p className="text-zinc-300 text-xs leading-relaxed font-medium">
              "Chào Phan, cơ lực bả vai trái của bạn hôm nay cải thiện rất rõ rệt. Đừng quên thực hiện 3 bài tập kéo giãn cơ thang sau lúc nghỉ trưa nhé."
            </p>

            <div className="mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-400 font-bold flex items-center gap-1.5">
              <AlertCircle size={12} className="text-primary" /> Bác sĩ chỉ định an toàn
            </div>
          </div>

          {/* Satellite Phím tắt nhanh */}
          <div className="space-y-3">
            {[
              { title: 'Đặt lịch trị liệu mới', path: '/booking', icon: <Calendar size={18} />, color: 'text-primary', bg: 'bg-primary/10' },
              { title: 'Hồ sơ điều trị & sức khỏe', path: '/profile', icon: <FileText size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
              { title: 'Gói dịch vụ & Hóa đơn', path: '/packages', icon: <Clock size={18} />, color: 'text-zinc-500', bg: 'bg-zinc-100' }
            ].map((item, index) => (
              <button 
                key={index} 
                onClick={() => navigate(item.path)}
                className="w-full bg-white flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <span className="font-extrabold text-secondary text-xs uppercase tracking-wider group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
