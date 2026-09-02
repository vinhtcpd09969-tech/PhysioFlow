import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Check, Clock, Undo2, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react';
import { statusConfig } from '../../appointmentStatusConfig';

interface StatusAndBillingSectionProps {
  selectedAppointment: any;
  assignStatus: string;
  isEditingStatus: boolean;
  setIsEditingStatus: (val: boolean) => void;
  handleStatusChange: (val: string) => void;
  handleUndoStatusChange: () => void;
  setIsStatusHistoryOpen: (val: boolean) => void;
  isReceptionist: boolean;
  isReceptionistLocked: boolean;
  receptionistActionOptions: { value: string; label: string }[];
  onClose: () => void;
}

export const StatusAndBillingSection: React.FC<StatusAndBillingSectionProps> = ({
  selectedAppointment,
  assignStatus,
  isEditingStatus,
  setIsEditingStatus,
  handleStatusChange,
  handleUndoStatusChange,
  setIsStatusHistoryOpen,
  isReceptionist,
  isReceptionistLocked,
  receptionistActionOptions,
  onClose
}) => {
  const navigate = useNavigate();

  const currentStatusInfo = statusConfig[assignStatus] || statusConfig[selectedAppointment?.trang_thai] || {
    label: assignStatus || selectedAppointment?.trang_thai || 'Chưa xác định',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null
  };

  const hasPendingStatusChange = !!assignStatus && assignStatus !== selectedAppointment?.trang_thai;
  const isPaid = selectedAppointment.trang_thai_thanh_toan === 'da_thanh_toan';
  const isPendingPay = selectedAppointment.trang_thai_thanh_toan === 'dang_cho_thanh_toan';

  return (
    <div className="space-y-2 font-jakarta select-none">
      {/* 2 matching column titles above the card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          Trạng thái lịch hẹn
        </label>
        <label className="hidden md:block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
          Trạng thái thanh toán
        </label>
      </div>

      {/* 1. Khối Trạng thái ca hẹn & Thanh toán */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        {!isEditingStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            
            {/* Cột trái: Trạng thái lâm sàng & Các nút thao tác */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs ${currentStatusInfo.color} ${hasPendingStatusChange ? 'border-dashed ring-2 ring-amber-500/20' : ''}`}>
                {currentStatusInfo.icon}
                <span>{currentStatusInfo.label}</span>
                {hasPendingStatusChange && <span className="text-[10px] font-medium opacity-80">(chưa lưu)</span>}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {hasPendingStatusChange && (
                  <button
                    type="button"
                    onClick={handleUndoStatusChange}
                    className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border border-amber-200 dark:border-amber-800/50 shadow-2xs"
                  >
                    <Undo2 size={13} />
                    <span>Hoàn tác</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsStatusHistoryOpen(true)}
                  className="size-8 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 dark:border-zinc-700/60 shadow-2xs"
                  title="Lịch sử trạng thái"
                >
                  <Clock size={14} />
                </button>
                {(!isReceptionist || !isReceptionistLocked) && (
                  <button
                    type="button"
                    onClick={() => setIsEditingStatus(true)}
                    className="size-8 flex items-center justify-center text-teal-600 hover:text-teal-700 dark:text-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 rounded-xl transition-all cursor-pointer border border-teal-200/80 dark:border-teal-800/50 shadow-2xs"
                    title="Đổi trạng thái"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Cột phải: Trạng thái thanh toán (Luôn hiển thị) */}
            <div className="flex items-center gap-2.5 flex-wrap md:border-l md:border-slate-100 md:dark:border-zinc-800 md:pl-4">
              <label className="block md:hidden text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1 w-full">
                Trạng thái thanh toán
              </label>

              {isPendingPay ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 shadow-2xs">
                  ⏳ Đang xác nhận thanh toán…
                </span>
              ) : isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs">
                  ✓ Đã thanh toán
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/40 shadow-2xs">
                    ⚠ Chưa thanh toán
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                      navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs shadow-amber-500/20"
                  >
                    <DollarSign size={13} />
                    <span>Thu tiền</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="space-y-3 pt-1 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                Chọn trạng thái mới
              </span>
              <button
                type="button"
                onClick={() => setIsEditingStatus(false)}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Thu gọn
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(isReceptionist
                ? receptionistActionOptions.map(opt => ({ value: opt.value, label: opt.label }))
                : [
                    { value: 'da_xac_nhan', label: 'Đã xác nhận' },
                    { value: 'da_checkin', label: 'Đã check-in' },
                    { value: 'dang_kham', label: 'Đang thực hiện' },
                    { value: 'hoan_thanh', label: 'Hoàn thành' },
                    { value: 'da_huy', label: 'Đã hủy' },
                    { value: 'khong_den', label: 'Không đến' }
                  ]
              ).map((st) => {
                const meta = statusConfig[st.value] || { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
                const isSelected = assignStatus === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => {
                      handleStatusChange(st.value);
                      setIsEditingStatus(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${meta.color} ${
                      isSelected ? 'ring-2 ring-teal-500 font-extrabold shadow-md scale-[1.02]' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    {meta.icon}
                    <span>{st.label}</span>
                    {isSelected && <Check size={14} className="text-teal-600 ml-0.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Thẻ chỉ định gói liệu trình */}
      {['kham_moi', 'KHAM', 'kham'].includes(selectedAppointment.loai_lich) && (selectedAppointment.khuyen_nghi_goi_id || selectedAppointment.khuyen_nghi_ten_goi || selectedAppointment.ten_goi_khuyen_nghi) && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-50/90 via-emerald-50/40 to-teal-50/60 dark:from-teal-950/40 dark:via-zinc-900 dark:to-teal-950/20 border border-teal-200/90 dark:border-teal-800/60 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs shadow-teal-600/30">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Gói liệu trình được chỉ định
                </span>
                {selectedAppointment.tong_so_buoi_goi && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-100/90 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                    {selectedAppointment.tong_so_buoi_goi} buổi
                  </span>
                )}
              </div>
              <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100 truncate mt-0.5">
                {selectedAppointment.ten_goi_khuyen_nghi || selectedAppointment.khuyen_nghi_ten_goi || selectedAppointment.khuyen_nghi_goi_ten || 'Gói trị liệu chuyên sâu'}
              </h5>
            </div>
          </div>

          <div className="shrink-0">
            {selectedAppointment.khuyen_nghi_phac_do_id ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-300/80 dark:border-emerald-800">
                <CheckCircle2 size={14} />
                Đã kích hoạt phác đồ
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                  navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-white text-xs font-black shadow-md shadow-amber-500/25 transition-all cursor-pointer uppercase tracking-wider"
              >
                <DollarSign size={14} />
                <span>Thanh toán gói liệu trình</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
