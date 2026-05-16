import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getPackages, createPackage } from '../../../api/admin.api';

// Schema for form validation
const packageSchema = z.object({
  ten_goi: z.string().min(1, 'Tên gói là bắt buộc'),
  mo_ta: z.string().optional(),
  tong_so_buoi: z.number().min(1, 'Số buổi phải lớn hơn 0'),
  gia_tien: z.number().min(0, 'Giá tiền không hợp lệ'),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

type PackageFormValues = z.infer<typeof packageSchema>;

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      trang_thai: 'hoat_dong',
      tong_so_buoi: 10,
      gia_tien: 0
    }
  });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await getPackages();
      setPackages(res.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const onSubmit = async (data: PackageFormValues) => {
    try {
      await createPackage(data);
      setIsModalOpen(false);
      reset();
      fetchPackages();
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Có lỗi xảy ra khi tạo gói');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Gói điều trị</h2>
          <p className="text-slate-500 mt-1">Danh sách các gói dịch vụ khách hàng có thể đăng ký.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+</span> Thêm Gói Mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Tên Gói</th>
                <th className="p-4 font-semibold">Mô tả</th>
                <th className="p-4 font-semibold text-center">Số buổi</th>
                <th className="p-4 font-semibold text-right">Giá tiền (VNĐ)</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Chưa có dữ liệu.</td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{pkg.ten_goi}</td>
                    <td className="p-4 text-slate-600 truncate max-w-xs">{pkg.mo_ta}</td>
                    <td className="p-4 text-center text-slate-800">{pkg.tong_so_buoi}</td>
                    <td className="p-4 text-right text-slate-800 font-medium">
                      {currencyFormatter.format(pkg.gia_tien)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pkg.trang_thai === 'hoat_dong' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {pkg.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-teal-600 hover:text-teal-800 text-sm font-medium mr-3">Sửa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Gói */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Thêm Gói Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="ten_goi" className="block text-sm font-medium text-slate-700 mb-1">Tên gói *</label>
                  <input 
                    id="ten_goi"
                    {...register('ten_goi')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="VD: Gói cổ vai gáy 10 buổi"
                  />
                  {errors.ten_goi && <p className="text-red-500 text-xs mt-1">{errors.ten_goi.message}</p>}
                </div>
                
                <div>
                  <label htmlFor="mo_ta" className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                  <textarea 
                    id="mo_ta"
                    {...register('mo_ta')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tong_so_buoi" className="block text-sm font-medium text-slate-700 mb-1">Số buổi *</label>
                    <input 
                      id="tong_so_buoi"
                      type="number"
                      {...register('tong_so_buoi', { valueAsNumber: true })} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    {errors.tong_so_buoi && <p className="text-red-500 text-xs mt-1">{errors.tong_so_buoi.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="gia_tien" className="block text-sm font-medium text-slate-700 mb-1">Giá tiền (VNĐ) *</label>
                    <input 
                      id="gia_tien"
                      type="number"
                      {...register('gia_tien', { valueAsNumber: true })} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    {errors.gia_tien && <p className="text-red-500 text-xs mt-1">{errors.gia_tien.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="trang_thai" className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select 
                    id="trang_thai"
                    {...register('trang_thai')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="hoat_dong">Hoạt động</option>
                    <option value="vo_hieu">Vô hiệu</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-medium transition-colors"
                >
                  Lưu Gói
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
