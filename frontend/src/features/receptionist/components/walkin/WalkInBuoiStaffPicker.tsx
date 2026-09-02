import {
  Clock,
  Users,
  Sun,
  Moon,
  CheckCircle2,
  CalendarRange,
  User,
  MapPin
} from 'lucide-react';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';
import { resolveImageUrl } from '../../../../utils/imageUrl';

export type Buoi = 'sang' | 'chieu';

export const BUOI_INFO: Record<Buoi, { label: string; khung: string; ketThuc: string }> = {
  sang: { label: 'Buổi Sáng', khung: '07:30 – 12:00', ketThuc: '12:00' },
  chieu: { label: 'Buổi Chiều', khung: '12:00 – 20:00', ketThuc: '20:00' }
};

interface WalkInBuoiStaffPickerProps {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedBuoi: Buoi | '';
  setSelectedBuoi: (b: Buoi | '') => void;
  onDateChange?: (d: Date) => void;
  setShowWorkloadModal: (s: boolean) => void;
  buoiOptions: { key: Buoi; info: any; daQua: boolean; disabled: boolean }[];
  isFutureDateRestrict: boolean;
  bookingStatus: 'da_checkin' | 'da_xac_nhan';
  setBookingStatus: (s: 'da_checkin' | 'da_xac_nhan') => void;
  isExam: boolean;
  isReceptionist: boolean;
  selectedDoctorId: string;
  setSelectedDoctorId: (id: string) => void;
  availableDoctors: any[];
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
  roomsList: any[];
}

export function WalkInBuoiStaffPicker({
  selectedDate,
  setSelectedDate,
  selectedBuoi,
  setSelectedBuoi,
  onDateChange,
  setShowWorkloadModal,
  buoiOptions,
  isFutureDateRestrict,
  bookingStatus,
  setBookingStatus,
  isExam,
  isReceptionist,
  selectedDoctorId,
  setSelectedDoctorId,
  availableDoctors,
  selectedRoomId,
  setSelectedRoomId,
  roomsList
}: WalkInBuoiStaffPickerProps) {
  return (
    <div className="space-y-5">
      {/* 1. Chọn buổi & Ngày */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-jakarta">
            <Clock size={14} className="text-slate-400 dark:text-zinc-400" />
            Chọn buổi đặt lịch
          </h4>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowWorkloadModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-955/60 border border-teal-200 dark:border-teal-800/80 text-[#0d9488] dark:text-teal-300 font-bold text-xs flex items-center gap-1.5 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Xem Trạng Thái Nhân Sự Ca Trực Real-time"
            >
              <Users size={16} className="text-teal-600 dark:text-teal-400" />
              <span>📊 Trạng Thái Nhân Sự Ca Trực</span>
            </button>

            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ngày:</span>
            <CustomDatePicker
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedBuoi('');
                setSelectedDoctorId('');
                setSelectedRoomId('');
                if (date && onDateChange) {
                  onDateChange(new Date(date));
                }
              }}
              className="w-36"
              align="right"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {buoiOptions.map(({ key, info, daQua, disabled }) => {
            const isSelected = selectedBuoi === key;
            const Icon = key === 'sang' ? Sun : Moon;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedBuoi(key)}
                className={`text-left p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  disabled
                    ? 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200/60 dark:border-zinc-800/60 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm cursor-pointer'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  disabled ? 'bg-slate-200 dark:bg-zinc-700 text-slate-400' : isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black">{BUOI_INFO[key].label}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{BUOI_INFO[key].khung}</p>
                  <p className={`text-[10px] font-black mt-1 ${disabled ? 'text-slate-400' : isSelected ? 'text-white' : 'text-emerald-600'}`}>
                    {daQua ? 'Đã qua giờ nhận khách' : !info.choPhep ? 'Hết chỗ' : 'Còn chỗ'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Trạng thái ca hẹn */}
      {selectedBuoi && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block font-jakarta">
                Trạng thái đăng ký ca hẹn
              </label>
              {isFutureDateRestrict && (
                <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-955/40 px-2 py-0.5 rounded border border-rose-200/60">
                  🔴 Lễ tân chỉ được chọn Check-in ngay cho ca ngày hôm nay
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isFutureDateRestrict}
                onClick={() => !isFutureDateRestrict && setBookingStatus('da_checkin')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all ${
                  isFutureDateRestrict
                    ? 'bg-slate-100 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/60 opacity-50 cursor-not-allowed text-slate-400 dark:text-zinc-500'
                    : bookingStatus === 'da_checkin'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md cursor-pointer'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-emerald-300 cursor-pointer'
                }`}
                title={isFutureDateRestrict ? 'Lễ tân chỉ áp dụng Check-in ngay cho khách đang có mặt tại quầy trong ngày hôm nay' : ''}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                  isFutureDateRestrict
                    ? 'bg-slate-200 dark:bg-zinc-700 text-slate-400'
                    : bookingStatus === 'da_checkin' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-black">Khách tại quầy (Check-in ngay)</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${
                    isFutureDateRestrict
                      ? 'text-rose-500 font-bold'
                      : bookingStatus === 'da_checkin' ? 'text-white/80' : 'text-slate-400'
                  }`}>
                    {isFutureDateRestrict
                      ? '🚫 Lễ tân không áp dụng cho ngày tương lai'
                      : isExam ? 'Bắt buộc thu tiền Lượng giá để vào hàng đợi' : 'Vào thẳng hàng đợi (Thu tiền linh hoạt)'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBookingStatus('da_xac_nhan')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                  bookingStatus === 'da_xac_nhan'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-emerald-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                  bookingStatus === 'da_xac_nhan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <CalendarRange size={16} />
                </div>
                <div>
                  <p className="text-xs font-black">Đặt trước (Đã xác nhận)</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${bookingStatus === 'da_xac_nhan' ? 'text-white/80' : 'text-slate-400'}`}>
                    Lưu lịch hẹn trước, check-in sau khi khách tới
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Phân bổ nhân sự (Dành cho Quản lý / Admin) */}
          {!isReceptionist && (
            <>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-jakarta">
                    <User size={14} className="text-slate-400 dark:text-zinc-400" />
                    {isExam ? 'Phân bổ Chuyên viên phụ trách' : 'Phân bổ Kỹ thuật viên phụ trách'}
                  </h4>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold italic">(Có thể chọn Bất kỳ)</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bất kỳ */}
                  <div
                    onClick={() => {
                      setSelectedDoctorId('');
                      setSelectedRoomId('');
                    }}
                    className={`p-3.5 border rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                      !selectedDoctorId
                        ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      !selectedDoctorId ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                    }`}>
                      <Users size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate">
                        Bất kỳ (Hàng đợi chung)
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        Chưa gán đích danh — Nhân sự rảnh bấm gọi
                      </p>
                    </div>
                    {!selectedDoctorId && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        Đã chọn
                      </span>
                    )}
                  </div>

                  {/* Danh sách nhân sự */}
                  {availableDoctors.map(doc => {
                    const isSelected = String(selectedDoctorId) === String(doc.id);
                    const isBusyNow = doc.checkedInCount > 0;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => doc.available && setSelectedDoctorId(String(doc.id))}
                        className={`p-3.5 border rounded-2xl flex items-center gap-3 transition-all ${
                          doc.available
                            ? isSelected
                              ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 ring-2 ring-emerald-500/10 cursor-pointer'
                              : doc.endsEarly
                                ? 'border-amber-300 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400 hover:shadow-sm cursor-pointer'
                                : 'border-slate-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm cursor-pointer'
                            : 'border-slate-100 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-800/60 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {doc.anh_dai_dien ? (
                          <img
                            src={resolveImageUrl(doc.anh_dai_dien)}
                            alt={doc.ho_ten}
                            className={`w-9 h-9 rounded-full object-cover shrink-0 border-2 ${
                              isSelected && doc.available ? 'border-emerald-500' : 'border-slate-200 dark:border-zinc-700'
                            } ${doc.available ? '' : 'grayscale'}`}
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            doc.available ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                          }`}>
                            {isExam ? 'BS' : 'KTV'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate flex items-center gap-1.5">
                            <span>{doc.ho_ten}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                              isBusyNow ? 'bg-amber-100 dark:bg-amber-955 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                            }`}>
                              {doc.occupiedCount} ca
                            </span>
                          </p>
                          <p className={`text-[10px] font-semibold mt-0.5 ${
                            isBusyNow ? 'text-amber-600 dark:text-amber-400 font-bold' : doc.endsEarly ? 'text-amber-600 dark:text-amber-450 font-black' : 'text-slate-400 dark:text-zinc-400'
                          }`}>
                            {isBusyNow ? `🟡 Đang bận (${doc.checkedInCount} ca check-in/chờ)` : doc.endsEarly ? `⚠️ ${doc.reason} — chỉ nhận khách đến trước ${doc.gioKetThucTruc}` : doc.reason}
                          </p>
                        </div>
                        {doc.available && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : isBusyNow
                                ? 'bg-amber-100 dark:bg-amber-955/60 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {isSelected ? 'Đã chọn' : isBusyNow ? `Bận (${doc.checkedInCount})` : 'Sẵn sàng'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tự động khóa phòng trực */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-jakarta">
                    <MapPin size={14} className="text-slate-400 dark:text-zinc-400" />
                    Phòng chuyên khoa / trị liệu gán ca trực
                  </h4>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl flex justify-between items-center select-none animate-in fade-in duration-200">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Phòng trực ca làm việc</span>
                    <span className="text-sm font-black text-slate-800 dark:text-zinc-100 block mt-0.5">
                      {selectedRoomId ? (roomsList.find(r => String(r.id) === String(selectedRoomId))?.ten_phong || 'Phòng làm việc') : 'Chưa xếp phòng trực'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                      {selectedDoctorId ? '✓ Tự động gán theo cấu hình ca trực' : '⚠️ Sẽ tự động phân phòng khi gán nhân sự'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-400 bg-slate-100/80 dark:bg-zinc-800 px-3 py-1 rounded-xl">Đã khóa</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
