import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPackage, updatePackage } from '../../../api/admin.api';

const packageSchema = z.object({
  ten_goi: z.string().min(1, 'Tên liệu trình là bắt buộc'),
  ma_goi: z.string().optional(),
  mo_ta: z.string().optional(),
  tong_so_buoi: z.number().min(1, 'Số buổi phải lớn hơn 0'),
  gia_tien: z.number().min(0, 'Giá tiền không hợp lệ'),
  han_dung_thang: z.number().min(1, 'Hạn dùng phải lớn hơn 0'),
  chi_tiet_dich_vu: z.array(z.object({
    dich_vu_id: z.string(),
    so_buoi: z.number().min(1)
  })).default([]),
  hien_thi_website: z.boolean().default(true),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

export type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageModalProps {
  services: any[];
  onClose: () => void;
  onSuccess: () => void;
  editingPackage?: any;
}

export default function PackageModal({ services, onClose, onSuccess, editingPackage }: PackageModalProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: editingPackage ? {
      ten_goi: editingPackage.ten_goi || '',
      ma_goi: editingPackage.ma_goi || '',
      mo_ta: editingPackage.mo_ta || '',
      tong_so_buoi: editingPackage.tong_so_buoi || 10,
      gia_tien: typeof editingPackage.gia_tien === 'string' ? parseInt(editingPackage.gia_tien) : (editingPackage.gia_tien || 0),
      han_dung_thang: editingPackage.han_dung_thang || 6,
      hien_thi_website: editingPackage.hien_thi_website !== undefined ? editingPackage.hien_thi_website : true,
      trang_thai: editingPackage.trang_thai || 'hoat_dong',
      chi_tiet_dich_vu: editingPackage.chi_tiet_dich_vu ? editingPackage.chi_tiet_dich_vu.map((item: any) => ({
        dich_vu_id: item.dich_vu_id,
        so_buoi: item.so_buoi || item.so_buoi_trong_goi || 1
      })) : []
    } : {
      trang_thai: 'hoat_dong',
      tong_so_buoi: 10,
      han_dung_thang: 6,
      gia_tien: 0,
      hien_thi_website: true,
      chi_tiet_dich_vu: []
    }
  });

  const onSubmit = async (data: PackageFormValues) => {
    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, data);
      } else {
        await createPackage(data);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Có lỗi xảy ra khi lưu cấu hình liệu trình');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-slide-up border border-slate-100">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {editingPackage ? 'Cập nhật liệu trình điều trị' : 'Cấu hình liệu trình điều trị'}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {editingPackage ? 'Chỉnh sửa thông tin và cấu trúc dịch vụ' : 'Thiết lập thông tin và cấu trúc dịch vụ của liệu trình'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all">
            ✕
          </button>
        </div>
        
        <form id="packageForm" onSubmit={handleSubmit(onSubmit as any)} className="overflow-y-auto p-6">
          <div className="space-y-6">
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên liệu trình điều trị *</label>
                <input 
                  {...register('ten_goi')} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="VD: Liệu trình Chuyên sâu"
                />
                {errors.ten_goi && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.ten_goi.message}</p>}
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mã liệu trình</label>
                <input 
                  {...register('ma_goi')} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all font-medium uppercase"
                  placeholder="Tự động tạo nếu để trống"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Giá bán (VNĐ) *</label>
                <input 
                  type="number"
                  {...register('gia_tien', { valueAsNumber: true })} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold text-slate-800"
                />
                {errors.gia_tien && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.gia_tien.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Số buổi *</label>
                <input 
                  type="number"
                  {...register('tong_so_buoi', { valueAsNumber: true })} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
                />
                {errors.tong_so_buoi && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.tong_so_buoi.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thời hạn (Tháng) *</label>
                <input 
                  type="number"
                  {...register('han_dung_thang', { valueAsNumber: true })} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
                />
                {errors.han_dung_thang && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.han_dung_thang.message}</p>}
              </div>
            </div>

            {/* Included Services Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Dịch vụ bao gồm</label>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  <Controller
                    name="chi_tiet_dich_vu"
                    control={control}
                    render={({ field }) => (
                      <>
                        {services.map(svc => {
                          const selectedItem = (field.value || []).find((v: any) => v.dich_vu_id === svc.id);
                          const isSelected = !!selectedItem;
                          
                          return (
                            <div key={svc.id} className={`flex items-center justify-between gap-3 p-3 bg-white rounded-lg border transition-colors min-w-0 ${isSelected ? 'border-teal-400 bg-teal-50/30' : 'border-slate-200 hover:border-teal-300'}`}>
                              <label className="relative flex items-center cursor-pointer flex-1 min-w-0">
                                <input 
                                  type="checkbox"
                                  className="w-5 h-5 border-2 border-slate-300 rounded text-teal-600 focus:ring-teal-500 cursor-pointer peer mr-3 flex-shrink-0"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const currentVal = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentVal, { dich_vu_id: svc.id, so_buoi: 1 }]);
                                    } else {
                                      field.onChange(currentVal.filter((v: any) => v.dich_vu_id !== svc.id));
                                    }
                                  }}
                                />
                                <span className="text-sm font-medium text-slate-700 select-none truncate flex-1 min-w-0">{svc.ten_dich_vu}</span>
                              </label>
                              
                              {isSelected && (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Số buổi:</span>
                                  <input 
                                    type="number" 
                                    min="1"
                                    className="w-14 px-1.5 py-1 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none text-center font-bold text-slate-800 bg-slate-50"
                                    value={selectedItem.so_buoi}
                                    onChange={(e) => {
                                      const soBuoi = parseInt(e.target.value) || 1;
                                      const currentVal = field.value || [];
                                      field.onChange(currentVal.map((v: any) => 
                                        v.dich_vu_id === svc.id ? { ...v, so_buoi: soBuoi } : v
                                      ));
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Chọn các dịch vụ linh động mà khách hàng có thể sử dụng khi mua liệu trình này.</p>
            </div>

            {/* Toggles */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Hiển thị trên Website</h4>
                <p className="text-xs text-slate-500 mt-0.5">Cho phép khách hàng xem và đặt liệu trình online</p>
              </div>
              <Controller
                name="hien_thi_website"
                control={control}
                render={({ field }) => (
                  <button 
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${field.value ? 'bg-teal-500 justify-end' : 'bg-slate-300 justify-start'}`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform"></div>
                  </button>
                )}
              />
            </div>

          </div>
        </form>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-medium transition-colors shadow-sm"
          >
            Hủy bỏ
          </button>
          <button 
            form="packageForm"
            type="submit"
            className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium transition-colors shadow-sm"
          >
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
