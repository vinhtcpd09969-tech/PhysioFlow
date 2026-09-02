import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';

interface ConditionCategory {
  id: string;
  title: string;
  badge: string;
  countText: string;
  image: string;
  highlights: string[];
  description: string;
  checklist: string[];
}

const CONDITION_CATEGORIES: ConditionCategory[] = [
  {
    id: 'back-neck',
    title: 'Cột Sống & Cổ Vai Gáy',
    badge: 'Trọng tâm Văn phòng',
    countText: '+15 Bệnh lý cột sống',
    image: '/images/conditions/cotsong_covaigay.png',
    highlights: [
      'Đau cổ vai gáy mãn tính & Co thắt cơ thang',
      'Thoát vị đĩa đệm cột sống cổ & thắt lưng (L4-L5, S1)',
      'Đau thần kinh tọa & Tê lan xuống mông/chân'
    ],
    description: 'Bệnh lý chiếm hơn 70% ở nhân sự văn phòng do ngồi làm việc máy tính liên tục 8-10 tiếng/ngày, gây sai lệch đốt sống và chèn ép rễ thần kinh.',
    checklist: [
      'Đau thắt lưng cấp & mãn tính (Lumbago văn phòng)',
      'Hội chứng chèn ép rễ thần kinh cổ (Cervical Radiculopathy)',
      'Thoái hóa đốt sống cổ & thắt lưng ở tuổi trẻ',
      'Đau cơ liên sườn & Co thắt nhóm cơ lưng dẹt',
      'Cong vẹo cột sống do thói quen ngồi lệch (Scoliosis)',
      'Đau vùng xương chậu & Hội chứng cơ hình lê (Piriformis Syndrome)',
      'Đau đốt sống ngực & Tê thắt ngực do co thắt cơ',
      'Viêm khớp diện mấu cột sống (Facet Joint Syndrome)',
      'Hội chứng trượt đốt sống nhẹ (Spondylolisthesis)',
      'Căng thắt nhóm cơ dựng sống (Erector Spinae Strain)',
      'Đau xẹp đĩa đệm do thiếu vận động',
      'Đau rát bỏng vùng bả vai & Co thắt cơ nham',
      'Tê buốt vùng hông lan xuống đùi',
      'Rối loạn tầm vận động cúi / ngửa cột sống',
      'Căng dãn dây chằng liên gai sống'
    ]
  },
  {
    id: 'posture-ergonomics',
    title: 'Hội Chứng Tư Thế & Căng Thẳng',
    badge: 'Tối ưu Ergo',
    countText: '+12 Hội chứng tư thế',
    image: '/images/conditions/hoichung_tuthe.png',
    highlights: [
      'Hội chứng Cổ rùa (Forward Head Posture)',
      'Khòm lưng, vai tròn (Round Shoulders / Upper Cross)',
      'Đau đầu căng thắt & Đau nửa đầu do co cơ cổ'
    ],
    description: 'Hệ lụy trực tiếp từ thói quen cúi đầu xem điện thoại/laptop và áp lực công việc dài hạn, làm biến dạng đường cong sinh lý cột sống.',
    checklist: [
      'Đau đầu xuất phát từ vùng cổ (Cervicogenic Headache)',
      'Lệch trục vai & Mất cân bằng nhóm cơ ngực - lưng',
      'Căng cứng khớp thái dương hàm (TMJ) do siết răng/stress',
      'Căng cơ gáy gây hoa mắt, chóng mặt nhẹ khi đổi tư thế',
      'Giảm dung tích hô hấp do khòm lưng ép lồng ngực',
      'Rối loạn tư thế đứng / ngồi lệch trọng tâm',
      'Cổ ngắn cứng do căng cơ nâng vai (Levator Scapulae)',
      'Hội chứng xô lệch khung chậu (Pelvic Tilt)',
      'Căng tức vòm ngực do gập người làm việc lâu',
      'Đau căng nửa đầu dạng vạch kim chích (Occipital Neuralgia)',
      'Mệt mỏi mãn tính do sai tư thế hô hấp',
      'Căng cứng cơ bẫy cổ gáy làm cản trở tuần hoàn não'
    ]
  },
  {
    id: 'shoulder-wrist',
    title: 'Khớp Vai & Chi Trên Văn Phòng',
    badge: 'Gõ Phím & Chuột',
    countText: '+10 Bệnh lý chi trên',
    image: '/images/conditions/khopvai_chitren.png',
    highlights: [
      'Hội chứng Ống cổ tay (Carpal Tunnel Syndrome)',
      'Viêm lồi cầu khuỷu tay (Tennis & Golf Elbow)',
      'Viêm quanh khớp vai & Đông cứng khớp vai'
    ],
    description: 'Phát sinh do thao tác gõ bàn phím, dùng chuột máy tính liên tục và đặt góc tay làm việc không chuẩn y khoa trong thời gian dài.',
    checklist: [
      'Viêm bao gân De Quervain (Đau cổ tay ngón cái khi gõ phím)',
      'Tê bì 10 đầu ngón tay do chèn ép thần kinh giữa / trụ',
      'Hội chứng chèn ép khoang vai (Shoulder Impingement)',
      'Viêm gân cơ chóp xoay vai (Rotator Cuff Tendinitis)',
      'Đau mỏi khớp khuỷu & Căng thắt cơ cẳng tay',
      'Kẹt ngón tay bật (Trigger Finger)',
      'Mất lực nắm bàn tay do mỏi gân ngón',
      'Viêm gân cơ nhị đầu cánh tay',
      'Đau buốt mu bàn tay do dùng chuột liên tục',
      'Viêm sụn chêm cổ tay (TFCC Tear nhẹ)'
    ]
  },
  {
    id: 'lower-limb-sports',
    title: 'Chi Dưới & Chấn Thương Vận Động',
    badge: 'Thể Thao & Thể Lực',
    countText: '+14 Bệnh lý vận động',
    image: '/images/conditions/chiduoichanthuong.png',
    highlights: [
      'Đau thoái hóa khớp gối & Lệch bánh chè',
      'Viêm gân gót chân (Achilles) & Gai gót chân',
      'Căng cơ đùi / bắp chân & Bong gân cổ chân'
    ],
    description: 'Thường gặp ở nhân sự vừa làm văn phòng vừa tham gia chạy bộ, Pickleball, Gym, Cầu lông hoặc bị thoái hóa khớp sớm do ít vận động.',
    checklist: [
      'Viêm cân gan chân (Plantar Fasciitis - Đau nhói gót chân khi thức dậy)',
      'Đau khớp bánh chè - đùi (Runner’s Knee)',
      'Căng dãn nhẹ dây chằng khớp gối (ACL/PCL mild sprain)',
      'Viêm gân bánh chè (Jumper’s Knee)',
      'Đau cẳng chân khi chạy bộ (Shin Splints)',
      'Đau cứng cổ chân & Viêm bao hoạt dịch khớp gối',
      'Căng cơ đùi sau (Hamstring Strain) do vừa ngồi lâu vừa tập nặng',
      'Trật sơ gân khớp cổ chân',
      'Đau nhói khớp hông khi sút bóng / tập Gym',
      'Co rút cơ bắp chân (Chuột rút ban đêm)',
      'Viêm dải chậu chày (IT Band Syndrome)',
      'Viêm gân cơ thắt lưng chậu (Iliopsoas Tendinitis)',
      'Đau sụn chêm gối khi ngồi xổm',
      'Sưng nề nhẹ cổ chân sau trận đấu thể thao'
    ]
  }
];

export default function ConditionsTreated() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<ConditionCategory | null>(null);

  const handleOpenBooking = (categoryTitle?: string) => {
    setSelectedCategory(null);
    navigate('/booking', { state: { bookingType: categoryTitle || 'KhamLuongGia' } });
  };

  const handleGoServices = () => {
    setSelectedCategory(null);
    const element = document.getElementById('featured-services-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/services');
    }
  };

  return (
    <section className="py-12 lg:py-16 bg-[#F8FBFA] dark:bg-slate-950/80 relative overflow-hidden transition-colors border-b border-slate-200/60 dark:border-slate-800/60">
      {/* Background glowing decorations */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-12 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 dark:border-teal-800/80 text-teal-700 dark:text-teal-300 text-[11px] font-extrabold tracking-wider uppercase shadow-2xs">
            <Activity className="size-3.5 animate-pulse text-teal-600 dark:text-teal-400" />
            <span>Phân Loại Bệnh Lý Chuẩn Y Khoa</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight">
            Các Vấn Đề Cơ Xương Khớp &amp; Tư Thế Được <span className="text-[#0D9488]">OfficeCare</span> Điều Trị
          </h2>

          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mx-auto">
            Giải pháp Vật lý trị liệu chuyên sâu – Tối ưu hóa sức khỏe vận động &amp; chấm dứt cơn đau mạn tính cho dân văn phòng.
          </p>
        </div>

        {/* 4 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {CONDITION_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              {/* Card Header & Content */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 rounded-xl text-[10px] font-black uppercase tracking-wider">
                    {cat.badge}
                  </span>
                  <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {cat.countText}
                    <ChevronRight size={14} />
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                  {/* Category Medical Image */}
                  <div className="sm:col-span-2 relative h-40 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Highlights list */}
                  <div className="sm:col-span-3 space-y-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {cat.title}
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {cat.highlights.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <span className="size-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Prompt */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold group-hover:text-teal-600 dark:group-hover:text-teal-400">
                <span>Nhấp để xem danh sách triệu chứng chi tiết</span>
                <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED CHECKLIST MODAL POPOVER */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl shrink-0">
                  <Activity size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-md text-[10px] font-black uppercase tracking-wider">
                      {selectedCategory.badge}
                    </span>
                    <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                      {selectedCategory.countText}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                    {selectedCategory.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable Checklist) */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 text-xs font-medium text-teal-900 dark:text-teal-200 leading-relaxed flex items-start gap-2.5">
                <Sparkles size={16} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold block mb-0.5">Cam kết hiệu quả điều trị từ OFFICECARE:</strong>
                  {selectedCategory.description} Liệu trình Vật lý trị liệu Chuẩn Y Khoa giúp giải phóng chèn ép, phục hồi tầm vận động và chấm dứt cơn đau tận gốc không dùng thuốc.
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Danh sách triệu chứng &amp; bệnh lý hỗ trợ điều trị:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCategory.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors hover:border-teal-500/30"
                    >
                      <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Sticky CTA Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleGoServices}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer text-center"
              >
                Xem Gói Trị Liệu Liên Quan
              </button>

              <button
                type="button"
                onClick={() => handleOpenBooking(selectedCategory.title)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-lg shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Calendar size={15} />
                Đặt Lịch Lượng Giá &amp; Tư Vấn Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
