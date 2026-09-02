import React from 'react';
import { X, Printer, Award, AlertTriangle, ShieldCheck, GraduationCap } from 'lucide-react';
import { Student, ExamSetup, ExamMark, ProcessedResult } from '../../../types';
import { useData } from '../../../context/DataContext';
import { calculateCompetitionRanks } from './utils/ranking';
import { calculateStudentResult } from './utils/resultCalculation';

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

  // Retrieve logoUrl from Settings school profile or localStorage fallback
  const savedProfileStr = typeof window !== 'undefined' ? (localStorage.getItem('edu_db_profile') || localStorage.getItem('profile')) : null;
  let savedProfile: any = null;
  if (savedProfileStr) {
    try { savedProfile = JSON.parse(savedProfileStr); } catch (e) {}
  }
  const directLogoKey = typeof window !== 'undefined' ? (localStorage.getItem('school_logo') || localStorage.getItem('logoUrl') || localStorage.getItem('schoolLogo')) : null;

  const logoUrl = schoolProfile?.logoUrl || savedProfile?.logoUrl || contextData.schoolProfile?.logoUrl || directLogoKey || '/pirnav-school-logo.png';

  const allExamMarks = contextData.examMarks;
  const allProcessedResults = contextData.processedResults;
  const examSchedules = contextData.examSchedules;
  const gradeConfigurations = contextData.gradeConfigurations;
  const students = contextData.students;

  if (!student || !exam) return null;

  // Find processed result for aggregate values
  const result = propProcessedResult || allProcessedResults.find(r => r.examId === exam.id && r.studentId === student.id);
  const isReleased = exam.publishStatus === 'Published' || exam.status === 'Results Published' || result?.status === 'Published';

  // Get student marks list
  const marks = propExamMarks || allExamMarks.filter(m => m.examId === exam.id && m.studentId === student.id);
  const classSchedules = examSchedules.filter(s => s.examId === exam.id && s.className === student.className);

  // Compute subjects list
  const subjectsList = Array.from(new Set([
    ...classSchedules.map(s => s.subject),
    ...marks.map(m => m.subject)
  ])).filter(Boolean);

  // Get custom subject wise specs (max & pass marks)
  const subjectWiseMap: Record<string, { maxMarks: number; passMarks: number }> = {};
  classSchedules.forEach(s => {
    subjectWiseMap[s.subject] = { maxMarks: s.maxMarks || 100, passMarks: s.passMarks || 35 };
  });

  const res = calculateStudentResult(marks, subjectsList, gradeConfigurations, subjectWiseMap);

  // Calculate Rank in Class Section (using standard competition ranking)
  const classStudents = students.filter(s => s.className === student.className && (!s.section || s.section === student.section));
  const studentScores = classStudents.map(st => {
    const stMarks = allExamMarks.filter(m => m.examId === exam.id && m.studentId === st.id);
    const calculated = calculateStudentResult(stMarks, subjectsList, gradeConfigurations, subjectWiseMap);
    return { studentId: st.id, score: calculated.totalObtained };
  });
  
  const ranksMap = calculateCompetitionRanks(studentScores);
  const rank = ranksMap[student.id] || 1;

  // Attendance stats
  const attData = propAttendance || (contextData as any).studentAttendance?.find((a: any) => a.studentId === student.id) || { workingDays: 220, presentDays: 205 };
  const workingDays = Number(attData.workingDays) || 220;
  const presentDays = Number(attData.presentDays) || 0;
  const absentDays = Math.max(0, workingDays - presentDays);
  const attendanceRate = workingDays > 0 ? ((presentDays / workingDays) * 100).toFixed(1) : '0.0';

  // Co-Scholastic parameters
  const csData = propCoScholastic || contextData.coScholasticAssessments?.find((c: any) => c.studentId === student.id) || {
    discipline: 'A',
    sports: 'A',
    artAndCraft: 'B+',
    generalConduct: 'A'
  };

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
            <span className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase">({exam.name})</span>
          </div>
        </div>
      </div>

      {/* Student Profile Information Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Student Full Name</span>
          <p className="font-black text-slate-900 dark:text-white text-xs mt-0.5">{student.firstName} {student.lastName}</p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Roll / Admission No</span>
          <p className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs mt-0.5">{student.rollNo || 'N/A'} / {student.admissionNo || student.id}</p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Class & Section</span>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{student.className} (Section {student.section || 'A'})</p>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400">Father / Guardian Name</span>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{student.fatherName || 'Parent/Guardian'}</p>
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
              res.subjectMarks.map((sub, index) => {
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
          <p className="text-sky-600 font-black text-base">#{rank}</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">Aggregate Percentage</span>
          <p className="text-slate-900 dark:text-white font-black text-base">{res.percentage}%</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">{res.gpa > 0 ? 'GPA / Grade' : 'Grade'}</span>
          <p className="text-emerald-600 font-black text-base">{res.gpa > 0 ? `${res.gpa.toFixed(1)} / ` : ''}{res.overallGrade}</p>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase text-slate-400">Final Result</span>
          <p className={`font-black text-base uppercase ${res.overallResult === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {res.overallResult}
          </p>
        </div>
      </div>

      {/* Teacher Remarks Box */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium space-y-1">
        <span className="block text-[10px] uppercase text-slate-400 font-black">Class Teacher Feedback & Remarks</span>
        <p className="text-slate-850 dark:text-slate-200 italic font-semibold text-xs">
          "{result?.remarks || 'Demonstrates strong subject comprehension and consistent academic performance. Keep working hard!'}"
        </p>
      </div>

      {/* Bottom Official Signatures Block */}
      <div className="grid grid-cols-3 gap-6 items-center pt-5 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-1">
          <div className="w-32 mx-auto border-t-2 border-slate-900 dark:border-slate-100 pt-2 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
            Class Teacher Signature
          </div>
        </div>

        {/* Verification Security Stamp */}
        <div className="flex flex-col items-center justify-center space-y-1 text-center">
          <div className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <ShieldCheck className="w-5 h-5 text-sky-600 mx-auto" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">OFFICIALLY VERIFIED</span>
        </div>

        <div className="text-center space-y-1">
          <div className="w-32 mx-auto border-t-2 border-slate-900 dark:border-slate-100 pt-2 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
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
              <p className="text-[10px] text-slate-500 font-bold">{student.firstName} {student.lastName} ({student.className}-{student.section || 'A'})</p>
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
