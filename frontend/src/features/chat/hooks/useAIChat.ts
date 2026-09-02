import { useState, useEffect } from 'react';
import { sendChatMessage, getMyChatHistory } from '../api/chat.api';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  suggestBooking?: boolean;
  bookingActionType?: 'customer_records' | 'booking_page';
  showPackagePrompt?: boolean;
  suggestedQuestions?: string[];
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Lấy thông tin user hiện tại từ authStore để phân biệt tài khoản khi lưu LocalStorage
  const user = useAuthStore((state) => state.user);
  const storageKey = user ? `officecare_ai_chat_${user.id}` : 'officecare_ai_chat_guest';

  // Session id bền vững trong phiên trình duyệt
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('officecare_ai_chat_session_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('officecare_ai_chat_session_id', id);
    }
    return id;
  });

  const getWelcomeMessage = (): ChatMessage => ({
    id: 'welcome',
    role: 'model',
    content: 'Xin chào! Tôi là Trợ lý Chuyên viên AI của Trung tâm Phục hồi Chức năng OfficeCare. Tôi có thể hỗ trợ bạn phân tích các triệu chứng đau mỏi cơ xương khớp (cổ vai gáy, thắt lưng, cột sống...), tư vấn phác đồ và giải đáp toàn bộ thông tin tại trung tâm.',
    timestamp: Date.now(),
    suggestedQuestions: [
      '💆 Trị mỏi cổ vai gáy văn phòng',
      '🧘 Phục hồi đau thắt lưng & cột sống',
      '⚡ Công nghệ Laser & Sóng xung kích',
      '📅 Đặt lịch lượng giá 1:1'
    ]
  });

  // Nạp lịch sử chat tương ứng với storageKey của tài khoản đang đăng nhập
  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
          return;
        } catch (e) {
          console.error('Lỗi phân tích lịch sử chat:', e);
        }
      }

      if (user?.vai_tro_id === 1) {
        try {
          const res = await getMyChatHistory();
          const dbMessages = res.data.messages || [];
          if (!cancelled && dbMessages.length > 0) {
            const restored: ChatMessage[] = dbMessages.map((m, idx) => ({
              id: `db-${idx}`,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at).getTime(),
            }));
            setMessages(restored);
            localStorage.setItem(storageKey, JSON.stringify(restored));
            return;
          }
        } catch (e) {
          console.error('Lỗi khôi phục lịch sử chat từ máy chủ:', e);
        }
      }

      if (cancelled) return;
      const welcome = getWelcomeMessage();
      setMessages([welcome]);
      localStorage.setItem(storageKey, JSON.stringify([welcome]));
    };

    loadHistory();
    return () => { cancelled = true; };
  }, [storageKey, user?.vai_tro_id]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));

    setLoading(true);

    try {
      // Giới hạn chỉ gửi tối đa 8 tin nhắn gần nhất để tối ưu hóa tokens
      const contextHistory = updatedMessages
        .slice(-8)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await sendChatMessage({
        message: userMsg.content,
        history: contextHistory.slice(0, -1),
        sessionId,
      });

      const replyMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: response.data.reply,
        timestamp: Date.now(),
        suggestBooking: response.data.suggestBooking === true,
        bookingActionType: response.data.bookingActionType || (response.data.suggestBooking ? 'booking_page' : undefined),
        showPackagePrompt: response.data.showPackagePrompt === true,
        suggestedQuestions: response.data.suggestedQuestions || []
      };

      const finalMessages = [...updatedMessages, replyMsg];
      setMessages(finalMessages);
      localStorage.setItem(storageKey, JSON.stringify(finalMessages));
    } catch (error: any) {
      console.error('Lỗi khi kết nối AI:', error);
      const errMsg = error.response?.data?.message || 'Hệ thống đang bận. Vui lòng thử lại sau ít phút hoặc liên hệ hotline OfficeCare.';
      toast.error(errMsg);

      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: `⚠️ ${errMsg}`,
        timestamp: Date.now(),
        suggestedQuestions: ['Đặt lịch lượng giá 1:1', 'Xem bảng giá dịch vụ', 'Liên hệ hotline']
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const welcome = getWelcomeMessage();
    setMessages([welcome]);
    localStorage.setItem(storageKey, JSON.stringify([welcome]));
  };

  return {
    messages,
    loading,
    isOpen,
    setIsOpen,
    sendMessage,
    clearChat,
  };
}
