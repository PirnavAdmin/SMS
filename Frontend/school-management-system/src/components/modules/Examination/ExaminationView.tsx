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
  Edit,
  FileText,
  Lock,
  Unlock,
  Printer,
  Plus,
  Save,
  Send,
  Sparkles,
  Star,
  Upload,
  Search,
  Trash2,
  User,
  X,
  ChevronDown,
  Filter,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { PrintableReportCard } from './PrintableReportCard';
import { ExamSetup, GradeConfig, Student } from '../../../types';

type MainTab = 'setup' | 'evaluation' | 'results';
type SetupSubTab = 'general' | 'subjects' | 'review' | 'publish' | 'grades';

interface ExaminationViewProps {
  initialTab?: MainTab;
}

interface SetupFormState {
  name: string;
  examType: NonNullable<ExamSetup['examType']>;
  campus: string;
  className: string;
  applicableClasses: string[];
  section: string;
  applicableSections: string[];
  subjects: string[];
  passPercentage: number;
  startDate: string;
  endDate: string;
  status: ExamSetup['status'];
}

export interface EditableScheduleRow {
  id: string;
  examId: string;
  academicYear?: string;
  branch?: string;
  className?: string;
  section?: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  invigilatorName: string;
  questionPaperName?: string;
  questionPaperUrl?: string;
  status: 'Scheduled' | 'Draft' | 'Conflict';
}

interface EvaluationRowState {
  attendance: 'Present' | 'Absent';
  marks: string;
  remarks: string;
  status: 'Draft' | 'Submitted';
}

interface PerformanceRow {
  student: Student;
  rollNo: string;
  studentName: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  passFail: 'Pass' | 'Fail';
  status: 'Draft' | 'Published' | 'Locked';
}

export interface StudentSubjectMark {
  subject: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
  isPass: boolean;
}

export interface OverallStudentResult {
  student: Student;
  rollNo: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  subjectMarks: StudentSubjectMark[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  overallGrade: string;
  overallResult: 'PASS' | 'FAIL';
  rank: number;
  status: 'Draft' | 'Published' | 'Locked';
}

interface PanelProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

interface InvigilatorOption {
  id: string;
  empId: string;
  name: string;
  formatted: string;
}

const MAIN_TABS: Array<{
  id: MainTab;
  label: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'setup', label: 'Exam Setup', helper: 'Guided subject scheduling & timetable preview', icon: Award },
  { id: 'evaluation', label: 'Evaluation', helper: 'Teacher marks entry & auto grade calculation', icon: ClipboardList },
  { id: 'results', label: 'Results', helper: 'Review, publish, lock & export report cards', icon: BarChart3 }
];

const SETUP_TABS: Array<{
  id: SetupSubTab;
  label: string;
  step: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'general', label: '1. General', step: 'Step 1', icon: Award },
  { id: 'subjects', label: '2. Subject Scheduling', step: 'Step 2', icon: CalendarDays },
  { id: 'review', label: '3. Timetable Preview', step: 'Step 3', icon: Eye },
  { id: 'publish', label: '4. Publish & Export', step: 'Step 4', icon: Send },
  { id: 'grades', label: 'Grade Rules', step: 'Rules', icon: Star }
];

const FALLBACK_EXAM: ExamSetup = {
  id: 'EXM-01',
  name: 'Mid-Term Examination 2026',
  academicYear: '2026-2027',
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
  { id: 'GRD-1', academicYear: '2026-2027', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'A+', gradeName: 'A+', minPercent: 90, maxPercent: 100, minMark: 90, maxMark: 100, gradePoints: 10, gradePoint: 10, passCriteria: 'Pass' },
  { id: 'GRD-2', academicYear: '2026-2027', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'A', gradeName: 'A', minPercent: 80, maxPercent: 89, minMark: 80, maxMark: 89, gradePoints: 9, gradePoint: 9, passCriteria: 'Pass' },
  { id: 'GRD-3', academicYear: '2026-2027', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'B+', gradeName: 'B+', minPercent: 70, maxPercent: 79, minMark: 70, maxMark: 79, gradePoints: 8, gradePoint: 8, passCriteria: 'Pass' },
  { id: 'GRD-4', academicYear: '2026-2027', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'B', gradeName: 'B', minPercent: 60, maxPercent: 69, minMark: 60, maxMark: 69, gradePoints: 7, gradePoint: 7, passCriteria: 'Pass' },
  { id: 'GRD-5', academicYear: '2026-2027', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'C', gradeName: 'C', minPercent: 50, maxPercent: 59, minMark: 50, maxMark: 59, gradePoints: 6, gradePoint: 6, passCriteria: 'Pass' },
  { id: 'GRD-6', academicYear: '2026-2027', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'D', gradeName: 'D', minPercent: 33, maxPercent: 49, minMark: 33, maxMark: 49, gradePoints: 4, gradePoint: 4, passCriteria: 'Pass' },
  { id: 'GRD-7', academicYear: '2026-2027', branch: 'All Branches', schemeName: 'Default Scholastic', grade: 'F', gradeName: 'F', minPercent: 0, maxPercent: 32, minMark: 0, maxMark: 32, gradePoints: 0, gradePoint: 0, passCriteria: 'Fail' }
];

const panelClass = 'rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400';
const selectClass = inputClass;
const primaryButtonClass = 'inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-black text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm';
const outlineButtonClass = 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50';
const tableHeaderClass = 'sticky top-0 z-10 bg-slate-50/95 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800/95 dark:text-slate-300';

function Panel({ title, action, className = '', children }: PanelProps) {
  return (
    <section className={`${panelClass} ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const getClassSections = (className: string, academicClasses: ReturnType<typeof useData>['academicClasses']) => {
  const matched = academicClasses.find(cls => cls.name === className);
  if (matched?.sections?.length) return matched.sections;
  return ['A', 'B'];
};

const getClassSubjects = (
  className: string,
  academicClasses: ReturnType<typeof useData>['academicClasses'],
  subjects: ReturnType<typeof useData>['subjects']
) => {
  const matched = academicClasses.find(cls => cls.name === className);
  let rawList: string[] = [];
  if (matched?.subjects?.length) {
    rawList = matched.subjects;
  } else {
    const activeSubjects = subjects.filter(sub => sub.status === 'Active').map(sub => sub.name);
    if (activeSubjects.length > 0) rawList = activeSubjects;
    else rawList = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Biology', 'Social Studies', 'Computer Science', 'Hindi'];
  }

  const seen = new Set<string>();
  const uniqueList: string[] = [];
  rawList.forEach(s => {
    if (s && !seen.has(s.trim().toLowerCase())) {
      seen.add(s.trim().toLowerCase());
      uniqueList.push(s.trim().charAt(0).toUpperCase() + s.trim().slice(1));
    }
  });
  return uniqueList;
};

function calculateDurationLabel(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '—';
  const parseMinutes = (t: string) => {
    const parts = t.trim().split(':');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };
  const startMins = parseMinutes(startTime);
  const endMins = parseMinutes(endTime);
  if (endMins <= startMins) return 'Invalid Time';
  const diff = endMins - startMins;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr ${mins} min`;
}

function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '—';
  const clean = dateStr.trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      } else if (parts[2].length === 4) {
        return clean;
      }
    }
  } else if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}-${parts[2]}`;
      }
    }
  }
  return clean;
}

function calculateGrade(percentage: number, gradeRules: GradeConfig[]): string {
  const matched = gradeRules.find(c => percentage >= (c.minMark ?? (c as any).minPercent ?? 0) && percentage <= (c.maxMark ?? (c as any).maxPercent ?? 100));
  if (matched) return matched.grade || (matched as any).gradeName || 'A';
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
}

export const getSubjectCode = (subName: string, subjectsList: Array<any> = []): string => {
  if (!subName) return 'SUB101';
  if (subName.includes(' - ')) return subName.split(' - ')[0].trim();

  const match = subjectsList.find(s =>
    s.name?.toLowerCase() === subName.toLowerCase() ||
    s.code?.toLowerCase() === subName.toLowerCase()
  );
  if (match?.code) return match.code;

  const lower = subName.toLowerCase();
  if (lower.includes('math')) return 'MAT101';
  if (lower.includes('english') || lower.includes('eng')) return 'ENG101';
  if (lower.includes('physics') || lower.includes('phy')) return 'PHY101';
  if (lower.includes('chem')) return 'CHEM101';
  if (lower.includes('bio')) return 'BIO101';
  if (lower.includes('sci')) return 'SCI101';
  if (lower.includes('soc')) return 'SOC101';
  if (lower.includes('hin')) return 'HIN101';
  if (lower.includes('computer') || lower.includes('comp')) return 'COMP101';

  return `${subName.substring(0, 3).toUpperCase()}101`;
};

export const formatSubject = (subName: string, subjectsList: Array<any> = []): string => {
  if (!subName) return '';
  if (subName.includes(' - ')) return subName;
  const code = getSubjectCode(subName, subjectsList);
  return `${code} - ${subName}`;
};

export const formatInvigilator = (invName: string, staffList: Array<any> = [], index: number = 0): string => {
  if (!invName) return 'EMP001 - TBA';
  if (invName.includes(' - ')) return invName;

  const match = staffList.find(s => {
    const fullName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
    return fullName.toLowerCase() === invName.toLowerCase() ||
           s.empId?.toLowerCase() === invName.toLowerCase() ||
           s.id === invName;
  });

  if (match) {
    const empId = match.empId || match.id || `EMP${String(index + 1).padStart(3, '0')}`;
    const name = match.name || `${match.firstName || ''} ${match.lastName || ''}`.trim() || invName;
    return `${empId} - ${name}`;
  }

  const generatedId = `EMP${String((index % 30) + 1).padStart(3, '0')}`;
  return `${generatedId} - ${invName}`;
};

const normalizeClassKey = (className: string) => (className || '').trim().toLowerCase();

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
  const applicableClasses = exam.applicableClasses && exam.applicableClasses.length > 0
    ? exam.applicableClasses
    : [className];
  const applicableSections = exam.sections && exam.sections.length > 0
    ? exam.sections
    : [exam.sections?.[0] || classSections[0] || 'A'];

  return {
    name: exam.name,
    examType: exam.examType || 'Half-Yearly',
    campus: exam.branch || 'Main Campus',
    className: '',
    applicableClasses,
    section: '',
    applicableSections,
    subjects: [...classSubjects],
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
  if (status === 'Published' || status === 'Results Published') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (status === 'Locked') return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  if (status === 'Submitted') return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
  return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
};

// Question Paper Preview Modal Component
function QuestionPaperPreviewModal({
  isOpen,
  onClose,
  subject,
  fileName,
  fileUrl,
  examName,
  className,
  schoolName
}: {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  fileName: string;
  fileUrl?: string;
  examName: string;
  className: string;
  schoolName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <FileText className="w-5 h-5" />
            Uploaded Question Paper Preview ({subject})
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-sky-500 tracking-widest">{subject} • {className}</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{fileName || `${subject}_Paper.pdf`}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Attached Document for {examName}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Attached File
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 min-h-[400px] flex flex-col items-center justify-center">
          {fileUrl ? (
            <iframe
              src={fileUrl}
              title={fileName}
              className="w-full h-[500px] rounded-xl border border-slate-300 dark:border-slate-800 bg-white"
            />
          ) : (
            <div className="w-full space-y-4 p-6 bg-white text-slate-900 rounded-xl border shadow-sm text-center">
              <p className="text-xs font-bold text-slate-600">Displaying document: <strong>{fileName}</strong></p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {fileUrl ? (
            <a
              href={fileUrl}
              download={fileName}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" /> Download File ({fileName})
            </a>
          ) : (
            <button
              onClick={() => alert(`Downloading ${fileName}...`)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" /> Download File ({fileName})
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Searchable Invigilator Select Component
function SearchableInvigilatorSelect({
  value,
  onChange,
  teacherOptions
}: {
  value: string;
  onChange: (val: string) => void;
  teacherOptions: InvigilatorOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    return (teacherOptions || []).filter(t => {
      if (!t) return false;
      const formatted = (t.formatted || '').toLowerCase();
      const empId = (t.empId || '').toLowerCase();
      const name = (t.name || '').toLowerCase();
      return formatted.includes(q) || empId.includes(q) || name.includes(q);
    });
  }, [teacherOptions, search]);

  return (
    <div ref={wrapperRef} className="relative w-52">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none text-left flex items-center justify-between shadow-sm hover:border-slate-300 transition"
      >
        <span className="truncate">{value ? (value.includes(' - ') ? value : formatInvigilator(value, teacherOptions)) : 'Select Invigilator'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-1.5 max-h-56 overflow-y-auto min-w-[220px]">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search by EMP ID or Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-1">
            <button
              type="button"
              onClick={() => {
                onChange('EMP001 - TBA');
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              — Unassigned (TBA) —
            </button>

            {filtered.map(t => (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  onChange(t.formatted || t.name || 'EMP001 - TBA');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 text-[11px] font-bold rounded-lg transition ${
                  value === t.formatted || value === t.name
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t.formatted || t.name || 'EMP001 - TBA'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom DatePickerInput displaying date in DD-MM-YYYY format inside the input box
function DatePickerInput({
  value,
  onChange,
  className = ''
}: {
  value: string;
  onChange: (newDateStr: string) => void;
  className?: string;
}) {
  const hiddenNativeRef = useRef<HTMLInputElement>(null);
  const displayVal = formatDateDDMMYYYY(value);

  let isoVal = value;
  if (value && value.includes('-')) {
    const parts = value.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      isoVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        value={displayVal}
        placeholder="DD-MM-YYYY"
        onChange={e => onChange(e.target.value)}
        className={`${className} pr-7 font-mono w-full`}
      />
      <button
        type="button"
        onClick={() => {
          if (hiddenNativeRef.current) {
            if (typeof hiddenNativeRef.current.showPicker === 'function') {
              hiddenNativeRef.current.showPicker();
            } else {
              hiddenNativeRef.current.click();
            }
          }
        }}
        className="absolute right-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-0.5"
        title="Calendar Date Picker"
      >
        <CalendarDays className="w-3.5 h-3.5" />
      </button>
      <input
        ref={hiddenNativeRef}
        type="date"
        value={isoVal}
        onChange={e => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        className="sr-only opacity-0 w-0 h-0 absolute pointer-events-none"
      />
    </div>
  );
}

// Printable Timetable Modal Component
function PrintableTimetableModal({
  isOpen,
  onClose,
  schoolName,
  academicYear,
  branch,
  examName,
  classes,
  sections,
  schedules
}: {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  academicYear: string;
  branch: string;
  examName: string;
  classes: string[];
  sections: string[];
  schedules: EditableScheduleRow[];
}) {
  if (!isOpen) return null;
  const targetClasses = classes.length > 0 ? classes : ['Class 9'];
  const targetSections = sections.length > 0 ? sections : ['A'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-indigo-600">
            <Printer className="w-5 h-5" />
            Official Examination Timetable ({targetClasses.length} Target Classes)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" /> Print Timetable
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
              Close
            </button>
          </div>
        </div>

        <div className="space-y-8 p-6 border rounded-2xl bg-white text-slate-900" id="printable-exam-timetable">
          <div className="text-center space-y-1 border-b pb-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{schoolName}</h2>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{branch} • Academic Session {academicYear}</p>
            <h3 className="text-base font-extrabold text-slate-800 pt-1">{examName}</h3>
            <p className="text-xs text-slate-500 font-medium">
              Target Classes: <span className="font-bold text-slate-900">{targetClasses.join(', ')}</span> | Target Sections: <span className="font-bold text-slate-900">{targetSections.join(', ')}</span>
            </p>
          </div>

          {targetClasses.map(clsName => {
            const rowsToDisplay = schedules.filter(r =>
              (r.className || targetClasses[0]) === clsName &&
              targetSections.includes(r.section || targetSections[0])
            );

            return (
              <div key={clsName} className="space-y-3 border-b pb-6 last:border-b-0 border-slate-200">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-300">
                  <h4 className="text-sm font-black uppercase text-indigo-900">{clsName} Examination Timetable</h4>
                  <span className="text-[11px] font-bold text-slate-500">{rowsToDisplay.length} Subjects</span>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                      <th className="border border-slate-300 px-3 py-2">Subject</th>
                      <th className="border border-slate-300 px-3 py-2">Exam Date</th>
                      <th className="border border-slate-300 px-3 py-2">Start Time</th>
                      <th className="border border-slate-300 px-3 py-2">End Time</th>
                      <th className="border border-slate-300 px-3 py-2">Duration</th>
                      <th className="border border-slate-300 px-3 py-2">Room</th>
                      <th className="border border-slate-300 px-3 py-2">Invigilator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsToDisplay.length === 0 && (
                      <tr className="border border-slate-300 font-medium">
                        <td colSpan={7} className="border border-slate-300 px-3 py-6 text-center text-slate-500">
                          No timetable rows match this class and section filter.
                        </td>
                      </tr>
                    )}
                    {rowsToDisplay.map((item, idx) => (
                      <tr key={item.id || idx} className="border border-slate-300 font-medium">
                        <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900">{formatSubject(item.subject)}</td>
                        <td className="border border-slate-300 px-3 py-2 font-mono">{formatDateDDMMYYYY(item.date)}</td>
                        <td className="border border-slate-300 px-3 py-2">{item.startTime}</td>
                        <td className="border border-slate-300 px-3 py-2">{item.endTime}</td>
                        <td className="border border-slate-300 px-3 py-2">{calculateDurationLabel(item.startTime, item.endTime)}</td>
                        <td className="border border-slate-300 px-3 py-2 font-bold text-indigo-700">{item.room || 'TBA'}</td>
                        <td className="border border-slate-300 px-3 py-2">{formatInvigilator(item.invigilatorName, [], idx)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const ExaminationView: React.FC<ExaminationViewProps> = ({ initialTab = 'setup' }) => {
  const { exams, students, staff, academicClasses, subjects, examSchedules, questionPapers, gradeConfigurations, schoolProfile } = useData();
  const { user, selectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();

  const fallbackBranch = selectedBranch || user?.branch || 'Main Campus';
  const normalizedExams = useMemo(
    () => (exams.length > 0 ? exams : [FALLBACK_EXAM]).map(exam => normalizeExam(exam, fallbackBranch)),
    [exams, fallbackBranch]
  );

  const [workflowExams, setWorkflowExams] = useState<ExamSetup[]>(() => {
    const saved = localStorage.getItem('custom_exams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return normalizedExams;
  });

  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [activeTab, setActiveTab] = useState<MainTab>(initialTab);
  const [setupSubTab, setSetupSubTab] = useState<SetupSubTab>('general');

  const [setupForm, setSetupForm] = useState<SetupFormState>(() => buildSetupForm(normalizedExams[0] || FALLBACK_EXAM, academicClasses, subjects));
  const [gradeRules, setGradeRules] = useState<GradeConfig[]>(() => buildGradeRules(normalizedExams[0] || FALLBACK_EXAM, gradeConfigurations));

  const handleUpdateGradeRule = (id: string, updates: Partial<GradeConfig>) => {
    setGradeRules(prev => prev.map(rule => (rule.id === id ? { ...rule, ...updates } : rule)));
  };

  const handleAddGradeRule = () => {
    const newRule: GradeConfig = {
      id: `GR-${Date.now()}`,
      grade: 'A*',
      minMark: 95,
      maxMark: 100,
      gradePoint: 10,
      passCriteria: 'Pass',
      description: 'Outstanding'
    };
    setGradeRules(prev => [newRule, ...prev]);
    addToast('info', 'Grade Rule Added', 'New grade rule added. Edit percentage boundaries as needed.');
  };

  const handleDeleteGradeRule = (id: string) => {
    if (gradeRules.length <= 1) {
      addToast('warning', 'Cannot Remove', 'At least one grade rule must remain.');
      return;
    }
    setGradeRules(prev => prev.filter(rule => rule.id !== id));
    addToast('info', 'Grade Rule Removed', 'Grade rule removed.');
  };

  // Schedule Rows State
  const [scheduleRows, setScheduleRows] = useState<EditableScheduleRow[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [bulkRoom, setBulkRoom] = useState('');
  const [isScheduleTableEditing, setScheduleTableEditing] = useState(false);
  const [printScheduleOpen, setPrintScheduleOpen] = useState(false);
  const [printScheduleScope, setPrintScheduleScope] = useState<{ classes: string[]; sections: string[] } | null>(null);

  // Question Paper Preview & Upload States
  const [previewPaperModalOpen, setPreviewPaperModalOpen] = useState(false);
  const [previewPaperSubject, setPreviewPaperSubject] = useState('');
  const [previewPaperFileName, setPreviewPaperFileName] = useState('');
  const [previewPaperFileUrl, setPreviewPaperFileUrl] = useState<string | undefined>(undefined);

  const rowPaperInputRef = useRef<HTMLInputElement>(null);
  const [targetRowForUpload, setTargetRowForUpload] = useState<{ id: string; subject: string } | null>(null);

  // Review & Audit Filter States
  const [auditClassFilter, setAuditClassFilter] = useState<string>('All');
  const [auditSectionFilter, setAuditSectionFilter] = useState<string>('All');

  // Evaluation & Results Filter States
  const [evalClass, setEvalClass] = useState<string>('Class 10');
  const [evalSection, setEvalSection] = useState<string>('A');
  const [evalSubject, setEvalSubject] = useState<string>('Mathematics');
  const [evalStudentSearch, setEvalStudentSearch] = useState<string>('');

  // Evaluation Sheet State (Simple Key Value)
  const [evalSheetState, setEvalSheetState] = useState<Record<string, EvaluationRowState>>({});

  // Results State
  const [isResultsLocked, setIsResultsLocked] = useState(false);
  const [isResultsPublished, setIsResultsPublished] = useState(false);
  const [selectedReportCardStudent, setSelectedReportCardStudent] = useState<Student | null>(null);
  const [reportCardModalOpen, setReportCardModalOpen] = useState(false);
  const [selectedResultModalData, setSelectedResultModalData] = useState<OverallStudentResult | null>(null);
  const [isViewResultModalOpen, setIsViewResultModalOpen] = useState(false);

  const teacherOptions = useMemo<InvigilatorOption[]>(() => {
    return Array.from(
      new Map(
        staff
          .filter(person => person.status === 'Active')
          .map((person, index) => {
            const name = person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'TBA';
            const empId = person.empId || person.id || `EMP${String(index + 1).padStart(3, '0')}`;
            return [person.id || empId, { id: person.id || empId, empId, name, formatted: `${empId} - ${name}` }];
          })
      ).values()
    );
  }, [staff]);

  const selectedExam = useMemo(
    () => workflowExams.find(exam => exam.id === selectedExamId) || null,
    [workflowExams, selectedExamId]
  );

  const examOptions = workflowExams;

  const classOptions = useMemo(() => {
    const names = new Map<string, string>();
    academicClasses.forEach(cls => {
      if (cls.name) names.set(normalizeClassKey(cls.name), cls.name.trim());
    });
    students.forEach(student => {
      if (student.className) {
        const key = normalizeClassKey(student.className);
        if (!names.has(key)) names.set(key, student.className.trim());
      }
    });
    return Array.from(names.values()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [academicClasses, students]);

  const selectedClassSubjects = useMemo(() => {
    if (!setupForm.className) return ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science'];
    return getClassSubjects(setupForm.className, academicClasses, subjects);
  }, [setupForm.className, academicClasses, subjects]);

  const filteredSubjects = useMemo(() => {
    return selectedClassSubjects.filter(sub => sub.toLowerCase().includes(subjectSearch.toLowerCase()));
  }, [selectedClassSubjects, subjectSearch]);

  // Initial schedule seed on exam change
  useEffect(() => {
    if (!selectedExamId) {
      setSetupForm({
        name: '',
        examType: '' as any,
        campus: selectedBranch || 'Main Campus',
        className: '',
        applicableClasses: [],
        section: '',
        applicableSections: [],
        subjects: [],
        passPercentage: 33,
        startDate: '',
        endDate: '',
        status: 'Draft'
      });
      setScheduleRows([]);
      setGradeRules(FALLBACK_GRADE_RULES);
      return;
    }

    const currentExam = workflowExams.find(exam => exam.id === selectedExamId);
    if (!currentExam) return;

    setSetupForm(buildSetupForm(currentExam, academicClasses, subjects));
    setGradeRules(buildGradeRules(currentExam, gradeConfigurations));

    const existing = examSchedules.filter(s => s.examId === currentExam.id);
    const seenSubjects = new Set<string>();
    const deduplicatedRows: EditableScheduleRow[] = [];

    existing.forEach((s, idx) => {
      const key = (s.subject || '').trim().toLowerCase();
      if (key && !seenSubjects.has(key)) {
        seenSubjects.add(key);
        const formattedSub = s.subject.charAt(0).toUpperCase() + s.subject.slice(1);
        deduplicatedRows.push({
          id: s.id || `SCH-${idx}`,
          examId: currentExam.id,
          academicYear: selectedAcademicYear,
          branch: selectedBranch,
          className: currentExam.className,
          section: currentExam.sections?.[0] || 'A',
          subject: formattedSub,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room || 'Room 101',
          invigilatorName: s.invigilatorName || teacherOptions[idx % (teacherOptions.length || 1)]?.name || 'TBA',
          status: 'Scheduled'
        });
      }
    });

    const startDateObj = currentExam.startDate ? new Date(currentExam.startDate) : new Date();
    let currentDate = new Date(startDateObj);
    currentDate.setDate(currentDate.getDate() + deduplicatedRows.length);

    const initialClassSubjects = getClassSubjects(currentExam.className || 'Class 10', academicClasses, subjects);
    initialClassSubjects.forEach((sub, idx) => {
      const key = sub.trim().toLowerCase();
      if (!seenSubjects.has(key)) {
        seenSubjects.add(key);
        if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);
        const dateStr = currentDate.toISOString().split('T')[0];
        currentDate.setDate(currentDate.getDate() + 1);

        deduplicatedRows.push({
          id: `SCH-${Date.now()}-${idx}`,
          examId: currentExam.id,
          academicYear: selectedAcademicYear,
          branch: selectedBranch,
          className: currentExam.className,
          section: currentExam.sections?.[0] || 'A',
          subject: sub,
          date: dateStr,
          startTime: '09:00',
          endTime: '10:30',
          room: 'Room 101',
          invigilatorName: teacherOptions[(deduplicatedRows.length + idx) % (teacherOptions.length || 1)]?.name || 'TBA',
          status: 'Scheduled'
        });
      }
    });

    setScheduleRows(deduplicatedRows);
    setSetupForm(prev => ({
      ...prev,
      subjects: Array.from(seenSubjects).map(key => {
        const match = initialClassSubjects.find(s => s.toLowerCase() === key);
        return match || key.charAt(0).toUpperCase() + key.slice(1);
      })
    }));
  }, [selectedExamId, academicClasses, gradeConfigurations, questionPapers, subjects, workflowExams, selectedAcademicYear, selectedBranch, teacherOptions]);

  // Sync Evaluation defaults
  useEffect(() => {
    if (setupForm.className) setEvalClass(setupForm.className);
    if (setupForm.applicableSections[0]) setEvalSection(setupForm.applicableSections[0]);
    if (setupForm.subjects[0]) setEvalSubject(setupForm.subjects[0]);
  }, [setupForm.className, setupForm.applicableSections, setupForm.subjects]);

  // Evaluation Roster Students
  const evalRosterStudents = useMemo(() => {
    return students.filter(s => s.className === evalClass && (evalSection === 'All' || !s.section || s.section === evalSection));
  }, [students, evalClass, evalSection]);

  // Initialize Evaluation Rows preserving saved draft and defaulting marks to 0
  const evalStorageKey = `eval_marks_${selectedExamId}_${evalClass}_${evalSection}_${evalSubject}`;

  useEffect(() => {
    let savedState: Record<string, EvaluationRowState> = {};
    try {
      const savedJson = localStorage.getItem(evalStorageKey);
      if (savedJson) savedState = JSON.parse(savedJson);
    } catch (e) {
      console.error(e);
    }

    setEvalSheetState(prev => {
      const newSheet: Record<string, EvaluationRowState> = {};
      evalRosterStudents.forEach(student => {
        if (savedState[student.id]) {
          newSheet[student.id] = savedState[student.id];
        } else if (prev[student.id]) {
          newSheet[student.id] = prev[student.id];
        } else {
          newSheet[student.id] = {
            attendance: 'Present',
            marks: '0',
            remarks: 'Good performance',
            status: 'Draft'
          };
        }
      });
      return newSheet;
    });
  }, [evalRosterStudents, evalStorageKey]);

  // Compact 4 Summary Metrics for Evaluation Module
  const evalMetrics = useMemo(() => {
    const total = evalRosterStudents.length;
    let present = 0;
    let absent = 0;
    let sumMarks = 0;

    evalRosterStudents.forEach(st => {
      const r = evalSheetState[st.id];
      if (r?.attendance === 'Absent') {
        absent++;
      } else {
        present++;
        sumMarks += Number(r?.marks) || 0;
      }
    });

    const avg = present > 0 ? (sumMarks / present).toFixed(1) : '0';
    return { total, present, absent, avg };
  }, [evalRosterStudents, evalSheetState]);

  // Overall Student Results Computation (One Row Per Student across entire Examination)
  const overallResultsState = useMemo<OverallStudentResult[]>(() => {
    const roster = students.filter(s =>
      s.className === evalClass && (evalSection === 'All' || !s.section || s.section === evalSection)
    );

    const subjectsToUse = selectedClassSubjects.length > 0
      ? selectedClassSubjects
      : ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science'];

    const computedList = roster.map((student, idx) => {
      const rollNo = student.rollNo || (2030 + idx + 1).toString();
      const admissionNo = student.admissionNo || student.empId || `A${1020 + idx + 1}`;
      const studentName = `${student.firstName} ${student.lastName}`.trim();

      let totalObtained = 0;
      const totalMax = subjectsToUse.length * 100;
      let hasFail = false;

      const subjectMarks: StudentSubjectMark[] = subjectsToUse.map((subject, sIdx) => {
        const maxMarks = 100;
        const r = evalSheetState[student.id];
        let obtained = 0;
        if (r && r.attendance === 'Absent') {
          obtained = 0;
        } else if (r && subject === evalSubject && r.marks !== undefined) {
          obtained = Math.min(100, Math.max(0, Number(r.marks) || 0));
        } else {
          const baseScore = 78 + ((idx * 7 + sIdx * 5 + student.id.length * 3) % 20);
          obtained = Math.min(100, Math.max(30, baseScore));
        }

        const grade = calculateGrade(obtained, gradeRules);
        const isPass = obtained >= (setupForm.passPercentage || 33);
        if (!isPass) hasFail = true;
        totalObtained += obtained;

        return {
          subject,
          maxMarks,
          obtainedMarks: obtained,
          grade,
          isPass
        };
      });

      const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
      const overallGrade = calculateGrade(percentage, gradeRules);
      const overallResult: 'PASS' | 'FAIL' = (!hasFail && percentage >= (setupForm.passPercentage || 33)) ? 'PASS' : 'FAIL';
      const status: 'Draft' | 'Published' | 'Locked' = isResultsLocked ? 'Locked' : isResultsPublished ? 'Published' : 'Draft';

      return {
        student,
        rollNo,
        admissionNo,
        studentName,
        className: student.className,
        section: student.section || evalSection || 'A',
        subjectMarks,
        totalObtained,
        totalMax,
        percentage,
        overallGrade,
        overallResult,
        rank: 1,
        status
      };
    });

    const sorted = [...computedList].sort((a, b) => b.totalObtained - a.totalObtained);
    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    return sorted;
  }, [students, evalClass, evalSection, selectedClassSubjects, evalSheetState, evalSubject, gradeRules, setupForm.passPercentage, isResultsLocked, isResultsPublished]);

  // Search filter across Roll No, Admission No, Student Name
  const filteredOverallResults = useMemo(() => {
    if (!evalStudentSearch.trim()) return overallResultsState;
    const q = evalStudentSearch.toLowerCase().trim();
    return overallResultsState.filter(r =>
      r.studentName.toLowerCase().includes(q) ||
      r.rollNo.toLowerCase().includes(q) ||
      r.admissionNo.toLowerCase().includes(q)
    );
  }, [overallResultsState, evalStudentSearch]);

  // Overall Metrics for Summary Cards
  const resultsMetrics = useMemo(() => {
    const total = overallResultsState.length;
    const passCount = overallResultsState.filter(r => r.overallResult === 'PASS').length;
    const failCount = overallResultsState.filter(r => r.overallResult === 'FAIL').length;
    const publishedCount = overallResultsState.filter(r => r.status === 'Published').length;
    const sumPercent = overallResultsState.reduce((sum, r) => sum + r.percentage, 0);
    const avgPercent = total > 0 ? (sumPercent / total).toFixed(1) : '0';

    return { total, passCount, failCount, publishedCount, avgPercent };
  }, [overallResultsState]);

  // Handlers for Setup Module
  const handleToggleSubject = (subject: string) => {
    const isCurrentlySelected = setupForm.subjects.includes(subject);
    const nextSubjects = isCurrentlySelected
      ? setupForm.subjects.filter(s => s !== subject)
      : [...setupForm.subjects, subject];

    setSetupForm(prev => ({ ...prev, subjects: nextSubjects }));

    if (isCurrentlySelected) {
      setScheduleRows(prev => prev.filter(r => r.subject !== subject));
    } else {
      const startDateObj = setupForm.startDate ? new Date(setupForm.startDate) : new Date();
      let currentDate = new Date(startDateObj);
      currentDate.setDate(currentDate.getDate() + scheduleRows.length);
      if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);

      const newRow: EditableScheduleRow = {
        id: `SCH-${Date.now()}-${scheduleRows.length}`,
        examId: selectedExamId,
        academicYear: selectedAcademicYear,
        branch: selectedBranch,
        className: setupForm.className,
        section: setupForm.section,
        subject,
        date: currentDate.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:30',
        room: 'Room 101',
        invigilatorName: teacherOptions[scheduleRows.length % (teacherOptions.length || 1)]?.name || 'TBA',
        status: 'Scheduled'
      };
      setScheduleRows(prev => [...prev, newRow]);
    }
  };

  const handleSelectAllSubjects = () => {
    setSetupForm(prev => ({ ...prev, subjects: [...selectedClassSubjects] }));

    const startDateObj = setupForm.startDate ? new Date(setupForm.startDate) : new Date();
    let currentDate = new Date(startDateObj);

    const generated: EditableScheduleRow[] = selectedClassSubjects.map((sub, idx) => {
      if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);
      const dateStr = currentDate.toISOString().split('T')[0];
      currentDate.setDate(currentDate.getDate() + 1);

      return {
        id: `SCH-${Date.now()}-${idx}`,
        examId: selectedExamId,
        academicYear: selectedAcademicYear,
        branch: selectedBranch,
        className: setupForm.className,
        section: setupForm.section,
        subject: sub,
        date: dateStr,
        startTime: '09:00',
        endTime: '10:30',
        room: 'Room 101',
        invigilatorName: teacherOptions[idx % (teacherOptions.length || 1)]?.name || 'TBA',
        status: 'Scheduled'
      };
    });

    setScheduleRows(generated);
  };

  const handleClearAllSubjects = () => {
    setSetupForm(prev => ({ ...prev, subjects: [] }));
    setScheduleRows([]);
  };

  const handleCreateNewExam = () => {
    const newId = `EXM-${Date.now().toString().slice(-4)}`;
    const defaultClassName = classOptions[0] || 'Class 10';
    const newExam: ExamSetup = {
      id: newId,
      name: `Quarterly Examination ${workflowExams.length + 1}`,
      academicYear: selectedAcademicYear,
      className: defaultClassName,
      applicableClasses: [defaultClassName],
      sections: ['A'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'Scheduled',
      branch: selectedBranch,
      examType: 'Quarterly',
      publishStatus: 'Draft',
      gradeSchemeName: 'Default Scholastic',
      marksConfig: {
        maxMarks: 100,
        passMarks: 33,
        subjectWiseConfig: {}
      }
    };

    const updated = [newExam, ...workflowExams];
    setWorkflowExams(updated);
    localStorage.setItem('custom_exams', JSON.stringify(updated));
    setSelectedExamId(newId);
    setSetupSubTab('general');
    addToast('success', 'New Exam Created', `Started setup for ${newExam.name}.`);
  };

  const updateScheduleRowItem = (id: string, updates: Partial<EditableScheduleRow>) => {
    setScheduleRows(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...updates };
      return updated;
    });
  };

  const triggerRowPaperUpload = (rowId: string, subject: string) => {
    setTargetRowForUpload({ id: rowId, subject });
    rowPaperInputRef.current?.click();
  };

  const handleRowPaperFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetRowForUpload) return;
    const fileName = file.name;
    const fileUrl = URL.createObjectURL(file);
    updateScheduleRowItem(targetRowForUpload.id, {
      questionPaperName: fileName,
      questionPaperUrl: fileUrl
    });
    addToast('success', 'Question Paper Attached', `${fileName} attached to ${targetRowForUpload.subject}.`);
    setTargetRowForUpload(null);
    if (e.target) e.target.value = '';
  };

  const handleBulkAssignRoom = () => {
    if (!bulkRoom.trim()) return;
    setScheduleRows(prev => prev.map(r => ({ ...r, room: bulkRoom.trim() })));
    addToast('info', 'Bulk Action Complete', `Assigned room ${bulkRoom} to all subjects.`);
    setBulkRoom('');
  };

  const handleAutoGenerateTimeSlots = () => {
    setScheduleRows(prev => prev.map((r, idx) => {
      const slot = idx % 2 === 0 ? { startTime: '09:00', endTime: '10:30' } : { startTime: '11:00', endTime: '12:30' };
      return { ...r, ...slot };
    }));
    addToast('info', 'Time Slots Auto-Generated', 'Assigned standard morning time slots to all subjects.');
  };

  const handleClearSchedule = () => {
    setScheduleRows([]);
    setSetupForm(prev => ({ ...prev, subjects: [] }));
    addToast('warning', 'Schedule Cleared', 'Cleared all generated schedule rows.');
  };

  const handleSaveSetup = () => {
    if (!setupForm.name.trim()) {
      addToast('warning', 'Validation Warning', 'Please enter an exam name.');
      return;
    }
    const updatedExam: ExamSetup = {
      ...(selectedExam || FALLBACK_EXAM),
      name: setupForm.name.trim(),
      examType: setupForm.examType,
      branch: selectedBranch,
      academicYear: selectedAcademicYear,
      className: setupForm.applicableClasses[0] || setupForm.className,
      applicableClasses: setupForm.applicableClasses,
      sections: setupForm.applicableSections,
      startDate: setupForm.startDate,
      endDate: setupForm.endDate,
      status: setupForm.status
    };

    setWorkflowExams(prev => prev.map(exam => (exam.id === selectedExamId ? updatedExam : exam)));
    addToast('success', 'Exam Setup Saved', `${updatedExam.name} configuration updated.`);
  };

  const handlePublishSchedule = () => {
    const updatedExam: ExamSetup = {
      ...(selectedExam || FALLBACK_EXAM),
      status: 'Scheduled',
      publishStatus: 'Published'
    };
    setWorkflowExams(prev => prev.map(exam => (exam.id === selectedExamId ? updatedExam : exam)));
    addToast('success', 'Schedule Published', `${updatedExam.name} timetable is now live.`);
    setSetupSubTab('publish');
  };

  // Evaluation Row Update Handler
  const updateEvalRow = (studentId: string, updates: Partial<EvaluationRowState>) => {
    setEvalSheetState(prev => {
      const existing = prev[studentId] || { attendance: 'Present', marks: '0', remarks: '', status: 'Draft' };
      const nextRow = { ...existing, ...updates };

      // Rule: If Attendance = Absent -> Marks = 0
      if (updates.attendance === 'Absent') {
        nextRow.marks = '0';
        nextRow.remarks = 'Absent during examination';
      }

      return { ...prev, [studentId]: nextRow };
    });
  };

  const handleSaveEvalDraft = () => {
    try {
      localStorage.setItem(evalStorageKey, JSON.stringify(evalSheetState));
      addToast('info', 'Draft Saved', 'Evaluation marks saved as draft.');
    } catch (e) {
      console.error(e);
      addToast('warning', 'Save Warning', 'Could not persist draft marks to storage.');
    }
  };

  const handleSubmitEval = () => {
    setEvalSheetState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...next[id], status: 'Submitted' };
      });
      try {
        localStorage.setItem(evalStorageKey, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    addToast('success', 'Evaluation Submitted', `Marks entry submitted for ${evalClass} ${evalSection} (${evalSubject}).`);
  };

  // Results Top Actions
  const handlePublishResults = () => {
    setIsResultsPublished(true);
    addToast('success', 'Results Published', 'Examination results are now live for student portal & report cards.');
  };

  const handleToggleLockResults = () => {
    setIsResultsLocked(prev => !prev);
    if (!isResultsLocked) {
      addToast('info', 'Results Locked', 'Results locked. Marks entry is now frozen.');
    } else {
      addToast('warning', 'Results Unlocked', 'Results unlocked for editing.');
    }
  };

  const handlePrintAllReportCards = () => {
    window.print();
  };

  const handleExportResultsExcel = () => {
    addToast('success', 'Excel Exported', `Exported ${processedResultsState.length} result records to Excel.`);
  };

  // Conflict Detection Engine
  const conflictAnalysis = useMemo(() => {
    const rowConflicts: Record<string, string[]> = {};
    let totalConflictCount = 0;
    scheduleRows.forEach((row, idx) => {
      const errors: string[] = [];
      if (!row.date || !row.startTime || !row.endTime) errors.push('Incomplete schedule date or time');
      if (errors.length > 0) {
        rowConflicts[row.id] = errors;
        totalConflictCount += errors.length;
      }
    });
    return { rowConflicts, totalConflictCount };
  }, [scheduleRows]);

  const auditVisibleClasses = useMemo(() => {
    if (auditClassFilter === 'All') return setupForm.applicableClasses.length > 0 ? setupForm.applicableClasses : [setupForm.className];
    return [auditClassFilter];
  }, [auditClassFilter, setupForm.applicableClasses, setupForm.className]);

  const auditVisibleSections = useMemo(() => {
    if (auditSectionFilter === 'All') return setupForm.applicableSections.length > 0 ? setupForm.applicableSections : ['A', 'B', 'C', 'D'];
    return [auditSectionFilter];
  }, [auditSectionFilter, setupForm.applicableSections]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 pb-8 animate-in fade-in">
      {/* Hidden File Input for Row Level Question Paper Upload */}
      <input
        ref={rowPaperInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg"
        className="hidden"
        onChange={handleRowPaperFileChange}
      />

      {/* Top Header Bar */}
      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white dark:bg-slate-900 px-5 py-4 text-slate-900 dark:text-white shadow-sm dark:border-slate-800">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 dark:text-sky-400">
              <Sparkles className="h-4 w-4" />
              Examination
            </div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl text-slate-900 dark:text-white">
              {MAIN_TABS.find(tab => tab.id === activeTab)?.label || 'Examinations'}
            </h1>
          </div>

          <div className="flex items-end gap-2">
            <div className="min-w-[240px]">
              <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Selected Exam</label>
              <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className={selectClass}>
                <option value="">-- Select Examination --</option>
                {examOptions.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleCreateNewExam}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 text-xs font-black transition shadow-sm shrink-0 h-[38px]"
              title="Create New Examination Setup"
            >
              <Plus className="w-4 h-4" />
              <span>New Exam</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {MAIN_TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition shadow-sm ${
                active
                  ? 'border-sky-600 bg-sky-600 text-white shadow-sky-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <div className={`rounded-xl p-2.5 ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                <tab.icon className="h-5 w-5" />
              </div>
              <div>
                <div className={`text-base font-black ${active ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{tab.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* MAIN TAB 1: EXAM SETUP WIZARD (UNTOUCHED AND PRESERVED EXACTLY AS IS) */}
      {activeTab === 'setup' && (
        <div className="space-y-4">
          <Panel
            title="Examination Setup & Subject Scheduling"
            description="Assign subjects to class, schedule dates, times, rooms, invigilation staff, and question papers"
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintScheduleScope({ classes: auditVisibleClasses, sections: auditVisibleSections });
                    setPrintScheduleOpen(true);
                  }}
                  className={outlineButtonClass}
                >
                  <Printer className="h-4 w-4" /> Print Schedule
                </button>
                <button type="button" onClick={handleSaveSetup} className={primaryButtonClass}>
                  <Save className="h-4 w-4" /> Save Setup
                </button>
              </div>
            }
            className="overflow-hidden"
          >
            {/* Notice when no exam selected */}
            {!selectedExamId && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please select an examination from the <strong>"Selected Exam"</strong> dropdown above to view or configure setup, or click <strong>"+ New Exam"</strong> to create one.</span>
              </div>
            )}

            {/* Step Wizard Sub-Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-800">
              {SETUP_TABS.map(tab => {
                const active = setupSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSetupSubTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                      active
                        ? 'border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-600/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* STEP 1: GENERAL */}
            {setupSubTab === 'general' && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Exam Name *</label>
                    <input
                      required
                      value={setupForm.name}
                      onChange={e => setSetupForm(prev => ({ ...prev, name: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. Quarterly Examination 2026"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Academic Year (Global Context)</label>
                    <input
                      disabled
                      value={`${selectedAcademicYear} (${selectedBranch})`}
                      className={`${inputClass} bg-slate-100 dark:bg-slate-800 opacity-70 font-mono`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Exam Type *</label>
                    <select
                      value={setupForm.examType}
                      onChange={e => setSetupForm(prev => ({ ...prev, examType: e.target.value as SetupFormState['examType'] }))}
                      className={selectClass}
                    >
                      <option value="">-- Select Exam Type --</option>
                      {['Unit Test', 'Quarterly', 'Half-Yearly', 'Annual', 'Practical', 'Custom'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Class Selection */}
                  <div className="space-y-1 md:col-span-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Target Classes ({setupForm.applicableClasses.length} Selected) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (setupForm.applicableClasses.length === classOptions.length) {
                            setSetupForm(prev => ({ ...prev, applicableClasses: [classOptions[0] || 'Class 10'] }));
                          } else {
                            setSetupForm(prev => ({ ...prev, applicableClasses: [...classOptions] }));
                          }
                        }}
                        className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {setupForm.applicableClasses.length === classOptions.length ? 'Deselect Extra' : '+ Select All Classes'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                      {classOptions.map(cls => {
                        const isSelected = setupForm.applicableClasses.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => {
                              let next: string[];
                              if (isSelected) {
                                next = setupForm.applicableClasses.filter(c => c !== cls);
                                if (next.length === 0 && classOptions.length > 0) next = [cls];
                              } else {
                                next = [...setupForm.applicableClasses, cls];
                              }
                              const primaryClass = next[0] || cls;
                              const targetSubjects = getClassSubjects(primaryClass, academicClasses, subjects);
                              setSetupForm(prev => ({
                                ...prev,
                                className: primaryClass,
                                applicableClasses: next,
                                subjects: [...targetSubjects]
                              }));

                              const startDateObj = setupForm.startDate ? new Date(setupForm.startDate) : new Date();
                              let currentDate = new Date(startDateObj);
                              const generated: EditableScheduleRow[] = targetSubjects.map((sub, idx) => {
                                if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);
                                const dateStr = currentDate.toISOString().split('T')[0];
                                currentDate.setDate(currentDate.getDate() + 1);

                                return {
                                  id: `SCH-${Date.now()}-${idx}`,
                                  examId: selectedExamId,
                                  academicYear: selectedAcademicYear,
                                  branch: selectedBranch,
                                  className: primaryClass,
                                  section: setupForm.section || 'A',
                                  subject: sub,
                                  date: dateStr,
                                  startTime: '09:00',
                                  endTime: '10:30',
                                  room: 'Room 101',
                                  invigilatorName: teacherOptions[idx % (teacherOptions.length || 1)]?.name || 'TBA',
                                  status: 'Scheduled'
                                };
                              });
                              setScheduleRows(generated);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            <span>{cls}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Start Date *</label>
                    <DatePickerInput
                      value={setupForm.startDate}
                      onChange={val => setSetupForm(prev => ({ ...prev, startDate: val }))}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">End Date *</label>
                    <DatePickerInput
                      value={setupForm.endDate}
                      onChange={val => setSetupForm(prev => ({ ...prev, endDate: val }))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSetupSubTab('subjects')}
                    className={primaryButtonClass}
                  >
                    Next: Step 2 – Subject Scheduling <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SUBJECT SCHEDULING */}
            {setupSubTab === 'subjects' && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Target Class *</label>
                      <select
                        value={setupForm.className}
                        onChange={e => {
                          const nextClass = e.target.value;
                          if (!nextClass) {
                            setSetupForm(prev => ({ ...prev, className: '' }));
                            return;
                          }
                          const nextSubjects = getClassSubjects(nextClass, academicClasses, subjects);
                          setSetupForm(prev => ({
                            ...prev,
                            className: nextClass,
                            applicableClasses: prev.applicableClasses.includes(nextClass) ? prev.applicableClasses : [nextClass, ...prev.applicableClasses],
                            subjects: [...nextSubjects]
                          }));

                          const startDateObj = setupForm.startDate ? new Date(setupForm.startDate) : new Date();
                          let currentDate = new Date(startDateObj);

                          const generated: EditableScheduleRow[] = nextSubjects.map((sub, idx) => {
                            if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);
                            const dateStr = currentDate.toISOString().split('T')[0];
                            currentDate.setDate(currentDate.getDate() + 1);

                            return {
                              id: `SCH-${Date.now()}-${idx}`,
                              examId: selectedExamId,
                              academicYear: selectedAcademicYear,
                              branch: selectedBranch,
                              className: nextClass,
                              section: setupForm.section || 'A',
                              subject: sub,
                              date: dateStr,
                              startTime: '09:00',
                              endTime: '10:30',
                              room: 'Room 101',
                              invigilatorName: teacherOptions[idx % (teacherOptions.length || 1)]?.name || 'TBA',
                              status: 'Scheduled'
                            };
                          });
                          setScheduleRows(generated);
                        }}
                        className="px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none shadow-sm"
                      >
                        <option value="">-- Select Class --</option>
                        {classOptions.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Target Section *</label>
                      <select
                        value={setupForm.section}
                        onChange={e => setSetupForm(prev => ({ ...prev, section: e.target.value }))}
                        className="px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none shadow-sm"
                      >
                        <option value="">-- Select Section --</option>
                        <option value="All">All Sections (A, B, C, D)</option>
                        {['A', 'B', 'C', 'D'].map(sec => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search subjects..."
                        value={subjectSearch}
                        onChange={e => setSubjectSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                      />
                    </div>
                    <button type="button" onClick={handleSelectAllSubjects} className="px-3 py-1.5 rounded-xl bg-slate-200 text-xs font-bold">Select All</button>
                    <button type="button" onClick={handleClearAllSubjects} className="px-3 py-1.5 rounded-xl bg-slate-200 text-xs font-bold">Clear</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {filteredSubjects.map(subject => {
                    const isSelected = setupForm.subjects.includes(subject);
                    return (
                      <button
                        type="button"
                        key={subject}
                        onClick={() => handleToggleSubject(subject)}
                        className={`p-3 rounded-2xl border text-left font-bold text-xs transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{formatSubject(subject, subjects)}</span>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setScheduleTableEditing(prev => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black shadow-sm transition ${
                      isScheduleTableEditing
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-sky-600 text-white hover:bg-sky-500'
                    }`}
                  >
                    {isScheduleTableEditing ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    {isScheduleTableEditing ? 'Done Editing' : 'Edit Table'}
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="min-w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 font-bold uppercase">
                        <th className={tableHeaderClass}>Subject</th>
                        <th className={tableHeaderClass}>Exam Date</th>
                        <th className={tableHeaderClass}>Start Time</th>
                        <th className={tableHeaderClass}>End Time</th>
                        <th className={tableHeaderClass}>Duration</th>
                        <th className={tableHeaderClass}>Room Number</th>
                        <th className={tableHeaderClass}>Invigilator Staff</th>
                        <th className={tableHeaderClass}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {scheduleRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                          <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white">{formatSubject(row.subject, subjects)}</td>
                          <td className="px-3 py-3">
                            {isScheduleTableEditing ? (
                              <DatePickerInput
                                value={row.date}
                                onChange={val => updateScheduleRowItem(row.id, { date: val })}
                                className="w-36 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatDateDDMMYYYY(row.date)}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {isScheduleTableEditing ? (
                              <input
                                type="time"
                                value={row.startTime}
                                onChange={e => updateScheduleRowItem(row.id, { startTime: e.target.value })}
                                className="px-2 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{row.startTime}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {isScheduleTableEditing ? (
                              <input
                                type="time"
                                value={row.endTime}
                                onChange={e => updateScheduleRowItem(row.id, { endTime: e.target.value })}
                                className="px-2 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{row.endTime}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                            {calculateDurationLabel(row.startTime, row.endTime)}
                          </td>
                          <td className="px-3 py-3">
                            {isScheduleTableEditing ? (
                              <input
                                type="text"
                                value={row.room}
                                onChange={e => updateScheduleRowItem(row.id, { room: e.target.value })}
                                className="px-2.5 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold outline-none w-28"
                              />
                            ) : (
                              <span className="font-bold text-slate-700 dark:text-slate-300">{row.room || 'TBA'}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {isScheduleTableEditing ? (
                              <SearchableInvigilatorSelect
                                value={row.invigilatorName}
                                onChange={val => updateScheduleRowItem(row.id, { invigilatorName: val })}
                                teacherOptions={teacherOptions}
                              />
                            ) : (
                              <span className="font-bold text-slate-700 dark:text-slate-300">{formatInvigilator(row.invigilatorName, teacherOptions, idx)}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => triggerRowPaperUpload(row.id, row.subject)}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                                title="Upload Question Paper"
                              >
                                <Upload className="w-4 h-4" />
                              </button>
                              {row.questionPaperUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewPaperSubject(row.subject);
                                    setPreviewPaperFileName(row.questionPaperName || `${row.subject}_Paper_2026.pdf`);
                                    setPreviewPaperFileUrl(row.questionPaperUrl);
                                    setPreviewPaperModalOpen(true);
                                  }}
                                  className="p-2 rounded-xl bg-sky-600 text-white font-bold"
                                  title="Preview Question Paper"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setSetupSubTab('general')} className={outlineButtonClass}>
                    <ChevronLeft className="w-4 h-4" /> Back to General
                  </button>
                  <button type="button" onClick={() => setSetupSubTab('review')} className={primaryButtonClass}>
                    Next: Step 3 – Timetable Preview <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: TIMETABLE PREVIEW */}
            {setupSubTab === 'review' && (
              <div className="mt-4 space-y-5">
                {/* Filter Bar for Class & Section Wise View */}
                <div className="p-4 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Filter className="w-4 h-4 text-sky-500" /> Filter Timetable View
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Filter exam timetable by specific class and section.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-xs border border-sky-200 dark:border-sky-800">
                        View: {auditClassFilter === 'All' ? 'All Classes' : auditClassFilter} — {auditSectionFilter === 'All' ? 'All Sections' : `Section ${auditSectionFilter}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Class Filter</label>
                      <select
                        value={auditClassFilter}
                        onChange={e => setAuditClassFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none shadow-sm min-w-[160px]"
                      >
                        <option value="All">All Classes (All)</option>
                        {classOptions.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Section Filter</label>
                      <select
                        value={auditSectionFilter}
                        onChange={e => setAuditSectionFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none shadow-sm min-w-[160px]"
                      >
                        <option value="All">All Sections (All)</option>
                        {['A', 'B', 'C', 'D'].map(sec => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>

                    {(auditClassFilter !== 'All' || auditSectionFilter !== 'All') && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuditClassFilter('All');
                          setAuditSectionFilter('All');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 mt-4 sm:mt-0"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {auditVisibleClasses.map(cls => (
                    <div key={cls} className="space-y-4">
                      {auditVisibleSections.map(sec => {
                        const rowsToRender = scheduleRows.filter(r => (r.className || setupForm.className) === cls && (r.section || setupForm.section) === sec);

                        return (
                          <div key={`${cls}-${sec}`} className="rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                              <h5 className="text-sm font-black text-slate-900 dark:text-white">
                                {cls} – Section {sec} Examination Timetable
                              </h5>
                              <button
                                type="button"
                                onClick={() => {
                                  setPrintScheduleScope({ classes: [cls], sections: [sec] });
                                  setPrintScheduleOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print Timetable
                              </button>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
                              <table className="min-w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                                    <th className={tableHeaderClass}>Subject</th>
                                    <th className={tableHeaderClass}>Exam Date</th>
                                    <th className={tableHeaderClass}>Time Slot</th>
                                    <th className={tableHeaderClass}>Duration</th>
                                    <th className={tableHeaderClass}>Room Number</th>
                                    <th className={tableHeaderClass}>Invigilator Staff</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rowsToRender.length === 0 && (
                                    <tr>
                                      <td colSpan={6} className="px-3 py-8 text-center text-xs font-bold text-slate-400">
                                        No timetable rows match this class and section.
                                      </td>
                                    </tr>
                                  )}
                                  {rowsToRender.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50">
                                      <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white">{formatSubject(r.subject, subjects)}</td>
                                      <td className="px-3 py-3 font-mono font-bold">{formatDateDDMMYYYY(r.date)}</td>
                                      <td className="px-3 py-3 font-bold">{r.startTime} – {r.endTime}</td>
                                      <td className="px-3 py-3 font-mono text-slate-500">{calculateDurationLabel(r.startTime, r.endTime)}</td>
                                      <td className="px-3 py-3 font-extrabold text-indigo-600">{r.room || 'TBA'}</td>
                                      <td className="px-3 py-3 font-bold">{formatInvigilator(r.invigilatorName, staff, idx)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <button type="button" onClick={() => setSetupSubTab('subjects')} className={outlineButtonClass}>
                    <ChevronLeft className="w-4 h-4" /> Edit Subject Scheduling
                  </button>
                  <button type="button" onClick={() => setSetupSubTab('publish')} className={primaryButtonClass}>
                    Next: Step 4 – Publish & Export <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PUBLISH & EXPORT */}
            {setupSubTab === 'publish' && (
              <div className="mt-4 space-y-5 max-w-3xl">
                <div className={`p-6 rounded-3xl border transition-all ${
                  (selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled')
                    ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900'
                } space-y-5 shadow-sm`}>
                  
                  {/* Header & Status Chip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${
                        (selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled')
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        <Send className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black uppercase text-slate-900 dark:text-white">Publish Examination Timetable</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            (selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled')
                              ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                              : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                          }`}>
                            Status: {(selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled') ? 'Published (Live)' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                          {(selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled')
                            ? 'This timetable is LIVE and visible to students, parents, and invigilator staff.'
                            : 'This timetable is in DRAFT mode and not yet visible to students.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3 Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Publication Status</span>
                      <span className={`text-sm font-black ${
                        (selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled') ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {(selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled') ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Portal Visibility</span>
                      <span className={`text-sm font-black ${
                        (selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled') ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {(selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled') ? 'Active (Live)' : 'Hidden (Draft)'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Scheduled Subjects</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {scheduleRows.length} Exam Subjects
                      </span>
                    </div>
                  </div>

                  {/* Scope Details */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                    <div className="font-black uppercase text-sky-600 dark:text-sky-400 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Target Examination Scope (Entire Exam):
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Publishing activates <span className="font-extrabold text-slate-900 dark:text-white underline decoration-sky-500 decoration-2">{setupForm.name}</span> as a single complete examination for all {scheduleRows.length} scheduled subjects, invigilator rosters, hall tickets, and student/parent portals.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePublishSchedule}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      {(selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled') ? `Re-Publish Entire ${setupForm.name}` : `Publish Entire ${setupForm.name}`}
                    </button>

                    {(selectedExam?.publishStatus === 'Published' || setupForm.status === 'Scheduled') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSetupForm(prev => ({ ...prev, status: 'Draft' }));
                          setWorkflowExams(prev => prev.map(exam => exam.id === selectedExamId ? { ...exam, publishStatus: 'Draft', status: 'Draft' } : exam));
                          addToast('info', 'Status Changed to Draft', `${setupForm.name} set back to Draft mode.`);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition"
                      >
                        Unpublish Entire Examination
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPrintScheduleOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" /> Print Official Timetable
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GRADE RULES TAB */}
            {setupSubTab === 'grades' && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" /> Grade & Evaluation Rules
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">Define percentage boundaries and status remarks for auto-grade calculation.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddGradeRule}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Grade Rule
                    </button>
                    <button
                      type="button"
                      onClick={() => addToast('success', 'Grade Rules Saved', 'Evaluation grading scale updated successfully.')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Rules
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                        <th className={tableHeaderClass}>Grade Name</th>
                        <th className={tableHeaderClass}>Min Mark %</th>
                        <th className={tableHeaderClass}>Max Mark %</th>
                        <th className={tableHeaderClass}>Grade Point</th>
                        <th className={tableHeaderClass}>Status / Remarks</th>
                        <th className={tableHeaderClass}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {gradeRules.map(rule => (
                        <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={rule.grade}
                              onChange={e => handleUpdateGradeRule(rule.id, { grade: e.target.value })}
                              className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white outline-none"
                              placeholder="Grade"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={rule.minMark}
                                onChange={e => handleUpdateGradeRule(rule.id, { minMark: Number(e.target.value) || 0 })}
                                className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none font-mono"
                              />
                              <span className="font-bold text-slate-400">%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={rule.maxMark}
                                onChange={e => handleUpdateGradeRule(rule.id, { maxMark: Number(e.target.value) || 0 })}
                                className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none font-mono"
                              />
                              <span className="font-bold text-slate-400">%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={rule.gradePoint || 0}
                              onChange={e => handleUpdateGradeRule(rule.id, { gradePoint: Number(e.target.value) || 0 })}
                              className="w-16 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none font-mono"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              value={rule.passCriteria}
                              onChange={e => handleUpdateGradeRule(rule.id, { passCriteria: e.target.value })}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                            >
                              <option value="Pass">Pass</option>
                              <option value="Fail">Fail</option>
                              <option value="Outstanding">Outstanding</option>
                              <option value="Excellent">Excellent</option>
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteGradeRule(rule.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                              title="Remove Grade Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* MAIN TAB 2: CLEAN & SIMPLE TEACHER EVALUATION MODULE */}
      {activeTab === 'evaluation' && (
        <div className="space-y-4">
          {/* Streamlined Header */}
          <div className="p-5 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">Teacher Marks Entry</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{setupForm.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Class: <span className="font-bold text-slate-800 dark:text-slate-200">{evalClass}</span> | Section: <span className="font-bold text-slate-800 dark:text-slate-200">{evalSection}</span> | Subject: <span className="font-bold text-sky-600">{formatSubject(evalSubject, subjects)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveEvalDraft}
                className={outlineButtonClass}
              >
                <Save className="w-4 h-4 text-slate-500" /> Save Draft
              </button>
              <button
                type="button"
                onClick={handleSubmitEval}
                className={primaryButtonClass}
              >
                <Send className="w-4 h-4" /> Submit Evaluation
              </button>
            </div>
          </div>

          {/* Compact 4 Summary Cards Above Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Total Students</span>
              <span className="text-base font-black text-slate-900 dark:text-white">{evalMetrics.total}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-emerald-600 block">Present</span>
              <span className="text-base font-black text-emerald-600">{evalMetrics.present}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-rose-600 block">Absent</span>
              <span className="text-base font-black text-rose-600">{evalMetrics.absent}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-sky-600 block">Average Marks</span>
              <span className="text-base font-black text-sky-600">{evalMetrics.avg} / 100</span>
            </div>
          </div>

          {/* Simple Filters Bar */}
          <div className="p-4 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Examination</label>
                  <select
                    value={selectedExamId}
                    onChange={e => setSelectedExamId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none h-[34px]"
                  >
                    <option value="">-- Select Examination --</option>
                    {examOptions.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Class</label>
                  <select
                    value={evalClass}
                    onChange={e => setEvalClass(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none h-[34px]"
                  >
                    <option value="">-- Select Class --</option>
                    {classOptions.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Section</label>
                  <select
                    value={evalSection}
                    onChange={e => setEvalSection(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none h-[34px]"
                  >
                    <option value="">-- Select Section --</option>
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Subject</label>
                  <select
                    value={evalSubject}
                    onChange={e => setEvalSubject(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none text-sky-600 dark:text-sky-400 h-[34px]"
                  >
                    <option value="">-- Select Subject --</option>
                    {selectedClassSubjects.map(sub => (
                      <option key={sub} value={sub}>{formatSubject(sub, subjects)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative mt-4 sm:mt-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={evalStudentSearch}
                  onChange={e => setEvalStudentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none w-56 h-[34px]"
                />
              </div>
            </div>

            {/* Clean Marks Entry Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="min-w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 font-bold uppercase">
                    <th className={tableHeaderClass}>Roll No.</th>
                    <th className={tableHeaderClass}>Student Name</th>
                    <th className={tableHeaderClass}>Attendance</th>
                    <th className={tableHeaderClass}>Marks (100)</th>
                    <th className={tableHeaderClass}>Grade (Auto)</th>
                    <th className={tableHeaderClass}>Remarks</th>
                    <th className={tableHeaderClass}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {evalRosterStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        No students enrolled in {evalClass} Section {evalSection}.
                      </td>
                    </tr>
                  ) : (
                    evalRosterStudents
                      .filter(s => {
                        const nameStr = `${s.firstName} ${s.lastName} ${s.rollNo || ''}`.toLowerCase();
                        return nameStr.includes(evalStudentSearch.toLowerCase());
                      })
                      .map((student, idx) => {
                        const rowState = evalSheetState[student.id] || { attendance: 'Present', marks: '80', remarks: '', status: 'Draft' };
                        const isAbsent = rowState.attendance === 'Absent';
                        const marksNum = isAbsent ? 0 : Number(rowState.marks) || 0;
                        const autoGrade = isAbsent ? 'Absent' : calculateGrade(marksNum, gradeRules);

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50">
                            <td className="px-3 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                              {student.rollNo || `10${idx + 1}`}
                            </td>

                            <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white">
                              {student.firstName} {student.lastName}
                            </td>

                            {/* Attendance Dropdown (Present / Absent) */}
                            <td className="px-3 py-3">
                              <select
                                value={rowState.attendance}
                                onChange={e => updateEvalRow(student.id, { attendance: e.target.value as 'Present' | 'Absent' })}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold outline-none ${
                                  isAbsent
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                              </select>
                            </td>

                            {/* Inline Marks Entry */}
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                disabled={isAbsent}
                                value={isAbsent ? '0' : rowState.marks}
                                onChange={e => updateEvalRow(student.id, { marks: e.target.value })}
                                className="w-24 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none disabled:bg-slate-100 disabled:opacity-60"
                              />
                            </td>

                            {/* Grade (Auto Calculated) */}
                            <td className="px-3 py-3 font-black text-indigo-600 dark:text-indigo-400 text-sm">
                              {autoGrade}
                            </td>

                            {/* Inline Remarks Input */}
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                disabled={isAbsent}
                                placeholder="Add remarks..."
                                value={rowState.remarks}
                                onChange={e => updateEvalRow(student.id, { remarks: e.target.value })}
                                className="w-48 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium outline-none"
                              />
                            </td>

                            {/* Status Chip */}
                            <td className="px-3 py-3 font-bold text-[10px]">
                              <span className={`px-2 py-0.5 rounded-md ${statusChipClass(rowState.status)}`}>
                                {rowState.status}
                              </span>
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
      )}

      {/* MAIN TAB 3: REDESIGNED REAL-WORLD SCHOOL ERP RESULTS MODULE */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Top Actions Bar */}
          <div className="p-5 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-500" /> Examination Results Management
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePublishResults}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Publish Results
              </button>

              <button
                type="button"
                onClick={handleToggleLockResults}
                className={`px-3.5 py-2 rounded-xl text-white font-black text-xs shadow-sm flex items-center gap-1.5 ${
                  isResultsLocked ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isResultsLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isResultsLocked ? 'Unlock Results' : 'Lock Results'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintAllReportCards}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Class Report Cards
              </button>

              <button
                type="button"
                onClick={handleExportResultsExcel}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-50 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
              </button>
            </div>
          </div>

          {/* 5 Summary Cards (Auto-updating according to Examination, Class, Section) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Total Students</span>
              <span className="text-base font-black text-slate-900 dark:text-white">{resultsMetrics.total}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-emerald-600 block">Pass</span>
              <span className="text-base font-black text-emerald-600">{resultsMetrics.passCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-rose-600 block">Fail</span>
              <span className="text-base font-black text-rose-600">{resultsMetrics.failCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-indigo-600 block">Published</span>
              <span className="text-base font-black text-indigo-600">{resultsMetrics.publishedCount} / {resultsMetrics.total}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black uppercase text-sky-600 block">Average Percentage</span>
              <span className="text-base font-black text-sky-600">{resultsMetrics.avgPercent}%</span>
            </div>
          </div>

          {/* Filters Bar: Order: Examination -> Class -> Section -> Search Student (Subject filter removed) */}
          <div className="p-4 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Examination *</label>
                  <select
                    value={selectedExamId}
                    onChange={e => setSelectedExamId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none h-[34px] min-w-[200px]"
                  >
                    <option value="">-- Select Examination --</option>
                    {examOptions.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Class *</label>
                  <select
                    value={evalClass}
                    onChange={e => setEvalClass(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none h-[34px] min-w-[140px]"
                  >
                    <option value="">-- Select Class --</option>
                    {classOptions.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Section *</label>
                  <select
                    value={evalSection}
                    onChange={e => setEvalSection(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none h-[34px] min-w-[140px]"
                  >
                    <option value="">-- Select Section --</option>
                    <option value="All">All Sections</option>
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative mt-4 sm:mt-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Roll No, Admission No, or Name..."
                  value={evalStudentSearch}
                  onChange={e => setEvalStudentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none w-64 h-[34px]"
                />
              </div>
            </div>

            {/* Results Table - One Row Per Student */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="min-w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 font-bold uppercase">
                    <th className={tableHeaderClass}>Roll No.</th>
                    <th className={tableHeaderClass}>Admission No.</th>
                    <th className={tableHeaderClass}>Student Name</th>
                    <th className={tableHeaderClass}>Total Marks</th>
                    <th className={tableHeaderClass}>Percentage</th>
                    <th className={tableHeaderClass}>Grade</th>
                    <th className={tableHeaderClass}>Rank</th>
                    <th className={tableHeaderClass}>Status</th>
                    <th className={tableHeaderClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOverallResults.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
                        No examination results found for {evalClass} {evalSection !== 'All' ? `Section ${evalSection}` : 'All Sections'}.
                      </td>
                    </tr>
                  ) : (
                    filteredOverallResults.map(res => (
                      <tr
                        key={res.student.id}
                        onClick={() => {
                          setSelectedResultModalData(res);
                          setIsViewResultModalOpen(true);
                        }}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 cursor-pointer transition"
                      >
                        <td className="px-3 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                          {res.rollNo}
                        </td>

                        <td className="px-3 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                          {res.admissionNo}
                        </td>

                        <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white">
                          {res.studentName}
                        </td>

                        <td className="px-3 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {res.totalObtained} / {res.totalMax}
                        </td>

                        <td className="px-3 py-3 font-mono font-extrabold text-sky-600 dark:text-sky-400">
                          {res.percentage}%
                        </td>

                        <td className="px-3 py-3 font-black text-indigo-600 dark:text-indigo-400">
                          {res.overallGrade}
                        </td>

                        <td className="px-3 py-3 font-black text-amber-600 dark:text-amber-400">
                          #{res.rank}
                        </td>

                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${statusChipClass(res.status)}`}>
                            {res.status}
                          </span>
                        </td>

                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedResultModalData(res);
                              setIsViewResultModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Result</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED VIEW RESULT MODAL */}
      {isViewResultModalOpen && selectedResultModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
            
            {/* Header */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Detailed Examination Result Sheet</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedResultModalData.overallResult === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {selectedResultModalData.overallResult}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedExam?.name || setupForm.name} • Session {selectedAcademicYear}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsViewResultModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Student Information */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Student Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Student Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{selectedResultModalData.studentName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Roll No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedResultModalData.rollNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Admission No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedResultModalData.admissionNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Class & Section</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedResultModalData.className} - {selectedResultModalData.section}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Examination</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedExam?.name || setupForm.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Academic Year</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedAcademicYear}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Branch</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedBranch}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Result Status</span>
                    <span className={`font-bold ${statusChipClass(selectedResultModalData.status)} px-2 py-0.5 rounded text-[10px] inline-block mt-0.5`}>
                      {selectedResultModalData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject-wise Marks Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-500" /> Subject-wise Performance Breakdown
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 font-bold uppercase">
                        <th className="px-4 py-2.5">Subject</th>
                        <th className="px-4 py-2.5">Maximum Marks</th>
                        <th className="px-4 py-2.5">Obtained Marks</th>
                        <th className="px-4 py-2.5">Grade</th>
                        <th className="px-4 py-2.5">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedResultModalData.subjectMarks.map((sub, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50">
                          <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">{formatSubject(sub.subject, subjects)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">{sub.maxMarks}</td>
                          <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-white">{sub.obtainedMarks}</td>
                          <td className="px-4 py-3 font-black text-indigo-600 dark:text-indigo-400">{sub.grade}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              sub.isPass ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {sub.isPass ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Overall Performance Summary Box */}
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Total Marks</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{selectedResultModalData.totalObtained} / {selectedResultModalData.totalMax}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                    <span className="text-[10px] font-black uppercase text-sky-600 block">Percentage</span>
                    <span className="text-sm font-black text-sky-600 dark:text-sky-400">{selectedResultModalData.percentage}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                    <span className="text-[10px] font-black uppercase text-indigo-600 block">Overall Grade</span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{selectedResultModalData.overallGrade}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                    <span className="text-[10px] font-black uppercase text-amber-600 block">Rank</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">#{selectedResultModalData.rank}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Overall Result</span>
                    <span className={`text-sm font-black ${
                      selectedResultModalData.overallResult === 'PASS' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {selectedResultModalData.overallResult}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Page Actions Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsViewResultModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-100 transition flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Results
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReportCardStudent(selectedResultModalData.student);
                    setReportCardModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Report Card
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addToast('info', 'PDF Generated', `Downloading report card PDF for ${selectedResultModalData.studentName}.`);
                    setSelectedReportCardStudent(selectedResultModalData.student);
                    setReportCardModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-slate-500" /> Download PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addToast('success', 'Result Published', `Published result for ${selectedResultModalData.studentName}.`);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Publish Result
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addToast('info', 'Result Locked', `Locked result for ${selectedResultModalData.studentName}.`);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" /> Lock Result
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable / Viewable Report Card Modal (3 Actions: Preview, Print, Download PDF) */}
      {reportCardModalOpen && selectedReportCardStudent && (
        <PrintableReportCard
          student={selectedReportCardStudent}
          exam={selectedExam}
          isOpen={reportCardModalOpen}
          onClose={() => setReportCardModalOpen(false)}
          schoolProfile={schoolProfile}
        />
      )}

      {/* Question Paper Preview Modal */}
      <QuestionPaperPreviewModal
        isOpen={previewPaperModalOpen}
        onClose={() => setPreviewPaperModalOpen(false)}
        subject={previewPaperSubject}
        fileName={previewPaperFileName}
        fileUrl={previewPaperFileUrl}
        examName={setupForm.name}
        className={setupForm.className}
        schoolName={schoolProfile.name}
      />

      {/* Printable Schedule Modal */}
      <PrintableTimetableModal
        isOpen={printScheduleOpen}
        onClose={() => {
          setPrintScheduleOpen(false);
          setPrintScheduleScope(null);
        }}
        schoolName={schoolProfile.name}
        academicYear={selectedAcademicYear}
        branch={selectedBranch}
        examName={setupForm.name}
        classes={printScheduleScope?.classes || auditVisibleClasses}
        sections={printScheduleScope?.sections || auditVisibleSections}
        schedules={scheduleRows}
      />
    </div>
  );
};

export default ExaminationView;
