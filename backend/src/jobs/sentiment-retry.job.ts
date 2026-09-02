import prisma from '../config/prisma';
import { SentimentService } from '../services/ai/ai.sentiment';

// Cho phép quét tối đa 50 đánh giá mỗi lượt để xử lý trọn vẹn toàn bộ danh sách tồn đọng
const MAX_ITEMS_PER_RUN = 50;
const DELAY_BETWEEN_CALLS_MS = 1500;
const SCAN_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 tiếng/lượt

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runSentimentRetryScan = async () => {
  try {
    const pending = await prisma.danh_gia.findMany({
      where: { cam_xuc: null },
      orderBy: { ngay_cap_nhat: 'asc' },
      take: MAX_ITEMS_PER_RUN,
    });

    if (pending.length === 0) return;

    console.log(`[Sentiment Retry Job] Thử phân tích lại ${pending.length} đánh giá chưa có cảm xúc AI...`);

    for (let i = 0; i < pending.length; i++) {
      const review = pending[i];
      const result = await SentimentService.classify(review.nhan_xet || '', review.so_sao);

      if (!result) {
        console.log('[Sentiment Retry Job] Gọi AI thất bại, dừng lượt quét, sẽ tự thử lại vào lượt sau.');
        break;
      }

      await prisma.danh_gia.update({
        where: { id: review.id },
        data: {
          cam_xuc: result.sentiment,
          do_tin_cay: result.confidence,
          ly_do_cam_xuc: result.reason,
          de_xuat_hanh_dong: result.suggestedAction,
          de_xuat_phan_hoi: result.draftReply,
        },
      });
      console.log(`[Sentiment Retry Job] OK đánh giá ${review.id} -> ${result.sentiment}`);

      if (review.nhan_xet && review.nhan_xet.trim() && i < pending.length - 1) {
        await sleep(DELAY_BETWEEN_CALLS_MS);
      }
    }
  } catch (error) {
    console.error('[Sentiment Retry Job] Lỗi khi quét đánh giá chờ phân tích cảm xúc:', error);
  }
};

export const initSentimentRetryJob = () => {
  console.log('🤖 Chức năng tự động thử lại phân tích cảm xúc đánh giá (Native Interval Scheduler) đã khởi động!');

  // Tự động quét 1 lượt sau 5 giây khi server khởi động để xử lý các đánh giá tồn đọng
  setTimeout(runSentimentRetryScan, 5000);

  // Tiếp tục quét định kỳ
  setInterval(runSentimentRetryScan, SCAN_INTERVAL_MS);
};
