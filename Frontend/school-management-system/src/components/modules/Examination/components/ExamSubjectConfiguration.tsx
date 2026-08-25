import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle, Layers, CheckSquare, Square, AlertTriangle, Info, Calendar, Clock } from 'lucide-react';
import { useData } from '../../../../context/DataContext';

interface ExamSubjectConfigurationProps {
  applicableClasses: string[];
  classWiseConfig: Record<string, Record<string, { maxMarks: number; passMarks: number }>>;
  startDate?: string;
  endDate?: string;
  onToggleSubject: (className: string, subject: string) => void;
  onUpdateMarks: (className: string, subject: string, maxMarks: number, passMarks: number) => void;
  onSelectAllForClass?: (className: string, subjects: string[]) => void;
  onClearAllForClass?: (className: string) => void;
}

export const ExamSubjectConfiguration: React.FC<ExamSubjectConfigurationProps> = ({
  applicableClasses,
  classWiseConfig,
  startDate,
  endDate,
  onToggleSubject,
  onUpdateMarks,
  onSelectAllForClass,
  onClearAllForClass
}) => {
  const { subjects: allSubjects, academicClasses } = useData();

  // Active Class Tab inside Subjects Configuration
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return applicableClasses[0] || '';
  });

  useEffect(() => {
    if (applicableClasses.length > 0 && !applicableClasses.includes(selectedClass)) {
      setSelectedClass(applicableClasses[0]);
    }
  }, [applicableClasses, selectedClass]);

  // Subjects assigned strictly to the selected class
  const classSubjects = useMemo(() => {
    let rawNames: string[] = [];
    if (selectedClass) {
      const matchedClass = academicClasses.find(c => c.name === selectedClass);
      if (matchedClass && matchedClass.subjects && matchedClass.subjects.length > 0) {
        rawNames = matchedClass.subjects
          .map((sub: any) => (typeof sub === 'string' ? sub : (sub.subjectName || sub.name || sub.subjectCode || sub.code || '')))
          .filter(Boolean);
      }
    }

    const seen = new Set<string>();
    const filtered = rawNames.filter(name => {
      const lower = name.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    return filtered;
  }, [selectedClass, academicClasses]);

  // Active subjects strictly belonging to the displayed class subjects
  const currentClassMap = classWiseConfig[selectedClass] || {};
  const activeSubjectNames = useMemo(() => {
    const validSet = new Set(classSubjects.map(s => s.toLowerCase()));
    return Object.keys(currentClassMap).filter(name => validSet.has(name.toLowerCase()));
  }, [classSubjects, currentClassMap]);

  // Calculate working days in the exam window (skipping Sundays)
  const windowDays = useMemo(() => {
    if (!startDate || !endDate) return { totalDays: 0, workingDays: 0 };
    const parseDate = (dStr: string) => {
      const parts = dStr.split(/[-/]/);
      if (parts.length === 3 && parts[0].length === 2) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      return new Date(dStr);
    };
    const s = parseDate(startDate);
    const e = parseDate(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return { totalDays: 0, workingDays: 0 };

    let totalDays = 0;
    let workingDays = 0;
    let curr = new Date(s);
    while (curr <= e) {
      totalDays++;
      if (curr.getDay() !== 0) workingDays++;
      curr.setDate(curr.getDate() + 1);
    }
    return { totalDays, workingDays };
  }, [startDate, endDate]);

  const labelClass = "text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-0.5";
  const numInputClass = "w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500 font-mono transition h-[30px]";

  const handleMaxMarksChange = (subject: string, rawValue: string, currentPass: number) => {
    const cleanStr = rawValue.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    const num = cleanStr === '' ? 0 : parseInt(cleanStr, 10);
    onUpdateMarks(selectedClass, subject, cleanStr === '' ? ('' as any) : num, currentPass);
  };

  const handlePassMarksChange = (subject: string, currentMax: number, rawValue: string) => {
    const cleanStr = rawValue.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    const num = cleanStr === '' ? 0 : parseInt(cleanStr, 10);
    onUpdateMarks(selectedClass, subject, currentMax, cleanStr === '' ? ('' as any) : num);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Class Selector Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-sky-400 dark:border-sky-500 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
            Configure Exam Subjects
          </h4>
        </div>

        {applicableClasses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Class:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {applicableClasses.map(cls => {
                const matchedClass = academicClasses.find(c => c.name === cls);
                const raw = matchedClass?.subjects && matchedClass.subjects.length > 0
                  ? matchedClass.subjects.map((sub: any) => typeof sub === 'string' ? sub : (sub.subjectName || sub.name || sub.subjectCode || sub.code || '')).filter(Boolean)
                  : allSubjects.map(s => s.name);
                const subSet = new Set(raw.map((s: string) => s.toLowerCase()));
                const clsMap = classWiseConfig[cls] || {};
                const count = Object.keys(clsMap).filter(name => subSet.has(name.toLowerCase())).length;
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                    }`}
                  >
                    <span>{cls}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                      isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scheduling Intelligence Notice: When subjects exceed available days */}
      {windowDays.workingDays > 0 && activeSubjectNames.length > windowDays.workingDays && (
        <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/70 text-amber-600 dark:text-amber-300 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-amber-950 dark:text-amber-100 text-xs">
                Scheduling Notice: {activeSubjectNames.length} Subjects Selected for {selectedClass} vs {windowDays.workingDays} Available Working Day{windowDays.workingDays === 1 ? '' : 's'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/80 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-200">
                {startDate} to {endDate}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
              You have selected more subjects ({activeSubjectNames.length}) than single exam days ({windowDays.workingDays} days). In the next step (<strong>Exam Schedule</strong>), you can easily schedule multiple subjects on the same day using different time slots (e.g. morning and afternoon sessions), or extend the <strong>End Date</strong> under <em>1. Exam Details</em> if you require one exam per day.
            </p>
          </div>
        </div>
      )}

      {/* Quick Select / Deselect All Controls for the active class */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Showing subjects for <strong className="text-slate-900 dark:text-white">{selectedClass}</strong> ({activeSubjectNames.length} selected of {classSubjects.length})
        </div>
        <div className="flex items-center gap-2">
          {onSelectAllForClass && onClearAllForClass && (
            <button
              type="button"
              onClick={() => {
                const isAll = classSubjects.length > 0 && activeSubjectNames.length === classSubjects.length;
                if (isAll) {
                  onClearAllForClass(selectedClass);
                } else {
                  onSelectAllForClass(selectedClass, classSubjects);
                }
              }}
              className={`text-xs font-bold transition cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                classSubjects.length > 0 && activeSubjectNames.length === classSubjects.length
                  ? 'bg-sky-50 border-sky-400 text-sky-700 dark:bg-sky-950/40 dark:border-sky-700 dark:text-sky-300 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-sky-400 shadow-xs'
              }`}
            >
              {classSubjects.length > 0 && activeSubjectNames.length === classSubjects.length ? (
                <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Select All</span>
            </button>
          )}
          {onClearAllForClass && activeSubjectNames.length > 0 && (
            <button
              type="button"
              onClick={() => onClearAllForClass(selectedClass)}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 transition cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
            >
              <Square className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Grid of Subjects for the Active Class */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {classSubjects.map(subject => {
          const configItem = currentClassMap[subject];
          const isActive = configItem !== undefined;
          
          const rawMax = configItem?.maxMarks;
          const rawPass = configItem?.passMarks;

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
                  ? 'border-sky-400 bg-sky-50/20 dark:border-sky-500 dark:bg-sky-950/20 shadow-xs'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 opacity-60'
              }`}
            >
              {/* Header Toggle */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onToggleSubject(selectedClass, subject)}
                  className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white text-left truncate flex-1 hover:opacity-80 cursor-pointer"
                >
                  {isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
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
                  isActive ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Marks Inputs */}
              {isActive && (
                <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <label className={labelClass}>Max Marks *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxMarksVal}
                      onChange={e => handleMaxMarksChange(subject, e.target.value, numericPass)}
                      onBlur={() => {
                        if (!configItem?.maxMarks || Number(configItem.maxMarks) <= 0) {
                          onUpdateMarks(selectedClass, subject, 100, numericPass);
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
                        if (!configItem?.passMarks || Number(configItem.passMarks) <= 0) {
                          onUpdateMarks(selectedClass, subject, numericMax, 35);
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
