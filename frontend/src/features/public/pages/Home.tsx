import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Calendar, Clock, Sparkles } from 'lucide-react';
import LazyImage from '../../../components/LazyImage';

export default function Home() {
  return (
    <div className="font-body bg-background overflow-hidden">
      
      {/* Hero Section - Light Clinical Canvas with Floating High-End Card */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-b from-slate-50 via-teal-50/10 to-white">
        {/* Clean background with no watermark for maximum readability */}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          {/* Header above the card - clean and minimal */}
          <div className="mb-6 animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Hôm nay tại phòng khám của chúng tôi</p>
              <h2 className="text-slate-800 font-extrabold text-sm mt-0.5">Trải nghiệm dịch vụ chăm sóc sức khỏe 5 sao</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/20 px-3 py-1 rounded-full text-xs font-bold w-fit">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-[#2EC4B6] opacity-75"></span>
                <span className="relative inline-flex rounded-full size-1.5 bg-[#2EC4B6]"></span>
              </span>
              Hoạt động bình thường
            </div>
          </div>

          {/* Main Card - Glassmorphic Soft Clinical Theme */}
          <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-6 md:p-8 shadow-soft-ui border border-slate-100/80 animate-slide-up stagger-delay-1 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Side Content - Clinic Info */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-extrabold text-xs uppercase tracking-wider">
                  ⭐ Hệ thống trị liệu cơ xương khớp văn phòng
                </div>
                
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-secondary leading-[1.1] tracking-tight">
                  Trung Tâm Trị Liệu <br />
                  <span className="text-primary">Office Care Premium</span>
                </h1>

                <div className="flex items-start gap-2 text-slate-500 font-bold text-sm">
                  <span className="text-primary mt-0.5">📍</span>
                  <span>Khu đô thị Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </div>

                <p className="text-slate-500 text-sm md:text-base leading-relaxed font-semibold">
                  Không gian phục hồi chuyên sâu hiện đại và biệt lập. Nơi kết hợp hoàn hảo giữa công nghệ trị liệu cơ xương khớp tiên tiến nhất thế giới và phác đồ điều trị cá nhân hóa từ đội ngũ chuyên gia đầu ngành.
                </p>

                {/* Unified Booking Capsule Widget */}
                <div className="flex pt-5 border-t border-slate-100">
                  <div className="inline-flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 p-1.5 md:p-2 rounded-full shadow-sm max-w-lg w-full gap-4 transition-all duration-300">
                    <div className="pl-4 md:pl-5 pr-2 py-0.5 text-left">
                      <p className="text-[9px] text-[#2EC4B6] font-extrabold uppercase tracking-widest mb-0.5">Khám tầm soát ban đầu</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-base md:text-lg font-black text-secondary">Miễn phí 100%</span>
                      </div>
                    </div>
                    <Link to="/booking" className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold px-5 py-2.5 md:px-6 md:py-3 rounded-full text-xs md:text-sm transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0">
                      <Calendar size={15} />
                      Đặt lịch tư vấn chuyên sâu
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Side Image - Villa Clinic Photo */}
              <div className="lg:col-span-5 relative group">
                <div className="relative rounded-[24px] overflow-hidden aspect-[4/3] w-full shadow-md border border-slate-100">
                  <LazyImage 
                    src="/images/physio_clinic_villa.png" 
                    alt="Office Care Premium Clinic" 
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-105"
                    wrapperClassName="size-full"
                  />
                  {/* Subtle glass blur overlay on bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl text-white">
                    <p className="text-[10px] uppercase font-extrabold text-primary mb-0.5 tracking-wider">Không gian điều trị</p>
                    <h4 className="text-xs font-bold leading-snug">Phòng khám hiện đại & yên tĩnh mang lại sự thư giãn tuyệt đối</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar inside the Card (Light Theme clinical specs) */}
            <div className="mt-8 flex flex-col lg:flex-row gap-4 items-stretch">
              <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3 md:border-r md:border-slate-200 pr-2">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg shrink-0">🩺</div>
                  <div>
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Chuyên gia</h5>
                    <p className="text-xs font-black text-secondary">10+ Bác sĩ đầu ngành</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:border-r md:border-slate-200 pr-2">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg shrink-0">🏨</div>
                  <div>
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Không gian</h5>
                    <p className="text-xs font-black text-secondary">Trị liệu biệt lập VIP</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:border-r md:border-slate-200 pr-2">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg shrink-0">⚡</div>
                  <div>
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Công nghệ</h5>
                    <p className="text-xs font-black text-secondary">Nhập khẩu Đức & Mỹ</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg shrink-0">🏆</div>
                  <div>
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cam kết</h5>
                    <p className="text-xs font-black text-secondary">Hiệu quả sau 1 lộ trình</p>
                  </div>
                </div>
              </div>
              
              {/* Highlight Badge */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3 lg:w-64 shrink-0">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">🛡️</div>
                <div>
                  <h5 className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">Đạt chuẩn y tế</h5>
                  <p className="text-xs font-bold text-slate-400">Dịch vụ phục hồi 5 sao</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Staggered Asymmetric Layout */}
      <section id="services" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-bold tracking-wider uppercase text-xs mb-3">Dịch vụ cốt lõi</h2>
            <h3 className="font-heading text-3xl md:text-5xl font-extrabold text-secondary mb-4 leading-tight">Danh Mục Dịch Vụ Đạt Chuẩn Y Khoa</h3>
            <p className="text-slate-500 font-semibold text-base md:text-lg">Mỗi dịch vụ được thiết kế với thời lượng và kỹ thuật chuyên sâu để giải quyết tận gốc các nguyên nhân gây đau mỏi cơ xương khớp ở người làm việc văn phòng.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Side: Services List (Staggered layout) */}
            <div className="lg:col-span-7 space-y-6">
              {[
                {
                  title: "Khám Lượng Giá Ban Đầu",
                  time: "30 phút",
                  price: "Miễn phí",
                  desc: "Bác sĩ chuyên khoa tiến hành tầm soát cột sống, kiểm tra tư thế và định hướng phục hồi chức năng cơ xương khớp hoàn toàn miễn phí.",
                  icon: "🩺",
                  tag: "Khám & Tư vấn"
                },
                {
                  title: "Siêu Âm Trị Liệu",
                  time: "45 phút",
                  price: "250.000đ",
                  desc: "Sử dụng sóng siêu âm tần số cao tạo hiệu ứng nhiệt sâu và cơ học, kích thích tuần hoàn, giảm sưng viêm và tái cấu trúc các sợi collagen cơ khớp bị tổn thương.",
                  icon: "⚡",
                  tag: "Vật lý trị liệu"
                },
                {
                  title: "Điện Xung Trị Liệu",
                  time: "45 phút",
                  price: "200.000đ",
                  desc: "Các dòng điện xung êm dịu tác động lên cơ thắt và dây thần kinh, giúp ức chế dẫn truyền đau cấp tính, giải phóng chèn ép cơ cổ vai gáy hiệu quả.",
                  icon: "🩹",
                  tag: "Vật lý trị liệu"
                },
                {
                  title: "Tập Vận Động Thụ Động",
                  time: "60 phút",
                  price: "400.000đ",
                  desc: "Kỹ thuật viên chuyên nghiệp thực hiện kéo giãn cơ định hướng và di động khớp chuyên sâu, giải phóng các điểm co thắt cơ sâu cứng do ngồi sai tư thế lâu ngày.",
                  icon: "🏃‍♂️",
                  tag: "Phục hồi chức năng"
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-3xl p-6 shadow-soft-ui hover:shadow-soft-ui-hover transition-all duration-300 border border-slate-100 hover:border-slate-200/80 group flex flex-col md:flex-row gap-5 items-start"
                >
                  <div className="size-14 rounded-2xl bg-teal-50 text-primary flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300 border border-teal-100/50">
                    {item.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-extrabold text-lg text-secondary">{item.title}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full">{item.tag}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-primary font-black text-base">{item.price}</span>
                        {item.price !== "Miễn phí" && (
                          <span className="text-slate-400 text-xs font-bold">/buổi</span>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pt-1">
                      <span className="flex items-center gap-1"><Clock size={13} /> {item.time}</span>
                      <span className="text-primary/20">•</span>
                      <span className="text-primary">Đạt tiêu chuẩn y khoa</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side: Showcase clinical facility with asymmetry */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <div className="bg-white rounded-3xl overflow-hidden shadow-soft-ui border border-slate-100 p-4">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] w-full shadow-inner mb-6">
                  <LazyImage 
                    src="/images/physio_treatment_room.png" 
                    alt="Phòng trị liệu Office Care" 
                    className="size-full object-cover filter saturate-105"
                    wrapperClassName="size-full"
                  />
                  <div className="absolute top-4 left-4 bg-[#2EC4B6]/90 backdrop-blur-md text-white font-extrabold text-[10px] uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                    ✦ Phòng Điều Trị Cao Cấp
                  </div>
                </div>
                <div className="space-y-3 px-2 pb-2">
                  <h4 className="font-heading font-black text-xl text-secondary">Hạ Tầng Hiện Đại & Tiêu Chuẩn Vô Trùng</h4>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                    Hệ thống phòng trị liệu biệt lập tại Office Care được đảm bảo vô trùng 100%, trang bị đầy đủ máy móc hiện đại nhất nhập khẩu từ Đức và Thụy Sĩ nhằm đem đến trải nghiệm phục hồi hoàn hảo nhất cho khách hàng.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Đặt lịch ngay để nhận ưu đãi khám bác sĩ</span>
                    <Link to="/booking" className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold px-4 py-2 rounded-full text-xs transition-all flex items-center gap-1">
                      Đặt khám ngay <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Connected Light theme Pricing Cards */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-bold tracking-wider uppercase text-xs mb-3">Bảng giá & Lộ trình combo</h2>
            <h3 className="font-heading text-3xl md:text-5xl font-extrabold text-secondary mb-4">Đầu Tư Vào Sức Khỏe Lâu Dài</h3>
            <p className="text-slate-500 font-semibold text-base md:text-lg">Đăng ký liệu trình tiết kiệm hơn đến 25% so với dịch vụ linh động. Lộ trình rõ ràng, kết quả phục hồi bền vững.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Gói 1: Thể thao cấp tốc */}
            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-soft-ui transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Cơ bản</span>
                  <span className="text-xs text-primary font-bold">Tiết kiệm 15%</span>
                </div>
                <h4 className="font-heading font-black text-2xl text-secondary mb-2">Trị Liệu Thể Thao Cấp Tốc</h4>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">Giải tỏa căng cơ nhanh chóng</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-secondary">4.2tr</span>
                  <span className="text-slate-400 font-bold"> / 6 buổi</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" /> 2 buổi Siêu âm trị liệu sâu
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" /> 2 buổi Điện xung kích hoạt thần kinh cơ
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" /> 2 buổi Tập vận động với kỹ thuật viên
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" /> Đánh giá hiệu quả sau liệu trình
                  </li>
                </ul>
              </div>
              <Link to="/booking" className="block w-full text-center bg-white hover:bg-slate-100 text-secondary font-extrabold py-3.5 rounded-full transition-all border border-slate-200 text-sm shadow-sm">
                Đăng ký gói
              </Link>
            </div>

            {/* Gói 2: Phục hồi cột sống chuyên sâu (Highlight - Light green/teal accent) */}
            <div className="bg-[#F2FAF9] rounded-[32px] p-8 shadow-md border-2 border-[#2EC4B6] relative flex flex-col justify-between md:-translate-y-4 md:hover:-translate-y-5 transition-transform duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2EC4B6] text-white font-extrabold text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md flex items-center gap-1">
                <Sparkles size={11} /> Lựa chọn nhiều nhất
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-primary/20 text-[#25A89C] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Phổ biến</span>
                  <span className="text-xs text-primary font-bold">Phục hồi tận gốc</span>
                </div>
                <h4 className="font-heading font-black text-2xl text-secondary mb-2">Phục Hồi Cột Sống Chuyên Sâu</h4>
                <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-6">Trị dứt điểm thoát vị & thoái hóa</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-secondary">8.5tr</span>
                  <span className="text-slate-400 font-bold"> / 12 buổi</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-[#25A89C] shrink-0 mt-0.5" /> 6 buổi Khám lượng giá định hướng
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-[#25A89C] shrink-0 mt-0.5" /> 6 buổi Siêu âm trị liệu công nghệ cao
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-[#25A89C] shrink-0 mt-0.5" /> Phác đồ kéo giãn & di động khớp cột sống
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-[#25A89C] shrink-0 mt-0.5" /> Tặng bài tập phục hồi cột sống tại nhà
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-[#25A89C] shrink-0 mt-0.5" /> Tiết kiệm 20% so với mua lẻ
                  </li>
                </ul>
              </div>
              <Link to="/booking" className="block w-full text-center bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold py-3.5 rounded-full shadow-md transition-colors text-sm">
                Đăng ký gói
              </Link>
            </div>

            {/* Gói 3: Yoga phục hồi */}
            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-soft-ui transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Premium</span>
                  <span className="text-xs text-primary font-bold">Khỏe mạnh bền vững</span>
                </div>
                <h4 className="font-heading font-black text-2xl text-secondary mb-2">Liệu Trình Yoga Phục Hồi</h4>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">Trị liệu kết hợp vận động chuyên sâu</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-secondary">15.0tr</span>
                  <span className="text-slate-400 font-bold"> / 24 buổi</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" /> 12 buổi Khám lượng giá định kỳ
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" /> 12 buổi Điện xung trị liệu giảm co thắt cơ
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" /> Tập Yoga phục hồi 1-1 với huấn luyện viên
                  </li>
                  <li className="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-semibold">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" /> Tiết kiệm 25% so với mua lẻ
                  </li>
                </ul>
              </div>
              <Link to="/booking" className="block w-full text-center bg-white hover:bg-slate-100 text-secondary font-extrabold py-3.5 rounded-full transition-all border border-slate-200 text-sm shadow-sm">
                Đăng ký gói
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
