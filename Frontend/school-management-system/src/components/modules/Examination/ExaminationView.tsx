import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Lock,
  MoreVertical,
  Printer,
  Save,
  Send,
  Sparkles,
  Star,
  RotateCcw,
  Upload,
  Users
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { PrintableReportCard } from './PrintableReportCard';
import { ExamMark, ExamSetup, GradeConfig, QuestionPaper, Student } from '../../../types';

type MainTab = 'setup' | 'evaluation' | 'results';
type SetupSubTab = 'general' | 'schedule' | 'subjects' | 'question-papers' | 'grades';
type ResultsSubTab = 'student-results' | 'report-cards' | 'top-performers' | 'analytics';
type WorkflowStep = 'compute' | 'verify' | 'approve' | 'publish';
type EvaluationStatus = 'Draft' | 'Submitted';
type ResultStatus = 'Draft' | 'Processed' | 'Published' | 'Locked';

interface ExaminationViewProps {
  initialTab?: MainTab;
}

interface SetupFormState {
  name: string;
  examType: NonNullable<ExamSetup['examType']>;
  campus: string;
  className: string;
  section: string;
  subjects: string[];
  passPercentage: number;
  startDate: string;
  endDate: string;
  status: ExamSetup['status'];
}

interface EvaluationRowState {
  absent: boolean;
  marks: string;
  grace: string;
  remarks: string;
}

interface EvaluationSheetState {
  status: EvaluationStatus;
  rows: Record<string, EvaluationRowState>;
}

interface SubjectScore {
  subject: string;
  obtained: number;
  final: number;
  maxMarks: number;
  passMarks: number;
  absent: boolean;
  grade: string;
}

interface PerformanceRow {
  student: Student;
  rollNo: string;
  studentName: string;
  percentage: number;
  gpa: number;
  grade: string;
  passFail: 'Pass' | 'Fail';
  status: ResultStatus;
  rank: number;
  totalObtained: number;
  totalMax: number;
  subjectMarks: SubjectScore[];
  attendance: number;
  remarks: string;
}

interface PanelProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}

const MAIN_TABS: Array<{
  id: MainTab;
  label: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'setup', label: 'Exam Setup', helper: 'General, schedule, subjects, papers, grades', icon: Award },
  { id: 'evaluation', label: 'Evaluation', helper: 'Attendance, marks, grace, remarks', icon: ClipboardList },
  { id: 'results', label: 'Results', helper: 'Workflow, report cards, analytics', icon: BarChart3 }
];

const SETUP_TABS: Array<{
  id: SetupSubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'general', label: 'General', icon: Award },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'question-papers', label: 'Question Papers', icon: FileText },
  { id: 'grades', label: 'Grade Rules', icon: Star }
];

const RESULTS_TABS: Array<{
  id: ResultsSubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'student-results', label: 'Student Results', icon: ClipboardList },
  { id: 'report-cards', label: 'Report Cards', icon: FileText },
  { id: 'top-performers', label: 'Top Performers', icon: Award },
  { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 }
];

const WORKFLOW_STEPS: Array<{
  id: WorkflowStep;
  label: string;
  helper: string;
}> = [
  { id: 'compute', label: 'Compute', helper: 'Build totals and class rank' },
  { id: 'verify', label: 'Verify', helper: 'Check computed values' },
  { id: 'approve', label: 'Approve', helper: 'Finalize for publication' },
  { id: 'publish', label: 'Publish', helper: 'Release and distribute' }
];

const FALLBACK_EXAM: ExamSetup = {
  id: 'EXM-01',
  name: 'Mid-Term Examination 2026',
  academicYear: '2025-2026',
  className: 'Class 10',
  startDate: '2026-09-10',
  endDate: '2026-09-22',
  status: 'Scheduled',
  branch: 'Main Campus',
  examType: 'Half-Yearly',
  applicableClasses: ['Class 10'],
  sections: ['A'],
  publishStatus: 'Draft',
  gradeSchemeName: 'Default Scholastic',
  marksConfig: {
    maxMarks: 100,
    passMarks: 33,
    subjectWiseConfig: {
      Mathematics: { maxMarks: 100, passMarks: 33 },
      Physics: { maxMarks: 100, passMarks: 33 }
    }
  },
  publishOptions: {
    notifyTeachers: true,
    notifyStudents: true,
    generateHallTickets: true
  }
};

const FALLBACK_GRADE_RULES: GradeConfig[] = [
  { id: 'GRD-1', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'A+', gradeName: 'A+', minPercent: 90, maxPercent: 100, minMark: 90, maxMark: 100, gradePoints: 10, gradePoint: 10, passCriteria: 'Pass' },
  { id: 'GRD-2', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'A', gradeName: 'A', minPercent: 80, maxPercent: 89, minMark: 80, maxMark: 89, gradePoints: 9, gradePoint: 9, passCriteria: 'Pass' },
  { id: 'GRD-3', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'B+', gradeName: 'B+', minPercent: 70, maxPercent: 79, minMark: 70, maxMark: 79, gradePoints: 8, gradePoint: 8, passCriteria: 'Pass' },
  { id: 'GRD-4', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'B', gradeName: 'B', minPercent: 60, maxPercent: 69, minMark: 60, maxMark: 69, gradePoints: 7, gradePoint: 7, passCriteria: 'Pass' },
  { id: 'GRD-5', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'C', gradeName: 'C', minPercent: 50, maxPercent: 59, minMark: 50, maxMark: 59, gradePoints: 6, gradePoint: 6, passCriteria: 'Pass' },
  { id: 'GRD-6', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'D', gradeName: 'D', minPercent: 33, maxPercent: 49, minMark: 33, maxMark: 49, gradePoints: 4, gradePoint: 4, passCriteria: 'Pass' },
  { id: 'GRD-7', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'F', gradeName: 'F', minPercent: 0, maxPercent: 32, minMark: 0, maxMark: 32, gradePoints: 0, gradePoint: 0, passCriteria: 'Fail' }
];

const DEFAULT_REPORT_SETTINGS = {
  attendance: true,
  rank: true,
  remarks: true,
  promotionStatus: true,
  principalSignature: true,
  schoolSeal: true
};

const panelClass = 'rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400';
const selectClass = inputClass;
const primaryButtonClass = 'inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-black text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50';
const outlineButtonClass = 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50';
const ghostButtonClass = 'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-black transition hover:bg-slate-100 dark:hover:bg-slate-800';
const tableHeaderClass = 'sticky top-0 z-10 bg-slate-50/95 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800/95 dark:text-slate-300';

function Panel({ title, description, action, className = '', children }: PanelProps) {
  return (
    <section className={`${panelClass} ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-3 py-2.5 dark:border-slate-800">
        <div className="space-y-0.5">
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {description && <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, hint, icon, className = '' }: MetricCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/60 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <div className="text-lg font-black text-slate-900 dark:text-white">{value}</div>
          {hint && <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        {icon}
      </div>
    </div>
  );
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundOne = (value: number) => Math.round(value * 10) / 10;

const parseRollNo = (rollNo: string) => {
  const numeric = Number.parseInt(String(rollNo).replace(/\D/g, ''), 10);
  return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER;
};

const getDisplayName = (student: Student) => `${student.firstName} ${student.lastName}`.trim();

const getGradeBand = (percentage: number, gradeRules: GradeConfig[]) => {
  const matched = gradeRules.find(rule =>
    percentage >= (rule.minPercent ?? rule.minMark ?? 0) &&
    percentage <= (rule.maxPercent ?? rule.maxMark ?? 100)
  );

  if (matched) {
    return {
      grade: matched.grade || matched.gradeName || 'A',
      gpa: matched.gradePoint ?? matched.gradePoints ?? 9
    };
  }

  if (percentage >= 90) return { grade: 'A+', gpa: 10 };
  if (percentage >= 80) return { grade: 'A', gpa: 9 };
  if (percentage >= 70) return { grade: 'B+', gpa: 8 };
  if (percentage >= 60) return { grade: 'B', gpa: 7 };
  if (percentage >= 50) return { grade: 'C', gpa: 6 };
  if (percentage >= 33) return { grade: 'D', gpa: 4 };
  return { grade: 'F', gpa: 0 };
};

const getClassSections = (className: string, academicClasses: ReturnType<typeof useData>['academicClasses']) => {
  const cls = academicClasses.find(item => item.name === className);
  return (cls?.sections?.length ? cls.sections : ['A']).filter(Boolean);
};

const getClassSubjects = (className: string, academicClasses: ReturnType<typeof useData>['academicClasses'], subjects: ReturnType<typeof useData>['subjects']) => {
  const cls = academicClasses.find(item => item.name === className);
  const base = cls?.subjects?.length ? cls.subjects : subjects.map(subject => subject.name);
  return Array.from(new Set(base.filter(Boolean)));
};

const getDurationLabel = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(':').map(part => Number.parseInt(part, 10));
  const [endHour, endMinute] = endTime.split(':').map(part => Number.parseInt(part, 10));
  const start = (startHour * 60) + startMinute;
  const end = (endHour * 60) + endMinute;
  const diff = Math.max(0, end - start);
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

const buildSubjectWiseConfig = (subjects: string[], passMarks: number, maxMarks = 100) => {
  return subjects.reduce<Record<string, { maxMarks: number; passMarks: number }>>((acc, subject) => {
    acc[subject] = { maxMarks, passMarks };
    return acc;
  }, {});
};

const normalizeExam = (exam: ExamSetup, fallbackBranch: string): ExamSetup => ({
  ...exam,
  branch: exam.branch || fallbackBranch,
  applicableClasses: exam.applicableClasses?.length ? exam.applicableClasses : [exam.className],
  sections: exam.sections?.length ? exam.sections : ['A'],
  publishStatus: exam.publishStatus || 'Draft',
  marksConfig: {
    maxMarks: exam.marksConfig?.maxMarks || 100,
    passMarks: exam.marksConfig?.passMarks || 33,
    subjectWiseConfig: exam.marksConfig?.subjectWiseConfig || {}
  }
});

const buildSetupForm = (exam: ExamSetup, academicClasses: ReturnType<typeof useData>['academicClasses'], subjects: ReturnType<typeof useData>['subjects']): SetupFormState => {
  const className = exam.className || 'Class 10';
  const classSections = getClassSections(className, academicClasses);
  const classSubjects = getClassSubjects(className, academicClasses, subjects);

  return {
    name: exam.name,
    examType: exam.examType || 'Half-Yearly',
    campus: exam.branch || 'Main Campus',
    className,
    section: exam.sections?.[0] || classSections[0] || 'A',
    subjects: classSubjects.slice(0, 5),
    passPercentage: exam.marksConfig?.passMarks || 33,
    startDate: exam.startDate,
    endDate: exam.endDate,
    status: exam.status
  };
};

const buildGradeRules = (exam: ExamSetup, gradeConfigurations: GradeConfig[]) => {
  const scheme = exam.gradeSchemeName || 'Default Scholastic';
  const filtered = gradeConfigurations.filter(rule => (rule.schemeName || 'Default Scholastic') === scheme);
  const rules = filtered.length > 0 ? filtered : FALLBACK_GRADE_RULES;
  return rules.map(rule => ({
    ...rule,
    grade: rule.grade || rule.gradeName,
    minMark: rule.minMark ?? rule.minPercent,
    maxMark: rule.maxMark ?? rule.maxPercent,
    gradePoint: rule.gradePoint ?? rule.gradePoints
  }));
};

const statusChipClass = (status: string) => {
  if (status === 'Published') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (status === 'Locked') return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  if (status === 'Processed') return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300';
  if (status === 'Results Published') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (status === 'Submitted' || status === 'In Progress') return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
  return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
};

export const ExaminationView: React.FC<ExaminationViewProps> = ({ initialTab = 'setup' }) => {
  const { exams, students, staff, academicClasses, subjects, examMarks, examSchedules, questionPapers, gradeConfigurations, schoolProfile } = useData();
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const fallbackBranch = user?.branch || 'Main Campus';
  const normalizedExams = useMemo(
    () => (exams.length > 0 ? exams : [FALLBACK_EXAM]).map(exam => normalizeExam(exam, fallbackBranch)),
    [exams, fallbackBranch]
  );

  const [workflowExams, setWorkflowExams] = useState<ExamSetup[]>(normalizedExams);
  const [selectedExamId, setSelectedExamId] = useState<string>(normalizedExams[0]?.id || '');
  const [activeTab, setActiveTab] = useState<MainTab>(initialTab);
  const [setupSubTab, setSetupSubTab] = useState<SetupSubTab>('general');
  const [resultsSubTab, setResultsSubTab] = useState<ResultsSubTab>('student-results');

  const [setupForm, setSetupForm] = useState<SetupFormState>(() => buildSetupForm(normalizedExams[0] || FALLBACK_EXAM, academicClasses, subjects));
  const [gradeRules, setGradeRules] = useState<GradeConfig[]>(() => buildGradeRules(normalizedExams[0] || FALLBACK_EXAM, gradeConfigurations));
  const [questionPaperItems, setQuestionPaperItems] = useState<QuestionPaper[]>(() => questionPapers.filter(paper => paper.examId === (normalizedExams[0]?.id || FALLBACK_EXAM.id)));
  const [evaluationSheets, setEvaluationSheets] = useState<Record<string, EvaluationSheetState>>({});
  const [resultStatuses, setResultStatuses] = useState<Record<string, ResultStatus>>({});
  const [resultWorkflowSteps, setResultWorkflowSteps] = useState<Record<string, WorkflowStep>>({});
  const [reportSettings, setReportSettings] = useState(DEFAULT_REPORT_SETTINGS);
  const [reportPreviewStudentId, setReportPreviewStudentId] = useState<string>('');
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [resultsMenuOpen, setResultsMenuOpen] = useState(false);

  const questionPaperInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWorkflowExams(normalizedExams);
    if (!selectedExamId || !normalizedExams.some(exam => exam.id === selectedExamId)) {
      setSelectedExamId(normalizedExams[0]?.id || '');
    }
  }, [normalizedExams]);

  useEffect(() => {
    const currentExam = workflowExams.find(exam => exam.id === selectedExamId) || workflowExams[0] || FALLBACK_EXAM;
    setSetupForm(buildSetupForm(currentExam, academicClasses, subjects));
    setGradeRules(buildGradeRules(currentExam, gradeConfigurations));
    setQuestionPaperItems(questionPapers.filter(paper => paper.examId === currentExam.id));
    setReportSettings(DEFAULT_REPORT_SETTINGS);
    setResultsMenuOpen(false);
  }, [selectedExamId, academicClasses, gradeConfigurations, questionPapers, subjects]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSetupSubTab('general');
    setResultsSubTab('student-results');
  }, [selectedExamId]);

  const selectedExam = useMemo(
    () => workflowExams.find(exam => exam.id === selectedExamId) || workflowExams[0] || null,
    [workflowExams, selectedExamId]
  );

  const examOptions = workflowExams;
  const classOptions = useMemo(() => {
    const names = new Set<string>();
    academicClasses.forEach(cls => names.add(cls.name));
    students.forEach(student => names.add(student.className));
    return Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [academicClasses, students]);

  const selectedClassSections = getClassSections(setupForm.className, academicClasses);
  const selectedClassSubjects = getClassSubjects(setupForm.className, academicClasses, subjects);

  const campusOptions = useMemo(() => {
    const campuses = new Set<string>([fallbackBranch]);
    workflowExams.forEach(exam => {
      if (exam.branch) campuses.add(exam.branch);
    });
    return Array.from(campuses);
  }, [workflowExams, fallbackBranch]);

  const teacherOptions = useMemo(() => {
    return Array.from(
      new Map(
        staff
          .filter(person => person.status === 'Active')
          .map(person => [person.id, { id: person.id, name: person.name || `${person.firstName} ${person.lastName}`.trim() }])
      ).values()
    );
  }, [staff]);

  const selectedTabIndex = MAIN_TABS.findIndex(tab => tab.id === activeTab);
  const previousTab = MAIN_TABS[(selectedTabIndex - 1 + MAIN_TABS.length) % MAIN_TABS.length];
  const nextTab = MAIN_TABS[(selectedTabIndex + 1) % MAIN_TABS.length];

  const examDisplayName = selectedExam?.name || 'No Exam Selected';

  const examKey = selectedExam?.id || FALLBACK_EXAM.id;
  const setupScheduleRows = useMemo(() => {
    const existing = examSchedules.filter(schedule => schedule.examId === examKey);
    if (existing.length > 0) return existing;

    const invigilator = teacherOptions[0]?.name || user?.name || 'Exam Coordinator';
    return setupForm.subjects.slice(0, 3).map((subject, index) => ({
      id: `SCH-${index + 1}`,
      examId: examKey,
      academicYear: selectedExam?.academicYear,
      branch: setupForm.campus,
      date: setupForm.startDate,
      startTime: ['09:00', '11:00', '14:00'][index] || '09:00',
      endTime: ['10:30', '12:30', '15:30'][index] || '10:30',
      subject,
      className: setupForm.className,
      section: setupForm.section,
      maxMarks: 100,
      passMarks: Math.max(1, Math.min(100, Math.round(setupForm.passPercentage))),
      room: `Room ${101 + index}`,
      invigilatorId: teacherOptions[0]?.id || 'STAFF-001',
      invigilatorName: invigilator
    }));
  }, [examSchedules, examKey, setupForm, selectedExam?.academicYear, setupForm.campus, teacherOptions, user?.name]);

  const evaluationClassOptions = classOptions;
  const evaluationClassSections = getClassSections(setupForm.className, academicClasses);
  const evaluationSubjects = selectedClassSubjects.length > 0 ? selectedClassSubjects : ['Mathematics', 'Physics'];

  const [evaluationClass, setEvaluationClass] = useState<string>(setupForm.className || classOptions[0] || 'Class 10');
  const [evaluationSection, setEvaluationSection] = useState<string>(setupForm.section || evaluationClassSections[0] || 'A');
  const [evaluationSubject, setEvaluationSubject] = useState<string>(evaluationSubjects[0] || 'Mathematics');

  useEffect(() => {
    if (!evaluationClassOptions.includes(evaluationClass) && evaluationClassOptions.length > 0) {
      setEvaluationClass(evaluationClassOptions[0]);
    }
  }, [evaluationClassOptions, evaluationClass]);

  useEffect(() => {
    const sections = getClassSections(evaluationClass, academicClasses);
    if (!sections.includes(evaluationSection)) {
      setEvaluationSection(sections[0] || 'A');
    }
    const classSubjects = getClassSubjects(evaluationClass, academicClasses, subjects);
    if (!classSubjects.includes(evaluationSubject)) {
      setEvaluationSubject(classSubjects[0] || 'Mathematics');
    }
  }, [evaluationClass, evaluationSection, evaluationSubject, academicClasses, subjects]);

  const resultsClassOptions = evaluationClassOptions;
  const [resultsClass, setResultsClass] = useState<string>(setupForm.className || classOptions[0] || 'Class 10');
  const [resultsSection, setResultsSection] = useState<string>(setupForm.section || 'A');

  useEffect(() => {
    if (!resultsClassOptions.includes(resultsClass) && resultsClassOptions.length > 0) {
      setResultsClass(resultsClassOptions[0]);
    }
  }, [resultsClassOptions, resultsClass]);

  useEffect(() => {
    const sections = getClassSections(resultsClass, academicClasses);
    if (!sections.includes(resultsSection)) {
      setResultsSection(sections[0] || 'A');
    }
  }, [resultsClass, resultsSection, academicClasses]);

  const createEvaluationSeed = (className: string, section: string, subject: string) => {
    const roster = students
      .filter(student => student.status === 'Active' && student.className === className && student.section === section)
      .sort((a, b) => parseRollNo(a.rollNo) - parseRollNo(b.rollNo));

    return roster.reduce<Record<string, EvaluationRowState>>((acc, student, index) => {
      const stored = examMarks.find(mark =>
        mark.examId === examKey &&
        mark.studentId === student.id &&
        (mark.className || className) === className &&
        (mark.section || section) === section &&
        mark.subject === subject
      );

      const fallbackMarks = clamp(68 + ((index * 9) % 23), 0, 100);
      acc[student.id] = {
        absent: stored?.isAbsent || false,
        marks: String(stored?.marksObtained ?? fallbackMarks),
        grace: String(stored?.graceMarks ?? 0),
        remarks: stored?.remarks || ''
      };
      return acc;
    }, {});
  };

  const evaluationKey = `${examKey}|${evaluationClass}|${evaluationSection}|${evaluationSubject}`;
  const evaluationSheet = evaluationSheets[evaluationKey] || {
    status: 'Draft' as EvaluationStatus,
    rows: createEvaluationSeed(evaluationClass, evaluationSection, evaluationSubject)
  };

  useEffect(() => {
    if (!evaluationSheets[evaluationKey]) {
      setEvaluationSheets(prev => ({
        ...prev,
        [evaluationKey]: evaluationSheet
      }));
    }
  }, [evaluationKey, evaluationSheets, evaluationSheet]);

  const updateEvaluationRow = (studentId: string, updates: Partial<EvaluationRowState>) => {
    setEvaluationSheets(prev => {
      const current = prev[evaluationKey] || evaluationSheet;
      return {
        ...prev,
        [evaluationKey]: {
          ...current,
          rows: {
            ...current.rows,
            [studentId]: {
              ...current.rows[studentId],
              ...updates
            }
          }
        }
      };
    });
  };

  const evaluationRoster = students
    .filter(student => student.status === 'Active' && student.className === evaluationClass && student.section === evaluationSection)
    .sort((a, b) => parseRollNo(a.rollNo) - parseRollNo(b.rollNo));

  const evaluationRows = evaluationRoster.map(student => {
    const row = evaluationSheet.rows[student.id] || {
      absent: false,
      marks: '0',
      grace: '0',
      remarks: ''
    };
    const marks = Number.parseFloat(row.marks || '0') || 0;
    const grace = Number.parseFloat(row.grace || '0') || 0;
    const finalMarks = row.absent ? 0 : clamp(marks + grace, 0, 100);
    const percent = finalMarks;
    const grade = row.absent ? 'AB' : getGradeBand(percent, gradeRules).grade;
    return {
      student,
      row,
      finalMarks,
      grade
    };
  });

  const evaluationStats = {
    total: evaluationRows.length,
    absent: evaluationRows.filter(row => row.row.absent).length,
    entered: evaluationRows.filter(row => String(row.row.marks).trim() !== '').length,
    submitted: evaluationSheet.status
  };

  const handleSaveSetup = () => {
    if (!setupForm.name.trim()) {
      addToast('warning', 'Validation warning', 'Please enter an exam name.');
      return;
    }
    if (!setupForm.startDate || !setupForm.endDate || setupForm.startDate > setupForm.endDate) {
      addToast('warning', 'Validation warning', 'Please select a valid exam window.');
      return;
    }

    const updatedExam: ExamSetup = {
      ...(selectedExam || FALLBACK_EXAM),
      name: setupForm.name.trim(),
      examType: setupForm.examType,
      branch: setupForm.campus,
      className: setupForm.className,
      applicableClasses: [setupForm.className],
      sections: [setupForm.section],
      startDate: setupForm.startDate,
      endDate: setupForm.endDate,
      status: setupForm.status,
      publishStatus: (selectedExam?.publishStatus || 'Draft'),
      gradeSchemeName: selectedExam?.gradeSchemeName || 'Default Scholastic',
      marksConfig: {
        maxMarks: selectedExam?.marksConfig?.maxMarks || 100,
        passMarks: Math.max(1, Math.min(100, Number(setupForm.passPercentage) || 33)),
        subjectWiseConfig: buildSubjectWiseConfig(setupForm.subjects, Math.max(1, Math.min(100, Number(setupForm.passPercentage) || 33)), selectedExam?.marksConfig?.maxMarks || 100)
      }
    };

    setWorkflowExams(prev => prev.map(exam => (exam.id === examKey ? updatedExam : exam)));
    addToast('success', 'Exam setup saved', `${updatedExam.name} is ready for the next workflow stage.`);
  };

  const handleUploadPaper = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedExam) return;

    const subject = setupForm.subjects[0] || selectedClassSubjects[0] || 'Mathematics';
    const nextPaper: QuestionPaper = {
      id: `QP-${Date.now()}`,
      academicYear: selectedExam.academicYear,
      branch: setupForm.campus,
      examId: selectedExam.id,
      examName: setupForm.name,
      className: setupForm.className,
      section: setupForm.section,
      subject,
      paperTitle: file.name.replace(/\.[^.]+$/, ''),
      paperCode: `QP-${selectedExam.id}-${subject.substring(0, 3).toUpperCase()}`,
      examDate: setupForm.startDate,
      duration: '2 Hours',
      maxMarks: selectedExam.marksConfig?.maxMarks || 100,
      instructions: 'Static demo upload for the redesigned workflow.',
      fileUrl: '#',
      fileName: file.name,
      fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      fileType: file.type || 'application/pdf',
      uploadedBy: user?.name || 'Exam Coordinator',
      uploadedOn: new Date().toISOString().slice(0, 10),
      status: 'Draft'
    };

    setQuestionPaperItems(prev => [nextPaper, ...prev]);
    addToast('success', 'Question paper attached', `${file.name} was added to the setup.`);
    event.target.value = '';
  };

  const handleSaveDraft = () => {
    setEvaluationSheets(prev => ({
      ...prev,
      [evaluationKey]: {
        ...evaluationSheet,
        status: 'Draft'
      }
    }));
    addToast('success', 'Draft saved', 'Evaluation data is stored locally for this static demo.');
  };

  const handleSubmitMarks = () => {
    setEvaluationSheets(prev => ({
      ...prev,
      [evaluationKey]: {
        ...evaluationSheet,
        status: 'Submitted'
      }
    }));
    addToast('success', 'Marks submitted', 'The current evaluation sheet has been submitted.');
  };

  const buildPerformanceRows = (className: string, section: string) => {
    const roster = students
      .filter(student => student.status === 'Active' && student.className === className && student.section === section)
      .sort((a, b) => parseRollNo(a.rollNo) - parseRollNo(b.rollNo));
    const classSubjects = getClassSubjects(className, academicClasses, subjects);

    const rows = roster.map((student, index) => {
      const subjectMarks = classSubjects.map((subject, subjectIndex) => {
        const sheetKey = `${examKey}|${className}|${section}|${subject}`;
        const sheet = evaluationSheets[sheetKey];
        const row = sheet?.rows[student.id];
        const stored = examMarks.find(mark =>
          mark.examId === examKey &&
          mark.studentId === student.id &&
          (mark.className || className) === className &&
          (mark.section || section) === section &&
          mark.subject === subject
        );
        const fallbackMarks = clamp(64 + (((index + 1) * 7 + subjectIndex * 5) % 31), 0, 100);
        const obtained = row ? (row.absent ? 0 : Number.parseFloat(row.marks || '0') || 0) : (stored?.marksObtained ?? fallbackMarks);
        const grace = row ? (Number.parseFloat(row.grace || '0') || 0) : (stored?.graceMarks || 0);
        const final = row ? clamp(obtained + grace, 0, 100) : clamp(obtained + grace, 0, 100);
        const absent = row ? row.absent : Boolean(stored?.isAbsent);
        const passMarks = stored?.passMarks ?? selectedExam?.marksConfig?.passMarks ?? 33;
        const maxMarks = stored?.maxMarks ?? selectedExam?.marksConfig?.maxMarks ?? 100;
        const percent = maxMarks > 0 ? (final / maxMarks) * 100 : 0;
        const grade = absent ? 'AB' : getGradeBand(percent, gradeRules).grade;

        return {
          subject,
          obtained,
          final,
          maxMarks,
          passMarks,
          absent,
          grade
        };
      });

      const totalObtained = subjectMarks.reduce((sum, item) => sum + (item.absent ? 0 : item.final), 0);
      const totalMax = subjectMarks.reduce((sum, item) => sum + item.maxMarks, 0) || 100;
      const percentage = totalMax > 0 ? roundOne((totalObtained / totalMax) * 100) : 0;
      const finalBand = getGradeBand(percentage, gradeRules);
      const passThreshold = selectedExam?.marksConfig?.passMarks ?? 33;
      const passFail = subjectMarks.some(item => !item.absent && item.final < item.passMarks) || percentage < passThreshold ? 'Fail' : 'Pass';
      const attendance = clamp(Math.round(student.attendancePct || 0), 0, 100);

      return {
        student,
        rollNo: student.rollNo,
        studentName: getDisplayName(student),
        percentage,
        gpa: finalBand.gpa,
        grade: finalBand.grade,
        passFail,
        status: resultStatuses[`${examKey}|${className}|${section}`] || 'Draft',
        rank: 0,
        totalObtained,
        totalMax,
        subjectMarks,
        attendance,
        remarks: student.remarks || (passFail === 'Pass' ? 'Consistent performance.' : 'Needs focused remediation.')
      } satisfies PerformanceRow;
    });

    const rankedRows = [...rows].sort((a, b) => b.percentage - a.percentage);
    const rankMap = new Map<string, number>();
    rankedRows.forEach((row, index) => rankMap.set(row.student.id, index + 1));

    return rows
      .map(row => ({
        ...row,
        rank: rankMap.get(row.student.id) || 0,
        status: resultStatuses[`${examKey}|${className}|${section}`] || 'Draft'
      }))
      .sort((a, b) => parseRollNo(a.rollNo) - parseRollNo(b.rollNo));
  };

  const resultsKey = `${examKey}|${resultsClass}|${resultsSection}`;
  const resultsRows = useMemo(() => buildPerformanceRows(resultsClass, resultsSection), [
    resultsClass,
    resultsSection,
    examKey,
    evaluationSheets,
    examMarks,
    gradeRules,
    resultsClass,
    resultsSection,
    selectedExam?.marksConfig?.passMarks,
    selectedExam?.marksConfig?.maxMarks,
    subjects,
    academicClasses,
    students,
    resultStatuses
  ]);
  const resultsStatus = resultStatuses[resultsKey] || 'Draft';
  const resultsWorkflowStep = resultWorkflowSteps[resultsKey] || (
    resultsStatus === 'Published' || resultsStatus === 'Locked'
      ? 'publish'
      : resultsStatus === 'Processed'
        ? 'verify'
        : 'compute'
  );

  useEffect(() => {
    if (!resultStatuses[resultsKey]) {
      setResultStatuses(prev => ({
        ...prev,
        [resultsKey]: (selectedExam?.publishStatus === 'Published' || selectedExam?.status === 'Results Published') ? 'Published' : 'Draft'
      }));
    }
  }, [resultsKey, resultStatuses, selectedExam?.publishStatus, selectedExam?.status]);

  useEffect(() => {
    if (!resultWorkflowSteps[resultsKey]) {
      setResultWorkflowSteps(prev => ({
        ...prev,
        [resultsKey]: resultsStatus === 'Published' || resultsStatus === 'Locked'
          ? 'publish'
          : resultsStatus === 'Processed'
            ? 'verify'
            : 'compute'
      }));
    }
  }, [resultsKey, resultWorkflowSteps, resultsStatus]);

  const resultsSummary = useMemo(() => {
    const total = resultsRows.length;
    return {
      total,
      pass: resultsRows.filter(row => row.passFail === 'Pass').length,
      fail: resultsRows.filter(row => row.passFail === 'Fail').length,
      pending: resultsStatus === 'Draft' ? total : 0,
      published: resultsStatus === 'Published' || resultsStatus === 'Locked' ? total : 0
    };
  }, [resultsRows.length, resultsStatus]);

  const handleProcessResults = () => {
    setResultStatuses(prev => ({ ...prev, [resultsKey]: 'Processed' }));
    setResultWorkflowSteps(prev => ({ ...prev, [resultsKey]: 'verify' }));
    addToast('success', 'Results processed', `${resultsRows.length} students were processed for ${selectedExam?.name || 'the selected exam'}.`);
  };

  const handleApproveResults = () => {
    setResultStatuses(prev => ({ ...prev, [resultsKey]: prev[resultsKey] === 'Draft' ? 'Processed' : prev[resultsKey] || 'Processed' }));
    setResultWorkflowSteps(prev => ({ ...prev, [resultsKey]: 'approve' }));
    addToast('success', 'Results approved', 'The computed result set is ready for publication.');
  };

  const handlePublishResults = () => {
    setResultStatuses(prev => ({ ...prev, [resultsKey]: 'Published' }));
    setResultWorkflowSteps(prev => ({ ...prev, [resultsKey]: 'publish' }));
    addToast('success', 'Results published', 'Published results are now available in the report workflow.');
  };

  const handleLockResults = () => {
    setResultStatuses(prev => ({ ...prev, [resultsKey]: 'Locked' }));
    setResultWorkflowSteps(prev => ({ ...prev, [resultsKey]: 'publish' }));
    addToast('success', 'Results locked', 'The current result set is now locked.');
  };

  const handleRevertToDraft = () => {
    setResultStatuses(prev => ({ ...prev, [resultsKey]: 'Draft' }));
    setResultWorkflowSteps(prev => ({ ...prev, [resultsKey]: 'compute' }));
    setResultsMenuOpen(false);
    addToast('warning', 'Reverted to draft', 'The result set has been moved back to draft mode.');
  };

  useEffect(() => {
    if (!reportPreviewStudentId || !resultsRows.some(row => row.student.id === reportPreviewStudentId)) {
      setReportPreviewStudentId(resultsRows[0]?.student.id || '');
    }
  }, [resultsRows, reportPreviewStudentId]);

  const reportPreviewRow = resultsRows.find(row => row.student.id === reportPreviewStudentId) || resultsRows[0] || null;
  const reportPreviewStudent = reportPreviewRow?.student || null;

  const reportAnalytics = useMemo(() => {
    const total = resultsRows.length || 1;
    const average = roundOne(resultsRows.reduce((sum, row) => sum + row.percentage, 0) / total);
    const highest = resultsRows.length ? Math.max(...resultsRows.map(row => row.percentage)) : 0;
    const lowest = resultsRows.length ? Math.min(...resultsRows.map(row => row.percentage)) : 0;
    const passed = resultsRows.filter(row => row.passFail === 'Pass').length;
    const failed = resultsRows.filter(row => row.passFail === 'Fail').length;

    const subjectsList = getClassSubjects(resultsClass, academicClasses, subjects);
    const subjectStats = subjectsList.map(subject => {
      const scoreList = resultsRows.map(row => row.subjectMarks.find(mark => mark.subject === subject)?.final || 0);
      const avg = scoreList.length ? roundOne(scoreList.reduce((sum, score) => sum + score, 0) / scoreList.length) : 0;
      const passRate = scoreList.length ? Math.round((scoreList.filter(score => score >= (selectedExam?.marksConfig?.passMarks ?? 33)).length / scoreList.length) * 100) : 0;
      return { subject, avg, passRate };
    });

    const topRankers = [...resultsRows].sort((a, b) => b.percentage - a.percentage).slice(0, 3);

    return { average, highest, lowest, passed, failed, subjectStats, topRankers };
  }, [resultsRows, resultsClass, academicClasses, subjects, selectedExam?.marksConfig?.passMarks]);

  const handleGenerateReports = () => {
    addToast('success', 'Reports generated', `${resultsRows.length} report cards are ready for the selected class.`);
  };

  const handlePreviewReports = () => {
    if (!reportPreviewStudent) {
      addToast('warning', 'Preview unavailable', 'Please ensure a student is available for the current filters.');
      return;
    }
    setReportPreviewOpen(true);
  };

  const handlePrintReports = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    addToast('success', 'Download queued', 'Static PDF download is simulated in this demo.');
  };

  const handleSendToParents = () => {
    addToast('success', 'Send queued', 'Report cards have been queued for parent delivery in this static demo.');
  };

  const toggleMainTab = (direction: -1 | 1) => {
    const nextIndex = (MAIN_TABS.findIndex(tab => tab.id === activeTab) + direction + MAIN_TABS.length) % MAIN_TABS.length;
    setActiveTab(MAIN_TABS[nextIndex].id);
  };

  const setupCardAction = (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusChipClass(setupForm.status)}`}>
        {setupForm.status}
      </span>
      <button type="button" onClick={handleSaveSetup} className={primaryButtonClass}>
        <Save className="h-4 w-4" />
        {setupSubTab === 'schedule' ? 'Save' : 'Save Setup'}
      </button>
      {setupSubTab === 'schedule' && (
        <button type="button" onClick={() => window.print()} className={outlineButtonClass}>
          <Printer className="h-4 w-4" />
          Print Schedule
        </button>
      )}
    </div>
  );

  const evaluationCardAction = (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusChipClass(evaluationSheet.status)}`}>
      {evaluationSheet.status}
    </span>
  );

  const resultsCardAction = (
    <div className="flex flex-wrap items-center gap-2">
      {resultsSubTab === 'student-results' && (
        <>
          <button
            type="button"
            onClick={handleProcessResults}
            disabled={resultsStatus === 'Locked' || resultsStatus === 'Published'}
            className={primaryButtonClass}
          >
            <ClipboardList className="h-4 w-4" />
            Compute Results
          </button>
          <button
            type="button"
            onClick={handleApproveResults}
            disabled={resultsStatus === 'Locked'}
            className={outlineButtonClass}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={handlePublishResults}
            disabled={resultsStatus === 'Locked'}
            className={outlineButtonClass}
          >
            <Lock className="h-4 w-4" />
            Publish
          </button>
        </>
      )}
      {resultsSubTab === 'report-cards' && (
        <>
          <button type="button" onClick={handleGenerateReports} className={primaryButtonClass}>
            <FileText className="h-4 w-4" />
            Generate
          </button>
          <button type="button" onClick={handlePreviewReports} className={outlineButtonClass}>
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button type="button" onClick={handlePrintReports} className={outlineButtonClass}>
            <Printer className="h-4 w-4" />
            Print Report Cards
          </button>
          <button type="button" onClick={handleDownloadPdf} className={outlineButtonClass}>
            <Download className="h-4 w-4" />
            Download Report Cards
          </button>
          <button type="button" onClick={handleSendToParents} className={outlineButtonClass}>
            <Send className="h-4 w-4" />
            Send to Parents
          </button>
        </>
      )}
      {(resultsSubTab === 'student-results' || resultsSubTab === 'report-cards') && (
        <div className="relative">
          <button type="button" onClick={() => setResultsMenuOpen(value => !value)} className={ghostButtonClass + ' text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}>
            <MoreVertical className="h-4 w-4" />
          </button>
          {resultsMenuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <button type="button" onClick={handleLockResults} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                <Lock className="h-4 w-4" />
                Lock Results
              </button>
              <button type="button" onClick={handleRevertToDraft} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                <RotateCcw className="h-4 w-4" />
                Revert to Draft
              </button>
            </div>
          )}
        </div>
      )}
      {resultsSubTab !== 'student-results' && resultsSubTab !== 'report-cards' && (
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusChipClass(resultsStatus)}`}>
          {resultsStatus}
        </span>
      )}
    </div>
  );

  const workflowStepIndex = Math.max(0, WORKFLOW_STEPS.findIndex(step => step.id === resultsWorkflowStep));

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-3 pb-8">
      <section className="rounded-[1.75rem] border border-slate-200/80 bg-slate-950 px-4 py-3 text-white shadow-xl shadow-slate-950/10 dark:border-slate-800">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">
              <Sparkles className="h-4 w-4" />
              Examination workflow
            </div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">{MAIN_TABS.find(tab => tab.id === activeTab)?.label || 'Examinations'}</h1>
            <p className="max-w-3xl text-sm text-slate-300">
              A compact three-screen workflow for setup, evaluation, and results.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-[240px]">
              <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Selected Exam</label>
              <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className={selectClass}>
                {examOptions.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toggleMainTab(-1)} className={outlineButtonClass + ' border-white/10 bg-white/5 text-white hover:bg-white/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button type="button" onClick={() => toggleMainTab(1)} className={outlineButtonClass + ' border-white/10 bg-white/5 text-white hover:bg-white/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'}>
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {MAIN_TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-sky-300 bg-sky-50 shadow-sm dark:border-sky-900/70 dark:bg-sky-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <div className={`rounded-xl p-2 ${active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                <tab.icon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 dark:text-white">{tab.label}</div>
                <div className="text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">{tab.helper}</div>
              </div>
            </button>
          );
        })}
      </div>

      {activeTab === 'setup' && (
        <Panel
          title="Exam Setup"
          description="General details, schedule, subjects, question papers, and grade rules"
          action={setupCardAction}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-800">
            {SETUP_TABS.map(tab => {
              const active = setupSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSetupSubTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${
                    active
                      ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {setupSubTab === 'general' && (
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Exam Name</label>
                <input value={setupForm.name} onChange={e => setSetupForm(prev => ({ ...prev, name: e.target.value }))} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Exam Type</label>
                <select value={setupForm.examType} onChange={e => setSetupForm(prev => ({ ...prev, examType: e.target.value as SetupFormState['examType'] }))} className={selectClass}>
                  {['Unit Test', 'Quarterly', 'Half-Yearly', 'Annual', 'Practical', 'Custom'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Campus</label>
                <select value={setupForm.campus} onChange={e => setSetupForm(prev => ({ ...prev, campus: e.target.value }))} className={selectClass}>
                  {campusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Class</label>
                <select
                  value={setupForm.className}
                  onChange={e => {
                    const nextClass = e.target.value;
                    const nextSections = getClassSections(nextClass, academicClasses);
                    const nextSubjects = getClassSubjects(nextClass, academicClasses, subjects);
                    setSetupForm(prev => ({
                      ...prev,
                      className: nextClass,
                      section: nextSections[0] || 'A',
                      subjects: nextSubjects.slice(0, 5)
                    }));
                  }}
                  className={selectClass}
                >
                  {classOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Section</label>
                <select value={setupForm.section} onChange={e => setSetupForm(prev => ({ ...prev, section: e.target.value }))} className={selectClass}>
                  {selectedClassSections.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Pass Percentage</label>
                <input type="number" min="0" max="100" value={setupForm.passPercentage} onChange={e => setSetupForm(prev => ({ ...prev, passPercentage: Number(e.target.value) || 0 }))} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</label>
                <select value={setupForm.status} onChange={e => setSetupForm(prev => ({ ...prev, status: e.target.value as SetupFormState['status'] }))} className={selectClass}>
                  {['Scheduled', 'In Progress', 'Completed', 'Results Published'].map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Start Date</label>
                <input type="date" value={setupForm.startDate} onChange={e => setSetupForm(prev => ({ ...prev, startDate: e.target.value }))} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">End Date</label>
                <input type="date" value={setupForm.endDate} onChange={e => setSetupForm(prev => ({ ...prev, endDate: e.target.value }))} className={inputClass} />
              </div>
            </div>
          )}

          {setupSubTab === 'schedule' && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{examDisplayName}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{setupForm.className}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">Section {setupForm.section}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{setupScheduleRows.length} slots</span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      <th className={tableHeaderClass}>Exam</th>
                      <th className={tableHeaderClass}>Class</th>
                      <th className={tableHeaderClass}>Section</th>
                      <th className={tableHeaderClass}>Subject</th>
                      <th className={tableHeaderClass}>Date</th>
                      <th className={tableHeaderClass}>Start Time</th>
                      <th className={tableHeaderClass}>End Time</th>
                      <th className={tableHeaderClass}>Duration</th>
                      <th className={tableHeaderClass}>Room</th>
                      <th className={tableHeaderClass}>Invigilator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setupScheduleRows.map(schedule => (
                      <tr key={schedule.id} className="border-t border-slate-200/70 dark:border-slate-800">
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{examDisplayName}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{setupForm.className}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{setupForm.section}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{schedule.subject}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{schedule.date}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{schedule.startTime}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{schedule.endTime}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{getDurationLabel(schedule.startTime, schedule.endTime)}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{schedule.room || 'TBA'}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{schedule.invigilatorName || 'TBA'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {setupSubTab === 'subjects' && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <span>{setupForm.subjects.length} selected</span>
                <span>{selectedClassSubjects.length} available</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedClassSubjects.map(subject => {
                  const selected = setupForm.subjects.includes(subject);
                  return (
                    <button
                      type="button"
                      key={subject}
                      onClick={() => {
                        setSetupForm(prev => ({
                          ...prev,
                          subjects: selected ? prev.subjects.filter(item => item !== subject) : [...prev.subjects, subject]
                        }));
                      }}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                        selected
                          ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {subject}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {setupSubTab === 'question-papers' && (
            <div className="mt-3 space-y-3">
              <input ref={questionPaperInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleUploadPaper} />
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Question Paper Upload</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Static file upload only. No API integration.</p>
                </div>
                <button type="button" onClick={() => questionPaperInputRef.current?.click()} className={outlineButtonClass}>
                  <Upload className="h-4 w-4" />
                  Upload Question Paper
                </button>
              </div>
              <div className="space-y-2">
                {questionPaperItems.length > 0 ? questionPaperItems.slice(0, 4).map(paper => (
                  <div key={paper.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{paper.paperTitle}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{paper.subject} | {paper.fileName}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {paper.maxMarks} Marks
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No paper uploaded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {setupSubTab === 'grades' && (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    <th className={tableHeaderClass}>Grade</th>
                    <th className={tableHeaderClass}>Min %</th>
                    <th className={tableHeaderClass}>Max %</th>
                    <th className={tableHeaderClass}>GPA</th>
                    <th className={tableHeaderClass}>Remarks</th>
                    <th className={tableHeaderClass}>Criteria</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeRules.map((rule, index) => (
                    <tr key={`${rule.id}-${index}`} className="border-t border-slate-200/70 dark:border-slate-800">
                      <td className="px-3 py-2">
                        <input
                          value={rule.grade || ''}
                          onChange={e => {
                            const value = e.target.value;
                            setGradeRules(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, grade: value, gradeName: value } : item));
                          }}
                          className={inputClass}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={rule.minMark ?? rule.minPercent}
                          onChange={e => {
                            const value = Number(e.target.value) || 0;
                            setGradeRules(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, minMark: value, minPercent: value } : item));
                          }}
                          className={inputClass}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={rule.maxMark ?? rule.maxPercent}
                          onChange={e => {
                            const value = Number(e.target.value) || 0;
                            setGradeRules(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, maxMark: value, maxPercent: value } : item));
                          }}
                          className={inputClass}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={rule.gradePoint ?? rule.gradePoints}
                          onChange={e => {
                            const value = Number(e.target.value) || 0;
                            setGradeRules(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, gradePoint: value, gradePoints: value } : item));
                          }}
                          className={inputClass}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={rule.remarks || ''}
                          onChange={e => {
                            const value = e.target.value;
                            setGradeRules(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, remarks: value } : item));
                          }}
                          className={inputClass}
                          placeholder="Optional note"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${rule.passCriteria === 'Pass' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                          {rule.passCriteria}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {activeTab === 'evaluation' && (
        <Panel
          title="Evaluation"
          description="Attendance, marks, grace marks, final marks, grades, and remarks"
          action={evaluationCardAction}
          className="overflow-hidden"
        >
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Exam</p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{examDisplayName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Class</label>
              <select value={evaluationClass} onChange={e => setEvaluationClass(e.target.value)} className={selectClass}>
                {evaluationClassOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Section</label>
              <select value={evaluationSection} onChange={e => setEvaluationSection(e.target.value)} className={selectClass}>
                {getClassSections(evaluationClass, academicClasses).map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Subject</label>
              <select value={evaluationSubject} onChange={e => setEvaluationSubject(e.target.value)} className={selectClass}>
                {getClassSubjects(evaluationClass, academicClasses, subjects).map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Total Students" value={evaluationStats.total} icon={<Users className="h-4 w-4 text-slate-400" />} />
            <MetricCard label="Present" value={evaluationStats.total - evaluationStats.absent} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
            <MetricCard label="Absent" value={evaluationStats.absent} icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
            <MetricCard label="Status" value={evaluationStats.submitted} icon={<ClipboardList className="h-4 w-4 text-sky-500" />} />
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className={tableHeaderClass}>Roll No</th>
                  <th className={tableHeaderClass}>Student Name</th>
                  <th className={tableHeaderClass}>Attendance</th>
                  <th className={tableHeaderClass}>Marks</th>
                  <th className={tableHeaderClass}>Grace Marks</th>
                  <th className={tableHeaderClass}>Final Marks</th>
                  <th className={tableHeaderClass}>Grade</th>
                  <th className={tableHeaderClass}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {evaluationRows.map(({ student, row, finalMarks, grade }) => (
                  <tr key={student.id} className="border-t border-slate-200/70 dark:border-slate-800">
                    <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{student.rollNo}</td>
                    <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{getDisplayName(student)}</td>
                    <td className="px-3 py-3">
                      <select
                        value={row.absent ? 'Absent' : 'Present'}
                        onChange={e => updateEvaluationRow(student.id, { absent: e.target.value === 'Absent' })}
                        className={selectClass}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.absent ? '' : row.marks}
                        disabled={row.absent}
                        onChange={e => updateEvaluationRow(student.id, { marks: e.target.value })}
                        className={`${inputClass} ${row.absent ? 'cursor-not-allowed opacity-50' : ''}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={row.grace}
                        onChange={e => updateEvaluationRow(student.id, { grace: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-3 font-black text-slate-900 dark:text-white">{row.absent ? 'AB' : finalMarks}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${grade === 'F' || grade === 'AB' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={row.remarks}
                        onChange={e => updateEvaluationRow(student.id, { remarks: e.target.value })}
                        className={inputClass}
                        placeholder="Optional note"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Attendance controls marks entry, and final marks are recalculated automatically from marks plus grace marks.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleSaveDraft} className={outlineButtonClass}>
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button type="button" onClick={handleSubmitMarks} className={primaryButtonClass}>
                Submit Marks
              </button>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === 'results' && (
        <Panel
          title="Results"
          description="Compute, verify, approve, publish, and manage report cards in one place"
          action={resultsCardAction}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-800">
            {RESULTS_TABS.map(tab => {
              const active = resultsSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setResultsSubTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${
                    active
                      ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {resultsSubTab === 'student-results' && (
            <div className="mt-3 space-y-3">
              <div className="grid gap-2 md:grid-cols-4">
                {WORKFLOW_STEPS.map((step, index) => {
                  const active = index === workflowStepIndex;
                  const complete = index < workflowStepIndex;
                  return (
                    <div
                      key={step.id}
                      className={`rounded-2xl border p-3 transition ${
                        active
                          ? 'border-sky-300 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30'
                          : complete
                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{step.label}</p>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{step.helper}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          active
                            ? 'bg-sky-600 text-white'
                            : complete
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {active ? 'Current' : complete ? 'Done' : 'Next'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Exam</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{examDisplayName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Class</label>
                  <select value={resultsClass} onChange={e => setResultsClass(e.target.value)} className={selectClass}>
                    {resultsClassOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Section</label>
                  <select value={resultsSection} onChange={e => setResultsSection(e.target.value)} className={selectClass}>
                    {getClassSections(resultsClass, academicClasses).map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                <MetricCard label="Total Students" value={resultsSummary.total} icon={<Users className="h-4 w-4 text-slate-400" />} />
                <MetricCard label="Pass" value={resultsSummary.pass} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
                <MetricCard label="Fail" value={resultsSummary.fail} icon={<AlertTriangle className="h-4 w-4 text-rose-500" />} />
                <MetricCard label="Pending" value={resultsSummary.pending} icon={<ClipboardList className="h-4 w-4 text-amber-500" />} />
                <MetricCard label="Published" value={resultsSummary.published} icon={<Lock className="h-4 w-4 text-sky-500" />} />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      <th className={tableHeaderClass}>Roll No</th>
                      <th className={tableHeaderClass}>Student Name</th>
                      <th className={tableHeaderClass}>Total Marks</th>
                      <th className={tableHeaderClass}>Percentage</th>
                      <th className={tableHeaderClass}>GPA</th>
                      <th className={tableHeaderClass}>Grade</th>
                      <th className={tableHeaderClass}>Pass/Fail</th>
                      <th className={tableHeaderClass}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsRows.map(row => (
                      <tr key={row.student.id} className="border-t border-slate-200/70 dark:border-slate-800">
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.rollNo}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.studentName}</td>
                        <td className="px-3 py-3 font-black text-slate-900 dark:text-white">{row.totalObtained} / {row.totalMax}</td>
                        <td className="px-3 py-3 font-black text-slate-900 dark:text-white">{row.percentage}%</td>
                        <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.gpa.toFixed(1)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${row.grade === 'F' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                            {row.grade}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${row.passFail === 'Pass' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                            {row.passFail}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusChipClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resultsSubTab === 'report-cards' && (
            <div className="mt-3 grid gap-4 xl:grid-cols-3">
              <div className="space-y-4 xl:col-span-2">
                <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Report Card Template</h3>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Attendance, rank, remarks, promotion, principal signature, and school seal are controlled from the settings panel.</p>
                      </div>
                      {reportPreviewRow && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          {reportPreviewRow.studentName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {reportPreviewRow ? (
                      <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="space-y-2 border-b border-slate-200 pb-3 text-center dark:border-slate-800">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-lg font-black text-white">
                              {schoolProfile.name ? schoolProfile.name.slice(0, 2).toUpperCase() : 'SM'}
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                {schoolProfile.name || 'School ERP'}
                              </h4>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {selectedExam?.name || 'Exam'} | {resultsClass}-{resultsSection}
                              </p>
                            </div>
                          </div>
                          <div className="inline-flex rounded-full bg-slate-950 px-4 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white dark:bg-slate-100 dark:text-slate-900">
                            Student Academic Report Card
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Student</p>
                            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{reportPreviewRow.studentName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Roll No</p>
                            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{reportPreviewRow.rollNo}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Percentage</p>
                            <p className="mt-1 text-sm font-black text-sky-600">{reportPreviewRow.percentage}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">GPA / Grade</p>
                            <p className="mt-1 text-sm font-black text-emerald-600">{reportPreviewRow.gpa.toFixed(1)} / {reportPreviewRow.grade}</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
                          <table className="min-w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800">
                                <th className={tableHeaderClass}>Subject</th>
                                <th className={tableHeaderClass}>Marks</th>
                                <th className={tableHeaderClass}>Grade</th>
                                <th className={tableHeaderClass}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportPreviewRow.subjectMarks.map(mark => (
                                <tr key={mark.subject} className="border-t border-slate-200/70 dark:border-slate-800">
                                  <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{mark.subject}</td>
                                  <td className="px-3 py-2 font-black text-slate-900 dark:text-white">{mark.absent ? 'AB' : mark.final}</td>
                                  <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{mark.grade}</td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${mark.absent ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : mark.final < mark.passMarks ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                                      {mark.absent ? 'Absent' : mark.final < mark.passMarks ? 'Fail' : 'Pass'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {reportSettings.attendance && (
                            <div className="rounded-2xl bg-white p-3 dark:bg-slate-800/60">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Attendance</p>
                              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{reportPreviewRow.attendance}%</p>
                            </div>
                          )}
                          {reportSettings.rank && (
                            <div className="rounded-2xl bg-white p-3 dark:bg-slate-800/60">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Rank</p>
                              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">#{reportPreviewRow.rank}</p>
                            </div>
                          )}
                          {reportSettings.remarks && (
                            <div className="rounded-2xl bg-white p-3 dark:bg-slate-800/60">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Remarks</p>
                              <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{reportPreviewRow.remarks}</p>
                            </div>
                          )}
                          {reportSettings.promotionStatus && (
                            <div className="rounded-2xl bg-white p-3 dark:bg-slate-800/60">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Promotion</p>
                              <p className={`mt-1 text-sm font-black ${reportPreviewRow.passFail === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {reportPreviewRow.passFail === 'Pass' ? 'Promoted' : 'Hold for Review'}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {reportSettings.principalSignature && (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-700">
                              <div className="mx-auto mb-3 h-14 w-40 border-b-2 border-slate-900 dark:border-slate-100" />
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Principal Signature</p>
                              <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">{schoolProfile.principalName || 'Principal'}</p>
                            </div>
                          )}
                          {reportSettings.schoolSeal && (
                            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
                              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-900 text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-900 dark:border-slate-100 dark:text-slate-100">
                                School Seal
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        No report preview is available for the selected filters.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Panel title="Report Settings" description="Toggle what appears on the generated report card">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(reportSettings).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => setReportSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </label>
                    ))}
                  </div>
                </Panel>

                <Panel title="Preview Students" description="Choose a student to preview the report card">
                  <div className="space-y-2">
                    {reportAnalytics.topRankers.map(row => (
                      <button
                        key={row.student.id}
                        type="button"
                        onClick={() => setReportPreviewStudentId(row.student.id)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                          reportPreviewStudentId === row.student.id
                            ? 'border-sky-300 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">#{row.rank} {row.studentName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.rollNo} | {row.grade}</p>
                        </div>
                        <span className="text-xs font-black text-sky-600">{row.percentage}%</span>
                      </button>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {resultsSubTab === 'top-performers' && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard label="Average" value={`${reportAnalytics.average}%`} icon={<BarChart3 className="h-4 w-4 text-sky-500" />} />
                <MetricCard label="Highest" value={`${reportAnalytics.highest}%`} icon={<Star className="h-4 w-4 text-amber-500" />} />
                <MetricCard label="Passed" value={reportAnalytics.passed} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
                <MetricCard label="Failed" value={reportAnalytics.failed} icon={<AlertTriangle className="h-4 w-4 text-rose-500" />} />
              </div>
              <div className="space-y-2">
                {reportAnalytics.topRankers.map(row => (
                  <div
                    key={row.student.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">#{row.rank} {row.studentName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.rollNo} | GPA {row.gpa.toFixed(1)} | {row.grade}</p>
                    </div>
                    <span className="text-sm font-black text-sky-600">{row.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultsSubTab === 'analytics' && (
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard label="Average" value={`${reportAnalytics.average}%`} icon={<BarChart3 className="h-4 w-4 text-sky-500" />} />
                <MetricCard label="Highest" value={`${reportAnalytics.highest}%`} icon={<Star className="h-4 w-4 text-amber-500" />} />
                <MetricCard label="Lowest" value={`${reportAnalytics.lowest}%`} icon={<AlertTriangle className="h-4 w-4 text-rose-500" />} />
                <MetricCard label="Pass Rate" value={`${resultsRows.length ? Math.round((reportAnalytics.passed / resultsRows.length) * 100) : 0}%`} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <Panel title="Subject Analysis" description="Average and pass rate by subject">
                  <div className="space-y-3">
                    {reportAnalytics.subjectStats.map(subject => (
                      <div key={subject.subject} className="space-y-1 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                        <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-900 dark:text-white">
                          <span>{subject.subject}</span>
                          <span>{subject.avg}% avg</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, subject.avg)}%` }} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{subject.passRate}% pass rate</p>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Pass / Fail Analysis" description="Quick health snapshot">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Pass" value={reportAnalytics.passed} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
                    <MetricCard label="Fail" value={reportAnalytics.failed} icon={<AlertTriangle className="h-4 w-4 text-rose-500" />} />
                  </div>
                </Panel>
              </div>
            </div>
          )}
        </Panel>
      )}

      {reportPreviewOpen && reportPreviewStudent && selectedExam && (
        <PrintableReportCard
          isOpen={reportPreviewOpen}
          student={reportPreviewStudent}
          exam={selectedExam}
          onClose={() => setReportPreviewOpen(false)}
          schoolProfile={schoolProfile}
        />
      )}
    </div>
  );
};

export default ExaminationView;
