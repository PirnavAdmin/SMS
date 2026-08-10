import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock, Plus, Edit, Trash2, X, ChevronDown, Calendar, Printer,
  Copy, User, BookOpen, AlertTriangle, Layers, SlidersHorizontal, Check, RefreshCw,
  Send, Lock, FileSpreadsheet, ShieldAlert, CheckCircle2, Info, Search,
  Zap, UserCheck, Users, BookMarked, ChevronRight, School
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { TimetableSlot, PeriodSetting, TeacherAssignment } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';
import { 
  fetchPeriodsApi, savePeriodApi, deletePeriodApi,
  fetchTimetableGridApi, saveTimetableSlotApi, deleteTimetableSlotApi,
  publishTimetableApi, copyTimetableApi
} from '../../../api/academic';

type TimetableTab = 'period-settings' | 'class-timetable' | 'teacher-timetable';

export const TimetableView: React.FC<{ onNavigate?: (module: string) => void }> = ({ onNavigate }) => {
  const {
    timetable, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot, publishClassTimetable, loadTimetableForClassSection,
    periodSettings, addPeriodSetting, updatePeriodSetting, deletePeriodSetting, bulkAssignPeriods, resetClassPeriods,
    teacherAssignments, addTeacherAssignment, updateTeacherAssignment, deleteTeacherAssignment,
    staff, academicClasses, rawClasses, subjects, holidays
  } = useData();
  const { user, role, selectedBranch, setSelectedBranch } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<TimetableTab>('period-settings');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [includeSaturday, setIncludeSaturday] = useState(false);

  // Filter staff to Teaching Staff only
  const teachingStaff = useMemo(() => 
    staff.filter(s => s.employeeCategory === 'Teacher' || s.role === 'Teacher'),
    [staff]
  );

  const normalizedRole = (role || '').toString().trim().toLowerCase().replace(/-/g, ' ');
  const isTeacher = normalizedRole === 'teacher' || normalizedRole === 'class teacher';
  
  // Find logged-in teacher profile
  const dbTeacher = staff.find(s => s.email && user?.email && s.email === user.email && s.employeeCategory === 'Teacher') || 
                     staff.find(s => s.email && (s.email.toLowerCase().includes('jenkins') || s.email.toLowerCase().includes('miller'))) ||
                     staff.find(s => s.employeeCategory === 'Teacher');

  // Fallback to static mock data if no teacher profile is found
  const teacher = dbTeacher || {
    id: 'STF-002',
    empId: 'EMP002',
    firstName: user?.name || 'Jonathan',
    lastName: 'Miller',
    assignedClasses: ['Class 10-A', 'Class 11-B'],
    assignedSubjects: ['Mathematics'],
    department: 'Mathematics',
    designation: 'Class Teacher'
  };

  const teacherFullName = `${teacher.firstName} ${teacher.lastName}`;

  // PERSONAL TEACHER TIMETABLE STATES
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<any>(null);
  const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);
  const [selectedClassInfo, setSelectedClassInfo] = useState<any>(null);
  const [showClassInfoModal, setShowClassInfoModal] = useState(false);
  const [showAllPlansModal, setShowAllPlansModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = daysOfWeek[new Date().getDay()] as any;

  // Retrieve today's schedule for this teacher
  const teacherTodaysSchedule = useMemo(() => {
    return timetable
      .filter(t => t.teacherName === teacherFullName && t.day === todayDay)
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  }, [timetable, teacherFullName, todayDay]);

  // Helper: parse timeSlot to relative status (Current / Upcoming / Completed)
  const getPeriodStatus = (timeSlot: string) => {
    if (!timeSlot) return 'Upcoming';
    const times = timeSlot.split('-');
    if (times.length !== 2) return 'Upcoming';
    
    const parseTime = (tStr: string) => {
      const cleaned = tStr.trim();
      const parts = cleaned.split(' ');
      if (parts.length < 1) return 0;
      
      const timeParts = parts[0].split(':');
      let hour = parseInt(timeParts[0]);
      const minute = timeParts.length > 1 ? parseInt(timeParts[1]) : 0;
      
      if (parts.length > 1) {
        const ampm = parts[1].toLowerCase();
        if (ampm.includes('pm') && hour < 12) hour += 12;
        if (ampm.includes('am') && hour === 12) hour = 0;
      }
      return hour * 60 + minute;
    };

    const startMin = parseTime(times[0]);
    const endMin = parseTime(times[1]);
    
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    if (currentMin < startMin) return 'Upcoming';
    if (currentMin >= startMin && currentMin <= endMin) return 'Current';
    return 'Completed';
  };

  // Mock Substitution Schedule
  const substitutionSchedule = useMemo(() => [
    { id: 'SUB-1', period: 'Period 4', time: '11:15 AM - 12:00 PM', classSection: 'Class 11-A', subject: teacher.assignedSubjects?.[0] || 'Mathematics', room: 'Room 205', status: 'Substituting for Sarah Jenkins' },
    { id: 'SUB-2', period: 'Period 2', time: '09:15 AM - 10:00 AM', classSection: 'Class 10-A', subject: teacher.assignedSubjects?.[0] || 'Mathematics', room: '--', status: 'Cancelled due to Assembly' },
    { id: 'SUB-3', period: 'Period 5', time: '12:15 PM - 01:00 PM', classSection: 'Class 10-B', subject: teacher.assignedSubjects?.[0] || 'Mathematics', room: 'Physics Lab', status: 'Room changed from Room 101' }
  ], [teacher]);

  // Derived Free Periods Today
  const freePeriods = useMemo(() => {
    const busyTimes = teacherTodaysSchedule.map(s => s.timeSlot);
    const matchedPeriods = periodSettings.filter(p => p.status === 'Active');
    
    return matchedPeriods
      .filter(p => p.periodType === 'Teaching' && !busyTimes.includes(`${p.startTime} - ${p.endTime}`))
      .map((p, idx) => {
        const tasks = ['Parent Sync Meetings', 'Lesson Planning', 'Additional class assignments', 'Exam evaluation'];
        return {
          periodName: p.periodName,
          timeSlot: `${p.startTime} - ${p.endTime}`,
          suggestion: tasks[idx % tasks.length]
        };
      });
  }, [teacherTodaysSchedule, periodSettings]);

  // Mock Lesson Plans Database
  const lessonPlans: Record<string, { subject: string; topic: string; objective: string; materials: string; steps: string[]; status: string }> = {
    'Mathematics': {
      subject: 'Mathematics',
      topic: 'Quadratic Equations - Factoring methods',
      objective: 'Solve binomial quadratic equations of the format ax^2 + bx + c = 0 using splitting-the-middle-term factoring.',
      materials: 'Algebra workbooks, Graph plotting spreadsheets, smart board slides.',
      steps: [
        'Review basic algebra expansions (10 mins)',
        'Demonstrate factoring quadratic trinomial steps (15 mins)',
        'Class workbook exercise solving 6 trinomials (15 mins)',
        'Collect exit ticket and homework allocation (5 mins)'
      ],
      status: 'Approved'
    },
    'Physics': {
      subject: 'Physics',
      topic: 'Faraday’s Law of Induction',
      objective: 'Understand how a changing magnetic flux induce electromotive force (EMF) inside a wire coil loop.',
      materials: 'Coil windings, Bar magnets, Galvenometer, simulation portal.',
      steps: [
        'Introduce magnet loop experiments (10 mins)',
        'Detail electromagnetic induction formula (15 mins)',
        'Solve 3 practice EMF problems on chalkboard (15 mins)',
        'Wrap up check and assign readings (5 mins)'
      ],
      status: 'Approved'
    },
    'General': {
      subject: 'Academics',
      topic: 'General Variable Formulations',
      objective: 'Analyze and isolate mathematical variables on either side of balanced equations.',
      materials: 'Algebra balance scales, worksheet templates.',
      steps: [
        'Equation balance scale game warmup (10 mins)',
        'Solving for variable X demo (15 mins)',
        'Group work on balanced equations (15 mins)',
        'Summary check (5 mins)'
      ],
      status: 'In Progress'
    }
  };

  const handleOpenLessonPlan = (subject: string) => {
    const key = subject.toLowerCase().includes('physics') ? 'Physics' :
                subject.toLowerCase().includes('math') ? 'Mathematics' : 'General';
    setSelectedLessonPlan(lessonPlans[key]);
    setShowLessonPlanModal(true);
  };

  const handleOpenClassInfo = (classSec: string, subject: string, room: string) => {
    setSelectedClassInfo({
      className: classSec,
      subject: subject,
      room: room || 'Room 101',
      studentStrength: 38,
      classTeacher: teacherFullName
    });
    setShowClassInfoModal(true);
  };

  const handleQuickActionClick = (moduleName: string) => {
    if (onNavigate) {
      onNavigate(moduleName);
    }
  };

  const classOptions = useMemo(() => academicClasses.map(c => c.name), [academicClasses]);
  const getSectionsForClass = (className?: string) => {
    if (!className) return [];
    return academicClasses.find(c => c.name === className)?.sections || [];
  };

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [selectedTeacherName, setSelectedTeacherName] = useState<string>(teacherFullName);

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodFormData, setPeriodFormData] = useState<Partial<PeriodSetting>>({
    periodName: 'Period 7',
    startTime: '02:00 PM',
    endTime: '02:45 PM',
    sequence: 9,
    periodType: 'Teaching',
    status: 'Active'
  });
  const [deletingPeriodSetting, setDeletingPeriodSetting] = useState<PeriodSetting | null>(null);
  const [customPeriodType, setCustomPeriodType] = useState('');
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [bulkSelectedClasses, setBulkSelectedClasses] = useState<string[]>([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const [showApplySuggestion, setShowApplySuggestion] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<TimetableSlot | null>(null);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const baseDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const days = includeSaturday ? [...baseDays, 'Saturday'] : baseDays;

  const sectionOptions = useMemo(
    () => {
      if (!selectedClass) return [];
      return academicClasses.find(c => c.name === selectedClass)?.sections || [];
    },
    [academicClasses, selectedClass]
  );

  useEffect(() => {
    if (selectedClass && sectionOptions.length > 0 && !sectionOptions.includes(selectedSection)) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [sectionOptions, selectedSection, selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      const clsObj = academicClasses.find(c => c.name === selectedClass);
      if (clsObj) {
        loadTimetableForClassSection(clsObj.id, selectedSection, academicYear);
      }
    }
  }, [selectedClass, selectedSection, academicYear, academicClasses]);

  useEffect(() => {
    if (isBulkAssignModalOpen) {
      const remaining: string[] = [];
      academicClasses.forEach(c => {
        (c.sections || ['A']).forEach(sec => {
          const hasCustom = periodSettings.some(p => p.className === c.name && p.section === sec && p.status === 'Active');
          if (!hasCustom) {
            remaining.push(`${c.name}-${sec}`);
          }
        });
      });
      setBulkSelectedClasses(remaining);
    }
  }, [isBulkAssignModalOpen, periodSettings, academicClasses]);

  const activeBranchPeriods = useMemo(() => {
    const specific = periodSettings.filter(p => 
      p.className === selectedClass && 
      p.section === selectedSection && 
      p.status === 'Active'
    );
    return specific.sort((a, b) => a.sequence - b.sequence);
  }, [periodSettings, selectedClass, selectedSection]);

  const parseSortable = (ts: any) => {
    if (!ts || typeof ts !== 'string') return 9999;
    const match = ts.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 9999;
    let [_, h, m, p] = match;
    let hr = parseInt(h, 10);
    if (p.toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (p.toUpperCase() === 'AM' && hr === 12) hr = 0;
    return hr * 60 + parseInt(m, 10);
  };

  const parseTo24 = (timeStr: any) => {
    if (!timeStr || typeof timeStr !== 'string') return '09:00';
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '09:00';
    let [_, h, m, p] = match;
    let hr = parseInt(h, 10);
    if (p.toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (p.toUpperCase() === 'AM' && hr === 12) hr = 0;
    return `${hr.toString().padStart(2, '0')}:${m}`;
  };

  const formatTo12 = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12;
    hr = hr ? hr : 12;
    return `${hr.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const classTimetable = useMemo(() => 
    timetable.filter(t => t.className === selectedClass && t.section === selectedSection),
    [timetable, selectedClass, selectedSection]
  );

  const timetableStatus = useMemo(() => {
    if (classTimetable.length === 0) return 'Draft';
    return classTimetable.every(t => t.status === 'Published') ? 'Published' : 'Draft';
  }, [classTimetable]);

  const timeSlots = useMemo(() => {
    const fromData = classTimetable.map(t => t.timeSlot);
    const fromSettings = activeBranchPeriods.map(p => `${p.startTime} - ${p.endTime}`);
    return Array.from(new Set([...fromSettings, ...fromData])).sort((a, b) => parseSortable(a) - parseSortable(b));
  }, [classTimetable, activeBranchPeriods]);

  const [formData, setFormData] = useState<Partial<TimetableSlot>>({
    day: 'Monday',
    timeSlot: '08:30 AM - 09:15 AM',
    className: 'Class 10',
    section: 'A',
    subject: '',
    teacherName: '',
    roomNo: ''
  });

  const availableClassSubjects = useMemo(() => {
    const targetClass = formData.className || '';
    if (!targetClass) return subjects;
    const clsObj = academicClasses.find(c => c.name.toLowerCase().trim() === targetClass.toLowerCase().trim());
    const assignedNames = clsObj?.subjects || [];
    const teacherAssignedNames = teacherAssignments
      .filter(ta => ta.className.toLowerCase().trim() === targetClass.toLowerCase().trim())
      .map(ta => ta.subject);
    const combinedNames = Array.from(new Set([...assignedNames, ...teacherAssignedNames]));
    if (combinedNames.length > 0) {
      return combinedNames.map((name, idx) => {
        const globalSub = subjects.find(s => s.name.toLowerCase().trim() === name.toLowerCase().trim());
        return {
          id: globalSub?.id || `class-sub-${idx}-${name}`,
          name: name,
          weeklyPeriodCount: globalSub?.weeklyPeriodCount || 5,
          code: globalSub?.code || globalSub?.subjectId || ''
        };
      });
    }
    return subjects;
  }, [academicClasses, formData.className, teacherAssignments, subjects]);

  const autoAssignedTeacher = useMemo(() => {
    if (!formData.subject || !formData.className || !formData.section) return '';
    const assigned = teacherAssignments.find(
      ta => ta.className === formData.className && ta.section === formData.section && ta.subject === formData.subject
    );
    if (assigned) return assigned.teacherName;
    const fallbackStaff = teachingStaff.find(s => s.assignedSubjects?.includes(formData.subject || ''));
    if (fallbackStaff) return `${fallbackStaff.firstName} ${fallbackStaff.lastName}`;
    return 'Jonathan Miller';
  }, [formData.subject, formData.className, formData.section, teacherAssignments, teachingStaff]);

  useEffect(() => {
    if (autoAssignedTeacher && formData.subject) {
      setFormData(prev => ({ ...prev, teacherName: autoAssignedTeacher }));
    }
  }, [autoAssignedTeacher, formData.subject]);

  const runValidationEngine = (testSlot: Partial<TimetableSlot>, currentId?: string): string[] => {
    const errors: string[] = [];
    if (!testSlot.day || !testSlot.timeSlot || !testSlot.className || !testSlot.section || !testSlot.subject) return errors;

    const periodObj = activeBranchPeriods.find(p => `${p.startTime} - ${p.endTime}` === testSlot.timeSlot);
    if (periodObj && (periodObj.periodType === 'Break' || periodObj.periodType === 'Lunch')) {
      errors.push(`Invalid Period: Subject cannot be assigned during ${periodObj.periodName} (${periodObj.periodType}).`);
    }

    const duplicateSlot = timetable.find(t =>
      t.id !== currentId && t.className === testSlot.className && t.section === testSlot.section && t.day === testSlot.day && t.timeSlot === testSlot.timeSlot
    );
    if (duplicateSlot) errors.push(`Duplicate Allocation: ${testSlot.className}-${testSlot.section} already has ${duplicateSlot.subject} assigned at ${testSlot.timeSlot} on ${testSlot.day}.`);

    if (testSlot.teacherName) {
      const teacherConflict = timetable.find(t =>
        t.id !== currentId && t.teacherName === testSlot.teacherName && t.day === testSlot.day && t.timeSlot === testSlot.timeSlot
      );
      if (teacherConflict) errors.push(`Teacher Conflict: ${testSlot.teacherName} is already assigned to teach ${teacherConflict.className}-${teacherConflict.section} at ${testSlot.timeSlot} on ${testSlot.day}.`);
    }

    const subjObj = subjects.find(s => s.name === testSlot.subject);
    const weeklyLimit = subjObj?.weeklyPeriodCount || 5;
    const existingSubjectCount = timetable.filter(t => t.id !== currentId && t.className === testSlot.className && t.section === testSlot.section && t.subject === testSlot.subject).length;
    if (existingSubjectCount >= weeklyLimit) errors.push(`Subject Weekly Limit Exceeded: ${testSlot.subject} has a maximum limit of ${weeklyLimit} periods/week for ${testSlot.className}-${testSlot.section}.`);

    if (testSlot.teacherName) {
      const teacherObj = teachingStaff.find(s => `${s.firstName} ${s.lastName}` === testSlot.teacherName);
      const dailyLimit = teacherObj?.dailyWorkloadLimit || 5;
      const teacherDayCount = timetable.filter(t => t.id !== currentId && t.teacherName === testSlot.teacherName && t.day === testSlot.day).length;
      if (teacherDayCount >= dailyLimit) errors.push(`Teacher Daily Workload Limit: ${testSlot.teacherName} exceeds the limit of ${dailyLimit} periods on ${testSlot.day}.`);

      const weeklyWLimit = teacherObj?.weeklyWorkloadLimit || 24;
      const teacherWeekCount = timetable.filter(t => t.id !== currentId && t.teacherName === testSlot.teacherName).length;
      if (teacherWeekCount >= weeklyWLimit) errors.push(`Teacher Weekly Workload Limit: ${testSlot.teacherName} exceeds the limit of ${weeklyWLimit} periods/week.`);
    }

    return errors;
  };

  const handleOpenAdd = (day?: string, slot?: string) => {
    setEditingSlot(null);
    setValidationErrors([]);
    const initialClassName = selectedClass || academicClasses[0]?.name || 'Class 9';
    const clsObj = academicClasses.find(c => c.name.toLowerCase().trim() === initialClassName.toLowerCase().trim());
    const assignedNames = clsObj?.subjects || [];
    const firstSubject = assignedNames[0] || subjects[0]?.name || 'Mathematics';
    if (slot) {
      const parts = slot.split('-');
      setStartTime(parseTo24(parts[0]?.trim() || '08:30 AM'));
      setEndTime(parseTo24(parts[1]?.trim() || '09:15 AM'));
    } else {
      setStartTime('08:30');
      setEndTime('09:15');
    }
    const initialSlot = {
      day: (day as any) || 'Monday',
      timeSlot: slot || '08:30 AM - 09:15 AM',
      className: initialClassName,
      section: selectedSection,
      subject: firstSubject,
      teacherName: '',
      roomNo: '',
      status: 'Draft' as 'Draft' | 'Published' | 'Archived'
    };
    setFormData(initialSlot);
    setIsSubjectDropdownOpen(false);
    setSubjectSearchQuery('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: TimetableSlot) => {
    setEditingSlot(t);
    setValidationErrors([]);
    setFormData(t);
    const parts = t.timeSlot.split('-');
    setStartTime(parseTo24(parts[0]?.trim() || '08:30 AM'));
    setEndTime(parseTo24(parts[1]?.trim() || '09:15 AM'));
    setIsSubjectDropdownOpen(false);
    setSubjectSearchQuery('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.className || !formData.section) return;

    const timeSlotStr = `${formatTo12(startTime)} - ${formatTo12(endTime)}`;
    const finalData = {
      ...formData,
      teacherName: autoAssignedTeacher,
      timeSlot: timeSlotStr,
      academicYear,
      branch: selectedBranch || 'Main Campus',
      status: (formData.status || 'Draft') as 'Draft' | 'Published'
    };

    const errors = runValidationEngine(finalData, editingSlot?.id);
    if (errors.length > 0) {
      setValidationErrors(errors);
      addToast('warning', 'Timetable Validation Failure', 'Please resolve schedule conflicts before saving.');
      return;
    }

    if (editingSlot) {
      updateTimetableSlot(editingSlot.id, finalData);
      addToast('success', 'Period Slot Updated', `Updated ${finalData.subject} period slot`);
    } else {
      addTimetableSlot(finalData as Omit<TimetableSlot, 'id'>);
      addToast('success', 'Period Slot Added', `Assigned ${finalData.subject} to ${finalData.day}`);
    }
    setIsFormOpen(false);
  };

  const handlePublishTimetable = () => {
    publishClassTimetable(selectedClass, selectedSection, academicYear, selectedBranch);
    addToast('success', 'Timetable Published', `Published timetable for ${selectedClass}-${selectedSection}.`);
  };

  const handleAddPeriodSettingSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!periodFormData.periodName || !periodFormData.startTime || !periodFormData.endTime) return;
    
    // Duplicate validation
    const targetClass = isEditingMaster ? undefined : selectedClass;
    const targetSection = isEditingMaster ? undefined : selectedSection;

    const isDuplicate = periodSettings.some(p => {
      if (p.id === periodFormData.id) return false;
      if (p.status !== 'Active') return false;

      const sameScope =
        (!p.className && !p.section && !targetClass && !targetSection) ||
        (p.className === targetClass && p.section === targetSection);

      if (!sameScope) return false;

      const sameName = p.periodName.trim().toLowerCase() === periodFormData.periodName!.trim().toLowerCase();
      const sameSequence = Number(p.sequence) === Number(periodFormData.sequence);
      const sameTime = p.startTime === periodFormData.startTime && p.endTime === periodFormData.endTime;

      return sameName || sameSequence || sameTime;
    });

    if (isDuplicate) {
      addToast('error', 'Duplicate Period', 'A period with the same name, sequence, or time range already exists in this schedule.');
      return;
    }

    const finalPeriodType = periodFormData.periodType === 'Other' ? customPeriodType : periodFormData.periodType;
    
    if (periodFormData.id) {
      if (isEditingMaster || periodFormData.className) {
        updatePeriodSetting(periodFormData.id, {
          ...periodFormData,
          periodType: finalPeriodType || 'Teaching'
        });
        addToast('success', 'Period Configured', `Updated ${periodFormData.periodName}`);
      } else {
        // Cloning master periods for this class since we edited an inherited period
        const master = periodSettings.filter(p => !p.className && p.status === 'Active');
        master.forEach(mp => {
          if (mp.id === periodFormData.id) {
            addPeriodSetting({
              academicYear,
              branch: selectedBranch || 'Main Campus',
              className: selectedClass,
              section: selectedSection,
              periodName: periodFormData.periodName!,
              startTime: periodFormData.startTime!,
              endTime: periodFormData.endTime!,
              sequence: Number(periodFormData.sequence || mp.sequence),
              periodType: finalPeriodType || 'Teaching',
              status: 'Active'
            });
          } else {
            addPeriodSetting({
              academicYear: mp.academicYear,
              branch: mp.branch,
              className: selectedClass,
              section: selectedSection,
              periodName: mp.periodName,
              startTime: mp.startTime,
              endTime: mp.endTime,
              sequence: mp.sequence,
              periodType: mp.periodType,
              status: 'Active'
            });
          }
        });
        addToast('success', 'Custom Schedule Created', `Customized ${periodFormData.periodName} for ${selectedClass}-${selectedSection}`);
      }
    } else {
      if (isEditingMaster) {
        addPeriodSetting({
          academicYear,
          branch: selectedBranch || 'Main Campus',
          periodName: periodFormData.periodName,
          startTime: periodFormData.startTime,
          endTime: periodFormData.endTime,
          sequence: Number(periodFormData.sequence || 9),
          periodType: finalPeriodType || 'Teaching',
          status: 'Active'
        });
        addToast('success', 'Period Configured', `Added ${periodFormData.periodName} to Master Template`);
        setShowApplySuggestion(true);
      } else {
        addPeriodSetting({
          academicYear,
          branch: selectedBranch || 'Main Campus',
          className: selectedClass,
          section: selectedSection,
          periodName: periodFormData.periodName,
          startTime: periodFormData.startTime,
          endTime: periodFormData.endTime,
          sequence: Number(periodFormData.sequence || 9),
          periodType: finalPeriodType || 'Teaching',
          status: 'Active'
        });
        addToast('success', 'Period Configured', `Added custom period ${periodFormData.periodName} to ${selectedClass}-${selectedSection}`);
      }
    }
    setIsPeriodModalOpen(false);
  };

  const handleDeletePeriod = (p: PeriodSetting) => {
    if (isEditingMaster || p.className) {
      deletePeriodSetting(p.id);
      addToast('success', 'Period Deleted', `Deleted ${p.periodName}`);
    } else {
      const master = periodSettings.filter(mp => !mp.className && mp.status === 'Active');
      master.forEach(mp => {
        if (mp.id !== p.id) {
          addPeriodSetting({
            academicYear: mp.academicYear,
            branch: mp.branch,
            className: selectedClass,
            section: selectedSection,
            periodName: mp.periodName,
            startTime: mp.startTime,
            endTime: mp.endTime,
            sequence: mp.sequence,
            periodType: mp.periodType,
            status: 'Active'
          });
        }
      });
      addToast('success', 'Custom Schedule Created', `Removed ${p.periodName} from ${selectedClass}-${selectedSection}`);
    }
  };

  const handleSaveBulkAssign = () => {
    if (bulkSelectedClasses.length === 0) {
      addToast('warning', 'Selection Required', 'Please select at least one class and section.');
      return;
    }

    bulkAssignPeriods(bulkSelectedClasses);

    addToast('success', 'Periods Assigned', `Periods successfully assigned to ${bulkSelectedClasses.length} class-section combinations.`);
    setIsBulkAssignModalOpen(false);
    setBulkSelectedClasses([]);
    setBulkSearchQuery('');
  };

  const handlePrint = () => {
    window.scrollTo(0, 0);
    if (activeTab === 'period-settings') {
      setActiveTab('class-timetable');
      setTimeout(() => window.print(), 200);
    } else {
      setTimeout(() => window.print(), 50);
    }
  };

  if (isTeacher) {
    const weeklyDays = includeSaturday ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const activePeriods = periodSettings.filter(p => p.status === 'Active').sort((a, b) => a.sequence - b.sequence);
    const weeklyTimeSlots = Array.from(new Set([
      ...activePeriods.map(p => `${p.startTime} - ${p.endTime}`),
      ...timetable.filter(t => t.teacherName === teacherFullName && t.timeSlot).map(t => t.timeSlot)
    ])).sort((a, b) => parseSortable(a) - parseSortable(b));

    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
        <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              Teacher Timetable
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-bold">
              <span>👤 Teacher: <strong className="text-slate-855 dark:text-slate-200">{teacherFullName}</strong></span>
              <span>🏢 Dept: <strong className="text-slate-855 dark:text-slate-200">{teacher.department}</strong></span>
              <span>📅 Today: <strong className="text-slate-855 dark:text-slate-200">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('today')}
              className={`px-4 py-1.5 rounded-lg font-black transition-all ${
                viewMode === 'today'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 rounded-lg font-black transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {viewMode === 'today' && (
          <div className="space-y-6">
            
            {/* Today's Schedule Table - FULL WIDTH */}
            <div className="glass-card p-6 rounded-3xl border border-slate-205/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Today's Lecture Schedule
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Daily period allocation, mapped rooms, and real-time class status</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-305 font-black text-[10px] shadow-xs">
                  {teacherTodaysSchedule.length} Period{teacherTodaysSchedule.length !== 1 ? 's' : ''} Mapped
                </span>
              </div>

              <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-205 dark:border-slate-800">
                      <th className="py-3 px-4">Time Block</th>
                      <th className="py-3 px-4">Lecture / Topic</th>
                      <th className="py-3 px-4">Class & Section</th>
                      <th className="py-3 px-4">Room Mapped</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {teacherTodaysSchedule.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 italic font-bold">
                          No lectures scheduled for you today.
                        </td>
                      </tr>
                    ) : (
                      teacherTodaysSchedule.map((slot, index) => {
                        const status = getPeriodStatus(slot.timeSlot);
                        const isEven = index % 2 === 0;
                        return (
                          <tr 
                            key={slot.id} 
                            className={`transition-colors duration-150 hover:bg-sky-50/20 dark:hover:bg-slate-800/40 text-slate-850 dark:text-slate-200 ${
                              isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/40'
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/45 border border-sky-100/50 dark:border-sky-900/30 rounded-xl text-[10.5px] font-black text-sky-700 dark:text-sky-400 font-mono shadow-inner">
                                <Clock className="w-3.5 h-3.5 shrink-0 text-sky-650" />
                                {slot.timeSlot}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{slot.subject}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold italic">
                                  📚 Topic: Daily Class Plan Mapped
                                </p>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs bg-slate-100/60 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                Class {slot.className}-{slot.section}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold font-mono text-slate-605 dark:text-slate-350">
                                🚪 {slot.roomNo || 'Room 101'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                status === 'Current' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 ring-2 ring-blue-300/50 animate-pulse' :
                                status === 'Completed' ? 'bg-emerald-100 text-emerald-805 dark:bg-emerald-950/65 dark:text-emerald-400' :
                                'bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80'
                              }`}>
                                {status === 'Current' ? '● Active' : status === 'Completed' ? '✓ Done' : 'Upcoming'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenClassInfo(`${slot.className}-${slot.section}`, slot.subject, slot.roomNo)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-[10px] font-bold shadow-xs transition-colors"
                                >
                                  Class Details
                                </button>
                                <button
                                  onClick={() => handleQuickActionClick('attendance')}
                                  className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-black shadow-xs transition-colors"
                                >
                                  Roll Call
                                </button>
                                <button
                                  onClick={() => handleOpenLessonPlan(slot.subject)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-[10px] font-bold shadow-xs transition-colors"
                                >
                                  Lesson Plan
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
            </div>

            {/* Bottom Row - 3 Column Grid (Substitutions, Free Periods, Quick Actions) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 1. Substitution Card */}
              <div className="glass-card p-6 rounded-3xl border border-slate-205/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-0.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Substitution Duties
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Substitute schedules or room adjustments today</p>
                </div>

                <div className="space-y-3 flex-grow pt-1">
                  {substitutionSchedule.map((sub) => (
                    <div
                      key={sub.id}
                      className={`p-3 rounded-2xl border ${
                        sub.status.includes('Substituting') ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-150/60' :
                        sub.status.includes('Cancelled') ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-150/60' :
                        'bg-amber-50/30 dark:bg-amber-950/10 border-amber-150/60'
                      } space-y-1.5`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-905 dark:text-white">{sub.period}</span>
                        <span className="font-mono text-[9px] font-bold text-slate-400">{sub.time}</span>
                      </div>
                      <div className="text-[10.5px] font-bold text-slate-650 dark:text-slate-350">
                        <p>{sub.classSection} &bull; {sub.subject}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Room: <span className="font-mono font-bold text-slate-600 dark:text-slate-200">{sub.room}</span></p>
                      </div>
                      <p className={`text-[9.5px] font-black uppercase tracking-wider ${
                        sub.status.includes('Substituting') ? 'text-indigo-600 dark:text-indigo-400' :
                        sub.status.includes('Cancelled') ? 'text-rose-600 dark:text-rose-400' :
                        'text-amber-600 dark:text-amber-400'
                      }`}>
                        {sub.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Free Periods Card */}
              <div className="glass-card p-6 rounded-3xl border border-slate-205/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-0.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-sky-505" /> Available Free Periods
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Periods with no lectures and suggested tasks</p>
                </div>
                
                <div className="space-y-2.5 flex-grow pt-1 max-h-[300px] overflow-y-auto pr-1">
                  {freePeriods.length === 0 ? (
                    <p className="text-xs text-slate-450 dark:text-slate-500 italic font-bold">No free periods today (full workload).</p>
                  ) : (
                    freePeriods.map((slot, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-805/50 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{slot.periodName}</p>
                          <p className="text-[9.5px] font-mono font-bold text-slate-400">{slot.timeSlot}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-sky-100/80 text-sky-800 dark:bg-sky-950/65 dark:text-sky-350 text-[9.5px] font-extrabold text-center shadow-xs">
                          {slot.suggestion}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Quick Actions Card */}
              <div className="glass-card p-6 rounded-3xl border border-slate-205/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-0.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 animate-bounce" /> Workspace Shortcuts
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Quick links to navigate directly to modules</p>
                </div>

                <div className="grid grid-cols-1 gap-2 flex-grow pt-1">
                  <button onClick={() => handleQuickActionClick('students')} className="p-3 rounded-2xl bg-slate-50 hover:bg-sky-50 dark:bg-slate-900 dark:hover:bg-sky-950/40 border border-slate-150 dark:border-slate-800 hover:border-sky-200 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-2.5"><Users className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" /><span className="font-black text-slate-800 dark:text-slate-200 text-xs">View Student List</span></div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  
                  <button onClick={() => handleQuickActionClick('attendance')} className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 border border-slate-150 dark:border-slate-800 hover:border-emerald-200 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-2.5"><UserCheck className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" /><span className="font-black text-slate-800 dark:text-slate-200 text-xs">Mark Attendance</span></div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  
                  <button onClick={() => setShowAllPlansModal(true)} className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 dark:bg-slate-900 dark:hover:bg-purple-950/40 border border-slate-150 dark:border-slate-800 hover:border-purple-200 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-2.5"><BookOpen className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" /><span className="font-black text-slate-800 dark:text-slate-200 text-xs">Lesson Plan List</span></div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  
                  <button onClick={() => handleQuickActionClick('homework')} className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-955/40 border border-slate-150 dark:border-slate-800 hover:border-amber-200 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-2.5"><BookMarked className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" /><span className="font-black text-slate-800 dark:text-slate-200 text-xs">Create Assignment</span></div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h3 className="font-extrabold text-sm text-slate-905 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Weekly Timetable
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('today')} className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold">Today</button>
                <button onClick={handlePrint} className="px-3.5 py-1.5 rounded-xl bg-sky-650 hover:bg-sky-600 text-white font-black text-[11px] flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3 min-w-[125px]">Period & Time</th>
                    {weeklyDays.map(d => <th key={d} className="py-2.5 px-3 text-center min-w-[95px]">{d}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {weeklyTimeSlots.map((slot, pIdx) => {
                    const matchingPeriodSetting = activePeriods.find(p => `${p.startTime} - ${p.endTime}` === slot);
                    const isBreakSlot = matchingPeriodSetting?.periodType === 'Break' || matchingPeriodSetting?.periodType === 'Lunch';
                    if (isBreakSlot) {
                      return (
                        <tr key={slot} className="bg-amber-50/30 dark:bg-amber-950/10 text-amber-800 font-bold">
                          <td className="py-2 px-3 font-mono text-[10.5px]">{slot}</td>
                          <td colSpan={weeklyDays.length} className="py-2 px-3 text-center tracking-widest text-[10.5px]">☕ {matchingPeriodSetting?.periodName || 'Break'}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={slot} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap text-[10.5px]">{slot}</td>
                        {weeklyDays.map(day => {
                          const match = timetable.find(t => t.teacherName === teacherFullName && t.day === day && t.timeSlot === slot);
                          return (
                            <td key={day} className="py-2 px-1 text-center align-middle">
                              {match ? (
                                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border space-y-0.5 text-left mx-auto w-28 shadow-xs border-slate-100 dark:border-slate-700/50">
                                   {(() => {
                                      const globalSub = subjects.find(s => s.name.toLowerCase().trim() === match.subject.toLowerCase().trim());
                                      const codeStr = globalSub?.code ? ` (${globalSub.code.toLowerCase()})` : '';
                                      return (
                                        <p className="font-extrabold text-[11px] text-slate-900 dark:text-white truncate">
                                          {match.subject}{codeStr}
                                        </p>
                                      );
                                    })()}
                                  <p className="text-[9.5px] font-bold text-sky-650 dark:text-sky-400 truncate">Cl. {match.className.replace('Class ', '')}-{match.section}</p>
                                </div>
                              ) : <span className="text-[10px] text-slate-400 italic font-bold">Free</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showLessonPlanModal && selectedLessonPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5"><BookOpen className="w-5 h-5 text-purple-600" /> Lesson Plan</h3>
                <button onClick={() => setShowLessonPlanModal(false)}>✕</button>
              </div>
              <div className="space-y-3.5 text-xs">
                <p className="text-sm font-extrabold">{selectedLessonPlan.subject} &bull; {selectedLessonPlan.topic}</p>
                <p className="text-slate-600 leading-relaxed">{selectedLessonPlan.objective}</p>
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[10px]">Steps</p>
                  <ul className="list-decimal pl-4">{selectedLessonPlan.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                </div>
              </div>
              <button onClick={() => setShowLessonPlanModal(false)} className="w-full py-2 bg-slate-100 rounded-xl font-bold">Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Global Filters */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> {activeTab === 'period-settings' ? 'Period Settings' : activeTab === 'teacher-timetable' ? 'Teachers Timetable' : 'Class Timetable'}
          </h2>

        </div>

        {/* Global Timetable Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Print Button */}
          {activeTab !== 'period-settings' && (
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
              title="Print Timetable"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {[
          { id: 'period-settings', label: 'Period Settings', icon: SlidersHorizontal },
          { id: 'class-timetable', label: 'Class Timetable', icon: Calendar },
          { id: 'teacher-timetable', label: 'Teacher Timetable', icon: User },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TimetableTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CLASS TIMETABLE (WEEKLY GRID) */}
      {activeTab === 'class-timetable' && (
        <div id="printable-content" className="space-y-4">
          <div className="hidden print:block mb-4 text-center border-b pb-4">
            <h1 className="text-2xl font-black">Class Timetable</h1>
            <p className="text-sm font-bold text-slate-600 mt-2">Class: {selectedClass} | Section: {selectedSection}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Selector */}
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={e => {
                    const nextClass = e.target.value;
                    setSelectedClass(nextClass);
                    setSelectedSection('');
                  }}
                  className="appearance-none pr-9 pl-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer shadow-sm"
                >
                  <option value="">Select Class</option>
                  {classOptions.map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Section Selector */}
              <div className="relative">
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="appearance-none pr-9 pl-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer shadow-sm"
                >
                  <option value="">Select Section</option>
                  {sectionOptions.map(section => (
                    <option key={section} value={section}>Section {section}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 no-print">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSaturday}
                  onChange={e => setIncludeSaturday(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                Include Saturday
              </label>

              {!isTeacher && (
                <>
                  <button
                    onClick={handlePublishTimetable}
                    disabled={!selectedClass || !selectedSection}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Publish Timetable
                  </button>
                  <button
                    onClick={() => handleOpenAdd()}
                    disabled={!selectedClass || !selectedSection}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Period Slot
                  </button>
                </>
              )}
            </div>
          </div>

          {!selectedClass || !selectedSection ? (
            <div className="glass-card bg-white dark:bg-slate-900 p-16 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xl">
              <div className="w-16 h-16 mx-auto mb-4 bg-sky-50 dark:bg-sky-950/40 rounded-full flex items-center justify-center border border-sky-100 dark:border-sky-900/60 shadow-sm animate-pulse">
                <SlidersHorizontal className="w-6 h-6 text-sky-650 dark:text-sky-400" />
              </div>
              <h3 className="text-base font-black text-slate-850 dark:text-white">Please Select Class and Section</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Use the Class and Section dropdown filters located in the header above to load the weekly timetable view.
              </p>
            </div>
          ) : (
            <div className="glass-card bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4 min-w-[160px]">Period & Time</th>
                    {days.map(d => (
                      <th key={d} className="py-3.5 px-4 text-center min-w-[160px]">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-medium divide-y divide-slate-100 dark:divide-slate-800/80">
                  {timeSlots.length === 0 ? (
                    <tr>
                      <td colSpan={days.length + 1} className="py-16 text-center text-slate-400 dark:text-slate-500">
                        <p className="text-sm font-bold">No period slots allocated for {selectedClass} - Section {selectedSection}.</p>
                        <p className="text-xs mt-1">Click <span className="font-bold text-sky-600">+ Add Period Slot</span> to allocate subjects to periods.</p>
                      </td>
                    </tr>
                  ) : (
                    timeSlots.map((slot, pIdx) => {
                      const matchingPeriodSetting = activeBranchPeriods.find(p => `${p.startTime} - ${p.endTime}` === slot);
                      const isBreakSlot = matchingPeriodSetting?.periodType === 'Break' || matchingPeriodSetting?.periodType === 'Lunch';

                      if (isBreakSlot) {
                        return (
                          <tr key={slot} className="bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold">
                            <td className="py-3 px-4 font-mono">{slot}</td>
                            <td colSpan={days.length} className="py-3 px-4 text-center uppercase tracking-widest text-[11px]">
                              ☕ {matchingPeriodSetting?.periodName || 'Break Interval'} ({matchingPeriodSetting?.periodType})
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={slot} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                          <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/20">
                            <span className="text-brand-600 dark:text-brand-400 block text-[10px]">
                              {matchingPeriodSetting?.periodName || `Period ${pIdx + 1}`}
                            </span>
                            {slot}
                          </td>
                          {days.map(day => {
                            const match = classTimetable.find(t => t.day === day && t.timeSlot === slot);
                            return (
                              <td key={day} className="py-3 px-2 text-center align-middle">
                                {match ? (
                                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1 relative group text-left mx-auto w-40 hover:shadow-lg hover:border-sky-400 transition-all">
                                    {(() => {
                                      const globalSub = subjects.find(s => s.name.toLowerCase().trim() === match.subject.toLowerCase().trim());
                                      const codeStr = globalSub?.code ? ` (${globalSub.code.toLowerCase()})` : '';
                                      return (
                                        <p className="font-extrabold text-slate-900 dark:text-white truncate">
                                          {match.subject}{codeStr}
                                        </p>
                                      );
                                    })()}
                                    <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400 truncate">{match.teacherName}</p>
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {match.roomNo || 'Classroom'}
                                      </span>
                                      {!isTeacher && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                                          <button onClick={() => handleOpenEdit(match)} className="p-1 text-sky-600 hover:text-sky-700"><Edit className="w-3.5 h-3.5" /></button>
                                          <button onClick={() => setDeletingSlot(match)} className="p-1 text-rose-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  !isTeacher && (
                                    <button
                                      onClick={() => handleOpenAdd(day, slot)}
                                      className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-sky-600 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] font-bold transition-all no-print"
                                    >
                                      + Assign Period
                                    </button>
                                  )
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: PERIOD SETTINGS */}
      {activeTab === 'period-settings' && (() => {
        // Master periods
        const masterPeriods = periodSettings.filter(p => !p.className && p.status === 'Active')
          .sort((a, b) => a.sequence - b.sequence);

        // Class-specific periods
        const classSpecificPeriods = periodSettings.filter(p => 
          p.className === selectedClass && 
          p.section === selectedSection && 
          p.status === 'Active'
        ).sort((a, b) => a.sequence - b.sequence);

        const hasCustomPeriods = classSpecificPeriods.length > 0;
        const activePeriodsToDisplay = classSpecificPeriods;

        // All classes & sections
        const allClassesAndSections: { className: string; section: string }[] = [];
        academicClasses.forEach(c => {
          (c.sections || ['A']).forEach(sec => {
            allClassesAndSections.push({ className: c.name, section: sec });
          });
        });

        // Configured / remaining
        const configuredClassSections = allClassesAndSections.filter(cs =>
          periodSettings.some(p => p.className === cs.className && p.section === cs.section && p.status === 'Active')
        );
        const remainingClassSections = allClassesAndSections.filter(cs =>
          !periodSettings.some(p => p.className === cs.className && p.section === cs.section && p.status === 'Active')
        );

        return (
          <div className="space-y-6 text-left">
            {/* Split layout: Left (Master Template Config), Right (Status Tracker & Quick Actions) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1 & 2: Master Template Setup */}
              <div className="lg:col-span-2 glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-sky-600" />
                      <span>Master Period Schedule Template</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingMaster(true);
                      setPeriodFormData({
                        periodName: `Period ${masterPeriods.length + 1}`,
                        startTime: '08:30 AM',
                        endTime: '09:15 AM',
                        sequence: masterPeriods.length + 1,
                        periodType: 'Teaching',
                        status: 'Active'
                      });
                      setIsPeriodModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all shrink-0 self-start sm:self-center"
                  >
                    <Plus className="w-4 h-4" /> Add Template Period
                  </button>
                </div>

                {masterPeriods.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">No master periods defined yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click the button above to add the first period to your schedule.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {masterPeriods.map(p => (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-2xl border transition-all flex justify-between items-center ${
                          p.periodType === 'Break' || p.periodType === 'Lunch'
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">{p.periodName}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              p.periodType === 'Teaching' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            }`}>
                              {p.periodType}
                            </span>
                          </div>
                          <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 mt-1">
                            {p.startTime} - {p.endTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setIsEditingMaster(true);
                              setPeriodFormData(p);
                              if (!['Teaching', 'Break', 'Lunch'].includes(p.periodType)) {
                                setCustomPeriodType(p.periodType);
                                setPeriodFormData({ ...p, periodType: 'Other' });
                              }
                              setIsPeriodModalOpen(true);
                            }} 
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
                            title="Edit Period Template"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setDeletingPeriodSetting(p)} 
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Period Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 3: Bulk Actions & Coverage Tracker */}
              <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2.5 dark:border-slate-800">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Schedule Allocation
                  </h3>
                  
                  {/* Allocation Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Periods Assigned</span>
                      <span>{configuredClassSections.length} / {allClassesAndSections.length} Class Sections</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(configuredClassSections.length / (allClassesAndSections.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Assigned classes list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500">Assigned Timetable for Classes ({configuredClassSections.length}):</span>
                    {configuredClassSections.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No classes configured yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin">
                        {configuredClassSections.map(cs => (
                          <span key={`${cs.className}-${cs.section}`} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                            {cs.className} ({cs.section})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Remaining classes list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500">Remaining Timetable for Classes ({remainingClassSections.length}):</span>
                    {remainingClassSections.length === 0 ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">🎉 All classes & sections are fully configured!</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin">
                        {remainingClassSections.map(cs => (
                          <span key={`${cs.className}-${cs.section}`} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                            {cs.className} ({cs.section})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsBulkAssignModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 mt-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-4 h-4" /> Bulk Assign
                </button>
              </div>
            </div>

            {/* Section 2: Active Class periods override grid */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3 dark:border-slate-800">
                {/* Left Side: Title & Badge */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <School className="w-5 h-5 text-sky-600" />
                    <span>Class Period Schedule</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasCustomPeriods ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-400 border border-emerald-200">
                        🟢 Custom Class Schedule (Overrides Master)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950/45 dark:text-rose-400 border border-rose-200">
                        🔴 Timetable Not Configured (Unassigned)
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Filters with Labels & Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Class Filter */}
                  <div className="flex items-center gap-1.5 no-print">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Class:</span>
                    <div className="relative">
                      <select
                        value={selectedClass}
                        onChange={e => {
                          const nextClass = e.target.value;
                          setSelectedClass(nextClass);
                          setSelectedSection('');
                        }}
                        className="appearance-none pr-9 pl-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer shadow-sm"
                      >
                        <option value="">Select Class</option>
                        {classOptions.map(className => (
                          <option key={className} value={className}>{className}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Section Filter */}
                  <div className="flex items-center gap-1.5 no-print">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Section:</span>
                    <div className="relative">
                      <select
                        value={selectedSection}
                        onChange={e => setSelectedSection(e.target.value)}
                        className="appearance-none pr-9 pl-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer shadow-sm"
                      >
                        <option value="">Select Section</option>
                        {sectionOptions.map(section => (
                          <option key={section} value={section}>Section {section}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    {hasCustomPeriods && (
                      <button
                        onClick={() => {
                          resetClassPeriods(selectedClass, selectedSection);
                          addToast('success', 'Reset Completed', `Reverted ${selectedClass} - Section ${selectedSection} to Master Template.`);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        Reset / Clear Overrides
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsEditingMaster(false);
                        const len = activePeriodsToDisplay?.length || 0;
                        setPeriodFormData({
                          periodName: `Period ${len + 1}`,
                          startTime: '08:30 AM',
                          endTime: '09:15 AM',
                          sequence: len + 1,
                          periodType: 'Teaching',
                          status: 'Active'
                        });
                        setIsPeriodModalOpen(true);
                      }}
                      disabled={!selectedClass || !selectedSection}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Class Period
                    </button>
                  </div>
                </div>
              </div>

              {!selectedClass || !selectedSection ? (
                <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-905/10">
                  <div className="w-12 h-12 mx-auto mb-3 bg-sky-50 dark:bg-sky-950/40 rounded-full flex items-center justify-center border border-sky-100 dark:border-sky-900/60 shadow-sm animate-pulse">
                    <SlidersHorizontal className="w-5 h-5 text-sky-650 dark:text-sky-400" />
                  </div>
                  <p className="text-sm font-black text-slate-850 dark:text-white">Please Select Class and Section</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Use the Class and Section dropdown filters located in the header above to load the schedule details.
                  </p>
                </div>
              ) : !hasCustomPeriods ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-905/10">
                  <SlidersHorizontal className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">No period schedule configured for {selectedClass} - Section {selectedSection}</p>
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                    Configure periods specifically for this class-section or assign the Master Template layout below.
                  </p>
                  <div className="flex gap-2.5 justify-center mt-4">
                    <button
                      onClick={() => {
                        bulkAssignPeriods([`${selectedClass}-${selectedSection}`]);
                        addToast('success', 'Template Applied', `Successfully copied Master Template to ${selectedClass}-${selectedSection}.`);
                      }}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Apply Master Template
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activePeriodsToDisplay.map(p => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      p.periodType === 'Break' || p.periodType === 'Lunch'
                        ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">{p.periodName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.periodType === 'Teaching' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        }`}>
                          {p.periodType}
                        </span>
                        <button 
                          onClick={() => {
                            setIsEditingMaster(false);
                            setPeriodFormData(p);
                            if (!['Teaching', 'Break', 'Lunch'].includes(p.periodType)) {
                              setCustomPeriodType(p.periodType);
                              setPeriodFormData({ ...p, periodType: 'Other' });
                            }
                            setIsPeriodModalOpen(true);
                          }} 
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-750 rounded text-slate-500 hover:text-sky-600 cursor-pointer"
                          title="Edit Class Period"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeletePeriod(p)} 
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-750 rounded text-slate-500 hover:text-rose-600 cursor-pointer"
                          title="Delete Class Period"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                      {p.startTime} - {p.endTime}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2">Sequence: #{p.sequence}</p>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB 3: TEACHER TIMETABLE */}
      {activeTab === 'teacher-timetable' && (
        <div id="printable-content" className="space-y-6">
          <div className="hidden print:block mb-4 text-center border-b pb-4">
            <h1 className="text-2xl font-black">Teacher Timetable</h1>
            <p className="text-sm font-bold text-slate-600 mt-2">Teacher: {selectedTeacherName} | Year: {academicYear}</p>
          </div>
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 no-print">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Teacher:</label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none flex items-center justify-between gap-2 shadow-xs cursor-pointer text-left min-w-[240px]"
                >
                  <span>
                    {selectedTeacherName 
                      ? (() => {
                          const match = teachingStaff.find(st => `${st.firstName} ${st.lastName}` === selectedTeacherName);
                          if (match) {
                            const empId = match.empId || match.id;
                            const dept = match.department || 'Faculty';
                            return `${selectedTeacherName} (${empId}) - ${dept}`;
                          }
                          return selectedTeacherName;
                        })()
                      : "Select Teacher"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {isTeacherDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2.5 space-y-2 max-h-60 overflow-y-auto min-w-[280px]">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search teacher or employee ID..."
                        value={teacherSearchQuery}
                        onChange={e => setTeacherSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none placeholder:text-slate-400 focus:border-sky-500"
                        onClick={e => e.stopPropagation()}
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    
                    <div className="space-y-0.5">
                      {teachingStaff.filter(st => {
                        const name = `${st.firstName} ${st.lastName}`;
                        const empId = st.empId || st.id;
                        const dept = st.department || 'Faculty';
                        const query = teacherSearchQuery.toLowerCase();
                        return name.toLowerCase().includes(query) ||
                          empId.toLowerCase().includes(query) ||
                          dept.toLowerCase().includes(query);
                      }).length === 0 ? (
                        <p className="text-[10px] text-slate-400 text-center py-2">No matching teachers found</p>
                      ) : (
                        teachingStaff
                          .filter(st => {
                            const name = `${st.firstName} ${st.lastName}`;
                            const empId = st.empId || st.id;
                            const dept = st.department || 'Faculty';
                            const query = teacherSearchQuery.toLowerCase();
                            return name.toLowerCase().includes(query) ||
                              empId.toLowerCase().includes(query) ||
                              dept.toLowerCase().includes(query);
                          })
                          .map(st => {
                            const name = `${st.firstName} ${st.lastName}`;
                            const empId = st.empId || st.id;
                            const dept = st.department || 'Faculty';
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTeacherName(name);
                                  setIsTeacherDropdownOpen(false);
                                  setTeacherSearchQuery('');
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                                  selectedTeacherName === name
                                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span>{name} ({empId}) - {dept}</span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Auto Generated from Published Timetables</span>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
              Teacher Timetable: {selectedTeacherName}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {baseDays.map(day => {
                const teacherSlots = timetable.filter(t => t.teacherName === selectedTeacherName && t.day === day);
                let displaySlots = teacherSlots;
                
                // Real slots from database/state only

                return (
                  <div key={day} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b pb-2 border-slate-200 dark:border-slate-700">
                      {day}
                    </h4>
                    {displaySlots.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No assigned periods</p>
                    ) : (
                      displaySlots.map(st => (
                        <div key={st.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 relative overflow-hidden">
                          <p className="font-bold text-xs text-slate-900 dark:text-white">{st.subject}</p>
                          <p className="text-[10px] text-brand-600 font-bold">{st.className}-{st.section}</p>
                          <p className="text-[10px] font-mono text-slate-400">{st.timeSlot}</p>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* Add Period Setting Modal */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Period</h3>
              <button onClick={() => setIsPeriodModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPeriodSettingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Period Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Period 7 or Afternoon Break"
                  value={periodFormData.periodName}
                  onChange={e => setPeriodFormData({ ...periodFormData, periodName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Start Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="02:00 PM"
                    value={periodFormData.startTime}
                    onChange={e => setPeriodFormData({ ...periodFormData, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">End Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="02:45 PM"
                    value={periodFormData.endTime}
                    onChange={e => setPeriodFormData({ ...periodFormData, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Period Type *</label>
                <select
                  value={periodFormData.periodType}
                  onChange={e => setPeriodFormData({ ...periodFormData, periodType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                >
                  <option value="Teaching">Teaching Period</option>
                  <option value="Break">Break</option>
                  <option value="Lunch">Lunch Break</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {periodFormData.periodType === 'Other' && (
                <div>
                  <label className="block font-bold mb-1">Custom Period Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assembly, Extracurricular"
                    value={customPeriodType}
                    onChange={e => setCustomPeriodType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsPeriodModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold shadow-md">Add Period</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Period Schedule Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 text-left">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Assign Master Schedule to Classes</h3>
                  <p className="text-[11px] text-slate-500 font-bold">Clone the master period template directly to the selected classes & sections.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsBulkAssignModalOpen(false);
                  setBulkSelectedClasses([]);
                  setBulkSearchQuery('');
                }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
                       {/* Selection Options & Class List (Remaining Only) */}
            {(() => {
              const remainingList: { className: string; section: string; key: string }[] = [];
              academicClasses.forEach(c => {
                (c.sections || ['A']).forEach(sec => {
                  const hasCustom = periodSettings.some(p => p.className === c.name && p.section === sec && p.status === 'Active');
                  if (!hasCustom) {
                    remainingList.push({ className: c.name, section: sec, key: `${c.name}-${sec}` });
                  }
                });
              });

              // Filter based on search query
              const filteredList = remainingList.filter(item => 
                item.className.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
                item.section.toLowerCase().includes(bulkSearchQuery.toLowerCase())
              );

              return (
                <>
                  {/* Search bar */}
                  {remainingList.length > 0 && (
                    <div className="relative no-print mt-2">
                      <input
                        type="text"
                        placeholder="Search class or section..."
                        value={bulkSearchQuery}
                        onChange={e => setBulkSearchQuery(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs font-bold outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-between items-center no-print">
                    {remainingList.length > 0 && (
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                        Showing {filteredList.length} of {remainingList.length} remaining
                      </span>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const keys = filteredList.map(item => item.key);
                          setBulkSelectedClasses(prev => Array.from(new Set([...prev, ...keys])));
                        }}
                        disabled={filteredList.length === 0}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Select All Shown
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const keysToRemove = filteredList.map(item => item.key);
                          setBulkSelectedClasses(prev => prev.filter(k => !keysToRemove.includes(k)));
                        }}
                        disabled={filteredList.length === 0}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Deselect All Shown
                      </button>
                    </div>
                  </div>

                  {/* Class and Section List */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[45vh] overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/55 dark:bg-slate-950/10 scrollbar-thin">
                    {remainingList.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                        <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold">All classes & sections are fully configured!</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">There are no remaining classes that need a template assigned.</p>
                      </div>
                    ) : filteredList.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                        <SlidersHorizontal className="w-8 h-8 text-slate-355 mx-auto mb-2" />
                        <p className="text-xs font-bold">No matching classes or sections found</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search query.</p>
                      </div>
                    ) : (
                      filteredList.map(item => {
                        const isChecked = bulkSelectedClasses.includes(item.key);
                        return (
                          <label
                            key={item.key}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                              isChecked 
                                ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setBulkSelectedClasses(prev => [...prev, item.key]);
                                } else {
                                  setBulkSelectedClasses(prev => prev.filter(k => k !== item.key));
                                }
                              }}
                              className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{item.className}</p>
                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">Section {item.section}</p>
                              <span className="inline-block text-[8px] font-black uppercase tracking-wider mt-1.5 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
                                Remaining
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">
                Selected: <span className="text-sky-600 dark:text-sky-400 font-extrabold">{bulkSelectedClasses.length}</span> Class Sections
              </span>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsBulkAssignModalOpen(false);
                    setBulkSelectedClasses([]);
                    setBulkSearchQuery('');
                  }} 
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveBulkAssign}
                  disabled={bulkSelectedClasses.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Apply & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Apply Suggestion Toast/Banner (When template is edited/created) */}
      {showApplySuggestion && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 rounded-3xl p-4 shadow-2xl flex gap-3.5 items-start text-left animate-in slide-in-from-bottom-5">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
            <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Apply Updates to Classes?</h4>
            <p className="text-[11px] text-slate-500 font-bold mt-1">You updated the Master Period template. Would you like to update your classes and sections too?</p>
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={() => {
                  setShowApplySuggestion(false);
                  setIsBulkAssignModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer"
              >
                Yes, Assign Now
              </button>
              <button 
                onClick={() => setShowApplySuggestion(false)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Period Allocation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSlot ? 'Edit Period Allocation' : 'Add Class Period Allocation'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationErrors.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs space-y-1 font-bold">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-200 font-extrabold mb-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Validation Engine Conflicts ({validationErrors.length})</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 font-normal">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Class *</label>
                  <select
                    required
                    value={formData.className}
                    onChange={e => {
                      const nextClass = e.target.value;
                      const nextSections = getSectionsForClass(nextClass);
                      const nextClsObj = academicClasses.find(c => c.name.toLowerCase().trim() === nextClass.toLowerCase().trim());
                      const nextAssigned = nextClsObj?.subjects || [];
                      const nextSub = nextAssigned[0] || subjects[0]?.name || '';
                      setFormData({
                        ...formData,
                        className: nextClass,
                        section: nextSections.includes(formData.section || '') ? formData.section : nextSections[0] || 'A',
                        subject: nextSub
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  >
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Section *</label>
                  <select
                    required
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  >
                    {getSectionsForClass(formData.className).map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Day *</label>
                  <select
                    value={formData.day}
                    onChange={e => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 flex items-center justify-between">
                  <span>Subject * (Loaded from Subject Mapping)</span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                    {formData.className} Mapping
                  </span>
                </label>
                
                <div className="relative">
                  <button
                    type="button"
                    disabled={availableClassSubjects.length === 0}
                    onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none flex items-center justify-between shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <span>
                      {formData.subject 
                        ? (() => {
                            const sub = availableClassSubjects.find(s => s.name === formData.subject);
                            const codeStr = sub?.code ? ` (${sub.code.toLowerCase()})` : '';
                            return `${formData.subject}${codeStr}`;
                          })()
                        : "Select Subject"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {isSubjectDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2.5 space-y-2 max-h-60 overflow-y-auto">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search subject..."
                          value={subjectSearchQuery}
                          onChange={e => setSubjectSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none placeholder:text-slate-400 focus:border-sky-500"
                          onClick={e => e.stopPropagation()}
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      
                      <div className="space-y-0.5">
                        {availableClassSubjects.filter(sub => 
                          sub.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
                          (sub.code && sub.code.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
                        ).length === 0 ? (
                          <p className="text-[10px] text-slate-400 text-center py-2">No matching subjects found</p>
                        ) : (
                          availableClassSubjects
                            .filter(sub => 
                              sub.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
                              (sub.code && sub.code.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
                            )
                            .map(sub => {
                              const codeStr = sub.code ? ` (${sub.code.toLowerCase()})` : '';
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, subject: sub.name });
                                    setIsSubjectDropdownOpen(false);
                                    setSubjectSearchQuery('');
                                  }}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                                    formData.subject === sub.name
                                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span>{sub.name}{codeStr}</span>
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {availableClassSubjects.length === 0 ? (
                  <p className="text-[10px] text-rose-600 dark:text-rose-450 mt-1.5 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 fill-rose-50" /> No subjects assigned to {formData.className} in Class Management.
                  </p>
                ) : (
                  <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1.5 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Loaded {availableClassSubjects.length} subject(s) assigned to {formData.className} in Class Management
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1 flex items-center justify-between">
                  <span>Assigned Teacher (Auto Loaded from Teacher Assignment)</span>
                  <span className="text-[10px] text-sky-600 font-normal">Read Only</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={autoAssignedTeacher}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-not-allowed"
                />
                {autoAssignedTeacher === 'No Teacher Assigned' && formData.subject && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-450 mt-1.5 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 fill-amber-50" /> No teacher assigned to this subject in Class Management.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1">Room / Lab No (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Room 101 or Physics Lab"
                  value={formData.roomNo || ''}
                  onChange={e => setFormData({ ...formData, roomNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md"
                >
                  {editingSlot ? 'Save Period Changes' : 'Assign Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingSlot}
        title="Delete Period Allocation"
        message={`Are you sure you want to delete ${deletingSlot?.subject} on ${deletingSlot?.day}?`}
        onConfirm={() => {
          if (deletingSlot) {
            deleteTimetableSlot(deletingSlot.id);
            addToast('success', 'Period Slot Removed');
            setDeletingSlot(null);
          }
        }}
        onCancel={() => setDeletingSlot(null)}
      />

      <ConfirmModal
        isOpen={!!deletingPeriodSetting}
        title="Delete Period Setting"
        message={`Are you sure you want to delete "${deletingPeriodSetting?.periodName}"?`}
        onConfirm={() => {
          if (deletingPeriodSetting) {
            deletePeriodSetting(deletingPeriodSetting.id);
            addToast('success', 'Period Setting Removed');
            setDeletingPeriodSetting(null);
          }
        }}
        onCancel={() => setDeletingPeriodSetting(null)}
      />
    </div>
  );
};

export default TimetableView;
