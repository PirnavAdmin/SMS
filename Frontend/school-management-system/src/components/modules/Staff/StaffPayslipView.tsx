import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { FileText, Printer, Search, HelpCircle } from 'lucide-react';
import { Payslip } from '../../../types';
import { useData } from '../../../context/DataContext';

export const StaffPayslipView: React.FC = () => {
  const { payslips } = useData();

  const [query, setQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');

  const filteredPayslips = payslips.filter(p => {
    const nameMatch = p.employeeName.toLowerCase().includes(query.toLowerCase()) || p.empId.toLowerCase().includes(query.toLowerCase());
    const monthMatch = selectedMonth === 'All' || p.month === selectedMonth;
    return nameMatch && monthMatch;
  });

  const handlePrint = (p: Payslip) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Salary Payslip - ${p.employeeName}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
              .details { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
              .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              .table th { bg-color: #f5f5f5; }
              .net { font-size: 1.2em; font-weight: bold; margin-top: 20px; text-align: right; }
              .sign { margin-top: 80px; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>MONTHLY SALARY PAYSLIP</h2>
              <p>St. Xavier's International Academy - HR Department</p>
            </div>
            <div class="details">
              <div><strong>Employee Name:</strong> ${p.employeeName}</div>
              <div><strong>Employee ID:</strong> ${p.empId}</div>
              <div><strong>Salary Month:</strong> ${p.month}</div>
              <div><strong>Disbursed Date:</strong> ${p.disbursedDate}</div>
              <div><strong>Bank Account:</strong> ${p.bankAccount}</div>
              <div><strong>Status:</strong> ${p.status}</div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Earning Details</th>
                  <th>Amount</th>
                  <th>Deduction Details</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td>${formatCurrency(p.basicSalary)}</td>
                  <td>Provident Fund (PF)</td>
                  <td>${formatCurrency(p.pfDeduction)}</td>
                </tr>
                <tr>
                  <td>House Rent Allowance (HRA)</td>
                  <td>${formatCurrency(p.hra)}</td>
                  <td>Loss of Pay (LOP)</td>
                  <td>${formatCurrency(p.lopDeduction)}</td>
                </tr>
                <tr>
                  <td>Dearness Allowance (DA)</td>
                  <td>${formatCurrency(p.da)}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <div class="net">
              Net Disbursed Salary: ${formatCurrency(p.netSalary)}
            </div>

            <div class="sign">
              <div>____________________<br/>Employee Signature</div>
              <div>____________________<br/>Accounts Authority</div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const uniqueMonths = Array.from(new Set(payslips.map(p => p.month)));

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" /> Employee Payslips Registry
          </h2>
          <p className="text-xs text-slate-500">Search and print historical salary slips disbursed to school staff members</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-slate-500">Filter Payout Month:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border outline-none font-bold text-slate-800 cursor-pointer"
          >
            <option value="All">All Months</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, employee ID..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border outline-none"
          />
        </div>
      </div>

      {/* Payslips table sheet */}
      <div className="glass-card rounded-2xl overflow-hidden border shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b text-[10px] tracking-wider">
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Payout Month</th>
              <th className="py-3.5 px-4">Bank Account</th>
              <th className="py-3.5 px-4">Disbursed Date</th>
              <th className="py-3.5 px-4">Net Payout</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium text-xs">
            {filteredPayslips.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">No salary slips found for current parameters.</td></tr>
            ) : (
              filteredPayslips.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{p.employeeName}</p>
                    <p className="text-[10px] text-slate-400">Emp ID: {p.empId}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{p.month}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{p.bankAccount}</td>
                  <td className="py-3.5 px-4">{p.disbursedDate}</td>
                  <td className="py-3.5 px-4 font-mono font-black text-emerald-600 text-sm">{formatCurrency(p.netSalary)}</td>
                  <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Released</span></td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handlePrint(p)}
                      className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg flex items-center gap-1 transition-all inline-flex align-middle"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Payslip
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
export default StaffPayslipView;
