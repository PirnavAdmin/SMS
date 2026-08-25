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

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Gather student-wise due summaries for the selected academic year
  const studentDueList: {
    student: Student;
    academicYear: string;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    earliestDueDate: string;
    isOverdue: boolean;
    unpaidCount: number;
  }[] = [];

  students.forEach((st) => {
    // Basic class & section filters
    if (selectedClass !== "All" && st.className !== selectedClass) return;
    if (selectedSection !== "All" && st.section !== selectedSection) return;

    // Search query filter
    const matchesQuery =
      query.trim() === "" ||
      `${st.firstName} ${st.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
      st.admissionNo.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return;

    const ledger = getStudentFeeLedger(st.id, selectedAY);
    if (!ledger || !ledger.installments || ledger.installments.length === 0) return;

    const unpaidInsts = ledger.installments.filter((inst) => inst.dueAmount > 0);
    if (unpaidInsts.length === 0) return;

    const totalAmount = ledger.installments.reduce((sum, inst) => sum + inst.amount, 0);
    const totalPaid = ledger.installments.reduce((sum, inst) => sum + inst.paidAmount, 0);
    const totalOutstanding = unpaidInsts.reduce((sum, inst) => sum + inst.dueAmount, 0);

    const overdueInsts = unpaidInsts.filter((inst) => inst.dueDate <= todayStr);
    const overdueAmount = overdueInsts.reduce((sum, inst) => sum + inst.dueAmount, 0);

    const dueDates = unpaidInsts.map((inst) => inst.dueDate).sort();
    const earliestDueDate = dueDates[0] || todayStr;
    const isOverdue = overdueAmount > 0 || (dueDates.length > 0 && dueDates[0] < todayStr);

    // Timeline Filter
    if (timelineFilter === "Overdue" && !isOverdue) return;
    if (timelineFilter === "Upcoming" && isOverdue) return;

    studentDueList.push({
      student: st,
      academicYear: selectedAY,
      totalAmount,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      earliestDueDate,
      isOverdue,
      unpaidCount: unpaidInsts.length,
    });
  });

  // 2. Sort by Highest Outstanding Dues First at Top
  studentDueList.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  const totalOutstandingSum = studentDueList.reduce((acc, item) => acc + item.totalOutstanding, 0);
  const totalOverdueSum = studentDueList.reduce((acc, item) => acc + item.overdueAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-rose-500 bg-white dark:bg-slate-900 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Outstanding Dues</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(totalOutstandingSum)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Across {studentDueList.length} students with pending dues
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Overdue Amount (Due to Date)</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(totalOverdueSum)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Immediate payable amount past due dates
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Box */}
      <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-sky-500" /> Filter Dues Directory
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
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Academic Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Academic Year</label>
            <select
              value={selectedAY}
              onChange={(e) => setSelectedAY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              {academicYearFeeSchedules.map((s) => (
                <option key={s.id} value={s.academicYear}>
                  {s.academicYear}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Class Grade</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Classes</option>
              {academicClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Timeline Filter */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-500">Dues Status Filter</label>
            <select
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Statuses (Overdue & Upcoming)</option>
              <option value="Overdue">Overdue Dues Only (Past Due Date)</option>
              <option value="Upcoming">Upcoming Dues Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student-Wise Dues Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[10px]">
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Earliest Due Date</th>
                <th className="py-3.5 px-4 font-mono text-right">Total Fee</th>
                <th className="py-3.5 px-4 font-mono text-right">Amount Paid</th>
                <th className="py-3.5 px-4 font-mono text-right">Overdue to Date</th>
                <th className="py-3.5 px-4 font-mono text-right">Total Outstanding</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {studentDueList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs font-bold italic">
                    No student due records found matching the configured filters.
                  </td>
                </tr>
              ) : (
                studentDueList.map((item) => {
                  const st = item.student;
                  const displayClassStr = st.className
                    ? st.className.toLowerCase().startsWith("class")
                      ? `${st.className}-${st.section}`
                      : `Class ${st.className}-${st.section}`
                    : `Section ${st.section}`;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {st.admissionNo || st.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-brand-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {st.firstName?.[0] || "S"}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {st.firstName} {st.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.unpaidCount} Pending Term(s)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold">
                        {displayClassStr}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.earliestDueDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatCurrency(item.totalPaid)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-amber-600 dark:text-amber-400 font-bold">
                        {formatCurrency(item.overdueAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-rose-600 dark:text-rose-400 font-black text-xs">
                        {formatCurrency(item.totalOutstanding)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            item.isOverdue
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                          }`}
                        >
                          {item.isOverdue ? "OVERDUE" : "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onCollectStudentFee(st)}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1 ml-auto cursor-pointer transition-all"
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
