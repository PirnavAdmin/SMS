import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Download, Search, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { ExportButton } from '../../common/ExportButton';

const REPORT_TYPES = [
  'Daily Collection', 'Monthly Collection', 'Yearly Collection', 'Branch Wise Collection',
  'Class Wise Collection', 'Section Wise Collection', 'Fee Head Wise Collection',
  'Transport Collection', 'Hostel Collection', 'Scholarship Report', 'Discount Report',
  'Fine Report', 'Pending Fees', 'Student Ledger', 'Collection Summary', 'Cash Book'
];

export const FinanceReportsView: React.FC = () => {
  const { feePayments, students, studentTransports, studentHostels, studentScholarships } = useData();
  const [selectedReport, setSelectedReport] = useState<string>('Daily Collection');

  const totalCollected = feePayments.reduce((sum, p) => sum + p.amountPaid, 0);

  const getReportData = (): any[] => {
    switch (selectedReport) {
      case 'Transport Collection':
        return studentTransports.map(t => ({ student: t.studentName, admNo: t.admissionNo, route: t.routeName, feePlan: t.feePlan, fee: t.feeAmount }));
      case 'Hostel Collection':
        return studentHostels.map(h => ({ student: h.studentName, hostel: h.hostelName, room: h.roomNo, fee: h.feeAmount }));
      case 'Scholarship Report':
        return studentScholarships.map(s => ({ student: s.studentName, scholarship: s.scholarshipName, discount: `${s.discountValue} (${s.discountType})`, date: s.appliedDate }));
      case 'Pending Fees':
        return students.filter(s => s.dueFee > 0).map(s => ({ student: `${s.firstName} ${s.lastName}`, class: `${s.className}-${s.section}`, dueFee: s.dueFee }));
      default:
        return feePayments.map(p => ({ receiptNo: p.receiptNo, student: p.studentName, class: p.className, amount: p.amountPaid, mode: p.paymentMode, date: p.paymentDate }));
    }
  };

  const reportData = getReportData();

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Financial Reports & Audit Analytics
          </h2>
          <p className="text-xs text-slate-500">Generate 16 specialized ERP financial ledgers, collection reports & export datasets</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200">
            <Printer className="w-4 h-4" /> Print Report
          </button>
          <ExportButton data={reportData} filename={`report_${selectedReport.toLowerCase().replace(/\s+/g, '_')}`} />
        </div>
      </div>

      {/* Report Selector Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-2">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt}
            onClick={() => setSelectedReport(rt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedReport === rt
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {rt}
          </button>
        ))}
      </div>

      {/* Active Report View */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-500" /> {selectedReport}
          </h3>
          <span className="text-xs font-bold text-slate-500">Total Generated Records: {reportData.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                {Object.keys(reportData[0] || { Record: '' }).map(key => (
                  <th key={key} className="py-3 px-4 capitalize">{key.replace(/([A-Z])/g, ' $1')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {reportData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  {Object.values(row).map((val: any, valIdx) => (
                    <td key={valIdx} className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {typeof val === 'number' ? `INR ${val.toLocaleString()}` : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
