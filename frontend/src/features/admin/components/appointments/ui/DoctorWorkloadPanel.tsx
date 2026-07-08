import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Sparkles } from 'lucide-react';

export interface DoctorWorkload {
  id: string | number;
  chuyen_gia_id?: string;
  name: string;
  hasShift: boolean;
  occupiedCount: number;
  maxSlots: number;
  percentage: number;
}

interface DoctorWorkloadPanelProps {
  doctorWorkloads: DoctorWorkload[];
  activeType: 'kham' | 'dieu_tri';
  selectedStaffId: string | null;
  onSelectStaff: (id: string | null) => void;
}

export function DoctorWorkloadPanel({
  doctorWorkloads,
  activeType,
  selectedStaffId,
  onSelectStaff
}: DoctorWorkloadPanelProps) {
  const isKham = activeType === 'kham';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <div className="w-full lg:w-80 shrink-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-100 dark:border-zinc-800 p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:border-[#14B8A6]/20 transition-all duration-500 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
        <h3 className="text-xs font-black text-slate-800 dark:text-zinc-150 uppercase tracking-widest flex items-center gap-2">
          <Activity size={15} className={isKham ? "text-[#0D9488]" : "text-amber-500"} /> 
          <span>{isKham ? 'Điều phối Bác sĩ' : 'Điều phối Kỹ thuật viên'}</span>
        </h3>
        <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-zinc-800/50 uppercase tracking-widest">
          Hôm nay
        </span>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {doctorWorkloads.length === 0 ? (
          <p className="text-xs text-slate-450 dark:text-zinc-500 italic text-center py-4">
            Không tìm thấy {isKham ? 'bác sĩ' : 'kỹ thuật viên'} nào trong danh sách
          </p>
        ) : (
          doctorWorkloads.map(doc => {
            const isNearOverload = doc.percentage >= 90;
            const isBusy = doc.percentage >= 75 && doc.percentage < 90;
            const isAvailable = doc.percentage < 75;
            const isSelected = selectedStaffId !== null && String(doc.id) === String(selectedStaffId);

            return (
              <motion.div
                key={doc.id}
                variants={itemVariants}
                whileHover={{ x: -2 }}
                onClick={() => onSelectStaff(isSelected ? null : String(doc.id))}
                className={`flex flex-col gap-2.5 p-3.5 rounded-[18px] bg-white/80 dark:bg-zinc-900/50 border transition-all duration-300 shadow-[0_2px_8px_rgba(15,23,42,0.01)] cursor-pointer ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/10 dark:bg-teal-950/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                    : 'border-slate-100 dark:border-zinc-800/60 hover:border-[#14B8A6]/20 hover:bg-white dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Doctor Initials Avatar with dynamic borders */}
                    <div className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                      doc.hasShift 
                        ? (isKham ? 'bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20')
                        : 'bg-slate-550/5 text-slate-400 border border-slate-200/50 dark:border-zinc-800'
                    }`}>
                      {doc.name.split(' ').pop()?.charAt(0).toUpperCase() || doc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="max-w-[130px] sm:max-w-none">
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-150 truncate leading-snug">
                        {isKham ? 'BS.' : 'KTV.'} {doc.name}
                      </p>
                      <span className={`text-[9px] font-bold inline-flex items-center gap-1 ${
                        doc.hasShift ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500'
                      }`}>
                        {doc.hasShift ? (
                          <>
                            <span className="size-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span>Đang trực ca</span>
                          </>
                        ) : (
                          <span>Nghỉ ca trực</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {doc.hasShift && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-bold">
                      <span className="flex items-center gap-1 uppercase tracking-wide">
                        Hiệu suất lấp đầy
                      </span>
                      {isNearOverload ? (
                        <span className="text-rose-500 font-extrabold flex items-center gap-0.5 animate-pulse bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-200/30">
                          <ShieldAlert size={10} />
                          🚨 Gần quá tải
                        </span>
                      ) : isBusy ? (
                        <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/15 px-1.5 py-0.5 rounded border border-amber-200/30">
                          ⚠️ Bận rộn
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/10 px-1.5 py-0.5 rounded border border-emerald-250/20">
                          <Sparkles size={9} />
                          Sẵn sàng
                        </span>
                      )}
                    </div>

                    {/* Progress Bar Grid */}
                    <div className="w-full h-1.5 bg-slate-50 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-slate-100/50 dark:border-zinc-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${doc.percentage}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        className={`h-full rounded-full ${
                          isAvailable
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            : isBusy
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                            : 'bg-gradient-to-r from-rose-500 to-rose-400 animate-pulse'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
