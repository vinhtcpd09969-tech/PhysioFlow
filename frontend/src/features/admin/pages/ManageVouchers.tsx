import { useEffect, useState } from 'react';
import api from '../../../api/axios';

interface Voucher {
  id: string;
  ma_voucher: string;
  ten_chien_dich: string;
  loai_giam: 'phan_tram' | 'so_tien_co_dinh';
  gia_tri_giam: number;
  giam_toi_da: number;
  don_hang_toi_thieu: number;
  ap_dung_cho: string;
  so_luong_toi_da: number;
  so_luong_da_dung: number;
  ngay_bat_dau: string;
  ngay_het_han: string;
  trang_thai: string;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function ManageVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Partial<Voucher> | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await api.get('/admin/vouchers');
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách voucher:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const payload = {
      ...data,
      gia_tri_giam: Number(data.gia_tri_giam),
      giam_toi_da: data.giam_toi_da ? Number(data.giam_toi_da) : null,
      don_hang_toi_thieu: Number(data.don_hang_toi_thieu),
      so_luong_toi_da: data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null,
    };

    try {
      if (editingVoucher?.id) {
        await api.put(`/admin/vouchers/${editingVoucher.id}`, payload);
      } else {
        await api.post('/admin/vouchers', payload);
      }
      setIsModalOpen(false);
      setEditingVoucher(null);
      fetchVouchers();
    } catch (error) {
      alert('Lỗi khi lưu voucher');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) return;
    try {
      await api.delete(`/admin/vouchers/${id}`);
      fetchVouchers();
    } catch (error) {
      alert('Lỗi khi xóa voucher');
    }
  };

  const formatCurrency = (amount: number) => {
    return currencyFormatter.format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Voucher</h1>
          <p className="text-slate-500">Tạo và quản lý các chương trình khuyến mãi.</p>
        </div>
        <button 
          onClick={() => { setEditingVoucher({}); setIsModalOpen(true); }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span> Tạo Voucher mới
        </button>
      </div>

      {/* Voucher List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => { setEditingVoucher(v); setIsModalOpen(true); }}
                className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDelete(v.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
              >
                🗑️
              </button>
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-lg font-mono font-bold text-lg border border-teal-100">
                {v.ma_voucher}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                v.trang_thai === 'hoat_dong' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {v.trang_thai}
              </span>
            </div>

            <h3 className="font-bold text-slate-800 mb-1">{v.ten_chien_dich || 'Chiến dịch không tên'}</h3>
            <p className="text-sm text-slate-500 mb-4">
              Giảm {v.loai_giam === 'phan_tram' ? `${v.gia_tri_giam}%` : formatCurrency(v.gia_tri_giam)}
              {v.giam_toi_da && ` (Tối đa ${formatCurrency(v.giam_toi_da)})`}
            </p>

            <div className="space-y-2 border-t border-slate-100 pt-4 mt-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Số lượng:</span>
                <span className="font-medium text-slate-700">
                  {v.so_luong_da_dung} / {v.so_luong_toi_da || '∞'}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full"
                  style={{ width: `${v.so_luong_toi_da ? (v.so_luong_da_dung / v.so_luong_toi_da) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-2">
                <span>Bắt đầu: {new Date(v.ngay_bat_dau).toLocaleDateString('vi-VN')}</span>
                <span>Hết hạn: {v.ngay_het_han ? new Date(v.ngay_het_han).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{editingVoucher?.id ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label htmlFor="ma_voucher" className="block text-sm font-medium text-slate-700 mb-1">Mã Voucher</label>
                <input 
                  id="ma_voucher"
                  name="ma_voucher"
                  defaultValue={editingVoucher?.ma_voucher}
                  required
                  placeholder="VD: GIAM20K"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label htmlFor="ten_chien_dich" className="block text-sm font-medium text-slate-700 mb-1">Tên chiến dịch</label>
                <input 
                  id="ten_chien_dich"
                  name="ten_chien_dich"
                  defaultValue={editingVoucher?.ten_chien_dich}
                  placeholder="VD: Khuyến mãi Hè"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="loai_giam" className="block text-sm font-medium text-slate-700 mb-1">Loại giảm</label>
                <select 
                  id="loai_giam"
                  name="loai_giam"
                  defaultValue={editingVoucher?.loai_giam || 'phan_tram'}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="phan_tram">Phần trăm (%)</option>
                  <option value="so_tien_co_dinh">Số tiền cố định (VNĐ)</option>
                </select>
              </div>
              <div>
                <label htmlFor="gia_tri_giam" className="block text-sm font-medium text-slate-700 mb-1">Giá trị giảm</label>
                <input 
                  id="gia_tri_giam"
                  name="gia_tri_giam"
                  type="number"
                  defaultValue={editingVoucher?.gia_tri_giam}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="giam_toi_da" className="block text-sm font-medium text-slate-700 mb-1">Giảm tối đa (VNĐ)</label>
                <input 
                  id="giam_toi_da"
                  name="giam_toi_da"
                  type="number"
                  defaultValue={editingVoucher?.giam_toi_da}
                  placeholder="Để trống nếu không giới hạn"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="don_hang_toi_thieu" className="block text-sm font-medium text-slate-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                <input 
                  id="don_hang_toi_thieu"
                  name="don_hang_toi_thieu"
                  type="number"
                  defaultValue={editingVoucher?.don_hang_toi_thieu || 0}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="so_luong_toi_da" className="block text-sm font-medium text-slate-700 mb-1">Số lượng tối đa</label>
                <input 
                  id="so_luong_toi_da"
                  name="so_luong_toi_da"
                  type="number"
                  defaultValue={editingVoucher?.so_luong_toi_da}
                  placeholder="Để trống nếu không giới hạn"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="trang_thai" className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                <select 
                  id="trang_thai"
                  name="trang_thai"
                  defaultValue={editingVoucher?.trang_thai || 'hoat_dong'}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="hoat_dong">Hoạt động</option>
                  <option value="tam_dung">Tạm dừng</option>
                  <option value="sap_ra_mat">Sắp ra mắt</option>
                  <option value="het_han">Hết hạn</option>
                </select>
              </div>
              <div>
                <label htmlFor="ngay_bat_dau" className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                <input 
                  id="ngay_bat_dau"
                  name="ngay_bat_dau"
                  type="date"
                  defaultValue={editingVoucher?.ngay_bat_dau?.split('T')[0]}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="ngay_het_han" className="block text-sm font-medium text-slate-700 mb-1">Ngày hết hạn</label>
                <input 
                  id="ngay_het_han"
                  name="ngay_het_han"
                  type="date"
                  defaultValue={editingVoucher?.ngay_het_han?.split('T')[0]}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div className="col-span-2 pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all"
                >
                  {editingVoucher?.id ? 'Lưu thay đổi' : 'Tạo Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
