import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPackage, updatePackage } from '../../../api/admin.api';
import { useState, useEffect, useMemo } from 'react';

const packageSchema = z.object({
  ten_goi: z.string().min(1, 'Tên gói dịch vụ là bắt buộc'),
  ma_goi: z.string().optional(),
  mo_ta: z.string().optional(),
  tong_so_buoi: z.number().min(1, 'Số buổi phải lớn hơn 0'),
  gia_tien: z.number().min(0, 'Giá tiền không hợp lệ'),
  han_dung_thang: z.number().min(1, 'Hạn dùng phải lớn hơn 0'),
  so_dv_toi_da_moi_buoi: z.number().min(1, 'Số dịch vụ mỗi buổi phải lớn hơn 0').default(5),
  chi_tiet_dich_vu: z.array(z.object({
    dich_vu_id: z.string(),
    so_buoi: z.number().min(1),
    so_lan_toi_da_trong_goi: z.number().min(1),
    bat_buoc: z.boolean().default(true),
    thu_tu_thuc_hien: z.number().min(0).default(0)
  })).default([]),
  hien_thi_website: z.boolean().default(true),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu']),
  loai_goi: z.enum(['linh_dong', 'lieu_trinh']).default('lieu_trinh')
});

export type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageModalProps {
  services: any[];
  onClose: () => void;
  onSuccess: () => void;
  editingPackage?: any;
  existingPackages: any[];
}

export default function PackageModal({ services, onClose, onSuccess, editingPackage, existingPackages }: PackageModalProps) {
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('Tất cả');
  const [serviceSearch, setServiceSearch] = useState<string>('');

  const { register, handleSubmit, control, watch, setValue, setError, formState: { errors } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: editingPackage ? {
      ten_goi: editingPackage.ten_goi || '',
      ma_goi: editingPackage.ma_goi || '',
      mo_ta: editingPackage.mo_ta || '',
      tong_so_buoi: editingPackage.tong_so_buoi || 10,
      gia_tien: typeof editingPackage.gia_tien === 'string' ? parseInt(editingPackage.gia_tien) : (editingPackage.gia_tien || 0),
      han_dung_thang: editingPackage.han_dung_thang || 6,
      so_dv_toi_da_moi_buoi: editingPackage.so_dv_toi_da_moi_buoi || 5,
      hien_thi_website: editingPackage.hien_thi_website !== undefined ? editingPackage.hien_thi_website : true,
      trang_thai: editingPackage.trang_thai || 'hoat_dong',
      loai_goi: editingPackage.loai_goi || 'lieu_trinh',
      chi_tiet_dich_vu: editingPackage.chi_tiet_dich_vu ? editingPackage.chi_tiet_dich_vu.map((item: any) => ({
        dich_vu_id: String(item.dich_vu_id),
        so_buoi: item.so_buoi || item.so_buoi_trong_goi || editingPackage.tong_so_buoi || 10,
        so_lan_toi_da_trong_goi: item.so_lan_toi_da_trong_goi || item.so_buoi || item.so_buoi_trong_goi || editingPackage.tong_so_buoi || 10,
        bat_buoc: item.bat_buoc !== undefined ? item.bat_buoc : true,
        thu_tu_thuc_hien: item.thu_tu_thuc_hien || 0
      })) : []
    } : {
      trang_thai: 'hoat_dong',
      tong_so_buoi: 10,
      han_dung_thang: 6,
      so_dv_toi_da_moi_buoi: 5,
      gia_tien: 0,
      hien_thi_website: true,
      loai_goi: 'lieu_trinh',
      chi_tiet_dich_vu: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'chi_tiet_dich_vu'
  });

  const watchTongSoBuoi = watch('tong_so_buoi') || 10;
  const watchStatus = watch('trang_thai');
  const watchShowWeb = watch('hien_thi_website');
  const watchLoaiGoi = watch('loai_goi');

  // Automatic setting of tong_so_buoi = 1 if loai_goi is flexible ('linh_dong')
  useEffect(() => {
    if (watchLoaiGoi === 'linh_dong') {
      setValue('tong_so_buoi', 1);
    }
  }, [watchLoaiGoi, setValue]);

  // Filter out services that are already added
  const availableServicesToAdd = services.filter(
    svc => !fields.some(field => field.dich_vu_id === String(svc.id))
  );

  // Dynamic categories mapped from services list for filtering
  const mappedCategories = useMemo(() => {
    const cats = new Set<string>();
    services.forEach(s => {
      if (s.ten_danh_muc) cats.add(s.ten_danh_muc);
    });
    return ['Tất cả', ...Array.from(cats)];
  }, [services]);

  // Filter available services by category tab and text search query
  const filteredAvailableServices = useMemo(() => {
    let list = availableServicesToAdd;
    if (selectedCatFilter !== 'Tất cả') {
      list = list.filter(s => s.ten_danh_muc === selectedCatFilter);
    }
    if (serviceSearch.trim()) {
      const q = serviceSearch.trim().toLowerCase();
      list = list.filter(s => 
        s.ten_dich_vu.toLowerCase().includes(q) || 
        (s.ten_danh_muc && s.ten_danh_muc.toLowerCase().includes(q))
      );
    }
    return list;
  }, [availableServicesToAdd, selectedCatFilter, serviceSearch]);

  const onSubmit = async (data: PackageFormValues) => {
    try {
      // Validate unique name
      const isDuplicate = existingPackages.some((pkg: any) => {
        if (editingPackage && pkg.id === editingPackage.id) return false;
        return pkg.ten_goi.trim().toLowerCase() === data.ten_goi.trim().toLowerCase();
      });

      if (isDuplicate) {
        setError('ten_goi', {
          type: 'manual',
          message: `Tên gói "${data.ten_goi}" đã tồn tại trên hệ thống. Vui lòng nhập tên khác!`
        });
        return;
      }

      // Ensure so_buoi matches so_lan_toi_da_trong_goi for sync
      const payload = {
        ...data,
        chi_tiet_dich_vu: data.chi_tiet_dich_vu.map(item => ({
          ...item,
          so_buoi: item.so_lan_toi_da_trong_goi
        }))
      };

      if (editingPackage && editingPackage.id) {
        await updatePackage(editingPackage.id, payload);
      } else {
        await createPackage(payload);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving package:', error);
      alert(editingPackage ? 'Có lỗi xảy ra khi cập nhật gói' : 'Có lỗi xảy ra khi tạo gói');
    }
  };

  return (
    <div className="fixed inset-0 bg-secondary/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 text-secondary">
      <div className="bg-white border border-zinc-250 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <h3 className="text-sm font-bold font-heading tracking-wide uppercase">
              {editingPackage ? `[CHỈNH SỬA] GÓI DỊCH VỤ` : `[TẠO MỚI] GÓI DỊCH VỤ`}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-zinc-400 hover:text-secondary text-xs border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-xl bg-white shadow-sm transition-all"
          >
            [ ĐÓNG ]
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-xs">
            
            {/* HỘP I: ĐỊNH DANH GÓI DỊCH VỤ */}
            <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">Hộp I: Định danh gói dịch vụ</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Tên gói dịch vụ / Gói trị liệu *</label>
                  <input 
                    {...register('ten_goi')} 
                    placeholder="Nhập tên gói dịch vụ..."
                    className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary text-sm placeholder-zinc-300 shadow-sm"
                  />
                  {errors.ten_goi && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.ten_goi.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Mã gói dịch vụ (Tùy chọn)</label>
                  <input 
                    {...register('ma_goi')} 
                    placeholder="Mã tự động sinh..."
                    className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary text-sm placeholder-zinc-300 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Mô tả phác đồ & Định hướng gói</label>
                <textarea 
                  {...register('mo_ta')} 
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-355 resize-none font-medium text-xs shadow-sm"
                  placeholder="Mô tả định hướng điều trị hoặc phân tích y khoa cho gói..."
                ></textarea>
              </div>
            </div>

            {/* HỘP II: THÔNG SỐ VẬN HÀNH & KINH TẾ */}
            <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">Hộp II: Thông số vận hành & Kinh tế</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="col-span-2 md:col-span-1">
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Phân loại gói *</label>
                  <select 
                    {...register('loai_goi')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                  >
                    <option value="lieu_trinh">GÓI CỐ ĐỊNH</option>
                    <option value="linh_dong">GÓI LINH ĐỘNG (FLEXI)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Giá bán trọn gói *</label>
                  <input 
                    type="number"
                    {...register('gia_tien', { valueAsNumber: true })} 
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-primary text-right shadow-sm text-sm"
                  />
                  {errors.gia_tien && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.gia_tien.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Tổng số buổi *</label>
                  <input 
                    type="number"
                    {...register('tong_so_buoi', { valueAsNumber: true })} 
                    placeholder="10"
                    readOnly={watchLoaiGoi === 'linh_dong'}
                    className={`w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm ${
                      watchLoaiGoi === 'linh_dong' ? 'bg-zinc-50 border-zinc-200 cursor-not-allowed text-zinc-400 focus:ring-0 focus:border-zinc-250' : ''
                    }`}
                  />
                  {errors.tong_so_buoi && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.tong_so_buoi.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Hạn dùng (Tháng) *</label>
                  <input 
                    type="number"
                    {...register('han_dung_thang', { valueAsNumber: true })} 
                    placeholder="6"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm"
                  />
                  {errors.han_dung_thang && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.han_dung_thang.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Số DV/Buổi *</label>
                  <input 
                    type="number"
                    {...register('so_dv_toi_da_moi_buoi', { valueAsNumber: true })} 
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm"
                  />
                  {errors.so_dv_toi_da_moi_buoi && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.so_dv_toi_da_moi_buoi.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* HỘP III: CẤU HÌNH DỊCH VỤ KỸ THUẬT LÂM SÀNG */}
            <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">Hộp III: Cấu hình dịch vụ kỹ thuật trong gói</h4>
              
              {/* Beautiful Interactive Catalog UI for adding services */}
              <div className="space-y-3">
                <label className="block font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  Chọn dịch vụ kỹ thuật để thêm vào phác đồ (Bấm để thêm vào phác đồ)
                </label>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-zinc-100/80 rounded-xl border border-zinc-200">
                  {mappedCategories.map((catName) => (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setSelectedCatFilter(catName)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all active:scale-95 ${
                        selectedCatFilter === catName
                          ? 'bg-primary text-white shadow-sm border border-primary/20'
                          : 'text-zinc-500 hover:text-secondary hover:bg-white'
                      }`}
                    >
                      {catName.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Search Bar for Services */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm nhanh dịch vụ kỹ thuật bằng tên hoặc danh mục..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary placeholder-zinc-350 shadow-inner"
                  />
                </div>

                {/* Service Cards Grid (Click to Add) */}
                <div className="border border-zinc-200 rounded-2xl bg-white p-3 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 custom-scrollbar">
                  {filteredAvailableServices.length > 0 ? (
                    filteredAvailableServices.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => {
                          append({
                            dich_vu_id: String(svc.id),
                            so_buoi: watchTongSoBuoi,
                            so_lan_toi_da_trong_goi: watchTongSoBuoi,
                            bat_buoc: true,
                            thu_tu_thuc_hien: fields.length + 1
                          });
                        }}
                        className="group text-left p-3 rounded-xl border border-zinc-150 bg-zinc-50/20 hover:bg-primary-container hover:border-primary/25 transition-all flex justify-between items-center gap-3 active:scale-[0.98]"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-secondary text-xs truncate group-hover:text-primary transition-colors">
                            {svc.ten_dich_vu}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9px] text-zinc-500 font-bold bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 shrink-0">
                              {new Intl.NumberFormat('vi-VN').format(svc.don_gia)}đ
                            </span>
                            <span className={`text-[8px] px-1 py-0.2 rounded font-bold border shrink-0 ${
                              svc.hien_thi_website !== false
                                ? 'bg-emerald-50 border-emerald-250 text-emerald-600'
                                : 'bg-amber-50 border-amber-250 text-amber-600'
                            }`}>
                              {svc.hien_thi_website !== false ? 'CÔNG KHAI' : 'NỘI BỘ'}
                            </span>
                          </div>
                        </div>
                        <span className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all text-xs font-bold shrink-0 shadow-sm">
                          +
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="col-span-1 sm:col-span-2 text-center py-8 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                      Tất cả các dịch vụ trong danh mục này đã được thêm
                    </p>
                  )}
                </div>
              </div>

              {/* Table of selected services */}
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-heading">
                      <th className="p-3 font-bold w-16 text-center">Thứ tự</th>
                      <th className="p-3 font-bold">Dịch vụ</th>
                      <th className="p-3 font-bold text-center w-28">Hạn mức lần</th>
                      <th className="p-3 font-bold text-center w-24">Bắt buộc</th>
                      <th className="p-3 font-bold text-center w-20">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {fields.length > 0 ? (
                      fields.map((field, index) => {
                        const svc = services.find(s => String(s.id) === String(field.dich_vu_id));
                        return (
                          <tr key={field.id} className="hover:bg-zinc-50/50">
                            <td className="p-3 text-center bg-zinc-50/30">
                              <input
                                type="number"
                                {...register(`chi_tiet_dich_vu.${index}.thu_tu_thuc_hien` as const, { valueAsNumber: true })}
                                className="w-12 text-center py-1 bg-white border border-zinc-200 rounded-lg outline-none font-bold text-zinc-650 focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-secondary">{svc ? svc.ten_dich_vu : 'Không xác định'}</p>
                                {svc && (
                                  <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold border ${
                                    svc.hien_thi_website
                                      ? 'bg-primary-container text-primary border-primary/25'
                                      : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                  }`}>
                                    {svc.hien_thi_website ? 'CÔNG KHAI' : 'NỘI BỘ'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-zinc-400 mt-0.5">{svc ? svc.ten_danh_muc : 'Danh mục trống'}</p>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  {...register(`chi_tiet_dich_vu.${index}.so_lan_toi_da_trong_goi` as const, { valueAsNumber: true })}
                                  className="w-16 text-center py-1.5 bg-white border border-zinc-200 rounded-lg outline-none font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs"
                                />
                                <span className="font-semibold text-zinc-400">Lần</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Controller
                                name={`chi_tiet_dich_vu.${index}.bat_buoc` as const}
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                  <button
                                    type="button"
                                    onClick={() => onChange(!value)}
                                    className={`px-2.5 py-1 rounded-lg border font-bold text-[9px] transition-all ${
                                      value
                                        ? 'bg-primary-container text-primary border-primary/20 hover:bg-primary hover:text-white'
                                        : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-zinc-100'
                                    }`}
                                  >
                                    {value ? 'CÓ' : 'KHÔNG'}
                                  </button>
                                )}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-90 bg-white shadow-sm mx-auto"
                                title="Xóa khỏi phác đồ"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-zinc-400 font-sans text-xs">
                          VUI LÒNG THÊM CÁC DỊCH VỤ KỸ THUẬT LÂM SÀNG VÀO GÓI
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOGGLES & STATUS (HIỂN THỊ WEB + TRẠNG THÁI HOẠT ĐỘNG) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hiển thị Website */}
              <div 
                className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 flex items-center justify-between cursor-pointer shadow-sm hover:border-zinc-300 transition-all"
                onClick={() => setValue('hien_thi_website', !watchShowWeb)}
              >
                <div>
                  <h5 className="font-bold text-secondary text-xs uppercase tracking-wider">Hiển thị trên Website</h5>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Cho phép người dùng xem gói trực tuyến</p>
                </div>
                <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors duration-200 ${watchShowWeb ? 'bg-primary' : 'bg-zinc-200'}`}>
                  <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition-transform duration-200 ${watchShowWeb ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                </div>
              </div>

              {/* Trạng thái hoạt động */}
              <div 
                className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 flex items-center justify-between cursor-pointer shadow-sm hover:border-zinc-300 transition-all"
                onClick={() => setValue('trang_thai', watchStatus === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong')}
              >
                <div>
                  <h5 className="font-bold text-secondary text-xs uppercase tracking-wider">Trạng thái gói</h5>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Cho phép đặt hẹn & xuất hóa đơn</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    watchStatus === 'hoat_dong' ? 'text-primary' : 'text-zinc-400'
                  }`}>
                    {watchStatus === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}
                  </span>
                  <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors duration-200 ${watchStatus === 'hoat_dong' ? 'bg-primary' : 'bg-zinc-200'}`}>
                    <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition-transform duration-200 ${watchStatus === 'hoat_dong' ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-secondary font-bold rounded-xl shadow-sm transition-all text-center"
            >
              HỦY BỎ
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-sm hover:shadow-soft-button transition-all text-center"
            >
              {editingPackage ? 'CẬP NHẬT CẤU HÌNH' : 'TẠO GÓI MỚI'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
