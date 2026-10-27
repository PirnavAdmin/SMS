import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, Search, CheckSquare, Square, ArrowRight, Building2, 
  CheckCircle2, GraduationCap, Award, RefreshCw, Filter, Sparkles, 
  AlertCircle, Users, LayoutGrid, Check, FileCheck2, ShieldCheck, XCircle,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { useData, formatAcademicYear } from '../../../../context/DataContext';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { ExportButton } from '../../../common/ExportButton';
import { SectionAssignmentMethod, PromotionHistoryItem, ExamSetup } from '../../../../types';
import { executePromotionApi, loadPromotionResultsApi, loadFinalResultsApi } from '../../../../api/studentPromotion';
import { fetchReportCardsApi, fetchExamOptionsApi } from '../../../../api/examination';
import { matchesClassName } from '../../../../utils/classSorter';
import { 
  updateStudentApi, 
  fetchStudentClassesDropdownApi, 
  fetchStudentSectionsDropdownApi, 
  fetchStudentAcademicYearsDropdownApi 
} from '../../../../api/students';

interface StudentPromotionViewProps {
  onNavigate?: (module: string) => void;
}

const IndeterminateCheckbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  title?: string;
  id?: string;
}> = ({ checked, indeterminate = false, onChange, className, title, id }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      id={id}
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={onChange}
      title={title}
      className={className || "rounded border-slate-300 text-brand-600 focus:ring-brand-600 cursor-pointer"}
    />
  );
};

interface PromotionStudentRow {
  id: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  avatar: string;
  branch: string;
  currentClass: string;
  currentSection: string;
  overallPct: number;
  grade: string;
  finalResult: 'PASS' | 'FAIL';
  promotionStatus: 'Promote' | 'Retain';
  newClass: string;
  newSection: string;
  remarks: string;
  isAlreadyPromoted?: boolean;
}

export const StudentPromotionView: React.FC<StudentPromotionViewProps> = ({ onNavigate }) => {
  const { 
    students, 
    academicClasses, 
    academicYears, 
    feeStructures = [], 
    dynamicFeeStructures = [],
    allDynamicFeeStructures = [],
    feeSchedules = [],
    studentFeeAssignments = [],
    updateStudent, 
    addAcademicHistoryRecord, 
    getHighestClass, 
    logActivity,
    fetchStudents,
    fetchBranches,
    branches = [],
    processedResults = [],
    examMarks = [],
    exams = [],
    examSchedules = [],
    refreshExamData
  } = useData() as any;
  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (fetchBranches && (!branches || branches.length === 0)) {
      fetchBranches();
    }
  }, [fetchBranches, branches]);

  const highestClass = useMemo(() => {
    if (typeof getHighestClass === 'function') {
      try {
        const val = getHighestClass();
        if (val) return val;
      } catch {}
    }
    if (Array.isArray(academicClasses) && academicClasses.length > 0) {
      const sorted = [...academicClasses]
        .map((c: any) => ({
          name: c.name,
          num: parseInt(String(c.name).replace(/[^0-9]/g, '')) || 0,
        }))
        .sort((a: any, b: any) => b.num - a.num);
      if (sorted[0] && sorted[0].num >= 10) {
        return sorted[0].name;
      }
    }
    return 'Class 12';
  }, [getHighestClass, academicClasses]);

  // Helper: Next class in sequence
  const getNextClassName = (currClass: string) => {
    const match = currClass.match(/\d+/);
    if (match) {
      const nextNum = parseInt(match[0], 10) + 1;
      const calculatedNext = currClass.replace(/\d+/, String(nextNum));
      const found = (academicClasses || []).find((c: any) => c.name.toLowerCase() === calculatedNext.toLowerCase());
      return found ? found.name : calculatedNext;
    }
    if (currClass.toLowerCase() === 'nursery') return 'LKG';
    if (currClass.toLowerCase() === 'lkg') return 'UKG';
    if (currClass.toLowerCase() === 'ukg') return 'Class 1';
    return 'Class 2';
  };

  // Helper: Parse academic year into canonical key (YYYY-YYYY) and start year
  const parseAcademicYearRange = useCallback((yrStr: string): { key: string; startYear: number } => {
    const cleaned = (yrStr || '').trim().replace(/\s+/g, '');
    const match = cleaned.match(/^(\d{4})[-–/](\d{2,4})$/);
    if (match) {
      const start = parseInt(match[1], 10);
      let end = parseInt(match[2], 10);
      if (end < 100) {
        end = Math.floor(start / 100) * 100 + end;
      }
      return { key: `${start}-${end}`, startYear: start };
    }
    const startMatch = cleaned.match(/(\d{4})/);
    const start = startMatch ? parseInt(startMatch[1], 10) : 0;
    return { key: cleaned, startYear: start };
  }, []);

  // Helper: Auto-calculate Next Academic Year
  const getTargetYearFromCurrent = useCallback((currYear: string) => {
    const match = (currYear || '').match(/(\d{4})\s*[-–/]\s*(\d{2,4})/);
    if (match) {
      const start = parseInt(match[1], 10) + 1;
      let end = parseInt(match[2], 10);
      if (end < 100) {
        end = Math.floor(parseInt(match[1], 10) / 100) * 100 + end;
      }
      const targetEnd = end + 1;
      const shortEnd = String(targetEnd % 100).padStart(2, '0');
      return `${start}-${shortEnd}`;
    }
    const curr = new Date().getFullYear();
    const nextStart = curr + 1;
    const nextEnd = String((curr + 2) % 100).padStart(2, '0');
    return `${nextStart}-${nextEnd}`;
  }, []);

  // Resolve only the current active academic year
  const currentActiveAcademicYear = useMemo(() => {
    const list = Array.isArray(academicYears) ? academicYears : [];
    const getYr = (ay: any) =>
      typeof ay === 'string'
        ? ay.trim()
        : String(ay?.academicYear || ay?.year || ay?.academicYearName || '').trim();

    const explicitCurrent = list.find(
      (ay: any) =>
        typeof ay === 'object' &&
        ay !== null &&
        Boolean(ay.isCurrentAcademicYear || ay.isCurrent)
    );
    if (explicitCurrent && getYr(explicitCurrent)) {
      return formatAcademicYear(getYr(explicitCurrent));
    }

    const activeStatusItem = list.find(
      (ay: any) =>
        typeof ay === 'object' &&
        ay !== null &&
        (String(ay.status || '').toLowerCase() === 'active' || Boolean(ay.isActive))
    );
    if (activeStatusItem && getYr(activeStatusItem)) {
      return formatAcademicYear(getYr(activeStatusItem));
    }

    if (selectedAcademicYear && selectedAcademicYear.trim()) {
      return formatAcademicYear(selectedAcademicYear.trim());
    }
    return list.length > 0 ? formatAcademicYear(getYr(list[0])) : '';
  }, [academicYears, selectedAcademicYear]);

  // Target Academic Year options: only Current Active Year and Future Academic Years (deduplicated)
  const targetAcademicYearOptions = useMemo(() => {
    const list = Array.isArray(academicYears) ? academicYears : [];
    const formattedCurrentAY = formatAcademicYear(currentActiveAcademicYear);
    const { key: currentKey, startYear: currentStartYear } = parseAcademicYearRange(formattedCurrentAY);
    const nextCalculated = getTargetYearFromCurrent(formattedCurrentAY);
    const { key: nextKey, startYear: nextStartYear } = parseAcademicYearRange(nextCalculated);

    const optionsMap = new Map<string, { value: string; label: string; startYear: number }>();

    // 1. Add current active year and future years from configured academicYears
    list.forEach((ay: any) => {
      const rawYr = typeof ay === 'string'
        ? ay.trim()
        : String(ay?.academicYear || ay?.year || ay?.academicYearName || '').trim();
      if (!rawYr) return;

      const formattedYr = formatAcademicYear(rawYr);
      const { key, startYear } = parseAcademicYearRange(formattedYr);
      if (!startYear || (currentStartYear > 0 && startYear < currentStartYear)) {
        return; // Exclude past academic years
      }

      if (!optionsMap.has(key)) {
        const isCurr = key === currentKey;
        const isNext = key === nextKey;
        const suffix = isCurr ? ' (Current)' : isNext ? ' (Next Year)' : '';
        optionsMap.set(key, {
          value: formattedYr,
          label: `${formattedYr}${suffix}`,
          startYear
        });
      }
    });

    // 2. Ensure currentActiveAcademicYear is present
    if (formattedCurrentAY && currentKey && !optionsMap.has(currentKey)) {
      optionsMap.set(currentKey, {
        value: formattedCurrentAY,
        label: `${formattedCurrentAY} (Current)`,
        startYear: currentStartYear || new Date().getFullYear()
      });
    }

    // 3. Ensure nextCalculated academic year is present
    if (nextCalculated && nextKey && !optionsMap.has(nextKey)) {
      optionsMap.set(nextKey, {
        value: nextCalculated,
        label: `${nextCalculated} (Next Year)`,
        startYear: nextStartYear || (currentStartYear ? currentStartYear + 1 : new Date().getFullYear() + 1)
      });
    }

    return Array.from(optionsMap.values()).sort((a, b) => a.startYear - b.startYear);
  }, [academicYears, currentActiveAcademicYear, parseAcademicYearRange, getTargetYearFromCurrent]);

  // Filter States
  const [currentYear, setCurrentYear] = useState<string>(() => formatAcademicYear(currentActiveAcademicYear));
  const [targetYear, setTargetYear] = useState<string>(() => getTargetYearFromCurrent(currentActiveAcademicYear));
  const [branch, setBranch] = useState<string>(selectedBranch && selectedBranch !== 'All' ? selectedBranch : '');
  const [fromClass, setFromClass] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Keep currentYear synchronized with the current active academic year and targetYear valid
  useEffect(() => {
    const formattedCurrent = formatAcademicYear(currentActiveAcademicYear);
    if (formattedCurrent && currentYear !== formattedCurrent) {
      setCurrentYear(formattedCurrent);
    }
    if (targetAcademicYearOptions.length > 0) {
      const hasCurrentTarget = targetAcademicYearOptions.some(opt => opt.value === targetYear);
      if (!hasCurrentTarget) {
        const nextCalc = getTargetYearFromCurrent(formattedCurrent);
        const { key: nextKey } = parseAcademicYearRange(nextCalc);
        const preferred =
          targetAcademicYearOptions.find(opt => parseAcademicYearRange(opt.value).key === nextKey) ||
          targetAcademicYearOptions[0];
        if (preferred) {
          setTargetYear(preferred.value);
        }
      }
    }
  }, [currentActiveAcademicYear, currentYear, targetYear, targetAcademicYearOptions, getTargetYearFromCurrent, parseAcademicYearRange]);

  const effectiveBranch = selectedBranch || branch || '';

  // Synchronize branch from global AuthContext
  useEffect(() => {
    if (selectedBranch && selectedBranch !== branch) {
      setBranch(selectedBranch);
      setSelectedExamId('');
      setPromotionRows([]);
      setIsResultsLoaded(false);
      setSelectedStudentIds([]);
    }
  }, [selectedBranch]);

  // Dynamic Examinations State fetched from Examination Module API
  const [dynamicExams, setDynamicExams] = useState<ExamSetup[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState<boolean>(false);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // Load all examinations dynamically from Examination module API
  const loadDynamicExaminations = useCallback(async () => {
    setIsLoadingExams(true);
    try {
      if (refreshExamData) {
        refreshExamData().catch(() => {});
      }
      const response: any = await fetchExamOptionsApi();
      const existingList = response?.data?.existingExams || response?.data || response || [];
      if (Array.isArray(existingList)) {
        const mapped: ExamSetup[] = existingList.map((e: any) => ({
          id: String(e.examId || e.id || ''),
          name: e.examName || e.name || '',
          examName: e.examName || e.name || '',
          className: e.className || (Array.isArray(e.applicableClasses) ? e.applicableClasses[0] : '') || '',
          term: e.academicTerm || e.term || 'Term 1',
          academicTerm: e.academicTerm || e.term || 'Term 1',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          classes: Array.isArray(e.applicableClasses) ? e.applicableClasses : (Array.isArray(e.classes) ? e.classes : []),
          applicableClasses: Array.isArray(e.applicableClasses) ? e.applicableClasses : (Array.isArray(e.classes) ? e.classes : []),
          status: e.status || 'Scheduled',
          academicYear: e.academicYear || currentYear || selectedAcademicYear || '',
          assessmentType: e.assessmentType || e.examType || 'Main Exam',
          examType: e.assessmentType || e.examType || 'Main Exam',
          displayText: e.displayText || ''
        } as unknown as ExamSetup));
        setDynamicExams(mapped);
      }
    } catch (err) {
      console.warn('Failed to dynamically fetch examination options:', err);
    } finally {
      setIsLoadingExams(false);
    }
  }, [currentYear, refreshExamData]);

  useEffect(() => {
    loadDynamicExaminations();
  }, [loadDynamicExaminations]);

  // Combine all sources: dynamic API exams, DataContext exams, examSchedules, processedResults
  const allExaminations = useMemo(() => {
    const map = new Map<string, ExamSetup>();

    // 1. Dynamic exams fetched directly from Examination module API
    (dynamicExams || []).forEach((e: any) => {
      if (e && e.id) {
        map.set(String(e.id), e);
      }
    });

    // 2. DataContext & ExaminationContext exams
    (exams || []).forEach((e: any) => {
      if (e && e.id) {
        const idKey = String(e.id);
        const existing = map.get(idKey);
        if (!existing) {
          map.set(idKey, {
            ...e,
            applicableClasses: e.applicableClasses || (e as any).classes || (e.className ? [e.className] : [])
          });
        } else {
          map.set(idKey, {
            ...existing,
            ...e,
            name: existing.name || e.name,
            applicableClasses: (existing.applicableClasses && existing.applicableClasses.length > 0)
              ? existing.applicableClasses
              : (e.applicableClasses || (e as any).classes || [])
          });
        }
      }
    });

    // 3. Examinations from examSchedules
    (examSchedules || []).forEach((s: any) => {
      const sExamId = String(s.examId || '');
      if (sExamId && !map.has(sExamId)) {
        map.set(sExamId, {
          id: sExamId,
          name: s.examName || `Examination ${sExamId}`,
          academicYear: s.academicYear || currentYear,
          status: 'Scheduled',
          applicableClasses: s.className ? [s.className] : [],
          classes: s.className ? [s.className] : []
        } as unknown as ExamSetup);
      }
    });

    // 4. Examinations referenced in processedResults
    (processedResults || []).forEach((pr: any) => {
      const prExamId = String(pr.examId || '');
      if (prExamId && !map.has(prExamId)) {
        map.set(prExamId, {
          id: prExamId,
          name: pr.examName || `Examination ${prExamId}`,
          academicYear: currentYear,
          status: 'Published',
          applicableClasses: pr.className ? [pr.className] : [],
          classes: pr.className ? [pr.className] : []
        } as unknown as ExamSetup);
      }
    });

    return Array.from(map.values());
  }, [dynamicExams, exams, examSchedules, processedResults, currentYear]);

  // Dynamically compute eligible examinations based on Current Academic Year, Branch, and Current Class
  const availableExaminations = useMemo(() => {
    if (!fromClass || !currentYear) return [];

    return allExaminations.filter((exam) => {
      // 1. Academic Year Validation: Match if explicitly specified
      const examYear = (exam.academicYear || '').trim();
      if (examYear) {
        const normExamYear = examYear.replace(/(\d{4})-(\d{2,4})/, (m, p1, p2) => p2.length === 2 ? `${p1}-20${p2}` : m);
        const normCurrYear = currentYear.replace(/(\d{4})-(\d{2,4})/, (m, p1, p2) => p2.length === 2 ? `${p1}-20${p2}` : m);
        if (normExamYear !== normCurrYear && !examYear.includes(currentYear.slice(0, 4))) {
          return false;
        }
      }

      // 2. Branch Validation: Must match active branch (unless global / 'All')
      if (effectiveBranch && effectiveBranch !== 'All' && effectiveBranch !== 'All Branches') {
        if (exam.branch && exam.branch !== 'All' && exam.branch !== 'All Branches' && exam.branch !== effectiveBranch) {
          return false;
        }
      }

      // 3. Class Validation: Must match Current Class or be configured for all classes
      const appClasses = (exam.applicableClasses || (exam as any).classes || []).map((c: any) => String(c).trim());
      const hasSpecificClass =
        matchesClassName(exam.className, fromClass) ||
        appClasses.some((c: string) => matchesClassName(c, fromClass));

      const examClassLower = (exam.className || '').trim().toLowerCase();
      const isGlobalExam =
        appClasses.length === 0 ||
        appClasses.some((c: string) => c.toLowerCase() === 'all' || c.toLowerCase() === 'all classes') ||
        examClassLower === 'all' ||
        examClassLower === '';

      // Also check if any schedules or marks exist for this exam and class
      const hasScheduleForClass = (examSchedules || []).some(
        (s: any) => String(s.examId) === String(exam.id) && matchesClassName(s.className, fromClass)
      );
      const hasMarksForClass = (examMarks || []).some(
        (m: any) => String(m.examId) === String(exam.id) && matchesClassName(m.className, fromClass)
      );
      const hasProcessedForClass = (processedResults || []).some(
        (pr: any) => String(pr.examId) === String(exam.id) && matchesClassName(pr.className, fromClass)
      );

      if (!hasSpecificClass && !isGlobalExam && !hasScheduleForClass && !hasMarksForClass && !hasProcessedForClass) {
        return false;
      }

      // 4. Status Validation: Created and scheduled examinations (Draft, Scheduled, Published, etc.) are all eligible
      if (exam.promotionEligible === false || (exam as any).isPromotionEligible === false) {
        return false;
      }

      return true;
    });
  }, [allExaminations, fromClass, currentYear, effectiveBranch, examSchedules, examMarks, processedResults]);

  const selectedExam = useMemo(() => {
    return allExaminations.find((e) => String(e.id) === String(selectedExamId));
  }, [allExaminations, selectedExamId]);
  
  // Workflow States
  const [isResultsLoaded, setIsResultsLoaded] = useState<boolean>(false);
  const [assignmentMethod, setAssignmentMethod] = useState<SectionAssignmentMethod>('Manual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [promotionRows, setPromotionRows] = useState<PromotionStudentRow[]>([]);

  const exportablePromotionData = useMemo(() => {
    if (!promotionRows || promotionRows.length === 0) return [];
    return promotionRows.map((r, idx) => ({
      "S.No": idx + 1,
      "Admission No": r.admissionNo,
      "Roll No": r.rollNo,
      "Student Name": `${r.firstName} ${r.lastName}`,
      "Campus / Branch": r.branch,
      "Current Academic Year": currentYear,
      "Target Academic Year": targetYear,
      "Current Class": r.currentClass,
      "Current Section": r.currentSection,
      "Evaluation Examination": selectedExam?.name || "Selected Examination",
      "Academic Score (%)": `${r.overallPct}%`,
      "Grade": r.grade,
      "Exam Result": r.finalResult,
      "Promotion Decision": r.promotionStatus,
      "Target Class": r.newClass,
      "Target Section": r.newSection || "Unassigned",
      "Remarks / Status Notes": r.remarks
    }));
  }, [promotionRows, currentYear, targetYear, selectedExam]);

  // Bulk Controls State
  const [bulkTargetSection, setBulkTargetSection] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<string>('');

  // Check terminal class status
  const isHighestClass = Boolean(fromClass && fromClass === highestClass);

  // Available sections for target class
  const availableTargetSections = ['Section A', 'Section B', 'Section C'];

  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);

  // Handle Load Examination Results Action
  const handleLoadResults = async () => {
    if (!currentYear) {
      addToast('warning', 'Select Academic Year', 'Please select a Current Academic Year.');
      return;
    }
    if (!targetYear) {
      addToast('warning', 'Select Target Year', 'Please select a Target Academic Year.');
      return;
    }
    if (!fromClass) {
      addToast('warning', 'Select Class', 'Please select a Current Class to load examination results.');
      return;
    }
    if (!selectedExamId) {
      addToast('warning', 'Select Examination', 'Please select an examination to load results.');
      return;
    }

    const currentExam = availableExaminations.find((e) => e.id === selectedExamId);
    if (!currentExam) {
      addToast('warning', 'Invalid Examination', 'The selected examination is not valid or available.');
      return;
    }

    setIsLoadingResults(true);

    // 1. Fetch backend promotion API and dynamic Report Cards in parallel
    const apiResultsMap = new Map<string, any>();
    const reportCardsList: any[] = [];

    try {
      const [apiRes, reportCardsRes] = await Promise.allSettled([
        loadPromotionResultsApi({
          currentYear,
          targetYear,
          currentClass: fromClass,
          branch: effectiveBranch,
          policy: assignmentMethod,
          examinationId: selectedExamId,
        }),
        fetchReportCardsApi(fromClass)
      ]);

      if (apiRes.status === 'fulfilled' && apiRes.value) {
        const val = apiRes.value;
        const list = val?.data || val?.students || (Array.isArray(val) ? val : []);
        if (Array.isArray(list)) {
          list.forEach((item: any) => {
            const key = String(item.studentId || item.id || '');
            if (key) apiResultsMap.set(key, item);
          });
        }
      }

      if (reportCardsRes.status === 'fulfilled' && reportCardsRes.value) {
        const rcVal = reportCardsRes.value;
        const rcCards = rcVal?.data || (Array.isArray(rcVal) ? rcVal : []);
        if (Array.isArray(rcCards)) {
          rcCards.forEach((c: any) => reportCardsList.push(c));
        }
      }
    } catch (err) {
      // Fallback gracefully to client data
    } finally {
      setIsLoadingResults(false);
    }

    const calculatedNextClass = isHighestClass ? fromClass : getNextClassName(fromClass);

    // Filter active students for selected class and current academic year using robust class matching
    const matchedStudents = (students || []).filter((s: any) => {
      if (s.status !== 'Active' && s.status !== 'Promoted') return false;

      const matchClass = matchesClassName(s.className, fromClass);
      if (!matchClass) return false;

      // If this student was already promoted to targetYear, do not show in pending promotion list
      const isAlreadyPromoted = s.promotionHistory?.some((h: any) =>
        (h.academicYear === targetYear || h.toAcademicYear === targetYear) &&
        (h.status === 'Promoted' || h.status === 'Completed' || h.status === 'Graduated')
      );
      if (isAlreadyPromoted) return false;

      // Academic Year Validation
      const studentYear = (s as any).academicYear || selectedAcademicYear || '';
      if (!currentYear) return true;
      {
        const matchesHistory = s.promotionHistory?.some((h: any) => h.academicYear === currentYear && matchesClassName(h.fromClass, fromClass));
        const matchesCurrent = studentYear === currentYear;
        return Boolean(matchesHistory || matchesCurrent);
      }
    });

    // Check report cards relevant to this class and examination
    const relevantReportCards = reportCardsList.filter((rc: any) => {
      const matchClass = matchesClassName(rc.className, fromClass);
      if (!matchClass) return false;
      if (rc.examId) {
        const matchesId = String(rc.examId) === String(selectedExamId);
        const matchesName = rc.examName && currentExam?.name && rc.examName.trim().toLowerCase() === currentExam.name.trim().toLowerCase();
        if (!matchesId && !matchesName) return false;
      }
      return true;
    });

    // Synthesize/merge candidate students from Report Cards if missing from in-memory students list
    const candidateStudents: Array<{
      id: string;
      admissionNo: string;
      rollNo: string;
      firstName: string;
      lastName: string;
      avatar: string;
      branch: string;
      className: string;
      section: string;
      promotionHistory?: any[];
      reportCard?: any;
    }> = matchedStudents.map((s: any) => ({
      id: String(s.id),
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      firstName: s.firstName,
      lastName: s.lastName,
      avatar: s.avatar || '',
      branch: s.branch || effectiveBranch,
      className: s.className,
      section: s.section || 'A',
      promotionHistory: s.promotionHistory
    }));

    // If report cards have students not yet in candidateStudents, add them ONLY if currently enrolled in fromClass
    relevantReportCards.forEach((rc: any, idx: number) => {
      const rcStudentId = String(rc.studentId || rc.id || '');
      const rcAdm = (rc.admissionNo || rc.admissionNumber || '').trim().toLowerCase();
      const rcName = (rc.studentName || `${rc.firstName || ''} ${rc.lastName || ''}`).trim().toLowerCase();

      // Check if student exists in all students
      const studentInDb = (students || []).find((st: any) =>
        (rcStudentId && String(st.id) === rcStudentId) ||
        (rcAdm && st.admissionNo && st.admissionNo.toLowerCase() === rcAdm) ||
        (rcName && `${st.firstName} ${st.lastName}`.trim().toLowerCase() === rcName)
      );

      // If the student already exists in DB and is no longer in fromClass (e.g. promoted to Class 7), DO NOT ADD!
      if (studentInDb && !matchesClassName(studentInDb.className, fromClass)) {
        return;
      }

      // If student already has a promotion history record to targetYear, DO NOT ADD!
      if (studentInDb?.promotionHistory?.some((h: any) =>
        (h.academicYear === targetYear || h.toAcademicYear === targetYear) &&
        (h.status === 'Promoted' || h.status === 'Completed' || h.status === 'Graduated')
      )) {
        return;
      }

      const exists = candidateStudents.some(cs => {
        if (rcStudentId && cs.id === rcStudentId) return true;
        if (rcAdm && cs.admissionNo.toLowerCase() === rcAdm) return true;
        if (rcName && `${cs.firstName} ${cs.lastName}`.trim().toLowerCase() === rcName) return true;
        return false;
      });

      if (!exists) {
        const adm = studentInDb?.admissionNo || rc.admissionNo || rc.admissionNumber || '';
        const roll = studentInDb?.rollNo || rc.rollNo || rc.rollNumber || '';
        const fullName = rc.studentName || `${rc.firstName || ''} ${rc.lastName || ''}`.trim();
        if (!studentInDb && !adm && !fullName) {
          return;
        }
        const nameParts = (fullName || 'Student').split(' ');
        const firstName = nameParts[0] || 'Student';
        const lastName = nameParts.slice(1).join(' ') || '';

        candidateStudents.push({
          id: studentInDb ? String(studentInDb.id) : (rcStudentId || ''),
          admissionNo: adm,
          rollNo: roll,
          firstName: studentInDb?.firstName || firstName,
          lastName: studentInDb?.lastName || lastName,
          avatar: studentInDb?.avatar || '',
          branch: studentInDb?.branch || rc.branch || effectiveBranch,
          className: studentInDb?.className || rc.className || fromClass,
          section: studentInDb?.section || rc.sectionName || rc.section || 'A',
          promotionHistory: studentInDb?.promotionHistory || [],
          reportCard: rc
        });
      }
    });

    // Also check if any report card has matching data for existing candidate students
    candidateStudents.forEach(cs => {
      if (!cs.reportCard) {
        const foundRc = relevantReportCards.find((rc: any) => {
          if (String(rc.studentId || '') === cs.id) return true;
          if (rc.admissionNo && rc.admissionNo.toLowerCase() === cs.admissionNo.toLowerCase()) return true;
          const rcName = (rc.studentName || `${rc.firstName || ''} ${rc.lastName || ''}`).trim().toLowerCase();
          if (rcName && `${cs.firstName} ${cs.lastName}`.trim().toLowerCase() === rcName) return true;
          return false;
        });
        if (foundRc) cs.reportCard = foundRc;
      }
    });

    if (candidateStudents.length === 0) {
      addToast('warning', 'No Students Found', `No eligible students found for ${fromClass} in Academic Year ${currentYear}.`);
      setPromotionRows([]);
      setIsResultsLoaded(true);
      return;
    }

    // Verify if this specific examination has published results
    const hasExamInProcessed = (processedResults || []).some(
      (pr: any) => (String(pr.examId) === String(selectedExamId) || (pr.examName && currentExam?.name && pr.examName.trim().toLowerCase() === currentExam.name.trim().toLowerCase())) && matchesClassName(pr.className, fromClass)
    );
    const hasExamInMarks = (examMarks || []).some(
      (m: any) => (String(m.examId) === String(selectedExamId) || (m.examName && currentExam?.name && m.examName.trim().toLowerCase() === currentExam.name.trim().toLowerCase())) && (!m.className || matchesClassName(m.className, fromClass))
    );
    const hasReportCards = relevantReportCards.length > 0;

    if (apiResultsMap.size === 0 && !hasExamInProcessed && !hasExamInMarks && !hasReportCards) {
      addToast('info', 'No Evaluation Records Found', `No published report cards or marks found yet for ${currentExam.name} in ${fromClass}. Please enter marks or publish results in the Examination module.`);
      setPromotionRows([]);
      setIsResultsLoaded(true);
      return;
    }

    // Build row objects with published exam results for the selected examination ONLY
    const rows: PromotionStudentRow[] = candidateStudents.map((s, idx) => {
      const studentIdStr = String(s.id);
      const apiItem = apiResultsMap.get(studentIdStr);
      const rcItem = s.reportCard;

      let basePct = 0;
      let finalResult: 'PASS' | 'FAIL' = 'PASS';
      let grade = 'C';
      let hasFoundResult = false;

      // 1. Check API returned item for this examination
      if (apiItem) {
        hasFoundResult = true;
        basePct = Number(apiItem.overallPct || apiItem.percentage || apiItem.totalPct || 0);
        if (apiItem.finalResult) {
          finalResult = String(apiItem.finalResult).toUpperCase().includes('FAIL') ? 'FAIL' : 'PASS';
        } else if (apiItem.passStatus) {
          finalResult = String(apiItem.passStatus).toUpperCase().includes('FAIL') ? 'FAIL' : 'PASS';
        } else {
          finalResult = basePct >= 35 ? 'PASS' : 'FAIL';
        }
        if (apiItem.grade || apiItem.finalGrade) {
          grade = apiItem.grade || apiItem.finalGrade;
        }
      }

      // 2. Check dynamic Report Cards for this student
      if (!hasFoundResult && rcItem) {
        hasFoundResult = true;
        const maxMarks = Number(rcItem.totalMaxMarks ?? rcItem.maxMarks ?? 0);
        const obtMarks = Number(rcItem.totalMarksObtained ?? rcItem.totalObtainedMarks ?? rcItem.obtainedMarks ?? 0);
        basePct = Number(rcItem.percentage ?? (maxMarks > 0 ? (obtMarks / maxMarks) * 100 : 0));
        basePct = Math.round(basePct);

        const statusStr = String(rcItem.resultStatus || rcItem.passStatus || '').toLowerCase();
        if (statusStr.includes('fail') || basePct < 35) {
          finalResult = 'FAIL';
        } else {
          finalResult = 'PASS';
        }

        grade = rcItem.grade || rcItem.finalGrade || rcItem.overallGrade || grade;
      }

      // 3. Check DataContext processedResults for THIS SELECTED EXAMINATION ONLY
      if (!hasFoundResult) {
        const stProcessed = (processedResults || []).filter((pr: any) =>
          (String(pr.examId) === String(selectedExamId) || (pr.examName && currentExam?.name && pr.examName.trim().toLowerCase() === currentExam.name.trim().toLowerCase())) &&
          String(pr.studentId) === studentIdStr &&
          (!pr.className || matchesClassName(pr.className, fromClass))
        );
        if (stProcessed.length > 0) {
          hasFoundResult = true;
          const latestPr = stProcessed[stProcessed.length - 1];
          basePct = Math.round(latestPr.percentage ?? (latestPr.totalMaxMarks > 0 ? (latestPr.totalObtainedMarks / latestPr.totalMaxMarks) * 100 : 0));
          finalResult = (latestPr.passStatus === 'Fail' || basePct < 35) ? 'FAIL' : 'PASS';
          grade = latestPr.finalGrade || latestPr.overallGrade || grade;
        }
      }

      // 4. Check DataContext examMarks for THIS SELECTED EXAMINATION ONLY
      if (!hasFoundResult) {
        const stMarks = (examMarks || []).filter((m: any) =>
          (String(m.examId) === String(selectedExamId) || (m.examName && currentExam?.name && m.examName.trim().toLowerCase() === currentExam.name.trim().toLowerCase())) &&
          String(m.studentId) === studentIdStr &&
          (!m.className || matchesClassName(m.className, fromClass))
        );
        if (stMarks.length > 0) {
          hasFoundResult = true;
          const totalObtained = stMarks.reduce((sum: number, m: any) => sum + (Number(m.marksObtained) || 0), 0);
          const totalMax = stMarks.reduce((sum: number, m: any) => sum + (Number(m.totalMarks || m.maxMarks) || 100), 0);
          basePct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
          const hasFailedSub = stMarks.some((m: any) => m.isAbsent || (m.marksObtained || 0) < (m.passMarks || 35));
          finalResult = (hasFailedSub || basePct < 35) ? 'FAIL' : 'PASS';
        }
      }

      // 5. If no exam records exist for this student under the selected examination, mark as unrecorded/fail
      if (!hasFoundResult) {
        basePct = 0;
        finalResult = 'FAIL';
        grade = 'F';
      } else if (!grade || grade === 'C') {
        if (basePct >= 90) grade = 'A1';
        else if (basePct >= 80) grade = 'A2';
        else if (basePct >= 70) grade = 'B1';
        else if (basePct >= 60) grade = 'B2';
        else if (basePct >= 50) grade = 'C1';
        else if (basePct >= 35) grade = 'C2';
        else grade = 'F';
      }

      const isPass = finalResult === 'PASS';
      const defaultStatus: 'Promote' | 'Retain' = isPass ? 'Promote' : 'Retain';

      // Check if already promoted to target year
      const alreadyPromoted = s.promotionHistory?.some(h => h.academicYear === targetYear);

      return {
        id: s.id,
        admissionNo: s.admissionNo,
        rollNo: s.rollNo || `R-${101 + idx}`,
        firstName: s.firstName,
        lastName: s.lastName,
        avatar: s.avatar || '',
        branch: s.branch || effectiveBranch,
        currentClass: s.className,
        currentSection: s.section || 'A',
        overallPct: basePct,
        grade,
        finalResult,
        promotionStatus: defaultStatus,
        newClass: defaultStatus === 'Promote' ? calculatedNextClass : s.className,
        newSection: 'Section A', // Default placeholder, will be processed by policy
        remarks: hasFoundResult
          ? (isPass ? `Cleared ${currentExam.name}` : `Retained - ${currentExam.name} Criteria Not Met`)
          : `No published marks for ${currentExam.name}`,
        isAlreadyPromoted: alreadyPromoted
      };
    });

    // Apply initial Section Assignment Policy
    const processedRows = applySectionPolicy(rows, assignmentMethod, availableTargetSections);
    setPromotionRows(processedRows);
    setSelectedStudentIds([]);
    setIsResultsLoaded(true);
    addToast('success', 'Results Loaded', `Loaded published results for ${currentExam.name} (${processedRows.length} student(s)).`);
  };

  // Section Policy Processor
  const applySectionPolicy = (
    rows: PromotionStudentRow[], 
    method: SectionAssignmentMethod, 
    sections: string[]
  ): PromotionStudentRow[] => {
    if (rows.length === 0) return rows;

    if (method === 'Manual') {
      // Manual Mode: Destination sections default to unassigned ('') until explicitly assigned
      return rows.map(r => ({
        ...r,
        newSection: '',
        remarks: 'Pending section assignment'
      }));
    }

    if (method === 'Merit') {
      // Merit Based Policy: Top percentage rankers fill Section A first (up to capacity 40).
      // Once Section A capacity is full, spill over to Section B, then Section C.
      const MAX_SECTION_CAPACITY = 40;
      
      const sortedIndices = rows
        .map((r, idx) => ({ id: r.id, pct: r.overallPct, idx }))
        .sort((a, b) => b.pct - a.pct);

      const sectionMap = new Map<string, { sec: string; rank: number }>();
      let countA = 0;
      let countB = 0;

      sortedIndices.forEach((item, rankIdx) => {
        let assignedSec = 'Section C';
        if (countA < MAX_SECTION_CAPACITY) {
          assignedSec = 'Section A';
          countA++;
        } else if (countB < MAX_SECTION_CAPACITY) {
          assignedSec = 'Section B';
          countB++;
        } else {
          assignedSec = 'Section C';
        }
        sectionMap.set(item.id, { sec: assignedSec, rank: rankIdx + 1 });
      });

      return rows.map(r => {
        const info = sectionMap.get(r.id);
        const assignedSec = info ? info.sec : 'Section A';
        const rank = info ? info.rank : 1;
        return {
          ...r,
          newSection: assignedSec,
          remarks: `Merit assigned (${r.overallPct}% - Rank #${rank})`
        };
      });
    }

    if (method === 'Balanced') {
      // Round-robin distribution across available sections for balanced strength
      return rows.map((r, idx) => {
        const secIndex = idx % sections.length;
        return {
          ...r,
          newSection: sections[secIndex],
          remarks: `Balanced distribution (${sections[secIndex]})`
        };
      });
    }

    return rows;
  };

  // Helper: Get student assignment status
  const getAssignmentStatus = (r: PromotionStudentRow) => {
    if (!r.newSection || r.newSection === '' || r.newSection === 'Pending') {
      return 'Pending';
    }
    if (r.promotionStatus === 'Promote') return 'Promoted';
    if (r.promotionStatus === 'Retain') return 'Retained';
    return 'Assigned';
  };

  // Re-apply Policy Button Handler
  const handlePolicyChange = (newMethod: SectionAssignmentMethod) => {
    setAssignmentMethod(newMethod);
    if (promotionRows.length > 0) {
      const updated = applySectionPolicy(promotionRows, newMethod, availableTargetSections);
      setPromotionRows(updated);
      addToast('info', 'Section Policy Applied', `Switched section assignment policy to ${newMethod} Assignment.`);
    }
  };

  const handleReapplyPolicy = () => {
    if (promotionRows.length === 0) {
      addToast('warning', 'No Records Loaded', 'Please select an Examination and click "Load Results" first.');
      return;
    }

    const targetIds = selectedStudentIds.length > 0 ? selectedStudentIds : promotionRows.map(r => r.id);

    if (assignmentMethod === 'Merit') {
      const MAX_SECTION_CAPACITY = 40;
      const targetRows = promotionRows.filter(r => targetIds.includes(r.id));
      const sortedIndices = [...targetRows].sort((a, b) => b.overallPct - a.overallPct);

      const sectionMap = new Map<string, { sec: string; rank: number }>();
      let countA = 0;
      let countB = 0;

      sortedIndices.forEach((item, rankIdx) => {
        let assignedSec = 'Section C';
        if (countA < MAX_SECTION_CAPACITY) {
          assignedSec = 'Section A';
          countA++;
        } else if (countB < MAX_SECTION_CAPACITY) {
          assignedSec = 'Section B';
          countB++;
        } else {
          assignedSec = 'Section C';
        }
        sectionMap.set(item.id, { sec: assignedSec, rank: rankIdx + 1 });
      });

      const updatedRows = promotionRows.map(r => {
        if (!targetIds.includes(r.id)) return r;
        const info = sectionMap.get(r.id);
        const assignedSec = info ? info.sec : 'Section A';
        const rank = info ? info.rank : 1;
        return {
          ...r,
          newSection: assignedSec,
          remarks: `Merit policy applied (${r.overallPct}% - Rank #${rank})`
        };
      });

      setPromotionRows(updatedRows);
      addToast('success', 'Merit Policy Re-applied', `Assigned ${targetIds.length} student(s) filling Section A first based on merit rank.`);
      return;
    }

    if (assignmentMethod === 'Balanced') {
      const updatedRows = promotionRows.map((r, idx) => {
        if (!targetIds.includes(r.id)) return r;
        const secIndex = idx % availableTargetSections.length;
        const sec = availableTargetSections[secIndex];
        return {
          ...r,
          newSection: sec,
          remarks: `Balanced policy applied (${sec})`
        };
      });
      setPromotionRows(updatedRows);
      addToast('success', 'Balanced Policy Re-applied', `Balanced ${targetIds.length} student(s) across sections.`);
      return;
    }

    // Manual Policy
    const updatedRows = promotionRows.map(r => {
      if (!targetIds.includes(r.id)) return r;
      const sec = bulkTargetSection || 'Section A';
      return {
        ...r,
        newSection: sec,
        remarks: `Manual policy applied (${sec})`
      };
    });
    setPromotionRows(updatedRows);
    addToast('success', 'Manual Policy Re-applied', `Assigned ${targetIds.length} student(s) to ${bulkTargetSection}.`);
  };

  const handleResetPolicySuggestions = () => {
    if (promotionRows.length === 0) return;
    const resetRows = applySectionPolicy(promotionRows, assignmentMethod, availableTargetSections);
    setPromotionRows(resetRows);
    addToast('success', 'Suggestions Reset', `Reset all student section assignments back to pure ${assignmentMethod} rules.`);
  };

  // Row update handlers
  const handleRowStatusChange = (studentId: string, newStatus: 'Promote' | 'Retain') => {
    const calculatedNextClass = isHighestClass ? fromClass : getNextClassName(fromClass);
    setPromotionRows(prev => prev.map(r => {
      if (r.id === studentId) {
        return {
          ...r,
          promotionStatus: newStatus,
          newClass: newStatus === 'Promote' ? calculatedNextClass : r.currentClass,
          remarks: newStatus === 'Promote' ? 'Promoted (Admin Override)' : 'Retained (Admin Override)'
        };
      }
      return r;
    }));
  };

  const handleRowSectionChange = (studentId: string, newSection: string) => {
    setPromotionRows(prev => prev.map(r => {
      if (r.id === studentId) {
        return {
          ...r,
          newSection,
          remarks: newSection ? `Assigned to ${newSection}` : 'Pending section assignment'
        };
      }
      return r;
    }));
  };

  const handleRowRemarksChange = (studentId: string, remarks: string) => {
    setPromotionRows(prev => prev.map(r => r.id === studentId ? { ...r, remarks } : r));
  };

  // Filtered rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return promotionRows;
    const q = searchQuery.toLowerCase();
    return promotionRows.filter(r => 
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
      r.admissionNo.toLowerCase().includes(q) ||
      r.rollNo.toLowerCase().includes(q) ||
      (r.currentSection && r.currentSection.toLowerCase().includes(q)) ||
      (r.newSection && r.newSection.toLowerCase().includes(q)) ||
      (r.finalResult && r.finalResult.toLowerCase().includes(q)) ||
      (r.promotionStatus && r.promotionStatus.toLowerCase().includes(q)) ||
      (r.grade && r.grade.toLowerCase().includes(q))
    );
  }, [promotionRows, searchQuery]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, assignmentMethod, fromClass, currentYear]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const paginatedRows = useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Checkbox Selection (matching Employee Payroll checkbox functionality)
  const allFilteredStudentIds = useMemo(() => filteredRows.map(r => r.id), [filteredRows]);
  const isAllSelected = allFilteredStudentIds.length > 0 && allFilteredStudentIds.every(id => selectedStudentIds.includes(id));
  const isSomeSelected = selectedStudentIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isSomeSelected || isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(allFilteredStudentIds);
      if (bulkTargetSection || bulkStatus) {
        const calculatedNextClass = isHighestClass ? fromClass : getNextClassName(fromClass);
        setPromotionRows(prev => prev.map(r => {
          if (!allFilteredStudentIds.includes(r.id)) return r;
          const nextSec = bulkTargetSection ? bulkTargetSection : r.newSection;
          const nextStat = (bulkStatus as 'Promote' | 'Retain') || r.promotionStatus;
          return {
            ...r,
            newSection: nextSec,
            promotionStatus: nextStat,
            newClass: nextStat === 'Promote' ? calculatedNextClass : r.currentClass,
            remarks: bulkTargetSection
              ? `Assigned to ${bulkTargetSection}`
              : bulkStatus
              ? `Bulk updated to ${bulkStatus}`
              : r.remarks
          };
        }));
      }
    }
  };

  const handleToggleSelectStudent = (id: string, checked?: boolean) => {
    const isSelecting = typeof checked === 'boolean' ? checked : !selectedStudentIds.includes(id);
    setSelectedStudentIds(prev => 
      isSelecting ? [...prev.filter(item => item !== id), id] : prev.filter(item => item !== id)
    );
    if (isSelecting && (bulkTargetSection || bulkStatus)) {
      const calculatedNextClass = isHighestClass ? fromClass : getNextClassName(fromClass);
      setPromotionRows(prev => prev.map(r => {
        if (r.id !== id) return r;
        const nextSec = bulkTargetSection ? bulkTargetSection : r.newSection;
        const nextStat = (bulkStatus as 'Promote' | 'Retain') || r.promotionStatus;
        return {
          ...r,
          newSection: nextSec,
          promotionStatus: nextStat,
          newClass: nextStat === 'Promote' ? calculatedNextClass : r.currentClass,
          remarks: bulkTargetSection
            ? `Assigned to ${bulkTargetSection}`
            : bulkStatus
            ? `Bulk updated to ${bulkStatus}`
            : r.remarks
        };
      }));
    }
  };

  // Bulk Actions
  const handleApplyBulkSection = (selectedSec?: string) => {
    const targetSec = selectedSec || bulkTargetSection;
    if (!targetSec) return;
    
    // Retain and display the selected section in the dropdown
    setBulkTargetSection(targetSec);

    if (selectedStudentIds.length === 0) {
      addToast('info', 'Section Selected', `Selected ${targetSec}. Select students from the list to assign.`);
      return;
    }
    setPromotionRows(prev => prev.map(r => {
      if (selectedStudentIds.includes(r.id)) {
        return { ...r, newSection: targetSec, remarks: `Assigned to ${targetSec}` };
      }
      return r;
    }));
    addToast('success', 'Bulk Section Applied', `Assigned ${selectedStudentIds.length} student(s) to ${targetSec}.`);
  };

  const handleApplyBulkStatus = (selectedStat?: 'Promote' | 'Retain' | '') => {
    const targetStatus = (selectedStat || bulkStatus) as 'Promote' | 'Retain';
    if (!targetStatus) return;

    // Retain and display the selected status in the dropdown
    setBulkStatus(targetStatus);

    if (selectedStudentIds.length === 0) {
      addToast('info', 'Status Selected', `Selected ${targetStatus}. Select students from the list to assign.`);
      return;
    }
    const calculatedNextClass = isHighestClass ? fromClass : getNextClassName(fromClass);
    setPromotionRows(prev => prev.map(r => {
      if (selectedStudentIds.includes(r.id)) {
        return {
          ...r,
          promotionStatus: targetStatus,
          newClass: targetStatus === 'Promote' ? calculatedNextClass : r.currentClass,
          remarks: `Bulk updated to ${targetStatus}`
        };
      }
      return r;
    }));
    addToast('success', 'Bulk Status Applied', `Marked ${selectedStudentIds.length} student(s) as ${targetStatus}.`);
  };

  // Real-time Summary Counters
  const summary = useMemo(() => {
    const total = promotionRows.length;
    const passed = promotionRows.filter(r => r.finalResult === 'PASS').length;
    const failed = promotionRows.filter(r => r.finalResult === 'FAIL').length;

    const pending = promotionRows.filter(r => !r.newSection || r.newSection === '' || r.newSection === 'Pending').length;
    const promoted = promotionRows.filter(r => r.promotionStatus === 'Promote' && r.newSection !== '' && r.newSection !== 'Pending').length;
    const retained = promotionRows.filter(r => r.promotionStatus === 'Retain' && r.newSection !== '' && r.newSection !== 'Pending').length;

    const secA = promotionRows.filter(r => r.newSection === 'Section A' || r.newSection === 'A').length;
    const secB = promotionRows.filter(r => r.newSection === 'Section B' || r.newSection === 'B').length;
    const secC = promotionRows.filter(r => r.newSection === 'Section C' || r.newSection === 'C').length;

    const processed = total - pending;
    const progressPct = total > 0 ? Math.round((processed / total) * 100) : 0;

    return { total, passed, failed, promoted, retained, pending, secA, secB, secC, processed, progressPct };
  }, [promotionRows]);

  // Check Target Academic Year Fee Structure Availability
  const targetFeeStructureWarning = useMemo(() => {
    if (!isResultsLoaded || promotionRows.length === 0) return null;
    const sampleTargetClass = promotionRows[0]?.newClass;
    if (!sampleTargetClass) return null;

    const targetYearKey = parseAcademicYearRange(targetYear).key;
    const matchesTargetYear = (ay?: string) => {
      if (!ay || !String(ay).trim()) return true;
      return parseAcademicYearRange(String(ay)).key === targetYearKey;
    };

    const allConfiguredFeeStructures = [
      ...(Array.isArray(feeStructures) ? feeStructures : []),
      ...(Array.isArray(dynamicFeeStructures) ? dynamicFeeStructures : []),
      ...(Array.isArray(allDynamicFeeStructures) ? allDynamicFeeStructures : []),
      ...(Array.isArray(feeSchedules) ? feeSchedules : []),
    ];

    const hasFeeStructure =
      allConfiguredFeeStructures.some((f: any) => {
        if (!f || f.category === 'Hostel') return false;
        const fClass = String(f.className || f.class || '').trim();
        if (!fClass) return false;
        const classMatches =
          matchesClassName(fClass, sampleTargetClass) ||
          fClass.toLowerCase() === sampleTargetClass.toLowerCase();
        return classMatches && matchesTargetYear(f.academicYear);
      }) ||
      (Array.isArray(studentFeeAssignments) &&
        studentFeeAssignments.some((a: any) => {
          const aClass = String(a?.className || '').trim();
          return (
            aClass &&
            matchesClassName(aClass, sampleTargetClass) &&
            matchesTargetYear(a?.academicYear) &&
            (Number(a?.baseFeeTotal || a?.originalFeeTotal || 0) > 0 ||
              (Array.isArray(a?.assignedFeeHeads) && a.assignedFeeHeads.length > 0))
          );
        }));

    if (!hasFeeStructure) {
      return `Notice: Fee structure configuration for ${sampleTargetClass} (${targetYear}) is not yet published. Students will be promoted, and default fee profiles will be auto-assigned once finalized.`;
    }
    return null;
  }, [
    isResultsLoaded,
    promotionRows,
    feeStructures,
    dynamicFeeStructures,
    allDynamicFeeStructures,
    feeSchedules,
    studentFeeAssignments,
    targetYear,
    parseAcademicYearRange,
  ]);

  // Complete Promotion Action Handler
  const handleCompletePromotion = async () => {
    if (promotionRows.length === 0) {
      addToast('warning', 'No Records', 'No student records available for promotion.');
      return;
    }

    if (!targetYear) {
      addToast('error', 'Missing Target Year', 'Target Academic Year must be selected before completing promotion.');
      return;
    }

    // Filter rows that have an assigned section
    const rowsToProcess = promotionRows.filter(r => r.newSection && r.newSection !== '' && r.newSection !== 'Pending');

    if (rowsToProcess.length === 0) {
      addToast('warning', 'No Students Assigned', 'Please assign a destination section to at least one student before clicking Promote.');
      return;
    }

    setIsPromoting(true);
    let promotedCount = 0;
    let retainedCount = 0;
    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Fetch dropdowns to obtain exact database foreign keys
      const [classesRes, yearsRes] = await Promise.allSettled([
        fetchStudentClassesDropdownApi(),
        fetchStudentAcademicYearsDropdownApi(),
      ]);

      const classesDropdown: Array<{ id: number; name: string }> =
        classesRes.status === 'fulfilled'
          ? (Array.isArray(classesRes.value) ? classesRes.value : (classesRes.value as any)?.data || [])
          : [];

      const yearsDropdown: Array<{ id: number; name: string }> =
        yearsRes.status === 'fulfilled'
          ? (Array.isArray(yearsRes.value) ? yearsRes.value : (yearsRes.value as any)?.data || [])
          : [];

      // Cache sections for target classes
      const sectionsCache = new Map<number, Array<{ id: number; name: string }>>();
      const getSectionsForClass = async (cId: number): Promise<Array<{ id: number; name: string }>> => {
        if (sectionsCache.has(cId)) return sectionsCache.get(cId)!;
        try {
          const res: any = await fetchStudentSectionsDropdownApi(cId);
          const list = Array.isArray(res) ? res : res?.data || [];
          sectionsCache.set(cId, list);
          return list;
        } catch {
          return [];
        }
      };

      // Match target academic year ID dynamically without hardcoding
      const targetYearClean = (targetYear || '').replace(/\s+/g, '').toLowerCase();
      const targetYearKey = parseAcademicYearRange(targetYear).key;
      const matchedYearObj = (yearsDropdown || []).find((y: any) => {
        const raw = y.name || y.academicYear || y.year || '';
        return parseAcademicYearRange(raw).key === targetYearKey ||
          raw.replace(/\s+/g, '').toLowerCase() === targetYearClean;
      }) || (academicYears || []).find((y: any) => {
        const raw = y.year || y.academicYear || y.name || '';
        return parseAcademicYearRange(raw).key === targetYearKey ||
          raw.replace(/\s+/g, '').toLowerCase() === targetYearClean;
      });
      const targetYearId = matchedYearObj
        ? Number(matchedYearObj.id || (matchedYearObj as any).academicYearId)
        : (yearsDropdown.length > 0 ? Number(yearsDropdown[0].id) : (academicYears.length > 0 ? Number(academicYears[0].id) : undefined));

      // 2. Call batch promotion API for audit log & promotion history
      await executePromotionApi({
        currentAcademicYear: currentYear,
        targetAcademicYear: targetYear,
        currentClass: fromClass,
        branch: branch || effectiveBranch || selectedBranch || '',
        policy: assignmentMethod,
        promotions: rowsToProcess.map(r => ({
          studentId: Number(r.id) || 0,
          id: r.id,
          admissionNo: r.admissionNo || '',
          rollNo: r.rollNo || '',
          currentClass: r.currentClass,
          currentSection: r.currentSection,
          promotionStatus: r.promotionStatus,
          newClass: r.newClass,
          newSection: r.newSection,
          overallPct: r.overallPct,
          grade: r.grade,
          finalResult: r.finalResult,
          remarks: r.remarks
        }))
      }).catch(err => {
        console.warn('executePromotionApi audit log notice:', err);
      });

      // 3. Directly update each student record in the database via updateStudentApi
      for (const row of rowsToProcess) {
        const isPromote = row.promotionStatus === 'Promote';
        const cleanSection = (row.newSection || '').replace(/^Section\s*/i, '').trim();
        const destClassName = isPromote ? row.newClass : row.currentClass;

        // Resolve class ID from classesDropdown
        const matchedClassObj = classesDropdown.find((c: any) =>
          matchesClassName(c.name, destClassName) ||
          c.name.trim().toLowerCase() === destClassName.trim().toLowerCase()
        );
        const resolvedClassId = matchedClassObj ? Number(matchedClassObj.id) : undefined;

        let resolvedSectionId: number | undefined = undefined;
        if (resolvedClassId) {
          const secs = await getSectionsForClass(resolvedClassId);
          const matchedSec = secs.find((s: any) =>
            (s.name || '').trim().toLowerCase() === cleanSection.toLowerCase()
          );
          if (matchedSec) {
            resolvedSectionId = Number(matchedSec.id);
          } else if (secs.length > 0) {
            resolvedSectionId = Number(secs[0].id);
          }
        }

        const existingStudent = (students || []).find((s: any) => String(s.id) === String(row.id));
        const numericId = parseInt(row.id, 10);

        // Dynamically resolve branch ID without hardcoding
        const studentBranchName = (existingStudent?.branch || row.branch || effectiveBranch || selectedBranch || branch || '').trim().toLowerCase();
        const matchedBranchObj = (branches || []).find((b: any) =>
          (b.name || b.branchName || '').trim().toLowerCase() === studentBranchName
        );
        const resolvedBranchId = Number((existingStudent as any)?.branchId)
          || (matchedBranchObj ? Number(matchedBranchObj.id || matchedBranchObj.branchId) : undefined)
          || (branches.length > 0 ? Number(branches[0].id || branches[0].branchId) : 1);

        if (!isNaN(numericId) && existingStudent && resolvedClassId && resolvedSectionId) {
          try {
            await updateStudentApi(numericId, {
              admissionNumber: existingStudent.admissionNo || row.admissionNo || "",
              rollNumber: row.rollNo || existingStudent.rollNo || "",
              studentName: `${existingStudent.firstName || row.firstName || ""} ${existingStudent.lastName || row.lastName || ""}`.trim(),
              dateOfBirth: existingStudent.dob || undefined,
              gender: existingStudent.gender || undefined,
              fatherName: existingStudent.fatherName || existingStudent.parentName || "",
              fatherMobile: existingStudent.fatherPhone || existingStudent.parentPhone || existingStudent.phone || "",
              motherName: existingStudent.motherName || "",
              motherMobile: existingStudent.motherPhone || "",
              email: existingStudent.email || undefined,
              mobileNumber: existingStudent.phone || existingStudent.fatherPhone || "",
              address: existingStudent.address || "",
              branchId: resolvedBranchId,
              academicYearId: targetYearId || (existingStudent as any).academicYearId,
              classId: resolvedClassId,
              sectionId: resolvedSectionId,
              status: isHighestClass && isPromote ? "Completed" : "Active"
            });
          } catch (updateErr) {
            console.error(`Failed to update student ID ${numericId}:`, updateErr);
          }
        }

        // Add history records & update local state
        const historyItem: PromotionHistoryItem = {
          id: 'PROM-' + Math.floor(100000 + Math.random() * 900000),
          academicYear: targetYear,
          fromClass: row.currentClass,
          toClass: row.newClass,
          fromSection: row.currentSection,
          toSection: cleanSection,
          fromBranch: row.branch,
          toBranch: row.branch,
          date: today,
          rollNo: row.rollNo,
          overallPct: row.overallPct,
          grade: row.grade,
          finalResult: row.finalResult,
          status: isPromote ? (isHighestClass ? 'Graduated' : 'Promoted') : 'Retained',
          remarks: row.remarks
        };

        const updatedHistory = [...(existingStudent?.promotionHistory || []), historyItem];

        addAcademicHistoryRecord(row.id, {
          id: `ACH-${row.id}-${currentYear}`,
          studentId: row.id,
          admissionNo: row.admissionNo,
          academicYear: currentYear,
          className: row.currentClass,
          section: row.currentSection,
          rollNo: row.rollNo,
          branch: row.branch,
          status: isPromote ? (isHighestClass ? 'Graduated' : 'Promoted') : 'Retained',
          promotionStatus: isPromote ? 'Promoted' : 'Retained',
          remarks: row.remarks,
          createdAt: today,
        });

        if (!isHighestClass || !isPromote) {
          addAcademicHistoryRecord(row.id, {
            id: `ACH-${row.id}-${targetYear}`,
            studentId: row.id,
            admissionNo: row.admissionNo,
            academicYear: targetYear,
            className: row.newClass,
            section: cleanSection,
            rollNo: row.rollNo,
            branch: row.branch,
            status: 'Active',
            promotionStatus: isPromote ? 'Enrolled' : 'Retained Enrollment',
            remarks: `Enrolled for ${targetYear}`,
            createdAt: today,
          });
        }

        updateStudent(row.id, {
          className: row.newClass,
          section: cleanSection,
          academicYear: targetYear,
          status: isHighestClass && isPromote ? 'Completed' : 'Active',
          promotionHistory: updatedHistory,
          remarks: row.remarks
        });

        if (isPromote) promotedCount++;
        else retainedCount++;
      }

      // 4. Freshly synchronize student records from backend
      if (fetchStudents) {
        await fetchStudents();
      }

      const remainingRows = promotionRows.filter(r => !rowsToProcess.some(p => p.id === r.id));

      logActivity('Batch Student Promotion', `Executed promotion for ${fromClass} (${branch}) to ${targetYear}. Promoted: ${promotedCount}, Retained: ${retainedCount}`);

      if (remainingRows.length > 0) {
        addToast('success', 'Promotion Processed', `Promoted ${promotedCount} student(s) to ${targetYear}. ${remainingRows.length} student(s) remain in list for lateral promotion.`);
        setPromotionRows(remainingRows);
      } else {
        addToast('success', 'Promotion Completed', `All ${promotedCount + retainedCount} student(s) promoted for Academic Year ${targetYear}.`);
        setPromotionRows([]);
        setIsResultsLoaded(false);
      }

      setSelectedStudentIds([]);
      setBulkTargetSection('');
      setBulkStatus('');
    } catch (err: any) {
      console.error('Promotion execution failed:', err);
      addToast('error', 'Promotion Failed', err?.message || 'Failed to persist student promotion.');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="glass-card py-4 px-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0" /> Student Promotion
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Policy Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2.5">Policy:</span>
            {(['Manual', 'Merit', 'Balanced'] as SectionAssignmentMethod[]).map(method => (
              <button
                key={method}
                onClick={() => handlePolicyChange(method)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  assignmentMethod === method
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {method === 'Manual' ? 'Manual' : method === 'Merit' ? 'Merit Based' : 'Balanced'}
              </button>
            ))}
          </div>

          <ExportButton
            data={exportablePromotionData}
            filename={`student_promotion_${fromClass || 'list'}`}
            emptyMessage="No student promotion records available to export. Please select a Current Class and Examination, then click 'Load Results' first."
          />
        </div>
      </div>

      {/* Step 1 Filter Bar */}
      <div className="glass-card p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Current Academic Year */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Current Academic Year</label>
            <div className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white select-none">
              {currentActiveAcademicYear ? `${formatAcademicYear(currentActiveAcademicYear)} (Current)` : '—'}
            </div>
          </div>

          {/* Target Academic Year */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Academic Year</label>
            <select
              value={targetYear}
              onChange={e => {
                setTargetYear(e.target.value);
                setIsResultsLoaded(false);
                setBulkTargetSection('');
                setBulkStatus('');
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              {targetAcademicYearOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Current Class */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Current Class <span className="text-rose-500 font-bold ml-0.5">*</span></label>
            <select
              value={fromClass}
              onChange={e => {
                setFromClass(e.target.value);
                setSelectedExamId('');
                setPromotionRows([]);
                setIsResultsLoaded(false);
                setSelectedStudentIds([]);
                setBulkTargetSection('');
                setBulkStatus('');
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="">Select Class</option>
              {(academicClasses || []).map((c: any) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.name === highestClass ? '(Terminal Class)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Examination / Result Type */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              Examination <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <select
              value={selectedExamId}
              disabled={!fromClass || (availableExaminations.length === 0 && !isLoadingExams)}
              onChange={e => {
                setSelectedExamId(e.target.value);
                setPromotionRows([]);
                setIsResultsLoaded(false);
                setSelectedStudentIds([]);
                setBulkTargetSection('');
                setBulkStatus('');
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingExams
                  ? 'Loading examinations...'
                  : !fromClass
                  ? 'Select Class first'
                  : availableExaminations.length === 0
                  ? 'No examinations available'
                  : 'Select Examination'}
              </option>
              {availableExaminations.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.name || (exam as any).examName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <div className="flex items-end">
            <button
              onClick={handleLoadResults}
              disabled={isLoadingResults || !fromClass || !selectedExamId}
              className="w-full py-2.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingResults ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading Results...
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" /> Load Results
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fee Warning Banner */}
      {targetFeeStructureWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="font-semibold leading-relaxed">{targetFeeStructureWarning}</p>
        </div>
      )}

      {/* EMPTY STATE BEFORE LOADING RESULTS */}
      {!isResultsLoaded ? (
        <div className="glass-card py-16 px-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center mx-auto border border-brand-200 dark:border-brand-800 shadow-sm">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Load Published Examination Results</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Select Current Academic Year, Current Class, and the Examination to evaluate, then click <strong className="text-slate-800 dark:text-slate-200">"Load Results"</strong> to fetch students eligible for promotion.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* DYNAMIC RESULT EVALUATION BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-sky-700 dark:text-sky-300">Published Result:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{selectedExam?.name || 'Selected Examination'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Academic Year: <strong className="text-slate-700 dark:text-slate-300">{currentYear}</strong> &bull; Class: <strong className="text-slate-700 dark:text-slate-300">{fromClass.replace(/^class\s+/i, '')}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 self-start sm:self-auto font-mono text-xs font-bold text-sky-800 dark:text-sky-200">
              <span>Students Found:</span>
              <span className="font-extrabold text-sm text-sky-600 dark:text-sky-400">{promotionRows.length}</span>
            </div>
          </div>
          {/* DYNAMIC PROMOTION SUMMARY CARDS */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-slate-500 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-tight whitespace-nowrap truncate block" title="Total Students">Total Students</span>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-none mt-2 block">{summary.total}</span>
            </div>

            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-tight whitespace-nowrap truncate block" title="Passed">Passed</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none mt-2 block">{summary.passed}</span>
            </div>

            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-rose-500 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-tight whitespace-nowrap truncate block" title="Failed">Failed</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 leading-none mt-2 block">{summary.failed}</span>
            </div>

            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-brand-500 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-tight whitespace-nowrap truncate block" title="Promoted">Promoted</span>
              <span className="text-lg font-black text-brand-600 dark:text-brand-400 leading-none mt-2 block">{summary.promoted}</span>
            </div>

            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-tight whitespace-nowrap truncate block" title="Retained">Retained</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none mt-2 block">{summary.retained}</span>
            </div>

            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-amber-600 bg-amber-50/50 dark:bg-amber-950/30 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 leading-tight whitespace-nowrap truncate block" title="Pending">Pending</span>
              <span className="text-lg font-black text-amber-800 dark:text-amber-200 leading-none mt-2 block">{summary.pending}</span>
            </div>

            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-sky-500 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-tight whitespace-nowrap truncate block" title="Section A">Section A</span>
              <span className="text-lg font-black text-sky-600 dark:text-sky-400 leading-none mt-2 block">{summary.secA}</span>
            </div>

            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-indigo-500 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-tight whitespace-nowrap truncate block" title="Section B">Section B</span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none mt-2 block">{summary.secB}</span>
            </div>

            <div className="glass-card min-w-0 p-3 rounded-2xl border-l-4 border-l-purple-500 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[74px]">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-tight whitespace-nowrap truncate block" title="Section C">Section C</span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400 leading-none mt-2 block">{summary.secC}</span>
            </div>
          </div>

          {/* PROMOTION PROGRESS & PENDING WARNING BANNER */}
          <div className="space-y-3">
            <div className="glass-card p-3 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">Promotion Progress:</span>
                <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
                  {summary.processed} / {summary.total} Students Processed ({summary.progressPct}%)
                </span>
              </div>
              <div className="w-full sm:w-48 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div 
                  className="h-full rounded-full bg-brand-600 dark:bg-brand-400 transition-all duration-300" 
                  style={{ width: `${summary.progressPct}%` }}
                />
              </div>
            </div>

            {assignmentMethod === 'Manual' && summary.pending > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 font-semibold">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <span><strong>{summary.pending} student(s)</strong> are currently pending section assignment. Assigned students will be promoted when you click Promote; remaining students stay in the list for lateral promotion.</span>
                </div>
              </div>
            )}
          </div>

          {/* BULK ACTIONS & PROMOTION TOOLBAR */}
          <div className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-xs">
            {/* Search Input */}
            <div className="relative w-full xl:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search student name, roll no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Policy-Specific Action Toolbar Controls */}
            <div className="flex flex-wrap items-center justify-start xl:justify-end gap-2.5 w-full xl:w-auto">
              <span className="text-[11px] font-extrabold text-slate-400 shrink-0 mr-0.5">Selected ({selectedStudentIds.length}):</span>
              
              {/* POLICY 1: MANUAL ASSIGNMENT CONTROLS */}
              {assignmentMethod === 'Manual' && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={bulkTargetSection}
                    onChange={e => {
                      const sec = e.target.value;
                      setBulkTargetSection(sec);
                      if (sec) handleApplyBulkSection(sec);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer shadow-xs transition-colors ${
                      bulkTargetSection
                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-extrabold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                    }`}
                  >
                    <option value="">Select Section</option>
                    {availableTargetSections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* POLICY 2: MERIT BASED CONTROLS */}
              {assignmentMethod === 'Merit' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleReapplyPolicy}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Award className="w-3.5 h-3.5" /> Apply Merit Policy
                  </button>
                  <button
                    onClick={handleResetPolicySuggestions}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap border border-purple-200/60 dark:border-purple-900/60"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset Suggestions
                  </button>
                </div>
              )}

              {/* POLICY 3: BALANCED DISTRIBUTION CONTROLS */}
              {assignmentMethod === 'Balanced' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleReapplyPolicy}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> Balance Sections
                  </button>
                  <button
                    onClick={handleResetPolicySuggestions}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap border border-sky-200/60 dark:border-sky-900/60"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Recalculate Distribution
                  </button>
                </div>
              )}

              {/* Common Bulk Status Control */}
              <div className="flex items-center gap-1.5">
                <select
                  value={bulkStatus}
                  onChange={e => {
                    const stat = e.target.value as 'Promote' | 'Retain' | '';
                    setBulkStatus(stat);
                    if (stat) handleApplyBulkStatus(stat);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer shadow-xs transition-colors ${
                    bulkStatus
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-extrabold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  <option value="">Select Status</option>
                  <option value="Promote">Promote</option>
                  <option value="Retain">Retain</option>
                </select>
              </div>

              {/* Main Execute Promote CTA Button placed on the far right side */}
              <button
                onClick={handleCompletePromotion}
                disabled={isPromoting || promotionRows.length === 0}
                className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0 ml-auto"
              >
                {isPromoting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Promoting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Promote
                  </>
                )}
              </button>
            </div>
          </div>

          {/* STUDENT PROMOTION TABLE */}
          <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3.5 px-4 w-10 text-center align-middle">
                      {filteredRows.length > 0 && (
                        <IndeterminateCheckbox
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-600 cursor-pointer"
                          checked={isAllSelected}
                          indeterminate={isSomeSelected}
                          onChange={handleToggleSelectAll}
                          title="Select all students"
                        />
                      )}
                    </th>
                    <th className="py-3.5 px-4">Adm No</th>
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[5.5rem]">Roll No</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Current Sec</th>
                    <th className="py-3.5 px-4">Overall %</th>
                    <th className="py-3.5 px-4">Grade</th>
                    <th className="py-3.5 px-4">Final Result</th>
                    <th className="py-3.5 px-4">New Class</th>
                    <th className="py-3.5 px-4">Assignment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400 font-bold">
                        No active student records matched for {fromClass}
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map(r => {
                      const isSelected = selectedStudentIds.includes(r.id);
                      const isPendingRow = !r.newSection || r.newSection === '' || r.newSection === 'Pending';
                      return (
                        <tr 
                          key={r.id} 
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : isPendingRow && assignmentMethod === 'Manual' ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-600 cursor-pointer"
                              checked={isSelected}
                              onChange={(e) => handleToggleSelectStudent(r.id, e.target.checked)}
                            />
                          </td>

                          {/* Admission No */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {r.admissionNo}
                          </td>

                          {/* Roll No */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap min-w-[5.5rem]">
                            {r.rollNo}
                          </td>

                          {/* Student Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {r.firstName} {r.lastName}
                          </td>

                          {/* Current Section */}
                          <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">
                            {r.currentSection}
                          </td>

                          {/* Overall Percentage */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 dark:text-white">{r.overallPct}%</span>
                              <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full ${r.overallPct >= 75 ? 'bg-emerald-500' : r.overallPct >= 50 ? 'bg-sky-500' : 'bg-rose-500'}`} 
                                  style={{ width: `${r.overallPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Grade */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
                              {r.grade}
                            </span>
                          </td>

                          {/* Final Result */}
                          <td className="py-3.5 px-4">
                            {r.finalResult === 'PASS' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-black text-[11px] border border-emerald-200 dark:border-emerald-900/40">
                                <Check className="w-3 h-3" /> PASS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-black text-[11px] border border-rose-200 dark:border-rose-900/40">
                                <XCircle className="w-3 h-3" /> FAIL
                              </span>
                            )}
                          </td>

                          {/* New Class */}
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {r.newClass}
                          </td>

                          {/* Assignment Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getAssignmentStatus(r) === 'Pending' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-bold text-[11px] border border-amber-200 dark:border-amber-900/50">
                                <AlertCircle className="w-3 h-3 text-amber-600" /> Pending
                              </span>
                            ) : getAssignmentStatus(r) === 'Promoted' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200 dark:border-emerald-900/50">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Promoted {r.newSection ? `(${r.newSection.replace('Section ', 'Sec ')})` : ''}
                              </span>
                            ) : getAssignmentStatus(r) === 'Retained' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-bold text-[11px] border border-rose-200 dark:border-rose-900/50">
                                <XCircle className="w-3 h-3 text-rose-600" /> Retained
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 font-bold text-[11px] border border-sky-200 dark:border-sky-900/50">
                                <Check className="w-3 h-3 text-sky-600" /> Assigned {r.newSection ? `(${r.newSection.replace('Section ', 'Sec ')})` : ''}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Promotion Pagination Footer */}
            {filteredRows.length > 0 && (
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span>
                    Showing {paginatedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} student(s)
                  </span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="font-bold text-slate-900 dark:text-white px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
