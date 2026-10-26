import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { validateAcademicTerm } from '../../../../utils/dateValidation';
import { DatePickerInput } from './SharedUI';
import { useData } from '../../../../context/DataContext';

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
  selectedAcademicYear,
  onChange,
  assessmentTypesOptions,
  termCyclesOptions
}) => {
    const { gradeConfigurations, academicYears = [] } = useData();

  const validTermOptions = useMemo(() => {
    const activeAY = (academicYears || []).find(
      (ay: any) => ay && (ay.isCurrent || ay.isCurrentAcademicYear || ay.status === 'Active' || ay.isActive)
    );
    const activeStartYear = activeAY
      ? parseInt(String((activeAY as any)?.academicYear || (activeAY as any)?.year || '').slice(0, 4), 10) || new Date().getFullYear()
      : new Date().getFullYear();

    const allowedAYs = (academicYears || [])
      .filter((ay: any) => {
        if (!ay) return false;
        if (ay.status === 'Closed' || ay.status === 'Past' || ay.status === 'Archived') return false;
        const name = String(ay.academicYear || ay.year || ay.academicYearName || '').trim();
        const startY = parseInt(name.slice(0, 4), 10);
        if (!isNaN(startY) && startY < activeStartYear) return false;
        return true;
      })
      .map((ay: any) => String(ay.academicYear || ay.year || ay.academicYearName || '').trim())
      .filter(Boolean);

    const baseTerms = [
      'Term 1',
      'Term 2',
      'Mid-Term',
      'Annual',
      'Semester 1',
      'Semester 2',
      'Quarter 1',
      'Quarter 2',
      'Quarter 3',
      'Quarter 4',
      'Full Academic Session'
    ];

    const fromOptions = (termCyclesOptions || [])
      .filter((t) => t && t !== 'Other / Custom...')
      .filter((t) => {
        const val = validateAcademicTerm(t, selectedAcademicYear, academicYears);
        return val.isValid;
      });

    const activeLabel = (activeAY as any)?.academicYear || (activeAY as any)?.year || selectedAcademicYear;
    const combinedSessionTerms = activeLabel
      ? [`${activeLabel} - Term 1`, `${activeLabel} - Term 2`, `${activeLabel} - Mid-Term`, `${activeLabel} - Annual`]
      : [];

    return Array.from(new Set([...allowedAYs, ...baseTerms, ...fromOptions, ...combinedSessionTerms]));
  }, [academicYears, selectedAcademicYear, termCyclesOptions]);

  const termValidation = useMemo(() => {
    if (!term || !term.trim()) return { isValid: true };
    return validateAcademicTerm(term, selectedAcademicYear, academicYears);
  }, [term, selectedAcademicYear, academicYears]);
  const inputClass = "w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-white focus:border-sky-500 font-bold text-xs h-[38px] transition";
  const selectClass = "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-white focus:border-sky-500 font-bold text-xs h-[38px] transition cursor-pointer";

  const standardTypes = [
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

  const assessmentTypes = useMemo(() => {
    const fromOptions = (assessmentTypesOptions || []).filter(t => t !== "Other / Custom...");
    const fromGrades = (gradeConfigurations || [])
      .map(g => g.examType)
      .filter((t): t is string => !!t && t !== 'All');
    return Array.from(new Set([...standardTypes, ...fromOptions, ...fromGrades]));
  }, [assessmentTypesOptions, gradeConfigurations]);

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
            Examination Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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
            Assessment Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 flex items-center justify-between">
            <span>Academic Term <span className="text-rose-500 font-bold ml-0.5">*</span></span>
            {selectedAcademicYear && (
              <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400">
                Active: {selectedAcademicYear}
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              list="academic-term-suggestions"
              required
              value={term || ''}
              onChange={(e) => onChange({ term: e.target.value })}
              className={`${inputClass} ${
                !termValidation.isValid
                  ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 ring-1 ring-rose-200 dark:ring-rose-900/40'
                  : ''
              }`}
              placeholder="e.g. Term 1, Mid-Term, Annual, or Active Session"
            />
            <datalist id="academic-term-suggestions">
              {validTermOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
          {!termValidation.isValid && termValidation.message && (
            <div className="flex items-start gap-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-[11px] font-semibold text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{termValidation.message}</span>
            </div>
          )}
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Start Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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
            End Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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
            Start Time <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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
            End Time <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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