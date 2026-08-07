import React, { useState, useMemo, useEffect } from 'react';
import { Award, Printer, Search, FileDown } from 'lucide-react';
import { PrintableReportCard } from './PrintableReportCard';
import { ExamSetup, Student, SubjectItem, ProcessedResult } from '../../../types';
import { Panel } from './components/SharedUI';
import { useResults } from './hooks/useResults';
import { useData } from '../../../context/DataContext';

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
  selectedAcademicYear,
  selectedBranch,
  addToast
}) => {
  const { getResultsForExamClass } = useResults();
  const { studentAttendance, coScholasticAssessments } = useData();

  const [selectedClass, setSelectedClass] = useState(classOptions[0] || 'Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePrintResult, setActivePrintResult] = useState<ProcessedResult | null>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setActivePrintResult(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const visibleResults = getResultsForExamClass(exam?.id || '', selectedClass, selectedSection);

  const filteredResults = useMemo(() => {
    return visibleResults.filter(r => 
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.rollNo || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visibleResults, searchQuery]);

  const handlePrintAll = () => {
    addToast('info', 'Print Job Sent', `Sending print request for ${filteredResults.length} student report cards...`);
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handlePrintSingle = (res: ProcessedResult) => {
    setActivePrintResult(res);
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const getAttendanceForStudent = (studentId: string) => {
    return (studentAttendance as any[]).find((a: any) => a.studentId === studentId) || { workingDays: 220, presentDays: 200 };
  };

  const getCoScholasticForStudent = (studentId: string) => {
    return (coScholasticAssessments as any[]).find((c: any) => c.studentId === studentId) || {
      discipline: 'A',
      sports: 'A',
      artAndCraft: 'B+',
      generalConduct: 'A'
    };
  };

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Student Report Cards Directory"
        description="Filter class sections to download PDF, edit attendance summaries, or bulk print official student report cards."
        action={
          <div className="flex items-center gap-2">
            <button
              disabled={filteredResults.length === 0}
              onClick={handlePrintAll}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" /> Bulk Print ({filteredResults.length})
            </button>
          </div>
        }
      >
        <div className="space-y-5 print:hidden">
          {/* Filters */}
          <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/55 dark:bg-slate-950/60 shadow-sm flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Class Filter</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[140px] h-[34px]"
                >
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Section</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[100px] h-[34px]"
                >
                  {['A', 'B', 'C', 'D'].map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:border-sky-500 transition h-[34px]"
              />
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold">
                No processed result sheets found for this selection. Calculate results first.
              </div>
            ) : (
              filteredResults.map(res => (
                <div
                  key={res.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm text-left flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-black text-slate-400">ROLL NO. {res.rollNo || 'N/A'}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        res.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">{res.studentName}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{res.className} - {res.section}</p>

                    <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Percent</span>
                        <span className="block font-black text-slate-850 dark:text-slate-200">{res.percentage.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Grade</span>
                        <span className="block font-black text-indigo-600 dark:text-indigo-400">{res.finalGrade}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Rank</span>
                        <span className="block font-black text-amber-600 dark:text-amber-400">#{res.rank}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintSingle(res)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-350 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 transition flex-1 justify-center"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" /> Print Card
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Hidden Print Container for bulk or single output pages */}
          <div id="printable-content" className="hidden print:block">
            {activePrintResult ? (
              (() => {
                const res = activePrintResult;
                const studentObj = students.find(s => s.id === res.studentId) || null;
                return (
                  <div key={`print-single-${res.id}`} className="page-break-card">
                    <PrintableReportCard
                      student={studentObj}
                      exam={exam}
                      processedResult={res}
                      attendance={getAttendanceForStudent(res.studentId)}
                      coScholastic={getCoScholasticForStudent(res.studentId)}
                      onClose={() => {}}
                    />
                  </div>
                );
              })()
            ) : (
              filteredResults.map(res => {
                const studentObj = students.find(s => s.id === res.studentId) || null;
                return (
                  <div key={`print-${res.id}`} className="page-break-card">
                    <PrintableReportCard
                      student={studentObj}
                      exam={exam}
                      processedResult={res}
                      attendance={getAttendanceForStudent(res.studentId)}
                      coScholastic={getCoScholasticForStudent(res.studentId)}
                      onClose={() => {}}
                    />
                  </div>
                );
              })
            )}
          </div>

        </div>
      </Panel>
    </div>
  );
};
export default ReportCards;
