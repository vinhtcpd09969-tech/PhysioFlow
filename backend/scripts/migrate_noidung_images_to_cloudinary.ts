// Migration MỘT LẦN (bổ sung): script migrate_uploads_to_cloudinary.ts trước đó chỉ cập nhật
// bai_viet.anh_bia (ảnh bìa), bỏ sót các ảnh <img src="/uploads/blog/..."> chèn TRONG nội dung
// bài viết (bai_viet.noi_dung). Script này re-upload các file blog cục bộ còn sót lên Cloudinary
// rồi thay thế toàn bộ đường dẫn cũ trong noi_dung — chạy 1 lần, sau đó có thể xóa.
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';
import { pool } from '../src/config/db';

const UPLOADS_ROOT = path.join(__dirname, '../uploads');

async function collectFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(full));
    } else if (entry.isFile() && entry.name !== '.gitkeep') {
      files.push(full);
    }
  }
  return files;
}

async function migrate() {
  if (!process.env.CLOUDINARY_URL) {
    console.error('Thiếu CLOUDINARY_URL trong .env — thêm rồi chạy lại.');
    process.exit(1);
  }

  const files = await collectFiles(UPLOADS_ROOT);
  console.log(`Tìm thấy ${files.length} file trong backend/uploads/`);

  const pathMap = new Map<string, string>(); // '/uploads/<subDir>/<file>' -> Cloudinary secure_url

  for (const filePath of files) {
    const relative = path.relative(UPLOADS_ROOT, filePath).split(path.sep).join('/');
    const subDir = relative.split('/')[0];
    const oldUrlPath = `/uploads/${relative}`;

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `officecare/${subDir}`,
        resource_type: 'image'
      });
      pathMap.set(oldUrlPath, result.secure_url);
      console.log(`OK  ${oldUrlPath} -> ${result.secure_url}`);
    } catch (err: any) {
      console.error(`LỖI upload ${oldUrlPath}:`, err.message || err);
    }
  }

  console.log(`\nĐã upload xong ${pathMap.size}/${files.length} file. Quét noi_dung...`);

  const { rows } = await pool.query(`SELECT id, noi_dung FROM bai_viet WHERE noi_dung LIKE '%/uploads/%'`);
  let updatedCount = 0;

  for (const row of rows) {
    let newContent: string = row.noi_dung;
    let changed = false;
    for (const [oldPath, newUrl] of pathMap) {
      if (newContent.includes(oldPath)) {
        newContent = newContent.split(oldPath).join(newUrl);
        changed = true;
      }
    }
    if (changed) {
      await pool.query(`UPDATE bai_viet SET noi_dung = $1 WHERE id = $2`, [newContent, row.id]);
      updatedCount++;
    }
  }

  console.log(`\nHoàn tất: ${updatedCount}/${rows.length} bài viết đã thay ảnh nội dung sang Cloudinary.`);

  const { rows: remain } = await pool.query(`SELECT COUNT(*) FROM bai_viet WHERE noi_dung LIKE '%/uploads/%'`);
  console.log(`Còn sót /uploads/ trong noi_dung: ${remain[0].count} dòng.`);

  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration thất bại:', err);
  process.exit(1);
});
