import { useReducer, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { BookingState, BookingAction } from '../types';
import { formatLocalDate } from '../constants';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, selectedDate: action.date, selectedTime: '' };
    case 'SET_TIME':
      return { ...state, selectedTime: action.time };
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
  const [tempHoldId] = useState(() => {
    let id = sessionStorage.getItem('booking_temp_hold_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('booking_temp_hold_id', id);
    }
    return id;
  });

  const [state, dispatch] = useReducer(bookingReducer, {
    selectedDate: formatLocalDate(new Date()),
    selectedTime: '',
    isSubmitting: false,
    isSuccess: false,
    formData: {
      ho_ten_khach: user?.ho_ten || '',
      so_dien_thoai: user?.so_dien_thoai || '',
      gioi_tinh_khach: 'nam',
      trieu_chung: '',
      ly_do_kham: 'Khám lượng giá ban đầu',
      anh_dinh_kem_url: ''
    }
  });

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<Record<string, number[]>>({});
  const [hasExistingClinicalExam, setHasExistingClinicalExam] = useState<boolean>(false);
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
        if (parsed.selectedTime) dispatch({ type: 'SET_TIME', time: parsed.selectedTime });
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

  // Fetch booked slots for the selected date
  useEffect(() => {
    if (!state.selectedDate) return;
    setHasExistingClinicalExam(false); // Reset cờ trùng lịch ngay khi thay đổi ngày
    const userId = user?.id || '';
    const phone = state.formData.so_dien_thoai || user?.so_dien_thoai || '';
    
    let duration = 30;
    let targetDichVuId = '';
    
    if (bookingType === 'dich_vu') {
      targetDichVuId = selectedServiceId;
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        duration = service.thoi_luong_phut || 30;
      }
    } else {
      const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
      targetDichVuId = examService?.id || '';
    }

    fetch(`${BASE_URL}/client/appointments/booked-slots?date=${state.selectedDate}&userId=${userId}&phone=${phone}&duration=${duration}&dichVuId=${targetDichVuId}&excludeSessionId=${tempHoldId}`)
      .then(res => res.json())
      .then(data => {
        setBookedSlots(data.bookedSlots || []);
        setSpecialists(data.specialists || []);
        setSlotAvailability(data.slotAvailability || {});
        setHasExistingClinicalExam(!!data.hasExistingClinicalExam);
      })
      .catch(() => {
        setBookedSlots([]);
        setSpecialists([]);
        setSlotAvailability({});
        setHasExistingClinicalExam(false);
      });
  }, [state.selectedDate, user?.id, state.formData.so_dien_thoai, user?.so_dien_thoai, bookingType, selectedServiceId, services, tempHoldId, refreshTrigger]);

  const setDateField = useCallback((date: string) => {
    setHasExistingClinicalExam(false); // Reset cờ khi set date mới
    dispatch({ type: 'SET_DATE', date });
  }, []);

  const setTimeField = useCallback((time: string) => {
    dispatch({ type: 'SET_TIME', time });
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
    bookedSlots,
    specialists,
    slotAvailability,
    hasExistingClinicalExam,
    setDateField,
    setTimeField,
    setFormField,
    setSubmitting,
    setSuccess,
    tempHoldId,
    refreshSlots
  };
}
