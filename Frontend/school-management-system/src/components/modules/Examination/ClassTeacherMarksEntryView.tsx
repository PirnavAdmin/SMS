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
  Unlock,
  Edit3,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Info,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ExamSetup, Student, GradeConfig, SubjectItem, ProcessedResult, ExamMark } from '../../../types';
import { calculateGrade, determinePassFail } from './utils/resultCalculation';
import { publishExamResultsApi, submitMarksEntryApi, saveMarksEntryDraftApi, fetchExamSubjectsApi, fetchExamOptionsApi, fetchExamByIdApi, fetchClassMarksApi } from '../../../api/examination';

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
    schoolProfile,
    academicYears = [],
    staff = []
  } = useData();

  const { addToast } = useToast();
  const { user, role, selectedAcademicYear } = useAuth();
  const safeRole = (role || user?.role || '').toLowerCase();
  const isTeacher = safeRole === 'teacher';
  const isAdmin = safeRole === 'admin' || safeRole === 'super admin' || safeRole === 'principal';

  const currentAcademicYear = useMemo(() => {
    return (
      selectedAcademicYear ||
      schoolProfile?.academicYear ||
      academicYears.find((y: any) => y.status === 'Active')?.academicYear ||
      academicYears[0]?.academicYear ||
      ''
    );
  }, [selectedAcademicYear, schoolProfile?.academicYear, academicYears]);

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

  // Live Backend Examinations Pool
  const [apiExams, setApiExams] = useState<ExamSetup[]>([]);
  const [apiExamApplicableClasses, setApiExamApplicableClasses] = useState<string[]>([]);

  // Fetch live examinations from backend API
  useEffect(() => {
    let isMounted = true;
    fetchExamOptionsApi()
      .then((res: any) => {
        if (isMounted && res && res.success && Array.isArray(res.data?.existingExams)) {
          const mapped: ExamSetup[] = res.data.existingExams.map((e: any) => ({
            id: String(e.examId),
            name: e.examName,
            examName: e.examName,
            assessmentType: e.assessmentType || '',
            term: e.academicTerm || '',
            status: e.status || 'Active',
            applicableClasses: Array.isArray(e.applicableClasses)
              ? e.applicableClasses
              : (typeof e.applicableClasses === 'string'
                  ? e.applicableClasses.split(',').map((c: string) => c.trim()).filter(Boolean)
                  : []),
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            className: Array.isArray(e.applicableClasses) && e.applicableClasses.length > 0 ? e.applicableClasses[0] : (typeof e.applicableClasses === 'string' ? e.applicableClasses.split(',')[0]?.trim() : ''),
            academicYear: e.academicYear || currentAcademicYear || ''
          } as any));
          if (mapped.length > 0) {
            setApiExams(mapped);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentAcademicYear]);

  // Merge live API exams with local DataContext exams (API data strictly takes precedence)
  const allExams = useMemo(() => {
    if (apiExams.length === 0) return exams;
    const merged = apiExams.map(ae => {
      const localMatch = exams.find(e => String(e.id) === String(ae.id) || e.name?.toLowerCase() === ae.name?.toLowerCase());
      return {
        ...(localMatch || {}),
        ...ae, // Live API database values overwrite local/mock values
        applicableClasses: ae.applicableClasses && ae.applicableClasses.length > 0 ? ae.applicableClasses : (localMatch?.applicableClasses || [])
      };
    });
    exams.forEach(le => {
      if (!merged.some(m => String(m.id) === String(le.id) || m.name?.toLowerCase() === le.name?.toLowerCase())) {
        merged.push(le);
      }
    });
    return merged;
  }, [apiExams, exams]);

  // Helper to extract applicable classes for an exam strictly without mock contamination
  const getExamApplicableClasses = (exam: any): string[] => {
    if (!exam) return [];

    // 1. Live API returned applicable classes for the currently selected exam
    if (apiExamApplicableClasses.length > 0 && String(exam.id) === String(selectedExamId)) {
      return [...apiExamApplicableClasses];
    }

    // 2. Direct applicableClasses array or string
    if (Array.isArray(exam.applicableClasses) && exam.applicableClasses.length > 0) {
      return exam.applicableClasses.map((c: string) => String(c).trim()).filter(Boolean);
    }
    if (typeof exam.applicableClasses === 'string' && exam.applicableClasses.trim().length > 0) {
      return exam.applicableClasses.split(',').map((c: string) => c.trim()).filter(Boolean);
    }

    // 3. Classes array or string
    if (Array.isArray(exam.classes) && exam.classes.length > 0) {
      return exam.classes.map((c: string) => String(c).trim()).filter(Boolean);
    }
    if (typeof exam.classes === 'string' && exam.classes.trim().length > 0) {
      return exam.classes.split(',').map((c: string) => c.trim()).filter(Boolean);
    }

    // 4. SubjectsConfig classes
    if (Array.isArray(exam.subjectsConfig) && exam.subjectsConfig.length > 0) {
      const scClasses = exam.subjectsConfig.map((sc: any) => sc.className?.trim()).filter(Boolean);
      if (scClasses.length > 0) {
        return Array.from(new Set(scClasses));
      }
    }

    // 5. Single className
    if (exam.className && typeof exam.className === 'string' && exam.className.trim().length > 0) {
      return [exam.className.trim()];
    }

    return [];
  };

  // Comprehensive resolution of all classes assigned to the logged-in teacher
  const myTeacherClasses = useMemo(() => {
    const matchedClasses = new Set<string>();

    if (myClassTeacherAssignment?.className) {
      matchedClasses.add(myClassTeacherAssignment.className.trim());
    }

    if (teacherName || teacherId) {
      const lowerName = teacherName.toLowerCase().trim();
      const cleanId = teacherId.trim();

      // 1. Check teacherAssignments
      (teacherAssignments || []).forEach(ta => {
        const taName = (ta.teacherName || '').toLowerCase().trim();
        const taId = String(ta.teacherId || '').trim();
        const isMatch = (taName && (taName === lowerName || taName.includes(lowerName) || lowerName.includes(taName))) || (cleanId && taId === cleanId);
        if (isMatch && ta.className) {
          matchedClasses.add(ta.className.trim());
        }
      });

      // 2. Check academicClasses
      (academicClasses || []).forEach(cls => {
        if (!cls || !cls.name) return;
        const cTeacher = (cls.classTeacher || '').toLowerCase().trim();
        if (cTeacher && (cTeacher === lowerName || cTeacher.includes(lowerName) || lowerName.includes(cTeacher))) {
          matchedClasses.add(cls.name.trim());
        }

        if (Array.isArray(cls.sections)) {
          cls.sections.forEach((sec: any) => {
            const secTeacher = (typeof sec === 'object' ? (sec.classTeacherName || '') : '').toLowerCase().trim();
            const secTeacherId = typeof sec === 'object' ? String(sec.classTeacherId || '').trim() : '';
            if ((secTeacher && (secTeacher === lowerName || secTeacher.includes(lowerName) || lowerName.includes(secTeacher))) || (cleanId && secTeacherId === cleanId)) {
              matchedClasses.add(cls.name.trim());
            }
          });
        }

        if (Array.isArray(cls.subjects)) {
          cls.subjects.forEach((sub: any) => {
            const subTeacher = (typeof sub === 'object' ? (sub.teacherName || sub.teacher || '') : '').toLowerCase().trim();
            const subTeacherId = typeof sub === 'object' ? String(sub.teacherId || '').trim() : '';
            if ((subTeacher && (subTeacher === lowerName || subTeacher.includes(lowerName) || lowerName.includes(subTeacher))) || (cleanId && subTeacherId === cleanId)) {
              matchedClasses.add(cls.name.trim());
            }
          });
        }
      });
    }

    return Array.from(matchedClasses);
  }, [teacherName, teacherId, myClassTeacherAssignment, teacherAssignments, academicClasses]);

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
  const [isEditingPublished, setIsEditingPublished] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Fetch live exam details and applicable classes whenever selectedExamId changes
  useEffect(() => {
    if (!selectedExamId) {
      setApiExamApplicableClasses([]);
      return;
    }

    let isMounted = true;
    if (/^\d+$/.test(String(selectedExamId))) {
      fetchExamByIdApi(selectedExamId)
        .then((res: any) => {
          if (isMounted && res && res.success && res.data) {
            const raw = res.data.applicableClasses;
            const parsed = Array.isArray(raw)
              ? raw
              : (typeof raw === 'string' ? raw.split(',').map((c: string) => c.trim()).filter(Boolean) : []);
            if (parsed.length > 0) {
              setApiExamApplicableClasses(parsed);
              setSelectedClass(prev => {
                const isValid = parsed.some((c: string) => c.toLowerCase() === (prev || '').toLowerCase());
                if (isValid) return prev;
                return parsed[0];
              });
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [selectedExamId]);

  // Exams available for the logged-in Teacher / Admin
  const teacherApplicableExams = useMemo(() => {
    if (isAdmin || !isTeacher) return allExams;
    if (myTeacherClasses.length === 0) return allExams;

    const filtered = allExams.filter(e => {
      const app = getExamApplicableClasses(e);
      if (app.length === 0) return true;
      return app.some(ac => myTeacherClasses.some(tc => tc.toLowerCase() === ac.toLowerCase()));
    });

    return filtered.length > 0 ? filtered : allExams;
  }, [allExams, isAdmin, isTeacher, myTeacherClasses]);

  // Selected Exam
  const currentExam = useMemo(() => {
    return allExams.find(e => String(e.id) === String(selectedExamId)) || teacherApplicableExams[0] || allExams[0] || null;
  }, [allExams, selectedExamId, teacherApplicableExams]);

  // Allowed Classes for Selection, strictly dynamically filtered by the Selected Examination's Applicable Classes
  const availableClasses = useMemo(() => {
    const examAppClasses = currentExam ? getExamApplicableClasses(currentExam) : [];

    // If logged in as Teacher:
    if (isTeacher && !isAdmin) {
      const assigned = myTeacherClasses.length > 0 ? myTeacherClasses : (myClassTeacherAssignment?.className ? [myClassTeacherAssignment.className] : []);
      
      // If the current exam has specific applicable classes configured:
      if (examAppClasses.length > 0) {
        // Intersect with teacher's assigned classes
        const intersected = assigned.filter(c => 
          examAppClasses.some(ec => ec.toLowerCase() === c.toLowerCase())
        );
        if (intersected.length > 0) {
          return intersected;
        }
        return examAppClasses;
      }

      if (assigned.length > 0) {
        return assigned;
      }
    }

    // If Admin or fallback:
    if (examAppClasses.length > 0) {
      return examAppClasses;
    }

    const fromAcademic = (academicClasses || []).map(c => c.name).filter(Boolean);
    const fromStudents = (students || []).map(s => s.className).filter(Boolean);
    return Array.from(new Set([...fromAcademic, ...fromStudents]));
  }, [academicClasses, students, isAdmin, isTeacher, myTeacherClasses, myClassTeacherAssignment, currentExam, apiExamApplicableClasses]);

  // Initialize selections with Teacher assigned defaults
  useEffect(() => {
    if (teacherApplicableExams.length > 0 && !selectedExamId) {
      const activeExam = teacherApplicableExams.find(e => e.status === 'Active') || teacherApplicableExams[0];
      setSelectedExamId(activeExam.id);
    }
  }, [teacherApplicableExams, selectedExamId]);

  useEffect(() => {
    if (availableClasses.length > 0) {
      if (!selectedClass || !availableClasses.some(c => c.toLowerCase() === selectedClass.toLowerCase())) {
        if (myClassTeacherAssignment?.className && availableClasses.some(c => c.toLowerCase() === myClassTeacherAssignment.className.toLowerCase())) {
          const matched = availableClasses.find(c => c.toLowerCase() === myClassTeacherAssignment.className.toLowerCase());
          setSelectedClass(matched || availableClasses[0]);
        } else {
          setSelectedClass(availableClasses[0]);
        }
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

  // Check if selected class is applicable for the current exam
  const isClassApplicableToExam = useMemo(() => {
    if (!currentExam || !selectedClass) return true;
    const appClasses = currentExam.applicableClasses || (currentExam as any).classes || (currentExam.className ? [currentExam.className] : []);
    if (Array.isArray(appClasses) && appClasses.length > 0) {
      return appClasses.some((c: string) => c.trim().toLowerCase() === selectedClass.trim().toLowerCase());
    }
    return true;
  }, [currentExam, selectedClass]);

  // Class Subjects for Selected Exam (Show ONLY subjects configured for this assessment)
  const classSubjects = useMemo(() => {
    if (!selectedClass || !currentExam || !isClassApplicableToExam) return [];

    const clsObj = (academicClasses || []).find(c => c.name?.toLowerCase() === selectedClass.toLowerCase());
    const classWise = (currentExam?.marksConfig as any)?.classWiseConfig?.[selectedClass];
    const timetableSubjects = (examSchedules || [])
      .filter((s: any) => String(s.examId) === String(currentExam.id) && s.className?.toLowerCase() === selectedClass.toLowerCase() && (!selectedSection || !s.section || s.section === selectedSection))
      .map((s: any) => s.subject)
      .filter(Boolean);

    // 1. Check classWiseConfig in currentExam (Priority 1)
    if (classWise && typeof classWise === 'object' && Object.keys(classWise).length > 0) {
      const activeEntries = Object.entries(classWise).filter(([_, cfg]: [string, any]) => {
        if (!cfg) return false;
        if (cfg.isActive === false) return false;
        return true;
      });
      if (activeEntries.length > 0) {
        return activeEntries.map(([subName, subCfg]: [string, any]) => ({
          id: subCfg.subjectCode || subCfg.code || `${subName.substring(0, 3).toUpperCase()}-101`,
          name: subName,
          code: subCfg.subjectCode || subCfg.code || `${subName.substring(0, 3).toUpperCase()}-101`,
          maxMarks: Number(subCfg.maxMarks) || 100,
          passMarks: Number(subCfg.passMarks) || 35
        }));
      }
    }

    // 2. Check subjectsConfig in currentExam (Priority 2)
    const examClassConfig = currentExam?.subjectsConfig?.find((sc: any) => sc.className?.toLowerCase() === selectedClass.toLowerCase());
    if (examClassConfig && Array.isArray(examClassConfig.subjects) && examClassConfig.subjects.length > 0) {
      const activeSubs = examClassConfig.subjects.filter((s: any) => s.isActive !== false);
      if (activeSubs.length > 0) {
        return activeSubs.map((s: any) => ({
          id: s.subjectCode || s.subjectName || s.name,
          name: s.subjectName || s.name,
          code: s.subjectCode || s.code || `${(s.subjectName || s.name || '').substring(0, 3).toUpperCase()}-101`,
          maxMarks: Number(s.maxMarks) || 100,
          passMarks: Number(s.passMarks) || 35
        }));
      }
    }

    // 3. Check API returned active subjects for this exam and class (Priority 3)
    const activeFromApi = (apiExamSubjects || []).filter((s: any) => 
      s.isActive === true || s.isExamSubject === true || s.selected === true
    );
    if (activeFromApi.length > 0) {
      return activeFromApi.map((s: any) => ({
        id: s.subjectCode || s.subjectName,
        name: s.subjectName,
        code: s.subjectCode || `${s.subjectName.substring(0, 3).toUpperCase()}-101`,
        maxMarks: Number(s.maxMarks) || 100,
        passMarks: Number(s.passMarks) || 35
      }));
    }

    // 4. Check timetable schedules for this exam and class (Priority 4)
    if (timetableSubjects.length > 0) {
      const uniqueTimetable = Array.from(new Set(timetableSubjects));
      return uniqueTimetable.map((subName: string) => {
        const subConfig = (currentExam?.marksConfig as any)?.subjectWiseConfig?.[subName] || { maxMarks: 100, passMarks: 35 };
        return {
          id: subName,
          name: subName,
          code: `${subName.substring(0, 3).toUpperCase()}-101`,
          maxMarks: Number(subConfig.maxMarks) || 100,
          passMarks: Number(subConfig.passMarks) || 35
        };
      });
    }

    // 5. Fallback ONLY if the exam has NO subject configurations and is scheduled for this class
    if (clsObj && Array.isArray(clsObj.subjects) && clsObj.subjects.length > 0) {
      const validSubs = clsObj.subjects
        .map((s: any) => {
          const sName = typeof s === 'string' ? s : (s.subjectName || s.name || '');
          const sCode = typeof s === 'string' ? s : (s.subjectCode || s.code || sName);
          if (!sName) return null;
          const subConfig = (currentExam?.marksConfig as any)?.subjectWiseConfig?.[sName] || {
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
        })
        .filter(Boolean) as Array<{ id: string; name: string; code: string; maxMarks: number; passMarks: number }>;

      // Deduplicate by name
      const seen = new Set<string>();
      return validSubs.filter(item => {
        const lower = item.name.trim().toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
    }

    return [];
  }, [selectedClass, selectedSection, currentExam, isClassApplicableToExam, academicClasses, apiExamSubjects, examSchedules]);

  // Check whether the logged-in user is Class Teacher for the currently selected class & section
  const isCurrentClassTeacher = useMemo(() => {
    if (isAdmin) return true; // Admins / Principals have full Class Teacher privileges
    if (!isTeacher) return true;
    if (!selectedClass) return false;

    const lowerName = teacherName.toLowerCase().trim();
    const cleanId = teacherId.trim();

    // 1. Direct class teacher assignment match
    if (
      myClassTeacherAssignment &&
      myClassTeacherAssignment.className.toLowerCase() === selectedClass.toLowerCase() &&
      (!selectedSection || !myClassTeacherAssignment.section || myClassTeacherAssignment.section.toLowerCase() === selectedSection.toLowerCase())
    ) {
      return true;
    }

    // 2. Check teacherAssignments array
    const hasTaMatch = (teacherAssignments || []).some(ta => {
      const taName = (ta.teacherName || '').toLowerCase().trim();
      const taId = String(ta.teacherId || '').trim();
      const isMe = (taName && (taName === lowerName || taName.includes(lowerName) || lowerName.includes(taName))) || (cleanId && taId === cleanId);
      const isCls = (ta.className || '').toLowerCase() === selectedClass.toLowerCase();
      const isSec = !selectedSection || !ta.section || ta.section.toLowerCase() === selectedSection.toLowerCase();
      const isCTRole = ta.role === 'Class Teacher' || ta.isClassTeacher;
      return isMe && isCls && isSec && isCTRole;
    });
    if (hasTaMatch) return true;

    // 3. Check academicClasses
    const clsObj = (academicClasses || []).find(c => c.name?.toLowerCase() === selectedClass.toLowerCase());
    if (clsObj) {
      const cTeacher = (clsObj.classTeacher || '').toLowerCase().trim();
      if (cTeacher && (cTeacher === lowerName || cTeacher.includes(lowerName) || lowerName.includes(cTeacher))) {
        return true;
      }
      if (Array.isArray(clsObj.sections)) {
        const matchedSec = clsObj.sections.find((s: any) => {
          const sName = typeof s === 'string' ? s : (s.sectionName || s.name || '');
          return !selectedSection || sName.toLowerCase() === selectedSection.toLowerCase();
        });
        if (matchedSec && typeof matchedSec === 'object') {
          const secTeacher = (matchedSec.classTeacherName || '').toLowerCase().trim();
          const secTeacherId = String(matchedSec.classTeacherId || '').trim();
          if ((secTeacher && (secTeacher === lowerName || secTeacher.includes(lowerName) || lowerName.includes(secTeacher))) || (cleanId && secTeacherId === cleanId)) {
            return true;
          }
        }
      }
    }

    // 4. Check staff master record
    const meStaff = (staff || []).find(s => {
      const sName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
      return (cleanId && (s.id === cleanId || s.empId === cleanId)) || (lowerName && sName && (sName === lowerName || sName.includes(lowerName) || lowerName.includes(sName)));
    });
    if (meStaff && meStaff.isClassTeacher && meStaff.classTeacherFor) {
      const ctCls = meStaff.classTeacherFor.className || '';
      const ctSec = meStaff.classTeacherFor.section || '';
      if (ctCls.toLowerCase() === selectedClass.toLowerCase() && (!selectedSection || !ctSec || ctSec.toLowerCase() === selectedSection.toLowerCase())) {
        return true;
      }
    }

    return false;
  }, [isAdmin, isTeacher, selectedClass, selectedSection, teacherName, teacherId, myClassTeacherAssignment, teacherAssignments, academicClasses, staff]);

  // Resolve permitted subjects for the currently logged-in user in this class
  const teacherAssignedSubjects = useMemo<string[]>(() => {
    // If Class Teacher or Admin -> All configured class subjects
    if (isAdmin || isCurrentClassTeacher) {
      return classSubjects.map(s => s.name);
    }
    if (!teacherName && !teacherId) return classSubjects.map(s => s.name);

    const lowerName = teacherName.toLowerCase().trim();
    const cleanId = teacherId.trim();
    const assignedSubs = new Set<string>();

    // 1. From teacherAssignments
    (teacherAssignments || []).forEach(ta => {
      const taName = (ta.teacherName || '').toLowerCase().trim();
      const taId = String(ta.teacherId || '').trim();
      const isMe = (taName && (taName === lowerName || taName.includes(lowerName) || lowerName.includes(taName))) || (cleanId && taId === cleanId);
      const isCls = (ta.className || '').toLowerCase() === selectedClass.toLowerCase();
      const isSec = !selectedSection || !ta.section || ta.section.toLowerCase() === selectedSection.toLowerCase();
      if (isMe && isCls && isSec && ta.subject) {
        assignedSubs.add(ta.subject.trim());
      }
    });

    // 2. From academicClasses
    const clsObj = (academicClasses || []).find(c => c.name?.toLowerCase() === selectedClass.toLowerCase());
    if (clsObj && Array.isArray(clsObj.subjects)) {
      clsObj.subjects.forEach((sub: any) => {
        const subName = typeof sub === 'string' ? sub : (sub.subjectName || sub.name || '');
        const subTeacher = (typeof sub === 'object' ? (sub.teacherName || sub.teacher || '') : '').toLowerCase().trim();
        const subTeacherId = typeof sub === 'object' ? String(sub.teacherId || '').trim() : '';
        if ((subTeacher && (subTeacher === lowerName || subTeacher.includes(lowerName) || lowerName.includes(subTeacher))) || (cleanId && subTeacherId === cleanId)) {
          if (subName) assignedSubs.add(subName.trim());
        }
      });
    }

    // 3. From staff master record
    const meStaff = (staff || []).find(s => {
      const sName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
      return (cleanId && (s.id === cleanId || s.empId === cleanId)) || (lowerName && sName && (sName === lowerName || sName.includes(lowerName) || lowerName.includes(sName)));
    });
    if (meStaff && Array.isArray(meStaff.assignedSubjects)) {
      meStaff.assignedSubjects.forEach(sub => {
        if (sub) assignedSubs.add(sub.trim());
      });
    }

    const matched = classSubjects.filter(cs =>
      Array.from(assignedSubs).some(asub => 
        asub.toLowerCase() === cs.name.toLowerCase() || 
        cs.name.toLowerCase().includes(asub.toLowerCase()) || 
        asub.toLowerCase().includes(cs.name.toLowerCase())
      )
    );

    if (matched.length > 0) {
      return matched.map(s => s.name);
    }

    if (assignedSubs.size > 0) {
      return Array.from(assignedSubs);
    }

    return classSubjects.map(s => s.name);
  }, [isAdmin, isCurrentClassTeacher, classSubjects, teacherName, teacherId, selectedClass, selectedSection, teacherAssignments, academicClasses, staff]);

  // Check if results are published for selected exam, class, section
  const isAlreadyPublished = useMemo(() => {
    if (!currentExam?.id || !selectedClass || !selectedSection) return false;
    return (processedResults || []).some(
      r => String(r.examId) === String(currentExam.id) &&
           (r.className || '').trim().toLowerCase() === selectedClass.trim().toLowerCase() &&
           (r.section || '').trim().toLowerCase() === selectedSection.trim().toLowerCase() &&
           r.status === 'Published'
    );
  }, [processedResults, currentExam?.id, selectedClass, selectedSection]);

  // Reset Edit Published and Page when selections change
  useEffect(() => {
    setIsEditingPublished(false);
    setCurrentPage(1);
  }, [selectedExamId, selectedClass, selectedSection, searchQuery]);

  // Check if subject is editable (respects publish lock unless isEditingPublished is true)
  const canEditSubject = (subjectName: string): boolean => {
    if (isAlreadyPublished && !isEditingPublished) return false;
    if (isAdmin || isCurrentClassTeacher) return true;
    return teacherAssignedSubjects.some(s => s.toLowerCase() === subjectName.toLowerCase());
  };

  useEffect(() => {
    if (teacherAssignedSubjects.length > 0 && (!activeSingleSubject || !teacherAssignedSubjects.includes(activeSingleSubject))) {
      setActiveSingleSubject(teacherAssignedSubjects[0]);
    } else if (classSubjects.length > 0 && !activeSingleSubject) {
      setActiveSingleSubject(classSubjects[0].name);
    }
  }, [teacherAssignedSubjects, classSubjects, activeSingleSubject]);

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

  // Pagination calculation
  const totalStudentsCount = filteredStudents.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalStudentsCount / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedStudents = useMemo(() => {
    if (pageSize === 0) return filteredStudents;
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, safeCurrentPage, pageSize]);

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

  // Sync / Load Marks dynamically from Backend Database, Processed Results, and DataContext
  useEffect(() => {
    if (!currentExam?.id || !selectedClass || !selectedSection || classStudents.length === 0 || classSubjects.length === 0) return;

    let isMounted = true;

    // 1. Initial immediate fast-populate from context (processedResults & examMarks)
    const initialMatrix: Record<string, Record<string, { marks: string; attendance: string; remarks: string }>> = {};

    classStudents.forEach(student => {
      initialMatrix[student.id] = {};
      
      // Check for published processed result first
      const studentResult = (processedResults || []).find(r => 
        String(r.examId) === String(currentExam.id) &&
        (String(r.studentId) === String(student.id) || 
         (r.admissionNo && r.admissionNo === student.admissionNo) ||
         (r.rollNo && r.rollNo === student.rollNo))
      );

      classSubjects.forEach(sub => {
        let matchedMark = '';
        let matchedAttendance = 'Present';
        let matchedRemarks = '';

        if (studentResult && Array.isArray((studentResult as any).subjectMarks)) {
          const resSub = (studentResult as any).subjectMarks.find((s: any) => 
            (s.subject || '').trim().toLowerCase() === sub.name.trim().toLowerCase() ||
            (s.subjectCode || '').trim().toLowerCase() === (sub.code || '').trim().toLowerCase()
          );
          if (resSub) {
            if (resSub.obtainedMarks === 'Ab' || resSub.obtainedMarks === 'AB' || resSub.status === 'Absent') {
              matchedAttendance = 'Absent';
            } else if (resSub.obtainedMarks !== undefined && resSub.obtainedMarks !== null) {
              matchedMark = String(resSub.obtainedMarks);
            }
          }
        }

        // If not found in processedResults, check DataContext examMarks
        if (!matchedMark && matchedAttendance === 'Present') {
          const existing = (examMarks || []).find(m => 
            String(m.examId) === String(currentExam.id) &&
            String(m.studentId) === String(student.id) &&
            (m.subject || '').trim().toLowerCase() === sub.name.trim().toLowerCase()
          );
          if (existing) {
            matchedMark = existing.isAbsent ? '' : String(existing.marksObtained ?? '');
            matchedAttendance = existing.isAbsent ? 'Absent' : ((existing as any).attendanceStatus || 'Present');
            matchedRemarks = existing.remarks || '';
          }
        }

        initialMatrix[student.id][sub.name] = {
          marks: matchedMark,
          attendance: matchedAttendance,
          remarks: matchedRemarks
        };
      });
    });

    setMatrixMarks(initialMatrix);

    // 2. Fetch authoritative saved/draft/published marks from Backend API
    fetchClassMarksApi(selectedClass, selectedSection, currentExam.id)
      .then((res: any) => {
        if (!isMounted) return;
        const markEntries: any[] = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(markEntries) && markEntries.length > 0) {
          setMatrixMarks(prev => {
            const updated = { ...prev };
            classStudents.forEach(student => {
              if (!updated[student.id]) updated[student.id] = {};
              
              const studentRows = markEntries.filter(m => 
                String(m.studentId) === String(student.id) ||
                (m.admissionNo && student.admissionNo && m.admissionNo.toLowerCase().trim() === student.admissionNo.toLowerCase().trim()) ||
                (m.rollNo && student.rollNo && m.rollNo.toLowerCase().trim() === student.rollNo.toLowerCase().trim()) ||
                (m.studentName && `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().trim() === m.studentName.toLowerCase().trim())
              );

              classSubjects.forEach(sub => {
                const subRow = studentRows.find(m => 
                  (m.subjectCode && (m.subjectCode.toLowerCase() === (sub.code || '').toLowerCase() || m.subjectCode.toLowerCase() === sub.name.toLowerCase())) ||
                  (m.subjectName && (m.subjectName.toLowerCase() === sub.name.toLowerCase() || m.subjectName.toLowerCase() === (sub.code || '').toLowerCase()))
                );

                if (subRow) {
                  const isAbsent = (subRow.attendanceStatus || '').toLowerCase() === 'absent';
                  const marksVal = isAbsent ? '' : (subRow.marksObtained !== undefined && subRow.marksObtained !== null ? String(subRow.marksObtained) : '');
                  updated[student.id][sub.name] = {
                    marks: marksVal,
                    attendance: isAbsent ? 'Absent' : (subRow.attendanceStatus || 'Present'),
                    remarks: subRow.evaluatorRemarks || ''
                  };
                }
              });
            });
            return updated;
          });
        }
      })
      .catch((err) => {
        console.warn('Backend marks fetch notice (using context data):', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentExam?.id, selectedClass, selectedSection, classStudents.length, classSubjects.length]);

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
    return {
      totalStudents,
      completedStudents,
      passedStudents,
      failedStudents,
      avgPercentage,
      isAlreadyPublished
    };
  }, [studentEvaluations, classStudents, isAlreadyPublished]);

  // Save Draft Handler
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // 1. Prepare payload for DataContext saveMarks
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
        saveMarks(marksPayload, true);
      }

      // 3. Post to backend API for each active subject
      const targetSubs = classSubjects.filter(sub => canEditSubject(sub.name));
      for (const sub of targetSubs) {
        const subStudentRows = classStudents.map((student, idx) => {
          const entry = matrixMarks[student.id]?.[sub.name] || { marks: '', attendance: 'Present', remarks: '' };
          const numMarks = Number(entry.marks) || 0;
          const subPercent = (numMarks / sub.maxMarks) * 100;
          return {
            entryId: idx + 1,
            rollNo: student.rollNo || String(idx + 1),
            studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentName || 'Student',
            admissionNo: student.admissionNo || String(student.id),
            attendanceStatus: entry.attendance || 'Present',
            marksObtained: numMarks,
            maxMarks: sub.maxMarks,
            grade: calculateGrade(subPercent, activeGradeRules),
            evaluatorRemarks: entry.remarks || '',
            status: 'Draft'
          };
        });

        if (subStudentRows.length > 0) {
          try {
            await saveMarksEntryDraftApi({
              examId: Number(currentExam?.id) || 1,
              className: selectedClass,
              sectionName: selectedSection,
              subjectCode: sub.code || sub.id,
              students: subStudentRows,
              isFinalSubmit: false
            });
          } catch (apiErr) {
            // Silently fall back to frontend/local storage
          }
        }
      }

      const roleText = isCurrentClassTeacher ? 'All subjects' : teacherAssignedSubjects.join(', ');
      addToast(
        'success',
        'Marks Saved',
        `Marks for ${roleText} in ${selectedClass} (${selectedSection}) saved successfully. Synchronized to evaluation sheet.`
      );
    } catch (err) {
      console.error('Error saving draft marks:', err);
      addToast('error', 'Draft Error', 'Failed to save marks.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Publish Results Handler
  const handlePublishMarks = async () => {
    if (!currentExam || !selectedClass || !selectedSection || classStudents.length === 0 || classSubjects.length === 0) {
      addToast('warning', 'Missing Details', 'Please select a valid exam, class, and section with configured subjects.');
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
          academicYear: currentExam.academicYear || currentAcademicYear || schoolProfile?.academicYear || '',
          studentId: String(student.id),
          studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentName || 'Student',
          rollNo: student.rollNo || '',
          admissionNo: student.admissionNo || '',
          className: selectedClass,
          section: selectedSection,
          totalObtainedMarks: evalInfo.totalObtained,
          totalMarksObtained: evalInfo.totalObtained,
          totalMarks: evalInfo.totalObtained,
          totalMaxMarks: evalInfo.totalMax,
          percentage: evalInfo.percentage,
          finalGrade: evalInfo.grade,
          overallGrade: evalInfo.grade,
          grade: evalInfo.grade,
          rank: idx + 1,
          passStatus: evalInfo.status === 'PASS' ? 'Pass' : 'Fail',
          result: evalInfo.status === 'PASS' ? 'PASS' : 'FAIL',
          status: 'Published',
          publishedDate: new Date().toISOString(),
          classTeacherName: teacherName || myClassTeacherAssignment?.className || 'Class Teacher',
          subjectMarks: subjectMarks as any
        };
      });

      // 3. Save to DataContext
      saveMarks(marksPayload, true);
      saveProcessedResults(processedList);

      // 4. Post dynamically to backend API
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
      setIsEditingPublished(false);
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
              {isCurrentClassTeacher ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Class Teacher • {selectedClass} ({selectedSection})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Subject Teacher • {selectedClass} ({selectedSection})
                  {teacherAssignedSubjects.length > 0 ? ` (${teacherAssignedSubjects.join(', ')})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {isAlreadyPublished && isEditingPublished && (
            <button
              type="button"
              onClick={() => setIsEditingPublished(false)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3.5 text-xs font-bold transition cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              Lock Editing
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isPublishing || (isAlreadyPublished && !isEditingPublished)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3.5 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSavingDraft ? 'Saving...' : (isCurrentClassTeacher ? 'Save Draft' : 'Save Subject Marks')}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isCurrentClassTeacher && !isAdmin) {
                addToast('warning', 'Class Teacher Privilege', 'Only the designated Class Teacher or Admin can publish final report cards for this class.');
                return;
              }
              setShowPublishModal(true);
            }}
            disabled={isPublishing || classStudents.length === 0 || (!isCurrentClassTeacher && !isAdmin) || (isAlreadyPublished && !isEditingPublished)}
            title={!isCurrentClassTeacher && !isAdmin ? 'Only Class Teacher or Admin can publish final marks' : undefined}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-black shadow-sm transition disabled:opacity-50 ${
              isCurrentClassTeacher || isAdmin
                ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30 cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            {isAlreadyPublished ? (isEditingPublished ? 'Re-Publish Marks' : 'Marks Published') : (isCurrentClassTeacher || isAdmin ? 'Publish Marks' : 'Publish (Class Teacher Only)')}
          </button>
        </div>
      </div>

      {/* Role Notice Banner for Subject Teachers */}
      {!isCurrentClassTeacher && !isAdmin && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-3.5 dark:border-sky-900/50 dark:bg-sky-950/40 flex items-center justify-between gap-3 text-xs text-sky-800 dark:text-sky-200">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              You are assigned as <strong>Subject Teacher</strong> for <strong>{teacherAssignedSubjects.join(', ') || 'assigned subjects'}</strong> in {selectedClass} ({selectedSection}).
              Marks you save will automatically reflect in the <strong>Class Teacher's evaluation sheet</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Published Alert Banner if already published */}
      {isAlreadyPublished && !isEditingPublished && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsEditingPublished(true);
                fetchClassMarksApi(selectedClass, selectedSection, currentExam?.id)
                  .then((res: any) => {
                    const markEntries: any[] = res?.data || (Array.isArray(res) ? res : []);
                    if (Array.isArray(markEntries) && markEntries.length > 0) {
                      setMatrixMarks(prev => {
                        const updated = { ...prev };
                        classStudents.forEach(student => {
                          if (!updated[student.id]) updated[student.id] = {};
                          const studentRows = markEntries.filter(m => 
                            String(m.studentId) === String(student.id) ||
                            (m.admissionNo && student.admissionNo && m.admissionNo.toLowerCase().trim() === student.admissionNo.toLowerCase().trim()) ||
                            (m.rollNo && student.rollNo && m.rollNo.toLowerCase().trim() === student.rollNo.toLowerCase().trim()) ||
                            (m.studentName && `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().trim() === m.studentName.toLowerCase().trim())
                          );
                          classSubjects.forEach(sub => {
                            const subRow = studentRows.find(m => 
                              (m.subjectCode && (m.subjectCode.toLowerCase() === (sub.code || '').toLowerCase() || m.subjectCode.toLowerCase() === sub.name.toLowerCase())) ||
                              (m.subjectName && (m.subjectName.toLowerCase() === sub.name.toLowerCase() || m.subjectName.toLowerCase() === (sub.code || '').toLowerCase()))
                            );
                            if (subRow) {
                              const isAbsent = (subRow.attendanceStatus || '').toLowerCase() === 'absent';
                              const currentVal = updated[student.id]?.[sub.name]?.marks;
                              if (!currentVal || currentVal === '' || currentVal === '0') {
                                updated[student.id][sub.name] = {
                                  marks: isAbsent ? '' : (subRow.marksObtained !== undefined && subRow.marksObtained !== null ? String(subRow.marksObtained) : ''),
                                  attendance: isAbsent ? 'Absent' : (subRow.attendanceStatus || 'Present'),
                                  remarks: subRow.evaluatorRemarks || ''
                                };
                              }
                            }
                          });
                        });
                        return updated;
                      });
                    }
                  })
                  .catch(() => {});
                addToast('info', 'Edit Mode Enabled', 'Marks fields are unlocked for editing. Past marks are loaded. You can modify marks and click Re-Publish to commit changes.');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" /> Unlock & Edit Marks
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('report-cards')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" /> View Report Cards
            </button>
          </div>
        </div>
      )}

      {/* Editing Published Marks Active Notice Banner */}
      {isAlreadyPublished && isEditingPublished && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <Unlock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-950 dark:text-amber-100 uppercase tracking-wide">
                Editing Mode Active: Published Marks Unlocked
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                You can modify marks, attendance, and remarks. Once you finish editing, click <strong>"Re-Publish Marks"</strong> to update student & parent report cards.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingPublished(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" /> Lock Editing
            </button>
            {(isCurrentClassTeacher || isAdmin) && (
              <button
                type="button"
                onClick={() => setShowPublishModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 text-xs font-black shadow-xs cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" /> Re-Publish Marks
              </button>
            )}
          </div>
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
              onChange={e => {
                const newId = e.target.value;
                setSelectedExamId(newId);
                const nextExam = allExams.find(ex => String(ex.id) === String(newId));
                const nextApp = getExamApplicableClasses(nextExam);
                if (nextApp.length > 0) {
                  if (myClassTeacherAssignment?.className && nextApp.some(c => c.toLowerCase() === myClassTeacherAssignment.className.toLowerCase())) {
                    const match = nextApp.find(c => c.toLowerCase() === myClassTeacherAssignment.className.toLowerCase());
                    setSelectedClass(match || nextApp[0]);
                  } else {
                    setSelectedClass(nextApp[0]);
                  }
                }
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {teacherApplicableExams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name || e.examName}
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
            {(isCurrentClassTeacher ? classSubjects : classSubjects.filter(s => canEditSubject(s.name))).map(sub => (
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

      {/* Main Marks Entry Table or Empty State */}
      {classSubjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5">
            No Examination Subjects Configured for {selectedClass}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {!isClassApplicableToExam 
              ? `"${currentExam?.name || currentExam?.examName || 'This examination'}" is not scheduled for ${selectedClass}. Please select an applicable class or change the examination.`
              : `"${currentExam?.name || currentExam?.examName || 'This examination'}" does not have any active subjects configured for ${selectedClass}. Configure examination subjects in Exam Setup to begin marks entry.`
            }
          </p>
        </div>
      ) : (
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
                  {classSubjects.map(sub => {
                    const isEditable = canEditSubject(sub.name);
                    return (
                      <th key={sub.id} className="px-3 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center min-w-[120px]">
                        <div className="flex items-center justify-center gap-1">
                          <span>{sub.name}</span>
                          {!isEditable && <Lock className="w-3 h-3 text-slate-400 inline" title="Subject Teacher Only" />}
                        </div>
                        <div className="text-[9px] font-normal text-slate-400">Max: {sub.maxMarks} • Pass: {sub.passMarks}</div>
                        {!isEditable && (
                          <span className="text-[8px] font-bold text-slate-400 block tracking-normal">
                            (Subject Teacher)
                          </span>
                        )}
                      </th>
                    );
                  })}
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
                  paginatedStudents.map((student, sIdx) => {
                    const globalIdx = pageSize === 0 ? sIdx : (safeCurrentPage - 1) * pageSize + sIdx;
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
                          {student.rollNo || globalIdx + 1}
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
                          const isEditable = canEditSubject(sub.name);

                          return (
                            <td key={sub.id} className="px-2 py-2.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max={sub.maxMarks}
                                    disabled={isAbsent || !isEditable}
                                    value={isAbsent ? '' : entry.marks}
                                    placeholder={isAbsent ? 'Ab' : (isEditable ? '0' : '—')}
                                    onChange={e => handleMarkChange(student.id, sub.name, e.target.value)}
                                    title={!isEditable ? `Only assigned ${sub.name} teacher or class teacher can edit` : undefined}
                                    className={`w-16 h-8 text-center text-xs font-black rounded-xl border focus:outline-none transition ${
                                      !isEditable
                                        ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800 cursor-not-allowed opacity-90'
                                        : isAbsent
                                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 cursor-not-allowed'
                                        : isExceeded
                                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    disabled={!isEditable}
                                    title={!isEditable ? 'Assigned teacher only' : (isAbsent ? 'Mark Present' : 'Mark Absent')}
                                    onClick={() => handleAttendanceChange(student.id, sub.name, isAbsent ? 'Present' : 'Absent')}
                                    className={`h-8 px-1.5 rounded-lg text-[10px] font-bold border transition ${
                                      !isEditable
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-900 dark:border-slate-800 cursor-not-allowed opacity-60'
                                        : isAbsent
                                        ? 'bg-rose-600 text-white border-rose-600 cursor-pointer'
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-pointer'
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
                  paginatedStudents.map((student, sIdx) => {
                    const globalIdx = pageSize === 0 ? sIdx : (safeCurrentPage - 1) * pageSize + sIdx;
                    const subObj = classSubjects.find(s => s.name === activeSingleSubject) || classSubjects[0];
                    const entry = matrixMarks[student.id]?.[activeSingleSubject] || { marks: '', attendance: 'Present', remarks: '' };
                    const isAbsent = entry.attendance === 'Absent';
                    const val = Number(entry.marks);
                    const isExceeded = !isAbsent && entry.marks !== '' && (val > subObj.maxMarks || val < 0);
                    const percent = (val / subObj.maxMarks) * 100;
                    const grade = isAbsent ? 'Ab' : (entry.marks !== '' ? calculateGrade(percent, activeGradeRules) : '—');
                    const isEditable = canEditSubject(activeSingleSubject);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-center text-xs font-black text-slate-800 dark:text-white">
                          {student.rollNo || globalIdx + 1}
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
                            disabled={!isEditable}
                            onChange={e => handleAttendanceChange(student.id, activeSingleSubject, e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none disabled:opacity-60"
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
                            disabled={isAbsent || !isEditable}
                            value={isAbsent ? '' : entry.marks}
                            placeholder={isAbsent ? 'Absent' : (isEditable ? '0' : '—')}
                            onChange={e => handleMarkChange(student.id, activeSingleSubject, e.target.value)}
                            className={`w-24 h-9 text-center text-xs font-black rounded-xl border focus:outline-none transition mx-auto ${
                              !isEditable
                                ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800 cursor-not-allowed opacity-90'
                                : isAbsent
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
                            disabled={!isEditable}
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
                            placeholder={isEditable ? "Optional remarks (e.g. Great progress)..." : "—"}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:border-sky-500 disabled:bg-slate-50 disabled:text-slate-400"
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

        {/* Dynamic Pagination Controls Bar */}
        {filteredStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>
                Showing{' '}
                <strong className="text-slate-900 dark:text-white font-black">
                  {totalStudentsCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 dark:text-white font-black">
                  {pageSize === 0 ? totalStudentsCount : Math.min(safeCurrentPage * pageSize, totalStudentsCount)}
                </strong>{' '}
                of <strong className="text-slate-900 dark:text-white font-black">{totalStudentsCount}</strong> students
              </span>

              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-400 font-bold">Rows:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={0}>All</option>
                </select>
              </div>
            </div>

            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  title="Previous Page"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                  .reduce<(number | string)[]>((acc, page, idx, arr) => {
                    if (idx > 0 && (page - (arr[idx - 1] as number)) > 1) {
                      acc.push('...');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    typeof item === 'string' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs font-bold">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                          safeCurrentPage === item
                            ? 'bg-sky-600 text-white font-black shadow-xs'
                            : 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  title="Next Page"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )}

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
