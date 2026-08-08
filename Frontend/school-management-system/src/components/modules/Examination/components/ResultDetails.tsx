import React, { useState } from 'react';
import { User, BookOpen, X, Printer, Download, Send, Lock, ChevronLeft, Loader2 } from 'lucide-react';
import { ProcessedResult, SubjectItem, ExamSetup } from '../../../../types';
import { useData } from '../../../../context/DataContext';
import { printReportCard, downloadReportCardPdf } from '../utils/reportCardPrinter';

interface ResultDetailsProps {
  data: ProcessedResult;
  exam: ExamSetup | null;
  academicYear: string;
  branch: string;
  subjects: SubjectItem[];
  onClose: () => void;
  onPrintCard?: () => void;
  onDownloadPdf?: () => void;
  onPublishResult: () => void;
  onLockResult: () => void;
  statusChipClass: (status: string) => string;
}

export const ResultDetails: React.FC<ResultDetailsProps> = ({
  data,
  exam,
  academicYear,
  branch,
  subjects,
  onClose,
  onPublishResult,
  onLockResult,
  statusChipClass
}) => {
  const { schoolProfile } = useData();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatSubject = (subjectName: string) => {
    const match = subjects.find(s => s.name === subjectName || s.id === subjectName);
    return match ? `${match.code || ''} - ${match.name}` : subjectName;
  };

  const getResultBadgeClass = (res: string) => {
    return res === 'PASS' || res === 'Pass'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      printReportCard(data, exam, schoolProfile, subjects);
      setIsPrinting(false);
    }, 200);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      downloadReportCardPdf(data, exam, schoolProfile, subjects);
      setIsDownloading(false);
    }, 450);
  };

  const subjectMarksList = (data.subjectMarks || []) as any[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto text-left">
      <div id="printable-report-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between no-print">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Detailed Examination Result Sheet</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getResultBadgeClass(data.passStatus)}`}>
                {data.passStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {exam?.name || 'Examination'} • Academic Year {academicYear}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Student Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Student Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Student Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{data.studentName}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Roll No.</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{data.rollNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Admission No.</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{data.admissionNo}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Class & Section</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.className} - {data.section}</span>
              </div>
            </div>
          </div>

          {/* Subject Marks Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-500" /> Subject-wise Performance Breakdown
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="px-4 py-2.5">Subject</th>
                    <th className="px-4 py-2.5 text-center">Maximum Marks</th>
                    <th className="px-4 py-2.5 text-center">Obtained Marks</th>
                    <th className="px-4 py-2.5 text-center">Grade</th>
                    <th className="px-4 py-2.5 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subjectMarksList.map((sub, sIdx) => (
                    <tr key={sIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50">
                      <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">{formatSubject(sub.subject)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400 text-center">{sub.maxMarks}</td>
                      <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-white text-center">{sub.obtainedMarks}</td>
                      <td className="px-4 py-3 font-black text-indigo-600 dark:text-indigo-400 text-center">{sub.grade}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getResultBadgeClass(sub.isPass ? 'PASS' : 'FAIL')}`}>
                          {sub.isPass ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall performance cards block */}
          <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Total Marks</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{data.totalObtainedMarks} / {data.totalMaxMarks}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                <span className="text-[10px] font-black uppercase text-sky-600 block">Percentage</span>
                <span className="text-sm font-black text-sky-600 dark:text-sky-400">{data.percentage.toFixed(1)}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                <span className="text-[10px] font-black uppercase text-indigo-600 block">Overall Grade</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{data.finalGrade}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                <span className="text-[10px] font-black uppercase text-amber-600 block">Rank</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">#{data.rank}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Result Outcome</span>
                <span className={`text-sm font-black ${getResultBadgeClass(data.passStatus)} px-2 py-0.5 rounded`}>
                  {data.passStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Results
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPrinting}
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Preparing Print...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" /> Print Report Card
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 disabled:opacity-60 transition flex items-center gap-1.5 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" /> Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-500" /> Download PDF
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onPublishResult}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-4 h-4" /> Publish
            </button>

            <button
              type="button"
              onClick={onLockResult}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" /> Lock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResultDetails;
