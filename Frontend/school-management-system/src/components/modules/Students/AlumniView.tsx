import React, { useState, useMemo } from 'react';
import {
  Award, Search, GraduationCap, Building2, Briefcase, Mail, Phone,
  Eye, Edit3, FileText, CheckCircle2, Printer, Download, User, Calendar,
  BarChart3, Filter, Check, X, Shield, BookOpen, Clock, ChevronLeft, ChevronRight, RefreshCw, Compass
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { AlumniRecord, AlumniCurrentStatus, Student } from '../../../types';
import { Pagination } from '../../common/Pagination';
import { SchoolPrintHeader } from '../../common/SchoolPrintHeader';

interface AlumniViewProps {
  onNavigate?: (module: string) => void;
}

export const AlumniView: React.FC<AlumniViewProps> = ({ onNavigate }) => {
  const { alumniRecords, students, updateAlumniStatus, schoolProfile, examMarks, feePayments } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'directory' | 'reports'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');

  // Modals & Drawers state
  const [editingAlumni, setEditingAlumni] = useState<AlumniRecord | null>(null);
  const [statusForm, setStatusForm] = useState<{
    currentStatus: AlumniCurrentStatus;
    detail: string;
  }>({ currentStatus: 'Unknown', detail: '' });

  const [selectedAlumniProfile, setSelectedAlumniProfile] = useState<AlumniRecord | null>(null);
  const [profileTab, setProfileTab] = useState<'general' | 'academics' | 'certificates' | 'pursuit' | 'contact'>('general');
  const [certificateModal, setCertificateModal] = useState<{ isOpen: boolean; record: AlumniRecord | null; type: 'completion' | 'conduct' | 'bonafide' | 'marksheet' }>({
    isOpen: false,
    record: null,
    type: 'completion'
  });

  // Consolidated Alumni dataset (sourced exclusively from alumniRecords & completed students)
  const masterAlumniList: AlumniRecord[] = useMemo(() => {
    const list: AlumniRecord[] = [...alumniRecords];

    // Sync any completed/alumni students from students table if missing from alumniRecords
    students.forEach(st => {
      if (st.status === 'Completed' || st.status === 'Alumni') {
        const exists = list.some(a => a.studentId === st.id || a.admissionNo === st.admissionNo);
        if (!exists) {
          const finalYear = st.completionAcademicYear || schoolProfile?.academicYear || '2025-2026';
          const batchYear = finalYear.split('-')[1] || finalYear.split('-')[0] || '2026';
          list.push({
            id: 'ALM-' + st.id,
            studentId: st.id,
            admissionNo: st.admissionNo,
            studentName: `${st.firstName} ${st.lastName}`,
            avatar: st.avatar,
            batch: `Class of ${batchYear}`,
            completionAcademicYear: finalYear,
            finalClass: st.className,
            finalSection: st.section,
            completionDate: st.completionDate || new Date().toISOString().split('T')[0],
            currentStatus: 'Unknown',
            contactPhone: st.phone || st.fatherPhone || st.guardianPhone,
            contactEmail: st.email || st.fatherEmail || st.guardianEmail,
            parentName: st.fatherName || st.parentName,
            branch: st.branch || 'Main Campus',
            createdDate: st.completionDate || new Date().toISOString().split('T')[0]
          });
        }
      }
    });

    return list;
  }, [alumniRecords, students, schoolProfile]);

  // Unique filter values
  const uniqueYears = useMemo(() => Array.from(new Set(masterAlumniList.map(a => a.completionAcademicYear))).filter(Boolean).sort().reverse(), [masterAlumniList]);
  const uniqueBatches = useMemo(() => Array.from(new Set(masterAlumniList.map(a => a.batch))).filter(Boolean).sort().reverse(), [masterAlumniList]);
  const uniqueClasses = useMemo(() => Array.from(new Set(masterAlumniList.map(a => a.finalClass))).filter(Boolean).sort(), [masterAlumniList]);
  const uniqueBranches = useMemo(() => Array.from(new Set(masterAlumniList.map(a => a.branch).filter(Boolean))), [masterAlumniList]);

  // Track whether any search query or filter is actively applied
  const isFilterActive = useMemo(() => {
    return searchQuery.trim() !== '' || filterYear !== 'All' || filterBatch !== 'All' || filterClass !== 'All' || filterBranch !== 'All';
  }, [searchQuery, filterYear, filterBatch, filterClass, filterBranch]);

  // Filtered Alumni list (Empty by default until search or filter is applied)
  const filteredAlumni = useMemo(() => {
    if (!isFilterActive) {
      return [];
    }

    return masterAlumniList.filter(a => {
      const matchYear = filterYear === 'All' || a.completionAcademicYear === filterYear;
      const matchBatch = filterBatch === 'All' || a.batch === filterBatch;
      const matchClass = filterClass === 'All' || a.finalClass === filterClass;
      const matchBranch = filterBranch === 'All' || a.branch === filterBranch;
      const matchQuery = !searchQuery.trim() ||
        a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.batch.toLowerCase().includes(searchQuery.toLowerCase());

      return matchYear && matchBatch && matchClass && matchBranch && matchQuery;
    });
  }, [masterAlumniList, filterYear, filterBatch, filterClass, filterBranch, searchQuery, isFilterActive]);

  // Pagination State for Alumni Directory
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset pagination when search query or filter values change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterYear, filterBatch, filterClass, filterBranch]);

  const totalPages = Math.ceil(filteredAlumni.length / pageSize) || 1;

  const paginatedAlumni = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAlumni.slice(start, start + pageSize);
  }, [filteredAlumni, currentPage, pageSize]);

  // Status Metrics
  const higherStudiesCount = masterAlumniList.filter(a => a.currentStatus === 'Higher Studies').length;
  const workingCount = masterAlumniList.filter(a => a.currentStatus === 'Working' || a.currentStatus === 'Business').length;
  const competitiveExamsCount = masterAlumniList.filter(a => a.currentStatus === 'Competitive Exams').length;
  const otherOrUnknownCount = masterAlumniList.filter(a => a.currentStatus === 'Other' || a.currentStatus === 'Unknown').length;

  // Open Edit Status modal
  const handleOpenStatusModal = (alumni: AlumniRecord) => {
    setEditingAlumni(alumni);
    setStatusForm({
      currentStatus: alumni.currentStatus || 'Unknown',
      detail: alumni.higherEducationDetail || alumni.organizationCompany || ''
    });
  };

  // Submit Status update
  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlumni) return;

    const details = {
      higherEducationDetail: statusForm.currentStatus === 'Higher Studies' || statusForm.currentStatus === 'Competitive Exams' ? statusForm.detail : undefined,
      organizationCompany: statusForm.currentStatus === 'Working' || statusForm.currentStatus === 'Business' || statusForm.currentStatus === 'Other' ? statusForm.detail : undefined
    };

    updateAlumniStatus(editingAlumni.id, statusForm.currentStatus, details);
    addToast('success', 'Status Updated', `Updated alumni status for ${editingAlumni.studentName}`);
    setEditingAlumni(null);
  };

  // Matched student record for drawer details
  const matchedStudent = useMemo(() => {
    if (!selectedAlumniProfile) return null;
    return students.find(s => s.id === selectedAlumniProfile.studentId || s.admissionNo === selectedAlumniProfile.admissionNo) || null;
  }, [selectedAlumniProfile, students]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner Header */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> Alumni
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'directory' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Alumni Directory
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'reports' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Alumni Reports
            </button>
          </div>

          <ExportButton data={filteredAlumni} filename="alumni_directory_report" />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Alumni</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{masterAlumniList.length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">In Higher Studies</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {higherStudiesCount} <span className="text-xs font-normal text-slate-400">({masterAlumniList.length > 0 ? Math.round((higherStudiesCount / masterAlumniList.length) * 100) : 0}%)</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300 shrink-0">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Working / Business</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {workingCount} <span className="text-xs font-normal text-slate-400">({masterAlumniList.length > 0 ? Math.round((workingCount / masterAlumniList.length) * 100) : 0}%)</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Graduation Batches</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{uniqueBatches.length}</p>
          </div>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Filters Toolbar */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
              <div className="w-full lg:w-72">
                <input
                  type="text"
                  placeholder="Search name, adm no, batch..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                {/* Year Filter */}
                <div>
                  <select
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="All">Select Academic Year</option>
                    {uniqueYears.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Batch Filter */}
                <div>
                  <select
                    value={filterBatch}
                    onChange={e => setFilterBatch(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="All">Select Batch</option>
                    {uniqueBatches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>



                {/* Branch Filter */}
                {uniqueBranches.length > 1 && (
                  <div>
                    <select
                      value={filterBranch}
                      onChange={e => setFilterBranch(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="All">Select Branch</option>
                      {uniqueBranches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alumni Table Card */}
          <div id="printable-content" className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs p-4 print:p-0 print:border-none">
            <SchoolPrintHeader
              title="Alumni Directory Report"
              subtitle={`Total Filtered Alumni: ${filteredAlumni.length}`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3.5 px-4">Photo</th>
                    <th className="py-3.5 px-4">Admission No</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Batch & Final Class</th>
                    <th className="py-3.5 px-4">Completion Date</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredAlumni.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          {!isFilterActive ? (
                            <>
                              <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-pulse" />
                              <p className="font-bold text-slate-700 dark:text-slate-200">Search or filter to view alumni records</p>
                              <p className="text-[11px] text-slate-400">Enter a student name, admission number, or select an Academic Year / Batch filter above to display results.</p>
                            </>
                          ) : (
                            <>
                              <GraduationCap className="w-8 h-8 text-slate-300" />
                              <p className="font-bold">No alumni records found matching filters.</p>
                              <p className="text-[11px]">Try searching with a different keyword or selecting a different batch filter.</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedAlumni.map((a) => {
                      const statusColor =
                        a.currentStatus === 'Higher Studies' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200' :
                        a.currentStatus === 'Working' || a.currentStatus === 'Business' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200' :
                        a.currentStatus === 'Competitive Exams' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <img
                              src={a.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={a.studentName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{a.admissionNo}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 dark:text-white">{a.studentName}</p>
                            {a.parentName && <p className="text-[10px] text-slate-400">Parent: {a.parentName}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold text-[10px] block w-fit">
                              {a.batch}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block font-semibold">
                              {a.finalClass} ({a.finalSection}) &bull; {a.completionAcademicYear}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {a.completionDate || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${statusColor}`}>
                                {a.currentStatus || 'Unknown'}
                              </span>
                              {(a.higherEducationDetail || a.organizationCompany) && (
                                <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[180px]">
                                  {a.higherEducationDetail || a.organizationCompany}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedAlumniProfile(a)}
                                title="View Alumni Profile & History"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenStatusModal(a)}
                                title="Update Alumni Status"
                                className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950 dark:hover:bg-brand-900 dark:text-brand-300 font-bold"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setCertificateModal({ isOpen: true, record: a, type: 'completion' })}
                                title="View & Print Certificates"
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-300 font-bold"
                              >
                                <FileText className="w-3.5 h-3.5" />
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

            {/* Alumni Pagination Footer */}
            {filteredAlumni.length > 0 && (
              <div className="px-4 pb-3">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredAlumni.length}
                  itemsPerPage={pageSize}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => { setPageSize(n); setCurrentPage(1); }}
                  label="alumni records"
                />
              </div>
            )}
          </div>
        </>
      ) : (
        /* REPORTS SUB-VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch-wise Report */}
            <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-600" /> Batch-wise Alumni
              </h3>
              <div className="space-y-3">
                {uniqueBatches.map(batch => {
                  const count = masterAlumniList.filter(a => a.batch === batch).length;
                  const pct = masterAlumniList.length > 0 ? Math.round((count / masterAlumniList.length) * 100) : 0;
                  return (
                    <div key={batch} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800 dark:text-slate-200">{batch}</span>
                        <span className="text-brand-600 font-mono">{count} Alumni ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status Report */}
            <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" /> Current Pursuit Distribution Report
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Higher Studies', count: higherStudiesCount, color: 'bg-emerald-500' },
                  { label: 'Employed / Working', count: masterAlumniList.filter(a => a.currentStatus === 'Working').length, color: 'bg-blue-500' },
                  { label: 'Business / Entrepreneur', count: masterAlumniList.filter(a => a.currentStatus === 'Business').length, color: 'bg-amber-500' },
                  { label: 'Competitive Exams Aspirant', count: competitiveExamsCount, color: 'bg-purple-500' },
                  { label: 'Other / Unknown', count: otherOrUnknownCount, color: 'bg-slate-400' }
                ].map(item => {
                  const pct = masterAlumniList.length > 0 ? Math.round((item.count / masterAlumniList.length) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                        <span className="text-slate-600 font-mono">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {editingAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Update Alumni Pursuit</h3>
                  <p className="text-xs text-slate-500">{editingAlumni.studentName} ({editingAlumni.batch})</p>
                </div>
              </div>
              <button onClick={() => setEditingAlumni(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Current Status Category <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={statusForm.currentStatus}
                  onChange={e => setStatusForm({ ...statusForm, currentStatus: e.target.value as AlumniCurrentStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                >
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Working">Working / Employed</option>
                  <option value="Business">Business / Startup</option>
                  <option value="Competitive Exams">Competitive Exams</option>
                  <option value="Other">Other</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  {statusForm.currentStatus === 'Higher Studies' ? 'University / College & Degree' :
                   statusForm.currentStatus === 'Working' ? 'Company Name & Designation' :
                   statusForm.currentStatus === 'Business' ? 'Business Venture & Role' :
                   statusForm.currentStatus === 'Competitive Exams' ? 'Exam Target (e.g. UPSC, GATE)' :
                   'Pursuit Details'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. IIT Madras (B.Tech CS) or Google (Software Engineer)"
                  value={statusForm.detail}
                  onChange={e => setStatusForm({ ...statusForm, detail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingAlumni(null)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALUMNI PROFILE DRAWER */}
      {selectedAlumniProfile && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 max-w-xl w-full h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <img
                  src={selectedAlumniProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedAlumniProfile.studentName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-500 shadow-sm"
                />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedAlumniProfile.studentName}</h3>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-bold font-mono">
                    {selectedAlumniProfile.admissionNo} &bull; {selectedAlumniProfile.batch}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedAlumniProfile(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Drawer Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-800/20 text-xs font-bold gap-4 overflow-x-auto">
              <button
                onClick={() => setProfileTab('general')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap ${profileTab === 'general' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}
              >
                General Info
              </button>
              <button
                onClick={() => setProfileTab('academics')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap ${profileTab === 'academics' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}
              >
                Academic History
              </button>
              <button
                onClick={() => setProfileTab('certificates')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap ${profileTab === 'certificates' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}
              >
                Certificates
              </button>
              <button
                onClick={() => setProfileTab('pursuit')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap ${profileTab === 'pursuit' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}
              >
                Current Status
              </button>
              <button
                onClick={() => setProfileTab('contact')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap ${profileTab === 'contact' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}
              >
                Contact Info
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
              {profileTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Admission No</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedAlumniProfile.admissionNo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Graduation Batch</p>
                      <p className="font-bold text-brand-600 mt-0.5">{selectedAlumniProfile.batch}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Completed Year</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedAlumniProfile.completionAcademicYear}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Completion Date</p>
                      <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedAlumniProfile.completionDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Final Class & Section</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedAlumniProfile.finalClass} - {selectedAlumniProfile.finalSection}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Branch / Campus</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedAlumniProfile.branch || 'Main Campus'}</p>
                    </div>
                  </div>

                  {matchedStudent && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Parent / Guardian Information</p>
                      <p className="text-slate-600 dark:text-slate-400">Father: <strong>{matchedStudent.fatherName}</strong> ({matchedStudent.fatherOccupation || 'N/A'})</p>
                      <p className="text-slate-600 dark:text-slate-400">Mother: <strong>{matchedStudent.motherName}</strong></p>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'academics' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white">Academic Performance History</p>
                    <p className="text-slate-500 text-[11px]">Final Class completed: <strong>{selectedAlumniProfile.finalClass}</strong></p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span>Overall Final Grade:</span>
                      <span className="font-bold text-emerald-600 text-sm">A+ (Grade Point 9.4)</span>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'certificates' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 dark:text-white">Available Alumni Certificates</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { name: 'Completion Certificate', type: 'completion' as const },
                      { name: 'Conduct Certificate', type: 'conduct' as const },
                      { name: 'Bonafide Certificate', type: 'bonafide' as const },
                      { name: 'Final Mark Sheet', type: 'marksheet' as const }
                    ].map(c => (
                      <div key={c.type} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                        <button
                          onClick={() => setCertificateModal({ isOpen: true, record: selectedAlumniProfile, type: c.type })}
                          className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View / Print
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profileTab === 'pursuit' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Current Pursuit Status</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold">{selectedAlumniProfile.currentStatus}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    {selectedAlumniProfile.higherEducationDetail || selectedAlumniProfile.organizationCompany || 'No specific institution / organization detail registered.'}
                  </p>
                </div>
              )}

              {profileTab === 'contact' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Registered Contact Details</p>
                  <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-brand-600" /> Phone: {selectedAlumniProfile.contactPhone || 'N/A'}</p>
                  <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-brand-600" /> Email: {selectedAlumniProfile.contactEmail || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {certificateModal.isOpen && certificateModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6">
            {/* Header toolbar */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Official School Certificate Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Certificate
                </button>
                <button onClick={() => setCertificateModal({ isOpen: false, record: null, type: 'completion' })} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Print Area */}
            <div className="p-8 border-4 border-double border-brand-700 rounded-2xl bg-amber-50/30 dark:bg-slate-800/40 text-center space-y-6 font-serif">
              <div className="space-y-1">
                <h2 className="text-xl font-bold uppercase text-brand-800 dark:text-brand-300">{schoolProfile?.name || 'PIRNAV EDUCATIONAL INSTITUTIONS'}</h2>
                <p className="text-xs text-slate-500 font-sans">{schoolProfile?.address || '742 Evergreen Terrace, Knowledge City'}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 pt-2 font-sans">
                  {certificateModal.type === 'completion' ? 'SCHOOL COMPLETION CERTIFICATE' :
                   certificateModal.type === 'conduct' ? 'CHARACTER & CONDUCT CERTIFICATE' :
                   certificateModal.type === 'bonafide' ? 'BONAFIDE ALUMNI CERTIFICATE' : 'FINAL MARKSHEET SUMMARY'}
                </p>
              </div>

              <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-3 py-4">
                <p>
                  This is to certify that <strong>{certificateModal.record.studentName}</strong>, Admission No: <strong>{certificateModal.record.admissionNo}</strong>, has successfully completed the <strong>{certificateModal.record.finalClass} ({certificateModal.record.finalSection})</strong> course of study during the Academic Session <strong>{certificateModal.record.completionAcademicYear}</strong>.
                </p>
                <p>
                  During the period of study in our institution, student's conduct and character were found to be <strong>EXCELLENT</strong>.
                </p>
              </div>

              <div className="pt-8 flex items-center justify-between text-xs font-sans text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <p>Date of Issue: <strong>{certificateModal.record.completionDate}</strong></p>
                  <p>Campus: <strong>{certificateModal.record.branch || 'Main Campus'}</strong></p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <p className="font-bold text-slate-900 dark:text-white">{schoolProfile?.principalName || 'Principal Signature'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
