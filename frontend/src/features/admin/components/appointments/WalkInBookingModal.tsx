import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, Stethoscope, Search, Loader2, CalendarRange, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../../api/axios';
import { convertToVietnamUtcIso } from '../../../../utils/date';

interface WalkInBookingModalProps {
  roomsList: any[];
  staffList: any[];
  appointments: any[];
  schedulesList: any[];
  servicesList?: any[];
  onClose: () => void;
  onSubmitApi: (payload: any) => Promise<void>;
  bookingLoading: boolean;
  initialTime?: string;
  activeType?: 'kham' | 'dieu_tri';
  isReceptionist?: boolean;
  selectedDateStr: string;
}


export default function WalkInBookingModal({
  roomsList,
  staffList,
  appointments,
  schedulesList,
  servicesList = [],
  onClose,
  onSubmitApi,
  bookingLoading,
  initialTime = '',
  activeType = 'kham',
  isReceptionist = false,
  selectedDateStr
}: WalkInBookingModalProps) {
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form states
  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [gioiTinh, setGioiTinh] = useState('nam');
  const [email, setEmail] = useState('');
  const [lyDo, setLyDo] = useState('');
  const selectedDate = selectedDateStr;
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'da_checkin' | 'da_xac_nhan'>('da_checkin');

  // Treatment plan / package states
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // 1. Filter services based on activeType (Kham vs Lieu Trinh Le)
  const filteredServices = React.useMemo(() => {
    return servicesList.filter((svc: any) => {
      if (activeType === 'kham') {
        return svc.loai_goi === 'KHAM' || svc.loai_dich_vu === 'KHAM';
      } else {
        // Chỉ hiện dịch vụ lẻ (1 buổi) khi ở tab điều trị
        return (svc.loai_goi !== 'KHAM' && svc.loai_dich_vu !== 'KHAM') && (svc.tong_so_buoi === 1 || !svc.tong_so_buoi);
      }
    });
  }, [servicesList, activeType]);

  // Set default service
  useEffect(() => {
    if (filteredServices.length > 0 && !selectedServiceId && !selectedPlan) {
      setSelectedServiceId(filteredServices[0].id);
    }
  }, [filteredServices, selectedServiceId, selectedPlan]);

  useEffect(() => {
    setSelectedTime(initialTime);
  }, [initialTime]);

  const timeDifferenceMinutes = React.useMemo(() => {
    if (!selectedTime) return 9999;
    const now = new Date();
    const isToday = selectedDate === format(now, 'yyyy-MM-dd');
    if (!isToday) return 9999;

    const [sh, sm] = selectedTime.split(':').map(Number);
    const slotVal = sh * 60 + sm;
    const currentVal = now.getHours() * 60 + now.getMinutes();
    return slotVal - currentVal;
  }, [selectedTime, selectedDate]);

  const isTooClose = timeDifferenceMinutes >= 0 && timeDifferenceMinutes <= 60;

  // 2. Autocomplete Search Customers
  useEffect(() => {
    if (isNewCustomer || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/receptionist/customers/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Error searching customers:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isNewCustomer]);

  // 3. Fetch Treatment Plans for Selected Customer
  useEffect(() => {
    if (isNewCustomer || !selectedCustomer) {
      setTreatmentPlans([]);
      setSelectedPlan(null);
      return;
    }
    const fetchPlans = async () => {
      try {
        const res = await axiosInstance.get(`/receptionist/customers/${selectedCustomer.id}/treatment-plans`);
        setTreatmentPlans(res.data || []);
      } catch (err) {
        console.error('Error fetching treatment plans:', err);
      }
    };
    fetchPlans();
  }, [selectedCustomer, isNewCustomer]);

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setHoTen(customer.ho_ten);
    setSdt(customer.so_dien_thoai || '');
    setGioiTinh(customer.gioi_tinh || 'nam');
    setEmail(customer.email || '');
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setHoTen('');
    setSdt('');
    setGioiTinh('nam');
    setEmail('');
    setTreatmentPlans([]);
    setSelectedPlan(null);
    if (filteredServices.length > 0) {
      setSelectedServiceId(filteredServices[0].id);
    }
  };

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setSelectedServiceId(plan.goi_dich_vu_id);
    setSelectedDoctorId('');
    setSelectedRoomId('');
  };

  const handleClearPlan = () => {
    setSelectedPlan(null);
    if (filteredServices.length > 0) {
      setSelectedServiceId(filteredServices[0].id);
    }
  };

  // Determine active service details
  const selectedService = servicesList.find((s: any) => String(s.id) === String(selectedServiceId));
  const isExam = selectedService ? (selectedService.loai_goi === 'KHAM' || selectedService.loai_dich_vu === 'KHAM') : true;

  // 1.5. Tạo baseTimeSlots động dựa trên thời lượng dịch vụ
  const baseTimeSlots = React.useMemo(() => {
    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    const slots: string[] = [];
    let current = new Date();
    current.setHours(7, 30, 0, 0); // Bắt đầu lúc 07:30
    
    const end = new Date();
    end.setHours(19, 30, 0, 0); // Giờ hẹn muộn nhất có thể bắt đầu là 19:30
    
    const formatTime = (d: Date) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };
    
    while (current.getTime() <= end.getTime()) {
      slots.push(formatTime(current));
      current = new Date(current.getTime() + duration * 60000);
    }
    return slots;
  }, [selectedService]);

  // 4. Tự động gán phòng khi chọn nhân sự dựa theo ca trực đã được cấu hình
  useEffect(() => {
    if (!selectedDoctorId || !selectedTime) {
      return;
    }
    const docSchedules = schedulesList.filter(s => 
      String(s.nguoi_dung_id) === String(selectedDoctorId) && 
      s.ngay === selectedDate
    );
    const activeSchedule = docSchedules.find(s => {
      if (s.trang_thai !== 'hoat_dong') return false;
      const dutyStart = s.gio_bat_dau.substring(0, 5);
      const dutyEnd = s.gio_ket_thuc.substring(0, 5);
      return dutyStart <= selectedTime && dutyEnd > selectedTime;
    });

    if (activeSchedule && activeSchedule.phong_id) {
      setSelectedRoomId(String(activeSchedule.phong_id));
    } else {
      setSelectedRoomId('');
    }
  }, [selectedDoctorId, selectedTime, schedulesList, selectedDate]);

  // 5. Tính toán Slot Giờ thông minh động (Kiểm tra trùng lịch Khách hàng & Nhân sự và hiển thị lý do)
  const slotDetails = React.useMemo(() => {
    if (!selectedServiceId) return [];

    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    
    // Lọc nhân sự theo vai trò (Bác sĩ cho ca khám, KTV cho ca điều trị)
    const staffToFilter = isExam 
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    // Xem thời gian hiện tại nếu ngày chọn là hôm nay hoặc quá khứ
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const isToday = selectedDate === todayStr;
    const isPastDate = selectedDate < todayStr;
    const currentVal = now.getHours() * 60 + now.getMinutes();

    // Lấy danh sách lịch hẹn trùng của khách hàng được chọn trong ngày đặt lịch này
    const occupiedCustomerApts = (!isNewCustomer && selectedCustomer)
      ? appointments.filter(apt => 
          String(apt.khach_hang_id) === String(selectedCustomer.id) &&
          apt.trang_thai !== 'da_huy' &&
          apt.trang_thai !== 'khong_den' &&
          format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd') === selectedDate
        )
      : [];

    return baseTimeSlots.map(time => {
      // 1. Kiểm tra ngày/giờ quá khứ
      if (isPastDate) {
        return { time, available: false, count: 0, reason: 'Đã qua' };
      }

      const [sh, sm] = time.split(':').map(Number);
      const slotVal = sh * 60 + sm;
      if (isToday && slotVal < currentVal) {
        return { time, available: false, count: 0, reason: 'Đã qua' };
      }

      // Tính giờ bắt đầu và kết thúc của ca hẹn
      const aptStartLocal = new Date(`${selectedDate}T${time}:00`);
      const aptEndLocal = new Date(aptStartLocal.getTime() + duration * 60000);

      const isOverlapping = (start1: Date, end1: Date, start2Str: string, end2Str: string) => {
        const s2 = new Date(start2Str).getTime();
        const e2 = new Date(end2Str).getTime();
        return start1.getTime() < e2 && end1.getTime() > s2;
      };

      // 2. Kiểm tra trùng lịch hẹn của bệnh nhân
      const hasCustOverlap = occupiedCustomerApts.some(apt => 
        isOverlapping(aptStartLocal, aptEndLocal, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
      );

      if (hasCustOverlap) {
        return { time, available: false, count: 0, reason: 'Trùng lịch KH' };
      }

      // 3. Kiểm tra ca trực và trùng lịch của nhân viên
      const overlappingApts = appointments.filter(apt => 
        apt.trang_thai !== 'da_huy' &&
        apt.trang_thai !== 'khong_den' &&
        isOverlapping(aptStartLocal, aptEndLocal, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
      );

      const occupiedStaffIds = overlappingApts.map(apt => apt.bac_si_id).filter(Boolean);

      const availableStaff = staffToFilter.filter(doc => {
        // Nếu Quản lý chọn đích danh nhân viên, chỉ kiểm tra người này
        if (!isReceptionist && selectedDoctorId && String(doc.id) !== String(selectedDoctorId)) {
          return false;
        }

        const docSchedules = schedulesList.filter(s => 
          String(s.nguoi_dung_id) === String(doc.id) && 
          s.ngay === selectedDate
        );

        if (docSchedules.length === 0) return false;

        const activeSchedule = docSchedules.find(s => s.trang_thai === 'hoat_dong');
        if (!activeSchedule) return false;

        const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
        const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

        // Xem slot giờ này có nằm trọn vẹn trong ca làm việc không
        const endHour = Math.floor((slotVal + duration) / 60);
        const endMin = (slotVal + duration) % 60;
        const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

        const isCovered = dutyStart <= time && dutyEnd >= endTimeStr;
        if (!isCovered) return false;

        const hasOverlap = occupiedStaffIds.includes(doc.id);
        return !hasOverlap;
      });

      const unassignedAptsCount = overlappingApts.filter(apt => !apt.bac_si_id).length;
      const finalCount = Math.max(0, availableStaff.length - unassignedAptsCount);

      if (finalCount === 0) {
        return { time, available: false, count: 0, reason: 'Hết nhân sự' };
      }

      return {
        time,
        available: true,
        count: finalCount,
        reason: `Còn ${finalCount} NV`
      };
    });
  }, [selectedServiceId, selectedDoctorId, appointments, schedulesList, staffList, selectedDate, isExam, selectedService, isNewCustomer, selectedCustomer, isReceptionist, baseTimeSlots]);

  // Real-time resource availability (specifically for the selected time slot, used for room allocation and doctor cards)
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedTime || !selectedServiceId) {
      setAvailableDoctors([]);
      return;
    }

    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    const aptStartLocal = new Date(`${selectedDate}T${selectedTime}:00`);
    const aptEndLocal = new Date(aptStartLocal.getTime() + duration * 60000);

    const isOverlapping = (start1: Date, end1: Date, start2Str: string, end2Str: string) => {
      const s2 = new Date(start2Str).getTime();
      const e2 = new Date(end2Str).getTime();
      return start1.getTime() < e2 && end1.getTime() > s2;
    };

    const overlappingApts = appointments.filter(apt => 
      apt.trang_thai !== 'da_huy' &&
      apt.trang_thai !== 'khong_den' &&
      isOverlapping(aptStartLocal, aptEndLocal, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
    );

    const occupiedDoctorIds = overlappingApts.map(apt => apt.bac_si_id).filter(Boolean);

    const staffToFilter = isExam 
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    const filteredDocs = staffToFilter.map(doc => {
      const docSchedules = schedulesList.filter(s => 
        String(s.nguoi_dung_id) === String(doc.id) && 
        s.ngay === selectedDate
      );

      if (docSchedules.length === 0) {
        return { ...doc, available: false, reason: 'Không trực hôm nay' };
      }

      const activeSchedule = docSchedules.find(s => s.trang_thai === 'hoat_dong');
      if (!activeSchedule) {
        return { ...doc, available: false, reason: 'Nghỉ phép cả ngày' };
      }

      const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
      const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

      const isCovered = dutyStart <= selectedTime && dutyEnd > selectedTime;
      if (!isCovered) {
        return { ...doc, available: false, reason: `Trực ca ${dutyStart}-${dutyEnd}` };
      }

      const hasOverlap = occupiedDoctorIds.includes(doc.id);
      if (hasOverlap) {
        return { ...doc, available: false, reason: 'Trùng lịch khám khác' };
      }

      return { ...doc, available: true, reason: `Trực ca ${dutyStart}-${dutyEnd}` };
    });

    setAvailableDoctors(filteredDocs);
  }, [selectedTime, selectedServiceId, appointments, schedulesList, staffList, selectedDate, isExam, selectedService]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      toast.error('Vui lòng chọn khung giờ!');
      return;
    }
    if (!selectedServiceId) {
      toast.error('Vui lòng chọn dịch vụ!');
      return;
    }
    if (!isReceptionist && !selectedDoctorId) {
      toast.error('Vui lòng chọn nhân sự phụ trách!');
      return;
    }
    if (!isNewCustomer && !selectedCustomer) {
      toast.error('Vui lòng tìm và chọn khách hàng!');
      return;
    }

    // Kiểm tra nếu ngày chọn thuộc về quá khứ
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    if (selectedDate < todayStr) {
      toast.error('Không thể đặt lịch hẹn cho ngày trong quá khứ!');
      return;
    }

    // Kiểm tra nếu giờ chọn thuộc về quá khứ của ngày hôm nay
    if (selectedDate === todayStr) {
      const currentVal = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = selectedTime.split(':').map(Number);
      const slotVal = sh * 60 + sm;
      if (slotVal < currentVal) {
        toast.error('Khung giờ được chọn đã trôi qua. Vui lòng chọn khung giờ khác!');
        return;
      }
    }

    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    const startUtcIso = convertToVietnamUtcIso(selectedDate, selectedTime);

    const [h, m] = selectedTime.split(':').map(Number);
    const endMin = (m + duration) % 60;
    const endHour = h + Math.floor((m + duration) / 60);
    const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    const endUtcIso = convertToVietnamUtcIso(selectedDate, endTimeStr);

    const payload = {
      khach_hang_id: isNewCustomer ? null : selectedCustomer.id,
      ho_ten_khach: hoTen,
      so_dien_thoai: sdt,
      gioi_tinh_khach: gioiTinh,
      email: email || null,
      ly_do_kham: lyDo || (selectedPlan ? `Điều trị buổi ${selectedPlan.so_buoi_da_dung + 1}` : 'Khám lượng giá'),
      goi_dich_vu_id: selectedServiceId,
      ngay_gio_bat_dau: startUtcIso,
      ngay_gio_ket_thuc: endUtcIso,
      bac_si_id: isReceptionist ? null : (selectedDoctorId ? Number(selectedDoctorId) : null),
      phong_id: isReceptionist ? null : (selectedRoomId ? Number(selectedRoomId) : null),
      loai_lich: selectedPlan ? 'dieu_tri' : (isExam ? 'kham_moi' : 'dich_vu_don'),
      phac_do_dieu_tri_id: selectedPlan ? selectedPlan.id : null,
      so_thu_tu_buoi: selectedPlan ? selectedPlan.so_buoi_da_dung + 1 : null,
      trang_thai: (!isReceptionist && selectedDoctorId) ? bookingStatus : 'cho_xac_nhan',
      ghi_chu_dat_lich: lyDo || (selectedPlan ? `Đặt lịch trị liệu theo gói ${selectedPlan.ten_goi_dich_vu}` : 'Lập lịch nhanh tại quầy lễ tân')
    };

    await onSubmitApi(payload);
  };

  const selectedSlot = slotDetails.find(s => s.time === selectedTime);

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-black uppercase tracking-wider"
            title="Quay lại bảng"
          >
            <ArrowLeft size={16} className="stroke-[3]" />
            <span>Quay lại bảng</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Stethoscope className="text-emerald-600" size={20} />
              Đăng ký ca {activeType === 'kham' ? 'khám' : 'điều trị'} tại quầy
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Lập lịch nhanh dịch vụ, tự động xác nhận
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmitForm} className="space-y-6 text-left">
        
        {/* Tab chọn Khách hàng Cũ / Khách mới */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hành chính bệnh nhân
            </h4>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setIsNewCustomer(false);
                  handleClearCustomer();
                }}
                className={`px-3 py-1 rounded-md transition-all ${!isNewCustomer ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Khách đã có hồ sơ
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNewCustomer(true);
                  handleClearCustomer();
                }}
                className={`px-3 py-1 rounded-md transition-all ${isNewCustomer ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                + Khách mới (Tạo hồ sơ)
              </button>
            </div>
          </div>

          {/* Khách hàng đã có hồ sơ - Tìm kiếm Autocomplete */}
          {!isNewCustomer && (
            <div className="space-y-3">
              {!selectedCustomer ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng bằng Tên hoặc Số điện thoại (tối thiểu 2 ký tự)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                  />
                  {searchLoading && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <Loader2 className="animate-spin text-slate-400" size={16} />
                    </div>
                  )}

                  {/* Kết quả tìm kiếm */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                      {searchResults.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-3 hover:bg-slate-55 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800">{cust.ho_ten}</p>
                            <p className="text-[10px] text-slate-455 font-mono mt-0.5">{cust.so_dien_thoai || 'Không có SĐT'}</p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Chọn</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Đã chọn khách hàng profile card */
                <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-2xl">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Bệnh nhân liên kết</span>
                      <span className="text-sm font-black text-slate-800 block mt-0.5">{hoTen}</span>
                      <span className="text-[10px] text-slate-450 font-semibold block mt-0.5">SĐT liên hệ: {sdt}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-lg transition-all"
                  >
                    Chọn khách hàng khác
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form tạo mới khách hàng (Nếu là bệnh nhân mới) */}
          {isNewCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Họ tên khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={hoTen}
                  onChange={e => setHoTen(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10,11}"
                  placeholder="0987654321"
                  value={sdt}
                  onChange={e => setSdt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Giới tính</label>
                <select
                  value={gioiTinh}
                  onChange={e => setGioiTinh(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                >
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                  <option value="khac">Khác</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email khách hàng (nếu có)</label>
                <input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                />
              </div>
            </div>
          )}
        </div>

        {/* SĐT có thể sửa đổi nếu cần liên hệ số khác */}
        {!isNewCustomer && selectedCustomer && (
          <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Số điện thoại liên hệ cho ca hẹn này</label>
            <input
              type="tel"
              required
              pattern="[0-9]{10,11}"
              value={sdt}
              onChange={e => setSdt(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono font-bold mt-1"
            />
          </div>
        )}

        {/* GÓI LIỆU TRÌNH ĐANG HOẠT ĐỘNG (Chỉ hiện ở tab điều trị và khi có phác đồ) */}
        {activeType === 'dieu_tri' && selectedCustomer && treatmentPlans.length > 0 && (
          <div className="space-y-3 bg-emerald-50/10 border border-emerald-100/60 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarRange size={14} className="text-emerald-600" />
              Gói liệu trình đang sở hữu của khách ({treatmentPlans.length})
            </h4>
            <p className="text-[10px] text-slate-450 font-semibold italic">Chọn gói bên dưới để tự động điền dịch vụ và tính số buổi:</p>
            
            <div className="grid grid-cols-1 gap-2 mt-2">
              {treatmentPlans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const nextSession = plan.so_buoi_da_dung + 1;
                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={`p-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                        : 'border-slate-150 bg-white hover:border-emerald-350'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800">{plan.ten_goi_dich_vu}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Đã dùng: {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi | Ca tiếp theo: <span className="font-bold text-emerald-600">Buổi {nextSession}</span>
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isSelected ? 'Đang chọn' : `Đặt buổi ${nextSession}`}
                    </span>
                  </div>
                );
              })}
            </div>
            {selectedPlan && (
              <button
                type="button"
                onClick={handleClearPlan}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline mt-1 block"
              >
                Hủy chọn gói (Đặt ca điều trị lẻ khác)
              </button>
            )}
          </div>
        )}

        {/* Dịch vụ khám/trị liệu lẻ (Chỉ cho phép chọn nếu không chọn phác đồ) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
            Dịch vụ đăng ký
          </h4>
          
          {selectedPlan ? (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center select-none">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Gói đặt theo phác đồ</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">{selectedPlan.ten_goi_dich_vu}</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">⏳ Buổi {selectedPlan.so_buoi_da_dung + 1} ({selectedPlan.thoi_luong_phut} phút)</span>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">Khóa dịch vụ</span>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Chọn dịch vụ lẻ *</label>
              <select
                value={selectedServiceId}
                onChange={e => {
                  setSelectedServiceId(e.target.value);
                  setSelectedDoctorId('');
                  setSelectedRoomId('');
                }}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
              >
                <option value="">-- Chọn dịch vụ --</option>
                {filteredServices.map((svc: any) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.ten_goi} ({svc.thoi_luong_phut} phút - {Number(svc.don_gia).toLocaleString()}đ)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Mô tả triệu chứng / Lý do khám / Ghi chú</label>
            <textarea
              rows={2}
              placeholder="Đau mỏi vai gáy cấp tính sau khi ngủ dậy..."
              value={lyDo}
              onChange={e => setLyDo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Chọn khung giờ */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-1.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              Chọn khung giờ đặt lịch
            </h4>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-750 border border-emerald-100 rounded-lg text-xs font-black uppercase tracking-wide">
              Ngày khám: {format(new Date(selectedDate), 'dd/MM/yyyy')}
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {slotDetails.map(slot => {
              const isSelected = selectedTime === slot.time;
              const isAvailable = slot.available;
              
              let badgeStyle = 'text-slate-400';
              if (slot.reason === 'Đã qua') badgeStyle = 'text-slate-400';
              else if (slot.reason === 'Trùng lịch KH') badgeStyle = 'text-rose-500 font-extrabold';
              else if (slot.reason === 'Hết nhân sự') badgeStyle = 'text-amber-500 font-extrabold';
              else if (isAvailable) badgeStyle = isSelected ? 'text-white' : 'text-emerald-600 font-bold';

              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-95'
                      : isAvailable
                        ? 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:shadow-sm'
                        : 'bg-slate-50 border-slate-200/60 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-sm font-black font-mono">{slot.time}</span>
                  <span className={`text-[9px] uppercase tracking-wide mt-0.5 ${badgeStyle}`}>
                    {slot.reason}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedTime && selectedSlot && (
          <div className="space-y-3">
            <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-850">
                {selectedSlot.reason === 'Trùng lịch KH' 
                  ? 'Bệnh nhân đã có lịch hẹn trùng lặp trong khung giờ này.'
                  : `Khung giờ khả dụng: Có ${selectedSlot.count} nhân sự sẵn sàng phục vụ.`}
              </span>
            </div>

            {isTooClose && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                <span className="text-lg">⚠️</span>
                <div className="text-xs font-bold text-amber-800 leading-relaxed text-left">
                  <p className="font-extrabold text-[13px] text-amber-900 mb-0.5">Cảnh báo: Ca hẹn quá gần giờ hiện tại!</p>
                  <p>Lịch này đang được đặt cách thời gian hiện tại {timeDifferenceMinutes} phút. Vui lòng tự chủ động điều phối trực tiếp nhân sự và chuẩn bị phòng làm việc hợp lý.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUẢN LÝ THÌ MỚI HIỆN PHẦN CHỌN NHÂN SỰ VÀ TỰ ĐỘNG KHÓA PHÒNG TRỰC */}
        {selectedTime && !isReceptionist && (
          <>
            {/* Chọn Bác Sĩ / KTV (Không bắt buộc) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  {isExam ? 'Phân bổ Bác sĩ phụ trách' : 'Phân bổ Kỹ thuật viên phụ trách'}
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold italic">(Không bắt buộc)</span>
              </div>
              
              {selectedDoctorId && (
                <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                  <span className="text-xs font-bold text-slate-500">Trạng thái ca hẹn:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs font-black cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="bookingStatus"
                        checked={bookingStatus === 'da_checkin'}
                        onChange={() => setBookingStatus('da_checkin')}
                        className="accent-emerald-600"
                      />
                      Khách đã đến (Check-in)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-black cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="bookingStatus"
                        checked={bookingStatus === 'da_xac_nhan'}
                        onChange={() => setBookingStatus('da_xac_nhan')}
                        className="accent-emerald-600"
                      />
                      Đặt lịch trước (Xác nhận)
                    </label>
                  </div>
                </div>
              )}

              {availableDoctors.length === 0 ? (
                <div className="text-sm text-slate-400 italic">Không tìm thấy thông tin nhân sự khả dụng.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableDoctors.map(doc => {
                    const isSelected = String(selectedDoctorId) === String(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => doc.available && setSelectedDoctorId(String(doc.id))}
                        className={`p-3.5 border rounded-2xl flex items-center gap-3 transition-all ${
                          doc.available 
                            ? isSelected
                              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10 cursor-pointer'
                              : 'border-slate-150 bg-white hover:border-emerald-300 hover:shadow-sm cursor-pointer'
                            : 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          doc.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-555'
                        }`}>
                          {isExam ? 'BS' : 'KTV'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{doc.ho_ten}</p>
                          <p className="text-[10px] font-semibold text-slate-450 mt-0.5">{doc.reason}</p>
                        </div>
                        {doc.available && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isSelected ? 'Đã chọn' : 'Sẵn sàng'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TỰ ĐỘNG KHÓA VÀ HIỂN THỊ PHÒNG TRỰC CỦA CHUYÊN GIA (Không cho chọn thủ công) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  Phòng chuyên khoa / trị liệu gán ca trực
                </h4>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center select-none animate-in fade-in duration-200">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Phòng trực ca làm việc</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">
                    {selectedRoomId ? (roomsList.find(r => String(r.id) === String(selectedRoomId))?.ten_phong || 'Phòng làm việc') : 'Chưa xếp phòng trực'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                    {selectedDoctorId ? '✓ Tự động gán theo cấu hình ca trực' : '⚠️ Sẽ tự động phân phòng khi gán nhân sự'}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-400 bg-slate-100/80 px-3 py-1 rounded-xl">Đã khóa</span>
              </div>
            </div>
          </>
        )}
      </form>

      {/* Footer Buttons */}
      <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-650 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
        >
          Quay lại bảng
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold rounded-xl hover:bg-rose-100/60 transition-all active:scale-95"
        >
          Hủy tạo lịch
        </button>
        <button
          type="button"
          disabled={bookingLoading || !selectedTime || !selectedServiceId || (!isNewCustomer && !selectedCustomer) || (!isReceptionist && !selectedDoctorId)}
          onClick={() => {
            const form = document.querySelector('form');
            if (form) form.requestSubmit();
          }}
          className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {bookingLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Đang ghi nhận...
            </>
          ) : (
            'Xác nhận đăng ký'
          )}
        </button>
      </div>
    </div>
  );
}
