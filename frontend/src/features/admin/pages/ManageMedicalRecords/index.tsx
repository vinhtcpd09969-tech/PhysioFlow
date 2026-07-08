import { useState, useEffect } from 'react';
import { Search, Printer, ChevronLeft, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMedicalRecords, getRooms, createAppointment, getAvailableStaff } from '../../api/admin.api';
import { format } from 'date-fns';

export default function ManageMedicalRecords() {
  const [patients, setPatients] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [viewState, setViewState] = useState<'overview' | 'detail'>('overview');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, package, single, exam
  const [filterStatus, setFilterStatus] = useState('all'); // all, dang_dieu_tri, hoan_thanh
  const [filterStaff, setFilterStaff] = useState('all');

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSessionNum, setBookingSessionNum] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookingTime, setBookingTime] = useState('09:00');
  const [bookingKtvId, setBookingKtvId] = useState('');
  const [bookingRoomId, setBookingRoomId] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<any[] | null>(null);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, roomsRes] = await Promise.all([
        getMedicalRecords(),
        getRooms()
      ]);
      setPatients(recordsRes.data || []);
      setRoomsList(roomsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể kết nối API hồ sơ điều trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Stats for KPI Cards dynamically
  const activePatientsCount = patients.filter(p => 
    p.plans?.some((pl: any) => pl.trang_thai === 'dang_dieu_tri')
  ).length;

  const activePackagesCount = patients.reduce((sum, p) => {
    const pkgPlans = p.plans?.filter((pl: any) => pl.loai_goi === 'LIEU_TRINH' && pl.trang_thai === 'dang_dieu_tri') || [];
    return sum + pkgPlans.length;
  }, 0);

  // Single treatment count for today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySingleTreatmentsCount = patients.reduce((sum, p) => {
    const todayApts = p.appointments?.filter((ap: any) => 
      !ap.phac_do_dieu_tri_id && 
      ap.loai !== 'KHAM' &&
      format(new Date(ap.ngay_gio_bat_dau), 'yyyy-MM-dd') === todayStr
    ) || [];
    return sum + todayApts.length;
  }, 0);

  // Transform nested patient records to a flat list for Overview
  const flatRecords: any[] = [];
  patients.forEach(p => {
    // 1. Add treatment packages
    p.plans?.forEach((pl: any) => {
      // Find latest completed treatment session
      const completedApts = p.appointments
        ?.filter((ap: any) => ap.phac_do_dieu_tri_id === pl.id && ap.trang_thai === 'hoan_thanh' && ap.loai !== 'KHAM')
        .sort((a: any, b: any) => new Date(b.ngay_gio_bat_dau).getTime() - new Date(a.ngay_gio_bat_dau).getTime()) || [];

      const latestApt = completedApts[0];
      const latestSessionStr = latestApt ? format(new Date(latestApt.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy') : 'Chưa trị liệu';
      const latestStaffName = latestApt ? latestApt.ten_nhan_su : 'Chưa phân công';

      flatRecords.push({
        id: pl.id,
        patientId: p.id,
        patientName: p.ho_ten,
        patientPhone: p.so_dien_thoai,
        patientCode: p.ma_khach_hang,
        diem_uy_tin: p.diem_uy_tin,
        type: 'package',
        packageName: pl.ten_goi,
        loai_goi: pl.loai_goi,
        so_buoi_da_dung: pl.so_buoi_da_dung,
        tong_so_buoi: pl.tong_so_buoi,
        latestSession: latestSessionStr,
        staffName: latestStaffName,
        status: pl.trang_thai,
        originalRecord: p
      });
    });

    // 2. Add ALL clinical exam appointments as separate rows (to support exam-only cases)
    const examApts = p.appointments?.filter((ap: any) => ap.loai === 'KHAM') || [];
    examApts.forEach((ap: any) => {
      flatRecords.push({
        id: ap.id,
        appointmentId: ap.id,
        patientId: p.id,
        patientName: p.ho_ten,
        patientPhone: p.so_dien_thoai,
        patientCode: p.ma_khach_hang,
        diem_uy_tin: p.diem_uy_tin,
        type: 'exam',
        packageName: 'Khám lâm sàng & Lượng giá',
        loai_goi: 'LE',
        so_buoi_da_dung: ap.trang_thai === 'hoan_thanh' ? 1 : 0,
        tong_so_buoi: 1,
        latestSession: format(new Date(ap.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy'),
        staffName: ap.ten_nhan_su || 'Chưa phân công',
        status: ap.trang_thai,
        phac_do_dieu_tri_id: ap.phac_do_dieu_tri_id,
        originalRecord: p
      });
    });

    // 3. Add single treatment appointments (which do not have a phac_do_dieu_tri_id and are not exams)
    const singleApts = p.appointments?.filter((ap: any) => !ap.phac_do_dieu_tri_id && ap.loai !== 'KHAM') || [];
    singleApts.forEach((ap: any) => {
      flatRecords.push({
        id: ap.id,
        appointmentId: ap.id,
        patientId: p.id,
        patientName: p.ho_ten,
        patientPhone: p.so_dien_thoai,
        patientCode: p.ma_khach_hang,
        diem_uy_tin: p.diem_uy_tin,
        type: 'single',
        packageName: 'Trị liệu dịch vụ lẻ',
        loai_goi: 'LE',
        so_buoi_da_dung: ap.trang_thai === 'hoan_thanh' ? 1 : 0,
        tong_so_buoi: 1,
        latestSession: format(new Date(ap.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy'),
        staffName: ap.ten_nhan_su || 'Chưa phân công',
        status: ap.trang_thai,
        originalRecord: p
      });
    });
  });

  // Filter flat records
  const filteredRecords = flatRecords.filter(rec => {
    const matchesSearch = rec.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.patientPhone?.includes(searchTerm) ||
      rec.packageName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || 
      (filterType === 'package' && rec.type === 'package') ||
      (filterType === 'single' && rec.type === 'single') ||
      (filterType === 'exam' && rec.type === 'exam');

    const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;

    const matchesStaff = filterStaff === 'all' || rec.staffName === filterStaff;

    return matchesSearch && matchesType && matchesStatus && matchesStaff;
  });

  // Unique list of staff names for filters
  const uniqueStaffNames = Array.from(new Set(flatRecords.map(r => r.staffName).filter(Boolean)));

  const handleOpenDetail = (rec: any) => {
    setSelectedPatient(rec.originalRecord);
    if (rec.type === 'package') {
      setSelectedPlanId(rec.id);
      setSelectedAptId(null);
    } else {
      setSelectedPlanId(null);
      setSelectedAptId(rec.appointmentId);
    }
    setViewState('detail');
  };

  const selectedPlan = selectedPatient?.plans?.find((p: any) => p.id === selectedPlanId);
  const selectedPlanSessions = selectedPatient?.appointments?.filter(
    (ap: any) => ap.phac_do_dieu_tri_id === selectedPlanId
  ) || [];

  const selectedPlanKtvs = selectedPatient?.appointments
    ?.filter((ap: any) => ap.phac_do_dieu_tri_id === selectedPlanId && ap.loai !== 'KHAM')
    .map((ap: any) => ap.ten_nhan_su)
    .filter(Boolean) || [];
  const uniqueSelectedPlanKtvs = Array.from(new Set(selectedPlanKtvs));
  const selectedPlanKtvsDisplay = uniqueSelectedPlanKtvs.length > 0 ? uniqueSelectedPlanKtvs.join(', ') : 'Chưa phân công';

  // Find the exact next unscheduled session number
  let firstEmptySessionNum = 1;
  if (selectedPlan) {
    for (let i = 1; i <= selectedPlan.tong_so_buoi; i++) {
      const apptExists = selectedPlanSessions.some((ap: any) => 
        ap.so_thu_tu_buoi === i || (i === 1 && ap.loai === 'KHAM')
      );
      if (!apptExists) {
        firstEmptySessionNum = i;
        break;
      }
    }
  }

  useEffect(() => {
    let active = true;
    const fetchAvailable = async () => {
      if (!selectedPlan || !bookingDate || !bookingTime) {
        setAvailableStaff(null);
        return;
      }
      try {
        setLoadingAvailable(true);
        const res = await getAvailableStaff({
          ngay: bookingDate,
          gio_bat_dau: bookingTime,
          dang_ky_goi_id: selectedPlan.goi_dich_vu_id
        });
        if (active) {
          const staff = res.data || [];
          setAvailableStaff(staff);
          if (staff.length === 1) {
            setBookingKtvId(String(staff[0].nguoi_dung_id));
          } else if (bookingKtvId && !staff.some((s: any) => String(s.nguoi_dung_id) === String(bookingKtvId))) {
            setBookingKtvId('');
          }
        }
      } catch (err) {
        console.error('Error checking KTV availability:', err);
        if (active) {
          setAvailableStaff(null);
        }
      } finally {
        if (active) {
          setLoadingAvailable(false);
        }
      }
    };

    fetchAvailable();
    return () => {
      active = false;
    };
  }, [bookingDate, bookingTime, selectedPlanId]);

  // Selected appointment details (for exam/single detail view)
  const selectedApt = selectedPatient?.appointments?.find((ap: any) => ap.id === selectedAptId);

  const handlePrint = () => {
    window.print();
  };

  const convertToVietnamUtcIso = (dateStr: string, timeStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute);
    return date.toISOString();
  };

  const getEndTime = (timeStr: string, durationMin: number) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMins = h * 60 + m + durationMin;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedPlan || !bookingSessionNum) return;
    if (!bookingKtvId) {
      toast.error('Vui lòng chọn kỹ thuật viên');
      return;
    }

    try {
      setBookingLoading(true);
      const startIso = convertToVietnamUtcIso(bookingDate, bookingTime);
      const endIso = convertToVietnamUtcIso(bookingDate, getEndTime(bookingTime, 60));

      const payload = {
        khach_hang_id: selectedPatient.id,
        dich_vu_id: null,
        ky_thuat_vien_id: bookingKtvId,
        phong_id: bookingRoomId || null,
        ghi_chu_dat_lich: `Đặt lịch Buổi ${bookingSessionNum} của phác đồ: ${selectedPlan.ten_goi}`,
        ngay_gio_bat_dau: startIso,
        ngay_gio_ket_thuc: endIso,
        loai_lich: 'dieu_tri',
        dang_ky_goi_id: selectedPlan.goi_dich_vu_id,
        phac_do_dieu_tri_id: selectedPlan.id,
        so_thu_tu_buoi: bookingSessionNum
      };

      await createAppointment(payload);
      toast.success(`Đặt lịch Buổi số ${bookingSessionNum} thành công!`);
      setIsBookingOpen(false);
      await fetchData(); // Refresh data
      // Keep selected patient updated
      const updatedPatient = patients.find(p => p.id === selectedPatient.id);
      if (updatedPatient) {
        setSelectedPatient(updatedPatient);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể tạo cuộc hẹn.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {viewState === 'overview' ? (
        // ------------------ OVERVIEW VIEW (Screen 3) ------------------
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Danh sách hồ sơ điều trị (tổng quan)
              </h2>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                Theo dõi, tìm kiếm và phân tích tiến độ hồ sơ phác đồ điều trị của toàn bộ khách hàng.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">Tất cả loại</option>
                <option value="package">Chỉ gói phác đồ</option>
                <option value="single">Chỉ dịch vụ lẻ</option>
                <option value="exam">Chỉ lịch khám lẻ</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="dang_dieu_tri">Đang điều trị</option>
                <option value="hoan_thanh">Hoàn thành</option>
              </select>

              <select 
                value={filterStaff} 
                onChange={(e) => setFilterStaff(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">Tất cả chuyên viên</option>
                {uniqueStaffNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm khách hàng..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-52"
                />
              </div>
            </div>
          </div>

          {/* Stats KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Đang điều trị</span>
              <span className="text-3xl font-black text-slate-800 mt-2 block">{activePatientsCount}</span>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Gói liệu trình</span>
              <span className="text-3xl font-black text-slate-800 mt-2 block">{activePackagesCount}</span>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Dịch vụ lẻ hôm nay</span>
              <span className="text-3xl font-black text-slate-800 mt-2 block">{todaySingleTreatmentsCount}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4 font-black">Khách hàng</th>
                    <th className="p-4 font-black">Loại</th>
                    <th className="p-4 font-black">Dịch vụ</th>
                    <th className="p-4 font-black">Trị liệu gần nhất</th>
                    <th className="p-4 font-black">Phụ trách</th>
                    <th className="p-4 font-black text-center">Trạng thái</th>
                    <th className="p-4 font-black text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">Đang tải dữ liệu...</td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">Không tìm thấy hồ sơ nào.</td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id + '-' + rec.type} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">
                          <div className="flex flex-col">
                            <span>{rec.patientName}</span>
                            <span className="text-[10px] text-slate-400 font-extrabold font-mono mt-0.5">{rec.patientCode}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {rec.type === 'package' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-teal-50 text-teal-700">
                              Gói {rec.so_buoi_da_dung}/{rec.tong_so_buoi}
                            </span>
                          ) : rec.type === 'exam' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-700">
                              Khám
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-650">
                              Lẻ
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-800 max-w-[200px] truncate" title={rec.packageName}>
                          {rec.packageName}
                        </td>
                        <td className="p-4">
                          <span className={rec.latestSession === 'Chưa trị liệu' ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>
                            {rec.latestSession}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-700">{rec.staffName}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            rec.status === 'hoan_thanh' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                              : 'bg-teal-50 text-teal-700 border border-teal-100/50'
                          }`}>
                            {rec.status === 'hoan_thanh' ? 'Hoàn thành' : 'Đang điều trị'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenDetail(rec)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition-all"
                          >
                            Xem Chi Tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // ------------------ DETAIL VIEW (Screen 4) ------------------
        <div className="space-y-6">
          {/* Back Button & Patient Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewState('overview')}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-850 hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
              >
                <ChevronLeft size={16} className="stroke-[3]" />
              </button>
              
              {/* Patient Banner */}
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm uppercase">
                  {selectedPatient?.ho_ten?.charAt(0) || 'K'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{selectedPatient.ho_ten}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {selectedPatient.so_dien_thoai} • {selectedPlanId ? (
                      <>BS chỉ định: {selectedPlan?.ten_bac_si || 'N/A'} • KTV thực hiện: {selectedPlanKtvsDisplay}</>
                    ) : (
                      <>Nhân viên thực hiện: {selectedApt?.ten_nhan_su || 'N/A'}</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              {selectedApt && selectedApt.loai === 'KHAM' && selectedApt.phac_do_dieu_tri_id && (
                <button
                  onClick={() => {
                    setSelectedPlanId(selectedApt.phac_do_dieu_tri_id);
                    setSelectedAptId(null);
                  }}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/10 active:scale-95"
                >
                  <FileText size={13} className="stroke-[2.5]" />
                  <span>Xem phác đồ đã chỉ định</span>
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 rounded-xl text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <Printer size={13} className="stroke-[2.5]" />
                <span>In hồ sơ</span>
              </button>
            </div>
          </div>

          {/* Render 1: Package Plan Detail View */}
          {selectedPlanId && selectedPlan ? (
            <div className="space-y-6">
              
              {/* Phác đồ summary */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Phác đồ điều trị</span>
                    <h3 className="text-base font-black text-slate-800 mt-0.5">{selectedPlan.ten_goi}</h3>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    selectedPlan.trang_thai === 'dang_dieu_tri' 
                      ? 'bg-teal-100 text-teal-800' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedPlan.trang_thai === 'dang_dieu_tri' ? 'Đang chạy' : 'Hoàn thành'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bác sĩ chỉ định</span>
                    <strong className="text-slate-800 block mt-1">{selectedPlan.ten_bac_si || 'BS. Nguyễn Văn Khoa'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ngày lập</span>
                    <strong className="text-slate-800 block mt-1">
                      {selectedPlan.ngay_kich_hoat ? format(new Date(selectedPlan.ngay_kich_hoat), 'dd/MM/yyyy') : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số buổi</span>
                    <strong className="text-slate-800 block mt-1">{selectedPlan.tong_so_buoi} buổi</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Chẩn đoán</span>
                    <strong className="text-teal-700 block mt-1 font-black">{selectedPlan.chan_doan || 'Đau cơ xương khớp'}</strong>
                  </div>
                </div>
              </div>

              {/* Hồ sơ Khám lâm sàng & Lượng giá (Bác sĩ) của Buổi 1 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <FileText size={16} className="text-teal-600 stroke-[2.5]" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Hồ sơ Khám lâm sàng & Lượng giá của Bác sĩ</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 bg-teal-50/20 border border-teal-100/30 rounded-xl">
                    <span className="text-[10px] font-black text-teal-750 uppercase tracking-widest block">Chẩn đoán y khoa</span>
                    <p className="text-xs font-bold text-teal-950 leading-relaxed">
                      {selectedPlan.chan_doan || 'Chưa có chẩn đoán cụ thể.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 bg-rose-50/30 border border-rose-100/30 rounded-xl">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block flex items-center gap-1">
                      <AlertTriangle size={12} className="text-rose-500" /> Chống chỉ định y khoa (Bác sĩ lưu ý)
                    </span>
                    <p className="text-xs font-black text-rose-950 leading-relaxed">
                      {selectedPlan.chong_chi_dinh || 'Không có chống chỉ định đặc biệt.'}
                    </p>
                  </div>
                </div>

                {selectedPlan.ghi_chu_kham && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-650 leading-relaxed">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Hướng điều trị & Ghi chú của Bác sĩ</span>
                     "{selectedPlan.ghi_chu_kham}"
                  </div>
                )}
              </div>

              {/* Collapsible Session List */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Các buổi điều trị</h4>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: selectedPlan.tong_so_buoi }).map((_, index) => {
                    const sessionNum = index + 1;
                    // Check if appointment exists
                    const appt = selectedPlanSessions.find((ap: any) => ap.so_thu_tu_buoi === sessionNum) || 
                      (sessionNum === 1 ? selectedPlanSessions.find((ap: any) => ap.loai === 'KHAM') : null);

                    const isUnbooked = !appt && sessionNum === firstEmptySessionNum;
                    const isFinished = appt?.trang_thai === 'hoan_thanh';

                    if (appt) {
                      return (
                        <div key={appt.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                          <div className="p-4 flex justify-between items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  isFinished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isFinished ? 'Hoàn thành' : 'Đã đặt lịch'}
                                </span>
                                <strong className="text-xs font-black text-slate-800">
                                  Buổi {sessionNum} • {appt.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : 'Trị liệu phục hồi'}
                                </strong>
                              </div>
                              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                {format(new Date(appt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • KTV {appt.ten_nhan_su || 'Chưa phân công'}
                              </p>
                            </div>
                            {appt.vas_truoc !== null && (
                              <span className="text-[10px] font-black bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg shrink-0">
                                VAS: {appt.vas_truoc} ➔ {appt.vas_sau}
                              </span>
                            )}
                          </div>
                          {appt.ghi_chu_tri_lieu && (
                            <div className="px-4 pb-4 pt-1.5 border-t border-slate-50 text-xs text-slate-650 bg-slate-50/20 italic">
                              Ghi chú: {appt.ghi_chu_tri_lieu}
                            </div>
                          )}
                        </div>
                      );
                    } else if (isUnbooked) {
                      return (
                        <div key={sessionNum} className="border border-sky-100 bg-sky-50/30 rounded-xl p-4 flex justify-between items-center gap-4 animate-pulse">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-100 text-sky-850">
                                Chưa đặt lịch
                              </span>
                              <strong className="text-xs font-black text-slate-800">
                                Buổi {sessionNum} • Trị liệu phục hồi
                              </strong>
                            </div>
                            <p className="text-[10px] text-sky-700 font-semibold mt-1">Sẵn sàng để lên lịch đặt chỗ.</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setBookingSessionNum(sessionNum);
                              setIsBookingOpen(true);
                            }}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                          >
                            Đặt lịch
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div key={sessionNum} className="border border-dashed border-slate-100 rounded-xl p-4 flex justify-between items-center gap-4 opacity-50 bg-slate-50/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-500">
                                Chưa tới hạn
                              </span>
                              <strong className="text-xs font-bold text-slate-500">
                                Buổi {sessionNum} • Trị liệu phục hồi
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          ) : selectedApt ? (
            // Render 2: Single Service or Exam Detail View
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Thông tin ca lịch lẻ</span>
                    <h3 className="text-base font-black text-slate-800 mt-0.5">
                      {selectedApt.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : 'Trị liệu dịch vụ lẻ'}
                    </h3>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    selectedApt.trang_thai === 'hoan_thanh' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-850'
                  }`}>
                    {selectedApt.trang_thai === 'hoan_thanh' ? 'Hoàn thành' : 'Đã đặt'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Chuyên viên phụ trách</span>
                    <strong className="text-slate-800 block mt-1">{selectedApt.ten_nhan_su || 'Chưa phân công'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ngày thực hiện</span>
                    <strong className="text-slate-800 block mt-1">
                      {format(new Date(selectedApt.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Phòng làm việc</span>
                    <strong className="text-slate-800 block mt-1">{selectedApt.ten_phong || 'Chưa phân công'}</strong>
                  </div>
                </div>
              </div>

              {selectedApt.loai === 'KHAM' ? (
                // Detailed Clinical Exam diagnosis & notes
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <FileText size={16} className="text-teal-600 stroke-[2.5]" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Hồ sơ bệnh lý & Kết luận từ Bác sĩ</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 p-3 bg-teal-50/20 border border-teal-100/30 rounded-xl">
                      <span className="text-[10px] font-black text-teal-750 uppercase tracking-widest block">Chẩn đoán lâm sàng</span>
                      <p className="text-xs font-bold text-teal-950 leading-relaxed">
                        {selectedApt.chan_doan_tri_lieu || 'Đau cơ xương khớp chưa chẩn đoán chi tiết'}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-3 bg-rose-50/30 border border-rose-100/30 rounded-xl">
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block flex items-center gap-1">
                        <AlertTriangle size={12} className="text-rose-500" /> Chống chỉ định y khoa
                      </span>
                      <p className="text-xs font-black text-rose-950 leading-relaxed">
                        {selectedApt.chong_chi_dinh_tri_lieu || 'Không có chống chỉ định đặc biệt.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-650 leading-relaxed">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ghi chú lâm sàng</span>
                    "{selectedApt.ghi_chu || 'Không có ghi chú thêm.'}"
                  </div>
                </div>
              ) : (
                // Detailed treatment log for single session
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <FileText size={16} className="text-teal-600 stroke-[2.5]" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Đánh giá & Nhật ký ca điều trị lẻ</h4>
                  </div>

                  {selectedApt.vas_truoc !== null && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Thang đo đau (VAS)</span>
                      <div className="mt-1.5 flex items-center justify-between gap-6 bg-slate-50 border border-slate-100 p-3 rounded-xl max-w-sm">
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block">Trước</span>
                          <span className="text-xs font-black text-rose-500 block mt-0.5">{selectedApt.vas_truoc}/10</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-emerald-600 font-black">Giảm {selectedApt.vas_truoc - selectedApt.vas_sau} điểm</span>
                          <span className="text-slate-350 text-xs">➔</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block">Sau</span>
                          <span className="text-xs font-black text-teal-600 block mt-0.5">{selectedApt.vas_sau}/10</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-650 leading-relaxed italic">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans not-italic">Nhật ký & Diễn tiến trị liệu lẻ</span>
                    "{selectedApt.ghi_chu_tri_lieu || 'Không có ghi chú thêm.'}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl py-32 text-center shadow-sm">
              <h4 className="text-sm font-black text-slate-800">Không tìm thấy thông tin ca lịch hẹn</h4>
            </div>
          )}
        </div>
      )}

      {/* QUICK BOOKING DIALOG MODAL */}
      {isBookingOpen && selectedPatient && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-800">Đặt lịch Buổi {bookingSessionNum}</h3>
                <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5">{selectedPlan.ten_goi}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsBookingOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4 text-xs">
              {/* Date & Time Picker first */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase block">Ngày điều trị *</label>
                  <input 
                    type="date" 
                    value={bookingDate} 
                    onChange={(e) => setBookingDate(e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 font-bold" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase block">Giờ bắt đầu *</label>
                  <input 
                    type="time" 
                    value={bookingTime} 
                    onChange={(e) => setBookingTime(e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 font-bold" 
                    required 
                  />
                </div>
              </div>

              {/* KTV Selection dynamically loaded */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-450 uppercase block">Kỹ thuật viên phụ trách *</label>
                <select 
                  value={bookingKtvId} 
                  onChange={(e) => setBookingKtvId(e.target.value)} 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 font-bold disabled:opacity-75" 
                  required
                  disabled={loadingAvailable || !availableStaff}
                >
                  {loadingAvailable ? (
                    <option value="">-- Đang kiểm tra lịch trống KTV... --</option>
                  ) : !availableStaff ? (
                    <option value="">-- Vui lòng chọn Ngày & Giờ --</option>
                  ) : availableStaff.length === 0 ? (
                    <option value="">-- Không có KTV nào trống lịch --</option>
                  ) : (
                    <>
                      <option value="">-- Lựa chọn KTV ({availableStaff.length} sẵn sàng) --</option>
                      {availableStaff.map(s => (
                        <option key={s.nguoi_dung_id} value={String(s.nguoi_dung_id)}>
                          {s.ho_ten}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {availableStaff !== null && availableStaff.length === 0 && !loadingAvailable && (
                  <p className="text-[10px] font-extrabold text-rose-500 mt-1">
                    ⚠️ Tất cả kỹ thuật viên đã bận hoặc không có ca trực trong khung giờ này. Vui lòng chọn Ngày/Giờ khác.
                  </p>
                )}
              </div>

              {/* Room Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-450 uppercase block">Phòng trị liệu</label>
                <select 
                  value={bookingRoomId} 
                  onChange={(e) => setBookingRoomId(e.target.value)} 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 font-bold" 
                  required
                >
                  <option value="">-- Lựa chọn phòng --</option>
                  {roomsList.filter(r => r.loai_phong === 'phong_tri_lieu' || r.loai_phong === 'tri_lieu').map(r => (
                    <option key={r.id} value={r.id}>{r.ten_phong}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsBookingOpen(false)} 
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-650 font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={bookingLoading || loadingAvailable || (availableStaff !== null && availableStaff.length === 0)} 
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-500/10 transition-all disabled:opacity-50"
                >
                  {bookingLoading ? 'Đang đặt...' : 'Xác nhận tạo lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
