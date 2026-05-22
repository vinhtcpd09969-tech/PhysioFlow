import React, { useReducer, useEffect, useState } from 'react';
import api from '../../../api/axios';
import { useNavigate } from 'react-router-dom';

interface BookingState {
  formData: {
    sdt: string;
    ho_ten: string;
    gioi_tinh: string;
    ngay_sinh: string;
    dich_vu_id: string;
    ky_thuat_vien_id: string;
    gio_bat_dau: string;
  };
  services: any[];
  staff: any[];
  loading: boolean;
}

type BookingAction =
  | { type: 'SET_FORM_FIELD', field: string, value: string }
  | { type: 'SET_DATA', services: any[], staff: any[] }
  | { type: 'SET_LOADING', loading: boolean }
  | { type: 'INIT_DATE', date: string };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_FORM_FIELD':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } };
    case 'SET_DATA':
      return { ...state, services: action.services, staff: action.staff };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'INIT_DATE':
      return { ...state, formData: { ...state.formData, gio_bat_dau: action.date } };
    default:
      return state;
  }
}

export default function WalkInBooking() {
  const [state, dispatch] = useReducer(bookingReducer, {
    formData: {
      sdt: '',
      ho_ten: '',
      gioi_tinh: 'khac',
      ngay_sinh: '',
      dich_vu_id: '',
      ky_thuat_vien_id: '',
      gio_bat_dau: ''
    },
    services: [],
    staff: [],
    loading: false
  });

  const [isClient, setIsClient] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsClient(true);
    dispatch({ type: 'INIT_DATE', date: new Date().toISOString().slice(0, 16) });

    const fetchSelectData = async () => {
      try {
        const [servRes, staffRes] = await Promise.all([
          api.get('/admin/services'),
          api.get('/admin/staff')
        ]);

        const services = Array.isArray(servRes.data) ? servRes.data : [];
        const staff = Array.isArray(staffRes.data) ? staffRes.data.filter((s: any) => s.vai_tro === 'Chuyên gia y tế' || s.vai_tro === 'Bác sĩ' || s.vai_tro === 'Kỹ thuật viên') : [];

        dispatch({ type: 'SET_DATA', services, staff });
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };
    fetchSelectData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    dispatch({ type: 'SET_FORM_FIELD', field: e.target.name, value: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      await api.post('/receptionist/walk-in', state.formData);
      alert('Tạo lịch thành công!');
      navigate('/receptionist');
    } catch (error) {
      alert('Lỗi tạo lịch vãng lai');
      console.error(error);
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  if (!isClient) return null;

  const { formData, services, staff, loading } = state;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-secondary">Đăng ký khách vãng lai (Walk-in)</h2>
          <p className="text-zinc-500 mt-1">Tạo thông tin khách hàng và xếp lịch dịch vụ ngay lập tức.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 space-y-8">
        {/* Thông tin khách hàng */}
        <div>
          <h3 className="text-lg font-semibold text-secondary mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
            <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
            Thông tin Khách hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sdt" className="block text-sm font-medium text-zinc-700 mb-2">Số điện thoại *</label>
              <input
                id="sdt"
                required
                type="text"
                name="sdt"
                value={formData.sdt}
                onChange={handleChange}
                placeholder="Nhập SĐT..."
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="ho_ten" className="block text-sm font-medium text-zinc-700 mb-2">Họ và tên *</label>
              <input
                id="ho_ten"
                required
                type="text"
                name="ho_ten"
                value={formData.ho_ten}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="gioi_tinh" className="block text-sm font-medium text-zinc-700 mb-2">Giới tính</label>
              <select
                id="gioi_tinh"
                name="gioi_tinh"
                value={formData.gioi_tinh}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all"
              >
                <option value="khac">Khác</option>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
            </div>
            <div>
              <label htmlFor="ngay_sinh" className="block text-sm font-medium text-zinc-700 mb-2">Năm sinh</label>
              <input
                id="ngay_sinh"
                type="date"
                name="ngay_sinh"
                value={formData.ngay_sinh}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Thông tin dịch vụ */}
        <div>
          <h3 className="text-lg font-semibold text-secondary mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
            <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
            Dịch vụ & Lịch hẹn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dich_vu_id" className="block text-sm font-medium text-zinc-700 mb-2">Dịch vụ *</label>
              <select
                id="dich_vu_id"
                required
                name="dich_vu_id"
                value={formData.dich_vu_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all"
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.ten_dich_vu} ({s.don_gia}đ)</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ky_thuat_vien_id" className="block text-sm font-medium text-zinc-700 mb-2">Chuyên gia y tế</label>
              <select
                id="ky_thuat_vien_id"
                name="ky_thuat_vien_id"
                value={formData.ky_thuat_vien_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all"
              >
                <option value="">-- Bỏ trống nếu chưa xếp --</option>
                {staff.map(st => (
                  <option key={st.id} value={st.id}>{st.ho_ten}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="gio_bat_dau" className="block text-sm font-medium text-zinc-700 mb-2">Giờ bắt đầu làm *</label>
              <input
                id="gio_bat_dau"
                required
                type="datetime-local"
                name="gio_bat_dau"
                value={formData.gio_bat_dau}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/receptionist')}
            className="px-6 py-2.5 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 text-white bg-primary hover:opacity-90 rounded-xl font-medium transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Tạo Lịch & Check-in ngay'}
          </button>
        </div>
      </form>
    </div>
  );
}
