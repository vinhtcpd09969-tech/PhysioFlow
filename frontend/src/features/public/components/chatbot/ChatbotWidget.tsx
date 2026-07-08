import React, { useState } from 'react';
import { Bot, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatbotWidgetProps {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
}

export default function ChatbotWidget({ isChatOpen, setIsChatOpen }: ChatbotWidgetProps) {
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Chào bạn! Tôi là Bác sĩ AI của Office Care. Bạn đang gặp tình trạng đau mỏi ở vùng nào?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiResponse = "Cảm ơn thông tin của bạn. Tình trạng này nên được bác sĩ chuyên khoa thăm khám trực tiếp để đưa ra phác đồ chuẩn xác nhất. Bạn có thể đặt lịch tư vấn để được khám lượng giá MIỄN PHÍ 100% tại Office Care nhé!";
      
      const normalizedMsg = userMsg.toLowerCase();
      if (normalizedMsg.includes('vai gáy') || normalizedMsg.includes('cổ') || normalizedMsg.includes('vai') || normalizedMsg.includes('gáy')) {
        aiResponse = "Đau cổ vai gáy thường do tư thế ngồi làm việc liên tục gây quá tải cơ thang và cơ nâng vai. Office Care khuyên bạn nên điều chỉnh màn hình ngang tầm mắt và có thể tham khảo dịch vụ Điện Xung & Siêu Âm trị liệu sâu để giảm nhanh co thắt cơ.";
      } else if (normalizedMsg.includes('lưng') || normalizedMsg.includes('thắt lưng') || normalizedMsg.includes('cột sống')) {
        aiResponse = "Đau thắt lưng ở dân văn phòng đa số đến từ việc ngồi không tựa lưng hoặc cong lưng. Bạn nên tập bài tập cuộn xương chậu nhẹ nhàng và tham khảo liệu trình Kéo giãn & di động khớp cột sống từ KTV của chúng tôi.";
      } else if (normalizedMsg.includes('tê') || normalizedMsg.includes('tay') || normalizedMsg.includes('ngón tay')) {
        aiResponse = "Tê tay có thể do dây thần kinh ở vùng cổ bị chèn ép hoặc hội chứng ống cổ tay do gõ bàn phím liên tục. Bạn nên giãn duỗi cổ tay mỗi tiếng và khám lượng giá sớm để tránh tổn thương thần kinh sâu.";
      } else if (normalizedMsg.includes('gù') || normalizedMsg.includes('tư thế')) {
        aiResponse = "Gù lưng hay tư thế đầu hướng ra trước (Forward Head) gây áp lực lớn gấp 3 lần lên đĩa đệm cổ. Chúng tôi có liệu trình chuyên biệt 'Phục hồi tư thế chuẩn Ergonomic' giúp bạn định hình lại cột sống tự nhiên.";
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsAiTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-20 right-0 w-[310px] md:w-[360px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary p-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div className="text-left">
                  <p className="font-jakarta font-extrabold text-xs">Bác sĩ AI - Tư vấn nhanh</p>
                  <p className="text-[9px] text-[#E6FFFA]/80 font-bold leading-none">Office Care Premium</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white text-xs font-bold p-1 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Messages box */}
            <div className="h-[260px] overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl font-jakarta text-xs leading-relaxed max-w-[85%] font-medium text-left ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 text-slate-400 p-3 rounded-2xl rounded-tl-none font-jakarta text-xs shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-1.5 bg-white">
              <button 
                onClick={() => setChatInput("Tôi bị đau cổ vai gáy")}
                className="text-[10px] bg-slate-50 hover:bg-teal-50 border border-slate-100 text-slate-500 hover:text-primary font-bold px-2 py-1 rounded-full transition-colors active:scale-95"
              >
                Đau cổ vai gáy 🩺
              </button>
              <button 
                onClick={() => setChatInput("Tôi bị đau lưng")}
                className="text-[10px] bg-slate-50 hover:bg-teal-50 border border-slate-100 text-slate-500 hover:text-primary font-bold px-2 py-1 rounded-full transition-colors active:scale-95"
              >
                Đau thắt lưng 🩹
              </button>
              <button 
                onClick={() => setChatInput("Lịch khám thế nào?")}
                className="text-[10px] bg-slate-50 hover:bg-teal-50 border border-slate-100 text-slate-500 hover:text-primary font-bold px-2 py-1 rounded-full transition-colors active:scale-95"
              >
                Lịch khám 📅
              </button>
            </div>

            {/* Input field */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..." 
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-jakarta focus:outline-none focus:border-primary font-medium"
              />
              <button 
                type="submit" 
                className="bg-primary text-white p-2.5 rounded-xl hover:bg-[#25A89C] transition-colors shrink-0 flex items-center justify-center active:scale-95"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Trigger Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center animate-pulse-custom"
      >
        {isChatOpen ? <MessageSquare size={26} /> : <Bot size={28} />}
      </motion.button>
    </div>
  );
}
