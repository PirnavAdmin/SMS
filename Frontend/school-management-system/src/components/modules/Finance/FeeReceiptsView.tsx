import React, { useState } from 'react';
import { Receipt, Search, Printer, CheckCircle, Eye, Download, Mail } from 'lucide-react';
import { FeePayment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { PrintableFeeReceipt } from '../FeeManagement/PrintableFeeReceipt';

export const FeeReceiptsView: React.FC = () => {
  const { feePayments } = useData();
  const [query, setQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);

  const filteredPayments = feePayments.filter(p =>
    p.receiptNo.toLowerCase().includes(query.toLowerCase()) ||
    p.studentName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-500" /> Fee Receipts Ledger & Reprint
          </h2>
          <p className="text-xs text-slate-500">Official receipt repository with PDF export, QR validation, and reprint tools</p>
        </div>

        <ExportButton data={feePayments} filename="fee_receipts" />
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search receipt no or student name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Receipt No</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Amount Paid</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{p.receiptNo}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.studentName}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.className}</td>
                  <td className="py-3 px-4 text-slate-500">{p.paymentDate}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{p.paymentMode}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">INR {p.amountPaid.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge variant="success">{p.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold hover:bg-sky-100 flex items-center gap-1 ml-auto"
                    >
                      <Printer className="w-3.5 h-3.5" /> View / Print Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Modal */}
      <PrintableFeeReceipt
        payment={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
