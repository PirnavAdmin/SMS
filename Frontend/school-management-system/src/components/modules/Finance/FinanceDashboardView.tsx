import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { IndianRupee, AlertCircle, CheckCircle, Bus, Home, Gift, AlertTriangle, TrendingUp, PieChart, BarChart2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const FinanceDashboardView: React.FC = () => {
  const { students, feePayments, studentTransports, studentHostels, studentScholarships, feeHeads, academicClasses } = useData();

  const totalCollected = feePayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalPending = students.reduce((acc, s) => acc + s.dueFee, 0);
  const totalExpected = totalCollected + totalPending;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysCollection = feePayments.filter(p => p.paymentDate === todayStr).reduce((acc, p) => acc + p.amountPaid, 0);

  const transportCollection = studentTransports.reduce((acc, t) => acc + t.feeAmount, 0);
  const hostelCollection = studentHostels.reduce((acc, h) => acc + h.feeAmount, 0);
  const scholarshipAmount = studentScholarships.reduce((acc, s) => acc + (s.discountType === 'Percentage' ? 3750 : s.discountValue), 0);
  const fineCollection = feePayments.reduce((acc, p) => acc + p.fine, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-sky-500" /> Executive Finance Dashboard
        </h2>
        <p className="text-xs text-slate-500">Real-time revenue metrics, transport/hostel collections, scholarship grants & class collection breakdown</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Expected Collection</span>
            <IndianRupee className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalExpected)}</h3>
          <p className="text-[10px] text-slate-400">Target baseline revenue</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Collected</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCollected)}</h3>
          <p className="text-[10px] text-emerald-500 font-semibold">Realized revenue</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Pending Dues</span>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(totalPending)}</h3>
          <p className="text-[10px] text-rose-500 font-semibold">Action required</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Collection</span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(todaysCollection)}</h3>
          <p className="text-[10px] text-slate-400">Daily receipt total</p>
        </div>
      </div>

      {/* Secondary Service KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Transport Revenue</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(transportCollection)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"><Bus className="w-5 h-5" /></div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Hostel Revenue</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(hostelCollection)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"><Home className="w-5 h-5" /></div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Scholarships Granted</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(scholarshipAmount)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"><Gift className="w-5 h-5" /></div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Fine Collected</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(fineCollection)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"><AlertTriangle className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Visual Charts Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Wise Breakdown */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-sky-500" /> Class-wise Revenue Breakdown
          </h3>
          <div className="space-y-3">
            {academicClasses.map(c => {
              const classStudents = students.filter(s => s.className === c.name);
              const classPaid = classStudents.reduce((acc, s) => acc + s.paidFee, 0);
              const classTotal = classStudents.reduce((acc, s) => acc + s.totalFee, 0) || 1;
              const pct = Math.min(100, Math.round((classPaid / classTotal) * 100));

              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">{c.name}</span>
                    <span className="text-slate-500">{formatCurrency(classPaid)} / {formatCurrency(classTotal)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fee Head Wise Breakdown */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" /> Fee Head Master Share
          </h3>
          <div className="space-y-3">
            {feeHeads.slice(0, 5).map(h => (
              <div key={h.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{h.name}</p>
                  <p className="text-[10px] text-slate-400">{h.category} • {h.frequency}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold">
                  {h.mandatory ? 'Mandatory' : 'Optional'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
