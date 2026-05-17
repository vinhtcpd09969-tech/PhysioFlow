import { X, Activity } from 'lucide-react';

interface AppointmentDetailModalProps {
  selectedAppointment: any;
  roomsList: any[];
  staffList: any[];
  activeRole: string;
  assignRoomId: string;
  setAssignRoomId: (val: string) => void;
  assignStaffId: string;
  setAssignStaffId: (val: string) => void;
  assignStatus: string;
  setAssignStatus: (val: string) => void;
  isAssigning: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onOpenTreatment: () => void;
}

export default function AppointmentDetailModal({
  selectedAppointment,
  roomsList,
  staffList,
  activeRole,
  assignRoomId,
  setAssignRoomId,
  assignStaffId,
  setAssignStaffId,
  assignStatus,
  setAssignStatus,
  isAssigning,
  onClose,
  onSave,
  onOpenTreatment
}: AppointmentDetailModalProps) {
  if (!selectedAppointment) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Hồ sơ Lịch hẹn <span className="text-emerald-600">#{selectedAppointment.ma_lich_dat}</span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">Thông tin chi tiết và điều phối phòng khám</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Khách hàng</label>
              <span className="text-base font-bold text-slate-800 block mt-1">{selectedAppointment.ten_khach_hang}</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Số điện thoại</label>
              <span className="text-base font-medium text-slate-800 block mt-1">{selectedAppointment.so_dien_thoai}</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Thời gian</label>
              <span className="text-base font-bold text-emerald-600 block mt-1 font-mono">
                {selectedAppointment.ngay_gio_bat_dau.split('T')[1]?.substring(0,5)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Điều phối & Trạng thái</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Phòng thực hiện</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={assignRoomId}
                  onChange={(e) => setAssignRoomId(e.target.value)}
                >
                  <option value="">-- Chưa xếp phòng --</option>
                  {roomsList.map(r => (
                    <option key={r.id} value={r.id}>{r.ten_phong}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Nhân sự phụ trách</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                >
                  <option value="">-- Chưa phân công --</option>
                  {staffList.filter(s => s.vai_tro === activeRole).map(s => (
                    <option key={s.ky_thuat_vien_id || s.id} value={s.ky_thuat_vien_id || ''}>
                      {s.ho_ten}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Trạng thái ca trực</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value)}
                >
                  <option value="cho_xac_nhan">Chờ xác nhận</option>
                  <option value="da_xac_nhan">Đã xác nhận</option>
                  <option value="da_checkin">Đã Check-in</option>
                  <option value="hoan_thanh">Hoàn thành</option>
                  <option value="da_huy">Đã hủy</option>
                  <option value="khong_den">Không đến</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            {selectedAppointment.loai_lich === 'kham_moi' ? (
              <button 
                type="button"
                onClick={onOpenTreatment}
                className="px-5 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 flex items-center gap-2 transition-all"
              >
                <Activity size={16} />
                Đặt lịch Điều trị tiếp nối
              </button>
            ) : <div></div>}

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
              >
                Đóng
              </button>
              <button 
                type="submit"
                disabled={isAssigning}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {isAssigning ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
