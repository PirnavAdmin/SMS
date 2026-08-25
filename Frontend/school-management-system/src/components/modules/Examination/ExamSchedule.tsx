import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Save, AlertTriangle, Eye, Layers, UserCheck } from 'lucide-react';
import { ExamScheduleTable } from './components/ExamScheduleTable';
import { ExamConflictAlert } from './components/ExamConflictAlert';
import { ExamTimetablePreview } from './components/ExamTimetablePreview';
import { ExamSetup, ExamSchedule as ExamScheduleType, SubjectItem, Staff } from '../../../types';
import { InvigilatorOption } from './components/ExamScheduleTable';
import { Panel } from './components/SharedUI';
import { useData } from '../../../context/DataContext';
import { checkRoomCollision, checkInvigilatorCollision } from './utils/examValidation';
import {
  fetchScheduleTimetableApi as fetchExamScheduleTimetableApi,
  saveScheduleTimetableApi as saveExamScheduleTimetableApi,
  fetchSchedulePreviewApi as fetchExamSchedulePreviewApi,
  fetchExamSubjectsApi
} from '../../../api/examination';

interface ExamScheduleProps {
  exam: ExamSetup | null;
  classOptions: string[];
  subjects: SubjectItem[];
  staff: Staff[];
  selectedAcademicYear: string;
  selectedBranch: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  onNavigateNext: () => void;
  onGotoSetup?: () => void;
}

export const ExamSchedule: React.FC<ExamScheduleProps> = ({
  exam,
  classOptions,
  subjects,
  staff,
  selectedAcademicYear,
  selectedBranch,
  addToast,
  onNavigateNext,
  onGotoSetup
}) => {
  const { academicClasses } = useData();
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [previewTimetable, setPreviewTimetable] = useState<any[]>([]);

  const allowedClasses = useMemo(() => {
    if (!exam) return Array.from(new Set(classOptions.filter(Boolean)));
    const app = exam.applicableClasses || [];
    if (app.length === 0) return Array.from(new Set(classOptions.filter(Boolean)));
    return Array.from(new Set(classOptions.filter(c => app.includes(c))));
  }, [exam, classOptions]);

  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const matched = academicClasses.find(c => c.name === selectedClass);
    if (!matched || !matched.sections || matched.sections.length === 0) return ['A'];
    const raw = matched.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || 'A'));
    return Array.from(new Set(raw.filter(Boolean)));
  }, [academicClasses, selectedClass]);

  const [isEditing, setIsEditing] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'build' | 'preview'>('build');

  const [auditClassFilter, setAuditClassFilter] = useState('All');
  const [auditSectionFilter, setAuditSectionFilter] = useState('All');

  const teacherOptions: InvigilatorOption[] = useMemo(() => {
    return staff
      .filter(s => !s.status || s.status === 'Active')
      .map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        empId: s.empId || 'EMP',
        formatted: `${s.empId ? `${s.empId} - ` : ''}${s.firstName} ${s.lastName} (${s.designation || s.department || 'Faculty'})`
      }));
  }, [staff]);

  // Helper to generate distinct sequential dates skipping Sundays
  const generateSequentialExamDates = (startDateStr?: string, count: number = 1): string[] => {
    const dates: string[] = [];
    if (!startDateStr) {
      startDateStr = new Date().toISOString().split('T')[0];
    }

    let curr = new Date(startDateStr);
    if (isNaN(curr.getTime())) {
      const parts = startDateStr.split(/[-/]/);
      if (parts.length === 3 && parts[0].length === 2) {
        curr = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else {
        curr = new Date();
      }
    }

    while (dates.length < count) {
      // Skip Sundays (0 in JS Date)
      if (curr.getDay() !== 0) {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
      curr.setDate(curr.getDate() + 1);
    }

    return dates;
  };

  // Load timetable on class/section change
  const loadTimetable = async () => {
    if (!exam?.id || !selectedClass || !selectedSection) return;
    setLoading(true);
    try {
      const res = await fetchExamScheduleTimetableApi(selectedClass, selectedSection, exam.id);
      if (res && res.success) {
        const defStart = exam.defaultStartTime || '09:00';
        const defEnd = exam.defaultEndTime || '12:00';

        const fetched = (res.data?.timetable || []).map((item: any, index: number) => {
          let startTime = defStart;
          let endTime = defEnd;
          if (item.timeSlot && item.timeSlot.includes('-')) {
            const parts = item.timeSlot.split('-');
            startTime = parts[0]?.trim() || defStart;
            endTime = parts[1]?.trim() || defEnd;
          }
          return {
            id: item.slotId ? `item_${item.slotId}` : `item_${index}`,
            slotId: item.slotId,
            examId: exam.id,
            className: selectedClass,
            section: selectedSection,
            subject: item.subjectName || '',
            subjectCode: item.subjectCode || '',
            date: item.examDate || '',
            startTime,
            endTime,
            duration: item.duration || '3h',
            room: item.roomHall || 'TBA',
            invigilatorName: item.invigilatorFaculty || 'TBA',
            invigilatorNames: item.invigilatorFaculty && item.invigilatorFaculty !== 'Unassigned' ? [item.invigilatorFaculty] : [],
            maxMarks: item.totalMarks || 100,
            passMarks: 35
          };
        });

        // Merge with all configured class subjects
        const matchedClass = academicClasses.find(c => c.name === selectedClass);
        const classSubs = matchedClass?.subjects && matchedClass.subjects.length > 0
          ? matchedClass.subjects.map((sub: any) => typeof sub === 'string' ? sub : (sub.subjectName || sub.name || sub.subjectCode || sub.code || '')).filter(Boolean)
          : [];

        // Check if API has saved subject configurations
        const subjectsRes = await fetchExamSubjectsApi(exam.id, selectedClass).catch(() => null);
        let apiActiveSubs: string[] = [];
        let apiConfigs: Record<string, { maxMarks: number; passMarks: number }> = {};
        
        if (subjectsRes && subjectsRes.success && Array.isArray(subjectsRes.data?.subjects)) {
          subjectsRes.data.subjects.forEach((s: any) => {
            if (s.isActive !== false) {
              apiActiveSubs.push(s.subjectName);
              apiConfigs[s.subjectName] = { maxMarks: s.maxMarks || 100, passMarks: s.passMarks || 35 };
            }
          });
        }

        const classConfig = (exam?.marksConfig as any)?.classWiseConfig?.[selectedClass] || {};
        const configKeys = Object.keys(classConfig);
        
        // Priority: 1. User-configured classWiseConfig, 2. API saved active subjects, 3. all class subjects, 4. all subjects
        let activeSubjects: string[] = [];
        if (configKeys.length > 0) {
          activeSubjects = configKeys;
        } else if (apiActiveSubs.length > 0) {
          activeSubjects = apiActiveSubs;
        } else if (classSubs.length > 0) {
          activeSubjects = classSubs;
        } else {
          activeSubjects = [];
        }

        const seenNames = new Set<string>();
        activeSubjects = activeSubjects.filter(name => {
          if (!name) return false;
          const lower = name.toLowerCase();
          if (seenNames.has(lower)) return false;
          seenNames.add(lower);
          return true;
        });

        const merged: any[] = [];
        // Add all active subjects
        activeSubjects.forEach(subjectName => {
          const existingFetched = fetched.find((s: any) => s.subject?.toLowerCase() === subjectName.toLowerCase());
          const itemConfig = apiConfigs[subjectName] || classConfig[subjectName] || { maxMarks: 100, passMarks: 35 };

          if (existingFetched) {
            merged.push({
              ...existingFetched,
              subject: subjectName,
              maxMarks: existingFetched.maxMarks || itemConfig.maxMarks || 100,
              passMarks: existingFetched.passMarks || itemConfig.passMarks || 35
            });
          } else {
            merged.push({
              id: `temp_${Date.now()}_${Math.random()}`,
              examId: exam.id,
              className: selectedClass,
              section: selectedSection,
              subject: subjectName,
              date: '',
              startTime: defStart,
              endTime: defEnd,
              duration: '3h',
              room: 'TBA',
              invigilatorName: 'TBA',
              invigilatorNames: [],
              maxMarks: itemConfig.maxMarks || 100,
              passMarks: itemConfig.passMarks || 35
            });
          }
        });

        // Auto-distribute dates if they are all identical or unset (skipping Sundays)
        const allSameOrBlank = merged.length > 1 && (
          merged.some(m => !m.date) ||
          merged.every(m => m.date === merged[0].date || m.date === exam.startDate)
        );

        if (allSameOrBlank || merged.some(m => !m.date)) {
          const autoDates = generateSequentialExamDates(exam.startDate, merged.length);
          merged.forEach((item, idx) => {
            if (autoDates[idx]) {
              item.date = autoDates[idx];
            }
          });
        }

        setTimetable(merged);
      } else {
        throw new Error(res?.message || 'Failed to retrieve timetable data.');
      }
    } catch (err: any) {
      addToast('error', 'Error Loading Timetable', err.message || 'Could not fetch class timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadTimetable();
    }
    setIsEditing(false);
  }, [selectedClass, selectedSection]);

  // Load preview data
  const loadPreview = async () => {
    setLoading(true);
    try {
      const year = selectedAcademicYear || '2026-27';
      const res = await fetchExamSchedulePreviewApi(year, auditClassFilter, auditSectionFilter, exam?.id);
      if (res && res.success && res.data?.sectionSchedules) {
        const mapped: any[] = [];
        res.data.sectionSchedules.forEach((card: any) => {
          if (card.timetable && card.timetable.length > 0) {
            card.timetable.forEach((item: any, idx: number) => {
              let startTime = '09:00';
              let endTime = '12:00';
              if (item.timeSlot && item.timeSlot.includes('-')) {
                const parts = item.timeSlot.split('-');
                startTime = parts[0]?.trim() || '09:00';
                endTime = parts[1]?.trim() || '12:00';
              }
              mapped.push({
                id: `preview_${card.className}_${card.sectionName}_${idx}`,
                examId: exam?.id || 1,
                className: card.className,
                section: card.sectionName,
                subject: item.subjectName,
                subjectCode: item.subjectCode,
                date: item.examDate,
                startTime,
                endTime,
                duration: item.duration,
                room: item.roomHall,
                invigilatorName: item.invigilatorFaculty
              });
            });
          }
        });
        setPreviewTimetable(mapped);
      } else {
        throw new Error(res?.message || 'Failed to retrieve preview data.');
      }
    } catch (err: any) {
      addToast('error', 'Preview Load Failed', err.message || 'Could not load timetable preview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scheduleMode === 'preview') {
      loadPreview();
    }
  }, [scheduleMode, exam?.id, auditClassFilter, auditSectionFilter]);

  const handleAutoDistributeDates = () => {
    if (timetable.length === 0) return;
    const autoDates = generateSequentialExamDates(exam?.startDate, timetable.length);
    const updated = timetable.map((item, idx) => ({
      ...item,
      date: autoDates[idx] || item.date
    }));
    setTimetable(updated);
    addToast('success', 'Exam Dates Distributed', `Spread ${timetable.length} subjects sequentially across exam dates (Sundays skipped).`);
  };

  const handleSaveTimetable = async (updatedList?: any[]) => {
    if (!exam?.id || !selectedClass || !selectedSection) return;
    const listToSave = updatedList || timetable;

    // Check for any Sunday dates and warn
    const sundaySlots = listToSave.filter(row => {
      if (!row.date) return false;
      const d = new Date(row.date);
      return !isNaN(d.getTime()) && d.getDay() === 0;
    });
    if (sundaySlots.length > 0) {
      addToast('warning', 'Sunday Schedule Warning', `${sundaySlots.map(s => s.subject).join(', ')} is scheduled on a Sunday. Usually examinations are not conducted on Sundays.`);
    }

    setLoading(true);
    try {
      const payload = {
        examId: Number(exam.id),
        className: selectedClass,
        sectionName: selectedSection,
        timetable: listToSave.map((row, index) => ({
          slotId: row.slotId || (index + 1),
          subjectCode: row.subjectCode || `${row.subject.substring(0, 3).toUpperCase()}-101`,
          subjectName: row.subject,
          totalMarks: row.maxMarks || 100,
          examDate: row.date || '',
          timeSlot: `${row.startTime || '09:00'} - ${row.endTime || '12:00'}`,
          duration: row.duration || '3h',
          roomHall: row.room || 'TBA',
          invigilatorFaculty: (row.invigilatorNames && row.invigilatorNames.length > 0) ? row.invigilatorNames[0] : (row.invigilatorName || 'Unassigned')
        }))
      };
      const response = await saveExamScheduleTimetableApi(payload);
      if (response && response.success) {
        addToast('success', 'Timetable Saved', 'Timetable configuration saved successfully.');
      } else {
        throw new Error(response?.message || 'Failed to save timetable.');
      }
    } catch (err: any) {
      addToast('error', 'Error Saving Schedule', err.message || 'Server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRow = (id: string, updates: Partial<ExamScheduleType>) => {
    if (updates.date) {
      const d = new Date(updates.date);
      if (!isNaN(d.getTime()) && d.getDay() === 0) {
        addToast('warning', 'Sunday Selected', 'Notice: Selected exam date falls on a Sunday.');
      }
    }

    const list = timetable.map(row => {
      if (row.id === id) {
        const merged = { ...row, ...updates };
        if (updates.room && updates.room !== 'TBA') {
          const roomCheck = checkRoomCollision(merged.room, merged.date, merged.startTime, merged.endTime, timetable, id);
          if (roomCheck.hasConflict) {
            addToast('warning', 'Room Collision Warning', roomCheck.message || '');
          }
        }

        if (updates.invigilatorName && updates.invigilatorName !== 'TBA') {
          const invCheck = checkInvigilatorCollision(merged.invigilatorName, merged.date, merged.startTime, merged.endTime, timetable, id);
          if (invCheck.hasConflict) {
            addToast('warning', 'Invigilator Collision Warning', invCheck.message || '');
          }
        }
        return merged;
      }
      return row;
    });

    setTimetable(list);
  };

  const handleApplyToAllSectionsWrapper = async (row: any) => {
    if (!exam?.id || !selectedClass) return;
    setLoading(true);
    try {
      const classObj = academicClasses.find(c => c.name === selectedClass);
      const sections = classObj?.sections || ['A'];

      const saves = sections.map(async (sec) => {
        const res = await fetchExamScheduleTimetableApi(selectedClass, sec);
        let list = [];
        if (res && res.success && res.data?.timetable) {
          list = res.data.timetable;
        }

        const subIndex = list.findIndex((s: any) => s.subjectName === row.subject);
        const updatedRow = {
          subjectCode: row.subjectCode || `${row.subject.substring(0, 3).toUpperCase()}-101`,
          subjectName: row.subject,
          examDate: row.date || '',
          startTime: row.startTime,
          endTime: row.endTime,
          duration: row.duration,
          room: row.room,
          invigilatorName: row.invigilatorName,
          invigilatorNames: row.invigilatorNames || [row.invigilatorName].filter(Boolean)
        };

        if (subIndex > -1) {
          list[subIndex] = updatedRow;
        } else {
          list.push(updatedRow);
        }

        const payload = {
          examId: Number(exam.id),
          className: selectedClass,
          sectionName: sec,
          timetable: list
        };
        return saveExamScheduleTimetableApi(payload);
      });

      await Promise.all(saves);
      addToast('success', 'Timetable Synced', `Applied ${row.subject} schedule to all sections of ${selectedClass}.`);
      loadTimetable();
    } catch (err: any) {
      addToast('error', 'Apply to All Failed', err.message || 'Failed to sync sections.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEdit = async () => {
    if (isEditing) {
      await handleSaveTimetable();
    }
    setIsEditing(prev => !prev);
  };

  // Conflict warnings for the selected class & section
  const conflictWarnings = useMemo(() => {
    const issues: { type: 'room' | 'invigilator' | 'date'; message: string }[] = [];
    const seen = new Set<string>();

    timetable.forEach(s => {
      if (s.room && s.room !== 'TBA') {
        const roomCheck = checkRoomCollision(s.room, s.date, s.startTime, s.endTime, timetable, s.id);
        if (roomCheck.hasConflict && roomCheck.message && !seen.has(roomCheck.message)) {
          seen.add(roomCheck.message);
          issues.push({ type: 'room', message: roomCheck.message });
        }
      }

      if (s.invigilatorName && s.invigilatorName !== 'TBA') {
        const invCheck = checkInvigilatorCollision(s.invigilatorName, s.date, s.startTime, s.endTime, timetable, s.id);
        if (invCheck.hasConflict && invCheck.message && !seen.has(invCheck.message)) {
          seen.add(invCheck.message);
          issues.push({ type: 'invigilator', message: invCheck.message });
        }
      }
    });

    return issues;
  }, [timetable]);

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Examination Timetable & Invigilation"
       // description="Allocate examination dates, timing sessions, examination halls, and invigilator faculty."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScheduleMode(prev => prev === 'build' ? 'preview' : 'build')}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {scheduleMode === 'build' ? 'Timetable Preview' : 'Schedule Grid'}
            </button>

            {selectedClass && selectedSection && (
              <button
                onClick={onNavigateNext}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm shadow-sky-600/20 transition cursor-pointer"
              >
                Proceed to Marks Entry
              </button>
            )}
          </div>
        }
      >
        {!exam?.id && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Please select an examination template first to view or build the timetable schedule.</span>
            </div>
            {onGotoSetup && (
              <button
                type="button"
                onClick={onGotoSetup}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer"
              >
                Go to Exam Configuration
              </button>
            )}
          </div>
        )}

        {exam?.id && scheduleMode === 'build' ? (
          <div className="space-y-4">
            <ExamConflictAlert issues={conflictWarnings} />

            {/* Target Selectors with Clean Initial Option */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-sky-400 dark:border-sky-500 bg-slate-50/50 dark:bg-slate-950/60 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Class <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={selectedClass}
                    onChange={e => {
                      setSelectedClass(e.target.value);
                      setSelectedSection('');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[150px] h-[34px] shadow-xs"
                  >
                    <option value="">-- Select Class --</option>
                    {allowedClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Section <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                    disabled={!selectedClass}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[140px] h-[34px] shadow-xs disabled:opacity-50"
                  >
                    <option value="">-- Select Section --</option>
                    {availableSections.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClass && selectedSection && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoDistributeDates}
                    className="px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Automatically spread exam subjects across sequential dates from start date (Sundays excluded)"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Auto-Distribute Dates</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleEdit}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition shadow-xs cursor-pointer ${
                      isEditing
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isEditing ? 'Done Editing' : 'Edit Timetable'}
                  </button>
                </div>
              )}
            </div>

            {/* Display table or prompt */}
            {!selectedClass || !selectedSection ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-2">
                <Calendar className="w-8 h-8 text-sky-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Select Class & Section to Schedule
                </h4>
              </div>
            ) : timetable.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-extrabold uppercase text-slate-800 dark:text-slate-200">No subjects configured for scheduling</h4>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                  To define schedules, please configure subjects in the <strong>"Exam Configuration"</strong> tab first.
                </p>
              </div>
            ) : (
              <div className="relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-40 rounded-3xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  </div>
                )}
                <ExamScheduleTable
                  scheduleRows={timetable}
                  isEditing={isEditing}
                  teacherOptions={teacherOptions}
                  onUpdateRow={handleUpdateRow}
                  onUploadPaper={() => {}}
                  onPreviewPaper={() => {}}
                  subjects={subjects}
                  onApplyToAll={handleApplyToAllSectionsWrapper}
                />
              </div>
            )}
          </div>
        ) : (
          exam?.id && (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-40 rounded-3xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                </div>
              )}
              <ExamTimetablePreview
                scheduleRows={previewTimetable}
                classOptions={allowedClasses}
                subjects={subjects}
                staff={staff}
                auditClassFilter={auditClassFilter}
                auditSectionFilter={auditSectionFilter}
                setAuditClassFilter={setAuditClassFilter}
                setAuditSectionFilter={setAuditSectionFilter}
                onPrintTimetable={(cls, sec) => {
                  setAuditClassFilter(cls);
                  setAuditSectionFilter(sec);
                  window.scrollTo(0, 0);
                  setTimeout(() => window.print(), 200);
                }}
                onPrintAll={() => {
                  setAuditClassFilter('All');
                  setAuditSectionFilter('All');
                  window.scrollTo(0, 0);
                  setTimeout(() => window.print(), 200);
                }}
              />
            </div>
          )
        )}
      </Panel>
    </div>
  );
};
export default ExamSchedule;
