import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getEquipment, createEquipment } from '../../../api/admin.api';

const equipmentSchema = z.object({
  ten_thiet_bi: z.string().min(1, 'Tên thiết bị là bắt buộc'),
  ma_thiet_bi: z.string().min(1, 'Mã thiết bị là bắt buộc'),
  loai_thiet_bi: z.string().optional(),
  trang_thai: z.enum(['hoat_dong', 'bao_tri', 'hong']),
  ngay_bao_tri_gan_nhat: z.string().optional(),
  ghi_chu: z.string().optional()
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export default function ManageEquipment() {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      trang_thai: 'hoat_dong'
    }
  });

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await getEquipment();
      setEquipmentList(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchEquipment();
  }, []);

  const onSubmit = async (data: EquipmentFormValues) => {
    try {
      await createEquipment(data);
      setIsModalOpen(false);
      reset();
      fetchEquipment();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi tạo thiết bị');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-secondary">Quản lý Thiết bị</h2>
          <p className="text-zinc-500 mt-1">Theo dõi trạng thái và lịch bảo trì máy móc vật lý trị liệu.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <span>+</span> Thêm Thiết bị
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-sm">
                <th className="p-4 font-semibold">Tên Thiết bị</th>
                <th className="p-4 font-semibold">Mã hiệu</th>
                <th className="p-4 font-semibold">Loại</th>
                <th className="p-4 font-semibold">Bảo trì gần nhất</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">Đang tải dữ liệu...</td>
                </tr>
              ) : equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">Chưa có thiết bị nào.</td>
                </tr>
              ) : (
                equipmentList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 font-medium text-secondary">{eq.ten_thiet_bi}</td>
                    <td className="p-4 text-zinc-600 font-mono text-sm">{eq.ma_thiet_bi}</td>
                    <td className="p-4 text-zinc-600 text-sm">{eq.loai_thiet_bi || '-'}</td>
                    <td className="p-4 text-zinc-600 text-sm">
                      {isClient && eq.ngay_bao_tri_gan_nhat ? new Date(eq.ngay_bao_tri_gan_nhat).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        eq.trang_thai === 'hoat_dong' ? 'bg-emerald-100 text-emerald-800' :
                        eq.trang_thai === 'bao_tri' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {eq.trang_thai === 'hoat_dong' ? 'Hoạt động' : eq.trang_thai === 'bao_tri' ? 'Bảo trì' : 'Hỏng'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-primary hover:underline text-sm font-semibold mr-3">Sửa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-secondary">Thêm Thiết bị mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-secondary">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="ten_thiet_bi" className="block text-sm font-medium text-zinc-700 mb-1">Tên thiết bị *</label>
                  <input
                    id="ten_thiet_bi"
                    {...register('ten_thiet_bi')}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  {errors.ten_thiet_bi && <p className="text-red-500 text-xs mt-1">{errors.ten_thiet_bi.message}</p>}
                </div>

                <div>
                  <label htmlFor="ma_thiet_bi" className="block text-sm font-medium text-zinc-700 mb-1">Mã thiết bị *</label>
                  <input
                    id="ma_thiet_bi"
                    {...register('ma_thiet_bi')}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  {errors.ma_thiet_bi && <p className="text-red-500 text-xs mt-1">{errors.ma_thiet_bi.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="loai_thiet_bi" className="block text-sm font-medium text-zinc-700 mb-1">Loại</label>
                    <input
                      id="loai_thiet_bi"
                      {...register('loai_thiet_bi')}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="trang_thai" className="block text-sm font-medium text-zinc-700 mb-1">Trạng thái</label>
                    <select
                      id="trang_thai"
                      {...register('trang_thai')}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="hoat_dong">Hoạt động</option>
                      <option value="bao_tri">Bảo trì</option>
                      <option value="hong">Hỏng</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 text-white bg-primary hover:opacity-90 rounded-xl font-medium">Lưu thiết bị</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
