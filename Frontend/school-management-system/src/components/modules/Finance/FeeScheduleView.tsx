import React, { useState, useEffect } from 'react';
import { Calendar, ShieldAlert, Save, Clock, CalendarDays } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { AcademicYearFeeSchedule, FeeScheduleTerm, MonthlyDueDateConfig, MonthDueDateItem } from '../../../types';

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

  // Current editing schedule or a default one
  const [schedule, setSchedule] = useState<Partial<AcademicYearFeeSchedule>>({
    academicYear: '',
    numberOfTerms: 4,
    terms: []
  });

  const [monthlyConfig, setMonthlyConfig] = useState<MonthlyDueDateConfig>(() =>
    buildDefaultMonthlyConfig('2026-2027', 10)
  );
  const [annualDueDate, setAnnualDueDate] = useState<string>('2026-04-15');
  const [oneTimeDueDate, setOneTimeDueDate] = useState<string>('2026-04-15');

  useEffect(() => {
    if (!activeAY) return;
    const yearStart = activeAY.split('-')[0] || '2026';
    const yearEnd = activeAY.split('-')[1] || '2027';

    const existing = academicYearFeeSchedules.find(s => s.academicYear === activeAY);
    if (existing) {
      setSchedule(JSON.parse(JSON.stringify(existing)));
      setMonthlyConfig(
        existing.monthlyConfig
          ? JSON.parse(JSON.stringify(existing.monthlyConfig))
          : buildDefaultMonthlyConfig(activeAY, 10)
      );
      setAnnualDueDate(existing.annualDueDate || `${yearStart}-04-15`);
      setOneTimeDueDate(existing.oneTimeDueDate || `${yearStart}-04-15`);
    } else {
      // Create a default schedule for this academic year
      setSchedule({
        id: `SCH-${activeAY}`,
        academicYear: activeAY,
        numberOfTerms: 4,
        status: 'Inactive',
        terms: [
          {
            id: `T1-${activeAY}`,
            termName: 'Term 1',
            startDate: `${yearStart}-04-01`,
            endDate: `${yearStart}-06-30`,
            dueDate: `${yearStart}-04-15`,
            sequence: 1,
            status: 'Active'
          },
          {
            id: `T2-${activeAY}`,
            termName: 'Term 2',
            startDate: `${yearStart}-07-01`,
            endDate: `${yearStart}-09-30`,
            dueDate: `${yearStart}-07-15`,
            sequence: 2,
            status: 'Active'
          },
          {
            id: `T3-${activeAY}`,
            termName: 'Term 3',
            startDate: `${yearStart}-10-01`,
            endDate: `${yearStart}-12-31`,
            dueDate: `${yearStart}-10-15`,
            sequence: 3,
            status: 'Active'
          },
          {
            id: `T4-${activeAY}`,
            termName: 'Term 4',
            startDate: `${yearEnd}-01-01`,
            endDate: `${yearEnd}-03-31`,
            dueDate: `${yearEnd}-01-15`,
            sequence: 4,
            status: 'Active'
          }
        ]
      });
      setMonthlyConfig(buildDefaultMonthlyConfig(activeAY, 10));
      setAnnualDueDate(`${yearStart}-04-15`);
      setOneTimeDueDate(`${yearStart}-04-15`);
    }
  }, [activeAY, academicYearFeeSchedules]);

  const handleNumTermsChange = (num: number) => {
    const currentTerms = schedule.terms || [];
    let updatedTerms = [...currentTerms];

    if (num > currentTerms.length) {
      for (let i = currentTerms.length; i < num; i++) {
        updatedTerms.push({
          id: `T${i + 1}-${activeAY}-${Math.floor(Math.random() * 1000)}`,
          termName: `Term ${i + 1}`,
          startDate: '',
          endDate: '',
          dueDate: '',
          sequence: i + 1,
          status: 'Active'
        });
      }
    } else {
      updatedTerms = updatedTerms.slice(0, num);
    }

    setSchedule(prev => ({
      ...prev,
      numberOfTerms: num,
      terms: updatedTerms
    }));
  };

  const handleTermFieldChange = (index: number, field: keyof FeeScheduleTerm, value: any) => {
    const updatedTerms = [...(schedule.terms || [])];
    updatedTerms[index] = {
      ...updatedTerms[index],
      [field]: value
    };
    setSchedule(prev => ({
      ...prev,
      terms: updatedTerms
    }));
  };

  // Monthly Due Date Configuration Handlers
  const handleToggleApplySameDay = (checked: boolean) => {
    if (checked) {
      const regenerated = buildDefaultMonthlyConfig(activeAY, monthlyConfig.dueDay || 10);
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
      const regenerated = buildDefaultMonthlyConfig(activeAY, newDay);
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

    // Term-wise / Quarterly Validations
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
        addToast('error', 'Validation Error', `Dates are mandatory for ${term.termName}.`);
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

      if (due < start || due > end) {
        addToast('warning', 'Schedule Warning', `Due Date for ${term.termName} is outside its start and end dates.`);
      }

      // Check overlap with other terms
      for (let j = i + 1; j < terms.length; j++) {
        const other = terms[j];
        if (other.startDate && other.endDate) {
          const oStart = new Date(other.startDate);
          const oEnd = new Date(other.endDate);
          if (start <= oEnd && end >= oStart) {
            addToast('error', 'Validation Error', `Date ranges of ${term.termName} and ${other.termName} cannot overlap.`);
            return false;
          }
        }
      }
    }

    // Monthly Due Dates Validation
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

    // Annual Due Date Validation
    if (!annualDueDate || annualDueDate.trim() === '') {
      addToast('error', 'Validation Error', 'Annual Fee Due Date is required.');
      return false;
    }
    if (isNaN(new Date(annualDueDate).getTime())) {
      addToast('error', 'Validation Error', 'Invalid Annual Fee Due Date.');
      return false;
    }

    // One-Time Due Date Validation
    if (!oneTimeDueDate || oneTimeDueDate.trim() === '') {
      addToast('error', 'Validation Error', 'One-Time Fee Due Date is required.');
      return false;
    }
    if (isNaN(new Date(oneTimeDueDate).getTime())) {
      addToast('error', 'Validation Error', 'Invalid One-Time Fee Due Date.');
      return false;
    }

    return true;
  };

  const handleSaveSchedule = () => {
    if (!validateSchedule()) return;

    const finalSchedule: AcademicYearFeeSchedule = {
      id: schedule.id || `SCH-${activeAY}`,
      academicYear: activeAY,
      numberOfTerms: schedule.numberOfTerms || 4,
      terms: (schedule.terms || []).map(t => ({ ...t, status: 'Active' })),
      status: 'Active',
      monthlyConfig,
      annualDueDate,
      oneTimeDueDate
    };

    setAcademicYearFeeSchedules(prev => [
      ...prev.filter(s => s.academicYear !== activeAY),
      finalSchedule
    ]);

    addToast('success', 'Fee Schedule Published', `Successfully published ${activeAY} academic year fee schedule with frequency due dates.`);
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
              <p className="text-xs text-slate-500">Configure frequency-based due dates for Monthly, Term-wise/Quarterly, Annual, and One-Time fee structures</p>
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

        {/* Section 1: Term-wise / Quarterly Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Term / Quarterly Setup</h4>
            
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Number of Installment Terms *</label>
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
              </select>
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3.5 border border-sky-100 dark:border-sky-900/40 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
              <p className="font-medium leading-relaxed">
                Term due dates define obligations for fee heads configured with Term-wise or Quarterly frequency.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Configure Term Due Dates (Term-wise / Quarterly)</h4>
              <span className="px-2.5 py-1 text-[10px] rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                {schedule.status === 'Active' ? 'Published' : 'Draft'}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1.5">
              {(schedule.terms || []).map((term, index) => (
                <div key={term.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px]">
                      Installment #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={term.termName}
                      onChange={e => handleTermFieldChange(index, 'termName', e.target.value)}
                      placeholder="e.g. Term 1"
                      className="border-b border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-xs font-black text-slate-900 dark:text-white text-right outline-none focus:border-brand-500 pb-0.5 w-1/2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Start Date</label>
                      <input
                        type="date"
                        value={term.startDate}
                        onChange={e => handleTermFieldChange(index, 'startDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-[11px] text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">End Date</label>
                      <input
                        type="date"
                        value={term.endDate}
                        onChange={e => handleTermFieldChange(index, 'endDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-[11px] text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-600">Due Date</label>
                      <input
                        type="date"
                        value={term.dueDate}
                        onChange={e => handleTermFieldChange(index, 'dueDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-brand-200 dark:border-brand-900/60 font-black text-[11px] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Monthly Due Date Configuration */}
        <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-500" /> Monthly Due Date Configuration
              </h4>
              <p className="text-[11px] text-slate-500">
                Applied to fee heads configured with Monthly frequency (e.g. Tuition Fee, Hostel Fee)
              </p>
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
                <input
                  type="date"
                  value={item.dueDate}
                  onChange={e => handleMonthDateChange(index, e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Annual & One-Time Fee Due Dates */}
        <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" /> Annual Fee Due Date
            </h4>
            <p className="text-[11px] text-slate-500">
              Applied to fee heads configured with Annual frequency (e.g. Textbook Fee, Sports Fee)
            </p>
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Due Date:</label>
              <input
                type="date"
                value={annualDueDate}
                onChange={e => setAnnualDueDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" /> One-Time Fee Due Date
            </h4>
            <p className="text-[11px] text-slate-500">
              Applied to fee heads configured with One-Time frequency (e.g. Admission Fee, Caution Deposit)
            </p>
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Due Date:</label>
              <input
                type="date"
                value={oneTimeDueDate}
                onChange={e => setOneTimeDueDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveSchedule}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" /> Save & Publish Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
