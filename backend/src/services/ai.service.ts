import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';
import { buildSystemInstruction } from './ai/ai.prompts';
import { AI_TOOLS, executeAiTool, toolXemThongTinCaNhan } from './ai/ai.tools';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface AIChatResult {
  reply: string;
  suggestBooking: boolean;
  bookingActionType?: 'customer_records' | 'booking_page' | null;
  showPackagePrompt?: boolean;
  suggestedQuestions?: string[];
}

function parseAIJsonReply(text: string): {
  reply: string;
  suggest_booking: boolean;
  booking_action_type?: 'customer_records' | 'booking_page' | null;
  show_package_prompt?: boolean;
  suggested_questions?: string[];
} {
  const tryParse = (s: string): any => {
    try {
      const obj = JSON.parse(s);
      if (obj && typeof obj.reply === 'string') return obj;
    } catch {
      // ignore
    }
    return null;
  };

  let parsed = tryParse(text.trim());
  if (!parsed) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) parsed = tryParse(match[0]);
  }
  if (!parsed) {
    return {
      reply: text.trim() || 'Dạ OfficeCare rất vui được hỗ trợ bạn. Bạn có thể mô tả chi tiết hơn về vùng đau hoặc nhu cầu chăm sóc sức khỏe của mình không ạ?',
      suggest_booking: false,
      booking_action_type: null,
      show_package_prompt: false,
      suggested_questions: ['Lượng giá chức năng ban đầu gồm những gì?', 'Các gói trị liệu cổ vai gáy', 'Thời gian mở cửa và đặt lịch']
    };
  }
  return {
    reply: parsed.reply,
    suggest_booking: parsed.suggest_booking === true,
    booking_action_type: parsed.booking_action_type || (parsed.suggest_booking ? 'booking_page' : null),
    show_package_prompt: parsed.show_package_prompt === true,
    suggested_questions: Array.isArray(parsed.suggested_questions) ? parsed.suggested_questions.slice(0, 3) : undefined
  };
}

let cachedSystemInstruction: { content: string; expiresAt: number } | null = null;

async function getCachedSystemInstruction(): Promise<string> {
  const now = Date.now();
  if (cachedSystemInstruction && cachedSystemInstruction.expiresAt > now) {
    return cachedSystemInstruction.content;
  }
  const content = await buildSystemInstruction();
  cachedSystemInstruction = {
    content,
    expiresAt: now + 5 * 60 * 1000 // Cache 5 phút
  };
  return content;
}

/**
 * AI SERVICE (Trợ lý AI & Phân tích Lâm sàng Thông minh)
 */
export class AIService {
  static async generateChatResponse(
    message: string,
    history: { role: 'user' | 'model'; content: string }[],
    khachHangId: string | null = null
  ): Promise<AIChatResult> {
    const trimmedLower = message.trim().toLowerCase();

    // 1. Fast-path cho các câu chào mở đầu -> Phản hồi siêu tốc < 5ms
    const GREETINGS = ['xin chào', 'chào bạn', 'chào bot', 'chào em', 'chào ad', 'chào bác sĩ', 'chào chuyên viên', 'hello', 'hi', 'hey', 'alo'];
    if (history.length === 0 && GREETINGS.includes(trimmedLower)) {
      return {
        reply: 'Xin chào! Tôi là **Trợ lý Chuyên viên AI** của Trung tâm Phục hồi Chức năng OfficeCare. Tôi có thể hỗ trợ bạn phân tích các triệu chứng đau mỏi cơ xương khớp (cổ vai gáy, thắt lưng, cột sống...), tư vấn phác đồ và giải đáp toàn bộ thông tin tại trung tâm.',
        suggestBooking: false,
        bookingActionType: null,
        showPackagePrompt: false,
        suggestedQuestions: [
          '💆 Trị mỏi cổ vai gáy văn phòng',
          '🧘 Phục hồi đau thắt lưng & cột sống',
          '⚡ Công nghệ Laser & Sóng xung kích',
          '📅 Đặt lịch lượng giá 1:1'
        ]
      };
    }

    if (!apiKey) {
      return {
        reply: 'Hệ thống AI hiện chưa được cấu hình API Key. Quý khách vui lòng liên hệ hotline OfficeCare để được tư vấn trực tiếp.',
        suggestBooking: false,
        bookingActionType: null,
        showPackagePrompt: false,
        suggestedQuestions: ['Đặt lịch lượng giá 1:1', 'Xem bảng giá dịch vụ', 'Chính sách hoàn tiền']
      };
    }

    try {
      // 2. Lấy System Instruction từ cache bộ nhớ
      let systemInstruction = await getCachedSystemInstruction();

      // 3. Pre-fetch thông tin hồ sơ nếu user đã đăng nhập -> Cung cấp sẵn trong prompt
      if (khachHangId) {
        try {
          const userSnapshot = await toolXemThongTinCaNhan(khachHangId);
          systemInstruction += `\n\n📌 THÔNG TIN HỒ SƠ KHÁCH HÀNG HIỆN TẠI (ĐÃ ĐĂNG NHẬP):\n${JSON.stringify(userSnapshot, null, 2)}\n(Ghi chú: Dữ liệu hồ sơ khách hàng đã có sẵn ở trên, hãy dùng trực tiếp để trả lời ngay về số buổi còn lại hoặc chuyên viên/KTV phụ trách mà KHÔNG CẦN gọi tool xem_thong_tin_ca_nhan lần nữa).`;
        } catch (e) {
          console.error('Error pre-fetching user context:', e);
        }
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite',
        systemInstruction,
        tools: [{ functionDeclarations: AI_TOOLS }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 750,
        }
      });

      // Lọc và làm sạch lịch sử chat để đảm bảo luân phiên nghiêm ngặt user -> model -> user
      const cleanHistory: Content[] = [];
      let lastRole: 'user' | 'model' | null = null;

      for (const item of history) {
        if (!item.content || item.content.startsWith('⚠️')) continue;
        const role = item.role === 'user' ? 'user' : 'model';
        if (role === lastRole) {
          if (cleanHistory.length > 0) {
            const currentParts = cleanHistory[cleanHistory.length - 1].parts;
            if (currentParts.length > 0 && 'text' in currentParts[0]) {
              currentParts[0].text += '\n' + item.content;
            }
          }
        } else {
          cleanHistory.push({
            role,
            parts: [{ text: item.content }]
          });
          lastRole = role;
        }
      }

      while (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
        cleanHistory.shift();
      }

      const contents: Content[] = [...cleanHistory];
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        const lastPart = contents[contents.length - 1].parts[0];
        if ('text' in lastPart) {
          lastPart.text += '\n' + message;
        }
      } else {
        contents.push({ role: 'user', parts: [{ text: message }] });
      }

      let response = (await model.generateContent({ contents })).response;

      // Vòng lặp tool-calling tối đa 3 vòng
      for (let round = 0; round < 3; round++) {
        const calls = response.functionCalls();
        if (!calls || calls.length === 0) break;

        const modelTurnParts = response.candidates?.[0]?.content?.parts ?? calls.map((call) => ({ functionCall: call }));
        contents.push({ role: 'model', parts: modelTurnParts });

        const functionResponseParts: Part[] = await Promise.all(
          calls.map(async (call) => ({
            functionResponse: {
              name: call.name,
              response: await executeAiTool(call.name, call.args, khachHangId),
            },
          }))
        );
        contents.push({ role: 'user', parts: functionResponseParts });

        response = (await model.generateContent({ contents })).response;
      }

      if (response.functionCalls()?.length) {
        const modelTurnParts = response.candidates?.[0]?.content?.parts ?? [];
        contents.push({ role: 'model', parts: modelTurnParts });
        contents.push({
          role: 'user',
          parts: [{ text: 'Hãy chốt câu trả lời cuối cùng ngay bây giờ dựa trên thông tin đã có, đúng định dạng JSON yêu cầu.' }],
        });
        response = (await model.generateContent({ contents, tools: undefined })).response;
      }

      const parsed = parseAIJsonReply(response.text());
      return {
        reply: parsed.reply,
        suggestBooking: parsed.suggest_booking === true,
        bookingActionType: parsed.booking_action_type || null,
        showPackagePrompt: parsed.show_package_prompt === true,
        suggestedQuestions: parsed.suggested_questions || ['Gợi ý gói liệu trình phù hợp', 'Đặt lịch lượng giá 1:1', 'Chính sách hoàn tiền']
      };
    } catch (error: any) {
      console.error('Lỗi khi gọi Gemini API:', error);

      // Fallback Engine
      const lowerMsg = message.toLowerCase();
      
      let fallbackReply = 'Dạ OfficeCare rất thấu hiểu tình trạng đau mỏi và căng cứng cơ mà bạn đang gặp phải. Để phục hồi hiệu quả và an toàn, bạn nên đặt lịch Lượng giá chức năng ban đầu 1:1 với Chuyên viên PHCN để được đo tầm vận động và kiểm tra chuyên sâu nhé.';
      let suggestBooking = true;
      let bookingActionType: 'customer_records' | 'booking_page' | null = 'booking_page';
      let showPackagePrompt = true;
      let suggestedQuestions = ['Gợi ý gói liệu trình phù hợp', 'Chi phí buổi lượng giá ban đầu', 'Đội ngũ chuyên viên PHCN uy tín'];

      if (lowerMsg.includes('mấy buổi') || lowerMsg.includes('gói của tôi') || lowerMsg.includes('phụ trách gói')) {
        if (!khachHangId) {
          fallbackReply = 'Dạ bạn vui lòng đăng nhập tài khoản để OfficeCare có thể kiểm tra chính xác số buổi còn lại và chuyên viên/KTV phụ trách trong hồ sơ điều trị của bạn nhé.';
          suggestBooking = false;
          bookingActionType = null;
        } else {
          fallbackReply = 'Dạ bạn có thể truy cập trực tiếp vào mục **Hồ sơ điều trị** trên thanh menu để xem chi tiết tiến trình từng buổi đã thực hiện, tên KTV phụ trách từng ca và bấm nút **Đặt lịch buổi tiếp theo** cho gói liệu trình của mình nhé!';
          suggestBooking = true;
          bookingActionType = 'customer_records';
        }
        suggestedQuestions = ['Xem hồ sơ điều trị', 'Kiểm tra lịch hẹn sắp tới', 'Liên hệ lễ tân'];
      } else if (lowerMsg.includes('chuyên viên') || lowerMsg.includes('kỹ thuật viên') || lowerMsg.includes('uy tín') || lowerMsg.includes('bác sĩ')) {
        fallbackReply = 'Dạ tại OfficeCare, 100% đội ngũ Chuyên viên tư vấn và Kỹ thuật viên (KTV) đều được đào tạo bài bản chuyên ngành PHCN, giàu kinh nghiệm lâm sàng về cơ xương khớp văn phòng và cột sống. Khách hàng sẽ được lượng giá 1:1 và đồng hành tận tâm trong suốt liệu trình.';
        suggestedQuestions = ['Đặt lịch lượng giá 1:1', 'Các dịch vụ công nghệ cao', 'Thời gian làm việc'];
      } else if (lowerMsg.includes('gói') || lowerMsg.includes('giá') || lowerMsg.includes('liệu trình') || lowerMsg.includes('chi phí')) {
        fallbackReply = 'Dạ OfficeCare có các gói trị liệu chuyên sâu cho Cổ Vai Gáy, Thắt Lưng Cột Sống, Thoát Vị Đĩa Đệm và Phục Hồi Thần Kinh Tọa kết hợp Laser công suất cao 30W, Sóng xung kích Shockwave và Giường kéo giãn DTS. Mức giá dao động linh hoạt từ 250.000đ/buổi lẻ đến các gói 10 - 20 buổi tiết kiệm.';
        showPackagePrompt = true;
        suggestBooking = true;
        bookingActionType = 'booking_page';
        suggestedQuestions = ['Gợi ý gói liệu trình phù hợp', 'Chính sách trả góp từng buổi', 'Đặt lịch ngay'];
      } else if (lowerMsg.includes('hoàn tiền') || lowerMsg.includes('hủy') || lowerMsg.includes('đổi lịch') || lowerMsg.includes('chính sách')) {
        fallbackReply = 'Dạ OfficeCare cam kết chính sách minh bạch 100%:\n- **Hủy lịch:** Tự hủy online trong 60 phút sau khi đặt.\n- **Đổi lịch:** Tự đổi online trước mốc 50% thời gian buổi diễn ra.\n- **Hoàn tiền:** Trong vòng 7 ngày kể từ khi mua gói (trừ số buổi đã làm theo giá lẻ + 10% phí quản lý).\n- **Trả góp:** Linh hoạt thanh toán 100% hoặc trả theo từng buổi.';
        suggestedQuestions = ['Đặt lịch hẹn mới', 'Kiểm tra lịch trống hôm nay', 'Tư vấn gói trị liệu'];
      }

      return {
        reply: fallbackReply,
        suggestBooking,
        bookingActionType,
        showPackagePrompt,
        suggestedQuestions
      };
    }
  }

  static async analyzeVasProgression(data: {
    patientName?: string;
    serviceName?: string;
    symptoms?: string;
    vasPoints: Array<{ buoi: number; truoc?: number | null; sau?: number | null }>;
  }): Promise<{
    danh_gia_chung: string;
    muc_do_dap_ung: 'tot' | 'trung_binh' | 'can_theo_doi';
    nhan_xet_chuyen_mon: string;
    khuyen_nghi_cong_thai_hoc: string;
  }> {
    const { patientName, serviceName, symptoms, vasPoints } = data;

    const firstPt = vasPoints && vasPoints.length > 0 ? vasPoints[0] : null;
    const lastPt = vasPoints && vasPoints.length > 0 ? vasPoints[vasPoints.length - 1] : null;
    const vasStart = Number(firstPt?.truoc ?? firstPt?.sau ?? 6);
    const vasCurrent = Number(lastPt?.sau ?? lastPt?.truoc ?? 3);
    const totalDiff = vasStart - vasCurrent;

    const fallbackResult = {
      danh_gia_chung: totalDiff >= 3 ? 'Tiến trình thuyên giảm vượt mong đợi' : totalDiff > 0 ? 'Thuyên giảm tích cực qua các buổi' : 'Tiến trình điều trị duy trì ổn định',
      muc_do_dap_ung: (totalDiff >= 3 ? 'tot' : totalDiff > 0 ? 'tot' : 'trung_binh') as 'tot' | 'trung_binh' | 'can_theo_doi',
      nhan_xet_chuyen_mon: `Khách hàng ghi nhận mức đau giảm ${Math.max(0, totalDiff)} điểm kể từ buổi đầu tiên. Cơ thể đáp ứng tốt với các kỹ thuật trị liệu và bài tập phục hồi chức năng.`,
      khuyen_nghi_cong_thai_hoc: 'Duy trì tư thế ngồi làm việc công thái học, thực hiện giãn cơ cổ vai gáy 2-3 phút sau mỗi 45-60 phút ngồi máy tính.'
    };

    if (!apiKey) {
      return fallbackResult;
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 300,
        },
      });

      const prompt = `Bạn là Trợ lý Chuyên viên Phục Hồi Chức Năng (PHCN) của OfficeCare.
Hãy phân tích tiến trình điểm đau VAS (thang đo 0-10) qua các buổi trị liệu của khách hàng:
- Khách hàng: ${patientName || 'Khách hàng'}
- Gói dịch vụ: ${serviceName || 'Trị liệu phục hồi chức năng'}
- Triệu chứng ban đầu: ${symptoms || 'Đau mỏi cơ xương khớp văn phòng'}
- Chuỗi điểm VAS qua các buổi:
${vasPoints.map(p => `  + Buổi #${p.buoi}: Trước ca = ${p.truoc ?? 'N/A'}/10, Sau ca = ${p.sau ?? 'N/A'}/10`).join('\n')}

Hãy đánh giá khoa học, súc tích và trả lời ĐÚNG định dạng JSON sau (không kèm markdown \`\`\`, không kèm bất kỳ từ nào ngoài JSON):
{
  "danh_gia_chung": "<Tiêu đề ngắn 4-8 từ>",
  "muc_do_dap_ung": "tot" hoặc "trung_binh" hoặc "can_theo_doi",
  "nhan_xet_chuyen_mon": "<Nhận xét y khoa 1-2 câu về mức độ giảm đau và hiệu quả phác đồ>",
  "khuyen_nghi_cong_thai_hoc": "<1 lời khuyên thực tế ngắn gọn về tư thế làm việc/giãn cơ tại nhà>"
}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();

      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.danh_gia_chung && parsed.nhan_xet_chuyen_mon) {
          return {
            danh_gia_chung: parsed.danh_gia_chung,
            muc_do_dap_ung: ['tot', 'trung_binh', 'can_theo_doi'].includes(parsed.muc_do_dap_ung) ? parsed.muc_do_dap_ung : 'tot',
            nhan_xet_chuyen_mon: parsed.nhan_xet_chuyen_mon,
            khuyen_nghi_cong_thai_hoc: parsed.khuyen_nghi_cong_thai_hoc || fallbackResult.khuyen_nghi_cong_thai_hoc
          };
        }
      }

      return fallbackResult;
    } catch (err) {
      console.error('Lỗi phân tích AI VAS:', err);
      return fallbackResult;
    }
  }
}

export default AIService;
