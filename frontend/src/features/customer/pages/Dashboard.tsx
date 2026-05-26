import { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Activity, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  FileText, 
  MapPin, 
  AlertCircle, 
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(7); // Default to current active session (8th session, 0-indexed is 7)

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
            
            {/* E-Ticket Card Layout */}
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 mb-5 relative">
              
              {/* Ticket side notches */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#E6F4F1] rounded-full border-r border-gray-100 z-10"></div>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#E6F4F1] rounded-full border-l border-gray-100 z-10"></div>

              <div className="flex justify-between items-center mb-4 border-b border-dashed border-gray-150 pb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian Khám</span>
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full animate-pulse">
                  14:00 Hôm nay
                </span>
              </div>
              
              <div className="flex items-center gap-3.5">
                <img 
                  src="https://i.pravatar.cc/150?img=15" 
                  alt="Technician" 
                  className="w-12 h-12 rounded-full border-2 border-primary/20 object-cover" 
                />
                <div>
                  <p className="font-bold text-secondary text-sm">KTV Minh Tú</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Trị liệu Cổ vai gáy</p>
                  <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-0.5">
                    <MapPin size={10} /> Phòng trị liệu VIP 1
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/settings')}
                className="bg-white hover:bg-gray-50 text-secondary font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl border border-gray-150 transition-all text-center"
              >
                Đổi lịch hẹn
              </button>
              
              <a 
                href="https://maps.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl text-center flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95"
              >
                <MapPin size={14} /> Chỉ đường
              </a>
            </div>

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
              { title: 'Bệnh án & Hồ sơ sức khỏe', path: '/profile', icon: <FileText size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
              { title: 'Bài tập giãn cơ tại nhà', path: '/exercises', icon: <Activity size={18} />, color: 'text-amber-500', bg: 'bg-amber-50' },
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
