import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPackage, updatePackage, getCategories } from '../../api/admin.api';
import { useEffect, useState, useRef } from 'react';
import { UploadCloud, X, Sparkles, Coins, Layers, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

const packageSchema = z.object({
  ten_goi: z.string().min(1, 'Tên gói dịch vụ là bắt buộc'),
  loai_goi: z.enum(['KHAM', 'LE', 'LIEU_TRINH'], { message: 'Vui lòng chọn loại gói' }),
  danh_muc_goi_id: z.string().optional().nullable(),
  quy_trinh: z.string().min(1, 'Quy trình trị liệu là bắt buộc'),
  muc_tieu: z.string().min(1, 'Mục tiêu trị liệu là bắt buộc'),
  tong_so_buoi: z.number().min(1, 'Số buổi phải lớn hơn 0'),
  thoi_luong_phut: z.number().min(1, 'Thời lượng buổi phải lớn hơn 0').default(60),
  don_gia: z.number().min(0, 'Giá bán không hợp lệ'),
  don_gia_theo_buoi: z.number().min(0, 'Giá từng buổi không hợp lệ').optional().nullable(),
  anh_goi: z.string().optional().nullable(),
  trang_thai: z.enum(['hoat_dong', 'tam_ngung']).default('hoat_dong'),
}).refine(data => {
  if (data.loai_goi === 'LIEU_TRINH' && data.don_gia_theo_buoi) {
    const average = data.don_gia / data.tong_so_buoi;
    return data.don_gia_theo_buoi >= average;
  }
  return true;
}, {
  message: "Giá đóng lẻ từng buổi phải lớn hơn hoặc bằng đơn giá trung bình của trọn gói!",
  path: ["don_gia_theo_buoi"]
});

export type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editingPackage?: any;
  existingPackages: any[];
}

export default function PackageModal({ onClose, onSuccess, editingPackage, existingPackages }: PackageModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(editingPackage?.anh_goi || null);
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: editingPackage ? {
      ten_goi: editingPackage.ten_goi || '',
      loai_goi: editingPackage.loai_goi || 'LIEU_TRINH',
      danh_muc_goi_id: editingPackage.danh_muc_goi_id || editingPackage.danh_muc_id || '',
      quy_trinh: editingPackage.quy_trinh || '',
      muc_tieu: editingPackage.muc_tieu || '',
      tong_so_buoi: editingPackage.tong_so_buoi || 10,
      thoi_luong_phut: editingPackage.thoi_luong_phut || editingPackage.thoi_luong_buoi_phut || 60,
      don_gia: typeof editingPackage.don_gia === 'string' ? parseInt(editingPackage.don_gia) : (editingPackage.don_gia || Number(editingPackage.gia_tien) || 0),
      don_gia_theo_buoi: editingPackage.don_gia_theo_buoi ? (typeof editingPackage.don_gia_theo_buoi === 'string' ? parseInt(editingPackage.don_gia_theo_buoi) : editingPackage.don_gia_theo_buoi) : undefined,
      anh_goi: editingPackage.anh_goi || null,
      trang_thai: editingPackage.trang_thai || 'hoat_dong',
    } : {
      trang_thai: 'hoat_dong',
      loai_goi: undefined as any,
      danh_muc_goi_id: '',
      quy_trinh: '',
      muc_tieu: '',
      tong_so_buoi: 12,
      thoi_luong_phut: 60,
      don_gia: 0,
      don_gia_theo_buoi: undefined,
      anh_goi: null,
    }
  });

  const watchLoaiGoi = watch('loai_goi');
  const watchDonGia = watch('don_gia') || 0;
  const watchTongSoBuoi = watch('tong_so_buoi') || 1;
  const isTypeSelected = !!watchLoaiGoi;

  // Calculate average session cost for Lieu Trinh display helpers
  const averageCost = watchLoaiGoi === 'LIEU_TRINH' && watchDonGia > 0 && watchTongSoBuoi > 0
    ? Math.round(watchDonGia / watchTongSoBuoi)
    : 0;

  const prevLoaiGoiRef = useRef<string | undefined>(editingPackage?.loai_goi);

  // Enforce session count defaults when package type changes
  useEffect(() => {
    if (watchLoaiGoi === 'KHAM' || watchLoaiGoi === 'LE') {
      setValue('tong_so_buoi', 1);
      setValue('don_gia_theo_buoi', null);
    } else if (watchLoaiGoi === 'LIEU_TRINH') {
      const currentBuoi = watch('tong_so_buoi');
      if (!currentBuoi || currentBuoi <= 1) {
        setValue('tong_so_buoi', 12);
      }
    }
    
    // Reset selected category only if it's a manual change of package type
    if (prevLoaiGoiRef.current !== undefined && prevLoaiGoiRef.current !== watchLoaiGoi) {
      setValue('danh_muc_goi_id', '');
    }
    
    prevLoaiGoiRef.current = watchLoaiGoi;
  }, [watchLoaiGoi, setValue, watch]);

  // Load categories on open
  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await getCategories();
        const loadedCats = res.data || [];
        setCategories(loadedCats);
        
        // Sync selected category ID to form state once categories are populated
        if (editingPackage) {
          const targetId = editingPackage.danh_muc_goi_id || editingPackage.danh_muc_id || '';
          if (targetId) {
            setValue('danh_muc_goi_id', targetId);
          }
        }
      } catch (e) {
        console.error('Error fetching categories inside PackageModal:', e);
      }
    };
    loadCats();
  }, [editingPackage, setValue]);

  // Image Upload helper functions
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng tải lên tệp tin định dạng ảnh (PNG, JPG, JPEG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setValue('anh_goi', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('anh_goi', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executeSave = async (data: PackageFormValues) => {
    try {
      const isEdit = !!(editingPackage && editingPackage.id);
      const don_gia_theo_buoi = data.loai_goi === 'LIEU_TRINH'
        ? (data.don_gia_theo_buoi || averageCost)
        : data.don_gia;

      const payload = {
        ten_goi: data.ten_goi,
        loai_goi: data.loai_goi,
        tong_so_buoi: data.tong_so_buoi,
        thoi_luong_phut: data.thoi_luong_phut,
        don_gia: data.don_gia,
        don_gia_theo_buoi,
        anh_goi: data.anh_goi || null,
        danh_muc_goi_id: data.danh_muc_goi_id || null,
        quy_trinh: data.quy_trinh || '',
        muc_tieu: data.muc_tieu || '',
        trang_thai: 'hoat_dong',
      };

      if (isEdit) {
        await updatePackage(editingPackage.id, payload);
        toast.success(`Cập nhật gói dịch vụ "${data.ten_goi}" thành công!`);
      } else {
        await createPackage(payload);
        toast.success(`Tạo mới gói dịch vụ "${data.ten_goi}" thành công!`);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving package:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu gói dịch vụ.';
      toast.error(msg);
    }
  };

  const onSubmit = async (data: PackageFormValues) => {
    const isEdit = !!(editingPackage && editingPackage.id);

    // Validate unique name
    const inputName = data.ten_goi.trim().toLowerCase();
    const isDuplicate = existingPackages.some((pkg: any) => {
      if (isEdit && pkg.id === editingPackage.id) return false;
      return pkg.ten_goi.trim().toLowerCase() === inputName;
    });

    if (isDuplicate) {
      setError('ten_goi', {
        type: 'manual',
        message: `Tên gói "${data.ten_goi}" đã tồn tại trên hệ thống. Vui lòng nhập tên khác!`
      });
      return;
    }

    // Determine smart confirmation message
    let confirmMsg = isEdit 
      ? `Bạn có chắc chắn muốn lưu các thay đổi cho gói dịch vụ "${data.ten_goi}" không?`
      : `Bạn có chắc chắn muốn tạo mới gói dịch vụ "${data.ten_goi}" không?`;

    if (isEdit) {
      const originalCatId = editingPackage.danh_muc_goi_id || editingPackage.danh_muc_id;
      const selectedCatId = data.danh_muc_goi_id;

      if (String(originalCatId || '') !== String(selectedCatId || '')) {
        const oldCatObj = categories.find(c => String(c.id) === String(originalCatId));
        const newCatObj = categories.find(c => String(c.id) === String(selectedCatId));
        const tenDanhMucCu = oldCatObj ? oldCatObj.ten_danh_muc : 'Không phân loại';
        const tenDanhMucMoi = newCatObj ? newCatObj.ten_danh_muc : 'Không phân loại';
        
        confirmMsg = `Bạn có chắc chắn muốn thay đổi danh mục dịch vụ từ "${tenDanhMucCu}" sang "${tenDanhMucMoi}" cho gói "${data.ten_goi}" không?`;
      }
    }

    setConfirmConfig({
      isOpen: true,
      title: isEdit ? 'Cập nhật Gói dịch vụ' : 'Tạo mới Gói dịch vụ',
      message: confirmMsg,
      onConfirm: () => {
        setConfirmConfig(null);
        executeSave(data);
      }
    });
  };

  // Helper colors for badges
  const typeLabels = {
    KHAM: { text: 'Gói Khám Lâm Sàng', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-100/50' },
    LE: { text: 'Gói Lẻ Trị Liệu', color: 'bg-teal-50 border-teal-200 text-teal-700 shadow-teal-100/50' },
    LIEU_TRINH: { text: 'Gói Liệu Trình Chuyên Sâu', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100/50' }
  };

  return (
    <div className="bg-white border border-zinc-150 rounded-3xl shadow-xl max-w-5xl mx-auto w-full text-secondary overflow-hidden backdrop-blur-md bg-white/95 animate-fade-in">
        
        {/* Modal Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-zinc-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-emerald-600/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-heading tracking-wide uppercase text-slate-800">
                {editingPackage && editingPackage.id ? `[CHỈNH SỬA] CẤU HÌNH GÓI` : `[THIẾT KẾ MỚI] GÓI DỊCH VỤ`}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Bảng cấu hình gói chuyên khoa & phân tích doanh thu</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-zinc-500 hover:text-rose-600 text-xs border border-zinc-200 hover:border-rose-200 px-4 py-2 rounded-xl bg-white shadow-sm transition-all hover:bg-rose-50/30 flex items-center gap-1.5 font-bold"
          >
            <X className="w-3.5 h-3.5" /> [ Đóng ]
          </button>
        </div>

        {/* Form Body - Two-Column Layout */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 min-h-[460px]">
            
            {/* LEFT PANEL (33% width) - Interactive Image Upload & Dynamic Guide */}
            <div className="col-span-1 p-8 bg-slate-50/40 flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ảnh Đại Diện Gói *</h4>
                  
                  {/* Drag and Drop Zone */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${
                      dragActive 
                        ? 'border-emerald-600 bg-emerald-50/30 shadow-lg scale-98' 
                        : imagePreview 
                          ? 'border-zinc-200 hover:border-emerald-600' 
                          : 'border-zinc-250 bg-white hover:bg-slate-50/50 hover:border-zinc-350'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden" 
                    />
                    
                    {imagePreview ? (
                      <div className="group relative w-full h-full">
                        <img 
                          src={imagePreview} 
                          alt="Gói Dịch Vụ" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                          >
                            Đổi Ảnh
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-2 pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-[11px] font-bold text-slate-600">Tải ảnh đại diện gói</p>
                        <p className="text-[9px] text-slate-400">Kéo thả hoặc nhấn để duyệt file ảnh</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge Type Indicator */}
                {isTypeSelected && (
                  <div className={`p-4 border rounded-2xl shadow-sm transition-all duration-300 animate-fade-in ${typeLabels[watchLoaiGoi].color}`}>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 shrink-0" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider font-bold opacity-60">Phân Phối Nghiệp Vụ</p>
                        <p className="text-xs font-black">{typeLabels[watchLoaiGoi].text}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic pricing/operational guide in place of active switch */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1.5 shrink-0 animate-ping"></span>
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                    {watchLoaiGoi === 'KHAM' 
                      ? 'Hướng dẫn Khám Lâm Sàng' 
                      : watchLoaiGoi === 'LE' 
                        ? 'Hướng dẫn Gói Lẻ' 
                        : watchLoaiGoi === 'LIEU_TRINH'
                          ? 'Chiến lược Giá Liệu Trình'
                          : 'Cấu hình y khoa'}
                  </p>
                  <p className="text-[9px] text-emerald-600 font-semibold mt-0.5 leading-relaxed">
                    {watchLoaiGoi === 'KHAM' && (
                      'Dành riêng cho Bác sĩ thực hiện kiểm tra tầm vận động, chẩn đoán ban đầu và lên phác đồ điều trị cho bệnh nhân.'
                    )}
                    {watchLoaiGoi === 'LE' && (
                      'Áp dụng cho các dịch vụ đơn lẻ vãng lai. Khách hàng sử dụng buổi nào sẽ thực hiện thanh toán buổi đó.'
                    )}
                    {watchLoaiGoi === 'LIEU_TRINH' && (
                      watchDonGia > 0 && watch('don_gia_theo_buoi') && Number(watch('don_gia_theo_buoi')) > averageCost
                        ? `Mua trọn gói tiết kiệm ${(Number(watch('don_gia_theo_buoi')) - averageCost).toLocaleString()}đ mỗi buổi (Tổng tiết kiệm ${((Number(watch('don_gia_theo_buoi')) - averageCost) * watchTongSoBuoi).toLocaleString()}đ cho cả liệu trình) so với đóng lẻ từng buổi.`
                        : 'Cung cấp mức giá ưu đãi khi mua trọn gói dài hạn so với hình thức thanh toán lẻ từng buổi.'
                    )}
                    {!watchLoaiGoi && 'Vui lòng chọn loại gói dịch vụ ở cột bên phải để xem thông số và định vị nghiệp vụ tương ứng.'}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL (67% width) - Core Fields & Intelligent Pricing */}
            <div className="col-span-2 p-8 flex flex-col justify-between">
              
              <div className="space-y-6 text-xs">
                
                {/* Hộp I: Phân loại gói - LOẠI GÓI CHỌN ĐẦU TIÊN (Luôn tương tác được) */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Hộp I: Định vị phân loại gói
                  </h4>
                  
                  <div>
                    <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Loại gói dịch vụ *</label>
                    <select 
                      {...register('loai_goi')}
                      className="w-full px-4 py-3 bg-white border border-zinc-250 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm cursor-pointer relative z-30 font-heading"
                    >
                      <option value="">-- CHỌN LOẠI GÓI DỊCH VỤ --</option>
                      <option value="KHAM">Gói Khám Lâm Sàng (Bác sĩ chuẩn đoán bệnh)</option>
                      <option value="LE">Gói Lẻ (Trị liệu đơn buổi nhanh gọn)</option>
                      <option value="LIEU_TRINH">Gói Liệu Trình (Phương án điều trị dài hạn)</option>
                    </select>
                    {errors.loai_goi && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.loai_goi.message}</span>
                    )}
                  </div>
                </div>

                {/* PHẦN CÁC TRƯỜNG DỮ LIỆU CÒN LẠI - BỊ PHỦ KÍNH NẾU CHƯA CHỌN LOẠI GÓI */}
                <div className="relative">
                  {!isTypeSelected && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 text-center select-none rounded-2xl border border-zinc-150 shadow-inner">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center mb-2 shadow-md shadow-indigo-100">
                        <Lock className="w-4 h-4 text-indigo-600 animate-bounce" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông số chi tiết đang khóa</h4>
                      <p className="text-[10px] text-slate-500 font-medium max-w-xs mt-1">
                        Vui lòng chọn loại gói dịch vụ ở trên để nhập thông tin chi tiết phác đồ và tài chính.
                      </p>
                    </div>
                  )}

                  <div className={`space-y-6 transition-all duration-300 ${!isTypeSelected ? 'opacity-25 pointer-events-none' : ''}`}>
                    {/* Hộp I (phần còn lại): Tên gói, Danh mục và Mô tả */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tên gói dịch vụ *</label>
                          <input 
                            {...register('ten_goi')} 
                            placeholder="Nhập tên gói dịch vụ..."
                            className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary text-sm placeholder-zinc-300 shadow-sm"
                          />
                          {errors.ten_goi && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.ten_goi.message}</span>
                          )}
                        </div>

                        {/* DANH MỤC CHUYÊN KHOA LỌC GÓI */}
                        <div>
                          <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Danh mục chuyên khoa gói *</label>
                          <select 
                            {...register('danh_muc_goi_id')}
                            className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm cursor-pointer"
                          >
                            <option value="">-- CHỌN DANH MỤC CHUYÊN KHOA --</option>
                            {categories
                              .filter(c => c.loai_goi_ap_dung === watchLoaiGoi)
                              .map(c => (
                                <option key={c.id} value={c.id}>{c.ten_danh_muc.toUpperCase()}</option>
                              ))}
                          </select>
                          {errors.danh_muc_goi_id && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.danh_muc_goi_id.message}</span>
                          )}
                        </div>
                      </div>



                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Quy trình trị liệu *</label>
                          <textarea 
                            {...register('quy_trinh')} 
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all text-secondary placeholder-zinc-400 resize-none font-medium text-xs shadow-sm"
                            placeholder="Nhập chi tiết các bước trong quy trình trị liệu chuẩn y khoa..."
                          ></textarea>
                          {errors.quy_trinh && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.quy_trinh.message}</span>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Mục tiêu trị liệu *</label>
                          <textarea 
                            {...register('muc_tieu')} 
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all text-secondary placeholder-zinc-400 resize-none font-medium text-xs shadow-sm"
                            placeholder="Nhập mục tiêu và lợi ích cam kết đạt được sau khi kết thúc đợt trị liệu..."
                          ></textarea>
                          {errors.muc_tieu && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.muc_tieu.message}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hộp II: Vận hành & Tài chính */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                      <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" /> Hộp II: Cấu hình vận hành & Kinh tế học
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tổng số buổi *</label>
                          <div className="relative">
                            <input 
                              type="number"
                              {...register('tong_so_buoi', { valueAsNumber: true })} 
                              placeholder="12"
                              readOnly={watchLoaiGoi === 'KHAM' || watchLoaiGoi === 'LE'}
                              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all font-semibold text-sm shadow-sm ${
                                watchLoaiGoi === 'KHAM' || watchLoaiGoi === 'LE'
                                  ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed'
                                  : 'bg-white border-zinc-200 text-secondary focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                              }`}
                            />
                            {watchLoaiGoi === 'LIEU_TRINH' && (
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">Buổi</span>
                            )}
                          </div>
                          {errors.tong_so_buoi && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.tong_so_buoi.message}</span>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Thời lượng mỗi buổi (Phút) *</label>
                          <div className="relative">
                            <input 
                              type="number"
                              {...register('thoi_luong_phut', { valueAsNumber: true })} 
                              placeholder="60"
                              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">Phút</span>
                          </div>
                          {errors.thoi_luong_phut && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.thoi_luong_phut.message}</span>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                            {watchLoaiGoi === 'LIEU_TRINH' ? 'Giá bán trọn gói (VND) *' : 'Giá bán dịch vụ (VND) *'}
                          </label>
                          <div className="relative">
                            <input 
                              type="number"
                              {...register('don_gia', { valueAsNumber: true })} 
                              placeholder="6000000"
                              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm pr-12"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">VND</span>
                          </div>
                          {errors.don_gia && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.don_gia.message}</span>
                          )}
                        </div>

                        {/* DYNAMIC FIELD: Display ONLY for LIEU_TRINH */}
                        {watchLoaiGoi === 'LIEU_TRINH' && (
                          <div className="animate-slide-down">
                            <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Giá thanh toán lẻ từng buổi (VND) *</label>
                            <div className="relative">
                              <input 
                                type="number"
                                {...register('don_gia_theo_buoi', { valueAsNumber: true })} 
                                placeholder={averageCost ? String(Math.round(averageCost * 1.25)) : "60000"}
                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm pr-12"
                              />
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">VND</span>
                            </div>
                            {errors.don_gia_theo_buoi ? (
                              <span className="text-rose-500 text-[10px] mt-1 block">{errors.don_gia_theo_buoi.message}</span>
                            ) : (
                              averageCost > 0 && (
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                  Đơn giá trung bình trọn gói: <span className="font-bold text-emerald-600">{averageCost.toLocaleString()}đ / buổi</span>.
                                </p>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons inside content panel */}
              <div className="pt-8 flex gap-4 mt-6">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 px-5 py-3 bg-white border border-zinc-200 hover:border-zinc-355 text-slate-500 hover:text-slate-800 font-bold rounded-xl shadow-sm transition-all text-xs"
                >
                  HỦY BỎ
                </button>
                <button 
                  type="submit" 
                  disabled={!isTypeSelected}
                  className={`flex-1 px-5 py-3 font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 ${
                    !isTypeSelected
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> {editingPackage && editingPackage.id ? 'CẬP NHẬT CẤU HÌNH GÓI' : 'TẠO GÓI MỚI NGAY'}
                </button>
              </div>

            </div>

          </div>
        </form>

        <ConfirmDialog
          isOpen={!!confirmConfig?.isOpen}
          title={confirmConfig?.title || ''}
          message={confirmConfig?.message || ''}
          onConfirm={confirmConfig?.onConfirm || (() => {})}
          onCancel={() => setConfirmConfig(null)}
        />
      </div>
  );
}
