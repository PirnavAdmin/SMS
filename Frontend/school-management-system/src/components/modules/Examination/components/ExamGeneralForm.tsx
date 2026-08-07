import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { DatePickerInput } from './SharedUI';

interface ExamGeneralFormProps {
  name: string;
  examType: string;
  term: string;
  startDate: string;
  endDate: string;
  applicableClasses: string[];
  classOptions: string[];
  selectedAcademicYear: string;
  selectedBranch: string;
  onChange: (updates: any) => void;
}

export const ExamGeneralForm: React.FC<ExamGeneralFormProps> = ({
  name,
  examType,
  term,
  startDate,
  endDate,
  applicableClasses,
  classOptions,
  selectedAcademicYear,
  selectedBranch,
  onChange
}) => {
  const inputClass = "w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 outline-none text-slate-900 dark:text-white focus:border-sky-500 font-medium text-xs h-[38px] transition";
  const selectClass = "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 outline-none text-slate-900 dark:text-white focus:border-sky-500 font-bold text-xs h-[38px] transition cursor-pointer";

  const handleToggleClass = (cls: string) => {
    let next: string[];
    if (applicableClasses.includes(cls)) {
      next = applicableClasses.filter(c => c !== cls);
      if (next.length === 0 && classOptions.length > 0) next = [cls];
    } else {
      next = [...applicableClasses, cls];
    }
    onChange({ applicableClasses: next });
  };

  return (
    <div className="space-y-5 mt-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Exam Name *</label>
          <input
            required
            value={name}
            onChange={e => onChange({ name: e.target.value })}
            className={inputClass}
            placeholder="e.g. Annual Examination 2026-27"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Academic Year</label>
          <input
            disabled
            value={`${selectedAcademicYear} (${selectedBranch})`}
            className={`${inputClass} bg-slate-100 dark:bg-slate-800/50 opacity-70 font-mono`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Exam Type *</label>
          <select
            value={examType}
            onChange={e => onChange({ examType: e.target.value })}
            className={selectClass}
          >
            <option value="">-- Select Exam Type --</option>
            {['Unit Test', 'Periodic Test', 'Mid-Term', 'Half-Yearly', 'Pre-Final', 'Annual', 'Practical', 'Internal Assessment'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Term</label>
          <select
            value={term}
            onChange={e => onChange({ term: e.target.value })}
            className={selectClass}
          >
            <option value="">-- No Term / Standard --</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Start Date *</label>
          <DatePickerInput
            value={startDate}
            onChange={(val: string) => onChange({ startDate: val })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">End Date *</label>
          <DatePickerInput
            value={endDate}
            onChange={(val: string) => onChange({ endDate: val })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Target Classes ({applicableClasses.length} Selected) *
          </label>
          <button
            type="button"
            onClick={() => {
              if (applicableClasses.length === classOptions.length) {
                onChange({ applicableClasses: [classOptions[0] || 'Class 10'] });
              } else {
                onChange({ applicableClasses: [...classOptions] });
              }
            }}
            className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 hover:underline"
          >
            {applicableClasses.length === classOptions.length ? 'Deselect Extra' : '+ Select All Classes'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60">
          {classOptions.map(cls => {
            const isSelected = applicableClasses.includes(cls);
            return (
              <button
                key={cls}
                type="button"
                onClick={() => handleToggleClass(cls)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{cls}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
