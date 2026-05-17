import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPackages, getServices } from '../../../api/admin.api';

// Nhúng các Component con vừa được bóc tách
import PackageCard from '../components/PackageCard';
import PackageModal from '../components/PackageModal';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const filteredPackages = packages.filter((pkg: any) => 
    pkg.ten_goi.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (pkg.ma_goi && pkg.ma_goi.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, svcsRes] = await Promise.all([
        getPackages(),
        getServices()
      ]);
      setPackages(pkgsRes.data);
      setServices(svcsRes.data.filter((s: any) => s.trang_thai === 'hoat_dong'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Gói điều trị</h2>
          <p className="text-slate-500 mt-1">Cấu hình và theo dõi hiệu quả các gói liệu trình phục hồi</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm flex items-center gap-2"
        >
          <span>+</span> Tạo gói mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-default group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full">+12.5%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Doanh thu gói (Tháng này)</p>
            <h3 className="text-2xl font-bold text-slate-800">452.800.000đ</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">142 đơn</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Gói đã bán</p>
            <h3 className="text-2xl font-bold text-slate-800">86 Gói active</h3>
          </div>
        </div>

        <div className="bg-teal-700 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-teal-500/20 border border-teal-600 flex flex-col justify-between text-white relative overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-default group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-teal-100 uppercase tracking-wider mb-1">Gói phổ biến nhất</p>
            <h3 className="text-xl font-bold mb-1">Phục hồi Cột sống</h3>
            <p className="text-teal-200 text-sm">Chiếm 45% tổng doanh số</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-default group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Gói sắp hết hạn</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">12 Gói</h3>
            <p className="text-slate-500 text-sm">Cần nhắc lịch tái khám</p>
          </div>
        </div>
      </div>

      {/* Featured Packages (Cards) */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-bold text-slate-800">Gói điều trị tiêu biểu</h3>
          <button className="text-teal-600 font-medium hover:text-teal-700 active:scale-95 text-sm transition-all">Xem tất cả</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-slate-100 animate-pulse h-72 rounded-2xl"></div>
            ))
          ) : filteredPackages.slice(0, 3).map((pkg) => (
            // Dùng Component đã tách
            <PackageCard key={pkg.id} pkg={pkg} currencyFormatter={currencyFormatter} />
          ))}
        </div>
      </div>

      {/* Table view for all packages */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Danh sách tất cả gói</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Tìm gói..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500 w-64 bg-white" />
            </div>
            <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              Lọc trạng thái
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider bg-white">
                <th className="p-4 font-bold w-[15%]">Mã Gói</th>
                <th className="p-4 font-bold w-[25%]">Tên Gói & Số buổi</th>
                <th className="p-4 font-bold w-[15%]">Thời hạn</th>
                <th className="p-4 font-bold text-right w-[15%]">Giá bán</th>
                <th className="p-4 font-bold text-center w-[10%]">Web</th>
                <th className="p-4 font-bold text-center w-[10%]">Trạng thái</th>
                <th className="p-4 font-bold text-center w-[10%]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-4xl mb-3">🔍</span>
                      <p className="text-slate-500 font-medium">Không tìm thấy gói dịch vụ nào phù hợp với tìm kiếm.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-teal-50/50 transition-colors group cursor-pointer active:bg-teal-100/50">
                    <td className="p-4 text-sm font-bold text-slate-500">{pkg.ma_goi}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{pkg.ten_goi}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pkg.tong_so_buoi} buổi • {pkg.chi_tiet_dich_vu ? pkg.chi_tiet_dich_vu.length : 0} dịch vụ con</p>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">{pkg.han_dung_thang} tháng</td>
                    <td className="p-4 text-right font-bold text-teal-600">
                      {currencyFormatter.format(pkg.gia_tien)}đ
                    </td>
                    <td className="p-4 text-center">
                      <div className={`mx-auto w-10 h-6 rounded-full flex items-center px-1 ${pkg.hien_thi_website ? 'bg-teal-500 justify-end' : 'bg-slate-200 justify-start'}`}>
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        pkg.trang_thai === 'hoat_dong' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pkg.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="p-4 text-center flex justify-center mt-1">
                      <button className="text-slate-400 hover:text-teal-600 mx-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button className="text-slate-400 hover:text-rose-600 mx-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Component Modal đã được bóc tách ra ngoài */}
      {isModalOpen && (
        <PackageModal 
          services={services} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData(); // Reload data sau khi thêm mới
          }}
        />
      )}
    </div>
  );
}
