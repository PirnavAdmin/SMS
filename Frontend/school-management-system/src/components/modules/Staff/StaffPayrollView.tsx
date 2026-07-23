import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { IndianRupee, CreditCard, CheckCircle, Search, HelpCircle, DollarSign } from 'lucide-react';
import { Staff, Payslip } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const StaffPayrollView: React.FC = () => {
  const { staff, leaveApplications, payslips, disburseSalary } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('July 2026');

  const calculatePayrollDetails = (s: Staff) => {
    const basicSalary = s.salary;
    const hra = Math.round(basicSalary * 0.2);
    const da = Math.round(basicSalary * 0.1);
    const pfDeduction = Math.round(basicSalary * 0.08);

    // LOP Calculation
    const lopApps = (leaveApplications || []).filter(
      app => app.employeeId === s.id && app.status === 'Approved' && app.leaveTypeName === 'Loss of Pay'
    );
    const lopDays = lopApps.reduce((sum, app) => sum + app.numberOfDays, 0);
    const dailyWage = Math.round(basicSalary / 30);
    const lopDeduction = lopDays * dailyWage;

    const netSalary = Math.max(0, basicSalary + hra + da - pfDeduction - lopDeduction);

    return {
      basicSalary,
      hra,
      da,
      pfDeduction,
      lopDays,
      lopDeduction,
      netSalary
    };
  };

  const handleDisburse = (s: Staff) => {
    // Check if already disbursed for this month
    const exists = payslips.some(p => p.employeeId === s.id && p.month === selectedMonth);
    if (exists) {
      addToast('warning', 'Already Disbursed', `Salary has already been processed for ${s.firstName} for ${selectedMonth}.`);
      return;
    }

    const details = calculatePayrollDetails(s);
    const payslipPayload: Omit<Payslip, 'id'> = {
      employeeId: s.id,
      employeeName: `${s.firstName} ${s.lastName}`,
      empId: s.empId,
      month: selectedMonth,
      basicSalary: details.basicSalary,
      hra: details.hra,
      da: details.da,
      pfDeduction: details.pfDeduction,
      lopDeduction: details.lopDeduction,
      netSalary: details.netSalary,
      bankAccount: s.bankDetails?.accountNumber || 'N/A',
      disbursedDate: new Date().toISOString().split('T')[0],
      status: 'Paid'
    };

    disburseSalary(payslipPayload);
    addToast('success', 'Salary Disbursed', `Disbursed ${formatCurrency(details.netSalary)} to ${s.firstName} ${s.lastName}.`);
  };

  const handleBulkDisburse = () => {
    let count = 0;
    filteredStaff.forEach(s => {
      const exists = payslips.some(p => p.employeeId === s.id && p.month === selectedMonth);
      if (!exists) {
        handleDisburse(s);
        count++;
      }
    });

    if (count > 0) {
      addToast('success', 'Bulk Disbursal Complete', `Processed salaries for ${count} staff members.`);
    } else {
      addToast('info', 'No pending payrolls', 'All filtered staff members are already paid for this month.');
    }
  };

  const filteredStaff = staff.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    s.empId.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-emerald-600" /> Employee Payroll Registry
          </h2>
          <p className="text-xs text-slate-500">Calculate employee payouts, hra/da allowances, provident fund, LOP penalties, and disburse bank transfers</p>
        </div>

        <button
          onClick={handleBulkDisburse}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all self-start sm:self-center"
        >
          <CreditCard className="w-4 h-4" /> Process Bulk Disbursal
        </button>
      </div>

      {/* Filter Header */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-slate-500">Salary Payout Month:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border outline-none font-bold text-slate-800 cursor-pointer"
          >
            <option value="June 2026">June 2026</option>
            <option value="July 2026">July 2026</option>
            <option value="August 2026">August 2026</option>
          </select>
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search employee names..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border outline-none"
          />
        </div>
      </div>

      {/* Payroll spreadsheet table */}
      <div className="glass-card rounded-2xl overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Basic Salary</th>
                <th className="py-3.5 px-4">Allowances (HRA+DA)</th>
                <th className="py-3.5 px-4">PF Deductions</th>
                <th className="py-3.5 px-4">LOP Deductions</th>
                <th className="py-3.5 px-4">Net Payout</th>
                <th className="py-3.5 px-4">Disbursal status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-xs">
              {filteredStaff.map(s => {
                const details = calculatePayrollDetails(s);
                const isPaid = payslips.some(p => p.employeeId === s.id && p.month === selectedMonth);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img src={s.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-slate-900">{s.firstName} {s.lastName}</p>
                          <p className="text-[10px] text-slate-400">{s.designation} • {s.empId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{formatCurrency(details.basicSalary)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">+{formatCurrency(details.hra + details.da)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-500">-{formatCurrency(details.pfDeduction)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-500">
                      -{formatCurrency(details.lopDeduction)}
                      {details.lopDays > 0 && <span className="block text-[9px] text-slate-400 font-sans font-normal">({details.lopDays} LOP Days)</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">{formatCurrency(details.netSalary)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {isPaid ? 'Salary Released' : 'Pending Process'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isPaid ? (
                        <button
                          onClick={() => handleDisburse(s)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all"
                        >
                          Release Payout
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Disbursed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default StaffPayrollView;
