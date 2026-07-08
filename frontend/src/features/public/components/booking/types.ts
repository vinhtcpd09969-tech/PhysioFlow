export interface BookingFormData {
  ho_ten_khach: string;
  so_dien_thoai: string;
  gioi_tinh_khach: string;
  trieu_chung: string;
  ly_do_kham: string;
  anh_dinh_kem_url: string;
}

export interface BookingState {
  selectedDate: string;
  selectedTime: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  formData: BookingFormData;
}

export type BookingAction =
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_TIME'; time: string }
  | { type: 'SET_FORM_FIELD'; field: string; value: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_SUCCESS'; isSuccess: boolean };
