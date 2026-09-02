
interface MascotWidgetProps {
  count: number;
  onClick: () => void;
  tooltipText: string;
  badgeColor?: 'emerald' | 'rose' | 'amber';
}

export function MascotWidget({
  count,
  onClick,
  tooltipText,
  badgeColor = 'emerald'
}: MascotWidgetProps) {
  if (count <= 0) return null;

  const colorClasses = {
    emerald: {
      ping: 'bg-emerald-500/20',
      badge: 'bg-emerald-500'
    },
    rose: {
      ping: 'bg-rose-500/20',
      badge: 'bg-rose-500'
    },
    amber: {
      ping: 'bg-amber-500/20',
      badge: 'bg-amber-500'
    }
  };

  const selectedColors = colorClasses[badgeColor] || colorClasses.emerald;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">
      <button
        onClick={onClick}
        className="relative size-16 bg-white dark:bg-zinc-900 rounded-full shadow-2xl border border-slate-150 dark:border-zinc-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group focus:outline-none animate-bounce"
        title={tooltipText}
      >
        <div className={`absolute inset-0 rounded-full ${selectedColors.ping} animate-ping pointer-events-none`} />
        <div>
          <svg viewBox="0 0 100 100" className="size-14">
            <circle cx="50" cy="55" r="32" fill="#10b981" />
            <path d="M 22,40 Q 16,30 26,26 Q 36,22 41,32" fill="#f59e0b" />
            <path d="M 36,26 Q 41,16 51,16 Q 61,16 56,26" fill="#f59e0b" />
            <path d="M 51,21 Q 61,11 71,16 Q 76,26 66,31" fill="#f59e0b" />
            <circle cx="66" cy="46" r="20" fill="#10b981" />
            <path d="M 66,26 C 66,18 58,15 56,18 C 54,21 62,24 66,26" fill="#84cc16" />
            <path d="M 66,26 C 66,18 74,15 76,18 C 78,21 70,24 66,26" fill="#84cc16" />
            <rect x="65" y="25" width="2" height="3" rx="1" fill="#78350f" />
            <circle cx="60" cy="43" r="3.5" fill="#0f172a" />
            <circle cx="72" cy="43" r="3.5" fill="#0f172a" />
            <circle cx="61.5" cy="41.5" r="1.2" fill="#ffffff" />
            <circle cx="73.5" cy="41.5" r="1.2" fill="#ffffff" />
            <circle cx="56" cy="48" r="2.5" fill="#f43f5e" opacity="0.5" />
            <circle cx="76" cy="48" r="2.5" fill="#f43f5e" opacity="0.5" />
            <path d="M 64,48 Q 66,50 68,48" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            <rect x="28" y="54" width="14" height="7" rx="1.5" fill="#fed7aa" transform="rotate(-15 35 57)" />
            <line x1="35" y1="53" x2="35" y2="61" stroke="#f97316" strokeWidth="1" />
          </svg>
        </div>
        <span className={`absolute -top-1 -right-1 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-md ${selectedColors.badge}`}>
          {count}
        </span>
      </button>
    </div>
  );
}
