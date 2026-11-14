import React, { useState } from 'react';
import { Bell, ArrowUpRight } from 'lucide-react';

export interface PendingApprovalsCardProps {
  onNavigate: (module: string) => void;
  admissionsCount?: number;
  staffCount?: number;
  leavesCount?: number;
  feeCount?: number;
  isLibrarian?: boolean;
  className?: string;
}

export const PendingApprovalsCard: React.FC<PendingApprovalsCardProps> = ({
  onNavigate,
  admissionsCount = 0,
  staffCount = 0,
  leavesCount = 0,
  feeCount = 0,
  isLibrarian = false,
  className = ''
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = admissionsCount + staffCount + leavesCount + feeCount;

  // Percentage calculations
  const admissionsPct = total > 0 ? Math.round((admissionsCount / total) * 100) : 25;
  const staffPct = total > 0 ? Math.round((staffCount / total) * 100) : 25;
  const leavesPct = total > 0 ? Math.round((leavesCount / total) * 100) : 25;
  const feePct = total > 0 ? Math.max(0, 100 - admissionsPct - staffPct - leavesPct) : 25;

  const formatCount = (count: number): string => {
    return count < 10 && count >= 0 ? `0${count}` : `${count}`;
  };

  const approvalItems = [
    {
      key: 'admissions',
      label: 'Admissions',
      fullLabel: 'Admission Approvals',
      count: admissionsCount,
      pct: admissionsPct,
      color: '#f59e0b', // Amber / Golden Orange
      bgClass: 'bg-amber-500',
      hoverBg: 'hover:bg-amber-500/5',
      route: 'admissions'
    },
    {
      key: 'staff',
      label: 'Staff Requests',
      fullLabel: 'Staff Profile Requests',
      count: staffCount,
      pct: staffPct,
      color: '#083344', // Dark Teal / Navy
      bgClass: 'bg-[#083344] dark:bg-cyan-600',
      hoverBg: 'hover:bg-cyan-500/5',
      route: 'staff'
    },
    {
      key: 'leaves',
      label: 'Leave Requests',
      fullLabel: 'Staff Leave Requests',
      count: leavesCount,
      pct: leavesPct,
      color: '#e11d48', // Red / Crimson
      bgClass: 'bg-rose-500',
      hoverBg: 'hover:bg-rose-500/5',
      route: 'staff-leave'
    },
    {
      key: 'fee',
      label: 'Fee Concessions',
      fullLabel: 'Fee Concession Requests',
      count: feeCount,
      pct: feePct,
      color: '#ec4899', // Hot Pink / Magenta
      bgClass: 'bg-pink-500',
      hoverBg: 'hover:bg-pink-500/5',
      route: 'finance-fee-collection'
    }
  ];

  return (
    <div className={`glass-card border-primary-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between select-none ${className}`}>
      {/* 1. Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
            <Bell className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0 text-left">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
              Pending Approvals
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('staff-leave')}
          className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          View All
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Top Multi-color Segmented Progress Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 my-1 shadow-inner p-0.5 gap-0.5">
        {approvalItems.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const segmentWidth = total > 0 ? (item.count > 0 ? Math.max(item.pct, 4) : 0) : 25;
          if (segmentWidth === 0) return null;

          return (
            <div
              key={item.key}
              style={{ width: `${segmentWidth}%` }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`${item.bgClass} h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 cursor-pointer ${
                isHovered ? 'brightness-125 scale-y-110 shadow-xs' : ''
              }`}
              title={`${item.label}: ${item.count} (${item.pct}%)`}
            />
          );
        })}
      </div>

      {/* 3. 2x2 Metric Grid with cross-dividers */}
      <div className="grid grid-cols-2 flex-1 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl overflow-hidden mt-1.5 bg-white/40 dark:bg-slate-900/40 divide-x divide-y divide-slate-200/70 dark:divide-slate-800/80">
        {approvalItems.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={item.key}
              onClick={isLibrarian ? undefined : () => onNavigate(item.route)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-3 sm:p-3.5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer relative group ${item.hoverBg} ${
                isHovered ? 'bg-slate-100/60 dark:bg-slate-800/50' : ''
              }`}
            >
              {/* Category label with colored dot and percentage */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform duration-200"
                    style={{
                      backgroundColor: item.color,
                      transform: isHovered ? 'scale(1.3)' : 'scale(1)'
                    }}
                  />
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                  ({item.pct}%)
                </span>
              </div>

              {/* Big bold count (04, 12, 112) */}
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none tabular-nums group-hover:scale-105 transition-transform duration-200 origin-left">
                  {formatCount(item.count)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  View &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingApprovalsCard;
