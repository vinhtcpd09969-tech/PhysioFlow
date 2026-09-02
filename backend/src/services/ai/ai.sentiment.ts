import { GoogleGenerativeAI, SchemaType, ResponseSchema } from '@google/generative-ai';
import prisma from '../../config/prisma';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `
Bạn là chuyên viên phân tích trải nghiệm khách hàng cho Trung tâm Vật lý trị liệu & Phục hồi chức năng OfficeCare.
Nhiệm vụ: đọc nội dung đánh giá (và số sao nếu có) rồi:
1. Phân loại cảm xúc thành đúng 1 trong 3 nhãn:
   - POSITIVE: khách hài lòng, khen ngợi dịch vụ/nhân sự/chuyên viên/kỹ thuật viên.
   - NEGATIVE: khách phàn nàn, không hài lòng, phản ánh vấn đề.
   - NEUTRAL: đánh giá trung lập, không rõ cảm xúc, hoặc nội dung quá ngắn/thiếu thông tin để kết luận.
2. Giải thích ngắn gọn vì sao chọn nhãn đó (trường "reason").
3. Đề xuất 1 hành động cụ thể, thực tế cho Lễ tân/Quản lý trung tâm dựa trên đúng nội dung đánh giá (trường "suggested_action"):
   - Nếu NEGATIVE: nêu rõ nên làm gì để khắc phục/xin lỗi khách (vd liên hệ trực tiếp, tặng ưu đãi, chuyển vấn đề tới chuyên viên/KTV liên quan).
   - Nếu POSITIVE: gợi ý cách phát huy/tận dụng (vd mời khách đánh giá công khai, khen thưởng nhân sự liên quan) — không bắt buộc phải hành động nếu không cần thiết.
   - Nếu NEUTRAL: có thể trả lời ngắn rằng chưa cần hành động đặc biệt, trừ khi nội dung có gợi ý cụ thể.
   Viết bằng tiếng Việt, tối đa 2 câu, đi thẳng vào hành động, không lặp lại nguyên văn đánh giá.
4. Soạn sẵn 1 câu trả lời công khai, có thể gửi thẳng cho khách hàng ngay (trường "draft_reply"):
   - ⚠️ QUY TẮC BẮT BUỘC VỀ TỪ NGỮ:
     + TUYỆT ĐỐI KHÔNG DÙNG TỪ "phòng khám" hay "bác sĩ" trong bất kỳ câu trả lời nào.
     + Luôn xưng danh là "OfficeCare" hoặc "Trung tâm OfficeCare" hoặc "Đội ngũ OfficeCare", gọi khách là "Anh/Chị".
     + Khi nhắc đến nhân viên chuyên môn: dùng "Chuyên viên", "Chuyên viên Vật lý trị liệu", "Kỹ thuật viên" (tuyệt đối KHÔNG dùng "bác sĩ").
   - Nếu POSITIVE: cảm ơn khách chân thành, ghi nhận cụ thể điều khách khen (nếu có).
   - Nếu NEGATIVE: xin lỗi vì trải nghiệm chưa trọn vẹn, ghi nhận vấn đề khách nêu, cam kết cải thiện; KHÔNG hứa hẹn cụ thể về tiền bạc/hoàn tiền/bồi thường (việc đó do con người quyết định) — có thể mời khách liên hệ hotline/quầy lễ tân để được hỗ trợ trực tiếp.
   - Nếu NEUTRAL: cảm ơn khách đã phản hồi, mời khách chia sẻ thêm nếu cần hỗ trợ.
   Độ dài 2-4 câu, giọng văn chuyên nghiệp, ân cần và ấm áp, không lặp lại nguyên văn đánh giá của khách.
Trọng tâm: Trả lời đúng theo schema JSON đã cho.
`;

const responseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sentiment: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
      description: 'Nhãn cảm xúc của đánh giá.'
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Độ tin cậy của việc phân loại, từ 0 đến 1.'
    },
    reason: {
      type: SchemaType.STRING,
      description: 'Giải thích ngắn gọn bằng tiếng Việt vì sao chọn nhãn cảm xúc này.'
    },
    suggested_action: {
      type: SchemaType.STRING,
      description: 'Đề xuất hành động cụ thể cho Lễ tân/Quản lý trung tâm dựa trên đánh giá này, bằng tiếng Việt.'
    },
    draft_reply: {
      type: SchemaType.STRING,
      description: 'Câu trả lời công khai soạn sẵn, có thể gửi thẳng cho khách hàng, bằng tiếng Việt (tuyệt đối không dùng từ phòng khám, bác sĩ).'
    }
  },
  required: ['sentiment', 'confidence', 'reason', 'suggested_action', 'draft_reply']
};

export interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  reason: string;
  suggestedAction: string;
  draftReply: string;
}

/**
 * AI SENTIMENT SERVICE
 * Phân tích cảm xúc đánh giá khách hàng & tự động soạn thảo phản hồi bằng Gemini AI
 */
export class SentimentService {
  static async classify(reviewText: string, soSao: number): Promise<SentimentResult | null> {
    const text = (reviewText || '').trim();

    // 1. Trường hợp khách chỉ chấm sao (không để lại lời bình text)
    if (!text) {
      if (soSao >= 4) {
        return {
          sentiment: 'POSITIVE',
          confidence: 0.95,
          reason: `Khách hàng đánh giá ${soSao}/5 sao mức độ hài lòng (không để lại nhận xét bằng lời).`,
          suggestedAction: 'Gửi lời cảm ơn chân thành đến khách hàng đã tin tưởng và đồng hành cùng trung tâm.',
          draftReply: `OfficeCare chân thành cảm ơn Anh/Chị đã dành thời gian đánh giá ${soSao} sao và tin tưởng đồng hành cùng trung tâm!`
        };
      } else if (soSao === 3) {
        return {
          sentiment: 'NEUTRAL',
          confidence: 0.85,
          reason: `Khách hàng đánh giá 3/5 sao mức độ trung tính (không để lại nhận xét bằng lời).`,
          suggestedAction: 'Chủ động liên hệ khảo sát thêm ý kiến để nâng cao chất lượng dịch vụ của trung tâm.',
          draftReply: 'OfficeCare cảm ơn Anh/Chị đã gửi phản hồi. Đội ngũ chúng tôi luôn sẵn sàng lắng nghe và hoàn thiện dịch vụ tốt hơn mỗi ngày!'
        };
      } else {
        return {
          sentiment: 'NEGATIVE',
          confidence: 0.9,
          reason: `Khách hàng đánh giá ${soSao}/5 sao mức độ chưa hài lòng (không để lại nhận xét bằng lời).`,
          suggestedAction: 'Chủ động liên hệ tìm hiểu nguyên nhân chưa hài lòng để hỗ trợ chăm sóc kịp thời.',
          draftReply: 'OfficeCare thành thật xin lỗi Anh/Chị vì trải nghiệm chưa trọn vẹn. Đội ngũ trung tâm rất mong được liên hệ hỗ trợ và chăm sóc chu đáo hơn!'
        };
      }
    }

    if (!apiKey) {
      return null;
    }

    // 2. Trường hợp có nội dung nhận xét: Gọi Gemini AI phân tích sâu
    const tryModel = async (modelName: string) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const prompt = `Số sao khách chấm: ${soSao}/5\nNội dung đánh giá: "${text}"`;
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());

      if (parsed.sentiment !== 'POSITIVE' && parsed.sentiment !== 'NEGATIVE' && parsed.sentiment !== 'NEUTRAL') {
        return null;
      }

      return {
        sentiment: parsed.sentiment as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        reason: typeof parsed.reason === 'string' ? parsed.reason : '',
        suggestedAction: typeof parsed.suggested_action === 'string' ? parsed.suggested_action : '',
        draftReply: typeof parsed.draft_reply === 'string' ? parsed.draft_reply : ''
      };
    };

    try {
      return await tryModel('gemini-3.6-flash');
    } catch (err1) {
      try {
        return await tryModel('gemini-3.1-flash-lite');
      } catch (error) {
        console.error('Lỗi khi phân tích cảm xúc đánh giá:', error);
        return null;
      }
    }
  }

  static async classifyAndSaveReview(reviewId: string, reviewText: string, soSao: number): Promise<SentimentResult | null> {
    const result = await this.classify(reviewText, soSao);
    if (!result) return null;

    await prisma.danh_gia.update({
      where: { id: reviewId },
      data: {
        cam_xuc: result.sentiment,
        do_tin_cay: result.confidence,
        ly_do_cam_xuc: result.reason,
        de_xuat_hanh_dong: result.suggestedAction,
        de_xuat_phan_hoi: result.draftReply
      }
    });
    return result;
  }

  static async classifyAndSaveServiceReview(reviewId: string, reviewText: string, soSao: number): Promise<SentimentResult | null> {
    return this.classifyAndSaveReview(reviewId, reviewText, soSao);
  }

  static async classifyAndSaveStaffReview(reviewId: string, reviewText: string, soSao: number): Promise<SentimentResult | null> {
    return this.classifyAndSaveReview(reviewId, reviewText, soSao);
  }
}

export default SentimentService;
