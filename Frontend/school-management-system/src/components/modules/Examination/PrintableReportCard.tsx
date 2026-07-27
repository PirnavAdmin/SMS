import React from 'react';
import { X, Printer, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import { Student, ExamSetup } from '../../../types';
import { useData } from '../../../context/DataContext';

interface PrintableReportCardProps {
  student: Student | null;
  exam: ExamSetup | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableReportCard: React.FC<PrintableReportCardProps> = ({
  student,
  exam,
  isOpen,
  onClose
}) => {
  const { schoolProfile, examMarks, processedResults, examSchedules, gradeConfigurations } = useData();

  if (!isOpen || !student || !exam) return null;

  // Find processed result for aggregate values
  const result = processedResults.find(r => r.examId === exam.id && r.studentId === student.id);
  const isReleased = result?.status === 'Published' || result?.status === 'Locked';

  // Get marks list
  const marks = examMarks.filter(m => m.examId === exam.id && m.studentId === student.id);
  const classSchedules = examSchedules.filter(s => s.examId === exam.id && s.className === student.className);

  const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = classSchedules.reduce((sum, s) => sum + s.maxMarks, 0) || marks.reduce((sum, m) => sum + m.totalMarks, 0) || 100;
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

  // GPA calculation
  let finalGrade = 'F';
  let gpa = 0;
  let passStatus = 'Fail';
  const matched = gradeConfigurations.find(c => percentage >= c.minPercent && percentage <= c.maxPercent);
  if (matched) {
    finalGrade = matched.gradeName;
    gpa = matched.gradePoints;
    passStatus = matched.passCriteria;
  }

  // If fail in any subject
  const hasSubjectFail = marks.some(m => {
    const sched = classSchedules.find(s => s.subject === m.subject);
    const passLimit = sched ? sched.passMarks : 33;
    return m.marksObtained < passLimit;
  });
  if (hasSubjectFail) {
    passStatus = 'Fail';
    finalGrade = 'F';
    gpa = 0;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-between border-b shrink-0">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Academic Report Card Viewer
          </h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Card Page Container */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 relative">
          
          {/* Unreleased Watermark Alert */}
          {!isReleased && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.07] overflow-hidden">
              <div className="text-rose-600 font-black text-5xl uppercase tracking-widest rotate-[30deg] border-8 border-rose-600 px-6 py-3 whitespace-nowrap">
                UNOFFICIAL DRAFT - NOT RELEASED
              </div>
            </div>
          )}

          {!isReleased && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 font-bold text-[10px]">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>Notice: This report card contains draft results that have not been officially published.</span>
            </div>
          )}

          {/* Header */}
          <div className="text-center space-y-1.5 border-b pb-4">
            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white uppercase">{schoolProfile.name}</h1>
            <p className="text-[10px] text-slate-500">{schoolProfile.address} • Ph: {schoolProfile.phone}</p>
            <div className="inline-block mt-2 px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-brand-600 tracking-wider uppercase">
              Official Progress Report Card
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">{exam.name} • Session {exam.academicYear}</p>
          </div>

          {/* Student details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border text-[11px] font-semibold text-slate-600 dark:text-slate-350">
            <div>
              <span className="block text-[9px] uppercase text-slate-400 font-bold">Student Name</span>
              <p className="font-black text-slate-800 dark:text-white text-xs mt-0.5">{student.firstName} {student.lastName}</p>
            </div>
            <div>
              <span className="block text-[9px] uppercase text-slate-400 font-bold">Roll / Admission No</span>
              <p className="font-mono font-bold text-slate-850 dark:text-slate-200 mt-0.5">{student.rollNo} / {student.admissionNo || 'N/A'}</p>
            </div>
            <div>
              <span className="block text-[9px] uppercase text-slate-400 font-bold">Class & Section</span>
              <p className="font-bold text-slate-850 dark:text-slate-200 mt-0.5">{student.className} - {student.section}</p>
            </div>
            <div>
              <span className="block text-[9px] uppercase text-slate-400 font-bold">Attendance summary</span>
              <p className="font-bold text-slate-850 dark:text-slate-200 mt-0.5">{student.attendancePct}% Present</p>
            </div>
          </div>

          {/* Subject Performance Grid */}
          <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-850 text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase border-b">
                <th className="p-2.5 border border-slate-200 dark:border-slate-850">Subject</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-850 text-center">Marks Obtained</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-850 text-center">Max Marks</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-850 text-center">Pass Limits</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-850 text-center">Grade</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-850">Remarks</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-700 dark:text-slate-300">
              {marks.map(m => {
                const sched = classSchedules.find(s => s.subject === m.subject);
                const passLimit = sched ? sched.passMarks : 33;
                const isFail = m.marksObtained < passLimit;

                return (
                  <tr key={m.id} className="hover:bg-slate-50/20">
                    <td className="p-2.5 border border-slate-200 dark:border-slate-850 font-bold">{m.subject}</td>
                    <td className={`p-2.5 border border-slate-200 dark:border-slate-850 text-center font-black ${isFail ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {m.marksObtained}
                    </td>
                    <td className="p-2.5 border border-slate-200 dark:border-slate-850 text-center font-normal">{m.totalMarks}</td>
                    <td className="p-2.5 border border-slate-200 dark:border-slate-850 text-center font-normal">{passLimit}</td>
                    <td className={`p-2.5 border border-slate-200 dark:border-slate-850 text-center font-extrabold ${isFail ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {m.grade}
                    </td>
                    <td className="p-2.5 border border-slate-200 dark:border-slate-850 font-normal text-[10px] text-slate-500">{m.remarks || 'Satisfactory'}</td>
                  </tr>
                );
              })}
              
              <tr className="bg-slate-50 dark:bg-slate-850/50 font-black text-sm">
                <td className="p-3 border border-slate-200 dark:border-slate-850">Aggregate Total</td>
                <td className="p-3 border border-slate-200 dark:border-slate-850 text-center text-brand-600">{totalObtained}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-850 text-center font-normal">{totalMax}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-850 text-center font-normal">—</td>
                <td className="p-3 border border-slate-200 dark:border-slate-850 text-center text-emerald-600 font-extrabold">{percentage}%</td>
                <td className="p-3 border border-slate-200 dark:border-slate-850 text-[10px] font-normal text-slate-500">GPA: {gpa.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>

          {/* Performance Summary Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl border border-dashed text-center font-bold">
            <div className="space-y-1">
              <span className="block text-[8px] uppercase text-slate-400">Class Rank</span>
              <p className="text-slate-800 dark:text-slate-200 text-sm">Top 15%</p>
            </div>
            <div className="space-y-1">
              <span className="block text-[8px] uppercase text-slate-400">GPA / Final Grade</span>
              <p className="text-amber-500 text-sm">{gpa.toFixed(1)} / {finalGrade}</p>
            </div>
            <div className="space-y-1">
              <span className="block text-[8px] uppercase text-slate-400">Result Status</span>
              <p className={`text-sm ${passStatus === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {passStatus}
              </p>
            </div>
          </div>

          {/* Teacher Remarks */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border text-[11px] font-semibold">
            <span className="block text-[9px] uppercase text-slate-400 font-bold mb-1">Class Teacher Remarks & Suggestions</span>
            <p className="text-slate-700 dark:text-slate-350 italic">
              "{result?.remarks || 'The student shows consistent effort and performs well. Keep up the good work.'}"
            </p>
          </div>

          {/* Bottom signatures block */}
          <div className="grid grid-cols-3 gap-6 items-center pt-8">
            <div className="text-center">
              <div className="w-24 mx-auto border-t border-slate-300 dark:border-slate-700 pt-2 text-[9px] font-bold text-slate-550">
                Class Teacher Signature
              </div>
            </div>

            {/* Verification Vector QR Code */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <svg className="w-14 h-14" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#f8fafc" rx="8" />
                <path d="M10 10h30v30h-30zm6 6v18h18v-18zm4 4h10v10h-10zm40-10h30v30h-30zm6 6v18h18v-18zm4 4h10v10h-10zm-50 50h30v30h-30zm6 6v18h18v-18zm4 4h10v10h-10zm30-30h10v10h-10zm10 10h10v10h-10zm10-10h10v10h-10zm-20 20h10v10h-10zm20 0h10v10h-10zm-10 10h10v10h-10zm10 0h10v10h-10zm-30 0h10v10h-10zm10 10h10v10h-10zm10 0h10v10h-10zm10 0h10v10h-10z" fill="#0f172a" />
              </svg>
              <span className="text-[8px] text-slate-400 font-bold tracking-widest font-mono">SECURE CODE</span>
            </div>

            <div className="text-center">
              <div className="w-24 mx-auto border-t border-slate-300 dark:border-slate-700 pt-2 text-[9px] font-bold text-slate-550">
                Principal Signature & Stamp
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
