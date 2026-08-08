import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useData } from '../../../../context/DataContext';

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
  const { subjects: allSubjects } = useData();
  const labelClass = "text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-0.5";
  const numInputClass = "w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500 font-mono transition h-[30px]";

  const handleMaxMarksChange = (subject: string, rawValue: string, currentPass: number) => {
    const cleanStr = rawValue.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    const num = cleanStr === '' ? 0 : parseInt(cleanStr, 10);
    onUpdateMarks(subject, cleanStr === '' ? ('' as any) : num, currentPass);
  };

  const handlePassMarksChange = (subject: string, currentMax: number, rawValue: string) => {
    const cleanStr = rawValue.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    const num = cleanStr === '' ? 0 : parseInt(cleanStr, 10);
    onUpdateMarks(subject, currentMax, cleanStr === '' ? ('' as any) : num);
  };

  return (
    <div className="space-y-4 text-left">
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850">
        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">Configure Exam Subjects</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {subjects.map(subject => {
          const isActive = activeSubjects.includes(subject);
          const rawMax = maxMarksMap[subject];
          const rawPass = passMarksMap[subject];
          
          const maxMarksVal = rawMax === undefined ? 100 : (rawMax === 0 ? '' : rawMax);
          const passMarksVal = rawPass === undefined ? 35 : (rawPass === 0 ? '' : rawPass);
          
          const numericMax = Number(rawMax) || 100;
          const numericPass = Number(rawPass) || 35;
          const hasMarksError = numericPass > numericMax || (rawPass !== undefined && Number(rawPass) <= 0);

          return (
            <div
              key={subject}
              className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-2.5 ${
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
                  className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white text-left truncate flex-1 hover:opacity-80 cursor-pointer"
                >
                  {isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-350 shrink-0" />
                  )}
                  <div className="truncate flex flex-col items-start justify-center">
                    <span className="truncate">{subject}</span>
                    {(() => {
                      const match = allSubjects.find(s => s.name === subject || s.id === subject || s.code === subject);
                      return match?.code ? (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{match.code}</span>
                      ) : null;
                    })()}
                  </div>
                </button>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  isActive ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' : 'bg-slate-100 text-slate-400'
                }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Marks Inputs */}
              {isActive && (
                <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <label className={labelClass}>Max Marks *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxMarksVal}
                      onChange={e => handleMaxMarksChange(subject, e.target.value, numericPass)}
                      onBlur={() => {
                        if (!maxMarksMap[subject] || Number(maxMarksMap[subject]) <= 0) {
                          onUpdateMarks(subject, 100, numericPass);
                        }
                      }}
                      placeholder="100"
                      className={numInputClass}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className={labelClass}>Pass Marks *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={passMarksVal}
                      onChange={e => handlePassMarksChange(subject, numericMax, e.target.value)}
                      onBlur={() => {
                        if (!passMarksMap[subject] || Number(passMarksMap[subject]) <= 0) {
                          onUpdateMarks(subject, numericMax, 35);
                        }
                      }}
                      placeholder="35"
                      className={`${numInputClass} ${hasMarksError ? 'border-rose-500 text-rose-600 focus:border-rose-500' : ''}`}
                    />
                  </div>

                  {hasMarksError && (
                    <span className="col-span-2 text-[9px] font-bold text-rose-500">
                      Pass Marks must be between 1 and Maximum Marks ({numericMax}).
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
export default ExamSubjectConfiguration;
