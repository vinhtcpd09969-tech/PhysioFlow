import { useState, useEffect } from 'react';
import { X, Activity, AlertCircle } from 'lucide-react';

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
  services?: any[];
  packages?: any[];
  onSaveMedicalRecord?: (data: any) => void;
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
  services = [],
  packages = [],
  onSaveMedicalRecord
}: AppointmentDetailModalProps) {
  const [chanDoan, setChanDoan] = useState(selectedAppointment?.chan_doan || '');
  const [chongChiDinh, setChongChiDinh] = useState(selectedAppointment?.chong_chi_dinh || '');
  const [khuyenNghiDVT, setKhuyenNghiDVT] = useState<'none' | 'single' | 'package'>('none');
  const [khuyenNghiDichVuId, setKhuyenNghiDichVuId] = useState(selectedAppointment?.khuyen_nghi_dich_vu_id || '');
  const [khuyenNghiGoiId, setKhuyenNghiGoiId] = useState(selectedAppointment?.khuyen_nghi_goi_id || '');
  const [isSavingMedical, setIsSavingMedical] = useState(false);

  useEffect(() => {
    if (selectedAppointment) {
      setChanDoan(selectedAppointment.chan_doan || '');
      setChongChiDinh(selectedAppointment.chong_chi_dinh || '');
      if (selectedAppointment.khuyen_nghi_dich_vu_id) {
        setKhuyenNghiDVT('single');
        setKhuyenNghiDichVuId(selectedAppointment.khuyen_nghi_dich_vu_id);
      } else if (selectedAppointment.khuyen_nghi_goi_id) {
        setKhuyenNghiDVT('package');
        setKhuyenNghiGoiId(selectedAppointment.khuyen_nghi_goi_id);
      } else {
        setKhuyenNghiDVT('none');
      }
    }
  }, [selectedAppointment]);

  const handleSaveMedical = async () => {
    if (onSaveMedicalRecord) {
      setIsSavingMedical(true);
      await onSaveMedicalRecord({
        chan_doan: chanDoan,
        chong_chi_dinh: chongChiDinh,
        khuyen_nghi_dich_vu_id: khuyenNghiDVT === 'single' ? khuyenNghiDichVuId : null,
        khuyen_nghi_goi_id: khuyenNghiDVT === 'package' ? khuyenNghiGoiId : null
      });
      setIsSavingMedical(false);
    }
  };

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
                {selectedAppointment.ngay_gio_bat_dau.split('T')[1]?.substring(0, 5)}
              </span>
            </div>
          </div>

          {/* Medical Record Section (Read/Write depending on role & status) */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex justify-between items-center">
              Hồ sơ Bệnh án
              {selectedAppointment.loai_lich === 'kham_moi' && (
                <button type="button" onClick={handleSaveMedical} disabled={isSavingMedical} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold hover:bg-emerald-200">
                  {isSavingMedical ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              )}
            </h4>

            {selectedAppointment.loai_lich === 'kham_moi' ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Chẩn đoán (Bác sĩ ghi)</label>
                  <textarea
                    value={chanDoan}
                    onChange={e => setChanDoan(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                    placeholder="Ghi nhận tình trạng bệnh..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-rose-600 block mb-1">Chống chỉ định (Lưu ý cho KTV)</label>
                  <textarea
                    value={chongChiDinh}
                    onChange={e => setChongChiDinh(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-sm outline-none focus:border-rose-500 placeholder-rose-200"
                    placeholder="Không được xoa bóp mạnh, tránh nhiệt..."
                    rows={2}
                  />
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <label className="text-xs font-semibold text-emerald-600 block mb-2">Khuyến nghị Điều trị</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" checked={khuyenNghiDVT === 'none'} onChange={() => setKhuyenNghiDVT('none')} /> Không</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" checked={khuyenNghiDVT === 'single'} onChange={() => setKhuyenNghiDVT('single')} /> Dịch vụ lẻ</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" checked={khuyenNghiDVT === 'package'} onChange={() => setKhuyenNghiDVT('package')} /> Gói trị liệu</label>
                  </div>
                  {khuyenNghiDVT === 'single' && (
                    <select value={khuyenNghiDichVuId} onChange={e => setKhuyenNghiDichVuId(e.target.value)} className="w-full mt-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none">
                      <option value="">-- Chọn dịch vụ --</option>
                      {services.filter(s => !s.ten_dich_vu.toLowerCase().includes('khám')).map(s => <option key={s.id} value={s.id}>{s.ten_dich_vu}</option>)}
                    </select>
                  )}
                  {khuyenNghiDVT === 'package' && (
                    <select value={khuyenNghiGoiId} onChange={e => setKhuyenNghiGoiId(e.target.value)} className="w-full mt-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none">
                      <option value="">-- Chọn gói --</option>
                      {packages.map(p => <option key={p.id} value={p.id}>{p.ten_goi}</option>)}
                    </select>
                  )}
                </div>
              </div>
            ) : (
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
            )}
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
