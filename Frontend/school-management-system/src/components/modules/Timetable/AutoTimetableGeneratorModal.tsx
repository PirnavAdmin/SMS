import React, { useState, useMemo } from 'react';
import {
  X, Clock, Zap, CheckCircle2, AlertCircle, Calendar,
  Layers, School, Users, BookOpen, ChevronRight, Check,
  SlidersHorizontal, Info, Coffee, Utensils, RefreshCw,
  ArrowRight, ShieldCheck, FileSpreadsheet, Plus, Edit, Trash2
} from 'lucide-react';
import { PeriodSetting, TimetableSlot } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface BreakItem {
  id: string;
  name: string;
  durationMinutes: number | string;
  afterPeriod: number; // 0 = before period 1 (e.g. assembly), 1 = after period 1, 2 = after period 2, etc.
  type: 'Break' | 'Lunch' | 'Assembly' | 'Tea' | 'Other';
  enabled: boolean;
}

interface AutoTimetableGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialAcademicYear?: string;
}

// Convert "08:30 AM" or "08:30" to total minutes from midnight
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(' ');
  const [hStr, mStr] = parts[0].split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr || '0', 10);
  if (parts.length > 1) {
    const ampm = parts[1].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

// Convert minutes from midnight to "hh:mm A" format
export const minutesToTime = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

// Convert 12-hour "hh:mm A" to 24-hour "HH:mm" for HTML5 time inputs
export const time12To24 = (timeStr: string): string => {
  if (!timeStr) return '';
  const parts = timeStr.trim().split(' ');
  const [hStr, mStr] = parts[0].split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr || '0', 10);
  if (parts.length > 1) {
    const ampm = parts[1].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Convert 24-hour "HH:mm" to 12-hour "hh:mm A" format
export const time24To12 = (time24: string): string => {
  if (!time24) return '';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  const [hStr, mStr] = time24.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr || '0', 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

// Format minutes into "X hrs Y mins"
export const formatDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} hrs`;
  return `${h} hrs ${m} mins`;
};

export interface GeneratedPeriodItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  type: 'Teaching' | 'Break' | 'Assembly' | 'Lunch' | 'Tea' | 'Other';
  sequence: number;
}

export const AutoTimetableGeneratorModal: React.FC<AutoTimetableGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAcademicYear = '2026-2027'
}) => {
  const {
    academicClasses,
    rawClasses,
    teacherAssignments,
    subjects,
    addPeriodSetting,
    periodSettings,
    timetable,
    addTimetableSlot
  } = useData();
  const { selectedBranch } = useAuth();
  const { addToast } = useToast();

  // Wizard active tab
  const [activeStep, setActiveStep] = useState<'timings' | 'classes' | 'generate'>('timings');

  // Academic Year & Campus
  const [academicYear, setAcademicYear] = useState(initialAcademicYear);

  // Daily School Timing Inputs (dynamic)
  const [schoolStartTime, setSchoolStartTime] = useState('08:30 AM');
  const [schoolEndTime, setSchoolEndTime] = useState('03:30 PM');
  const [periodDurationMinutes, setPeriodDurationMinutes] = useState<number | string>(45);

  // Dynamic Breaks List (with Add, Edit, Delete options)
  const [breaks, setBreaks] = useState<BreakItem[]>([
    { id: 'BRK-1', name: 'Morning Break', durationMinutes: 15, afterPeriod: 2, type: 'Break', enabled: true },
    { id: 'BRK-2', name: 'Lunch Break', durationMinutes: 45, afterPeriod: 4, type: 'Lunch', enabled: true }
  ]);

  // Editing / adding break state
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null);
  const [showAddBreakForm, setShowAddBreakForm] = useState(false);
  const [newBreakData, setNewBreakData] = useState<Omit<BreakItem, 'id'>>({
    name: 'Snack Break',
    durationMinutes: 15,
    afterPeriod: 6,
    type: 'Break',
    enabled: true
  });

  // Working days selection
  const [workingDays, setWorkingDays] = useState<DayOfWeek[]>([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ]);
  const allWeekDays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Target Classes Selection
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'
  ]);

  // Auto-populate timetable with mapped subjects/teachers
  const [autoAssignMappedSubjects, setAutoAssignMappedSubjects] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Add new break handler
  const handleAddBreak = () => {
    if (!newBreakData.name.trim()) {
      addToast('warning', 'Break Name Required', 'Please enter a name for the break.');
      return;
    }
    const dur = typeof newBreakData.durationMinutes === 'number' 
      ? newBreakData.durationMinutes 
      : (parseInt(newBreakData.durationMinutes) || 0);

    if (dur <= 0) {
      addToast('warning', 'Invalid Duration', 'Duration must be greater than 0 mins.');
      return;
    }

    const created: BreakItem = {
      ...newBreakData,
      durationMinutes: dur,
      id: `BRK-${Date.now()}`
    };

    setBreaks(prev => [...prev, created]);
    setShowAddBreakForm(false);
    setNewBreakData({
      name: 'Afternoon Break',
      durationMinutes: 15,
      afterPeriod: 6,
      type: 'Break',
      enabled: true
    });
    addToast('success', 'Break Added', `Added "${created.name}" (${created.durationMinutes}m).`);
  };

  // Update existing break handler
  const handleUpdateBreak = (id: string, updates: Partial<BreakItem>) => {
    setBreaks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  // Delete break handler
  const handleDeleteBreak = (id: string) => {
    setBreaks(prev => prev.filter(b => b.id !== id));
    addToast('info', 'Break Removed', 'Break has been deleted from schedule.');
  };

  // Calculate Generated Periods in real time
  const calculationResult = useMemo(() => {
    const startMin = timeToMinutes(schoolStartTime);
    const endMin = timeToMinutes(schoolEndTime);
    const totalDayMinutes = Math.max(0, endMin - startMin);

    const generated: GeneratedPeriodItem[] = [];
    const errors: string[] = [];

    const numericPeriodDuration = typeof periodDurationMinutes === 'number' 
      ? periodDurationMinutes 
      : (parseInt(periodDurationMinutes) || 0);

    if (startMin >= endMin) {
      errors.push('School Start Time must be earlier than End Time.');
      return { periods: [], totalDayMinutes: 0, totalAllocatedMinutes: 0, remainingMinutes: 0, errors, teachingCount: 0, breakCount: 0 };
    }

    if (numericPeriodDuration <= 0) {
      errors.push('Please enter a valid period duration in minutes (e.g. 45).');
      return { periods: [], totalDayMinutes, totalAllocatedMinutes: 0, remainingMinutes: totalDayMinutes, errors, teachingCount: 0, breakCount: 0 };
    }

    let currentMin = startMin;
    let sequence = 1;
    let periodIndex = 1;
    let teachingCount = 0;
    let breakCount = 0;

    // Filter active breaks with numeric duration
    const activeBreaks = breaks
      .map(b => ({
        ...b,
        numericDuration: typeof b.durationMinutes === 'number' ? b.durationMinutes : (parseInt(b.durationMinutes as string) || 0)
      }))
      .filter(b => b.enabled && b.numericDuration > 0);

    // 1. Check for breaks before period 1 (e.g. Assembly / afterPeriod: 0)
    const initialBreaks = activeBreaks.filter(b => b.afterPeriod === 0);
    for (const b of initialBreaks) {
      const nextMin = currentMin + b.numericDuration;
      if (nextMin <= endMin) {
        generated.push({
          id: `GEN-BRK-INIT-${b.id}`,
          name: b.name,
          startTime: minutesToTime(currentMin),
          endTime: minutesToTime(nextMin),
          startMinutes: currentMin,
          endMinutes: nextMin,
          durationMinutes: b.numericDuration,
          type: b.type,
          sequence: sequence++
        });
        currentMin = nextMin;
        breakCount++;
      }
    }

    // 2. Loop & Calculate Teaching Periods and Interleaved Breaks
    const MAX_PERIODS = 20; // safety ceiling
    while (currentMin + numericPeriodDuration <= endMin && periodIndex <= MAX_PERIODS) {
      // Teaching Period
      const pStart = currentMin;
      const pEnd = currentMin + numericPeriodDuration;

      generated.push({
        id: `GEN-P${periodIndex}`,
        name: `Period ${periodIndex}`,
        startTime: minutesToTime(pStart),
        endTime: minutesToTime(pEnd),
        startMinutes: pStart,
        endMinutes: pEnd,
        durationMinutes: numericPeriodDuration,
        type: 'Teaching',
        sequence: sequence++
      });

      currentMin = pEnd;
      teachingCount++;

      // Check all breaks configured for after this period
      const matchedBreaks = activeBreaks.filter(b => b.afterPeriod === periodIndex);
      for (const b of matchedBreaks) {
        const bStart = currentMin;
        const bEnd = currentMin + b.numericDuration;
        if (bEnd <= endMin) {
          generated.push({
            id: `GEN-BRK-${b.id}`,
            name: b.name,
            startTime: minutesToTime(bStart),
            endTime: minutesToTime(bEnd),
            startMinutes: bStart,
            endMinutes: bEnd,
            durationMinutes: b.numericDuration,
            type: b.type,
            sequence: sequence++
          });
          currentMin = bEnd;
          breakCount++;
        }
      }

      periodIndex++;
    }

    const totalAllocatedMinutes = currentMin - startMin;
    const remainingMinutes = endMin - currentMin;

    if (generated.length === 0) {
      errors.push('No periods fit between the selected Start and End times with the specified durations.');
    }

    return {
      periods: generated,
      totalDayMinutes,
      totalAllocatedMinutes,
      remainingMinutes,
      errors,
      teachingCount,
      breakCount
    };
  }, [schoolStartTime, schoolEndTime, periodDurationMinutes, breaks]);

  // Quick Class Group Selector
  const handleSelectClassGroup = (group: 'primary' | 'middle' | 'high' | 'senior' | 'all' | 'none') => {
    if (group === 'none') {
      setSelectedClassNames([]);
      return;
    }
    if (group === 'all') {
      setSelectedClassNames(academicClasses.map(c => c.name));
      return;
    }
    if (group === 'primary') {
      setSelectedClassNames(
        academicClasses
          .map(c => c.name)
          .filter(n => /class\s*[1-5]\b/i.test(n) || /grade\s*[1-5]\b/i.test(n) || ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'].includes(n))
      );
      return;
    }
    if (group === 'middle') {
      setSelectedClassNames(
        academicClasses
          .map(c => c.name)
          .filter(n => /class\s*[6-8]\b/i.test(n) || /grade\s*[6-8]\b/i.test(n) || ['Class 6', 'Class 7', 'Class 8'].includes(n))
      );
      return;
    }
    if (group === 'high') {
      setSelectedClassNames(
        academicClasses
          .map(c => c.name)
          .filter(n => /class\s*(9|10)\b/i.test(n) || ['Class 9', 'Class 10'].includes(n))
      );
      return;
    }
    if (group === 'senior') {
      setSelectedClassNames(
        academicClasses
          .map(c => c.name)
          .filter(n => /class\s*(11|12)\b/i.test(n) || ['Class 11', 'Class 12'].includes(n))
      );
      return;
    }
  };

  const handleToggleClass = (className: string) => {
    setSelectedClassNames(prev =>
      prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
    );
  };

  const handleToggleDay = (day: DayOfWeek) => {
    setWorkingDays(prev =>
      prev.includes(day)
        ? (prev.length > 1 ? prev.filter(d => d !== day) : prev)
        : [...prev, day]
    );
  };

  // Perform Generation & Bulk Assignment
  const handleExecuteGeneration = async () => {
    if (calculationResult.errors.length > 0) {
      addToast('error', 'Configuration Error', calculationResult.errors[0]);
      return;
    }

    if (selectedClassNames.length === 0) {
      addToast('warning', 'No Classes Selected', 'Please select at least one class to apply the schedule to.');
      setActiveStep('classes');
      return;
    }

    if (calculationResult.periods.length === 0) {
      addToast('error', 'No Periods Generated', 'Please adjust period duration or school timings.');
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Add New Master Period Settings
      for (const p of calculationResult.periods) {
        addPeriodSetting({
          periodName: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          sequence: p.sequence,
          periodType: p.type === 'Teaching' ? 'Teaching' : (p.type === 'Lunch' ? 'Lunch' : (p.type === 'Assembly' ? 'Assembly' : 'Break')),
          status: 'Active',
          academicYear,
          branch: selectedBranch || 'Main Campus'
        });
      }

      // 2. Generate Timetable Grid Slots for each selected Class & Section
      let totalSlotsCreated = 0;
      let totalSectionsCount = 0;

      // Filter classes to target
      const targetClasses = academicClasses.filter(c => selectedClassNames.includes(c.name));

      for (const cls of targetClasses) {
        const sections = cls.sections && cls.sections.length > 0 ? cls.sections : ['A'];
        
        // Find mapped subjects & teachers for this class
        const rawCls = rawClasses.find(rc => rc.id === cls.id || rc.className === cls.name);
        const mappedSubjects: Array<{ subjectName: string; teacherName: string; weeklyPeriods: number }> = [];

        if (rawCls && rawCls.subjects && rawCls.subjects.length > 0) {
          rawCls.subjects.forEach((s: any) => {
            const sName = typeof s === 'string' ? s : (s.name || s.subjectName || '');
            if (sName) {
              const teacherObj = teacherAssignments.find(ta =>
                (ta.className === cls.name || ta.classId === cls.id) &&
                (ta.subject === sName)
              );
              mappedSubjects.push({
                subjectName: sName,
                teacherName: teacherObj ? teacherObj.teacherName : (rawCls.teacher || 'Unassigned'),
                weeklyPeriods: s.weeklyPeriods || 5
              });
            }
          });
        } else if (cls.subjects && cls.subjects.length > 0) {
          cls.subjects.forEach((sName: string) => {
            const teacherObj = teacherAssignments.find(ta =>
              (ta.className === cls.name || ta.classId === cls.id) &&
              (ta.subject === sName)
            );
            mappedSubjects.push({
              subjectName: sName,
              teacherName: teacherObj ? teacherObj.teacherName : (cls.teacher || 'Unassigned'),
              weeklyPeriods: 5
            });
          });
        } else {
          ['Mathematics', 'Science', 'English', 'Social Studies', 'Regional Language'].forEach(sName => {
            mappedSubjects.push({
              subjectName: sName,
              teacherName: cls.teacher || 'Class Teacher',
              weeklyPeriods: 5
            });
          });
        }

        for (const section of sections) {
          totalSectionsCount++;
          let subjectDistributionIdx = 0;

          for (const day of workingDays) {
            for (const period of calculationResult.periods) {
              const isNonTeaching = period.type !== 'Teaching';
              let slotSubject = isNonTeaching ? period.name : 'Study Period';
              let slotTeacher = isNonTeaching ? '--' : 'Class Teacher';

              if (!isNonTeaching && autoAssignMappedSubjects && mappedSubjects.length > 0) {
                const assignedSub = mappedSubjects[subjectDistributionIdx % mappedSubjects.length];
                slotSubject = assignedSub.subjectName;
                slotTeacher = assignedSub.teacherName || 'Assigned Teacher';
                subjectDistributionIdx++;
              }

              const newSlot: TimetableSlot = {
                id: `TT-${Date.now()}-${Math.floor(Math.random() * 900000)}`,
                className: cls.name,
                section: section,
                day: day,
                timeSlot: `${period.startTime} - ${period.endTime}`,
                startTime: period.startTime,
                endTime: period.endTime,
                subject: slotSubject,
                teacherName: slotTeacher,
                roomNo: `Room ${cls.name.replace(/\D/g, '') || '1'}0${section.charCodeAt(0) - 64}`,
                status: 'Draft',
                academicYear,
                branch: selectedBranch || 'Main Campus'
              };

              addTimetableSlot(newSlot);
              totalSlotsCreated++;
            }
          }
        }
      }

      addToast(
        'success',
        'Auto-Generation Complete! 🎉',
        `Generated ${calculationResult.periods.length} period schedule and created ${totalSlotsCreated} timetable slots across ${selectedClassNames.length} classes (${totalSectionsCount} sections).`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error generating auto timetable:', err);
      addToast('error', 'Generation Error', 'Failed to generate timetable slots.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-3">
        
        {/* Compact & Sleek Solid Modal Header */}
        <div className="py-2.5 px-4 sm:px-5 bg-sky-600 dark:bg-slate-900 border-b border-sky-700 dark:border-slate-800 text-white shrink-0">
          <div className="flex items-center justify-between gap-3">
            
            {/* Title & Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Auto-Generate Schedule & Timetable
                </h3>
              </div>
            </div>

            {/* Stepper Tabs Bar (Compact inline) */}
            <div className="hidden sm:flex items-center gap-1.5 bg-sky-700/70 dark:bg-slate-800 p-1 rounded-xl border border-sky-500/30 dark:border-slate-700">
              {[
                { id: 'timings', label: '1. Timings & Breaks', icon: Clock },
                { id: 'classes', label: '2. Classes', icon: School },
                { id: 'generate', label: '3. Preview', icon: Zap }
              ].map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id as any)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      isActive
                        ? 'bg-white text-sky-700 shadow-xs font-extrabold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Stepper Tabs Bar */}
          <div className="flex sm:hidden items-center justify-between gap-1 mt-2 pt-2 border-t border-white/15">
            {[
              { id: 'timings', label: '1. Timings', icon: Clock },
              { id: 'classes', label: '2. Classes', icon: School },
              { id: 'generate', label: '3. Preview', icon: Zap }
            ].map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id as any)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex-1 justify-center ${
                    isActive
                      ? 'bg-white text-sky-700 font-extrabold shadow-xs'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Content (Spacious & Clean) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-950/40 space-y-5">
          
          {/* STEP 1: TIMINGS & BREAK MANAGEMENT */}
          {activeStep === 'timings' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Daily School Timings Card */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Daily School Timings
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    Total Duration: <strong className="font-mono">{formatDuration(calculationResult.totalDayMinutes)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* School Start Time */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>School Start Time *</span>
                      <span className="text-brand-600 font-bold font-mono">{time24To12(schoolStartTime)}</span>
                    </label>
                    <input
                      type="time"
                      value={time12To24(schoolStartTime)}
                      onChange={e => setSchoolStartTime(e.target.value ? time24To12(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono cursor-pointer"
                    />
                  </div>

                  {/* School End Time */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>School End Time *</span>
                      <span className="text-brand-600 font-bold font-mono">{time24To12(schoolEndTime)}</span>
                    </label>
                    <input
                      type="time"
                      value={time12To24(schoolEndTime)}
                      onChange={e => setSchoolEndTime(e.target.value ? time24To12(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono cursor-pointer"
                    />
                  </div>

                  {/* Period Duration in Minutes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Period Duration *</span>
                      <span className="text-brand-600 font-bold font-mono">{periodDurationMinutes || 0} mins</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={periodDurationMinutes}
                        onChange={e => setPeriodDurationMinutes(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        placeholder="e.g. 45"
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono"
                      />
                      <span className="text-xs text-slate-500 font-bold shrink-0">Mins</span>
                    </div>
                    {/* Quick presets buttons */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {[35, 40, 45, 50, 60].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setPeriodDurationMinutes(mins)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            Number(periodDurationMinutes) === mins
                              ? 'bg-brand-500 text-white border-brand-500 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Break & Lunch Settings with Add / Edit / Delete */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Breaks & Intermissions ({breaks.length})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddBreakForm(prev => !prev)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Break</span>
                  </button>
                </div>

                {/* Inline Add Break Form */}
                {showAddBreakForm && (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-amber-600" /> Add New Break / Intermission
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddBreakForm(false)}
                        className="text-amber-700 hover:text-amber-900 dark:text-amber-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Break Name *</label>
                        <input
                          type="text"
                          value={newBreakData.name}
                          onChange={e => setNewBreakData({ ...newBreakData, name: e.target.value })}
                          placeholder="e.g. Snack Break"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Duration (Mins) *</label>
                        <input
                          type="number"
                          min="5"
                          max="90"
                          value={newBreakData.durationMinutes}
                          onChange={e => setNewBreakData({ ...newBreakData, durationMinutes: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                          placeholder="e.g. 15"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Give Placement</label>
                        <select
                          value={newBreakData.afterPeriod}
                          onChange={e => setNewBreakData({ ...newBreakData, afterPeriod: parseInt(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                        >
                          <option value="0">Before Period 1 (Assembly)</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                            <option key={p} value={p}>After Period {p}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Break Type</label>
                        <select
                          value={newBreakData.type}
                          onChange={e => setNewBreakData({ ...newBreakData, type: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                        >
                          <option value="Break">Short Break</option>
                          <option value="Lunch">Lunch Break</option>
                          <option value="Assembly">Assembly</option>
                          <option value="Tea">Tea Break</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddBreakForm(false)}
                        className="px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddBreak}
                        className="px-4 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                      >
                        Save Break
                      </button>
                    </div>
                  </div>
                )}

                {/* Breaks List Cards */}
                <div className="space-y-2">
                  {breaks.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <Coffee className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">No breaks configured. Click "Add Break" above to add recess or lunch.</p>
                    </div>
                  ) : (
                    breaks.map((b) => {
                      const isEditing = editingBreakId === b.id;
                      return (
                        <div
                          key={b.id}
                          className={`p-3 rounded-xl border transition-all ${
                            b.type === 'Lunch'
                              ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                          }`}
                        >
                          {!isEditing ? (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={b.enabled}
                                  onChange={e => handleUpdateBreak(b.id, { enabled: e.target.checked })}
                                  className="w-4 h-4 text-brand-600 rounded cursor-pointer"
                                />
                                <div>
                                  <span className={`text-xs font-bold flex items-center gap-1.5 ${
                                    b.enabled ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'
                                  }`}>
                                    {b.type === 'Lunch' ? <Utensils className="w-3.5 h-3.5 text-orange-600" /> : <Coffee className="w-3.5 h-3.5 text-amber-600" />}
                                    {b.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    {b.durationMinutes} mins • {b.afterPeriod === 0 ? 'Before Period 1 (Assembly)' : `After Period ${b.afterPeriod}`}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingBreakId(b.id)}
                                  className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Edit Break"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBreak(b.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Delete Break"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Inline Edit Form */
                            <div className="space-y-2.5 animate-in fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Name</label>
                                  <input
                                    type="text"
                                    value={b.name}
                                    onChange={e => handleUpdateBreak(b.id, { name: e.target.value })}
                                    className="w-full px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Duration (Mins)</label>
                                  <input
                                    type="number"
                                    min="5"
                                    max="90"
                                    value={b.durationMinutes}
                                    onChange={e => handleUpdateBreak(b.id, { durationMinutes: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                                    placeholder="e.g. 15"
                                    className="w-full px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Placement</label>
                                  <select
                                    value={b.afterPeriod}
                                    onChange={e => handleUpdateBreak(b.id, { afterPeriod: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                                  >
                                    <option value="0">Before Period 1 (Assembly)</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                      <option key={p} value={p}>After Period {p}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Type</label>
                                  <select
                                    value={b.type}
                                    onChange={e => handleUpdateBreak(b.id, { type: e.target.value as any })}
                                    className="w-full px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                                  >
                                    <option value="Break">Short Break</option>
                                    <option value="Lunch">Lunch Break</option>
                                    <option value="Assembly">Assembly</option>
                                    <option value="Tea">Tea Break</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingBreakId(null)}
                                  className="px-3 py-1 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Live Timeline Calculation Preview Banner */}
              <div className="bg-brand-50 dark:bg-brand-950/40 p-3.5 rounded-xl sm:rounded-2xl border border-brand-200 dark:border-brand-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-800 dark:text-brand-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-brand-600" /> Schedule Summary
                  </span>
                  <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                    {calculationResult.teachingCount} Teaching Periods ({periodDurationMinutes}m each) + {calculationResult.breakCount} Breaks
                  </span>
                </div>

                {/* Timeline chips preview */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {calculationResult.periods.map(p => (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${
                        p.type === 'Teaching'
                          ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          : p.type === 'Lunch'
                          ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                          : p.type === 'Assembly'
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      <span>{p.name}:</span>
                      <span className="font-mono text-[11px] font-normal opacity-90">{p.startTime} - {p.endTime}</span>
                    </span>
                  ))}
                </div>

                {calculationResult.errors.length > 0 ? (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{calculationResult.errors[0]}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>Day span: <strong>{formatDuration(calculationResult.totalDayMinutes)}</strong></span>
                    <span>Allocated: <strong className="text-emerald-600 dark:text-emerald-400">{formatDuration(calculationResult.totalAllocatedMinutes)}</strong></span>
                    <span>Unallocated: <strong>{calculationResult.remainingMinutes} mins</strong></span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 2: CLASS SELECTION & WORKING DAYS */}
          {activeStep === 'classes' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Working Days Config */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Working Days of the Week
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {workingDays.length} Days Selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {allWeekDays.map(day => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class Selection & Quick Group Buttons */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <School className="w-4 h-4 text-brand-500" />
                      Select Classes ({selectedClassNames.length} selected)
                    </h4>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('primary')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors"
                    >
                      Class 1 to 5 (Primary)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('middle')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Class 6 to 8
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('high')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Class 9 to 10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('all')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      All Classes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('none')}
                      className="px-2 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Class Multi-Select Checkbox Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-0.5">
                  {academicClasses.map(cls => {
                    const isSelected = selectedClassNames.includes(cls.name);
                    const sections = cls.sections && cls.sections.length > 0 ? cls.sections : ['A'];
                    return (
                      <label
                        key={cls.id || cls.name}
                        onClick={() => handleToggleClass(cls.name)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 text-slate-900 dark:text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-brand-600 border-brand-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold">{cls.name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono">
                          {sections.length} Sec
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: PREVIEW & GENERATION CONFIRMATION */}
          {activeStep === 'generate' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Summary Overview Card */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Generation Configuration Summary
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    Ready to Generate
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Timing Window</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                      {schoolStartTime} - {schoolEndTime}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Period Duration</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                      {periodDurationMinutes} mins / period
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Teaching Periods</span>
                    <p className="font-bold text-brand-600 dark:text-brand-400 mt-0.5 font-mono">
                      {calculationResult.teachingCount} Periods / day
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Classes</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                      {selectedClassNames.length} Classes
                    </p>
                  </div>
                </div>

                {/* Auto-populate Option Switch */}
                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="autoAssignMappedSubjects"
                    checked={autoAssignMappedSubjects}
                    onChange={e => setAutoAssignMappedSubjects(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded cursor-pointer mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="autoAssignMappedSubjects" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer block">
                      Auto-Populate Timetable Slots with Mapped Subjects & Teachers
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Automatically reads assigned subjects & teachers from Class Management tabs and intelligently distributes them across the working days for each section.
                    </p>
                  </div>
                </div>
              </div>

              {/* Calculated Period Schedule Table */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-500" />
                  Calculated Daily Period Structure ({calculationResult.periods.length} slots)
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3.5 py-2">Sequence</th>
                        <th className="px-3.5 py-2">Slot Name</th>
                        <th className="px-3.5 py-2">Timing</th>
                        <th className="px-3.5 py-2">Duration</th>
                        <th className="px-3.5 py-2">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                      {calculationResult.periods.map(p => (
                        <tr key={p.id} className={p.type !== 'Teaching' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}>
                          <td className="px-3.5 py-2 font-bold font-mono text-slate-400">#{p.sequence}</td>
                          <td className="px-3.5 py-2 font-bold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="px-3.5 py-2 font-mono text-slate-600 dark:text-slate-400">{p.startTime} - {p.endTime}</td>
                          <td className="px-3.5 py-2 font-bold font-mono">{p.durationMinutes} mins</td>
                          <td className="px-3.5 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.type === 'Teaching'
                                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                                : p.type === 'Lunch'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                                : p.type === 'Assembly'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                              {p.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Navigation */}
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div>
            {activeStep !== 'timings' && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === 'generate' ? 'classes' : 'timings')}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {activeStep === 'timings' && (
              <button
                type="button"
                onClick={() => {
                  if (calculationResult.errors.length > 0) {
                    addToast('error', 'Configuration Error', calculationResult.errors[0]);
                    return;
                  }
                  setActiveStep('classes');
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-md shadow-brand-500/20 flex items-center gap-1.5"
              >
                <span>Continue</span>
              </button>
            )}

            {activeStep === 'classes' && (
              <button
                type="button"
                onClick={() => {
                  if (selectedClassNames.length === 0) {
                    addToast('warning', 'Select Classes', 'Please select at least one class.');
                    return;
                  }
                  setActiveStep('generate');
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-md shadow-brand-500/20 flex items-center gap-1.5"
              >
                <span>Continue</span>
              </button>
            )}

            {activeStep === 'generate' && (
              <button
                type="button"
                disabled={isGenerating || calculationResult.errors.length > 0 || selectedClassNames.length === 0}
                onClick={handleExecuteGeneration}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Generate & Apply</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
