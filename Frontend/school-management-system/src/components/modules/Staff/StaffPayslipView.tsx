import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { FileText, Printer, Search, HelpCircle } from 'lucide-react';
import { Payslip } from '../../../types';
import { useData } from '../../../context/DataContext';

export const StaffPayslipView: React.FC = () => {
  const { payslips, schoolProfile } = useData();

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
              @page { size: A4 portrait; margin: 8mm; }
              @media print {
                html, body { height: 100vh; margin: 0 !important; padding: 10px !important; box-sizing: border-box; page-break-inside: avoid !important; }
              }
              * { box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px 24px; color: #333; font-size: 11px; line-height: 1.3; }
              .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 12px; }
              .header h2 { margin: 0; font-size: 18px; color: #0284c7; }
              .header p { margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
              .details { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
              .table th, .table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              .table th { background-color: #f1f5f9; font-weight: 700; }
              .net { font-size: 1.1em; font-weight: bold; margin-top: 14px; text-align: right; color: #16a34a; background: #f0fdf4; padding: 8px; border-radius: 6px; border: 1px solid #bbf7d0; }
              .sign { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #475569; }
            </style>
          </head>
          <body>
            <div class="header">
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;">
                <img src="${schoolProfile?.logoUrl || '/pirnav-school-logo.png'}" style="width: 45px; height: 45px; object-fit: contain;" alt="Logo" />
                <div>
                  <h2 style="margin: 0; font-size: 18px; color: #0284c7;">${schoolProfile?.name || 'Pirnav Educational Institutions'}</h2>
                  <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">${schoolProfile?.address || ''}</p>
                </div>
              </div>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #0284c7; font-weight: 700;">MONTHLY SALARY PAYSLIP - HR DEPARTMENT</p>
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
            <FileText className="w-6 h-6 text-brand-600" /> Employee Payslips Registry
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
                  <td className="py-3.5 px-4 font-mono font-black text-brand-600 text-sm">{formatCurrency(p.netSalary)}</td>
                  <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold text-[10px]">Released</span></td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handlePrint(p)}
                      className="px-2.5 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold rounded-lg flex items-center gap-1 transition-all inline-flex align-middle"
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
