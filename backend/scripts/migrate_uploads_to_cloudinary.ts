// Migration MỘT LẦN: đẩy toàn bộ ảnh đang nằm cục bộ ở backend/uploads/ lên Cloudinary, rồi cập
// nhật lại các cột path trong DB (bai_viet.anh_bia, goi_dich_vu.anh_goi/anh_gallery,
// nguoi_dung.anh_dai_dien) trỏ sang URL Cloudinary mới — chạy 1 lần duy nhất trước khi deploy,
// sau đó có thể xóa file này (đã có tiền lệ dọn script 1 lần trong scripts/ sau khi chạy xong).
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
    } else if (entry.isFile()) {
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
    const relative = path.relative(UPLOADS_ROOT, filePath).split(path.sep).join('/'); // subDir/file.webp
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

  console.log(`\nĐã upload xong ${pathMap.size}/${files.length} file. Cập nhật lại DB...`);

  let updatedCount = 0;

  // bai_viet.anh_bia
  const { rows: baiViet } = await pool.query(`SELECT id, anh_bia FROM bai_viet WHERE anh_bia IS NOT NULL`);
  for (const row of baiViet) {
    const newUrl = pathMap.get(row.anh_bia);
    if (newUrl) {
      await pool.query(`UPDATE bai_viet SET anh_bia = $1 WHERE id = $2`, [newUrl, row.id]);
      updatedCount++;
    }
  }

  // goi_dich_vu.anh_goi + anh_gallery (array)
  const { rows: goiDichVu } = await pool.query(`SELECT id, anh_goi, anh_gallery FROM goi_dich_vu`);
  for (const row of goiDichVu) {
    let changed = false;
    let newAnhGoi = row.anh_goi;
    if (row.anh_goi && pathMap.has(row.anh_goi)) {
      newAnhGoi = pathMap.get(row.anh_goi);
      changed = true;
    }
    const newGallery = (row.anh_gallery || []).map((p: string) => {
      if (pathMap.has(p)) { changed = true; return pathMap.get(p); }
      return p;
    });
    if (changed) {
      await pool.query(
        `UPDATE goi_dich_vu SET anh_goi = $1, anh_gallery = $2 WHERE id = $3`,
        [newAnhGoi, newGallery, row.id]
      );
      updatedCount++;
    }
  }

  // nguoi_dung.anh_dai_dien
  const { rows: nguoiDung } = await pool.query(`SELECT id, anh_dai_dien FROM nguoi_dung WHERE anh_dai_dien IS NOT NULL`);
  for (const row of nguoiDung) {
    const newUrl = pathMap.get(row.anh_dai_dien);
    if (newUrl) {
      await pool.query(`UPDATE nguoi_dung SET anh_dai_dien = $1 WHERE id = $2`, [newUrl, row.id]);
      updatedCount++;
    }
  }

  console.log(`\nHoàn tất: ${updatedCount} dòng dữ liệu đã trỏ sang URL Cloudinary mới.`);
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration thất bại:', err);
  process.exit(1);
});
