import { AlertCircle } from 'lucide-react';

interface TreatmentHistoryProps {
  loaiLich: string;
  chanDoan?: string;
  chongChiDinh?: string;
}

export function TreatmentHistory({
  loaiLich,
  chanDoan,
  chongChiDinh
}: TreatmentHistoryProps) {
  if (loaiLich !== 'dieu_tri') return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
        Hồ sơ Điều trị
      </h4>
      <div className="space-y-2">
        {chanDoan && (
          <div className="bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 border-l-4 border-l-blue-500 dark:border-l-blue-600">
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-550 uppercase">Chẩn đoán từ Bác sĩ</p>
            <p className="text-sm text-slate-800 dark:text-zinc-200 mt-1 font-semibold leading-relaxed">{chanDoan}</p>
          </div>
        )}
        {chongChiDinh && (
          <div className="bg-rose-50 dark:bg-rose-955/10 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30 border-l-4 border-l-rose-500 dark:border-l-rose-600">
            <p className="text-[10px] font-bold text-rose-700 dark:text-rose-455 uppercase flex items-center gap-1">
              <AlertCircle size={12} /> Chống chỉ định (CẢNH BÁO)
            </p>
            <p className="text-sm text-rose-900 dark:text-rose-200 mt-1 font-bold leading-relaxed">{chongChiDinh}</p>
          </div>
        )}
        {!chanDoan && !chongChiDinh && (
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic">Không có hồ sơ điều trị đi kèm.</p>
        )}
      </div>
    </div>
  );
}
