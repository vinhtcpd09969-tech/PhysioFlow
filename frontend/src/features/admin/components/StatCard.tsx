import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeColor?: string;
  icon: React.ReactNode;
  color: string;
  delay?: string;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeColor,
  icon,
  color,
  delay,
  subtitle
}: StatCardProps) {
  const badgeClass = changeColor || "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40";

  return (
    <div
      className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
      style={delay ? { animationDelay: delay } : undefined}
    >
      {/* Top Header Row: Icon + Title & Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`size-8 rounded-lg ${color} flex items-center justify-center text-sm shrink-0 border border-black/5 dark:border-white/5`}>
            {icon}
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
            {title}
          </span>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${badgeClass}`}>
          {change}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between gap-2 mt-1">
        <h3 className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          {value}
        </h3>
        {subtitle && (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

