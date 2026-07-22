import React from 'react';
import {
  UserCheck, Users, DollarSign, AlertCircle, Calendar, Cake,
  Megaphone, ArrowRight, Activity, Receipt, Sparkles
} from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    students, staff, feePayments, announcements, holidays,
    birthdays, auditLogs, schoolProfile
  } = useData();

  const totalStudents = students.length;
  const totalStaff = staff.length;

  const feeCollected = feePayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const feeDue = students.reduce((acc, s) => acc + s.dueFee, 0);

  const classCounts: Record<string, number> = {};
  students.forEach(s => {
    classCounts[s.className] = (classCounts[s.className] || 0) + 1;
  });

  const maxStrength = Math.max(...Object.values(classCounts), 1);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl shadow-brand-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Academic Session {schoolProfile.academicYear}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to {schoolProfile.name}
            </h1>
            <p className="text-xs sm:text-sm text-brand-100 max-w-xl">
              Real-time administrative control panel. Monitor admissions, fees, attendance, schedules, and school operations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('students')}
              className="px-4 py-2.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" /> Add Student
            </button>
            <button
              onClick={() => onNavigate('fees')}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md text-xs font-bold transition-all flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" /> Collect Fee
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={totalStudents} subtitle="Enrolled active students" change="+12% vs last term" isPositive={true} icon={UserCheck} color="indigo" />
        <StatCard title="Total Staff" value={totalStaff} subtitle="Faculty & administration" change="100% active" isPositive={true} icon={Users} color="emerald" />
        <StatCard title="Fee Collected" value={`INR ${feeCollected.toLocaleString()}`} subtitle="Total revenue processed" change="+18.5% growth" isPositive={true} icon={DollarSign} color="sky" />
        <StatCard title="Fee Outstandings" value={`INR ${feeDue.toLocaleString()}`} subtitle="Pending student dues" change="Action required" isPositive={false} icon={AlertCircle} color="rose" />
      </div>

      {/* Recent Transactions Widget */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Transactions Widget</h3>
              <p className="text-xs text-slate-500">Live fee collection activity</p>
            </div>
          </div>
          <button onClick={() => onNavigate('fees')} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
            View All Fee Receipts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {feePayments.slice(0, 5).map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.studentName}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">{p.receiptNo}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">INR {p.amountPaid}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{p.paymentMode}</td>
                  <td className="py-3 px-4 text-slate-500">{p.paymentDate}</td>
                  <td className="py-3 px-4"><Badge variant="success" size="sm">{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Grid: Charts & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Class-wise Student Strength</h3>
              <p className="text-xs text-slate-500">Distribution across active grade levels</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(classCounts).map(([className, count]) => {
              const pct = Math.round((count / maxStrength) * 100);
              return (
                <div key={className} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{className}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{count} Students</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Holidays</h4>
              </div>
            </div>
            <div className="space-y-2">
              {holidays.map(h => (
                <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div><p className="font-bold text-slate-900 dark:text-white">{h.name}</p><p className="text-[10px] text-slate-400">{h.type}</p></div>
                  <span className="font-semibold px-2 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 text-[10px]">{h.startDate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <Cake className="w-4 h-4 text-rose-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Birthdays Today</h4>
            </div>
            <div className="space-y-2">
              {birthdays.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 text-xs">
                  <img src={b.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1"><p className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</p><p className="text-[10px] text-slate-500">{b.role} • {b.className}</p></div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">🎉 Wish</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
