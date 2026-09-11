// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  Check, X, AlertCircle, Save, FileSpreadsheet,
  Search, Filter, ChevronDown, Clock, CalendarCheck, User, Plus, Edit2, FileText, Loader2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { exportToExcel } from '../../../utils/excelExport';
import { formatToDDMMYYYY, formatToISO, checkSundayOrHoliday } from '../../../utils/dateValidation';
import { Pagination } from '../../common/Pagination';
import { SchoolPrintHeader } from '../../common/SchoolPrintHeader';
import { matchesClassName, compareClassesAscending, formatDisplayClassName } from '../../../utils/classSorter';

// Types
type AttendanceStatus = 'Present' | 'Absent' | 'HalfDay' | 'Late' | null;

interface Student {
  id: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  className: string;
  section: string;
  admissionNo: string;
}

interface AttendanceState {
  [studentId: string]: AttendanceStatus;
}

interface RemarksState {
  [key: string]: string;
}

const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const monthVal = String(d.getMonth() + 1).padStart(2, '0');
  const dayVal = String(d.getDate()).padStart(2, '0');
  return `${year}-${monthVal}-${dayVal}`;
};

const normalizeClass = (c: string) => (c || '').replace(/^class\s*/i, '').trim().toLowerCase();
const normalizeSec = (s: string) => (s || '').replace(/^section\s*/i, '').trim().toUpperCase();

const getRegisterKey = (cls: string, sec: string, d: string) => {
  const cleanCls = normalizeClass(cls);
  const cleanSec = normalizeSec(sec);
  return `${cleanCls}_${cleanSec}_${d}`;
};

export const AttendanceView = () => {
  const { user } = useAuth();
  const { staff = [], students: allStudents = [], academicClasses = [], studentAttendance = [], holidays = [], saveStudentAttendance, teacherAssignments = [], timetable = [], fetchStudents } = useData();

  const isTeacher = (user?.role as any) === 'Teacher' || (user?.role as any) === 'Class Teacher';

  // Real students mapped from DataContext
  const realStudents: Student[] = useMemo(() => {
    return (allStudents || []).map((s: any) => {
      const nameParts = (s.name || '').trim().split(' ');
      const firstName = s.firstName || nameParts[0] || 'Student';
      const lastName = s.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
      const studentClass = s.className ? formatDisplayClassName(s.className) : '';
      return {
        id: String(s.id),
        rollNo: s.rollNo || s.admissionNo || s.admissionNumber || String(s.id),
        firstName,
        lastName,
        className: studentClass || s.className || '',
        section: s.section || 'A',
        admissionNo: s.admissionNo || s.admissionNumber || s.rollNo || `ADM-${s.id}`,
        avatar: s.avatar || s.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`)}&background=random`
      };
    });
  }, [allStudents]);

  // Find logged in teacher record from DataContext staff
  const dbTeacher = useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    let matchedStaff: any = null;

    if (userEmail) {
      matchedStaff = staff.find(s => {
        if (!s.email) return false;
        const sEmail = s.email.toLowerCase().trim();
        return sEmail === userEmail || 
          (userEmail.includes('teacher') && (sEmail.includes('teacher') || s.empId === 'STF-2026-0000' || s.id === 'STF-2026-0000'));
      });
    }
    if (!matchedStaff && userName) {
      matchedStaff = staff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        return sFullName.includes(userName) || userName.includes(sFullName);
      });
    }

    const rawName = user?.name || 'Robert Teacher';
    const nameParts = rawName.split(' ');
    const fallback = matchedStaff || {
      id: user?.id || 'STF-2026-0000',
      empId: (user as any)?.empId || 'STF-2026-0000',
      firstName: nameParts[0] || 'Robert',
      lastName: nameParts.slice(1).join(' ') || 'Teacher',
      assignedClasses: ['Class 4-A'],
      assignedSubjects: ['English', 'Chemistry']
    };

    return {
      ...fallback,
      firstName: fallback.firstName || 'Robert',
      lastName: fallback.lastName || 'Teacher',
      assignedClasses: fallback.assignedClasses || ['Class 4-A'],
      assignedSubjects: fallback.assignedSubjects || ['English', 'Chemistry']
    };
  }, [user, staff]);

  // Extract assigned classes & sections for teacher merging Admin assignments & timetable
  const teacherClasses = useMemo(() => {
    const tName = `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.toLowerCase().trim();

    const fromAssignments = (teacherAssignments || [])
      .filter((ta: any) => {
        const nameMatch = ta.teacherName && (ta.teacherName.toLowerCase().includes(tName) || tName.includes(ta.teacherName.toLowerCase()));
        const idMatch = ta.teacherId && (String(ta.teacherId) === String(dbTeacher.id) || String(ta.teacherId) === String((dbTeacher as any).empId));
        return nameMatch || idMatch;
      })
      .map((ta: any) => {
        const cls = (ta.className || '').trim();
        const sec = (ta.section || '').trim();
        return sec ? `${cls}-${sec}` : cls;
      });

    const fromTimetable = (timetable || [])
      .filter((t: any) => t.teacherName && (t.teacherName.toLowerCase().includes(tName) || tName.includes(t.teacherName.toLowerCase())))
      .map((t: any) => {
        const cls = (t.className || '').trim();
        const sec = (t.section || '').trim();
        return sec ? `${cls}-${sec}` : cls;
      });

    let raw = (dbTeacher as any)?.assignedClasses || (dbTeacher as any)?.classes || [];
    if (!Array.isArray(raw)) raw = [raw];

    const merged = Array.from(new Set([...raw, ...fromAssignments, ...fromTimetable])).filter(Boolean);

    const result = merged.map((c: any) => {
      const str = typeof c === 'string' ? c : (c.className ? `${c.className}-${c.section || 'A'}` : '');
      const parts = str.split('-');
      let className = formatDisplayClassName(parts[0].trim());
      const section = parts[1] ? parts[1].trim() : 'A';
      return { className, section };
    }).filter((c: any) => Boolean(c.className) && !c.className.toLowerCase().includes('nursery') && !c.className.toLowerCase().includes('lkg') && !c.className.toLowerCase().includes('ukg'));

    return result.length > 0 ? result : [
      { className: 'Class 10', section: 'A' },
      { className: 'Class 9', section: 'B' },
      { className: 'Class 8', section: 'A' }
    ];
  }, [dbTeacher, teacherAssignments, timetable]);

  const teacherFullName = `${dbTeacher.firstName || 'Suteja'} ${dbTeacher.lastName || 'K'}`.trim();

  // Dynamic list of class names from Academic Management & Students
  const classOptions = useMemo(() => {
    if (isTeacher && teacherClasses.length > 0) {
      const teacherCls = Array.from(new Set(teacherClasses.map(c => formatDisplayClassName(c.className))));
      return ['Select Class', ...teacherCls.sort(compareClassesAscending)];
    }
    const fromAcademic = (academicClasses || []).map(ac => ac.name ? formatDisplayClassName(ac.name) : null).filter(Boolean) as string[];
    const fromStudents = (allStudents || []).map(s => s.className ? formatDisplayClassName(s.className) : null).filter(Boolean) as string[];
    const merged = Array.from(new Set([...fromAcademic, ...fromStudents])).filter(Boolean);

    merged.sort(compareClassesAscending);

    return ['Select Class', ...merged];
  }, [isTeacher, teacherClasses, academicClasses, allStudents]);

  // Global View State
  const todayStr = React.useMemo(() => getLocalDateString(new Date()), []);
  const currentMonthStr = React.useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const [dateMode, setDateMode] = useState<'Select' | 'Daily' | 'Monthly' | 'Custom Range'>('Select');
  const [date, setDate] = useState<string>('');
  const [month, setMonth] = useState<string>(getLocalDateString(new Date()).slice(0, 7));
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => getLocalDateString(new Date()));

  // Context Selection State
  const [selectedClass, setSelectedClass] = useState<string>('Select Class');
  const [selectedSection, setSelectedSection] = useState<string>('Select Section');

  // Dynamic list of section options for selected class
  const sectionOptions = useMemo(() => {
    if (isTeacher && teacherClasses.length > 0) {
      if (selectedClass === 'Select Class' || selectedClass === 'All Classes') {
        return ['Select Section'];
      }
      const matched = teacherClasses.filter(c => matchesClassName(c.className, selectedClass));
      const secs = matched.length > 0 ? Array.from(new Set(matched.map(c => c.section))) : ['A'];
      return ['Select Section', ...secs];
    }
    if (selectedClass === 'Select Class' || selectedClass === 'All Classes') {
      return ['Select Section'];
    }
    const fromAcademic = (academicClasses || [])
      .find(ac => matchesClassName(ac.name, selectedClass));
    const academicSections = (fromAcademic?.sections || []).map((s: any) => typeof s === 'string' ? s : s.name || s.sectionName || 'A');
    const fromStudents = (allStudents || [])
      .filter(s => matchesClassName(s.className, selectedClass))
      .map(s => s.section)
      .filter(Boolean);
    const merged = Array.from(new Set([...academicSections, ...fromStudents])).filter(Boolean);
    const validSections = merged.length > 0 ? merged.sort() : ['A'];
    return ['Select Section', ...validSections];
  }, [isTeacher, teacherClasses, selectedClass, academicClasses, allStudents]);

  // Dynamic list of subject options
  const subjectOptions = useMemo(() => {
    const teacherSubjs = (dbTeacher as any)?.assignedSubjects || [];
    const fromTimetable = (timetable || []).map((t: any) => t.subject || t.subjectName).filter(Boolean);
    const standardSubjs = ['Mathematics', 'Science', 'English', 'Social Studies', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Hindi', 'Physical Education'];
    const merged = Array.from(new Set([...teacherSubjs, ...fromTimetable, ...standardSubjs])).filter(Boolean);
    return ['Select Subject', ...merged];
  }, [dbTeacher, timetable]);

  // Dynamic list of period options
  const periodOptions = useMemo(() => {
    const fromTimetable = (timetable || []).map((t: any) => t.timeSlot ? `${t.period || `Period ${t.periodNumber || 1}`} (${t.timeSlot})` : (t.period || t.periodName)).filter(Boolean);
    const standardPeriods = [
      'Period 1 (08:30 AM - 09:15 AM)',
      'Period 2 (09:15 AM - 10:00 AM)',
      'Period 3 (10:15 AM - 11:00 AM)',
      'Period 4 (11:00 AM - 11:45 AM)',
      'Period 5 (11:45 AM - 12:30 PM)',
      'Period 6 (01:15 PM - 02:00 PM)',
      'Period 7 (02:00 PM - 02:45 PM)',
      'Period 8 (02:45 PM - 03:30 PM)'
    ];

    const rawList = [...fromTimetable, ...standardPeriods];
    const seenPeriodNames = new Set<string>();
    const result: string[] = [];

    for (const item of rawList) {
      if (!item) continue;
      const match = item.match(/^(Period\s*\d+|Period\s*\w+|[^\(]+)/i);
      const periodKey = match ? match[1].trim().toLowerCase() : item.trim().toLowerCase();

      if (!seenPeriodNames.has(periodKey)) {
        seenPeriodNames.add(periodKey);
        result.push(item);
      }
    }
    return result;
  }, [timetable]);

  // Auto-sync section when class changes
  useEffect(() => {
    if (sectionOptions.length > 0 && !sectionOptions.includes(selectedSection)) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [sectionOptions, selectedSection]);

  useEffect(() => {
    if (isTeacher && teacherClasses.length > 0) {
      const match = teacherClasses.find(c => matchesClassName(c.className, selectedClass));
      if (match && selectedSection === 'All Sections') {
        setSelectedSection(match.section);
      }
    }
  }, [isTeacher, teacherClasses, selectedClass]);

  const [selectedSubject, setSelectedSubject] = useState<string>('Select Subject');
  const [selectedPeriod, setSelectedPeriod] = useState('Period 1 (09:00 AM - 09:45 AM)');

  const [filterStatus, setFilterStatus] = useState<'All' | AttendanceStatus>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isSearching, setIsSearching] = useState(false);

  const isAggregatedView = selectedClass === 'All Classes' || selectedSection === 'All Sections' || selectedClass === 'Select Class' || selectedSection === 'Select Section';
  
  const displayClassSummary = useMemo(() => {
    const isClassSelected = selectedClass && selectedClass !== 'Select Class';
    const isSecSelected = selectedSection && selectedSection !== 'Select Section';

    if (selectedClass === 'All Classes') return 'All Classes';
    if (isClassSelected && isSecSelected) return `${selectedClass} - Section ${selectedSection}`;
    if (isClassSelected) return selectedClass;
    return 'Not Selected';
  }, [selectedClass, selectedSection]);

  const isFilterSelected = Boolean(
    dateMode !== 'Select' &&
    ((dateMode === 'Daily' && date !== '') || (dateMode === 'Monthly' && month !== '') || (dateMode === 'Custom Range' && startDate !== '' && endDate !== '')) &&
    selectedClass &&
    selectedClass !== 'Select Class' &&
    selectedClass !== 'All Classes' &&
    selectedSection &&
    selectedSection !== 'Select Section' &&
    selectedSection !== 'All Sections'
  );

  // Enable editing by default when a specific Class & Section is selected for both Admin & Teacher
  const [isEditable, setIsEditable] = useState<boolean>(() => !isAggregatedView);
  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState(false);
 
  useEffect(() => {
    if (fetchStudents && (!allStudents || allStudents.length === 0)) {
      fetchStudents();
    }
  }, [fetchStudents, allStudents]);

  useEffect(() => {
    if (isAggregatedView) {
      setIsEditable(false);
    } else {
      setIsEditable(true);
    }
  }, [selectedClass, selectedSection]);
 
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSection, filterStatus, dateMode, date, month, startDate, endDate]);
 
  const [remarkModalStudent, setRemarkModalStudent] = useState<Student | null>(null);
  const [tempRemark, setTempRemark] = useState('');
 
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
 
  // Persistent LocalStorage Remarks registry
  const [remarksState, setRemarksState] = useState<RemarksState>(() => {
    const saved = localStorage.getItem('sms_attendance_remarks');
    return saved ? JSON.parse(saved) : {};
  });
 
  // Persistent LocalStorage Attendance registry
  const [attendanceRegistry, setAttendanceRegistry] = useState<Record<string, AttendanceState>>(() => {
    const saved = localStorage.getItem('sms_attendance_registry');
    return saved ? JSON.parse(saved) : {};
  });
 
  // Cross-tab / cross-role storage sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sms_attendance_registry' && e.newValue) {
        try {
          setAttendanceRegistry(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'sms_attendance_remarks' && e.newValue) {
        try {
          setRemarksState(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const classStudents = React.useMemo(() => {
    const targetSec = normalizeSec(selectedSection);
    return realStudents.filter(s => {
      const classMatch = selectedClass === 'All Classes' || matchesClassName(s.className, selectedClass);
      const studentSec = normalizeSec(s.section);
      const sectionMatch = 
        selectedSection === 'All Sections' || 
        selectedSection === 'Select Section' || 
        !targetSec ||
        studentSec === targetSec ||
        (!s.section && targetSec === 'A');
      return classMatch && sectionMatch;
    });
  }, [realStudents, selectedClass, selectedSection]);

  // Unique key for the current register
  const registerKey = getRegisterKey(selectedClass === 'All Classes' ? 'All' : selectedClass, selectedSection === 'All Sections' ? 'All' : selectedSection, date);
  const legacyRegisterKey = `${selectedClass === 'All Classes' ? 'All' : selectedClass}_${selectedSection === 'All Sections' ? 'All' : selectedSection}_${selectedSubject}_${date}`;

  const currentAttendance: AttendanceState = attendanceRegistry[registerKey] || attendanceRegistry[legacyRegisterKey] || {};

  // Key builder helper for period & subject attendance
  const buildAttendanceKeys = (cls: string, sec: string, subj: string, prd: string, d: string) => {
    const cleanCls = normalizeClass(cls);
    const cleanSec = normalizeSec(sec);
    const cleanSubj = (subj || '').trim().toLowerCase();
    const cleanPrd = (prd || '').trim().toLowerCase();

    return {
      periodKey: `${cls}_${sec}_${subj}_${prd}_${d}`,
      normPeriodKey: `${cleanCls}_${cleanSec}_${cleanSubj}_${cleanPrd}_${d}`,
      subjectKey: `${cleanCls}_${cleanSec}_${cleanSubj}_${d}`,
      rawSubjectKey: `${cls}_${sec}_${subj}_${d}`,
      generalKey: getRegisterKey(cls, sec, d)
    };
  };

  // Unified status computation for UI rendering (Daily & Matrix View)
  const getAttendanceStatusForDate = (student: Student, targetDate: string): AttendanceStatus => {
    if (!student || !targetDate) return null;

    const sId = String(student.id);
    const sRoll = String(student.rollNo || '');
    const sName = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();

    const cleanCls = normalizeClass(student.className);
    const cleanSec = normalizeSec(student.section);
    const cleanSubj = (selectedSubject || '').trim().toLowerCase();
    const cleanPrd = (selectedPeriod || '').trim().toLowerCase();

    const keys = buildAttendanceKeys(student.className, student.section, selectedSubject, selectedPeriod, targetDate);

    // 1. Check exact period key with current selectedSubject and selectedPeriod
    if (attendanceRegistry[keys.periodKey]?.[sId] !== undefined) {
      return attendanceRegistry[keys.periodKey][sId];
    }
    if (attendanceRegistry[keys.normPeriodKey]?.[sId] !== undefined) {
      return attendanceRegistry[keys.normPeriodKey][sId];
    }

    // 2. Check subject-specific key for current selectedSubject
    if (attendanceRegistry[keys.subjectKey]?.[sId] !== undefined) {
      return attendanceRegistry[keys.subjectKey][sId];
    }
    if (attendanceRegistry[keys.rawSubjectKey]?.[sId] !== undefined) {
      return attendanceRegistry[keys.rawSubjectKey][sId];
    }

    // 3. Check DataContext studentAttendance array for matching subject and/or period
    if (Array.isArray(studentAttendance) && studentAttendance.length > 0) {
      const match = studentAttendance.find(
        (record: any) =>
          String(record.date || '').split('T')[0] === targetDate &&
          (
            String(record.studentId) === sId ||
            (sRoll && (String(record.rollNo) === sRoll || String(record.studentId) === sRoll)) ||
            (sName && String(record.studentName || '').trim().toLowerCase() === sName)
          ) &&
          (
            !record.subject ||
            String(record.subject).trim().toLowerCase() === cleanSubj ||
            cleanSubj === 'all' || cleanSubj === 'all subjects'
          )
      );
      if (match?.status) {
        return match.status as AttendanceStatus;
      }

      // Check DataContext studentAttendance for ANY record for this student on targetDate
      const anyMatch = studentAttendance.find(
        (record: any) =>
          String(record.date || '').split('T')[0] === targetDate &&
          (
            String(record.studentId) === sId ||
            (sRoll && (String(record.rollNo) === sRoll || String(record.studentId) === sRoll)) ||
            (sName && String(record.studentName || '').trim().toLowerCase() === sName)
          )
      );
      if (anyMatch?.status) {
        return anyMatch.status as AttendanceStatus;
      }
    }

    // 4. Fallback to general daily register key
    if (attendanceRegistry[keys.generalKey]?.[sId] !== undefined) {
      return attendanceRegistry[keys.generalKey][sId];
    }
    const rawGeneralKey = `${student.className}_${student.section}_${targetDate}`;
    if (attendanceRegistry[rawGeneralKey]?.[sId] !== undefined) {
      return attendanceRegistry[rawGeneralKey][sId];
    }

    // 5. Scan attendanceRegistry for ANY key for this date & class that contains student ID
    for (const regKey of Object.keys(attendanceRegistry)) {
      if (regKey.endsWith(`_${targetDate}`) && (regKey.toLowerCase().includes(cleanCls) || regKey.includes(student.className))) {
        if (attendanceRegistry[regKey]?.[sId] !== undefined) {
          return attendanceRegistry[regKey][sId];
        }
      }
    }

    // 6. Direct LocalStorage fallback scan
    try {
      const rawReg = localStorage.getItem('sms_attendance_registry');
      if (rawReg) {
        const parsed = JSON.parse(rawReg);
        for (const regKey of Object.keys(parsed)) {
          if (regKey.endsWith(`_${targetDate}`) && (regKey.toLowerCase().includes(cleanCls) || regKey.includes(student.className))) {
            if (parsed[regKey]?.[sId] !== undefined) {
              return parsed[regKey][sId];
            }
          }
        }
      }
    } catch {}

    // 7. Sunday / Declared Holiday fallback
    const holCheck = checkSundayOrHoliday(targetDate, holidays);
    if (holCheck.isHoliday) {
      return 'Holiday' as AttendanceStatus;
    }

    return null;
  };

  const getAttendanceStatus = (student: Student): AttendanceStatus => {
    return getAttendanceStatusForDate(student, date);
  };

  // Generate date array for Matrix View
  const matrixDates = React.useMemo(() => {
    if (dateMode === 'Daily') return [];
   
    let start = new Date();
    let end = new Date();
   
    if (dateMode === 'Monthly') {
      const [year, m] = month.split('-');
      start = new Date(parseInt(year), parseInt(m) - 1, 1);
      end = new Date(parseInt(year), parseInt(m), 0);
    } else {
      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        start = new Date(y, m - 1, d);
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        end = new Date(y, m - 1, d);
      }
    }
   
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
   
    const dates: string[] = [];
    let current = new Date(start);
    while (current <= end && dates.length < 31) { // Cap at 31 days
      dates.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [dateMode, month, startDate, endDate]);

  const getMatrixStatus = (student: Student, dateStr: string): AttendanceStatus => {
    return getAttendanceStatusForDate(student, dateStr);
  };
 
  const filteredStudents = React.useMemo(() => {
    let result = classStudents;
    if (filterStatus !== 'All') {
      result = result.filter(st => getAttendanceStatus(st) === filterStatus);
    }
    return [...result].sort((a, b) => {
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.firstName.localeCompare(b.firstName);
    });
  }, [classStudents, currentAttendance, filterStatus]);
 
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);
 
  // Single mark handler
  const handleSingleMark = (studentId: string, status: AttendanceStatus) => {
    if (!isEditable) return;
    const targetStudent = classStudents.find(s => String(s.id) === String(studentId));
    const targetClass = targetStudent ? targetStudent.className : selectedClass;
    const targetSec = targetStudent ? targetStudent.section : selectedSection;

    const cleanCls = normalizeClass(targetClass);
    const cleanSec = normalizeSec(targetSec);
    const cleanSubj = (selectedSubject || '').trim().toLowerCase();
    const cleanPrd = (selectedPeriod || '').trim().toLowerCase();

    const periodKey = `${targetClass}_${targetSec}_${selectedSubject}_${selectedPeriod}_${date}`;
    const normPeriodKey = `${cleanCls}_${cleanSec}_${cleanSubj}_${cleanPrd}_${date}`;
    const specKey = `${targetClass}_${targetSec}_${selectedSubject}_${date}`;
    const normSpecKey = `${cleanCls}_${cleanSec}_${cleanSubj}_${date}`;
    const normKey = getRegisterKey(targetClass, targetSec, date);
    const rawNormKey = `${targetClass}_${targetSec}_${date}`;
    const legacyKey = `${selectedClass === 'All Classes' ? 'All' : selectedClass}_${selectedSection === 'All Sections' ? 'All' : selectedSection}_${selectedSubject}_${date}`;

    let newStatus: AttendanceStatus = status;
    setAttendanceRegistry(prev => {
      const keysToUpdate = [periodKey, normPeriodKey, specKey, normSpecKey, normKey, rawNormKey, legacyKey];
      const isAlreadySame = prev[periodKey]?.[studentId] === status || prev[normKey]?.[studentId] === status;

      const updated = { ...prev };
      if (isAlreadySame) {
        newStatus = null;
        for (const k of keysToUpdate) {
          if (updated[k]) {
            const copy = { ...updated[k] };
            delete copy[studentId];
            updated[k] = copy;
          }
        }
      } else {
        for (const k of keysToUpdate) {
          updated[k] = { ...(updated[k] || {}), [studentId]: status };
        }
      }
      localStorage.setItem('sms_attendance_registry', JSON.stringify(updated));
      try {
        window.dispatchEvent(new Event('storage'));
      } catch {}
      return updated;
    });

    if (targetStudent && saveStudentAttendance && newStatus) {
      saveStudentAttendance({
        studentId: targetStudent.id,
        studentName: `${targetStudent.firstName} ${targetStudent.lastName}`,
        className: targetStudent.className,
        section: targetStudent.section,
        date: date,
        subject: selectedSubject,
        period: selectedPeriod,
        status: newStatus,
        remarks: remarksState[`${date}_${targetStudent.id}`] || '',
        markedBy: isTeacher ? teacherFullName : (user?.name || 'Administrator')
      });
    }
  };

  // Matrix cell click toggle handler
  const handleMatrixCellClick = (student: Student, dateStr: string) => {
    if (!isEditable) return;
    const currentStatus = getMatrixStatus(student, dateStr);
   
    let nextStatus: AttendanceStatus = null;
    if (currentStatus === null) nextStatus = 'Present';
    else if (currentStatus === 'Present') nextStatus = 'HalfDay';
    else if (currentStatus === 'HalfDay') nextStatus = 'Late';
    else if (currentStatus === 'Late') nextStatus = 'Absent';
    else if (currentStatus === 'Absent') nextStatus = null;
   
    const cleanCls = normalizeClass(student.className);
    const cleanSec = normalizeSec(student.section);
    const cleanSubj = (selectedSubject || '').trim().toLowerCase();
    const cleanPrd = (selectedPeriod || '').trim().toLowerCase();

    const periodKey = `${student.className}_${student.section}_${selectedSubject}_${selectedPeriod}_${dateStr}`;
    const normPeriodKey = `${cleanCls}_${cleanSec}_${cleanSubj}_${cleanPrd}_${dateStr}`;
    const specKey = `${student.className}_${student.section}_${selectedSubject}_${dateStr}`;
    const normSpecKey = `${cleanCls}_${cleanSec}_${cleanSubj}_${dateStr}`;
    const normKey = getRegisterKey(student.className, student.section, dateStr);
    const rawNormKey = `${student.className}_${student.section}_${dateStr}`;

    setAttendanceRegistry(prev => {
      const keysToUpdate = [periodKey, normPeriodKey, specKey, normSpecKey, normKey, rawNormKey];
      const updated = { ...prev };

      if (nextStatus === null) {
        for (const k of keysToUpdate) {
          if (updated[k]) {
            const copy = { ...updated[k] };
            delete copy[student.id];
            updated[k] = copy;
          }
        }
      } else {
        for (const k of keysToUpdate) {
          updated[k] = { ...(updated[k] || {}), [student.id]: nextStatus };
        }
      }
      localStorage.setItem('sms_attendance_registry', JSON.stringify(updated));
      try {
        window.dispatchEvent(new Event('storage'));
      } catch {}
      return updated;
    });

    if (saveStudentAttendance && nextStatus) {
      saveStudentAttendance({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        className: student.className,
        section: student.section,
        date: dateStr,
        subject: selectedSubject,
        period: selectedPeriod,
        status: nextStatus,
        remarks: remarksState[`${dateStr}_${student.id}`] || '',
        markedBy: isTeacher ? teacherFullName : (user?.name || 'Administrator')
      });
    }
  };

  // Mark entire class
  const markAllClass = (status: AttendanceStatus) => {
    if (!isEditable) return;
    setAttendanceRegistry(prev => {
      const updated = { ...prev };
      classStudents.forEach(st => {
        const cleanCls = normalizeClass(st.className);
        const cleanSec = normalizeSec(st.section);
        const cleanSubj = (selectedSubject || '').trim().toLowerCase();
        const cleanPrd = (selectedPeriod || '').trim().toLowerCase();

        const periodKey = `${st.className}_${st.section}_${selectedSubject}_${selectedPeriod}_${date}`;
        const normPeriodKey = `${cleanCls}_${cleanSec}_${cleanSubj}_${cleanPrd}_${date}`;
        const specKey = `${st.className}_${st.section}_${selectedSubject}_${date}`;
        const normSpecKey = `${cleanCls}_${cleanSec}_${cleanSubj}_${date}`;
        const normKey = getRegisterKey(st.className, st.section, date);
        const rawNormKey = `${st.className}_${st.section}_${date}`;
        const legacyKey = `${selectedClass === 'All Classes' ? 'All' : selectedClass}_${selectedSection === 'All Sections' ? 'All' : selectedSection}_${selectedSubject}_${date}`;

        const keysToUpdate = [periodKey, normPeriodKey, specKey, normSpecKey, normKey, rawNormKey, legacyKey];
        for (const k of keysToUpdate) {
          updated[k] = { ...(updated[k] || {}), [st.id]: status };
        }

        if (saveStudentAttendance) {
          saveStudentAttendance({
            studentId: st.id,
            studentName: `${st.firstName} ${st.lastName}`,
            className: st.className,
            section: st.section,
            date: date,
            subject: selectedSubject,
            period: selectedPeriod,
            status: status,
            remarks: remarksState[`${date}_${st.id}`] || '',
            markedBy: isTeacher ? teacherFullName : (user?.name || 'Administrator')
          });
        }
      });
      localStorage.setItem('sms_attendance_registry', JSON.stringify(updated));
      try {
        window.dispatchEvent(new Event('storage'));
      } catch {}
      return updated;
    });
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    if (!isEditable) return;
    setRemarksState(prev => ({
      ...prev,
      [`${date}_${studentId}`]: remark
    }));
  };

  // Auto-save mechanisms
  useEffect(() => {
    localStorage.setItem('sms_attendance_registry', JSON.stringify(attendanceRegistry));
  }, [attendanceRegistry]);

  useEffect(() => {
    localStorage.setItem('sms_attendance_remarks', JSON.stringify(remarksState));
  }, [remarksState]);

  // Metrics calculation
  const summaryMetrics = React.useMemo(() => {
    let present = 0, absent = 0, halfDay = 0, late = 0;
    filteredStudents.forEach(s => {
      const status = getAttendanceStatus(s);
      if (status === 'Present') present++;
      if (status === 'Absent') absent++;
      if (status === 'HalfDay') halfDay++;
      if (status === 'Late') late++;
    });
    const markedCount = present + absent + halfDay + late;
    const percentage = filteredStudents.length ? Math.round(((present + late + (halfDay * 0.5)) / filteredStudents.length) * 100) : 0;
   
    return {
      total: filteredStudents.length,
      marked: markedCount,
      present, absent, halfDay, late,
      percentage
    };
  }, [filteredStudents, currentAttendance, attendanceRegistry, date, selectedSubject]);


  const [toasts, setToasts] = useState<Array<{id: number, type: 'success' | 'warning' | 'info', title: string, message: string}>>([]);
  const addToast = (type: 'success' | 'warning' | 'info', title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleSearchData = async () => {
    setIsSearching(true);
    try {
      if (fetchStudents && (!allStudents || allStudents.length === 0)) {
        await fetchStudents();
      }
      const periodLabel = selectedPeriod && selectedPeriod !== 'Select Period' ? (selectedPeriod.includes('(') ? selectedPeriod.split('(')[0].trim() : selectedPeriod) : 'All Periods';
      addToast(
        'success',
        'Attendance Records Loaded',
        `Displaying ${classStudents.length} student${classStudents.length === 1 ? '' : 's'} for ${selectedClass} ${selectedSection !== 'All Sections' ? `(Section ${selectedSection})` : ''} • ${selectedSubject} • ${periodLabel}`
      );
    } catch (err) {
      console.warn("Search refresh failed", err);
    } finally {
      setTimeout(() => setIsSearching(false), 300);
    }
  };

  const handleSaveAttendance = () => {
    setAttendanceRegistry(prev => {
      const updated = { ...prev };
      classStudents.forEach(st => {
        const status = getAttendanceStatus(st) || 'Present';
        const remark = remarksState[`${date}_${st.id}`] || '';

        const cleanCls = normalizeClass(st.className);
        const cleanSec = normalizeSec(st.section);
        const cleanSubj = (selectedSubject || '').trim().toLowerCase();
        const cleanPrd = (selectedPeriod || '').trim().toLowerCase();

        const periodKey = `${st.className}_${st.section}_${selectedSubject}_${selectedPeriod}_${date}`;
        const normPeriodKey = `${cleanCls}_${cleanSec}_${cleanSubj}_${cleanPrd}_${date}`;
        const specKey = `${st.className}_${st.section}_${selectedSubject}_${date}`;
        const normSpecKey = `${cleanCls}_${cleanSec}_${cleanSubj}_${date}`;
        const normKey = getRegisterKey(st.className, st.section, date);
        const rawNormKey = `${st.className}_${st.section}_${date}`;
        const legacyKey = `${selectedClass === 'All Classes' ? 'All' : selectedClass}_${selectedSection === 'All Sections' ? 'All' : selectedSection}_${selectedSubject}_${date}`;

        const keysToUpdate = [periodKey, normPeriodKey, specKey, normSpecKey, normKey, rawNormKey, legacyKey];
        for (const k of keysToUpdate) {
          updated[k] = { ...(updated[k] || {}), [st.id]: status };
        }

        if (saveStudentAttendance) {
          saveStudentAttendance({
            studentId: st.id,
            studentName: `${st.firstName} ${st.lastName}`,
            className: st.className,
            section: st.section,
            date: date,
            subject: selectedSubject,
            period: selectedPeriod,
            status: status,
            remarks: remark,
            markedBy: isTeacher ? teacherFullName : (user?.name || 'Administrator')
          });
        }
      });
      localStorage.setItem('sms_attendance_registry', JSON.stringify(updated));
      localStorage.setItem('sms_attendance_remarks', JSON.stringify(remarksState));
      try {
        window.dispatchEvent(new Event('storage'));
      } catch {}
      return updated;
    });

    addToast('success', 'Attendance Register Saved', 'Student attendance entries saved and synced across Student, Parent, Teacher, and Admin panels!');
  };

  // Excel Exporter
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      addToast('warning', 'Download Blocked', 'Roster list is empty.');
      return;
    }
    setIsDownloading(true);
   
    setTimeout(() => {
      try {
        const rows: any[][] = [];
        let filename = "";
        let sheetName = "Attendance";

        if (dateMode === 'Daily') {
          rows.push(["Roll No", "Student Name", "Class", "Section", "Status", "Remarks"]);
          filteredStudents.forEach(s => {
            const status = getAttendanceStatus(s) || 'Unmarked';
            const remark = remarksState[`${date}_${s.id}`] || "";
            rows.push([s.rollNo, `${s.firstName} ${s.lastName}`, s.className, s.section, status, remark]);
          });
          filename = `Attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedSection.replace(/\s+/g, '_')}_${date}`;
          sheetName = `Daily_${date}`;
        } else {
          const dateHeaders = matrixDates.map(d => {
            const dayNum = d.split('-')[2];
            const holCheck = checkSundayOrHoliday(d, holidays);
            return holCheck.isHoliday ? `${dayNum} (H)` : dayNum;
          });
          rows.push(["Roll No", "Student Name", "Class", "Section", ...dateHeaders, "Present (P)", "Half Day (HD)", "Late (L)", "Absent (A)", "Holiday (H)", "Attendance %"]);
         
          filteredStudents.forEach(s => {
            let pCount = 0;
            let aCount = 0;
            let hdCount = 0;
            let lCount = 0;
            let hCount = 0;
           
            const dateCells = matrixDates.map(d => {
              const status = getMatrixStatus(s, d);
              const holCheck = checkSundayOrHoliday(d, holidays);
              if (status === 'Present') { pCount++; return 'P'; }
              if (status === 'Absent') { aCount++; return 'A'; }
              if (status === 'HalfDay') { hdCount++; return 'HD'; }
              if (status === 'Late') { lCount++; return 'L'; }
              if (status === 'Holiday' || (holCheck.isHoliday && status !== 'Present' && status !== 'Absent' && status !== 'HalfDay' && status !== 'Late')) {
                hCount++; return 'H';
              }
              return '-';
            });
           
            const netWorkingDays = matrixDates.length - hCount;
            const pct = netWorkingDays > 0 ? Math.round(((pCount + lCount + (hdCount * 0.5)) / netWorkingDays) * 100) : 100;
            rows.push([s.rollNo, `${s.firstName} ${s.lastName}`, s.className, s.section, ...dateCells, pCount, hdCount, lCount, aCount, hCount, `${pct}%`]);
          });
          filename = `Attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedSection.replace(/\s+/g, '_')}_${dateMode === 'Monthly' ? month : `${startDate}_to_${endDate}`}`;
          sheetName = "Matrix Register";
        }
       
        exportToExcel(rows, filename, sheetName);
        addToast('success', 'Download Complete', 'Attendance Excel report has been downloaded.');
      } catch (err: any) {
        console.error("Attendance export error:", err);
        addToast('error', 'Export Failed', err.message || 'Failed to export attendance.');
      } finally {
        setIsDownloading(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
     
      {/* Header Cockpit Card - Vertically Compact */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            Student Attendance
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-bold">
            <span>🏫 Class: <strong className="text-slate-855 dark:text-slate-200">
              {displayClassSummary}
            </strong></span>
            {selectedClass !== 'Select Class' && selectedClass !== 'All Classes' && selectedSection !== 'Select Section' && selectedSection !== 'All Sections' && (
              <span>👤 Class Teacher: <strong className="text-slate-855 dark:text-slate-200">{teacherFullName}</strong></span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAggregatedView && (
            <button
              type="button"
              onClick={() => setIsEditable(!isEditable)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shadow-xs cursor-pointer ${
                isEditable
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 dark:bg-amber-955/60 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditable ? 'Editing Enabled' : 'Unlock Editing'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Filters Row */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4">
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 ${dateMode === 'Custom Range' ? 'xl:grid-cols-8' : 'xl:grid-cols-7'} gap-3 items-end`}>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Date Mode</label>
            <select
              value={dateMode}
              onChange={e => {
                const mode = e.target.value as any;
                setDateMode(mode);
                if (mode === 'Daily' && !date) {
                  setDate(todayStr);
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="Select">Select Date Mode</option>
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>

          <div className={`space-y-1 ${dateMode === 'Custom Range' ? 'sm:col-span-2 xl:col-span-2' : ''}`}>
            <label className="text-[10px] font-black uppercase text-slate-400">Date Selection</label>
            {(dateMode === 'Daily' || dateMode === 'Select') && (
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={e => {
                  const val = e.target.value;
                  if (val > todayStr) {
                    addToast('error', 'Future Date Not Allowed', 'Attendance cannot be marked or viewed for future dates.');
                    setDate(todayStr);
                    return;
                  }
                  setDate(val);
                }}
                onClick={e => e.currentTarget.showPicker?.()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
              />
            )}
            {dateMode === 'Monthly' && (
              <input
                type="month"
                value={month}
                max={currentMonthStr}
                onChange={e => {
                  const val = e.target.value;
                  if (val > currentMonthStr) {
                    addToast('error', 'Future Month Not Allowed', 'Attendance cannot be viewed for future months.');
                    setMonth(currentMonthStr);
                    return;
                  }
                  setMonth(val);
                }}
                onClick={e => e.currentTarget.showPicker?.()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
              />
            )}
            {dateMode === 'Custom Range' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  max={todayStr}
                  onChange={e => {
                    const val = e.target.value;
                    if (val > todayStr) {
                      addToast('error', 'Future Date Not Allowed', 'Start date cannot be in the future.');
                      setStartDate(todayStr);
                      return;
                    }
                    setStartDate(val);
                  }}
                  onClick={e => e.currentTarget.showPicker?.()}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="date"
                  value={endDate}
                  max={todayStr}
                  onChange={e => {
                    const val = e.target.value;
                    if (val > todayStr) {
                      addToast('error', 'Future Date Not Allowed', 'End date cannot be in the future.');
                      setEndDate(todayStr);
                      return;
                    }
                    setEndDate(val);
                  }}
                  onClick={e => e.currentTarget.showPicker?.()}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              disabled={isTeacher && sectionOptions.length <= 1}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {sectionOptions.map(sec => (
                <option key={sec} value={sec}>{sec === 'Select Section' ? 'Select Section' : sec === 'All Sections' ? 'All Sections' : `Section ${sec}`}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Subject</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="Select">Select</option>
              {subjectOptions.map(sbj => (
                <option key={sbj} value={sbj}>{sbj}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Period</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="Select Period">Select Period</option>
              {periodOptions.map(prd => (
                <option key={prd} value={prd}>{prd}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
            <select
              value={filterStatus || 'All'}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="HalfDay">Half Day</option>
              <option value="Late">Late</option>
            </select>
          </div>
        </div>
      </div>

      {!isFilterSelected ? (
        <div className="glass-card p-10 sm:p-16 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-center space-y-4 shadow-xs my-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto border border-brand-200/60 dark:border-brand-800/60 shadow-xs">
            <Filter className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Select Filter Options</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Please select a specific <strong>Class</strong> and <strong>Section</strong> from the filter bar above to view attendance records and summary metrics.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Horizontal Summary Strip */}
          <div className="glass-card rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between overflow-x-auto">
            <div className="flex items-center gap-8 lg:gap-16 pl-2">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Students</span>
                <span className="text-lg font-black text-slate-855 dark:text-white">{summaryMetrics.total}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Present</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-455">{summaryMetrics.present}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-rose-600 dark:text-rose-455 font-bold uppercase">Absent</span>
                <span className="text-lg font-black text-rose-700 dark:text-rose-455">{summaryMetrics.absent}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Half Day</span>
                <span className="text-lg font-black text-blue-700 dark:text-blue-455">{summaryMetrics.halfDay}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Late</span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-455">{summaryMetrics.late}</span>
              </div>
            </div>
     
            <div className="flex items-center gap-3 pl-4 lg:border-l border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Attendance Rate</p>
                <p className="text-xl font-black text-brand-600 dark:text-brand-400">{summaryMetrics.percentage}%</p>
              </div>
            </div>
          </div>
 
      {/* Attendance marking sheet table (Full Screen Width) */}
      <div className="w-full space-y-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
           
            {/* Sheet Actions Header */}
            <div className="flex flex-col gap-3 pb-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-855 dark:text-slate-200">
                    Attendance ({classStudents.length} Students)
                  </span>
                  {!isAggregatedView && (
                    <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold text-[10.5px] border border-brand-200/60 dark:border-brand-800 whitespace-nowrap">
                      {selectedSubject} &bull; {selectedPeriod}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start lg:justify-end ml-auto">
                  <button
                    onClick={() => markAllClass('Present')}
                    disabled={!isEditable}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-350 font-bold transition-colors disabled:opacity-50 cursor-pointer text-xs whitespace-nowrap"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={isDownloading}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-955/40 dark:text-sky-350 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs whitespace-nowrap"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={!isEditable}
                    className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition-colors py-1.5 px-4 flex items-center gap-1.5 text-xs font-black disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Save className="w-4 h-4" /> Save Attendance
                  </button>
                </div>
              </div>
 
              {isAggregatedView ? (
                <div className="p-3 rounded-2xl border text-[11px] font-semibold flex items-start sm:items-center gap-2.5 transition-all bg-indigo-50/50 dark:bg-indigo-955/10 border-indigo-200/50 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    <strong className="font-extrabold text-indigo-900 dark:text-indigo-200">Read-Only View:</strong> Marking attendance is disabled because you are viewing multiple classes/sections. To enable marking, please select a specific <strong>Class</strong> and <strong>Section</strong>.
                  </span>
                </div>
              ) : (
                <div className={`p-3 rounded-2xl border text-[11px] font-semibold flex items-start sm:items-center gap-2.5 transition-all ${
                  isEditable
                    ? 'bg-amber-50/50 dark:bg-amber-955/15 border-amber-250/70 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-750/50 text-slate-650 dark:text-slate-400'
                }`}>
                  {isEditable ? (
                    <>
                      <Edit2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
                      <span>
                        <strong className="font-extrabold text-amber-900 dark:text-amber-200">
                          {dateMode === 'Daily' ? 'Edit Mode Enabled:' : 'Monthly Edit Mode Enabled:'}
                        </strong>{' '}
                        {dateMode === 'Daily' ? (
                          <>
                            Click on{' '}
                            <span className="mx-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold text-[9px] uppercase">Present</span>,{' '}
                            <span className="mx-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase">Absent</span>,{' '}
                            <span className="mx-1 px-1.5 py-0.5 rounded bg-amber-400 text-amber-955 font-bold text-[9px] uppercase">Half Day</span>, or{' '}
                            <span className="mx-1 px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px] uppercase">Late</span>{' '}
                            to update any student's record. Click <strong>Save Attendance</strong> at the top right when you are finished.
                          </>
                        ) : (
                          <>
                            Click directly on any cell in the grid to cycle through student attendance statuses (<strong>P</strong> → <strong>HD</strong> → <strong>L</strong> → <strong>A</strong> → <strong>-</strong>). Click <strong>Save Attendance</strong> at the top right when you are finished.
                          </>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-slate-450 shrink-0 mt-0.5 sm:mt-0" />
                      <span>
                        <strong className="font-extrabold text-slate-700 dark:text-slate-350">Read-Only Mode:</strong> Records are locked to prevent accidental modifications. Click the
                        <span className="mx-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[9px] uppercase">🔒 Edit</span>
                        button in the top header if you need to modify attendance entries.
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
 
            {/* Table View Toggle */}
            {dateMode === 'Daily' ? (
              <div id="printable-content" className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden mt-2 p-4 print:p-0 print:border-none">
                <SchoolPrintHeader
                  title={`Daily Attendance Register - Class ${selectedClass} (${selectedSection})`}
                  subtitle={`Date: ${date}`}
                />
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4 w-24 whitespace-nowrap text-left">Roll No</th>
                      <th className="py-3 px-4 whitespace-nowrap text-left">Student Name</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Attendance Status</th>
                      <th className="py-3 px-4 whitespace-nowrap text-left">Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400 italic">No students found matching your filters.</td>
                      </tr>
                    ) : (
                      paginatedStudents.map((st, idx) => {
                        const status = getAttendanceStatus(st);
                        return (
                          <tr key={st.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-850 dark:text-slate-200 border-b border-slate-100/50 dark:border-slate-800/50 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10'}`}>
                            <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{st.rollNo}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {st.avatar ? (
                                  <img src={st.avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div>
                                  <span className="font-extrabold text-slate-900 dark:text-white block">{st.firstName} {st.lastName}</span>
                                  {selectedClass === 'All Classes' && (
                                    <span className="text-[10px] text-slate-400 font-bold block">{st.className}-{st.section}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {(['Present', 'Absent', 'HalfDay', 'Late'] as const).map(stType => {
                                  const isSelected = status === stType;
                                  let activeStyle = '';
                                  if (stType === 'Present') activeStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-inner';
                                  else if (stType === 'Absent') activeStyle = 'bg-rose-600 text-white border-rose-700 shadow-inner';
                                  else if (stType === 'HalfDay' || stType === 'Late') activeStyle = 'bg-amber-400 text-amber-950 border-amber-500 shadow-inner';
                                 
                                  return (
                                    <button
                                      key={stType}
                                      disabled={!isEditable}
                                      onClick={() => handleSingleMark(st.id, stType)}
                                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                        isSelected
                                          ? activeStyle
                                          : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                      } ${!isEditable && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                      {stType === 'HalfDay' ? 'Half Day' : stType}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {remarksState[`${date}_${st.id}`] ? (
                                <div className="flex items-start justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900 max-w-[200px]">
                                  <div className="flex-1 min-w-0">
                                    <span
                                      onClick={() => {
                                        if (remarksState[`${date}_${st.id}`].length > 15) {
                                          setExpandedRemarks(prev => ({ ...prev, [st.id]: !prev[st.id] }));
                                        }
                                      }}
                                      className={`text-[10px] text-amber-700 dark:text-amber-400 font-bold block ${
                                        expandedRemarks[st.id] ? 'whitespace-normal break-words' : 'truncate cursor-pointer'
                                      }`}
                                      title={remarksState[`${date}_${st.id}`].length > 15 && !expandedRemarks[st.id] ? "Click to expand remark" : ""}
                                    >
                                      {remarksState[`${date}_${st.id}`]}
                                    </span>
                                    {remarksState[`${date}_${st.id}`].length > 15 && (
                                      <button
                                        onClick={() => setExpandedRemarks(prev => ({ ...prev, [st.id]: !prev[st.id] }))}
                                        className="text-[9px] text-amber-600 dark:text-amber-500 underline font-black mt-0.5 focus:outline-none block"
                                      >
                                        {expandedRemarks[st.id] ? "Show Less" : "Show More"}
                                      </button>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setRemarkModalStudent(st);
                                      setTempRemark(remarksState[`${date}_${st.id}`] || '');
                                    }}
                                    disabled={!isEditable}
                                    className="text-amber-600 hover:text-amber-800 disabled:opacity-50 mt-0.5 shrink-0"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setRemarkModalStudent(st);
                                    setTempRemark('');
                                  }}
                                  disabled={!isEditable}
                                  className="w-full text-left px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800/80 text-slate-400 font-bold text-[10px] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  <Plus className="w-3 h-3" /> Add Remark
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden mt-2">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-3 min-w-[150px] sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10 shadow-sm border-r border-slate-200 dark:border-slate-700">Student Name</th>
                        {matrixDates.map(d => {
                          const dayNum = parseInt(d.split('-')[2], 10);
                          const holCheck = checkSundayOrHoliday(d, holidays);
                          return (
                            <th
                              key={d}
                              className={`py-3 px-1 text-center min-w-[28px] font-mono ${
                                holCheck.isHoliday
                                  ? 'bg-purple-100/90 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-black border-b-2 border-purple-400'
                                  : ''
                              }`}
                              title={holCheck.isHoliday ? `${d} - ${holCheck.name}` : d}
                            >
                              {dayNum}
                            </th>
                          );
                        })}
                        <th className="py-3 px-2 text-center text-emerald-600">P</th>
                        <th className="py-3 px-2 text-center text-blue-600">HD</th>
                        <th className="py-3 px-2 text-center text-amber-600">L</th>
                        <th className="py-3 px-2 text-center text-rose-600">A</th>
                        <th className="py-3 px-2 text-center text-purple-600">H</th>
                        <th className="py-3 px-2 text-center text-sky-600">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {paginatedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={matrixDates.length + 6} className="py-12 text-center text-slate-400 italic">No students found matching your filters.</td>
                        </tr>
                      ) : (
                        paginatedStudents.map((st, idx) => {
                          let pCount = 0;
                          let aCount = 0;
                          let hdCount = 0;
                          let lCount = 0;
                          let hCount = 0;
                         
                          return (
                            <tr key={st.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-855 dark:text-slate-200 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10'}`}>
                              <td className={`py-2 px-3 whitespace-nowrap sticky left-0 z-10 border-r border-slate-200 dark:border-slate-700 shadow-sm ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                <span className="font-extrabold text-slate-900 dark:text-white block">{st.firstName} {st.lastName}</span>
                                <span className="text-[9px] font-mono text-slate-400">{st.rollNo} • {st.className}-{st.section}</span>
                              </td>
                              {matrixDates.map(d => {
                                const status = getMatrixStatus(st, d);
                                const holCheck = checkSundayOrHoliday(d, holidays);
                                let code = '-';
                                let badgeStyle = 'text-slate-400';
                                
                                if (status === 'Present') { code = 'P'; pCount++; badgeStyle = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold'; }
                                else if (status === 'Absent') { code = 'A'; aCount++; badgeStyle = 'text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 font-black'; }
                                else if (status === 'HalfDay') { code = 'HD'; hdCount++; badgeStyle = 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 font-bold'; }
                                else if (status === 'Late') { code = 'L'; lCount++; badgeStyle = 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 font-bold'; }
                                else if (status === 'Holiday' || holCheck.isHoliday) {
                                  code = 'H';
                                  hCount++;
                                  badgeStyle = 'text-purple-700 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold border border-purple-200/80 dark:border-purple-800/80';
                                }
                                
                                const cellTooltip = holCheck.isHoliday ? `${d} - ${holCheck.name}` : d;

                                return (
                                  <td key={d} className="py-2 px-0.5 text-center font-mono font-bold text-[10px]">
                                    {isEditable ? (
                                      <button
                                        onClick={() => handleMatrixCellClick(st, d)}
                                        className={`inline-block w-6 py-0.5 rounded transition-all hover:scale-110 active:scale-95 shadow-xs border border-dashed ${
                                          code !== '-'
                                            ? `${badgeStyle} border-transparent`
                                            : 'text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 hover:border-slate-450 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                        title={cellTooltip}
                                      >
                                        {code}
                                      </button>
                                    ) : (
                                      code !== '-' ? (
                                        <span className={`inline-block w-6 py-0.5 rounded ${badgeStyle}`} title={cellTooltip}>{code}</span>
                                      ) : (
                                        <span className={badgeStyle} title={cellTooltip}>{code}</span>
                                      )
                                    )}
                                  </td>
                                );
                              })}
                              <td className="py-2 px-2 text-center font-bold text-emerald-600">{pCount}</td>
                              <td className="py-2 px-2 text-center font-bold text-blue-600">{hdCount}</td>
                              <td className="py-2 px-2 text-center font-bold text-amber-600">{lCount}</td>
                              <td className="py-2 px-2 text-center font-bold text-rose-600">{aCount}</td>
                              <td className="py-2 px-2 text-center font-bold text-purple-600">{hCount}</td>
                              <td className="py-2 px-2 text-center font-extrabold text-sky-600 bg-sky-50/30 dark:bg-sky-900/10">
                                {(() => {
                                  const netDays = matrixDates.length - hCount;
                                  return netDays > 0 ? Math.round(((pCount + lCount + (hdCount * 0.5)) / netDays) * 100) : 100;
                                })()}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredStudents.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
                  label="students"
                />
              </div>
            )}
          </div>
        </div>
      </>
      )}
 
      {/* ----------------- MODAL: Student Profile Detailed Viewer ----------------- */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 my-auto text-slate-800 dark:text-slate-205">
           
            {/* Header profile details */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {profileStudent.avatar ? (
                  <img src={profileStudent.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-650">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{profileStudent.firstName} {profileStudent.lastName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Admission Code: {profileStudent.admissionNo} &bull; Class {profileStudent.className}-{profileStudent.section}</p>
                </div>
              </div>
              <button onClick={() => setProfileStudent(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold">✕</button>
            </div>
 
            {/* Simple Inner modal close view */}
            <div className="p-12 text-center space-y-4">
              <p className="font-extrabold text-sm text-slate-855 dark:text-white">Viewing {profileStudent.firstName}'s full record profile inside Attendance Module.</p>
              <p className="text-slate-450 max-w-md mx-auto">To perform modifications, behaviour logging, or guardian communications, please open the dedicated Student Management module dashboard panel.</p>
              <button
                onClick={() => setProfileStudent(null)}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* ----------------- MODAL: Add/Edit Remark ----------------- */}
      {remarkModalStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Add Remark
              </h3>
              <button onClick={() => setRemarkModalStudent(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
           
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
              Adding attendance remark for <strong className="text-slate-800 dark:text-slate-200">{remarkModalStudent.firstName} {remarkModalStudent.lastName}</strong>
            </p>
 
            <textarea
              value={tempRemark}
              onChange={e => setTempRemark(e.target.value)}
              placeholder="E.g., Doctor's appointment, delayed school bus, sick leave..."
              className="w-full h-32 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-500 text-sm font-medium resize-none"
              autoFocus
            />
 
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRemarkModalStudent(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRemarkChange(remarkModalStudent.id, tempRemark);
                  setRemarkModalStudent(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black shadow-lg shadow-brand-500/20 transition-colors text-sm"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl shadow-xl flex items-start gap-3 w-80 animate-in slide-in-from-right-8">
            <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : toast.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>
              {toast.type === 'success' ? <Check className="w-4 h-4" /> : toast.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-bold text-sm">{toast.title}</p>
              <p className="text-slate-300 dark:text-slate-600 text-[11px] leading-snug mt-0.5">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
 
 