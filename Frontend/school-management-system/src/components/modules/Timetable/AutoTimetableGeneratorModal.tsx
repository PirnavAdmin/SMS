import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Clock, Zap, CheckCircle2, AlertCircle, Calendar,
  Layers, School, Users, BookOpen, ChevronRight, Check,
  SlidersHorizontal, Info, Coffee, Utensils, RefreshCw,
  ArrowRight, ShieldCheck, FileSpreadsheet, Plus, Edit, Trash2
} from 'lucide-react';
import { useData, AcademicClass } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { generateTimetableApi } from '../../../api/academic';

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
  initialAcademicYear = ''
}) => {
  const {
    academicClasses,
    rawClasses,
    teacherAssignments,
    subjects,
    periodSettings,
    fetchPeriods,
    fetchTimetables,
    academicYears
  } = useData();
  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  // Wizard active tab
  const [activeStep, setActiveStep] = useState<'timings' | 'classes' | 'generate'>('timings');

  // Academic Year & Campus
  const [academicYear, setAcademicYear] = useState(
    initialAcademicYear || selectedAcademicYear || (academicYears && academicYears[0]?.academicYear) || ''
  );

  useEffect(() => {
    if (initialAcademicYear) {
      setAcademicYear(initialAcademicYear);
    } else if (selectedAcademicYear) {
      setAcademicYear(selectedAcademicYear);
    } else if (academicYears && academicYears.length > 0) {
      const current = academicYears.find(y => y.isCurrentAcademicYear || y.status === 'Active') || academicYears[0];
      if (current?.academicYear) {
        setAcademicYear(current.academicYear);
      }
    }
  }, [initialAcademicYear, selectedAcademicYear, academicYears]);

  // Daily School Timing Inputs (dynamic)
  const [schoolStartTime, setSchoolStartTime] = useState('08:30 AM');
  const [schoolEndTime, setSchoolEndTime] = useState('03:30 PM');
  const [periodDurationMinutes, setPeriodDurationMinutes] = useState<number | string>(45);

  // Dynamic Breaks List (with Add, Edit, Delete options)
  const [breaks, setBreaks] = useState<BreakItem[]>([]);
  const [hasInitializedTimings, setHasInitializedTimings] = useState(false);

  useEffect(() => {
    if (hasInitializedTimings) return;
    const active = (periodSettings || [])
      .filter(p => p.status === 'Active' && (!p.className || p.className === 'Master' || p.className === 'All'))
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    if (active.length > 0) {
      const first = active[0];
      const last = active[active.length - 1];
      if (first?.startTime) setSchoolStartTime(first.startTime);
      if (last?.endTime) setSchoolEndTime(last.endTime);

      const firstTeaching = active.find(p => !p.isBreak && p.periodType === 'Teaching');
      if (firstTeaching) {
        if (firstTeaching.durationMinutes && Number(firstTeaching.durationMinutes) > 0) {
          setPeriodDurationMinutes(Number(firstTeaching.durationMinutes));
        } else if (firstTeaching.startTime && firstTeaching.endTime) {
          const sMin = timeToMinutes(firstTeaching.startTime);
          const eMin = timeToMinutes(firstTeaching.endTime);
          if (eMin > sMin) setPeriodDurationMinutes(eMin - sMin);
        }
      }

      const extractedBreaks: BreakItem[] = [];
      let teachingCount = 0;
      active.forEach((p, idx) => {
        const isB = p.isBreak || p.periodType === 'Break' || p.periodType === 'Lunch';
        if (!isB) {
          teachingCount++;
        } else {
          const sMin = timeToMinutes(p.startTime);
          const eMin = timeToMinutes(p.endTime);
          const dur = p.durationMinutes && Number(p.durationMinutes) > 0 ? Number(p.durationMinutes) : (eMin > sMin ? eMin - sMin : 15);
          extractedBreaks.push({
            id: p.id || `BRK-${idx + 1}`,
            name: p.periodName || (p.periodType === 'Lunch' ? 'Lunch Break' : 'Morning Break'),
            durationMinutes: dur,
            afterPeriod: teachingCount,
            type: p.periodType === 'Lunch' ? 'Lunch' : 'Break',
            enabled: true
          });
        }
      });

      setBreaks(extractedBreaks);
      setHasInitializedTimings(true);
    }
  }, [periodSettings, hasInitializedTimings]);

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

  // Target Class-Section combinations (e.g., ["Class 1-A", "Class 1-B"])
  const [selectedClassSections, setSelectedClassSections] = useState<string[]>([]);
  const [classGroupFilter, setClassGroupFilter] = useState<string>('primary');

  const classGroups = useMemo(() => {
    const groups: { key: string; label: string; match: (name: string) => boolean }[] = [];
    
    const hasNursery = (academicClasses || []).some(c => /nursery|lkg|ukg|kg|pre-kg|kindergarten|playgroup/i.test(c.name));
    const hasPrimary = (academicClasses || []).some(c => /class\s*[1-5]\b/i.test(c.name) || /grade\s*[1-5]\b/i.test(c.name) || ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'].includes(c.name));
    const hasMiddle = (academicClasses || []).some(c => /class\s*[6-8]\b/i.test(c.name) || /grade\s*[6-8]\b/i.test(c.name) || ['Class 6', 'Class 7', 'Class 8'].includes(c.name));
    const hasHigh = (academicClasses || []).some(c => /class\s*(9|10)\b/i.test(c.name) || ['Class 9', 'Class 10'].includes(c.name));
    const hasSenior = (academicClasses || []).some(c => /class\s*(11|12)\b/i.test(c.name) || ['Class 11', 'Class 12'].includes(c.name));

    if (hasNursery) {
      groups.push({
        key: 'nursery',
        label: 'Nursery & KG',
        match: (name: string) => /nursery|lkg|ukg|kg|pre-kg|kindergarten|playgroup/i.test(name)
      });
    }
    if (hasPrimary) {
      groups.push({
        key: 'primary',
        label: 'Class 1-5',
        match: (name: string) => /class\s*[1-5]\b/i.test(name) || /grade\s*[1-5]\b/i.test(name) || ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'].includes(name)
      });
    }
    if (hasMiddle) {
      groups.push({
        key: 'middle',
        label: 'Class 6-8',
        match: (name: string) => /class\s*[6-8]\b/i.test(name) || /grade\s*[6-8]\b/i.test(name) || ['Class 6', 'Class 7', 'Class 8'].includes(name)
      });
    }
    if (hasHigh) {
      groups.push({
        key: 'high',
        label: 'Class 9-10',
        match: (name: string) => /class\s*(9|10)\b/i.test(name) || ['Class 9', 'Class 10'].includes(name)
      });
    }
    if (hasSenior) {
      groups.push({
        key: 'senior',
        label: 'Class 11-12',
        match: (name: string) => /class\s*(11|12)\b/i.test(name) || ['Class 11', 'Class 12'].includes(name)
      });
    }

    return groups;
  }, [academicClasses]);

  const displayedClasses = useMemo(() => {
    return (academicClasses || []).filter(c => {
      if (classGroupFilter === 'all') return true;
      const group = (classGroups || []).find(g => g.key === classGroupFilter);
      return group ? group.match(c.name) : true;
    });
  }, [academicClasses, classGroupFilter, classGroups]);

  useEffect(() => {
    if (classGroups.length > 0 && !classGroups.some(g => g.key === classGroupFilter) && classGroupFilter !== 'all') {
      setClassGroupFilter(classGroups[0].key);
    }
  }, [classGroups, classGroupFilter]);

  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        setSelectedClassSections([]);
      }
    } else {
      hasInitializedRef.current = false;
      setSelectedClassSections([]);
    }
  }, [isOpen]);



  // Selected Class Section for Live Preview
  const [previewClassSec, setPreviewClassSec] = useState<string>('');

  useEffect(() => {
    if (selectedClassSections.length > 0 && (!previewClassSec || !selectedClassSections.includes(previewClassSec))) {
      setPreviewClassSec(selectedClassSections[0]);
    }
  }, [selectedClassSections, previewClassSec]);

  // Formatted Selected Classes Summary for UI & Alert
  const formattedSelectedClasses = useMemo(() => {
    const map = new Map<string, string[]>();
    selectedClassSections.forEach(cs => {
      const idx = cs.lastIndexOf('-');
      const cName = idx !== -1 ? cs.substring(0, idx) : cs;
      const sec = idx !== -1 ? cs.substring(idx + 1) : 'A';
      if (!map.has(cName)) map.set(cName, []);
      map.get(cName)!.push(sec);
    });
    return Array.from(map.entries()).map(([className, sections]) => ({
      className,
      sections: sections.sort()
    }));
  }, [selectedClassSections]);

  // Auto-populate timetable with mapped subjects/teachers
  const [autoAssignMappedSubjects, setAutoAssignMappedSubjects] = useState(true);
  const [avoidTeacherConflicts, setAvoidTeacherConflicts] = useState(true);
  const [maxPeriodsPerDayPerSubject, setMaxPeriodsPerDayPerSubject] = useState(2);
  const [allowConsecutiveForLabs, setAllowConsecutiveForLabs] = useState(true);
  const [minPeriodGap, setMinPeriodGap] = useState(1);
  const [generationSeed, setGenerationSeed] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

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

  // Live Timetable Grid Preview for selected class/section (reads authoritative backend generation result)
  const previewTimetableGrid = useMemo(() => {
    if (!previewClassSec || selectedClassSections.length === 0) return null;

    const lastDash = previewClassSec.lastIndexOf('-');
    const className = lastDash !== -1 ? previewClassSec.substring(0, lastDash).trim() : previewClassSec.trim();
    const section = lastDash !== -1 ? previewClassSec.substring(lastDash + 1).trim() : 'A';
    const norm = (str?: string) => (str || '').toLowerCase().replace(/\s+/g, '').replace(/class/gi, '');

    // Slots produced by the authoritative backend engine
    const backendSlots = (generationResult?.timetable || []) as any[];

    const grid: Record<string, Record<string, { subject: string; teacherName: string; isBreak?: boolean; breakType?: string }>> = {};

    workingDays.forEach(dayName => {
      grid[dayName] = {};

      calculationResult.periods.forEach(p => {
        if (p.type === 'Teaching') {
          // Find matching slot from authoritative backend generation
          const matchedSlot = backendSlots.find(s =>
            (norm(s.className) === norm(className) || (s.className && s.className.includes(className))) &&
            (norm(s.sectionName) === norm(section) || s.sectionName === section) &&
            s.dayOfWeek?.toLowerCase() === dayName.toLowerCase() &&
            (s.periodName?.toLowerCase() === p.name.toLowerCase() || s.startTime === p.startTime)
          );

          if (matchedSlot) {
            grid[dayName][p.name] = {
              subject: matchedSlot.subjectName || matchedSlot.subject,
              teacherName: matchedSlot.teacherName || 'Assigned Faculty'
            };
          } else {
            grid[dayName][p.name] = {
              subject: generationResult?.success ? 'Free Period' : 'Ready to Generate',
              teacherName: '-'
            };
          }
        } else {
          grid[dayName][p.name] = {
            subject: p.name,
            teacherName: p.type,
            isBreak: true,
            breakType: p.type
          };
        }
      });
    });

    return {
      className,
      section,
      periods: calculationResult.periods,
      workingDays,
      grid
    };
  }, [previewClassSec, selectedClassSections, calculationResult, workingDays, generationResult]);

  // Quick Class & Section Group Selector
  const handleSelectClassGroup = (group: string) => {
    if (group === 'none') {
      setSelectedClassSections([]);
      return;
    }
    if (group === 'all') {
      setClassGroupFilter('all');
      return;
    }
    if (group === 'sec-A' || group === 'sec-B') {
      const letter = group === 'sec-A' ? 'A' : 'B';
      const targetClassNames = displayedClasses.map(c => c.name);
      
      const keysToSelect: string[] = [];
      academicClasses.forEach(c => {
        if (targetClassNames.includes(c.name)) {
          const sections = c.sections && c.sections.length > 0 ? c.sections : ['A'];
          if (sections.includes(letter)) {
            keysToSelect.push(`${c.name}-${letter}`);
          }
        }
      });

      setSelectedClassSections(prev => {
        const otherSelected = prev.filter(k => {
          const idx = k.lastIndexOf('-');
          const cName = idx !== -1 ? k.substring(0, idx) : k;
          return !targetClassNames.includes(cName);
        });
        return [...new Set([...otherSelected, ...keysToSelect])];
      });
      return;
    }

    if ((classGroups || []).some(g => g.key === group)) {
      setClassGroupFilter(group);
    }
  };

  const toggleSection = (className: string, section: string) => {
    const key = `${className}-${section}`;
    setSelectedClassSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleClass = (cls: AcademicClass) => {
    const sections = cls.sections && cls.sections.length > 0 ? cls.sections : ['A'];
    const keys = sections.map((sec: string) => `${cls.name}-${sec}`);
    const allSelected = keys.every((key: string) => selectedClassSections.includes(key));
    if (allSelected) {
      setSelectedClassSections(prev => prev.filter((k: string) => !keys.includes(k)));
    } else {
      setSelectedClassSections(prev => [...new Set([...prev, ...keys])]);
    }
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

    if (selectedClassSections.length === 0) {
      addToast('warning', 'No Classes Selected', 'Please select at least one class section to apply the schedule to.');
      setActiveStep('classes');
      return;
    }

    if (calculationResult.periods.length === 0) {
      addToast('error', 'No Periods Generated', 'Please adjust period duration or school timings.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const apiPayload = {
        academicYear,
        branchName: selectedBranch || (rawClasses && rawClasses[0]?.campusLocation) || '',
        schoolStartTime,
        schoolEndTime,
        periodDurationMinutes: Number(periodDurationMinutes),
        workingDays,
        breaks: breaks.filter(b => b.enabled).map(b => ({
          name: b.name,
          durationMinutes: Number(b.durationMinutes),
          afterPeriod: Number(b.afterPeriod),
          type: b.type
        })),
        selectedClassSections,
        autoAssignMappedSubjects,
        allowConsecutiveForLabs,
        maxDailyPeriodsPerSubject: Number(maxPeriodsPerDayPerSubject) || 2,
        minPeriodGap: Number(minPeriodGap) || 1,
        seed: generationSeed.trim() !== '' ? parseInt(generationSeed.trim(), 10) : undefined,
        timeoutSeconds: 30
      };

      const res = await generateTimetableApi(apiPayload);
      const outcome = (res && res.data && typeof res.data === 'object' && ('timetable' in res.data || 'status' in res.data))
        ? res.data
        : res;
      setGenerationResult(outcome);

      if (!outcome?.success) {
        setGenerationError(outcome?.message || 'Could not find a conflict-free timetable schedule.');
        addToast('error', `Generation ${outcome?.status || 'Failed'}`, outcome?.message || 'Failed to generate timetable.');
        return;
      }

      // Backend ACID transaction has committed the new slots to MySQL.
      // Refresh context so all timetable grids across the application stay strictly in sync.
      if (fetchPeriods) {
        await fetchPeriods(true).catch(() => {});
      }
      if (fetchTimetables) {
        await fetchTimetables(true).catch(() => {});
      }

      const classListSummary = formattedSelectedClasses
        .map(c => `${c.className} (Sec ${c.sections.join(', ')})`)
        .join(', ');

      addToast(
        'success',
        'Authoritative Timetable Generated! 🎉',
        outcome.message || `Timetable successfully generated for ${selectedClassSections.length} class section(s): ${classListSummary}`
      );

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error during authoritative timetable generation:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to generate timetable slots.';
      setGenerationError(msg);
      addToast('error', 'Generation Error', msg);
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
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Break Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                        <input
                          type="text"
                          value={newBreakData.name}
                          onChange={e => setNewBreakData({ ...newBreakData, name: e.target.value })}
                          placeholder="e.g. Snack Break"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Duration (Mins) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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
                      Select Sections ({selectedClassSections.length} selected)
                    </h4>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {classGroups.map(g => {
                      const selCount = (academicClasses || [])
                        .filter(c => g.match(c.name))
                        .reduce((count, c) => {
                          const sections = c.sections && c.sections.length > 0 ? c.sections : ['A'];
                          return count + sections.filter(sec => selectedClassSections.includes(`${c.name}-${sec}`)).length;
                        }, 0);

                      return (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => handleSelectClassGroup(g.key)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                            classGroupFilter === g.key
                              ? 'bg-brand-600 text-white shadow-xs border border-brand-600'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                          }`}
                        >
                          <span>{g.label}</span>
                          {selCount > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              classGroupFilter === g.key
                                ? 'bg-white/20 text-white'
                                : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                            }`}>
                              {selCount}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    <span className="text-[10px] text-slate-300 dark:text-slate-700">|</span>

                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('sec-A')}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 text-slate-750 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:border-slate-300 transition-all cursor-pointer"
                    >
                      All Sec A
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('sec-B')}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 text-slate-750 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:border-slate-300 transition-all cursor-pointer"
                    >
                      All Sec B
                    </button>

                    <span className="text-[10px] text-slate-300 dark:text-slate-700">|</span>

                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('all')}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                        classGroupFilter === 'all'
                          ? 'bg-brand-600 text-white shadow-xs border border-brand-600'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectClassGroup('none')}
                      className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Section-Wise Class Checkbox Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {displayedClasses.map(cls => {
                    const sections = cls.sections && cls.sections.length > 0 ? cls.sections : ['A'];
                    const sectionKeys = sections.map(sec => `${cls.name}-${sec}`);
                    const allSelected = sectionKeys.every(key => selectedClassSections.includes(key));
                    const someSelected = sectionKeys.some(key => selectedClassSections.includes(key));

                    return (
                      <div
                        key={cls.id || cls.name}
                        className="p-3 rounded-2xl border bg-white dark:bg-slate-800 hover:border-brand-350 dark:hover:border-slate-700 hover:shadow-xs transition-all space-y-2.5 border-slate-200 dark:border-slate-750"
                      >
                        {/* Class Header */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleClass(cls)}
                            className="flex items-center gap-2 cursor-pointer outline-none bg-transparent border-0 p-0 text-left"
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                              allSelected
                                ? 'bg-brand-600 border-brand-600 text-white'
                                : someSelected
                                ? 'bg-brand-400 border-brand-400 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                            }`}>
                              {allSelected ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : someSelected ? (
                                <div className="w-1.5 h-1.5 bg-white rounded-xs" />
                              ) : null}
                            </div>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-100">{cls.name}</span>
                          </button>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-555 dark:text-slate-400 font-mono">
                            {sections.length} Sec
                          </span>
                        </div>

                        {/* Section Pills */}
                        <div className="flex flex-wrap gap-1.5 pl-6">
                          {sections.map(section => {
                            const key = `${cls.name}-${section}`;
                            const isSectionSelected = selectedClassSections.includes(key);
                            return (
                              <button
                                key={section}
                                type="button"
                                onClick={() => toggleSection(cls.name, section)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-all border cursor-pointer flex items-center gap-1 ${
                                  isSectionSelected
                                    ? 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-400 dark:border-sky-500 text-sky-600 dark:text-sky-300 shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-750 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {isSectionSelected && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                                <span>Sec {section}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Classes & Sections Summary Card */}
              <div className="bg-sky-50/80 dark:bg-sky-950/30 p-3.5 rounded-xl sm:rounded-2xl border border-sky-200 dark:border-sky-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-sky-900 dark:text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Selected Classes & Sections ({selectedClassSections.length})
                  </span>
                  <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 font-mono">
                    {formattedSelectedClasses.length} Classes Selected
                  </span>
                </div>
                {formattedSelectedClasses.length === 0 ? (
                  <p className="text-xs text-sky-600/70 dark:text-sky-400/70 italic">No classes or sections selected yet. Use the checkboxes above to select classes.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {formattedSelectedClasses.map(c => (
                      <span
                        key={c.className}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 shadow-2xs"
                      >
                        <span>{c.className}</span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-[10px] font-mono">
                          Sec {c.sections.join(', ')}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>



            </div>
          )}

          {/* STEP 3: PREVIEW & GENERATION CONFIRMATION */}
          {activeStep === 'generate' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Target Classes & Sections Card */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Target Classes & Sections ({selectedClassSections.length} sections)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    Ready to Generate
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formattedSelectedClasses.map(c => (
                    <div
                      key={c.className}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-black text-emerald-900 dark:text-emerald-200"
                    >
                      <School className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{c.className}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono border border-emerald-300 dark:border-emerald-700">
                        Sec {c.sections.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engine Rules & Guarantees Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Authoritative Backend Solver Rules
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Enforced Strictly
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Anti-Consecutive Rule
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10.5px]">
                      Same normal subject is never placed back-to-back on same day (|p₁ - p₂| ≥ 2).
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Lab Double-Blocks
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10.5px]">
                      Lab/Practical subjects are paired consecutively on same day for experiments.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Zero Clashes & ACID
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10.5px]">
                      Zero teacher & room overlap with atomic database transaction rollback.
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Solver Controls (Seed & Variation) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Solver Seed & Variation Controls
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                    Seeded PRNG (Deterministic Reproducibility)
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Random Seed (e.g. 42 — Leave blank for auto-generated seed)"
                      value={generationSeed}
                      onChange={(e) => setGenerationSeed(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setGenerationSeed(String(Math.floor(Math.random() * 900000) + 100000))}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 flex items-center gap-1.5 transition-colors"
                      title="Generate random seed"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Randomize
                    </button>
                    {generationSeed && (
                      <button
                        type="button"
                        onClick={() => setGenerationSeed('')}
                        className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-1 transition-colors"
                        title="Clear seed"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                  Leaving seed blank ensures different valid timetable permutations each run. Setting an explicit seed guarantees 100% identical schedule reproduction.
                </p>
              </div>

              {/* Generation Quality Summary (When successfully generated) */}
              {generationResult?.success && generationResult.summary && (
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 p-4 rounded-xl sm:rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">
                          Schedule Successfully Generated & Verified
                        </h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          {generationResult.message}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-xs">
                      {generationResult.summary.overallQualityScore}% Score
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                    <div className="p-2 bg-white dark:bg-slate-850 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-[10px] uppercase font-extrabold text-slate-400">Total Slots</div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200">{generationResult.summary.slotsGenerated}</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-850 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-[10px] uppercase font-extrabold text-slate-400">Hard Violations</div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{generationResult.summary.hardViolations}</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-850 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-[10px] uppercase font-extrabold text-slate-400">Daily Similarity</div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {generationResult.dailyPatternSimilarity !== undefined ? `${Math.round(generationResult.dailyPatternSimilarity)}%` : '0%'}
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-850 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-[10px] uppercase font-extrabold text-slate-400">Period Diversity</div>
                      <div className="text-sm font-black text-sky-600 dark:text-sky-400">
                        {generationResult.summary.periodDiversityScore !== undefined ? `${Math.round(generationResult.summary.periodDiversityScore)}%` : '100%'}
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-850 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-[10px] uppercase font-extrabold text-slate-400">Generation Seed</div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono">
                        {generationResult.generationSeed ?? 'Auto'}
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-850 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-[10px] uppercase font-extrabold text-slate-400">Time Taken</div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200">{generationResult.summary.executionTimeMs} ms</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generation Diagnostics & Conflict Card (When generation returned NO_SOLUTION or VALIDATION_FAILED) */}
              {generationResult && !generationResult.success && (
                <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl sm:rounded-2xl border border-rose-300 dark:border-rose-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <div>
                        <h4 className="text-xs font-black text-rose-900 dark:text-rose-100 uppercase tracking-wider">
                          {generationResult.status === 'SYSTEM_ERROR'
                            ? 'System Error Occurred'
                            : generationResult.status === 'CAPACITY_EXCEEDED'
                            ? 'Workload Exceeds Capacity'
                            : generationResult.status === 'TIMEOUT'
                            ? 'Solver Timeout'
                            : `Generation Notice (${generationResult.status || 'NO_SOLUTION'})`}
                        </h4>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300">
                          {generationResult.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {generationResult.conflicts && generationResult.conflicts.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-extrabold text-rose-800 dark:text-rose-300 tracking-wider">Conflict Details:</span>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {generationResult.conflicts.map((c: any, i: number) => (
                          <div key={i} className="p-2 rounded-lg bg-white dark:bg-slate-850 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 shrink-0 uppercase">
                              {c.type}
                            </span>
                            <span>{c.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generationResult.suggestions && generationResult.suggestions.length > 0 && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block">Recommended Adjustments:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {generationResult.suggestions.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Live Dynamic Timetable Grid Preview Card */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Live Timetable Grid Preview
                    </h4>
                  </div>

                  {/* Section Dropdown Selector for Preview */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Preview Section:</span>
                    <select
                      value={previewClassSec}
                      onChange={e => setPreviewClassSec(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-brand-600 dark:text-brand-400 outline-none cursor-pointer"
                    >
                      {selectedClassSections.map(cs => {
                        const idx = cs.lastIndexOf('-');
                        const cls = idx !== -1 ? cs.substring(0, idx) : cs;
                        const sec = idx !== -1 ? cs.substring(idx + 1) : 'A';
                        return (
                          <option key={cs} value={cs}>
                            {cls} - Section {sec}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Timetable Matrix Grid */}
                {previewTimetableGrid && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-28 bg-slate-150 dark:bg-slate-850">Day / Time</th>
                          {previewTimetableGrid.periods.map(p => (
                            <th key={p.id} className="p-2.5 border-r border-slate-200 dark:border-slate-700 text-center min-w-32">
                              <div className="font-extrabold text-slate-900 dark:text-white">{p.name}</div>
                              <div className="text-[9.5px] font-mono text-slate-500 dark:text-slate-400 font-normal">{p.startTime} - {p.endTime}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                        {previewTimetableGrid.workingDays.map(dayName => (
                          <tr key={dayName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
                              {dayName}
                            </td>
                            {previewTimetableGrid.periods.map(p => {
                              const cell = previewTimetableGrid.grid[dayName]?.[p.name];
                              if (cell?.isBreak) {
                                return (
                                  <td key={p.id} className="p-2 border-r border-slate-200 dark:border-slate-700 bg-amber-50/60 dark:bg-amber-950/30 text-center align-middle">
                                    <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 block">
                                      {cell.subject}
                                    </span>
                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                      {cell.breakType}
                                    </span>
                                  </td>
                                );
                              }
                              return (
                                <td key={p.id} className="p-2 border-r border-slate-200 dark:border-slate-700 align-middle">
                                  {cell ? (
                                    <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-left space-y-0.5">
                                      <p className="text-xs font-black text-sky-900 dark:text-sky-100 truncate">{cell.subject}</p>
                                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">{cell.teacherName}</p>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic block text-center">Free Period</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  if (selectedClassSections.length === 0) {
                    addToast('warning', 'Select Sections', 'Please select at least one class section.');
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
              <div className="flex items-center gap-2">
                {generationResult?.success && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Done & Close
                  </button>
                )}
                <button
                  type="button"
                  disabled={isGenerating || calculationResult.errors.length > 0 || selectedClassSections.length === 0}
                  onClick={handleExecuteGeneration}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 ${
                    generationResult?.success
                      ? 'bg-brand-600 hover:bg-brand-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating with Engine...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>{generationResult?.success ? 'Re-Generate' : 'Generate & Apply Schedule'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
