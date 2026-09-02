import { Stethoscope, CheckCircle2, ChevronDown } from 'lucide-react';
import { isPlanCancelled } from '../../../../utils/billing';

export function isPlanBookable(plan: any): boolean {
  if (!plan || plan.trang_thai === 'khuyen_nghi') return true;
  if (isPlanCancelled(plan)) return false;
  if (plan.lich_dang_hoat_dong) return false;
  return true;
}

interface WalkInTreatmentPlansListProps {
  treatmentPlans: any[];
  selectedPlan: any;
  onSelectPlan: (plan: any) => void;
  onClearPlan: () => void;
  showPlansList: boolean;
  setShowPlansList: (show: boolean) => void;
  onGoToActivation: (plan: any) => void;
  onGoToPayment: (plan: any) => void;
}

export function WalkInTreatmentPlansList({
  treatmentPlans,
  selectedPlan,
  onSelectPlan,
  onClearPlan,
  showPlansList,
  setShowPlansList,
  onGoToActivation,
  onGoToPayment
}: WalkInTreatmentPlansListProps) {
  if (treatmentPlans.length === 0) return null;

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-bold">
            <Stethoscope size={13} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
            Phác đồ / Liệu trình của khách ({treatmentPlans.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPlansList(!showPlansList)}
          className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
        >
          <span>{showPlansList ? 'Thu gọn' : 'Xem danh sách'}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${showPlansList ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showPlansList && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {treatmentPlans.map((plan) => {
            const isSelected = selectedPlan && String(selectedPlan.id || selectedPlan.cuoc_hen_id) === String(plan.id || plan.cuoc_hen_id);
            const isRecommendation = plan.trang_thai === 'khuyen_nghi';
            const bookable = isPlanBookable(plan);

            return (
              <div
                key={plan.id || plan.cuoc_hen_id}
                onClick={() => {
                  if (isRecommendation) {
                    onGoToActivation(plan);
                  } else if (bookable) {
                    if (isSelected) onClearPlan();
                    else onSelectPlan(plan);
                  } else {
                    onGoToPayment(plan);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 hover:border-teal-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
                      {plan.ten_goi || plan.ten_dich_vu || 'Phác đồ điều trị'}
                    </span>
                    {isSelected && <CheckCircle2 size={15} className="text-teal-600 shrink-0" />}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    {isRecommendation ? (
                      <span className="text-amber-600 font-bold">Chỉ định mới (Chưa kích hoạt)</span>
                    ) : (
                      <span>Tiến độ: <b>{plan.so_buoi_da_dung || 0}/{plan.tong_so_buoi || '?'}</b> buổi</span>
                    )}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-400">
                    {plan.hinh_thuc_thanh_toan_goi === 'tra_thang' ? 'Trả thẳng 100%' : 'Từng buổi'}
                  </span>
                  <span className="font-black text-teal-600 dark:text-teal-400">
                    {isRecommendation ? 'Kích hoạt ngay →' : isSelected ? 'Đang chọn ✓' : 'Chọn gói này →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
