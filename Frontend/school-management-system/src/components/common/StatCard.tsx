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
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  color,
  onClick,
}) => {
  const colorMap = {
    indigo: {
      tile: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-indigo-500/10',
      glow: 'from-indigo-500/10 to-transparent',
    },
    emerald: {
      tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-emerald-500/10',
      glow: 'from-emerald-500/10 to-transparent',
    },
    rose: {
      tile: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-rose-500/10',
      glow: 'from-rose-500/10 to-transparent',
    },
    amber: {
      tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-amber-500/10',
      glow: 'from-amber-500/10 to-transparent',
    },
    sky: {
      tile: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 shadow-sky-500/10',
      glow: 'from-sky-500/10 to-transparent',
    },
    purple: {
      tile: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-purple-500/10',
      glow: 'from-purple-500/10 to-transparent',
    },
  };

  const scheme = colorMap[color] || colorMap.sky;

  return (
    <div
      className={`glass-card p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      }`}
      onClick={onClick}
    >
      {/* Subtle ambient specular corner glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${scheme.glow} blur-2xl opacity-60 pointer-events-none group-hover:scale-125 transition-transform duration-500`}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            {value}
          </h3>
        </div>

        {/* iPhone Glass Icon Squircle */}
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 backdrop-blur-md shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-2 ${scheme.tile}`}
        >
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {(subtitle || change) && (
        <div className="mt-4 pt-3.5 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-xs relative z-10">
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
              {subtitle}
            </span>
          )}
          {change && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-xs ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <TrendingDown className="w-3 h-3 stroke-[2.5]" />
              )}
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
export default StatCard;
