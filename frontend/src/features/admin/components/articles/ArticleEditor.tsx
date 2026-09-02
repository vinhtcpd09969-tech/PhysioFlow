import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, X, Search } from 'lucide-react';
import { createArticle, updateArticle } from '../../api/admin.api';
import { ImageUploadZone } from '../upload/ImageUploadZone';
import { RichTextEditor } from './RichTextEditor';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

const DANH_MUC_OPTIONS = [
  { value: 'suc_khoe', label: 'Sức khỏe' },
  { value: 'dieu_tri', label: 'Điều trị' },
  { value: 'tin_tuc', label: 'Tin tức' },
  { value: 'khuyen_mai', label: 'Khuyến mãi' },
  { value: 'phong_ngua', label: 'Phòng ngừa' }
];

const articleFormSchema = z.object({
  tieu_de: z.string().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề tối đa 200 ký tự'),
  slug: z.string().optional().nullable(),
  tom_tat: z.string().min(1, 'Tóm tắt là bắt buộc'),
  noi_dung: z.string().min(1, 'Nội dung là bắt buộc'),
  anh_bia: z.string().optional().nullable(),
  danh_muc: z.enum(['suc_khoe', 'dieu_tri', 'tin_tuc', 'khuyen_mai', 'phong_ngua'], { message: 'Vui lòng chọn danh mục' }),
  trang_thai: z.enum(['nhap', 'xuat_ban', 'ngung_su_dung']).default('nhap'),
  meta_title: z.string().max(70, 'Tiêu đề SEO tối đa 70 ký tự').optional().nullable(),
  meta_description: z.string().max(160, 'Mô tả SEO tối đa 160 ký tự').optional().nullable(),
  meta_keywords: z.string().max(255, 'Từ khóa SEO tối đa 255 ký tự').optional().nullable()
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

function slugifyPreview(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface ArticleEditorProps {
  editingArticle?: any;
  onClose: () => void;
  onSuccess: (savedStatus?: string) => void;
}

export default function ArticleEditor({ editingArticle, onClose, onSuccess }: ArticleEditorProps) {
  const isEdit = !!(editingArticle && editingArticle.id);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema) as any,
    defaultValues: editingArticle ? {
      tieu_de: editingArticle.tieu_de || '',
      slug: editingArticle.slug || '',
      tom_tat: editingArticle.tom_tat || '',
      noi_dung: editingArticle.noi_dung || '',
      anh_bia: editingArticle.anh_bia || null,
      danh_muc: editingArticle.danh_muc || 'tin_tuc',
      trang_thai: editingArticle.trang_thai || 'nhap',
      meta_title: editingArticle.meta_title || '',
      meta_description: editingArticle.meta_description || '',
      meta_keywords: editingArticle.meta_keywords || ''
    } : {
      tieu_de: '',
      slug: '',
      tom_tat: '',
      noi_dung: '',
      anh_bia: null,
      danh_muc: 'tin_tuc',
      trang_thai: 'nhap',
      meta_title: '',
      meta_description: '',
      meta_keywords: ''
    }
  });

  const watchTieuDe = watch('tieu_de') || '';
  const watchSlug = watch('slug') || '';
  const watchMetaTitle = watch('meta_title') || '';
  const watchMetaDescription = watch('meta_description') || '';
  const watchMetaKeywords = watch('meta_keywords') || '';

  const slugPreview = watchSlug ? slugifyPreview(watchSlug) : slugifyPreview(watchTieuDe);

  const executeSave = async (data: ArticleFormValues, publish: boolean) => {
    const targetStatus = publish ? 'xuat_ban' : 'nhap';
    const payload = {
      ...data,
      trang_thai: targetStatus,
      ...(publish ? { ngay_dang: new Date().toISOString() } : {}),
      ngay_cap_nhat: new Date().toISOString()
    };
    try {
      if (isEdit) {
        await updateArticle(editingArticle.id, payload);
        toast.success(publish ? `Đã xuất bản bài viết "${data.tieu_de}" thành công!` : `Cập nhật bài viết "${data.tieu_de}" thành công!`);
      } else {
        await createArticle(payload);
        toast.success(publish ? `Xuất bản bài viết "${data.tieu_de}" thành công!` : `Tạo bài viết "${data.tieu_de}" thành công!`);
      }
      onSuccess(targetStatus);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu bài viết');
    }
  };

  const onSubmit = (publish: boolean) => (data: ArticleFormValues) => {
    setConfirmConfig({
      isOpen: true,
      title: publish ? 'Xuất bản bài viết' : 'Lưu bản nháp',
      message: publish
        ? `Bạn có chắc chắn muốn xuất bản bài viết "${data.tieu_de}" ra trang public không?`
        : `Lưu bản nháp bài viết "${data.tieu_de}"?`,
      onConfirm: () => {
        setConfirmConfig(null);
        executeSave(data, publish);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-xl max-w-6xl mx-auto w-full text-secondary dark:text-zinc-100 overflow-visible transition-colors">
      <div className="px-8 py-6 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/90 rounded-t-[22px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-teal-600/10 dark:bg-teal-400/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading tracking-wide uppercase text-slate-800 dark:text-zinc-100">
              {isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium">Nội dung sức khỏe, tin tức và khuyến mãi cho khách hàng</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs border border-zinc-200 dark:border-zinc-700 hover:border-rose-200 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm transition-all flex items-center gap-1.5 font-bold cursor-pointer">
          <X className="w-3.5 h-3.5" /> Đóng
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-zinc-800">
        {/* MAIN CONTENT (2/3) */}
        <div className="col-span-2 p-8 space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Tiêu đề *</label>
              <input {...register('tieu_de')} placeholder="Nhập tiêu đề bài viết..." className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all font-semibold text-secondary dark:text-zinc-100 text-sm placeholder-zinc-300 dark:placeholder-zinc-500 shadow-sm" />
              {errors.tieu_de && <span className="text-rose-500 text-[10px] mt-1 block">{errors.tieu_de.message}</span>}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Slug (URL)</label>
              <input {...register('slug')} placeholder={slugifyPreview(watchTieuDe) || 'tu-dong-sinh-tu-tieu-de'} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all font-mono text-secondary dark:text-zinc-100 text-xs placeholder-zinc-300 dark:placeholder-zinc-500 shadow-sm" />
              <p className="text-[9px] text-slate-400 dark:text-zinc-400 mt-1">/tin-tuc/{slugPreview || '...'}</p>
            </div>

             <div className="sm:col-span-2">
              <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Danh mục *</label>
              <select {...register('danh_muc')} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-secondary dark:text-zinc-100 font-semibold text-xs shadow-sm cursor-pointer">
                {DANH_MUC_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="dark:bg-zinc-800 dark:text-zinc-100">{opt.label}</option>)}
              </select>
              {errors.danh_muc && <span className="text-rose-500 text-[10px] mt-1 block">{errors.danh_muc.message}</span>}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Tóm tắt *</label>
              <textarea {...register('tom_tat')} rows={2} placeholder="Tóm tắt ngắn hiển thị ở trang danh sách..." className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-secondary dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none font-medium text-xs shadow-sm" />
              {errors.tom_tat && <span className="text-rose-500 text-[10px] mt-1 block">{errors.tom_tat.message}</span>}
            </div>
          </div>

          <div>
            <Controller
              name="anh_bia"
              control={control}
              render={({ field }) => (
                <ImageUploadZone value={field.value ?? null} onChange={field.onChange} uploadType="blog" label="Ảnh bìa bài viết" />
              )}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Nội dung *</label>
            <Controller
              name="noi_dung"
              control={control}
              render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />}
            />
            {errors.noi_dung && <span className="text-rose-500 text-[10px] mt-1 block">{errors.noi_dung.message}</span>}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-355 text-slate-500 dark:text-zinc-300 font-bold rounded-xl shadow-sm transition-all text-xs cursor-pointer">
              Hủy bỏ
            </button>
            <button type="button" onClick={handleSubmit(onSubmit(false))} className="flex-1 px-5 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold rounded-xl shadow-sm transition-all text-xs cursor-pointer">
              Lưu nháp
            </button>
            <button type="button" onClick={handleSubmit(onSubmit(true))} className="flex-1 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer">
              <Sparkles className="w-4 h-4" /> Xuất bản
            </button>
          </div>
        </div>

        {/* SEO SIDEBAR (1/3) */}
        <div className="col-span-1 p-8 bg-slate-50/40 dark:bg-zinc-900/60 space-y-6 lg:rounded-r-[22px] lg:rounded-tl-none rounded-b-[22px]">
          <h4 className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> Tối ưu SEO
          </h4>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">Tiêu đề SEO</label>
              <span className={`text-[9px] font-bold ${watchMetaTitle.length > 70 ? 'text-rose-500' : 'text-slate-400 dark:text-zinc-500'}`}>{watchMetaTitle.length}/70</span>
            </div>
            <input {...register('meta_title')} placeholder={watchTieuDe || 'Tiêu đề hiển thị trên Google'} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-secondary dark:text-zinc-100 text-xs shadow-sm placeholder-zinc-300 dark:placeholder-zinc-500" />
            {errors.meta_title && <span className="text-rose-500 text-[10px] mt-1 block">{errors.meta_title.message}</span>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">Mô tả SEO</label>
              <span className={`text-[9px] font-bold ${watchMetaDescription.length > 160 ? 'text-rose-500' : 'text-slate-400 dark:text-zinc-500'}`}>{watchMetaDescription.length}/160</span>
            </div>
            <textarea {...register('meta_description')} rows={3} placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm Google..." className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-secondary dark:text-zinc-100 resize-none text-xs shadow-sm placeholder-zinc-400 dark:placeholder-zinc-500" />
            {errors.meta_description && <span className="text-rose-500 text-[10px] mt-1 block">{errors.meta_description.message}</span>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">Từ khóa SEO</label>
              <span className={`text-[9px] font-bold ${watchMetaKeywords.length > 255 ? 'text-rose-500' : 'text-slate-400 dark:text-zinc-500'}`}>{watchMetaKeywords.length}/255</span>
            </div>
            <input {...register('meta_keywords')} placeholder="vd: hô hấp, phổi, tập thở cơ hoành" className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-secondary dark:text-zinc-100 text-xs shadow-sm placeholder-zinc-300 dark:placeholder-zinc-500" />
            <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1">Các từ khóa cách nhau bằng dấu phẩy.</p>
            {errors.meta_keywords && <span className="text-rose-500 text-[10px] mt-1 block">{errors.meta_keywords.message}</span>}
          </div>

          {/* Google Search Preview */}
          <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-700 rounded-2xl shadow-sm">
            <p className="text-[9px] text-slate-400 dark:text-zinc-400 uppercase tracking-wider font-bold mb-2">Xem trước trên Google</p>
            <p className="text-[13px] text-[#1a0dab] dark:text-blue-400 font-medium truncate">{watchMetaTitle || watchTieuDe || 'Tiêu đề bài viết'}</p>
            <p className="text-[11px] text-[#006621] dark:text-emerald-400">officecare.vn/tin-tuc/{slugPreview || 'duong-dan-bai-viet'}</p>
            <p className="text-[11px] text-[#545454] dark:text-zinc-300 line-clamp-2 mt-0.5">{watchMetaDescription || 'Mô tả ngắn của bài viết sẽ hiển thị ở đây...'}</p>
          </div>
        </div>
      </div>

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
