import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../hooks/useAIChat';
import {
  Send,
  X,
  Calendar,
  FileText,
  Stethoscope,
  Smile,
  Info,
  HelpCircle,
  RotateCcw,
  Package,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_SUGGESTED_PROMPTS = [
  { text: '💆 Trị mỏi cổ vai gáy văn phòng', query: 'Tôi bị đau mỏi cổ vai gáy do ngồi máy tính nhiều, trung tâm có liệu trình nào điều trị dứt điểm không?' },
  { text: '🧘 Phục hồi đau thắt lưng & cột sống', query: 'Tôi hay bị đau âm ỉ thắt lưng khi ngồi lâu, nguyên nhân và giải pháp phục hồi thế nào?' },
  { text: '⚡ Công nghệ Laser 30W & Shockwave', query: 'Phòng khám có các công nghệ y khoa nào hỗ trợ phục hồi và giảm đau nhanh?' },
  { text: '📅 Đặt lịch lượng giá 1:1', query: 'Tôi muốn đăng ký đặt lịch lượng giá 1:1 với chuyên viên tư vấn phục hồi chức năng.' }
];

export default function AIChatBubble() {
  const { messages, loading, isOpen, setIsOpen, sendMessage, clearChat } = useAIChat();
  const [inputValue, setInputValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới hoặc mở chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Show tooltip chào mừng sau 3.5 giây nếu chưa mở chat lần nào trong session
  useEffect(() => {
    const hasSeen = sessionStorage.getItem('officecare_chat_tooltip_seen');
    if (!hasSeen && !isOpen) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handlePromptClick = (query: string) => {
    sendMessage(query);
  };

  // Helper render text markdown đơn giản (bold, bullet, break lines)
  const renderFormattedText = (rawContent: string) => {
    const lines = rawContent.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      // Check section header with icons
      const isSymptomSection = line.includes('🔍') || line.includes('Phân tích triệu chứng');
      const isCauseSection = line.includes('🧠') || line.includes('Nguyên nhân cốt lõi');
      const isSolutionSection = line.includes('🛠️') || line.includes('Giải pháp đề xuất');

      let parsedLine: React.ReactNode = line;

      // Simple markdown bold renderer **text**
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        parsedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-extrabold text-slate-900 dark:text-teal-300">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
      }

      if (isSymptomSection) {
        return (
          <div key={idx} className="font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-1 mb-0.5">
            {parsedLine}
          </div>
        );
      }

      if (isCauseSection) {
        return (
          <div key={idx} className="font-black text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50 mt-1 mb-0.5">
            {parsedLine}
          </div>
        );
      }

      if (isSolutionSection) {
        return (
          <div key={idx} className="font-black text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-100 dark:border-teal-900/50 mt-1 mb-0.5">
            {parsedLine}
          </div>
        );
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-1.5 text-slate-700 dark:text-slate-200">
            <span className="text-[#0D9488] font-bold mt-0.5">•</span>
            <span>{typeof parsedLine === 'string' ? parsedLine.replace(/^[-•]\s*/, '') : parsedLine}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed">
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Tooltip chào mừng nổi */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            className="absolute bottom-20 right-2 w-72 bg-gradient-to-r from-slate-900 to-[#0F172A] text-white p-4 rounded-2xl shadow-2xl border border-slate-800 text-xs flex flex-col gap-2 z-10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <p className="font-bold text-[#2EC4B6]">Trợ lý Chuyên viên AI</p>
              </div>
              <button 
                onClick={() => {
                  setShowTooltip(false);
                  sessionStorage.setItem('officecare_chat_tooltip_seen', 'true');
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed font-medium">
              Chào bạn! Trợ lý AI sẵn sàng phân tích triệu chứng thắt lưng, cổ vai gáy và hỗ trợ bạn đặt lịch 1:1 ngay.
            </p>
            <button
              onClick={() => {
                setIsOpen(true);
                setShowTooltip(false);
                sessionStorage.setItem('officecare_chat_tooltip_seen', 'true');
              }}
              className="text-teal-400 font-bold hover:text-teal-300 transition-colors self-start flex items-center gap-1 mt-1 group cursor-pointer"
            >
              <span>Tư vấn cùng Trợ lý AI</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Bong bóng Chat nổi với Icon Mini */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
          sessionStorage.setItem('officecare_chat_tooltip_seen', 'true');
        }}
        className="size-14 rounded-full bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white shadow-[0_8px_30px_rgb(13,148,136,0.4)] flex items-center justify-center relative border border-white/30 focus:outline-none overflow-hidden group cursor-pointer active:scale-95 transition-all"
        title="Trợ lý Chuyên viên AI OfficeCare"
      >
        <span className="absolute inset-0 rounded-full bg-teal-400/20 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={22} strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <Stethoscope size={24} strokeWidth={2.2} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 2. Khung thoại Chat Glassmorphic Clean Medical Teal Header */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-20 right-0 w-[360px] sm:w-[430px] h-[600px] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(13,148,136,0.25)] flex flex-col overflow-hidden"
          >
            {/* Header: Tone màu xanh Y tế Mint/Teal sang trọng chuẩn OfficeCare */}
            <div className="bg-gradient-to-r from-[#0D9488] via-[#0f9f93] to-[#14B8A6] px-5 py-4 text-white flex items-center justify-between shadow-md relative rounded-t-[32px]">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="size-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-white shadow-inner">
                  <Stethoscope size={20} className="animate-pulse text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-[13.5px] font-extrabold tracking-normal flex items-center gap-1.5 text-white">
                    <span>Trợ lý Chuyên viên AI</span>
                    <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">OFFICECARE</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-2 rounded-full bg-emerald-300 animate-pulse"></span>
                    <span className="text-[10.5px] text-teal-50 font-medium">Tư vấn phục hồi chức năng 24/7</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 relative z-10">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Làm mới cuộc trò chuyện"
                  className="p-2 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-200 focus:outline-none cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-200 focus:outline-none cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Nội dung tin nhắn cuộn mượt */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40 dark:bg-slate-950/20 scrollbar-thin">
              {messages.map((msg, msgIndex) => {
                const isLastModelMessage = msg.role === 'model' && msgIndex === messages.length - 1;
                const hasBookingTag = msg.role === 'model' && (msg.suggestBooking === true || msg.content.includes('[DAT_LICH]'));
                const cleanContent = msg.content.replace('[DAT_LICH]', '').trim();
                const isUser = msg.role === 'user';
                const showPackageBtn = msg.role === 'model' && msg.showPackagePrompt === true;
                const questions = msg.suggestedQuestions && msg.suggestedQuestions.length > 0 ? msg.suggestedQuestions : [];

                return (
                  <div key={msg.id} className="space-y-2">
                    <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="size-7 bg-[#0D9488]/10 text-[#0D9488] rounded-full flex items-center justify-center shrink-0 border border-[#0D9488]/20 mb-0.5 shadow-2xs">
                          <Stethoscope size={14} />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-[22px] px-4 py-3 text-xs leading-relaxed font-normal shadow-2xs break-words transition-all
                          ${
                            isUser
                              ? 'bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white rounded-br-none'
                              : msg.content.startsWith('⚠️')
                              ? 'bg-rose-50 border border-rose-100 text-rose-700 rounded-bl-none font-medium'
                              : 'bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-bl-none'
                          }`}
                      >
                        <div className="space-y-1">
                          {renderFormattedText(cleanContent)}
                        </div>

                        {/* Interactive "Gợi ý gói phù hợp" Button */}
                        {showPackageBtn && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                            <button
                              type="button"
                              onClick={() => handlePromptClick('Tìm và gợi ý cho tôi các gói liệu trình phù hợp nhất cho tình trạng này')}
                              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 px-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                            >
                              <Package size={14} />
                              <span>Gợi ý gói liệu trình phù hợp</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        )}

                        {/* Nút đặt lịch hoặc chuyển đến Hồ sơ điều trị */}
                        {hasBookingTag && (
                          msg.bookingActionType === 'customer_records' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/medical-record');
                              }}
                              className="mt-3 w-full bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-950/40 dark:hover:bg-emerald-600 text-emerald-700 hover:text-white dark:text-emerald-300 dark:hover:text-white border border-emerald-300 dark:border-emerald-700/80 hover:border-transparent transition-all duration-300 py-2.5 px-3 rounded-xl text-center font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                            >
                              <FileText size={14} />
                              <span>Vào Hồ sơ điều trị để đặt buổi tiếp theo</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/booking');
                              }}
                              className="mt-3 w-full bg-teal-50 hover:bg-[#0D9488] dark:bg-slate-700 dark:hover:bg-[#0D9488] text-[#0D9488] hover:text-white dark:text-teal-350 dark:hover:text-white border border-[#0D9488]/30 hover:border-transparent transition-all duration-300 py-2.5 rounded-xl text-center font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                            >
                              <Calendar size={14} />
                              <span>Đặt lịch lượng giá &amp; trị liệu ngay</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* DYNAMIC SUGGESTED QUESTIONS PILLS (Dưới tin nhắn của Model) */}
                    {!isUser && isLastModelMessage && questions.length > 0 && (
                      <div className="pl-9 pr-2 pt-1 flex flex-wrap gap-1.5 animate-in fade-in duration-300">
                        {questions.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => handlePromptClick(q)}
                            disabled={loading}
                            className="text-[10.5px] font-semibold text-teal-800 dark:text-teal-300 bg-teal-50/90 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200/80 dark:border-teal-800 px-3 py-1.5 rounded-full shadow-2xs transition-all active:scale-96 text-left cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles size={11} className="text-[#0D9488] shrink-0" />
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bouncing Dots Loading Indicator */}
              {loading && (
                <div className="flex items-end gap-2.5 justify-start">
                  <div className="size-7 bg-[#0D9488]/10 text-[#0D9488] rounded-full flex items-center justify-center shrink-0 border border-[#0D9488]/20 mb-0.5">
                    <Stethoscope size={14} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-[22px] rounded-bl-none px-4 py-3.5 flex items-center gap-1.5 shadow-2xs">
                    <span className="size-1.5 bg-[#0D9488] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="size-1.5 bg-[#14B8A6] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="size-1.5 bg-teal-300 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Khối Gợi Ý Câu Hỏi Mặc Định (khi hội thoại mới bắt đầu) */}
            {messages.length <= 1 && (
              <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 space-y-2 text-left">
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                  <HelpCircle size={11} className="text-[#0D9488]" />
                  <span>Chủ đề tư vấn nhanh</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {INITIAL_SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePromptClick(prompt.query)}
                      className="text-[11px] font-medium text-slate-650 hover:text-[#0D9488] bg-white hover:bg-teal-50/40 border border-slate-200/60 hover:border-teal-500/30 px-3 py-1.5 rounded-xl transition-all duration-200 shadow-2xs cursor-pointer text-left active:scale-97"
                    >
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Nhập Tin Nhắn */}
            <form 
              onSubmit={handleSend} 
              className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/80 flex gap-2 items-center relative"
            >
              <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#14B8A6] focus-within:ring-4 focus-within:ring-[#14B8A6]/10 rounded-2xl px-4 py-2.5 flex items-center transition-all duration-200">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Hỏi về đau cổ vai gáy, lưng, gói trị liệu..."
                  disabled={loading}
                  className="w-full bg-transparent text-xs font-medium outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
                />
                
                <div className="flex items-center gap-1.5 ml-2 text-slate-400">
                  <Smile size={16} className="hover:text-slate-600 transition-colors cursor-pointer hidden sm:block" />
                  <span title="AI cung cấp thông tin tham vấn y khoa ban đầu">
                    <Info size={16} className="hover:text-slate-600 transition-colors cursor-pointer hidden sm:block" />
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white size-10 rounded-2xl flex items-center justify-center shadow-md shadow-[#0D9488]/15 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all duration-200 focus:outline-none shrink-0 cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
