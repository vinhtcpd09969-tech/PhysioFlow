import React, { useState } from 'react';
import { 
  Lock, 
  Sparkles, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { PatientProfile } from '../../../api/doctor.api';

interface TreatmentProgressProps {
  profile: PatientProfile | null;
}

export const TreatmentProgress: React.FC<TreatmentProgressProps> = ({ profile }) => {
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const togglePlan = (id: string) => {
    setOpenPlanId(openPlanId === id ? null : id);
  };

  const toggleSession = (id: string) => {
    setOpenSessionId(openSessionId === id ? null : id);
  };

  if (!profile || !profile.treatmentPlans || profile.treatmentPlans.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-xs font-bold bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm">
          <HelpCircle size={28} className="mx-auto mb-2 text-zinc-350" />
          Bệnh nhân chưa bắt đầu phác đồ hay liệu trình điều trị thực tế nào.
        </div>
      </div>
    );
  }

  // Tự động mở liệu trình đầu tiên nếu chưa chọn
  const activePlanId = openPlanId || profile.treatmentPlans[0].id;
  const currentPlan = profile.treatmentPlans.find((p: any) => p.id === activePlanId) || profile.treatmentPlans[0];

  // Tính toán dữ liệu cho biểu đồ VAS của liệu trình được chọn
  const completedSessions = currentPlan.sessions.filter((s: any) => s.trang_thai === 'hoan_thanh');
  
  const chartData = completedSessions.map((s: any) => {
    const vasBefore = s.danh_gia_truoc_buoi != null ? Number(s.danh_gia_truoc_buoi) : null;
    const vasAfter = s.danh_gia_sau_buoi != null ? Number(s.danh_gia_sau_buoi) : null;
    return {
      name: `Buổi ${s.so_thu_tu_buoi}`,
      'Trước buổi': vasBefore,
      'Sau buổi': vasAfter,
    };
  });

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {/* Liệu trình selector dropdown/cards */}
      <div className="space-y-2">
        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Chọn liệu trình giám sát</span>
        <div className="grid grid-cols-1 gap-2">
          {profile.treatmentPlans.map((plan: any) => {
            const isActive = plan.id === activePlanId;
            return (
              <button
                key={plan.id}
                onClick={() => togglePlan(plan.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                  isActive 
                    ? 'bg-zinc-50/70 dark:bg-zinc-800/35 border-primary/45 shadow-sm' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] font-bold text-zinc-400 dark:text-zinc-500">{plan.ma_lich_dieu_tri}</span>
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      plan.loai_dieu_tri === 'goi' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50' 
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-455 border border-amber-100/50'
                    }`}>
                      {plan.loai_dieu_tri === 'goi' ? 'Theo gói' : 'Dịch vụ lẻ'}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      plan.trang_thai === 'dang_dieu_tri' 
                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      {plan.trang_thai === 'dang_dieu_tri' ? 'Đang chạy' : plan.trang_thai === 'hoan_thanh' ? 'Xong' : 'Tạm dừng'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-secondary dark:text-zinc-200 truncate mt-1.5">
                    {plan.ten_goi || plan.ten_dich_vu}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-extrabold text-primary">
                    {plan.so_buoi_da_dung} / {plan.tong_so_buoi} buổi
                  </p>
                  <div className="w-20 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1 border border-zinc-200/20">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(plan.so_buoi_da_dung / plan.tong_so_buoi) * 100}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytics Section: Pain Level Monitor (VAS Chart) */}
      {currentPlan && (
        <div className="space-y-3 bg-white dark:bg-zinc-855 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <div>
            <h4 className="text-[10px] font-black text-secondary dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={12} className="text-primary" />
              Giám sát mức độ đau đớn (VAS Trend)
            </h4>
            <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">
              Chỉ số tự lượng giá của bệnh nhân trước & sau mỗi buổi trị liệu (Thang 0-10)
            </p>
          </div>

          {chartData.length > 0 ? (
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-zinc-800" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tickCount={6} 
                    tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e5e7eb', 
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }} 
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={20} 
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: 9, fontWeight: 700, fill: '#6b7280' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Trước buổi" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
                    activeDot={{ r: 4 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Sau buổi" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-36 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-center p-4">
              <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">
                Chưa có dữ liệu buổi trị liệu hoàn thành để phân tích VAS
              </p>
            </div>
          )}
        </div>
      )}

      {/* Read-Only Technician Sessions Accordion */}
      {currentPlan && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Nhật ký buổi điều trị</span>
            
            {/* Read Only Indicator Badge */}
            <div className="flex items-center gap-1 bg-amber-500/5 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/15 text-[8px] font-black uppercase tracking-tight shrink-0 shadow-inner">
              <Lock size={10} className="text-amber-500 animate-pulse" />
              Chỉ xem (Kỹ thuật viên ghi)
            </div>
          </div>

          <div className="space-y-2">
            {currentPlan.sessions.map((session: any) => {
              const isSessionOpen = openSessionId === session.id;
              const isCompleted = session.trang_thai === 'hoan_thanh';

              return (
                <div 
                  key={session.id} 
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-white dark:bg-zinc-900 ${
                    isSessionOpen 
                      ? 'border-zinc-200 dark:border-zinc-700 shadow-sm' 
                      : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'
                  }`}
                >
                  {/* Session Header */}
                  <button
                    onClick={() => isCompleted && toggleSession(session.id)}
                    disabled={!isCompleted}
                    className={`w-full text-left p-3.5 flex items-center justify-between gap-3 ${
                      isCompleted ? 'cursor-pointer' : 'cursor-not-allowed opacity-60 bg-zinc-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCompleted ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        {session.so_thu_tu_buoi}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-secondary dark:text-zinc-300">
                          Buổi trị liệu {session.so_thu_tu_buoi}
                        </h5>
                        <p className="text-[9px] text-zinc-400 font-semibold mt-0.5 flex items-center gap-1.5">
                          {isCompleted ? (
                            <>
                              <UserCheck size={10} className="text-emerald-500 shrink-0" />
                              <span className="truncate">KTV: {session.ten_ky_thuat_vien || 'Chưa phân công'}</span>
                            </>
                          ) : (
                            <span>Buổi học chưa diễn ra</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isCompleted 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-zinc-100 text-zinc-400 border border-zinc-200/50'
                      }`}>
                        {isCompleted ? 'Hoàn thành' : 'Chưa chạy'}
                      </span>
                      {isCompleted && (
                        isSessionOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />
                      )}
                    </div>
                  </button>

                  {/* Session Expanded content */}
                  {isSessionOpen && isCompleted && (
                    <div className="px-4 pb-4 pt-1.5 border-t border-zinc-50 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 space-y-4">
                      {/* Pain Score */}
                      <div className="grid grid-cols-2 gap-3 bg-white dark:bg-zinc-855 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded-xl shadow-inner text-[10px]">
                        <div>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Đau trước buổi (VAS)</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs font-black text-rose-500">{session.danh_gia_truoc_buoi}/10</span>
                            <span className="text-[8px] text-zinc-400 font-semibold">Tự đánh giá</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Đau sau buổi (VAS)</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs font-black text-emerald-600">{session.danh_gia_sau_buoi}/10</span>
                            <span className="text-[8px] text-emerald-500 font-semibold">Cải thiện tốt</span>
                          </div>
                        </div>
                      </div>

                      {/* Special warning if any */}
                      {session.canh_bao_dac_biet && (
                        <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 animate-pulse">
                          <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[8px] font-black text-rose-600 uppercase tracking-wider">KTV lưu ý đặc biệt</span>
                            <p className="text-[10px] text-rose-700 dark:text-rose-350 font-bold leading-relaxed mt-0.5">
                              {session.canh_bao_dac_biet}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* KTV Notes */}
                      <div>
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle size={10} />
                          Nhật ký điều trị chi tiết của KTV
                        </span>
                        <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-350 leading-relaxed mt-1.5 bg-white dark:bg-zinc-855 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
                          {session.danh_gia_hieu_qua || 'Chưa ghi nhận đánh giá từ Kỹ thuật viên.'}
                        </p>
                      </div>

                      {/* AI Recovery progress sparkles note */}
                      {session.ai_tom_tat_ngan && (
                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/15 p-3.5 rounded-xl relative overflow-hidden">
                          <div className="absolute -right-3 -top-3 text-primary/10 rotate-12">
                            <Sparkles size={48} />
                          </div>
                          <h5 className="text-[8px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={11} className="text-primary animate-pulse" />
                            Tóm tắt tiến trình (AI gợi ý)
                          </h5>
                          <p className="text-[10.5px] font-bold text-primary dark:text-zinc-300 leading-relaxed mt-1.5">
                            {session.ai_tom_tat_ngan}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
