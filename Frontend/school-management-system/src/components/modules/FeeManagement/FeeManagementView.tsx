import React, { useState } from 'react';
import { DollarSign, Search, Plus, Receipt, AlertCircle, CheckCircle, Trash2, Edit, X } from 'lucide-react';
import { Student, FeePayment, FeeStructure, FeeTerm } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { FeeCollectModal } from './FeeCollectModal';
import { PrintableFeeReceipt } from './PrintableFeeReceipt';

export const FeeManagementView: React.FC = () => {
  const { students, feeStructures, feePayments, addFeeStructure, updateFeeStructure, deleteFeeStructure } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'payments' | 'structures' | 'dues'>('payments');
  const [selectedStudentForCollect, setSelectedStudentForCollect] = useState<Student | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<FeePayment | null>(null);

  // Fee Structure Form Modal
  const [isStructFormOpen, setIsStructFormOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<FeeStructure | null>(null);
  const [deletingStruct, setDeletingStruct] = useState<FeeStructure | null>(null);

  const [structForm, setStructForm] = useState<Partial<FeeStructure>>({
    academicYear: '2025-2026',
    className: 'Class 10',
    term: 'Quarterly',
    tuitionFee: 2500,
    transportFee: 300,
    hostelFee: 0,
    uniformFee: 200,
    booksFee: 300,
    labFee: 400,
    miscFee: 100,
    dueDate: '2026-08-15'
  });

  const totalCollected = feePayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalDues = students.reduce((sum, s) => sum + s.dueFee, 0);

  const filteredPayments = feePayments.filter(p =>
    p.studentName.toLowerCase().includes(query.toLowerCase()) ||
    p.receiptNo.toLowerCase().includes(query.toLowerCase())
  );

  const studentsWithDues = students.filter(s => s.dueFee > 0 && s.firstName.toLowerCase().includes(query.toLowerCase()));

  const handleOpenAddStruct = () => {
    setEditingStruct(null);
    setStructForm({
      academicYear: '2025-2026',
      className: 'Class 10',
      term: 'Quarterly',
      tuitionFee: 2500,
      transportFee: 300,
      hostelFee: 0,
      uniformFee: 200,
      booksFee: 300,
      labFee: 400,
      miscFee: 100,
      dueDate: '2026-08-15'
    });
    setIsStructFormOpen(true);
  };

  const handleOpenEditStruct = (f: FeeStructure) => {
    setEditingStruct(f);
    setStructForm(f);
    setIsStructFormOpen(true);
  };

  const handleStructSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!structForm.className) return;

    if (editingStruct) {
      updateFeeStructure(editingStruct.id, structForm);
      addToast('success', 'Fee Structure Updated', `Updated ${structForm.className}`);
    } else {
      addFeeStructure(structForm as Omit<FeeStructure, 'id'>);
      addToast('success', 'Fee Structure Configured', `Configured ${structForm.className}`);
    }
    setIsStructFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-sky-500" /> Fee Management & Collection
          </h2>
          <p className="text-xs text-slate-500">Configure class fee structures by term (Monthly/Quarterly/Annual), record payments & print receipts</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddStruct}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Configure Fee Structure
          </button>
          <ExportButton data={feePayments} filename="fee_transactions" />
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Collected</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">INR {totalCollected.toLocaleString()}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"><CheckCircle className="w-6 h-6" /></div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Outstanding Due</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">INR {totalDues.toLocaleString()}</h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"><AlertCircle className="w-6 h-6" /></div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Receipts Issued</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{feePayments.length}</h3>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"><Receipt className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Subnav Tabs & Search */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'payments' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Payment Transactions
          </button>
          <button
            onClick={() => setActiveTab('dues')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dues' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Outstanding Dues ({studentsWithDues.length})
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'structures' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Class Fee Structures
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search receipt or student..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Payment Transactions Table */}
      {activeTab === 'payments' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Receipt No</th>
                  <th className="py-3.5 px-4">Student & Class</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{p.receiptNo}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{p.studentName}</p>
                      <p className="text-[10px] text-slate-400">{p.className}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.paymentDate}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{p.paymentMode}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">INR {p.amountPaid}</td>
                    <td className="py-3 px-4"><Badge variant="success">{p.status}</Badge></td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setReceiptToPrint(p)}
                        className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold hover:bg-brand-100 text-xs flex items-center gap-1 ml-auto"
                      >
                        <Receipt className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Outstanding Dues List */}
      {activeTab === 'dues' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentsWithDues.map(s => (
            <div key={s.id} className="glass-card p-5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={s.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-slate-500">{s.className}-{s.section} • Adm: {s.admissionNo}</p>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">Due: INR {s.dueFee}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForCollect(s)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" /> Collect Fee
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Class Fee Structures */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feeStructures.map(f => {
            const totalTermFee = (f.tuitionFee || 0) + (f.transportFee || 0) + (f.hostelFee || 0) + (f.uniformFee || 0) + (f.booksFee || 0) + (f.labFee || 0) + (f.miscFee || 0);
            return (
              <div key={f.id} className="glass-card p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950">{f.academicYear} • {f.term}</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{f.className} Fee Structure</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEditStruct(f)} className="p-1 rounded hover:bg-slate-100 text-brand-600" title="Edit Structure"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeletingStruct(f)} className="p-1 rounded hover:bg-rose-50 text-rose-600" title="Delete Structure"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between text-slate-500"><span>Tuition:</span><span className="font-semibold text-slate-800 dark:text-slate-200">INR {f.tuitionFee}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Transport:</span><span className="font-semibold text-slate-800 dark:text-slate-200">INR {f.transportFee || 0}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Hostel:</span><span className="font-semibold text-slate-800 dark:text-slate-200">INR {f.hostelFee || 0}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Uniform:</span><span className="font-semibold text-slate-800 dark:text-slate-200">INR {f.uniformFee || 0}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Books:</span><span className="font-semibold text-slate-800 dark:text-slate-200">INR {f.booksFee || 0}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Lab & Science:</span><span className="font-semibold text-slate-800 dark:text-slate-200">INR {f.labFee || 0}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Misc Fee:</span><span className="font-semibold text-slate-800 dark:text-slate-200">INR {f.miscFee || 0}</span></div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>Total Term Fee:</span>
                  <span className="text-emerald-600">INR {totalTermFee}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fee Structure Modal */}
      {isStructFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingStruct ? 'Edit Fee Structure' : 'Configure Class Fee Structure'}
              </h3>
              <button onClick={() => setIsStructFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStructSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Academic Year</label>
                  <input type="text" value={structForm.academicYear} onChange={e => setStructForm({ ...structForm, academicYear: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Class Grade *</label>
                  <select value={structForm.className} onChange={e => setStructForm({ ...structForm, className: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Term Schedule</label>
                <select value={structForm.term} onChange={e => setStructForm({ ...structForm, term: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="block font-semibold mb-0.5">Tuition (INR)</label><input type="number" value={structForm.tuitionFee} onChange={e => setStructForm({ ...structForm, tuitionFee: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-0.5">Transport (INR)</label><input type="number" value={structForm.transportFee} onChange={e => setStructForm({ ...structForm, transportFee: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-0.5">Hostel (INR)</label><input type="number" value={structForm.hostelFee} onChange={e => setStructForm({ ...structForm, hostelFee: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-0.5">Uniform (INR)</label><input type="number" value={structForm.uniformFee} onChange={e => setStructForm({ ...structForm, uniformFee: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-0.5">Books (INR)</label><input type="number" value={structForm.booksFee} onChange={e => setStructForm({ ...structForm, booksFee: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-0.5">Lab Fee (INR)</label><input type="number" value={structForm.labFee} onChange={e => setStructForm({ ...structForm, labFee: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border" /></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsStructFormOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">Save Fee Structure</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Collect Modal */}
      <FeeCollectModal
        student={selectedStudentForCollect}
        isOpen={!!selectedStudentForCollect}
        onClose={() => setSelectedStudentForCollect(null)}
        onReceiptGenerated={(payment) => setReceiptToPrint(payment)}
      />

      {/* Printable Receipt Modal */}
      <PrintableFeeReceipt
        payment={receiptToPrint}
        isOpen={!!receiptToPrint}
        onClose={() => setReceiptToPrint(null)}
      />

      <ConfirmModal
        isOpen={!!deletingStruct}
        title="Delete Fee Structure"
        message={`Are you sure you want to delete fee structure for ${deletingStruct?.className}?`}
        onConfirm={() => {
          if (deletingStruct) {
            deleteFeeStructure(deletingStruct.id);
            addToast('success', 'Structure Deleted');
            setDeletingStruct(null);
          }
        }}
        onCancel={() => setDeletingStruct(null)}
      />
    </div>
  );
};
