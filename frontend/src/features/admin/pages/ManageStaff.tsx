import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getStaff, createStaff } from '../../../api/admin.api';

const staffSchema = z.object({
  ho_ten: z.string().min(1, 'Họ tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  mat_khau: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  vai_tro_id: z.number().min(2, 'Vui lòng chọn vai trò'),
  so_dien_thoai: z.string().optional(),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function ManageStaff() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      trang_thai: 'hoat_dong'
    }
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await getStaff();
      setStaffList(res.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const onSubmit = async (data: StaffFormValues) => {
    try {
      await createStaff(data);
      setIsModalOpen(false);
      reset();
      fetchStaff();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân sự');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-secondary">Quản lý Nhân sự</h2>
          <p className="text-zinc-500 mt-1">Danh sách bác sĩ, kỹ thuật viên, lễ tân và quản trị viên.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+</span> Thêm Nhân sự
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-sm">
                <th className="p-4 font-semibold">Họ Tên</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Vai trò</th>
                <th className="p-4 font-semibold">Số điện thoại</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">Đang tải dữ liệu...</td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">Chưa có dữ liệu.</td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 font-medium text-secondary">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-bold text-xs">
                          {staff.ho_ten.charAt(0)}
                        </div>
                        {staff.ho_ten}
                      </div>
                    </td>
                    <td className="p-4 text-zinc-600">{staff.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${staff.vai_tro === 'Admin' ? 'bg-purple-100 text-purple-700' :
                          staff.vai_tro === 'Bác sĩ' ? 'bg-blue-100 text-blue-700' :
                            staff.vai_tro === 'Kỹ thuật viên' ? 'bg-amber-100 text-amber-700' :
                              'bg-zinc-100 text-zinc-700'
                        }`}>
                        {staff.vai_tro}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-600 text-sm">{staff.so_dien_thoai || '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${staff.trang_thai === 'hoat_dong' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {staff.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-primary hover:underline text-sm font-medium mr-3">Sửa</button>
                      <button className="text-red-600 hover:underline text-sm font-medium">Khóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-secondary">Thêm Nhân sự</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="ho_ten" className="block text-sm font-medium text-zinc-700 mb-1">Họ Tên *</label>
                  <input
                    id="ho_ten"
                    {...register('ho_ten')}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  {errors.ho_ten && <p className="text-red-500 text-xs mt-1">{errors.ho_ten.message}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">Email *</label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="mat_khau" className="block text-sm font-medium text-zinc-700 mb-1">Mật khẩu *</label>
                  <input
                    id="mat_khau"
                    type="password"
                    {...register('mat_khau')}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  {errors.mat_khau && <p className="text-red-500 text-xs mt-1">{errors.mat_khau.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vai_tro_id" className="block text-sm font-medium text-zinc-700 mb-1">Vai trò *</label>
                    <select
                      id="vai_tro_id"
                      {...register('vai_tro_id', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value={0}>-- Chọn --</option>
                      <option value={2}>Lễ tân</option>
                      <option value={3}>Kỹ thuật viên</option>
                      <option value={4}>Bác sĩ</option>
                      <option value={5}>Admin</option>
                    </select>
                    {errors.vai_tro_id && <p className="text-red-500 text-xs mt-1">{errors.vai_tro_id.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="so_dien_thoai" className="block text-sm font-medium text-zinc-700 mb-1">Số điện thoại</label>
                    <input
                      id="so_dien_thoai"
                      {...register('so_dien_thoai')}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 text-white bg-primary hover:opacity-90 rounded-lg font-medium">Tạo Tài khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
