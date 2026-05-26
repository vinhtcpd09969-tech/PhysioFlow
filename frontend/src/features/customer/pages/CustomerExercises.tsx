import { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Flame, 
  Play, 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  target: string;
  reps: string;
  duration: string;
  description: string;
  videoUrl: string;
  category: string;
  completed: boolean;
}

export default function CustomerExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 'ex-1',
      name: 'Bài tập gập cơ thang sau (Trap Stretch)',
      target: 'Giảm co thắt cơ nâng vai và cơ thang bả vai trái',
      reps: '3 hiệp x 15 giây giữ',
      duration: '5 phút',
      description: 'Ngồi thẳng lưng, tay phải vòng qua đầu kéo nhẹ đầu nghiêng sang bên phải cho đến khi cảm thấy cơ vùng cổ trái căng nhẹ. Giữ nguyên 15 giây rồi thả lỏng.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      category: 'Kéo giãn cơ cổ',
      completed: false
    },
    {
      id: 'ex-2',
      name: 'Bài tập thụt cằm đôi (Chin Tuck)',
      target: 'Phục hồi đường cong sinh lý cột sống cổ',
      reps: '3 hiệp x 10 lần',
      duration: '4 phút',
      description: 'Nhìn thẳng về phía trước, từ từ thụt cằm vào trong như thể đang tạo cằm đôi (hai cằm). Không ngửa đầu lên hay cúi đầu xuống. Giữ 5 giây rồi thả lỏng.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      category: 'Di động cột sống cổ',
      completed: false
    },
    {
      id: 'ex-3',
      name: 'Bài tập kéo giãn cơ ngực lớn (Chest Stretch)',
      target: 'Mở rộng khớp vai, giảm gù lưng cổ rùa do ngồi máy tính',
      reps: '2 hiệp x 30 giây',
      duration: '3 phút',
      description: 'Đứng sát góc tường hoặc khung cửa, đặt khuỷu tay và cẳng tay tựa vào tường. Bước nhẹ một chân lên phía trước cho đến khi ngực căng ra. Giữ 30 giây.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      category: 'Mở rộng lồng ngực',
      completed: false
    }
  ]);

  const [activeExercise, setActiveExercise] = useState<string | null>('ex-1');
  const streakCount = 4;

  const toggleComplete = (id: string) => {
    setExercises(prev => 
      prev.map(ex => {
        if (ex.id === id) {
          const nextState = !ex.completed;
          if (nextState) {
            // If checking it, play sound or add feedback
          }
          return { ...ex, completed: nextState };
        }
        return ex;
      })
    );
  };

  const completedCount = exercises.filter(e => e.completed).length;
  const progressPercent = Math.round((completedCount / exercises.length) * 100);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-secondary flex items-center gap-2.5">
            <Activity className="text-primary" size={32} />
            Bài tập Phục hồi tại nhà
          </h1>
          <p className="text-gray-500 text-sm mt-1">Bài tập giãn cơ và phục hồi tư thế được Kỹ thuật viên/Bác sĩ kê đơn riêng cho bạn.</p>
        </div>
        
        {/* Streak Counter Widget */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
            <Flame size={22} className="animate-pulse" />
          </div>
          <div>
            <p className="font-heading font-black text-secondary text-sm">{streakCount} Ngày Liên Tiếp</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Thói quen phục hồi tốt 🔥</p>
          </div>
        </div>
      </div>

      {/* Progress & Quick Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 md:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tiến độ tập luyện hôm nay</span>
            <span className="font-heading font-black text-primary text-sm">{completedCount}/{exercises.length} Bài tập</span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Đã hoàn thành {progressPercent}% giáo án hôm nay</span>
            {progressPercent === 100 ? (
              <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                🎉 Tuyệt vời! Bạn đã hoàn thành xuất sắc
              </span>
            ) : (
              <span className="text-primary font-bold">Cố gắng thêm chút nữa để hoàn tất!</span>
            )}
          </div>
        </div>

        {/* AI Ergonomics Tip */}
        <div className="bg-[#E6F4F1] rounded-[24px] p-6 border border-primary/10 flex flex-col justify-between relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white p-1.5 rounded-lg text-primary shadow-xs">
              <Sparkles size={16} />
            </div>
            <span className="font-heading font-bold text-sm text-secondary">Trợ lý AI Ergonomics</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            "Cứ mỗi 45 phút ngồi làm việc, hãy đứng dậy thực hiện bài tập gập cằm và nghiêng nghiêng cổ 2 phút để giải tỏa áp lực đĩa đệm cổ."
          </p>
          <div className="text-[10px] text-gray-400 mt-4 font-bold flex items-center gap-1">
            <AlertCircle size={12} /> Hướng dẫn y tế chuẩn lâm sàng
          </div>
        </div>

      </div>

      {/* Main Exercises Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Exercises Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading font-bold text-lg text-secondary flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            Danh sách bài tập hôm nay
          </h2>

          {exercises.map((ex) => (
            <div 
              key={ex.id}
              onClick={() => setActiveExercise(ex.id)}
              className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                activeExercise === ex.id 
                  ? 'border-primary shadow-md ring-1 ring-primary/20' 
                  : 'border-gray-100 hover:border-gray-250 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(ex.id);
                  }}
                  className={`size-6 rounded-full border-2 flex items-center justify-center transition-all mt-1 ${
                    ex.completed 
                      ? 'bg-primary border-primary text-white scale-110' 
                      : 'border-gray-300 hover:border-primary text-transparent'
                  }`}
                >
                  <CheckCircle2 size={16} />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm text-secondary transition-all ${ex.completed ? 'line-through text-gray-400' : ''}`}>
                      {ex.name}
                    </h3>
                    <span className="text-[9px] bg-zinc-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">
                      {ex.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                    <span>Thời lượng: {ex.duration}</span>
                    <span>•</span>
                    <span>Tần suất: {ex.reps}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>
                </div>
              </div>

              <ChevronRight size={18} className="text-gray-300 mt-1 flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Right Column: Exercise detail and video demo */}
        <div>
          <h2 className="font-heading font-bold text-lg text-secondary mb-4 flex items-center gap-2">
            <Play size={20} className="text-primary" />
            Hướng dẫn tập chi tiết
          </h2>

          {activeExercise ? (
            (() => {
              const currentEx = exercises.find(e => e.id === activeExercise);
              if (!currentEx) return null;
              return (
                <div className="bg-white rounded-[24px] border border-gray-150 shadow-sm overflow-hidden animate-in fade-in duration-300">
                  
                  {/* Mock Video Box */}
                  <div className="bg-zinc-950 aspect-video relative flex items-center justify-center group overflow-hidden">
                    <video 
                      src={currentEx.videoUrl} 
                      className="size-full object-cover opacity-75"
                      controls
                      autoPlay
                      muted
                      loop
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {currentEx.category}
                      </span>
                      <h3 className="font-heading font-black text-secondary text-base mt-2">
                        {currentEx.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{currentEx.target}</p>
                    </div>

                    <div className="border-t border-gray-100 pt-4 text-xs space-y-3">
                      <div>
                        <span className="font-bold text-secondary block mb-1">Chuẩn bị & Thực hiện:</span>
                        <p className="text-gray-600 leading-relaxed text-xs">
                          {currentEx.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Thời gian</span>
                          <span className="font-extrabold text-secondary">{currentEx.duration}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Tần suất</span>
                          <span className="font-extrabold text-secondary">{currentEx.reps}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleComplete(currentEx.id)}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                        currentEx.completed
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-primary text-white border-transparent hover:opacity-90 shadow-xs'
                      }`}
                    >
                      {currentEx.completed ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                    </button>

                  </div>

                </div>
              );
            })()
          ) : (
            <div className="bg-white rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-gray-400 text-xs">
              <HelpCircle size={32} className="mx-auto mb-2 text-gray-300" />
              Chọn một bài tập bên cạnh để xem hướng dẫn động và video thị phạm.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
