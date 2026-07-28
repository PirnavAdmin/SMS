import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock, Plus, Edit, Trash2, X, ChevronDown, Calendar, Printer,
  Copy, User, BookOpen, AlertTriangle, Layers, SlidersHorizontal, Check, RefreshCw,
  Send, Lock, FileSpreadsheet, ShieldAlert, CheckCircle2, Info
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { TimetableSlot, PeriodSetting, TeacherAssignment } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

type TimetableTab = 'class-timetable' | 'period-settings' | 'teacher-timetable' | 'student-timetable' | 'copy-timetable';

export const TimetableView: React.FC = () => {
  const {
    timetable, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot, publishClassTimetable,
    periodSettings, addPeriodSetting, updatePeriodSetting, deletePeriodSetting,
    teacherAssignments, addTeacherAssignment, updateTeacherAssignment, deleteTeacherAssignment,
    staff, academicClasses, subjects, holidays
  } = useData();
  const { user, role, selectedBranch, setSelectedBranch } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<TimetableTab>('class-timetable');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [includeSaturday, setIncludeSaturday] = useState(false);

  // Filter staff to Teaching Staff only
  const teachingStaff = useMemo(() => 
    staff.filter(s => !s.employeeCategory || s.employeeCategory === 'Teacher'),
    [staff]
  );

  const isTeacher = role === 'Teacher';
  const currentTeacher = teachingStaff.find(s => s.email === user?.email) || (isTeacher ? {
    firstName: user?.name || 'Sarah',
    lastName: 'Jenkins'
  } : null);
  const teacherFullName = currentTeacher ? `${currentTeacher.firstName} ${currentTeacher.lastName}` : '';

  const classOptions = useMemo(() => academicClasses.map(c => c.name), [academicClasses]);
  const getSectionsForClass = (className?: string) => academicClasses.find(c => c.name === className)?.sections || ['A', 'B'];

  const [selectedClass, setSelectedClass] = useState(academicClasses[0]?.name || 'Class 10');
  const [selectedSection, setSelectedSection] = useState(getSectionsForClass(academicClasses[0]?.name)[0] || 'A');

  // Teacher Timetable Filter State
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>(
    teacherFullName || (teachingStaff[0] ? `${teachingStaff[0].firstName} ${teachingStaff[0].lastName}` : 'Jonathan Miller')
  );

  // Copy Timetable State
  const [copySourceClass, setCopySourceClass] = useState(selectedClass);
  const [copySourceSection, setCopySourceSection] = useState(selectedSection);
  const [copyTargetClass, setCopyTargetClass] = useState(selectedClass);
  const [copyTargetSection, setCopyTargetSection] = useState(selectedSection === 'A' ? 'B' : 'A');

  // New Period Setting Form Modal State
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodFormData, setPeriodFormData] = useState<Partial<PeriodSetting>>({
    periodName: 'Period 7',
    startTime: '02:00 PM',
    endTime: '02:45 PM',
    sequence: 9,
    periodType: 'Teaching',
    status: 'Active'
  });

  // Modals & Forms for Period Allocation Slots
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<TimetableSlot | null>(null);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const baseDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const days = includeSaturday ? [...baseDays, 'Saturday'] : baseDays;

  const sectionOptions = useMemo(
    () => academicClasses.find(c => c.name === selectedClass)?.sections || ['A', 'B'],
    [academicClasses, selectedClass]
  );

  useEffect(() => {
    if (sectionOptions.length > 0 && !sectionOptions.includes(selectedSection)) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [sectionOptions, selectedSection]);

  // Active Period Settings for current Branch & Academic Year
  const activeBranchPeriods = useMemo(() => {
    const matched = periodSettings.filter(p => p.status === 'Active');
    return matched.sort((a, b) => a.sequence - b.sequence);
  }, [periodSettings]);

  const parseSortable = (ts: string) => {
    const match = ts.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 9999;
    let [_, h, m, p] = match;
    let hr = parseInt(h, 10);
    if (p.toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (p.toUpperCase() === 'AM' && hr === 12) hr = 0;
    return hr * 60 + parseInt(m, 10);
  };

  const parseTo24 = (timeStr: string) => {
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

  // Dynamically load assigned subjects for the selected class from Class Management
  const availableClassSubjects = useMemo(() => {
    const targetClass = formData.className || '';
    if (!targetClass) return subjects;

    // Find class configuration in academicClasses
    const clsObj = academicClasses.find(c => c.name.toLowerCase().trim() === targetClass.toLowerCase().trim());
    
    // Check if class has assigned subjects from Class Management
    const assignedNames = clsObj?.subjects || [];

    // Also collect subjects assigned in Teacher Assignments for this class
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
          weeklyPeriodCount: globalSub?.weeklyPeriodCount || 5
        };
      });
    }

    return subjects;
  }, [academicClasses, formData.className, teacherAssignments, subjects]);

  // Auto load assigned teacher whenever subject changes in form
  const autoAssignedTeacher = useMemo(() => {
    if (!formData.subject || !formData.className || !formData.section) return '';
    const assigned = teacherAssignments.find(
      ta => ta.className === formData.className && ta.section === formData.section && ta.subject === formData.subject
    );
    if (assigned) return assigned.teacherName;
    // Fallback: search staff with matching subject
    const fallbackStaff = teachingStaff.find(s => s.assignedSubjects?.includes(formData.subject || ''));
    if (fallbackStaff) return `${fallbackStaff.firstName} ${fallbackStaff.lastName}`;
    return 'Jonathan Miller';
  }, [formData.subject, formData.className, formData.section, teacherAssignments, teachingStaff]);

  useEffect(() => {
    if (autoAssignedTeacher && formData.subject) {
      setFormData(prev => ({ ...prev, teacherName: autoAssignedTeacher }));
    }
  }, [autoAssignedTeacher, formData.subject]);

  // STRICT VALIDATION ENGINE
  const runValidationEngine = (testSlot: Partial<TimetableSlot>, currentId?: string): string[] => {
    const errors: string[] = [];
    if (!testSlot.day || !testSlot.timeSlot || !testSlot.className || !testSlot.section || !testSlot.subject) {
      return errors;
    }

    // 1. Period Type Restriction (Break / Lunch check)
    const periodObj = activeBranchPeriods.find(p => `${p.startTime} - ${p.endTime}` === testSlot.timeSlot);
    if (periodObj && (periodObj.periodType === 'Break' || periodObj.periodType === 'Lunch')) {
      errors.push(`Invalid Period: Subject cannot be assigned during ${periodObj.periodName} (${periodObj.periodType}).`);
    }

    // 2. Duplicate Period in Same Class & Section
    const duplicateSlot = timetable.find(t =>
      t.id !== currentId &&
      t.className === testSlot.className &&
      t.section === testSlot.section &&
      t.day === testSlot.day &&
      t.timeSlot === testSlot.timeSlot
    );
    if (duplicateSlot) {
      errors.push(`Duplicate Allocation: ${testSlot.className}-${testSlot.section} already has ${duplicateSlot.subject} assigned at ${testSlot.timeSlot} on ${testSlot.day}.`);
    }

    // 3. Teacher Conflict (same teacher in two classes at same period)
    if (testSlot.teacherName) {
      const teacherConflict = timetable.find(t =>
        t.id !== currentId &&
        t.teacherName === testSlot.teacherName &&
        t.day === testSlot.day &&
        t.timeSlot === testSlot.timeSlot
      );
      if (teacherConflict) {
        errors.push(`Teacher Conflict: ${testSlot.teacherName} is already assigned to teach ${teacherConflict.className}-${teacherConflict.section} at ${testSlot.timeSlot} on ${testSlot.day}.`);
      }
    }

    // 4. Weekly Subject Period Limit (Subject Mapping check)
    const subjObj = subjects.find(s => s.name === testSlot.subject);
    const weeklyLimit = subjObj?.weeklyPeriodCount || 5;
    const existingSubjectCount = timetable.filter(t =>
      t.id !== currentId &&
      t.className === testSlot.className &&
      t.section === testSlot.section &&
      t.subject === testSlot.subject
    ).length;
    if (existingSubjectCount >= weeklyLimit) {
      errors.push(`Subject Weekly Limit Exceeded: ${testSlot.subject} has a maximum limit of ${weeklyLimit} periods/week for ${testSlot.className}-${testSlot.section} (${existingSubjectCount} already assigned).`);
    }

    // 5. Teacher Daily Workload Limit Check
    if (testSlot.teacherName) {
      const teacherObj = teachingStaff.find(s => `${s.firstName} ${s.lastName}` === testSlot.teacherName);
      const dailyLimit = teacherObj?.dailyWorkloadLimit || 5;
      const teacherDayCount = timetable.filter(t =>
        t.id !== currentId &&
        t.teacherName === testSlot.teacherName &&
        t.day === testSlot.day
      ).length;
      if (teacherDayCount >= dailyLimit) {
        errors.push(`Teacher Daily Workload Limit: ${testSlot.teacherName} exceeds the maximum limit of ${dailyLimit} periods on ${testSlot.day}.`);
      }

      // 6. Teacher Weekly Workload Limit Check
      const weeklyLimit = teacherObj?.weeklyWorkloadLimit || 24;
      const teacherWeekCount = timetable.filter(t =>
        t.id !== currentId &&
        t.teacherName === testSlot.teacherName
      ).length;
      if (teacherWeekCount >= weeklyLimit) {
        errors.push(`Teacher Weekly Workload Limit: ${testSlot.teacherName} exceeds the total maximum limit of ${weeklyLimit} periods/week.`);
      }
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
      roomNo: 'Room 101',
      status: 'Draft' as 'Draft' | 'Published' | 'Archived'
    };
    setFormData(initialSlot);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: TimetableSlot) => {
    setEditingSlot(t);
    setValidationErrors([]);
    setFormData(t);
    const parts = t.timeSlot.split('-');
    setStartTime(parseTo24(parts[0]?.trim() || '08:30 AM'));
    setEndTime(parseTo24(parts[1]?.trim() || '09:15 AM'));
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
    addToast('success', 'Timetable Published', `Published timetable for ${selectedClass}-${selectedSection}. Visible to teachers & students.`);
  };

  const handleAddPeriodSettingSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!periodFormData.periodName || !periodFormData.startTime || !periodFormData.endTime) return;
    addPeriodSetting({
      academicYear,
      branch: selectedBranch || 'Main Campus',
      periodName: periodFormData.periodName,
      startTime: periodFormData.startTime,
      endTime: periodFormData.endTime,
      sequence: Number(periodFormData.sequence || 9),
      periodType: periodFormData.periodType || 'Teaching',
      status: 'Active'
    });
    setIsPeriodModalOpen(false);
    addToast('success', 'Period Configured', `Added ${periodFormData.periodName} to Period Settings`);
  };

  const handleCopyTimetable = () => {
    const sourceSlots = timetable.filter(t => t.className === copySourceClass && t.section === copySourceSection);
    if (sourceSlots.length === 0) {
      addToast('warning', 'No Source Schedule', `No timetable slots found for ${copySourceClass}-${copySourceSection}.`);
      return;
    }

    let copiedCount = 0;
    let conflictCount = 0;

    sourceSlots.forEach(slot => {
      const newSlot = {
        ...slot,
        className: copyTargetClass,
        section: copyTargetSection,
        status: 'Draft' as 'Draft' | 'Published' | 'Archived'
      };
      delete (newSlot as any).id;

      const errors = runValidationEngine(newSlot);
      if (errors.length === 0) {
        addTimetableSlot(newSlot as Omit<TimetableSlot, 'id'>);
        copiedCount++;
      } else {
        conflictCount++;
      }
    });

    if (copiedCount > 0) {
      addToast('success', 'Timetable Copied', `Successfully copied ${copiedCount} periods to ${copyTargetClass}-${copyTargetSection}.`);
    }
    if (conflictCount > 0) {
      addToast('info', 'Skipped Conflicts', `${conflictCount} period slots were skipped due to schedule conflicts.`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Global Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 dark:bg-brand-500/20 rounded-2xl shrink-0">
            <Clock className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Class Timetable
            </h2>
          </div>
        </div>

        {/* Global Timetable Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Academic Year Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-900 dark:text-white">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          {/* Branch Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-900 dark:text-white">
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="Main Campus">Main Campus</option>
              <option value="North Branch">North Branch</option>
              <option value="West Campus">West Campus</option>
            </select>
          </div>

          {/* Class Selector */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={e => {
                const nextClass = e.target.value;
                setSelectedClass(nextClass);
                setSelectedSection(getSectionsForClass(nextClass)[0] || 'A');
              }}
              className="appearance-none pr-9 pl-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer shadow-sm"
            >
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
              {sectionOptions.map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Print Timetable"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {[
          { id: 'class-timetable', label: 'Class Timetable', icon: Calendar },
          { id: 'period-settings', label: 'Period Settings', icon: SlidersHorizontal },
          { id: 'teacher-timetable', label: 'Teacher Timetable (Auto Generated)', icon: User },
          { id: 'student-timetable', label: 'Student Timetable (Auto Generated)', icon: BookOpen },
          { id: 'copy-timetable', label: 'Copy Timetable', icon: Copy },
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold text-xs">
                {selectedClass} - Section {selectedSection}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 ${
                timetableStatus === 'Published'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}>
                {timetableStatus === 'Published' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-amber-600" />}
                Status: {timetableStatus}
              </span>
              <span className="text-xs text-slate-500 font-medium hidden md:inline">Academic Year: {academicYear}</span>
            </div>

            <div className="flex items-center gap-3">
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
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Publish Timetable
                  </button>
                  <button
                    onClick={() => handleOpenAdd()}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Period Slot
                  </button>
                </>
              )}
            </div>
          </div>

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
                                    <p className="font-extrabold text-slate-900 dark:text-white truncate">{match.subject}</p>
                                    <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400 truncate">{match.teacherName}</p>
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {match.roomNo || 'Classroom'}
                                      </span>
                                      {!isTeacher && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                      className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-sky-600 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] font-bold transition-all"
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
        </div>
      )}

      {/* TAB 2: PERIOD SETTINGS */}
      {activeTab === 'period-settings' && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Period Settings Configuration</h3>
              <p className="text-xs text-slate-500">Foundation for school timetable for {academicYear} • {selectedBranch || 'Main Campus'}</p>
            </div>
            <button
              onClick={() => setIsPeriodModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add New Period Setting
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeBranchPeriods.map(p => (
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
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    p.periodType === 'Teaching' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {p.periodType}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  {p.startTime} - {p.endTime}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">Sequence: #{p.sequence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER TIMETABLE (AUTO GENERATED) */}
      {activeTab === 'teacher-timetable' && (
        <div className="space-y-6">
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Teacher:</label>
              <select
                value={selectedTeacherName}
                onChange={e => setSelectedTeacherName(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                {teachingStaff.map(st => {
                  const name = `${st.firstName} ${st.lastName}`;
                  return <option key={st.id} value={name}>{name} ({st.department || 'Faculty'})</option>;
                })}
              </select>
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
                return (
                  <div key={day} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b pb-2 border-slate-200 dark:border-slate-700">
                      {day}
                    </h4>
                    {teacherSlots.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No assigned periods</p>
                    ) : (
                      teacherSlots.map(st => (
                        <div key={st.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
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

      {/* TAB 4: STUDENT TIMETABLE (AUTO GENERATED) */}
      {activeTab === 'student-timetable' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Student Timetable: {selectedClass} - Section {selectedSection}
                </h3>
                <p className="text-xs text-slate-500">Auto-generated class schedule for students</p>
              </div>
              <button onClick={handlePrint} className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-2 shadow-md">
                <Printer className="w-4 h-4" /> Print Student Timetable
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {baseDays.map(day => {
                const daySlots = classTimetable.filter(t => t.day === day).sort((a, b) => parseSortable(a.timeSlot) - parseSortable(b.timeSlot));
                return (
                  <div key={day} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 border-b pb-2 border-slate-200 dark:border-slate-700">
                      {day}
                    </h4>
                    {daySlots.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No periods scheduled</p>
                    ) : (
                      daySlots.map(st => (
                        <div key={st.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-white">{st.subject}</p>
                          <p className="text-[10px] text-slate-500">{st.teacherName}</p>
                          <p className="text-[10px] font-mono font-bold text-sky-600">{st.timeSlot}</p>
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

      {/* TAB 5: COPY TIMETABLE */}
      {activeTab === 'copy-timetable' && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Copy Class Timetable</h3>
            <p className="text-xs text-slate-500">Duplicate complete period allocations from one Class & Section to another</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Source Schedule</h4>
              <div>
                <label className="block text-xs font-bold mb-1">Source Class</label>
                <select
                  value={copySourceClass}
                  onChange={e => setCopySourceClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                >
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Source Section</label>
                <select
                  value={copySourceSection}
                  onChange={e => setCopySourceSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                >
                  {getSectionsForClass(copySourceClass).map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Target Schedule</h4>
              <div>
                <label className="block text-xs font-bold mb-1">Target Class</label>
                <select
                  value={copyTargetClass}
                  onChange={e => setCopyTargetClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                >
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Target Section</label>
                <select
                  value={copyTargetSection}
                  onChange={e => setCopyTargetSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                >
                  {getSectionsForClass(copyTargetClass).map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyTimetable}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Schedule Slots
          </button>
        </div>
      )}

      {/* Add Period Setting Modal */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Period Setting</h3>
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
                  <option value="Break">Morning / Short Break</option>
                  <option value="Lunch">Lunch Break</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsPeriodModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold shadow-md">Add Period</button>
              </div>
            </form>
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
                    Class {formData.className} Mapping
                  </span>
                </label>
                <select
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                >
                  <option value="">Select Subject</option>
                  {availableClassSubjects.map(sub => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name} ({sub.weeklyPeriodCount || 5} periods/wk)
                    </option>
                  ))}
                </select>
                {availableClassSubjects.length > 0 && (
                  <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-600" /> Loaded {availableClassSubjects.length} subject(s) assigned to {formData.className} in Class Management
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
    </div>
  );
};

export default TimetableView;
