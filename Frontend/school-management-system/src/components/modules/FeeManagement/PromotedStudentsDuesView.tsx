import React, { useState, useMemo } from "react";
import {
  IndianRupee,
  Search,
  AlertCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  Receipt,
  UserCheck,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { Student, PromotedStudentWithDues } from "../../../types";
import { useData } from "../../../context/DataContext";
import { formatCurrency } from "../../../utils/currency";
import { ExportButton } from "../../common/ExportButton";

interface PromotedStudentsDuesViewProps {
  onCollectDue: (student: Student) => void;
}

export const PromotedStudentsDuesView: React.FC<PromotedStudentsDuesViewProps> = ({
  onCollectDue,
}) => {
  const { getPromotedStudentsWithPreviousDues, academicClasses } = useData();

  // Filters State
  const [prevYearFilter, setPrevYearFilter] = useState<string>("All");
  const [classFilter, setClassFilter] = useState<string>("All");
  const [sectionFilter, setSectionFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Expandable Rows State (set of student IDs)
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(
    new Set(),
  );

  // Fetch promoted students with previous dues from context engine
  const allPromotedWithDues = useMemo(() => {
    return getPromotedStudentsWithPreviousDues();
  }, [getPromotedStudentsWithPreviousDues]);

  // Extract unique academic years for dropdown filters
  const allPrevYearsOptions = useMemo(() => {
    const years = new Set<string>();
    allPromotedWithDues.forEach((p) => {
      p.previousAcademicYears.forEach((y) => years.add(y));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allPromotedWithDues]);

  // Filtered List
  const filteredPromotedStudents = useMemo(() => {
    return allPromotedWithDues.filter((item) => {
      const { student, previousAcademicYears, status, previousYearPendingAmount } = item;

      // Rule 3: Must have previousYearPendingAmount > 0
      if (previousYearPendingAmount <= 0) return false;

      // Search Query filter (Student Name or Admission No)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        const admNo = (student.admissionNo || "").toLowerCase();
        if (!fullName.includes(q) && !admNo.includes(q)) {
          return false;
        }
      }

      // Previous Academic Year filter
      if (prevYearFilter !== "All") {
        if (!previousAcademicYears.includes(prevYearFilter)) {
          return false;
        }
      }

      // Class filter (Current class)
      if (classFilter !== "All") {
        if (student.className !== classFilter) {
          return false;
        }
      }

      // Section filter (Current section)
      if (sectionFilter !== "All") {
        if (student.section !== sectionFilter) {
          return false;
        }
      }

      // Due Status filter
      if (statusFilter !== "All") {
        if (status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    allPromotedWithDues,
    searchQuery,
    prevYearFilter,
    classFilter,
    sectionFilter,
    statusFilter,
  ]);

  // KPI Calculations based on currently filtered students
  const totalPromotedCount = filteredPromotedStudents.length;
  const totalPreviousOutstandingSum = filteredPromotedStudents.reduce(
    (sum, item) => sum + item.previousYearPendingAmount,
    0,
  );

  const toggleExpandRow = (studentId: string) => {
    setExpandedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setPrevYearFilter("All");
    setClassFilter("All");
    setSectionFilter("All");
    setStatusFilter("All");
    setSearchQuery("");
  };

  const isFilterActive =
    prevYearFilter !== "All" ||
    classFilter !== "All" ||
    sectionFilter !== "All" ||
    statusFilter !== "All" ||
    searchQuery !== "";

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-sky-200/80 dark:border-sky-900/60 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 dark:from-slate-900 dark:to-slate-800/80 flex items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">
              <UserCheck className="w-4 h-4" />
              Promoted Students with Previous Dues
            </div>
            <h3 className="text-3xl font-black text-sky-900 dark:text-sky-100 mt-1 font-mono">
              {totalPromotedCount}
            </h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
            <Clock className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 dark:from-slate-900 dark:to-slate-800/80 flex items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
              <IndianRupee className="w-4 h-4" />
              Total Previous Academic Year Outstanding
            </div>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
              {formatCurrency(totalPreviousOutstandingSum)}
            </h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/20">
            <AlertCircle className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card p-4 rounded-2xl space-y-3 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Filter Promoted Students Dues
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
            <ExportButton
              data={filteredPromotedStudents.map((item) => ({
                StudentName: `${item.student.firstName} ${item.student.lastName}`,
                AdmissionNo: item.student.admissionNo,
                PreviousYears: item.previousAcademicYears.join(", "),
                PreviousClass: item.previousClass,
                CurrentClass: item.currentClass,
                PreviousPendingAmount: item.previousYearPendingAmount,
                PendingComponents: item.pendingComponentsCount,
                Status: item.status,
              }))}
              filename="promoted_students_previous_dues"
            />
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Search Student / Admission No
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or ADM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Previous Academic Year Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Previous Academic Year
            </label>
            <select
              value={prevYearFilter}
              onChange={(e) => setPrevYearFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Previous Years</option>
              {allPrevYearsOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Current Class / Grade
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Classes</option>
              {academicClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Due Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Due">Due</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Promoted Students Dues Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-3 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Admission No</th>
                <th className="py-3.5 px-4">Previous AY(s)</th>
                <th className="py-3.5 px-4">Previous Class</th>
                <th className="py-3.5 px-4">Current Class</th>
                <th className="py-3.5 px-4 text-right">Previous Pending (₹)</th>
                <th className="py-3.5 px-4 text-center">Components</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPromotedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        No Promoted Students with Previous Dues
                      </p>
                      <p className="text-xs text-slate-400">
                        {isFilterActive
                          ? "Try adjusting your search query or filter criteria."
                          : "All promoted students have cleared their previous academic year fee obligations!"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPromotedStudents.map((item) => {
                  const {
                    student,
                    previousYearPendingAmount,
                    previousAcademicYears,
                    previousClass,
                    currentClass,
                    pendingComponentsCount,
                    status,
                    breakdownByYear,
                  } = item;

                  const isExpanded = expandedStudentIds.has(student.id);

                  // Status Badge colors
                  let badgeBg = "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
                  if (status === "Overdue") {
                    badgeBg = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
                  } else if (status === "Partially Paid") {
                    badgeBg = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
                  }

                  return (
                    <React.Fragment key={student.id}>
                      <tr className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${isExpanded ? 'bg-amber-50/30 dark:bg-slate-800/40' : ''}`}>
                        {/* Expand Toggle */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => toggleExpandRow(student.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Toggle multi-year breakdown"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-amber-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                student.avatar ||
                                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
                              }
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <span className="block font-black hover:text-brand-600 transition-colors cursor-pointer" onClick={() => toggleExpandRow(student.id)}>
                                {student.firstName} {student.lastName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                Roll: {student.rollNo || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Admission No */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {student.admissionNo}
                        </td>

                        {/* Previous Academic Year(s) */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {previousAcademicYears.map((ay) => (
                              <span
                                key={ay}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200"
                              >
                                {ay}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Previous Class */}
                        <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-400">
                          {previousClass || "Class 5"}
                        </td>

                        {/* Current Class */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {currentClass}
                        </td>

                        {/* Previous Pending Amount */}
                        <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm font-mono">
                          {formatCurrency(previousYearPendingAmount)}
                        </td>

                        {/* Pending Components Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-extrabold text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                            {pendingComponentsCount} item{pendingComponentsCount !== 1 ? 's' : ''}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl border text-[11px] font-extrabold ${badgeBg}`}
                          >
                            {status}
                          </span>
                        </td>

                        {/* Action: Collect Due */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onCollectDue(student)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 ml-auto transition-all cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Collect Due
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Multi-Year Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-amber-50/40 dark:bg-slate-900/60">
                          <td colSpan={10} className="p-4 sm:p-5 border-y border-amber-200/80 dark:border-amber-900/50">
                            <div className="space-y-4 max-w-5xl mx-auto">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-amber-600" />
                                  Itemized Previous Academic Year Dues Breakdown ({student.firstName} {student.lastName})
                                </h5>
                                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                                  Total Dues: {formatCurrency(previousYearPendingAmount)}
                                </span>
                              </div>

                              {breakdownByYear.map((bGroup) => (
                                <div
                                  key={bGroup.academicYear}
                                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-amber-200/80 dark:border-amber-900/60 space-y-3 shadow-xs"
                                >
                                  <div className="flex items-center justify-between pb-2 border-b border-amber-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-mono font-extrabold text-xs">
                                        Academic Year: {bGroup.academicYear}
                                      </span>
                                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        Class: {bGroup.className || previousClass}
                                      </span>
                                    </div>
                                    <div className="text-xs font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                                      Year Pending: {formatCurrency(bGroup.totalPending)}
                                    </div>
                                  </div>

                                  {/* Table of fee items in this year */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px]">
                                      <thead>
                                        <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                                          <th className="py-2 px-3">Fee Type / Head</th>
                                          <th className="py-2 px-3">Term / Component</th>
                                          <th className="py-2 px-3">Due Date</th>
                                          <th className="py-2 px-3 text-right">Original (₹)</th>
                                          <th className="py-2 px-3 text-right">Paid (₹)</th>
                                          <th className="py-2 px-3 text-right">Pending (₹)</th>
                                          <th className="py-2 px-3 text-center">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {bGroup.items.map((inst) => (
                                          <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                                              {inst.feeHeadName}
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">
                                              {inst.termName || inst.termId || "Obligation"}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-slate-500">
                                              {inst.dueDate || "N/A"}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300 font-bold">
                                              {formatCurrency(inst.originalAmount || inst.amount || (inst.paidAmount + inst.dueAmount))}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-emerald-600 font-bold">
                                              {formatCurrency(inst.paidAmount)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-rose-600 font-black">
                                              {formatCurrency(inst.dueAmount)}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                inst.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                                inst.status === 'Partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                                'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                              }`}>
                                                {inst.status}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
