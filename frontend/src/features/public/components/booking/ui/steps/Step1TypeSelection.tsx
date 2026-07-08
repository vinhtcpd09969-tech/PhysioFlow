import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Stethoscope, Award } from 'lucide-react';

interface Step1TypeSelectionProps {
  bookingType: 'kham' | 'dich_vu';
  setBookingType: (type: 'kham' | 'dich_vu') => void;
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  services: any[];
  servicesLoading: boolean;
  setActiveStep: (step: number) => void;
}

export function Step1TypeSelection({
  bookingType,
  setBookingType,
  selectedServiceId,
  setSelectedServiceId,
  services,
  servicesLoading,
  setActiveStep
}: Step1TypeSelectionProps) {
  return (
    <motion.div
      key="type-step"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
          <CalendarIcon className="text-[#2EC4B6]" size={20} />
          Chọn hình thức đặt lịch hẹn
        </h3>
        <p className="text-xs font-medium text-slate-400">
          OfficeCare cung cấp dịch vụ khám lâm sàng và các gói chăm sóc trị liệu nhanh phù hợp với từng nhu cầu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Option A: Lịch Khám */}
        <div
          onClick={() => {
            setBookingType('kham');
            const firstKham = services.find(srv => srv.loai_goi === 'KHAM');
            setSelectedServiceId(firstKham ? firstKham.id : '');
          }}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
            bookingType === 'kham'
              ? 'bg-[#14B8A6]/5 border-[#2EC4B6] ring-2 ring-[#2EC4B6]/10'
              : 'bg-white border-slate-200 hover:border-slate-350'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center">
                <Stethoscope size={20} />
              </div>
              <span className="text-sm font-black text-slate-800">Lịch Khám Lâm Sàng</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Dành cho khách hàng có nhu cầu trị liệu bệnh lý (đau mỏi vai gáy, lưng, khớp...) cần được Bác sĩ kiểm tra trực tiếp và lên phác đồ trước.
            </p>
          </div>
          <div className="flex gap-1.5 mt-4">
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider">Có Bác sĩ</span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">30 phút</span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider">Lượng giá chuyên sâu</span>
          </div>
        </div>

        {/* Option B: Dịch vụ lẻ */}
        <div
          onClick={() => {
            setBookingType('dich_vu');
            const firstLe = services.find(srv => srv.loai_goi === 'LE');
            setSelectedServiceId(firstLe ? firstLe.id : '');
          }}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
            bookingType === 'dich_vu'
              ? 'bg-[#14B8A6]/5 border-[#2EC4B6] ring-2 ring-[#2EC4B6]/10'
              : 'bg-white border-slate-200 hover:border-slate-350'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center">
                <Award size={20} />
              </div>
              <span className="text-sm font-black text-slate-800">Dịch Vụ Lẻ / Trị Liệu Nhanh</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Dành cho khách hàng chỉ muốn sử dụng các dịch vụ chăm sóc sức khỏe làm nhanh, thư giãn cơ, siêu âm trị liệu... không cần Bác sĩ khám trước.
            </p>
          </div>
          <div className="flex gap-1.5 mt-4">
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wider">Không cần khám</span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">45-60 phút</span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider">Bảng giá lẻ</span>
          </div>
        </div>
      </div>

      {/* Dynamic Service selection grid */}
      <div className="space-y-3 pt-4 border-t border-slate-150 animate-fade-in">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
          {bookingType === 'kham' ? 'Chọn Gói Khám Lâm Sàng *' : 'Chọn Dịch Vụ Lẻ Mong Muốn *'}
        </h4>
        {servicesLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
            Đang tải danh sách dịch vụ...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {services
              .filter(srv => bookingType === 'kham' ? srv.loai_goi === 'KHAM' : srv.loai_goi === 'LE')
              .map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between select-none cursor-pointer ${
                      isSelected
                        ? 'bg-[#14B8A6]/5 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10'
                        : 'bg-white border-slate-150 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-800 leading-tight block truncate pr-2">{srv.ten_dich_vu}</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-500">
                        {srv.thoi_luong_phut} phút
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[130px]">{srv.mo_ta_ngan || 'Trị liệu phục hồi chức năng'}</span>
                      <span className="text-xs font-black text-emerald-600 font-jakarta">
                        {Number(srv.don_gia).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          disabled={!selectedServiceId}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Chọn Ngày Hẹn
        </button>
      </div>
    </motion.div>
  );
}
