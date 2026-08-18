import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Clock, Search, AlertCircle, IndianRupee, Filter, Calendar } from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

interface DueFeesViewProps {
  onCollectStudentFee: (student: Student) => void;
}

export const DueFeesView: React.FC<DueFeesViewProps> = ({ onCollectStudentFee }) => {
  const {
    students,
    getStudentFeeLedger,
    academicClasses,
    academicYearFeeSchedules,
    feeHeads,
    financeSettings
  } = useData();

  const { selectedAcademicYear } = useAuth();

  const activeAYDefault = selectedAcademicYear || financeSettings?.academicYear || "2026-2027";

  const [query, setQuery] = useState('');
  const [selectedAY, setSelectedAY] = useState(activeAYDefault);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('All');
  const [selectedFeeHead, setSelectedFeeHead] = useState('All');
  const [selectedDueDate, setSelectedDueDate] = useState('All');
  const [timelineFilter, setTimelineFilter] = useState<'All' | 'Overdue' | 'Current' | 'Upcoming'>('All');

  const uniqueSections = Array.from(new Set(students.map(st => st.section))).filter(Boolean).sort();
  const scheduleForAY = academicYearFeeSchedules.find(s => s.academicYear === selectedAY);
  const termsList = scheduleForAY ? scheduleForAY.terms : [];
  const uniqueDueDates = Array.from(new Set(termsList.map((t: any) => t.dueDate))).filter(Boolean).sort();

  // 1. Gather all student installments for the selected academic year
  const allInstallments: { student: Student; installment: any; academicYear: string }[] = [];

  students.forEach(st => {
    // Basic class & section filters for efficiency
    if (selectedClass !== 'All' && st.className !== selectedClass) return;
    if (selectedSection !== 'All' && st.section !== selectedSection) return;

    const ledger = getStudentFeeLedger(st.id, selectedAY);
    if (ledger && ledger.installments) {
      ledger.installments.forEach(inst => {
        allInstallments.push({
          student: st,
          installment: inst,
          academicYear: selectedAY
        });
      });
    }
  });

  const todayStr = new Date().toISOString().split("T")[0];

  // 2. Filter installments based on user selections
  const filteredInstallments = allInstallments.filter(item => {
    const inst = item.installment;
    const st = item.student;

    // Skip fully paid installments for dues view
    if (inst.dueAmount <= 0) return false;

    // Search query filter
    const matchesQuery = query.trim() === '' || 
      `${st.firstName} ${st.lastName}`.toLowerCase().includes(query.toLowerCase()) || 
      st.admissionNo.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;

    // Term filter
    if (selectedTerm !== 'All' && inst.termId !== selectedTerm && inst.termName !== selectedTerm) return false;

    // Fee Head filter
    if (selectedFeeHead !== 'All' && inst.feeHeadId !== selectedFeeHead && inst.feeHeadName !== selectedFeeHead) return false;

    // Due Date filter
    if (selectedDueDate !== 'All' && inst.dueDate !== selectedDueDate) return false;

    // Timeline Filter (Overdue, Current, Upcoming)
    if (timelineFilter === 'Overdue') {
      if (inst.dueDate >= todayStr) return false;
    } else if (timelineFilter === 'Current') {
      // Current active term check
      const currentTermObj = termsList.find((t: any) => todayStr >= t.startDate && todayStr <= t.endDate);
      const isCurrent = currentTermObj && (inst.termId === currentTermObj.id || inst.termName === currentTermObj.termName);
      if (!isCurrent) return false;
    } else if (timelineFilter === 'Upcoming') {
      if (inst.dueDate < todayStr) return false;
    }

    return true;
  });

  const totalOutstanding = filteredInstallments.reduce((acc, item) => acc + item.installment.dueAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in">

      {/* Summary KPI Banner */}
      <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-rose-500 bg-white dark:bg-slate-900 shadow-xs">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase">Filtered Outstanding Dues</p>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalOutstanding)}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Found {filteredInstallments.length} pending installment records</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-sky-500" /> Filter
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Search Student</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Name or Admission No..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Academic Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Academic Year</label>
            <select
              value={selectedAY}
              onChange={e => setSelectedAY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              {academicYearFeeSchedules.map(s => (
                <option key={s.id} value={s.academicYear}>{s.academicYear}</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Class Grade</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Classes</option>
              {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Section */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Sections</option>
              {uniqueSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>

          {/* Term */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Term / Installment</label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Terms</option>
              {termsList.map(t => (
                <option key={t.id} value={t.id}>{t.termName}</option>
              ))}
            </select>
          </div>

          {/* Fee Head */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Fee Head Type</label>
            <select
              value={selectedFeeHead}
              onChange={e => setSelectedFeeHead(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Fee Heads</option>
              {feeHeads.map(fh => (
                <option key={fh.id} value={fh.id}>{fh.name}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Due Date</label>
            <select
              value={selectedDueDate}
              onChange={e => setSelectedDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Due Dates</option>
              {uniqueDueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Timeline Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Dues Timeline Status</label>
            <select
              value={timelineFilter}
              onChange={e => setTimelineFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Overdue">Overdue (Past Due Date)</option>
              <option value="Current">Current Active Term Dues</option>
              <option value="Upcoming">Upcoming (Future Due Date)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dues Installments Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Academic Year</th>
                <th className="py-3.5 px-4">Term</th>
                <th className="py-3.5 px-4">Fee Head</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 font-mono text-right">Amount</th>
                <th className="py-3.5 px-4 font-mono text-right">Paid</th>
                <th className="py-3.5 px-4 font-mono text-right">Outstanding</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Collect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredInstallments.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 text-xs font-bold italic">
                    No student installment records found matching the configured filters.
                  </td>
                </tr>
              ) : (
                filteredInstallments.map((item, idx) => {
                  const inst = item.installment;
                  const st = item.student;
                  const isOverdue = inst.dueDate < todayStr;
                  const timelineStatus = isOverdue ? 'Overdue' : 'Upcoming';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{st.admissionNo}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-bold">{st.className}-{st.section}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500 font-mono">{item.academicYear}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{inst.termName || 'Term 1'}</td>
                      <td className="py-3 px-4 font-bold text-slate-950 dark:text-slate-50">{inst.feeHeadName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{inst.dueDate}</td>
                      <td className="py-3 px-4 font-mono text-right text-slate-600 dark:text-slate-400">{formatCurrency(inst.amount)}</td>
                      <td className="py-3 px-4 font-mono text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(inst.paidAmount)}</td>
                      <td className="py-3 px-4 font-mono text-right text-rose-600 dark:text-rose-400 font-black">{formatCurrency(inst.dueAmount)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            isOverdue 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          }`}
                        >
                          {timelineStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onCollectStudentFee(st)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <IndianRupee className="w-3.5 h-3.5" /> Collect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
