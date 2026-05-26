
import { X, Activity, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  onOpenTreatment: (type?: 'single' | 'package', recId?: string) => void;
  appointments?: any[];
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
  onOpenTreatment,
  appointments = []
}: AppointmentDetailModalProps) {
  const navigate = useNavigate();


  if (!selectedAppointment) return null;

  // Logic kiểm tra phòng trống & bác sĩ rảnh dựa vào khung giờ hẹn
  const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 < e2 && e1 > s2;
  };

  const currentStart = selectedAppointment.ngay_gio_bat_dau;
  const currentEnd = selectedAppointment.ngay_gio_ket_thuc;

  const overlappingApts = appointments.filter(apt => 
    apt.id !== selectedAppointment.id && 
    apt.trang_thai !== 'da_huy' &&
    apt.trang_thai !== 'khong_den' &&
    isOverlapping(currentStart, currentEnd, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
  );

  const occupiedStaffIds = overlappingApts.map(apt => apt.ky_thuat_vien_id).filter(Boolean);
  const occupiedRoomIds = overlappingApts.map(apt => String(apt.phong_id)).filter(Boolean);

  const availableRooms = roomsList.filter(room => 
    !occupiedRoomIds.includes(String(room.id)) || String(room.id) === String(selectedAppointment.phong_id)
  );
  
  const availableStaff = staffList.filter(staff => 
    !occupiedStaffIds.includes(staff.ky_thuat_vien_id || staff.id) || (staff.ky_thuat_vien_id || staff.id) === selectedAppointment.ky_thuat_vien_id
  );

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
                {selectedAppointment.ngay_gio_bat_dau.split('T')[1]?.substring(0, 5)}
              </span>
            </div>
          </div>

          {/* Medical Record Section (Read-only for KTV during Treatment) */}
          {selectedAppointment.loai_lich === 'dieu_tri' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Hồ sơ Bệnh án
              </h4>
              <div className="space-y-3">
                {selectedAppointment.chan_doan && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 border-l-4 border-l-blue-500">
                    <p className="text-xs font-bold text-slate-500 uppercase">Chẩn đoán từ Bác sĩ</p>
                    <p className="text-sm text-slate-800 mt-1">{selectedAppointment.chan_doan}</p>
                  </div>
                )}
                {selectedAppointment.chong_chi_dinh && (
                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 border-l-4 border-l-rose-500">
                    <p className="text-xs font-bold text-rose-700 uppercase flex items-center gap-1"><AlertCircle size={14} /> Chống chỉ định (CẢNH BÁO)</p>
                    <p className="text-sm text-rose-900 mt-1">{selectedAppointment.chong_chi_dinh}</p>
                  </div>
                )}
                {!selectedAppointment.chan_doan && !selectedAppointment.chong_chi_dinh && (
                  <p className="text-sm text-slate-500 italic">Không có hồ sơ bệnh án.</p>
                )}
              </div>
            </div>
          )}


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
                  {availableRooms.map(r => (
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
                  {availableStaff.filter(s => s.vai_tro === activeRole).map(s => (
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
                  <option value="chua_xac_nhan">Chưa xác nhận</option>
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
            {selectedAppointment.loai_lich === 'kham_moi' && selectedAppointment.trang_thai === 'hoan_thanh' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenTreatment('single')}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 flex items-center gap-2 transition-all"
                >
                  <Activity size={16} /> Đặt Lịch
                </button>
                {(selectedAppointment.khuyen_nghi_dich_vu_id || selectedAppointment.khuyen_nghi_goi_id) && (
                  <button
                    type="button"
                    onClick={() => onOpenTreatment(selectedAppointment.khuyen_nghi_dich_vu_id ? 'single' : 'package', selectedAppointment.khuyen_nghi_dich_vu_id || selectedAppointment.khuyen_nghi_goi_id)}
                    className="px-4 py-2.5 bg-teal-600 text-white shadow-sm text-sm font-bold rounded-xl hover:bg-teal-700 flex items-center gap-2 transition-all animate-pulse"
                  >
                    🚀 Đặt theo Khuyến nghị
                  </button>
                )}
              </div>
            ) : selectedAppointment.loai_lich === 'dieu_tri' && Number(selectedAppointment.so_thu_tu_buoi) === 1 && selectedAppointment.trang_thai === 'hoan_thanh' ? (
              <button
                type="button"
                onClick={() => {
                  navigate(`/admin/quick-billing?lich_dat_id=${selectedAppointment.id}`);
                  onClose();
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-sm font-black rounded-xl flex items-center gap-2 transition-all animate-pulse"
              >
                💵 Thanh toán Gói trị liệu
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
