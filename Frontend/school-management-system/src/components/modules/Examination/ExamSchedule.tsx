import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Save, AlertTriangle, Eye, Printer } from 'lucide-react';
import { ExamScheduleTable } from './components/ExamScheduleTable';
import { ExamConflictAlert } from './components/ExamConflictAlert';
import { ExamTimetablePreview } from './components/ExamTimetablePreview';
import { ExamSetup, ExamSchedule as ExamScheduleType, SubjectItem, Staff } from '../../../types';
import { InvigilatorOption } from './components/ExamScheduleTable';
import { Panel } from './components/SharedUI';
import { useExamSchedule } from './hooks/useExamSchedule';
import { checkRoomCollision, checkInvigilatorCollision, getPublishValidationIssues } from './utils/examValidation';

interface ExamScheduleProps {
  exam: ExamSetup | null;
  classOptions: string[];
  subjects: SubjectItem[];
  staff: Staff[];
  selectedAcademicYear: string;
  selectedBranch: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  onNavigateNext: () => void;
}

export const ExamSchedule: React.FC<ExamScheduleProps> = ({
  exam,
  classOptions,
  subjects,
  staff,
  selectedAcademicYear,
  selectedBranch,
  addToast,
  onNavigateNext
}) => {
  const { examSchedules, addExamSchedule, updateExamSchedule, deleteExamSchedule, getSchedulesForExam, handleApplyToAllSections } = useExamSchedule();
  
  const [selectedClass, setSelectedClass] = useState(classOptions[0] || 'Class 10');
  const [selectedSection, setSelectedSection] = useState('A');

  const allowedClasses = useMemo(() => {
    if (!exam) return [];
    const app = exam.applicableClasses || [];
    if (app.length === 0) return classOptions;
    return classOptions.filter(c => app.includes(c));
  }, [exam, classOptions]);

  // Sync selectedClass with allowedClasses on exam change
  useEffect(() => {
    if (allowedClasses.length > 0 && !allowedClasses.includes(selectedClass)) {
      setSelectedClass(allowedClasses[0]);
    }
  }, [exam, allowedClasses]);
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'build' | 'preview'>('build');

  // Preview Filters
  const [auditClassFilter, setAuditClassFilter] = useState('All');
  const [auditSectionFilter, setAuditSectionFilter] = useState('All');

  // Invigilators dropdown options mapping
  const teacherOptions: InvigilatorOption[] = staff
    .filter(s => s.role?.toLowerCase() === 'teacher')
    .map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      empId: s.empId || 'EMP001',
      formatted: `${s.empId || 'EMP001'} - ${s.firstName} ${s.lastName}`
    }));

  const activeSchedules = getSchedulesForExam(exam?.id || '');

  // Self-healing: Cleanup duplicate schedules from global state on mount or change
  useEffect(() => {
    if (examSchedules.length > 0) {
      const seen = new Set<string>();
      const toDelete: string[] = [];
      examSchedules.forEach(s => {
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
  }, [examSchedules.length, deleteExamSchedule]);

  // Filter schedules for the current Class and Section
  const visibleSchedules = activeSchedules.filter(
    s => s.className === selectedClass && s.section === selectedSection
  );

  // Initialize schedule rows if none exist
  useEffect(() => {
    if (exam && selectedClass && selectedSection && visibleSchedules.length === 0) {
      // Find configured exam subjects
      const activeSubjects = Object.keys(exam.marksConfig?.subjectWiseConfig || {});
      
      activeSubjects.forEach(subjectName => {
        // Double-check to prevent duplicates in memory race conditions
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
          maxMarks: itemConfig.maxMarks,
          passMarks: itemConfig.passMarks
        } as any);
      });
    }
  }, [exam, selectedClass, selectedSection, examSchedules, addExamSchedule, visibleSchedules.length]);

  const handleUpdateRow = (id: string, updates: Partial<ExamScheduleType>) => {
    // 1. If date/time/room is updated, check for collision
    const existing = examSchedules.find(s => s.id === id);
    if (!existing) return;

    const merged = { ...existing, ...updates };

    if (updates.room && updates.room !== 'TBA') {
      const roomCheck = checkRoomCollision(merged.room, merged.date, merged.startTime, merged.endTime, examSchedules, id);
      if (roomCheck.hasConflict) {
        addToast('warning', 'Room Collision Warning', roomCheck.message || '');
        // Still allow change but warn user
      }
    }

    if (updates.invigilatorName && updates.invigilatorName !== 'TBA') {
      const invCheck = checkInvigilatorCollision(merged.invigilatorName, merged.date, merged.startTime, merged.endTime, examSchedules, id);
      if (invCheck.hasConflict) {
        addToast('warning', 'Invigilator Collision Warning', invCheck.message || '');
        // Still allow change but warn user
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
      maxMarks: row.maxMarks,
      passMarks: row.passMarks
    } as any);
    addToast('success', 'Schedule Copied', `Successfully applied ${row.subject} schedule details to all other sections of ${selectedClass}.`);
  };

  // Compile active warnings/conflicts
  const conflictWarnings = activeSchedules.map(s => {
    const issues: { type: 'room' | 'invigilator' | 'date'; message: string }[] = [];
    
    if (s.room && s.room !== 'TBA') {
      const roomCheck = checkRoomCollision(s.room, s.date, s.startTime, s.endTime, activeSchedules, s.id);
      if (roomCheck.hasConflict) {
        issues.push({ type: 'room', message: roomCheck.message || '' });
      }
    }

    if (s.invigilatorName && s.invigilatorName !== 'TBA') {
      const invCheck = checkInvigilatorCollision(s.invigilatorName, s.date, s.startTime, s.endTime, activeSchedules, s.id);
      if (invCheck.hasConflict) {
        issues.push({ type: 'invigilator', message: invCheck.message || '' });
      }
    }

    return issues;
  }).flat();

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Examination Schedule Management"
        description="Allocate rooms, schedule subject time slots, assign invigilators, and preview timetables."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScheduleMode(prev => prev === 'build' ? 'preview' : 'build')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              {scheduleMode === 'build' ? 'Timetable Preview' : 'Schedule Grid'}
            </button>

            <button
              onClick={onNavigateNext}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition"
            >
              Verify Marks Entry
            </button>
          </div>
        }
      >
        {!exam?.id && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Please select an active examination from the dropdown list.</span>
          </div>
        )}

        {exam?.id && scheduleMode === 'build' ? (
          <div className="space-y-5">
            {/* Conflict Warnings Box */}
            <ExamConflictAlert issues={conflictWarnings} />

            {/* Target Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Class *</label>
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[140px] h-[34px]"
                  >
                    {allowedClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Section *</label>
                  <select
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[120px] h-[34px]"
                  >
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(prev => !prev)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                    isEditing
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isEditing ? 'Done Editing' : 'Edit Schedule Rules'}
                </button>
              </div>
            </div>

            {/* Table */}
            {visibleSchedules.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-extrabold uppercase text-slate-800 dark:text-slate-200">No subjects configured for scheduling</h4>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                  To define schedules for a class, you must configure active subjects and passing margins for the exam first.
                  Go to the <strong>"Exams"</strong> setup tab, select <strong>"2. Exam Subjects"</strong>, toggle the active subjects, and click <strong>"Save Setup Configuration"</strong>.
                </p>
              </div>
            ) : (
              <ExamScheduleTable
                scheduleRows={visibleSchedules}
                isEditing={isEditing}
                teacherOptions={teacherOptions}
                onUpdateRow={handleUpdateRow}
                onApplyToAllSections={handleApplyToAllSectionsWrapper}
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
              classOptions={classOptions}
              subjects={subjects}
              staff={staff}
              auditClassFilter={auditClassFilter}
              auditSectionFilter={auditSectionFilter}
              setAuditClassFilter={setAuditClassFilter}
              setAuditSectionFilter={setAuditSectionFilter}
              onPrintTimetable={() => window.print()}
              onPrintAll={() => window.print()}
            />
          )
        )}
      </Panel>
    </div>
  );
};
export default ExamSchedule;
