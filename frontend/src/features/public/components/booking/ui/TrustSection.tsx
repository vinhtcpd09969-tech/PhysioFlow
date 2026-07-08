import { Stethoscope, Award, ShieldCheck } from 'lucide-react';

export function TrustSection() {
  return (
    <div className="border-t border-slate-150 pt-16 space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="text-[#2EC4B6] text-[10px] font-black uppercase tracking-widest bg-[#2EC4B6]/10 px-3.5 py-1.5 rounded-full border border-[#2EC4B6]/15 shadow-inner">
          Cam kết chất lượng
        </span>
        <h2 className="text-3xl font-jakarta font-black text-[#0F172A] tracking-tight">
          Đạt chuẩn y tế cao cấp nhất
        </h2>
        <p className="text-sm font-semibold text-slate-400">
          Quy trình chẩn đoán nghiêm ngặt giúp tìm đúng nguyên nhân để trị liệu hiệu quả.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 1: 5-step process */}
        <div className="bg-white border border-slate-100 shadow-lg rounded-[24px] p-6 space-y-5 hover:scale-[1.01] transition-transform duration-300">
          <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/20">
            <Stethoscope size={20} />
          </div>
          <div className="space-y-2 text-left">
            <h4 className="text-base font-jakarta font-black text-[#0F172A]">Quy trình khám 5 bước</h4>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              Từ tiếp nhận triệu chứng, kiểm tra khớp, đọc phim chụp y khoa đến thiết lập phác đồ cá nhân hóa dưới sự hội chẩn chuyên sâu của bác sĩ.
            </p>
          </div>
        </div>

        {/* Box 2: Certifications */}
        <div className="bg-white border border-slate-100 shadow-lg rounded-[24px] p-6 space-y-5 hover:scale-[1.01] transition-transform duration-300">
          <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/20">
            <Award size={20} />
          </div>
          <div className="space-y-2 text-left">
            <h4 className="text-base font-jakarta font-black text-[#0F172A]">Chứng chỉ y khoa chuyên môn</h4>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              100% bác sĩ, kỹ thuật viên có bằng cấp chuyên ngành phục hồi chức năng và sở hữu chứng chỉ hành nghề y tế hợp pháp của Bộ Y Tế.
            </p>
          </div>
        </div>

        {/* Box 3: Quality commitment */}
        <div className="bg-white border border-slate-100 shadow-lg rounded-[24px] p-6 space-y-5 hover:scale-[1.01] transition-transform duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center border border-emerald-100">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-2 text-left">
            <h4 className="text-base font-jakarta font-black text-[#0F172A]">Cam kết chất lượng điều trị</h4>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              OfficeCare cam kết tập trung phục hồi từ gốc rễ bệnh lý cột sống, cơ xương khớp. Không chèo kéo các dịch vụ ngoài phác đồ chỉ định.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
