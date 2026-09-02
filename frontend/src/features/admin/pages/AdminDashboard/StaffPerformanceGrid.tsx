import { useMemo } from 'react';
import { Award, Activity } from 'lucide-react';

interface StaffPerformanceProps {
  name: string;
  avatar?: string;
  role?: string;
  sessions: number;
}

interface StaffPerformanceGridProps {
  performanceData: StaffPerformanceProps[];
}

const numberFormatter = new Intl.NumberFormat('vi-VN');

const getStaffRoleDisplay = (role?: string) => {
  if (!role) return 'Kỹ thuật viên';
  const r = role.toLowerCase();
  if (r.includes('bác sĩ') || r.includes('doctor') || r.includes('lượng giá') || r.includes('tư vấn')) {
    return 'Chuyên viên tư vấn';
  }
  if (r.includes('kỹ thuật') || r.includes('technician') || r.includes('ktv')) {
    return 'Kỹ thuật viên';
  }
  return role;
};

export function StaffPerformanceGrid({ performanceData }: StaffPerformanceGridProps) {
  const maxSessions = useMemo(() => {
    return performanceData.length > 0
      ? Math.max(...performanceData.map((s) => Number(s.sessions || 0)), 1)
      : 1;
  }, [performanceData]);

  const totalSessions = useMemo(() => {
    return performanceData.reduce((sum, s) => sum + Number(s.sessions || 0), 0);
  }, [performanceData]);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Award className="text-teal-600 dark:text-teal-400 shrink-0" size={18} />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Top Nhân Sự Hoàn Thành Ca
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Chuyên viên &amp; KTV có số ca phục hồi nhiều nhất
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200/60 dark:border-teal-800/40 shrink-0">
            Hiệu suất cao
          </span>
        </div>

        {/* Content Rows */}
        {performanceData.length === 0 ? (
          <div className="text-slate-400 dark:text-slate-500 text-xs italic text-center py-12 font-medium">
            Chưa ghi nhận ca hoàn thành trong kỳ báo cáo.
          </div>
        ) : (
          <div className="space-y-2.5">
            {performanceData.slice(0, 5).map((staff, idx) => {
              const rank = idx + 1;
              const sessions = Number(staff.sessions || 0);
              const percent = Math.max(Math.round((sessions / maxSessions) * 100), 8);

              return (
                <div
                  key={staff.name + idx}
                  className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all duration-150"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        rank === 1
                          ? 'bg-amber-500 text-white'
                          : rank === 2
                          ? 'bg-slate-400 text-white'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {rank}
                      </span>

                      {/* Avatar */}
                      {staff.avatar ? (
                        <img
                          src={staff.avatar}
                          alt={staff.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-200/60 dark:border-teal-800/60 shrink-0">
                          {staff.name ? staff.name.charAt(0).toUpperCase() : 'N'}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {staff.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                          {getStaffRoleDisplay(staff.role)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        <Activity size={13} className="text-teal-600 dark:text-teal-400" />
                        <span>{numberFormatter.format(sessions)}</span>
                        <span className="text-[11px] font-normal text-slate-400">ca</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Progress Line */}
                  <div className="w-full h-1 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out bg-teal-600 dark:bg-teal-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Total Summary */}
      {performanceData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Tổng ca hoàn thành trong kỳ:</span>
          <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">
            {numberFormatter.format(totalSessions)} ca
          </span>
        </div>
      )}
    </div>
  );
}

