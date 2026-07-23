import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { RotateCcw, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import { Refund } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';

export const RefundManagementView: React.FC = () => {
  const { refunds, students, addRefund, updateRefundStatus } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [receiptNo, setReceiptNo] = useState('REC-2026-0891');
  const [amount, setAmount] = useState(1000);
  const [reason, setReason] = useState<Refund['reason']>('Scholarship Adjustment');
  const [refundMode, setRefundMode] = useState<Refund['refundMode']>('Bank Transfer');
  const [remarks, setRemarks] = useState('Refund adjustment request');

  const filteredRefunds = refunds.filter(r =>
    r.refundNo.toLowerCase().includes(query.toLowerCase()) || r.studentName.toLowerCase().includes(query.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === studentId);
    if (!st) {
      addToast('warning', 'Student Required', 'Select a student for refund.');
      return;
    }

    addRefund({
      receiptNo,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      amount,
      reason,
      approvedBy: 'Pending Admin Review',
      refundMode,
      refundDate: new Date().toISOString().split('T')[0],
      remarks,
      status: 'Pending'
    });

    addToast('success', 'Refund Requested', `Created refund request for ${st.firstName}`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-sky-500" /> Refund Management Module
          </h2>
          <p className="text-xs text-slate-500">Track and approve fee refunds for Duplicate Payments, Admission Cancellations & Scholarship Adjustments</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Request Refund
          </button>
          <ExportButton data={refunds} filename="refunds" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search refund no or student..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Refunds Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Refund No</th>
                <th className="py-3.5 px-4">Receipt Ref</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Approved By</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Approve / Reject</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredRefunds.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{r.refundNo}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{r.receiptNo}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{r.studentName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{r.reason}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.refundMode}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.amount)}</td>
                  <td className="py-3 px-4 text-slate-500">{r.approvedBy}</td>
                  <td className="py-3 px-4">
                    <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'danger'}>{r.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {r.status === 'Pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            updateRefundStatus(r.id, 'Approved', 'Dr. Eleanor Vance (Principal)');
                            addToast('success', 'Refund Approved');
                          }}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            updateRefundStatus(r.id, 'Rejected', 'Admin User');
                            addToast('info', 'Refund Rejected');
                          }}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Refund Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Refund Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Student *</label>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="">-- Choose Student --</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.className}-{st.section})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Receipt Ref No</label><input type="text" value={receiptNo} onChange={e => setReceiptNo(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div><label className="block font-semibold mb-1">Refund Amount (₹) *</label><input type="number" required value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Reason</label>
                  <select value={reason} onChange={e => setReason(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Duplicate Payment">Duplicate Payment</option>
                    <option value="Admission Cancelled">Admission Cancelled</option>
                    <option value="Scholarship Adjustment">Scholarship Adjustment</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Refund Mode</label>
                  <select value={refundMode} onChange={e => setRefundMode(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Remarks</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
