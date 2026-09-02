import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, HeartPulse, Stethoscope, MapPin, Phone, Mail, Facebook, ArrowRight, Zap, CheckCircle2, Award, Sparkles } from 'lucide-react';
import LazyImage from '../components/LazyImage';
import ScrollReveal from '../components/effects/ScrollReveal';

const WHY_CHOOSE_US = [
  {
    icon: Stethoscope,
    tag: 'Chuyên môn cao',
    title: 'Lượng giá 1:1 cùng Chuyên viên PHCN',
    desc: 'Lượng giá biên độ khớp (ROM), cơ lực (MMT) và thang đau VAS chính xác trước khi lên kế hoạch trị liệu.'
  },
  {
    icon: Zap,
    tag: 'Công nghệ 2026',
    title: 'Công nghệ Y tế FDA Châu Âu',
    desc: 'Sóng xung kích Shockwave & Laser 30W giúp cắt cơn đau cấp tính và phục hồi tái tạo mô xơ.'
  },
  {
    icon: ShieldCheck,
    tag: 'An toàn 100%',
    title: 'Không phẫu thuật – Không dùng thuốc',
    desc: 'Phương pháp điều trị cơ học & vật lý trị liệu an toàn tuyệt đối, triệt tiêu tận gốc nguyên nhân.'
  },
  {
    icon: HeartPulse,
    tag: 'Chuẩn y khoa',
    title: 'Phác đồ cá nhân hóa 100%',
    desc: 'Thiết kế riêng theo tính chất công việc văn phòng, ngưỡng chịu đau và thể trạng của từng khách hàng.'
  }
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans overflow-hidden">
      <Helmet>
        <title>Về Chúng Tôi | Trung Tâm Trị Liệu Cột Sống Văn Phòng OfficeCare</title>
        <meta
          name="description"
          content="OfficeCare - Trung tâm phục hồi chức năng chuyên biệt giải cứu cột sống khỏi áp lực 8 tiếng làm việc mỗi ngày. Nơi trị liệu tay giải phóng điểm đau kết hợp cùng sóng trị liệu Châu Âu."
        />
      </Helmet>

      {/* Hero Banner Header - Harmonious Typography & Layout (Fixed Font Size & Spacing) */}
      <section className="relative pt-6 pb-10 lg:pt-8 lg:pb-12 bg-gradient-to-b from-teal-500/10 via-white to-slate-50/80 border-b border-slate-200/60 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-teal-400/10 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#2EC4B6]/10 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Clean Left-Aligned Narrative (Font Size Normalized to Match Site Standard) */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <ScrollReveal direction="left">
                <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 text-[#0D9488] font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                  <Sparkles size={13} className="text-[#0D9488]" />
                  <span>Trung tâm phục hồi chức năng chuyên biệt</span>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={100}>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-snug">
                  Giải Cứu Cột Sống Khỏi Áp Lực <br />
                  <span className="text-[#0D9488]">
                    "8 Tiếng Làm Việc Mỗi Ngày"
                  </span>
                </h1>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={150}>
                <div className="space-y-2.5 text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                  <p>
                    Tại các đô thị lớn, giới văn phòng công sở phải ngồi liên tục 8–10 tiếng mỗi ngày, gõ máy tính sai tư thế và ít vận động. Điều này tích lũy dần thành những cơn đau mỏi mạn tính tàn phá sức khỏe cột sống từ rất sớm.
                  </p>
                  <p className="font-medium text-slate-800 bg-teal-50/60 border-l-3 border-[#0D9488] p-3 rounded-r-xl text-xs sm:text-sm">
                    <strong>OfficeCare</strong> xây dựng một trung tâm phục hồi chức năng chuyên biệt, nơi kỹ thuật trị liệu tay giải phóng điểm đau kết hợp cùng sóng trị liệu Châu Âu giúp triệt tiêu triệt để nguyên nhân gây đau không dùng thuốc.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={200}>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    to="/booking"
                    className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0B7A70] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>Đặt lịch lượng giá 1:1</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/services"
                    className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    Khám phá các gói trị liệu
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: OfficeCare Center Lobby Visual Showcase */}
            <div className="lg:col-span-5">
              <ScrollReveal direction="right">
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 aspect-[4/3] bg-slate-900 group">
                  <LazyImage
                    src="/images/about/officecare_center_lobby.png"
                    alt="Sảnh trung tâm phục hồi chức năng OfficeCare"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    wrapperClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  
                  {/* Floating Glassmorphism Badge */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-white/60 shadow-md text-left">
                    <div className="flex items-center gap-1.5 text-[#0D9488] font-bold text-[11px] uppercase tracking-wider">
                      <Award size={14} />
                      <span>Trung Tâm Trị Liệu OfficeCare</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">Không gian y tế hiện đại, chuẩn hóa dịch vụ phục hồi cột sống văn phòng</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* Sứ mệnh & Định hướng Trung tâm (Fixed Spacing & Clean General Corporate Content) */}
      <section className="py-10 lg:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* Left Image Showcase */}
            <ScrollReveal direction="right">
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200/80 aspect-[4/3] bg-slate-100 group">
                <LazyImage
                  src="/images/about/officecare_therapy_session.png"
                  alt="Không gian trị liệu tại OfficeCare"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  wrapperClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-white/60 text-left">
                  <p className="text-[11px] font-bold text-[#0D9488]">Không gian trị liệu riêng tư</p>
                  <p className="text-[10px] text-slate-600 font-medium">Đem lại sự thoải mái và tập trung tối đa cho người bệnh</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Asymmetrical Content (General Corporate Content - No Complex Medical Details) */}
            <ScrollReveal direction="left" delay={100}>
              <div className="space-y-4 text-left">
                <span className="text-[10px] font-bold tracking-wider text-[#0D9488] bg-teal-50 border border-teal-200/60 px-3 py-1 rounded-full inline-block uppercase">
                  Ý nghĩa & Định hướng phát triển
                </span>
                
                <h2 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Vì Sao Trung Tâm OfficeCare Được Ra Đời?
                </h2>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                  Nhận thấy đại đa số dân văn phòng Việt Nam chỉ tạm thời chịu đựng cơn đau mỏi hoặc sử dụng các giải pháp giảm đau ngắn hạn, <strong>OfficeCare</strong> được ra đời với mục tiêu mang đến một môi trường chăm sóc sức khỏe cột sống toàn diện và chuẩn hóa.
                </p>

                {/* Clean General Highlights (No Overly Detailed Medical Steps) */}
                <div className="space-y-2.5 pt-1">
                  {[
                    'Môi trường y tế chuẩn hóa, thân thiện và riêng tư cho từng khách hàng',
                    'Đội ngũ chuyên viên tư vấn & kỹ thuật viên chuyên nghiệp, tận tâm đồng hành',
                    'Trang thiết bị trị liệu hiện đại nhập khẩu, hỗ trợ phục hồi tối ưu',
                    'Theo dõi lộ trình chăm sóc minh bạch trên hệ thống hồ sơ điện tử'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#0D9488] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm font-medium text-slate-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* Ưu thế vượt trội - Tại sao hơn 15.000 khách hàng tin chọn */}
      <section className="py-10 lg:py-12 bg-slate-50/70 dark:bg-slate-950/70 border-t border-slate-200/70 dark:border-slate-800/70 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-8 lg:mb-10 space-y-1.5">
              <span className="bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-teal-300 border border-teal-500/20 dark:border-teal-800/60 font-bold tracking-wider uppercase text-[11px] px-3.5 py-1 rounded-full inline-block shadow-2xs">
                Ưu thế vượt trội
              </span>
              <h2 className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 dark:text-white tracking-tight">
                Tại Sao Hơn 15.000 Khách Hàng Tin Chọn OfficeCare?
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_CHOOSE_US.map((item, idx) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={idx} delay={idx * 80}>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200/80 dark:border-zinc-800 hover:border-teal-500/40 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between text-left group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="size-11 rounded-xl bg-teal-500/10 group-hover:bg-[#0D9488] text-[#0D9488] group-hover:text-white flex items-center justify-center transition-colors duration-300">
                          <Icon size={20} />
                        </div>
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-zinc-700">
                          {item.tag}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-zinc-100 leading-snug">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cơ Sở Vật Chất & Trang Thiết Bị (Centered Header & Tightened Whitespace) */}
      <section className="py-10 md:py-12 bg-white border-t border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                Cơ sở vật chất &amp; Trang thiết bị
              </span>
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
                Không Gian Trị Liệu Đẳng Cấp &amp; Trang Thiết Bị Châu Âu
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                OfficeCare chú trọng đầu tư không gian phòng khám hiện đại, sạch sẽ và riêng tư, giúp mang lại sự yên tâm cho mọi khách hàng.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                src: '/images/about/officecare_center_lobby.png',
                title: 'Sảnh Lễ Tân & Tiếp Đón Đẳng Cấp',
                desc: 'Không gian sang trọng, thư thái giúp bệnh nhân giải tỏa căng thẳng ngay khi bước vào trung tâm.'
              },
              {
                src: '/images/about/officecare_facilities_equipment.png',
                title: 'Phòng Trị Liệu Công Nghệ Cao Châu Âu',
                desc: 'Trang bị máy sóng xung kích Shockwave, Laser cường độ cao và giường kéo giãn tự động.'
              },
              {
                src: '/images/about/officecare_therapy_session.png',
                title: 'Khu Trị Liệu Nắn Chỉnh 1:1 Riêng Tư',
                desc: 'Phòng điều trị riêng biệt, tạo sự thoải mái và tập trung tối đa cho kỹ thuật viên thao tác.'
              }
            ].map((facility, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="group rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs bg-slate-50 hover:shadow-md transition-all duration-300 text-left">
                  <div className="aspect-[16/9] overflow-hidden relative bg-slate-200">
                    <LazyImage
                      src={facility.src}
                      alt={facility.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h4 className="font-heading font-bold text-sm text-slate-900">{facility.title}</h4>
                    <p className="text-[11.5px] text-slate-600 leading-normal font-normal">{facility.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Google Map & Contact Details Card Overlay */}
      <section className="relative w-full h-[450px] bg-slate-100 border-t border-slate-200/80">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.2217631388835!2d106.70617309999999!3d10.7943265!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3919221763138883%3A0x123456789abcdef!2sVinhomes%20Golden%20River!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Map OfficeCare"
          className="absolute inset-0 z-0"
        ></iframe>

        {/* Contact Overlay Card */}
        <div className="absolute top-1/2 left-4 md:left-16 -translate-y-1/2 z-10 w-full max-w-sm px-4 md:px-0">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-slate-200/80 space-y-3.5 text-left">
            <div className="space-y-1">
              <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[9.5px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                📍 Vị trí trung tâm &amp; Liên hệ
              </span>
              <h3 className="font-heading font-bold text-base text-slate-900 pt-0.5">Phòng Khám OfficeCare</h3>
            </div>
            
            <div className="space-y-2 text-xs text-slate-600 font-normal leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin className="text-[#0D9488] shrink-0 mt-0.5" size={15} />
                <p className="font-medium text-slate-800">Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-[#0D9488] shrink-0" size={15} />
                <a href="tel:0398655332" className="hover:text-[#0D9488] font-bold text-slate-800 transition-colors">Hotline &amp; Zalo: 0398655332</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-[#0D9488] shrink-0" size={15} />
                <a href="mailto:officecareclinic2026@gmail.com" className="hover:text-[#0D9488] transition-colors">officecareclinic2026@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Facebook className="text-[#0D9488] shrink-0" size={15} />
                <a href="https://www.facebook.com/profile.php?id=61591064963268" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D9488] transition-colors">Fanpage Facebook OfficeCare</a>
              </div>

              {/* General Clinic Working Hours */}
              <div className="border-t border-slate-100 pt-2.5 mt-1 space-y-1 text-xs text-slate-600 font-medium">
                <p className="font-bold text-[#0D9488] text-[10px] uppercase tracking-wider">🕒 Lịch Làm Việc Phòng Khám</p>
                <div className="flex justify-between text-[11px]">
                  <span>Thứ 2 – Chủ Nhật:</span>
                  <span className="font-bold text-slate-900">08:00 – 20:00 (Hàng ngày)</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <Link
                to="/booking"
                className="w-full bg-[#0D9488] hover:bg-[#0B7A70] text-white text-center font-bold py-2.5 rounded-xl text-xs transition-all block shadow-xs active:scale-95"
              >
                Đặt Lịch Lượng Giá &amp; Tư Vấn Trị Liệu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
