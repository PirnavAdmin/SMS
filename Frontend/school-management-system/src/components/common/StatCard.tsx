import React, { useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, RotateCw } from 'lucide-react';

export interface StatDetailItem {
  label: string;
  value: string | number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky' | 'purple';
  onClick?: () => void;
  allowFlip?: boolean;
  flipDetails?: StatDetailItem[];
  flipContent?: React.ReactNode;
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
  allowFlip = false,
  flipDetails,
  flipContent,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const canFlip = allowFlip || !!flipDetails || !!flipContent;

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

  const handleFlipToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (canFlip) {
      setIsFlipped((prev) => !prev);
    }
  };

  return (
    <div className={`flip-perspective select-none ${canFlip ? 'min-h-[148px]' : ''}`}>
      <div
        className={`flip-card-inner relative rounded-3xl transition-transform duration-500 ${
          isFlipped ? 'is-flipped' : ''
        }`}
      >
        {/* FRONT FACE */}
        <div
          className={`glass-card border-primary-interactive hover-tilt p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group ${
            onClick || canFlip ? 'cursor-pointer' : ''
          }`}
          onClick={handleCardClick}
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

            <div className="flex items-center gap-1.5">
              {/* Optional 3D Flip Quick Button */}
              {canFlip && (
                <button
                  type="button"
                  onClick={handleFlipToggle}
                  title="Flip for breakdown"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 transition-transform duration-300 hover:rotate-180" />
                </button>
              )}

              {/* iPhone Glass Icon Squircle */}
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 backdrop-blur-md shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-2 ${scheme.tile}`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
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

        {/* BACK FACE (if flippable) */}
        {canFlip && (
          <div
            className={`flip-card-back glass-card border-primary-interactive p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group cursor-pointer`}
            onClick={() => setIsFlipped(false)}
          >
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--primary-color)]">
                {title} Details
              </span>
              <button
                type="button"
                onClick={handleFlipToggle}
                title="Flip back"
                className="p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="my-auto py-2 relative z-10">
              {flipContent ? (
                flipContent
              ) : flipDetails && flipDetails.length > 0 ? (
                <div className="space-y-1.5">
                  {flipDetails.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{item.label}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Click to return to overview</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Interactive 3D Card</span>
              <span className="text-[var(--primary-color)] font-bold">Tap to flip</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default StatCard;
