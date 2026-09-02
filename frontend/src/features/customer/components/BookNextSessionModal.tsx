import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../../../utils/imageUrl';
import api from '../../../api/axios';
import { CustomDatePicker } from '../../../components/CustomDatePicker';

type Buoi = 'sang' | 'chieu';
const BUOI_INFO: Record<Buoi, { label: string; khung: string; ketThuc: string }> = {
  sang: { label: 'Buổi sáng', khung: '7:30 - 12:00', ketThuc: '12:00' },
  chieu: { label: 'Buổi chiều', khung: '12:00 - 20:00', ketThuc: '20:00' }
};

/** Mirror `isBuoiDaQua` phía backend/domain/capacity.ts. */
function isBuoiDaQua(dateStr: string, buoi: Buoi): boolean {
  const todayStr = new Date().toLocaleDateString('en-CA');
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = BUOI_INFO[buoi].ketThuc.split(':').map(Number);
  return nowMinutes >= h * 60 + m;
}

export interface BookNextSessionModalProps {
  pkg?: {
    phac_do_id: string | number;
    ten_dich_vu: string;
    goi_dich_vu_id: string | number;
  };
  sessionNum?: number;
  packagePlan?: {
    id?: string | number;
    phac_do_id?: string | number;
    ten_goi?: string;
    ten_goi_dich_vu?: string;
    ten_dich_vu?: string;
    goi_dich_vu_id: string | number;
    thoi_luong_phut?: number;
    tong_so_buoi?: number;
    so_buoi_da_dung?: number;
    so_buoi_da_thuc_hien?: number;
    khach_hang_id?: string | number;
  };
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface BuoiNhanSu {
  id: number;
  ho_ten: string;
  anh_dai_dien: string | null;
  caTruc: string;
  gioKetThuc?: string;
  conLaiSang: number;
  conLaiChieu: number;
}

export function BookNextSessionModal({
  pkg,
  sessionNum,
  packagePlan,
  isOpen = true,
  onClose,
  onSuccess
}: BookNextSessionModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const activePkg = useMemo(() => {
    if (pkg) {
      return {
        phac_do_id: String(pkg.phac_do_id),
        ten_dich_vu: pkg.ten_dich_vu,
        goi_dich_vu_id: String(pkg.goi_dich_vu_id)
      };
    }
    if (packagePlan) {
      return {
        phac_do_id: String(packagePlan.phac_do_id || packagePlan.id),
        ten_dich_vu: packagePlan.ten_goi || packagePlan.ten_goi_dich_vu || packagePlan.ten_dich_vu || 'Gói điều trị',
        goi_dich_vu_id: String(packagePlan.goi_dich_vu_id || packagePlan.id)
      };
    }
    return { phac_do_id: '', ten_dich_vu: '', goi_dich_vu_id: '' };
  }, [pkg, packagePlan]);

  const activeSessionNum = useMemo(() => {
    if (sessionNum !== undefined && sessionNum !== null) return Number(sessionNum);
    if (packagePlan) {
      const used = Number(packagePlan.so_buoi_da_dung !== undefined 
        ? packagePlan.so_buoi_da_dung 
        : (packagePlan.so_buoi_da_thuc_hien !== undefined ? packagePlan.so_buoi_da_thuc_hien : 0)) || 0;
      return used + 1;
    }
    return 1;
  }, [sessionNum, packagePlan]);

  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [sdt] = useState<string>(user?.so_dien_thoai || '');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedBuoi, setSelectedBuoi] = useState<Buoi | ''>('');
  const [lyDo, setLyDo] = useState<string>(`Đặt lịch buổi trị liệu số ${activeSessionNum} theo gói ${activePkg.ten_dich_vu}.`);
  const [nhanSu, setNhanSu] = useState<BuoiNhanSu[]>([]);
  const [buoiAvailability, setBuoiAvailability] = useState<{
    sang: { conLaiChung: number; choPhep: boolean };
    chieu: { conLaiChung: number; choPhep: boolean };
  }>({ sang: { conLaiChung: 0, choPhep: false }, chieu: { conLaiChung: 0, choPhep: false } });
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Thời lượng gói dịch vụ (lấy động từ API hoặc packagePlan)
  const [duration, setDuration] = useState<number>(packagePlan?.thoi_luong_phut || 60);

  // Trạng thái cho hộp thoại xác nhận 2 lớp
  const [showConfirmStep, setShowConfirmStep] = useState<boolean>(false);

  // Cập nhật lý do khi sessionNum hoặc ten_dich_vu thay đổi
  useEffect(() => {
    if (activePkg.ten_dich_vu) {
      setLyDo(`Đặt lịch buổi trị liệu số ${activeSessionNum} theo gói ${activePkg.ten_dich_vu}.`);
    }
  }, [activeSessionNum, activePkg.ten_dich_vu]);

  // 1. Tải thời lượng của gói dịch vụ
  useEffect(() => {
    if (!activePkg.goi_dich_vu_id) return;
    const fetchPackageDuration = async () => {
      try {
        const res = await api.get('/client/packages');
        const list = res.data || [];
        const matched = list.find((p: any) => String(p.id) === String(activePkg.goi_dich_vu_id));
        if (matched && matched.thoi_luong_phut) {
          setDuration(Number(matched.thoi_luong_phut));
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin gói:', err);
      }
    };
    fetchPackageDuration();
  }, [activePkg.goi_dich_vu_id]);

  // 2. Tải sức chứa 2 buổi (A1) khi đổi ngày
  useEffect(() => {
    if (!selectedDate || !activePkg.goi_dich_vu_id) return;
    setLoadingSlots(true);
    const userId = user?.id || '';
    const phone = sdt || user?.so_dien_thoai || '';
    const url = `/client/appointments/buoi-availability?date=${selectedDate}&userId=${userId}&phone=${phone}&dichVuId=${activePkg.goi_dich_vu_id}`;

    api.get(url)
      .then((res: any) => {
        setBuoiAvailability({ sang: res.data.sang, chieu: res.data.chieu });
        setNhanSu(res.data.nhanSu || []);
        setSelectedBuoi('');
        setSelectedStaffId('');
      })
      .catch((err: any) => {
        console.error('Lỗi khi tải sức chứa buổi:', err);
        toast.error('Không thể tải sức chứa cho ngày này.');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedDate, user?.id, sdt, user?.so_dien_thoai, activePkg.goi_dich_vu_id]);

  const buoiOptions = useMemo(() => (['sang', 'chieu'] as Buoi[]).map((key) => {
    const info = buoiAvailability[key] || { conLaiChung: 0, choPhep: false };
    const daQua = isBuoiDaQua(selectedDate, key);
    return { key, info, daQua, disabled: daQua || !info.choPhep };
  }), [buoiAvailability, selectedDate]);

  // Lọc danh sách nhân viên còn đủ chỗ riêng cho buổi được chọn
  const availableSpecialistsForSelectedBuoi = useMemo(() => {
    if (!selectedBuoi) return [];
    return nhanSu.map((staff) => {
      const conLai = selectedBuoi === 'sang' ? staff.conLaiSang : staff.conLaiChieu;
      const isFree = conLai >= duration;
      return {
        ...staff,
        available: isFree,
        reason: isFree ? `Trực ${staff.caTruc}` : 'Không đủ chỗ trong buổi này'
      };
    });
  }, [selectedBuoi, nhanSu, duration]);

  const formatStaffName = (name?: string) => {
    if (!name) return '';
    const clean = name.replace(/^(ktv\.|bác sĩ|bs\.|dr\.|ktv)\s*/i, '').trim();
    return `KTV. ${clean}`;
  };

  const selectedStaffObject = useMemo(() => {
    if (!selectedStaffId) return null;
    return nhanSu.find((s) => String(s.id) === String(selectedStaffId)) || null;
  }, [selectedStaffId, nhanSu]);

  const staffAlertInfo = useMemo(() => {
    if (!selectedStaffObject || !selectedBuoi) return null;
    const ca = selectedStaffObject.caTruc || '';
    const ketThuc = selectedStaffObject.gioKetThuc || (ca.includes('-') ? ca.split('-')[1]?.trim() : '');
    if (!ketThuc) return null;
    const [h, m] = ketThuc.split(':').map((v: string) => parseInt(v, 10));
    if (isNaN(h)) return null;

    const staffShiftEndMins = h * 60 + (m || 0);
    const buoiEndMins = selectedBuoi === 'sang' ? 12 * 60 : 20 * 60;

    if (staffShiftEndMins < buoiEndMins) {
      const latestCheckinMins = staffShiftEndMins - duration;
      const latestH = Math.floor(latestCheckinMins / 60);
      const latestM = latestCheckinMins % 60;
      const latestStr = `${latestH}h${latestM < 10 ? '0' : ''}${latestM}`;
      const endH = Math.floor(staffShiftEndMins / 60);
      const endM = staffShiftEndMins % 60;
      const endStr = `${endH}h${endM < 10 ? '0' : ''}${endM}`;

      return {
        staffName: formatStaffName(selectedStaffObject.ho_ten),
        endStr,
        latestStr,
        caTruc: selectedStaffObject.caTruc || `${endStr}`
      };
    }
    return null;
  }, [selectedStaffObject, selectedBuoi, duration]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày điều trị.');
      return;
    }
    if (!selectedBuoi) {
      toast.error('Vui lòng chọn buổi điều trị.');
      return;
    }
    setShowConfirmStep(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedBuoi) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Đang khởi tạo lịch hẹn trị liệu...');

    try {
      const payload = {
        ngay: selectedDate,
        buoi: selectedBuoi,
        khach_hang_id: user?.id,
        ho_ten_khach: user?.ho_ten || 'Khách hàng',
        so_dien_thoai: sdt,
        gioi_tinh_khach: user?.gioi_tinh || 'nam',
        goi_dich_vu_id: activePkg.goi_dich_vu_id,
        phac_do_dieu_tri_id: activePkg.phac_do_id,
        so_thu_tu_buoi: activeSessionNum,
        nhan_su_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
        nguoi_dung_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
        trieu_chung: lyDo,
        ly_do_kham: `Trị liệu theo gói: ${activePkg.ten_dich_vu}`
      };

      const response = await api.post('/client/appointments/public', payload);

      if (response.status === 200 || response.status === 201) {
        toast.success(`🎉 Khởi tạo thành công lịch hẹn Buổi ${activeSessionNum}!`, { id: toastId });
        if (onSuccess) onSuccess();
        onClose();
        navigate(`/appointments?date=${selectedDate}`);
      } else {
        toast.error('Không thể đặt lịch hẹn. Vui lòng thử lại.', { id: toastId });
        setShowConfirmStep(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi kết nối máy chủ trị liệu!', { id: toastId });
      setShowConfirmStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormattedDate = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-');
    return `${d}/${m}/${y}`;
  };

  if (!isOpen || !activePkg.goi_dich_vu_id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {!showConfirmStep ? (
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

          {/* Modal Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-55/60 dark:bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 transition-colors uppercase tracking-wider cursor-pointer"
              >
                ← Quay lại
              </button>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-850" />
              <div>
                <h3 className="font-heading text-base font-black text-secondary dark:text-zinc-200 flex items-center gap-1.5">
                  🛡️ Đăng ký ca điều trị - Buổi {activeSessionNum}
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                  Lập lịch theo phác đồ gói liệu trình, tự động xác nhận
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleOpenConfirm} className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">

            {/* 1. HÀNH CHÍNH KHÁCH HÀNG */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1">
                Hành chính khách hàng
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Card */}
                <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shrink-0">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Khách hàng</span>
                      <span className="text-sm font-black text-zinc-800 dark:text-zinc-250 block mt-0.5">{user?.ho_ten}</span>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold block mt-0.5">SĐT liên hệ: {user?.so_dien_thoai}</span>
                    </div>
                  </div>
                </div>

                {/* SĐT Liên hệ */}
                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Số điện thoại liên hệ cho ca hẹn</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={sdt || user?.so_dien_thoai || ''}
                      disabled
                      className="w-full px-4 py-2.5 bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-mono font-bold text-zinc-600 dark:text-zinc-400 cursor-not-allowed"
                    />
                    <span className="absolute right-3.5 top-2.5 text-[10px] font-black text-slate-400">
                      🔒 Tài khoản chính chủ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. DỊCH VỤ ĐĂNG KÝ */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1">
                Dịch vụ đăng ký
              </h4>

              <div className="space-y-4">
                {/* Gói Đặt theo Phác đồ */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl relative select-none">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-555 uppercase tracking-widest block">
                    Gói đặt theo phác đồ
                  </span>
                  <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 block mt-0.5 pr-8">
                    {activePkg.ten_dich_vu}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-extrabold mt-1.5 px-2 py-0.5 bg-teal-50 dark:bg-teal-950/20 border border-teal-100/50 rounded-md">
                    ⏳ Buổi {activeSessionNum} ({duration} phút)
                  </span>
                </div>

                {/* Triệu chứng / Ghi chú */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Mô tả triệu chứng / Lý do đến / Ghi chú</label>
                  <textarea
                    rows={2}
                    value={lyDo}
                    onChange={(e) => setLyDo(e.target.value)}
                    placeholder="Mô tả các triệu chứng đau mỏi hiện tại của bạn..."
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-secondary dark:text-zinc-300"
                  />
                </div>
              </div>
            </div>

            {/* 3. CHỌN BUỔI ĐẶT LỊCH */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-1">
                <h4 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={14} className="text-zinc-400" />
                  Chọn buổi đặt lịch
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Ngày hẹn:</span>
                  <CustomDatePicker
                    value={selectedDate}
                    minDate={getTodayString()}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setSelectedBuoi('');
                      setSelectedStaffId('');
                    }}
                    className="w-36"
                    align="right"
                  />
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-sm text-zinc-450 animate-pulse font-bold">
                  Đang tính toán sức chứa các buổi...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {buoiOptions.map(({ key, info, daQua, disabled }) => {
                    const isSelected = selectedBuoi === key;
                    const Icon = key === 'sang' ? Sun : Moon;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setSelectedBuoi(key);
                          setSelectedStaffId('');
                        }}
                        className={`text-left p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                          disabled
                            ? 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-150 dark:border-zinc-850 opacity-60 cursor-not-allowed'
                            : isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-[0.99] cursor-pointer'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-emerald-350 dark:hover:border-emerald-700 hover:shadow-xs cursor-pointer'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          disabled ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400' : isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black">{BUOI_INFO[key].label}</p>
                          <p className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-zinc-400'}`}>{BUOI_INFO[key].khung}</p>
                          <p className={`text-[10px] font-black mt-1 ${disabled ? 'text-zinc-400' : isSelected ? 'text-white' : 'text-emerald-600'}`}>
                            {daQua ? 'Đã qua giờ nhận khách' : !info.choPhep ? 'Hết chỗ' : 'Còn chỗ'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. PHÂN BỔ NHÂN VIÊN TRỰC */}
            {selectedBuoi && (
              <div className="space-y-3.5 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-1">
                  <h4 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={14} className="text-zinc-400" />
                    Phân bổ Kỹ thuật viên phụ trách
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-semibold italic">(Không bắt buộc)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Option: Hệ thống tự xếp */}
                  <div
                    onClick={() => setSelectedStaffId('')}
                    className={`p-3 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${selectedStaffId === ''
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 ring-2 ring-emerald-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-700'
                      }`}
                  >
                    <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center font-black text-xs shrink-0 border border-zinc-200 dark:border-zinc-755">
                      AUTO
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block">Chọn bất kỳ chuyên gia</span>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-0.5 block">Hệ thống tự động điều phối</span>
                    </div>
                  </div>

                  {/* Available Specialists list */}
                  {availableSpecialistsForSelectedBuoi.map((staff) => {
                    const isSelected = selectedStaffId === String(staff.id);
                    const isAvailable = staff.available;

                    return (
                      <div
                        key={staff.id}
                        onClick={() => {
                          if (isAvailable) setSelectedStaffId(String(staff.id));
                        }}
                        className={`p-3 border rounded-2xl flex items-center gap-3 transition-all ${
                          !isAvailable
                            ? 'opacity-40 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-850 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 ring-2 ring-emerald-500/10 cursor-pointer'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-700 cursor-pointer'
                        }`}
                      >
                        {staff.anh_dai_dien ? (
                          <img
                            src={resolveImageUrl(staff.anh_dai_dien)}
                            alt={staff.ho_ten}
                            className="size-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-xs shrink-0 border border-teal-200 dark:border-teal-800">
                            {staff.ho_ten?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'KTV'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block truncate">
                            {formatStaffName(staff.ho_ten)}
                          </span>
                          <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold block truncate">
                            {staff.reason}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cảnh báo ca trực nếu nhân sự về sớm hơn kết thúc buổi */}
                {staffAlertInfo && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed animate-in fade-in duration-200">
                    <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-amber-955 dark:text-amber-100 block text-[11px] uppercase tracking-wider mb-0.5">
                        ⏰ Lưu ý ca trực của {staffAlertInfo.staffName}:
                      </span>
                      Nhân sự này chỉ có mặt tại trung tâm đến <strong className="text-amber-955 dark:text-amber-100 font-black">{staffAlertInfo.endStr}</strong> (Trực {staffAlertInfo.caTruc}). Quý khách vui lòng đến check-in trước <strong className="text-emerald-700 dark:text-emerald-400 font-black">{staffAlertInfo.latestStr}</strong> để đảm bảo được phục vụ bởi đúng nhân sự này. Sau thời gian này nếu nhân sự đã hết ca, hệ thống sẽ linh hoạt điều phối nhân sự đang trực tiếp nhận.
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Modal Footer */}
          <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-55/60 dark:bg-zinc-900/60 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-extrabold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedBuoi || isSubmitting}
              onClick={handleOpenConfirm}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#25A89C] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white text-xs font-black transition-colors uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Đặt lịch hẹn</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Hộp thoại xác nhận 2 lớp đẹp mắt */
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Calendar size={28} className="stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h4 className="font-heading text-lg font-black text-secondary dark:text-zinc-200">Xác nhận lịch hẹn của bạn</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn đặt lịch cho buổi tiếp theo của phác đồ này không?
            </p>
          </div>

          <div className="p-4 md:p-5 bg-slate-50/80 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 text-left space-y-3.5">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-widest block">Gói dịch vụ</span>
              <span className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 block">{activePkg.ten_dich_vu}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-widest block">Buổi điều trị</span>
                <span className="text-xs font-black text-[#0D9488] mt-0.5 block">Buổi số {activeSessionNum}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-widest block">Thời gian đặt</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 mt-0.5 block">
                  {selectedBuoi ? BUOI_INFO[selectedBuoi].label : ''} · {getFormattedDate()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-widest block mb-1.5">Kỹ thuật viên phụ trách</span>
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 shadow-2xs">
                {selectedStaffObject ? (
                  <>
                    {selectedStaffObject.anh_dai_dien ? (
                      <img
                        src={resolveImageUrl(selectedStaffObject.anh_dai_dien)}
                        alt={selectedStaffObject.ho_ten}
                        className="w-9 h-9 rounded-full object-cover border border-teal-200/80 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-black text-xs shrink-0">
                        {selectedStaffObject.ho_ten?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'KTV'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 block truncate">
                        {formatStaffName(selectedStaffObject.ho_ten)}
                      </span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block">
                        {selectedStaffObject.caTruc || 'Chuyên gia trị liệu'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-black text-[9px] shrink-0">
                      AUTO
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 block truncate">
                        Hệ thống tự động điều phối
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Chỉ định KTV sẵn sàng khi đến ca
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowConfirmStep(false)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-extrabold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-855 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Quay lại sửa
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmSubmit}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#25A89C] text-white text-xs font-black transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'Đang đặt...' : 'Xác nhận đặt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookNextSessionModal;
