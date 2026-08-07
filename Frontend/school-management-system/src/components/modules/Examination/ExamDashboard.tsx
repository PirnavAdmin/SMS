import React from 'react';
import { Award, Calendar, CheckSquare, Clock, Plus, Edit, ShieldAlert, BarChart3 } from 'lucide-react';
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
  const ongoingExams = exams.filter(e => e.status === 'In Progress').length;
  const completedExams = exams.filter(e => e.status === 'Completed' || e.status === 'Results Published').length;
  
  // Marks and results progress calculations
  const totalSchedulesCount = schedules.length;
  const totalEnteredMarksCount = marks.length;

  const cardClass = "p-4.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm text-left flex items-center gap-4 transition hover:shadow-md hover:scale-[1.01]";
  const numStyle = "text-xl font-black text-slate-900 dark:text-white leading-tight";
  const labelStyle = "text-[9px] font-black uppercase text-slate-400 block tracking-wider";

  return (
    <div className="space-y-6">
      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-505/10 text-sky-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className={labelStyle}>Total Scheduled Exams</span>
            <span className={numStyle}>{totalExams}</span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-505/10 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className={labelStyle}>Upcoming Exams</span>
            <span className={numStyle}>{upcomingExams}</span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-505/10 text-emerald-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className={labelStyle}>Ongoing Exams</span>
            <span className={numStyle}>{ongoingExams}</span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-505/10 text-indigo-600">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className={labelStyle}>Completed Exams</span>
            <span className={numStyle}>{completedExams}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Table listings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming list */}
          <Panel title="Upcoming Exams" description="Schedule of upcoming exams.">
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="min-w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                    <th className="px-4 py-2 text-[10px]">Exam Name</th>
                    <th className="px-4 py-2 text-[10px]">Target Classes</th>
                    <th className="px-4 py-2 text-[10px]">Start Date</th>
                    <th className="px-4 py-2 text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {exams.slice(0, 4).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">{e.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{(e.applicableClasses || [e.className]).join(', ')}</td>
                      <td className="px-4 py-3 font-mono text-slate-550">{e.startDate}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          e.status === 'Results Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No exams configured yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={onCreateNewExam}
              className="p-3 bg-white dark:bg-slate-900 border hover:border-sky-500 rounded-2xl text-center space-y-1.5 transition duration-200"
            >
              <Plus className="w-5 h-5 mx-auto text-sky-600" />
              <span className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">Create Exam</span>
            </button>

            <button
              onClick={() => onNavigate('setup')}
              className="p-3 bg-white dark:bg-slate-900 border hover:border-sky-500 rounded-2xl text-center space-y-1.5 transition duration-200"
            >
              <Calendar className="w-5 h-5 mx-auto text-indigo-600" />
              <span className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">Schedule</span>
            </button>

            <button
              onClick={() => onNavigate('evaluation')}
              className="p-3 bg-white dark:bg-slate-900 border hover:border-sky-500 rounded-2xl text-center space-y-1.5 transition duration-200"
            >
              <Edit className="w-5 h-5 mx-auto text-amber-600" />
              <span className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">Enter Marks</span>
            </button>

            <button
              onClick={() => onNavigate('results')}
              className="p-3 bg-white dark:bg-slate-900 border hover:border-sky-500 rounded-2xl text-center space-y-1.5 transition duration-200"
            >
              <BarChart3 className="w-5 h-5 mx-auto text-emerald-600" />
              <span className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">Results</span>
            </button>

            <button
              onClick={() => onNavigate('results')}
              className="p-3 bg-white dark:bg-slate-900 border hover:border-sky-500 rounded-2xl text-center space-y-1.5 transition duration-200"
            >
              <ShieldAlert className="w-5 h-5 mx-auto text-rose-600" />
              <span className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">Publish</span>
            </button>
          </div>
        </div>

        {/* Right 1 Column: Summary status */}
        <div className="space-y-6">
          <Panel title="Marks Entry Status" description="Tracking progress of grades collection.">
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Roster Mappings</span>
                <span>Completion</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">Schedules Allocated</span>
                  <span className="font-mono text-indigo-650">{totalSchedulesCount} Subjects</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">Marks Transmitted</span>
                  <span className="font-mono text-emerald-605">{totalEnteredMarksCount} Records</span>
                </div>
              </div>

              <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 space-y-2">
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Roster Operations Check</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Please verify marks entry submission status sheets are marked as "Locked" before executing Results calculations.</p>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
};
export default ExamDashboard;
