import React, { useState } from 'react';
import { UserPlus, Plus, Search, Calendar, User, ShoppingBag, RefreshCw, Undo2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { StudentUniformIssue } from '../../../types';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';

export const StudentUniformView: React.FC = () => {
  const {
    students,
    uniforms,
    uniformInventory,
    studentUniformIssues,
    addStudentUniformIssue,
    updateStudentUniformIssue,
    deleteStudentUniformIssue,
    academicClasses,
    financeSettings
  } = useData();

  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Issue' | 'Replace' | 'Return'>('Issue');
  const [selectedIssue, setSelectedIssue] = useState<StudentUniformIssue | null>(null);

  // Form states
  const [form, setForm] = useState({
    studentId: '',
    itemId: '',
    quantity: 1,
    size: 'M',
    type: 'Issue' as 'Issue' | 'Additional Purchase',
    notes: ''
  });

  const filteredIssues = studentUniformIssues.filter(i => {
    const matchQuery = i.studentName.toLowerCase().includes(query.toLowerCase()) ||
                       i.admissionNo.toLowerCase().includes(query.toLowerCase()) ||
                       i.itemName.toLowerCase().includes(query.toLowerCase());
    const matchClass = filterClass === 'All' || i.className === filterClass;
    const matchSection = filterSection === 'All' || i.section === filterSection;
    const matchStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchQuery && matchClass && matchSection && matchStatus;
  });

  const handleOpenIssue = () => {
    const defaultStudent = students[0];
    const defaultItem = uniforms[0];
    setForm({
      studentId: defaultStudent?.id || '',
      itemId: defaultItem?.id || '',
      quantity: 1,
      size: defaultItem?.size || 'M',
      type: 'Issue',
      notes: ''
    });
    setModalType('Issue');
    setIsModalOpen(true);
  };

  const handleOpenReplace = (issue: StudentUniformIssue) => {
    setSelectedIssue(issue);
    setForm({
      studentId: issue.studentId,
      itemId: issue.itemId,
      quantity: issue.quantity,
      size: issue.size,
      type: 'Issue',
      notes: 'Size Replacement'
    });
    setModalType('Replace');
    setIsModalOpen(true);
  };

  const handleReturn = (issue: StudentUniformIssue) => {
    updateStudentUniformIssue(issue.id, {
      status: 'Returned',
      returnDate: new Date().toISOString().split('T')[0]
    });
    addToast('success', 'Uniform Returned', `${issue.studentName} returned 1x ${issue.itemName}. Stock replenished.`);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.itemId) {
      addToast('warning', 'Validation Error', 'Please select student and uniform item.');
      return;
    }

    const studentObj = students.find(s => s.id === form.studentId);
    const itemObj = uniforms.find(u => u.id === form.itemId);

    if (!studentObj || !itemObj) return;

    // Check inventory stock
    const inv = uniformInventory.find(x => x.itemId === form.itemId);
    if (inv && inv.currentStock < form.quantity) {
      addToast('error', 'Out of Stock', `Insufficient stock for ${itemObj.category}. Available: ${inv.currentStock} units.`);
      return;
    }

    if (modalType === 'Issue') {
      const isAddPurchase = form.type === 'Additional Purchase';
      addStudentUniformIssue({
        studentId: form.studentId,
        studentName: `${studentObj.firstName} ${studentObj.lastName}`,
        admissionNo: studentObj.admissionNo || 'ADM2026-000',
        className: studentObj.className || 'Class 10',
        section: studentObj.section || 'A',
        itemId: form.itemId,
        itemName: itemObj.category,
        size: form.size,
        quantity: form.quantity,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Issued',
        academicYear: financeSettings.academicYear || '2025-2026',
        notes: isAddPurchase ? 'Additional Purchase - Paid' : form.notes
      });

      if (isAddPurchase) {
        addToast('success', 'Sale Invoiced & Paid', `Generated Invoice for additional purchase. Stock reduced.`);
      } else {
        addToast('success', 'Uniform Item Issued', `Assigned uniform to ${studentObj.firstName}.`);
      }
    } else if (modalType === 'Replace' && selectedIssue) {
      updateStudentUniformIssue(selectedIssue.id, {
        status: 'Replaced',
        size: form.size,
        replacementDate: new Date().toISOString().split('T')[0],
        notes: 'Replaced with size ' + form.size
      });
      addToast('success', 'Size Replaced', `Successfully completed item exchange to size ${form.size}.`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Student Uniform Assignments</h3>
          <p className="text-xs text-slate-500">Assign clothing kits, record sizing exchanges, check-in returns, and issue extra purchases</p>
        </div>

        <button
          onClick={handleOpenIssue}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Issue Uniform / Purchase
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-sm">
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, admission number, uniform item..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
        >
          <option value="All">All Classes</option>
          {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Issued">Issued</option>
          <option value="Returned">Returned</option>
          <option value="Replaced">Replaced</option>
        </select>
      </div>

      {/* Results Table */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Issued Item</th>
                <th className="py-3 px-4 text-center">Size</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No student uniform transactions logged.</td>
                </tr>
              ) : (
                filteredIssues.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{i.studentName}</td>
                    <td className="py-3 px-4 font-mono">{i.admissionNo}</td>
                    <td className="py-3 px-4">{i.className} - {i.section}</td>
                    <td className="py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">{i.itemName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{i.size}</td>
                    <td className="py-3 px-4 text-right">{i.quantity}</td>
                    <td className="py-3 px-4 font-mono">{i.issueDate}</td>
                    <td className="py-3 px-4">
                      <Badge variant={i.status === 'Issued' ? 'success' : (i.status === 'Returned' ? 'neutral' : 'warning')}>{i.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                      {i.status === 'Issued' && (
                        <>
                          <button onClick={() => handleReturn(i)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] flex items-center gap-0.5" title="Return Uniform"><Undo2 className="w-2.5 h-2.5" /> Return</button>
                          <button onClick={() => handleOpenReplace(i)} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[10px] flex items-center gap-0.5" title="Exchange Size"><RefreshCw className="w-2.5 h-2.5" /> Exch</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal dialog form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-500" />
              {modalType === 'Issue' ? 'Issue Uniform or Record Sale' : 'Replace Size'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {modalType === 'Issue' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Transaction Type *</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                    >
                      <option value="Issue">Baseline Distribution (Admission Fee Allocated)</option>
                      <option value="Additional Purchase">Additional Purchase (Direct Cash / POS Billing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Student *</label>
                    <select
                      value={form.studentId}
                      onChange={e => setForm({ ...form, studentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Clothing Item *</label>
                <select
                  disabled={modalType === 'Replace'}
                  value={form.itemId}
                  onChange={e => {
                    const ui = uniforms.find(x => x.id === e.target.value);
                    setForm({ ...form, itemId: e.target.value, size: ui?.size || 'M' });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer disabled:opacity-60"
                >
                  {uniforms.map(u => (
                    <option key={u.id} value={u.id}>{u.category} (Size {u.size} - Price {formatCurrency(u.price)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Size Spec *</label>
                  <input
                    type="text"
                    required
                    value={form.size}
                    onChange={e => setForm({ ...form, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Quantity *</label>
                  <input
                    disabled={modalType === 'Replace'}
                    type="number"
                    required
                    min={1}
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Action Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Standard issue, winter uniform"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all">Confirm Action</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentUniformView;
