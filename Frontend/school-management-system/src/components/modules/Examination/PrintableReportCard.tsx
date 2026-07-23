import React from 'react';
import { X, Printer, Award } from 'lucide-react';
import { Student, ExamMark, ExamSetup } from '../../../types';
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
  const { schoolProfile, examMarks } = useData();

  if (!isOpen || !student || !exam) return null;

  const marks = examMarks.filter(m => m.studentId === student.id && m.examId === exam.id);
  const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const maxMarks = marks.reduce((sum, m) => sum + m.totalMarks, 0) || 100;
  const percentage = Math.round((totalObtained / maxMarks) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Official Progress Report Card ({exam.name})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-brand-500 shadow"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card */}
        <div id="printable-content" className="p-8 space-y-6 text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900 overflow-y-auto">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{schoolProfile.name}</h1>
            <p className="text-[10px] text-slate-500">{schoolProfile.address}</p>
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mt-2">
              ACADEMIC PERFORMANCE REPORT CARD
            </h2>
            <p className="text-[11px] font-semibold text-slate-500">{exam.name} • Session {exam.academicYear}</p>
          </div>

          {/* Student Info Box */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div><span className="text-slate-400">Student Name:</span> <p className="font-bold text-slate-900 dark:text-white text-sm">{student.firstName} {student.lastName}</p></div>
            <div><span className="text-slate-400">Admission No:</span> <p className="font-mono font-bold text-slate-900 dark:text-white">{student.admissionNo}</p></div>
            <div><span className="text-slate-400">Class & Section:</span> <p className="font-bold text-slate-900 dark:text-white">{student.className}-{student.section}</p></div>
            <div><span className="text-slate-400">Roll Number:</span> <p className="font-bold text-slate-900 dark:text-white">{student.rollNo}</p></div>
          </div>

          {/* Marks Table */}
          <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                <th className="p-2.5 border border-slate-200 dark:border-slate-700">Subject</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-700 text-center">Marks Obtained</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-700 text-center">Max Marks</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-700 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {marks.map(m => (
                <tr key={m.id}>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold">{m.subject}</td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-center font-bold text-brand-600">{m.marksObtained}</td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-center">{m.totalMarks}</td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-center font-extrabold text-emerald-600">{m.grade}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800 font-black text-sm">
                <td className="p-3 border border-slate-200 dark:border-slate-700">Total Aggregate</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700 text-center text-brand-600">{totalObtained}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">{maxMarks}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700 text-center text-emerald-600">{percentage}%</td>
              </tr>
            </tbody>
          </table>

          {/* Remarks & Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-slate-400">
            <div>
              <div className="w-32 mx-auto h-0.5 bg-slate-300 dark:bg-slate-700 mb-1" />
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Class Teacher Signature</p>
            </div>
            <div>
              <div className="w-32 mx-auto h-0.5 bg-slate-300 dark:bg-slate-700 mb-1" />
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Principal Signature & Stamp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
