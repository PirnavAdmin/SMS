import React from 'react';
import { Save, Send, CheckCircle, Lock, Unlock } from 'lucide-react';

interface MarksEntrySummaryProps {
  total: number;
  present: number;
  absent: number;
  avgMarks: number;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isLocked: boolean;
  maxMarks: number;
  isUserAdmin?: boolean;
  marksStatus?: 'Not Started' | 'In Progress' | 'Submitted' | 'Verified' | 'Locked';
  onVerify?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
}

export const MarksEntrySummary: React.FC<MarksEntrySummaryProps> = ({
  total,
  present,
  absent,
  avgMarks,
  onSaveDraft,
  onSubmit,
  isLocked,
  maxMarks,
  isUserAdmin = false,
  marksStatus = 'Not Started',
  onVerify,
  onLock,
  onUnlock
}) => {
  const cardClass = "p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-left flex flex-col justify-center";
  const numStyle = "text-base font-black text-slate-900 dark:text-white mt-0.5";
  const labelStyle = "text-[9px] font-black uppercase text-slate-400 block tracking-wider";

  const getMarksStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Locked': return 'bg-slate-900 text-white dark:bg-slate-850 dark:text-slate-350 border-slate-700';
      case 'Submitted': return 'bg-indigo-100 text-indigo-805 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200';
      case 'Verified': return 'bg-sky-100 text-sky-850 dark:bg-sky-950 dark:text-sky-300 border-sky-200';
      case 'In Progress': return 'bg-amber-100 text-amber-850 dark:bg-amber-950 dark:text-amber-300 border-amber-200';
      default: return 'bg-slate-100 text-slate-650 dark:bg-slate-805 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* 4 KPI cards & save buttons bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1">
          <div className={cardClass}>
            <span className={labelStyle}>Total Students</span>
            <span className={numStyle}>{total}</span>
          </div>

          <div className={cardClass}>
            <span className={`${labelStyle} text-emerald-600`}>Present</span>
            <span className={`${numStyle} text-emerald-600`}>{present}</span>
          </div>

          <div className={cardClass}>
            <span className={`${labelStyle} text-rose-600`}>Absent</span>
            <span className={`${numStyle} text-rose-600`}>{absent}</span>
          </div>

          <div className={cardClass}>
            <span className={`${labelStyle} text-sky-600`}>Class Average</span>
            <span className={`${numStyle} text-sky-600`}>{avgMarks.toFixed(1)} / {maxMarks}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Status Badge */}
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getMarksStatusBadgeClass(marksStatus)}`}>
            Status: {marksStatus}
          </span>

          {/* Teacher Actions */}
          {marksStatus !== 'Submitted' && marksStatus !== 'Verified' && marksStatus !== 'Locked' && (
            <>
              <button
                type="button"
                disabled={isLocked}
                onClick={onSaveDraft}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
              >
                <Save className="w-4 h-4 text-slate-400" /> Save Draft
              </button>

              <button
                type="button"
                disabled={isLocked}
                onClick={onSubmit}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
              >
                <Send className="w-4 h-4" /> Submit Marks
              </button>
            </>
          )}

          {/* Admin Verification & Lock / Unlock Workflow */}
          {isUserAdmin && (
            <>
              {marksStatus === 'Submitted' && onVerify && (
                <button
                  type="button"
                  onClick={onVerify}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition border border-indigo-200"
                >
                  <CheckCircle className="w-4 h-4" /> Verify Marks
                </button>
              )}

              {marksStatus === 'Verified' && onLock && (
                <button
                  type="button"
                  onClick={onLock}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <Lock className="w-4 h-4" /> Lock Marks
                </button>
              )}

              {marksStatus === 'Locked' && onUnlock && (
                <button
                  type="button"
                  onClick={onUnlock}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Unlock className="w-4 h-4" /> Unlock Marks
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
