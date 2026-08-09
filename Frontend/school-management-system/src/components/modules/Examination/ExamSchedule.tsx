import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Save, AlertTriangle, Eye, Layers, UserCheck } from 'lucide-react';
import { ExamScheduleTable } from './components/ExamScheduleTable';
import { ExamConflictAlert } from './components/ExamConflictAlert';
import { ExamTimetablePreview } from './components/ExamTimetablePreview';
import { ExamSetup, ExamSchedule as ExamScheduleType, SubjectItem, Staff } from '../../../types';
import { InvigilatorOption } from './components/ExamScheduleTable';
import { Panel } from './components/SharedUI';
import { useExamSchedule } from './hooks/useExamSchedule';
import { useData } from '../../../context/DataContext';
import { checkRoomCollision, checkInvigilatorCollision } from './utils/examValidation';

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
  addToast,
  onNavigateNext,
  onGotoSetup
}) => {
  const { academicClasses } = useData();
  const { examSchedules, addExamSchedule, updateExamSchedule, deleteExamSchedule, getSchedulesForExam, handleApplyToAllSections } = useExamSchedule();
  
  // Initial state: starts empty with selection prompt
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  const allowedClasses = useMemo(() => {
    if (!exam) return Array.from(new Set(classOptions.filter(Boolean)));
    const app = exam.applicableClasses || [];
    if (app.length === 0) return Array.from(new Set(classOptions.filter(Boolean)));
    return Array.from(new Set(classOptions.filter(c => app.includes(c))));
  }, [exam, classOptions]);

  // Dynamic sections from academicClasses
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const matched = academicClasses.find(c => c.name === selectedClass);
    if (!matched || !matched.sections || matched.sections.length === 0) return ['A'];
    const raw = matched.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || 'A'));
    return Array.from(new Set(raw.filter(Boolean)));
  }, [academicClasses, selectedClass]);

  const [isEditing, setIsEditing] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'build' | 'preview'>('build');

  // Preview Filters
  const [auditClassFilter, setAuditClassFilter] = useState('All');
  const [auditSectionFilter, setAuditSectionFilter] = useState('All');

  // Dynamic Teacher & Staff mapping for invigilation
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

  const activeSchedules = getSchedulesForExam(exam?.id || '');

  // Cleanup duplicate schedules & stale schedules from non-applicable classes
  useEffect(() => {
    if (examSchedules.length > 0) {
      const seen = new Set<string>();
      const toDelete: string[] = [];
      const appClasses = exam?.applicableClasses || [];

      examSchedules.forEach(s => {
        // 1. Delete if belonging to active exam but class is no longer applicable
        if (exam && s.examId === exam.id && appClasses.length > 0 && !appClasses.includes(s.className)) {
          toDelete.push(s.id);
          return;
        }

        // 2. Delete duplicates
        const key = `${s.examId}_${s.className}_${s.section}_${s.subject}`;
        if (seen.has(key)) {
          toDelete.push(s.id);
        } else {
          seen.add(key);
        }
      });

      if (toDelete.length > 0) {
        toDelete.forEach(id => deleteExamSchedule(id));
      }
    }
  }, [examSchedules.length, exam, deleteExamSchedule]);

  // Schedules strictly belonging to applicable classes for this active examination
  const applicableExamSchedules = useMemo(() => {
    if (!exam) return [];
    const app = exam.applicableClasses || [];
    return activeSchedules.filter(s => app.length === 0 || app.includes(s.className));
  }, [exam, activeSchedules]);

  // Filter schedules for current Class and Section
  const visibleSchedules = applicableExamSchedules.filter(
    s => s.className === selectedClass && s.section === selectedSection
  );

  // Initialize schedule rows if none exist for active class & section
  useEffect(() => {
    if (exam && selectedClass && selectedSection && visibleSchedules.length === 0) {
      const activeSubjects = Object.keys(exam.marksConfig?.subjectWiseConfig || {});
      
      activeSubjects.forEach(subjectName => {
        const alreadyExists = examSchedules.some(
          s => s.examId === exam.id &&
               s.className === selectedClass &&
               s.section === selectedSection &&
               s.subject === subjectName
        );
        if (alreadyExists) return;

        const itemConfig = exam.marksConfig?.subjectWiseConfig?.[subjectName] || { maxMarks: 100, passMarks: 35 };
        addExamSchedule({
          examId: exam.id,
          className: selectedClass,
          section: selectedSection,
          subject: subjectName,
          date: exam.startDate || new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '12:00',
          duration: '3h',
          room: 'TBA',
          invigilatorName: 'TBA',
          invigilatorNames: [],
          maxMarks: itemConfig.maxMarks,
          passMarks: itemConfig.passMarks
        } as any);
      });
    }
  }, [exam, selectedClass, selectedSection, examSchedules, addExamSchedule, visibleSchedules.length]);

  const handleUpdateRow = (id: string, updates: Partial<ExamScheduleType>) => {
    const existing = examSchedules.find(s => s.id === id);
    if (!existing) return;

    const merged = { ...existing, ...updates };

    if (updates.room && updates.room !== 'TBA') {
      const roomCheck = checkRoomCollision(merged.room, merged.date, merged.startTime, merged.endTime, applicableExamSchedules, id);
      if (roomCheck.hasConflict) {
        addToast('warning', 'Room Collision Warning', roomCheck.message || '');
      }
    }

    if (updates.invigilatorName && updates.invigilatorName !== 'TBA') {
      const invCheck = checkInvigilatorCollision(merged.invigilatorName, merged.date, merged.startTime, merged.endTime, applicableExamSchedules, id);
      if (invCheck.hasConflict) {
        addToast('warning', 'Invigilator Collision Warning', invCheck.message || '');
      }
    }

    updateExamSchedule(id, updates);
  };

  const handleApplyToAllSectionsWrapper = (row: any) => {
    handleApplyToAllSections(exam?.id || '', selectedClass, row.subject, {
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      duration: row.duration,
      room: row.room,
      invigilatorName: row.invigilatorName,
      invigilatorNames: row.invigilatorNames,
      maxMarks: row.maxMarks,
      passMarks: row.passMarks
    } as any);
    addToast('success', 'Timetable Synced', `Applied ${row.subject} schedule to all sections of ${selectedClass}.`);
  };

  // Conflict warnings for the selected class & section
  const conflictWarnings = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    const currentRows = applicableExamSchedules.filter(s => s.className === selectedClass && s.section === selectedSection);
    
    const issues: { type: 'room' | 'invigilator' | 'date'; message: string }[] = [];
    const seen = new Set<string>();

    currentRows.forEach(s => {
      if (s.room && s.room !== 'TBA') {
        const roomCheck = checkRoomCollision(s.room, s.date, s.startTime, s.endTime, applicableExamSchedules, s.id);
        if (roomCheck.hasConflict && roomCheck.message && !seen.has(roomCheck.message)) {
          seen.add(roomCheck.message);
          issues.push({ type: 'room', message: roomCheck.message });
        }
      }

      if (s.invigilatorName && s.invigilatorName !== 'TBA') {
        const invCheck = checkInvigilatorCollision(s.invigilatorName, s.date, s.startTime, s.endTime, applicableExamSchedules, s.id);
        if (invCheck.hasConflict && invCheck.message && !seen.has(invCheck.message)) {
          seen.add(invCheck.message);
          issues.push({ type: 'invigilator', message: invCheck.message });
        }
      }
    });

    return issues;
  }, [selectedClass, selectedSection, applicableExamSchedules]);

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
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Class *</label>
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
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Section *</label>
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
                    onClick={() => setIsEditing(prev => !prev)}
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
            ) : visibleSchedules.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-extrabold uppercase text-slate-800 dark:text-slate-200">No subjects configured for scheduling</h4>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                  To define schedules, please configure subjects in the <strong>"Exam Configuration"</strong> tab first.
                </p>
              </div>
            ) : (
              <ExamScheduleTable
                scheduleRows={visibleSchedules}
                isEditing={isEditing}
                teacherOptions={teacherOptions}
                onUpdateRow={handleUpdateRow}
                onUploadPaper={() => {}}
                onPreviewPaper={() => {}}
                subjects={subjects}
              />
            )}
          </div>
        ) : (
          exam?.id && (
            <ExamTimetablePreview
              scheduleRows={activeSchedules}
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
          )
        )}
      </Panel>
    </div>
  );
};
export default ExamSchedule;
