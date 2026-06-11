import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPackage, updatePackage, getCategories } from '../../../api/admin.api';
import { useEffect, useState, useMemo } from 'react';

const packageSchema = z.object({
  ten_goi: z.string().min(1, 'Tên gói dịch vụ là bắt buộc'),
  ma_goi: z.string().optional(),
  mo_ta: z.string().optional(),
  tong_so_buoi: z.number().min(1, 'Số buổi phải lớn hơn 0'),
  gia_tien: z.number().min(0, 'Giá tiền không hợp lệ'),
  so_dv_toi_da_moi_buoi: z.number().min(1, 'Số dịch vụ mỗi buổi phải lớn hơn 0').default(5),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu']),
  loai_goi: z.enum(['linh_dong', 'lieu_trinh']).default('lieu_trinh'),
  danh_muc_id: z.number().min(1, 'Vui lòng chọn danh mục chuyên khoa').optional().nullable()
});

export type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageModalProps {
  services: any[];
  onClose: () => void;
  onSuccess: () => void;
  editingPackage?: any;
  existingPackages: any[];
}

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function PackageModal({ onClose, onSuccess, editingPackage, existingPackages }: PackageModalProps) {
  const [categories, setCategories] = useState<any[]>([]);

  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: editingPackage ? {
      ten_goi: editingPackage.ten_goi || '',
      ma_goi: editingPackage.ma_goi || '',
      mo_ta: editingPackage.mo_ta || '',
      tong_so_buoi: editingPackage.tong_so_buoi || 10,
      gia_tien: typeof editingPackage.gia_tien === 'string' ? parseInt(editingPackage.gia_tien) : (editingPackage.gia_tien || 0),
      so_dv_toi_da_moi_buoi: editingPackage.so_dv_toi_da_moi_buoi || 5,
      trang_thai: editingPackage.trang_thai || 'hoat_dong',
      loai_goi: editingPackage.loai_goi || 'lieu_trinh',
      danh_muc_id: editingPackage.danh_muc_id ? Number(editingPackage.danh_muc_id) : undefined
    } : {
      trang_thai: 'hoat_dong',
      tong_so_buoi: 10,
      so_dv_toi_da_moi_buoi: 5,
      gia_tien: 0,
      loai_goi: 'lieu_trinh',
      danh_muc_id: undefined
    }
  });

  const watchStatus = watch('trang_thai');
  const watchLoaiGoi = watch('loai_goi');
  const watchTongSoBuoi = watch('tong_so_buoi') || 0;
  const watchGiaTien = watch('gia_tien') || 0;

  // Load active package-only categories
  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await getCategories();
        // Only fetch categories of type 'goi' and an_hien is true
        setCategories((res.data || []).filter((c: any) => c.an_hien !== false && c.loai_danh_muc === 'goi'));
      } catch (e) {
        console.error('Lỗi khi tải danh mục trong PackageModal:', e);
      }
    };
    loadCats();
  }, []);

  // Automatic default setup and price calculation for Gói tự chọn (linh_dong)
  useEffect(() => {
    if (watchLoaiGoi === 'linh_dong') {
      // Set a default session count if it's currently low
      if (watchTongSoBuoi <= 1) {
        setValue('tong_so_buoi', 10);
      }
    }
  }, [watchLoaiGoi, setValue]);

  useEffect(() => {
    if (watchLoaiGoi === 'linh_dong') {
      setValue('gia_tien', watchTongSoBuoi * 599000);
    }
  }, [watchLoaiGoi, watchTongSoBuoi, setValue]);

  // Premium PRESET_TIERS Configuration for static display of Gói cố định
  const PRESET_TIERS = useMemo(() => [
    {
      id: 'basic',
      name: 'BASIC',
      sessions: 6,
      weeks: 2,
      pricePerSession: 599000,
      totalPrice: 3594000,
      color: 'emerald'
    },
    {
      id: 'standard',
      name: 'STANDARD',
      sessions: 12,
      weeks: 4,
      pricePerSession: 549000,
      totalPrice: 6588000,
      color: 'teal'
    },
    {
      id: 'intensive',
      name: 'INTENSIVE',
      sessions: 18,
      weeks: 6,
      pricePerSession: 499000,
      totalPrice: 8982000,
      color: 'amber'
    }
  ], []);
  const onSubmit = async (data: PackageFormValues) => {
    try {
      const isEdit = !!(editingPackage && editingPackage.id);

      // Validate unique name (deduplicated base name comparison)
      const inputBaseName = data.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i, '').trim().toLowerCase();
      const isDuplicate = existingPackages.some((pkg: any) => {
        if (isEdit && pkg.id === editingPackage.id) return false;
        // Nếu đang sửa gói nhóm, bỏ qua việc tự trùng tên với chính các phân khúc con của mình
        if (editingPackage?.isGrouped && editingPackage.subPackages?.some((sub: any) => sub.id === pkg.id)) return false;
        
        const pkgBaseName = pkg.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i, '').trim().toLowerCase();
        return pkgBaseName === inputBaseName;
      });

      if (isDuplicate) {
        setError('ten_goi', {
          type: 'manual',
          message: `Tên gói "${data.ten_goi}" đã tồn tại trên hệ thống (hoặc trùng với phân khúc của gói khác). Vui lòng nhập tên khác!`
        });
        return;
      }

      if (data.loai_goi === 'lieu_trinh' && !isEdit) {
        // GÓI CỐ ĐỊNH TẠO MỚI -> Tự động khởi tạo cả 3 phân khúc chuẩn
        const levels = [
          { suffix: 'BASIC', codeSuffix: 'BSC', sessions: 6, price: 3594000 },
          { suffix: 'STANDARD', codeSuffix: 'STD', sessions: 12, price: 6588000 },
          { suffix: 'INTENSIVE', codeSuffix: 'ITS', sessions: 18, price: 8982000 }
        ];

        for (const lvl of levels) {
          const payload = {
            ...data,
            ten_goi: `${data.ten_goi} - ${lvl.suffix}`,
            ma_goi: data.ma_goi ? `${data.ma_goi}-${lvl.codeSuffix}` : '',
            tong_so_buoi: lvl.sessions,
            gia_tien: lvl.price,
            han_dung_thang: 12,
            hien_thi_website: true,
            chi_tiet_dich_vu: []
          };
          await createPackage(payload);
        }
      } else {
        // GÓI TỰ CHỌN hoặc SỬA GÓI CỐ ĐỊNH / TỰ CHỌN
        if (isEdit) {
          if (editingPackage.isGrouped && editingPackage.subPackages) {
            // SỬA GÓI CỐ ĐỊNH NHÓM -> Cập nhật đồng thời cả 3 phân khúc
            for (const sub of editingPackage.subPackages) {
              const suffix = sub.ten_goi.toUpperCase().includes('BASIC') ? 'BASIC' :
                             sub.ten_goi.toUpperCase().includes('STANDARD') ? 'STANDARD' : 'INTENSIVE';
              const codeSuffix = suffix === 'BASIC' ? 'BSC' : suffix === 'STANDARD' ? 'STD' : 'ITS';
              const sessions = suffix === 'BASIC' ? 6 : suffix === 'STANDARD' ? 12 : 18;
              const price = suffix === 'BASIC' ? 3594000 : suffix === 'STANDARD' ? 6588000 : 8982000;

              const payload = {
                ...data,
                ten_goi: `${data.ten_goi} - ${suffix}`,
                ma_goi: data.ma_goi ? `${data.ma_goi}-${codeSuffix}` : '',
                tong_so_buoi: sessions,
                gia_tien: price,
                han_dung_thang: sub.han_dung_thang || 12,
                hien_thi_website: true,
                chi_tiet_dich_vu: sub.chi_tiet_dich_vu || []
              };
              await updatePackage(sub.id, payload);
            }
          } else {
            // SỬA GÓI TỰ CHỌN ĐƠN LẺ
            const payload = {
              ...data,
              han_dung_thang: editingPackage?.han_dung_thang || 12,
              hien_thi_website: true,
              chi_tiet_dich_vu: editingPackage ? (editingPackage.chi_tiet_dich_vu || []).map((item: any) => ({
                dich_vu_id: String(item.dich_vu_id),
                so_buoi: item.so_buoi || item.so_buoi_trong_goi || data.tong_so_buoi,
                so_lan_toi_da_trong_goi: item.so_lan_toi_da_trong_goi || item.so_buoi || data.tong_so_buoi,
                bat_buoc: item.bat_buoc !== undefined ? item.bat_buoc : true,
                thu_tu_thuc_hien: item.thu_tu_thuc_hien || 0
              })) : []
            };
            await updatePackage(editingPackage.id, payload);
          }
        } else {
          // TẠO MỚI GÓI TỰ CHỌN
          const payload = {
            ...data,
            han_dung_thang: 12,
            hien_thi_website: true,
            chi_tiet_dich_vu: []
          };
          await createPackage(payload);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving package:', error);
      alert(editingPackage && editingPackage.id ? 'Có lỗi xảy ra khi cập nhật gói' : 'Có lỗi xảy ra khi tạo gói');
    }
  };  return (
    <div className="fixed inset-0 bg-secondary/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 text-secondary">
      <div className="bg-white border border-zinc-250 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <h3 className="text-sm font-bold font-heading tracking-wide uppercase">
              {editingPackage && editingPackage.id ? `[CHỈNH SỬA] GÓI DỊCH VỤ` : `[TẠO MỚI] GÓI DỊCH VỤ`}
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

              {/* CHUYÊN KHOA PHỤ TRÁCH */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Danh mục chuyên khoa gói *</label>
                  <select 
                    {...register('danh_muc_id', { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                  >
                    <option value="">-- CHỌN DANH MỤC CHUYÊN KHOA --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.ten_danh_muc.toUpperCase()}</option>
                    ))}
                  </select>
                  {errors.danh_muc_id && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.danh_muc_id.message}</span>
                  )}
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
            <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-5">
              <div className="border-b border-zinc-150 pb-2 flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Hộp II: Thông số vận hành & Kinh tế</h4>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                  watchLoaiGoi === 'lieu_trinh'
                    ? 'bg-teal-50 border-teal-200 text-teal-650'
                    : 'bg-amber-50 border-amber-200 text-amber-600'
                }`}>
                  {watchLoaiGoi === 'lieu_trinh' ? 'GÓI CỐ ĐỊNH CHUẨN' : 'GÓI TỰ CHỌN LINH HOẠT'}
                </span>
              </div>

              {/* Grid 3 Phân khúc Preset Tiers hiển thị tĩnh cho GÓI CỐ ĐỊNH */}
              {watchLoaiGoi === 'lieu_trinh' ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50/30 border border-emerald-250 p-4 rounded-xl flex items-start gap-3 shadow-xs">
                    <span className="text-base">✨</span>
                    <div className="text-xs">
                      <p className="font-extrabold text-secondary">CẤU TRÚC GÓI CỐ ĐỊNH (3 PHÂN KHÚC LỘ TRÌNH)</p>
                      <p className="text-zinc-500 font-medium mt-1">
                        Khi lưu, hệ thống sẽ tự động khởi tạo đồng thời cả 3 phiên bản lộ trình tương ứng với các phân khúc điều trị chuyên sâu dưới đây:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PRESET_TIERS.map((tier) => {
                      let borderClass = 'border-zinc-200 bg-white';
                      let badgeClass = '';
                      if (tier.id === 'basic') {
                        borderClass = 'border-emerald-200 bg-emerald-50/10';
                        badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      } else if (tier.id === 'standard') {
                        borderClass = 'border-teal-200 bg-teal-50/10';
                        badgeClass = 'bg-teal-100 text-teal-800 border-teal-200';
                      } else {
                        borderClass = 'border-amber-200 bg-amber-50/10';
                        badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                      }

                      return (
                        <div
                          key={tier.id}
                          className={`p-3.5 border rounded-xl flex flex-col justify-between shadow-xs ${borderClass}`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}>
                                {tier.name}
                              </span>
                              <span className="text-[9px] font-bold text-zinc-400 shrink-0">
                                {tier.weeks} TUẦN
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-650 font-extrabold block leading-none">
                              {tier.sessions} buổi điều trị
                            </span>
                          </div>
                          
                          <div className="mt-4 pt-2 border-t border-zinc-100/50">
                            <span className="text-[9px] font-bold text-zinc-400 block uppercase leading-none">Giá trọn gói</span>
                            <span className="text-xs font-black text-secondary mt-1 block leading-tight">
                              {currencyFormatter.format(tier.totalPrice)}đ
                            </span>
                            <span className="text-[9.5px] text-zinc-450 block leading-none mt-1 font-bold">
                              ({currencyFormatter.format(tier.pricePerSession)}đ/buổi)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Hướng dẫn và Đơn giá cho GÓI TỰ CHỌN */
                <div className="bg-amber-50/30 border border-amber-250 p-4 rounded-xl flex items-start gap-3 shadow-xs animate-fade-in">
                  <span className="text-base">💡</span>
                  <div className="text-xs">
                    <p className="font-extrabold text-secondary">CẤU HÌNH GÓI TỰ CHỌN (CUSTOM PACKAGE)</p>
                    <p className="text-zinc-550 font-medium mt-1 leading-relaxed">
                      Hệ thống tự động áp dụng đơn giá cơ bản: <span className="text-primary font-black">599.000đ / 1 buổi trị liệu</span> (lấy từ phân khúc Basic). 
                      Tổng giá tiền sẽ tự động cập nhật khi bạn nhập số lượng buổi mong muốn bên dưới.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-zinc-150/40">
                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Phân loại gói *</label>
                  <select 
                    {...register('loai_goi')}
                    disabled={!!(editingPackage && editingPackage.id)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-xs shadow-sm ${
                      editingPackage && editingPackage.id
                        ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed font-bold'
                        : 'bg-white border-zinc-200 text-secondary'
                    }`}
                  >
                    <option value="lieu_trinh">GÓI CỐ ĐỊNH</option>
                    <option value="linh_dong">GÓI TỰ CHỌN</option>
                  </select>
                </div>

                {/* Ô TỔNG SỐ BUỔI (Chỉ hiện khi là Gói tự chọn) */}
                {watchLoaiGoi === 'linh_dong' ? (
                  <div className="animate-slide-up">
                    <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Tổng số buổi tự chọn *</label>
                    <input 
                      type="number"
                      {...register('tong_so_buoi', { valueAsNumber: true })} 
                      placeholder="10"
                      className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-secondary shadow-sm text-sm"
                    />
                    {errors.tong_so_buoi && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.tong_so_buoi.message}</span>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Số lượng phân khúc</label>
                    <input 
                      type="text"
                      readOnly
                      value="3 phân khúc (Basic, Std, Its)"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-400 cursor-not-allowed font-bold text-xs shadow-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Số DV tối đa / Buổi *</label>
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

                {/* GIÁ TRỌN GÓI (Chỉ hiện và tự động tính khi là Gói tự chọn) */}
                {watchLoaiGoi === 'linh_dong' && (
                  <div className="sm:col-span-3 bg-zinc-50 p-4 border border-zinc-200 rounded-xl flex items-center justify-between shadow-inner animate-slide-up">
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Giá bán trọn gói tự chọn</span>
                      <span className="text-[10px] text-zinc-500 font-bold block mt-0.5">
                        ({watchTongSoBuoi} buổi * 599.000đ/buổi)
                      </span>
                    </div>
                    <span className="text-lg font-black text-primary select-all">
                      {currencyFormatter.format(watchGiaTien)}đ
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* TRẠNG THÁI HOẠT ĐỘNG */}
            <div 
              className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 flex items-center justify-between cursor-pointer shadow-sm hover:border-zinc-300 transition-all"
              onClick={() => setValue('trang_thai', watchStatus === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong')}
            >
              <div>
                <h5 className="font-bold text-secondary text-xs uppercase tracking-wider">Trạng thái gói</h5>
                <p className="text-[10px] text-zinc-400 mt-0.5">Quyết định hiển thị và khả năng sử dụng gói trên toàn hệ thống</p>
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
              {editingPackage && editingPackage.id ? 'CẬP NHẬT CẤU HÌNH' : 'TẠO GÓI MỚI'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
