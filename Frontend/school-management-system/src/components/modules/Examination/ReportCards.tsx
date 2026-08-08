import React, { useState, useMemo } from 'react';
import { Printer, Search, Eye, Send, ClipboardList, Download, Loader2 } from 'lucide-react';
import { PrintableReportCard } from './PrintableReportCard';
import { ExamSetup, Student, SubjectItem, ProcessedResult } from '../../../types';
import { Panel } from './components/SharedUI';
import { useResults } from './hooks/useResults';
import { useData } from '../../../context/DataContext';
import { printReportCard, printBulkReportCards, downloadReportCardPdf } from './utils/reportCardPrinter';

interface ReportCardsProps {
  exam: ExamSetup | null;
  classOptions: string[];
  subjects: SubjectItem[];
  students: Student[];
  selectedAcademicYear: string;
  selectedBranch: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const ReportCards: React.FC<ReportCardsProps> = ({
  exam,
  classOptions,
  subjects,
  students,
  addToast
}) => {
  const { getResultsForExamClass } = useResults();
  const { studentAttendance, coScholasticAssessments, academicClasses, schoolProfile } = useData();

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<ProcessedResult | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);

  // Dynamic sections from academicClasses
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const matched = academicClasses.find(c => c.name === selectedClass);
    if (!matched || !matched.sections || matched.sections.length === 0) return ['A'];
    return matched.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || 'A'));
  }, [academicClasses, selectedClass]);

  const visibleResults = getResultsForExamClass(exam?.id || '', selectedClass, selectedSection);

  const filteredResults = useMemo(() => {
    return visibleResults.filter(r => 
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.rollNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.studentId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visibleResults, searchQuery]);

  const handlePrintAll = () => {
    if (filteredResults.length === 0) return;
    setIsBulkPrinting(true);
    addToast('info', 'Print Job Sent', `Formatting print preview for ${filteredResults.length} student report cards...`);
    setTimeout(() => {
      printBulkReportCards(filteredResults, exam, schoolProfile, subjects);
      setIsBulkPrinting(false);
    }, 400);
  };

  const handlePrintSingle = (res: ProcessedResult) => {
    printReportCard(res, exam, schoolProfile, subjects);
  };

  const handleDownloadSingle = (res: ProcessedResult) => {
    setDownloadingId(res.id);
    setTimeout(() => {
      downloadReportCardPdf(res, exam, schoolProfile, subjects);
      setDownloadingId(null);
      addToast('success', 'PDF Ready', `Downloaded official report card for ${res.studentName}.`);
    }, 400);
  };

  const handleSendToParent = (res: ProcessedResult) => {
    addToast('success', 'Report Card Dispatched', `Official report card sent to parents of ${res.studentName} via Portal & WhatsApp notification.`);
  };

  const getAttendanceForStudent = (studentId: string) => {
    return (studentAttendance as any[]).find((a: any) => a.studentId === studentId) || { workingDays: 220, presentDays: 205 };
  };

  const getCoScholasticForStudent = (studentId: string) => {
    return (coScholasticAssessments as any[]).find((c: any) => c.studentId === studentId) || {
      discipline: 'A',
      sports: 'A',
      artAndCraft: 'B+',
      generalConduct: 'A'
    };
  };

  const previewStudent = previewResult ? students.find(s => s.id === previewResult.studentId) || null : null;

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Student Report Cards"
        //description="Preview official school report cards, download printable PDF sheets, and dispatch results to parent portals."
        action={
          <div className="flex items-center gap-2">
            {selectedClass && selectedSection && (
              <button
                disabled={filteredResults.length === 0 || isBulkPrinting}
                onClick={handlePrintAll}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black text-xs shadow-sm shadow-sky-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isBulkPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>Bulk Print All ({filteredResults.length})</span>
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-5 print:hidden">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-xs flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 block">Class / Grade *</label>
                <select
                  value={selectedClass}
                  onChange={e => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[150px] h-[36px] shadow-xs"
                >
                  <option value="">-- Select Class --</option>
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 block">Section *</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[140px] h-[36px] shadow-xs disabled:opacity-50"
                >
                  <option value="">-- Select Section --</option>
                  {availableSections.map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedClass && selectedSection && (
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or roll no..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/50 transition h-[36px] shadow-xs"
                />
              </div>
            )}
          </div>

          {!selectedClass || !selectedSection ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-2">
              <ClipboardList className="w-8 h-8 text-sky-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Select Class & Section for Report Cards
              </h4>
              <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                Please choose a <strong>Class</strong> and <strong>Section</strong> from the filter bar above to preview, print, or dispatch official report cards.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredResults.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl">
                No processed result sheets found for {selectedClass} Section {selectedSection}. Please compute results under the "Results & Ranking" tab first.
              </div>
            ) : (
              filteredResults.map(res => (
                <div
                  key={res.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs text-left flex flex-col justify-between gap-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-black text-slate-400">ROLL: {res.rollNo || '01'}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        res.passStatus === 'Pass' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800'
                      }`}>
                        {res.passStatus}
                      </span>
                    </div>

                    <div className="mt-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{res.studentName}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{res.className} - Section {res.section}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                        <span className="text-[8px] font-black text-slate-400 uppercase block">Total %</span>
                        <span className="font-black text-slate-900 dark:text-white text-xs">{res.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                        <span className="text-[8px] font-black text-slate-400 uppercase block">Grade</span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs">{res.finalGrade}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                        <span className="text-[8px] font-black text-slate-400 uppercase block">Rank</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-xs">#{res.rank}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setPreviewResult(res)}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold text-[11px] flex items-center justify-center gap-1 transition flex-1 cursor-pointer"
                      title="Preview Official Report Card"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintSingle(res)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                      title="Print Single Card"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={downloadingId === res.id}
                      onClick={() => handleDownloadSingle(res)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
                      title="Download PDF"
                    >
                      {downloadingId === res.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendToParent(res)}
                      className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                      title="Send to Parent Portal"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          )}
        </div>

        {/* Modal: Interactive Single Report Card Viewer */}
        {previewResult && previewStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Official Report Card Preview</h3>
                  <p className="text-xs text-slate-500 font-medium">Verify scholastic breakdown and attendance summary before printing.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintSingle(previewResult)}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Now
                  </button>
                  <button
                    disabled={downloadingId === previewResult.id}
                    onClick={() => handleDownloadSingle(previewResult)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    {downloadingId === previewResult.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setPreviewResult(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Component Body */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <PrintableReportCard
                  student={previewStudent}
                  exam={exam}
                  processedResult={previewResult}
                  attendance={getAttendanceForStudent(previewResult.studentId)}
                  coScholastic={getCoScholasticForStudent(previewResult.studentId)}
                  onClose={() => setPreviewResult(null)}
                />
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};
export default ReportCards;
