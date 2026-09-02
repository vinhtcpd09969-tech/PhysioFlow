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
      desc: "Hội chẩn & tối ưu phác đồ điều trị"
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
    <motion.div 
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:flex lg:w-[58%] h-full relative flex-col justify-between p-8 xl:p-10 z-10 select-none bg-white/40 backdrop-blur-xl border border-white/50 rounded-[32px] shadow-[0_24px_50px_-12px_rgba(15,23,42,0.15)] overflow-hidden transition-all duration-300"
    >
      {/* HUD Medical Grid overlay pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-80 z-0"></div>

      {/* Biophilic Teal glow overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#14B8A6]/8 rounded-full blur-[80px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#22C55E]/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      {/* Top Header Row (Shrink 0) */}
      <div className="flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          {showBack && onBack && (
            <motion.button
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#0D9488] bg-white/90 hover:bg-white backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs transition-all duration-200 cursor-pointer group"
            >
              <ArrowLeft size={14} className="text-[#0D9488] transition-transform group-hover:-translate-x-1" />
              <span className="font-jakarta">{backText}</span>
            </motion.button>
          )}
          
          <div className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-2 tracking-tight">
            <div className="size-5 rounded-full border-2 border-[#14B8A6] flex items-center justify-center relative bg-[#14B8A6]/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <div className="size-1.5 rounded-full bg-[#14B8A6] animate-ping absolute"></div>
              <div className="size-1.5 rounded-full bg-[#14B8A6]"></div>
            </div>
            <span className="font-black text-xl xl:text-2xl font-jakarta">Office<span className="text-[#0D9488] font-light">Care</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0D9488] bg-white/80 backdrop-blur-lg px-3.5 py-2 rounded-2xl border border-slate-200/60 shadow-xs">
          <ShieldCheck size={14} className="text-[#0D9488]" />
          <span className="font-jakarta font-black">Hệ thống phục hồi y khoa cao cấp</span>
        </div>
      </div>

      {/* Main Content Area: Storytelling & Timeline (Fills space gracefully) */}
      <div className="grid grid-cols-12 gap-6 xl:gap-8 items-center z-20 flex-1 py-4 my-auto w-full">
        {/* Left Side: Headline Glass Card */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-12 xl:col-span-6 z-10"
        >
          <div className="bg-white/85 backdrop-blur-md border border-white/80 rounded-[28px] p-6 xl:p-7 space-y-4 shadow-md relative overflow-hidden group hover:border-[#14B8A6]/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#14B8A6]/5 to-transparent pointer-events-none"></div>
            
            <div className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest bg-[#14B8A6]/10 px-3.5 py-1.5 rounded-lg border border-[#14B8A6]/20 w-fit">
              Hành trình phục hồi cơ xương khớp
            </div>
            
            <h1 className="font-jakarta font-black text-2xl xl:text-3xl text-slate-900 tracking-tight leading-[1.12]">
              Kiến tạo chuyển động.<br />
              <span className="bg-gradient-to-r from-[#0D9488] to-[#0f766e] bg-clip-text text-transparent">
                Khởi nguồn tự tin.
              </span>
            </h1>
            
            <p className="text-slate-600 text-xs font-semibold leading-relaxed font-jakarta">
              Nền tảng lượng giá y khoa hiện đại chuẩn 5 sao giúp dân văn phòng giải quyết đau thắt lưng, cổ vai gáy tận gốc rễ.
            </p>

            {/* Feature highlights chips */}
            <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-100/80">
              <span className="text-[10px] font-black text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60">
                ✨ Lượng giá sinh học lập thể
              </span>
              <span className="text-[10px] font-black text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60">
                🩺 Hội chẩn &amp; Tối ưu phác đồ
              </span>
              <span className="text-[10px] font-black text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60">
                💆 Trị liệu cơ sâu &amp; Vận động
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Recovery Timeline */}
        <div className="col-span-12 xl:col-span-6 border-t xl:border-t-0 xl:border-l border-slate-200/80 pt-4 xl:pt-1 xl:pl-6 space-y-4 relative z-10">
          {/* Glowing vertical line overlay */}
          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#14B8A6] via-[#14B8A6]/20 to-transparent shadow-[0_0_8px_rgba(20,184,166,0.15)] hidden xl:block"></div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            className="space-y-3.5"
          >
            {timelineSteps.map((step, idx) => (
              <motion.div 
                key={idx}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
                transition={{ duration: 0.35, delay: 0.4 + idx * 0.05 }}
                className="flex items-start gap-3.5 relative group cursor-default p-1.5 rounded-xl hover:bg-white/40 transition-all"
              >
                {/* Glowing step point */}
                <div className="absolute -left-[31px] top-3 size-4.5 rounded-full border-2 border-white bg-slate-50 items-center justify-center z-10 transition-all duration-300 group-hover:border-[#14B8A6] group-hover:scale-110 shadow-xs hidden xl:inline-flex">
                  <div className="size-1.5 rounded-full bg-slate-300 transition-colors group-hover:bg-[#14B8A6] group-hover:shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                </div>

                <div className="size-8 rounded-xl bg-white/90 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs text-slate-500 group-hover:border-[#14B8A6]/40 group-hover:text-[#0D9488] transition-all duration-300">
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

      {/* Bottom Footer: Floating Insight Cards & Copyright (Shrink 0) */}
      <div className="space-y-4 xl:space-y-5 z-20 shrink-0 border-t border-slate-200/60 pt-4">
        
        {/* Floating Insight Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-3 w-full"
        >
          {statCards.map((card, idx) => {
            const xOffset = useSpring(
              useMotionValue(0),
              { stiffness: 60, damping: 15 }
            );
            const yOffset = useSpring(
              useMotionValue(0),
              { stiffness: 60, damping: 15 }
            );

            springX.on("change", (val) => xOffset.set(val * card.speedFactor));
            springY.on("change", (val) => yOffset.set(val * card.speedFactor));

            return (
              <motion.div
                key={idx}
                style={{
                  x: xOffset,
                  y: yOffset
                }}
                whileHover={{ scale: 1.04 }}
                className="bg-transparent text-left space-y-0.5 cursor-pointer group select-none"
              >
                <span className="text-2xl xl:text-3xl font-jakarta font-black text-slate-900 group-hover:text-[#0D9488] transition-colors drop-shadow-2xs">
                  {card.value}
                </span>
                <p className="text-[9px] font-black text-[#0D9488] uppercase tracking-wider font-jakarta leading-tight">
                  {card.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-200/40">
          <span>© 2026 OfficeCare Inc. All rights reserved.</span>
          <span>Chuẩn y khoa y tế 5★</span>
        </div>
      </div>
    </motion.div>
  );
}
