import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getPatientProfile, PatientProfile, PatientInfo } from '../../../../doctor/api/doctor.api';

export interface EmrHighlightTarget {
  type: 'plan' | 'visit';
  id: string;
}

export function useCustomerEmr() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightTarget, setHighlightTarget] = useState<EmrHighlightTarget | null>(null);

  const openCustomer = useCallback(async (customerInput: string | any, highlight?: EmrHighlightTarget) => {
    try {
      setLoading(true);
      setHighlightTarget(highlight || null);
      const customerId = typeof customerInput === 'string' ? customerInput : customerInput.id;

      if (typeof customerInput !== 'string' && customerInput) {
        setPatientInfo({
          id: customerInput.id,
          ma_khach_hang: customerInput.ma_khach_hang || '',
          ho_ten: customerInput.ho_ten || 'Khách hàng',
          so_dien_thoai: customerInput.so_dien_thoai || '',
          email: customerInput.email || '',
        });
      }

      const res = await getPatientProfile(customerId);
      const data = res.data as any;
      setProfile(data);
      if (data && data.patient) {
        setPatientInfo(data.patient);
      }
    } catch (error) {
      console.error('Error fetching customer emr:', error);
      toast.error('Không thể tải hồ sơ khách hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const closeCustomer = () => {
    setProfile(null);
    setPatientInfo(null);
    setHighlightTarget(null);
  };

  return { profile, patientInfo, patient: patientInfo, loading, highlightTarget, openCustomer, closeCustomer };
}
