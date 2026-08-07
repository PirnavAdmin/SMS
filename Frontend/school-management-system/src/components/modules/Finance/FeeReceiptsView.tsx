import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Receipt, Search, Printer, CheckCircle, Eye, Download, Mail } from 'lucide-react';
import { FeePayment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { PrintableFeeReceipt } from '../FeeManagement/PrintableFeeReceipt';

export const FeeReceiptsView: React.FC = () => {
  const { feePayments, academicClasses } = useData();
  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);

  const ITEMS_PER_PAGE = 10;

  const selectedClassObj = academicClasses.find(c => c.name === filterClass);
  const availableSections = selectedClassObj ? selectedClassObj.sections : ['A', 'B', 'C', 'D'];

  const filteredPayments = feePayments.filter(p => {
    const matchesSearch =
      p.receiptNo.toLowerCase().includes(query.toLowerCase()) ||
      p.studentName.toLowerCase().includes(query.toLowerCase());

    const matchesClass = filterClass === 'All' || p.className.startsWith(filterClass);
    const matchesSection = filterSection === 'All' || p.className.endsWith(`-${filterSection}`);

    return matchesSearch && matchesClass && matchesSection;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in">

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search receipt no or student name..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterClass}
            onChange={e => {
              setFilterClass(e.target.value);
              setFilterSection('All');
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer outline-none"
          >
            <option value="All">Select Class</option>
            {academicClasses.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterSection}
            onChange={e => {
              setFilterSection(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer outline-none"
          >
            <option value="All">Select Section</option>
            {availableSections.map(sec => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>
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
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No payment receipts found.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{p.receiptNo}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.studentName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.className}</td>
                    <td className="py-3 px-4 text-slate-500">{p.paymentDate}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{p.paymentMode}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amountPaid)}</td>
                    <td className="py-3 px-4"><Badge variant="success">{p.status}</Badge></td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold hover:bg-sky-100 flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> View / Print Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPayments.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900 dark:text-white">{startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900 dark:text-white">{Math.min(startIndex + ITEMS_PER_PAGE, filteredPayments.length)}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{filteredPayments.length}</strong> receipts
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                Previous
              </button>

              <span className="px-3 py-1.5 font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
