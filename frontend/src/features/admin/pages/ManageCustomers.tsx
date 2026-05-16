import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCustomers } from '../../../api/admin.api';
import { format } from 'date-fns';

export default function ManageCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomers();
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    (c.ho_ten?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.so_dien_thoai || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-secondary">Quản lý Khách hàng</h2>
          <p className="text-zinc-500 mt-1">Danh sách toàn bộ khách hàng và lịch sử tài khoản.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="size-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-sm">
                <th className="p-4 font-semibold">Mã KH</th>
                <th className="p-4 font-semibold">Họ Tên</th>
                <th className="p-4 font-semibold">Số điện thoại</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold text-center">Giới tính</th>
                <th className="p-4 font-semibold text-center">Ngày tạo</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">Không tìm thấy khách hàng nào.</td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.khach_hang_id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 font-medium text-secondary">{cust.ma_khach_hang || '-'}</td>
                    <td className="p-4 font-medium text-secondary">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {cust.ho_ten ? cust.ho_ten.charAt(0) : '?'}
                        </div>
                        {cust.ho_ten}
                      </div>
                    </td>
                    <td className="p-4 text-zinc-600 font-mono text-sm">{cust.so_dien_thoai || '-'}</td>
                    <td className="p-4 text-zinc-600 text-sm">{cust.email || '-'}</td>
                    <td className="p-4 text-center text-zinc-600 text-sm capitalize">
                      {cust.gioi_tinh === 'nam' ? 'Nam' : cust.gioi_tinh === 'nu' ? 'Nữ' : 'Khác'}
                    </td>
                    <td className="p-4 text-center text-zinc-600 text-sm">
                      {isClient && cust.created_at ? format(new Date(cust.created_at), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <Link 
                        to={`/admin/medical-records?customer=${cust.khach_hang_id}`} 
                        className="text-primary hover:underline text-sm font-semibold mr-3"
                      >
                        Chi tiết
                      </Link>
                      <button className="text-accent hover:underline text-sm font-semibold">Reset Pass</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
