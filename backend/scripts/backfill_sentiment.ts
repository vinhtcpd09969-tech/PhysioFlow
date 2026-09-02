import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Free tier Gemini: 5 request/phút — nghỉ 13s giữa các lần gọi để không bị 429.
const DELAY_MS = 13000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // Import động sau khi dotenv.config() đã chạy, để SentimentService đọc đúng GEMINI_API_KEY.
  const { SentimentService } = await import('../src/services/ai/ai.sentiment');

  console.log('Bắt đầu backfill phân tích cảm xúc cho các đánh giá cũ...');

  const serviceReviews = await prisma.danh_gia.findMany({
    where: { loai_danh_gia: 'GOI_DICH_VU', cam_xuc: null, nhan_xet: { not: null } }
  });
  console.log(`Tìm thấy ${serviceReviews.length} đánh giá dịch vụ chưa phân loại.`);
  for (const review of serviceReviews) {
    if (!review.nhan_xet || !review.nhan_xet.trim()) continue;
    const result = await SentimentService.classify(review.nhan_xet, review.so_sao);
    if (result) {
      await prisma.danh_gia.update({
        where: { id: review.id },
        data: { cam_xuc: result.sentiment, do_tin_cay: result.confidence, ly_do_cam_xuc: result.reason, de_xuat_hanh_dong: result.suggestedAction, de_xuat_phan_hoi: result.draftReply }
      });
      console.log(`  OK   đánh giá dịch vụ ${review.id} -> ${result.sentiment}`);
    } else {
      console.log(`  SKIP đánh giá dịch vụ ${review.id} (lỗi gọi API hoặc hết quota)`);
    }
    await sleep(DELAY_MS);
  }

  const staffReviews = await prisma.danh_gia.findMany({
    where: { loai_danh_gia: 'NHAN_SU', cam_xuc: null, nhan_xet: { not: null } }
  });
  console.log(`Tìm thấy ${staffReviews.length} đánh giá nhân sự chưa phân loại.`);
  for (const review of staffReviews) {
    if (!review.nhan_xet || !review.nhan_xet.trim()) continue;
    const result = await SentimentService.classify(review.nhan_xet, review.so_sao);
    if (result) {
      await prisma.danh_gia.update({
        where: { id: review.id },
        data: { cam_xuc: result.sentiment, do_tin_cay: result.confidence, ly_do_cam_xuc: result.reason, de_xuat_hanh_dong: result.suggestedAction, de_xuat_phan_hoi: result.draftReply }
      });
      console.log(`  OK   đánh giá nhân sự ${review.id} -> ${result.sentiment}`);
    } else {
      console.log(`  SKIP đánh giá nhân sự ${review.id} (lỗi gọi API hoặc hết quota)`);
    }
    await sleep(DELAY_MS);
  }

  console.log('Hoàn tất backfill.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
