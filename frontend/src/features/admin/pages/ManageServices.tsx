import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getServices, createService, getCategories } from '../../../api/admin.api';
import { useSearchParams } from 'react-router-dom';

const serviceSchema = z.object({
  danh_muc_id: z.number().min(1, 'Vui lòng chọn danh mục'),
  ten_dich_vu: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  mo_ta: z.string().optional(),
  thoi_gian_uoc_tinh: z.number().min(1, 'Thời gian phải lớn hơn 0'),
  don_gia: z.number().min(0, 'Đơn giá phải từ 0đ'),
  thiet_bi_yeu_cau: z.string().optional(),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

type ServiceFormValues = z.infer<typeof serviceSchema>;
const currencyFormatter = new Intl.NumberFormat('vi-VN');

// Helper to generate a consistent image for a service
const getServiceImage = (id: string | number) => {
  const isEven = String(id).charCodeAt(0) % 2 === 0;
  return `https://images.unsplash.com/photo-${isEven ? '1576091160550-21080f0c7324' : '1544367567-0f2fcb009e0b'}?q=80&w=200&auto=format&fit=crop`;
};

export default function ManageServices() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const { register, handleSubmit, reset, watch, setValue } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { trang_thai: 'hoat_dong', thoi_gian_uoc_tinh: 45, don_gia: 0 }
  });

  const watchStatus = watch('trang_thai');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [svcRes, catRes] = await Promise.all([getServices(), getCategories()]);
      setServices(svcRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      await createService(data);
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      alert('Có lỗi xảy ra khi tạo dịch vụ');
    }
  };

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    return services.filter(svc => 
      svc.ten_dich_vu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.ten_danh_muc?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in duration-500 pb-12">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý Dịch vụ</h2>
          <p className="text-slate-500 mt-1.5 text-sm">Hệ thống danh mục dịch vụ phục hồi chức năng và vật lý trị liệu</p>
        </div>
        <button 
          onClick={() => { reset(); setIsModalOpen(true); }}
          className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          <span className="text-lg leading-none">+</span> Thêm dịch vụ mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng dịch vụ</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{services.length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Được đặt nhiều nhất</p>
            <h3 className="text-lg font-extrabold text-slate-800 truncate w-40">Vật lý trị liệu Cột...</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đánh giá trung bình</p>
            <h3 className="text-3xl font-extrabold text-slate-800 flex items-baseline gap-2">4.9 <span className="text-sm font-medium text-emerald-500 tracking-widest">★★★★★</span></h3>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">Danh sách dịch vụ</h3>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </button>
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="p-5 border-b border-slate-100">Dịch vụ</th>
                <th className="p-5 border-b border-slate-100">Danh mục</th>
                <th className="p-5 border-b border-slate-100">Giá (VNĐ)</th>
                <th className="p-5 border-b border-slate-100 text-center">Thời lượng</th>
                <th className="p-5 border-b border-slate-100 text-center">Trạng thái</th>
                <th className="p-5 border-b border-slate-100 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">Chưa có dữ liệu hoặc không tìm thấy.</td>
                </tr>
              ) : (
                filteredServices.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <img src={getServiceImage(svc.id)} alt={svc.ten_dich_vu} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-200" />
                        <span className="font-bold text-slate-800">{svc.ten_dich_vu}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold w-max">
                        {svc.ten_danh_muc || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-slate-800">
                      {currencyFormatter.format(svc.don_gia)}
                    </td>
                    <td className="p-5 text-center font-medium text-slate-600 text-sm">
                      {svc.thoi_gian_uoc_tinh} phút
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-2">
                        {/* Custom Toggle UI representation */}
                        <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${svc.trang_thai === 'hoat_dong' ? 'bg-teal-600' : 'bg-slate-200'}`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${svc.trang_thai === 'hoat_dong' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${svc.trang_thai === 'hoat_dong' ? 'text-teal-600' : 'text-slate-400'}`}>
                          {svc.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Tạm ngưng'}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 active:scale-90 transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm text-slate-500 font-medium">Hiển thị <span className="font-bold text-slate-800">1 - {Math.min(4, filteredServices.length)}</span> trong tổng số <span className="font-bold text-slate-800">{filteredServices.length}</span> dịch vụ</p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all text-sm font-bold">‹</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-600 text-white shadow-sm active:scale-95 transition-all text-sm font-bold">1</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all text-sm font-bold">2</button>
            <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all text-sm font-bold">›</button>
          </div>
        </div>
      </div>

      {/* Modern Modal Design based on Mockup Image 1 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
            <div className="px-8 py-6 flex justify-between items-center border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-extrabold text-teal-900">Chỉnh sửa dịch vụ</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all">✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 space-y-6 overflow-y-auto">
              {/* Image Upload Area */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Hình ảnh dịch vụ</label>
                <div className="flex items-center gap-4">
                  <img src="https://images.unsplash.com/photo-1576091160550-21080f0c7324?q=80&w=200&auto=format&fit=crop" alt="preview" className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-200" />
                  <button type="button" className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-teal-500 hover:text-teal-600 transition-colors cursor-pointer group active:scale-95">
                    <svg className="w-5 h-5 mb-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span className="text-[10px] font-bold">Đổi ảnh</span>
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Tên dịch vụ</label>
                <input 
                  {...register('ten_dich_vu')} 
                  placeholder="Vật lý trị liệu cột sống..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Danh mục</label>
                  <select 
                    {...register('danh_muc_id', { valueAsNumber: true })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium text-slate-800"
                  >
                    <option value="">Chọn danh mục...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.ten_danh_muc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Giá (VNĐ)</label>
                  <input 
                    type="number"
                    {...register('don_gia', { valueAsNumber: true })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Thời lượng</label>
                  <select 
                    {...register('thoi_gian_uoc_tinh', { valueAsNumber: true })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium text-slate-800"
                  >
                    <option value={30}>30 phút</option>
                    <option value={45}>45 phút</option>
                    <option value={60}>60 phút</option>
                    <option value={90}>90 phút</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Trạng thái</label>
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer" onClick={() => setValue('trang_thai', watchStatus === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong')}>
                    <span className="font-medium text-sm text-slate-800">{watchStatus === 'hoat_dong' ? 'Đang hoạt động' : 'Tạm ngưng'}</span>
                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors shadow-inner ${watchStatus === 'hoat_dong' ? 'bg-teal-600' : 'bg-slate-300'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${watchStatus === 'hoat_dong' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Mô tả dịch vụ</label>
                <textarea 
                  {...register('mo_ta')} 
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400 resize-none"
                  placeholder="Liệu trình chuyên sâu giúp giải tỏa áp lực..."
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Thiết bị hỗ trợ</label>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-100 text-cyan-800 text-xs font-bold">
                    Máy điện xung <button type="button" className="hover:text-cyan-900 active:scale-90">✕</button>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-100 text-cyan-800 text-xs font-bold">
                    Giường kéo dãn <button type="button" className="hover:text-cyan-900 active:scale-90">✕</button>
                  </span>
                  <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-all text-xs font-bold active:scale-95">
                    + Thêm thiết bị
                  </button>
                </div>
              </div>

              </div>
              
              {/* Pinned Footer */}
              <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors active:scale-95">
                  Hủy bỏ
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl transition-colors active:scale-95 shadow-md">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
