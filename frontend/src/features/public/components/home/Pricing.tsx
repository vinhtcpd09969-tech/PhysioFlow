import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '../shared/ScrollReveal';

export default function Pricing() {
  return (
    <section id="pricing" className="py-xxl bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-black tracking-widest uppercase text-xs mb-3 font-jakarta">Bảng giá liệu trình</h2>
            <h3 className="font-jakarta text-3xl md:text-5xl font-black text-secondary mb-4">Đầu Tư Vào Sức Khỏe Lâu Dài</h3>
            <p className="text-slate-500 font-semibold text-base md:text-lg">Đăng ký lộ trình để đạt hiệu quả phục hồi cơ xương khớp bền vững và tiết kiệm đến 25% chi phí.</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Package 1: Basic */}
          <ScrollReveal delay={100} className="h-full">
            <motion.div 
              whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)" }}
              className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-full transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-jakarta">Cơ bản</span>
                  <span className="text-xs text-primary font-bold font-jakarta">Tiết kiệm 15%</span>
                </div>
                <h4 className="font-jakarta font-black text-2xl text-secondary mb-2">Trị Liệu Cấp Tốc</h4>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6 font-jakarta">Giải tỏa cơ co thắt nhanh chóng</p>
                <div className="mb-8">
                  <span className="text-4xl font-black text-secondary">4.2tr</span>
                  <span className="text-slate-400 font-bold"> / 6 buổi</span>
                </div>
                <ul className="space-y-4 mb-8 font-jakarta text-xs md:text-sm text-slate-600 font-semibold">
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" /> 2 buổi Siêu âm trị liệu sâu
                  </li>
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" /> 2 buổi Điện xung ức chế dây thần kinh đau
                  </li>
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" /> 2 buổi Tập kéo duỗi cơ cùng kỹ thuật viên
                  </li>
                </ul>
              </div>
              <Link to="/booking" className="block w-full text-center bg-white hover:bg-slate-100 text-secondary font-extrabold py-3.5 rounded-full transition-all border border-slate-200 text-sm shadow-sm font-jakarta">
                Đăng ký gói
              </Link>
            </motion.div>
          </ScrollReveal>

          {/* Package 2: Highlight */}
          <ScrollReveal delay={200} className="h-full">
            <motion.div 
              whileHover={{ y: -10, boxShadow: "0 30px 60px -15px rgba(46, 196, 182, 0.15)" }}
              className="bg-[#F2FAF9] rounded-[32px] p-8 shadow-md border-2 border-primary relative flex flex-col justify-between h-full transition-all duration-300 md:-translate-y-4"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white font-black text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md flex items-center gap-1 font-jakarta whitespace-nowrap">
                <Sparkles size={11} /> Lựa chọn tốt nhất
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-primary/20 text-[#25A89C] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-jakarta">Chuyên sâu</span>
                  <span className="text-xs text-primary font-bold font-jakarta">Phục hồi bền vững</span>
                </div>
                <h4 className="font-jakarta font-black text-2xl text-secondary mb-2">Cột Sống Chuyên Sâu</h4>
                <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-6 font-jakarta">Trị tận gốc thoái hóa & thoát vị</p>
                <div className="mb-8">
                  <span className="text-4xl font-black text-secondary">8.5tr</span>
                  <span className="text-slate-400 font-bold"> / 12 buổi</span>
                </div>
                <ul className="space-y-4 mb-8 font-jakarta text-xs md:text-sm text-slate-600 font-semibold">
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-[#25A89C] shrink-0 mt-0.5" /> 6 buổi Khám cơ xương khớp chuyên sâu
                  </li>
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-[#25A89C] shrink-0 mt-0.5" /> 6 buổi Siêu âm & điện xung trị liệu sâu
                  </li>
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-[#25A89C] shrink-0 mt-0.5" /> Liệu pháp kéo nắn, di động cột sống cổ/lưng
                  </li>
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-[#25A89C] shrink-0 mt-0.5" /> Hướng dẫn tập phục hồi ngăn ngừa tái phát
                  </li>
                </ul>
              </div>
              <Link to="/booking" className="block w-full text-center bg-primary hover:bg-[#25A89C] text-white font-extrabold py-3.5 rounded-full shadow-md transition-colors text-sm font-jakarta">
                Đăng ký gói
              </Link>
            </motion.div>
          </ScrollReveal>

          {/* Package 3: Premium */}
          <ScrollReveal delay={300} className="h-full">
            <motion.div 
              whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)" }}
              className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-full transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-jakarta">Cao cấp</span>
                  <span className="text-xs text-primary font-bold font-jakarta">Trị liệu kết hợp</span>
                </div>
                <h4 className="font-jakarta font-black text-2xl text-secondary mb-2">Yoga Phục Hồi</h4>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6 font-jakarta">Tái cấu trúc tư thế cơ xương khớp</p>
                <div className="mb-8">
                  <span className="text-4xl font-black text-secondary">15.0tr</span>
                  <span className="text-slate-400 font-bold"> / 24 buổi</span>
                </div>
                <ul className="space-y-4 mb-8 font-jakarta text-xs md:text-sm text-slate-600 font-semibold">
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" /> 12 buổi Khám lượng giá cột sống định kỳ
                  </li>
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" /> 12 buổi Điện xung giảm co cứng nhóm cơ sâu
                  </li>
                  <li className="flex items-start gap-3 text-left">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" /> Tập vận động 1-1 chuyên biệt cùng HLV Yoga
                  </li>
                </ul>
              </div>
              <Link to="/booking" className="block w-full text-center bg-white hover:bg-slate-100 text-secondary font-extrabold py-3.5 rounded-full transition-all border border-slate-200 text-sm shadow-sm font-jakarta">
                Đăng ký gói
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
