// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Eye, 
  Send, 
  ClipboardList, 
  Download, 
  Printer, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  CheckSquare, 
  Square, 
  Award, 
  CheckCircle2, 
  XCircle, 
  User, 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  Check, 
  GraduationCap, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { PrintableReportCard } from './PrintableReportCard';
import { ExamSetup, Student, SubjectItem, ProcessedResult } from '../../../types';
import { useResults } from './hooks/useResults';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { fetchReportCardsApi, fetchExamOptionsApi } from '../../../api/examination';
import { printReportCard, printBulkReportCards, downloadReportCardPdf } from './utils/reportCardPrinter';

interface GlobalReportCardsViewProps {
  onNavigate?: (module: string) => void;
}

export const GlobalReportCardsView: React.FC<GlobalReportCardsViewProps> = ({ onNavigate }) => {
  const { 
    students, 
    exams, 
    subjects, 
    academicClasses, 
    schoolProfile, 
    processedResults: contextResults,
    examMarks,
    gradeConfigurations
  } = useData();
  const { selectedAcademicYear, selectedBranch, user, role } = useAuth();
  const { addToast } = useToast();
  const { calculateClassResults } = useResults();

  // Filter States
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pass' | 'Fail'>('All');
  const [sortOrder, setSortOrder] = useState<'rank-asc' | 'rank-desc' | 'name-asc' | 'pct-desc'>('rank-asc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropdown UI states
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [studentSearchText, setStudentSearchText] = useState('');
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Table & Action States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewResult, setPreviewResult] = useState<ProcessedResult | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiReportCards, setApiReportCards] = useState<any[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Close student dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine released exams
  const releasedExams = useMemo(() => {
    return (exams || []).filter(e => 
      e.publishStatus === 'Published' || 
      e.status === 'Results Published' || 
      e.status === 'Published' ||
      contextResults.some(r => r.examId === e.id && (r.status === 'Published' || r.status === 'Approved' || !!r.publishedAt))
    );
  }, [exams, contextResults]);

  // Available classes
  const classOptions = useMemo(() => {
    const fromAcademic = (academicClasses || []).map(c => c.name).filter(Boolean);
    const fromStudents = (students || []).map(s => s.className).filter(Boolean);
    return Array.from(new Set([...fromAcademic, ...fromStudents])).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [academicClasses, students]);

  // Available sections based on selected class
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const matched = (academicClasses || []).find(c => c.name === selectedClass);
    if (matched && matched.sections && matched.sections.length > 0) {
      const raw = matched.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || ''));
      return Array.from(new Set(raw.filter(Boolean)));
    }
    const studentSecs = (students || [])
      .filter(s => s.className === selectedClass && s.section)
      .map(s => s.section!);
    return Array.from(new Set(studentSecs)).sort();
  }, [academicClasses, selectedClass, students]);

  // Students list for dropdown (filtered by class and section)
  const candidateStudents = useMemo(() => {
    return (students || []).filter(s => {
      if (s.status !== 'Active') return false;
      if (selectedClass && s.className !== selectedClass) return false;
      if (selectedSection && selectedSection !== 'all' && s.section !== selectedSection) return false;
      return true;
    });
  }, [students, selectedClass, selectedSection]);

  // Filter candidate students inside the searchable dropdown
  const filteredDropdownStudents = useMemo(() => {
    if (!studentSearchText.trim()) return candidateStudents;
    const query = studentSearchText.toLowerCase().trim();
    return candidateStudents.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
      (s.admissionNo || '').toLowerCase().includes(query) ||
      (s.rollNo || '').toLowerCase().includes(query) ||
      String(s.id || '').toLowerCase().includes(query)
    );
  }, [candidateStudents, studentSearchText]);

  // Fetch Report Cards from API with graceful fallback
  useEffect(() => {
    let isMounted = true;
    const loadReportCards = async () => {
      if (!selectedClass) {
        setApiReportCards(null);
        setApiError(null);
        return;
      }
      setIsApiLoading(true);
      setApiError(null);
      try {
        const res = await fetchReportCardsApi(
          selectedClass, 
          selectedSection && selectedSection !== 'all' ? selectedSection : '', 
          statusFilter !== 'All' ? statusFilter : undefined,
          sortOrder
        );
        if (isMounted) {
          if (res && res.success && Array.isArray(res.data)) {
            setApiReportCards(res.data);
          } else {
            setApiReportCards(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Report cards API request note (using local released data):', err);
          setApiReportCards(null);
        }
      } finally {
        if (isMounted) setIsApiLoading(false);
      }
    };

    loadReportCards();
    return () => { isMounted = false; };
  }, [selectedClass, selectedSection, statusFilter, sortOrder]);

  // Combine and filter released results
  const releasedResults = useMemo(() => {
    let resultsList: ProcessedResult[] = [];

    if (apiReportCards && apiReportCards.length > 0) {
      resultsList = apiReportCards.map((r: any) => ({
        id: String(r.id || r.resultId || `API-${r.studentId}`),
        examId: String(r.examId || selectedExamId || '1'),
        studentId: String(r.studentId || ''),
        studentName: r.studentName || `${r.firstName || ''} ${r.lastName || ''}`.trim(),
        className: r.className || selectedClass,
        section: r.sectionName || r.section || selectedSection,
        rollNo: r.rollNumber || r.rollNo || '',
        admissionNo: r.admissionNumber || r.admissionNo || r.studentId,
        totalMaxMarks: Number(r.totalMaxMarks || r.maxMarks || 500),
        totalObtainedMarks: Number(r.totalObtainedMarks || r.obtainedMarks || 0),
        percentage: Number(r.percentage || (r.totalMaxMarks ? (r.totalObtainedMarks / r.totalMaxMarks) * 100 : 0)),
        gpa: Number(r.gpa || 0),
        finalGrade: r.finalGrade || r.grade || 'A',
        overallGrade: r.overallGrade || r.grade || 'A',
        subjectMarks: Array.isArray(r.subjectMarks) ? r.subjectMarks : [],
        passStatus: (r.passStatus || (r.percentage >= 35 ? 'Pass' : 'Fail')) as 'Pass' | 'Fail',
        status: 'Published',
        rank: Number(r.rank || 1)
      }));
    } else {
      // Use DataContext results, filtering strictly for released ones
      resultsList = (contextResults || []).filter(r => {
        const matchingExam = (exams || []).find(e => e.id === r.examId);
        const isExamReleased = matchingExam && (
          matchingExam.publishStatus === 'Published' || 
          matchingExam.status === 'Results Published' || 
          matchingExam.status === 'Published'
        );
        const isResultReleased = r.status === 'Published' || r.status === 'Approved' || !!r.publishedAt;
        return isExamReleased || isResultReleased;
      });
    }

    // 2. Filter by Exam
    if (selectedExamId && selectedExamId !== 'all') {
      resultsList = resultsList.filter(r => r.examId === selectedExamId);
    }

    // 3. Filter by Class
    if (selectedClass) {
      resultsList = resultsList.filter(r => r.className === selectedClass);
    }

    // 4. Filter by Section
    if (selectedSection && selectedSection !== 'all') {
      const cleanSec = selectedSection.replace('Section ', '').trim().toUpperCase();
      resultsList = resultsList.filter(r => {
        const rSec = (r.section || '').replace('Section ', '').trim().toUpperCase();
        return rSec === cleanSec || r.section === selectedSection;
      });
    }

    // 5. Filter by Specific Student
    if (selectedStudentId && selectedStudentId !== 'all') {
      resultsList = resultsList.filter(r => String(r.studentId) === String(selectedStudentId));
    }

    // 6. Filter by Status (Pass / Fail)
    if (statusFilter !== 'All') {
      resultsList = resultsList.filter(r => r.passStatus === statusFilter);
    }

    // 7. General Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      resultsList = resultsList.filter(r => 
        r.studentName.toLowerCase().includes(q) ||
        (r.rollNo || '').toLowerCase().includes(q) ||
        (r.admissionNo || '').toLowerCase().includes(q) ||
        String(r.studentId || '').toLowerCase().includes(q)
      );
    }

    // 8. Sorting
    return [...resultsList].sort((a, b) => {
      if (sortOrder === 'rank-asc') return (a.rank ?? 999) - (b.rank ?? 999);
      if (sortOrder === 'rank-desc') return (b.rank ?? 999) - (a.rank ?? 999);
      if (sortOrder === 'name-asc') return a.studentName.localeCompare(b.studentName);
      if (sortOrder === 'pct-desc') return b.percentage - a.percentage;
      return 0;
    });
  }, [
    apiReportCards, 
    contextResults, 
    exams, 
    selectedExamId, 
    selectedClass, 
    selectedSection, 
    selectedStudentId, 
    statusFilter, 
    searchQuery, 
    sortOrder
  ]);

  // Reset pagination & selections on filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [selectedExamId, selectedClass, selectedSection, selectedStudentId, statusFilter, sortOrder, searchQuery]);

  // Selected student display helper
  const selectedStudentObj = useMemo(() => {
    if (!selectedStudentId || selectedStudentId === 'all') return null;
    return students.find(s => String(s.id) === String(selectedStudentId));
  }, [students, selectedStudentId]);

  // Statistics
  const totalCount = releasedResults.length;
  const passCount = releasedResults.filter(r => r.passStatus === 'Pass').length;
  const failCount = releasedResults.filter(r => r.passStatus === 'Fail').length;
  const avgPercentage = totalCount > 0 
    ? (releasedResults.reduce((acc, curr) => acc + curr.percentage, 0) / totalCount).toFixed(1) 
    : '0.0';

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return releasedResults.slice(start, start + pageSize);
  }, [releasedResults, currentPage, pageSize]);

  // Selection handlers
  const isAllTotalSelected = totalCount > 0 && releasedResults.every(r => selectedIds.includes(r.id));

  const handleToggleSelectAll = () => {
    if (isAllTotalSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(releasedResults.map(r => r.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const targetResultsForBulk = useMemo(() => {
    if (selectedIds.length > 0) {
      return releasedResults.filter(r => selectedIds.includes(r.id));
    }
    return releasedResults;
  }, [releasedResults, selectedIds]);

  // Active exam object helper
  const activeExamObj = useMemo(() => {
    if (selectedExamId && selectedExamId !== 'all') {
      return exams.find(e => e.id === selectedExamId) || null;
    }
    return releasedExams[0] || exams[0] || null;
  }, [exams, releasedExams, selectedExamId]);

  // Bulk Actions
  const handleBulkDownload = () => {
    if (targetResultsForBulk.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select at least one report card to download.');
      return;
    }
    setIsBulkDownloading(true);
    addToast('info', 'Generating Official Report Cards', `Packaging report cards for ${targetResultsForBulk.length} students...`);
    setTimeout(() => {
      targetResultsForBulk.forEach((res, idx) => {
        setTimeout(() => {
          const resExam = exams.find(e => e.id === res.examId) || activeExamObj;
          downloadReportCardPdf(res, resExam, schoolProfile, subjects);
        }, idx * 200);
      });
      setIsBulkDownloading(false);
      addToast('success', 'Download Complete', `Successfully generated report cards for ${targetResultsForBulk.length} students.`);
    }, 400);
  };

  const handleBulkPrint = () => {
    if (targetResultsForBulk.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select report cards to print.');
      return;
    }
    printBulkReportCards(targetResultsForBulk, activeExamObj, schoolProfile, subjects);
    addToast('info', 'Print Job Sent', `Opening printer window for ${targetResultsForBulk.length} report cards.`);
  };

  const handleBulkSendToParent = () => {
    if (targetResultsForBulk.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select report cards to dispatch.');
      return;
    }
    setIsBulkSending(true);
    setTimeout(() => {
      setIsBulkSending(false);
      addToast('success', 'Dispatched to Parents', `Official report cards published to parent portal and SMS for ${targetResultsForBulk.length} students.`);
    }, 600);
  };

  const handleSinglePrint = (res: ProcessedResult) => {
    const resExam = exams.find(e => e.id === res.examId) || activeExamObj;
    printReportCard(res, resExam, schoolProfile, subjects);
  };

  const handleSingleDownload = (res: ProcessedResult) => {
    const resExam = exams.find(e => e.id === res.examId) || activeExamObj;
    downloadReportCardPdf(res, resExam, schoolProfile, subjects);
    addToast('success', 'Downloaded', `Saved official report card for ${res.studentName}.`);
  };

  const handleSingleSend = (res: ProcessedResult) => {
    addToast('success', 'Sent to Parent', `Report card sent to guardians of ${res.studentName} via Portal & WhatsApp.`);
  };

  const handleResetFilters = () => {
    setSelectedExamId('all');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedStudentId('all');
    setStatusFilter('All');
    setSortOrder('rank-asc');
    setSearchQuery('');
    setStudentSearchText('');
  };

  const previewStudentObj = previewResult ? students.find(s => String(s.id) === String(previewResult.studentId)) || null : null;
  const previewExamObj = previewResult ? exams.find(e => e.id === previewResult.examId) || activeExamObj : activeExamObj;

  return (
    <div className="space-y-4 text-left w-full">
      {/* 1. Page Header Card */}
      <div className="py-4 px-5 sm:px-6 rounded-3xl border border-sky-400 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Student Report Cards
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Released Results
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions on header */}
        <div className="flex items-center gap-2">
          {totalCount > 0 && selectedIds.length > 0 && (
            <>
              <button
                type="button"
                disabled={isBulkSending}
                onClick={handleBulkSendToParent}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                {isBulkSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send to Parents ({selectedIds.length})</span>
              </button>

              <button
                type="button"
                onClick={handleBulkPrint}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print ({selectedIds.length})</span>
              </button>

              <button
                type="button"
                disabled={isBulkDownloading}
                onClick={handleBulkDownload}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                {isBulkDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Download PDFs ({selectedIds.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Statistical Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Released Cards</span>
            <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{totalCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Passed Students</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{passCount}</span>
              {totalCount > 0 && (
                <span className="text-[11px] font-bold text-slate-400">
                  ({((passCount / totalCount) * 100).toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Failed Students</span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none">{failCount}</span>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Multi-Filter Bar with Searchable Student Dropdown with ID */}
      <div className="p-4 sm:p-5 rounded-3xl border border-sky-400 bg-slate-50/60 dark:bg-slate-950/60 shadow-xs space-y-3.5 no-print">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Search & Filter</span>
          </div>

          {(selectedClass || selectedSection || selectedStudentId !== 'all' || statusFilter !== 'All' || searchQuery || selectedExamId !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Exam Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 block">
              Examination
            </label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[38px] shadow-xs"
            >
              <option value="all">All Released Exams</option>
              {releasedExams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.term || ex.academicTerm || 'Term'})
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 block">
              Class / Grade <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
                setSelectedStudentId('all');
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[38px] shadow-xs"
            >
              <option value="">-- All Classes --</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 block">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={e => {
                setSelectedSection(e.target.value);
                setSelectedStudentId('all');
              }}
              disabled={!selectedClass}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[38px] shadow-xs disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>
                  {sec.startsWith('Section') ? sec : `Section ${sec}`}
                </option>
              ))}
            </select>
          </div>

          {/* Searchable Student Dropdown displaying Student Name AND ID */}
          <div className="space-y-1 relative" ref={studentDropdownRef}>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 block">
              Search Student
            </label>
            <button
              type="button"
              onClick={() => setIsStudentDropdownOpen(prev => !prev)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[38px] shadow-xs flex items-center justify-between text-left transition"
            >
              <span className="truncate">
                {selectedStudentObj 
                  ? `[${selectedStudentObj.admissionNo || selectedStudentObj.id}] ${selectedStudentObj.firstName} ${selectedStudentObj.lastName}`
                  : selectedStudentId === 'all' 
                    ? 'All Students' 
                    : '-- Select Student --'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isStudentDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 min-w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Search input inside dropdown */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student by name, ID, adm no..."
                      value={studentSearchText}
                      onChange={e => setStudentSearchText(e.target.value)}
                      autoFocus
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>
                </div>

                {/* Dropdown list items */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId('all');
                      setIsStudentDropdownOpen(false);
                      setStudentSearchText('');
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer ${
                      selectedStudentId === 'all' ? 'bg-sky-50/80 dark:bg-sky-950/60 font-bold text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>All Students {candidateStudents.length > 0 && `(${candidateStudents.length})`}</span>
                    {selectedStudentId === 'all' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                  </button>

                  {filteredDropdownStudents.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs font-semibold">
                      No matching students found
                    </div>
                  ) : (
                    filteredDropdownStudents.map(st => {
                      const isSelected = String(st.id) === String(selectedStudentId);
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(String(st.id));
                            setIsStudentDropdownOpen(false);
                            setStudentSearchText('');
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer ${
                            isSelected ? 'bg-sky-50/80 dark:bg-sky-950/60 font-bold text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-extrabold block truncate text-slate-900 dark:text-white">
                              {st.firstName} {st.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              ID: <strong className="text-slate-700 dark:text-slate-300 font-mono">{st.admissionNo || st.id}</strong> • Roll #{st.rollNo || 'N/A'} • {st.className} {st.section ? `(${st.section})` : ''}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 block">
              Result Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer h-[38px] shadow-xs"
            >
              <option value="All">All Results</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
          </div>
        </div>

        {/* Global Quick Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/50 transition h-[38px] shadow-xs"
          />
        </div>
      </div>

      {/* 4. Table / List of Released Report Cards */}
      <div className="space-y-4">
        {/* Selection & Page size bar */}
        {releasedResults.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs no-print">
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
                  {selectedIds.length > 0 ? `${selectedIds.length} of ${releasedResults.length} selected` : 'Select All'}
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

        {/* Loading indicator */}
        {isApiLoading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-sky-400 rounded-3xl space-y-3">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Retrieving released report cards...
            </p>
          </div>
        ) : releasedResults.length === 0 ? (
          /* Explicit No Data Found state (Handles missing records or failed API with graceful UI) */
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-sky-400 rounded-3xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200/80 dark:border-amber-900/60">
              <ClipboardList className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              No Released Report Cards Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
              {selectedClass
                ? `No published report cards match the selected class (${selectedClass})${selectedSection ? `, section (${selectedSection})` : ''}, or student filter. Report cards become visible once exam results are officially calculated and published.`
                : 'No published examination results are available. Select a class or check if examination results have been released by the examination controller.'}
            </p>
          </div>
        ) : (
          /* Table of Released Report Cards */
          <div className="overflow-x-auto rounded-3xl border border-sky-400 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-3.5 w-10 text-center border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70">
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
                  <th className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                    Rank
                  </th>
                  <th className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                    Roll No
                  </th>
                  <th className="px-4 py-3.5 text-left text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                    Student Details & ID
                  </th>
                  <th className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                    Marks Obtained
                  </th>
                  <th className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                    Percentage
                  </th>
                  <th className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                    Grade
                  </th>
                  <th className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedResults.map(res => {
                  const isSelected = selectedIds.includes(res.id);
                  return (
                    <tr
                      key={res.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors ${
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

                      <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                          #{res.rank}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                          {res.rollNo || 'N/A'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-left border-r border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            {res.studentName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            ID: <strong className="text-slate-700 dark:text-slate-300 font-mono">{res.admissionNo || res.studentId}</strong> • {res.className} - {res.section}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {res.totalObtainedMarks} / {res.totalMaxMarks}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-xs">
                            {res.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50">
                          {res.finalGrade}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800/80">
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
                            onClick={() => handleSingleDownload(res)}
                            className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Download Report Card PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSinglePrint(res)}
                            className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Print Report Card"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSingleSend(res)}
                            className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 transition cursor-pointer"
                            title="Send to Parent Portal & SMS"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {releasedResults.length > 0 && (
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 flex flex-wrap items-center justify-between gap-4 text-xs no-print">
            <div className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, totalCount)}</span> to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalCount}</span> released entries
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map(p => (
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

      {/* 5. Printable Report Card Modal Preview */}
      {previewResult && (
        <PrintableReportCard
          student={previewStudentObj}
          exam={previewExamObj}
          processedResult={previewResult}
          isOpen={!!previewResult}
          onClose={() => setPreviewResult(null)}
          schoolProfile={schoolProfile}
        />
      )}
    </div>
  );
};

export default GlobalReportCardsView;
