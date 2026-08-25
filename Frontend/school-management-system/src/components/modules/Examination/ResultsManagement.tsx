import React, { useState, useMemo, useEffect } from 'react';
import { Award, Lock, Send, Calculator, AlertTriangle, Eye, Printer, FileSpreadsheet, LockOpen } from 'lucide-react';
import { ResultSummary } from './components/ResultSummary';
import { ResultVerification } from './components/ResultVerification';
import { ResultDetails } from './components/ResultDetails';
import { ExamSetup, Student, SubjectItem, ProcessedResult } from '../../../types';
import { Panel } from './components/SharedUI';
import { useResults } from './hooks/useResults';
import { useData } from '../../../context/DataContext';

interface ResultsManagementProps {
  exam: ExamSetup | null;
  classOptions: string[];
  subjects: SubjectItem[];
  students: Student[];
  selectedAcademicYear: string;
  selectedBranch: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  onNavigateToReportCards: () => void;
  onGotoSetup?: () => void;
}

export const ResultsManagement: React.FC<ResultsManagementProps> = ({
  exam,
  classOptions,
  subjects,
  students,
  selectedAcademicYear,
  selectedBranch,
  addToast,
  onNavigateToReportCards,
  onGotoSetup
}) => {
  const { processedResults, updateResultStatus, getResultsForExamClass, calculateClassResults, saveProcessedResults } = useResults();
  const { examMarks, academicClasses } = useData();

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [isCalculated, setIsCalculated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Dynamic sections from academicClasses
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const matched = academicClasses.find(c => c.name === selectedClass);
    if (!matched || !matched.sections || matched.sections.length === 0) return ['A'];
    const raw = matched.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || 'A'));
    return Array.from(new Set(raw.filter(Boolean)));
  }, [academicClasses, selectedClass]);

  // Detailed Modal Viewer State
  const [selectedResultRow, setSelectedResultRow] = useState<ProcessedResult | null>(null);

  // Load visible calculations roster
  const visibleResults = getResultsForExamClass(exam?.id || '', selectedClass, selectedSection);

  useEffect(() => {
    setIsCalculated(visibleResults.length > 0);
    setIsVerified(visibleResults.length > 0 && !!visibleResults[0]?.verifiedBy);
  }, [visibleResults]);

  const activeClassStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass && s.section === selectedSection);
  }, [students, selectedClass, selectedSection]);

  const activeSubjects = useMemo(() => {
    if (!exam || !selectedClass) return [];
    const classConfig = (exam.marksConfig as any)?.classWiseConfig?.[selectedClass];
    if (classConfig && Object.keys(classConfig).length > 0) {
      return Object.keys(classConfig);
    }
    const matchedClass = academicClasses.find(c => c.name === selectedClass);
    if (matchedClass && matchedClass.subjects && matchedClass.subjects.length > 0) {
      const names = matchedClass.subjects.map((sub: any) => typeof sub === 'string' ? sub : (sub.subjectName || sub.name || sub.subjectCode || sub.code || '')).filter(Boolean);
      if (names.length > 0) return names;
    }
    return Object.keys(exam.marksConfig?.subjectWiseConfig || {});
  }, [exam, selectedClass, academicClasses]);

  // Pre-calculations validation
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!exam) return issues;

    // Check if any student is missing marks for scheduled subjects
    activeClassStudents.forEach(student => {
      activeSubjects.forEach(sub => {
        const hasMark = examMarks.some(
          m => m.examId === exam.id && m.studentId === student.id && (m.subject || '').toLowerCase() === sub.toLowerCase()
        );
        if (!hasMark) {
          issues.push(`Marks missing for ${student.firstName} ${student.lastName} in ${sub}.`);
        }
      });
    });

    // Check if marks are locked for all scheduled subjects
    activeSubjects.forEach(sub => {
      const subMarks = examMarks.filter(
        m => m.examId === exam.id && 
             (m.className === selectedClass || activeClassStudents.some(s => s.id === m.studentId)) && 
             (m.section === selectedSection || activeClassStudents.some(s => s.id === m.studentId)) && 
             (m.subject || '').toLowerCase() === sub.toLowerCase()
      );
      if (subMarks.length === 0) {
        issues.push(`Marks not entered yet for subject: ${sub}.`);
      } else {
        const allLocked = subMarks.every(m => m.isLocked || (m as any).marksStatus === 'Locked');
        if (!allLocked) {
          issues.push(`Marks must be Locked for subject: ${sub} before calculation.`);
        }
      }
    });

    return Array.from(new Set(issues));
  }, [exam, activeClassStudents, activeSubjects, examMarks, selectedClass, selectedSection]);

  const handleCalculate = () => {
    if (!exam) return;
    calculateClassResults(exam.id, selectedClass, selectedSection, activeClassStudents, activeSubjects);
    addToast('success', 'Calculations Done', `Processed exam results, averages, and ranks for ${activeClassStudents.length} students.`);
    setIsCalculated(true);
  };

  const handleVerify = () => {
    const updated = visibleResults.map(r => ({
      ...r,
      verifiedBy: 'Administrator',
      verifiedAt: new Date().toISOString().split('T')[0]
    }));
    saveProcessedResults(updated);
    addToast('info', 'Results Verified', 'Results marks roster verified. Ready for approval.');
  };

  const handleApprove = () => {
    const updated = visibleResults.map(r => ({
      ...r,
      status: 'Approved' as const,
      approvedBy: 'Administrator',
      approvedAt: new Date().toISOString().split('T')[0]
    }));
    saveProcessedResults(updated);
    addToast('success', 'Results Approved', 'Results approved by controller and locked. Ready for publishing.');
  };

  const handlePublish = () => {
    const updated = visibleResults.map(r => ({
      ...r,
      status: 'Published' as const,
      publishedAt: new Date().toISOString().split('T')[0]
    }));
    saveProcessedResults(updated);
    addToast('success', 'Results Released', 'Results have been published and are now visible on Parent/Student portals.');
  };

  const handleLockToggle = () => {
    const currentStatus = visibleResults[0]?.status;
    const nextStatus = currentStatus === 'Locked' ? 'Calculated' : 'Locked';
    const updated = visibleResults.map(r => ({
      ...r,
      status: nextStatus as ProcessedResult['status'],
      lockedAt: nextStatus === 'Locked' ? new Date().toISOString().split('T')[0] : undefined
    }));
    saveProcessedResults(updated);
    addToast('info', nextStatus === 'Locked' ? 'Results Locked' : 'Results Unlocked', `Successfully set results status to ${nextStatus}.`);
  };

  // Stats calculation
  const totalCount = visibleResults.length;
  const passCount = visibleResults.filter(r => r.passStatus === 'Pass').length;
  const failCount = visibleResults.filter(r => r.passStatus === 'Fail').length;
  const publishedCount = visibleResults.filter(r => r.status === 'Published').length;
  const averagePercentage = totalCount > 0 ? visibleResults.reduce((a, b) => a + b.percentage, 0) / totalCount : 0;

  const currentResultStatus = visibleResults[0]?.status || 'Draft';

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-250';
      case 'Approved': return 'bg-sky-100 text-sky-850 dark:bg-sky-950 dark:text-sky-300 border-sky-200';
      case 'Locked': return 'bg-slate-900 text-white dark:bg-slate-800 border-slate-700';
      case 'Verified': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200';
      case 'Calculated': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 border-slate-700';
    }
  };

  const tableHeaderClass = "px-4 py-2 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50 dark:bg-slate-805/80 border-b border-slate-100 dark:border-slate-800";

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Results Verification & Publishing"
        //description="Verify overall student performance, approve result summaries, lock evaluations, and publish report cards."
        action={
          <div className="flex items-center gap-2">
            {isCalculated && (
              <button
                onClick={onNavigateToReportCards}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-sm transition cursor-pointer"
              >
                Bulk Print Report Cards
              </button>
            )}

            <button
              disabled={!exam || validationIssues.length > 0 || (isCalculated && (currentResultStatus === 'Locked' || currentResultStatus === 'Approved' || currentResultStatus === 'Published'))}
              onClick={handleCalculate}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              {isCalculated ? 'Recalculate Results' : 'Calculate Results'}
            </button>
          </div>
        }
      >
        {!exam?.id && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Please select an examination template first to review results calculations.</span>
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

        {exam?.id && (
          <div className="space-y-5">
            {/* Filter selectors */}
            <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-sm flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Class / Grade <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={selectedClass}
                    onChange={e => {
                      setSelectedClass(e.target.value);
                      setSelectedSection('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[150px] h-[34px] shadow-xs"
                  >
                    <option value="">-- Select Class --</option>
                    {classOptions.map(cls => (
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
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[140px] h-[34px] shadow-xs disabled:opacity-50"
                  >
                    <option value="">-- Select Section --</option>
                    {availableSections.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status workflow quick buttons */}
              {selectedClass && selectedSection && isCalculated && (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${getStatusBadgeColor(currentResultStatus)}`}>
                    Status: {currentResultStatus}
                  </span>
                  
                  {currentResultStatus === 'Approved' && (
                    <button
                      onClick={handlePublish}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Publish Release
                    </button>
                  )}

                  <button
                    onClick={handleLockToggle}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1 cursor-pointer ${
                      currentResultStatus === 'Locked'
                        ? 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {currentResultStatus === 'Locked' ? (
                      <>
                        <LockOpen className="w-3.5 h-3.5" /> Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Lock Results
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {!selectedClass || !selectedSection ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-2">
                <Award className="w-8 h-8 text-sky-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Select Class & Section to Process Results
                </h4>
              </div>
            ) : (
              <>
                {/* Results KPI Summary widget */}
                {isCalculated && (
                  <ResultSummary
                    total={totalCount}
                    passCount={passCount}
                    failCount={failCount}
                    publishedCount={publishedCount}
                    avgPercent={averagePercentage}
                  />
                )}

                {/* Verification checklist card */}
                <ResultVerification
                  issues={validationIssues}
                  isVerified={isVerified}
                  onVerify={handleVerify}
                  onApprove={handleApprove}
                  status={currentResultStatus}
                />

                {/* Calculated Grid */}
                {isCalculated && (
                  <div className="overflow-x-auto rounded-3xl border border-sky-400 dark:border-sky-500 shadow-sm">
                    <table className="min-w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 font-bold uppercase">
                          <th className={tableHeaderClass}>Rank</th>
                          <th className={tableHeaderClass}>Roll No.</th>
                          <th className={tableHeaderClass}>Student Name</th>
                          <th className={tableHeaderClass}>Percentage</th>
                          <th className={tableHeaderClass}>Overall Grade</th>
                          <th className={tableHeaderClass}>GPA</th>
                          <th className={tableHeaderClass}>Result</th>
                          <th className={tableHeaderClass}>Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {visibleResults.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                            <td className="px-4 py-3 font-mono font-black text-amber-600 text-sm">#{r.rank}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-500">{r.rollNo || 'N/A'}</td>
                            <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">{r.studentName}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{r.percentage.toFixed(1)}%</td>
                            <td className="px-4 py-3 font-black text-indigo-600 dark:text-indigo-400">{r.finalGrade}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{r.gpa}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                r.passStatus === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {r.passStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setSelectedResultRow(r)}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition"
                              >
                                <Eye className="w-3 h-3" /> View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Panel>

      {/* Result details modal overlay */}
      {selectedResultRow && (
        <ResultDetails
          data={selectedResultRow}
          exam={exam}
          academicYear={selectedAcademicYear}
          branch={selectedBranch}
          subjects={subjects}
          onClose={() => setSelectedResultRow(null)}
          onPrintCard={() => window.print()}
          onDownloadPdf={() => addToast('info', 'Download PDF', 'Generating PDF report card sheet...')}
        />
      )}
    </div>
  );
};
export default ResultsManagement;
