import { X } from 'lucide-react';

interface TreatmentBookingModalProps {
  selectedAppointment: any;
  services: any[];
  packages: any[];
  staffList: any[];
  roomsList: any[];
  treatmentType: 'single' | 'package';
  setTreatmentType: (val: 'single' | 'package') => void;
  selectedServiceId: string;
  setSelectedServiceId: (val: string) => void;
  selectedPackageId: string;
  setSelectedPackageId: (val: string) => void;
  selectedKtvId: string;
  setSelectedKtvId: (val: string) => void;
  selectedRoomId: string;
  setSelectedRoomId: (val: string) => void;
  treatmentDate: string;
  setTreatmentDate: (val: string) => void;
  treatmentTime: string;
  setTreatmentTime: (val: string) => void;
  bookingLoading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TreatmentBookingModal({
  selectedAppointment,
  services,
  packages,
  staffList,
  roomsList,
  treatmentType,
  setTreatmentType,
  selectedServiceId,
  setSelectedServiceId,
  selectedPackageId,
  setSelectedPackageId,
  selectedKtvId,
  setSelectedKtvId,
  selectedRoomId,
  setSelectedRoomId,
  treatmentDate,
  setTreatmentDate,
  treatmentTime,
  setTreatmentTime,
  bookingLoading,
  onClose,
  onSubmit
}: TreatmentBookingModalProps) {
  if (!selectedAppointment) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Đặt lịch Điều trị</h3>
            <p className="text-sm text-slate-500 mt-1">Chỉ định chuyên sâu cho bệnh nhân</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Bệnh nhân:</span>
            <span className="text-base font-bold text-slate-800">{selectedAppointment.ten_khach_hang}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Loại hình điều trị</label>
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button type="button" onClick={() => setTreatmentType('single')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${treatmentType === 'single' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Dịch vụ lẻ</button>
              <button type="button" onClick={() => setTreatmentType('package')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${treatmentType === 'package' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Dịch vụ gói</button>
            </div>
          </div>

          {treatmentType === 'single' ? (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Chọn dịch vụ lẻ *</label>
              <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                <option value="">-- Lựa chọn --</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.ten_dich_vu}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Chọn gói trị liệu *</label>
              <select value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                <option value="">-- Lựa chọn --</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.ten_goi}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Chuyên gia y tế *</label>
            <select value={selectedKtvId} onChange={(e) => setSelectedKtvId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" required>
              <option value="">-- Lựa chọn --</option>
              {staffList.filter(s => s.vai_tro === 'Chuyên gia y tế').map(s => <option key={s.ky_thuat_vien_id || s.id} value={s.ky_thuat_vien_id || ''}>{s.ho_ten}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Phòng thực hiện</label>
            <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" required>
              <option value="">-- Tự động xếp phòng --</option>
              {roomsList.map(room => <option key={room.id} value={room.id}>{room.ten_phong}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Ngày điều trị *</label>
              <input type="date" value={treatmentDate} onChange={(e) => setTreatmentDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Giờ bắt đầu *</label>
              <input type="time" value={treatmentTime} onChange={(e) => setTreatmentTime(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" required />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all">Hủy bỏ</button>
            <button type="submit" disabled={bookingLoading} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50">
              {bookingLoading ? 'Đang tạo...' : 'Xác nhận tạo lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
