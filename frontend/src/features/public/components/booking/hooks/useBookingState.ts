import { useReducer, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { BookingState, BookingAction } from '../types';
import { formatLocalDate } from '../constants';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface BuoiSlotAvailability {
  conLaiChung: number;
  choPhep: boolean;
  /** Khách đã có 1 lịch ĐANG HOẠT ĐỘNG với đúng dịch vụ này trong buổi này — cảnh báo mềm, không chặn. */
  trungDichVu: boolean;
}

export interface BuoiNhanSu {
  id: number;
  ho_ten: string;
  anh_dai_dien: string | null;
  caTruc: string;
  conLaiSang: number;
  conLaiChieu: number;
}

export interface BuoiAvailability {
  sang: BuoiSlotAvailability;
  chieu: BuoiSlotAvailability;
  nhanSu: BuoiNhanSu[];
  hasExistingClinicalExam: boolean;
  buoc_thanh_toan_online?: boolean;
}

const EMPTY_AVAILABILITY: BuoiAvailability = {
  sang: { conLaiChung: 0, choPhep: false, trungDichVu: false },
  chieu: { conLaiChung: 0, choPhep: false, trungDichVu: false },
  nhanSu: [],
  hasExistingClinicalExam: false,
  buoc_thanh_toan_online: false
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, selectedDate: action.date, selectedBuoi: '' };
    case 'SET_BUOI':
      return { ...state, selectedBuoi: action.buoi };
    case 'SET_FORM_FIELD':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'SET_SUCCESS':
      return { ...state, isSuccess: action.isSuccess };
    default:
      return state;
  }
}

export function useBookingState(user: any, bookingType: 'kham' | 'dich_vu', selectedServiceId: string, services: any[]) {
  const [state, dispatch] = useReducer(bookingReducer, {
    selectedDate: formatLocalDate(new Date()),
    selectedBuoi: '',
    isSubmitting: false,
    isSuccess: false,
    formData: {
      ho_ten_khach: user?.ho_ten || '',
      so_dien_thoai: user?.so_dien_thoai || '',
      gioi_tinh_khach: user?.gioi_tinh || 'nam',
      trieu_chung: '',
      ly_do_kham: 'Lượng giá phục hồi chức năng ban đầu',
      anh_dinh_kem_url: ''
    }
  });

  const [buoiAvailability, setBuoiAvailability] = useState<BuoiAvailability>(EMPTY_AVAILABILITY);
  const [isPhoneTakenByOther, setIsPhoneTakenByOther] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshSlots = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Restore saved booking form data on user state change
  useEffect(() => {
    const saved = localStorage.getItem('temp_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedDate) dispatch({ type: 'SET_DATE', date: parsed.selectedDate });
        if (parsed.selectedBuoi) dispatch({ type: 'SET_BUOI', buoi: parsed.selectedBuoi });
        if (parsed.formData) {
          Object.keys(parsed.formData).forEach(key => {
            if (key === 'ho_ten_khach' && user?.ho_ten) return;
            dispatch({ type: 'SET_FORM_FIELD', field: key, value: parsed.formData[key] });
          });
        }
        toast.success('Đã khôi phục dữ liệu lịch hẹn của bạn!');
      } catch (e) {
        console.error('Lỗi khôi phục lịch đặt tạm thời:', e);
      }
      localStorage.removeItem('temp_booking');
    }
  }, [user]);

  // Fetch sức chứa 2 buổi cho ngày đang chọn
  useEffect(() => {
    if (!state.selectedDate) return;
    const userId = user?.id || '';
    const phone = state.formData.so_dien_thoai || user?.so_dien_thoai || '';

    let targetDichVuId = '';
    if (bookingType === 'dich_vu') {
      targetDichVuId = selectedServiceId;
    } else {
      const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
      targetDichVuId = examService?.id || '';
    }

    fetch(`${BASE_URL}/client/appointments/buoi-availability?date=${state.selectedDate}&userId=${userId}&phone=${phone}&dichVuId=${targetDichVuId}`)
      .then(res => res.json())
      .then(data => {
        setBuoiAvailability({
          sang: data.sang || EMPTY_AVAILABILITY.sang,
          chieu: data.chieu || EMPTY_AVAILABILITY.chieu,
          nhanSu: data.nhanSu || [],
          hasExistingClinicalExam: !!data.hasExistingClinicalExam,
          buoc_thanh_toan_online: !!data.buoc_thanh_toan_online
        });
        setIsPhoneTakenByOther(!!data.isPhoneTakenByOther);
      })
      .catch(() => {
        setBuoiAvailability(EMPTY_AVAILABILITY);
        setIsPhoneTakenByOther(false);
      });
  }, [state.selectedDate, user?.id, state.formData.so_dien_thoai, user?.so_dien_thoai, bookingType, selectedServiceId, services, refreshTrigger]);

  const setDateField = useCallback((date: string) => {
    dispatch({ type: 'SET_DATE', date });
  }, []);

  const setBuoiField = useCallback((buoi: 'sang' | 'chieu' | '') => {
    dispatch({ type: 'SET_BUOI', buoi });
  }, []);

  const setFormField = useCallback((field: string, value: string) => {
    dispatch({ type: 'SET_FORM_FIELD', field, value });
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', isSubmitting });
  }, []);

  const setSuccess = useCallback((isSuccess: boolean) => {
    dispatch({ type: 'SET_SUCCESS', isSuccess });
  }, []);

  return {
    state,
    buoiAvailability,
    hasExistingClinicalExam: buoiAvailability.hasExistingClinicalExam,
    isPhoneTakenByOther,
    setDateField,
    setBuoiField,
    setFormField,
    setSubmitting,
    setSuccess,
    refreshSlots
  };
}
