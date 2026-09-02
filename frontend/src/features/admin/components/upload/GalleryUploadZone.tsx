import { useRef, useState } from 'react';
import { UploadCloud, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../api/admin.api';
import { resolveImageUrl } from '../../../../utils/imageUrl';

interface GalleryUploadZoneProps {
  value: string[];
  onChange: (urls: string[]) => void;
  uploadType: 'blog' | 'package' | 'specialist';
  label?: string;
  maxImages?: number;
}

export function GalleryUploadZone({
  value,
  onChange,
  uploadType,
  label = 'Hình ảnh gallery',
  maxImages = 8
}: GalleryUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      toast.error(`Chỉ được thêm tối đa ${maxImages} ảnh`);
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          toast.error(`Bỏ qua "${file.name}" — không phải tệp ảnh`);
          continue;
        }
        const res = await uploadImage(file, uploadType);
        uploaded.push(res.data.url);
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, idx) => idx !== index));
  };

  return (
    <div>
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label} ({value.length}/{maxImages})</h4>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, idx) => (
          <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-slate-50">
            <img src={resolveImageUrl(url)} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full size-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Xóa ảnh này"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-zinc-250 bg-white hover:bg-slate-50/50 hover:border-zinc-350 flex flex-col items-center justify-center cursor-pointer transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && e.target.files.length > 0 && handleFiles(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            ) : (
              <>
                <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                <p className="text-[9px] font-bold text-slate-500">Thêm ảnh</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
