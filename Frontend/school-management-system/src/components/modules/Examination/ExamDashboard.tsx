import React from 'react';
import { 
  Award, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Plus, 
  Edit, 
  BarChart3, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ExamSetup } from '../../../types';
import { Panel } from './components/SharedUI';

interface ExamDashboardProps {
  exams: ExamSetup[];
  schedules: any[];
  marks: any[];
  students: any[];
  onNavigate: (tabId: string) => void;
  onCreateNewExam: () => void;
}

export const ExamDashboard: React.FC<ExamDashboardProps> = ({
  exams,
  schedules,
  marks,
  students,
  onNavigate,
  onCreateNewExam
}) => {
  // Compute counts
  const totalExams = exams.length;
  const upcomingExams = exams.filter(e => e.status === 'Scheduled').length;
  const ongoingExams = exams.filter(e => (e.status as string) === 'In Progress' || (e.status as string) === 'Ongoing').length;
  const completedExams = exams.filter(e => e.status === 'Completed' || e.status === 'Results Published').length;
  
  // Marks and results progress calculations
  const totalSchedulesCount = schedules.length;
  const totalEnteredMarksCount = marks.length;

  const cardClass = "p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs text-left flex items-center gap-3.5 sm:gap-4 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700";
  const numStyle = "text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5";
  const labelStyle = "text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block tracking-wider";

  return (
    <div className="space-y-5 text-left">
      {/* KPI Counters Grid (Optimized for 14"-15" Screens: 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className={cardClass}>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className={labelStyle}>Total Exams</span>
            <div className={numStyle}>{totalExams}</div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className={labelStyle}>Upcoming</span>
            <div className={numStyle}>{upcomingExams}</div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className={labelStyle}>Ongoing</span>
            <div className={numStyle}>{ongoingExams}</div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className={labelStyle}>Completed</span>
            <div className={numStyle}>{completedExams}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: Table listings & Quick Actions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Upcoming Examinations list */}
          <Panel 
            title="Examinations Overview" 
            description="Manage configured examinations, statuses, and target class groups."
            action={
              <button
                onClick={onCreateNewExam}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Examination
              </button>
            }
          >
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800 tracking-wider">
                    <th className="px-4 py-3">Exam Name</th>
                    <th className="px-4 py-3">Target Classes</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {exams.slice(0, 5).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs">{e.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{e.examType || 'Term Exam'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {(e.applicableClasses || (e.className ? [e.className] : [])).length} Classes
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {e.startDate || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          e.status === 'Results Published' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800' 
                            : e.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800'
                        }`}>
                          {e.status || 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onNavigate('setup')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors inline-flex items-center gap-1"
                        >
                          Configure <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400 font-bold">
                        No examinations created yet. Click "+ New Examination" above to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigate('schedule')}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 rounded-2xl text-left space-y-2 transition-all duration-200 hover:shadow-xs group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 dark:text-white">Exam Timetable</span>
                <span className="text-[10px] text-slate-400 font-medium">Dates & Hall assignment</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('evaluation')}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 rounded-2xl text-left space-y-2 transition-all duration-200 hover:shadow-xs group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60 group-hover:scale-105 transition-transform">
                <Edit className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 dark:text-white">Marks Entry</span>
                <span className="text-[10px] text-slate-400 font-medium">Theory & practical scores</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('results')}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 rounded-2xl text-left space-y-2 transition-all duration-200 hover:shadow-xs group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 dark:text-white">Results & Ranking</span>
                <span className="text-[10px] text-slate-400 font-medium">Calculate CGPA & grades</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('report-cards')}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 rounded-2xl text-left space-y-2 transition-all duration-200 hover:shadow-xs group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/60 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 dark:text-white">Report Cards</span>
                <span className="text-[10px] text-slate-400 font-medium">Official student cards</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right 1 Column: Summary status */}
        <div className="space-y-5">
          <Panel title="Evaluation Progress" description="Real-time examination cycle tracking.">
            <div className="space-y-4 text-xs font-semibold">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-850 space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">Exam Schedules Configured</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{totalSchedulesCount} Slots</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">Student Marks Records</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{totalEnteredMarksCount} Records</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">Enrolled Students</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{students?.length || 0} Students</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 text-xs font-black">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Evaluation Protocol</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  After all subject marks are submitted and locked, proceed to the <strong>Results & Ranking</strong> tab to compile final totals, assign grades, and generate student report cards.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
export default ExamDashboard;
