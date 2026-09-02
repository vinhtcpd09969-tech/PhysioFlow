import React, { useState, useEffect } from 'react';
import { Stethoscope, ArrowLeft, X, Info } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axios';
import { getSmartSearchScore } from '../../../utils/smartSearch';
import { StaffWorkloadModal } from '../../../features/receptionist/components/StaffWorkloadModal';
import { ServiceSelect } from '../../../features/receptionist/components/walkin/ServiceSelect';
import { WalkInPaymentModal } from '../../../features/receptionist/components/walkin/WalkInPaymentModal';

import {
  WalkInCustomerSearch,
  newCustomerSchema,
  phoneRegex,
  NewCustomerErrors
} from '../../../features/receptionist/components/walkin/WalkInCustomerSearch';
import {
  WalkInTreatmentPlansList,
  isPlanBookable
} from '../../../features/receptionist/components/walkin/WalkInTreatmentPlansList';
import {
  WalkInBuoiStaffPicker,
  BUOI_INFO,
  Buoi
} from '../../../features/receptionist/components/walkin/WalkInBuoiStaffPicker';

function isBuoiDaQua(dateStr: string, buoi: Buoi): boolean {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = BUOI_INFO[buoi].ketThuc.split(':').map(Number);
  return nowMinutes >= h * 60 + m;
}

export interface WalkInBookingModalProps {
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
  initialCustomerId?: string;
  initialServiceId?: string;
  onDateChange?: (date: Date) => void;
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
  activeType = 'kham',
  isReceptionist = false,
  selectedDateStr,
  initialCustomerId,
  initialServiceId,
  onDateChange
}: WalkInBookingModalProps) {
  const navigate = useNavigate();
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [showPlansList, setShowPlansList] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form states
  const [hoTen, setHoTen] = useState('');
  const [newCustomerErrors, setNewCustomerErrors] = useState<NewCustomerErrors>({});
  const [sdt, setSdt] = useState('');
  const [gioiTinh, setGioiTinh] = useState('nam');
  const [email, setEmail] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [selectedDate, setSelectedDate] = useState(selectedDateStr);
  useEffect(() => {
    setSelectedDate(selectedDateStr);
  }, [selectedDateStr]);

  const [selectedBuoi, setSelectedBuoi] = useState<Buoi | ''>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'da_checkin' | 'da_xac_nhan'>('da_checkin');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isFutureDateRestrict = isReceptionist && selectedDate > todayStr;

  useEffect(() => {
    if (isFutureDateRestrict && bookingStatus === 'da_checkin') {
      setBookingStatus('da_xac_nhan');
    }
  }, [selectedDate, isFutureDateRestrict, bookingStatus]);

  const [buoiAvailability, setBuoiAvailability] = useState<{
    sang: { conLaiChung: number; choPhep: boolean };
    chieu: { conLaiChung: number; choPhep: boolean };
    nhanSu: Array<{ id: number; ho_ten: string; anh_dai_dien: string | null; caTruc: string; conLaiSang: number; conLaiChieu: number }>;
  }>({ sang: { conLaiChung: 0, choPhep: false }, chieu: { conLaiChung: 0, choPhep: false }, nhanSu: [] });

  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [packageManuallyCleared, setPackageManuallyCleared] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);

  const filteredServices = React.useMemo(() => {
    return servicesList.filter((svc: any) => {
      if (activeType === 'kham') {
        return svc.loai_goi === 'KHAM' || svc.loai_dich_vu === 'KHAM';
      } else {
        return (svc.loai_goi !== 'KHAM' && svc.loai_dich_vu !== 'KHAM') && (svc.tong_so_buoi === 1 || !svc.tong_so_buoi);
      }
    });
  }, [servicesList, activeType]);

  useEffect(() => {
    if (selectedPlan) {
      setShowPlansList(true);
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (initialCustomerId) {
      const fetchAndSelectCustomer = async () => {
        try {
          const res = await axiosInstance.get('/admin/customers');
          const list = res.data || [];
          const found = list.find((c: any) => String(c.khach_hang_id || c.id) === String(initialCustomerId));
          if (found) {
            const normalized = {
              ...found,
              id: found.khach_hang_id || found.id,
              ho_ten: found.ho_ten,
              so_dien_thoai: found.so_dien_thoai,
              gioi_tinh: found.gioi_tinh,
              email: found.email
            };
            setSelectedCustomer(normalized);
            setHoTen(normalized.ho_ten);
            setSdt(normalized.so_dien_thoai || '');
            setGioiTinh(normalized.gioi_tinh || 'nam');
            setEmail(normalized.email || '');
          }
        } catch (err) {
          console.error('Error prefetching customer:', err);
        }
      };
      fetchAndSelectCustomer();
    }
  }, [initialCustomerId]);

  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(String(initialServiceId));
    }
  }, [initialServiceId]);

  const activeCustomerAppts = React.useMemo(() => {
    if (!selectedCustomer) return [];
    return (appointments || []).filter(apt =>
      String(apt.khach_hang_id) === String(selectedCustomer.id) &&
      !['hoan_thanh', 'da_huy', 'khong_den'].includes(apt.trang_thai)
    );
  }, [selectedCustomer, appointments]);

  const sameDayActiveAppts = React.useMemo(() => {
    if (!selectedCustomer || !selectedDate) return [];
    return activeCustomerAppts.filter(apt => {
      const aDate = apt.ngay_gio_bat_dau ? String(apt.ngay_gio_bat_dau).slice(0, 10) : '';
      return aDate === selectedDate;
    });
  }, [selectedCustomer, selectedDate, activeCustomerAppts]);

  const hasReachedLimit = activeCustomerAppts.length >= 3;

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axiosInstance.get('/admin/customers');
        const list = res.data || [];
        const query = searchQuery.trim();
        const scored = list
          .map((c: any) => ({
            ...c,
            score: getSmartSearchScore([c.ho_ten, c.so_dien_thoai, c.email].filter(Boolean).join(' '), query)
          }))
          .filter((c: any) => c.score > 0)
          .sort((a: any, b: any) => b.score - a.score);
        setSearchResults(scored.slice(0, 5));
      } catch (err) {
        console.error('Error searching customers:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const custId = selectedCustomer?.id || selectedCustomer?.khach_hang_id;
    if (!selectedCustomer || !custId || isNewCustomer) {
      setTreatmentPlans([]);
      setSelectedPlan(null);
      return;
    }
    const fetchPlans = async () => {
      try {
        const res = await axiosInstance.get(`/receptionist/customers/${custId}/treatment-plans`);
        const list = res.data || [];
        setTreatmentPlans(list);
        setPackageManuallyCleared(false);
        if (initialServiceId) {
          const matched = list.find((p: any) => String(p.goi_dich_vu_id) === String(initialServiceId));
          if (matched && matched.trang_thai === 'dang_dieu_tri' && isPlanBookable(matched)) {
            setSelectedPlan(matched);
            setSelectedServiceId(matched.goi_dich_vu_id);
          }
        }
      } catch (err) {
        console.error('Error fetching treatment plans:', err);
      }
    };
    fetchPlans();
  }, [selectedCustomer, isNewCustomer, initialServiceId]);

  const handleSelectCustomer = (customer: any) => {
    const custId = customer.id || customer.khach_hang_id;
    setSelectedCustomer({ ...customer, id: custId });
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
    setNewCustomerErrors({});
    setTreatmentPlans([]);
    setSelectedPlan(null);
    setSelectedServiceId('');
  };

  const handleSelectPlan = (plan: any) => {
    if (!isPlanBookable(plan)) return;
    setSelectedPlan(plan);
    setSelectedServiceId(plan.goi_dich_vu_id);
    setSelectedDoctorId('');
    setSelectedRoomId('');
  };

  const handleClearPlan = () => {
    setSelectedPlan(null);
    setPackageManuallyCleared(true);
    setSelectedServiceId('');
  };

  const goToPackagePayment = (plan: any) => {
    const dest = isReceptionist ? '/receptionist/billing' : '/admin/finance';
    if (plan.hinh_thuc_thanh_toan_goi === 'tung_buoi' && selectedCustomer) {
      const checkoutDest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
      navigate(`${checkoutDest}?customer_id=${selectedCustomer.id}&goi_dich_vu_id=${plan.goi_dich_vu_id}`);
      return;
    }
    navigate(`${dest}?hoa_don_id=${plan.hoa_don_id}`);
  };

  const goToPackageActivation = (plan: any) => {
    const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
    navigate(`${dest}?lich_dat_id=${plan.cuoc_hen_id}`);
  };

  const selectedService = servicesList.find((s: any) => String(s.id) === String(selectedServiceId));
  const isExam = selectedService ? (selectedService.loai_goi === 'KHAM' || selectedService.loai_dich_vu === 'KHAM') : true;

  const matchingSameDayActiveAppts = React.useMemo(() => {
    if (!selectedCustomer || !selectedDate || !selectedServiceId) return [];

    return sameDayActiveAppts.filter((apt: any) => {
      // 1. So khớp theo ID dịch vụ / gói dịch vụ
      const aptServiceId = String(apt.dich_vu_id || apt.goi_dich_vu_id || apt.goi_dich_vu?.id || '');
      if (aptServiceId && aptServiceId === String(selectedServiceId)) {
        return true;
      }

      // 2. So khớp theo tên gói / dịch vụ (khớp chính xác hoặc chuỗi con)
      const curServiceName = (selectedPlan?.ten_goi_dich_vu || selectedService?.ten_goi || selectedService?.ten_dich_vu || '').trim().toLowerCase();
      const aptServiceName = (apt.ten_dich_vu || apt.ten_goi_dich_vu || apt.goi_dich_vu?.ten_goi || apt.ly_do_kham || '').trim().toLowerCase();
      if (curServiceName && aptServiceName && (curServiceName === aptServiceName || aptServiceName.includes(curServiceName) || curServiceName.includes(aptServiceName))) {
        return true;
      }

      return false;
    });
  }, [selectedCustomer, selectedDate, selectedServiceId, selectedPlan, selectedService, sameDayActiveAppts]);

  useEffect(() => {
    if (!selectedDate || !selectedServiceId) {
      setBuoiAvailability({ sang: { conLaiChung: 0, choPhep: false }, chieu: { conLaiChung: 0, choPhep: false }, nhanSu: [] });
      return;
    }
    let cancelled = false;
    axiosInstance.get('/client/appointments/buoi-availability', { params: { date: selectedDate, dichVuId: selectedServiceId } })
      .then(res => { if (!cancelled) setBuoiAvailability(res.data); })
      .catch(() => { if (!cancelled) setBuoiAvailability({ sang: { conLaiChung: 0, choPhep: false }, chieu: { conLaiChung: 0, choPhep: false }, nhanSu: [] }); });
    return () => { cancelled = true; };
  }, [selectedDate, selectedServiceId]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setSelectedRoomId('');
      return;
    }
    const activeSchedule = schedulesList.find(s =>
      String(s.nguoi_dung_id) === String(selectedDoctorId) &&
      s.ngay === selectedDate &&
      s.trang_thai === 'hoat_dong'
    );
    setSelectedRoomId(activeSchedule?.phong_id ? String(activeSchedule.phong_id) : '');
  }, [selectedDoctorId, selectedDate, schedulesList]);

  const availableDoctors = React.useMemo(() => {
    if (!selectedBuoi || !selectedServiceId) return [];
    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    const staffToFilter = isExam
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    const todayStrFilter = format(new Date(), 'yyyy-MM-dd');

    return staffToFilter.map(doc => {
      const docApts = (appointments || []).filter(apt => {
        const assignedId = apt.bac_si_id || apt.chuyen_gia_id || apt.ky_thuat_vien_id || apt.nhan_su_id;
        let aptDateStr = '';
        try {
          aptDateStr = format(new Date(apt.ngay_gio_bat_dau || apt.thoi_gian_checkin || ''), 'yyyy-MM-dd');
        } catch (e) {}
        return String(assignedId) === String(doc.id) &&
          aptDateStr === selectedDate &&
          apt.trang_thai !== 'da_huy' &&
          apt.trang_thai !== 'khong_den';
      });

      const docAptsCount = docApts.length;
      const checkedInApts = docApts.filter(apt => ['da_checkin', 'dang_kham'].includes(apt.trang_thai));
      const checkedInCount = checkedInApts.length;
      const isWorkingNow = checkedInApts.some(apt => apt.trang_thai === 'dang_kham');
      const isWaitingQueueCount = checkedInApts.filter(apt => apt.trang_thai === 'da_checkin').length;

      const nhanSuInfo = buoiAvailability.nhanSu.find(n => String(n.id) === String(doc.id));
      if (!nhanSuInfo) {
        return {
          ...doc,
          occupiedCount: docAptsCount,
          checkedInCount,
          isWorkingNow,
          isWaitingQueueCount,
          available: false,
          reason: 'Không trực hôm nay'
        };
      }

      const conLai = selectedBuoi === 'sang' ? nhanSuInfo.conLaiSang : nhanSuInfo.conLaiChieu;
      if (conLai < duration) {
        return {
          ...doc,
          occupiedCount: docAptsCount,
          checkedInCount,
          isWorkingNow,
          isWaitingQueueCount,
          available: false,
          reason: `Trực ${nhanSuInfo.caTruc} — không đủ chỗ`,
          endsEarly: false
        };
      }

      const gioKetThucTruc = nhanSuInfo.caTruc.split('-')[1];

      if (selectedDate === todayStrFilter && gioKetThucTruc) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const [endH, endM] = gioKetThucTruc.split(':').map(Number);
        if (nowMinutes >= endH * 60 + endM) {
          return {
            ...doc,
            occupiedCount: docAptsCount,
            checkedInCount,
            isWorkingNow,
            isWaitingQueueCount,
            available: false,
            reason: `Đã tan ca (${nhanSuInfo.caTruc}) — không còn tại phòng khám`,
            endsEarly: false
          };
        }
      }

      const gioKetThucBuoi = BUOI_INFO[selectedBuoi].ketThuc;
      const endsEarly = !!gioKetThucTruc && gioKetThucTruc < gioKetThucBuoi;

      let statusReason = `Trực ${nhanSuInfo.caTruc}`;
      if (checkedInCount > 0) {
        statusReason = `Đang bận (${checkedInCount} khách check-in/hàng chờ)`;
      }

      return {
        ...doc,
        occupiedCount: docAptsCount,
        checkedInCount,
        isWorkingNow,
        isWaitingQueueCount,
        available: true,
        reason: statusReason,
        endsEarly,
        gioKetThucTruc
      };
    });
  }, [selectedBuoi, selectedServiceId, buoiAvailability, staffList, appointments, selectedDate, isExam, selectedService]);

  useEffect(() => {
    if (!selectedDoctorId) return;
    const selectedDocObj = availableDoctors.find(d => String(d.id) === String(selectedDoctorId));
    if (!selectedDocObj || !selectedDocObj.available) {
      setSelectedDoctorId('');
      setSelectedRoomId('');
    }
  }, [availableDoctors, selectedDoctorId]);

  const handleProceedToPayment = async () => {
    setShowPaymentModal(false);
    let customerId = selectedCustomer?.id;
    if (isNewCustomer) {
      try {
        const res = await axiosInstance.post('/admin/customers', {
          ho_ten: hoTen,
          so_dien_thoai: sdt,
          gioi_tinh: gioiTinh,
          email: email || null
        });
        customerId = res.data?.id || res.data?.customer?.id;
      } catch (err: any) {
        toast.error('Không thể tạo thông tin khách hàng mới');
        return;
      }
    }

    const isPlanRec = selectedPlan && selectedPlan.trang_thai === 'khuyen_nghi';
    const activePlan = selectedPlan && !isPlanRec ? selectedPlan : null;

    const draftPayload = {
      khach_hang_id: customerId,
      ho_ten_khach: hoTen,
      so_dien_thoai: sdt,
      gioi_tinh_khach: gioiTinh,
      email: email || null,
      ly_do_kham: lyDo || (activePlan ? `Điều trị buổi ${Number(activePlan.so_buoi_da_dung || 0) + 1}` : (isPlanRec ? `Trị liệu theo chỉ định: ${selectedPlan.ten_goi_dich_vu}` : 'Lượng giá chức năng')),
      goi_dich_vu_id: selectedServiceId,
      ngay: selectedDate,
      buoi: selectedBuoi,
      bac_si_id: selectedDoctorId ? Number(selectedDoctorId) : null,
      phong_id: selectedRoomId ? Number(selectedRoomId) : null,
      loai_lich: activePlan ? 'dieu_tri' : (isExam ? 'kham_moi' : 'dich_vu_don'),
      phac_do_dieu_tri_id: activePlan ? activePlan.id : null,
      so_thu_tu_buoi: activePlan ? Number(activePlan.so_buoi_da_dung || 0) + 1 : null,
      trang_thai: 'da_checkin',
      ghi_chu_dat_lich: lyDo || (activePlan ? `Đặt lịch trị liệu theo gói ${activePlan.ten_goi_dich_vu}` : (isPlanRec ? 'Đặt lịch trị liệu theo chỉ định y khoa' : 'Lập lịch nhanh tại quầy lễ tân'))
    };

    sessionStorage.setItem('draft_walkin_checkin', JSON.stringify(draftPayload));
    onClose();

    const billingRoute = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
    toast.success('💳 Chuyển sang màn hình thu tiền. Vui lòng thanh toán để tạo & Check-in ca hẹn!');
    navigate(`${billingRoute}?draft_walkin=true`);
  };

  const executeSubmit = async (shouldPayNow: boolean, overrideStatus?: 'da_checkin' | 'da_xac_nhan') => {
    const isPlanRec = selectedPlan && selectedPlan.trang_thai === 'khuyen_nghi';
    const activePlan = selectedPlan && !isPlanRec ? selectedPlan : null;
    const finalStatus = overrideStatus || (shouldPayNow ? 'da_xac_nhan' : bookingStatus);

    const payload = {
      khach_hang_id: isNewCustomer ? null : selectedCustomer.id,
      ho_ten_khach: hoTen,
      so_dien_thoai: sdt,
      gioi_tinh_khach: gioiTinh,
      email: email || null,
      ly_do_kham: lyDo || (activePlan ? `Điều trị buổi ${Number(activePlan.so_buoi_da_dung || 0) + 1}` : (isPlanRec ? `Trị liệu theo chỉ định: ${selectedPlan.ten_goi_dich_vu}` : 'Lượng giá chức năng')),
      goi_dich_vu_id: selectedServiceId,
      ngay: selectedDate,
      buoi: selectedBuoi,
      bac_si_id: selectedDoctorId ? Number(selectedDoctorId) : null,
      phong_id: selectedRoomId ? Number(selectedRoomId) : null,
      loai_lich: activePlan ? 'dieu_tri' : (isExam ? 'kham_moi' : 'dich_vu_don'),
      phac_do_dieu_tri_id: activePlan ? activePlan.id : null,
      so_thu_tu_buoi: activePlan ? Number(activePlan.so_buoi_da_dung || 0) + 1 : null,
      trang_thai: finalStatus,
      shouldPayNow,
      ghi_chu_dat_lich: lyDo || (activePlan ? `Đặt lịch trị liệu theo gói ${activePlan.ten_goi_dich_vu}` : (isPlanRec ? 'Đặt lịch trị liệu theo chỉ định y khoa' : 'Lập lịch nhanh tại quầy lễ tân'))
    };

    await onSubmitApi(payload);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuoi) {
      toast.error('Vui lòng chọn buổi!');
      return;
    }
    if (!selectedServiceId) {
      toast.error('Vui lòng chọn dịch vụ!');
      return;
    }
    if (!isNewCustomer && !selectedCustomer) {
      toast.error('Vui lòng tìm và chọn khách hàng!');
      return;
    }
    if (isNewCustomer) {
      const parsed = newCustomerSchema.safeParse({ hoTen, sdt, email });
      if (!parsed.success) {
        const errs: NewCustomerErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as keyof NewCustomerErrors;
          if (!errs[field]) errs[field] = issue.message;
        }
        setNewCustomerErrors(errs);
        toast.error(parsed.error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin khách hàng mới.');
        return;
      }
      setNewCustomerErrors({});
    } else if (sdt && !phoneRegex.test(sdt.trim())) {
      toast.error('Số điện thoại liên hệ không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
      return;
    }
    if (selectedPlan && !isPlanBookable(selectedPlan)) {
      const nextSession = Number(selectedPlan.so_buoi_da_dung || 0) + 1;
      toast.error(
        selectedPlan.lich_dang_hoat_dong
          ? `Buổi ${selectedPlan.lich_dang_hoat_dong.so_thu_tu_buoi} của gói này đang có lịch hoạt động. Vui lòng hoàn thành hoặc hủy lịch cũ trước khi đặt buổi tiếp theo!`
          : `Gói chưa thanh toán đủ. Vui lòng thu tiền trước khi đặt buổi số ${nextSession}!`
      );
      return;
    }

    const now = new Date();
    const todayStrCheck = format(now, 'yyyy-MM-dd');
    if (selectedDate < todayStrCheck) {
      toast.error('Không thể đặt lịch hẹn cho ngày trong quá khứ!');
      return;
    }

    if (isBuoiDaQua(selectedDate, selectedBuoi)) {
      toast.error('Buổi được chọn đã qua giờ nhận khách. Vui lòng chọn buổi khác!');
      return;
    }

    const servicePrice = Number(selectedService?.don_gia ?? selectedService?.gia_dich_vu ?? selectedService?.gia_tien ?? 0);
    const requiresPrepayment = bookingStatus === 'da_checkin' && isExam && servicePrice > 0;

    if (requiresPrepayment) {
      setShowPaymentModal(true);
      return;
    }

    await executeSubmit(false);
  };

  const buoiOptions = (['sang', 'chieu'] as const).map(key => {
    const info = buoiAvailability[key];
    const daQua = isBuoiDaQua(selectedDate, key);
    return { key, info, daQua, disabled: daQua || !info.choPhep };
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-slate-100 dark:border-zinc-800 shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 font-jakarta">
              Đăng ký ca {activeType === 'kham' ? 'lượng giá chức năng' : 'trị liệu'} tại quầy
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold mt-0.5">
              Lập lịch nhanh dịch vụ, tự động xác nhận
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-9 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
          title="Đóng form"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmitForm} noValidate className="space-y-6 text-left">
        {/* 1. Customer Search & Info */}
        <WalkInCustomerSearch
          isNewCustomer={isNewCustomer}
          setIsNewCustomer={setIsNewCustomer}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchLoading={searchLoading}
          searchResults={searchResults}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={handleSelectCustomer}
          onClearCustomer={handleClearCustomer}
          hoTen={hoTen}
          setHoTen={setHoTen}
          sdt={sdt}
          setSdt={setSdt}
          gioiTinh={gioiTinh}
          setGioiTinh={setGioiTinh}
          email={email}
          setEmail={setEmail}
          newCustomerErrors={newCustomerErrors}
          hasReachedLimit={hasReachedLimit}
        />

        {/* 2. Treatment plans list (if existing) */}
        {activeType === 'dieu_tri' && selectedCustomer && treatmentPlans.length > 0 && (
          <WalkInTreatmentPlansList
            treatmentPlans={treatmentPlans}
            selectedPlan={selectedPlan}
            onSelectPlan={handleSelectPlan}
            onClearPlan={handleClearPlan}
            showPlansList={showPlansList}
            setShowPlansList={setShowPlansList}
            onGoToActivation={goToPackageActivation}
            onGoToPayment={goToPackagePayment}
          />
        )}

        {/* 3. Service Selection */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
            Dịch vụ đăng ký *
          </h4>
          
          {selectedPlan ? (
            <div className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 p-4 rounded-2xl relative select-none">
              <button
                type="button"
                onClick={handleClearPlan}
                title="Hủy khóa dịch vụ này, chọn dịch vụ khác"
                className="absolute top-3 right-3 size-6 rounded-full bg-slate-200 dark:bg-zinc-700 hover:bg-rose-100 hover:text-rose-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pr-8">
                {selectedPlan.trang_thai === 'khuyen_nghi' ? 'Dịch vụ lẻ chỉ định' : 'Gói đặt theo phác đồ'}
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-zinc-100 block mt-0.5 pr-8">{selectedPlan.ten_goi_dich_vu}</span>
              {selectedPlan.trang_thai !== 'khuyen_nghi' ? (
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">⏳ Buổi {Number(selectedPlan.so_buoi_da_dung || 0) + 1} ({selectedPlan.thoi_luong_phut} phút)</span>
              ) : (
                <span className="text-[10px] text-amber-600 font-bold block mt-0.5">⏳ {selectedPlan.thoi_luong_phut} phút (Chỉ định)</span>
              )}
            </div>
          ) : (
            <div>
              <ServiceSelect
                services={filteredServices}
                value={selectedServiceId}
                onChange={(id) => {
                  setSelectedServiceId(id);
                  setSelectedDoctorId('');
                  setSelectedRoomId('');
                }}
                disabled={!!initialServiceId && !packageManuallyCleared}
              />
            </div>
          )}

          {/* Thông báo nhắc nhở KHI ĐÃ CHỌN GÓI và gói đó TRÙNG với gói chưa hoàn thành trong ngày */}
          {matchingSameDayActiveAppts.length > 0 && (
            <div className="p-3.5 bg-amber-50/90 dark:bg-amber-955/30 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                <Info size={15} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 text-xs space-y-1.5">
                <p className="font-black text-amber-900 dark:text-amber-200 text-[11px] uppercase tracking-wide">
                  💡 Khách hàng đang có {matchingSameDayActiveAppts.length} lịch hẹn cho gói này chưa hoàn thành trong ngày ({selectedDate ? selectedDate.split('-').reverse().join('/') : ''}):
                </p>
                <div className="space-y-1">
                  {matchingSameDayActiveAppts.map((apt: any, idx: number) => {
                    const buoiStr = apt.buoi === 'sang' ? 'Buổi Sáng' : apt.buoi === 'chieu' ? 'Buổi Chiều' : 'Trong ngày';
                    const statusText = apt.trang_thai === 'da_xac_nhan' ? 'Đã xác nhận'
                      : apt.trang_thai === 'da_checkin' ? 'Đã check-in'
                      : apt.trang_thai === 'dang_kham' ? 'Đang thực hiện'
                      : apt.trang_thai === 'cho_tai_luong_gia' ? 'Chờ tái lượng giá'
                      : apt.trang_thai;
                    const serviceName = apt.ten_dich_vu || apt.ten_goi_dich_vu || apt.ly_do_kham || selectedPlan?.ten_goi_dich_vu || selectedService?.ten_goi || 'Gói dịch vụ';

                    return (
                      <div key={apt.id || idx} className="flex items-center justify-between text-[11px] bg-white/80 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 shadow-2xs">
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate mr-2">
                          • <strong className="font-bold text-amber-950 dark:text-amber-100">{serviceName}</strong> {apt.so_thu_tu_buoi ? `(Buổi ${apt.so_thu_tu_buoi})` : ''}
                        </span>
                        <span className="text-amber-800 dark:text-amber-300 font-bold shrink-0 text-[10px]">
                          {buoiStr} · <span className="underline decoration-amber-400 font-black">{statusText}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Mô tả triệu chứng / Lý do đến / Ghi chú</label>
            <textarea
              rows={2}
              placeholder="Đau mỏi vai gáy cấp tính sau khi ngủ dậy..."
              value={lyDo}
              onChange={e => setLyDo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-slate-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* 4. Shift & Staff Picker */}
        <WalkInBuoiStaffPicker
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedBuoi={selectedBuoi}
          setSelectedBuoi={setSelectedBuoi}
          onDateChange={onDateChange}
          setShowWorkloadModal={setShowWorkloadModal}
          buoiOptions={buoiOptions}
          isFutureDateRestrict={isFutureDateRestrict}
          bookingStatus={bookingStatus}
          setBookingStatus={setBookingStatus}
          isExam={isExam}
          isReceptionist={isReceptionist}
          selectedDoctorId={selectedDoctorId}
          setSelectedDoctorId={setSelectedDoctorId}
          availableDoctors={availableDoctors}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          roomsList={roomsList}
        />
      </form>

      {/* Footer Buttons */}
      <div className="pt-5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-zinc-700 shadow-2xs hover:scale-105"
        >
          <ArrowLeft size={16} className="text-teal-600 dark:text-teal-400 stroke-[3]" />
          <span>QUAY LẠI BẢNG</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-950/80 transition-all cursor-pointer"
          >
            ✕ HỦY TẠO
          </button>
          <button
            type="button"
            disabled={bookingLoading || !selectedBuoi || !selectedServiceId || (!isNewCustomer && !selectedCustomer) || hasReachedLimit || (!!selectedPlan && !isPlanBookable(selectedPlan))}
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-jakarta"
          >
            {bookingLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang ghi nhận...
              </>
            ) : (
              '🚀 XÁC NHẬN ĐĂNG KÝ (ENTER)'
            )}
          </button>
        </div>
      </div>

      {/* Popups */}
      <WalkInPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedService={selectedService}
        onProceedToPayment={handleProceedToPayment}
        onSaveAsConfirmed={() => {
          setShowPaymentModal(false);
          setBookingStatus('da_xac_nhan');
          executeSubmit(false, 'da_xac_nhan');
        }}
      />
      <StaffWorkloadModal
        isOpen={showWorkloadModal}
        onClose={() => setShowWorkloadModal(false)}
        dateStr={selectedDate}
      />
    </div>
  );
}
