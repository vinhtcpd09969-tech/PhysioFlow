import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateAppointmentStatus as updateAppointmentStatusAdmin } from '../../../api/admin.api';
import { updateAppointmentStatus as updateAppointmentStatusRec } from '../../../../receptionist/api/receptionist.api';

interface DetailFooterProps {
  selectedAppointment: any;
  isReceptionist: boolean;
  hideBilling: boolean;
  isAssigning: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  assignStaffId: string;
  assignRoomId: string;
  localGhiChuNoiBo: string;
  isUnconfirmedState: boolean;
  setAssignStatus: (status: string) => void;
  setCancelReason?: (reason: string) => void;
  setShowConfirmType?: (val: 'save' | 'cancel' | 'receptionist_confirm' | null) => void;
}

export function DetailFooter({
  selectedAppointment,
  isReceptionist,
  hideBilling,
  isAssigning,
  onClose,
  onSuccess,
  assignStaffId,
  assignRoomId,
  localGhiChuNoiBo,
  isUnconfirmedState,
  setAssignStatus
}: DetailFooterProps) {
  const navigate = useNavigate();

  return (
    <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
      {/* Left actions */}
      {selectedAppointment.loai_lich === 'kham_moi' && selectedAppointment.trang_thai === 'hoan_thanh' ? (
        <div className="flex gap-2">
          {selectedAppointment.trang_thai_thanh_toan === 'da_thanh_toan' ? (
            <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-250 text-emerald-600 text-xs font-black rounded-xl flex items-center gap-1.5 select-none uppercase tracking-wider">
              🟢 Đã thanh toán khám
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                onClose();
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all"
            >
              💵 Thanh toán / Lập gói
            </button>
          )}
        </div>
      ) : !hideBilling && selectedAppointment.loai_lich === 'dieu_tri' && selectedAppointment.trang_thai === 'hoan_thanh' ? (
        <div className="flex gap-2">
          {(selectedAppointment.trang_thai_hoa_don_goi === 'da_thanh_toan' || 
            Number(selectedAppointment.so_tien_da_tra_goi) >= Number(selectedAppointment.tong_tien_phai_tra_goi) ||
            selectedAppointment.hinh_thuc_thanh_toan_goi === 'tra_thang' ||
            (selectedAppointment.hinh_thuc_thanh_toan_goi === 'tra_gop' && Number(selectedAppointment.so_thu_tu_buoi) !== 5)) ? (
            <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-250 text-emerald-600 text-xs font-black rounded-xl flex items-center gap-1.5 select-none uppercase tracking-wider">
              🟢 Đã thanh toán liệu trình
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                onClose();
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all"
            >
              💵 Thanh toán ngay (Buổi {selectedAppointment.so_thu_tu_buoi || 1})
            </button>
          )}
        </div>
      ) : selectedAppointment.loai_lich === 'dieu_tri' && selectedAppointment.trang_thai === 'da_xac_nhan' && isReceptionist ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isAssigning}
            onClick={async () => {
              if (!assignRoomId) {
                toast.error('Vui lòng chọn phòng thực hiện!');
                return;
              }
              if (!assignStaffId) {
                toast.error('Vui lòng chọn kỹ thuật viên phụ trách!');
                return;
              }

              const toastId = toast.loading('Đang xác thực lịch trực và gửi thông báo...');
              try {
                const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
                await updateFn(selectedAppointment.id, {
                  trang_thai: 'da_checkin',
                  bac_si_id: assignStaffId || null,
                  chuyen_gia_id: assignStaffId || null,
                  phong_id: assignRoomId || null
                });
                toast.success('Xác thực lịch và gửi thông báo thành công!', { id: toastId });
                onClose();
                if (onSuccess) onSuccess();
              } catch (error: any) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Lỗi xác thực lịch trực', { id: toastId });
              }
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all animate-pulse"
          >
            💵 Xác thực & Gửi thông báo
          </button>
          <button
            type="button"
            disabled={isAssigning}
            onClick={async () => {
              const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?');
              if (!confirmCancel) return;
              
              const reason = window.prompt('Vui lòng nhập lý do hủy lịch hẹn:');
              if (reason === null) return;
              
              const trimmedReason = reason.trim();
              if (!trimmedReason) {
                toast.error('Vui lòng nhập lý do hủy lịch!');
                return;
              }

              const toastId = toast.loading('Đang hủy lịch...');
              try {
                const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
                await updateFn(selectedAppointment.id, {
                  trang_thai: 'da_huy',
                  ghi_chu_noi_bo: localGhiChuNoiBo,
                  ly_do_huy: trimmedReason
                });
                toast.success('Đã hủy lịch hẹn thành công!', { id: toastId });
                onClose();
                if (onSuccess) onSuccess();
              } catch (error: any) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Lỗi khi hủy lịch hẹn', { id: toastId });
              }
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-750 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 text-center justify-center flex-1 sm:flex-none"
          >
            ❌ Hủy lịch
          </button>
        </div>
      ) : selectedAppointment.loai_lich === 'kham_moi' && selectedAppointment.trang_thai === 'da_xac_nhan' && isReceptionist ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isAssigning}
            onClick={async () => {
              const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?');
              if (!confirmCancel) return;
              
              const reason = window.prompt('Vui lòng nhập lý do hủy lịch hẹn:');
              if (reason === null) return;
              
              const trimmedReason = reason.trim();
              if (!trimmedReason) {
                toast.error('Vui lòng nhập lý do hủy lịch!');
                return;
              }

              const toastId = toast.loading('Đang hủy lịch...');
              try {
                const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
                await updateFn(selectedAppointment.id, {
                  trang_thai: 'da_huy',
                  ghi_chu_noi_bo: localGhiChuNoiBo,
                  ly_do_huy: trimmedReason
                });
                toast.success('Đã hủy lịch hẹn thành công!', { id: toastId });
                onClose();
                if (onSuccess) onSuccess();
              } catch (error: any) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Lỗi khi hủy lịch hẹn', { id: toastId });
              }
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-750 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 text-center justify-center flex-1 sm:flex-none"
          >
            ❌ Hủy lịch
          </button>
        </div>
      ) : isUnconfirmedState ? (
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            disabled={isAssigning}
            onClick={async () => {
              const confirmForward = window.confirm('Bạn có chắc chắn muốn xác nhận liên hệ và chuyển tiếp cho Quản lý không?');
              if (!confirmForward) return;
              
              const toastId = toast.loading('Đang cập nhật trạng thái...');
              try {
                const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
                await updateFn(selectedAppointment.id, {
                  trang_thai: 'cho_xac_nhan',
                  ghi_chu_noi_bo: localGhiChuNoiBo
                });
                toast.success('Đã xác nhận liên hệ và chuyển tiếp cho Quản lý!', { id: toastId });
                onClose();
                if (onSuccess) onSuccess();
              } catch (error: any) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái', { id: toastId });
              }
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 text-center justify-center flex-1 sm:flex-none"
          >
            📞 Xác nhận & Chuyển Quản lý
          </button>
          <button
            type="button"
            disabled={isAssigning}
            onClick={async () => {
              const confirmSaveNote = window.confirm('Bạn có chắc chắn muốn lưu ghi chú cuộc gọi không?');
              if (!confirmSaveNote) return;
              
              const toastId = toast.loading('Đang lưu ghi chú cuộc gọi...');
              try {
                const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
                await updateFn(selectedAppointment.id, {
                  trang_thai: selectedAppointment.trang_thai,
                  ghi_chu_noi_bo: localGhiChuNoiBo
                });
                toast.success('Đã lưu ghi chú cuộc gọi thành công!', { id: toastId });
                if (onSuccess) onSuccess();
              } catch (error: any) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Lỗi khi lưu ghi chú cuộc gọi', { id: toastId });
              }
            }}
            className="px-4 py-2.5 bg-slate-500 hover:bg-slate-650 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 text-center justify-center flex-1 sm:flex-none"
          >
            💾 Lưu ghi chú cuộc gọi
          </button>
          <button
            type="button"
            disabled={isAssigning}
            onClick={async () => {
              const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?');
              if (!confirmCancel) return;
              
              const reason = window.prompt('Vui lòng nhập lý do hủy lịch hẹn:');
              if (reason === null) return;
              
              const trimmedReason = reason.trim();
              if (!trimmedReason) {
                toast.error('Vui lòng nhập lý do hủy lịch!');
                return;
              }

              const toastId = toast.loading('Đang hủy lịch...');
              try {
                const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
                await updateFn(selectedAppointment.id, {
                  trang_thai: 'da_huy',
                  ghi_chu_noi_bo: localGhiChuNoiBo,
                  ly_do_huy: trimmedReason
                });
                toast.success('Đã hủy lịch hẹn thành công!', { id: toastId });
                onClose();
                if (onSuccess) onSuccess();
              } catch (error: any) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Lỗi khi hủy lịch hẹn', { id: toastId });
              }
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-750 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 text-center justify-center flex-1 sm:flex-none"
          >
            ❌ Hủy lịch
          </button>
        </div>
      ) : <div />}

      {/* Right actions */}
      <div className="flex gap-2 ml-auto">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-400 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all"
        >
          Đóng
        </button>
        
        {selectedAppointment.trang_thai === 'da_xac_nhan' && (selectedAppointment.loai_lich === 'kham_moi' || !isReceptionist) && (
          <button
            type="submit"
            onClick={() => setAssignStatus('da_checkin')}
            disabled={isAssigning}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 animate-pulse"
          >
            🛎️ Check-in Khách
          </button>
        )}
        
        {(!isReceptionist || selectedAppointment.loai_lich === 'kham_moi') && (
          <button
            type="submit"
            disabled={isAssigning || selectedAppointment.trang_thai === 'hoan_thanh'}
            className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? 'Đang lưu...' : 'Lưu cập nhật'}
          </button>
        )}
      </div>
    </div>
  );
}
