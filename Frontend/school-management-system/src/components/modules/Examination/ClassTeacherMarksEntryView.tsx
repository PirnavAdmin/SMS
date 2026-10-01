// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Users,
  Search,
  Check,
  ChevronDown,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  SlidersHorizontal,
  Lock,
  Sparkles,
  Info,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { ExamSetup, Student, GradeConfig, SubjectItem, ProcessedResult, ExamMark } from '../../../types';
import { calculateGrade, determinePassFail } from './utils/resultCalculation';
import { publishExamResultsApi, submitMarksEntryApi, saveMarksEntryDraftApi, fetchExamSubjectsApi } from '../../../api/examination';

interface ClassTeacherMarksEntryViewProps {
  onNavigate?: (module: string) => void;
}

export const ClassTeacherMarksEntryView: React.FC<ClassTeacherMarksEntryViewProps> = ({ onNavigate }) => {
  const {
    students = [],
    academicClasses = [],
    teacherAssignments = [],
    exams = [],
    subjects = [],
    examMarks = [],
    examSchedules = [],
    gradeConfigurations = [],
    gradingScaleRules = [],
    saveMarks,
    saveProcessedResults,
    processedResults = [],
    refreshReleasedExamResults,
    addToast,
    schoolProfile
  } = useData();

  const { user, role } = useAuth();
  const safeRole = (role || user?.role || '').toLowerCase();
  const isTeacher = safeRole === 'teacher';
  const isAdmin = safeRole === 'admin' || safeRole === 'super admin' || safeRole === 'principal';

  // Find class teacher assignment for current logged-in user
  const teacherName = (user?.name || '').trim();
  const teacherId = String(user?.id || user?.empId || '').trim();

  const myClassTeacherAssignment = useMemo(() => {
    if (!teacherName && !teacherId) return null;
    const lowerName = teacherName.toLowerCase();

    // 1. Search in teacherAssignments for role "Class Teacher"
    const assignedTa = (teacherAssignments || []).find(ta => {
      const taName = (ta.teacherName || '').toLowerCase().trim();
      const isMatch = taName === lowerName || (lowerName && taName.includes(lowerName)) || (lowerName && lowerName.includes(taName)) || (teacherId && String(ta.teacherId) === teacherId);
      return isMatch && (ta.role === 'Class Teacher' || ta.isClassTeacher || !isTeacher);
    }) || (teacherAssignments || []).find(ta => {
      const taName = (ta.teacherName || '').toLowerCase().trim();
      return taName === lowerName || (lowerName && taName.includes(lowerName)) || (teacherId && String(ta.teacherId) === teacherId);
    });

    if (assignedTa) {
      return {
        className: assignedTa.className,
        section: assignedTa.section || 'A',
        isClassTeacher: assignedTa.role === 'Class Teacher' || assignedTa.isClassTeacher || true
      };
    }

    // 2. Search in academicClasses sections for classTeacherName
    for (const cls of academicClasses || []) {
      if (Array.isArray(cls.sections)) {
        for (const sec of cls.sections) {
          const secName = typeof sec === 'string' ? sec : (sec.sectionName || sec.name || 'A');
          const secTeacher = typeof sec === 'object' ? (sec.classTeacherName || '') : '';
          const secTeacherId = typeof sec === 'object' ? String(sec.classTeacherId || '') : '';
          if (
            (secTeacher && (secTeacher.toLowerCase() === lowerName || lowerName.includes(secTeacher.toLowerCase()))) ||
            (secTeacherId && secTeacherId === teacherId)
          ) {
            return {
              className: cls.name,
              section: secName,
              isClassTeacher: true
            };
          }
        }
      }
      if (cls.classTeacher && (cls.classTeacher.toLowerCase() === lowerName || lowerName.includes(cls.classTeacher.toLowerCase()))) {
        return {
          className: cls.name,
          section: 'A',
          isClassTeacher: true
        };
      }
    }

    return null;
  }, [academicClasses, teacherAssignments, teacherName, teacherId, isTeacher]);

  // Allowed Classes for Selection
  const availableClasses = useMemo(() => {
    const fromAcademic = (academicClasses || []).map(c => c.name).filter(Boolean);
    const fromStudents = (students || []).map(s => s.className).filter(Boolean);
    const all = Array.from(new Set([...fromAcademic, ...fromStudents]));
    if (isAdmin || !isTeacher) return all;

    const teacherClasses = (teacherAssignments || [])
      .filter(ta => {
        const tName = (ta.teacherName || '').toLowerCase().trim();
        const lName = teacherName.toLowerCase().trim();
        return tName === lName || (lName && tName.includes(lName)) || (teacherId && String(ta.teacherId) === teacherId);
      })
      .map(ta => ta.className)
      .filter(Boolean);

    if (myClassTeacherAssignment?.className) {
      teacherClasses.push(myClassTeacherAssignment.className);
    }

    const uniqueTeacherClasses = Array.from(new Set(teacherClasses));
    return uniqueTeacherClasses.length > 0 ? uniqueTeacherClasses : all;
  }, [academicClasses, students, isAdmin, isTeacher, teacherAssignments, teacherName, teacherId, myClassTeacherAssignment]);

  // Selection states
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'single'>('matrix');
  const [activeSingleSubject, setActiveSingleSubject] = useState<string>('');
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // Initialize selections with Class Teacher assigned defaults
  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      const activeExam = exams.find(e => e.status === 'Active') || exams[0];
      setSelectedExamId(activeExam.id);
    }
  }, [exams, selectedExamId]);

  useEffect(() => {
    if (!selectedClass && availableClasses.length > 0) {
      if (myClassTeacherAssignment?.className && availableClasses.includes(myClassTeacherAssignment.className)) {
        setSelectedClass(myClassTeacherAssignment.className);
      } else {
        setSelectedClass(availableClasses[0]);
      }
    }
  }, [availableClasses, selectedClass, myClassTeacherAssignment]);

  // Available Sections for Selected Class
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const clsObj = (academicClasses || []).find(c => c.name === selectedClass);
    const academicSections = clsObj && Array.isArray(clsObj.sections)
      ? clsObj.sections.map((s: any) => (typeof s === 'string' ? s : (s.sectionName || s.name || ''))).filter(Boolean)
      : [];
    const studentSections = (students || [])
      .filter(s => s.className === selectedClass)
      .map(s => s.section)
      .filter(Boolean);
    const all = Array.from(new Set([...academicSections, ...studentSections]));
    return all.length > 0 ? all : ['A', 'B', 'C'];
  }, [academicClasses, selectedClass, students]);

  useEffect(() => {
    if (availableSections.length > 0) {
      if (myClassTeacherAssignment?.className === selectedClass && availableSections.includes(myClassTeacherAssignment.section)) {
        setSelectedSection(myClassTeacherAssignment.section);
      } else if (!selectedSection || !availableSections.includes(selectedSection)) {
        setSelectedSection(availableSections[0]);
      }
    }
  }, [availableSections, selectedClass, myClassTeacherAssignment, selectedSection]);

  // Selected Exam
  const currentExam = useMemo(() => {
    return exams.find(e => e.id === selectedExamId) || exams[0] || null;
  }, [exams, selectedExamId]);

  // Fetch API exam subject configurations
  const [apiExamSubjects, setApiExamSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (!currentExam?.id || !selectedClass) {
      setApiExamSubjects([]);
      return;
    }

    let isMounted = true;
    if (/^\d+$/.test(String(currentExam.id))) {
      fetchExamSubjectsApi(currentExam.id, selectedClass)
        .then((res: any) => {
          if (isMounted && res && res.success && Array.isArray(res.data?.subjects)) {
            setApiExamSubjects(res.data.subjects);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [currentExam?.id, selectedClass]);

  // Class Subjects for Selected Exam (Show ONLY subjects configured for this assessment)
  const classSubjects = useMemo(() => {
    if (!selectedClass || !currentExam) return [];

    const clsObj = (academicClasses || []).find(c => c.name === selectedClass);
    const classWise = (currentExam?.marksConfig as any)?.classWiseConfig?.[selectedClass];
    const timetableSubjects = (examSchedules || [])
      .filter((s: any) => String(s.examId) === String(currentExam.id) && s.className === selectedClass && (!selectedSection || s.section === selectedSection))
      .map((s: any) => s.subject)
      .filter(Boolean);

    // 1. Check API returned active subjects for this exam and class
    const activeFromApi = (apiExamSubjects || []).filter((s: any) => 
      s.isActive === true || s.isExamSubject === true || s.selected === true || (s.isActive !== false && classWise?.[s.subjectName]?.isActive !== false)
    );

    // 2. Check classWiseConfig in currentExam (only active subjects)
    const activeFromClassWise: any[] = [];
    if (classWise && typeof classWise === 'object') {
      Object.entries(classWise).forEach(([subName, subCfg]: [string, any]) => {
        if (subCfg && subCfg.isActive === true) {
          activeFromClassWise.push({
            name: subName,
            code: subCfg.subjectCode || subCfg.code || `${subName.substring(0, 3).toUpperCase()}-101`,
            maxMarks: Number(subCfg.maxMarks) || 100,
            passMarks: Number(subCfg.passMarks) || 35
          });
        }
      });
    }

    // 3. Check subjectsConfig in currentExam
    const examSubjectsConfig = (currentExam?.subjectsConfig?.find((sc: any) => sc.className === selectedClass)?.subjects || []).filter((s: any) => s.isActive !== false);

    let resolvedList: Array<{ id: string; name: string; code: string; maxMarks: number; passMarks: number }> = [];

    if (activeFromClassWise.length > 0) {
      resolvedList = activeFromClassWise.map((s: any) => ({
        id: s.code || s.name,
        name: s.name,
        code: s.code || `${s.name.substring(0, 3).toUpperCase()}-101`,
        maxMarks: Number(s.maxMarks) || 100,
        passMarks: Number(s.passMarks) || 35
      }));
    } else if (activeFromApi.length > 0) {
      resolvedList = activeFromApi.map((s: any) => ({
        id: s.subjectCode || s.subjectName,
        name: s.subjectName,
        code: s.subjectCode || `${s.subjectName.substring(0, 3).toUpperCase()}-101`,
        maxMarks: Number(s.maxMarks) || 100,
        passMarks: Number(s.passMarks) || 35
      }));
    } else if (examSubjectsConfig.length > 0) {
      resolvedList = examSubjectsConfig.map((sc: any) => ({
        id: sc.subjectCode || sc.subjectName,
        name: sc.subjectName,
        code: sc.subjectCode || `${sc.subjectName.substring(0, 3).toUpperCase()}-101`,
        maxMarks: Number(sc.maxMarks) || 100,
        passMarks: Number(sc.passMarks) || 35
      }));
    } else if (timetableSubjects.length > 0) {
      resolvedList = timetableSubjects.map((subName: string) => {
        const subConfig = classWise?.[subName] || (currentExam?.marksConfig as any)?.subjectWiseConfig?.[subName] || { maxMarks: 100, passMarks: 35 };
        return {
          id: subName,
          name: subName,
          code: `${subName.substring(0, 3).toUpperCase()}-101`,
          maxMarks: Number(subConfig.maxMarks) || 100,
          passMarks: Number(subConfig.passMarks) || 35
        };
      });
    } else if (clsObj && Array.isArray(clsObj.subjects) && clsObj.subjects.length > 0) {
      // Fallback only if no exam configuration exists
      resolvedList = clsObj.subjects
        .filter((s: any) => {
          const sName = typeof s === 'string' ? s : (s.subjectName || s.name || '');
          if (!sName) return false;
          if (classWise && classWise[sName] && classWise[sName].isActive === false) return false;
          return true;
        })
        .map((s: any) => {
          const sName = typeof s === 'string' ? s : (s.subjectName || s.name || '');
          const sCode = typeof s === 'string' ? s : (s.subjectCode || s.code || sName);
          const subConfig = classWise?.[sName] || (currentExam?.marksConfig as any)?.subjectWiseConfig?.[sName] || {
            maxMarks: currentExam?.marksConfig?.maxMarks || 100,
            passMarks: currentExam?.marksConfig?.passMarks || 35
          };
          return {
            id: sCode,
            name: sName,
            code: sCode,
            maxMarks: Number(subConfig.maxMarks) || 100,
            passMarks: Number(subConfig.passMarks) || 35
          };
        });
    }

    // Deduplicate by name
    const seen = new Set<string>();
    return resolvedList.filter(item => {
      const lower = item.name.trim().toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [selectedClass, selectedSection, currentExam, academicClasses, apiExamSubjects, examSchedules]);

  useEffect(() => {
    if (classSubjects.length > 0 && (!activeSingleSubject || !classSubjects.some(s => s.name === activeSingleSubject))) {
      setActiveSingleSubject(classSubjects[0].name);
    }
  }, [classSubjects, activeSingleSubject]);

  // Students in selected Class & Section
  const classStudents = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    return (students || []).filter(s => {
      const matchCls = (s.className || '').trim().toLowerCase() === selectedClass.trim().toLowerCase();
      const matchSec = (s.section || '').trim().toLowerCase() === selectedSection.trim().toLowerCase();
      const isActive = s.status === 'Active' || !s.status;
      return matchCls && matchSec && isActive;
    });
  }, [students, selectedClass, selectedSection]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase().trim();
    return classStudents.filter(s => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const roll = (s.rollNo || '').toLowerCase();
      const adm = (s.admissionNo || '').toLowerCase();
      return fullName.includes(q) || roll.includes(q) || adm.includes(q);
    });
  }, [classStudents, searchQuery]);

  // Dynamic Grade Rules matching current exam's assessmentType
  const activeGradeRules = useMemo<GradeConfig[]>(() => {
    const examType = currentExam?.assessmentType || currentExam?.examType || 'Term Examination';
    const dynamicRules = (gradingScaleRules || []).filter((r: any) => 
      !r.examType || r.examType.toLowerCase() === examType.toLowerCase() || examType.toLowerCase().includes(r.examType.toLowerCase())
    );
    if (dynamicRules.length > 0) {
      return dynamicRules.map((r: any) => ({
        id: String(r.ruleId || r.id),
        grade: r.grade,
        minPercent: Number(r.minMarks ?? r.minPercent ?? 0),
        maxPercent: Number(r.maxMarks ?? r.maxPercent ?? 100),
        gradePoint: Number(r.gpa ?? r.gradePoint ?? 0),
        description: r.remarks || r.passFail || ''
      }));
    }
    return gradeConfigurations || [];
  }, [currentExam, gradingScaleRules, gradeConfigurations]);

  // Local Marks State Matrix: { [studentId]: { [subjectName]: { marks: string; attendance: 'Present' | 'Absent' | 'Medical Leave' | 'Exempted'; remarks?: string } } }
  const [matrixMarks, setMatrixMarks] = useState<Record<string, Record<string, { marks: string; attendance: string; remarks: string }>>>({});

  // Sync / Load Marks from DataContext examMarks and localStorage drafts
  useEffect(() => {
    if (!currentExam?.id || !selectedClass || !selectedSection || classStudents.length === 0) return;

    const initialMatrix: Record<string, Record<string, { marks: string; attendance: string; remarks: string }>> = {};

    classStudents.forEach(student => {
      initialMatrix[student.id] = {};
      classSubjects.forEach(sub => {
        // 1. Check DataContext examMarks
        const existing = (examMarks || []).find(m => 
          String(m.examId) === String(currentExam.id) &&
          String(m.studentId) === String(student.id) &&
          (m.subject || '').trim().toLowerCase() === sub.name.trim().toLowerCase()
        );

        if (existing) {
          initialMatrix[student.id][sub.name] = {
            marks: existing.isAbsent ? '' : String(existing.marksObtained ?? ''),
            attendance: existing.isAbsent ? 'Absent' : ((existing as any).attendanceStatus || 'Present'),
            remarks: existing.remarks || ''
          };
        } else {
          // 2. Check draft storage
          const draftKey = `draft_matrix_${currentExam.id}_${selectedClass}_${selectedSection}_${student.id}_${sub.name}`;
          const localDraft = localStorage.getItem(draftKey);
          if (localDraft) {
            try {
              initialMatrix[student.id][sub.name] = JSON.parse(localDraft);
            } catch (e) {
              initialMatrix[student.id][sub.name] = { marks: '', attendance: 'Present', remarks: '' };
            }
          } else {
            initialMatrix[student.id][sub.name] = { marks: '', attendance: 'Present', remarks: '' };
          }
        }
      });
    });

    setMatrixMarks(initialMatrix);
  }, [currentExam?.id, selectedClass, selectedSection, classStudents, classSubjects, examMarks]);

  // Handle Mark Change
  const handleMarkChange = (studentId: string, subjectName: string, value: string) => {
    setMatrixMarks(prev => {
      const studentSub = prev[studentId] || {};
      const current = studentSub[subjectName] || { marks: '', attendance: 'Present', remarks: '' };
      return {
        ...prev,
        [studentId]: {
          ...studentSub,
          [subjectName]: {
            ...current,
            marks: value,
            attendance: value === '' && current.attendance === 'Absent' ? 'Absent' : 'Present'
          }
        }
      };
    });
  };

  // Handle Attendance Change
  const handleAttendanceChange = (studentId: string, subjectName: string, attendance: string) => {
    setMatrixMarks(prev => {
      const studentSub = prev[studentId] || {};
      const current = studentSub[subjectName] || { marks: '', attendance: 'Present', remarks: '' };
      return {
        ...prev,
        [studentId]: {
          ...studentSub,
          [subjectName]: {
            ...current,
            attendance,
            marks: attendance === 'Absent' ? '' : current.marks
          }
        }
      };
    });
  };

  // Quick fill all students as Present
  const handleQuickMarkAllPresent = () => {
    setMatrixMarks(prev => {
      const updated = { ...prev };
      classStudents.forEach(student => {
        if (!updated[student.id]) updated[student.id] = {};
        classSubjects.forEach(sub => {
          const cur = updated[student.id][sub.name] || { marks: '', attendance: 'Present', remarks: '' };
          updated[student.id][sub.name] = {
            ...cur,
            attendance: 'Present'
          };
        });
      });
      return updated;
    });
    addToast('info', 'Attendance Set', 'All students marked Present across all subjects.');
  };

  // Dynamic calculations per student
  const studentEvaluations = useMemo(() => {
    const results: Record<string, {
      totalObtained: number;
      totalMax: number;
      percentage: number;
      grade: string;
      status: 'PASS' | 'FAIL' | 'WITHHELD' | 'INCOMPLETE';
      subjectGrades: Record<string, string>;
      isComplete: boolean;
      hasErrors: boolean;
    }> = {};

    classStudents.forEach(student => {
      const studentSubMarks = matrixMarks[student.id] || {};
      let totalObtained = 0;
      let totalMax = 0;
      let enteredCount = 0;
      let hasFail = false;
      let hasErrors = false;
      const subjectGrades: Record<string, string> = {};

      classSubjects.forEach(sub => {
        const entry = studentSubMarks[sub.name] || { marks: '', attendance: 'Present', remarks: '' };
        totalMax += sub.maxMarks;

        if (entry.attendance === 'Absent') {
          subjectGrades[sub.name] = 'Ab';
          enteredCount++;
          hasFail = true;
        } else if (entry.attendance === 'Medical Leave' || entry.attendance === 'Exempted') {
          subjectGrades[sub.name] = 'Ex';
          enteredCount++;
        } else if (entry.marks !== '') {
          const raw = Number(entry.marks);
          if (isNaN(raw) || raw < 0 || raw > sub.maxMarks) {
            hasErrors = true;
          }
          const validMark = Math.min(Math.max(0, raw || 0), sub.maxMarks);
          totalObtained += validMark;
          enteredCount++;

          const subPercent = (validMark / (sub.maxMarks || 100)) * 100;
          const grade = calculateGrade(subPercent, activeGradeRules);
          subjectGrades[sub.name] = grade;

          if (validMark < sub.passMarks) {
            hasFail = true;
          }
        } else {
          subjectGrades[sub.name] = '—';
        }
      });

      const isComplete = classSubjects.length > 0 && enteredCount === classSubjects.length;
      const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      const overallGrade = isComplete ? calculateGrade(percentage, activeGradeRules) : '—';
      const status = hasErrors ? 'WITHHELD' : (!isComplete ? 'INCOMPLETE' : (hasFail ? 'FAIL' : 'PASS'));

      results[student.id] = {
        totalObtained,
        totalMax,
        percentage,
        grade: overallGrade,
        status,
        subjectGrades,
        isComplete,
        hasErrors
      };
    });

    return results;
  }, [classStudents, classSubjects, matrixMarks, activeGradeRules]);

  // Overall class statistics
  const classStats = useMemo(() => {
    const evals = Object.values(studentEvaluations);
    const totalStudents = classStudents.length;
    const completedStudents = evals.filter(e => e.isComplete).length;
    const passedStudents = evals.filter(e => e.status === 'PASS').length;
    const failedStudents = evals.filter(e => e.status === 'FAIL').length;
    const avgPercentage = completedStudents > 0 
      ? Number((evals.reduce((acc, curr) => acc + (curr.isComplete ? curr.percentage : 0), 0) / completedStudents).toFixed(1))
      : 0;

    // Check if already published
    const isAlreadyPublished = (processedResults || []).some(
      r => String(r.examId) === String(currentExam?.id) &&
           (r.className || '').toLowerCase() === selectedClass.toLowerCase() &&
           (r.section || '').toLowerCase() === selectedSection.toLowerCase() &&
           r.status === 'Published'
    );

    return {
      totalStudents,
      completedStudents,
      passedStudents,
      failedStudents,
      avgPercentage,
      isAlreadyPublished
    };
  }, [studentEvaluations, classStudents, processedResults, currentExam, selectedClass, selectedSection]);

  // Save Draft Handler
  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    try {
      // 1. Save to localStorage drafts
      classStudents.forEach(student => {
        classSubjects.forEach(sub => {
          const entry = matrixMarks[student.id]?.[sub.name];
          if (entry) {
            const draftKey = `draft_matrix_${currentExam?.id}_${selectedClass}_${selectedSection}_${student.id}_${sub.name}`;
            localStorage.setItem(draftKey, JSON.stringify(entry));
          }
        });
      });

      // 2. Prepare payload for DataContext saveMarks
      const marksPayload: Omit<ExamMark, 'id'>[] = [];
      classStudents.forEach(student => {
        classSubjects.forEach(sub => {
          const entry = matrixMarks[student.id]?.[sub.name];
          if (entry && (entry.marks !== '' || entry.attendance === 'Absent')) {
            const numMarks = Number(entry.marks) || 0;
            const subPercent = (numMarks / sub.maxMarks) * 100;
            marksPayload.push({
              examId: String(currentExam?.id || '1'),
              studentId: student.id,
              subject: sub.name,
              marksObtained: numMarks,
              maxMarks: sub.maxMarks,
              grade: calculateGrade(subPercent, activeGradeRules),
              isAbsent: entry.attendance === 'Absent',
              remarks: entry.remarks || '',
              className: selectedClass,
              section: selectedSection,
              isLocked: false
            } as any);
          }
        });
      });

      if (marksPayload.length > 0) {
        saveMarks(marksPayload);
      }

      addToast('success', 'Draft Saved', `Marks draft saved for ${classStudents.length} students.`);
    } catch (err) {
      console.error('Error saving draft marks:', err);
      addToast('error', 'Draft Error', 'Failed to save marks draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Publish Results Handler
  const handlePublishMarks = async () => {
    if (!currentExam || !selectedClass || !selectedSection || classStudents.length === 0) {
      addToast('warning', 'Missing Details', 'Please select a valid exam, class, and section.');
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Prepare ExamMark entries
      const marksPayload: Omit<ExamMark, 'id'>[] = [];
      classStudents.forEach(student => {
        classSubjects.forEach(sub => {
          const entry = matrixMarks[student.id]?.[sub.name] || { marks: '', attendance: 'Present', remarks: '' };
          const numMarks = Number(entry.marks) || 0;
          const subPercent = (numMarks / sub.maxMarks) * 100;
          marksPayload.push({
            examId: String(currentExam.id),
            studentId: student.id,
            subject: sub.name,
            marksObtained: numMarks,
            maxMarks: sub.maxMarks,
            grade: calculateGrade(subPercent, activeGradeRules),
            isAbsent: entry.attendance === 'Absent',
            remarks: entry.remarks || '',
            className: selectedClass,
            section: selectedSection,
            isLocked: true
          } as any);
        });
      });

      // 2. Prepare ProcessedResults with ranks
      const sortedByMarks = [...classStudents].sort((a, b) => {
        const evalA = studentEvaluations[a.id]?.totalObtained || 0;
        const evalB = studentEvaluations[b.id]?.totalObtained || 0;
        return evalB - evalA;
      });

      const processedList: ProcessedResult[] = sortedByMarks.map((student, idx) => {
        const evalInfo = studentEvaluations[student.id] || {
          totalObtained: 0,
          totalMax: 100,
          percentage: 0,
          grade: 'F',
          status: 'FAIL',
          subjectGrades: {}
        };

        const subjectMarks = classSubjects.map(sub => {
          const entry = matrixMarks[student.id]?.[sub.name] || { marks: '', attendance: 'Present', remarks: '' };
          return {
            subject: sub.name,
            subjectCode: sub.code,
            maxMarks: sub.maxMarks,
            passMarks: sub.passMarks,
            obtainedMarks: entry.attendance === 'Absent' ? 'Ab' : (entry.marks !== '' ? Number(entry.marks) : 0),
            grade: evalInfo.subjectGrades[sub.name] || '—',
            status: entry.attendance === 'Absent' ? 'Absent' : (Number(entry.marks) >= sub.passMarks ? 'Pass' : 'Fail')
          };
        });

        return {
          id: `RES-${currentExam.id}-${student.id}`,
          examId: String(currentExam.id),
          examName: currentExam.name || currentExam.examName,
          academicYear: currentExam.academicYear || schoolProfile.academicYear,
          studentId: String(student.id),
          studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentName || 'Student',
          rollNo: student.rollNo || '',
          admissionNo: student.admissionNo || '',
          className: selectedClass,
          section: selectedSection,
          totalMarks: evalInfo.totalObtained,
          totalMaxMarks: evalInfo.totalMax,
          percentage: evalInfo.percentage,
          grade: evalInfo.grade,
          rank: idx + 1,
          result: evalInfo.status === 'PASS' ? 'PASS' : 'FAIL',
          status: 'Published',
          publishedDate: new Date().toISOString(),
          classTeacherName: teacherName || myClassTeacherAssignment?.className || 'Class Teacher',
          subjectMarks: subjectMarks as any
        };
      });

      // 3. Save to DataContext
      saveMarks(marksPayload);
      saveProcessedResults(processedList);

      // 4. Save to localStorage for instant local/parent/student reactivity
      try {
        const existingPublished = JSON.parse(localStorage.getItem('published_report_cards') || '[]');
        const filtered = existingPublished.filter(
          (r: any) => !(String(r.examId) === String(currentExam.id) && r.className === selectedClass && r.section === selectedSection)
        );
        localStorage.setItem('published_report_cards', JSON.stringify([...filtered, ...processedList]));
      } catch (e) {}

      // 5. Post to backend API
      try {
        await publishExamResultsApi({
          examId: Number(currentExam.id) || 1,
          className: selectedClass,
          sectionName: selectedSection,
          results: processedList.map(r => ({
            studentId: Number(r.studentId) || 0,
            rollNo: r.rollNo || '',
            studentName: r.studentName,
            admissionNo: r.admissionNo,
            className: r.className,
            sectionName: r.section,
            totalMarksObtained: r.totalMarks,
            totalMaxMarks: r.totalMaxMarks,
            percentage: r.percentage,
            grade: r.grade,
            rank: r.rank,
            resultStatus: r.result,
            subjectMarks: (r as any).subjectMarks
          }))
        });
      } catch (apiErr) {
        console.warn('Backend publish call notice (frontend and local cache updated):', apiErr);
      }

      // 6. Dispatch events for Parent & Student Portal immediate refresh
      window.dispatchEvent(new Event('results_published'));
      window.dispatchEvent(new Event('refresh_released_results'));
      window.dispatchEvent(new Event('storage'));

      if (refreshReleasedExamResults) {
        refreshReleasedExamResults().catch(() => {});
      }

      setShowPublishModal(false);
      addToast(
        'success',
        'Marks Published Successfully!',
        `Marks for ${selectedClass} - Section ${selectedSection} have been published. Admin, Students, and Parents can now view results.`
      );
    } catch (err: any) {
      console.error('Error publishing marks:', err);
      addToast('error', 'Publish Error', 'An error occurred while publishing marks.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="py-3.5 px-5 sm:py-4 sm:px-6 rounded-2xl border border-sky-400 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Class Marks Entry & Publishing
              </h1>
              {myClassTeacherAssignment && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Class Teacher • {myClassTeacherAssignment.className} ({myClassTeacherAssignment.section})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isPublishing}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3.5 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            disabled={isPublishing || classStudents.length === 0}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 text-xs font-black shadow-sm shadow-sky-600/30 transition cursor-pointer disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Publish Marks
          </button>
        </div>
      </div>

      {/* Published Alert Banner if already published */}
      {classStats.isAlreadyPublished && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-wide">
                Marks Published to Admin, Students & Parents
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                Results for {selectedClass} - Section {selectedSection} ({currentExam?.name || currentExam?.examName}) are currently live. Parents and students can view their report cards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('report-cards')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" /> View Report Cards
          </button>
        </div>
      )}

      {/* Control Bar: Exam, Class, Section, Mode & Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Exam Selector */}
        <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 p-4 rounded-2xl shadow-xs">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Select Examination
          </label>
          <div className="relative">
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name || e.examName} ({e.assessmentType || 'Term'})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Class Selector */}
        <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 p-4 rounded-2xl shadow-xs">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Class
          </label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Section Selector */}
        <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 p-4 rounded-2xl shadow-xs">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Section
          </label>
          <div className="relative">
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {availableSections.map(sec => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Quick Summary Card */}
        <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Class Progress</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {classStats.completedStudents}/{classStats.totalStudents}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              Avg Score: <span className="text-brand-600 dark:text-brand-400">{classStats.avgPercentage}%</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleQuickMarkAllPresent}
              className="text-[10px] font-extrabold text-sky-600 hover:text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1.5 rounded-lg border border-sky-200/50 dark:border-sky-900 transition cursor-pointer"
            >
              Mark All Present
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" /> All Subjects Matrix
          </button>
          <button
            type="button"
            onClick={() => setViewMode('single')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
              viewMode === 'single'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Single Subject Tab
          </button>
        </div>

        {/* Subject Pills if in single subject mode */}
        {viewMode === 'single' && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-md no-scrollbar py-1">
            {classSubjects.map(sub => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveSingleSubject(sub.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                  activeSingleSubject === sub.name
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {sub.name} <span className="text-[10px] opacity-75">({sub.maxMarks})</span>
              </button>
            ))}
          </div>
        )}

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student or roll no..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      {/* Main Marks Entry Table */}
      <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 rounded-3xl shadow-sm overflow-hidden">
        {viewMode === 'matrix' ? (
          /* ============================================================ */
          /* 1. ALL-SUBJECTS MATRIX VIEW                                  */
          /* ============================================================ */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 w-16 text-center">
                    Roll
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 min-w-[180px]">
                    Student Name
                  </th>
                  {classSubjects.map(sub => (
                    <th key={sub.id} className="px-3 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center min-w-[120px]">
                      <div>{sub.name}</div>
                      <div className="text-[9px] font-normal text-slate-400">Max: {sub.maxMarks} • Pass: {sub.passMarks}</div>
                    </th>
                  ))}
                  <th className="px-3 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-24">
                    Total
                  </th>
                  <th className="px-3 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-20">
                    %
                  </th>
                  <th className="px-3 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-20">
                    Grade
                  </th>
                  <th className="px-3 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-24">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={classSubjects.length + 6} className="py-12 text-center text-xs text-slate-400 font-bold">
                      No enrolled students found for {selectedClass} - Section {selectedSection}.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, sIdx) => {
                    const evalInfo = studentEvaluations[student.id] || {
                      totalObtained: 0,
                      totalMax: 100,
                      percentage: 0,
                      grade: '—',
                      status: 'INCOMPLETE',
                      subjectGrades: {}
                    };

                    const statusBadgeClass =
                      evalInfo.status === 'PASS'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : evalInfo.status === 'FAIL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-center text-xs font-black text-slate-800 dark:text-white">
                          {student.rollNo || sIdx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">{student.admissionNo}</p>
                        </td>

                        {classSubjects.map(sub => {
                          const entry = matrixMarks[student.id]?.[sub.name] || { marks: '', attendance: 'Present', remarks: '' };
                          const isAbsent = entry.attendance === 'Absent';
                          const val = Number(entry.marks);
                          const isExceeded = !isAbsent && entry.marks !== '' && (val > sub.maxMarks || val < 0);
                          const subGrade = evalInfo.subjectGrades[sub.name] || '—';

                          return (
                            <td key={sub.id} className="px-2 py-2.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max={sub.maxMarks}
                                    disabled={isAbsent}
                                    value={isAbsent ? '' : entry.marks}
                                    placeholder={isAbsent ? 'Ab' : '0'}
                                    onChange={e => handleMarkChange(student.id, sub.name, e.target.value)}
                                    className={`w-16 h-8 text-center text-xs font-black rounded-xl border focus:outline-none transition ${
                                      isAbsent
                                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 cursor-not-allowed'
                                        : isExceeded
                                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    title={isAbsent ? 'Mark Present' : 'Mark Absent'}
                                    onClick={() => handleAttendanceChange(student.id, sub.name, isAbsent ? 'Present' : 'Absent')}
                                    className={`h-8 px-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                      isAbsent
                                        ? 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {isAbsent ? 'Ab' : 'P'}
                                  </button>
                                </div>
                                <span className={`text-[10px] font-black ${subGrade === 'Ab' || subGrade === 'F' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                                  Grade: {subGrade}
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Total Marks */}
                        <td className="px-3 py-3 text-center">
                          <span className="font-black text-xs text-slate-900 dark:text-white">
                            {evalInfo.totalObtained} / {evalInfo.totalMax}
                          </span>
                        </td>

                        {/* Percentage */}
                        <td className="px-3 py-3 text-center">
                          <span className="font-extrabold text-xs text-brand-600 dark:text-brand-400">
                            {evalInfo.percentage}%
                          </span>
                        </td>

                        {/* Overall Grade */}
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center h-6 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-black text-xs border border-sky-200 dark:border-sky-800">
                            {evalInfo.grade}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border ${statusBadgeClass}`}>
                            {evalInfo.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ============================================================ */
          /* 2. SINGLE SUBJECT FOCUS VIEW                                 */
          /* ============================================================ */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 w-16 text-center">
                    Roll
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 min-w-[180px]">
                    Student Information
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-36">
                    Attendance
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-32">
                    Marks (Max: {classSubjects.find(s => s.name === activeSingleSubject)?.maxMarks || 100})
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center w-24">
                    Grade
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 min-w-[200px]">
                    Evaluator Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-bold">
                      No enrolled students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, sIdx) => {
                    const subObj = classSubjects.find(s => s.name === activeSingleSubject) || classSubjects[0];
                    const entry = matrixMarks[student.id]?.[activeSingleSubject] || { marks: '', attendance: 'Present', remarks: '' };
                    const isAbsent = entry.attendance === 'Absent';
                    const val = Number(entry.marks);
                    const isExceeded = !isAbsent && entry.marks !== '' && (val > subObj.maxMarks || val < 0);
                    const percent = (val / subObj.maxMarks) * 100;
                    const grade = isAbsent ? 'Ab' : (entry.marks !== '' ? calculateGrade(percent, activeGradeRules) : '—');

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-center text-xs font-black text-slate-800 dark:text-white">
                          {student.rollNo || sIdx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">{student.admissionNo}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={entry.attendance}
                            onChange={e => handleAttendanceChange(student.id, activeSingleSubject, e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Medical Leave">Medical Leave</option>
                            <option value="Exempted">Exempted</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={subObj.maxMarks}
                            disabled={isAbsent}
                            value={isAbsent ? '' : entry.marks}
                            placeholder={isAbsent ? 'Absent' : '0'}
                            onChange={e => handleMarkChange(student.id, activeSingleSubject, e.target.value)}
                            className={`w-24 h-9 text-center text-xs font-black rounded-xl border focus:outline-none transition mx-auto ${
                              isAbsent
                                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 cursor-not-allowed'
                                : isExceeded
                                ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center h-7 w-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-black text-xs border border-sky-200 dark:border-sky-800">
                            {grade}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry.remarks || ''}
                            onChange={e => {
                              const r = e.target.value;
                              setMatrixMarks(prev => ({
                                ...prev,
                                [student.id]: {
                                  ...(prev[student.id] || {}),
                                  [activeSingleSubject]: {
                                    ...(prev[student.id]?.[activeSingleSubject] || { marks: '', attendance: 'Present', remarks: '' }),
                                    remarks: r
                                  }
                                }
                              }));
                            }}
                            placeholder="Optional remarks (e.g. Great progress)..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation & Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Publish Class Marks & Results
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedClass} - Section {selectedSection} • {currentExam?.name || currentExam?.examName}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400">Students</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{classStats.totalStudents}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400">Passed</p>
                  <p className="text-lg font-black text-emerald-600">{classStats.passedStudents}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400">Class Avg</p>
                  <p className="text-lg font-black text-brand-600">{classStats.avgPercentage}%</p>
                </div>
              </div>

              <div className="rounded-xl bg-sky-50 dark:bg-sky-950/40 p-3 text-xs text-sky-800 dark:text-sky-200 flex items-start gap-2.5 border border-sky-100 dark:border-sky-900/40 font-medium">
                <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Publishing locks the entered marks, computes final rankings and grades, and immediately dispatches notifications and report cards to <strong>Admin</strong>, <strong>Parents</strong>, and <strong>Students</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishMarks}
                disabled={isPublishing}
                className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white py-3 text-xs font-black shadow-lg shadow-brand-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Confirm & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTeacherMarksEntryView;
