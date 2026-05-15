import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Calendar, Star, Shield, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="font-body">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden bg-background">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-bl-[100px] z-0"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Giải pháp Phục hồi Chức năng Chuyên sâu
              </div>
              <h1 className="font-heading text-5xl lg:text-6xl font-bold text-secondary leading-[1.1] mb-6">
                Chấm dứt cơn đau <br />
                <span className="text-primary relative inline-block">
                  Cổ Vai Gáy
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent/50" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="transparent" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-gray-500 mb-8 max-w-xl leading-relaxed">
                Được thiết kế đặc biệt dành cho dân văn phòng. Tạm biệt những cơn đau nhức do ngồi lâu sai tư thế, phục hồi sự linh hoạt và lấy lại năng lượng làm việc mỗi ngày.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/booking" className="inline-flex justify-center items-center gap-2 bg-primary hover:bg-[#25A89C] text-white font-bold py-4 px-8 rounded-[16px] shadow-lg shadow-primary/30 transition-all hover:-translate-y-1">
                  <Calendar size={20} />
                  Đặt lịch khám ngay
                </Link>
                <Link to="#services" className="inline-flex justify-center items-center gap-2 bg-white text-secondary font-bold py-4 px-8 rounded-[16px] border border-gray-200 hover:border-primary hover:text-primary transition-all shadow-sm">
                  Tìm hiểu dịch vụ
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  <img src="https://i.pravatar.cc/100?img=5" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  <img src="https://i.pravatar.cc/100?img=9" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    +2k
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-1">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <p className="text-sm font-semibold text-secondary">Hơn 2,000+ dân văn phòng tin tưởng</p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative">
              {/* Image Frame */}
              <div className="relative rounded-[32px] overflow-hidden shadow-2xl aspect-[4/5] sm:aspect-auto sm:h-[600px] w-full">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Therapy Session" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Badge 1 */}
              <div className="absolute top-10 -left-6 sm:-left-12 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-secondary">KTV Chuẩn Y Khoa</p>
                    <p className="text-xs text-gray-500">100% có chứng chỉ hành nghề</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge 2 */}
              <div className="absolute bottom-10 -right-6 sm:-right-8 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-secondary">Trị liệu cá nhân hóa</p>
                    <p className="text-xs text-gray-500">Phác đồ riêng biệt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section (Mock Data) */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Dịch vụ cốt lõi</h2>
            <h3 className="font-heading text-3xl md:text-4xl font-bold text-secondary mb-4">Giải Pháp Đặc Trị Cho Dân Văn Phòng</h3>
            <p className="text-gray-500 text-lg">Hệ thống dịch vụ được thiết kế chuyên biệt để giải quyết triệt để các tổn thương cơ xương khớp do đặc thù công việc bàn giấy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Trị Liệu Mỏi Vai Gáy Chuyên Sâu",
                desc: "Kỹ thuật kéo giãn và giải điểm chèn ép cơ (Trigger Point) kết hợp máy sóng xung kích, giúp dứt điểm cơn đau mỏi, nhức đầu do căng cơ vùng cổ vai gáy.",
                icon: "💆‍♂️",
                color: "bg-blue-50 text-blue-600"
              },
              {
                title: "Phục Hồi Thoát Vị Đĩa Đệm",
                desc: "Phương pháp nắn chỉnh cột sống không xâm lấn kết hợp bài tập Core Stabilization, giảm áp lực lên đĩa đệm, trị dứt điểm chứng tê bì chân tay.",
                icon: "🦴",
                color: "bg-primary/10 text-primary"
              },
              {
                title: "Điều Chỉnh Tư Thế (Posture Correction)",
                desc: "Lượng giá và phân tích tư thế bằng AI, đưa ra phác đồ thiết lập lại sự cân bằng cơ sinh học, chống gù lưng, rùa cổ (Forward Head Posture).",
                icon: "🧍",
                color: "bg-amber-50 text-amber-600"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-8 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 group">
                <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h4 className="font-heading font-bold text-xl text-secondary mb-3">{item.title}</h4>
                <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                  {item.desc}
                </p>
                <Link to="/booking" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                  Đặt lịch tư vấn <ArrowRight size={18} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Packages) */}
      <section id="pricing" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Bảng giá & Gói tập</h2>
            <h3 className="font-heading text-3xl md:text-4xl font-bold text-secondary mb-4">Đầu Tư Vào Sức Khỏe Lâu Dài</h3>
            <p className="text-gray-500 text-lg">Mua gói tiết kiệm hơn đến 25% so với dịch vụ lẻ. Lộ trình rõ ràng, kết quả bền vững.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Gói Cơ bản */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h4 className="font-heading font-bold text-2xl text-secondary mb-2">Gói Khởi Động</h4>
              <p className="text-gray-500 text-sm mb-6">Thích hợp để trải nghiệm dịch vụ</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-secondary">1.2tr</span>
                <span className="text-gray-500">/ 3 buổi</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Khám lượng giá ban đầu
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> 3 buổi Trị liệu cơ xương khớp
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Bài tập về nhà cơ bản
                </li>
              </ul>
              <Link to="/booking" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-secondary font-bold py-4 rounded-[16px] transition-colors">
                Đặt lịch tư vấn
              </Link>
            </div>

            {/* Gói Phổ biến */}
            <div className="bg-[#0F172A] rounded-[32px] p-8 border border-[#1E293B] shadow-2xl relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-accent text-white font-bold text-xs uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">
                Đề xuất nhiều nhất
              </div>
              <h4 className="font-heading font-bold text-2xl text-white mb-2">Gói Phục Hồi Tích Cực</h4>
              <p className="text-gray-400 text-sm mb-6">Chấm dứt cơn đau cấp tính</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">3.5tr</span>
                <span className="text-gray-400">/ 10 buổi</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Mọi quyền lợi của Gói Khởi Động
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Sử dụng máy sóng xung kích
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Phác đồ cá nhân hóa nâng cao
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Tiết kiệm 15% so với mua lẻ
                </li>
              </ul>
              <Link to="/booking" className="block w-full text-center bg-primary hover:bg-[#25A89C] text-white font-bold py-4 rounded-[16px] shadow-lg shadow-primary/20 transition-colors">
                Đặt lịch tư vấn
              </Link>
            </div>

            {/* Gói Premium */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h4 className="font-heading font-bold text-2xl text-secondary mb-2">Gói Duy Trì & Bảo Dưỡng</h4>
              <p className="text-gray-500 text-sm mb-6">Sức khỏe cột sống lâu dài</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-secondary">6.5tr</span>
                <span className="text-gray-500">/ 20 buổi</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Trị liệu không giới hạn vùng
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Tái khám và đo lường hàng tháng
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 size={20} className="text-primary shrink-0" /> Tiết kiệm 25% so với mua lẻ
                </li>
              </ul>
              <Link to="/booking" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-secondary font-bold py-4 rounded-[16px] transition-colors">
                Đặt lịch tư vấn
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
