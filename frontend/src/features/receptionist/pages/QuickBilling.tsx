import { useReducer } from 'react';
import axiosInstance from '../../../api/axios';
import { useNavigate } from 'react-router-dom';

interface BillingState {
  lichDatId: string;
  soTienNhan: string;
  phuongThuc: string;
  hoaDon: any | null;
  loading: boolean;
}

type BillingAction = 
  | { type: 'SET_FIELD', field: keyof BillingState, value: any }
  | { type: 'SET_HOA_DON', hoaDon: any }
  | { type: 'RESET_HOA_DON' }
  | { type: 'SET_LOADING', loading: boolean };

function billingReducer(state: BillingState, action: BillingAction): BillingState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_HOA_DON':
      return { ...state, hoaDon: action.hoaDon, loading: false };
    case 'RESET_HOA_DON':
      return { ...state, hoaDon: null, soTienNhan: '' };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function QuickBilling() {
  const [state, dispatch] = useReducer(billingReducer, {
    lichDatId: '',
    soTienNhan: '',
    phuongThuc: 'tien_mat',
    hoaDon: null,
    loading: false
  });

  const navigate = useNavigate();

  const handleTạoHoaDon = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await axiosInstance.post('/receptionist/billing', { lich_dat_id: state.lichDatId });
      dispatch({ type: 'SET_HOA_DON', hoaDon: res.data.hoa_don });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi tạo hóa đơn');
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const handleThanhToan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.hoaDon) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: state.hoaDon.id,
        so_tien_nhan: state.soTienNhan,
        phuong_thuc: state.phuongThuc
      });
      alert('Thanh toán thành công!');
      navigate('/receptionist');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi thanh toán');
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const formatCurrency = (amount: number) => {
    return currencyFormatter.format(amount);
  };

  const { lichDatId, soTienNhan, phuongThuc, hoaDon, loading } = state;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Thanh toán Nhanh (Quick Billing)</h2>
          <p className="text-slate-500 mt-1">Tạo hóa đơn và nhận thanh toán cho khách hàng.</p>
        </div>
      </div>

      {!hoaDon ? (
        <form onSubmit={handleTạoHoaDon} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div>
            <label htmlFor="lichDatId" className="block text-sm font-medium text-slate-700 mb-2">Mã Lịch Đặt *</label>
            <input 
              id="lichDatId"
              required
              type="text" 
              value={lichDatId}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'lichDatId', value: e.target.value })}
              placeholder="VD: LD123456"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium"
          >
            {loading ? 'Đang xử lý...' : 'Tra cứu & Tạo Hóa Đơn'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleThanhToan} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-teal-800 mb-2">Thông tin Hóa Đơn</h3>
            <p className="text-sm text-teal-700">Mã: {hoaDon.ma_hoa_don}</p>
            <p className="text-sm text-teal-700">Tổng tiền: <strong className="text-lg">{formatCurrency(hoaDon.tong_tien_thanh_toan)}</strong></p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="phuongThuc" className="block text-sm font-medium text-slate-700 mb-2">Phương thức thanh toán</label>
              <select 
                id="phuongThuc"
                value={phuongThuc}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="tien_mat">Tiền mặt</option>
                <option value="chuyen_khoan">Chuyển khoản</option>
                <option value="the">Thẻ</option>
              </select>
            </div>
            <div>
              <label htmlFor="soTienNhan" className="block text-sm font-medium text-slate-700 mb-2">Số tiền nhận (VNĐ) *</label>
              <input 
                id="soTienNhan"
                required
                type="number" 
                value={soTienNhan}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: e.target.value })}
                min={hoaDon.tong_tien_thanh_toan}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => dispatch({ type: 'RESET_HOA_DON' })}
              className="flex-1 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận Thanh Toán'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
