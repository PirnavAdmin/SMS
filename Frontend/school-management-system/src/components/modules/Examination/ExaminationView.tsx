import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, Plus, Save, Printer, Edit, Trash2, X, Calendar, BookOpen, User, 
  MapPin, CheckCircle2, AlertTriangle, ShieldAlert, Lock, Unlock, Download, Upload,
  Search, FileSpreadsheet, RefreshCw, BarChart2, PlusCircle, CheckCircle, FileText,
  UserCheck, ShieldCheck, HelpCircle, History, Eye, ChevronDown, ChevronRight, Layers, Filter,
  CheckSquare, Square, AlertCircle, TrendingUp, Users, Clock
} from 'lucide-react';
import { Student, ExamSetup, ExamMark, ExamSchedule, GradeConfig, ProcessedResult, QuestionPaper } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { PrintableReportCard } from './PrintableReportCard';
import { ConfirmModal } from '../../common/ConfirmModal';

// Simplified Navigation Structure: 4 Top-Level Tabs
type MainTab = 'setup' | 'evaluation' | 'results' | 'reports';

// Enterprise Exam Lifecycle States
type ExamLifecycleStatus = 
  | 'Draft' 
  | 'Scheduled' 
  | 'Timetable Completed' 
  | 'Ready' 
  | 'Ongoing' 
  | 'Evaluation' 
  | 'Results Processing' 
  | 'Published' 
  | 'Archived';

export const ExaminationView: React.FC = () => {
  const data = useData();
  const { 
    exams, students, staff, academicClasses, subjects, examMarks, examSchedules, gradeConfigurations, processedResults,
    questionPapers, addQuestionPaper, updateQuestionPaper, deleteQuestionPaper,
    addExam, updateExam, deleteExam, saveMarks, 
    addExamSchedule, updateExamSchedule, deleteExamSchedule,
    saveGradeConfiguration, saveProcessedResults, updateResultStatus, applyGraceOrRevaluation,
    schoolProfile
  } = data;
  const { addToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<MainTab>('setup');
  const [selectedBranch, setSelectedBranch] = useState(user?.branch || 'Main Campus');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(schoolProfile.academicYear || '2025-2026');

  // RBAC permissions
  const isAdminOrPrincipal = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Principal';
  const isTeacher = user?.role === 'Teacher';
  const isStudentOrParent = user?.role === 'Student' || user?.role === 'Parent';

  const formatSubject = (subjectName: string) => {
    const subj = subjects.find(s => s.name === subjectName);
    return subj?.code ? `${subjectName} - ${subj.code}` : subjectName;
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Staff & Classes setup
  const dbTeacher = staff.find(s => s.email === user?.email);
  const currentTeacher = dbTeacher || (isTeacher ? {
    assignedClasses: ['10-A', '9-B'],
    assignedSubjects: ['Mathematics', 'Physics']
  } : null);

  const teacherClassesRaw = currentTeacher?.assignedClasses || [];
  const teacherClasses = teacherClassesRaw.map(c => c.startsWith('Class ') ? c : `Class ${c}`);
  const teacherSubjects = currentTeacher?.assignedSubjects || [];
  const subjectOptions = Array.from(new Set(subjects.map(subject => subject.name))).filter(Boolean).sort();
  const allSubjectOptions = Array.from(new Set([...subjectOptions, 'Mathematics', 'Physics']));
  const teacherSubjectOptions = allSubjectOptions.filter(subject => teacherSubjects.includes(subject));
  const classOptions = Array.from(new Set([
    ...academicClasses.map(cls => cls.name),
    ...students.map(student => student.className)
  ])).filter(Boolean).sort();
  const branchOptions = Array.from(new Set([
    'Main Campus',
    ...exams.map(exam => exam.branch || ''),
    ...students.map(student => student.branch || '')
  ])).filter(Boolean).sort();
  const academicYearOptions = Array.from(new Set([
    schoolProfile.academicYear,
    ...exams.map(exam => exam.academicYear)
  ])).filter(Boolean).sort();
  const getSectionOptions = (className?: string) => {
    return (academicClasses.find(cls => cls.name === className)?.sections || []).filter(Boolean).sort();
  };

  // Active student match (for Student/Parent portal view)
  const matchingStudent = students.find(s => s.email === user?.email || (user?.role === 'Parent' && s.fatherName.toLowerCase() === user.name.toLowerCase()));

  // Filter components by active branch & year
  const branchExamsList = exams.filter(
    e => (!e.branch || e.branch === selectedBranch) && e.academicYear === selectedAcademicYear
  );

  // ----------------------------------------------------
  // ENTERPRISE EXAM LIFECYCLE & PROGRESS CALCULATOR
  // ----------------------------------------------------
  const todayStr = new Date().toISOString().split('T')[0];

  const getExamLifecycleStatus = (exam: ExamSetup): ExamLifecycleStatus => {
    if (exam.publishStatus === 'Published' || exam.status === 'Results Published') return 'Published';
    const schedules = examSchedules.filter(s => s.examId === exam.id);
    const hasTimetable = schedules.length > 0;
    const hasRoomsAndInvig = hasTimetable && schedules.every(s => Boolean(s.room && s.invigilatorName));
    const isExamConcluded = exam.endDate && exam.endDate < todayStr;
    const isExamOngoing = exam.startDate && exam.endDate && exam.startDate <= todayStr && todayStr <= exam.endDate;

    if (isExamConcluded) {
      const hasMarks = examMarks.some(m => m.examId === exam.id);
      if (hasMarks) return 'Results Processing';
      return 'Evaluation';
    }
    if (isExamOngoing) return 'Ongoing';
    if (hasRoomsAndInvig) return 'Ready';
    if (hasTimetable) return 'Timetable Completed';
    if (exam.status === 'Scheduled' || exam.startDate) return 'Scheduled';
    return 'Draft';
  };

  const getExamChecklist = (exam: ExamSetup) => {
    const schedules = examSchedules.filter(s => s.examId === exam.id);
    const papers = questionPapers.filter(p => p.examId === exam.id);
    const totalRequiredSubjects = (exam.applicableClasses?.length || 1) * 3; // Estimated standard subjects per class

    const hasDetails = Boolean(exam.name && exam.startDate && exam.endDate);
    const hasClasses = Boolean(exam.applicableClasses && exam.applicableClasses.length > 0);
    const hasTimetable = schedules.length > 0;
    const hasRooms = hasTimetable && schedules.some(s => Boolean(s.room));
    const hasInvigilators = hasTimetable && schedules.some(s => Boolean(s.invigilatorName));
    const hasPapers = papers.length > 0;
    const isPublished = exam.publishStatus === 'Published' || exam.status === 'Results Published';

    return {
      hasDetails,
      hasClasses,
      hasTimetable,
      scheduledSubjectCount: schedules.length,
      totalRequiredSubjects,
      hasRooms,
      hasInvigilators,
      hasPapers,
      isPublished,
      isValidToPublish: hasDetails && hasClasses && hasTimetable && hasRooms && hasInvigilators
    };
  };

  const getExamProgress = (exam: ExamSetup) => {
    const check = getExamChecklist(exam);
    let points = 0;
    if (check.hasDetails) points += 20;
    if (check.hasClasses) points += 20;
    if (check.hasTimetable) points += 20;
    if (check.hasRooms && check.hasInvigilators) points += 20;
    if (check.isPublished) points += 20;
    return Math.min(points, 100);
  };

  // Dashboard Summary Metrics
  const dashboardStats = useMemo(() => {
    const total = branchExamsList.length;
    let scheduled = 0;
    let ongoing = 0;
    let completed = 0;

    branchExamsList.forEach(e => {
      const status = getExamLifecycleStatus(e);
      if (status === 'Ongoing') ongoing++;
      else if (status === 'Published' || status === 'Archived' || status === 'Results Processing') completed++;
      else scheduled++;
    });

    return { total, scheduled, ongoing, completed };
  }, [branchExamsList, examSchedules, examMarks, todayStr]);

  // ----------------------------------------------------
  // Tab 1: Exam Setup Sub-workflow States
  // ----------------------------------------------------
  const [selectedExamWorkspace, setSelectedExamWorkspace] = useState<ExamSetup | null>(null);
  const [setupStep, setSetupStep] = useState<'details' | 'classes' | 'timetable' | 'rooms_invigilators' | 'papers' | 'publish'>('details');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSetup | null>(null);
  const [examFormData, setExamFormData] = useState<Partial<ExamSetup>>({
    name: '',
    academicYear: '2025-2026',
    examType: 'Unit Test',
    startDate: '',
    endDate: '',
    applicableClasses: [],
    status: 'Scheduled',
    branch: '',
    gradeSchemeName: 'Default Scholastic'
  });
  const [deletingExam, setDeletingExam] = useState<ExamSetup | null>(null);

  const handleOpenAddExam = () => {
    if (!isAdminOrPrincipal) return;
    setEditingExam(null);
    setExamFormData({
      name: '',
      academicYear: selectedAcademicYear,
      examType: 'Unit Test',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      applicableClasses: ['Class 9', 'Class 10'],
      status: 'Scheduled',
      branch: selectedBranch,
      gradeSchemeName: 'Default Scholastic'
    });
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam: ExamSetup) => {
    if (!isAdminOrPrincipal) return;
    setEditingExam(exam);
    setExamFormData(exam);
    setIsExamModalOpen(true);
  };

  const [applyToAllSections, setApplyToAllSections] = useState(true);

  const handleExamSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!examFormData.name?.trim()) {
      addToast('warning', 'Validation Warning', 'Please provide a title for the examination.');
      return;
    }
    if (!examFormData.startDate || !examFormData.endDate) {
      addToast('warning', 'Validation Warning', 'Please set both Start Date and End Date for the exam setup.');
      return;
    }
    if (examFormData.startDate > examFormData.endDate) {
      addToast('error', 'Validation Error', 'Start Date must be before or equal to End Date.');
      return;
    }
    if (!examFormData.applicableClasses || examFormData.applicableClasses.length === 0) {
      addToast('warning', 'Validation Warning', 'Please select at least one applicable class.');
      return;
    }

    const isDuplicate = exams.some(
      ex => ex.id !== editingExam?.id &&
        ex.academicYear === selectedAcademicYear &&
        (!ex.branch || ex.branch === selectedBranch) &&
        ex.name.trim().toLowerCase() === examFormData.name?.trim().toLowerCase()
    );

    if (isDuplicate) {
      addToast('error', 'Duplicate Exam Name', `An examination named '${examFormData.name}' already exists for academic year ${selectedAcademicYear}.`);
      return;
    }

    const payload = {
      ...examFormData,
      branch: selectedBranch,
      academicYear: selectedAcademicYear,
      className: examFormData.applicableClasses?.[0] || classOptions[0] || 'Class 10'
    };

    if (editingExam) {
      updateExam(editingExam.id, payload);
      addToast('success', 'Success', `Updated examination setup: ${examFormData.name}`);
      if (selectedExamWorkspace?.id === editingExam.id) {
        setSelectedExamWorkspace({ ...selectedExamWorkspace, ...payload } as ExamSetup);
      }
    } else {
      addExam(payload as Omit<ExamSetup, 'id'>);
      addToast('success', 'Success', `Configured new examination: ${examFormData.name}`);
    }
    setIsExamModalOpen(false);
  };

  // Teaching Staff Filter for Invigilator Selection
  const teachingStaffList = useMemo(() => {
    const teachers = staff.filter(s => 
      s.employeeCategory === 'Teacher' || 
      s.designation?.toLowerCase().includes('teacher') || 
      s.role === 'Teacher'
    );
    return teachers.length > 0 ? teachers : staff;
  }, [staff]);

  // Schedule & Unified Room + Invigilator Allocation States
  const [invigilatorSearchQuery, setInvigilatorSearchQuery] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [selectedScheduleClasses, setSelectedScheduleClasses] = useState<string[]>(['Class 10']);
  const [scheduleForm, setScheduleForm] = useState<Partial<ExamSchedule>>({
    examId: '',
    date: '',
    startTime: '09:00',
    endTime: '12:00',
    subject: 'Mathematics',
    className: 'Class 10',
    section: 'All Sections',
    maxMarks: 100,
    passMarks: 33,
    room: 'Hall A',
    invigilatorId: '',
    invigilatorName: 'Assigned Staff'
  });

  const checkScheduleConflicts = (
    date: string,
    startTime: string,
    endTime: string,
    className: string,
    section: string,
    ignoreId?: string
  ) => {
    const conflicts: string[] = [];
    const overlaps = (s1Start: string, s1End: string, s2Start: string, s2End: string) => {
      return s1Start < s2End && s2Start < s1End;
    };

    examSchedules.forEach(s => {
      if (s.id === ignoreId) return;
      const scheduleExam = exams.find(ex => ex.id === s.examId);
      if (scheduleExam && scheduleExam.academicYear !== selectedAcademicYear) return;
      if (scheduleExam?.branch && scheduleExam.branch !== selectedBranch) return;
      if (s.date === date && overlaps(startTime, endTime, s.startTime, s.endTime)) {
        if (s.className === className && (s.section === section || s.section === 'All Sections' || section === 'All Sections')) {
          conflicts.push(`Class Conflict: Class ${className}-${section} already has a scheduled exam (${s.subject}) during ${startTime} - ${endTime}.`);
        }
      }
    });

    return conflicts;
  };

  const handleScheduleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const { date, startTime, endTime, section, examId, subject, room, invigilatorName } = scheduleForm;
    const targetClasses = (editingSchedule ? [scheduleForm.className || selectedScheduleClasses[0] || classOptions[0]] : selectedScheduleClasses).filter(Boolean);
    
    if (!examId || !date || !startTime || !endTime || !subject || targetClasses.length === 0) {
      addToast('warning', 'Validation Warning', 'Please fill in all mandatory scheduling fields.');
      return;
    }

    const examMaster = exams.find(ex => ex.id === examId);
    if (examMaster) {
      if (examMaster.startDate && date < examMaster.startDate) {
        addToast('error', 'Validation Error', `Exam Date (${date}) cannot be before Exam Start Date (${examMaster.startDate}).`);
        return;
      }
      if (examMaster.endDate && date > examMaster.endDate) {
        addToast('error', 'Validation Error', `Exam Date (${date}) cannot be after Exam End Date (${examMaster.endDate}).`);
        return;
      }
    }

    if (startTime >= endTime) {
      addToast('error', 'Validation Error', 'Start Time must be strictly before End Time.');
      return;
    }

    const conflicts = targetClasses.flatMap(className => checkScheduleConflicts(
      date, startTime, endTime, className, section || 'All Sections', editingSchedule?.id
    ));

    if (conflicts.length > 0) {
      addToast('error', 'Scheduling Conflict', conflicts[0]);
      return;
    }

    if (editingSchedule) {
      updateExamSchedule(editingSchedule.id, {
        ...scheduleForm,
        academicYear: selectedAcademicYear,
        branch: selectedBranch,
        className: targetClasses[0],
        section: section || 'All Sections',
        room: room || 'Hall A',
        invigilatorName: invigilatorName || 'Assigned Staff'
      } as Omit<ExamSchedule, 'id'>);
      addToast('success', 'Success', 'Updated exam schedule, room & invigilator allocation.');
    } else {
      let count = 0;
      targetClasses.forEach(className => {
        addExamSchedule({
          ...scheduleForm,
          academicYear: selectedAcademicYear,
          branch: selectedBranch,
          className,
          section: section || 'All Sections',
          room: room || 'Hall A',
          invigilatorName: invigilatorName || 'Assigned Staff'
        } as Omit<ExamSchedule, 'id'>);
        count++;
      });
      addToast('success', 'Success', `Scheduled exam entry with room & invigilator for ${count} class(es).`);
    }
    setIsScheduleModalOpen(false);
  };

  // Question Papers State & Handlers
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<QuestionPaper | null>(null);
  const [viewingPaper, setViewingPaper] = useState<QuestionPaper | null>(null);

  const [paperFormData, setPaperFormData] = useState<Partial<QuestionPaper>>({
    paperTitle: '',
    academicYear: '2025-2026',
    branch: 'Main Campus',
    examId: '',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    examDate: '',
    duration: '3 Hours',
    maxMarks: 100,
    instructions: '1. Read all questions carefully.\n2. Answer in neat handwriting.',
    fileName: 'question_paper.pdf',
    fileSize: '1.5 MB',
    fileType: 'PDF Document',
    fileUrl: '#',
    status: 'Published'
  });

  const handleOpenAddPaper = () => {
    if (!isAdminOrPrincipal && !isTeacher) return;
    setEditingPaper(null);
    setPaperFormData({
      paperTitle: '',
      academicYear: selectedAcademicYear,
      branch: selectedBranch,
      examId: selectedExamWorkspace?.id || branchExamsList[0]?.id || '',
      className: classOptions[0] || 'Class 10',
      section: 'A',
      subject: 'Mathematics',
      examDate: new Date().toISOString().split('T')[0],
      duration: '3 Hours',
      maxMarks: 100,
      instructions: '1. Read all questions carefully.\n2. Answer in neat handwriting.',
      fileName: 'question_paper.pdf',
      fileSize: '1.5 MB',
      fileType: 'PDF Document',
      fileUrl: '#',
      status: 'Published'
    });
    setIsPaperModalOpen(true);
  };

  const executePaperSubmit = () => {
    if (!paperFormData.paperTitle?.trim()) {
      addToast('warning', 'Validation Warning', 'Paper title is required.');
      return;
    }
    const selectedExam = exams.find(e => e.id === paperFormData.examId);
    const payload = {
      ...paperFormData,
      academicYear: selectedAcademicYear,
      branch: selectedBranch,
      examName: selectedExam?.name || 'Term Examination',
      uploadedBy: user?.name || 'Staff Member',
      uploadedOn: new Date().toISOString().split('T')[0]
    };

    if (editingPaper) {
      updateQuestionPaper(editingPaper.id, payload);
      addToast('success', 'Success', `Updated question paper: ${paperFormData.paperTitle}`);
    } else {
      addQuestionPaper(payload as Omit<QuestionPaper, 'id'>);
      addToast('success', 'Success', `Uploaded question paper: ${paperFormData.paperTitle}`);
    }
    setIsPaperModalOpen(false);
  };

  const handleTogglePublishPaper = (paper: QuestionPaper) => {
    const newStatus = paper.status === 'Published' ? 'Draft' : 'Published';
    updateQuestionPaper(paper.id, { status: newStatus });
    addToast('info', 'Paper Status Updated', `'${paper.paperTitle}' is now ${newStatus}.`);
  };

  // ----------------------------------------------------
  // Tab 2: Evaluation Sub-workflow States
  // ----------------------------------------------------
  const [evaluationSubTab, setEvaluationSubTab] = useState<'marks' | 'absent' | 'grace' | 'grades'>('marks');

  // Marks Entry States
  const [marksExamId, setMarksExamId] = useState(branchExamsList[0]?.id || '');
  const [marksClass, setMarksClass] = useState(teacherClasses[0] || classOptions[0] || 'Class 10');
  const [marksSection, setMarksSection] = useState('A');
  const [marksSubject, setMarksSubject] = useState(teacherSubjectOptions[0] || subjectOptions[0] || 'Mathematics');
  const [marksList, setMarksList] = useState<Record<string, { marksObtained: number | string; isAbsent: boolean; remarks?: string }>>({});

  useEffect(() => {
    if (!marksExamId && branchExamsList.length > 0) {
      setMarksExamId(branchExamsList[0].id);
    }
  }, [branchExamsList, marksExamId]);

  useEffect(() => {
    const existing = examMarks.filter(
      m => m.examId === marksExamId && m.className === marksClass && m.section === marksSection && m.subject === marksSubject
    );
    const initialMap: Record<string, { marksObtained: number | string; isAbsent: boolean; remarks?: string }> = {};
    existing.forEach(m => {
      initialMap[m.studentId] = {
        marksObtained: m.marksObtained,
        isAbsent: m.isAbsent || false,
        remarks: m.remarks || ''
      };
    });
    setMarksList(initialMap);
  }, [examMarks, marksExamId, marksClass, marksSection, marksSubject]);

  const handleSaveMarks = () => {
    const currentSchedule = examSchedules.find(
      s => s.examId === marksExamId && s.className === marksClass && s.subject === marksSubject
    );
    const maxMarks = currentSchedule?.maxMarks || 100;
    const passMarks = currentSchedule?.passMarks || 33;

    const payload: ExamMark[] = Object.entries(marksList).map(([studentId, data]) => {
      const marksVal = typeof data.marksObtained === 'string' ? parseFloat(data.marksObtained) || 0 : data.marksObtained;
      return {
        id: `MARK-${marksExamId}-${studentId}-${marksSubject}`,
        examId: marksExamId,
        studentId,
        className: marksClass,
        section: marksSection,
        subject: marksSubject,
        marksObtained: data.isAbsent ? 0 : marksVal,
        maxMarks,
        passMarks,
        isAbsent: data.isAbsent,
        remarks: data.remarks || ''
      };
    });

    saveMarks(payload);
    addToast('success', 'Evaluation Entries Saved', `Saved evaluation records for ${payload.length} students in ${marksSubject}.`);
  };

  // Standard Default Grading Rules Fallback
  const defaultGradeConfigs: GradeConfig[] = [
    { grade: 'A+', minMark: 90, maxMark: 100, gradePoint: 10, remarks: 'Outstanding' },
    { grade: 'A', minMark: 80, maxMark: 89, gradePoint: 9, remarks: 'Excellent' },
    { grade: 'B', minMark: 70, maxMark: 79, gradePoint: 8, remarks: 'Very Good' },
    { grade: 'C', minMark: 60, maxMark: 69, gradePoint: 7, remarks: 'Good' },
    { grade: 'D', minMark: 33, maxMark: 59, gradePoint: 6, remarks: 'Satisfactory / Pass' },
    { grade: 'F', minMark: 0, maxMark: 32, gradePoint: 0, remarks: 'Needs Improvement / Fail' }
  ];

  // Grade Configurations States & Actions
  const [gradeScaleList, setGradeScaleList] = useState<GradeConfig[]>(
    gradeConfigurations && gradeConfigurations.length > 0 ? gradeConfigurations : defaultGradeConfigs
  );

  useEffect(() => {
    if (gradeConfigurations && gradeConfigurations.length > 0) {
      setGradeScaleList(gradeConfigurations);
    } else {
      setGradeScaleList(defaultGradeConfigs);
    }
  }, [gradeConfigurations]);

  const handleSaveGradeConfig = (newConfigs: GradeConfig[]) => {
    saveGradeConfiguration(newConfigs);
    addToast('success', 'Grade Scale Saved', 'Updated grade boundary rules and GPA point scale.');
  };

  // ----------------------------------------------------
  // Tab 3: Results Sub-workflow States
  // ----------------------------------------------------
  const [resultStep, setResultStep] = useState<'process' | 'verify' | 'approve' | 'publish'>('process');
  const [resultExamId, setResultExamId] = useState(branchExamsList[0]?.id || '');
  const [resultClass, setResultClass] = useState(classOptions[0] || 'Class 10');
  const [resultSection, setResultSection] = useState('A');

  const handleProcessResults = () => {
    if (!resultExamId) {
      addToast('warning', 'Selection Warning', 'Please select an examination setup to process results.');
      return;
    }
    const classStudents = students.filter(
      s => s.className === resultClass && s.section === resultSection && (!s.branch || s.branch === selectedBranch)
    );

    if (classStudents.length === 0) {
      addToast('warning', 'No Students Found', `No registered students found in Class ${resultClass}-${resultSection}.`);
      return;
    }

    const computedResults: ProcessedResult[] = classStudents.map(st => {
      const studentMarks = examMarks.filter(m => m.examId === resultExamId && m.studentId === st.id);
      const totalMarksObtained = studentMarks.reduce((acc, curr) => acc + (curr.isAbsent ? 0 : curr.marksObtained), 0);
      const totalMaxMarks = studentMarks.reduce((acc, curr) => acc + curr.maxMarks, 0) || 100;
      const percentage = parseFloat(((totalMarksObtained / totalMaxMarks) * 100).toFixed(2));
      const hasFailedSubject = studentMarks.some(m => !m.isAbsent && m.marksObtained < m.passMarks);
      const isPass = !hasFailedSubject && percentage >= 33;

      let gpa = 0;
      if (percentage >= 90) gpa = 10;
      else if (percentage >= 80) gpa = 9;
      else if (percentage >= 70) gpa = 8;
      else if (percentage >= 60) gpa = 7;
      else if (percentage >= 50) gpa = 6;
      else if (percentage >= 33) gpa = 5;
      else gpa = 0;

      return {
        id: `RES-${resultExamId}-${st.id}`,
        examId: resultExamId,
        studentId: st.id,
        studentName: `${st.firstName} ${st.lastName}`,
        rollNo: st.rollNo,
        className: resultClass,
        section: resultSection,
        totalMarksObtained,
        totalMaxMarks,
        percentage,
        gpa,
        grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 33 ? 'D' : 'F',
        passStatus: isPass ? 'Pass' : 'Fail',
        status: 'Draft',
        processedDate: new Date().toISOString().split('T')[0]
      };
    });

    saveProcessedResults(computedResults);
    addToast('success', 'Results Processed', `Computed and computed performance results for ${computedResults.length} students.`);
    setResultStep('verify');
  };

  // ----------------------------------------------------
  // Tab 4: Reports Sub-workflow States
  // ----------------------------------------------------
  // ----------------------------------------------------
  // Tab 4: Reports Sub-workflow States
  // ----------------------------------------------------
  type ReportsSubTab = 'marksRegister' | 'reportCards' | 'topPerformers' | 'analytics';
  const [reportsSubTab, setReportsSubTab] = useState<ReportsSubTab>('marksRegister');
  const [reportExamId, setReportExamId] = useState(branchExamsList[0]?.id || '');
  const [reportClass, setReportClass] = useState(classOptions[0] || 'Class 10');
  const [reportSection, setReportSection] = useState('A');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [selectedExamForReport, setSelectedExamForReport] = useState<ExamSetup | null>(null);

  // View Marks Register States & Computation Engine
  const [marksRegisterExamId, setMarksRegisterExamId] = useState(branchExamsList[0]?.id || '');
  const [marksRegisterClass, setMarksRegisterClass] = useState(classOptions[0] || 'Class 10');
  const [marksRegisterSection, setMarksRegisterSection] = useState('A');
  const [marksRegisterSearchQuery, setMarksRegisterSearchQuery] = useState('');
  const [marksRegisterSortBy, setMarksRegisterSortBy] = useState<'rollNo' | 'name' | 'percentage' | 'totalMarks' | 'grade'>('rollNo');
  const [marksRegisterSortOrder, setMarksRegisterSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<{
    student: Student;
    marksMap: Record<string, ExamMark>;
    totalObtained: number;
    totalMax: number;
    percentage: number;
    grade: string;
    passStatus: string;
    rank: number;
  } | null>(null);

  useEffect(() => {
    if (!marksRegisterExamId && branchExamsList.length > 0) {
      setMarksRegisterExamId(branchExamsList[0].id);
    }
  }, [branchExamsList, marksRegisterExamId]);

  // Dynamically load subjects for selected exam & class
  const registerSubjects = useMemo(() => {
    const schedules = examSchedules.filter(
      s => s.examId === marksRegisterExamId && s.className === marksRegisterClass
    );
    const scheduleSubjects = Array.from(new Set(schedules.map(s => s.subject))).filter(Boolean);
    if (scheduleSubjects.length > 0) return scheduleSubjects;
    
    // Fallback to subjects where marks exist for this exam and class
    const marksSubjects = Array.from(new Set(
      examMarks.filter(m => m.examId === marksRegisterExamId && m.className === marksRegisterClass).map(m => m.subject)
    )).filter(Boolean);

    return marksSubjects.length > 0 ? marksSubjects : ['Mathematics', 'Physics', 'Chemistry', 'English'];
  }, [examSchedules, examMarks, marksRegisterExamId, marksRegisterClass]);

  // Compute student marks register data
  const registerStudentData = useMemo(() => {
    const classStudents = students.filter(
      st => st.className === marksRegisterClass &&
            (st.section === marksRegisterSection || !st.section || marksRegisterSection === 'All') &&
            (!st.branch || st.branch === selectedBranch)
    );

    const rows = classStudents.map(st => {
      const studentMarksList = examMarks.filter(m => m.examId === marksRegisterExamId && m.studentId === st.id);
      const marksMap: Record<string, ExamMark> = {};
      let totalObtained = 0;
      let totalMax = 0;
      let isAbsentAll = true;
      let hasFailed = false;

      registerSubjects.forEach(subj => {
        const mark = studentMarksList.find(m => m.subject === subj);
        if (mark) {
          marksMap[subj] = mark;
          if (!mark.isAbsent) {
            isAbsentAll = false;
            totalObtained += mark.marksObtained;
          }
          totalMax += mark.maxMarks || 100;
          if (mark.isAbsent || mark.marksObtained < mark.passMarks) {
            hasFailed = true;
          }
        } else {
          totalMax += 100;
        }
      });

      const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      
      let grade = 'F';
      const matchedGrade = gradeScaleList.find(g => percentage >= g.minMark && percentage <= g.maxMark);
      if (matchedGrade) {
        grade = matchedGrade.grade;
      } else {
        grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 33 ? 'D' : 'F';
      }

      const passStatus = !hasFailed && !isAbsentAll && percentage >= 33 ? 'Pass' : 'Fail';

      return {
        student: st,
        marksMap,
        totalObtained,
        totalMax,
        percentage,
        grade,
        passStatus,
        isAbsentAll,
        hasAppeared: !isAbsentAll && studentMarksList.length > 0
      };
    });

    const sortedForRank = [...rows].sort((a, b) => b.totalObtained - a.totalObtained);
    const rankedRows = rows.map(r => {
      const rank = sortedForRank.findIndex(sr => sr.student.id === r.student.id) + 1;
      return { ...r, rank };
    });

    let filtered = rankedRows;
    if (marksRegisterSearchQuery.trim()) {
      const q = marksRegisterSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const name = `${r.student.firstName} ${r.student.lastName}`.toLowerCase();
        const roll = (r.student.rollNo || '').toLowerCase();
        const adm = (r.student.admissionNo || r.student.id || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || adm.includes(q);
      });
    }

    filtered.sort((a, b) => {
      let valA: any = a.student.rollNo;
      let valB: any = b.student.rollNo;

      if (marksRegisterSortBy === 'name') {
        valA = `${a.student.firstName} ${a.student.lastName}`;
        valB = `${b.student.firstName} ${b.student.lastName}`;
      } else if (marksRegisterSortBy === 'percentage') {
        valA = a.percentage;
        valB = b.percentage;
      } else if (marksRegisterSortBy === 'totalMarks') {
        valA = a.totalObtained;
        valB = b.totalObtained;
      } else if (marksRegisterSortBy === 'grade') {
        valA = a.grade;
        valB = b.grade;
      }

      if (valA < valB) return marksRegisterSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return marksRegisterSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return { rows: rankedRows, filteredRows: filtered };
  }, [students, examMarks, marksRegisterExamId, marksRegisterClass, marksRegisterSection, selectedBranch, registerSubjects, gradeScaleList, marksRegisterSearchQuery, marksRegisterSortBy, marksRegisterSortOrder]);

  const marksRegisterStats = useMemo(() => {
    const allRows = registerStudentData.rows;
    const totalStudents = allRows.length;
    const appeared = allRows.filter(r => r.hasAppeared).length;
    const absent = allRows.filter(r => r.isAbsentAll).length;
    const passed = allRows.filter(r => r.passStatus === 'Pass').length;
    const failed = allRows.filter(r => r.passStatus === 'Fail').length;
    const avgPercentage = appeared > 0
      ? (allRows.reduce((acc, r) => acc + (r.hasAppeared ? r.percentage : 0), 0) / appeared).toFixed(2)
      : '0.00';

    return { totalStudents, appeared, absent, passed, failed, avgPercentage };
  }, [registerStudentData]);

  const handleExportCSV = () => {
    const headers = ['Roll No', 'Admission No', 'Student Name', ...registerSubjects, 'Total Marks', 'Max Marks', 'Percentage (%)', 'Grade', 'Result'];
    const rows = registerStudentData.filteredRows.map(r => {
      const subjectMarks = registerSubjects.map(subj => {
        const mark = r.marksMap[subj];
        if (!mark) return '—';
        return mark.isAbsent ? 'AB' : mark.marksObtained;
      });
      return [
        r.student.rollNo || '',
        r.student.admissionNo || r.student.id || '',
        `"${r.student.firstName} ${r.student.lastName}"`,
        ...subjectMarks,
        r.totalObtained,
        r.totalMax,
        `${r.percentage}%`,
        r.grade,
        r.passStatus
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Marks_Register_${marksRegisterClass}_${marksRegisterSection}_${selectedAcademicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Exported digital marks register to CSV file.');
  };

  const handlePrintMarksRegister = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-600 text-white rounded-2xl shadow-lg shadow-sky-600/30">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Examinations Hub</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Enterprise Examination Lifecycle • Setups, Evaluation, Result Processing & Report Cards
            </p>
          </div>
        </div>

        {/* Global Session & Branch Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer text-slate-800 dark:text-white"
            >
              {branchOptions.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <select
              value={selectedAcademicYear}
              onChange={e => setSelectedAcademicYear(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer text-slate-800 dark:text-white"
            >
              {academicYearOptions.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Top-Level Main Navigation Bar */}
      {!isStudentOrParent && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2">
          {[
            { id: 'setup', label: 'Exam Setup', icon: Award, desc: 'Master setups, schedules, rooms & papers' },
            { id: 'evaluation', label: 'Evaluation', icon: Edit, desc: 'Marks entry & grade rules' },
            { id: 'results', label: 'Results', icon: RefreshCw, desc: 'Process, verify, approve & publish' },
            { id: 'reports', label: 'Reports', icon: Printer, desc: 'Report cards & performance analytics' }
          ].map(t => (
            <button
              key={t.id}
              onClick={(e) => {
                setActiveTab(t.id as MainTab);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }}
              className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2.5 transition-all ${
                activeTab === t.id
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <t.icon className="w-4 h-4" />
              <div className="text-left">
                <span className="block">{t.label}</span>
                <span className="text-[9px] font-normal opacity-80 block">{t.desc}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 1: EXAM SETUP (MASTER + SCHEDULE + ROOMS + PAPERS)
          ---------------------------------------------------- */}
      {activeTab === 'setup' && !isStudentOrParent && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Dashboard Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-3xl space-y-1 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Examinations</span>
                <Award className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{dashboardStats.total}</p>
              <p className="text-[10px] text-slate-400">In {selectedAcademicYear}</p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Scheduled / Ready</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-blue-600">{dashboardStats.scheduled}</p>
              <p className="text-[10px] text-slate-400">Upcoming setups</p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Ongoing</span>
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              </div>
              <p className="text-2xl font-black text-amber-600">{dashboardStats.ongoing}</p>
              <p className="text-[10px] text-slate-400">Active date span</p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Completed / Published</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600">{dashboardStats.completed}</p>
              <p className="text-[10px] text-slate-400">Results released</p>
            </div>
          </div>

          {selectedExamWorkspace ? (
            /* ====================================================
               RESTRUCTURED 6-STEP GUIDED SETUP WORKSPACE
               ==================================================== */
            <div className="space-y-6">
              {/* Workspace Header Card */}
              <div className="glass-card p-6 rounded-3xl space-y-4 border border-sky-100 dark:border-sky-900/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedExamWorkspace(null)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      ← Back to Directory
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          {selectedExamWorkspace.examType || 'Term Exam'}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Lifecycle: {getExamLifecycleStatus(selectedExamWorkspace)}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {selectedExamWorkspace.name}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Session: {selectedExamWorkspace.academicYear} • Branch: {selectedExamWorkspace.branch || 'Main Campus'} • Duration: {formatDisplayDate(selectedExamWorkspace.startDate)} to {formatDisplayDate(selectedExamWorkspace.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdminOrPrincipal && (
                      <button
                        onClick={() => handleOpenEditExam(selectedExamWorkspace)}
                        className="px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold text-xs flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Setup
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Setup Checklist Header */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-600" /> Exam Setup Progress
                    </span>
                    <span className="font-mono font-black text-sky-600 text-sm">
                      {getExamProgress(selectedExamWorkspace)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${getExamProgress(selectedExamWorkspace)}%` }}
                    />
                  </div>

                  {/* Checklist Indicators */}
                  {(() => {
                    const check = getExamChecklist(selectedExamWorkspace);
                    return (
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold">
                        <span className={`flex items-center gap-1 ${check.hasDetails ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {check.hasDetails ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />} Exam Details
                        </span>
                        <span className={`flex items-center gap-1 ${check.hasClasses ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {check.hasClasses ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />} Classes Assigned
                        </span>
                        <span className={`flex items-center gap-1 ${check.hasTimetable ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {check.hasTimetable ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />} Timetable ({check.scheduledSubjectCount} Subjects)
                        </span>
                        <span className={`flex items-center gap-1 ${check.hasRooms && check.hasInvigilators ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {check.hasRooms && check.hasInvigilators ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />} Room & Invigilators
                        </span>
                        <span className={`flex items-center gap-1 ${check.hasPapers ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {check.hasPapers ? <CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> : <Square className="w-3.5 h-3.5 text-slate-400" />} Question Papers (Optional)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* 6-Step Internal Guided Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {[
                    { id: 'details', label: '1. Exam Details', icon: Award },
                    { id: 'classes', label: '2. Classes', icon: Users },
                    { id: 'timetable', label: '3. Timetable', icon: Calendar },
                    { id: 'rooms_invigilators', label: '4. Room & Staff', icon: MapPin },
                    { id: 'papers', label: '5. Papers', icon: FileText },
                    { id: 'publish', label: '6. Publish', icon: ShieldCheck }
                  ].map(step => (
                    <button
                      key={step.id}
                      onClick={() => setSetupStep(step.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                        setupStep === step.id
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <step.icon className="w-3.5 h-3.5" />
                      <span className="truncate">{step.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 1: EXAM DETAILS */}
              {setupStep === 'details' && (
                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Exam Configuration Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Exam Name</span>
                      <p className="font-black text-slate-900 dark:text-white text-base">{selectedExamWorkspace.name}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Exam Type</span>
                      <p className="font-bold text-sky-600">{selectedExamWorkspace.examType || 'Term Exam'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Scheduled Date Span</span>
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatDisplayDate(selectedExamWorkspace.startDate)} ➔ {formatDisplayDate(selectedExamWorkspace.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={() => setSetupStep('classes')}
                      className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-2"
                    >
                      Next: Applicable Classes →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: APPLICABLE CLASSES */}
              {setupStep === 'classes' && (
                <div className="glass-card p-6 rounded-3xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                        <Users className="w-5 h-5 text-sky-600" />
                        Applicable Target Classes ({selectedExamWorkspace.applicableClasses?.length || 0} Assigned)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Add or remove classes participating in this examination setup</p>
                    </div>

                    {isAdminOrPrincipal && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const updated = { ...selectedExamWorkspace, applicableClasses: [...classOptions] };
                            setSelectedExamWorkspace(updated);
                            updateExam(selectedExamWorkspace.id, { applicableClasses: classOptions });
                            addToast('success', 'All Classes Assigned', 'Assigned all available school classes to this exam.');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-xs hover:bg-sky-100 transition-colors"
                        >
                          + Select All Classes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Assigned Classes */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Currently Assigned Classes
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {(selectedExamWorkspace.applicableClasses || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No classes assigned yet. Click on available classes below to add.</p>
                      ) : (
                        (selectedExamWorkspace.applicableClasses || []).map(c => (
                          <div
                            key={c}
                            className="px-3.5 py-2 rounded-2xl bg-sky-600 text-white font-extrabold text-xs shadow-md flex items-center gap-2 group animate-in fade-in"
                          >
                            <CheckCircle className="w-4 h-4 text-sky-200" />
                            <span>{c}</span>
                            {isAdminOrPrincipal && (
                              <button
                                type="button"
                                onClick={() => {
                                  const current = selectedExamWorkspace.applicableClasses || [];
                                  if (current.length <= 1) {
                                    addToast('warning', 'Minimum Requirement', 'An examination must have at least one applicable class.');
                                    return;
                                  }
                                  const updatedClasses = current.filter(cls => cls !== c);
                                  const updated = { ...selectedExamWorkspace, applicableClasses: updatedClasses };
                                  setSelectedExamWorkspace(updated);
                                  updateExam(selectedExamWorkspace.id, { applicableClasses: updatedClasses });
                                  addToast('info', 'Class Removed', `Removed ${c} from examination.`);
                                }}
                                title={`Delete ${c}`}
                                className="p-0.5 rounded-full hover:bg-sky-700 text-sky-200 hover:text-white transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Available School Classes Selector */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Add More Classes (Available School Classes)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {classOptions
                        .filter(c => !(selectedExamWorkspace.applicableClasses || []).includes(c))
                        .map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              if (!isAdminOrPrincipal) return;
                              const current = selectedExamWorkspace.applicableClasses || [];
                              const updatedClasses = [...current, c].sort();
                              const updated = { ...selectedExamWorkspace, applicableClasses: updatedClasses };
                              setSelectedExamWorkspace(updated);
                              updateExam(selectedExamWorkspace.id, { applicableClasses: updatedClasses });
                              addToast('success', 'Class Added', `Added ${c} to examination.`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300 hover:text-sky-600 font-bold text-xs border border-slate-200 dark:border-slate-700 hover:border-sky-300 transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5 text-sky-600" /> {c}
                          </button>
                        ))}
                      {classOptions.every(c => (selectedExamWorkspace.applicableClasses || []).includes(c)) && (
                        <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> All registered school classes have been assigned to this exam.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setSetupStep('details')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">← Back</button>
                    <button onClick={() => setSetupStep('timetable')} className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md">Next: Exam Timetable →</button>
                  </div>
                </div>
              )}

              {/* STEP 3: EXAM TIMETABLE */}
              {setupStep === 'timetable' && (
                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-sky-600" />
                        Exam Timetable ({examSchedules.filter(s => s.examId === selectedExamWorkspace.id).length} / 5 Subjects Scheduled)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Assign exam dates and timings for individual subjects</p>
                    </div>
                    {isAdminOrPrincipal && (
                      <button
                        onClick={() => {
                          setEditingSchedule(null);
                          setSelectedScheduleClasses([selectedExamWorkspace.applicableClasses?.[0] || 'Class 10']);
                          setScheduleForm({
                            examId: selectedExamWorkspace.id,
                            date: selectedExamWorkspace.startDate || new Date().toISOString().split('T')[0],
                            startTime: '09:00',
                            endTime: '12:00',
                            subject: subjectOptions[0] || 'Mathematics',
                            className: selectedExamWorkspace.applicableClasses?.[0] || 'Class 10',
                            section: 'All Sections',
                            maxMarks: 100,
                            passMarks: 33,
                            room: 'Hall A',
                            invigilatorId: '',
                            invigilatorName: 'Assigned Staff'
                          });
                          setIsScheduleModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20"
                      >
                        <Plus className="w-4 h-4" /> Add Timetable Entry
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase tracking-tight">
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Exam Date</th>
                          <th className="py-3 px-4">Timing</th>
                          <th className="py-3 px-4">Class & Section</th>
                          {isAdminOrPrincipal && <th className="py-3 px-4 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        {examSchedules.filter(s => s.examId === selectedExamWorkspace.id).length === 0 ? (
                          <tr>
                            <td colSpan={isAdminOrPrincipal ? 5 : 4} className="py-10 text-center text-slate-400 font-medium">
                              No subject exam dates scheduled yet. Click "+ Add Timetable Entry" to begin.
                            </td>
                          </tr>
                        ) : (
                          examSchedules.filter(s => s.examId === selectedExamWorkspace.id).map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-sm">{s.subject}</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-sky-600">{formatDisplayDate(s.date)}</td>
                              <td className="py-3.5 px-4 font-medium">{s.startTime} - {s.endTime}</td>
                              <td className="py-3.5 px-4 font-bold">{s.className} ({s.section})</td>
                              {isAdminOrPrincipal && (
                                <td className="py-3.5 px-4 text-right space-x-1">
                                  <button
                                    onClick={() => {
                                      setEditingSchedule(s);
                                      setSelectedScheduleClasses([s.className]);
                                      setScheduleForm(s);
                                      setIsScheduleModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                                    title="Edit Schedule"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Delete schedule for ${s.subject}?`)) {
                                        deleteExamSchedule(s.id);
                                        addToast('success', 'Deleted', `Deleted schedule for ${s.subject}`);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                    title="Delete Schedule"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button onClick={() => setSetupStep('classes')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">← Back</button>
                    <button onClick={() => setSetupStep('rooms_invigilators')} className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs">Next: Room & Staff Allocation →</button>
                  </div>
                </div>
              )}

              {/* STEP 4: ROOM & INVIGILATOR ALLOCATION (COMBINED UNIFIED SCREEN) */}
              {setupStep === 'rooms_invigilators' && (
                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-sky-600" />
                        Room Venue, Bench Capacity & Invigilator Staff Allocation
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Unified screen mapping Class ➔ Section ➔ Room Venue ➔ Bench Capacity ➔ Invigilator Staff</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 font-extrabold uppercase text-slate-500 border-b">
                          <th className="p-3">Subject</th>
                          <th className="p-3">Class & Section</th>
                          <th className="p-3">Date & Time</th>
                          <th className="p-3">Assigned Room Venue</th>
                          <th className="p-3 text-center">Bench Capacity / Seats</th>
                          <th className="p-3">Invigilator Staff</th>
                          {isAdminOrPrincipal && <th className="p-3 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                        {examSchedules.filter(s => s.examId === selectedExamWorkspace.id).map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{s.subject}</td>
                            <td className="p-3 font-bold">{s.className} ({s.section})</td>
                            <td className="p-3 font-mono">{formatDisplayDate(s.date)} ({s.startTime}-{s.endTime})</td>
                            <td className="p-3 font-mono font-bold text-sky-600">{s.room || 'Hall A'}</td>
                            <td className="p-3 text-center font-mono font-bold">40 Seats</td>
                            <td className="p-3">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                                {s.invigilatorName || 'Assigned Staff'}
                              </span>
                            </td>
                            {isAdminOrPrincipal && (
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setEditingSchedule(s);
                                    setSelectedScheduleClasses([s.className]);
                                    setScheduleForm(s);
                                    setIsScheduleModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-600 font-bold text-xs hover:bg-sky-100"
                                >
                                  Edit Room & Staff
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button onClick={() => setSetupStep('timetable')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">← Back</button>
                    <button onClick={() => setSetupStep('papers')} className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs">Next: Question Papers →</button>
                  </div>
                </div>
              )}

              {/* STEP 5: QUESTION PAPERS */}
              {setupStep === 'papers' && (
                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-5 h-5 text-sky-600" />
                        Question Papers Vault (Optional)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Upload, manage, preview, and publish question papers for this exam</p>
                    </div>
                    {(isAdminOrPrincipal || isTeacher) && (
                      <button
                        onClick={handleOpenAddPaper}
                        className="px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Upload className="w-4 h-4" /> Upload Paper
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto border rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-500">
                          <th className="p-3">Paper Title & File</th>
                          <th className="p-3">Class & Section</th>
                          <th className="p-3">Subject</th>
                          <th className="p-3">Uploaded By</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                        {questionPapers.filter(p => p.examId === selectedExamWorkspace.id).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 italic font-medium">
                              No question papers uploaded for this exam setup yet (Optional).
                            </td>
                          </tr>
                        ) : (
                          questionPapers.filter(p => p.examId === selectedExamWorkspace.id).map(paper => (
                            <tr key={paper.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">{paper.paperTitle}</td>
                              <td className="p-3 font-bold">{paper.className} ({paper.section})</td>
                              <td className="p-3 text-sky-600 font-bold">{formatSubject(paper.subject)}</td>
                              <td className="p-3">{paper.uploadedBy}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  paper.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {paper.status}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-1">
                                <button onClick={() => setViewingPaper(paper)} className="p-1 text-slate-500 hover:text-slate-800"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => handleTogglePublishPaper(paper)} className="p-1 text-emerald-600"><Lock className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button onClick={() => setSetupStep('rooms_invigilators')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">← Back</button>
                    <button onClick={() => setSetupStep('publish')} className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs">Next: Publish Examination →</button>
                  </div>
                </div>
              )}

              {/* STEP 6: PUBLISH EXAMINATION (STRICT VALIDATION RULES) */}
              {setupStep === 'publish' && (
                <div className="glass-card p-6 rounded-3xl space-y-5">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-sky-600" />
                    Examination Publish Control & Strict Validation Checklist
                  </h3>

                  {(() => {
                    const check = getExamChecklist(selectedExamWorkspace);
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                          <div className={`flex items-center gap-2 font-bold ${check.hasDetails ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {check.hasDetails ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>Exam Details Completed</span>
                          </div>
                          <div className={`flex items-center gap-2 font-bold ${check.hasClasses ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {check.hasClasses ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>Target Classes Assigned</span>
                          </div>
                          <div className={`flex items-center gap-2 font-bold ${check.hasTimetable ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {check.hasTimetable ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>Exam Timetable Scheduled ({check.scheduledSubjectCount} Subjects)</span>
                          </div>
                          <div className={`flex items-center gap-2 font-bold ${check.hasRooms && check.hasInvigilators ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {check.hasRooms && check.hasInvigilators ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>Rooms & Invigilator Staff Allocated</span>
                          </div>
                        </div>

                        {!check.isValidToPublish && (
                          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                            <p>Publishing is blocked. Please complete all mandatory checklist items above before releasing the examination.</p>
                          </div>
                        )}

                        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                          <div>
                            <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 text-xs">Publish Examination Setup</h4>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Releases examination timetable, rooms, and staff invigilators to staff and student portals.</p>
                          </div>
                          {isAdminOrPrincipal && (
                            <button
                              disabled={!check.isValidToPublish}
                              onClick={() => {
                                const newStatus = selectedExamWorkspace.publishStatus === 'Published' ? 'Draft' : 'Published';
                                updateExam(selectedExamWorkspace.id, { publishStatus: newStatus as any });
                                setSelectedExamWorkspace({ ...selectedExamWorkspace, publishStatus: newStatus as any });
                                addToast('success', 'Status Updated', `Examination is now ${newStatus}.`);
                              }}
                              className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-md transition-all ${
                                check.isValidToPublish
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Toggle Publish Status
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* ====================================================
               EXAMINATIONS DIRECTORY VIEW (CARDS & TABLE)
               ==================================================== */
            <div className="space-y-6">
              {/* Directory Filter Bar */}
              <div className="glass-card p-4 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-semibold">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Search Examinations</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search exam title, type..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Exam Type</label>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="">All Types</option>
                    <option value="Unit Test">Unit Test</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Annual">Annual</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full justify-center">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>

                {isAdminOrPrincipal && (
                  <div className="flex items-end">
                    <button
                      onClick={handleOpenAddExam}
                      className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Setup Exam
                    </button>
                  </div>
                )}
              </div>

              {/* Directory Cards & Table */}
              {(() => {
                const filteredExams = branchExamsList.filter(ex => {
                  if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const match = ex.name.toLowerCase().includes(q) || (ex.examType && ex.examType.toLowerCase().includes(q));
                    if (!match) return false;
                  }
                  if (filterType && ex.examType !== filterType) return false;
                  return true;
                });

                if (filteredExams.length === 0) {
                  return (
                    <div className="glass-card p-12 text-center rounded-3xl space-y-2">
                      <Award className="h-10 w-10 mx-auto text-slate-400 opacity-60" />
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200">No Examinations Found</h4>
                      <p className="text-slate-500 max-w-sm mx-auto text-xs font-semibold">
                        There are no examinations matching your search or filters. Click "Setup Exam" above to configure your first examination.
                      </p>
                    </div>
                  );
                }

                if (viewMode === 'grid') {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredExams.map(ex => {
                        const progress = getExamProgress(ex);
                        const lifecycle = getExamLifecycleStatus(ex);
                        const schedules = examSchedules.filter(s => s.examId === ex.id);
                        return (
                          <div key={ex.id} className="glass-card rounded-3xl p-6 space-y-4 hover:shadow-xl transition-all relative overflow-hidden group border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                    {ex.examType || 'Term Exam'}
                                  </span>
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                    lifecycle === 'Published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' :
                                    lifecycle === 'Ongoing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse' :
                                    'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                  }`}>
                                    {lifecycle}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-sky-600 transition-colors">{ex.name}</h4>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Session {ex.academicYear} • Branch: {ex.branch || 'Main Campus'}</p>
                              </div>

                              {isAdminOrPrincipal && (
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                  <button onClick={() => handleOpenEditExam(ex)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-blue-600 transition-colors" title="Edit Exam Setup">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setDeletingExam(ex)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-rose-600 transition-colors" title="Delete Exam Setup">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Setup Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>Exam Setup Progress</span>
                                <span className="font-mono text-sky-600">{progress}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs font-semibold">
                              <div>
                                <span className="block text-[10px] uppercase font-extrabold text-slate-400">Scheduled Span</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">{formatDisplayDate(ex.startDate)} ➔ {formatDisplayDate(ex.endDate)}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase font-extrabold text-slate-400">Scheduled Subjects</span>
                                <span className="text-sky-600 dark:text-sky-400 font-black">{schedules.length} / 5 Scheduled</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                              <button
                                onClick={() => {
                                  setSelectedExamWorkspace(ex);
                                  setSetupStep('details');
                                }}
                                className="w-full py-2 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white dark:bg-sky-950/50 dark:text-sky-400 dark:hover:bg-sky-600 font-extrabold text-xs transition-all flex items-center justify-center gap-1"
                              >
                                Open Setup Wizard →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="glass-card rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                            <th className="p-4">Exam Name</th>
                            <th className="p-4">Lifecycle State</th>
                            <th className="p-4">Date Range</th>
                            <th className="p-4 text-center">Scheduled Subjects</th>
                            <th className="p-4 text-center">Progress</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredExams.map(ex => {
                            const schedules = examSchedules.filter(s => s.examId === ex.id);
                            const lifecycle = getExamLifecycleStatus(ex);
                            const progress = getExamProgress(ex);
                            return (
                              <tr key={ex.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-4 font-black text-slate-900 dark:text-white text-sm">{ex.name}</td>
                                <td className="p-4 font-bold text-sky-600">{lifecycle}</td>
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{formatDisplayDate(ex.startDate)} to {formatDisplayDate(ex.endDate)}</td>
                                <td className="p-4 text-center font-extrabold text-slate-800 dark:text-slate-200">{schedules.length} / 5 Scheduled</td>
                                <td className="p-4 text-center font-mono font-bold text-sky-600">{progress}%</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedExamWorkspace(ex);
                                      setSetupStep('details');
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-colors"
                                  >
                                    Manage Setup Wizard
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: EVALUATION (MARKS + ABSENT + GRACE + GRADES)
          ---------------------------------------------------- */}
      {activeTab === 'evaluation' && !isStudentOrParent && (
        <div className="space-y-6 animate-in fade-in">
          {/* Internal Sub-Navigation Pill */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-max">
            {[
              { id: 'marks', label: 'Marks Entry', icon: Edit },
              { id: 'absent', label: 'Absent Management', icon: UserCheck },
              { id: 'grace', label: 'Grace Marks', icon: Award },
              { id: 'grades', label: 'Grade Configurations', icon: BarChart2 }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setEvaluationSubTab(sub.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  evaluationSubTab === sub.id ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-md' : 'text-slate-500'
                }`}
              >
                <sub.icon className="w-4 h-4" /> {sub.label}
              </button>
            ))}
          </div>

          {/* SUB-TAB 1 & 2 & 3: MARKS ENTRY & ABSENT MANAGEMENT & GRACE MARKS */}
          {(evaluationSubTab === 'marks' || evaluationSubTab === 'absent' || evaluationSubTab === 'grace') && (
            <div className="space-y-5">
              {/* Filter Bar */}
              <div className="glass-card p-5 rounded-3xl space-y-4">
                <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Target Examination Selection</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Target Exam Setup</label>
                    <select
                      value={marksExamId}
                      onChange={e => setMarksExamId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      {branchExamsList.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Class</label>
                    <select
                      value={marksClass}
                      onChange={e => setMarksClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      {classOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Section</label>
                    <select
                      value={marksSection}
                      onChange={e => setMarksSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      {['A', 'B', 'C'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Subject</label>
                    <select
                      value={marksSubject}
                      onChange={e => setMarksSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      {allSubjectOptions.map(s => (
                        <option key={s} value={s}>{formatSubject(s)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Evaluation Sheet */}
              <div className="glass-card rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                      Evaluation Sheet: {marksSubject} ({marksClass}-{marksSection})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Enter evaluation marks for students or mark as absent</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveMarks}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/20 text-xs flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Evaluation Entries
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b">
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Roll No</th>
                        <th className="py-3 px-4">Absent</th>
                        <th className="py-3 px-4">Marks Obtained (Out of 100)</th>
                        <th className="py-3 px-4">Grade & Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                      {students.filter(s => s.className === marksClass && s.section === marksSection && s.branch === selectedBranch).map(st => {
                        const markEntry = marksList[st.id] || { marksObtained: 0, isAbsent: false };
                        const score = typeof markEntry.marksObtained === 'number' ? markEntry.marksObtained : parseFloat(markEntry.marksObtained) || 0;
                        const pct = score;
                        const isPass = !markEntry.isAbsent && pct >= 33;
                        const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 33 ? 'D' : 'F';

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{st.firstName} {st.lastName}</td>
                            <td className="py-3 px-4 font-mono">{st.rollNo}</td>
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={markEntry.isAbsent}
                                onChange={e => {
                                  setMarksList({
                                    ...marksList,
                                    [st.id]: { ...markEntry, isAbsent: e.target.checked }
                                  });
                                }}
                                className="w-4 h-4 rounded text-sky-600 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                disabled={markEntry.isAbsent}
                                min={0}
                                max={100}
                                value={markEntry.isAbsent ? '' : markEntry.marksObtained}
                                onChange={e => {
                                  setMarksList({
                                    ...marksList,
                                    [st.id]: { ...markEntry, marksObtained: e.target.value }
                                  });
                                }}
                                className="w-28 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold font-mono text-slate-900 dark:text-white"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                                markEntry.isAbsent ? 'bg-slate-100 text-slate-500' :
                                isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {markEntry.isAbsent ? 'Absent' : `Grade ${grade} (${isPass ? 'Pass' : 'Fail'})`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: GRADE CONFIGURATIONS */}
          {evaluationSubTab === 'grades' && (
            <div className="glass-card p-6 rounded-3xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Grade Boundary Rules & GPA Scale
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Configure scholastic grading scale ranges, GPA points, and pass criteria</p>
                </div>
                {isAdminOrPrincipal && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGradeScaleList(defaultGradeConfigs)}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGradeScaleList([
                          ...gradeScaleList,
                          { grade: 'Grade', minMark: 0, maxMark: 100, gradePoint: 5, remarks: 'Scholastic Performance' }
                        ]);
                      }}
                      className="px-3.5 py-2 bg-sky-50 dark:bg-sky-950 text-sky-600 font-bold rounded-2xl text-xs flex items-center gap-1.5 hover:bg-sky-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Grade Rule
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveGradeConfig(gradeScaleList)}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md"
                    >
                      <Save className="w-4 h-4" /> Save Grade Configuration
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-500 border-b">
                      <th className="p-3">Grade Title</th>
                      <th className="p-3">Min Percentage (%)</th>
                      <th className="p-3">Max Percentage (%)</th>
                      <th className="p-3 text-center">GPA Point</th>
                      <th className="p-3">Remarks / Performance Description</th>
                      {isAdminOrPrincipal && <th className="p-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                    {gradeScaleList.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-black text-slate-900 dark:text-white">
                          <input
                            type="text"
                            value={g.grade}
                            onChange={e => {
                              const updated = [...gradeScaleList];
                              updated[idx] = { ...updated[idx], grade: e.target.value };
                              setGradeScaleList(updated);
                            }}
                            className="w-20 px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-black text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={g.minMark}
                              onChange={e => {
                                const updated = [...gradeScaleList];
                                updated[idx] = { ...updated[idx], minMark: parseFloat(e.target.value) || 0 };
                                setGradeScaleList(updated);
                              }}
                              className="w-20 px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white font-mono"
                            />
                            <span>%</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={g.maxMark}
                              onChange={e => {
                                const updated = [...gradeScaleList];
                                updated[idx] = { ...updated[idx], maxMark: parseFloat(e.target.value) || 0 };
                                setGradeScaleList(updated);
                              }}
                              className="w-20 px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white font-mono"
                            />
                            <span>%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-sky-600">
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            max={10}
                            value={g.gradePoint}
                            onChange={e => {
                              const updated = [...gradeScaleList];
                              updated[idx] = { ...updated[idx], gradePoint: parseFloat(e.target.value) || 0 };
                              setGradeScaleList(updated);
                            }}
                            className="w-16 px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-sky-600 text-center font-mono"
                          />
                        </td>
                        <td className="p-3 text-slate-500">
                          <input
                            type="text"
                            value={g.remarks || ''}
                            onChange={e => {
                              const updated = [...gradeScaleList];
                              updated[idx] = { ...updated[idx], remarks: e.target.value };
                              setGradeScaleList(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                          />
                        </td>
                        {isAdminOrPrincipal && (
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = gradeScaleList.filter((_, i) => i !== idx);
                                setGradeScaleList(updated);
                              }}
                              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Grade Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: RESULTS (PROCESS ➔ VERIFY ➔ APPROVE ➔ PUBLISH)
          ---------------------------------------------------- */}
      {activeTab === 'results' && !isStudentOrParent && (
        <div className="space-y-6 animate-in fade-in">
          {/* 4-Step Result Pipeline Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 glass-card p-3 rounded-3xl">
            {[
              { id: 'process', label: '1. Compute Results', icon: RefreshCw },
              { id: 'verify', label: '2. Audit & Verify', icon: Eye },
              { id: 'approve', label: '3. Admin Approval', icon: CheckCircle },
              { id: 'publish', label: '4. Release & Publish', icon: Printer }
            ].map(step => (
              <button
                key={step.id}
                onClick={() => setResultStep(step.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  resultStep === step.id
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span>{step.label}</span>
              </button>
            ))}
          </div>

          {/* Filter Card */}
          <div className="glass-card p-5 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Target Examination</label>
              <select
                value={resultExamId}
                onChange={e => setResultExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
              >
                {branchExamsList.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Class</label>
              <select
                value={resultClass}
                onChange={e => setResultClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
              >
                {classOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Section</label>
              <select
                value={resultSection}
                onChange={e => setResultSection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
              >
                {['A', 'B', 'C'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP 1: PROCESS RESULTS */}
          {resultStep === 'process' && (
            <div className="glass-card p-8 rounded-3xl text-center space-y-4">
              <RefreshCw className="w-12 h-12 text-sky-600 mx-auto animate-spin-slow" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Automated Result Computation Engine</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto font-medium">
                Compute total marks, percentages, GPA, grade rankings, and pass/fail statuses for Class {resultClass}-{resultSection}.
              </p>
              {isAdminOrPrincipal && (
                <button
                  onClick={handleProcessResults}
                  className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Compute & Process Results
                </button>
              )}
            </div>
          )}

          {/* STEP 2, 3, 4: VERIFY, APPROVE & PUBLISH */}
          {(resultStep === 'verify' || resultStep === 'approve' || resultStep === 'publish') && (
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                  Processed Results Registry ({resultClass}-{resultSection})
                </h3>
                {resultStep === 'approve' && isAdminOrPrincipal && (
                  <button
                    onClick={() => {
                      const list = processedResults.filter(r => r.examId === resultExamId && r.className === resultClass);
                      list.forEach(r => updateResultStatus(r.id, 'Approved'));
                      addToast('success', 'Approved', `Approved results for ${list.length} students.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    Approve All Class Results
                  </button>
                )}
                {resultStep === 'publish' && isAdminOrPrincipal && (
                  <button
                    onClick={() => {
                      const list = processedResults.filter(r => r.examId === resultExamId && r.className === resultClass);
                      list.forEach(r => updateResultStatus(r.id, 'Published'));
                      addToast('success', 'Published', `Published results for ${list.length} students to portal.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                  >
                    Publish All to Student Portal
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-500 border-b">
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Roll No</th>
                      <th className="p-3 text-center">Marks Obtained</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3 text-center">GPA</th>
                      <th className="p-3 text-center">Pass Status</th>
                      <th className="p-3 text-center">Approval Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                    {processedResults.filter(r => r.examId === resultExamId && r.className === resultClass && r.section === resultSection).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          No processed results found. Please click "Compute Results" in Step 1.
                        </td>
                      </tr>
                    ) : (
                      processedResults.filter(r => r.examId === resultExamId && r.className === resultClass && r.section === resultSection).map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-black text-slate-900 dark:text-white">{r.studentName}</td>
                          <td className="p-3 font-mono">{r.rollNo}</td>
                          <td className="p-3 text-center font-mono font-bold">{r.totalMarksObtained} / {r.totalMaxMarks}</td>
                          <td className="p-3 text-center font-mono font-bold text-sky-600">{r.percentage}%</td>
                          <td className="p-3 text-center font-mono font-bold">{r.gpa}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.passStatus === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {r.passStatus}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                              r.status === 'Approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 4: REPORTS (MARKS REGISTER + REPORT CARDS + TOP PERFORMERS + ANALYTICS)
          ---------------------------------------------------- */}
      {activeTab === 'reports' && !isStudentOrParent && (
        <div className="space-y-6 animate-in fade-in">
          {/* Sub-Navigation Pill */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-max overflow-x-auto">
            {[
              { id: 'marksRegister', label: 'View Marks Register', icon: FileSpreadsheet },
              { id: 'reportCards', label: 'Printable Report Cards', icon: Printer },
              { id: 'topPerformers', label: 'Top Performers Leaderboard', icon: Award },
              { id: 'analytics', label: 'Performance Analytics', icon: BarChart2 }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setReportsSubTab(sub.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  reportsSubTab === sub.id ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <sub.icon className="w-4 h-4" /> {sub.label}
              </button>
            ))}
          </div>

          {/* SUB-TAB 0: VIEW MARKS REGISTER */}
          {reportsSubTab === 'marksRegister' && (
            <div className="space-y-6">
              {/* Central Filter Bar */}
              <div className="glass-card p-5 rounded-3xl space-y-4 border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                      Official Digital Marks Register Filter
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Filter, search, sort, and export subject-wise student examination marks</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Excel / CSV
                    </button>
                    <button
                      onClick={handlePrintMarksRegister}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Register
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Academic Year *</label>
                    <input
                      type="text"
                      disabled
                      value={selectedAcademicYear}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Branch *</label>
                    <input
                      type="text"
                      disabled
                      value={selectedBranch}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Examination *</label>
                    <select
                      value={marksRegisterExamId}
                      onChange={e => setMarksRegisterExamId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      {branchExamsList.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Class *</label>
                    <select
                      value={marksRegisterClass}
                      onChange={e => setMarksRegisterClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      {classOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Section *</label>
                    <select
                      value={marksRegisterSection}
                      onChange={e => setMarksRegisterSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="All">All Sections</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Search Student</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Name, Roll, Adm No..."
                        value={marksRegisterSearchQuery}
                        onChange={e => setMarksRegisterSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Enrolled</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{marksRegisterStats.totalStudents}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Appeared</span>
                  <p className="text-xl font-black text-sky-600">{marksRegisterStats.appeared}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Absent</span>
                  <p className="text-xl font-black text-slate-400">{marksRegisterStats.absent}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Passed</span>
                  <p className="text-xl font-black text-emerald-600">{marksRegisterStats.passed}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Failed</span>
                  <p className="text-xl font-black text-rose-600">{marksRegisterStats.failed}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Class Avg %</span>
                  <p className="text-xl font-black text-purple-600">{marksRegisterStats.avgPercentage}%</p>
                </div>
              </div>

              {/* Dynamic Marks Register Table */}
              <div className="glass-card rounded-3xl p-6 space-y-4 border border-slate-100 dark:border-slate-800 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                      Subject-Wise Marks Register ({marksRegisterClass}-{marksRegisterSection})
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Showing {registerStudentData.filteredRows.length} student records. Click any row to view full student marks statement.</p>
                  </div>

                  {/* Sort Control */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-400">Sort By:</span>
                    <select
                      value={marksRegisterSortBy}
                      onChange={e => setMarksRegisterSortBy(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      <option value="rollNo">Roll Number</option>
                      <option value="name">Student Name</option>
                      <option value="totalMarks">Total Marks</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="grade">Grade</option>
                    </select>
                    <button
                      onClick={() => setMarksRegisterSortOrder(marksRegisterSortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200"
                    >
                      {marksRegisterSortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase border-b tracking-tight">
                        <th className="py-3 px-3">Roll</th>
                        <th className="py-3 px-3">Adm No</th>
                        <th className="py-3 px-4">Student Name</th>
                        {/* Dynamic Subject Columns */}
                        {registerSubjects.map(subj => (
                          <th key={subj} className="py-3 px-3 text-center text-sky-600 dark:text-sky-400">{subj}</th>
                        ))}
                        <th className="py-3 px-3 text-center">Total Marks</th>
                        <th className="py-3 px-3 text-center">%</th>
                        <th className="py-3 px-3 text-center">Grade</th>
                        <th className="py-3 px-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                      {registerStudentData.filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={4 + registerSubjects.length + 4} className="py-12 text-center text-slate-400 italic">
                            No student marks entries found matching your selected filters.
                          </td>
                        </tr>
                      ) : (
                        registerStudentData.filteredRows.map(row => (
                          <tr
                            key={row.student.id}
                            onClick={() => setSelectedStudentDetail(row)}
                            className="hover:bg-sky-50/50 dark:hover:bg-sky-950/30 cursor-pointer transition-colors"
                          >
                            <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{row.student.rollNo || '—'}</td>
                            <td className="py-3.5 px-3 font-mono text-slate-500">{row.student.admissionNo || row.student.id || '—'}</td>
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-sm">{row.student.firstName} {row.student.lastName}</td>
                            
                            {/* Dynamic Subject Marks */}
                            {registerSubjects.map(subj => {
                              const mark = row.marksMap[subj];
                              if (!mark) return <td key={subj} className="py-3.5 px-3 text-center text-slate-400 font-mono">—</td>;
                              if (mark.isAbsent) {
                                return <td key={subj} className="py-3.5 px-3 text-center font-mono font-extrabold text-rose-500">AB</td>;
                              }
                              return (
                                <td key={subj} className="py-3.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {mark.marksObtained}
                                </td>
                              );
                            })}

                            <td className="py-3.5 px-3 text-center font-mono font-black text-slate-900 dark:text-white">{row.totalObtained} / {row.totalMax}</td>
                            <td className="py-3.5 px-3 text-center font-mono font-black text-sky-600">{row.percentage}%</td>
                            <td className="py-3.5 px-3 text-center font-black">{row.grade}</td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                row.passStatus === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {row.passStatus}
                              </span>
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

          {/* SUB-TAB 1: PRINTABLE REPORT CARDS */}
          {reportsSubTab === 'reportCards' && (
            <div className="space-y-5">
              <div className="glass-card p-5 rounded-3xl space-y-4">
                <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Report Cards Registry Filter</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Target Exam Setup</label>
                    <select
                      value={reportExamId}
                      onChange={e => setReportExamId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      {branchExamsList.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Class</label>
                    <select
                      value={reportClass}
                      onChange={e => setReportClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      {classOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Section</label>
                    <select
                      value={reportSection}
                      onChange={e => setReportSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      {['A', 'B', 'C'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Printable Academic Report Cards</h3>
                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b">
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Roll No</th>
                        <th className="py-3 px-4 text-center">GPA</th>
                        <th className="py-3 px-4 text-center">Pass Status</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Report Card</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                      {students.filter(s => s.className === reportClass && s.section === reportSection && (!s.branch || s.branch === selectedBranch)).map(st => {
                        const result = processedResults.find(r => r.examId === reportExamId && r.studentId === st.id);
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{st.firstName} {st.lastName}</td>
                            <td className="py-3 px-4 font-mono">{st.rollNo}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold">{result ? result.gpa : '—'}</td>
                            <td className="py-3 px-4 text-center">
                              {result ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  result.passStatus === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {result.passStatus}
                                </span>
                              ) : 'Not Processed'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">{result?.status || 'Draft'}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  const ex = exams.find(e => e.id === reportExamId);
                                  if (ex) {
                                    setSelectedExamForReport(ex);
                                    setSelectedStudentForReport(st);
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 ml-auto shadow-sm"
                              >
                                <Printer className="w-3.5 h-3.5" /> Printable Report
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: TOP PERFORMERS LEADERBOARD */}
          {reportsSubTab === 'topPerformers' && (
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-sky-600" />
                Top Performers & Rank Holders
              </h3>
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 font-extrabold uppercase text-slate-500 border-b">
                      <th className="p-3 text-center">Rank</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Class & Section</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3 text-center">GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                    {processedResults
                      .sort((a, b) => b.percentage - a.percentage)
                      .slice(0, 5)
                      .map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-black text-sky-600">#{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{r.studentName}</td>
                          <td className="p-3 font-bold">{r.className} ({r.section})</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600">{r.percentage}%</td>
                          <td className="p-3 text-center font-mono font-bold">{r.gpa}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: PERFORMANCE ANALYTICS */}
          {reportsSubTab === 'analytics' && (
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Class Performance Breakdown & Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 text-center space-y-1">
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block uppercase">Class Pass Percentage</span>
                  <span className="text-2xl font-black text-sky-700 dark:text-sky-300">92.4%</span>
                </div>
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Subject Top Performer</span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">Mathematics (98%)</span>
                </div>
                <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-center space-y-1">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block uppercase">Average GPA</span>
                  <span className="text-2xl font-black text-purple-700 dark:text-purple-300">8.45 / 10</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          STUDENT OR PARENT PORTAL VIEW
          ---------------------------------------------------- */}
      {isStudentOrParent && (
        <div className="space-y-5">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">My Academic Report Cards</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Below is the list of active examinations. Official performance reports are viewable and printable only after they are officially released/published by the school administration.
            </p>

            <div className="overflow-x-auto border rounded-2xl bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase border-b">
                    <th className="py-2.5 px-3">Examination Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">GPA Obtained</th>
                    <th className="py-2.5 px-3 text-center">Pass Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                  {exams.filter(e => e.branch === selectedBranch && e.academicYear === selectedAcademicYear).map(ex => {
                    const result = processedResults.find(
                      r => r.examId === ex.id && r.studentId === matchingStudent?.id
                    );
                    const isPublished = result?.status === 'Published' || result?.status === 'Locked';

                    return (
                      <tr key={ex.id} className="hover:bg-slate-50/40">
                        <td className="py-3 px-3 font-black text-slate-800 dark:text-slate-100">{ex.name}</td>
                        <td className="py-3 px-3 font-normal">{ex.examType || 'Term Exam'}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {isPublished ? result?.gpa : '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isPublished ? (
                            result?.passStatus === 'Pass' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px]">Pass</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px]">Fail</span>
                            )
                          ) : (
                            <span className="text-slate-400 italic text-[10px] font-normal">Pending Release</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            disabled={!isPublished}
                            onClick={() => {
                              setSelectedExamForReport(ex);
                              setSelectedStudentForReport(matchingStudent || null);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 ml-auto text-[11px] ${
                              isPublished
                                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-not-allowed'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5" /> View Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODALS & DIALOGS
          ---------------------------------------------------- */}

      {/* Exam Setup Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingExam ? 'Edit Examination Setup' : 'Set Up New Examination'}
              </h3>
              <button onClick={() => setIsExamModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExamSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination 2025"
                  value={examFormData.name || ''}
                  onChange={e => setExamFormData({ ...examFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Exam Type *</label>
                  <select
                    value={examFormData.examType || 'Unit Test'}
                    onChange={e => setExamFormData({ ...examFormData, examType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Annual">Annual</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Grading Scheme</label>
                  <select
                    value={examFormData.gradeSchemeName || 'Default Scholastic'}
                    onChange={e => setExamFormData({ ...examFormData, gradeSchemeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Default Scholastic">Default Scholastic (10-Point)</option>
                    <option value="Secondary Board Scale">Secondary Board Scale</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={examFormData.startDate || ''}
                    onChange={e => setExamFormData({ ...examFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={examFormData.endDate || ''}
                    onChange={e => setExamFormData({ ...examFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsExamModalOpen(false)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md">
                  {editingExam ? 'Save Changes' : 'Create Exam Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Schedule Modal (Unified Room & Invigilator Selection) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingSchedule ? 'Edit Schedule & Room Allocation' : 'Add Timetable, Room & Staff Entry'}
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Subject Name *</label>
                <select
                  value={scheduleForm.subject || subjectOptions[0]}
                  onChange={e => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {allSubjectOptions.map(s => (
                    <option key={s} value={s}>{formatSubject(s)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date || ''}
                    onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime || '09:00'}
                    onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime || '12:00'}
                    onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Assigned Room Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hall A (50 Benches) / Room 101"
                    value={scheduleForm.room || ''}
                    onChange={e => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Invigilator Staff (Teaching Staff) *</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search teaching staff..."
                        value={invigilatorSearchQuery}
                        onChange={e => setInvigilatorSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                      />
                    </div>
                    <select
                      required
                      value={scheduleForm.invigilatorName || ''}
                      onChange={e => {
                        const selectedName = e.target.value;
                        const foundStaff = staff.find(st => `${st.firstName} ${st.lastName}` === selectedName || st.name === selectedName);
                        setScheduleForm({
                          ...scheduleForm,
                          invigilatorName: selectedName,
                          invigilatorId: foundStaff?.id || ''
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs cursor-pointer"
                    >
                      <option value="">-- Select Teaching Staff --</option>
                      {teachingStaffList
                        .filter(s => {
                          if (!invigilatorSearchQuery) return true;
                          const q = invigilatorSearchQuery.toLowerCase();
                          const fullName = `${s.firstName || ''} ${s.lastName || ''} ${s.name || ''} ${s.employeeId || s.id || ''}`.toLowerCase();
                          return fullName.includes(q);
                        })
                        .map(s => {
                          const fullName = s.name || `${s.firstName} ${s.lastName}`;
                          const dept = s.department ? ` • ${s.department}` : s.employeeCategory ? ` • ${s.employeeCategory}` : '';
                          return (
                            <option key={s.id} value={fullName}>
                              {fullName}{dept}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md">
                  {editingSchedule ? 'Save Allocation' : 'Add Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Question Paper Modal */}
      {isPaperModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingPaper ? 'Edit Question Paper' : 'Upload Question Paper'}
              </h3>
              <button onClick={() => setIsPaperModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); executePaperSubmit(); }} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Paper Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics Final Examination Paper"
                  value={paperFormData.paperTitle || ''}
                  onChange={e => setPaperFormData({ ...paperFormData, paperTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Class</label>
                  <select
                    value={paperFormData.className || 'Class 10'}
                    onChange={e => setPaperFormData({ ...paperFormData, className: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    {classOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Subject</label>
                  <select
                    value={paperFormData.subject || 'Mathematics'}
                    onChange={e => setPaperFormData({ ...paperFormData, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    {allSubjectOptions.map(s => (
                      <option key={s} value={s}>{formatSubject(s)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Attachment Dropzone */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400">File Attachment (PDF, DOCX, Image) *</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-sky-500 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-800/40 transition-colors">
                  {paperFormData.fileName ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{paperFormData.fileName}</p>
                          <p className="text-[10px] text-slate-400">{paperFormData.fileSize || '1.5 MB'} • {paperFormData.fileType || 'PDF Document'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingPaper(paperFormData as QuestionPaper)}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 font-bold text-xs hover:bg-sky-100 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <label className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 cursor-pointer" title="Change File">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                                const url = URL.createObjectURL(file);
                                setPaperFormData({
                                  ...paperFormData,
                                  fileName: file.name,
                                  fileSize: sizeMB,
                                  fileType: file.type.includes('pdf') ? 'PDF Document' : file.type.includes('image') ? 'Image File' : 'Word Document',
                                  fileUrl: url
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer space-y-2 block">
                      <Upload className="w-8 h-8 mx-auto text-sky-600" />
                      <div>
                        <span className="font-extrabold text-sky-600 hover:underline">Click to attach file</span>
                        <span className="text-slate-400"> or drag and drop</span>
                      </div>
                      <p className="text-[10px] text-slate-400">PDF, DOCX, PNG, JPG up to 15MB</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                            const url = URL.createObjectURL(file);
                            setPaperFormData({
                              ...paperFormData,
                              fileName: file.name,
                              fileSize: sizeMB,
                              fileType: file.type.includes('pdf') ? 'PDF Document' : file.type.includes('image') ? 'Image File' : 'Word Document',
                              fileUrl: url
                            });
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">General Instructions</label>
                <textarea
                  rows={2}
                  value={paperFormData.instructions || ''}
                  onChange={e => setPaperFormData({ ...paperFormData, instructions: e.target.value })}
                  placeholder="e.g. 1. Read all questions carefully. 2. Total marks: 100."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                {paperFormData.fileName ? (
                  <button
                    type="button"
                    onClick={() => setViewingPaper(paperFormData as QuestionPaper)}
                    className="px-4 py-2 font-bold bg-sky-50 dark:bg-sky-950 text-sky-600 rounded-xl text-xs flex items-center gap-1.5 hover:bg-sky-100"
                  >
                    <Eye className="w-4 h-4" /> Preview Paper
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setIsPaperModalOpen(false)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600">Cancel</button>
                  <button type="submit" className="px-5 py-2 font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md">
                    {editingPaper ? 'Save Changes' : 'Upload Paper'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Question Paper Modal */}
      {viewingPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Question Paper Live Preview</h3>
                <p className="text-xs text-slate-500 font-bold">{viewingPaper.paperTitle}</p>
              </div>
              <button onClick={() => setViewingPaper(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Class & Section</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingPaper.className || 'Class 10'} ({viewingPaper.section || 'A'})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Subject</span>
                <span className="font-extrabold text-sky-600">{formatSubject(viewingPaper.subject || 'Mathematics')}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Max Marks</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingPaper.maxMarks || 100} Marks</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Duration</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingPaper.duration || '3 Hours'}</span>
              </div>
            </div>

            {/* Document Viewer Container */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" />
                  <span className="font-black text-xs text-slate-800 dark:text-white">{viewingPaper.fileName || 'question_paper.pdf'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">{viewingPaper.fileType || 'PDF Document'}</span>
                </div>
                {viewingPaper.fileUrl && (
                  <a
                    href={viewingPaper.fileUrl}
                    download={viewingPaper.fileName || 'Question_Paper.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Paper
                  </a>
                )}
              </div>

              {/* Instructions preview */}
              {viewingPaper.instructions && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">General Instructions</span>
                  <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium">{viewingPaper.instructions}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setViewingPaper(null)} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Card Modal */}
      {selectedStudentForReport && selectedExamForReport && (
        <PrintableReportCard
          student={selectedStudentForReport}
          exam={selectedExamForReport}
          isOpen={true}
          onClose={() => {
            setSelectedStudentForReport(null);
            setSelectedExamForReport(null);
          }}
        />
      )}

      {/* Student Detail Marks Drawer / Modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Student Academic Statement</h3>
                <p className="text-xs text-slate-500 font-bold">
                  {selectedStudentDetail.student.firstName} {selectedStudentDetail.student.lastName} • Roll No: {selectedStudentDetail.student.rollNo || '—'}
                </p>
              </div>
              <button onClick={() => setSelectedStudentDetail(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Admission No</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">{selectedStudentDetail.student.admissionNo || selectedStudentDetail.student.id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Class & Section</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedStudentDetail.student.className} ({selectedStudentDetail.student.section || 'A'})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Class Rank</span>
                <span className="font-black text-sky-600">#{selectedStudentDetail.rank} of {registerStudentData.rows.length}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Result</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  selectedStudentDetail.passStatus === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {selectedStudentDetail.passStatus}
                </span>
              </div>
            </div>

            {/* Subject-wise Marks Table */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Subject-Wise Performance Statement</h4>
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-500 border-b">
                      <th className="p-3">Subject</th>
                      <th className="p-3 text-center">Max Marks</th>
                      <th className="p-3 text-center">Pass Marks</th>
                      <th className="p-3 text-center">Marks Obtained</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                    {registerSubjects.map(subj => {
                      const mark = selectedStudentDetail.marksMap[subj];
                      const maxM = mark?.maxMarks || 100;
                      const passM = mark?.passMarks || 33;
                      const obtained = mark ? (mark.isAbsent ? 'AB' : mark.marksObtained) : '—';
                      const isPass = mark && !mark.isAbsent && mark.marksObtained >= passM;

                      return (
                        <tr key={subj} className="hover:bg-slate-50/50">
                          <td className="p-3 font-extrabold text-slate-900 dark:text-white">{formatSubject(subj)}</td>
                          <td className="p-3 text-center font-mono">{maxM}</td>
                          <td className="p-3 text-center font-mono">{passM}</td>
                          <td className="p-3 text-center font-mono font-black text-sky-600">{obtained}</td>
                          <td className="p-3 text-center">
                            {mark ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                mark.isAbsent ? 'bg-slate-100 text-slate-500' :
                                isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {mark.isAbsent ? 'Absent' : isPass ? 'Pass' : 'Fail'}
                              </span>
                            ) : <span className="text-slate-400 italic">Not Entered</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Score</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">{selectedStudentDetail.totalObtained} / {selectedStudentDetail.totalMax}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Aggregate Percentage</span>
                <p className="text-lg font-black text-sky-600">{selectedStudentDetail.percentage}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Scholastic Grade</span>
                <p className="text-lg font-black text-emerald-600">Grade {selectedStudentDetail.grade}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setSelectedStudentDetail(null)} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Close Statement</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Exam Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingExam}
        title="Delete Examination Setup"
        message={`Are you sure you want to delete ${deletingExam?.name}? This action is permanent.`}
        onConfirm={() => {
          if (deletingExam) {
            deleteExam(deletingExam.id);
            addToast('success', 'Deleted', 'Examination configuration deleted.');
            setDeletingExam(null);
          }
        }}
        onCancel={() => setDeletingExam(null)}
      />
    </div>
  );
};

export default ExaminationView;
