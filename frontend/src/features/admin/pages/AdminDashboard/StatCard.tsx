import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  color: string;
  delay: string;
}

export function StatCard({ title, value, change, icon, color, delay }: StatCardProps) {
  return (
    <div 
      className="bg-white p-6 rounded-3xl border border-zinc-100/80 shadow-soft-ui hover:shadow-soft-ui-hover hover:-translate-y-1 transition-all duration-300 opacity-0 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-2xl ${color} flex items-center justify-center text-xl shadow-inner`}>
          {icon}
        </div>
        <span className="text-emerald-500 text-[10px] font-bold bg-emerald-50/80 px-2.5 py-1 rounded-lg">
          {change}
        </span>
      </div>
      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-extrabold text-secondary tracking-tight">{value}</h3>
    </div>
  );
}
