import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { FileText, Printer, Search, Eye, Download } from 'lucide-react';
import { Payslip } from '../../../types';
import { useData } from '../../../context/DataContext';
import { printPayslip, downloadPayslipPdf } from '../../../utils/payslipTemplate';
import { PayslipModal } from './PayslipModal';

export const StaffPayslipView: React.FC = () => {
  const { payslips, schoolProfile, staff } = useData();

  const [query, setQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);

  const filteredPayslips = payslips.filter(p => {
    const nameMatch = p.employeeName.toLowerCase().includes(query.toLowerCase()) || p.empId.toLowerCase().includes(query.toLowerCase());
    const monthMatch = selectedMonth === 'All' || p.month === selectedMonth;
    return nameMatch && monthMatch;
  });

  const handlePrint = (p: Payslip) => {
    const matchedStaff = (staff || []).find(s => s.id === p.employeeId || s.empId === p.empId);
    printPayslip(p, matchedStaff, schoolProfile);
  };

  const uniqueMonths = Array.from(new Set(payslips.map(p => p.month)));

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" /> Employee Payslips Registry
          </h2>
          <p className="text-xs text-slate-500">Search, preview and print official salary slips disbursed to school staff members</p>
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
                  <td className="py-3.5 px-4 font-mono font-black text-teal-700 text-sm">{formatCurrency(p.netSalary)}</td>
                  <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Released</span></td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setViewingPayslip(p)}
                        type="button"
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="View Payslip"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => {
                          const matchedStaff = (staff || []).find(s => s.id === p.employeeId || s.empId === p.empId);
                          downloadPayslipPdf(p, matchedStaff, schoolProfile);
                        }}
                        type="button"
                        className="px-2.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button
                        onClick={() => handlePrint(p)}
                        type="button"
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="Print Payslip"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payslip View Modal */}
      {viewingPayslip && (
        <PayslipModal
          payslip={viewingPayslip}
          onClose={() => setViewingPayslip(null)}
        />
      )}

    </div>
  );
};
export default StaffPayslipView;
