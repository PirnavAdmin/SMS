import React from 'react';
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
  const schoolProfile = propSchoolProfile || contextData.schoolProfile;

  const rawLogo = schoolProfile?.logoUrl || contextData.schoolProfile?.logoUrl;
  const logoUrl = resolveMediaUrl(rawLogo);

  const allExamMarks = contextData.examMarks;
  const allProcessedResults = contextData.processedResults;
  const examSchedules = contextData.examSchedules;
  const gradeConfigurations = contextData.gradeConfigurations;
  const students = contextData.students;

  const effectiveStudent: Student | null = student || (propProcessedResult ? {
    id: propProcessedResult.studentId || '1',
    firstName: (propProcessedResult.studentName || 'Student').trim().split(' ')[0] || 'Student',
    lastName: (propProcessedResult.studentName || '').trim().split(' ').slice(1).join(' ') || '',
    rollNo: propProcessedResult.rollNo || '',
    admissionNo: propProcessedResult.admissionNo || propProcessedResult.studentId || '',
    className: propProcessedResult.className || '',
    section: propProcessedResult.section || '',
    fatherName: 'Parent/Guardian',
    status: 'Active'
  } as Student : null);

  const currentAcademicYear =
    schoolProfile?.academicYear ||
    contextData.academicYears?.find((y: any) => y.status === 'Active')?.academicYear ||
    contextData.academicYears?.[0]?.academicYear ||
    '';

  const effectiveExam: ExamSetup | null = exam || (propProcessedResult ? ({
    id: propProcessedResult.examId || '1',
    name: 'Academic Examination',
    academicYear: currentAcademicYear,
    className: propProcessedResult.className || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'Published',
    publishStatus: 'Published'
  } as unknown as ExamSetup) : null);

  if (!effectiveStudent || !effectiveExam) return null;

  const activeStudent = effectiveStudent;
  const activeExam = effectiveExam;

  // Find processed result for aggregate values
  const result = propProcessedResult || allProcessedResults.find(r => 
    r.examId === activeExam.id && 
    (
      String(r.studentId) === String(activeStudent.id) ||
      (activeStudent.rollNo && String(r.rollNo) === String(activeStudent.rollNo)) ||
      (activeStudent.admissionNo && String(r.admissionNo) === String(activeStudent.admissionNo))
    )
  );
  const isReleased = activeExam.publishStatus === 'Published' || activeExam.status === 'Results Published' || result?.status === 'Published';

  // Get student marks list and deduplicate by subject name
  const rawMarks = (propExamMarks && propExamMarks.length > 0)
    ? propExamMarks
    : allExamMarks.filter(m => 
        m.examId === activeExam.id && 
        (
          String(m.studentId) === String(activeStudent.id) ||
          (activeStudent.rollNo && String((m as any).rollNo) === String(activeStudent.rollNo)) ||
          (activeStudent.admissionNo && String((m as any).admissionNo) === String(activeStudent.admissionNo))
        )
      );

  const uniqueMarksMap = new Map<string, ExamMark>();
  rawMarks.forEach(m => {
    const sName = (m.subject || '').trim();
    if (sName && !uniqueMarksMap.has(sName)) {
      uniqueMarksMap.set(sName, m);
    }
  });
  const marks = Array.from(uniqueMarksMap.values());

  const classSchedules = examSchedules.filter(s => s.examId === activeExam.id && s.className === activeStudent.className);

  // Compute subjects list (unique subject names)
  const subjectsList = Array.from(new Set([
    ...classSchedules.map(s => s.subject),
    ...marks.map(m => m.subject),
    ...(result?.subjectMarks || []).map((sm: any) => sm.subject || sm.subjectName || sm.name)
  ].map(s => (s || '').trim()))).filter(Boolean);

  const fullExam = (contextData.exams || []).find((e: any) => String(e.id) === String(activeExam.id));
  const effectiveExamType = (activeExam as any).examType || 
    (activeExam as any).assessmentType || 
    fullExam?.examType || 
    (fullExam as any)?.assessmentType || 
    (result as any)?.examType || 
    (result as any)?.assessmentType || 
    (activeExam as any).gradeSchemeName ||
    '';

  // Get custom subject wise specs (max & pass marks)
  const subjectWiseMap: Record<string, { maxMarks: number; passMarks: number }> = {};
  classSchedules.forEach(s => {
    if (s.subject) {
      subjectWiseMap[s.subject] = { maxMarks: s.maxMarks, passMarks: s.passMarks };
    }
  });

  const res: any = calculateStudentResult(marks, subjectsList, gradeConfigurations, subjectWiseMap, effectiveExamType);

  // If result has official subjectMarks from the database/release, deduplicate and use them!
  if (result?.subjectMarks && Array.isArray(result.subjectMarks) && result.subjectMarks.length > 0) {
    const subMap = new Map<string, any>();
    result.subjectMarks.forEach((sm: any) => {
      const sName = (sm.subject || sm.subjectName || sm.name || '').trim();
      if (sName && !subMap.has(sName)) {
        subMap.set(sName, sm);
      }
    });
    res.subjectMarks = Array.from(subMap.values());
    const sumSubObtained = res.subjectMarks.reduce((sum: number, sm: any) => {
      const obt = sm.obtainedMarks ?? sm.marks;
      if (obt === 'AB' || String(obt).toLowerCase() === 'absent') return sum;
      return sum + (typeof obt === 'number' ? obt : (Number(obt) || 0));
    }, 0);
    const sumSubMax = res.subjectMarks.reduce((sum: number, sm: any) => sum + (Number(sm.maxMarks || sm.totalMarks) || 100), 0);

    const explicitObt = result.totalObtainedMarks ?? (result as any).totalMarksObtained ?? (result as any).totalMarks ?? (result as any).totalObtained ?? (result as any).obtainedMarks;
    res.totalObtained = (explicitObt !== undefined && explicitObt !== null && Number(explicitObt) > 0)
      ? Number(explicitObt)
      : (sumSubObtained > 0 ? sumSubObtained : (res.totalObtained > 0 ? res.totalObtained : 0));

    const explicitMax = result.totalMaxMarks ?? (result as any).totalMax ?? (result as any).maxMarks;
    res.totalMax = (explicitMax !== undefined && explicitMax !== null && Number(explicitMax) > 0)
      ? Number(explicitMax)
      : (sumSubMax > 0 ? sumSubMax : (res.totalMax > 0 ? res.totalMax : 0));

    res.percentage = (result.percentage !== undefined && result.percentage !== null && result.percentage > 0)
      ? result.percentage
      : (res.totalMax > 0 ? parseFloat(((res.totalObtained / res.totalMax) * 100).toFixed(1)) : 0);
    res.finalGrade = result.finalGrade || result.overallGrade || (result as any).grade || res.finalGrade || '';
    res.overallGrade = res.finalGrade;
    res.passStatus = result.passStatus || (result as any).resultStatus || (result as any).result || (result as any).status || '-';
  } else if (result) {
    const explicitObt = result.totalObtainedMarks ?? (result as any).totalMarksObtained ?? (result as any).totalMarks ?? (result as any).totalObtained ?? (result as any).obtainedMarks;
    if (explicitObt !== undefined && explicitObt !== null) {
      res.totalObtained = Number(explicitObt);
    }
    const explicitMax = result.totalMaxMarks ?? (result as any).totalMax ?? (result as any).maxMarks;
    if (explicitMax !== undefined && explicitMax !== null) {
      res.totalMax = Number(explicitMax);
    }
    if (result.percentage !== undefined && result.percentage !== null) {
      res.percentage = result.percentage;
    }
    if (result.finalGrade || result.overallGrade || (result as any).grade) {
      res.finalGrade = result.finalGrade || result.overallGrade || (result as any).grade;
      res.overallGrade = res.finalGrade;
    }
  }

  // Deduplicate res.subjectMarks by subject name and resolve pass/max marks dynamically
  if (Array.isArray(res.subjectMarks)) {
    const finalSubMap = new Map<string, any>();
    res.subjectMarks.forEach((sm: any) => {
      const sName = (sm.subject || sm.subjectName || sm.name || '').trim();
      if (!sName) return;
      const key = sName.toLowerCase();
      if (!finalSubMap.has(key)) {
        const spec = (subjectWiseMap && subjectWiseMap[sName]) || (subjectWiseMap && subjectWiseMap[key]) || {};
        const maxM = Number(sm.maxMarks || sm.totalMarks || spec.maxMarks || 0) || 100;
        const passM = (Number(sm.passMarks || sm.passLimit || spec.passMarks || 0) && Number(sm.passMarks || sm.passLimit || spec.passMarks || 0) > 0)
          ? Number(sm.passMarks || sm.passLimit || spec.passMarks || 0)
          : Math.round(maxM * 0.35);

        const obtainedM = sm.obtainedMarks !== undefined ? sm.obtainedMarks : (sm.marks !== undefined ? sm.marks : 0);
        const isAbsent = obtainedM === 'AB' || String(obtainedM).toLowerCase() === 'absent';
        const numObtained = typeof obtainedM === 'number' ? obtainedM : (parseFloat(String(obtainedM || 0)) || 0);
        const isPass = isAbsent ? false : (sm.isPass !== undefined ? Boolean(sm.isPass) : numObtained >= passM);
        
        const subPct = maxM > 0 ? (numObtained / maxM) * 100 : 0;
        const subGrade = (sm.grade && sm.grade !== '-' && sm.grade !== '—' && sm.grade !== '') 
          ? sm.grade 
          : (isAbsent ? '-' : calculateGrade(subPct, gradeConfigurations, 'Percentage', effectiveExamType));

        finalSubMap.set(key, {
          ...sm,
          subject: sName,
          maxMarks: maxM,
          passMarks: passM,
          obtainedMarks: obtainedM,
          grade: subGrade,
          isPass
        });
      }
    });
    res.subjectMarks = Array.from(finalSubMap.values());

    // If totalObtained was 0 but subject marks are present, recalculate grand total
    const sumCalculatedObt = res.subjectMarks.reduce((sum: number, sm: any) => {
      const obt = sm.obtainedMarks;
      if (obt === 'AB' || String(obt).toLowerCase() === 'absent') return sum;
      return sum + (typeof obt === 'number' ? obt : (Number(obt) || 0));
    }, 0);
    const sumCalculatedMax = res.subjectMarks.reduce((sum: number, sm: any) => sum + (Number(sm.maxMarks) || 100), 0);
    if (!res.totalObtained || res.totalObtained === 0) {
      res.totalObtained = sumCalculatedObt;
    }
    if (!res.totalMax || res.totalMax === 0) {
      res.totalMax = sumCalculatedMax;
    }
    if (!res.percentage || res.percentage === 0) {
      res.percentage = res.totalMax > 0 ? parseFloat(((res.totalObtained / res.totalMax) * 100).toFixed(1)) : 0;
    }
  }

  if (!res.finalGrade || res.finalGrade === '-') {
    res.finalGrade = calculateGrade(res.percentage, gradeConfigurations, 'Percentage', effectiveExamType);
    res.overallGrade = res.finalGrade;
  }

  // Compute Overall Result status dynamically if absent or fails are present
  const hasSubjectFails = (res.subjectMarks || []).some((sub: any) => !sub.isPass);
  const allSubjAbsent = (res.subjectMarks || []).length > 0 && (res.subjectMarks || []).every((sub: any) => sub.obtainedMarks === 'AB' || String(sub.obtainedMarks).toLowerCase() === 'absent');
  res.overallResult = allSubjAbsent ? 'ABSENT' : (hasSubjectFails || res.percentage < 35 ? 'FAIL' : 'PASS');
  // Calculate Rank in Class Section (using standard competition ranking)
  const classStudents = students.filter(s => s.className === activeStudent.className && (!s.section || s.section === activeStudent.section));
  const studentScores = classStudents.map(st => {
    const stMarks = allExamMarks.filter(m => m.examId === activeExam.id && m.studentId === st.id);
    const calculated = calculateStudentResult(stMarks, subjectsList, gradeConfigurations, subjectWiseMap, effectiveExamType);
    return { studentId: st.id, score: calculated.totalObtained };
  });
  
  const ranksMap = calculateCompetitionRanks(studentScores);
  const rank = result?.rank ?? ranksMap[activeStudent.id] ?? '';

  // Attendance stats
  const attData = propAttendance || (contextData as any).studentAttendance?.find((a: any) => a.studentId === activeStudent.id) || null;
  const workingDays = Number(attData?.workingDays) || 0;
  const presentDays = Number(attData?.presentDays) || 0;
  const absentDays = Math.max(0, workingDays - presentDays);
  const attendanceRate = workingDays > 0 ? ((presentDays / workingDays) * 100).toFixed(1) : '0.0';

  // Co-Scholastic parameters
  const csData = propCoScholastic || contextData.coScholasticAssessments?.find((c: any) => c.studentId === activeStudent.id) || null;

  const handlePrint = () => {
    window.print();
  };

  const wrapContent = (
    <div className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 p-6 space-y-5 print:p-2 print:space-y-4 print:overflow-visible report-card-sheet text-xs">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm 8mm;
          }
          html, body {
            height: 100% !important;
            overflow: hidden !important;
            background-color: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
          .report-card-sheet {
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-height: 100vh !important;
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
              alt={schoolProfile.name || 'School Logo'} 
              className="h-16 w-auto max-w-[140px] object-contain rounded-xl shadow-xs"
            />
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-800 shadow-xs">
              <GraduationCap className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              <span className="text-xl font-black italic tracking-wider text-sky-700 dark:text-sky-400">
                PIRNAV <span className="text-[9px] font-bold tracking-widest uppercase block text-sky-600 dark:text-sky-400 text-center not-italic">SCHOOLS</span>
              </span>
            </div>
          )}
        </div>

        {/* Center School Details */}
        <div className="flex-1 text-center font-sans space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            {schoolProfile.name || 'Pirnav Educational Institutions'}
          </h1>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold max-w-xl mx-auto leading-tight">
            {schoolProfile.address || 'Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081'}
          </p>
          <p className="text-[10px] text-slate-500 font-bold">
            Ph: {schoolProfile.phone || '+91 9123456789'} • Email: {schoolProfile.email || 'contact@pirnavschools.edu'}
          </p>

          <div className="pt-1 flex items-center justify-center gap-2">
            <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-black tracking-widest uppercase shadow-xs">
              STUDENT ACADEMIC PROGRESS REPORT CARD
            </span>
            <span className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase">({activeExam.name})</span>
          </div>
        </div>
      </div>

      {/* Student Profile Information Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Student Full Name</span>
          <p className="font-black text-slate-900 dark:text-white text-xs mt-0.5">{activeStudent.firstName} {activeStudent.lastName}</p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Roll / Admission No</span>
          <p className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs mt-0.5">{activeStudent.rollNo || 'N/A'} / {activeStudent.admissionNo || activeStudent.id}</p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Class & Section</span>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{activeStudent.className}{activeStudent.section ? ` (Section ${activeStudent.section})` : ''}</p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Father / Guardian Name</span>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{activeStudent.fatherName || 'Parent/Guardian'}</p>
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
            {res.subjectMarks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-400 italic">No subject marks recorded for this examination.</td>
              </tr>
            ) : (
              res.subjectMarks.map((sub: any, index: number) => {
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
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono">{res.totalMax}</td>
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono">—</td>
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono text-sky-600">{res.totalObtained}</td>
              <td className="py-2.5 px-3.5 border-r border-slate-300 dark:border-slate-700 text-center text-emerald-600 font-extrabold">{res.percentage}%</td>
              <td className="py-2.5 px-3.5 text-center font-mono font-bold text-xs">{res.overallResult}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Performance Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center font-bold">
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">Class Rank</span>
          <p className="text-sky-600 font-black text-base">{rank ? `#${rank}` : '—'}</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">Aggregate Percentage</span>
          <p className="text-slate-900 dark:text-white font-black text-base">{res.percentage}%</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">{res.gpa > 0 ? 'GPA / Grade' : 'Grade'}</span>
          <p className="text-emerald-600 font-black text-base">{res.gpa > 0 ? `${res.gpa.toFixed(1)} / ` : ''}{res.overallGrade || '—'}</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">Final Result</span>
          <p className={`font-black text-base uppercase ${res.overallResult === 'PASS' ? 'text-emerald-600' : res.overallResult === 'FAIL' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
            {res.overallResult || '—'}
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
      <div className="grid grid-cols-2 gap-8 items-center pt-5 border-t border-slate-200 dark:border-slate-800">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        
        {/* Top Controls Header Bar */}
        <div className="p-4 bg-slate-105 dark:bg-slate-800/80 flex items-center justify-between border-b shrink-0 border-slate-200 dark:border-slate-700 no-print">
          <div className="flex items-center gap-2 text-slate-805 dark:text-slate-200">
            <div className="p-2 bg-sky-600 text-white rounded-xl shadow-md">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-tight">Academic Progress Report Card</h3>
              <p className="text-[10px] text-slate-500 font-bold">{activeStudent.firstName} {activeStudent.lastName} ({activeStudent.className}{activeStudent.section ? `-${activeStudent.section}` : ''})</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-colors"
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
