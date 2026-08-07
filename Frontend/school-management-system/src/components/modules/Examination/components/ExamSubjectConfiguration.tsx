import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface ExamSubjectConfigurationProps {
  subjects: string[];
  activeSubjects: string[];
  maxMarksMap: Record<string, number>;
  passMarksMap: Record<string, number>;
  onToggleSubject: (subject: string) => void;
  onUpdateMarks: (subject: string, maxMarks: number, passMarks: number) => void;
}

export const ExamSubjectConfiguration: React.FC<ExamSubjectConfigurationProps> = ({
  subjects,
  activeSubjects,
  maxMarksMap,
  passMarksMap,
  onToggleSubject,
  onUpdateMarks
}) => {
  const labelClass = "text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 block mb-1";
  const numInputClass = "w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500 font-mono transition";

  return (
    <div className="space-y-4 mt-4">
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850">
        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">Configure Exam Subjects</h4>
        <p className="text-[11px] text-slate-500 mt-0.5">Toggle subjects and configure their specific Maximum and Passing Marks boundaries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map(subject => {
          const isActive = activeSubjects.includes(subject);
          const maxMarks = maxMarksMap[subject] ?? 100;
          const passMarks = passMarksMap[subject] ?? 35;
          const hasMarksError = passMarks > maxMarks || passMarks <= 0;

          return (
            <div
              key={subject}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                isActive
                  ? 'border-sky-300 bg-sky-50/20 dark:border-sky-850 dark:bg-sky-950/20 shadow-sm'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 opacity-60'
              }`}
            >
              {/* Header Toggle */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onToggleSubject(subject)}
                  className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white text-left truncate flex-1 hover:opacity-80"
                >
                  {isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-350 shrink-0" />
                  )}
                  <span className="truncate">{subject}</span>
                </button>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  isActive ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' : 'bg-slate-100 text-slate-400'
                }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Marks Inputs */}
              {isActive && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <label className={labelClass}>Max Marks *</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={maxMarks}
                      onChange={e => onUpdateMarks(subject, Number(e.target.value) || 0, passMarks)}
                      className={numInputClass}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className={labelClass}>Pass Marks *</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={passMarks}
                      onChange={e => onUpdateMarks(subject, maxMarks, Number(e.target.value) || 0)}
                      className={`${numInputClass} ${hasMarksError ? 'border-rose-500 text-rose-600 focus:border-rose-500' : ''}`}
                    />
                  </div>

                  {hasMarksError && (
                    <span className="col-span-2 text-[9px] font-bold text-rose-500">
                      Pass Marks must be between 1 and Maximum Marks ({maxMarks}).
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
