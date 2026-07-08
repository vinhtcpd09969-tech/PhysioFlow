import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';

interface Invoice {
  id: string;
  ma_hoa_don: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  tong_tien_goc: number;
  hinh_thuc_thanh_toan_goi?: string;
  ti_le_giam_gia_goi?: number;
  so_tien_giam_voucher?: number;
  tong_tien_thanh_toan: number;
  da_thanh_toan: number;
  trang_thai: string;
  ngay_tao: string;
  ten_dich_vu?: string;
  ghi_chu?: string;
}

interface Payment {
  id: string;
  ma_giao_dich: string;
  hoa_don_id: string;
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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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
      toast.error('Không thể kết nối API tải dữ liệu tài chính.');
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn tiền cho giao dịch này?')) return;
    try {
      await api.post(`/admin/payments/${paymentId}/refund`, { ly_do_hoan_tien: 'Admin refund' });
      toast.success('Hoàn tiền thành công!');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi hoàn tiền.');
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
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Thao tác</th>
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
                            {(inv.trang_thai || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {isClient ? new Date(inv.ngay_tao).toLocaleDateString('vi-VN') : ''}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            Chi tiết
                          </button>
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
                        <td className="px-6 py-4 text-zinc-600 text-sm capitalize">{(pay.phuong_thuc || '').replace(/_/g, ' ')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${getStatusBadge(pay.trang_thai)}`}>
                            {(pay.trang_thai || '').replace(/_/g, ' ')}
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

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          payments={payments}
          onClose={() => setSelectedInvoice(null)}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
        />
      )}
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

function InvoiceDetailModal({ 
  invoice, 
  payments, 
  onClose, 
  formatCurrency, 
  getStatusBadge 
}: { 
  invoice: Invoice; 
  payments: Payment[]; 
  onClose: () => void; 
  formatCurrency: (amount: number) => string; 
  getStatusBadge: (status: string) => string; 
}) {
  const invoicePayments = payments.filter(p => p.hoa_don_id === invoice.id || p.ma_hoa_don === invoice.ma_hoa_don);

  return (
    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl border border-zinc-150 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <span className="font-bold text-xs">HĐ</span>
            </span>
            <div>
              <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
                Chi tiết Hóa đơn {invoice.ma_hoa_don}
              </h2>
              <p className="text-[10px] text-zinc-500 font-medium">Tạo ngày {new Date(invoice.ngay_tao).toLocaleString('vi-VN')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
            <span className="font-bold text-lg leading-none">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status and Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Trạng thái</span>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight ${getStatusBadge(invoice.trang_thai)}`}>
                  {invoice.trang_thai.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tổng phải trả</span>
              <p className="text-lg font-extrabold text-secondary">{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Đã thanh toán</span>
              <p className="text-lg font-extrabold text-emerald-600">{formatCurrency(Number(invoice.da_thanh_toan))}</p>
            </div>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100">
                Thông tin khách hàng
              </h3>
              <div className="space-y-2 text-sm text-zinc-650">
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-400">Họ tên:</span>
                  <span className="font-bold text-secondary">{invoice.ten_khach_hang}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-400">Số điện thoại:</span>
                  <span className="font-semibold text-secondary">{invoice.so_dien_thoai || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Service & Payment Detail */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100">
                Gói dịch vụ & Thanh toán
              </h3>
              <div className="space-y-2 text-sm text-zinc-650">
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-400">Tên dịch vụ:</span>
                  <span className="font-bold text-secondary text-right max-w-[180px] truncate" title={invoice.ten_dich_vu}>
                    {invoice.ten_dich_vu || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-400">Hình thức đóng:</span>
                  <span className="font-bold text-indigo-600 capitalize">
                    {invoice.hinh_thuc_thanh_toan_goi ? invoice.hinh_thuc_thanh_toan_goi.replace(/_/g, ' ') : 'Mặc định'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chi tiết tài chính</h3>
            <div className="space-y-1.5 text-sm text-zinc-650">
              <div className="flex justify-between">
                <span>Nguyên giá gốc:</span>
                <span className="font-semibold text-secondary">{formatCurrency(Number(invoice.tong_tien_goc))}</span>
              </div>
              {Number(invoice.ti_le_giam_gia_goi) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Ưu đãi phương thức ({invoice.ti_le_giam_gia_goi}%):</span>
                  <span>-{formatCurrency(Math.round(Number(invoice.tong_tien_goc) * Number(invoice.ti_le_giam_gia_goi) / 100))}</span>
                </div>
              )}
              {Number(invoice.so_tien_giam_voucher) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Ưu đãi Voucher:</span>
                  <span>-{formatCurrency(Number(invoice.so_tien_giam_voucher))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200/60 pt-1.5 font-bold text-secondary">
                <span>Tổng phải thu:</span>
                <span>{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Còn lại phải thu:</span>
                <span className="font-bold text-amber-600">
                  {formatCurrency(Math.max(0, Number(invoice.tong_tien_thanh_toan) - Number(invoice.da_thanh_toan)))}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.ghi_chu && (
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-105 text-amber-850 text-xs leading-relaxed font-semibold">
              📝 Ghi chú: {invoice.ghi_chu}
            </div>
          )}

          {/* Transactions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100">
              Lịch sử giao dịch thanh toán
            </h3>
            {invoicePayments.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Chưa có giao dịch thanh toán nào được thực hiện.</p>
            ) : (
              <div className="border border-zinc-100 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-bold">
                    <tr>
                      <th className="px-4 py-2">Mã GD</th>
                      <th className="px-4 py-2">Số tiền</th>
                      <th className="px-4 py-2">Phương thức</th>
                      <th className="px-4 py-2">Thời gian</th>
                      <th className="px-4 py-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {invoicePayments.map(p => (
                      <tr key={p.id} className="text-zinc-650">
                        <td className="px-4 py-2 font-mono text-zinc-400">{p.ma_giao_dich}</td>
                        <td className="px-4 py-2 font-extrabold text-secondary">{formatCurrency(p.so_tien)}</td>
                        <td className="px-4 py-2 capitalize">{(p.phuong_thuc || '').replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2">{new Date(p.thoi_gian_giao_dich).toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${getStatusBadge(p.trang_thai)}`}>
                            {(p.trang_thai || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold rounded-xl transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
