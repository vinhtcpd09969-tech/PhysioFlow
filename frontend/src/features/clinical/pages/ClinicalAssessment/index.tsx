import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stethoscope, Activity, CheckCircle2, FileText, Monitor, Zap, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';
import { PatientHeaderBanner } from '../../components/PatientHeaderBanner';
import { SpecialistAssessmentDesk } from '../../components/SpecialistAssessmentDesk';
import { TechnicianTreatmentDesk } from '../../components/TechnicianTreatmentDesk';
import { EmbeddedPatientEmrView } from '../../components/EmbeddedPatientEmrView';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  getAppointmentDetail as getAppointmentDetailDoctor,
  getPackages,
  saveAssessment,
  saveAssessmentDraft as saveAssessmentDraftDoctor,
  getDoctorQueue,
  getActiveSession as getActiveSessionDoctor,
} from '@/features/doctor/api/doctor.api';
import {
  getAppointmentDetail as getAppointmentDetailKtv,
  getActiveSession as getActiveSessionKtv,
  saveTreatmentRecord,
  saveTreatmentDraft,
} from '@/features/technician/api/technician.api';
import { useAuthStore } from '@/stores/authStore';

export function ClinicalAssessment() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isKtv = user?.vai_tro_id === 3;

  const [packages, setPackages] = useState<any[]>([]);
  const [activeDeskTab, setActiveDeskTab] = useState<'desk' | 'emr'>('desk');
  const [emrHighlightTarget, setEmrHighlightTarget] = useState<{ type: 'plan' | 'visit'; id: string } | null>(null);

  // ==== NHÁNH CHUYÊN VIÊN — đúng 1 bàn ====
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(
    !isKtv ? params.id : undefined
  );
  const [currentAppointment, setCurrentAppointment] = useState<any>(null);

  // ==== NHÁNH KTV — tối đa 2 bàn trị liệu song song ====
  const [ktvOpenAppointments, setKtvOpenAppointments] = useState<Record<string, any>>({});
  const [ktvActiveId, setKtvActiveId] = useState<string | undefined>(undefined);
  const [overtimeConfirm, setOvertimeConfirm] = useState<{ id: string; message: string } | null>(null);
  const ktvOpenIds = Object.keys(ktvOpenAppointments);

  // Thông tin phòng & thiết bị y tế của KTV
  const [workstation, setWorkstation] = useState<{
    phong: { phong_id: number; ten_phong: string; ma_phong: string; gio_bat_dau: string; gio_ket_thuc: string; loai_phong?: string } | null;
    thiet_bi: Array<{ id: string; ma_thiet_bi: string; ten_thiet_bi: string; trang_thai: string; ghi_chu?: string }>;
  } | null>(null);
  const [showRoomDevicesModal, setShowRoomDevicesModal] = useState(false);

  useEffect(() => {
    if (!isKtv) return;
    const aptId = params.id || ktvActiveId;
    api.get('/technician/workstation-info', {
      params: aptId ? { appointment_id: aptId } : undefined
    })
      .then((res) => setWorkstation(res.data))
      .catch(() => {});
  }, [isKtv, params.id, ktvActiveId]);

  const loadQueueData = async () => {
    try {
      if (user?.id && !isKtv) {
        await getDoctorQueue();
      }
    } catch (err) {
      console.error('Lỗi tải hàng đợi:', err);
    }
  };

  // ---- Chuyên viên: đồng bộ route -> selectedAppointmentId
  useEffect(() => {
    if (isKtv) return;
    const routeId = params.id;
    if (routeId) {
      setSelectedAppointmentId(routeId);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getActiveSessionDoctor();
        if (!cancelled && res.data?.id) {
          navigate(`/doctor/appointments/${res.data.id}/assess`, { replace: true });
        }
      } catch (err) {
        console.error('Lỗi kiểm tra ca đang mở:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isKtv, params.id, navigate]);

  // ---- Chuyên viên: tải chi tiết ca + danh mục gói
  useEffect(() => {
    if (isKtv || !selectedAppointmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const [aptRes, pkgRes] = await Promise.all([
          getAppointmentDetailDoctor(selectedAppointmentId!),
          getPackages(),
        ]);
        if (cancelled) return;
        setCurrentAppointment(aptRes.data);
        setPackages(pkgRes.data || []);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Lỗi khi tải chi tiết ca:', err);
        toast.error(err?.response?.data?.message || 'Không mở được ca lượng giá này.');
        navigate('/doctor/appointments');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isKtv, selectedAppointmentId, navigate]);

  // ---- KTV: đồng bộ route & tải toàn bộ các bàn trị liệu đang mở (song song tối đa 2 bàn)
  useEffect(() => {
    if (!isKtv) return;
    const routeId = params.id;
    let cancelled = false;

    (async () => {
      try {
        // 1. Tải danh sách tất cả các ca đang mở bàn (dang_kham) của KTV
        let activeSessions: Array<{ id: string; ma_lich_dat?: string; ten_khach_hang?: string }> = [];
        try {
          const activeRes = await getActiveSessionKtv();
          activeSessions = activeRes.data || [];
        } catch (e) {
          console.error('Lỗi lấy active-session KTV:', e);
        }

        // 2. Tập hợp các appointment ID cần nạp chi tiết
        const idsToFetch = new Set<string>();
        if (routeId) idsToFetch.add(routeId);
        activeSessions.forEach((s) => {
          if (s.id) idsToFetch.add(String(s.id));
        });

        if (idsToFetch.size === 0) {
          if (cancelled) return;
          setKtvOpenAppointments({});
          setKtvActiveId(undefined);
          return;
        }

        // 3. Tải chi tiết các ca song song
        const fetchResults = await Promise.all(
          Array.from(idsToFetch).map(async (id) => {
            try {
              const res = await getAppointmentDetailKtv(id);
              return { id, data: res.data };
            } catch (err: any) {
              const msg = err?.response?.data?.message || '';
              const isOvertimeBlock = err?.response?.status === 409 && msg.includes('quá thời lượng dự kiến');
              if (isOvertimeBlock && id === routeId) {
                setOvertimeConfirm({ id, message: msg });
              }
              return null;
            }
          })
        );

        if (cancelled) return;

        const newMap: Record<string, any> = {};
        fetchResults.forEach((item) => {
          if (item && item.data) {
            newMap[item.id] = item.data;
          }
        });

        setKtvOpenAppointments(newMap);

        // 4. Chọn bàn active
        if (routeId && newMap[routeId]) {
          setKtvActiveId(routeId);
        } else {
          const firstAvailableId = Object.keys(newMap)[0];
          if (firstAvailableId) {
            setKtvActiveId(firstAvailableId);
            if (!routeId) {
              navigate(`/technician/appointments/${firstAvailableId}/assess`, { replace: true });
            }
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Lỗi khi tải các bàn KTV:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isKtv, params.id, navigate]);

  // Xử lý xác nhận mở bàn 2 dù bàn 1 quá giờ
  const confirmOvertimeOpen = async () => {
    if (!overtimeConfirm) return;
    const { id } = overtimeConfirm;
    setOvertimeConfirm(null);
    try {
      const res = await getAppointmentDetailKtv(id, true);
      setKtvOpenAppointments((prev) => ({
        ...prev,
        [id]: res.data,
      }));
      setKtvActiveId(id);
      navigate(`/technician/appointments/${id}/assess`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi mở bàn.');
      navigate('/technician/appointments');
    }
  };

  const cancelOvertimeOpen = () => {
    setOvertimeConfirm(null);
    navigate('/technician/appointments');
  };

  // Lưu nháp lượng giá (Chuyên viên)
  const handleSaveAssessmentDraft = async (appointmentId: string, data: any) => {
    try {
      await saveAssessmentDraftDoctor({
        lich_dat_id: appointmentId,
        chan_doan: data.clinicalConclusion,
        chong_chi_dinh: data.contraindications,
        ghi_chu: data.notes,
        vas_score: data.vasScore,
        rom_data: data.romData,
        mmt_data: data.mmtData,
      });
    } catch (err) {
      console.error('Lỗi tự động lưu nháp lượng giá:', err);
    }
  };

  // Nộp kết quả Hoàn thành Lượng Giá
  const handleCompleteAssessment = async (data: any) => {
    if (!selectedAppointmentId) return;

    await saveAssessment({
      lich_dat_id: selectedAppointmentId,
      chan_doan: data.clinicalConclusion?.trim() || 'Chưa điền',
      chong_chi_dinh: data.contraindications?.trim() || 'Chưa điền',
      goi_dich_vu_id: data.selectedPackageId || null,
      ghi_chu: data.notes,
      vas_score: data.vasScore,
      rom_data: data.romData,
      mmt_data: data.mmtData,
    });

    setSelectedAppointmentId(undefined);
    setCurrentAppointment(null);
    loadQueueData();
    navigate('/doctor/appointments');
  };

  // Nộp Hẹn Tái Khám (Hẹn quay lại)
  const handleScheduleReassessment = async (
    limitDate: string,
    notes?: string,
    assessmentData?: {
      vasScore?: number;
      romData?: any[];
      mmtData?: any[];
      clinicalConclusion?: string;
      contraindications?: string;
    }
  ) => {
    if (!selectedAppointmentId) return;

    await saveAssessment({
      lich_dat_id: selectedAppointmentId,
      chan_doan: assessmentData?.clinicalConclusion?.trim() || currentAppointment?.chan_doan || 'Chưa thể kết luận',
      chong_chi_dinh: assessmentData?.contraindications?.trim() || 'Chưa điền',
      ghi_chu: notes ? notes : (limitDate ? `[Hạn tái lượng giá: ${limitDate}]` : null),
      is_reassessment: true,
      han_tai_kham: limitDate,
      vas_score: assessmentData?.vasScore,
      rom_data: assessmentData?.romData,
      mmt_data: assessmentData?.mmtData,
    });

    setSelectedAppointmentId(undefined);
    setCurrentAppointment(null);
    loadQueueData();
    navigate('/doctor/appointments');
  };

  // Nộp kết quả Hoàn thành Trị liệu
  const handleCompleteTreatment = async (
    appointmentId: string,
    data: { vas_truoc: number; vas_sau: number; ghi_chu?: string; du_lieu_tri_lieu?: any }
  ) => {
    await saveTreatmentRecord({
      lich_dat_id: appointmentId,
      vas_truoc: data.vas_truoc,
      vas_sau: data.vas_sau,
      ghi_chu: data.ghi_chu,
      du_lieu_tri_lieu: data.du_lieu_tri_lieu,
    });

    toast.success('Đã hoàn thành ca trị liệu.');

    const remainingIds = ktvOpenIds.filter((i) => i !== appointmentId);
    setKtvOpenAppointments((prev) => {
      const next = { ...prev };
      delete next[appointmentId];
      return next;
    });

    if (remainingIds.length > 0) {
      navigate(`/technician/appointments/${remainingIds[0]}/assess`);
    } else {
      navigate('/technician/appointments');
    }
  };

  const handleSaveDraft = (
    appointmentId: string,
    data: { vas_truoc: number; vas_sau: number; ghi_chu?: string; du_lieu_tri_lieu?: any }
  ) => {
    saveTreatmentDraft({
      lich_dat_id: appointmentId,
      vas_truoc: data.vas_truoc,
      vas_sau: data.vas_sau,
      ghi_chu: data.ghi_chu,
      du_lieu_tri_lieu: data.du_lieu_tri_lieu,
    }).catch((err) => console.error('Lỗi lưu nháp buổi trị liệu:', err));
  };

  const redirectPath = isKtv ? '/technician/appointments' : '/doctor/appointments';

  // ==================== RENDER ====================
  if (isKtv) {
    const activeApt = ktvActiveId ? ktvOpenAppointments[ktvActiveId] : null;
    const activePatientId = activeApt?.khach_hang_id || activeApt?.khach_hang?.id || activeApt?.id || '';
    const activePatientName = activeApt?.ten_khach_hang || 'Khách hàng';

    return (
      <div className="w-full space-y-6 font-jakarta">
        <ConfirmDialog
          isOpen={!!overtimeConfirm}
          title="Mở bàn trị liệu thứ 2?"
          message={overtimeConfirm?.message || ''}
          confirmLabel="Vẫn mở bàn 2"
          cancelLabel="Để sau"
          type="warning"
          onConfirm={confirmOvertimeOpen}
          onCancel={cancelOvertimeOpen}
        />

        {ktvOpenIds.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-16 text-center shadow-sm space-y-5 animate-in fade-in duration-300 my-8">
            <div className="size-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-inner">
              <Activity size={32} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-jakarta">
                Chưa có ca trị liệu nào đang mở bàn
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Vui lòng truy cập trang <span className="font-bold text-slate-700 dark:text-zinc-300">LỊCH HẸN</span> để xem
                danh sách bệnh nhân đang chờ và bấm <span className="font-bold text-teal-600 dark:text-teal-400">[ Vào bàn trị liệu ]</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(redirectPath)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Activity size={16} />
              <span>CHUYỂN ĐẾN DANH SÁCH LỊCH HẸN</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* THANH ĐIỀU HƯỚNG TAB: BÀN LÀM VIỆC vs LỊCH SỬ ĐIỀU TRỊ + THIẾT BỊ PHÒNG + DROPDOWN BÀN ĐANG MỞ */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveDeskTab('desk')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activeDeskTab === 'desk'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  <Monitor size={15} />
                  <span>🖥️ BÀN LÀM VIỆC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDeskTab('emr')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activeDeskTab === 'emr'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  <FileText size={15} />
                  <span>📜 LỊCH SỬ ĐIỀU TRỊ</span>
                </button>
              </div>

              {/* Action Toolbar bên phải: Nút Thiết bị y tế trong phòng + Dropdown Bàn mở */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Nút xem thiết bị y tế trong phòng */}
                <button
                  type="button"
                  onClick={() => setShowRoomDevicesModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 cursor-pointer shadow-2xs"
                  title="Xem danh sách thiết bị y tế đã cấu hình vào phòng trực"
                >
                  <Zap size={14} className="text-teal-600 dark:text-teal-400" />
                  <span>Thiết bị trong phòng</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-teal-200/80 dark:bg-teal-800 text-[10px] font-mono font-bold">
                    {workstation?.thiet_bi?.length || 0}
                  </span>
                </button>

                {/* Dropdown danh sách bàn KTV đang mở */}
                {ktvOpenIds.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl">
                    {ktvOpenIds.map((id, idx) => {
                      const apt = ktvOpenAppointments[id];
                      const isActive = id === ktvActiveId;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => navigate(`/technician/appointments/${id}/assess`)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <span className={`size-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                          <span>Bàn {idx + 1}: {apt?.ten_khach_hang || 'Khách'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* TAB CONTENT: BÀN LÀM VIỆC VS LỊCH SỬ ĐIỀU TRỊ (EMR) */}
            {activeDeskTab === 'emr' ? (
              <EmbeddedPatientEmrView
                patientId={activePatientId}
                patientName={activePatientName}
                soDienThoai={activeApt?.so_dien_thoai}
                gioiTinh={activeApt?.gioi_tinh}
                tuoi={activeApt?.tuoi}
                highlightTarget={emrHighlightTarget}
              />
            ) : (
              ktvOpenIds.map((id) => {
                const apt = ktvOpenAppointments[id];
                return (
                  <div key={id} className={id === ktvActiveId ? 'block space-y-6' : 'hidden'}>
                    <PatientHeaderBanner
                      patient={{
                        id: String(apt.id),
                        khach_hang_id: apt.khach_hang_id,
                        ma_khach_hang: apt.ma_khach_hang || 'KH-88392',
                        ten_khach_hang: apt.ten_khach_hang || 'Bệnh nhân',
                        so_dien_thoai: apt.so_dien_thoai,
                        tuoi: apt.tuoi || 28,
                        gioi_tinh: apt.gioi_tinh || 'Nam',
                        ly_do_kham: apt.ly_do_kham || apt.ghi_chu,
                        anh_dinh_kem_url: apt.anh_dinh_kem_url || apt.anh_dinh_kem,
                        vas_truoc: apt.vas_truoc !== undefined && apt.vas_truoc !== null ? apt.vas_truoc : undefined,
                        trang_thai: apt.trang_thai,
                        ten_dich_vu: apt.ten_dich_vu,
                        so_thu_tu_buoi: apt.so_thu_tu_buoi,
                        pd_tong_so_buoi: apt.pd_tong_so_buoi,
                        thoi_luong_phut: apt.thoi_luong_phut,
                        thoi_gian_bat_dau: apt.thoi_gian_bat_dau || apt.thoi_gian_goi_vao || apt.thoi_gian_checkin,
                      }}
                      onBack={() => navigate(redirectPath)}
                      isKtvMode
                    />
                    <TechnicianTreatmentDesk
                      patientName={apt.ten_khach_hang || 'Khách hàng'}
                      appointmentDetail={apt}
                      onCompleteTreatment={(data) => handleCompleteTreatment(id, data)}
                      onSaveDraft={(data) => handleSaveDraft(id, data)}
                      onViewAssessment={() => {
                        const planId = apt.phac_do_dieu_tri_id;
                        const visitId = apt.lich_kham_goc_id || apt.ma_lich_kham_goc;
                        setEmrHighlightTarget({
                          type: 'visit',
                          id: String(visitId || planId || 'ASSESSMENT_FIRST'),
                        });
                        setActiveDeskTab('emr');
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MODAL XEM THIẾT BỊ Y TẾ CỦA PHÒNG TRỰC KTV */}
        {showRoomDevicesModal && (
          <div className="fixed inset-0 z-50 bg-slate-955/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col font-jakarta">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                      Thiết Bị Y Tế Trong Phòng Trực
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {workstation?.phong ? (
                        <>
                          <span className="font-bold text-teal-700 dark:text-teal-300">🏢 {workstation.phong.ten_phong}</span>
                          <span className="mx-1.5">·</span>
                          <span className="font-mono">{workstation.phong.ma_phong}</span>
                          <span className="mx-1.5">·</span>
                          <span>Ca trực: {workstation.phong.gio_bat_dau} - {workstation.phong.gio_ket_thuc}</span>
                        </>
                      ) : (
                        'Chưa xác định phòng trực hôm nay'
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRoomDevicesModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Danh sách thiết bị */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {workstation?.thiet_bi && workstation.thiet_bi.length > 0 ? (
                  workstation.thiet_bi.map((tb) => (
                    <div
                      key={tb.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
                            {tb.ten_thiet_bi}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-600">
                            {tb.ma_thiet_bi}
                          </span>
                        </div>
                        {tb.ghi_chu && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                            {tb.ghi_chu}
                          </p>
                        )}
                      </div>

                      {(() => {
                        const isBaoTri = tb.trang_thai === 'dang_bao_tri' || tb.trang_thai === 'tam_dung';
                        const isNgungSuDung = tb.trang_thai === 'ngung_su_dung' || tb.trang_thai === 'ngung_hoat_dong';

                        if (isBaoTri) {
                          return (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 border bg-amber-50 dark:bg-amber-955/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                              ⚠️ Bảo trì
                            </span>
                          );
                        }
                        if (isNgungSuDung) {
                          return (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 border bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700">
                              ✕ Ngưng sử dụng
                            </span>
                          );
                        }
                        return (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 border bg-emerald-50 dark:bg-emerald-955/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                            ✓ Sẵn sàng
                          </span>
                        );
                      })()}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                      Phòng trực hiện tại chưa được cấu hình thiết bị y tế nào trong hệ thống.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Quản trị viên có thể gán thiết bị theo phòng tại menu Quản lý Phòng trị liệu.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowRoomDevicesModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== NHÁNH CHUYÊN VIÊN — đúng 1 bàn ====================
  const currentStatus = String(currentAppointment?.trang_thai || '');
  const isCompleted = currentStatus === 'hoan_thanh' || currentStatus === 'da_huy' || currentStatus === 'khong_den';

  const docPatientId = currentAppointment?.khach_hang_id || currentAppointment?.khach_hang?.id || currentAppointment?.id || '';
  const docPatientName = currentAppointment?.ten_khach_hang || 'Khách hàng';

  return (
    <div className="w-full space-y-6 font-jakarta">
      <main className="w-full space-y-6">
        {selectedAppointmentId && currentAppointment ? (
          isCompleted ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm space-y-5 animate-in fade-in duration-300 my-8">
              <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  ĐÃ HOÀN THÀNH
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 font-jakarta pt-1">
                  Ca lượng giá cho bệnh nhân {currentAppointment.ten_khach_hang || 'Khách hàng'} đã kết thúc
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Dữ liệu đã được cập nhật thành công vào hồ sơ bệnh nhân. Bàn làm việc đã giải phóng để đón ca tiếp theo.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAppointmentId(undefined);
                    setCurrentAppointment(null);
                    navigate(redirectPath);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>QUAY LẠI DANH SÁCH LỊCH HẸN</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-6 font-jakarta">
              {/* THANH ĐIỀU HƯỚNG TÁP BÀN LÀM VIỆC VS LỊCH SỬ ĐIỀU TRỊ (CHUYÊN VIÊN) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveDeskTab('desk')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      activeDeskTab === 'desk'
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                    }`}
                  >
                    <Monitor size={15} />
                    <span>🖥️ BÀN LÀM VIỆC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDeskTab('emr')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      activeDeskTab === 'emr'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                    }`}
                  >
                    <FileText size={15} />
                    <span>📜 LỊCH SỬ ĐIỀU TRỊ</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-teal-50 dark:bg-teal-950/60 text-[#0d766e] dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
                    🟢 ĐANG LƯỢNG GIÁ: {docPatientName}
                  </span>
                </div>
              </div>

              {activeDeskTab === 'emr' ? (
                <EmbeddedPatientEmrView
                  patientId={docPatientId}
                  patientName={docPatientName}
                  soDienThoai={currentAppointment.so_dien_thoai}
                  gioiTinh={currentAppointment.gioi_tinh}
                  tuoi={currentAppointment.tuoi}
                  highlightTarget={emrHighlightTarget}
                />
              ) : (
                <div className="space-y-6">
                  <PatientHeaderBanner
                    patient={{
                      id: String(currentAppointment.id),
                      khach_hang_id: currentAppointment.khach_hang_id || currentAppointment.khach_hang?.id,
                      ma_khach_hang: currentAppointment.ma_khach_hang || 'KH-88392',
                      ten_khach_hang: currentAppointment.ten_khach_hang || 'Bệnh nhân',
                      so_dien_thoai: currentAppointment.so_dien_thoai,
                      tuoi: currentAppointment.tuoi || 28,
                      gioi_tinh: currentAppointment.gioi_tinh || 'Nam',
                      ly_do_kham: currentAppointment.ly_do_kham || currentAppointment.ghi_chu,
                      anh_dinh_kem_url: currentAppointment.anh_dinh_kem_url || currentAppointment.anh_dinh_kem,
                      vas_truoc:
                        currentAppointment.vas_truoc !== undefined && currentAppointment.vas_truoc !== null
                          ? currentAppointment.vas_truoc
                          : undefined,
                      trang_thai: currentAppointment.trang_thai,
                      ten_dich_vu: currentAppointment.ten_dich_vu,
                      so_thu_tu_buoi: currentAppointment.so_thu_tu_buoi,
                      pd_tong_so_buoi: currentAppointment.pd_tong_so_buoi,
                      thoi_luong_phut: currentAppointment.thoi_luong_phut,
                      thoi_gian_bat_dau: currentAppointment.thoi_gian_bat_dau || currentAppointment.thoi_gian_goi_vao || currentAppointment.thoi_gian_checkin,
                    }}
                    onBack={() => navigate(redirectPath)}
                    isKtvMode={false}
                    compactMode={true}
                  />

                  <SpecialistAssessmentDesk
                    patientName={currentAppointment.ten_khach_hang || 'Khách hàng'}
                    packages={packages}
                    appointmentDetail={currentAppointment}
                    onCompleteAssessment={handleCompleteAssessment}
                    onScheduleReassessment={handleScheduleReassessment}
                    onSaveDraft={(data) => handleSaveAssessmentDraft(selectedAppointmentId!, data)}
                    compactMode={true}
                  />
                </div>
              )}
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-16 text-center shadow-sm space-y-5 animate-in fade-in duration-300 my-8">
            <div className="size-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-inner">
              <Stethoscope size={32} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-jakarta">
                Chưa có ca lượng giá nào đang mở bàn làm việc
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Vui lòng truy cập trang <span className="font-bold text-slate-700 dark:text-zinc-300">LỊCH HẸN</span> để xem
                danh sách khách hàng đang chờ và bấm{' '}
                <span className="font-bold text-teal-600 dark:text-teal-400">[ 🩺 MỞ BÀN ]</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(redirectPath)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Stethoscope size={16} />
              <span>CHUYỂN ĐẾN DANH SÁCH LỊCH HẸN</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ClinicalAssessment;
