import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../../api/axios';

interface Invoice {
  id: string;
  ma_hoa_don: string;
  ten_khach_hang: string;
  tong_tien_thanh_toan: number;
  da_thanh_toan: number;
  trang_thai: string;
  ngay_tao: string;
}

interface Payment {
  id: string;
  ma_giao_dich: string;
  ma_hoa_don: string;
  ten_khach_hang: string;
  so_tien: number;
  phuong_thuc: string;
  trang_thai: string;
  thoi_gian_giao_dich: string;
}

// Hoist Intl formatter
const currencyFormatter = new Intl.NumberFormat('vi-VN', { 
  style: 'currency', 
  currency: 'VND' 
});

export default function ManageFinance() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, payRes] = await Promise.all([
        api.get('/admin/invoices'),
        api.get('/admin/payments')
      ]);
      setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      setPayments(Array.isArray(payRes.data) ? payRes.data : []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tài chính:', error);
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn tiền cho giao dịch này?')) return;
    try {
      await api.post(`/admin/payments/${paymentId}/refund`, { ly_do_hoan_tien: 'Admin refund' });
      alert('Hoàn tiền thành công');
      fetchData();
    } catch (error) {
      alert('Lỗi khi hoàn tiền');
    }
  };

  const formatCurrency = (amount: number) => {
    if (!isClient) return '0 ₫';
    return currencyFormatter.format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      da_thanh_toan: 'bg-emerald-100 text-emerald-700',
      thanh_cong: 'bg-emerald-100 text-emerald-700',
      chua_thanh_toan: 'bg-amber-100 text-amber-700',
      da_hoan_tien: 'bg-rose-100 text-rose-700',
      cho_xu_ly: 'bg-zinc-100 text-zinc-700',
    };
    return badges[status] || 'bg-zinc-100 text-zinc-700';
  };

  const filteredInvoices = invoices.filter(inv =>
    (inv.ma_hoa_don?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (inv.ten_khach_hang?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(pay =>
    (pay.ma_giao_dich?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (pay.ten_khach_hang?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (pay.ma_hoa_don?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-secondary tracking-tight">Quản lý Tài chính</h1>
          <p className="text-zinc-500 mt-1">Theo dõi dòng tiền, hóa đơn và giao dịch hoàn tiền.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="size-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm mã HĐ, mã GD, hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4 space-y-6">
          {/* Tabs Sidebar style */}
          <div className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'invoices' ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              Hóa đơn
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'payments' ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              Giao dịch thanh toán
            </button>
          </div>

          <div className="space-y-4">
            <StatCard 
              title="Tổng doanh thu" 
              value={formatCurrency(invoices.reduce((acc, inv) => acc + Number(inv.da_thanh_toan || 0), 0))} 
              variant="success"
            />
            <StatCard 
              title="Đang chờ thanh toán" 
              value={formatCurrency(invoices.reduce((acc, inv) => acc + (inv.trang_thai === 'chua_thanh_toan' ? Number(inv.tong_tien_thanh_toan || 0) : 0), 0))} 
              variant="warning"
            />
            <StatCard 
              title="Đã hoàn tiền" 
              value={formatCurrency(payments.filter(p => p.trang_thai === 'da_hoan_tien').reduce((acc, p) => acc + Number(p.so_tien || 0), 0))} 
              variant="error"
            />
          </div>
        </div>

        <div className="lg:w-3/4">
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              {activeTab === 'invoices' ? (
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Mã hóa đơn</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Khách hàng</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tổng tiền</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-secondary">{inv.ma_hoa_don}</td>
                        <td className="px-6 py-4 text-zinc-600 text-sm">{inv.ten_khach_hang}</td>
                        <td className="px-6 py-4 font-bold text-secondary">{formatCurrency(inv.tong_tien_thanh_toan)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${getStatusBadge(inv.trang_thai)}`}>
                            {inv.trang_thai.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {isClient ? new Date(inv.ngay_tao).toLocaleDateString('vi-VN') : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Mã GD</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Hóa đơn</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Số tiền</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Phương thức</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-zinc-400">{pay.ma_giao_dich}</td>
                        <td className="px-6 py-4 text-zinc-600 text-sm">{pay.ma_hoa_don}</td>
                        <td className="px-6 py-4 font-bold text-secondary">{formatCurrency(pay.so_tien)}</td>
                        <td className="px-6 py-4 text-zinc-600 text-sm capitalize">{pay.phuong_thuc.replace(/_/g, ' ')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${getStatusBadge(pay.trang_thai)}`}>
                            {pay.trang_thai.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {pay.trang_thai === 'thanh_cong' && (
                            <button
                              onClick={() => handleRefund(pay.id)}
                              className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline"
                            >
                              Hoàn tiền
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, variant }: { title: string, value: string, variant: 'success' | 'warning' | 'error' }) {
  const styles = {
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-100 bg-amber-50 text-amber-700',
    error: 'border-rose-100 bg-rose-50 text-rose-700'
  };
  
  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${styles[variant]}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  );
}
