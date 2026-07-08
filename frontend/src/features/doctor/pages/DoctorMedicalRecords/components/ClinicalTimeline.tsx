import React from 'react';
import { Calendar, FileText, Activity, ShieldAlert, BadgeCheck } from 'lucide-react';
import { PatientMedicalRecord } from '../../../api/doctor.api';

interface ClinicalTimelineProps {
  medicalRecords: PatientMedicalRecord[];
}

export const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({ medicalRecords }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-thin">
      {medicalRecords && medicalRecords.length > 0 ? (
        <div className="relative border-l-2 border-zinc-150 dark:border-zinc-800 ml-3.5 pl-6 py-2 space-y-8">
          {medicalRecords.map((record) => (
            <div key={record.id} className="relative group">
              {/* Timeline Dot Indicator */}
              <div className="absolute -left-[33px] top-1.5 size-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary group-hover:bg-primary transition-all duration-300 flex items-center justify-center shadow-sm z-10">
                <div className="size-1.5 rounded-full bg-primary group-hover:bg-white animate-ping" />
                <div className="absolute size-1.5 rounded-full bg-primary group-hover:bg-white" />
              </div>

              {/* Medical Record Details Card */}
              <div className="bg-white dark:bg-zinc-855 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Header info */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                  <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                    <Calendar size={12} className="text-primary" />
                    Ngày khám: {formatDate(record.thoi_gian_tao)}
                  </span>
                  {record.ma_lich_dat && (
                    <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20">
                      {record.ma_lich_dat}
                    </span>
                  )}
                </div>

                {/* Diagnosis */}
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Activity size={10} className="text-primary" />
                    Chẩn đoán lâm sàng
                  </span>
                  <p className="text-xs font-bold text-secondary dark:text-zinc-200 mt-1 leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                    {record.chan_doan}
                  </p>
                </div>

                {/* Red Alert Glowing Contraindications */}
                {record.chong_chi_dinh && (
                  <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/30 p-3.5 rounded-xl shadow-[0_0_12px_rgba(239,68,68,0.06)] animate-pulse relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                    <h4 className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={12} className="text-rose-500 shrink-0" />
                      Chống chỉ định tuyệt đối
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-350 font-bold leading-relaxed mt-1.5 pl-0.5">
                      {record.chong_chi_dinh}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {(record.khuyen_nghi_dich_vu || record.khuyen_nghi_goi) && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <BadgeCheck size={10} className="text-primary" />
                      Chỉ định / Đề xuất điều trị
                    </span>
                    <div className="flex gap-2 flex-wrap pt-0.5">
                      {record.khuyen_nghi_dich_vu && (
                        <span className="text-[9px] font-extrabold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-150/40 dark:border-amber-900/30 px-2.5 py-1 rounded-lg uppercase tracking-tight">
                          Dịch vụ: {record.khuyen_nghi_dich_vu}
                        </span>
                      )}
                      {record.khuyen_nghi_goi && (
                        <span className="text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-150/40 dark:border-emerald-900/30 px-2.5 py-1 rounded-lg uppercase tracking-tight">
                          Gói chuyên sâu: {record.khuyen_nghi_goi}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {record.ghi_chu && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-start gap-2">
                    <FileText size={12} className="text-zinc-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] italic text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                      Ghi chú bác sĩ: {record.ghi_chu}
                    </p>
                  </div>
                )}

                {/* Footer BS */}
                <div className="text-[9px] text-zinc-400 font-bold pt-2 flex items-center justify-between border-t border-zinc-50 dark:border-zinc-800/40">
                  <span>Người thực hiện: BS. {record.ten_bac_si}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-xs font-bold bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <FileText size={28} className="mx-auto mb-2 text-zinc-350" />
          Chưa có bệnh án lâm sàng nào được ghi nhận cho bệnh nhân này.
        </div>
      )}
    </div>
  );
};
