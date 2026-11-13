import React, { useMemo } from 'react';
import { X, Printer, Award, AlertTriangle, GraduationCap } from 'lucide-react';
import { Student, ExamSetup, ExamMark, ProcessedResult } from '../../../types';
import { useData } from '../../../context/DataContext';
import { calculateCompetitionRanks } from './utils/ranking';
import { calculateStudentResult, calculateGrade } from './utils/resultCalculation';
import { resolveMediaUrl } from '../../../utils/mediaUtils';

export interface PrintableReportCardProps {
  student: Student | null;
  exam: ExamSetup | null;
  isOpen?: boolean;
  onClose: () => void;
  schoolProfile?: any;
  examMarks?: ExamMark[];
  processedResult?: ProcessedResult;
  attendance?: { workingDays: number; presentDays: number };
  coScholastic?: { discipline: string; sports: string; artAndCraft: string; generalConduct: string };
}

export const PrintableReportCard: React.FC<PrintableReportCardProps> = ({
  student,
  exam,
  isOpen = true,
  onClose,
  schoolProfile: propSchoolProfile,
  examMarks: propExamMarks,
  processedResult: propProcessedResult,
  attendance: propAttendance,
  coScholastic: propCoScholastic
}) => {
  const contextData = useData();
  const schoolProfile = propSchoolProfile || contextData.schoolProfile || {};

  const rawLogo = schoolProfile?.logoUrl || contextData.schoolProfile?.logoUrl;
  const logoUrl = resolveMediaUrl(rawLogo);

  const {
    examMarks: allExamMarks = [],
    processedResults: allProcessedResults = [],
    examSchedules = [],
    gradeConfigurations = [],
    students = [],
    exams = [],
    academicYears = []
  } = contextData;

  // Resolve matching student from database to populate missing fields (e.g. father/guardian name, roll number)
  const dbStudent = useMemo(() => {
    const studentId = student?.id || propProcessedResult?.studentId;
    const admissionNo = student?.admissionNo || propProcessedResult?.admissionNo;
    const rollNo = student?.rollNo || propProcessedResult?.rollNo;

    return students.find(s =>
      (studentId && String(s.id) === String(studentId)) ||
      (admissionNo && String(s.admissionNo).trim().toLowerCase() === String(admissionNo).trim().toLowerCase()) ||
      (rollNo && String(s.rollNo).trim().toLowerCase() === String(rollNo).trim().toLowerCase())
    );
  }, [students, student, propProcessedResult]);

  // Construct normalized active student
  const activeStudent: Student | null = useMemo(() => {
    if (student) {
      return {
        ...student,
        fatherName: student.fatherName || (dbStudent as any)?.fatherName || (dbStudent as any)?.parentName || ''
      };
    }
    if (dbStudent) return dbStudent;
    if (propProcessedResult) {
      const nameParts = (propProcessedResult.studentName || 'Student').trim().split(' ');
      return {
        id: propProcessedResult.studentId || '',
        firstName: nameParts[0] || 'Student',
        lastName: nameParts.slice(1).join(' ') || '',
        rollNo: propProcessedResult.rollNo || '',
        admissionNo: propProcessedResult.admissionNo || propProcessedResult.studentId || '',
        className: propProcessedResult.className || '',
        section: propProcessedResult.section || '',
        fatherName: (propProcessedResult as any).fatherName || (propProcessedResult as any).parentName || '',
        status: 'Active'
      } as Student;
    }
    return null;
  }, [student, dbStudent, propProcessedResult]);

  const currentAcademicYear =
    schoolProfile?.academicYear ||
    academicYears.find((y: any) => y.status === 'Active')?.academicYear ||
    academicYears[0]?.academicYear ||
    '';

  // Construct normalized active exam
  const activeExam: ExamSetup | null = useMemo(() => {
    if (exam) return exam;
    const examId = propProcessedResult?.examId;
    const foundExam = exams.find((e: any) => String(e.id) === String(examId));
    if (foundExam) return foundExam;
    if (propProcessedResult) {
      return {
        id: propProcessedResult.examId || '',
        name: (propProcessedResult as any).examName || 'Examination',
        academicYear: currentAcademicYear,
        className: propProcessedResult.className || '',
        startDate: '',
        endDate: '',
        status: 'Published',
        publishStatus: 'Published'
      } as unknown as ExamSetup;
    }
    return null;
  }, [exam, propProcessedResult, exams, currentAcademicYear]);

  // Find processed result for aggregate values
  const result = useMemo(() => {
    if (propProcessedResult) return propProcessedResult;
    if (!activeExam || !activeStudent) return undefined;
    return allProcessedResults.find(r =>
      String(r.examId) === String(activeExam.id) && String(r.studentId) === String(activeStudent.id)
    );
  }, [propProcessedResult, allProcessedResults, activeExam, activeStudent]);

  const isReleased = Boolean(
    activeExam?.publishStatus === 'Published' ||
    activeExam?.status === 'Results Published' ||
    result?.status === 'Published'
  );

  // Subject schedules & grading configuration
  const classSchedules = useMemo(() => {
    if (!activeExam || !activeStudent) return [];
    return examSchedules.filter(s => s.examId === activeExam.id && s.className === activeStudent.className);
  }, [examSchedules, activeExam, activeStudent]);

  const subjectWiseMap = useMemo(() => {
    const map: Record<string, { maxMarks: number; passMarks: number }> = {};
    classSchedules.forEach(s => {
      if (s.subject) {
        map[s.subject] = { maxMarks: s.maxMarks, passMarks: s.passMarks };
        map[s.subject.toLowerCase()] = { maxMarks: s.maxMarks, passMarks: s.passMarks };
      }
    });
    return map;
  }, [classSchedules]);

  const fullExam = useMemo(() => {
    if (!activeExam) return undefined;
    return exams.find((e: any) => String(e.id) === String(activeExam.id));
  }, [exams, activeExam]);

  const effectiveExamType =
    (activeExam as any)?.examType ||
    (activeExam as any)?.assessmentType ||
    fullExam?.examType ||
    (fullExam as any)?.assessmentType ||
    (result as any)?.examType ||
    (result as any)?.assessmentType ||
    (activeExam as any)?.gradeSchemeName ||
    '';

  // Compute normalized subject rows and grand totals cleanly without boilerplate
  const performance = useMemo(() => {
    if (!activeStudent || !activeExam) {
      return {
        subjectMarks: [] as any[],
        totalObtained: 0,
        totalMax: 0,
        percentage: 0,
        overallGrade: '—',
        overallResult: '—',
        gpa: 0
      };
    }

    const rawSubjectList: any[] = [];
    if (result?.subjectMarks && Array.isArray(result.subjectMarks) && result.subjectMarks.length > 0) {
      rawSubjectList.push(...result.subjectMarks);
    } else {
      const studentMarks = (propExamMarks && propExamMarks.length > 0)
        ? propExamMarks
        : allExamMarks.filter(m => m.examId === activeExam.id && String(m.studentId) === String(activeStudent.id));
      rawSubjectList.push(...studentMarks);
    }

    const subjectMap = new Map<string, any>();
    rawSubjectList.forEach(item => {
      const name = (item.subject || item.subjectName || item.name || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!subjectMap.has(key)) {
        const spec = subjectWiseMap[name] || subjectWiseMap[key] || {};
        const maxMarks = Number(item.maxMarks || item.totalMarks || spec.maxMarks) || 100;
        const passMarks = Number(item.passMarks || item.passLimit || spec.passMarks) || Math.round(maxMarks * 0.35);

        const rawObtained = item.obtainedMarks !== undefined ? item.obtainedMarks : item.marks;
        const isAbsent = rawObtained === 'AB' || String(rawObtained).toLowerCase() === 'absent';
        const numObtained = isAbsent ? 0 : (typeof rawObtained === 'number' ? rawObtained : (parseFloat(String(rawObtained || 0)) || 0));
        const isPass = isAbsent ? false : (item.isPass !== undefined ? Boolean(item.isPass) : numObtained >= passMarks);

        const subjectPct = maxMarks > 0 ? (numObtained / maxMarks) * 100 : 0;
        const subjectGrade = (item.grade && item.grade !== '-' && item.grade !== '—' && item.grade !== '')
          ? item.grade
          : (isAbsent ? '-' : calculateGrade(subjectPct, gradeConfigurations, 'Percentage', effectiveExamType));

        subjectMap.set(key, {
          subject: name,
          maxMarks,
          passMarks,
          obtainedMarks: isAbsent ? 'AB' : numObtained,
          grade: subjectGrade,
          isPass
        });
      }
    });

    const subjectMarks = Array.from(subjectMap.values());

    const sumObtained = subjectMarks.reduce((sum, sm) => {
      if (sm.obtainedMarks === 'AB') return sum;
      return sum + (Number(sm.obtainedMarks) || 0);
    }, 0);
    const sumMax = subjectMarks.reduce((sum, sm) => sum + (Number(sm.maxMarks) || 0), 0);

    const explicitObt = result?.totalObtainedMarks ?? (result as any)?.totalMarksObtained ?? (result as any)?.totalMarks ?? (result as any)?.totalObtained;
    const totalObtained = (explicitObt !== undefined && explicitObt !== null && Number(explicitObt) > 0)
      ? Number(explicitObt)
      : sumObtained;

    const explicitMax = result?.totalMaxMarks ?? (result as any)?.totalMax ?? (result as any)?.maxMarks;
    const totalMax = (explicitMax !== undefined && explicitMax !== null && Number(explicitMax) > 0)
      ? Number(explicitMax)
      : (sumMax > 0 ? sumMax : 100);

    const percentage = (result?.percentage !== undefined && result.percentage !== null && Number(result.percentage) > 0)
      ? Number(result.percentage)
      : (totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0);

    const overallGrade = result?.finalGrade || (result as any)?.overallGrade || (result as any)?.grade || calculateGrade(percentage, gradeConfigurations, 'Percentage', effectiveExamType);

    const allAbsent = subjectMarks.length > 0 && subjectMarks.every(sm => sm.obtainedMarks === 'AB');
    const hasFails = subjectMarks.some(sm => !sm.isPass);
    const overallResult = allAbsent ? 'ABSENT' : (hasFails || percentage < 35 ? 'FAIL' : 'PASS');
    const gpa = Number((result as any)?.gpa || (result as any)?.gradePoint) || 0;

    return {
      subjectMarks,
      totalObtained,
      totalMax,
      percentage,
      overallGrade,
      overallResult,
      gpa
    };
  }, [activeStudent, activeExam, result, propExamMarks, allExamMarks, subjectWiseMap, gradeConfigurations, effectiveExamType]);

  // Calculate Rank in Class Section
  const rank = useMemo(() => {
    if (result?.rank) return String(result.rank);
    if (!activeStudent || !activeExam) return '';
    const classStudents = students.filter(s => s.className === activeStudent.className && (!s.section || s.section === activeStudent.section));
    const scores = classStudents.map(st => {
      const stMarks = allExamMarks.filter(m => m.examId === activeExam.id && m.studentId === st.id);
      const calculated = calculateStudentResult(stMarks, [], gradeConfigurations, subjectWiseMap, effectiveExamType);
      return { studentId: st.id, score: calculated.totalObtained };
    });
    const ranksMap = calculateCompetitionRanks(scores);
    return ranksMap[activeStudent.id] || '';
  }, [result, activeStudent, activeExam, students, allExamMarks, gradeConfigurations, subjectWiseMap, effectiveExamType]);

  if (!activeStudent || !activeExam) return null;

  const handlePrint = () => {
    window.print();
  };

  const wrapContent = (
    <div
      id="printable-report-card-sheet"
      className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 p-6 space-y-5 print:p-2 print:space-y-4 print:overflow-visible report-card-sheet text-xs"
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm !important;
          }
          html, body {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .printable-report-card-backdrop {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            filter: none !important;
            backdrop-filter: none !important;
            transform: none !important;
          }
          .printable-report-card-dialog {
            position: static !important;
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
          }
          #printable-report-card-sheet,
          #printable-report-card-sheet * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-report-card-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 4px 6px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #printable-report-card-sheet table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          #printable-report-card-sheet th {
            background-color: #f1f5f9 !important;
            color: #334155 !important;
            font-weight: 800 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-report-card-sheet td {
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Unofficial Draft Watermark if exam not published */}
      {!isReleased && (
        <div className="no-print p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Notice: This report card contains preview draft marks prior to official release.</span>
        </div>
      )}

      {/* School Header & Crest */}
      <div className="flex items-center justify-between gap-5 pb-4 border-b-2 border-slate-900 dark:border-slate-100">
        {/* Left Side Logo */}
        <div className="shrink-0">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={schoolProfile?.name || 'School Logo'} 
              style={{ width: '130px', height: '60px', maxHeight: '60px', maxWidth: '130px', objectFit: 'contain' }}
              className="rounded-xl shadow-xs"
            />
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-800 shadow-xs">
              <GraduationCap className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              <span className="text-xl font-black italic tracking-wider text-sky-700 dark:text-sky-400">
                {(schoolProfile?.name || 'School').split(' ')[0]} <span className="text-[9px] font-bold tracking-widest uppercase block text-sky-600 dark:text-sky-400 text-center not-italic">EDUCATION</span>
              </span>
            </div>
          )}
        </div>

        {/* Center School Details */}
        <div className="flex-1 text-center font-sans space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            {schoolProfile?.name || 'Pirnav Educational Institution'}
          </h1>
          {schoolProfile?.address && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold max-w-xl mx-auto leading-tight">
              {schoolProfile.address}
            </p>
          )}
          {(schoolProfile?.phone || schoolProfile?.email) && (
            <p className="text-[10px] text-slate-500 font-bold">
              {[
                schoolProfile?.phone ? `Ph: ${schoolProfile.phone}` : null,
                schoolProfile?.email ? `Email: ${schoolProfile.email}` : null
              ].filter(Boolean).join(' • ')}
            </p>
          )}

          <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
            <span
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
              className="inline-block px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xs"
            >
              STUDENT ACADEMIC PROGRESS REPORT CARD
            </span>
            {activeExam.name && (
              <span
                style={{ color: '#eab308' }}
                className="text-xs font-black uppercase"
              >
                ({activeExam.name})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Student Profile Information Grid */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}
        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
      >
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Student Full Name</span>
          <p className="font-black text-slate-900 dark:text-white text-xs mt-0.5">{activeStudent.firstName} {activeStudent.lastName}</p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Student ID / Roll No</span>
          <p className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs mt-0.5">ID: {activeStudent.admissionNo || activeStudent.id} / Roll: {activeStudent.rollNo || '—'}</p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Class & Section</span>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
            {activeStudent.className || '—'}{activeStudent.section ? (activeStudent.section.toLowerCase() === 'unassigned' ? ' (Unassigned)' : ` (Section ${activeStudent.section})`) : ''}
          </p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Father / Guardian Name</span>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{activeStudent.fatherName || '—'}</p>
        </div>
      </div>

      {/* Subject Performance Marks Table */}
      <div className="space-y-2">
        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">PROGRESS REPORT</h4>
        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700 text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase border-b border-slate-300 dark:border-slate-700 text-[11px]">
              <th className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700">Subject Name</th>
              <th className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center">Max Marks</th>
              <th className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center">Pass Limit</th>
              <th className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center">Marks Obtained</th>
              <th className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center">Subject Grade</th>
              <th className="py-2.5 px-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
            {performance.subjectMarks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-400 italic">No subject marks recorded for this examination.</td>
              </tr>
            ) : (
              performance.subjectMarks.map((sub: any, index: number) => {
                const isAbsent = sub.obtainedMarks === 'AB';
                return (
                  <tr key={`${sub.subject}-${index}`} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50">
                    <td className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-800 font-bold">{sub.subject}</td>
                    <td className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-800 text-center font-mono">{sub.maxMarks}</td>
                    <td className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-800 text-center font-mono">{sub.passMarks}</td>
                    <td className={`py-2 px-3.5 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-black ${
                      isAbsent ? 'text-rose-500' : !sub.isPass ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                    }`}>
                      {sub.obtainedMarks}
                    </td>
                    <td className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-800 text-center font-black">{sub.grade}</td>
                    <td className="py-2 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isAbsent ? 'bg-slate-100 text-slate-500' :
                        !sub.isPass ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isAbsent ? 'Absent' : sub.isPass ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}

            {/* Total Row */}
            <tr className="bg-slate-100 dark:bg-slate-800 font-black text-xs border-t-2 border-slate-350 dark:border-slate-700">
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700">Aggregate Total</td>
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono">{performance.totalMax}</td>
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono">—</td>
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono text-amber-500 font-black">{performance.totalObtained}</td>
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center text-emerald-600 font-extrabold">{performance.percentage}%</td>
              <td className="py-2.5 px-3.5 text-center font-mono font-bold text-xs">{performance.overallResult}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Performance Summary Metrics Cards */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}
        className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center font-bold"
      >
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">Class Rank</span>
          <p className="text-amber-500 font-black text-base">{rank ? `#${rank}` : '—'}</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">Aggregate Percentage</span>
          <p className="text-slate-900 dark:text-white font-black text-base">{performance.percentage}%</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">{performance.gpa > 0 ? 'GPA / Grade' : 'Grade'}</span>
          <p className="text-emerald-600 font-black text-base">{performance.gpa > 0 ? `${performance.gpa.toFixed(1)} / ` : ''}{performance.overallGrade || '—'}</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">Final Result</span>
          <p className={`font-black text-base uppercase ${performance.overallResult === 'PASS' ? 'text-emerald-600' : performance.overallResult === 'FAIL' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
            {performance.overallResult || '—'}
          </p>
        </div>
      </div>

      {/* Teacher Remarks Box */}
      {result?.remarks && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium space-y-1">
          <span className="block text-[10px] uppercase text-slate-400 font-black">Class Teacher Feedback & Remarks</span>
          <p className="text-slate-850 dark:text-slate-200 italic font-semibold text-xs">
            "{result.remarks}"
          </p>
        </div>
      )}

      {/* Bottom Official Signatures Block */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '32px' }}
        className="items-center pt-5 border-t border-slate-200 dark:border-slate-800"
      >
        <div className="text-center space-y-1">
          <div className="w-40 mx-auto border-t-2 border-slate-900 dark:border-slate-100 pt-2 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
            Class Teacher Signature
          </div>
        </div>

        <div className="text-center space-y-1">
          <div className="w-40 mx-auto border-t-2 border-slate-900 dark:border-slate-100 pt-2 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
            Principal Signature & Stamp
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return wrapContent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto printable-report-card-backdrop">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh] printable-report-card-dialog">
        
        {/* Top Controls Header Bar */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between border-b shrink-0 border-slate-200 dark:border-slate-700 no-print">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-md">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-tight">Academic Progress Report Card</h3>
              <p className="text-[10px] text-slate-500 font-bold">{activeStudent.firstName} {activeStudent.lastName} ({activeStudent.className}{activeStudent.section ? `-${activeStudent.section}` : ''})</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div className="flex-1 overflow-y-auto print:overflow-visible">
          {wrapContent}
        </div>
      </div>
    </div>
  );
};

export default PrintableReportCard;
