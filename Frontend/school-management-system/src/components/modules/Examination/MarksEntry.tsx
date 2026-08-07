import React, { useState, useEffect, useMemo } from 'react';
import { Award, Search, AlertCircle, Edit, Calendar, BookOpen } from 'lucide-react';
import { MarksEntryTable } from './components/MarksEntryTable';
import { MarksEntrySummary } from './components/MarksEntrySummary';
import { CoScholasticAssessment } from './components/CoScholasticAssessment';
import { AttendanceSummary } from './components/AttendanceSummary';
import { ExamSetup, Student, GradeConfig, SubjectItem } from '../../../types';
import { Panel } from './components/SharedUI';
import { useMarksEntry, RosterMarkRowState } from './hooks/useMarksEntry';
import { useData } from '../../../context/DataContext';

interface MarksEntryProps {
  exam: ExamSetup | null;
  classOptions: string[];
  subjects: SubjectItem[];
  students: Student[];
  gradeRules: GradeConfig[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const MarksEntry: React.FC<MarksEntryProps> = ({
  exam,
  classOptions,
  subjects,
  students,
  gradeRules,
  addToast
}) => {
  const { isUserAdmin, allowedClasses, getAllowedSections, getAllowedSubjects, loadRosterMarks, saveRosterMarksDraft, submitRosterMarks } = useMarksEntry();
  const { studentAttendance, saveStudentAttendance, coScholasticAssessments, saveCoScholasticAssessment, saveMarks, examMarks } = useData();

  // dropdown states
  const [selectedClass, setSelectedClass] = useState(allowedClasses[0] || 'Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // active state
  const [marksState, setMarksState] = useState<Record<string, RosterMarkRowState>>({});
  
  // single student selection state for co-scholastic & attendance edit overlays
  const [focusedStudentId, setFocusedStudentId] = useState<string | null>(null);

  const subjectConfig = useMemo(() => {
    if (!exam || !selectedSubject) return { maxMarks: 100, passMarks: 35 };
    return exam.marksConfig?.subjectWiseConfig?.[selectedSubject] || {
      maxMarks: exam.marksConfig?.maxMarks || 100,
      passMarks: exam.marksConfig?.passMarks || 35
    };
  }, [exam, selectedSubject]);

  const maxMarks = Number(subjectConfig.maxMarks) || 100;
  const passMarks = Number(subjectConfig.passMarks) || 35;

  const currentMarksStatus = useMemo(() => {
    const states = Object.values(marksState);
    if (states.length === 0) return 'Not Started';
    const statuses = states.map(s => s.status);
    if (statuses.every(s => s === 'Locked')) return 'Locked';
    if (statuses.every(s => s === 'Verified')) return 'Verified';
    if (statuses.every(s => s === 'Submitted')) return 'Submitted';
    if (statuses.some(s => s === 'In Progress')) return 'In Progress';
    return statuses[0] || 'Not Started';
  }, [marksState]);

  const isMarksLocked = currentMarksStatus === 'Locked';

  // Sync allowed selections on mount or exam swap
  useEffect(() => {
    if (allowedClasses.length > 0) {
      const cls = allowedClasses[0];
      setSelectedClass(cls);
      
      const sections = getAllowedSections(cls);
      if (sections.length > 0) {
        const sec = sections[0];
        setSelectedSection(sec);
        
        const subjs = getAllowedSubjects(cls, sec);
        if (subjs.length > 0) {
          setSelectedSubject(subjs[0]);
        }
      }
    }
  }, [exam]);

  // Handle dropdown swaps
  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    const sections = getAllowedSections(cls);
    if (sections.length > 0) {
      setSelectedSection(sections[0]);
      const subjs = getAllowedSubjects(cls, sections[0]);
      if (subjs.length > 0) {
        setSelectedSubject(subjs[0]);
      } else {
        setSelectedSubject('');
      }
    } else {
      setSelectedSection('');
      setSelectedSubject('');
    }
  };

  const handleSectionChange = (sec: string) => {
    setSelectedSection(sec);
    const subjs = getAllowedSubjects(selectedClass, sec);
    if (subjs.length > 0) {
      setSelectedSubject(subjs[0]);
    } else {
      setSelectedSubject('');
    }
  };

  const activeClassStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass && s.section === selectedSection);
  }, [students, selectedClass, selectedSection]);

  // Load roster marks from context / draft
  useEffect(() => {
    if (exam && selectedClass && selectedSection && selectedSubject) {
      const initial = loadRosterMarks(exam.id, selectedClass, selectedSection, selectedSubject, activeClassStudents);
      setMarksState(initial);
      setFocusedStudentId(null);
    }
  }, [exam, selectedClass, selectedSection, selectedSubject, activeClassStudents]);

  const handleUpdateRow = (studentId: string, updates: Partial<RosterMarkRowState>) => {
    setMarksState(prev => {
      const existing = prev[studentId] || {
        attendance: 'Present',
        marks: '0',
        remarks: '',
        status: 'Not Started'
      };
      return {
        ...prev,
        [studentId]: {
          ...existing,
          ...updates,
          status: existing.status === 'Not Started' ? 'In Progress' : existing.status
        } as any
      };
    });
  };

  const handleSaveDraft = () => {
    if (!exam || !selectedClass || !selectedSection || !selectedSubject) return;
    saveRosterMarksDraft(exam.id, selectedClass, selectedSection, selectedSubject, marksState);
    addToast('success', 'Draft Saved', 'Marks entry draft has been saved locally.');
  };

  const handleSubmitMarks = () => {
    if (!exam || !selectedClass || !selectedSection || !selectedSubject) return;
    
    // Check validation of marks boundaries
    const invalid = Object.entries(marksState).some(([id, s]) => {
      const isAbsent = s.attendance === 'Absent' || s.attendance === 'Medical Leave' || s.attendance === 'Exempted';
      const mVal = Number(s.marks) || 0;
      return !isAbsent && (mVal < 0 || mVal > maxMarks);
    });

    if (invalid) {
      addToast('error', 'Validation Error', `Some student marks are invalid (must be between 0 and ${maxMarks}).`);
      return;
    }

    submitRosterMarks(exam.id, selectedClass, selectedSection, selectedSubject, marksState, maxMarks, passMarks);
    addToast('success', 'Marks Transmitted', 'Successfully submitted marks roster to Admin verification workflow.');
  };

  const handleVerifyMarks = () => {
    if (!exam || !selectedClass || !selectedSection || !selectedSubject) return;
    const formattedList = Object.entries(marksState).map(([studentId, state]) => {
      const isAbsent = state.attendance === 'Absent' || state.attendance === 'Medical Leave' || state.attendance === 'Exempted';
      return {
        examId: exam.id,
        studentId,
        subject: selectedSubject,
        marksObtained: isAbsent ? 0 : Number(state.marks) || 0,
        totalMarks: maxMarks,
        grade: '',
        isAbsent,
        maxMarks,
        passMarks,
        remarks: state.remarks,
        attendanceStatus: state.attendance,
        marksStatus: 'Verified' as const,
        isLocked: false
      };
    });
    saveMarks(formattedList);
    addToast('success', 'Marks Verified', 'Roster marks have been verified.');
  };

  const handleLockMarks = () => {
    if (!exam || !selectedClass || !selectedSection || !selectedSubject) return;
    const formattedList = Object.entries(marksState).map(([studentId, state]) => {
      const isAbsent = state.attendance === 'Absent' || state.attendance === 'Medical Leave' || state.attendance === 'Exempted';
      return {
        examId: exam.id,
        studentId,
        subject: selectedSubject,
        marksObtained: isAbsent ? 0 : Number(state.marks) || 0,
        totalMarks: maxMarks,
        grade: '',
        isAbsent,
        maxMarks,
        passMarks,
        remarks: state.remarks,
        attendanceStatus: state.attendance,
        marksStatus: 'Locked' as const,
        isLocked: true
      };
    });
    saveMarks(formattedList);
    addToast('success', 'Marks Locked', 'Roster marks have been locked. Teachers can no longer make edits.');
  };

  const handleUnlockMarks = () => {
    if (!exam || !selectedClass || !selectedSection || !selectedSubject) return;
    const formattedList = Object.entries(marksState).map(([studentId, state]) => {
      const isAbsent = state.attendance === 'Absent' || state.attendance === 'Medical Leave' || state.attendance === 'Exempted';
      return {
        examId: exam.id,
        studentId,
        subject: selectedSubject,
        marksObtained: isAbsent ? 0 : Number(state.marks) || 0,
        totalMarks: maxMarks,
        grade: '',
        isAbsent,
        maxMarks,
        passMarks,
        remarks: state.remarks,
        attendanceStatus: state.attendance,
        marksStatus: 'Submitted' as const,
        isLocked: false
      };
    });
    saveMarks(formattedList);
    addToast('info', 'Marks Unlocked', 'Roster marks have been unlocked for correction.');
  };

  // Stats calculators
  const totalStudents = activeClassStudents.length;
  const presentCount = Object.values(marksState).filter(m => m.attendance === 'Present').length;
  const absentCount = Object.values(marksState).filter(m => m.attendance === 'Absent').length;
  const totalScores = Object.values(marksState)
    .filter(m => m.attendance === 'Present')
    .map(m => Number(m.marks) || 0);
  const averageMarks = totalScores.length > 0 ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 0;

  // Single student focus configurations
  const focusedStudent = activeClassStudents.find(s => s.id === focusedStudentId);
  const focusedStudentAttendance = (studentAttendance as any[]).find((a: any) => a.studentId === focusedStudentId) || { workingDays: 220, presentDays: 200 };
  const focusedStudentCoScholastic = (coScholasticAssessments as any[]).find((c: any) => c.studentId === focusedStudentId) || {
    discipline: 'A',
    sports: 'A',
    artAndCraft: 'B+',
    generalConduct: 'A'
  };

  const handleSaveAttendance = (attendanceUpdates: any) => {
    if (!focusedStudentId) return;
    saveStudentAttendance({
      studentId: focusedStudentId,
      studentName: `${focusedStudent?.firstName} ${focusedStudent?.lastName}`,
      className: selectedClass,
      section: selectedSection,
      ...attendanceUpdates
    } as any);
    addToast('success', 'Attendance Recorded', 'Attendance statistics saved for this report card.');
  };

  const handleSaveCoScholastics = (updates: any) => {
    if (!focusedStudentId) return;
    if (saveCoScholasticAssessment) {
      saveCoScholasticAssessment({
        studentId: focusedStudentId,
        studentName: `${focusedStudent?.firstName} ${focusedStudent?.lastName}`,
        className: selectedClass,
        section: selectedSection,
        ...updates
      } as any);
      addToast('success', 'Grades Recorded', 'Co-scholastic evaluation criteria updated successfully.');
    }
  };

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Student Marks Entry Portal"
        description="Select class, section, and subject to input student attendance and assessment marks."
      >
        {(!exam?.id || !selectedSubject) && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Select an active exam and assigned subject to begin marks entry.</span>
          </div>
        )}

        {exam?.id && selectedSubject && (
          <div className="space-y-5">
            {/* Entry Filter Selection Cards */}
            <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-sm flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Class Selection</label>
                  <select
                    value={selectedClass}
                    onChange={e => handleClassChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[140px] h-[34px]"
                  >
                    {allowedClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Section</label>
                  <select
                    value={selectedSection}
                    onChange={e => handleSectionChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[100px] h-[34px]"
                  >
                    {getAllowedSections(selectedClass).map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Assigned Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[160px] h-[34px]"
                  >
                    {getAllowedSubjects(selectedClass, selectedSection).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Search Bar */}
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Roll No or Student Name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:border-sky-500 transition h-[34px]"
                />
              </div>
            </div>

            {/* Stats Summary Widgets */}
            <MarksEntrySummary
              total={totalStudents}
              present={presentCount}
              absent={absentCount}
              avgMarks={averageMarks}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmitMarks}
              isLocked={isMarksLocked}
              maxMarks={maxMarks}
              isUserAdmin={isUserAdmin}
              marksStatus={currentMarksStatus}
              onVerify={handleVerifyMarks}
              onLock={handleLockMarks}
              onUnlock={handleUnlockMarks}
            />

            {/* Roster Table */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-4">
                <MarksEntryTable
                  students={activeClassStudents}
                  marksState={marksState}
                  gradeRules={gradeRules}
                  searchQuery={searchQuery}
                  isLocked={isMarksLocked}
                  onUpdateRow={handleUpdateRow}
                  maxMarks={maxMarks}
                />
                
                {/* Auxiliary instructions */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-850 dark:bg-slate-900/30 text-[11px] text-slate-500 font-medium">
                  <p>💡 Tip: Click on any student row to open report card sidebars to configure non-academic evaluation grades and attendance summaries.</p>
                </div>
              </div>

              {/* Auxiliary Side Panels: Co-Scholastic & Attendance */}
              <div className="space-y-4">
                {/* Select student roster grid list */}
                <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-sm space-y-3">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Select Student to Evaluate</h5>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                    {activeClassStudents.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFocusedStudentId(s.id)}
                        className={`w-full text-left py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-between ${
                          focusedStudentId === s.id
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 shadow-sm'
                            : 'text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{s.firstName} {s.lastName}</span>
                        <span className="font-mono text-[10px] text-slate-400">Roll: {s.rollNo || 'N/A'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {focusedStudent && (
                  <>
                    <AttendanceSummary
                      studentId={focusedStudent.id}
                      studentName={`${focusedStudent.firstName} ${focusedStudent.lastName}`}
                      workingDays={focusedStudentAttendance.workingDays}
                      presentDays={focusedStudentAttendance.presentDays}
                      onChange={handleSaveAttendance}
                      onSave={() => addToast('success', 'Success', 'Attendance saved successfully')}
                    />

                    <CoScholasticAssessment
                      studentId={focusedStudent.id}
                      studentName={`${focusedStudent.firstName} ${focusedStudent.lastName}`}
                      discipline={focusedStudentCoScholastic.discipline}
                      sports={focusedStudentCoScholastic.sports}
                      artAndCraft={focusedStudentCoScholastic.artAndCraft}
                      generalConduct={focusedStudentCoScholastic.generalConduct}
                      onChange={handleSaveCoScholastics}
                      onSave={() => addToast('success', 'Success', 'Co-scholastic assessment saved')}
                    />
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </Panel>
    </div>
  );
};
export default MarksEntry;
