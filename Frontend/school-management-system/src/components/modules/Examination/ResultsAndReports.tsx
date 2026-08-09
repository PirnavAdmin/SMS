import React, { useState } from 'react';
import { Award, FileText, ClipboardList } from 'lucide-react';
import { ResultsManagement } from './ResultsManagement';
import { ReportCards } from './ReportCards';
import { ExamSetup, Student, SubjectItem } from '../../../types';

interface ResultsAndReportsProps {
  exam: ExamSetup | null;
  classOptions: string[];
  subjects: SubjectItem[];
  students: Student[];
  selectedAcademicYear: string;
  selectedBranch: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  onGotoSetup?: () => void;
}

export const ResultsAndReports: React.FC<ResultsAndReportsProps> = ({
  exam,
  classOptions,
  subjects,
  students,
  selectedAcademicYear,
  selectedBranch,
  addToast,
  onGotoSetup
}) => {
  const [subView, setSubView] = useState<'results' | 'report-cards'>('results');

  return (
    <div className="space-y-4 text-left">
      {/* Sub-view switcher tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs w-fit no-print">
        <button
          type="button"
          onClick={() => setSubView('results')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            subView === 'results'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Results & Ranking</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('report-cards')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            subView === 'report-cards'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Report Cards & Print</span>
        </button>
      </div>

      {/* Render selected view */}
      {subView === 'results' ? (
        <ResultsManagement
          exam={exam}
          classOptions={classOptions}
          subjects={subjects}
          students={students}
          selectedAcademicYear={selectedAcademicYear}
          selectedBranch={selectedBranch}
          addToast={addToast}
          onNavigateToReportCards={() => setSubView('report-cards')}
          onGotoSetup={onGotoSetup}
        />
      ) : (
        <ReportCards
          exam={exam}
          classOptions={classOptions}
          subjects={subjects}
          students={students}
          selectedAcademicYear={selectedAcademicYear}
          selectedBranch={selectedBranch}
          addToast={addToast}
        />
      )}
    </div>
  );
};
export default ResultsAndReports;
