import React from 'react';
import { X, DollarSign, CreditCard, Calendar, CheckCircle2, Printer } from 'lucide-react';
import { Staff } from '../../../types';
import { useToast } from '../../../context/ToastContext';

interface PayrollDrawerProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayrollDrawer: React.FC<PayrollDrawerProps> = ({ staff, isOpen, onClose }) => {
  const { addToast } = useToast();

  if (!isOpen || !staff) return null;

  const basicSalary = staff.salary;
  const hra = Math.round(basicSalary * 0.2);
  const da = Math.round(basicSalary * 0.1);
  const pfDeduction = Math.round(basicSalary * 0.08);
  const netSalary = basicSalary + hra + da - pfDeduction;

  const accountNumber = staff.bankDetails?.accountNumber || 'N/A';

  const handleProcessPayroll = () => {
    addToast('success', 'Payroll Processed', `Disbursed net salary of $${netSalary.toLocaleString()} to ${accountNumber}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <img src={staff.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white/20" />
            <div>
              <h2 className="text-xl font-bold">{staff.firstName} {staff.lastName}</h2>
              <p className="text-xs text-emerald-100">{staff.designation} • Emp ID: {staff.empId}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Salary Breakdown Card */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Monthly Salary Breakdown
            </h3>
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between"><span className="text-slate-500">Basic Salary:</span><span className="font-semibold text-slate-800 dark:text-slate-200">${basicSalary.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">House Rent Allowance (HRA 20%):</span><span className="font-semibold text-emerald-600">+${hra.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Dearness Allowance (DA 10%):</span><span className="font-semibold text-emerald-600">+${da.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Provident Fund Deduction (PF 8%):</span><span className="font-semibold text-rose-500">-${pfDeduction.toLocaleString()}</span></div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black">
                <span className="text-slate-900 dark:text-white">Net Salary Disbursal:</span>
                <span className="text-emerald-600 dark:text-emerald-400">${netSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Banking Info */}
          <div className="glass-card p-5 rounded-2xl space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" /> Bank Transfer Details
            </h3>
            <p className="text-slate-500">Direct Deposit Account Number: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{accountNumber}</span></p>
          </div>

          {/* Leave Balances */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" /> Annual Leave History
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><p className="text-slate-400 font-semibold">Casual</p><p className="font-bold text-slate-900 dark:text-white mt-1">{staff.leaveBalance.casual} Days</p></div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><p className="text-slate-400 font-semibold">Sick Leave</p><p className="font-bold text-slate-900 dark:text-white mt-1">{staff.leaveBalance.sick} Days</p></div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><p className="text-slate-400 font-semibold">Paid Leave</p><p className="font-bold text-slate-900 dark:text-white mt-1">{staff.leaveBalance.paid} Days</p></div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 rounded-xl">Close</button>
          <button onClick={handleProcessPayroll} className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Disburse Salary
          </button>
        </div>
      </div>
    </div>
  );
};
