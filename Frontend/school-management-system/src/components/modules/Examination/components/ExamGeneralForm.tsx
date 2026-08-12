import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Calendar } from 'lucide-react';
import { DatePickerInput } from './SharedUI';

interface ExamGeneralFormProps {
  name: string;
  examType: string;
  term: string;
  startDate: string;
  endDate: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  applicableClasses: string[];
  classOptions: string[];
  selectedAcademicYear: string;
  selectedBranch: string;
  onChange: (updates: any) => void;
  assessmentTypesOptions?: string[];
  termCyclesOptions?: string[];
}

export const ExamGeneralForm: React.FC<ExamGeneralFormProps> = ({
  name,
  examType,
  term,
  startDate,
  endDate,
  defaultStartTime,
  defaultEndTime,
  applicableClasses,
  classOptions,
  onChange,
  assessmentTypesOptions,
  termCyclesOptions
}) => {
  const inputClass = "w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-white focus:border-sky-500 font-bold text-xs h-[38px] transition";
  const selectClass = "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-white focus:border-sky-500 font-bold text-xs h-[38px] transition cursor-pointer";

  const assessmentTypes = assessmentTypesOptions && assessmentTypesOptions.length > 0
    ? assessmentTypesOptions.filter(t => t !== "Other / Custom...")
    : [
        'Unit Test',
        'Periodic Assessment (PT)',
        'Formative Assessment (FA)',
        'Summative Assessment (SA)',
        'Mid-Term Examination',
        'Half-Yearly Examination',
        'Pre-Board Examination',
        'Annual / Final Examination',
        'Practical & Laboratory Assessment',
        'Internal / Continuous Evaluation'
      ];

  const [isCustomType, setIsCustomType] = useState(() => {
    if (!examType) return false;
    return !assessmentTypes.some(t => t.toLowerCase() === examType.toLowerCase() || t.startsWith(examType));
  });

  const [customTypeVal, setCustomTypeVal] = useState(() => {
    if (!examType || assessmentTypes.some(t => t.toLowerCase() === examType.toLowerCase() || t.startsWith(examType))) return '';
    return examType;
  });

  useEffect(() => {
    if (examType) {
      const match = assessmentTypes.find(t => t.toLowerCase() === examType.toLowerCase() || t.startsWith(examType));
      if (!match) {
        setIsCustomType(true);
        setCustomTypeVal(examType);
      } else {
        setIsCustomType(false);
      }
    } else {
      setIsCustomType(false);
      setCustomTypeVal('');
    }
  }, [examType]);

  const handleToggleClass = (cls: string) => {
    let next: string[];
    if (applicableClasses.includes(cls)) {
      next = applicableClasses.filter(c => c !== cls);
    } else {
      next = [...applicableClasses, cls];
    }
    onChange({ applicableClasses: next });
  };

  const handleSelectAll = () => {
    onChange({ applicableClasses: [...classOptions] });
  };

  const handleClearAll = () => {
    onChange({ applicableClasses: [] });
  };

  return (
    <div className="space-y-4 text-left">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Examination Title */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Examination Name *
          </label>
          <input
            required
            value={name || ''}
            onChange={e => onChange({ name: e.target.value })}
            className={inputClass}
            placeholder="e.g. Summative Assessment - 1 (SA-1)"
          />
        </div>

        {/* Assessment Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Assessment Type *
          </label>
          {isCustomType ? (
            <div className="relative">
              <input
                type="text"
                required
                value={customTypeVal}
                onChange={e => {
                  setCustomTypeVal(e.target.value);
                  onChange({ examType: e.target.value });
                }}
                className={`${inputClass} pr-14`}
                placeholder="Enter custom type..."
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomType(false);
                  setCustomTypeVal('');
                  onChange({ examType: '' });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold uppercase text-sky-600 hover:text-sky-500 cursor-pointer bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                Select
              </button>
            </div>
          ) : (
            <select
              value={examType || ''}
              onChange={e => {
                if (e.target.value === 'Other') {
                  setIsCustomType(true);
                  setCustomTypeVal('');
                  onChange({ examType: '' });
                } else {
                  onChange({ examType: e.target.value });
                }
              }}
              className={selectClass}
            >
              <option value="">-- Select Assessment Type --</option>
              {assessmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
              <option value="Other">Other / Custom...</option>
            </select>
          )}
        </div>

        {/* Academic Term */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Academic Term *
          </label>
          <input
            type="text"
            required
            value={term || ''}
            onChange={e => onChange({ term: e.target.value })}
            className={inputClass}
            placeholder="e.g. Term 1, Mid-Term, Annual, 2026-27"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Start Date *
          </label>
          <DatePickerInput
            value={startDate || ''}
            onChange={(val: string) => onChange({ startDate: val })}
            className={inputClass}
            placeholder="DD-MM-YYYY"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            End Date *
          </label>
          <DatePickerInput
            value={endDate || ''}
            onChange={(val: string) => onChange({ endDate: val })}
            className={inputClass}
            placeholder="DD-MM-YYYY"
          />
        </div>

        {/* Start Time */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Start Time *
          </label>
          <input
            type="time"
            value={defaultStartTime || '09:00'}
            onChange={(e) => onChange({ defaultStartTime: e.target.value })}
            className={`${inputClass} font-mono font-bold cursor-pointer`}
          />
        </div>

        {/* End Time */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            End Time *
          </label>
          <input
            type="time"
            value={defaultEndTime || '12:00'}
            onChange={(e) => onChange({ defaultEndTime: e.target.value })}
            className={`${inputClass} font-mono font-bold cursor-pointer`}
          />
        </div>
      </div>

      {/* Target Classes Selection */}
      <div className="p-4 rounded-2xl border border-sky-400 dark:border-sky-500 bg-slate-50/50 dark:bg-slate-950/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
              Exam Applicable Classes *
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {classOptions.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No academic classes configured.</span>
          ) : (
            classOptions.map(cls => {
              const isSelected = applicableClasses.includes(cls);
              return (
                <button
                  type="button"
                  key={cls}
                  onClick={() => handleToggleClass(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300 dark:text-slate-600'}`} />
                  <span>{cls}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default ExamGeneralForm;
