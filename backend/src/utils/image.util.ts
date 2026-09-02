import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';

const RESIZE_PRESETS: Record<string, number> = {
  blog: 1200,
  package: 1000,
  specialist: 800
};

// cloudinary.config() tự đọc biến môi trường CLOUDINARY_URL nếu có — không cần gọi tay ở đây.

export async function processAndSaveImage(buffer: Buffer, subDir: string): Promise<string> {
  const maxWidth = RESIZE_PRESETS[subDir] || 1200;

  // Resize/nén trước bằng sharp (giữ nguyên logic cũ) rồi mới đẩy lên Cloudinary — tránh phụ
  // thuộc vào giới hạn transform phía Cloudinary và giữ dung lượng upload nhỏ.
  const optimized = await sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const publicId = randomUUID();
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `officecare/${subDir}`, public_id: publicId, resource_type: 'image', format: 'webp' },
      (error, uploadResult) => {
        if (error || !uploadResult) return reject(error || new Error('Upload Cloudinary thất bại'));
        resolve(uploadResult);
      }
    );
    uploadStream.end(optimized);
  });

  return result.secure_url;
}
