import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'amber' | 'red' | 'purple';
  delay?: number;
}

const colorMap = {
  green:  {
    bg: 'bg-green-50',
    icon: 'bg-green-600',
    iconShadow: 'shadow-green-600/20',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  blue:   {
    bg: 'bg-blue-50',
    icon: 'bg-blue-600',
    iconShadow: 'shadow-blue-600/20',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  amber:  {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500',
    iconShadow: 'shadow-amber-500/20',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  red:    {
    bg: 'bg-red-50',
    icon: 'bg-red-600',
    iconShadow: 'shadow-red-600/20',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  purple: {
    bg: 'bg-violet-50',
    icon: 'bg-violet-600',
    iconShadow: 'shadow-violet-600/20',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
  },
};

export default function StatCard({ title, value, sub, icon, color, delay = 0 }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className="animate-slide-up bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3 sm:gap-4 cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${c.icon} flex items-center justify-center text-white text-base sm:text-lg flex-shrink-0 shadow-md ${c.iconShadow}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold truncate">{title}</p>
        <p className={`text-[17px] sm:text-[22px] font-bold ${c.text} leading-tight mt-1 break-all`}>{value}</p>
        {sub && <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 break-words">{sub}</p>}
      </div>
    </div>
  );
}
