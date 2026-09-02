import { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../api/admin.api';
import { resolveImageUrl } from '../../../../utils/imageUrl';

interface ImageUploadZoneProps {
  value: string | null;
  onChange: (url: string | null) => void;
  uploadType: 'blog' | 'package' | 'specialist';
  aspectClass?: string;
  label?: string;
}

export function ImageUploadZone({
  value,
  onChange,
  uploadType,
  aspectClass = 'aspect-[16/9]',
  label = 'Ảnh bìa'
}: ImageUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng tải lên tệp tin định dạng ảnh (PNG, JPG, JPEG, WEBP)');
      return;
    }
    try {
      setIsUploading(true);
      const res = await uploadImage(file, uploadType);
      onChange(res.data.url);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const removeImage = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const previewSrc = value ? resolveImageUrl(value) : null;

  return (
    <div>
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</h4>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative w-full ${aspectClass} rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${
          dragActive
            ? 'border-teal-500 bg-teal-50/30 shadow-lg scale-[0.98]'
            : previewSrc
              ? 'border-zinc-200 hover:border-teal-500'
              : 'border-zinc-250 bg-white hover:bg-slate-50/50 hover:border-zinc-350'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          accept="image/*"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
            <p className="text-[10px] font-bold text-slate-500">Đang tải ảnh lên...</p>
          </div>
        ) : previewSrc ? (
          <div className="group relative w-full h-full">
            <img src={previewSrc} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow transition-all"
              >
                Đổi ảnh
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(); }}
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
            <p className="text-[11px] font-bold text-slate-600">Tải ảnh lên</p>
            <p className="text-[9px] text-slate-400">Kéo thả hoặc nhấn để duyệt file ảnh</p>
          </div>
        )}
      </div>
    </div>
  );
}
