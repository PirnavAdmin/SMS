import React, { useState, useEffect, useMemo } from 'react';
import { Award, Search, Edit3, AlertCircle, CheckCircle, ArrowRight, X, Lock } from 'lucide-react';
import { MarksEntryTable } from './components/MarksEntryTable';
import { MarksEntrySummary } from './components/MarksEntrySummary';
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
  onGotoSetup?: () => void;
  onProceedToResults?: () => void;
}

export const MarksEntry: React.FC<MarksEntryProps> = ({
  exam,
  classOptions,
  subjects,
  students,
  gradeRules,
  addToast,
  onGotoSetup,
  onProceedToResults
}) => {
  const { isUserAdmin, allowedClasses, getAllowedSections, getAllowedSubjects, loadRosterMarks, saveRosterMarksDraft, submitRosterMarks } = useMarksEntry();
  const { studentAttendance, saveStudentAttendance, coScholasticAssessments, saveCoScholasticAssessment, saveMarks, examMarks } = useData();

  // dropdown states - starts clean with prompts
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);

  // active state
  const [marksState, setMarksState] = useState<Record<string, RosterMarkRowState>>({});

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

  // Handle dropdown swaps
  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    setSelectedSection('');
    setSelectedSubject('');
  };

  const handleSectionChange = (sec: string) => {
    setSelectedSection(sec);
    setSelectedSubject('');
  };

  // Only classes applicable to the active examination
  const examApplicableClasses = useMemo(() => {
    if (!exam) return Array.from(new Set((allowedClasses || []).filter(Boolean)));
    const app = exam.applicableClasses || [];
    if (app.length > 0) {
      return Array.from(new Set(allowedClasses.filter(c => app.includes(c))));
    }
    return Array.from(new Set((allowedClasses || []).filter(Boolean)));
  }, [exam, allowedClasses]);

  // Only display subjects configured / held for this specific examination with their subject codes
  const examSubjects = useMemo(() => {
    if (!exam) return [];
    
    // 1. Get subjects active in this exam setup
    const activeExamSubjectNames = Object.keys(exam.marksConfig?.subjectWiseConfig || {});
    
    // If active in exam setup, use them. Otherwise fallback to allowed class subjects
    const targetNames = activeExamSubjectNames.length > 0 
      ? activeExamSubjectNames 
      : (selectedClass && selectedSection ? getAllowedSubjects(selectedClass, selectedSection) : []);

    return targetNames.map(name => {
      // Find code from subjects list or generate clean code
      const matched = subjects.find(
        s => s.name.toLowerCase() === name.toLowerCase() || s.code?.toLowerCase() === name.toLowerCase()
      );
      const code = matched?.code || `${name.substring(0, 3).toUpperCase()}-101`;
      return {
        name,
        code,
        label: `${name} (${code})`
      };
    });
  }, [exam, selectedClass, selectedSection, subjects, getAllowedSubjects]);

  const activeClassStudents = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    return students.filter(s => s.className === selectedClass && s.section === selectedSection);
  }, [students, selectedClass, selectedSection]);

  const filteredGradeRules = useMemo(() => {
    const allRules = gradeRules || [];
    
    // 1. Try selected gradeSchemeName
    if (exam?.gradeSchemeName) {
      const matched = allRules.filter(r => r.schemeName === exam.gradeSchemeName);
      if (matched.length > 0) return matched;
    }
    
    // 2. Try examType name
    if (exam?.examType) {
      const typeStr = exam.examType;
      const matched = allRules.filter(r => 
        r.schemeName === typeStr || 
        r.examType === typeStr ||
        (r.schemeName && r.schemeName.toLowerCase().includes(typeStr.toLowerCase()))
      );
      if (matched.length > 0) return matched;
    }
    
    // 3. Fallback to Default Scholastic
    const defaultScholastic = allRules.filter(r => r.schemeName === 'Default Scholastic');
    if (defaultScholastic.length > 0) return defaultScholastic;
    
    return allRules;
  }, [gradeRules, exam]);

  // Load roster marks from context / draft
  useEffect(() => {
    if (exam && selectedClass && selectedSection && selectedSubject) {
      const initial = loadRosterMarks(exam.id, selectedClass, selectedSection, selectedSubject, activeClassStudents);
      setMarksState(initial);
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
    setMarksState(prev => {
      const next: Record<string, RosterMarkRowState> = {};
      Object.entries(prev).forEach(([k, v]) => {
        next[k] = { ...v, status: 'In Progress' };
      });
      return next;
    });
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
    setMarksState(prev => {
      const next: Record<string, RosterMarkRowState> = {};
      Object.entries(prev).forEach(([k, v]) => {
        next[k] = { ...v, status: 'Submitted' };
      });
      return next;
    });
    addToast('success', 'Marks Submitted', 'Successfully submitted student marks for verification.');
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
    setMarksState(prev => {
      const next: Record<string, RosterMarkRowState> = {};
      Object.entries(prev).forEach(([k, v]) => {
        next[k] = { ...v, status: 'Verified' };
      });
      return next;
    });
    setShowVerifyModal(true);
    addToast('success', 'Marks Verified', `Student marks for ${selectedSubject} have been verified.`);
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
    setMarksState(prev => {
      const next: Record<string, RosterMarkRowState> = {};
      Object.entries(prev).forEach(([k, v]) => {
        next[k] = { ...v, status: 'Locked' };
      });
      return next;
    });
    setShowVerifyModal(false);
    addToast('success', 'Marks Locked', 'Student marks have been locked. Further edits are disabled.');
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
    setMarksState(prev => {
      const next: Record<string, RosterMarkRowState> = {};
      Object.entries(prev).forEach(([k, v]) => {
        next[k] = { ...v, status: 'Submitted' };
      });
      return next;
    });
    addToast('info', 'Marks Unlocked', 'Student marks have been unlocked for correction.');
  };

  // Stats calculators
  const totalStudents = activeClassStudents.length;
  const presentCount = Object.values(marksState).filter(m => m.attendance === 'Present').length;
  const absentCount = Object.values(marksState).filter(m => m.attendance === 'Absent').length;
  const passCount = Object.values(marksState).filter(m => m.attendance === 'Present' && (Number(m.marks) || 0) >= passMarks).length;
  const failCount = presentCount - passCount;
  const passPercentage = presentCount > 0 ? Math.round((passCount / presentCount) * 100) : 0;
  const totalScores = Object.values(marksState)
    .filter(m => m.attendance === 'Present')
    .map(m => Number(m.marks) || 0);
  const averageMarks = totalScores.length > 0 ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 0;



  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Student Marks Entry"
      >
        {!exam?.id ? (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-between gap-3 flex-wrap shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Please select an examination template first under "Exam Configuration" to input student marks.</span>
            </div>
            {onGotoSetup && (
              <button
                type="button"
                onClick={onGotoSetup}
                className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs"
              >
                Go to Exam Configuration
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Entry Filter Selection Card */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-xs flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Class / Grade *</label>
                  <select
                    value={selectedClass}
                    onChange={e => handleClassChange(e.target.value)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[150px] h-[34px] shadow-xs"
                  >
                    <option value="">-- Select Class --</option>
                    {examApplicableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Section *</label>
                  <select
                    value={selectedSection}
                    onChange={e => handleSectionChange(e.target.value)}
                    disabled={!selectedClass}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[140px] h-[34px] shadow-xs disabled:opacity-50"
                  >
                    <option value="">-- Select Section --</option>
                    {getAllowedSections(selectedClass).map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Exam Subject *</label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    disabled={!selectedSection}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[210px] h-[34px] shadow-xs disabled:opacity-50"
                  >
                    <option value="">-- Select Exam Subject --</option>
                    {examSubjects.map(sub => (
                      <option key={sub.name} value={sub.name}>{sub.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Search Bar */}
              {selectedClass && selectedSection && selectedSubject && (
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Roll No or Student Name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:border-sky-500 transition h-[34px]"
                  />
                </div>
              )}
            </div>

            {(!selectedClass || !selectedSection || !selectedSubject) && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-2">
                <Edit3 className="w-8 h-8 text-sky-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Select Class, Section & Subject
                </h4>
              </div>
            )}

            {selectedClass && selectedSection && selectedSubject && (
              <div className="space-y-5 mt-5">
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
                <div className="w-full">
                  <MarksEntryTable
                    students={activeClassStudents}
                    marksState={marksState}
                    gradeRules={filteredGradeRules}
                    searchQuery={searchQuery}
                    isLocked={isMarksLocked}
                    onUpdateRow={handleUpdateRow}
                    maxMarks={maxMarks}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Verification Summary Alert Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowVerifyModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/60 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Marks Verified Successfully!
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedClass} - Section {selectedSection} • {selectedSubject}
                </p>
              </div>
            </div>

            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Total</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{totalStudents}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase text-emerald-600 block tracking-wider">Present</span>
                <span className="text-sm font-black text-emerald-600">{presentCount}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase text-rose-600 block tracking-wider">Absent</span>
                <span className="text-sm font-black text-rose-600">{absentCount}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase text-sky-600 block tracking-wider">Pass Rate</span>
                <span className="text-sm font-black text-sky-600">{passPercentage}%</span>
              </div>
            </div>

            {/* Status & Guidance Card */}
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: VERIFIED & READY</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                The student marks have been successfully verified. You can now proceed to <strong>Results & Reports</strong> to compute class merit ranks and generate report cards.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {onProceedToResults ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowVerifyModal(false);
                    onProceedToResults();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-sm shadow-sky-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Proceed to Results & Ranking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MarksEntry;
