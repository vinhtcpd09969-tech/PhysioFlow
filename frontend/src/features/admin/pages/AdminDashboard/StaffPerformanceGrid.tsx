interface StaffPerformanceProps {
  name: string;
  sessions: number;
}

interface StaffPerformanceGridProps {
  performanceData: StaffPerformanceProps[];
}

export function StaffPerformanceGrid({ performanceData }: StaffPerformanceGridProps) {
  return (
    <div 
      className="bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui opacity-0 animate-slide-up"
      style={{ animationDelay: '400ms' }}
    >
      <div className="mb-8">
        <h3 className="text-lg font-extrabold text-secondary">Hiệu suất KTV (Tháng này)</h3>
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Xếp hạng kỹ thuật viên xuất sắc dựa trên số ca phục hồi thành công</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {performanceData.map((staff, idx) => (
          <div 
            key={staff.name} 
            className="p-6 rounded-2xl bg-zinc-50/50 hover:bg-white border border-zinc-100/50 hover:border-zinc-200/80 hover:shadow-soft-ui hover:-translate-y-1 flex flex-col items-center text-center group transition-all duration-300"
          >
            <div className="size-12 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center text-lg mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
              {['🥇', '🥈', '🥉', '👤', '👤'][idx] || '👤'}
            </div>
            <p className="font-bold text-secondary text-xs truncate w-full">{staff.name}</p>
            <p className="text-primary font-extrabold text-xl mt-1">{staff.sessions}</p>
            <p className="text-zinc-400 text-[8px] uppercase font-extrabold tracking-widest">Buổi thực hiện</p>
          </div>
        ))}
      </div>
    </div>
  );
}
