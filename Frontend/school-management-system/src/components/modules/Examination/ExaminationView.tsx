import React, { useState, useEffect } from 'react';
import { 
  Award, Plus, Save, Printer, Edit, Trash2, X, Calendar, BookOpen, User, 
  MapPin, CheckCircle2, AlertTriangle, ShieldAlert, Lock, Unlock, Download, Upload,
  Search, FileSpreadsheet, RefreshCw, BarChart2, PlusCircle, CheckCircle, FileText,
  UserCheck, ShieldCheck, HelpCircle, History
} from 'lucide-react';
import { Student, ExamSetup, ExamMark, ExamSchedule, GradeConfig, ProcessedResult } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { PrintableReportCard } from './PrintableReportCard';
import { ConfirmModal } from '../../common/ConfirmModal';


type MainTab = 'master' | 'schedule' | 'marks' | 'grades' | 'results' | 'reportCards';

export const ExaminationView: React.FC = () => {
  const data = useData();
  const { 
    exams, students, staff, academicClasses, subjects, examMarks, examSchedules, gradeConfigurations, processedResults,
    addExam, updateExam, deleteExam, saveMarks, 
    addExamSchedule, updateExamSchedule, deleteExamSchedule,
    saveGradeConfiguration, saveProcessedResults, updateResultStatus, applyGraceOrRevaluation,
    schoolProfile
  } = data;
  const { addToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<MainTab>('master');
  const [selectedBranch, setSelectedBranch] = useState(user?.branch || 'Main Campus');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(schoolProfile.academicYear || '2025-2026');

  // RBAC permissions
  const isAdminOrPrincipal = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Principal';
  const isTeacher = user?.role === 'Teacher';
  const isStudentOrParent = user?.role === 'Student' || user?.role === 'Parent';

  // Current teacher profile assignment
  const currentTeacher = staff.find(s => s.email === user?.email);
  const teacherClasses = currentTeacher?.assignedClasses || []; // e.g. ["Class 10-A", "Class 9-B"]
  const teacherSubjects = currentTeacher?.assignedSubjects || []; // e.g. ["Mathematics", "Physics"]
  const subjectOptions = Array.from(new Set(subjects.map(subject => subject.name))).filter(Boolean).sort();
  const teacherSubjectOptions = subjectOptions.filter(subject => teacherSubjects.includes(subject));
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
  const getSectionOptionsForClasses = (classNames: string[]) => {
    return Array.from(new Set(classNames.flatMap(className => getSectionOptions(className)))).filter(Boolean).sort();
  };

  // Active student match (for Student/Parent portal view)
  const matchingStudent = students.find(s => s.email === user?.email || (user?.role === 'Parent' && s.fatherName.toLowerCase() === user.name.toLowerCase()));

  // ----------------------------------------------------
  // Tab 1: Exam Master States & Actions
  // ----------------------------------------------------
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSetup | null>(null);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [examFormData, setExamFormData] = useState<Partial<ExamSetup>>({
    name: '',
    academicYear: '2025-2026',
    examType: 'Unit Test',
    startDate: '',
    endDate: '',
    applicableClasses: [],
    status: 'Scheduled',
    branch: ''
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
      branch: selectedBranch
    });
    setClassDropdownOpen(false);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam: ExamSetup) => {
    if (!isAdminOrPrincipal) return;
    setEditingExam(exam);
    setExamFormData(exam);
    setClassDropdownOpen(false);
    setIsExamModalOpen(true);
  };

  const handleExamSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!examFormData.name) {
      addToast('warning', 'Validation Warning', 'Please provide a name for the examination setup.');
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
      addToast('success', 'Success', `Updated examination: ${examFormData.name}`);
    } else {
      addExam(payload as Omit<ExamSetup, 'id'>);
      addToast('success', 'Success', `Scheduled new examination: ${examFormData.name}`);
    }
    setIsExamModalOpen(false);
  };

  // ----------------------------------------------------
  // Tab 2: Exam Schedule States & Actions
  // ----------------------------------------------------
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [scheduleClassDropdownOpen, setScheduleClassDropdownOpen] = useState(false);
  const [selectedScheduleClasses, setSelectedScheduleClasses] = useState<string[]>(['Class 10']);
  const [scheduleForm, setScheduleForm] = useState<Partial<ExamSchedule>>({
    examId: '',
    date: '',
    startTime: '09:00',
    endTime: '12:00',
    subject: 'Mathematics',
    className: 'Class 10',
    section: 'A',
    maxMarks: 100,
    passMarks: 33,
    room: '',
    invigilatorId: '',
    invigilatorName: ''
  });
  const [scheduleFilterExam, setScheduleFilterExam] = useState('');
  const [previewAcademicYear, setPreviewAcademicYear] = useState(schoolProfile.academicYear || '2025-2026');
  const [previewBranch, setPreviewBranch] = useState(user?.branch || 'Main Campus');
  const [previewExamId, setPreviewExamId] = useState('');
  const [previewClass, setPreviewClass] = useState(classOptions[0] || '');
  const [previewSection, setPreviewSection] = useState('');
  const [previewSearch, setPreviewSearch] = useState('');

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
          conflicts.push(`Class Conflict: Class ${className}-${section} already has a scheduled exam (${s.subject}) during this time.`);
        }
      }
    });

    return conflicts;
  };

  const handleScheduleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const { date, startTime, endTime, section, examId, subject } = scheduleForm;
    const targetClasses = (editingSchedule ? [scheduleForm.className || selectedScheduleClasses[0] || classOptions[0]] : selectedScheduleClasses).filter(Boolean);
    if (!examId || !date || !startTime || !endTime || !subject || targetClasses.length === 0) {
      addToast('warning', 'Validation Warning', 'Please fill in all mandatory scheduling fields.');
      return;
    }

    const conflicts = targetClasses.flatMap(className => checkScheduleConflicts(
      date, startTime, endTime, className || 'Class 10', section || 'All Sections', editingSchedule?.id
    ));

    if (conflicts.length > 0) {
      addToast('error', 'Scheduling Conflict', conflicts[0]);
      return;
    }

    const makePayload = (className: string) => ({
      ...scheduleForm,
      academicYear: selectedAcademicYear,
      branch: selectedBranch,
      className,
      section: section || 'All Sections',
      room: '',
      invigilatorId: '',
      invigilatorName: '',
      maxMarks: Number(scheduleForm.maxMarks) || 100,
      passMarks: Number(scheduleForm.passMarks) || 33
    } as Omit<ExamSchedule, 'id'>);

    if (editingSchedule) {
      updateExamSchedule(editingSchedule.id, makePayload(targetClasses[0]));
      addToast('success', 'Success', 'Updated exam schedule details.');
    } else {
      targetClasses.forEach(className => addExamSchedule(makePayload(className)));
      addToast('success', 'Success', `Successfully scheduled subject exam for ${targetClasses.length} class${targetClasses.length > 1 ? 'es' : ''}.`);
    }
    setIsScheduleModalOpen(false);
  };

  // ----------------------------------------------------
  // Tab 3: Marks Entry States & Actions
  // ----------------------------------------------------
  const [marksExamId, setMarksExamId] = useState('');
  const [marksClass, setMarksClass] = useState('Class 10');
  const [marksSection, setMarksSection] = useState('A');
  const [marksSubject, setMarksSubject] = useState('Mathematics');
  const [enteredMarks, setEnteredMarks] = useState<Record<string, { score: number; remarks: string }>>({});
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Grace / Revaluation popup state
  const [revalueMark, setRevalueMark] = useState<ExamMark | null>(null);
  const [revalueStudentName, setRevalueStudentName] = useState('');
  const [revalueNewMarks, setRevalueNewMarks] = useState<number>(0);
  const [revalueType, setRevalueType] = useState<'Grace' | 'Revaluation'>('Revaluation');
  const [revalueReason, setRevalueReason] = useState('');

  // Auto-fill active exam subjects / classes
  useEffect(() => {
    const branchExams = exams.filter(e => e.branch === selectedBranch && e.academicYear === selectedAcademicYear);
    if (branchExams.length > 0 && !marksExamId) {
      setMarksExamId(branchExams[0].id);
    }
  }, [exams, selectedBranch, selectedAcademicYear]);

  // Load marks into state on filter change
  useEffect(() => {
    if (!marksExamId) return;
    const filteredMarks = examMarks.filter(
      m => m.examId === marksExamId && m.subject === marksSubject
    );
    const newState: Record<string, { score: number; remarks: string }> = {};
    filteredMarks.forEach(m => {
      newState[m.studentId] = {
        score: m.marksObtained,
        remarks: m.remarks || ''
      };
    });
    setEnteredMarks(newState);
  }, [marksExamId, marksClass, marksSection, marksSubject, examMarks]);

  const handleSaveMarksEntry = (lockAfterSave: boolean) => {
    const classSchedule = examSchedules.find(
      s => s.examId === marksExamId && s.className === marksClass && s.section === marksSection && s.subject === marksSubject
    );
    const maxScore = classSchedule ? classSchedule.maxMarks : 100;

    if (isTeacher && (!teacherClasses.includes(`${marksClass}-${marksSection}`) || !teacherSubjects.includes(marksSubject))) {
      addToast('error', 'Access Denied', 'Teachers can enter marks only for their assigned classes and subjects.');
      return;
    }

    const isLocked = examMarks.some(
      m => m.examId === marksExamId && m.subject === marksSubject && m.isLocked &&
        students.some(st => st.id === m.studentId && st.className === marksClass && st.section === marksSection)
    );
    if (isLocked && !isAdminOrPrincipal) {
      addToast('error', 'Marks Locked', 'Submitted marks are locked and cannot be edited.');
      return;
    }

    const classStudents = students.filter(
      s => s.className === marksClass && s.section === marksSection && s.branch === selectedBranch
    );

    const errorList: string[] = [];
    const payload = classStudents.map(s => {
      const entry = enteredMarks[s.id] || { score: 0, remarks: '' };
      if (entry.score > maxScore || entry.score < 0) {
        errorList.push(`${s.firstName} score (${entry.score}) exceeds limits [0-${maxScore}].`);
      }

      // Grade calculation
      let grade = 'F';
      const pct = (entry.score / maxScore) * 100;
      const matched = gradeConfigurations.find(c => pct >= c.minPercent && pct <= c.maxPercent);
      if (matched) grade = matched.gradeName;

      return {
        examId: marksExamId,
        academicYear: selectedAcademicYear,
        branch: selectedBranch,
        className: marksClass,
        section: marksSection,
        studentId: s.id,
        subject: marksSubject,
        marksObtained: entry.score,
        totalMarks: maxScore,
        grade,
        remarks: entry.remarks,
        isLocked: lockAfterSave,
        submittedBy: user?.name || 'System',
        submittedAt: new Date().toISOString().split('T')[0]
      };
    });

    if (errorList.length > 0) {
      addToast('error', 'Validation Error', errorList[0]);
      return;
    }

    saveMarks(payload);
    addToast('success', 'Success', `Marks saved successfully${lockAfterSave ? ' and locked' : ' as draft'}.`);
  };

  // CSV Export
  const handleExportCsv = () => {
    const classSchedule = examSchedules.find(
      s => s.examId === marksExamId && s.className === marksClass && s.section === marksSection && s.subject === marksSubject
    );
    const maxScore = classSchedule ? classSchedule.maxMarks : 100;

    const classStudents = students.filter(
      s => s.className === marksClass && s.section === marksSection && s.branch === selectedBranch
    );

    let csv = "Student ID,Roll No,Student Name,Marks Obtained (Max " + maxScore + "),Remarks\n";
    classStudents.forEach(s => {
      const entry = enteredMarks[s.id] || { score: 0, remarks: '' };
      csv += `${s.id},${s.rollNo},${s.firstName} ${s.lastName},${entry.score},${entry.remarks}\n`;
    });

    setCsvText(csv);
    setIsCsvModalOpen(true);
  };

  // CSV Import Parse
  const handleImportCsv = () => {
    try {
      const lines = csvText.split('\n');
      const newState = { ...enteredMarks };
      let count = 0;

      lines.forEach((line, idx) => {
        if (idx === 0 || !line.trim()) return; // skip header/empty lines
        const parts = line.split(',');
        if (parts.length >= 4) {
          const studentId = parts[0].trim();
          const score = Number(parts[3].trim());
          const remarks = parts[4] ? parts[4].trim() : '';

          if (students.some(s => s.id === studentId)) {
            newState[studentId] = { score, remarks };
            count++;
          }
        }
      });

      setEnteredMarks(newState);
      setIsCsvModalOpen(false);
      addToast('success', 'Success', `Successfully parsed & imported ${count} student marks.`);
    } catch (err) {
      addToast('error', 'Parser Error', 'Invalid CSV format. Please verify column order.');
    }
  };

  // ----------------------------------------------------
  // Tab 4: Grade Config States & Actions
  // ----------------------------------------------------
  const [editableGrades, setEditableGrades] = useState<GradeConfig[]>(gradeConfigurations);

  useEffect(() => {
    setEditableGrades(gradeConfigurations);
  }, [gradeConfigurations]);

  const handleUpdateGradeRow = (idx: number, field: keyof GradeConfig, val: any) => {
    const updated = [...editableGrades];
    updated[idx] = {
      ...updated[idx],
      [field]: val
    };
    setEditableGrades(updated);
  };

  const handleSaveGrades = () => {
    if (!isAdminOrPrincipal) return;
    saveGradeConfiguration(editableGrades);
    addToast('success', 'Success', 'Grade configurations saved successfully.');
  };

  // ----------------------------------------------------
  // Tab 5: Result Processing States & Actions
  // ----------------------------------------------------
  const [procExamId, setProcExamId] = useState('');
  const [procClass, setProcClass] = useState('Class 10');
  const [procSection, setProcSection] = useState('A');

  useEffect(() => {
    const branchExams = exams.filter(e => e.branch === selectedBranch && e.academicYear === selectedAcademicYear);
    if (branchExams.length > 0 && !procExamId) {
      setProcExamId(branchExams[0].id);
    }
  }, [exams, selectedBranch, selectedAcademicYear]);

  const handleProcessResults = () => {
    const existingLocked = processedResults.some(
      r => r.examId === procExamId && r.className === procClass && r.section === procSection && r.status === 'Locked'
    );
    if (existingLocked) {
      addToast('error', 'Results Locked', 'Unlock results before recalculating this class.');
      return;
    }

    const classSchedules = examSchedules.filter(
      s => s.examId === procExamId && s.className === procClass && s.section === procSection
    );

    if (classSchedules.length === 0) {
      addToast('error', 'Error', 'No subject schedules found for the selected parameters.');
      return;
    }

    const classStudents = students.filter(
      s => s.className === procClass && s.section === procSection && s.branch === selectedBranch
    );

    const totalMax = classSchedules.reduce((sum, s) => sum + s.maxMarks, 0);

    const processedList: ProcessedResult[] = classStudents.map(st => {
      const studentMarks = examMarks.filter(
        m => m.examId === procExamId && m.studentId === st.id
      );

      const totalObtained = studentMarks.reduce((sum, m) => sum + m.marksObtained, 0);
      const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

      // Find grade
      let finalGrade = 'F';
      let gpa = 0;
      let passStatus: 'Pass' | 'Fail' = 'Fail';
      const matched = gradeConfigurations.find(c => pct >= c.minPercent && pct <= c.maxPercent);
      if (matched) {
        finalGrade = matched.gradeName;
        gpa = matched.gradePoints;
        passStatus = matched.passCriteria;
      }

      // Check if student failed any individual subjects
      const hasSubjectFail = studentMarks.some(m => {
        const sched = classSchedules.find(s => s.subject === m.subject);
        const passMarks = sched ? sched.passMarks : 33;
        return m.marksObtained < passMarks;
      });

      if (hasSubjectFail) {
        passStatus = 'Fail';
        finalGrade = 'F';
        gpa = 0;
      }

      return {
        id: 'RES-' + Math.floor(1000 + Math.random() * 9000),
        examId: procExamId,
        academicYear: selectedAcademicYear,
        branch: selectedBranch,
        studentId: st.id,
        studentName: `${st.firstName} ${st.lastName}`,
        rollNo: st.rollNo,
        className: procClass,
        section: procSection,
        totalMaxMarks: totalMax,
        totalObtainedMarks: totalObtained,
        percentage: pct,
        gpa,
        finalGrade,
        passStatus,
        status: 'Processed' as const,
        processedBy: user?.name || 'HR Admin',
        processedAt: new Date().toISOString().split('T')[0],
        remarks: pct >= 40 ? 'Satisfactory Progress' : 'Requires Academic Support'
      };
    });

    saveProcessedResults(processedList);
    addToast('success', 'Success', `Processed results for ${processedList.length} students.`);
  };

  const handleUpdateStatus = (status: ProcessedResult['status']) => {
    if (!isAdminOrPrincipal) {
      addToast('error', 'Access Denied', 'Only authorized users can change result status.');
      return;
    }
    updateResultStatus(procExamId, procClass, procSection, status);
    addToast('success', 'Status Updated', `Results set to: ${status}`);
  };

  // ----------------------------------------------------
  // Tab 6: Report Cards States & Actions
  // ----------------------------------------------------
  const [reportExamId, setReportExamId] = useState('');
  const [reportClass, setReportClass] = useState('Class 10');
  const [reportSection, setReportSection] = useState('A');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [selectedExamForReport, setSelectedExamForReport] = useState<ExamSetup | null>(null);

  useEffect(() => {
    const branchExams = exams.filter(e => e.branch === selectedBranch && e.academicYear === selectedAcademicYear);
    if (branchExams.length > 0 && !reportExamId) {
      setReportExamId(branchExams[0].id);
    }
  }, [exams, selectedBranch, selectedAcademicYear]);

  useEffect(() => {
    const availableExams = exams.filter(e => (!e.branch || e.branch === previewBranch) && e.academicYear === previewAcademicYear);
    if (!availableExams.some(e => e.id === previewExamId)) {
      setPreviewExamId(availableExams[0]?.id || '');
    }
  }, [exams, previewAcademicYear, previewBranch, previewExamId]);

  useEffect(() => {
    const sections = getSectionOptions(previewClass);
    if (!sections.includes(previewSection)) {
      setPreviewSection(sections[0] || '');
    }
  }, [academicClasses, previewClass, previewSection]);

  // Filter components by active branch & year
  const branchExamsList = exams.filter(
    e => (!e.branch || e.branch === selectedBranch) && e.academicYear === selectedAcademicYear
  );

  const displayedSchedules = examSchedules.filter(s => {
    const ex = exams.find(e => e.id === s.examId);
    return (!ex?.branch || ex.branch === selectedBranch) && ex?.academicYear === selectedAcademicYear &&
      (!scheduleFilterExam || s.examId === scheduleFilterExam);
  });

  const previewExamOptions = exams.filter(exam =>
    (!exam.branch || exam.branch === previewBranch) && exam.academicYear === previewAcademicYear
  );
  const previewSectionOptions = getSectionOptions(previewClass);
  const previewTimetableRows = examSchedules
    .filter(schedule => {
      const exam = exams.find(ex => ex.id === schedule.examId);
      const matchesCoreFilters =
        !!previewAcademicYear &&
        !!previewBranch &&
        !!previewExamId &&
        !!previewClass &&
        !!previewSection &&
        schedule.examId === previewExamId &&
        schedule.className === previewClass &&
        (schedule.section === previewSection || schedule.section === 'All Sections') &&
        (!schedule.branch || schedule.branch === previewBranch) &&
        (!schedule.academicYear || schedule.academicYear === previewAcademicYear) &&
        (!exam?.branch || exam.branch === previewBranch) &&
        exam?.academicYear === previewAcademicYear;
      const matchesSearch = !previewSearch.trim() || schedule.subject.toLowerCase().includes(previewSearch.toLowerCase());
      return matchesCoreFilters && matchesSearch;
    })
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  const handleExportPreviewCsv = () => {
    const headers = ['Subject', 'Exam Date', 'Start Time', 'End Time', 'Maximum Marks', 'Passing Marks'];
    const lines = [
      headers.join(','),
      ...previewTimetableRows.map(row => [
        row.subject,
        row.date,
        row.startTime,
        row.endTime,
        row.maxMarks,
        row.passMarks
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-timetable-${previewClass || 'class'}-${previewSection || 'section'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPreview = () => {
    const selectedExam = exams.find(exam => exam.id === previewExamId);
    const rows = previewTimetableRows.map(row => `
      <tr>
        <td>${row.subject}</td>
        <td>${row.date}</td>
        <td>${row.startTime}</td>
        <td>${row.endTime}</td>
        <td>${row.maxMarks}</td>
        <td>${row.passMarks}</td>
      </tr>
    `).join('');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Exam Timetable Preview</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { margin: 0 0 18px; color: #475569; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f8fafc; text-transform: uppercase; font-size: 10px; }
          </style>
        </head>
        <body>
          <h1>Exam Timetable Preview</h1>
          <p>${selectedExam?.name || ''} | ${previewAcademicYear} | ${previewBranch} | ${previewClass}-${previewSection}</p>
          <table>
            <thead><tr><th>Subject</th><th>Exam Date</th><th>Start Time</th><th>End Time</th><th>Maximum Marks</th><th>Passing Marks</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6">No timetable exists for the selected filters.</td></tr>'}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const processedResultsList = processedResults.filter(
    r => r.examId === procExamId && r.className === procClass && r.section === procSection
  );

  // Revaluation history timeline logs collector
  const allMarksWithRevaluation = examMarks.filter(
    m => m.examId === (procExamId || marksExamId) && m.revaluationHistory && m.revaluationHistory.length > 0
  );

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      
      {/* Top Header Card */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-2xl shadow-lg shadow-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Enterprise Examination Panel</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Define exam setups, subject schedules, invigilators, grading configurations, recalculate GPAs & print progress reports</p>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer text-slate-800 dark:text-white"
            >
              <option value="Main Campus">Main Campus</option>
              <option value="North Branch">North Branch</option>
              <option value="West Campus">West Campus</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-855/50">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedAcademicYear}
              onChange={e => setSelectedAcademicYear(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer text-slate-800 dark:text-white"
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      {!isStudentOrParent && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b pb-1">
          {[
            { id: 'master', label: 'Exam Master', icon: Award },
            { id: 'schedule', label: 'Exam Schedule', icon: Calendar },
            { id: 'marks', label: 'Marks Entry', icon: Edit },
            { id: 'grades', label: 'Grade Configurations', icon: BarChart2 },
            { id: 'results', label: 'Result Processing', icon: RefreshCw },
            { id: 'reportCards', label: 'Report Cards', icon: Printer }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as MainTab)}
              className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 1: EXAM MASTER VIEW
          ---------------------------------------------------- */}
      {activeTab === 'master' && !isStudentOrParent && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Active Examinations Master List</h3>
            {isAdminOrPrincipal && (
              <button
                onClick={handleOpenAddExam}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center gap-1.5 shadow-sm text-[11px]"
              >
                <Plus className="w-4 h-4" /> Set Up Examination
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchExamsList.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 border p-12 text-center rounded-2xl space-y-2">
                <Award className="h-10 w-10 mx-auto text-slate-400" />
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200">No Exam Setups Found</h4>
                <p className="text-slate-500 max-w-sm mx-auto text-[11px]">There are no examinations set up for the selected branch and academic year.</p>
              </div>
            ) : (
              branchExamsList.map(ex => {
                const scheduleCount = examSchedules.filter(s => s.examId === ex.id).length;
                return (
                  <div key={ex.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                          {ex.examType || 'Term Exam'}
                        </span>
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm mt-1.5">{ex.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Session {ex.academicYear} • Branch: {ex.branch || 'Main'}</p>
                      </div>

                      {isAdminOrPrincipal && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenEditExam(ex)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-blue-600">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeletingExam(ex)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-50 dark:border-slate-800 pt-3 text-[10px] font-semibold text-slate-500">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400">Scheduled Span</span>
                        <span className="text-slate-700 dark:text-slate-300">{ex.startDate} ➔ {ex.endDate}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400">Scheduled Subjects</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{scheduleCount} Subjects</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold ${
                        ex.status === 'Results Published' ? 'text-emerald-600' :
                        ex.status === 'Completed' ? 'text-blue-600' :
                        ex.status === 'In Progress' ? 'text-indigo-600 animate-pulse' : 'text-slate-600'
                      }`}>
                        {ex.status === 'Results Published' && <CheckCircle className="w-3 h-3" />}
                        {ex.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: EXAM SCHEDULE VIEW
          ---------------------------------------------------- */}
      {activeTab === 'schedule' && !isStudentOrParent && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Subject Scheduling Board</h3>
              <select
                value={scheduleFilterExam}
                onChange={e => setScheduleFilterExam(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border bg-white dark:bg-slate-805/50 font-bold"
              >
                <option value="">All Exams</option>
                {branchExamsList.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            {isAdminOrPrincipal && (
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setSelectedScheduleClasses([classOptions[0] || 'Class 10']);
                  setScheduleClassDropdownOpen(false);
                  setScheduleForm({
                    examId: branchExamsList[0]?.id || '',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '12:00',
                    subject: subjectOptions[0] || 'Mathematics',
                    className: classOptions[0] || 'Class 10',
                    section: 'All Sections',
                    maxMarks: 100,
                    passMarks: 33,
                    room: '',
                    invigilatorId: '',
                    invigilatorName: ''
                  });
                  setIsScheduleModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center gap-1.5 shadow-sm text-[11px]"
              >
                <PlusCircle className="w-4 h-4" /> Add Subject Schedule
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-3 px-4">Exam Setup</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Date & Span</th>
                  <th className="py-3 px-4 text-center">Marks Limit</th>
                  {isAdminOrPrincipal && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                {displayedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminOrPrincipal ? 6 : 5} className="py-8 text-center text-slate-400 italic">
                      No schedules defined yet. Click "Add Subject Schedule" to schedule your first exam.
                    </td>
                  </tr>
                ) : (
                  displayedSchedules.map(sch => {
                    const exam = exams.find(e => e.id === sch.examId);
                    return (
                      <tr key={sch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-black text-slate-800 dark:text-slate-200">{exam?.name || 'Unknown Exam'}</td>
                        <td className="py-3 px-4">{sch.className} - {sch.section}</td>
                        <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-bold">{sch.subject}</td>
                        <td className="py-3 px-4">
                          <span className="block font-mono">{sch.date}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{sch.startTime} - {sch.endTime}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="block text-slate-800 dark:text-slate-200 font-black">{sch.maxMarks}</span>
                          <span className="text-[9px] text-slate-400 font-normal">Pass: {sch.passMarks}</span>
                        </td>
                        {isAdminOrPrincipal && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingSchedule(sch);
                                  setSelectedScheduleClasses([sch.className]);
                                  setScheduleClassDropdownOpen(false);
                                  setScheduleForm(sch);
                                  setIsScheduleModalOpen(true);
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-600"
                                title="Edit Schedule"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this scheduled subject?')) {
                                    deleteExamSchedule(sch.id);
                                    addToast('success', 'Deleted', 'Successfully deleted schedule.');
                                  }
                                }}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded text-rose-600"
                                title="Delete Schedule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: MARKS ENTRY VIEW
          ---------------------------------------------------- */}
      {activeTab === 'marks' && !isStudentOrParent && (
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Marks Entry Filters</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  {/* If teacher, filter options */}
                  {isTeacher ? (
                    Array.from(new Set(teacherClasses.map(c => c.split('-')[0]))).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    ['Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Section</label>
                <select
                  value={marksSection}
                  onChange={e => setMarksSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {isTeacher ? (
                    Array.from(new Set(teacherClasses.filter(c => c.startsWith(marksClass)).map(c => c.split('-')[1]))).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  ) : (
                    ['A', 'B', 'C'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Subject</label>
                <select
                  value={marksSubject}
                  onChange={e => setMarksSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-805/50 font-bold"
                >
                  {isTeacher ? (
                    teacherSubjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  ) : (
                    subjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Conflict details & Max marks indicator */}
          {(() => {
            const classSchedule = examSchedules.find(
              s => s.examId === marksExamId && s.className === marksClass && s.section === marksSection && s.subject === marksSubject
            );

            const isLocked = examMarks.some(
              m => m.examId === marksExamId && m.subject === marksSubject && m.isLocked && 
                students.some(st => st.id === m.studentId && st.className === marksClass && st.section === marksSection)
            );

            // Fetch students matching the class/section
            const classStudents = students.filter(
              s => s.className === marksClass && s.section === marksSection && s.branch === selectedBranch
            );

            if (!classSchedule) {
              return (
                <div className="bg-amber-50 border border-amber-200 dark:bg-amber-955/20 dark:border-amber-900 rounded-2xl p-5 text-amber-800 dark:text-amber-300 font-bold">
                  No scheduled exam found for {marksSubject} in {marksClass}-{marksSection}. Please schedule this subject in the Schedule tab first.
                </div>
              );
            }

            return (
              <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5">
                      {isLocked ? <Lock className="w-4 h-4 text-rose-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                      Marks Register: {marksSubject}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Max Marks: <strong className="text-slate-700 dark:text-slate-350">{classSchedule.maxMarks}</strong> • 
                      Pass Marks: <strong className="text-slate-700 dark:text-slate-350">{classSchedule.passMarks}</strong> • 
                      Invigilator: <strong className="text-slate-700 dark:text-slate-350">{classSchedule.invigilatorName}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportCsv}
                      className="px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold hover:bg-slate-105 flex items-center gap-1 text-[11px]"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                    </button>
                    
                    {!isLocked && (
                      <button
                        onClick={() => { setCsvText(''); setIsCsvModalOpen(true); }}
                        className="px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold hover:bg-slate-105 flex items-center gap-1 text-[11px]"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" /> Import CSV
                      </button>
                    )}

                    {!isLocked && (
                      <>
                        <button
                          onClick={() => handleSaveMarksEntry(false)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 flex items-center gap-1 text-[11px]"
                        >
                          Save Draft
                        </button>
                        <button
                          onClick={() => handleSaveMarksEntry(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-[11px] shadow-sm"
                        >
                          <Lock className="w-3.5 h-3.5" /> Submit & Lock
                        </button>
                      </>
                    )}

                    {isLocked && isAdminOrPrincipal && (
                      <button
                        onClick={() => {
                          const matchingMarks = examMarks.filter(
                            m => m.examId === marksExamId && m.subject === marksSubject &&
                              students.some(st => st.id === m.studentId && st.className === marksClass && st.section === marksSection)
                          );
                          saveMarks(matchingMarks.map(m => ({ ...m, isLocked: false })));
                          addToast('success', 'Unlocked', 'Marks entry has been unlocked for modifications.');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center gap-1 text-[11px] shadow-sm"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Unlock Marks
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 font-bold uppercase border-b">
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Marks Obtained</th>
                        <th className="py-2.5 px-3 text-center">Grade Preview</th>
                        <th className="py-2.5 px-3">Remarks</th>
                        <th className="py-2.5 px-3 text-right">Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                      {classStudents.map(st => {
                        const entry = enteredMarks[st.id] || { score: 0, remarks: '' };
                        const existingMark = examMarks.find(
                          m => m.examId === marksExamId && m.studentId === st.id && m.subject === marksSubject
                        );

                        // Grade Calculation
                        let grade = 'F';
                        const pct = (entry.score / classSchedule.maxMarks) * 100;
                        const matched = gradeConfigurations.find(c => pct >= c.minPercent && pct <= c.maxPercent);
                        if (matched) grade = matched.gradeName;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                            <td className="py-2 px-3 font-black text-slate-800 dark:text-slate-100">{st.firstName} {st.lastName}</td>
                            <td className="py-2 px-3 font-mono">{st.rollNo}</td>
                            <td className="py-2 px-3">
                              {entry.score >= classSchedule.passMarks ? (
                                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded text-[10px]">Pass</span>
                              ) : (
                                <span className="text-rose-600 bg-rose-50 dark:bg-rose-955/20 px-1.5 py-0.5 rounded text-[10px]">Fail</span>
                              )}
                              {existingMark?.graceMarks && existingMark.graceMarks > 0 ? (
                                <span className="ml-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-sans">+{existingMark.graceMarks} Grace</span>
                              ) : null}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                disabled={isLocked}
                                value={entry.score}
                                max={classSchedule.maxMarks}
                                min={0}
                                onChange={e => setEnteredMarks({
                                  ...enteredMarks,
                                  [st.id]: { ...entry, score: Number(e.target.value) }
                                })}
                                className="w-20 px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold"
                              />
                            </td>
                            <td className="py-2 px-3 text-center text-amber-600 dark:text-amber-400 font-bold">{grade}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                disabled={isLocked}
                                placeholder="E.g., Good"
                                value={entry.remarks}
                                onChange={e => setEnteredMarks({
                                  ...enteredMarks,
                                  [st.id]: { ...entry, remarks: e.target.value }
                                })}
                                className="w-full max-w-[150px] px-2 py-1 border rounded bg-slate-55 dark:bg-slate-800 text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              {existingMark && isAdminOrPrincipal && (
                                <button
                                  onClick={() => {
                                    setRevalueMark(existingMark);
                                    setRevalueStudentName(`${st.firstName} ${st.lastName}`);
                                    setRevalueNewMarks(existingMark.marksObtained);
                                    setRevalueType('Revaluation');
                                    setRevalueReason('');
                                  }}
                                  className="px-2 py-1 rounded border text-amber-605 bg-amber-50 hover:bg-amber-100 dark:bg-amber-955/20 text-[10px] flex items-center gap-1 ml-auto font-sans"
                                >
                                  <History className="w-3 h-3" /> Adjust
                                </button>
                              )}
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

      {/* ----------------------------------------------------
          TAB 4: GRADE CONFIGURATION
          ---------------------------------------------------- */}
      {activeTab === 'grades' && !isStudentOrParent && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">System Grading Configurations</h3>
            {isAdminOrPrincipal && (
              <button
                onClick={handleSaveGrades}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center gap-1 shadow-sm text-[11px]"
              >
                <Save className="w-4 h-4" /> Save Grade Ranges
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4">
            <p className="text-slate-500 text-[11px]">Define grading standards used across aggregate report cards. Min and Max bounds determine standard grade points mapping.</p>
            <table className="w-full text-left border-collapse text-xs max-w-2xl">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-2.5 px-3">Grade Letter</th>
                  <th className="py-2.5 px-3">Min Percentage (%)</th>
                  <th className="py-2.5 px-3">Max Percentage (%)</th>
                  <th className="py-2.5 px-3">Grade Points (GPA)</th>
                  <th className="py-2.5 px-3">Criteria Status</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                {editableGrades.map((g, idx) => (
                  <tr key={g.id}>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        disabled={!isAdminOrPrincipal}
                        value={g.gradeName}
                        onChange={e => handleUpdateGradeRow(idx, 'gradeName', e.target.value)}
                        className="w-16 px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        disabled={!isAdminOrPrincipal}
                        value={g.minPercent}
                        onChange={e => handleUpdateGradeRow(idx, 'minPercent', Number(e.target.value))}
                        className="w-20 px-2 py-1 border rounded bg-slate-50 dark:bg-slate-805 text-center font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        disabled={!isAdminOrPrincipal}
                        value={g.maxPercent}
                        onChange={e => handleUpdateGradeRow(idx, 'maxPercent', Number(e.target.value))}
                        className="w-20 px-2 py-1 border rounded bg-slate-50 dark:bg-slate-805 text-center font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        disabled={!isAdminOrPrincipal}
                        value={g.gradePoints}
                        onChange={e => handleUpdateGradeRow(idx, 'gradePoints', Number(e.target.value))}
                        className="w-20 px-2 py-1 border rounded bg-slate-50 dark:bg-slate-850 text-center font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        disabled={!isAdminOrPrincipal}
                        value={g.passCriteria}
                        onChange={e => handleUpdateGradeRow(idx, 'passCriteria', e.target.value)}
                        className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 5: RESULT PROCESSING
          ---------------------------------------------------- */}
      {activeTab === 'results' && !isStudentOrParent && (
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Result Engine Parameters</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Target Exam Setup</label>
                <select
                  value={procExamId}
                  onChange={e => setProcExamId(e.target.value)}
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
                  value={procClass}
                  onChange={e => setProcClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Section</label>
                <select
                  value={procSection}
                  onChange={e => setProcSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-850/50 font-bold"
                >
                  {['A', 'B', 'C'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5">
                  Result Processing Matrix
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Process raw subject scores into aggregate GPAs, Percentages, and Final pass/fail status.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isAdminOrPrincipal && (
                  <>
                    <button
                      onClick={handleProcessResults}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center gap-1.5 text-[11px]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Process & Calculate
                    </button>

                    {processedResultsList.length > 0 && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus('Published')}
                          className="px-3 py-1.5 rounded-xl border text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-955/20 text-[11px] font-bold"
                        >
                          Publish Results
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('Locked')}
                          className="px-3 py-1.5 rounded-xl border text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-[11px] font-bold"
                        >
                          Lock Results
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('Draft')}
                          className="px-3 py-1.5 rounded-xl border text-slate-650 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold"
                        >
                          Revert to Draft
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 font-bold uppercase border-b">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                    <th className="py-2.5 px-3 text-center">Total Max Marks</th>
                    <th className="py-2.5 px-3 text-center">Percentage</th>
                    <th className="py-2.5 px-3 text-center">GPA</th>
                    <th className="py-2.5 px-3 text-center">Final Grade</th>
                    <th className="py-2.5 px-3 text-center">Pass Status</th>
                    <th className="py-2.5 px-3 text-right">Result Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                  {processedResultsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                        Results have not been processed for this class yet. Click "Process & Calculate" above.
                      </td>
                    </tr>
                  ) : (
                    processedResultsList.map(res => (
                      <tr key={res.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                        <td className="py-2 px-3 font-black text-slate-800 dark:text-slate-100">{res.studentName}</td>
                        <td className="py-2 px-3 font-mono">{res.rollNo}</td>
                        <td className="py-2 px-3 text-center">{res.totalObtainedMarks}</td>
                        <td className="py-2 px-3 text-center">{res.totalMaxMarks}</td>
                        <td className="py-2 px-3 text-center font-bold text-amber-600">{res.percentage}%</td>
                        <td className="py-2 px-3 text-center font-mono">{res.gpa}</td>
                        <td className="py-2 px-3 text-center text-indigo-600 font-bold">{res.finalGrade}</td>
                        <td className="py-2 px-3 text-center">
                          {res.passStatus === 'Pass' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20">Pass</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-955/20">Fail</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold uppercase text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded ${
                            res.status === 'Locked' ? 'bg-rose-100 text-rose-700' :
                            res.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Grace / Revaluation History Timeline Panel */}
            {allMarksWithRevaluation.length > 0 && (
              <div className="border-t pt-5 mt-4 space-y-3">
                <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-500" /> Grace Marks & Revaluation Revision Audit Logs
                </h4>
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {allMarksWithRevaluation.flatMap(m => {
                    const student = students.find(s => s.id === m.studentId);
                    return (m.revaluationHistory || []).map((h, hIdx) => (
                      <div key={`${m.id}-${hIdx}`} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex justify-between items-center text-[10px]">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {student?.firstName} {student?.lastName} ({m.subject})
                          </p>
                          <p className="text-slate-400 mt-0.5">
                            Type: <strong className="text-amber-600">{h.type} Adjustment</strong> • Reason: "{h.reason}"
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            Score Changed: {h.oldMarks} ➔ {h.newMarks}
                          </p>
                          <p className="text-slate-400 mt-0.5">
                            Logged by {h.updatedBy} on {h.date}
                          </p>
                        </div>
                      </div>
                    ));
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 6: REPORT CARDS LIST (ADMIN VIEW)
          ---------------------------------------------------- */}
      {activeTab === 'reportCards' && !isStudentOrParent && (
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Filter Report Cards</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Section</label>
                <select
                  value={reportSection}
                  onChange={e => setReportSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-850/50 font-bold"
                >
                  {['A', 'B', 'C'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Printable Academic Report Cards Registry</h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3 text-center">GPA</th>
                  <th className="py-2.5 px-3 text-center">Pass Status</th>
                  <th className="py-2.5 px-3 text-center">Result Status</th>
                  <th className="py-2.5 px-3 text-right">Report Card Action</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-700 dark:text-slate-300">
                {students.filter(
                  s => s.className === reportClass && s.section === reportSection && s.branch === selectedBranch
                ).map(st => {
                  const result = processedResults.find(
                    r => r.examId === reportExamId && r.studentId === st.id
                  );

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3 font-black text-slate-800 dark:text-slate-100">{st.firstName} {st.lastName}</td>
                      <td className="py-3 px-3 font-mono">{st.rollNo}</td>
                      <td className="py-3 px-3 text-center font-mono">{result ? result.gpa : 'N/A'}</td>
                      <td className="py-3 px-3 text-center">
                        {result ? (
                          result.passStatus === 'Pass' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20">Pass</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-955/20">Fail</span>
                          )
                        ) : (
                          <span className="text-slate-400 italic font-normal">Not Processed</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {result ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            result.status === 'Locked' ? 'bg-rose-100 text-rose-700' :
                            result.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-650'
                          }`}>
                            {result.status}
                          </span>
                        ) : 'Draft'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            const ex = exams.find(e => e.id === reportExamId);
                            if (ex) {
                              setSelectedExamForReport(ex);
                              setSelectedStudentForReport(st);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300 font-bold flex items-center gap-1 ml-auto text-[11px]"
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
                  <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 font-bold uppercase border-b">
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
                      <tr key={ex.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                        <td className="py-3 px-3 font-black text-slate-800 dark:text-slate-100">{ex.name}</td>
                        <td className="py-3 px-3 font-normal">{ex.examType || 'Term Exam'}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {isPublished ? result?.gpa : '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isPublished ? (
                            result?.passStatus === 'Pass' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20 text-[10px]">Pass</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-955/20 text-[10px]">Fail</span>
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
                                ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-sm'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingExam ? 'Modify Examination Details' : 'Configure New Examination'}
              </h3>
              <button onClick={() => setIsExamModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExamSubmit} className="space-y-4 text-xs font-semibold text-slate-655 dark:text-slate-350">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination 2026"
                  value={examFormData.name}
                  onChange={e => setExamFormData({ ...examFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1">Exam Type</label>
                  <select
                    value={examFormData.examType}
                    onChange={e => setExamFormData({ ...examFormData, examType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Annual">Annual</option>
                    <option value="Practical">Practical</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1">Exam Status</label>
                  <select
                    value={examFormData.status}
                    onChange={e => setExamFormData({ ...examFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Results Published">Results Published</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={examFormData.startDate}
                    onChange={e => setExamFormData({ ...examFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={examFormData.endDate}
                    onChange={e => setExamFormData({ ...examFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Target Applicable Classes</label>
                <button
                  type="button"
                  onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-left flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    {examFormData.applicableClasses?.length
                      ? examFormData.applicableClasses.length === classOptions.length
                        ? 'All Classes'
                        : examFormData.applicableClasses.join(', ')
                      : 'Select Classes'}
                  </span>
                  <span className="text-slate-400 text-[10px]">{classDropdownOpen ? 'Close' : 'Select'}</span>
                </button>

                {classDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-2xl border bg-white dark:bg-slate-900 shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto">
                    <div className="flex items-center gap-2 border-b pb-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setExamFormData({ ...examFormData, applicableClasses: classOptions })}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[10px] hover:bg-amber-100"
                      >
                        All Classes
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamFormData({ ...examFormData, applicableClasses: [] })}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] hover:bg-slate-200"
                      >
                        Clear
                      </button>
                    </div>
                    {classOptions.map(className => {
                      const selected = examFormData.applicableClasses?.includes(className) || false;
                      return (
                        <label
                          key={className}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={e => {
                              const current = examFormData.applicableClasses || [];
                              setExamFormData({
                                ...examFormData,
                                applicableClasses: e.target.checked
                                  ? Array.from(new Set([...current, className]))
                                  : current.filter(item => item !== className)
                              });
                            }}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                          />
                          <span>{className}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsExamModalOpen(false)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md">
                  {editingExam ? 'Save Changes' : 'Configure Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Subject Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingSchedule ? 'Modify Subject Schedule' : 'Schedule Subject Examination'}
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-semibold text-slate-655 dark:text-slate-350">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Target Exam *</label>
                  <select
                    value={scheduleForm.examId}
                    onChange={e => setScheduleForm({ ...scheduleForm, examId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="">Select Exam Setup</option>
                    {branchExamsList.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Subject *</label>
                  <select
                    value={scheduleForm.subject}
                    onChange={e => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    {subjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Classes *</label>
                  <button
                    type="button"
                    disabled={!!editingSchedule}
                    onClick={() => setScheduleClassDropdownOpen(!scheduleClassDropdownOpen)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-left flex items-center justify-between gap-2 disabled:opacity-70"
                  >
                    <span className="truncate">
                      {selectedScheduleClasses.length
                        ? selectedScheduleClasses.length === classOptions.length
                          ? 'All Classes'
                          : selectedScheduleClasses.join(', ')
                        : 'Select Classes'}
                    </span>
                    <span className="text-slate-400 text-[10px]">{editingSchedule ? 'Single' : scheduleClassDropdownOpen ? 'Close' : 'Select'}</span>
                  </button>

                  {scheduleClassDropdownOpen && !editingSchedule && (
                    <div className="absolute z-50 mt-1 w-full rounded-2xl border bg-white dark:bg-slate-900 shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto">
                      <div className="flex items-center gap-2 border-b pb-2 mb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedScheduleClasses(classOptions);
                            setScheduleForm({ ...scheduleForm, className: classOptions[0] || '', section: 'All Sections' });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[10px] hover:bg-amber-100"
                        >
                          All Classes
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedScheduleClasses([])}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] hover:bg-slate-200"
                        >
                          Clear
                        </button>
                      </div>
                      {classOptions.map(className => {
                        const selected = selectedScheduleClasses.includes(className);
                        return (
                          <label
                            key={className}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={e => {
                                const nextClasses = e.target.checked
                                  ? Array.from(new Set([...selectedScheduleClasses, className]))
                                  : selectedScheduleClasses.filter(item => item !== className);
                                setSelectedScheduleClasses(nextClasses);
                                setScheduleForm({
                                  ...scheduleForm,
                                  className: nextClasses[0] || '',
                                  section: 'All Sections'
                                });
                              }}
                              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span>{className}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Section *</label>
                  <select
                    value={scheduleForm.section}
                    onChange={e => setScheduleForm({ ...scheduleForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="All Sections">All Sections</option>
                    {getSectionOptionsForClasses(selectedScheduleClasses).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date}
                    onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Start Time (24h) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00"
                    value={scheduleForm.startTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">End Time (24h) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12:00"
                    value={scheduleForm.endTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    required
                    value={scheduleForm.maxMarks}
                    onChange={e => setScheduleForm({ ...scheduleForm, maxMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Pass Marks *</label>
                  <input
                    type="number"
                    required
                    value={scheduleForm.passMarks}
                    onChange={e => setScheduleForm({ ...scheduleForm, passMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md">
                  {editingSchedule ? 'Save Changes' : 'Schedule Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import/Export Dialog Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel/CSV Exchange Terminal
              </h3>
              <button onClick={() => setIsCsvModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Export the structured layout copy to clipboard or paste raw CSV string matching columns:
                <code className="block mt-1 p-1 bg-slate-105 dark:bg-slate-800 rounded font-mono text-[9px]">Student ID,Roll No,Student Name,Marks Obtained,Remarks</code>
              </p>

              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={10}
                className="w-full p-3 font-mono text-[10px] border bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none"
                placeholder="Paste CSV lines here..."
              />

              <div className="flex items-center justify-between gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(csvText);
                    addToast('info', 'Copied', 'CSV copied to clipboard.');
                  }}
                  className="px-3.5 py-2 rounded-xl border bg-slate-50 text-slate-705 font-bold hover:bg-slate-100 text-[11px]"
                >
                  Copy to Clipboard
                </button>
                
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsCsvModalOpen(false)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-50 rounded-xl">Close</button>
                  <button type="button" onClick={handleImportCsv} className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md">
                    Parse & Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grace Marks & Revaluation Amendment Dialog */}
      {revalueMark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-500" /> Apply Adjustments / Grace Marks
              </h3>
              <button onClick={() => setRevalueMark(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-655 dark:text-slate-350">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px]">
                <p>Student Name: <strong className="text-slate-800 dark:text-slate-200">{revalueStudentName}</strong></p>
                <p className="mt-0.5">Subject: <strong className="text-slate-800 dark:text-slate-200">{revalueMark.subject}</strong></p>
                <p className="mt-0.5">Current Score: <strong className="text-slate-800 dark:text-slate-200">{revalueMark.marksObtained} / {revalueMark.totalMarks}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Adjustment Type</label>
                  <select
                    value={revalueType}
                    onChange={e => setRevalueType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Revaluation">Revaluation (New Score)</option>
                    <option value="Grace">Grace Marks (Addition)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">
                    {revalueType === 'Grace' ? 'Grace Value to Add' : 'New Marks Obtained'}
                  </label>
                  <input
                    type="number"
                    value={revalueNewMarks}
                    onChange={e => setRevalueNewMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Audit Log Revision Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Recalculated due to paper recheck request"
                  value={revalueReason}
                  onChange={e => setRevalueReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setRevalueMark(null)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!revalueReason) {
                      addToast('warning', 'Validation Warning', 'Please provide a valid adjustment reason.');
                      return;
                    }
                    const targetScore = revalueType === 'Grace' ? (revalueMark.marksObtained + revalueNewMarks) : revalueNewMarks;
                    if (targetScore > revalueMark.totalMarks || targetScore < 0) {
                      addToast('error', 'Error', 'Final marks score cannot exceed subject maximum limits.');
                      return;
                    }

                    applyGraceOrRevaluation(revalueMark.id, targetScore, revalueType, revalueReason, user?.name || 'Admin');
                    addToast('success', 'Amendment Applied', 'Successfully updated score and appended to timeline.');
                    setRevalueMark(null);
                  }}
                  className="px-5 py-2 font-bold text-white bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md"
                >
                  Apply Amendment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Progress Report Card Dialog Modal */}
      {selectedStudentForReport && selectedExamForReport && (
        <PrintableReportCard
          student={selectedStudentForReport}
          exam={selectedExamForReport}
          isOpen={!!selectedStudentForReport}
          onClose={() => {
            setSelectedStudentForReport(null);
            setSelectedExamForReport(null);
          }}
        />
      )}

      {/* Delete Exam Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingExam}
        title="Delete Examination"
        message={`Are you sure you want to completely delete ${deletingExam?.name}? This action is irreversible.`}
        onConfirm={() => {
          if (deletingExam) {
            deleteExam(deletingExam.id);
            addToast('success', 'Deleted', 'Examination configuration successfully deleted.');
            setDeletingExam(null);
          }
        }}
        onCancel={() => setDeletingExam(null)}
      />
    </div>
  );
};
export default ExaminationView;
