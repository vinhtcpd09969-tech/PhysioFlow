import { useState, useEffect } from 'react';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { getPatientProfile, PatientProfile, PatientInfo } from '@/features/doctor/api/doctor.api';
import { PatientDossierTimeline } from './PatientDossierTimeline';

interface EmbeddedPatientEmrViewProps {
  patientId: string;
  patientName: string;
  soDienThoai?: string;
  gioiTinh?: string;
  tuoi?: number;
  highlightTarget?: { type: 'plan' | 'visit'; id: string } | null;
}

export function EmbeddedPatientEmrView({
  patientId,
  patientName,
  soDienThoai,
  gioiTinh,
  tuoi,
  highlightTarget,
}: EmbeddedPatientEmrViewProps) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!patientId) {
      setLoading(false);
      return;
    }

    async function fetchEmr() {
      setLoading(true);
      setError(null);
      try {
        const res = await getPatientProfile(patientId);
        if (isMounted) {
          setProfile(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Lỗi khi tải hồ sơ điều trị:', err);
          setError(err?.response?.data?.message || 'Không thể tải hồ sơ điều trị của khách hàng này.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchEmr();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const patientInfoMock: PatientInfo = {
    id: patientId,
    nguoi_dung_id: patientId,
    ho_ten: patientName || 'Khách hàng',
    so_dien_thoai: soDienThoai || '---',
    email: '',
    gioi_tinh: gioiTinh || 'Khác',
    ngay_sinh: tuoi ? `${new Date().getFullYear() - tuoi}-01-01` : undefined,
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-4 shadow-sm animate-in fade-in duration-200 font-jakarta">
        <Loader2 className="size-10 text-teal-600 dark:text-teal-400 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
          Đang tải toàn bộ hồ sơ & lịch sử điều trị của khách hàng <strong className="text-teal-600">{patientName}</strong>...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-955/30 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 text-center space-y-3 font-jakarta">
        <AlertCircle className="size-8 text-rose-500 mx-auto" />
        <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
      </div>
    );
  }

  if (!profile || (profile.visits.length === 0 && profile.treatmentPlans.length === 0)) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3 shadow-sm font-jakarta">
        <div className="size-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
          <FileText size={24} />
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Chưa có lịch sử điều trị trước đây</h4>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Khách hàng <strong className="text-slate-700 dark:text-zinc-300">{patientName}</strong> hiện chưa có buổi lượng giá hoặc phác đồ điều trị nào đã ghi nhận trong hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-300 font-jakarta">
      <PatientDossierTimeline
        selectedPatient={patientInfoMock}
        profile={profile}
        onBack={() => {}}
        compactMode={true}
        highlightTarget={highlightTarget}
      />
    </div>
  );
}
