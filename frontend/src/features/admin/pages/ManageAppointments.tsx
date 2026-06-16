import { useEffect, useState, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Calendar as CalendarIcon,
  CalendarDays,
  HelpCircle
} from 'lucide-react';
import axiosInstance from '../../../api/axios';
import { format, addDays, subDays, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores/authStore';

// Import Components đã bóc tách
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentWeeklyCalendar from '../components/AppointmentWeeklyCalendar';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import TreatmentBookingModal from '../components/TreatmentBookingModal';
import CreateTreatmentRecordModal from '../components/CreateTreatmentRecordModal';
import AssignTreatmentModal from '../components/AssignTreatmentModal';

const statusConfig = {
  chua_xac_nhan: { label: 'Chưa xác nhận', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <HelpCircle size={14} /> },
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle size={14} /> },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle2 size={14} /> },
  da_checkin: { label: 'Đã Check-in', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: <PlayCircle size={14} /> },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={14} /> },
  cho_huy: { label: 'Chờ hủy', color: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse', icon: <XCircle size={14} className="text-rose-600 animate-pulse" /> },
  da_huy: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} /> },
  khong_den: { label: 'Không đến', color: 'bg-slate-200 text-slate-700 border-slate-300', icon: <XCircle size={14} /> },
};

export default function ManageAppointments() {
  const user = useAuthStore(state => state.user);

  const [viewRole, setViewRole] = useState<'manager' | 'receptionist' | 'doctor'>(() => {
    if (user?.vai_tro_id === 4) return 'doctor';
    if (user?.vai_tro_id === 2) return 'receptionist';
    return 'manager';
  });

  const [appointments, setAppointments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const scheduleType = 'kham_moi'; // Hardcoded cho màn hình Lịch Hẹn Khám
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals State
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);

  // New states for Treatment Records (ho_so_dieu_tri)
  const [treatmentRecords, setTreatmentRecords] = useState<any[]>([]);
  const [isCreateRecordModalOpen, setIsCreateRecordModalOpen] = useState(false);
  const [activeAptForTreatmentRecord, setActiveAptForTreatmentRecord] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRecordForAssign, setSelectedRecordForAssign] = useState<any>(null);
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState<string>('');
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState<string>('all');
  const [managerActiveTab, setManagerActiveTab] = useState<'treatments' | 'clinical'>('treatments');
  const [receptionistActiveTab, setReceptionistActiveTab] = useState<'calendar' | 'new_bookings' | 'final_confirm'>('calendar');
  const [cancelAptId, setCancelAptId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const prevPendingCountRef = useRef<number>(-1);

  // Assignment State in Detail Modal
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [assignRoomId, setAssignRoomId] = useState<string>('');
  const [assignStatus, setAssignStatus] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Treatment Booking Form State
  const [treatmentType, setTreatmentType] = useState<'single' | 'package'>('single');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedKtvId, setSelectedKtvId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [treatmentDate, setTreatmentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [treatmentTime, setTreatmentTime] = useState<string>('09:00');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [aptRes, staffRes, serviceRes, packageRes, roomsRes, treatmentRes] = await Promise.all([
        axiosInstance.get('/admin/appointments'),
        axiosInstance.get('/admin/staff'),
        axiosInstance.get('/admin/services'),
        axiosInstance.get('/admin/packages').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/rooms').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/treatment-records').catch(() => ({ data: [] }))
      ]);

      setAppointments(aptRes.data);
      setStaffList(staffRes.data);
      setServices(serviceRes.data);
      setPackages(packageRes.data || []);
      setRoomsList(roomsRes.data || []);

      const newRecords = treatmentRes.data || [];
      setTreatmentRecords(newRecords);

      // Real-time Manager alert on new treatment records (cho_dieu_phoi)
      if (viewRole === 'manager') {
        const pendingCount = newRecords.filter((r: any) => r.trang_thai === 'cho_dieu_phoi').length;
        if (prevPendingCountRef.current !== -1 && pendingCount > prevPendingCountRef.current) {
          toast("Có hồ sơ điều trị mới cần điều phối từ Bác sĩ!", { icon: "🩺", duration: 8000 });
        }
        prevPendingCountRef.current = pendingCount;
      } else {
        prevPendingCountRef.current = -1;
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      if (!silent) toast.error('Không thể tải dữ liệu lịch hẹn');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 10-second polling for real-time alerts & automatic dashboard list updates
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [viewRole]);

  const handleUpdateAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setIsAssigning(true);

      let finalStatus = assignStatus;
      if ((selectedAppointment.trang_thai === 'cho_phan_phong' || selectedAppointment.trang_thai === 'chua_xac_nhan') && assignStaffId && assignRoomId) {
        finalStatus = 'cho_xac_nhan';
      }

      await axiosInstance.patch(`/admin/appointments/${selectedAppointment.id}/status`, {
        trang_thai: finalStatus,
        ky_thuat_vien_id: assignStaffId || null,
        phong_id: assignRoomId || null
      });

      if (finalStatus === 'da_checkin') {
        const staffName = staffList.find(s => String(s.ky_thuat_vien_id || s.id) === String(assignStaffId))?.ho_ten || 'Bác sĩ';
        const roomName = roomsList.find(r => String(r.id) === String(assignRoomId))?.ten_phong || 'Phòng khám';
        toast.success(`Check-in thành công! Hãy hướng dẫn khách di chuyển đến ${roomName} gặp ${staffName}.`, { icon: '🛎️', duration: 8000 });
      } else {
        toast.success('Cập nhật ca khám y khoa thành công');
      }

      setIsDetailModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Lỗi cập nhật thông tin ca khám');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBookTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    const chosenServiceId = treatmentType === 'single' ? selectedServiceId : null;
    const chosenPackageId = treatmentType === 'package' ? selectedPackageId : null;

    if (treatmentType === 'single' && !chosenServiceId) { toast.error('Vui lòng chọn dịch vụ linh động'); return; }
    if (treatmentType === 'package' && !chosenPackageId) { toast.error('Vui lòng chọn liệu trình'); return; }
    if (!selectedKtvId) { toast.error('Vui lòng chọn Chuyên gia y tế'); return; }

    try {
      setBookingLoading(true);
      const startDateTimeStr = `${treatmentDate}T${treatmentTime}:00.000Z`;
      const endDateTime = new Date(new Date(startDateTimeStr).getTime() + 60 * 60 * 1000);

      const payload = {
        khach_hang_id: selectedAppointment.khach_hang_id,
        ho_ten_khach: selectedAppointment.khach_hang_id ? undefined : selectedAppointment.ten_khach_hang,
        so_dien_thoai: selectedAppointment.khach_hang_id ? undefined : selectedAppointment.so_dien_thoai,
        dich_vu_id: chosenServiceId || null,
        ky_thuat_vien_id: selectedKtvId,
        phong_id: selectedRoomId || null,
        ghi_chu_dat_lich: `Ca trị liệu khởi tạo từ Lịch khám: ${selectedAppointment.ma_lich_dat}`,
        ngay_gio_bat_dau: startDateTimeStr,
        ngay_gio_ket_thuc: endDateTime.toISOString(),
        loai_lich: 'dieu_tri',
        dang_ky_goi_id: chosenPackageId,
        lich_dat_id: selectedAppointment.id
      };

      await axiosInstance.post('/admin/appointments', payload);
      toast.success('Lên lịch ca điều trị thành công!');
      setIsTreatmentModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo ca điều trị');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    // Enforce safeguard: Check if treatment record has been created for this appointment
    const hasRecord = treatmentRecords.some(r => r.lich_dat_id === appointmentId);
    if (!hasRecord) {
      toast.error("Vui lòng click '🩺 Lên phác đồ' để tạo hồ sơ điều trị trước khi hoàn thành ca khám!");
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn hoàn thành ca khám lâm sàng này?')) return;
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, {
        trang_thai: 'hoan_thanh'
      });
      toast.success('Đã hoàn thành ca khám lâm sàng thành công!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi hoàn thành ca khám: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNewBooking = async (appointmentId: string) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, {
        trang_thai: 'cho_phan_phong'
      });
      toast.success('Đã gọi xác nhận và chuyển qua cho Quản lý xếp lịch!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi chuyển Quản lý: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFinalConfirmBooking = async (appointmentId: string) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, {
        trang_thai: 'da_xac_nhan'
      });
      toast.success('Xác nhận lịch khám thành công!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xác nhận lịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancelRequest = async (appointmentId: string, lyDo: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xác nhận hủy lịch hẹn này theo yêu cầu của khách hàng?')) return;
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, {
        trang_thai: 'da_huy',
        ly_do_huy: lyDo
      });
      toast.success('Đã xác nhận hủy lịch hẹn thành công!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi hủy lịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBookingPrompt = (appointmentId: string) => {
    setCancelAptId(appointmentId);
    setCancelReasonInput('');
    setIsCancelModalOpen(true);
  };

  const handleCancelBookingSubmit = async () => {
    if (!cancelAptId || !cancelReasonInput.trim()) return;
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${cancelAptId}/status`, {
        trang_thai: 'da_huy',
        ly_do_huy: cancelReasonInput.trim()
      });
      toast.success('Đã hủy lịch hẹn thành công!');
      setIsCancelModalOpen(false);
      setCancelAptId(null);
      setCancelReasonInput('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi hủy lịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTreatmentRecordSubmit = async (payload: any) => {
    try {
      await axiosInstance.post('/admin/treatment-records', payload);
      toast.success('Tạo hồ sơ điều trị thành công!');
      setIsCreateRecordModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi tạo hồ sơ điều trị: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAssignTreatmentSubmit = async (ktvId: string, roomId: string) => {
    if (!selectedRecordForAssign) return;
    try {
      await axiosInstance.patch(`/admin/treatment-records/${selectedRecordForAssign.id}/assign`, {
        ky_thuat_vien_id: ktvId,
        phong_tri_lieu_id: Number(roomId)
      });
      toast.success('Điều phối kỹ thuật viên và phòng trị liệu thành công!');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi điều phối trị liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleNavigateDay = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
    } else if (direction === 'next') {
      setSelectedDate(prev => viewMode === 'week' ? addDays(prev, 7) : addDays(prev, 1));
    } else {
      setSelectedDate(prev => viewMode === 'week' ? subDays(prev, 7) : subDays(prev, 1));
    }
  };

  const activeRole = 'Bác sĩ'; // Mặc định cho màn hình Lịch khám
  const columnsStaff = staffList.filter(s => s.vai_tro === activeRole && s.trang_thai === 'hoat_dong');
  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

  const startDateOfWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const endDateOfWeek = addDays(startDateOfWeek, 6);

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.ngay_gio_bat_dau);
    let matchDate = false;

    if (viewMode === 'today') {
      const aptDateStr = format(aptDate, 'yyyy-MM-dd');
      matchDate = aptDateStr === formattedSelectedDate;
    } else {
      matchDate = aptDate >= startDateOfWeek && aptDate <= new Date(endDateOfWeek.setHours(23, 59, 59, 999));
    }

    const matchType = apt.loai_lich === scheduleType || apt.loai_lich === 'dich_vu_don';
    const matchRoom = roomFilter === 'all' || String(apt.phong_id) === roomFilter;
    const matchSearch = searchTerm === '' ||
      apt.ma_lich_dat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase());

    const hideUnconfirmed = viewRole === 'receptionist' || viewRole === 'doctor';
    if (hideUnconfirmed && (apt.trang_thai === 'chua_xac_nhan' || apt.trang_thai === 'cho_xac_nhan' || apt.trang_thai === 'cho_phan_phong')) {
      return false;
    }

    return matchDate && matchType && matchRoom && matchSearch;
  });

  const pendingClinicalAppointments = appointments.filter(apt =>
    apt.loai_lich === 'kham_moi' &&
    apt.trang_thai === 'cho_phan_phong' &&
    (!apt.ky_thuat_vien_id || !apt.phong_id)
  );

  const receptionistNewBookings = appointments.filter(apt =>
    apt.loai_lich === 'kham_moi' &&
    (apt.trang_thai === 'cho_xac_nhan' || apt.trang_thai === 'cho_huy') &&
    apt.ky_thuat_vien_id === null &&
    apt.phong_id === null
  );

  const receptionistFinalConfirmBookings = appointments.filter(apt =>
    apt.loai_lich === 'kham_moi' &&
    (apt.trang_thai === 'cho_xac_nhan' || apt.trang_thai === 'cho_huy') &&
    apt.ky_thuat_vien_id !== null &&
    apt.phong_id !== null
  );

  // KPI Metrics calculation
  const dailyAppointments = appointments.filter(apt => {
    const aptDateStr = format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd');
    const matchType = apt.loai_lich === scheduleType || apt.loai_lich === 'dich_vu_don';
    return aptDateStr === formattedSelectedDate && matchType;
  });

  const kpis = {
    total: viewMode === 'today' ? dailyAppointments.length : filteredAppointments.length,
    waiting: (viewMode === 'today' ? dailyAppointments : filteredAppointments).filter(a => a.trang_thai === 'cho_xac_nhan' || a.trang_thai === 'cho_huy').length,
    completed: (viewMode === 'today' ? dailyAppointments : filteredAppointments).filter(a => a.trang_thai === 'hoan_thanh').length,
    cancelled: (viewMode === 'today' ? dailyAppointments : filteredAppointments).filter(a => a.trang_thai === 'da_huy' || a.trang_thai === 'khong_den').length,
  };

  const dynamicTimeSlots = Array.from(
    new Set(
      filteredAppointments.map(apt => format(new Date(apt.ngay_gio_bat_dau), 'HH:mm'))
    )
  ).sort();

  const getCellAppointments = (hour: string, ktvId: string | null) => {
    return filteredAppointments.filter(apt => {
      const aptHourStr = format(new Date(apt.ngay_gio_bat_dau), 'HH:mm');
      const isSameHour = aptHourStr === hour;
      const isSameStaff = apt.ky_thuat_vien_id === ktvId;
      return isSameHour && isSameStaff;
    });
  };

  const handleOpenDetailModal = (apt: any) => {
    setSelectedAppointment(apt);
    setAssignStatus(apt.trang_thai);
    setAssignStaffId(apt.ky_thuat_vien_id || '');
    setAssignRoomId(apt.phong_id ? String(apt.phong_id) : '');
    setIsDetailModalOpen(true);
  };

  const handleOpenTreatmentModal = (type: 'single' | 'package' | null = null, recId: string | null = null) => {
    if (!selectedAppointment) return;
    setIsDetailModalOpen(false);
    setTreatmentType(type || 'single');
    setSelectedServiceId(type === 'single' && recId ? recId : '');
    setSelectedPackageId(type === 'package' && recId ? recId : '');
    setSelectedKtvId('');
    setSelectedRoomId('');
    setTreatmentDate(format(new Date(), 'yyyy-MM-dd'));
    setTreatmentTime('10:00');
    setIsTreatmentModalOpen(true);
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-600 border-r-2 border-emerald-200"></div>
        <p className="text-slate-500 font-medium text-sm">Đang đồng bộ hóa hệ thống lịch trình...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* ROLE SWITCHER FOR ADMIN */}
      {user?.vai_tro_id === 5 && (
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-150/80 shadow-xs flex flex-wrap items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 px-2">
            👁️ Chế độ xem vai trò (Admin):
          </span>
          <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-200/60">
            <button
              onClick={() => setViewRole('manager')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewRole === 'manager'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-105'
                }`}
            >
              💼 Quản lý
            </button>
            <button
              onClick={() => setViewRole('receptionist')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewRole === 'receptionist'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-105'
                }`}
            >
              📅 Lễ tân
            </button>
            <button
              onClick={() => setViewRole('doctor')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewRole === 'doctor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-105'
                }`}
            >
              🩺 Bác sĩ
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="text-emerald-700" size={28} />
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 transition-all duration-350">
              {viewRole === 'doctor' && 'Màn hình Khám bệnh của Bác sĩ'}
              {viewRole === 'receptionist' && 'Màn hình điều phối của Lễ tân'}
              {viewRole === 'manager' && 'Màn hình Quản lý Hồ sơ Điều trị'}
            </h1>
          </div>
          <p className="text-slate-500 text-sm transition-all duration-350">
            {viewRole === 'doctor' && 'Theo dõi danh sách bệnh nhân chờ khám và lên phác đồ điều trị.'}
            {viewRole === 'receptionist' && 'Tiếp đón khách hàng, cập nhật trạng thái check-in và xử lý yêu cầu hủy lịch.'}
            {viewRole === 'manager' && 'Quản lý và điều phối các hồ sơ điều trị nhận từ bác sĩ chuyên khoa.'}
          </p>
        </div>

        {viewRole !== 'manager' && (
          <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 p-1 self-stretch md:self-auto justify-between">
            <button onClick={() => handleNavigateDay('prev')} className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="px-5 text-sm font-semibold text-slate-700 text-center min-w-[220px]">
              {viewMode === 'today'
                ? format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })
                : `Tuần: ${format(startDateOfWeek, 'dd/MM')} - ${format(endDateOfWeek, 'dd/MM/yyyy')}`
              }
            </div>
            <button onClick={() => handleNavigateDay('next')} className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* KPI METRIC CARDS */}
      {viewRole !== 'manager' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tổng số ca khám</span>
            <div className="flex justify-between items-baseline mt-3">
              <span className="text-4xl font-black text-slate-800">{kpis.total}</span>
              <span className="text-sm text-slate-400 font-medium">ca trực</span>
            </div>
          </div>
          <div className="bg-amber-50/50 p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col justify-between">
            <span className="text-amber-700 text-xs font-semibold uppercase tracking-wider">Chờ xử lý</span>
            <div className="flex justify-between items-baseline mt-3">
              <span className="text-4xl font-black text-amber-600">{kpis.waiting}</span>
              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-md">WAITING</span>
            </div>
          </div>
          <div className="bg-emerald-50/50 p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between">
            <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">Đã hoàn thành</span>
            <div className="flex justify-between items-baseline mt-3">
              <span className="text-4xl font-black text-emerald-600">{kpis.completed}</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md">DONE</span>
            </div>
          </div>
          <div className="bg-rose-50/50 p-5 rounded-2xl shadow-sm border border-rose-100 flex flex-col justify-between">
            <span className="text-rose-700 text-xs font-semibold uppercase tracking-wider">Hủy / Vắng mặt</span>
            <div className="flex justify-between items-baseline mt-3">
              <span className="text-4xl font-black text-rose-600">{kpis.cancelled}</span>
              <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded-md">CANCEL</span>
            </div>
          </div>
        </div>
      )}

      {/* HÀNG ĐỢI LÂM SÀNG: BỆNH NHÂN ĐÃ CHECK-IN ĐANG CHỜ KHÁM (DOCTOR ONLY) */}
      {viewRole === 'doctor' && appointments.some(apt => apt.trang_thai === 'da_checkin') && (
        <div className="bg-[#E6F4F1] border border-primary/20 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Hàng đợi lâm sàng: Bệnh nhân đã check-in đang chờ khám
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments
              .filter(apt => apt.trang_thai === 'da_checkin')
              .map(apt => (
                <div key={apt.id} className="bg-white border border-zinc-150 p-4 rounded-xl shadow-xs flex flex-col justify-between gap-3 relative hover:border-primary/45 hover:shadow-sm transition-all duration-200">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
                        {apt.ma_lich_dat}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold font-mono">
                        {(() => {
                          try {
                            const d = new Date(apt.ngay_gio_bat_dau);
                            return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                          } catch (e) {
                            return '';
                          }
                        })()}
                      </span>
                    </div>
                    <h4 className="font-bold text-secondary text-sm">{apt.ten_khach_hang}</h4>
                    <p className="text-xs text-zinc-500 mt-1 font-semibold">
                      Triệu chứng: <span className="font-medium italic text-zinc-650">"{apt.ly_do_kham || 'Không mô tả triệu chứng'}"</span>
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {apt.ten_phong && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          Phòng: {apt.ten_phong}
                        </span>
                      )}
                      {apt.ten_ky_thuat_vien && (
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                          Bác sĩ: {apt.ten_ky_thuat_vien}
                        </span>
                      )}
                    </div>
                  </div>
                  {treatmentRecords.some(r => r.lich_dat_id === apt.id) ? (
                    <button
                      type="button"
                      disabled
                      className="w-full mt-2 py-2 bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider text-[10px] rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      ✓ Đã Lên Phác Đồ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAptForTreatmentRecord(apt);
                        setIsCreateRecordModalOpen(true);
                      }}
                      className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      🩺 Khám & Lên Phác Đồ
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* PENDING CANCELLATION ALERTS (RECEPTIONIST ONLY) */}
      {viewRole === 'receptionist' && appointments.some(apt => apt.trang_thai === 'cho_huy') && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertCircle className="text-rose-600 animate-bounce" size={18} />
            CẢNH BÁO: CÓ YÊU CẦU HỦY LỊCH HẸN CẦN XÁC MINH
          </div>
          <div className="divide-y divide-rose-100 max-h-40 overflow-y-auto">
            {appointments
              .filter(apt => apt.trang_thai === 'cho_huy')
              .map(apt => (
                <div key={apt.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-extrabold text-rose-700">[{apt.ma_lich_dat}]</span>{' '}
                    Khách hàng <span className="font-bold text-slate-800">{apt.ten_khach_hang}</span> ({apt.so_dien_thoai})
                    yêu cầu hủy lịch khám lúc <span className="font-bold text-slate-800">{format(new Date(apt.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy')}</span>.
                    <span className="block text-slate-500 mt-0.5 italic">Lý do: "{apt.ly_do_huy || 'Không có lý do chi tiết'}"</span>
                  </div>
                  <button
                    onClick={() => handleOpenDetailModal(apt)}
                    className="self-start sm:self-center bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
                  >
                    Xử lý ngay
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* RECEPTIONIST VIEW - CALENDAR & QUEUES */}
      {viewRole === 'receptionist' && (
        <div className="space-y-6">
          {/* RECEPTIONIST TABS */}
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setReceptionistActiveTab('calendar')}
              className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${receptionistActiveTab === 'calendar'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
            >
              📅 Lịch trình hôm nay
            </button>
            <button
              onClick={() => setReceptionistActiveTab('new_bookings')}
              className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${receptionistActiveTab === 'new_bookings'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
            >
              📞 Ca khám mới chờ liên hệ ({receptionistNewBookings.length})
            </button>
            <button
              onClick={() => setReceptionistActiveTab('final_confirm')}
              className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${receptionistActiveTab === 'final_confirm'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
            >
              ✓ Chờ xác nhận lịch xếp ({receptionistFinalConfirmBookings.length})
            </button>
          </div>

          {/* TAB 1: CALENDAR */}
          {receptionistActiveTab === 'calendar' && (
            <div className="space-y-6">
              {/* FILTER CONTROLS BAR */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                <div className="flex bg-slate-50 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('today')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${viewMode === 'today' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    <CalendarIcon size={18} /> Hôm nay
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${viewMode === 'week' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    <CalendarDays size={18} /> Tuần này
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:justify-end">
                  <button onClick={() => handleNavigateDay('today')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-semibold text-slate-700 rounded-xl shrink-0">
                    Trở về Hiện tại
                  </button>

                  <div className="relative shrink-0">
                    <select
                      value={roomFilter}
                      onChange={(e) => setRoomFilter(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                    >
                      <option value="all">Tất cả Phòng khám</option>
                      {roomsList.map(room => (
                        <option key={room.id} value={room.id}>{room.ten_phong}</option>
                      ))}
                    </select>
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>

                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm bệnh nhân, mã lịch..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* COMPONENT: BẢNG LƯỚI LỊCH TRÌNH */}
              {viewMode === 'today' ? (
                <AppointmentCalendar
                  timeSlots={dynamicTimeSlots.length > 0 ? dynamicTimeSlots : ['08:00', '13:00']}
                  scheduleType={scheduleType}
                  columnsStaff={columnsStaff}
                  getCellAppointments={getCellAppointments}
                  statusConfig={statusConfig}
                  handleOpenDetailModal={handleOpenDetailModal}
                />
              ) : (
                <AppointmentWeeklyCalendar
                  selectedDate={selectedDate}
                  appointments={filteredAppointments}
                  statusConfig={statusConfig}
                  handleOpenDetailModal={handleOpenDetailModal}
                  scheduleType={scheduleType}
                />
              )}
            </div>
          )}

          {/* TAB 2: NEW BOOKINGS */}
          {receptionistActiveTab === 'new_bookings' && (
            <div className="bg-white rounded-2xl border border-zinc-150/80 shadow-xs p-6 space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Danh sách Ca khám mới chờ Lễ tân liên hệ
                </h3>
                <p className="text-xs text-slate-450 font-semibold mt-0.5">Gọi điện xác nhận thông tin ban đầu trước khi chuyển cho quản lý phân công phòng và bác sĩ</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Mã ca khám</th>
                      <th className="py-3 px-4">Bệnh nhân</th>
                      <th className="py-3 px-4">Số điện thoại</th>
                      <th className="py-3 px-4">Khung giờ hẹn</th>
                      <th className="py-3 px-4">Triệu chứng của khách</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs">
                    {receptionistNewBookings.map(apt => (
                      <tr key={apt.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{apt.ma_lich_dat}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-850 flex items-center gap-2">
                            {apt.ten_khach_hang}
                            {apt.trang_thai === 'cho_huy' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                                <span className="size-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                Khách xin hủy
                              </span>
                            )}
                          </div>
                          {apt.trang_thai === 'cho_huy' && apt.ly_do_huy && (
                            <div className="text-[10px] text-rose-500 font-semibold mt-0.5 italic">
                              Lý do: "{apt.ly_do_huy}"
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{apt.so_dien_thoai}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-650">
                          {format(new Date(apt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="py-3.5 px-4 italic text-slate-500 max-w-xs truncate">
                          "{apt.ly_do_kham || 'Không mô tả triệu chứng'}"
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {apt.trang_thai === 'cho_huy' ? (
                              <>
                                <button
                                  onClick={() => handleConfirmNewBooking(apt.id)}
                                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-zinc-200 text-slate-700 font-bold rounded-xl transition-all text-[11px] uppercase tracking-wider active:scale-95 shadow-sm"
                                >
                                  Giữ & Chuyển Quản lý
                                </button>
                                <button
                                  onClick={() => handleConfirmCancelRequest(apt.id, apt.ly_do_huy || 'Khách yêu cầu hủy')}
                                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all text-[11px] uppercase tracking-wider active:scale-95 shadow-sm shadow-rose-600/10"
                                >
                                  Xác nhận hủy
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleCancelBookingPrompt(apt.id)}
                                  className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-250 text-rose-600 font-bold rounded-xl transition-all text-[11px] uppercase tracking-wider active:scale-95 shadow-xs"
                                >
                                  Hủy lịch
                                </button>
                                <button
                                  onClick={() => handleConfirmNewBooking(apt.id)}
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-[11px] shadow-sm shadow-emerald-600/10 active:scale-95 font-bold uppercase tracking-wider"
                                >
                                  Xác nhận & Chuyển Quản lý
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {receptionistNewBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          Không có ca khám mới nào chờ liên hệ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FINAL CONFIRM */}
          {receptionistActiveTab === 'final_confirm' && (
            <div className="bg-white rounded-2xl border border-zinc-150/80 shadow-xs p-6 space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Danh sách Ca khám chờ Lễ tân xác nhận lại (Quản lý đã xếp lịch)
                </h3>
                <p className="text-xs text-slate-450 font-semibold mt-0.5">Xác nhận lịch khám chính thức sau khi quản lý đã phân công bác sĩ chuyên khoa và phòng khám</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Mã ca khám</th>
                      <th className="py-3 px-4">Bệnh nhân</th>
                      <th className="py-3 px-4">Số điện thoại</th>
                      <th className="py-3 px-4">Khung giờ hẹn</th>
                      <th className="py-3 px-4">Bác sĩ phụ trách</th>
                      <th className="py-3 px-4">Phòng khám</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs">
                    {receptionistFinalConfirmBookings.map(apt => (
                      <tr key={apt.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{apt.ma_lich_dat}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-850 flex items-center gap-2">
                            {apt.ten_khach_hang}
                            {apt.trang_thai === 'cho_huy' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                                <span className="size-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                Khách xin hủy
                              </span>
                            )}
                          </div>
                          {apt.trang_thai === 'cho_huy' && apt.ly_do_huy && (
                            <div className="text-[10px] text-rose-500 font-semibold mt-0.5 italic">
                              Lý do: "{apt.ly_do_huy}"
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{apt.so_dien_thoai}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-650">
                          {format(new Date(apt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{apt.ten_ky_thuat_vien}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 bg-emerald-50/40 px-2 py-1 rounded-md">{apt.ten_phong}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {apt.trang_thai === 'cho_huy' ? (
                              <>
                                <button
                                  onClick={() => handleFinalConfirmBooking(apt.id)}
                                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-zinc-200 text-slate-700 font-bold rounded-xl transition-all text-[11px] uppercase tracking-wider active:scale-95 shadow-sm"
                                >
                                  Giữ & Xác nhận khám
                                </button>
                                <button
                                  onClick={() => handleConfirmCancelRequest(apt.id, apt.ly_do_huy || 'Khách yêu cầu hủy')}
                                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all text-[11px] uppercase tracking-wider active:scale-95 shadow-sm shadow-rose-600/10"
                                >
                                  Xác nhận hủy
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleCancelBookingPrompt(apt.id)}
                                  className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-250 text-rose-600 font-bold rounded-xl transition-all text-[11px] uppercase tracking-wider active:scale-95 shadow-xs"
                                >
                                  Hủy lịch
                                </button>
                                <button
                                  onClick={() => handleFinalConfirmBooking(apt.id)}
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-[11px] shadow-sm shadow-emerald-600/10 active:scale-95 font-bold uppercase tracking-wider"
                                >
                                  Xác nhận lịch khám
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {receptionistFinalConfirmBookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          Không có ca khám nào đang chờ xác nhận lại.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOCTOR VIEW - CHECKED-IN LIST */}
      {viewRole === 'doctor' && (
        <div className="bg-white rounded-2xl border border-zinc-150/80 shadow-xs p-6 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                Danh sách Ca khám đang chờ Hoàn thành
              </h3>
              <p className="text-xs text-slate-450 font-medium mt-0.5">Tiếp nhận chẩn đoán lâm sàng và xác nhận hoàn tất ca trực</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              {appointments.filter(apt => apt.trang_thai === 'da_checkin').length} ca khám đã check-in
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã ca khám</th>
                  <th className="py-3 px-4">Bệnh nhân</th>
                  <th className="py-3 px-4">Giờ hẹn</th>
                  <th className="py-3 px-4">Phòng khám</th>
                  <th className="py-3 px-4">Bác sĩ khám</th>
                  <th className="py-3 px-4">Triệu chứng</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 text-xs">
                {appointments
                  .filter(apt => apt.trang_thai === 'da_checkin')
                  .map(apt => (
                    <tr key={apt.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{apt.ma_lich_dat}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{apt.ten_khach_hang}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{apt.so_dien_thoai}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {new Date(apt.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{apt.ten_phong || 'Chưa xếp'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{apt.ten_ky_thuat_vien || 'Chưa phân công'}</td>
                      <td className="py-3.5 px-4 italic text-slate-500 max-w-xs truncate">"{apt.ly_do_kham || 'Không có mô tả'}"</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {treatmentRecords.some(r => r.lich_dat_id === apt.id) ? (
                            <>
                              <button
                                disabled
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 opacity-60 font-bold rounded-lg text-[11px] cursor-not-allowed"
                              >
                                ✓ Đã lên phác đồ
                              </button>
                              <button
                                onClick={() => handleCompleteAppointment(apt.id)}
                                className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg transition-all text-[11px] shadow-xs active:scale-95"
                              >
                                ✓ Hoàn thành
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setActiveAptForTreatmentRecord(apt);
                                  setIsCreateRecordModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg transition-all text-[11px]"
                              >
                                🩺 Lên phác đồ
                              </button>
                              <button
                                disabled
                                title="Vui lòng lên phác đồ trước khi hoàn thành"
                                className="px-3 py-1.5 bg-slate-100 text-slate-400 font-bold rounded-lg text-[11px] cursor-not-allowed"
                              >
                                ✓ Hoàn thành
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {appointments.filter(apt => apt.trang_thai === 'da_checkin').length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      Hiện tại không có ca khám nào đang chờ hoàn thành.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewRole === 'manager' && (
        <div className="space-y-6">
          {/* ALLOCATION ALERT BANNERS */}
          <div className="space-y-3">
            {treatmentRecords.some(r => r.trang_thai === 'cho_dieu_phoi') && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs space-y-1 animate-pulse">
                <p className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                  <AlertCircle size={16} className="text-amber-600" /> THÔNG BÁO TỪ BÁC SĨ: HỒ SƠ ĐIỀU TRỊ CHỜ ĐIỀU PHỐI
                </p>
                <p className="text-sm text-slate-700 font-medium">
                  Có <strong className="text-amber-700">{treatmentRecords.filter(r => r.trang_thai === 'cho_dieu_phoi').length} hồ sơ điều trị mới</strong> đã được bác sĩ chẩn đoán và chỉ định phác đồ, đang chờ phân công Kỹ thuật viên & Phòng trị liệu.
                </p>
              </div>
            )}

            {pendingClinicalAppointments.length > 0 && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl shadow-xs space-y-1 animate-pulse">
                <p className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                  <AlertCircle size={16} className="text-emerald-600" /> THÔNG BÁO TỪ LỄ TÂN: CA KHÁM CHỜ PHÂN PHÒNG & BÁC SĨ
                </p>
                <p className="text-sm text-slate-700 font-medium">
                  Có <strong className="text-emerald-700">{pendingClinicalAppointments.length} ca khám mới</strong> đang chờ bạn phân công Phòng khám & Bác sĩ chuyên khoa phụ trách khám lâm sàng.
                </p>
              </div>
            )}
          </div>

          {/* MANAGER DASHBOARD TABS */}
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setManagerActiveTab('treatments')}
              className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${managerActiveTab === 'treatments'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
            >
              💼 Điều phối Trị liệu ({treatmentRecords.filter(r => r.trang_thai === 'cho_dieu_phoi').length})
            </button>
            <button
              onClick={() => setManagerActiveTab('clinical')}
              className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${managerActiveTab === 'clinical'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
            >
              🩺 Phân phòng & Bác sĩ lâm sàng ({pendingClinicalAppointments.length})
            </button>
          </div>

          {/* TAB 1: TREATMENT RECORDS */}
          {managerActiveTab === 'treatments' && (
            <div className="bg-white rounded-2xl border border-zinc-150/80 shadow-xs p-6 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                    Danh sách Hồ sơ điều trị chỉ định lâm sàng
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Quản lý và điều phối kỹ thuật viên cho hồ sơ gửi từ bác sĩ</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={treatmentStatusFilter}
                    onChange={(e) => setTreatmentStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="cho_dieu_phoi">Chờ điều phối</option>
                    <option value="da_dieu_phoi">Đã điều phối</option>
                  </select>

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={treatmentSearchTerm}
                      onChange={(e) => setTreatmentSearchTerm(e.target.value)}
                      placeholder="Tìm bệnh nhân, SĐT..."
                      className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-400 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Mã hồ sơ</th>
                      <th className="py-3 px-4">Bệnh nhân</th>
                      <th className="py-3 px-4">Chỉ định của bác sĩ</th>
                      <th className="py-3 px-4">Gói trị liệu chỉ định</th>
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Phân công trị liệu</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs">
                    {treatmentRecords
                      .filter(r => {
                        const matchSearch = r.ho_ten_khach.toLowerCase().includes(treatmentSearchTerm.toLowerCase()) ||
                          (r.so_dien_thoai && r.so_dien_thoai.includes(treatmentSearchTerm));
                        const matchStatus = treatmentStatusFilter === 'all' || r.trang_thai === treatmentStatusFilter;
                        return matchSearch && matchStatus;
                      })
                      .map(r => (
                        <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-650">
                            #{r.id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{r.ho_ten_khach}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{r.so_dien_thoai}</div>
                          </td>
                          <td className="py-3.5 px-4 space-y-1">
                            <div>
                              <span className="font-bold text-slate-700">PP: </span>
                              <span className="font-medium text-slate-600">{r.phuong_phap_dieu_tri}</span>
                            </div>
                            {r.ghi_chu && (
                              <div className="text-[10px] text-slate-400 font-medium italic">
                                Note: "{r.ghi_chu}"
                              </div>
                            )}
                            <div className="text-[9px] text-slate-500">
                              BS khám: <span className="font-bold">{r.ten_bac_si || 'Chưa xác định'}</span> ({r.ten_phong_kham || 'Chưa xếp'})
                            </div>
                          </td>
                          <td className="py-3.5 px-4 space-y-1">
                            <div className="font-bold text-slate-800">{r.ten_goi}</div>
                            <div className="flex gap-2 text-[9px] font-bold">
                              <span className="text-slate-500">{r.so_luong_buoi} buổi</span>
                              <span className="text-emerald-600 font-mono">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.gia_tien)}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded-md ${r.loai_goi === 'co_dinh' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                {r.loai_goi === 'co_dinh' ? 'Gói Cố định' : 'Gói Tự chọn'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-550 font-medium">
                            {format(new Date(r.thoi_gian_tao), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${r.trang_thai === 'cho_dieu_phoi'
                                ? 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              }`}>
                              {r.trang_thai === 'cho_dieu_phoi' ? 'Chờ điều phối' : 'Đã điều phối'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {r.trang_thai === 'da_dieu_phoi' ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800">{r.ten_ky_thuat_vien_hien_tai}</div>
                                <div className="text-[10px] text-slate-500 font-semibold">{r.ten_phong_tri_lieu_hien_tai}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold italic text-[11px]">Chưa điều phối KTV</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {r.trang_thai === 'cho_dieu_phoi' ? (
                              <button
                                onClick={() => {
                                  setSelectedRecordForAssign(r);
                                  setIsAssignModalOpen(true);
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-[11px] shadow-sm shadow-emerald-600/10 active:scale-95 flex items-center gap-1.5 ml-auto font-bold uppercase tracking-wider"
                              >
                                Phân công
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-bold flex items-center justify-end gap-1 text-[11px]">
                                ✓ Hoàn tất
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    {treatmentRecords.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                          Không có hồ sơ điều trị nào từ bác sĩ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL APPOINTMENTS PENDING DOC/ROOM */}
          {managerActiveTab === 'clinical' && (
            <div className="bg-white rounded-2xl border border-zinc-150/80 shadow-xs p-6 space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Danh sách Lịch hẹn khám chờ xếp Bác sĩ & Phòng
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Tiếp nhận ca khám mới từ lễ tân và phân công phòng khám, bác sĩ chuyên khoa phụ trách</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Mã ca khám</th>
                      <th className="py-3 px-4">Bệnh nhân</th>
                      <th className="py-3 px-4">Giờ hẹn</th>
                      <th className="py-3 px-4">Triệu chứng ban đầu</th>
                      <th className="py-3 px-4">Trạng thái hiện tại</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs">
                    {pendingClinicalAppointments.map(apt => (
                      <tr key={apt.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{apt.ma_lich_dat}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{apt.ten_khach_hang}</div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{apt.so_dien_thoai}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-650">
                          {format(new Date(apt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="py-3.5 px-4 italic text-slate-500 max-w-xs truncate">
                          "{apt.ly_do_kham || 'Không mô tả triệu chứng'}"
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${statusConfig[apt.trang_thai as keyof typeof statusConfig]?.color || 'bg-slate-100'
                            }`}>
                            {statusConfig[apt.trang_thai as keyof typeof statusConfig]?.label || apt.trang_thai}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenDetailModal(apt)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-[11px] shadow-sm shadow-emerald-600/10 active:scale-95 ml-auto font-bold uppercase tracking-wider"
                          >
                            Xếp Bác sĩ & Phòng
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingClinicalAppointments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          Không có ca khám lâm sàng nào đang chờ điều phối bác sĩ/phòng khám.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPONENT: MODAL CHI TIẾT CA TRỰC */}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          selectedAppointment={selectedAppointment}
          roomsList={roomsList}
          staffList={staffList}
          activeRole={activeRole}
          assignRoomId={assignRoomId}
          setAssignRoomId={setAssignRoomId}
          assignStaffId={assignStaffId}
          setAssignStaffId={setAssignStaffId}
          assignStatus={assignStatus}
          setAssignStatus={setAssignStatus}
          isAssigning={isAssigning}
          onClose={() => setIsDetailModalOpen(false)}
          onSave={handleUpdateAppointment}
          onOpenTreatment={handleOpenTreatmentModal}
          appointments={appointments}
          hideBilling={viewRole === 'doctor'}
        />
      )}

      {/* COMPONENT: MODAL ĐẶT LỊCH ĐIỀU TRỊ CHUYÊN SÂU */}
      {isTreatmentModalOpen && (
        <TreatmentBookingModal
          selectedAppointment={selectedAppointment}
          services={services}
          packages={packages}
          staffList={staffList}
          roomsList={roomsList}
          treatmentType={treatmentType}
          setTreatmentType={setTreatmentType}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          selectedPackageId={selectedPackageId}
          setSelectedPackageId={setSelectedPackageId}
          selectedKtvId={selectedKtvId}
          setSelectedKtvId={setSelectedKtvId}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          treatmentDate={treatmentDate}
          setTreatmentDate={setTreatmentDate}
          treatmentTime={treatmentTime}
          setTreatmentTime={setTreatmentTime}
          bookingLoading={bookingLoading}
          onClose={() => setIsTreatmentModalOpen(false)}
          onSubmit={handleBookTreatment}
        />
      )}

      {/* COMPONENT: TẠO HỒ SƠ ĐIỀU TRỊ (DOCTOR) */}
      {isCreateRecordModalOpen && activeAptForTreatmentRecord && (
        <CreateTreatmentRecordModal
          selectedAppointment={activeAptForTreatmentRecord}
          roomsList={roomsList}
          staffList={staffList}
          packages={packages}
          onClose={() => {
            setIsCreateRecordModalOpen(false);
            setActiveAptForTreatmentRecord(null);
          }}
          onSubmit={handleCreateTreatmentRecordSubmit}
        />
      )}

      {/* COMPONENT: ĐIỀU PHỐI KTV & PHÒNG TRỊ LIỆU (MANAGER) */}
      {isAssignModalOpen && selectedRecordForAssign && (
        <AssignTreatmentModal
          record={selectedRecordForAssign}
          staffList={staffList}
          roomsList={roomsList}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedRecordForAssign(null);
          }}
          onSubmit={handleAssignTreatmentSubmit}
        />
      )}

      {/* COMPONENT: DIALOG HỦY LỊCH HẸN CHUYÊN NGHIỆP */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-zinc-150 max-w-md w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-heading font-black text-secondary uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={16} />
                Yêu cầu hủy lịch khám
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-50 rounded-full transition-all"
              >
                <XCircle size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Vui lòng nhập lý do hủy lịch để cập nhật hệ thống và gửi thông báo đến khách hàng:
            </p>

            <textarea
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder="Nhập lý do chi tiết (ví dụ: Khách bận đột xuất, Số điện thoại không liên lạc được...)"
              rows={3}
              className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-zinc-400"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-5 py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-650 text-xs font-bold rounded-xl transition-all"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelBookingSubmit}
                disabled={!cancelReasonInput.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-rose-600/10 uppercase tracking-wider font-bold"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
