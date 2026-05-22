import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axiosInstance from '../../../api/axios';
import toast from 'react-hot-toast';

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
  const [availableStaff, setAvailableStaff] = useState<any[] | null>(null);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchAvailableStaff = async () => {
      const hasService = treatmentType === 'single' ? !!selectedServiceId : !!selectedPackageId;
      if (!hasService || !treatmentDate || !treatmentTime) {
        if (active) setAvailableStaff(null);
        return;
      }

      try {
        if (active) setLoadingAvailable(true);
        const params: any = {
          ngay: treatmentDate,
          gio_bat_dau: treatmentTime,
        };
        if (treatmentType === 'single') {
          params.dich_vu_id = selectedServiceId;
        } else {
          params.dang_ky_goi_id = selectedPackageId;
        }

        const res = await axiosInstance.get('/admin/staff/available', { params });
        if (active) {
          const ktvs = res.data;
          setAvailableStaff(ktvs);
          
          // Auto-select if there is exactly 1 available
          if (ktvs.length === 1) {
            setSelectedKtvId(ktvs[0].ky_thuat_vien_id);
          } else if (selectedKtvId && !ktvs.some((k: any) => String(k.ky_thuat_vien_id) === String(selectedKtvId))) {
            setSelectedKtvId('');
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách kỹ thuật viên khả dụng:', error);
        if (active) {
          toast.error('Không thể kiểm tra ca bận của kỹ thuật viên');
          setAvailableStaff(null);
        }
      } finally {
        if (active) setLoadingAvailable(false);
      }
    };

    fetchAvailableStaff();
    return () => {
      active = false;
    };
  }, [treatmentType, selectedServiceId, selectedPackageId, treatmentDate, treatmentTime]);

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
              <button type="button" onClick={() => setTreatmentType('single')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${treatmentType === 'single' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Dịch vụ linh động</button>
              <button type="button" onClick={() => setTreatmentType('package')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${treatmentType === 'package' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Dịch vụ liệu trình</button>
            </div>
          </div>

          {treatmentType === 'single' ? (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Chọn dịch vụ linh động *</label>
              <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                <option value="">-- Lựa chọn --</option>
                {services.filter(s => String(s.danh_muc_id) !== '10').map(s => <option key={s.id} value={s.id}>{s.ten_dich_vu}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Chọn liệu trình *</label>
              <select value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                <option value="">-- Lựa chọn --</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.ten_goi}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Chuyên gia y tế *</label>
            <select 
              value={selectedKtvId} 
              onChange={(e) => setSelectedKtvId(e.target.value)} 
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" 
              required
              disabled={loadingAvailable}
            >
              {loadingAvailable ? (
                <option value="">Đang kiểm tra lịch trùng...</option>
              ) : availableStaff === null ? (
                <>
                  <option value="">-- Chọn dịch vụ, ngày, giờ để lọc --</option>
                  {staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'Chuyên gia y tế').map(s => (
                    <option key={s.ky_thuat_vien_id || s.id} value={s.ky_thuat_vien_id || ''}>{s.ho_ten}</option>
                  ))}
                </>
              ) : availableStaff.length === 0 ? (
                <option value="">-- Không có kỹ thuật viên nào rảnh --</option>
              ) : (
                <>
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {availableStaff.map((s: any) => (
                    <option key={s.ky_thuat_vien_id} value={s.ky_thuat_vien_id}>{s.ho_ten} (Rảnh)</option>
                  ))}
                </>
              )}
            </select>
            {availableStaff !== null && availableStaff.length === 0 && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                ⚠️ Không có kỹ thuật viên rảnh hoặc có ca trực bao quát khung giờ này.
              </p>
            )}
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
            <button type="submit" disabled={bookingLoading || (availableStaff !== null && availableStaff.length === 0)} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50">
              {bookingLoading ? 'Đang tạo...' : 'Xác nhận tạo lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
