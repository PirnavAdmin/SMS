import React, { useState, useEffect } from 'react';
import { Calendar, ShieldAlert, Save, Clock, CalendarDays, Loader2, Lock, Info, RotateCcw } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { AcademicYearFeeSchedule, FeeScheduleTerm, MonthlyDueDateConfig, MonthDueDateItem } from '../../../types';
import { DateInput } from '../../common/DateInput';
import { fetchFeeScheduleConfigApi, saveFeeScheduleConfigApi } from '../../../api/finance';
import {
  generateTermsFromAcademicYear,
  generateMonthlyDatesFromAcademicYear,
  AcademicYearDates,
  formatDateIso,
  parseDateIso
} from '../../../utils/academicYearTermUtils';

export const MONTH_NAMES_ACADEMIC = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];

export function getMonthYearForAcademicIndex(ayStr: string, monthIndex: number): { year: number; month: number } {
  const startYear = parseInt(ayStr.split('-')[0], 10) || 2026;
  if (monthIndex < 9) {
    return { year: startYear, month: monthIndex + 4 };
  } else {
    return { year: startYear + 1, month: monthIndex - 8 };
  }
}

export function buildDefaultMonthlyConfig(ayStr: string, dueDay: number = 10): MonthlyDueDateConfig {
  const monthDueDates: MonthDueDateItem[] = MONTH_NAMES_ACADEMIC.map((mName, idx) => {
    const { year, month } = getMonthYearForAcademicIndex(ayStr, idx);
    const dayStr = String(dueDay).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    return {
      monthIndex: idx,
      monthName: mName,
      dueDate: `${year}-${monthStr}-${dayStr}`
    };
  });

  return {
    applySameDayToAllMonths: true,
    dueDay,
    monthDueDates
  };
}

export const FeeScheduleView: React.FC = () => {
  const {
    academicYearFeeSchedules,
    setAcademicYearFeeSchedules,
    academicYears,
    financeSettings
  } = useData();
  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [activeAY, setActiveAY] = useState<string>('');

  useEffect(() => {
    setActiveAY(selectedAcademicYear || financeSettings?.academicYear || '2026-2027');
  }, [selectedAcademicYear, financeSettings]);

  // Find source-of-truth Academic Year configuration
  const currentAYMaster = academicYears.find(
    ay => ay.academicYear === activeAY || ay.academicYear.replace(/\s+/g, '') === activeAY.replace(/\s+/g, '')
  );

  const ayDates: AcademicYearDates = {
    startDate: currentAYMaster?.startDate || '2026-06-01',
    endDate: currentAYMaster?.endDate || '2027-06-01',
    academicYear: activeAY || '2026-2027'
  };

  // Configurable Due Date Offset (default 45 days)
  const [dueDateOffsetDays, setDueDateOffsetDays] = useState<number>(45);

  // Current editing schedule or a default one
  const [schedule, setSchedule] = useState<Partial<AcademicYearFeeSchedule>>({
    academicYear: '',
    numberOfTerms: 4,
    dueDateOffsetDays: 45,
    terms: []
  });

  const [monthlyConfig, setMonthlyConfig] = useState<MonthlyDueDateConfig>(() =>
    generateMonthlyDatesFromAcademicYear(ayDates, 10)
  );
  const [annualDueDate, setAnnualDueDate] = useState<string>('2026-06-15');
  const [oneTimeDueDate, setOneTimeDueDate] = useState<string>('2026-06-15');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeAY) return;

    const numTerms = schedule.numberOfTerms || 4;
    const offset = dueDateOffsetDays || 45;
    const computedTerms = generateTermsFromAcademicYear(ayDates, numTerms, offset);

    const existing = academicYearFeeSchedules.find(s => s.academicYear === activeAY);
    if (existing) {
      const loadedOffset = existing.dueDateOffsetDays || offset;
      setDueDateOffsetDays(loadedOffset);
      const mergedTerms = generateTermsFromAcademicYear(ayDates, existing.numberOfTerms || 4, loadedOffset, existing.terms);

      setSchedule({
        ...existing,
        dueDateOffsetDays: loadedOffset,
        terms: mergedTerms
      });

      setMonthlyConfig(
        existing.monthlyConfig
          ? existing.monthlyConfig
          : generateMonthlyDatesFromAcademicYear(ayDates, 10)
      );
      setAnnualDueDate(existing.annualDueDate || (ayDates.startDate ? ayDates.startDate : '2026-06-15'));
      setOneTimeDueDate(existing.oneTimeDueDate || (ayDates.startDate ? ayDates.startDate : '2026-06-15'));
    } else {
      setSchedule({
        id: `SCH-${activeAY}`,
        academicYear: activeAY,
        numberOfTerms: 4,
        dueDateOffsetDays: offset,
        status: 'Active',
        terms: computedTerms
      });
      setMonthlyConfig(generateMonthlyDatesFromAcademicYear(ayDates, 10));
      setAnnualDueDate(ayDates.startDate || '2026-06-15');
      setOneTimeDueDate(ayDates.startDate || '2026-06-15');
    }

    // Fetch persisted schedule from API
    let isSubscribed = true;
    fetchFeeScheduleConfigApi(activeAY)
      .then((res: any) => {
        if (!isSubscribed) return;
        const apiData = res?.data || res;
        if (apiData && apiData.terms && apiData.terms.length > 0) {
          const loadedNumTerms = apiData.numberOfTerms || 4;
          const loadedOffset = apiData.dueDateOffsetDays || 45;
          setDueDateOffsetDays(loadedOffset);

          const finalTerms = generateTermsFromAcademicYear(ayDates, loadedNumTerms, loadedOffset, apiData.terms);

          const loaded: AcademicYearFeeSchedule = {
            id: apiData.id || `SCH-${activeAY}`,
            academicYear: apiData.academicYear || activeAY,
            numberOfTerms: loadedNumTerms,
            dueDateOffsetDays: loadedOffset,
            status: (apiData.status === 'Inactive' ? 'Inactive' : 'Active'),
            annualDueDate: apiData.annualDueDate || ayDates.startDate,
            oneTimeDueDate: apiData.oneTimeDueDate || ayDates.startDate,
            terms: finalTerms,
            monthlyConfig: apiData.monthlyConfig || generateMonthlyDatesFromAcademicYear(ayDates, 10)
          };

          setSchedule(loaded);
          if (loaded.monthlyConfig) setMonthlyConfig(loaded.monthlyConfig);
          if (loaded.annualDueDate) setAnnualDueDate(loaded.annualDueDate);
          if (loaded.oneTimeDueDate) setOneTimeDueDate(loaded.oneTimeDueDate);

          setAcademicYearFeeSchedules(prev => [
            ...prev.filter(s => s.academicYear !== activeAY),
            loaded
          ]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch fee schedule from API:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeAY, currentAYMaster?.startDate, currentAYMaster?.endDate]);

  const handleNumTermsChange = (num: number) => {
    const freshTerms = generateTermsFromAcademicYear(ayDates, num, dueDateOffsetDays, schedule.terms);

    setSchedule(prev => ({
      ...prev,
      numberOfTerms: num,
      dueDateOffsetDays,
      terms: freshTerms
    }));

    if (num === 1 && freshTerms[0]?.dueDate) {
      setAnnualDueDate(freshTerms[0].dueDate);
    }
  };

  const handleOffsetChange = (newOffset: number) => {
    const safeOffset = Math.max(0, newOffset);
    setDueDateOffsetDays(safeOffset);

    const updatedTerms = generateTermsFromAcademicYear(
      ayDates,
      schedule.numberOfTerms || 4,
      safeOffset,
      schedule.terms
    );

    setSchedule(prev => ({
      ...prev,
      dueDateOffsetDays: safeOffset,
      terms: updatedTerms
    }));

    if (schedule.numberOfTerms === 1 && updatedTerms[0]?.dueDate) {
      setAnnualDueDate(updatedTerms[0].dueDate);
    }
  };

  const handleTermFieldChange = (index: number, field: keyof FeeScheduleTerm, value: any) => {
    const updatedTerms = [...(schedule.terms || [])];
    const isDueDateField = field === 'dueDate';

    updatedTerms[index] = {
      ...updatedTerms[index],
      [field]: value,
      ...(isDueDateField ? { dueDateMode: 'MANUAL' } : {})
    };

    setSchedule(prev => ({
      ...prev,
      terms: updatedTerms
    }));

    if (field === 'dueDate' && index === 0) {
      setAnnualDueDate(value);
    }
  };

  const handleResetTermToAuto = (index: number) => {
    const updatedTerms = [...(schedule.terms || [])];
    const target = updatedTerms[index];
    if (!target) return;

    const start = parseDateIso(target.startDate);
    let autoDueStr = target.dueDate;
    if (start) {
      const calculatedDue = new Date(start);
      calculatedDue.setDate(start.getDate() + dueDateOffsetDays);
      autoDueStr = formatDateIso(calculatedDue);
    }

    updatedTerms[index] = {
      ...target,
      dueDate: autoDueStr,
      dueDateMode: 'AUTO',
      dueDateOffsetDays
    };

    setSchedule(prev => ({
      ...prev,
      terms: updatedTerms
    }));

    if (index === 0 && schedule.numberOfTerms === 1) {
      setAnnualDueDate(autoDueStr);
    }

    addToast(
      'info',
      'Due Date Reset',
      `${target.termName} due date reset to automatic calculation (Start + ${dueDateOffsetDays} days).`
    );
  };

  // Monthly Due Date Configuration Handlers
  const handleToggleApplySameDay = (checked: boolean) => {
    if (checked) {
      const regenerated = generateMonthlyDatesFromAcademicYear(ayDates, monthlyConfig.dueDay || 10);
      setMonthlyConfig(regenerated);
    } else {
      setMonthlyConfig(prev => ({
        ...prev,
        applySameDayToAllMonths: false
      }));
    }
  };

  const handleDueDayChange = (newDay: number) => {
    if (monthlyConfig.applySameDayToAllMonths) {
      const regenerated = generateMonthlyDatesFromAcademicYear(ayDates, newDay);
      setMonthlyConfig(regenerated);
    } else {
      setMonthlyConfig(prev => ({
        ...prev,
        dueDay: newDay
      }));
    }
  };

  const handleMonthDateChange = (index: number, newDateStr: string) => {
    setMonthlyConfig(prev => {
      const updatedMonths = [...prev.monthDueDates];
      updatedMonths[index] = {
        ...updatedMonths[index],
        dueDate: newDateStr
      };
      return {
        ...prev,
        monthDueDates: updatedMonths
      };
    });
  };

  const validateSchedule = (): boolean => {
    if (!activeAY) {
      addToast('error', 'Validation Error', 'Academic Year is mandatory.');
      return false;
    }

    // Term-wise / Quarterly / Annual Validations
    const terms = schedule.terms || [];
    if (terms.length === 0) {
      addToast('error', 'Validation Error', 'You must configure at least one term.');
      return false;
    }

    const termNames = new Set<string>();

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      if (!term.termName.trim()) {
        addToast('error', 'Validation Error', `Term ${i + 1} Name is required.`);
        return false;
      }
      if (termNames.has(term.termName.trim().toLowerCase())) {
        addToast('error', 'Validation Error', `Duplicate term name: "${term.termName}".`);
        return false;
      }
      termNames.add(term.termName.trim().toLowerCase());

      if (!term.startDate || !term.endDate || !term.dueDate) {
        addToast('error', 'Validation Error', `Due Date is mandatory for ${term.termName}.`);
        return false;
      }

      const start = new Date(term.startDate);
      const end = new Date(term.endDate);
      const due = new Date(term.dueDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(due.getTime())) {
        addToast('error', 'Validation Error', `Invalid date format for ${term.termName}.`);
        return false;
      }

      if (end <= start) {
        addToast('error', 'Validation Error', `${term.termName} End Date must be after Start Date.`);
        return false;
      }

      // Check if Due Date falls strictly within [startDate, endDate]
      if (due < start || due > end) {
        addToast(
          'error',
          'Validation Error',
          `Calculated due date (${term.dueDate}) for ${term.termName} falls outside the term period (${term.startDate} to ${term.endDate}). Please adjust the Due Date Offset or manually edit the due date.`
        );
        return false;
      }
    }

    // Monthly Due Dates Validation (Only validated if 12 Terms / Monthly Billing mode is selected)
    if (schedule.numberOfTerms === 12) {
      if (!monthlyConfig.monthDueDates || monthlyConfig.monthDueDates.length !== 12) {
        addToast('error', 'Validation Error', 'All 12 monthly due dates must be configured.');
        return false;
      }

      for (let i = 0; i < monthlyConfig.monthDueDates.length; i++) {
        const mItem = monthlyConfig.monthDueDates[i];
        if (!mItem.dueDate || mItem.dueDate.trim() === '') {
          addToast('error', 'Validation Error', `Due date for ${mItem.monthName} is required.`);
          return false;
        }
        if (isNaN(new Date(mItem.dueDate).getTime())) {
          addToast('error', 'Validation Error', `Invalid due date for ${mItem.monthName}.`);
          return false;
        }
      }
    }

    // One-Time Due Date Validation
    if (!oneTimeDueDate || oneTimeDueDate.trim() === '') {
      addToast('error', 'Validation Error', 'One-Time Fee Due Date is required.');
      return false;
    }

    return true;
  };

  const handleSaveSchedule = async () => {
    if (!validateSchedule()) return;

    setIsSaving(true);
    const finalAnnualDueDate = schedule.numberOfTerms === 1 && schedule.terms?.[0]?.dueDate
      ? schedule.terms[0].dueDate
      : annualDueDate;

    const finalSchedule: AcademicYearFeeSchedule = {
      id: schedule.id || `SCH-${activeAY}`,
      academicYear: activeAY,
      numberOfTerms: schedule.numberOfTerms || 4,
      dueDateOffsetDays,
      terms: (schedule.terms || []).map(t => ({ ...t, status: 'Active' })),
      status: 'Active',
      monthlyConfig,
      annualDueDate: finalAnnualDueDate,
      oneTimeDueDate
    };

    try {
      await saveFeeScheduleConfigApi(finalSchedule);
      setAcademicYearFeeSchedules(prev => [
        ...prev.filter(s => s.academicYear !== activeAY),
        finalSchedule
      ]);

      addToast('success', 'Fee Schedule Saved', `Successfully saved & published ${activeAY} academic year fee schedule to database.`);
    } catch (err: any) {
      console.error('Failed to persist fee schedule to database:', err);
      addToast('error', 'Save Failed', err?.message || 'Failed to save fee schedule to database. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Fee Schedule Management</h3>
              <p className="text-xs font-semibold text-slate-500">Derives term start/end dates & automatic due dates from Academic Year Settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Academic Year:</label>
            <select
              value={activeAY}
              onChange={e => setActiveAY(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
            >
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.academicYear}>{ay.academicYear}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Academic Year Single Source of Truth Banner */}
        <div className="bg-sky-50 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-900/50 flex items-start gap-3 text-xs text-sky-900 dark:text-sky-200">
          <Lock className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-black flex items-center gap-2 flex-wrap">
              <span>Academic Year Period & Term Dates Synchronized</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-200/80 dark:bg-sky-900/80 text-sky-900 dark:text-sky-200 font-mono text-[11px]">
                📅 {ayDates.startDate} to {ayDates.endDate}
              </span>
            </div>
            <p className="text-[11px] text-sky-700 dark:text-sky-300">
              The Academic Year Configuration under <strong>School Settings</strong> is the single source of truth. Term start & end dates are calculated automatically with zero gaps or overlaps and are read-only 🔒. Payment <strong>Due Dates</strong> are automatically calculated using the configured offset days from each term's start date.
            </p>
          </div>
        </div>

        {/* Section 1: Term / Installment Setup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Installment Structure</h4>
            
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Number of Installment Terms <span className="text-rose-500 font-bold ml-0.5">*</span></label>
              <select
                value={schedule.numberOfTerms}
                onChange={e => handleNumTermsChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-extrabold text-xs text-slate-900 dark:text-white"
              >
                <option value="1">1 Term (Annual)</option>
                <option value="2">2 Terms (Semester-wise)</option>
                <option value="3">3 Terms (Tri-semester)</option>
                <option value="4">4 Terms (Quarterly-aligned)</option>
                <option value="6">6 Terms (Bi-monthly)</option>
                <option value="12">12 Terms (Monthly Billing)</option>
              </select>
            </div>

            {/* Configurable Due Date Offset Field */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Due Date Offset <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={dueDateOffsetDays}
                  onChange={e => handleOffsetChange(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-xs text-slate-900 dark:text-white text-center outline-none focus:border-brand-500 shadow-xs"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">days after term start</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-normal pt-0.5">
                Due dates are automatically calculated from each term's start date using this offset. Individual due dates can be edited when required.
              </p>
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3.5 border border-sky-100 dark:border-sky-900/40 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
              <p className="font-medium leading-relaxed">
                {schedule.numberOfTerms === 1
                  ? 'Annual Fee Schedule: The entire academic year is scheduled as 1 annual term with 1 automatically calculated Due Date (Start + offset days).'
                  : schedule.numberOfTerms === 12
                  ? 'Monthly Billing: Fee obligations are split across 12 monthly due dates.'
                  : `Term Schedule: Split into ${schedule.numberOfTerms} terms across the Academic Year duration. Each term gets 1 Due Date calculated as Start + ${dueDateOffsetDays} days.`}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {schedule.numberOfTerms === 1
                  ? 'Configure Annual Term Due Date (1 Term)'
                  : schedule.numberOfTerms === 12
                  ? 'Configure Monthly Billing Due Dates (12 Terms)'
                  : `Configure Term Due Dates (${schedule.numberOfTerms} Terms)`}
              </h4>
              <span className="px-2.5 py-1 text-[10px] rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                {schedule.status === 'Active' ? 'Published' : 'Draft'}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1.5">
              {(schedule.terms || []).map((term, index) => (
                <div key={term.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px]">
                        {schedule.numberOfTerms === 1 ? 'Annual Term (Full Year)' : `Installment #${index + 1}`}
                      </span>
                      {term.dueDateMode === 'MANUAL' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] border border-amber-300 dark:border-amber-800">
                          Manual Override
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Automatically calculated: Start + {dueDateOffsetDays} days
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {term.dueDateMode === 'MANUAL' && (
                        <button
                          type="button"
                          onClick={() => handleResetTermToAuto(index)}
                          className="text-[11px] font-black text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Reset to automatic calculation (Start + offset days)"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset to Automatic
                        </button>
                      )}
                      <input
                        type="text"
                        value={term.termName}
                        onChange={e => handleTermFieldChange(index, 'termName', e.target.value)}
                        placeholder="e.g. Term 1"
                        className="border-b border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-xs font-black text-slate-900 dark:text-white text-right outline-none focus:border-brand-500 pb-0.5 w-28"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500">Start Date</label>
                        <span title="System-generated from Academic Year Configuration">
                          <Lock className="w-3 h-3 text-slate-400" />
                        </span>
                      </div>
                      <input
                        type="date"
                        value={term.startDate}
                        readOnly
                        disabled
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500">End Date</label>
                        <span title="System-generated from Academic Year Configuration">
                          <Lock className="w-3 h-3 text-slate-400" />
                        </span>
                      </div>
                      <input
                        type="date"
                        value={term.endDate}
                        readOnly
                        disabled
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-600 flex items-center justify-between">
                        <span>{schedule.numberOfTerms === 1 ? 'Annual Term Due Date' : 'Due Date'}</span>
                        {term.dueDateMode === 'MANUAL' && <span className="text-[9px] text-amber-600 font-black">✏️ Manual</span>}
                      </label>
                      <DateInput
                        value={term.dueDate}
                        onChange={e => handleTermFieldChange(index, 'dueDate', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg font-black text-[11px] text-slate-900 dark:text-white ${
                          term.dueDateMode === 'MANUAL'
                            ? 'bg-amber-50/50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-950 border border-brand-200 dark:border-brand-900/60'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Monthly Due Date Configuration — ONLY SHOWN WHEN NUMBER OF TERMS IS 12 (MONTHLY BILLING) */}
        {schedule.numberOfTerms === 12 && (
          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-sky-500" /> Monthly Due Date Configuration (12 Months)
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={monthlyConfig.applySameDayToAllMonths}
                    onChange={e => handleToggleApplySameDay(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Apply same due day to all months</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Due Day:</span>
                  <select
                    value={monthlyConfig.dueDay}
                    onChange={e => handleDueDayChange(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-extrabold text-xs text-slate-900 dark:text-white outline-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {monthlyConfig.monthDueDates.map((item, index) => (
                <div key={index} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">{item.monthName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Month #{index + 1}</span>
                  </div>
                  <DateInput
                    value={item.dueDate}
                    onChange={e => handleMonthDateChange(index, e.target.value)}
                    className="w-32 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: One-Time & Miscellaneous Fee Due Dates */}
        <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
          {(schedule.numberOfTerms || 4) > 1 && (
            <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" /> Annual Lump-Sum Fee Due Date
              </h4>
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Due Date:</label>
                <DateInput
                  value={annualDueDate}
                  onChange={e => setAnnualDueDate(e.target.value)}
                  className="w-36 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div className={`space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 ${(schedule.numberOfTerms || 4) === 1 ? 'md:col-span-2' : ''}`}>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" /> One-Time / Admission Fee Due Date
            </h4>
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Due Date:</label>
              <DateInput
                value={oneTimeDueDate}
                onChange={e => setOneTimeDueDate(e.target.value)}
                className="w-36 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveSchedule}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 cursor-pointer transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving to Database...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save & Publish Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


