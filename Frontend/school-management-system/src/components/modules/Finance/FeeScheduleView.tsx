import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, ShieldAlert, CheckCircle, Save } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { AcademicYearFeeSchedule, FeeScheduleTerm } from '../../../types';

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

  useEffect(() => {
    if (!activeAY) return;
    const existing = academicYearFeeSchedules.find(s => s.academicYear === activeAY);
    if (existing) {
      setSchedule(JSON.parse(JSON.stringify(existing)));
    } else {
      // Create a default 4-term schedule for this academic year
      const yearStart = activeAY.split('-')[0] || '2026';
      const yearEnd = activeAY.split('-')[1] || '2027';
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
    }
  }, [activeAY, academicYearFeeSchedules]);

  const handleNumTermsChange = (num: number) => {
    const currentTerms = schedule.terms || [];
    let updatedTerms = [...currentTerms];

    if (num > currentTerms.length) {
      // Append terms
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
      // Truncate terms
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

  const validateSchedule = (): boolean => {
    if (!schedule.academicYear) {
      addToast('error', 'Validation Error', 'Academic Year is mandatory.');
      return false;
    }

    const terms = schedule.terms || [];
    if (terms.length === 0) {
      addToast('error', 'Validation Error', 'You must configure at least one term.');
      return false;
    }

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      if (!term.termName.trim()) {
        addToast('error', 'Validation Error', `Term ${i + 1} Name is required.`);
        return false;
      }
      if (!term.startDate || !term.endDate || !term.dueDate) {
        addToast('error', 'Validation Error', `Dates are mandatory for ${term.termName}.`);
        return false;
      }

      const start = new Date(term.startDate);
      const end = new Date(term.endDate);
      const due = new Date(term.dueDate);

      if (end <= start) {
        addToast('error', 'Validation Error', `${term.termName} End Date must be after Start Date.`);
        return false;
      }

      // Check if due date is within term range
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

    return true;
  };

  const handleSaveSchedule = () => {
    if (!validateSchedule()) return;

    const finalSchedule: AcademicYearFeeSchedule = {
      id: schedule.id || `SCH-${activeAY}`,
      academicYear: activeAY,
      numberOfTerms: schedule.numberOfTerms || 4,
      terms: (schedule.terms || []).map(t => ({ ...t, status: 'Active' })),
      status: 'Active'
    };

    setAcademicYearFeeSchedules(prev => [
      ...prev.filter(s => s.academicYear !== activeAY),
      finalSchedule
    ]);

    addToast('success', 'Fee Schedule Published', `Successfully published ${activeAY} academic year fee schedule.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Fee Schedule Management</h3>
              <p className="text-xs text-slate-500">Configure academic year installment dates, terms and collection due dates</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Schedule Configuration</h4>
            
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
                Updating the term configuration will regenerate term names and date range slots. Ensure you configure term limits before assigning fee structures to students.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Configure Installment Terms</h4>
              <span className="px-2.5 py-1 text-[10px] rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                {schedule.status === 'Active' ? 'Published' : 'Draft'}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1.5">
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
                      <label className="text-[10px] font-bold text-slate-500 text-brand-600">Due Date</label>
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" /> Save & Publish Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
