import { MouseEvent } from 'react';
import { ArrowLeft, ShieldCheck, Zap, Stethoscope, Activity, Heart, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface AuthVisualPanelProps {
  onBack?: () => void;
  showBack?: boolean;
  backText?: string;
}

export default function AuthVisualPanel({
  onBack,
  showBack = true,
  backText = 'Trở về trang trước',
}: AuthVisualPanelProps) {
  // Parallax motion tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for parallax lag
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate normalized coordinates (-0.5 to 0.5) from center
    const x = (e.clientX - rect.left) / width - 0.5;
    const y = (e.clientY - rect.top) / height - 0.5;
    
    // Set motion values (max range of motion in pixels)
    mouseX.set(x * 30);
    mouseY.set(y * 30);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Timeline steps data
  const timelineSteps = [
    {
      icon: <Zap size={18} className="text-[#0D9488]" />,
      title: "Đánh giá chuyên sâu",
      desc: "Lượng giá cơ sinh học cột sống lập thể"
    },
    {
      icon: <Stethoscope size={18} className="text-[#0D9488]" />,
      title: "Phác đồ cá nhân hóa",
      desc: "Bác sĩ hội chẩn & tối ưu phác đồ"
    },
    {
      icon: <Activity size={18} className="text-[#0D9488]" />,
      title: "Trị liệu chuyên sâu",
      desc: "Công nghệ cao kết hợp trị liệu cơ sâu"
    },
    {
      icon: <Heart size={18} className="text-[#0D9488]" />,
      title: "Phục hồi vận động",
      desc: "Tái cấu trúc tư thế cơ xương khớp"
    },
    {
      icon: <Sparkles size={18} className="text-[#0D9488]" />,
      title: "Trở lại cuộc sống khỏe mạnh",
      desc: "Tự do vận động, chấm dứt cơn đau"
    }
  ];

  // Stat cards data
  const statCards = [
    { value: "95%", label: "Tỷ lệ cải thiện vận động", speedFactor: 0.8 },
    { value: "12.000+", label: "Ca trị liệu thành công", speedFactor: 1.2 },
    { value: "4.9★", label: "Đánh giá khách hàng", speedFactor: 0.6 },
    { value: "98%", label: "Hài lòng sau điều trị", speedFactor: 1.0 }
  ];

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:flex lg:w-[58%] h-full relative flex-col justify-between p-10 xl:p-12 z-10 select-none bg-white/40 backdrop-blur-xl border border-white/50 rounded-[32px] shadow-[0_24px_50px_-12px_rgba(15,23,42,0.15)] overflow-hidden transition-all duration-300"
    >
      {/* HUD Medical Grid overlay pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-80 z-0"></div>

      {/* Biophilic Teal glow overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#14B8A6]/8 rounded-full blur-[80px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#22C55E]/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      {/* Top Header Row */}
      <div className="flex justify-between items-center z-20">
        <div className="flex flex-col gap-2">
          {showBack && onBack && (
            <motion.button
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 font-bold transition-all focus:outline-none w-fit bg-white/80 hover:bg-white backdrop-blur-lg px-4 py-2.5 rounded-full border border-slate-200/60 shadow-sm group"
            >
              <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5 text-[#0D9488]" />
              <span>{backText}</span>
            </motion.button>
          )}
          
          <div className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-2.5 tracking-tight mt-2">
            <div className="size-5.5 rounded-full border-2 border-[#14B8A6] flex items-center justify-center relative bg-[#14B8A6]/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <div className="size-1.5 rounded-full bg-[#14B8A6] animate-ping absolute"></div>
              <div className="size-1.5 rounded-full bg-[#14B8A6]"></div>
            </div>
            <span className="font-black text-2xl font-jakarta">Office<span className="text-[#0D9488] font-light">Care</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0D9488] bg-white/80 backdrop-blur-lg px-4 py-2.5 rounded-2xl border border-slate-200/60 shadow-sm">
          <ShieldCheck size={14} className="text-[#0D9488]" />
          <span className="font-jakarta font-black">Hệ thống phục hồi y khoa cao cấp</span>
        </div>
      </div>

      {/* Main Content Area: Storytelling & Timeline */}
      <div className="grid grid-cols-12 gap-6 xl:gap-8 items-center z-20 my-auto w-full">
        {/* Left Side: Headline Glass Card - Pristine light luxury contrast */}
        <div className="col-span-12 xl:col-span-6 z-10">
          <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-[28px] p-6 xl:p-8 space-y-5 shadow-lg relative overflow-hidden group hover:border-[#14B8A6]/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#14B8A6]/5 to-transparent pointer-events-none"></div>
            
            <div className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest bg-[#14B8A6]/10 px-3.5 py-2 rounded-xl border border-[#14B8A6]/20 w-fit">
              Hành trình phục hồi cơ xương khớp
            </div>
            
            <h1 className="font-jakarta font-black text-3xl xl:text-[38px] text-slate-900 tracking-tight leading-[1.08]">
              Kiến tạo chuyển động.<br />
              <span className="bg-gradient-to-r from-[#0D9488] to-[#0f766e] bg-clip-text text-transparent">
                Khởi nguồn tự tin.
              </span>
            </h1>
            
            <p className="text-slate-600 text-xs font-semibold leading-relaxed max-w-sm font-jakarta">
              Nền tảng lượng giá y khoa hiện đại chuẩn 5 sao giúp dân văn phòng giải quyết đau thắt lưng, cổ vai gáy tận gốc rễ.
            </p>
          </div>
        </div>

        {/* Right Side: Recovery Timeline (Pristine light list) */}
        <div className="col-span-12 xl:col-span-6 border-t xl:border-t-0 xl:border-l border-slate-200/80 pt-6 xl:pt-2 xl:pl-8 space-y-5 relative z-10">
          {/* Glowing vertical line overlay */}
          <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#14B8A6] via-[#14B8A6]/20 to-transparent shadow-[0_0_8px_rgba(20,184,166,0.15)] hidden xl:block"></div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {timelineSteps.map((step, idx) => (
              <motion.div 
                key={idx}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="flex items-start gap-4 relative group cursor-default"
              >
                {/* Glowing step point */}
                <div className="absolute -left-[41px] top-1.5 size-5 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center z-10 transition-all duration-300 group-hover:border-[#14B8A6] group-hover:scale-110 shadow-sm hidden xl:flex">
                  <div className="size-1.5 rounded-full bg-slate-300 transition-colors group-hover:bg-[#14B8A6] group-hover:shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                </div>

                <div className="size-8.5 rounded-xl bg-white/80 border border-slate-200/50 flex items-center justify-center shrink-0 shadow-sm text-slate-500 group-hover:border-[#14B8A6]/30 group-hover:text-[#0D9488] transition-all duration-300">
                  {step.icon}
                </div>
                <div className="text-left space-y-0.5 pt-0.5">
                  <p className="font-jakarta font-extrabold text-xs text-slate-800 group-hover:text-[#0D9488] transition-colors">{step.title}</p>
                  <p className="font-jakarta text-[10px] text-slate-500 font-semibold">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Footer: Floating Insight Cards & Copyright */}
      <div className="space-y-6 xl:space-y-8 z-20">
        
        {/* Floating Insight Cards: Borderless text statistics with mouse parallax */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          {statCards.map((card, idx) => {
            // Apply distinct spring offset per card based on speedFactor
            const xOffset = useSpring(
              useMotionValue(0),
              { stiffness: 60, damping: 15 }
            );
            const yOffset = useSpring(
              useMotionValue(0),
              { stiffness: 60, damping: 15 }
            );

            // React to springX and springY changes
            springX.on("change", (val) => xOffset.set(val * card.speedFactor));
            springY.on("change", (val) => yOffset.set(val * card.speedFactor));

            return (
              <motion.div
                key={idx}
                style={{
                  x: xOffset,
                  y: yOffset
                }}
                whileHover={{ scale: 1.05 }}
                className="bg-transparent text-left space-y-1.5 cursor-pointer group select-none"
              >
                <span className="text-2.5xl xl:text-3.5xl font-jakarta font-black text-slate-900 group-hover:text-[#0D9488] transition-colors drop-shadow-sm">
                  {card.value}
                </span>
                <p className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest font-jakarta leading-tight">
                  {card.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200/50 pt-4">
          <span>© 2026 OfficeCare Inc. All rights reserved.</span>
          <span>Chuẩn y khoa y tế 5★</span>
        </div>
      </div>
    </div>
  );
}
