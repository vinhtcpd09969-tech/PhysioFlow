import { useAuthStore } from '../../../stores/authStore';
import { Calendar, Activity, Clock, Sparkles, ChevronRight, FileText } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-secondary mb-2">
          Chào buổi sáng, {user?.ho_ten?.split(' ').pop() || 'bạn'}.
        </h1>
        <p className="text-gray-500 text-base">Theo dõi hành trình phục hồi của bạn hôm nay.</p>
      </div>

      {/* Grid Layout (Theo ảnh mẫu 2 cột bất đối xứng) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mức độ đau Chart (Mockup) */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-heading font-bold text-xl text-secondary">Mức độ đau (VAS)</h2>
              <select className="bg-gray-50 border border-gray-200 text-sm rounded-full px-4 py-1.5 text-gray-600 outline-none focus:border-primary">
                <option>7 Ngày Qua</option>
                <option>1 Tháng Qua</option>
              </select>
            </div>
            
            {/* Mock Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2 md:gap-6 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full h-px border-b border-dashed border-gray-200"></div>
                <div className="w-full h-px border-b border-dashed border-gray-200"></div>
                <div className="w-full h-px border-b border-dashed border-gray-200"></div>
                <div className="w-full h-px border-b border-dashed border-gray-200"></div>
              </div>
              
              {/* Bars */}
              <div className="w-full bg-primary/20 rounded-t-lg h-[80%] z-10 transition-all hover:bg-primary hover:opacity-80 cursor-pointer relative group">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs py-1 px-2 rounded">T2: 8.0</div>
              </div>
              <div className="w-full bg-primary/30 rounded-t-lg h-[65%] z-10 transition-all hover:bg-primary cursor-pointer"></div>
              <div className="w-full bg-primary/40 rounded-t-lg h-[60%] z-10 transition-all hover:bg-primary cursor-pointer"></div>
              <div className="w-full bg-primary/60 rounded-t-lg h-[45%] z-10 transition-all hover:bg-primary cursor-pointer"></div>
              <div className="w-full bg-primary/80 rounded-t-lg h-[30%] z-10 transition-all hover:bg-primary cursor-pointer"></div>
              <div className="w-full bg-primary rounded-t-lg h-[25%] z-10 transition-all hover:bg-opacity-80 cursor-pointer"></div>
              <div className="w-full bg-primary rounded-t-lg h-[15%] z-10 transition-all hover:bg-opacity-80 cursor-pointer relative group">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs py-1 px-2 rounded">CN: 1.5</div>
              </div>
            </div>
            <div className="flex justify-between mt-4 text-xs font-semibold text-gray-400">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            </div>
          </div>

          {/* Hai thẻ nhỏ bên dưới biểu đồ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tiến độ gói */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <Activity size={20} className="text-primary" />
                  <h2 className="font-heading font-bold text-lg text-secondary">Tiến độ gói điều trị</h2>
                </div>
                <span className="text-sm font-semibold text-gray-500">8/10 buổi</span>
              </div>
              
              <div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                  <div className="bg-primary h-3 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Đã hoàn thành 80%</span>
                  <span className="text-primary font-bold">20% còn lại</span>
                </div>
              </div>
            </div>

            {/* Gợi ý từ AI */}
            <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-[24px] p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                  <Sparkles size={18} />
                </div>
                <h2 className="font-heading font-bold text-lg text-secondary flex items-center gap-2">
                  Gợi ý từ AI 
                  <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">✦ AI</span>
                </h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                "Vùng cổ của bạn đã cải thiện 30%. Tiếp tục duy trì các bài tập giãn cơ nhẹ nhàng và chườm ấm mỗi tối để đạt kết quả tốt nhất."
              </p>
            </div>

          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          
          {/* Lịch hẹn sắp tới */}
          <div className="bg-[#E6F4F1] rounded-[24px] p-6 border border-primary/10">
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={20} className="text-secondary" />
              <h2 className="font-heading font-bold text-lg text-secondary">Lịch hẹn sắp tới</h2>
            </div>
            
            <div className="bg-white rounded-[16px] p-4 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">THỜI GIAN</span>
                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">14:00 Hôm nay</span>
              </div>
              <div className="flex items-center gap-4">
                <img src="https://i.pravatar.cc/150?img=15" alt="Doctor" className="w-12 h-12 rounded-full border border-gray-200" />
                <div>
                  <p className="font-bold text-secondary text-sm">KTV Minh Tú</p>
                  <p className="text-xs text-gray-500">Trị liệu Cổ vai gáy</p>
                </div>
              </div>
            </div>
            
            <button className="w-full bg-white hover:bg-gray-50 text-secondary font-bold text-sm py-3 rounded-[12px] border border-gray-200 transition-colors">
              Quản lý lịch hẹn
            </button>
          </div>

          {/* Quick Actions / Links */}
          <div className="space-y-3">
            {[
              { title: 'Đặt lịch mới', icon: <Calendar size={18} />, color: 'text-primary', bg: 'bg-primary/10' },
              { title: 'Hồ sơ sức khỏe', icon: <FileText size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
              { title: 'Lịch sử điều trị', icon: <Clock size={18} />, color: 'text-gray-500', bg: 'bg-gray-100' }
            ].map((item, index) => (
              <button key={index} className="w-full bg-white flex items-center justify-between p-4 rounded-[16px] border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                    {item.icon}
                  </div>
                  <span className="font-bold text-secondary text-sm group-hover:text-primary transition-colors">{item.title}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
