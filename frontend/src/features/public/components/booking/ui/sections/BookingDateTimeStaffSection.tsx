import React, { useMemo } from 'react';
import { Calendar, Info, AlertTriangle, User, Clock } from 'lucide-react';
import { CustomDatePicker } from '../../../../../../components/CustomDatePicker';
import { BUOI_INFO, formatFullDate, isBuoiDaQua } from '../../constants';

interface BookingDateTimeStaffSectionProps {
  selectedDate: string;
  setDateField: (date: string) => void;
  selectedBuoi: '' | 'sang' | 'chieu';
  setBuoiField: (buoi: '' | 'sang' | 'chieu') => void;
  buoiAvailability: any;
  serviceDuration: number;
  selectedService: any;
  bookingType: 'kham' | 'dich_vu';
  staffList: any[];
  selectedStaffId: string;
  setSelectedStaffId: (id: string) => void;
}

export const BookingDateTimeStaffSection: React.FC<BookingDateTimeStaffSectionProps> = ({
  selectedDate,
  setDateField,
  selectedBuoi,
  setBuoiField,
  buoiAvailability,
  serviceDuration,
  selectedService,
  bookingType,
  staffList,
  selectedStaffId,
  setSelectedStaffId,
}) => {
  const selectedStaffObj = useMemo(() => {
    return staffList.find((ns: any) => String(ns.id) === selectedStaffId);
  }, [staffList, selectedStaffId]);

  const formatShiftBadge = (ns: any) => {
    if (ns.gioBatDau && ns.gioKetThuc) {
      return `${ns.gioBatDau} – ${ns.gioKetThuc}`;
    }
    if (ns.caTruc && ns.caTruc.includes('-')) {
      return ns.caTruc.replace('-', ' – ');
    }
    if (ns.caTruc === 'ca_1') return '07:00 – 16:00';
    if (ns.caTruc === 'ca_2') return '11:00 – 20:00';
    return '';
  };

  const staffAlertInfo = useMemo(() => {
    if (!selectedStaffObj || !selectedBuoi) return null;
    const ca = selectedStaffObj.caTruc || '';
    const batDau = selectedStaffObj.gioBatDau || (ca.includes('-') ? ca.split('-')[0]?.trim() : '');
    const ketThuc = selectedStaffObj.gioKetThuc || (ca.includes('-') ? ca.split('-')[1]?.trim() : '');
    if (!ketThuc) return null;

    const [startH, startM] = (batDau || '07:00').split(':').map((v: string) => parseInt(v, 10));
    const [endH, endM] = ketThuc.split(':').map((v: string) => parseInt(v, 10));
    if (isNaN(endH)) return null;

    const staffShiftStartMins = (isNaN(startH) ? 7 : startH) * 60 + (startM || 0);
    const staffShiftEndMins = endH * 60 + (endM || 0);

    const buoiStartMins = selectedBuoi === 'sang' ? 7 * 60 + 30 : 12 * 60;
    const buoiEndMins = selectedBuoi === 'sang' ? 12 * 60 : 20 * 60;

    const formatTimeHM = (totalMins: number) => {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return `${h}h${m < 10 ? '0' : ''}${m}`;
    };

    const caDisplay = `${formatTimeHM(staffShiftStartMins)} – ${formatTimeHM(staffShiftEndMins)}`;

    // TH1: Nhân sự bắt đầu ca muộn hơn giờ mở buổi (ví dụ ca 11:00-20:00 trong Buổi Sáng 07:30-12:00)
    if (staffShiftStartMins > buoiStartMins) {
      const latestCheckinMins = buoiEndMins - (serviceDuration || 30);
      return {
        type: 'start_late' as const,
        staffName: selectedStaffObj.ho_ten,
        startStr: formatTimeHM(staffShiftStartMins),
        endStr: formatTimeHM(staffShiftEndMins),
        latestStr: formatTimeHM(latestCheckinMins),
        caTruc: caDisplay
      };
    }

    // TH2: Nhân sự kết thúc ca sớm hơn giờ đóng buổi (ví dụ ca 07:00-16:00 trong Buổi Chiều 12:00-20:00)
    if (staffShiftEndMins < buoiEndMins) {
      const latestCheckinMins = staffShiftEndMins - (serviceDuration || 30);
      return {
        type: 'end_early' as const,
        staffName: selectedStaffObj.ho_ten,
        startStr: formatTimeHM(staffShiftStartMins),
        endStr: formatTimeHM(staffShiftEndMins),
        latestStr: formatTimeHM(latestCheckinMins),
        caTruc: caDisplay
      };
    }

    return null;
  }, [selectedStaffObj, selectedBuoi, serviceDuration]);
  return (
    <div className="space-y-5 pb-8 border-b border-slate-100">
      <div className="flex items-center gap-3 pb-1">
        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
          <Calendar size={18} />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
            2. Chọn ngày &amp; Buổi hẹn
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Đơn vị đặt lịch là Buổi Sáng (07:30–12:00) hoặc Buổi Chiều (12:00–20:00)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Date Input */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Ngày *
          </label>
          <CustomDatePicker
            value={selectedDate}
            onChange={(val: string) => setDateField(val)}
            minDate={new Date().toISOString().split('T')[0]}
            placeholder="Chọn ngày hẹn"
            buttonClassName="py-3.5 px-4 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-teal-500 shadow-2xs hover:border-teal-400"
          />
          {selectedDate && (
            <p className="text-[11px] font-bold text-teal-600 capitalize">
              📅 {formatFullDate(selectedDate)}
            </p>
          )}
        </div>

        {/* Session Radios (Sáng vs Chiều) */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            Chọn Buổi *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const sangDaQua = isBuoiDaQua(selectedDate, 'sang');
              const sangSlots = Math.floor((buoiAvailability.sang?.conLaiChung || 0) / (serviceDuration || 30));
              const sangChoPhep = buoiAvailability.sang?.choPhep && !sangDaQua && sangSlots > 0;

              const chieuDaQua = isBuoiDaQua(selectedDate, 'chieu');
              const chieuSlots = Math.floor((buoiAvailability.chieu?.conLaiChung || 0) / (serviceDuration || 30));
              const chieuChoPhep = buoiAvailability.chieu?.choPhep && !chieuDaQua && chieuSlots > 0;

              const renderBuoiStatus = (daQua: boolean, choPhep: boolean, slots: number) => {
                if (daQua) return <span className="text-rose-500 font-bold">Đã qua giờ nhận</span>;
                if (!choPhep || slots <= 0) return <span className="text-rose-500 font-bold">Hết slot</span>;
                if (slots <= 3) return <span className="text-amber-600 font-black">Sắp hết (Còn {slots} slot)</span>;
                return <span className="text-emerald-600 font-black">Còn {slots} slot</span>;
              };

              return (
                <>
                  <button
                    type="button"
                    disabled={!sangChoPhep}
                    onClick={() => setBuoiField('sang')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedBuoi === 'sang' && sangChoPhep
                        ? 'border-teal-500 bg-teal-50 text-teal-900 font-black ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <div className="text-xs font-black">🌅 Buổi Sáng</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">07:30 – 12:00</div>
                    <div className="text-[10px] font-bold mt-1">
                      {renderBuoiStatus(sangDaQua, !!buoiAvailability.sang?.choPhep, sangSlots)}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!chieuChoPhep}
                    onClick={() => setBuoiField('chieu')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedBuoi === 'chieu' && chieuChoPhep
                        ? 'border-teal-500 bg-teal-50 text-teal-900 font-black ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <div className="text-xs font-black">🌆 Buổi Chiều</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">12:00 – 20:00</div>
                    <div className="text-[10px] font-bold mt-1">
                      {renderBuoiStatus(chieuDaQua, !!buoiAvailability.chieu?.choPhep, chieuSlots)}
                    </div>
                  </button>
                </>
              );
            })()}
          </div>

          {/* Gợi ý khung giờ đến linh hoạt theo thời lượng dịch vụ và nhân sự chọn */}
          {selectedBuoi && (
            (() => {
              let fromMins = selectedBuoi === 'sang' ? 7 * 60 + 30 : 12 * 60;
              let toMins = selectedBuoi === 'sang' ? 12 * 60 : 20 * 60;

              if (selectedStaffObj) {
                const ca = selectedStaffObj.caTruc || '';
                const batDau = selectedStaffObj.gioBatDau || (ca.includes('-') ? ca.split('-')[0]?.trim() : '');
                const ketThuc = selectedStaffObj.gioKetThuc || (ca.includes('-') ? ca.split('-')[1]?.trim() : '');
                if (batDau) {
                  const [sh, sm] = batDau.split(':').map((v: string) => parseInt(v, 10));
                  if (!isNaN(sh)) fromMins = Math.max(fromMins, sh * 60 + (sm || 0));
                }
                if (ketThuc) {
                  const [eh, em] = ketThuc.split(':').map((v: string) => parseInt(v, 10));
                  if (!isNaN(eh)) toMins = Math.min(toMins, eh * 60 + (em || 0));
                }
              }

              const latestCheckinMins = toMins - serviceDuration;
              const fromStr = `${Math.floor(fromMins / 60)}h${fromMins % 60 < 10 ? '0' : ''}${fromMins % 60}`;
              const latestStr = `${Math.floor(latestCheckinMins / 60)}h${latestCheckinMins % 60 < 10 ? '0' : ''}${latestCheckinMins % 60}`;

              return (
                <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs flex items-center gap-2.5 text-teal-950 leading-relaxed font-medium animate-in fade-in duration-200 mt-2.5">
                  <Info size={16} className="text-teal-600 shrink-0" />
                  <div>
                    {fromStr === latestStr ? (
                      <>
                        Dịch vụ bạn chọn có thời lượng <strong className="text-teal-700 font-extrabold">{serviceDuration} phút</strong>. Quý khách vui lòng đến check-in lúc <strong className="text-emerald-700 font-black">{fromStr}</strong> để được hỗ trợ phục vụ tốt nhất.
                      </>
                    ) : (
                      <>
                        Dịch vụ bạn chọn có thời lượng <strong className="text-teal-700 font-extrabold">{serviceDuration} phút</strong>. Quý khách vui lòng đến trong khung giờ từ <strong className="text-slate-900 font-extrabold">{fromStr}</strong> đến trước <strong className="text-emerald-700 font-black">{latestStr}</strong> để được hỗ trợ phục vụ tốt nhất.
                      </>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Cảnh báo mềm nếu trùng dịch vụ trong buổi */}
      {bookingType === 'dich_vu' && selectedBuoi && buoiAvailability[selectedBuoi]?.trungDichVu && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black uppercase tracking-wider text-amber-800 text-[10px]">Bạn đã đặt dịch vụ này trong buổi rồi</p>
            <p className="mt-0.5 font-bold text-amber-700">
              Bạn đang có 1 lịch <span className="font-extrabold text-amber-900">{selectedService?.ten_dich_vu || 'dịch vụ này'}</span> trong {BUOI_INFO[selectedBuoi].label.toLowerCase()} ngày {selectedDate ? formatFullDate(selectedDate) : ''}. Vẫn có thể đặt thêm nếu bạn chắc chắn muốn đặt 2 lượt.
            </p>
          </div>
        </div>
      )}

      {/* Staff Selector Cards with Avatar & Remaining Slots */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            {bookingType === 'kham' ? 'Chọn Chuyên viên tư vấn Lượng giá' : 'Chọn Kỹ thuật viên thực hiện'} (Tùy chọn)
          </label>
          <span className="text-[10px] text-teal-600 font-bold">⭐ Bất kỳ = Tự động gán người rảnh sớm nhất</span>
        </div>

        {!selectedBuoi ? (
          <p className="text-[11px] text-slate-400 font-bold py-2">Vui lòng chọn Buổi Sáng/Chiều ở trên trước để xem nhân sự còn slot.</p>
        ) : staffList.length === 0 ? (
          <p className="text-[11px] text-amber-600 font-bold py-2">Không còn nhân sự nào đủ thời lượng cho dịch vụ này ở buổi đã chọn — vui lòng đổi buổi.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Any Staff Card Option */}
            <button
              type="button"
              onClick={() => setSelectedStaffId('')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                selectedStaffId === ''
                  ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 font-bold'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm shrink-0">
                ✨
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 truncate">Bất kỳ nhân sự</div>
                <div className="text-[10px] text-teal-600 font-bold truncate">
                  {selectedBuoi ? `Còn ${Math.floor(((selectedBuoi === 'sang' ? buoiAvailability.sang?.conLaiChung : buoiAvailability.chieu?.conLaiChung) || 0) / (serviceDuration || 30))} slot` : 'Tự động rải tải'}
                </div>
              </div>
            </button>

            {/* Staff List Cards */}
            {staffList.map((ns: any) => {
              const staffConLaiPhut = selectedBuoi === 'sang' ? ns.conLaiSang : ns.conLaiChieu;
              const staffSlots = Math.floor((staffConLaiPhut || 0) / (serviceDuration || 30));
              const shiftBadge = formatShiftBadge(ns);

              return (
                <button
                  key={ns.id}
                  type="button"
                  onClick={() => setSelectedStaffId(String(ns.id))}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    selectedStaffId === String(ns.id)
                      ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {ns.anh_dai_dien ? (
                      <img src={ns.anh_dai_dien} alt={ns.ho_ten} className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">{ns.ho_ten}</div>
                    <div className="text-[10px] font-bold text-slate-500 truncate flex items-center flex-wrap gap-1 mt-0.5">
                      <span>{bookingType === 'kham' ? 'Chuyên viên' : (ns.chuyen_mon || 'KTV')}</span>
                      {shiftBadge && (
                        <span className="text-teal-700 bg-teal-50 border border-teal-200/60 px-1.5 py-0.2 rounded font-extrabold text-[9.5px]">
                          {shiftBadge}
                        </span>
                      )}
                      <span>·</span>
                      <span className="text-emerald-600 font-black">Còn {staffSlots} slot</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Cảnh báo ca trực thông minh */}
        {staffAlertInfo && (
          <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs flex items-start gap-2.5 text-amber-900 leading-relaxed font-medium animate-in fade-in duration-200 mt-2">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-amber-950 block text-[11px] uppercase tracking-wider mb-0.5">
                ⏰ Lưu ý ca trực của {staffAlertInfo.staffName}:
              </span>
              {staffAlertInfo.type === 'start_late' ? (
                <>
                  Nhân sự này bắt đầu ca làm việc từ <strong className="text-amber-950 font-black">{staffAlertInfo.startStr}</strong> (Trực ca {staffAlertInfo.caTruc}). Nếu Quý khách đến sớm hơn khung giờ này, trung tâm sẽ linh hoạt điều phối nhân sự đang trực ca sáng tiếp nhận.
                </>
              ) : (
                <>
                  Nhân sự này chỉ có mặt tại trung tâm đến <strong className="text-amber-950 font-black">{staffAlertInfo.endStr}</strong> (Trực ca {staffAlertInfo.caTruc}). Sau khoảng thời gian này, trung tâm sẽ linh hoạt điều phối nhân sự đang trực ca chiều tiếp nhận.
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
