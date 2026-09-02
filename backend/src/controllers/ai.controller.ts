import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { ChatHistoryService } from '../services/ai/ai.history';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/appError';

export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  const { message, history, sessionId } = req.body;

  if (!message || typeof message !== 'string') {
    throw new BadRequestError('Nội dung tin nhắn không được để trống');
  }

  const chatHistory = Array.isArray(history) ? history : [];
  const khachHangId = Number(req.user?.vai_tro_id) === 1 && req.user?.id ? String(req.user.id) : null;

  let result;
  try {
    result = await AIService.generateChatResponse(message, chatHistory, khachHangId);
  } catch (error: any) {
    throw new BadRequestError(error.message || 'Lỗi xử lý phản hồi từ AI');
  }

  res.json({
    success: true,
    reply: result.reply,
    suggestBooking: result.suggestBooking,
    bookingActionType: result.bookingActionType ?? null,
    showPackagePrompt: result.showPackagePrompt ?? false,
    suggestedQuestions: result.suggestedQuestions ?? []
  });

  // Lưu lịch sử chat vào Postgres không đồng bộ, không chặn phản hồi đã trả về khách.
  if (sessionId && typeof sessionId === 'string') {
    ChatHistoryService.appendTurn(sessionId, khachHangId, message, result.reply).catch(err => {
      console.error('Lỗi lưu lịch sử chat AI:', err);
    });
  }
});

export const getChatHistory = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = String(req.query.sessionId || '');
  if (!sessionId) {
    throw new BadRequestError('Thiếu sessionId');
  }

  const messages = await ChatHistoryService.getHistory(sessionId);
  res.json({ success: true, messages });
});

// Lịch sử chat của khách đang đăng nhập, gộp mọi phiên cũ — cho phép khung chat khôi phục hội
// thoại dù khách mở trên trình duyệt/thiết bị khác với lúc chat trước đó (khác với getChatHistory
// ở trên vốn chỉ tra theo sessionId của riêng 1 tab trình duyệt).
export const getMyChatHistory = asyncHandler(async (req: Request, res: Response) => {
  const messages = await ChatHistoryService.getHistoryByCustomer(String(req.user!.id));
  res.json({ success: true, messages });
});

export const analyzeVasProgression = asyncHandler(async (req: Request, res: Response) => {
  const { patientName, serviceName, symptoms, vasPoints } = req.body;

  if (!Array.isArray(vasPoints) || vasPoints.length === 0) {
    throw new BadRequestError('Dữ liệu điểm VAS không hợp lệ hoặc đang trống');
  }

  const result = await AIService.analyzeVasProgression({
    patientName,
    serviceName,
    symptoms,
    vasPoints
  });

  res.json({
    success: true,
    data: result
  });
});
