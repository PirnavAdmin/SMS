import React from 'react';
import { X, Printer, Award, CheckCircle, AlertTriangle, ShieldCheck, User, Calendar, BookOpen } from 'lucide-react';
import { Student, ExamSetup, ExamMark, ProcessedResult } from '../../../types';
import { useData } from '../../../context/DataContext';

export interface PrintableReportCardProps {
  student: Student | null;
  exam: ExamSetup | null;
  isOpen?: boolean;
  onClose: () => void;
  schoolProfile?: any;
  examMarks?: ExamMark[];
  processedResult?: ProcessedResult;
}

export const PrintableReportCard: React.FC<PrintableReportCardProps> = ({
  student,
  exam,
  isOpen = true,
  onClose,
  schoolProfile: propSchoolProfile,
  examMarks: propExamMarks,
  processedResult: propProcessedResult
}) => {
  const contextData = useData();
  const schoolProfile = propSchoolProfile || contextData.schoolProfile;
  const allExamMarks = contextData.examMarks;
  const allProcessedResults = contextData.processedResults;
  const examSchedules = contextData.examSchedules;
  const gradeConfigurations = contextData.gradeConfigurations;
  const students = contextData.students;

  if (!isOpen || !student || !exam) return null;

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

  const totalObtained = marks.reduce((sum, m) => sum + (m.isAbsent ? 0 : m.marksObtained), 0);
  const totalMax = marks.reduce((sum, m) => sum + (m.maxMarks || 100), 0) || (subjectsList.length * 100) || 100;
  const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

  // Grade & GPA calculation
  let finalGrade = 'F';
  let gpa = 0;
  let passStatus = 'Pass';

  const matchedGradeConfig = gradeConfigurations.find(c => percentage >= (c.minMark ?? (c as any).minPercent ?? 0) && percentage <= (c.maxMark ?? (c as any).maxPercent ?? 100));
  if (matchedGradeConfig) {
    finalGrade = matchedGradeConfig.grade || (matchedGradeConfig as any).gradeName || 'A';
    gpa = matchedGradeConfig.gradePoint ?? (matchedGradeConfig as any).gradePoints ?? 9;
  } else {
    if (percentage >= 90) { finalGrade = 'A+'; gpa = 10; }
    else if (percentage >= 80) { finalGrade = 'A'; gpa = 9; }
    else if (percentage >= 70) { finalGrade = 'B'; gpa = 8; }
    else if (percentage >= 60) { finalGrade = 'C'; gpa = 7; }
    else if (percentage >= 33) { finalGrade = 'D'; gpa = 6; }
    else { finalGrade = 'F'; gpa = 0; }
  }

  // Check if fail in any subject
  const hasSubjectFail = marks.some(m => !m.isAbsent && m.marksObtained < (m.passMarks ?? 33));
  const isAbsentAll = marks.length > 0 && marks.every(m => m.isAbsent);

  if (hasSubjectFail || isAbsentAll || percentage < 33) {
    passStatus = 'Fail';
  }

  // Calculate Rank in Class Section
  const classStudents = students.filter(s => s.className === student.className && (!s.section || s.section === student.section));
  const studentScores = classStudents.map(st => {
    const stMarks = allExamMarks.filter(m => m.examId === exam.id && m.studentId === st.id);
    const score = stMarks.reduce((sum, m) => sum + (m.isAbsent ? 0 : m.marksObtained), 0);
    return { studentId: st.id, score };
  }).sort((a, b) => b.score - a.score);

  const rank = studentScores.findIndex(s => s.studentId === student.id) + 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        
        {/* Top Controls Header Bar */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between border-b shrink-0 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
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
              className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 relative print:p-0 print:overflow-visible">
          
          {/* Unofficial Draft Watermark if exam not published */}
          {!isReleased && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Notice: This report card contains preview draft marks prior to official release.</span>
            </div>
          )}

          {/* School Header & Crest */}
          <div className="text-center space-y-2 border-b-2 border-slate-900 dark:border-slate-100 pb-5">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-black text-xl flex items-center justify-center shadow-lg uppercase">
                {schoolProfile.name ? schoolProfile.name.substring(0, 2) : 'SMS'}
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">{schoolProfile.name || 'Central School ERP'}</h1>
                <p className="text-xs text-slate-500 font-bold">{schoolProfile.address || 'Campus Address'} • Ph: {schoolProfile.phone || 'Phone'} • Email: {schoolProfile.email || 'school@domain.com'}</p>
              </div>
            </div>

            <div className="inline-block mt-2 px-6 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-black tracking-widest uppercase">
              STUDENT ACADEMIC PERFORMANCE REPORT
            </div>
            <p className="text-xs font-extrabold text-sky-600 mt-1 uppercase">{exam.name}</p>
          </div>

          {/* Student Profile Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Student Full Name</span>
              <p className="font-black text-slate-900 dark:text-white text-sm mt-0.5">{student.firstName} {student.lastName}</p>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Roll / Admission No</span>
              <p className="font-mono font-black text-slate-800 dark:text-slate-200 mt-0.5">{student.rollNo || 'N/A'} / {student.admissionNo || student.id}</p>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Class & Section</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{student.className} (Section {student.section || 'A'})</p>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Father / Guardian Name</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{student.fatherName || 'Parent/Guardian'}</p>
            </div>
          </div>

          {/* Subject Performance Marks Table */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Scholastic Subjects Marks Breakdown</h4>
            <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase border-b border-slate-300 dark:border-slate-700">
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">Subject Name</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 text-center">Max Marks</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 text-center">Pass Limit</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 text-center">Marks Obtained</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 text-center">Subject Grade</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-800 dark:text-slate-200">
                {subjectsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">No subject marks recorded for this examination.</td>
                  </tr>
                ) : (
                  subjectsList.map(subj => {
                    const markEntry = marks.find(m => m.subject === subj);
                    const sched = classSchedules.find(s => s.subject === subj);
                    const maxM = markEntry?.maxMarks || sched?.maxMarks || 100;
                    const passM = markEntry?.passMarks || sched?.passMarks || 33;
                    const isAbsent = markEntry?.isAbsent;
                    const obtained = markEntry ? (isAbsent ? 'AB' : markEntry.marksObtained) : '—';
                    const isFail = markEntry && !isAbsent && markEntry.marksObtained < passM;
                    const subjGrade = markEntry ? (isAbsent ? 'F' : markEntry.marksObtained >= 90 ? 'A+' : markEntry.marksObtained >= 80 ? 'A' : markEntry.marksObtained >= 70 ? 'B' : markEntry.marksObtained >= 60 ? 'C' : markEntry.marksObtained >= 33 ? 'D' : 'F') : '—';

                    return (
                      <tr key={subj} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50">
                        <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold">{subj}</td>
                        <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-center font-mono">{maxM}</td>
                        <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-center font-mono">{passM}</td>
                        <td className={`p-3 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-black ${
                          isAbsent ? 'text-rose-500' : isFail ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                        }`}>
                          {obtained}
                        </td>
                        <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-center font-black">{subjGrade}</td>
                        <td className="p-3 text-center">
                          {markEntry ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isAbsent ? 'bg-slate-100 text-slate-500' :
                              isFail ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isAbsent ? 'Absent' : isFail ? 'Fail' : 'Pass'}
                            </span>
                          ) : <span className="text-slate-400 italic text-[10px]">Pending</span>}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Total Row */}
                <tr className="bg-slate-100 dark:bg-slate-800 font-black text-sm border-t-2 border-slate-300 dark:border-slate-700">
                  <td className="p-3 border-r border-slate-300 dark:border-slate-700">Aggregate Total</td>
                  <td className="p-3 border-r border-slate-300 dark:border-slate-700 text-center font-mono">{totalMax}</td>
                  <td className="p-3 border-r border-slate-300 dark:border-slate-700 text-center font-mono">—</td>
                  <td className="p-3 border-r border-slate-300 dark:border-slate-700 text-center font-mono text-sky-600">{totalObtained}</td>
                  <td className="p-3 border-r border-slate-300 dark:border-slate-700 text-center text-emerald-600 font-extrabold">{percentage}%</td>
                  <td className="p-3 text-center font-mono font-bold text-xs">{passStatus}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Performance Summary Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center font-bold">
            <div className="space-y-0.5">
              <span className="block text-[9px] uppercase text-slate-400">Class Rank</span>
              <p className="text-sky-600 font-black text-lg">#{rank > 0 ? rank : '1'}</p>
            </div>
            <div className="space-y-0.5">
              <span className="block text-[9px] uppercase text-slate-400">Aggregate Percentage</span>
              <p className="text-slate-900 dark:text-white font-black text-lg">{percentage}%</p>
            </div>
            <div className="space-y-0.5">
              <span className="block text-[9px] uppercase text-slate-400">GPA / Grade</span>
              <p className="text-emerald-600 font-black text-lg">{gpa.toFixed(1)} / {finalGrade}</p>
            </div>
            <div className="space-y-0.5">
              <span className="block text-[9px] uppercase text-slate-400">Final Result</span>
              <p className={`font-black text-lg uppercase ${passStatus === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {passStatus}
              </p>
            </div>
          </div>

          {/* Teacher Remarks Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium space-y-1">
            <span className="block text-[10px] uppercase text-slate-400 font-black">Class Teacher Feedback & Remarks</span>
            <p className="text-slate-800 dark:text-slate-200 italic font-semibold">
              "{result?.remarks || 'Demonstrates strong subject comprehension and consistent academic performance. Keep working hard!'}"
            </p>
          </div>

          {/* Bottom Official Signatures Block */}
          <div className="grid grid-cols-3 gap-6 items-center pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center space-y-1">
              <div className="w-32 mx-auto border-t-2 border-slate-900 dark:border-slate-100 pt-2 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                Class Teacher Signature
              </div>
            </div>

            {/* Verification Security Stamp */}
            <div className="flex flex-col items-center justify-center space-y-1 text-center">
              <div className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <ShieldCheck className="w-8 h-8 text-sky-600 mx-auto" />
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
      </div>
    </div>
  );
};

export default PrintableReportCard;
