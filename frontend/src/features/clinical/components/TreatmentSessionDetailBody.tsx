import { CheckCircle2, FileText, ShieldAlert, TrendingDown, TrendingUp, Zap } from 'lucide-react';

const getVasDescription = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '';
  if (score === 0) return 'Không đau';
  if (score >= 1 && score <= 3) return 'Đau nhẹ: Ê ẩm, mỏi nhẹ (Vẫn làm việc, sinh hoạt bình thường)';
  if (score >= 4 && score <= 6) return 'Đau vừa: Đau rõ rệt, nhức mỏi (Có ảnh hưởng một phần đến sinh hoạt/công việc)';
  if (score >= 7 && score <= 9) return 'Đau nặng: Đau buốt dữ dội (Hạn chế vận động, ảnh hưởng sinh hoạt)';
  if (score === 10) return 'Cực độ: Đau không thể chịu nổi (Hạn chế vận động hoàn toàn, cần can thiệp khẩn cấp)';
  return '';
};

export interface TreatmentSessionDetailBodyProps {
  chanDoan?: string | null;
  ghiChu?: string | null;
  ghiChuLabel?: string;
  chongChiDinh?: string | null;
  vasTruoc?: number | null;
  vasSau?: number | null;
  duLieuTriLieu?: any;
  vasDeltaOverride?: number | null;
  vasDeltaSuffixLabel?: string;
}

export function TreatmentSessionDetailBody({
  chanDoan,
  ghiChu,
  ghiChuLabel = 'Nhật ký & Ghi chú của kỹ thuật viên',
  chongChiDinh,
  vasTruoc = null,
  vasSau = null,
  duLieuTriLieu = null,
  vasDeltaOverride,
  vasDeltaSuffixLabel = 'so với trước trị liệu'
}: TreatmentSessionDetailBodyProps) {
  const rawTriLieu = typeof duLieuTriLieu === 'string'
    ? (function() { try { return JSON.parse(duLieuTriLieu); } catch(e) { return {}; } })()
    : (duLieuTriLieu || {});
  const nhatKyList: any[] = rawTriLieu.nhat_ky || rawTriLieu.technique_logs || rawTriLieu.physical_therapy_logs || [];

  const hasLeftColumn = !!chanDoan || !!ghiChu || !!chongChiDinh || nhatKyList.length > 0;
  const hasVas = vasTruoc !== null || vasSau !== null;
  const vasDelta = vasDeltaOverride !== undefined
    ? vasDeltaOverride
    : (vasTruoc !== null && vasSau !== null ? vasSau - vasTruoc : null);

  if (!hasLeftColumn && !hasVas) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      {/* Cột trái: Ghi nhận lâm sàng & Nhật ký */}
      {hasLeftColumn && (
        <div className="flex flex-col gap-3">
          {chanDoan && (
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xs space-y-1.5 shrink-0">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#0D9488]" /> Ghi nhận lâm sàng
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed mt-1">{chanDoan}</p>
            </div>
          )}

          {ghiChu && (
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xs space-y-1.5 flex-1 flex flex-col justify-start">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-amber-500" /> {ghiChuLabel}
              </span>
              <p className="text-xs font-semibold text-slate-650 dark:text-slate-300 italic leading-relaxed mt-1 flex-1">"{ghiChu}"</p>
            </div>
          )}

          {nhatKyList.length > 0 && (
            <div className="p-3.5 bg-teal-50/60 dark:bg-teal-955/20 border border-teal-200/80 dark:border-teal-800 rounded-2xl shadow-xs space-y-2 shrink-0">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="text-teal-600" /> Thao tác kỹ thuật KTV đã thực hiện ({nhatKyList.length})
              </span>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {nhatKyList.map((item: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-teal-100 dark:border-zinc-700 flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">
                      {item.noi_dung || item.name || item.technique || 'Kỹ thuật trị liệu PHCN'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chongChiDinh && (
            <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex gap-2.5 text-rose-900 dark:text-rose-400 shrink-0">
              <ShieldAlert size={15} className="shrink-0 mt-0.5 text-rose-500" />
              <div className="space-y-0.5">
                <span className="text-[9.5px] uppercase font-black tracking-wider text-rose-600 dark:text-rose-500 block">Chống chỉ định lưu ý</span>
                <p className="text-xs font-bold">{chongChiDinh}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cột phải: Thước đo chỉ số đau (VAS) */}
      {hasVas && (
        <div className={`flex ${hasLeftColumn ? '' : 'md:col-span-2'}`}>
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xs space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-wider mb-3">Chỉ số mức độ đau (VAS)</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider block">Trước trị liệu</span>
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 block tabular-nums">{vasTruoc ?? '—'}</span>
                </div>
                <div className="p-3 bg-[#0D9488]/5 dark:bg-[#0D9488]/10 rounded-xl text-center border border-[#0D9488]/10">
                  <span className="text-[9px] text-[#0D9488] uppercase font-black tracking-wider block">Sau trị liệu</span>
                  <span className="text-2xl font-black text-[#0D9488] mt-1 block tabular-nums">{vasSau ?? '—'}</span>
                </div>
              </div>

              {/* Thanh slider gradient VAS */}
              {vasTruoc !== null && vasSau !== null && (
                <div className="space-y-1.5 pt-4">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>0 (Không đau)</span>
                    <span>10 (Rất dữ dội)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 opacity-25" />
                    {vasTruoc !== vasSau && (
                      <div
                        className={`absolute top-0 bottom-0 opacity-40 transition-all ${vasSau < vasTruoc ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        style={{
                          left: `${Math.min(vasTruoc, vasSau) * 10}%`,
                          width: `${Math.abs(vasSau - vasTruoc) * 10}%`
                        }}
                      />
                    )}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-400 border border-white rounded-full -ml-1.25 transition-all shadow-xs"
                      style={{ left: `${vasTruoc * 10}%` }}
                      title={`Trước: ${vasTruoc}`}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#0D9488] border border-white rounded-full -ml-1.75 transition-all shadow-sm"
                      style={{ left: `${vasSau * 10}%` }}
                      title={`Sau: ${vasSau}`}
                    />
                  </div>
                </div>
              )}

              {/* Bảng chi tiết mô tả thang điểm đau */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
                {vasTruoc !== null && (
                  <div className="flex items-start gap-2 text-[11px] text-slate-550 dark:text-slate-400">
                    <span className="size-2 rounded-full bg-slate-400 mt-1 shrink-0" />
                    <p className="leading-tight">
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">Mức {vasTruoc} (Trước):</span> {getVasDescription(vasTruoc)}
                    </p>
                  </div>
                )}
                {vasSau !== null && (
                  <div className="flex items-start gap-2 text-[11px] text-[#0D9488]">
                    <span className="size-2 rounded-full bg-[#0D9488] mt-1 shrink-0" />
                    <p className="leading-tight">
                      <span className="font-extrabold text-[#0D9488]">Mức {vasSau} (Sau):</span> {getVasDescription(vasSau)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {vasDelta !== null && vasDelta !== 0 && (
              <div className="flex justify-center pt-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${vasDelta < 0
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400'
                      : 'text-rose-700 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400'
                    }`}
                >
                  {vasDelta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  {vasDelta < 0 ? 'Giảm' : 'Tăng'} {Math.abs(vasDelta)} điểm đau {vasDeltaSuffixLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TreatmentSessionDetailBody;
