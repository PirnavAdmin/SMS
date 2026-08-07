import React from 'react';

interface ResultSummaryProps {
  total: number;
  passCount: number;
  failCount: number;
  publishedCount: number;
  avgPercent: number;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({
  total,
  passCount,
  failCount,
  publishedCount,
  avgPercent
}) => {
  const cardClass = "p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-left flex flex-col justify-center";
  const numStyle = "text-base font-black text-slate-900 dark:text-white mt-0.5";
  const labelStyle = "text-[9px] font-black uppercase text-slate-400 block tracking-wider";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
      <div className={cardClass}>
        <span className={labelStyle}>Total Students</span>
        <span className={numStyle}>{total}</span>
      </div>

      <div className={cardClass}>
        <span className={`${labelStyle} text-emerald-600`}>Pass Count</span>
        <span className={`${numStyle} text-emerald-600`}>{passCount}</span>
      </div>

      <div className={cardClass}>
        <span className={`${labelStyle} text-rose-600`}>Fail Count</span>
        <span className={`${numStyle} text-rose-600`}>{failCount}</span>
      </div>

      <div className={cardClass}>
        <span className={`${labelStyle} text-indigo-600`}>Published Portal</span>
        <span className={`${numStyle} text-indigo-600`}>{publishedCount} / {total}</span>
      </div>

      <div className={cardClass}>
        <span className={`${labelStyle} text-sky-600`}>Average Percent</span>
        <span className={`${numStyle} text-sky-600`}>{avgPercent.toFixed(1)}%</span>
      </div>
    </div>
  );
};
