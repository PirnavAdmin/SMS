import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Plus, Eye, Printer, UserCheck, ShieldAlert, 
  ChevronLeft, ChevronRight, Filter, Download, RotateCcw, AlertTriangle,
  BarChart3, Calendar, Building2, CheckCircle2, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { TransferStudentModal } from './TransferStudentModal';
import { Student, TcRecord } from '../../../types';
import { Pagination } from '../../common/Pagination';

interface TransferCertificatesViewProps {
  onNavigate?: (module: string) => void;
}

export const TransferCertificatesView: React.FC<TransferCertificatesViewProps> = ({ onNavigate }) => {
  const { students, academicClasses, calculateStudentPayableFee, getStudentFeeOutstandingSummary } = useData();
  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  // Top Module View Tabs
  const [activeTab, setActiveTab] = useState<'issue' | 'register' | 'reports'>('issue');

  // Filter States
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal & Selection States
  const [selectedStudentForTC, setSelectedStudentForTC] = useState<Student | null>(null);
  const [selectedTcRecord, setSelectedTcRecord] = useState<TcRecord | null>(null);
  const [isTcModalOpen, setIsTcModalOpen] = useState<boolean>(false);

  // TC Register State (Persisted in localStorage)
  const [tcRegister, setTcRegister] = useState<TcRecord[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Load TC Register from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('edu_db_tc_register');
      if (saved) {
        setTcRegister(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load TC register from localStorage', err);
    }
  }, [isTcModalOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClass, selectedSection, selectedBranch, selectedAcademicYear, activeTab]);

  // Derived available sections for selected class
  const availableSections = useMemo(() => {
    if (!selectedClass) return ['A', 'B', 'C'];
    const found = academicClasses?.find(c => c.name.toLowerCase() === selectedClass.toLowerCase());
    return found ? found.sections : ['A', 'B', 'C'];
  }, [academicClasses, selectedClass]);

  // Eligible Active Students (Excludes Transferred, Alumni, Discontinued)
  const eligibleActiveStudents = useMemo(() => {
    if (!selectedClass) return [];

    return students.filter(s => {
      // Exclude Transferred, Alumni, Completed/Discontinued
      if (s.status === 'Transferred' || s.status === 'Alumni' || s.status === 'Completed' || s.status === 'Inactive') {
        return false;
      }

      // Class Filter
      if (selectedClass && s.className.toLowerCase() !== selectedClass.toLowerCase()) {
        return false;
      }

      // Section Filter
      if (selectedSection && selectedSection !== 'All' && s.section.toLowerCase() !== selectedSection.toLowerCase()) {
        return false;
      }

      // Branch Filter (from global header)
      if (selectedBranch && selectedBranch !== 'All' && selectedBranch !== 'All Branches' && (s.branch || 'Main Campus').toLowerCase() !== selectedBranch.toLowerCase()) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        if (!fullName.includes(q) && !s.admissionNo.toLowerCase().includes(q) && !s.rollNo.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [students, selectedClass, selectedSection, selectedBranch, searchQuery]);

  // Filtered TC Register Records
  const filteredTcRegister = useMemo(() => {
    return tcRegister.filter(tc => {
      if (selectedClass && tc.className.toLowerCase() !== selectedClass.toLowerCase()) {
        return false;
      }
      if (selectedSection && selectedSection !== 'All' && tc.section.toLowerCase() !== selectedSection.toLowerCase()) {
        return false;
      }
      if (selectedBranch && selectedBranch !== 'All' && selectedBranch !== 'All Branches' && (tc.branch || 'Main Campus').toLowerCase() !== selectedBranch.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!tc.studentName.toLowerCase().includes(q) && !tc.admissionNo.toLowerCase().includes(q) && !tc.tcNo.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tcRegister, selectedClass, selectedSection, selectedBranch, searchQuery]);

  // Active dataset depending on activeTab
  const activeDataset = activeTab === 'issue' ? eligibleActiveStudents : filteredTcRegister;
  const totalPages = Math.ceil(activeDataset.length / pageSize) || 1;
  const paginatedDataset = activeDataset.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Check if a student already has an issued TC
  const getExistingTcForStudent = (studentId: string): TcRecord | undefined => {
    return tcRegister.find(r => r.studentId === studentId);
  };

  const handleOpenIssueModal = (student: Student, existingTc?: TcRecord) => {
    setSelectedStudentForTC(student);
    setSelectedTcRecord(existingTc || null);
    setIsTcModalOpen(true);
  };

  // Reports Summaries
  const reportsSummary = useMemo(() => {
    const totalIssued = tcRegister.length;
    const overriddenCount = tcRegister.filter(r => r.clearanceSummary?.overridden).length;
    
    // Reason breakdown
    const reasonsMap: Record<string, number> = {};
    tcRegister.forEach(r => {
      const re = r.reason || 'Other';
      reasonsMap[re] = (reasonsMap[re] || 0) + 1;
    });

    // Branch breakdown
    const branchMap: Record<string, number> = {};
    tcRegister.forEach(r => {
      const b = r.branch || 'Main Campus';
      branchMap[b] = (branchMap[b] || 0) + 1;
    });

    return { totalIssued, overriddenCount, reasonsMap, branchMap };
  }, [tcRegister]);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner Header */}
      <div className="glass-card py-4 px-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0" /> Transfer Certificate Management
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={activeDataset} filename="transfer_certificates_register" />
        </div>
      </div>

      {/* Main View Tab Switcher Bar */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 w-fit">
        <button
          onClick={() => setActiveTab('issue')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'issue'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Issue TC ({eligibleActiveStudents.length})
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'register'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> TC Register ({tcRegister.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> TC Reports & Analytics
        </button>
      </div>

      {/* Step 1: Filter Toolbar (Preserved Existing Filters + Enhanced Options) */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Class Filter (Required for loading) */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Class <span className="text-rose-500 font-bold ml-0.5">*</span></label>
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Select Class</option>
              {academicClasses?.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Search Student Input */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Name or Adm No..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

        </div>
      </div>

      {/* TAB CONTENT 1: ISSUE TC WORKFLOW (ELIGIBLE STUDENTS) */}
      {activeTab === 'issue' && (
        <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-4">Photo</th>
                  <th className="py-3.5 px-4">Admission No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class & Sec</th>
                  <th className="py-3.5 px-4">Roll No</th>
                  <th className="py-3.5 px-4">Academic Result</th>
                  <th className="py-3.5 px-4">Clearance Dues</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {!selectedClass ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-pulse" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Please select a Class to view eligible student records</p>
                        <p className="text-xs text-slate-400">Select a Class and Section above to filter active students available for TC issuance.</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedDataset.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400 font-bold">
                      No active eligible student records matched your filter criteria for {selectedClass}.
                    </td>
                  </tr>
                ) : (
                  (paginatedDataset as Student[]).map(st => {
                    const existingTc = getExistingTcForStudent(st.id);
                    const summary = getStudentFeeOutstandingSummary(st.id);
                    const dueFee = summary.totalOutstanding;
                    const studentResultText = (st as any).finalResult || (st as any).result || (st.gpa ? (st.gpa >= 2.0 ? `PASS (${st.gpa})` : 'FAIL') : 'PASSED');
                    const isPassed = !studentResultText.toUpperCase().includes('FAIL');

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Photo */}
                        <td className="py-3 px-4">
                          {st.avatar ? (
                            <img src={st.avatar} alt={st.firstName} className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-[10px]">
                              {st.firstName[0]}
                            </div>
                          )}
                        </td>

                        {/* Adm No */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{st.admissionNo}</td>

                        {/* Student Name */}
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {st.firstName} {st.lastName}
                        </td>

                        {/* Class & Section */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{st.className} - {st.section}</td>

                        {/* Roll No */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{st.rollNo}</td>

                        {/* Academic Result */}
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-md font-black text-[10px] ${
                            isPassed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {studentResultText}
                          </span>
                        </td>

                        {/* Clearance Dues */}
                        <td className="py-3 px-4">
                          {dueFee === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-[10px]">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" /> ✓ Fee Cleared
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3 text-rose-500" /> ❌ Pending: ₹{dueFee.toLocaleString()}
                              </span>
                              {summary.previousYearsDue > 0 && (
                                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 pl-1">
                                  (Curr: ₹{summary.currentYearDue.toLocaleString()} | Prev: ₹{summary.previousYearsDue.toLocaleString()})
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px]">
                            {st.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {existingTc ? (
                              <button
                                onClick={() => handleOpenIssueModal(st, existingTc)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                title="This student already has an issued Transfer Certificate"
                              >
                                <Eye className="w-3.5 h-3.5 text-brand-600" /> View TC
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenIssueModal(st)}
                                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                              >
                                <FileText className="w-3.5 h-3.5" /> Issue TC
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {eligibleActiveStudents.length > 0 && (
            <div className="px-4 pb-3">
              <Pagination
                currentPage={currentPage}
                totalItems={eligibleActiveStudents.length}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(n) => { setPageSize(n); setCurrentPage(1); }}
                label="students"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: TC REGISTER */}
      {activeTab === 'register' && (
        <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-4">TC Serial No</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Admission No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class & Sec</th>
                  <th className="py-3.5 px-4">Reason for Leaving</th>
                  <th className="py-3.5 px-4">Issued By</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredTcRegister.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400 font-bold">
                      No Transfer Certificate records found in TC Register.
                    </td>
                  </tr>
                ) : (
                  (paginatedDataset as TcRecord[]).map(tc => {
                    const st = students.find(s => s.id === tc.studentId);

                    return (
                      <tr key={tc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{tc.tcNo}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{tc.issueDate}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{tc.admissionNo}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">{tc.studentName}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{tc.className} - {tc.section}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{tc.reason}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{tc.issuedBy}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px]">
                            {tc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                if (st) handleOpenIssueModal(st, tc);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-600" /> View TC
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: TC REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total TCs Issued</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{reportsSummary.totalIssued}</p>
              <span className="text-[10px] font-bold text-emerald-600">Registered in System</span>
            </div>

            <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overridden Clearances</span>
              <p className="text-2xl font-black text-amber-600">{reportsSummary.overriddenCount}</p>
              <span className="text-[10px] font-bold text-slate-400">Admin Approved Exception</span>
            </div>

            <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Reason</span>
              <p className="text-lg font-black text-slate-900 dark:text-white truncate">Parent Request</p>
              <span className="text-[10px] font-bold text-slate-400">Family & Relocation</span>
            </div>

            <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Branch Distribution</span>
              <p className="text-lg font-black text-slate-900 dark:text-white">Main Campus</p>
              <span className="text-[10px] font-bold text-slate-400">Primary Center</span>
            </div>
          </div>

          {/* Detailed Reason & Branch Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reason Wise Report */}
            <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-600" /> Reason-Wise TC Distribution
              </h3>

              <div className="space-y-3 text-xs">
                {Object.keys(reportsSummary.reasonsMap).length === 0 ? (
                  <p className="text-slate-400 font-bold py-4">No TC issuance reasons recorded yet.</p>
                ) : (
                  Object.entries(reportsSummary.reasonsMap).map(([reasonKey, count]) => {
                    const pct = Math.round((count / reportsSummary.totalIssued) * 100) || 0;
                    return (
                      <div key={reasonKey} className="space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>{reasonKey}</span>
                          <span>{count} student(s) ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Branch Wise Report */}
            <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" /> Branch-Wise TC Breakdown
              </h3>

              <div className="space-y-3 text-xs">
                {Object.keys(reportsSummary.branchMap).length === 0 ? (
                  <p className="text-slate-400 font-bold py-4">No branch records found in TC register.</p>
                ) : (
                  Object.entries(reportsSummary.branchMap).map(([branchKey, count]) => {
                    const pct = Math.round((count / reportsSummary.totalIssued) * 100) || 0;
                    return (
                      <div key={branchKey} className="space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>{branchKey}</span>
                          <span>{count} student(s) ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-sky-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Student Modal Dialog */}
      {isTcModalOpen && selectedStudentForTC && (
        <TransferStudentModal
          student={selectedStudentForTC}
          existingTcRecord={selectedTcRecord}
          isOpen={isTcModalOpen}
          onClose={() => {
            setIsTcModalOpen(false);
            setSelectedStudentForTC(null);
            setSelectedTcRecord(null);
          }}
          onSuccess={(newTc) => {
            setTcRegister(prev => [newTc, ...prev.filter(r => r.studentId !== newTc.studentId)]);
          }}
        />
      )}

    </div>
  );
};
