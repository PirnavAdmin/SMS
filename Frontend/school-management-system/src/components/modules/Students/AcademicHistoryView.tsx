import React, { useState, useMemo } from 'react';
import {
  History, Search, Filter, Download, Upload, CheckCircle2, AlertCircle,
  FileSpreadsheet, User, ArrowRight, Eye, ShieldAlert, Award, Calendar, BookOpen, UserX, Building2, ArrowUpRight
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { AcademicHistoryRecord, AcademicYearStatus, Student } from '../../../types';
import { StudentProfileDrawer } from './StudentProfileDrawer';
import { AcademicHistoryImportModal } from './AcademicHistoryImportModal';

export const AcademicHistoryView: React.FC = () => {
  const { students, academicClasses, academicYears, attendance, examMarks, feePayments, studentFeeAssignments, importHistoricalAcademicData } = useData();
  const { selectedAcademicYear, setSelectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();

  // Filters State
  const [filterYear, setFilterYear] = useState<string>(selectedAcademicYear || '2025-2026');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterBranch, setFilterBranch] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Student Drawer State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [csvText, setCsvText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);

  // Sync filterYear with global academic year when changed
  const handleYearChange = (ay: string) => {
    setFilterYear(ay);
    if (setSelectedAcademicYear) setSelectedAcademicYear(ay);
  };

  // Flatten all academic history records across all students
  const allHistoryRecords = useMemo(() => {
    const list: Array<{ student: Student; history: AcademicHistoryRecord }> = [];

    students.forEach((s) => {
      // Branch check
      if (selectedBranch && selectedBranch !== 'All Branches' && s.branch && s.branch !== selectedBranch) {
        return;
      }

      if (s.academicHistory && s.academicHistory.length > 0) {
        s.academicHistory.forEach((h) => {
          list.push({ student: s, history: h });
        });
      }
    });

    return list;
  }, [students, selectedBranch]);

  // Filtered history records
  const filteredHistory = useMemo(() => {
    return allHistoryRecords.filter(({ student, history }) => {
      // Academic Year Filter
      if (filterYear !== 'All' && history.academicYear !== filterYear) return false;

      // Class Filter
      if (filterClass !== 'All') {
        const hClass = history.className.replace(/^class\s+/i, '').trim();
        const fClass = filterClass.replace(/^class\s+/i, '').trim();
        if (hClass.toLowerCase() !== fClass.toLowerCase()) return false;
      }

      // Section Filter
      if (filterSection !== 'All' && history.section !== filterSection) return false;

      // Status Filter
      if (filterStatus !== 'All' && history.status !== filterStatus) return false;

      // Branch Filter
      if (filterBranch !== 'All') {
        const recordBranch = history.branch || student.branch || 'Main Campus';
        if (recordBranch.toLowerCase() !== filterBranch.toLowerCase()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        const admNo = (student.admissionNo || '').toLowerCase();
        const rollNo = (history.rollNo || '').toLowerCase();
        if (!fullName.includes(q) && !admNo.includes(q) && !rollNo.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allHistoryRecords, filterYear, filterClass, filterSection, filterStatus, searchQuery]);

  // Dynamic Lookup Helper: Calculate attendance %, exam GPA, fee dues for a specific (studentId, academicYear)
  const getDynamicYearMetrics = (studentId: string, ay: string) => {
    // 1. Attendance %
    const stAttendance = attendance.filter((a) => a.entityId === studentId);
    const totalDays = stAttendance.length;
    const presentDays = stAttendance.filter((a) => a.status === 'Present').length;
    const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 92.5;

    // 2. Exam Marks
    const stMarks = examMarks.filter((m) => m.studentId === studentId);
    const totalObtained = stMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
    const totalMax = stMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
    const examPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 85;

    // 3. Fee Dues
    const stPayments = feePayments.filter((p) => p.studentId === studentId && p.academicYear === ay);
    const totalPaid = stPayments.reduce((sum, p) => sum + ((p as any).amount || (p as any).paidAmount || (p as any).totalAmount || 0), 0);
    const stAssignment = studentFeeAssignments.find((a) => a.studentId === studentId && a.academicYear === ay);
    const totalFee = (stAssignment as any)?.finalAmount || (stAssignment as any)?.netPayable || 45000;
    const dueFee = Math.max(0, totalFee - totalPaid);

    return { attendancePct, examPct, dueFee };
  };

  // CSV / Excel Download Template
  const handleDownloadTemplate = () => {
    const headers = 'AdmissionNo,StudentName,AcademicYear,Class,Section,RollNo,Status,Remarks\n';
    const sample = 'ADM2024-001,Alexander Wright,2024-2025,Class 5,A,1001,Promoted,Promoted with honors\nADM2024-002,Sophia Chen,2024-2025,Class 5,B,1002,Promoted,Good performance\n';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Historical_Academic_Data_Template.csv';
    a.click();
    addToast('info', 'Template Downloaded', 'Historical academic data template saved.');
  };

  // CSV File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);

      // Simple CSV parsing
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (lines.length <= 1) {
        addToast('warning', 'Empty CSV', 'Uploaded file contains no data rows.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        return rowObj;
      });

      setParsedRows(rows);

      // Run dry validation
      const result = importHistoricalAcademicData(rows);
      setValidationResult(result);
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedRows || parsedRows.length === 0) return;
    const result = importHistoricalAcademicData(parsedRows);
    addToast('success', 'Import Completed', `Successfully imported ${result.successCount} historical records (${result.errorCount} skipped/failed).`);
    setIsImportModalOpen(false);
    setParsedRows([]);
    setValidationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-bold mb-2 backdrop-blur-xs">
              <History className="w-3.5 h-3.5" /> Permanent Lifecycle History
            </div>
            <h1 className="text-2xl font-black tracking-tight">Student Academic History</h1>
            <p className="text-xs text-sky-200 mt-1 max-w-xl font-medium">
              View and audit enrollment history, promotion outcomes, discontinue records, and historical academic snapshots linked to permanent student profiles.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Import Historical Data
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-600" /> Filter Academic History Records
          </span>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800 font-mono">
            {filteredHistory.length} History Entries
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Academic Year Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Academic Year</label>
            <select
              value={filterYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Academic Years</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.academicYear}>
                  {ay.academicYear} {ay.isCurrentAcademicYear ? '(Active Session)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Classes</option>
              {academicClasses.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Sections</option>
              {['A', 'B', 'C', 'D'].map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Transition Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Promoted">Promoted</option>
              <option value="Retained">Retained</option>
              <option value="Discontinued">Discontinued</option>
              <option value="Transferred Out">Transferred Out</option>
              <option value="Branch Transfer">Branch Transfer</option>
              <option value="Graduated">Graduated / Completed</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Name, Roll, Adm No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Records Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Student & Adm No</th>
                <th className="px-4 py-3">Academic Year</th>
                <th className="px-4 py-3">Class & Section</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Outcome Status</th>
                <th className="px-4 py-3 text-center">Attendance</th>
                <th className="px-4 py-3 text-center">Exam Result</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No historical academic records found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredHistory.map(({ student, history }) => {
                  const metrics = getDynamicYearMetrics(student.id, history.academicYear);

                  return (
                    <tr key={`${student.id}-${history.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                            {student.avatar ? <img src={student.avatar} alt="" className="w-full h-full object-cover" /> : student.firstName[0]}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 dark:text-slate-200">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {student.admissionNo} • Master: <span className="font-bold text-slate-600 dark:text-slate-300">{student.status}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-bold font-mono text-slate-700 dark:text-slate-300">
                        {history.academicYear}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">
                          {history.className}
                        </span>
                        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          Sec {history.section}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                        {history.rollNo || '-'}
                      </td>

                      <td className="px-4 py-3">
                        {history.status === 'Promoted' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Promoted
                          </span>
                        )}
                        {history.status === 'Retained' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3" /> Retained
                          </span>
                        )}
                        {history.status === 'Discontinued' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                            <UserX className="w-3 h-3" /> Discontinued
                          </span>
                        )}
                        {history.status === 'Transferred Out' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                            <ArrowUpRight className="w-3 h-3" /> Transferred Out
                          </span>
                        )}
                        {history.status === 'Branch Transfer' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                            <Building2 className="w-3 h-3" /> Branch Transfer
                          </span>
                        )}
                        {history.status === 'Graduated' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                            <Award className="w-3 h-3" /> Graduated
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {metrics.attendancePct}%
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {metrics.examPct}% Marks
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDrawerOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
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

      {/* Profile Drawer */}
      {selectedStudent && (
        <StudentProfileDrawer
          student={selectedStudent}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Excel Import Modal */}
      <AcademicHistoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          addToast('success', 'Import Complete', 'Historical database updated successfully.');
        }}
      />
    </div>
  );
};
