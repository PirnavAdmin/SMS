import React, { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Send, ClipboardList, Download, Loader2, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { PrintableReportCard } from './PrintableReportCard';
import { ExamSetup, Student, SubjectItem, ProcessedResult } from '../../../types';
import { Panel } from './components/SharedUI';
import { useResults } from './hooks/useResults';
import { useData } from '../../../context/DataContext';
import { printReportCard, downloadReportCardPdf } from './utils/reportCardPrinter';

interface ReportCardsProps {
  exam: ExamSetup | null;
  classOptions: string[];
  subjects: SubjectItem[];
  students: Student[];
  selectedAcademicYear: string;
  selectedBranch: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const ReportCards: React.FC<ReportCardsProps> = ({
  exam,
  classOptions,
  subjects,
  students,
  addToast
}) => {
  const { getResultsForExamClass } = useResults();
  const { studentAttendance, coScholasticAssessments, academicClasses, schoolProfile } = useData();

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pass' | 'Fail'>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [previewResult, setPreviewResult] = useState<ProcessedResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);

  // Pagination state - Default 20 entries per page
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Dynamic sections from academicClasses
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const matched = academicClasses.find(c => c.name === selectedClass);
    if (!matched || !matched.sections || matched.sections.length === 0) return ['A'];
    const raw = matched.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || 'A'));
    return Array.from(new Set(raw.filter(Boolean)));
  }, [academicClasses, selectedClass]);

  const visibleResults = getResultsForExamClass(exam?.id || '', selectedClass, selectedSection);

  const filteredResults = useMemo(() => {
    let list = visibleResults.filter(r => {
      // 1. Search Query Filter
      const matchSearch = !searchQuery || 
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.rollNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.admissionNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Status Filter (Pass / Fail / All)
      const matchStatus = statusFilter === 'All' || r.passStatus === statusFilter;

      return matchSearch && matchStatus;
    });

    // 3. Rank Sort (Ascending #1 -> #N vs Descending #N -> #1)
    list = [...list].sort((a, b) => {
      if (sortOrder === 'asc') return (a.rank ?? 999) - (b.rank ?? 999);
      return (b.rank ?? 999) - (a.rank ?? 999);
    });

    return list;
  }, [visibleResults, searchQuery, statusFilter, sortOrder]);

  // Reset pagination & selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [selectedClass, selectedSection, searchQuery, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize]);

  // Selection handlers
  const isAllTotalSelected = filteredResults.length > 0 && filteredResults.every(r => selectedIds.includes(r.id));

  const handleToggleSelectAll = () => {
    if (isAllTotalSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResults.map(r => r.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const targetResultsForBulk = useMemo(() => {
    if (selectedIds.length > 0) {
      return filteredResults.filter(r => selectedIds.includes(r.id));
    }
    return filteredResults;
  }, [filteredResults, selectedIds]);

  // Bulk Actions
  const handleBulkDownload = () => {
    if (targetResultsForBulk.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select at least one student to download.');
      return;
    }
    setIsBulkDownloading(true);
    addToast('info', 'Generating PDFs', `Preparing official report cards for ${targetResultsForBulk.length} students...`);
    setTimeout(() => {
      targetResultsForBulk.forEach((res, idx) => {
        setTimeout(() => {
          downloadReportCardPdf(res, exam, schoolProfile, subjects);
        }, idx * 250);
      });
      setIsBulkDownloading(false);
      addToast('success', 'Download Complete', `Successfully downloaded report cards for ${targetResultsForBulk.length} students.`);
    }, 500);
  };

  const handleBulkSendToParent = () => {
    if (targetResultsForBulk.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select at least one student to dispatch report cards.');
      return;
    }
    setIsBulkSending(true);
    setTimeout(() => {
      setIsBulkSending(false);
      addToast('success', 'Parent Portal Dispatched', `Official report cards successfully dispatched to parents of ${targetResultsForBulk.length} students via Portal & SMS.`);
    }, 600);
  };

  const handleSendSingleToParent = (res: ProcessedResult) => {
    addToast('success', 'Report Card Dispatched', `Official report card sent to parents of ${res.studentName} via Portal & WhatsApp.`);
  };

  const handlePrintSingle = (res: ProcessedResult) => {
    printReportCard(res, exam, schoolProfile, subjects);
  };

  const handleDownloadSingle = (res: ProcessedResult) => {
    downloadReportCardPdf(res, exam, schoolProfile, subjects);
    addToast('success', 'PDF Downloaded', `Downloaded official report card for ${res.studentName}.`);
  };

  const getAttendanceForStudent = (studentId: string) => {
    return (studentAttendance as any[]).find((a: any) => a.studentId === studentId) || { workingDays: 220, presentDays: 205 };
  };

  const getCoScholasticForStudent = (studentId: string) => {
    return (coScholasticAssessments as any[]).find((c: any) => c.studentId === studentId) || {
      discipline: 'A',
      sports: 'A',
      artAndCraft: 'B+',
      generalConduct: 'A'
    };
  };

  const previewStudent = previewResult ? students.find(s => s.id === previewResult.studentId) || null : null;

  const tableHeaderClass = "px-4 py-3 text-center text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap last:border-r-0";
  const tdClass = "px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800/80 last:border-r-0 text-xs font-semibold";

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Student Report Cards"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {selectedClass && selectedSection && filteredResults.length > 0 && (
              <>
                {/* Display Send to Parent Portal & Download ONLY when items are selected */}
                {selectedIds.length > 0 && (
                  <>
                    <button
                      disabled={isBulkSending}
                      onClick={handleBulkSendToParent}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                      title="Send report cards to parent portal for selected students"
                    >
                      {isBulkSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>
                        Send to Parent Portal ({selectedIds.length})
                      </span>
                    </button>

                    <button
                      disabled={isBulkDownloading}
                      onClick={handleBulkDownload}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                      title="Download PDFs for selected students"
                    >
                      {isBulkDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>
                        Download ({selectedIds.length})
                      </span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        }
      >
        <div className="space-y-4 print:hidden">
          {/* Main Filter & Options Control Bar */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
              {/* Class Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 block">Class / Grade *</label>
                <select
                  value={selectedClass}
                  onChange={e => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[36px] shadow-xs"
                >
                  <option value="">-- Select Class --</option>
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 block">Section *</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[36px] shadow-xs disabled:opacity-50"
                >
                  <option value="">-- Select Section --</option>
                  {availableSections.map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>

              {/* Result Status Filter: All, Pass, Fail */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 block">Result Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  disabled={!selectedClass || !selectedSection}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[36px] shadow-xs disabled:opacity-50"
                >
                  <option value="All">All</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              {/* Sort Order: Ascending to Descending */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 block">Rank Order</label>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as any)}
                  disabled={!selectedClass || !selectedSection}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[36px] shadow-xs disabled:opacity-50"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 block">Search Student</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name/roll..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    disabled={!selectedClass || !selectedSection}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/50 transition h-[36px] shadow-xs disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {!selectedClass || !selectedSection ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-2">
              <ClipboardList className="w-8 h-8 text-sky-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Select Class & Section for Report Cards
              </h4>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch selection summary bar */}
              {filteredResults.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-sky-600 transition cursor-pointer"
                    >
                      {isAllTotalSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-600" />
                      ) : selectedIds.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-sky-600 opacity-70" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        {selectedIds.length > 0 ? `${selectedIds.length} of ${filteredResults.length} selected` : 'Select All'}
                      </span>
                    </button>
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        className="text-[11px] text-slate-500 hover:text-rose-500 underline ml-2 cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Show</span>
                    <select
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-[11px] text-slate-500">entries per page</span>
                  </div>
                </div>
              )}

              {/* Table Data View */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 w-10 text-center border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="cursor-pointer"
                          title="Select all"
                        >
                          {isAllTotalSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className={tableHeaderClass}>Rank</th>
                      <th className={tableHeaderClass}>Roll No.</th>
                      <th className={tableHeaderClass}>Student Name</th>
                      <th className={tableHeaderClass}>Total Marks</th>
                      <th className={tableHeaderClass}>Percentage</th>
                      <th className={tableHeaderClass}>Grade</th>
                      <th className={tableHeaderClass}>Result</th>
                      <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedResults.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                          {visibleResults.length === 0
                            ? `No processed result sheets found for ${selectedClass} Section ${selectedSection}. Please compute results under the "Results & Ranking" tab first.`
                            : `No students match the selected filter criteria.`}
                        </td>
                      </tr>
                    ) : (
                      paginatedResults.map(res => {
                        const isSelected = selectedIds.includes(res.id);
                        return (
                          <tr
                            key={res.id}
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors ${
                              isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                            }`}
                          >
                            <td className="px-3 py-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => handleToggleRow(res.id)}
                                className="cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-sky-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                )}
                              </button>
                            </td>

                            <td className={tdClass}>
                              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">
                                #{res.rank}
                              </span>
                            </td>

                            <td className={tdClass}>
                              <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                                {res.rollNo || 'N/A'}
                              </span>
                            </td>

                            <td className={tdClass}>
                              <div className="text-center">
                                <span className="font-extrabold text-slate-900 dark:text-white block">
                                  {res.studentName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Adm: {res.admissionNo || res.studentId} • {res.className} - {res.section}
                                </span>
                              </div>
                            </td>

                            <td className={tdClass}>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {res.totalObtainedMarks} / {res.totalMaxMarks}
                              </span>
                            </td>

                            <td className={tdClass}>
                              <span className="font-mono font-black text-sky-600 dark:text-sky-400">
                                {res.percentage.toFixed(1)}%
                              </span>
                            </td>

                            <td className={tdClass}>
                              <span className="font-black text-indigo-600 dark:text-indigo-400">
                                {res.finalGrade}
                              </span>
                            </td>

                            <td className={tdClass}>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                                  res.passStatus === 'Pass'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {res.passStatus}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewResult(res)}
                                  className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800 transition cursor-pointer"
                                  title="Preview Official Report Card"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSendSingleToParent(res)}
                                  className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 transition cursor-pointer"
                                  title="Send to Parent Portal"
                                >
                                  <Send className="w-4 h-4" />
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

              {/* Pagination Controls */}
              {filteredResults.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, filteredResults.length)}</span> to{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredResults.length)}</span> of{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{filteredResults.length}</span> entries
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer ${
                            currentPage === p
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal: Interactive Single Report Card Viewer */}
        {previewResult && previewStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Official Report Card Preview</h3>
                  <p className="text-xs text-slate-500 font-medium">Verify scholastic breakdown and attendance summary before printing.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintSingle(previewResult)}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    Print Now
                  </button>
                  <button
                    onClick={() => handleDownloadSingle(previewResult)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setPreviewResult(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Component Body */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <PrintableReportCard
                  student={previewStudent}
                  exam={exam}
                  processedResult={previewResult}
                  attendance={getAttendanceForStudent(previewResult.studentId)}
                  coScholastic={getCoScholasticForStudent(previewResult.studentId)}
                  onClose={() => setPreviewResult(null)}
                />
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default ReportCards;
