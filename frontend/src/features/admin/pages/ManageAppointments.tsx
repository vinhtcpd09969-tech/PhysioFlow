import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

// Import Components đã bóc tách
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentWeeklyCalendar from '../components/AppointmentWeeklyCalendar';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import TreatmentBookingModal from '../components/TreatmentBookingModal';

const statusConfig = {
  chua_xac_nhan: { label: 'Chưa xác nhận', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <HelpCircle size={14} /> },
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle size={14} /> },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle2 size={14} /> },
  da_checkin: { label: 'Đã Check-in', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: <PlayCircle size={14} /> },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={14} /> },
  da_huy: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} /> },
  khong_den: { label: 'Không đến', color: 'bg-slate-200 text-slate-700 border-slate-300', icon: <XCircle size={14} /> },
};

export default function ManageAppointments() {
  const location = useLocation();
  const isReceptionist = location.pathname.startsWith('/receptionist');

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, staffRes, serviceRes, packageRes, roomsRes] = await Promise.all([
        axiosInstance.get('/admin/appointments'),
        axiosInstance.get('/admin/staff'),
        axiosInstance.get('/admin/services'),
        axiosInstance.get('/admin/packages').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/rooms').catch(() => ({ data: [] }))
      ]);

      setAppointments(aptRes.data);
      setStaffList(staffRes.data);
      setServices(serviceRes.data);
      setPackages(packageRes.data || []);
      setRoomsList(roomsRes.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      toast.error('Không thể tải dữ liệu lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setIsAssigning(true);
      
      let finalStatus = assignStatus;
      if (selectedAppointment.trang_thai === 'chua_xac_nhan' && assignStaffId && assignRoomId) {
        finalStatus = 'cho_xac_nhan';
      }

      await axiosInstance.patch(`/admin/appointments/${selectedAppointment.id}/status`, {
        trang_thai: finalStatus,
        ky_thuat_vien_id: assignStaffId || null,
        phong_id: assignRoomId || null
      });

      toast.success('Cập nhật thông tin ca trực thành công');
      setIsDetailModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Lỗi cập nhật ca trực');
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

    if (isReceptionist && apt.trang_thai === 'chua_xac_nhan') {
      return false;
    }

    return matchDate && matchType && matchRoom && matchSearch;
  });

  // KPI Metrics calculation
  const dailyAppointments = appointments.filter(apt => {
      const aptDateStr = format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd');
      const matchType = apt.loai_lich === scheduleType || apt.loai_lich === 'dich_vu_don';
      return aptDateStr === formattedSelectedDate && matchType;
  });

  const kpis = {
    total: viewMode === 'today' ? dailyAppointments.length : filteredAppointments.length,
    waiting: (viewMode === 'today' ? dailyAppointments : filteredAppointments).filter(a => a.trang_thai === 'cho_xac_nhan').length,
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
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="text-emerald-700" size={28} />
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Lịch Hẹn Khám
            </h1>
          </div>
          <p className="text-slate-500 text-sm">Quản lý và điều phối các ca khám lâm sàng với Bác sĩ.</p>
        </div>

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
      </div>

      {/* KPI METRIC CARDS */}
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
          timeSlots={dynamicTimeSlots.length > 0 ? dynamicTimeSlots : ['08:00', '13:00']} // Fallback nếu ngày trống
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
    </div>
  );
}
