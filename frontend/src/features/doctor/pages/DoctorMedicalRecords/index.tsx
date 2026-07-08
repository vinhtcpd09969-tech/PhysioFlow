import { useState, useEffect } from 'react';
import { HeartHandshake } from 'lucide-react';
import { getPatients, getPatientProfile, PatientInfo, PatientProfile } from '../../api/doctor.api';
import { PatientSidebar } from './components/PatientSidebar';
import { PatientHeader } from './components/PatientHeader';
import { ClinicalTimeline } from './components/ClinicalTimeline';
import { TreatmentProgress } from './components/TreatmentProgress';

export default function DoctorMedicalRecords() {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'treatments'>('history');

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

  // Load hồ sơ điều trị của bệnh nhân được chọn
  useEffect(() => {
    if (!selectedPatient) {
      setProfile(null);
      return;
    }

    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const res = await getPatientProfile(selectedPatient!.id);
        setProfile(res.data);
      } catch (error) {
        console.error('Lỗi khi tải hồ sơ điều trị bệnh nhân:', error);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [selectedPatient]);

  return (
    <div className="h-[calc(100vh-10rem)] -mt-2 flex gap-6 animate-in fade-in duration-500 overflow-hidden">
      
      {/* CỘT 1: Thanh bên lọc bệnh nhân (Tất cả / Gần đây / Chống chỉ định) */}
      <PatientSidebar 
        patients={patients} 
        selectedPatient={selectedPatient} 
        onSelectPatient={setSelectedPatient} 
        loadingPatients={loadingPatients} 
      />

      {/* KHU VỰC CHI TIẾT CHÍNH (Cột bên phải chiếm toàn bộ chiều rộng còn lại) */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden min-w-0">
        {selectedPatient ? (
          <>
            {/* HUD Header thông tin bệnh nhân & Thống kê số liệu */}
            <PatientHeader 
              selectedPatient={selectedPatient} 
              profile={profile} 
            />

            {/* Thanh Tab điều hướng chính (Chẩn đoán lâm sàng vs Tiến trình trị liệu thực tế) */}
            <div className="border-b border-zinc-150 dark:border-zinc-800 flex bg-white dark:bg-zinc-900 shrink-0">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'history'
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-zinc-400 dark:text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Lịch sử chẩn đoán ({profile?.medicalRecords?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('treatments')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'treatments'
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-zinc-400 dark:text-zinc-555 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Tiến trình trị liệu thực tế ({profile?.treatmentPlans?.length || 0})
              </button>
            </div>

            {/* Nội dung chi tiết của Tab đang hoạt động */}
            <div className="flex-1 overflow-hidden min-h-0 bg-white dark:bg-zinc-900">
              {loadingProfile ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-bold uppercase tracking-wider animate-pulse">Đang tải dữ liệu hồ sơ...</p>
                </div>
              ) : activeTab === 'history' ? (
                <ClinicalTimeline medicalRecords={profile?.medicalRecords || []} />
              ) : (
                <TreatmentProgress profile={profile} />
              )}
            </div>
          </>
        ) : (
          /* Trạng thái trống khi chưa chọn bệnh nhân */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 dark:text-zinc-500 text-center gap-4">
            <div className="size-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 text-4xl shadow-inner">
              🗂️
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="font-extrabold text-secondary dark:text-zinc-300 text-sm">Hồ sơ điều trị chi tiết</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Vui lòng chọn một bệnh nhân từ danh sách bên trái để tra cứu toàn bộ lịch sử chẩn đoán lâm sàng và quá trình điều trị thực tế.
              </p>
            </div>
            <div className="bg-primary/5 dark:bg-primary/10 px-4 py-3 rounded-2xl border border-primary/20 max-w-sm flex items-start gap-2.5 text-left mt-2">
              <HeartHandshake className="text-primary size-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-wider">Lưu ý chuyên môn</p>
                <p className="text-[10px] text-zinc-650 dark:text-zinc-400 font-semibold mt-0.5">
                  Việc đối chiếu tiến độ phục hồi qua ghi chú kỹ thuật viên giúp bác sĩ chẩn đoán chính xác hơn cho lần tái khám.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
