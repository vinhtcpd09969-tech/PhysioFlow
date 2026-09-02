import { useState, useMemo } from 'react';
import { Search, PhoneCall, Play, AlertCircle, UserCheck } from 'lucide-react';

export interface QueuePatient {
  id: string; // appointment_id
  ma_cuoc_hen: string;
  ma_khach_hang?: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  tuoi?: number;
  gioi_tinh?: string;
  ly_do_kham?: string;
  ngay_gio_bat_dau: string;
  trang_thai: 'da_checkin' | 'dang_kham' | 'cho_tai_luong_gia' | 'hoan_thanh';
  thoi_gian_checkin?: string;
  so_lan_goi_khong_co_mat?: number;
  ten_bac_si?: string;
}

interface ClinicalQueueSidebarProps {
  queue: QueuePatient[];
  activePatientId?: string;
  onSelectPatient: (patient: QueuePatient) => void;
  onCallIn: (patientId: string) => void;
  onStartSession: (patientId: string) => void;
  onMarkAbsent: (patientId: string) => void;
  isKtv?: boolean;
}

export function ClinicalQueueSidebar({
  queue,
  activePatientId,
  onSelectPatient,
  onCallIn,
  onStartSession,
  onMarkAbsent,
  isKtv = false,
}: ClinicalQueueSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'active'>('all');

  const filteredQueue = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return queue.filter((p) => {
      const matchSearch =
        !term ||
        p.ten_khach_hang.toLowerCase().includes(term) ||
        (p.so_dien_thoai && p.so_dien_thoai.includes(term)) ||
        (p.ma_khach_hang && p.ma_khach_hang.toLowerCase().includes(term)) ||
        p.ma_cuoc_hen.toLowerCase().includes(term);

      const matchStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'waiting'
          ? p.trang_thai === 'da_checkin'
          : p.trang_thai === 'dang_kham';

      return matchSearch && matchStatus;
    });
  }, [queue, searchTerm, filterStatus]);

  const waitingCount = queue.filter((q) => q.trang_thai === 'da_checkin').length;
  const activeCount = queue.filter((q) => q.trang_thai === 'dang_kham').length;

  return (
    <aside className="w-full lg:w-80 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 flex flex-col h-[calc(100vh-120px)] sticky top-20 shadow-sm">
      {/* Header Hàng Đợi */}
      <div className="pb-3 border-b border-slate-100 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-cyan-600/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              📋
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-slate-900 dark:text-zinc-100">
                HÀNG ĐỢI {isKtv ? 'TRỊ LIỆU' : 'LƯỢNG GIÁ'}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Tổng: <strong className="text-slate-800 dark:text-zinc-200">{queue.length}</strong> bệnh nhân
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              {waitingCount} Chờ
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
              {activeCount} Đang khám
            </span>
          </div>
        </div>

        {/* Ô Tìm Kiếm Tra Cứu */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, SĐT, Mã KH..."
            className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-800 dark:text-zinc-200"
          />
        </div>

        {/* Bộ Lọc Trạng Thái Thao Tác */}
        <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
            }`}
          >
            Tất cả ({queue.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('waiting')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              filterStatus === 'waiting'
                ? 'bg-white dark:bg-zinc-700 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
            }`}
          >
            Đang chờ ({waitingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-white dark:bg-zinc-700 text-cyan-700 dark:text-cyan-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
            }`}
          >
            Đang khám ({activeCount})
          </button>
        </div>
      </div>

      {/* Danh Sách Thẻ Bệnh Nhận Hàng Đợi */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 hide-scrollbar">
        {filteredQueue.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs font-semibold">
            Không tìm thấy bệnh nhân trong hàng đợi.
          </div>
        ) : (
          filteredQueue.map((patient, index) => {
            const isActive = patient.id === activePatientId;
            const isWaiting = patient.trang_thai === 'da_checkin';
            const isClinical = patient.trang_thai === 'dang_kham';
            const isReassessment = patient.trang_thai === 'cho_tai_luong_gia';

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-2 border-cyan-600 dark:border-cyan-500 shadow-sm'
                    : 'bg-white dark:bg-zinc-800/80 border-slate-200/90 dark:border-zinc-700/80 hover:border-cyan-300 dark:hover:border-zinc-600'
                }`}
              >
                {/* Số thứ tự hàng đợi */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-cyan-600 transition-colors">
                        {patient.ten_khach_hang}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                        {patient.ma_khach_hang || 'KH-88392'} · {patient.tuoi ? `${patient.tuoi} tuổi` : 'Nam'}
                      </p>
                    </div>
                  </div>

                  {/* Badge Trạng Thái */}
                  {isWaiting && (
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Đang chờ
                    </span>
                  )}
                  {isClinical && (
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                      Đang khám
                    </span>
                  )}
                  {isReassessment && (
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      Tái lượng giá
                    </span>
                  )}
                </div>

                {/* Lý do khám & Thời gian check-in */}
                {patient.ly_do_kham && (
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-2 line-clamp-1 italic font-medium">
                    "{patient.ly_do_kham}"
                  </p>
                )}

                {/* Cảnh báo gọi không có mặt nếu count > 0 */}
                {patient.so_lan_goi_khong_co_mat && patient.so_lan_goi_khong_co_mat > 0 ? (
                  <div className="mt-2 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle size={12} /> Đã gọi vắng {patient.so_lan_goi_khong_co_mat} lần
                  </div>
                ) : null}

                {/* NÚT THAO TÁC THEO LUỒNG NGHỆP VỤ */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-700/60 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {isWaiting && (
                    <>
                      <button
                        type="button"
                        onClick={() => onCallIn(patient.id)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] transition-all flex items-center justify-center gap-1 border border-cyan-200 dark:border-cyan-800 cursor-pointer"
                      >
                        <PhoneCall size={12} /> Gọi vào
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartSession(patient.id)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Play size={12} /> Bắt đầu
                      </button>
                    </>
                  )}

                  {isClinical && (
                    <button
                      type="button"
                      onClick={() => onSelectPatient(patient)}
                      className="w-full py-1.5 px-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <UserCheck size={12} /> Vào bàn khám
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onMarkAbsent(patient.id)}
                    title="Gọi không có mặt"
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-zinc-700 dark:hover:bg-rose-950/50 dark:text-zinc-400 dark:hover:text-rose-400 transition-all cursor-pointer shrink-0"
                  >
                    <AlertCircle size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
