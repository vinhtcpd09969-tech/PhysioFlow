import { useState } from 'react';
import { PhoneCall, Play, AlertCircle, Clock, Stethoscope, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PatientCallInStandbyProps {
  patient: {
    id: string;
    ma_khach_hang?: string;
    ten_khach_hang: string;
    so_dien_thoai?: string;
    tuoi?: number;
    gioi_tinh?: string;
    ly_do_kham?: string;
    trang_thai: string;
    trang_thai_thanh_toan?: string;
    ten_dich_vu?: string;
  };
  hasBeenCalledIn: boolean;
  onCallIn: () => void;
  onStartExam: () => void;
  onMarkAbsent: () => void;
}

export function PatientCallInStandby({
  patient,
  hasBeenCalledIn,
  onCallIn,
  onStartExam,
  onMarkAbsent,
}: PatientCallInStandbyProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isUnpaidAssessment = patient.trang_thai_thanh_toan === 'chua_thanh_toan';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-6 min-h-[420px]">
      <div className="relative">
        <div className={`size-20 rounded-3xl flex items-center justify-center font-bold text-3xl transition-all ${
          hasBeenCalledIn
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse border-2 border-amber-300'
            : 'bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200'
        }`}>
          {hasBeenCalledIn ? <PhoneCall size={36} className="animate-bounce" /> : <Stethoscope size={36} />}
        </div>
        {hasBeenCalledIn && (
          <span className="absolute -top-1 -right-1 flex size-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-4 bg-amber-500"></span>
          </span>
        )}
      </div>

      <div className="max-w-md space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <Clock size={13} /> TRẠNG THÁI: {hasBeenCalledIn ? 'ĐÃ GỬI TÍN HIỆU GỌI VÀO' : 'BỆNH NHÂN ĐANG CHỜ TẠI QUẦY'}
        </div>

        <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-zinc-100">
          Bệnh nhân: <span className="text-cyan-600 dark:text-cyan-400">{patient.ten_khach_hang}</span>
        </h3>
        
        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
          {patient.ma_khach_hang || 'KH-88392'} · {patient.ten_dich_vu || 'Lượng giá Chức năng PHCN'}
        </p>

        {/* CẢNH BÁO CHẶN MỀM NẾU CHƯA THANH TOÁN BÀN LƯỢNG GIÁ */}
        {isUnpaidAssessment && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-extrabold text-rose-700 dark:text-rose-400 flex items-center justify-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>⚠️ CHƯA THANH TOÁN: Vui lòng báo Lễ tân thu tiền Lượng giá trước khi bấm Bắt đầu lượng giá!</span>
          </div>
        )}
        
        <p className="text-xs text-slate-600 dark:text-zinc-400 italic bg-slate-50 dark:bg-zinc-800 p-3 rounded-2xl border border-slate-100 dark:border-zinc-700">
          "{patient.ly_do_kham || 'Đau mỏi vai gáy cấp, hạn chế vận động.'}"
        </p>
      </div>

      {/* CÁC NÚT THAO TÁC THEO LUỒNG CHUẨN */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-md">
        {!hasBeenCalledIn ? (
          <button
            type="button"
            onClick={onCallIn}
            className="w-full py-4 px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <PhoneCall size={18} />
            <span>1. 📞 GỌI KHÁCH HÀNG VÀO PHÒNG (BÁO LỄ TÂN)</span>
          </button>
        ) : (
          <div className="w-full space-y-3 animate-in fade-in duration-300">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-xs font-semibold text-amber-800 dark:text-amber-300">
              🔊 Đã phát chuông gọi khách hàng <strong className="underline">{patient.ten_khach_hang}</strong> vào phòng. Khi khách hàng đã sẵn sàng, bấm bên dưới để mở bàn làm việc:
            </div>

            <button
              type="button"
              disabled={isUnpaidAssessment}
              onClick={() => setShowConfirmModal(true)}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
                isUnpaidAssessment
                  ? 'bg-slate-300 dark:bg-zinc-700 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 active:scale-98 cursor-pointer'
              }`}
            >
              <Play size={18} />
              <span>2. ⏱ BẮT ĐẦU MỞ BÀN LÀM VIỆC</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onMarkAbsent}
          className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <AlertCircle size={14} />
          <span>Bệnh nhân vắng mặt (Gọi không có mặt)</span>
        </button>
      </div>

      {/* MODAL XÁC NHẬN BỆNH NHÂN ĐÃ CHẮC CHẮN VÀO PHÒNG */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner border border-emerald-500/30">
              <CheckCircle2 size={34} />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                Xác nhận khách đã vào phòng?
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold leading-relaxed">
                Vui lòng xác nhận khách hàng <span className="font-black text-emerald-600 dark:text-emerald-400">{patient.ten_khach_hang}</span> đã có mặt trong phòng trước khi chính thức mở bàn lượng giá và tính thời gian.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
              >
                Chưa vào — Quay lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  onStartExam();
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play size={16} /> ✅ Khách đã vào — Mở bàn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
