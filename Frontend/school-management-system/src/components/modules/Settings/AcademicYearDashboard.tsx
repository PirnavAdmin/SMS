import React from 'react';
import { Calendar, Users, GraduationCap, ArrowUpRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const AcademicYearDashboard: React.FC = () => {
  const { academicYears, students, studentEnrollments } = useData();

  // 1. Calculations
  const activeYear = academicYears.find(ay => ay.status === 'Active')?.name || 'None';
  const upcomingYear = academicYears.find(ay => ay.status === 'Upcoming')?.name || 'None';
  const totalStudents = students.filter(s => (s as any).status !== 'Graduated' && (s as any).status !== 'Alumni').length;

  const promotedStudents = studentEnrollments.filter(e => e.resultStatus === 'Promoted').length;
  const graduatedStudents = students.filter(s => (s as any).status === 'Graduated' || (s as any).status === 'Alumni').length;

  // Pending promotion: Active students in the current active year who don't have an enrollment for the next active/upcoming year
  const activeYearName = activeYear;
  const nextYearName = upcomingYear;
  const activeStudentsThisYear = studentEnrollments.filter(e => e.academicYear === activeYearName && e.status === 'Active');
  const pendingPromotions = activeStudentsThisYear.filter(
    e => !studentEnrollments.some(next => next.studentId === e.studentId && next.academicYear === nextYearName)
  ).length;

  const promotionRate = activeStudentsThisYear.length > 0
    ? Math.round(((activeStudentsThisYear.length - pendingPromotions) / activeStudentsThisYear.length) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Active Year</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white mt-4">{activeYear}</h3>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Upcoming Year</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white mt-4">{upcomingYear}</h3>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Enrolled Pupils</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{totalStudents}</h3>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Promoted</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{promotedStudents}</h3>
        </div>

        {/* Card 5 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Alumni Count</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{graduatedStudents}</h3>
        </div>

        {/* Card 6 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Pending Promo</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{pendingPromotions}</h3>
        </div>
      </div>

      {/* Progress Charts & Graphics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Promotion Session Progress
          </h4>
          <div className="space-y-4 py-3">
            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
              <span>Promotion Completion Rate</span>
              <span>{promotionRate}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${promotionRate}%` }} />
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The completion rate monitors current-term students who have successfully migrated to upcoming sessions or graduated. Ensure all promotion maps are complete before closing.
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
            <Calendar className="w-4 h-4 text-purple-500" /> Academic Years Overview
          </h4>
          <div className="space-y-3.5">
            {academicYears.map(ay => (
              <div key={ay.id} className="flex justify-between items-center py-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{ay.name} Session</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  ay.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : (ay.status === 'Upcoming' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600')
                }`}>{ay.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AcademicYearDashboard;
