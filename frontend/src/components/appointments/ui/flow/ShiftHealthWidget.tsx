import { useMemo } from 'react';
import { Activity, Sun, Moon } from 'lucide-react';
import { Appointment, Staff } from '../../types';

const BUOI_LABEL: Record<string, string> = { sang: 'Sáng', chieu: 'Chiều' };
const BUOI_WINDOW: Record<'sang' | 'chieu', { start: number; end: number }> = {
  sang: { start: 7 * 60 + 30, end: 12 * 60 },
  chieu: { start: 12 * 60, end: 20 * 60 },
};

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function fmtMinutes(mins: number): string {
  if (mins <= 0) return '0p';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}p` : ''}` : `${m}p`;
}

export function useSucKhoeCa(
  appointments: Appointment[],
  staffList: Staff[],
  schedulesList: any[],
  selectedDateStr: string,
  activeType: 'kham' | 'dieu_tri'
) {
  return useMemo(() => {
    const now = new Date();
    const nowMins = minutesOfDay(now);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = selectedDateStr === todayStr;
    const isPastDate = selectedDateStr < todayStr;

    const staffById = new Map(staffList.map((s) => [String(s.id), s]));

    const isRoleMatch = (staff: any, sch: any, roleKey: string) => {
      const roleId = Number(staff?.vai_tro_id || sch?.vai_tro_id);
      const roleName = String(staff?.vai_tro || sch?.vai_tro || '');
      if (roleKey === 'Bác sĩ' || roleKey === 'chuyen_vien') {
        return roleId === 4 || roleName === 'Chuyên viên PHCN' || roleName === 'Bác sĩ';
      }
      if (roleKey === 'Kỹ thuật viên' || roleKey === 'ktv') {
        return roleId === 3 || roleName === 'Kỹ thuật viên';
      }
      return false;
    };

    const capacityFor = (vaiTro: string, buoi: 'sang' | 'chieu') => {
      const win = BUOI_WINDOW[buoi];
      let total = 0;
      schedulesList.forEach((sch: any) => {
        if (sch.ngay !== selectedDateStr || sch.trang_thai !== 'hoat_dong') return;
        const staff = staffById.get(String(sch.nguoi_dung_id));
        if (!isRoleMatch(staff, sch, vaiTro)) return;
        const [sh, sm] = String(sch.gio_bat_dau).split(':').map(Number);
        const [eh, em] = String(sch.gio_ket_thuc).split(':').map(Number);
        const shiftStart = sh * 60 + sm;
        const shiftEnd = eh * 60 + em;
        const from = isToday ? Math.max(nowMins, shiftStart, win.start) : Math.max(shiftStart, win.start);
        const to = Math.min(shiftEnd, win.end);
        total += Math.max(0, to - from);
      });
      return total;
    };

    const demandFor = (vaiTro: string, buoi: 'sang' | 'chieu') => {
      const isKham = vaiTro === 'Bác sĩ';
      let total = 0;
      appointments.forEach((apt) => {
        if (apt.buoi !== buoi) return;
        if (!['da_checkin', 'dang_kham'].includes(apt.trang_thai)) return;
        const matchNhom = isKham ? apt.loai_lich === 'kham_moi' : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
        if (!matchNhom) return;
        total += Number(apt.thoi_luong_phut) || 30;
      });
      return total;
    };

    const buoiList: Array<'sang' | 'chieu'> = ['sang', 'chieu'];
    const roles: Array<{ key: string; label: string }> =
      activeType === 'kham'
        ? [{ key: 'Bác sĩ', label: 'Chuyên viên' }]
        : [{ key: 'Kỹ thuật viên', label: 'KTV' }];

    return buoiList.map((buoi) => ({
      buoi,
      label: BUOI_LABEL[buoi],
      isCurrent: isToday && nowMins >= BUOI_WINDOW[buoi].start && nowMins < BUOI_WINDOW[buoi].end,
      isPast: isPastDate || (isToday && nowMins >= BUOI_WINDOW[buoi].end),
      roles: roles.map((r) => {
        const capacity = capacityFor(r.key, buoi);
        const demand = demandFor(r.key, buoi);
        return { label: r.label, capacity, demand, over: demand > capacity && capacity >= 0 };
      }),
    }));
  }, [appointments, staffList, schedulesList, selectedDateStr, activeType]);
}

export function ShiftHealthWidget({
  sucKhoeCa,
  onOpenWorkloadModal
}: {
  sucKhoeCa: Array<{
    buoi: string;
    label: string;
    isCurrent: boolean;
    isPast: boolean;
    roles: Array<{ label: string; capacity: number; demand: number; over: boolean }>;
  }>;
  onOpenWorkloadModal?: () => void;
}) {
  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#0d9488] dark:text-teal-400 flex items-center justify-center font-bold">
            <Activity size={14} />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
              Sức khỏe ca
            </span>
          </div>
        </div>

        {onOpenWorkloadModal && (
          <button
            type="button"
            onClick={onOpenWorkloadModal}
            className="text-[10px] font-black text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline underline-offset-2 shrink-0 cursor-pointer"
          >
            Tải nhân sự →
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {sucKhoeCa.map((ca) => (
          <div
            key={ca.buoi}
            className={`rounded-xl p-2.5 border transition-all ${
              ca.isCurrent
                ? 'bg-teal-50/60 dark:bg-teal-955/20 border-teal-200 dark:border-teal-900/50'
                : 'bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200/60 dark:border-zinc-700/60'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-black text-slate-700 dark:text-zinc-200 flex items-center gap-1">
                {ca.buoi === 'sang' ? <Sun size={11} className="text-amber-500" /> : <Moon size={11} className="text-indigo-400" />}
                {ca.label}
              </span>
              {ca.isCurrent && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-teal-600 text-white uppercase tracking-wider">
                  Đang diễn ra
                </span>
              )}
            </div>

            {ca.roles.map((r) => {
              const remaining = r.capacity - r.demand;
              return (
                <div key={r.label} className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span>{r.label}:</span>
                    <span className={`font-mono font-bold ${r.over ? 'text-rose-600' : 'text-slate-900 dark:text-zinc-100'}`}>
                      {fmtMinutes(r.demand)} / {fmtMinutes(r.capacity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-400">Còn lại:</span>
                    <span className={`font-mono font-black ${remaining <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {fmtMinutes(remaining)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
