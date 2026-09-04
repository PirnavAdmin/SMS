import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Download, UserCheck, Users, IndianRupee, CalendarCheck, 
  Search, Filter, Printer, RefreshCw, Layers, ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight, Edit3, HelpCircle
} from 'lucide-react';
import { useData } from '../../../../context/DataContext';
import { ExportButton } from '../../../common/ExportButton';
import { SchoolPrintHeader } from '../../../common/SchoolPrintHeader';
import { fetchReportDataApi, fetchPrintReportTemplateApi } from '../../../../api/reports';

export const ReportsView: React.FC = () => {
  const { students, staff, feePayments, attendance, examMarks, academicClasses } = useData();

  // Dropdown Filter States
  const [selectedModule, setSelectedModule] = useState<string>(''); // Default empty prompt
  const [manualModuleInput, setManualModuleInput] = useState<string>('');
  
  const [selectedClass, setSelectedClass] = useState<string>(''); // Default empty prompt
  const [manualClassInput, setManualClassInput] = useState<string>('');

  const [selectedDepartment, setSelectedDepartment] = useState<string>(''); // Default empty prompt
  const [manualDeptInput, setManualDeptInput] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Active module key
  const activeTab = useMemo(() => {
    if (selectedModule === 'MANUAL') return 'students';
    return selectedModule || 'students';
  }, [selectedModule]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [selectedModule, selectedClass, selectedDepartment, searchQuery, manualModuleInput, manualClassInput, manualDeptInput]);

  // Effective filter values (handles dropdown selection OR manual input)
  const effectiveClass = selectedClass === 'MANUAL' ? manualClassInput : selectedClass;
  const effectiveDept = selectedDepartment === 'MANUAL' ? manualDeptInput : selectedDepartment;

  // Live Auto-Rendering Data Computations
  const totalRevenue = useMemo(() => {
    return (feePayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [feePayments]);

  const activeStudentsCount = useMemo(() => {
    return (students || []).filter(s => s.status === 'Active').length;
  }, [students]);

  const activeStaffCount = useMemo(() => {
    return (staff || []).filter(s => s.status === 'Active' || (s as any).status === 'Active').length;
  }, [staff]);

  // Filtered Student List
  const filteredStudents = useMemo(() => {
    if (!selectedModule && !searchQuery) return [];
    return (students || []).filter(s => {
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.admissionNo} ${s.className}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = !effectiveClass || effectiveClass === 'All' || s.className.toLowerCase().includes(effectiveClass.toLowerCase());
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, effectiveClass, selectedModule]);

  // Filtered Staff List
  const filteredStaff = useMemo(() => {
    if (!selectedModule && !searchQuery) return [];
    return (staff || []).filter(s => {
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.empId} ${s.department} ${s.designation}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = !effectiveDept || effectiveDept === 'All' || (s.department || '').toLowerCase().includes(effectiveDept.toLowerCase());
      return matchesSearch && matchesDept;
    });
  }, [staff, searchQuery, effectiveDept, selectedModule]);

  // Filtered Fee Payments
  const filteredFeePayments = useMemo(() => {
    if (!selectedModule && !searchQuery) return [];
    return (feePayments || []).filter(p => {
      return `${p.studentName} ${p.receiptNo} ${p.paymentMode} ${p.feeHeadName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [feePayments, searchQuery, selectedModule]);

  // Filtered Exam Marks
  const filteredExamMarks = useMemo(() => {
    if (!selectedModule && !searchQuery) return [];
    return (examMarks || []).filter(m => {
      const matchesSearch = `${m.studentId} ${m.subject} ${m.grade || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = !effectiveClass || effectiveClass === 'All' || (m as any).className?.toLowerCase().includes(effectiveClass.toLowerCase());
      return matchesSearch && matchesClass;
    });
  }, [examMarks, searchQuery, effectiveClass, selectedModule]);

  // Get active dataset for pagination and export
  const currentDataset = useMemo(() => {
    switch (activeTab) {
      case 'students':
        return filteredStudents;
      case 'staff':
        return filteredStaff;
      case 'fees':
        return filteredFeePayments;
      case 'exams':
        return filteredExamMarks;
      default:
        return [];
    }
  }, [activeTab, filteredStudents, filteredStaff, filteredFeePayments, filteredExamMarks]);

  const [isPrinting, setIsPrinting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(currentDataset.length / pageSize));
  const paginatedData = useMemo(() => {
    if (isPrinting) return currentDataset;
    const start = (page - 1) * pageSize;
    return currentDataset.slice(start, start + pageSize);
  }, [currentDataset, page, pageSize, isPrinting]);

  const handlePrintReport = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const reportTitle = useMemo(() => {
    if (activeTab === 'students') return 'OFFICIAL STUDENT DIRECTORY REPORT';
    if (activeTab === 'staff') return 'FACULTY & STAFF REPORT';
    if (activeTab === 'fees') return 'FINANCIAL FEE LEDGER REPORT';
    if (activeTab === 'exams') return 'ACADEMIC EXAM MARKS REPORT';
    return 'SCHOOL ADMINISTRATIVE MASTER REPORT';
  }, [activeTab]);

  return (
    <div id="printable-content" className="printable-area space-y-6 animate-in fade-in text-left">
      
      {/* Official School Header for Print Output */}
      <SchoolPrintHeader
        title={reportTitle}
        subtitle={`Filter: ${effectiveClass !== 'All' ? `Class ${effectiveClass}` : 'All Classes'}${effectiveDept !== 'All' ? ` • Dept: ${effectiveDept}` : ''} • Total Records: ${currentDataset.length}`}
      />

      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200/80 dark:border-sky-900/50 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              School Administration Reports Hub
            </h2>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handlePrintReport}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer h-[34px]"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>

          <ExportButton
            data={currentDataset as any[]}
            filename={`school_admin_report`}
            label="Export Filtered CSV"
          />
        </div>
      </div>

      {/* Real-time KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:hidden">
        <div className="p-4 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Total Active Students</span>
            <UserCheck className="w-4 h-4 text-sky-500" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{activeStudentsCount}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Faculty & Staff</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{activeStaffCount}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Fee Revenue Collected</span>
            <IndianRupee className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1 block">₹{totalRevenue.toLocaleString('en-IN')}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Exam Marks Sheets</span>
            <CalendarCheck className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{examMarks.length}</span>
        </div>
      </div>

      {/* EXPLICIT DROPDOWN FILTERS & SEARCH TOOLBAR (SINGLE ROW) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm space-y-2.5 text-xs print:hidden">

        {/* Single Row Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          {/* 1. Report Module Dropdown */}
          <div className="lg:col-span-3">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
              Report Module <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <select
              value={selectedModule}
              onChange={e => {
                setSelectedModule(e.target.value);
                if (e.target.value !== 'MANUAL') setManualModuleInput('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer outline-none focus:border-sky-500 h-[38px]"
            >
              <option value="">-- Select Report Module --</option>
              <option value="students">🎓 Student Directory Report ({students.length})</option>
              <option value="staff">👥 Staff HR & Payroll Report ({staff.length})</option>
              <option value="fees">💳 Financial Fee Ledger Report ({feePayments.length})</option>
              <option value="exams">📝 Academic Exam Marks Report ({examMarks.length})</option>
              <option value="MANUAL">✍️ Custom / Manual Report Entry</option>
            </select>
          </div>

          {/* 2. Academic Class Dropdown (for Students & Exams) */}
          <div className="lg:col-span-3">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
              Academic Class Filter
            </label>
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                if (e.target.value !== 'MANUAL') setManualClassInput('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer outline-none focus:border-sky-500 h-[38px]"
            >
              <option value="">-- Select Academic Class --</option>
              <option value="All">All Academic Classes</option>
              {academicClasses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="MANUAL">✍️ Custom / Manual Class Entry</option>
            </select>
          </div>

          {/* 3. Department / Role Filter (for Staff) */}
          <div className="lg:col-span-3">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
              Department / Category Filter
            </label>
            <select
              value={selectedDepartment}
              onChange={e => {
                setSelectedDepartment(e.target.value);
                if (e.target.value !== 'MANUAL') setManualDeptInput('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer outline-none focus:border-sky-500 h-[38px]"
            >
              <option value="">-- Select Department --</option>
              <option value="All">All Departments</option>
              <option value="Academics">Academics</option>
              <option value="Administration">Administration</option>
              <option value="Sports">Sports & Physical Ed.</option>
              <option value="Accounts">Accounts & Finance</option>
              <option value="Transport">Transport Cell</option>
              <option value="MANUAL">✍️ Custom / Manual Dept Entry</option>
            </select>
          </div>

          {/* 4. Search Bar */}
          <div className="lg:col-span-3">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
              Search Filtered Records
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold outline-none focus:border-sky-500 transition h-[38px] text-xs"
              />
            </div>
          </div>

        </div>

        {/* Custom manual inputs if selected */}
        {(selectedModule === 'MANUAL' || selectedClass === 'MANUAL' || selectedDepartment === 'MANUAL') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {selectedModule === 'MANUAL' && (
              <input
                type="text"
                placeholder="Type custom report query..."
                value={manualModuleInput}
                onChange={e => setManualModuleInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 text-xs font-bold"
              />
            )}
            {selectedClass === 'MANUAL' && (
              <input
                type="text"
                placeholder="Type manual class (e.g. Class 10-B)..."
                value={manualClassInput}
                onChange={e => setManualClassInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 text-xs font-bold"
              />
            )}
            {selectedDepartment === 'MANUAL' && (
              <input
                type="text"
                placeholder="Type manual department..."
                value={manualDeptInput}
                onChange={e => setManualDeptInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 text-xs font-bold"
              />
            )}
          </div>
        )}
      </div>

      {/* LIVE DATA TABLE PREVIEW */}
      <div className="rounded-3xl border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4 text-xs">
        
        {!selectedModule && !searchQuery ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-800">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">No Filter Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Please select a report module & category filter from the dropdowns above or use manual entry to display live matching records.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* STUDENT DIRECTORY REPORT TABLE */}
            {activeTab === 'students' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px] print:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="px-4 py-3.5 whitespace-nowrap">Admission No</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Student Name</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Class & Section</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Guardian Details</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Phone Number</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                          No student records found matching the selected filter dropdown or search query.
                        </td>
                      </tr>
                    ) : (
                      (paginatedData as any[]).map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-sky-600 whitespace-nowrap">{s.admissionNo}</td>
                          <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                            {s.firstName} {s.lastName}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {s.className} - {s.section || 'A'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">{s.fatherName || s.motherName || 'N/A'}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">{s.fatherPhone || s.phone || 'N/A'}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 whitespace-nowrap inline-block">
                              {s.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* STAFF HR REPORT TABLE */}
            {activeTab === 'staff' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px] print:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="px-4 py-3.5 whitespace-nowrap">Emp ID</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Employee Name</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Department</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Designation</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Role Type</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Contact Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                          No faculty or staff records found matching the selected filter dropdown or search query.
                        </td>
                      </tr>
                    ) : (
                      (paginatedData as any[]).map(st => (
                        <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-sky-600 whitespace-nowrap">{st.empId || st.id}</td>
                          <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                            {st.firstName} {st.lastName}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">{st.department || 'Academics'}</td>
                          <td className="px-4 py-3.5 text-slate-600">{st.designation || st.role}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 whitespace-nowrap inline-block">
                              {st.employeeCategory || (st.role === 'Teacher' ? 'Teaching' : 'Staff')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">{st.phone || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* FINANCIAL FEE LEDGER REPORT TABLE */}
            {activeTab === 'fees' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px] print:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="px-4 py-3.5 whitespace-nowrap">Receipt No</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Student Name</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Fee Category</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Amount Paid</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Payment Mode</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                          No financial fee transactions matching the selected filter dropdown or search query.
                        </td>
                      </tr>
                    ) : (
                      (paginatedData as any[]).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-sky-600 whitespace-nowrap">{p.receiptNo || p.id}</td>
                          <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">{p.studentName || 'Student'}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">{p.feeHeadName || p.category || 'Tuition Fee'}</td>
                          <td className="px-4 py-3.5 font-mono font-black text-emerald-600 whitespace-nowrap">₹{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-600 whitespace-nowrap">{p.paymentMode || 'Online'}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">{p.paymentDate || p.date || '2026-08-10'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ACADEMIC EXAM MARKS REPORT TABLE */}
            {activeTab === 'exams' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px] print:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="px-4 py-3.5 whitespace-nowrap">Student ID</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Exam / Subject</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Marks Obtained</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Total Marks</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Grade</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                          No academic exam marks sheets matching the selected filter dropdown or search query.
                        </td>
                      </tr>
                    ) : (
                      (paginatedData as any[]).map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-sky-600 whitespace-nowrap">{m.studentId}</td>
                          <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">{m.subject}</td>
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{m.marksObtained}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">{m.totalMarks}</td>
                          <td className="px-4 py-3.5 font-bold text-emerald-600 whitespace-nowrap">{m.grade || 'A1'}</td>
                          <td className="px-4 py-3.5 text-slate-500">{m.remarks || 'Evaluated'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION FOOTER */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs print:hidden">
                <span className="text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{Math.min((page - 1) * pageSize + 1, currentDataset.length)}</span> to{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * pageSize, currentDataset.length)}</span> of{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{currentDataset.length}</span> records
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>

                  <span className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-xs"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
