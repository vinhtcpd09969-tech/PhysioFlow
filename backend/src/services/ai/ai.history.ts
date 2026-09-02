import prisma from '../../config/prisma';

/**
 * AI CHAT HISTORY SERVICE
 * Quản lý phiên chat (phien_chat_ai) và lịch sử hội thoại tin nhắn (tin_nhan_chat_ai)
 */
export class ChatHistoryService {
  static async getOrCreateSession(sessionId: string, khachHangId?: string | null) {
    const existing = await prisma.phien_chat_ai.findUnique({ where: { session_id: sessionId } });
    if (existing) {
      // Khách vãng lai đăng nhập giữa phiên chat -> gắn lại chủ sở hữu cho phiên đã có.
      if (khachHangId && !existing.khach_hang_id) {
        return prisma.phien_chat_ai.update({
          where: { id: existing.id },
          data: { khach_hang_id: khachHangId }
        });
      }
      return existing;
    }
    return prisma.phien_chat_ai.create({
      data: { session_id: sessionId, khach_hang_id: khachHangId || null }
    });
  }

  static async appendTurn(sessionId: string, khachHangId: string | null | undefined, userMessage: string, modelReply: string) {
    const session = await this.getOrCreateSession(sessionId, khachHangId);
    await prisma.tin_nhan_chat_ai.createMany({
      data: [
        { phien_chat_ai_id: session.id, role: 'user', content: userMessage },
        { phien_chat_ai_id: session.id, role: 'model', content: modelReply }
      ]
    });
  }

  static async getHistory(sessionId: string) {
    const session = await prisma.phien_chat_ai.findUnique({
      where: { session_id: sessionId },
      include: { tin_nhan_chat_ai: { orderBy: { created_at: 'asc' } } }
    });
    return session?.tin_nhan_chat_ai ?? [];
  }

  // Lịch sử theo khách hàng (không theo sessionId) — dùng để khôi phục hội thoại khi khách đăng
  // nhập lại trên trình duyệt/thiết bị khác, gộp tất cả phiên chat cũ của khách theo đúng mốc thời
  // gian thực tế.
  static async getHistoryByCustomer(khachHangId: string) {
    return prisma.tin_nhan_chat_ai.findMany({
      where: { phien_chat_ai: { khach_hang_id: khachHangId } },
      orderBy: { created_at: 'asc' }
    });
  }
}

export default ChatHistoryService;
