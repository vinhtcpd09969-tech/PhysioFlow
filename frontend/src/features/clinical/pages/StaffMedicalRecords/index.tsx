import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPatients, getPatientProfile, PatientInfo, PatientProfile } from '@/features/doctor/api/doctor.api';
import { PatientSidebar } from './PatientSidebar';
import { PatientDossierTimeline } from '../../components/PatientDossierTimeline';

type ActiveHighlight = { type: 'plan'; id: string } | { type: 'visit'; id: string } | null;

export default function DoctorMedicalRecords() {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<ActiveHighlight>(null);

  // Deep-link từ nơi khác (vd nút "Xem chi tiết" của 1 lịch hẹn đã kết thúc trong AppointmentInfoModal)
  // — tự chọn sẵn bệnh nhân + mở đúng buổi khám/phác đồ mở rộng inline trong dòng thời gian.
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDeepLinkHighlight, setPendingDeepLinkHighlight] = useState<ActiveHighlight>(null);

  // Load danh sách bệnh nhân
  useEffect(() => {
    async function loadPatients() {
      setLoadingPatients(true);
      try {
        const res = await getPatients();
        setPatients(res.data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách bệnh nhân:', error);
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, []);

  // Áp dụng deep-link (?patientId=&type=&itemId=) ngay khi danh sách bệnh nhân đã sẵn sàng, rồi xóa
  // param khỏi URL để không tự chọn lại nếu người dùng tự quay ra danh sách chọn bệnh nhân khác.
  useEffect(() => {
    if (loadingPatients) return;
    const patientId = searchParams.get('patientId');
    if (!patientId) return;

    const found = patients.find((p) => p.id === patientId || (p as any).khach_hang_id === patientId || (p as any).nguoi_dung_id === patientId);
    const type = searchParams.get('type');
    const itemId = searchParams.get('itemId');

    if (found) {
      setSelectedPatient(found);
    } else {
      setSelectedPatient({
        id: patientId,
        ho_ten: 'Khách hàng',
        khach_hang_id: patientId,
        so_dien_thoai: '',
        trang_thai: 'active'
      } as any);
    }

    if ((type === 'plan' || type === 'visit') && itemId) {
      setPendingDeepLinkHighlight({ type, id: itemId });
    }
    setSearchParams({}, { replace: true });
  }, [patients, loadingPatients, searchParams, setSearchParams]);

  // Load hồ sơ điều trị của bệnh nhân được chọn
  useEffect(() => {
    if (!selectedPatient) {
      setProfile(null);
      return;
    }

    async function loadProfile() {
      setLoadingProfile(true);
      setActiveHighlight(null);
      try {
        const res = await getPatientProfile(selectedPatient!.id);
        setProfile(res.data);
        if (pendingDeepLinkHighlight) {
          setActiveHighlight(pendingDeepLinkHighlight);
          setPendingDeepLinkHighlight(null);
        }
      } catch (error) {
        console.error('Lỗi khi tải hồ sơ điều trị bệnh nhân:', error);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [selectedPatient]);

  return (
    <div className="w-full space-y-6 font-jakarta pb-12 animate-fade-in">
      {!selectedPatient ? (
        <PatientSidebar
          patients={patients}
          onSelectPatient={setSelectedPatient}
          loadingPatients={loadingPatients}
        />
      ) : (
        <div>
          {loadingProfile ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="size-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">
                Đang tổng hợp dòng thời gian hồ sơ y tế bệnh nhân...
              </p>
            </div>
          ) : (
            <PatientDossierTimeline
              selectedPatient={selectedPatient}
              profile={profile}
              onBack={() => setSelectedPatient(null)}
              highlightTarget={activeHighlight}
            />
          )}
        </div>
      )}
    </div>
  );
}
