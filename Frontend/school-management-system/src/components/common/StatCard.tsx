import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  color
}) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-400 dark:bg-rose-950/50 border-rose-100 dark:border-rose-900/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-400 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/50',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-400 dark:bg-sky-950/50 border-sky-100 dark:border-sky-900/50',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-400 dark:bg-purple-950/50 border-purple-100 dark:border-purple-900/50',
  };

  return (
    <div className="glass-card p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(subtitle || change) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 dark:text-slate-400 font-medium">{subtitle}</span>}
          {change && (
            <span className={`inline-flex items-center gap-1 font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
