import React, { useState } from 'react';
import { UserPlus, Plus, Search, Calendar, User, ShoppingBag, RefreshCw, Undo2, Trash2, X } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { StudentUniformIssue } from '../../../types';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { Pagination } from '../../common/Pagination';

interface StudentUniformViewProps {
  initialStatusFilter?: string;
}

export const StudentUniformView: React.FC<StudentUniformViewProps> = ({ initialStatusFilter }) => {
  const { selectedAcademicYear } = useAuth();
  const {
    students,
    uniforms,
    uniformInventory,
    studentUniformIssues,
    addStudentUniformIssue,
    updateStudentUniformIssue,
    deleteStudentUniformIssue,
    academicClasses,
    financeSettings,
    uniformSizes = [],
    addFinanceTransaction
  } = useData();

  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter || 'All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    if (initialStatusFilter) {
      setFilterStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Issue' | 'Replace' | 'Return'>('Issue');
  const [selectedIssue, setSelectedIssue] = useState<StudentUniformIssue | null>(null);
  const [customMeasurement, setCustomMeasurement] = useState({
    chest: '',
    waist: '',
    length: '',
    shoulder: ''
  });

  // Form states
  const [form, setForm] = useState({
    studentId: '',
    itemId: '',
    quantity: 1,
    size: '',
    type: 'Issue' as 'Issue' | 'Additional Purchase',
    notes: ''
  });

  const getResolvedSize = () => {
    if (form.size !== 'Others' && form.size !== 'Other') return form.size;
    const parts = [];
    if (customMeasurement.chest) parts.push(`Chest: ${customMeasurement.chest}"`);
    if (customMeasurement.waist) parts.push(`Waist: ${customMeasurement.waist}"`);
    if (customMeasurement.length) parts.push(`Length: ${customMeasurement.length}"`);
    if (customMeasurement.shoulder) parts.push(`Shoulder: ${customMeasurement.shoulder}"`);
    
    if (parts.length > 0) {
      return `Custom Tailored (${parts.join(', ')})`;
    }
    return 'Custom Tailored';
  };

  const filteredIssues = studentUniformIssues.filter(i => {
    const matchQuery = i.studentName.toLowerCase().includes(query.toLowerCase()) ||
                       i.admissionNo.toLowerCase().includes(query.toLowerCase()) ||
                       i.itemName.toLowerCase().includes(query.toLowerCase());
    const matchClass = filterClass === 'All' || i.className === filterClass;
    const matchSection = filterSection === 'All' || i.section === filterSection;
    const matchStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchQuery && matchClass && matchSection && matchStatus;
  });

  const paginatedIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenIssue = () => {
    setSelectedIssue(null);
    setForm({
      studentId: '',
      itemId: '',
      quantity: 1,
      size: '',
      type: 'Issue',
      notes: ''
    });
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
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
      notes: issue.notes || ''
    });
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsModalOpen(true);
  };

  const handleReturn = (issue: StudentUniformIssue) => {
    updateStudentUniformIssue(issue.id, {
      status: 'Returned',
      returnDate: new Date().toISOString().split('T')[0],
      notes: 'Returned by student'
    });
    addToast('info', 'Uniform Returned', `Recorded item return for ${issue.itemName} (${issue.studentName}).`);
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

    const qty = Number(form.quantity) || 1;
    const finalSize = getResolvedSize();

    // Check inventory stock
    const inv = uniformInventory.find(x => x.itemId === form.itemId || x.itemName.toLowerCase() === itemObj.category.toLowerCase());
    const currentStockAvailable = inv ? inv.currentStock : (itemObj.availableStock !== undefined ? itemObj.availableStock : 0);

    if (currentStockAvailable < qty) {
      addToast('error', 'Insufficient Stock', `Insufficient stock for ${itemObj.category}. Only ${currentStockAvailable} units available in stock.`);
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
        size: finalSize,
        quantity: qty,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Issued',
        academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
        notes: isAddPurchase ? 'Additional Purchase - Paid' : form.notes
      });

      if (isAddPurchase) {
        if (addFinanceTransaction) {
          addFinanceTransaction({
            referenceNumber: `TXN-UNI-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString().split('T')[0],
            type: 'Income',
            category: 'Uniform',
            sourceModule: 'Uniform',
            description: `Uniform Store Direct Sale - ${qty}x ${itemObj.category} (${studentObj.firstName} ${studentObj.lastName})`,
            amount: (itemObj.price || 0) * qty,
            paymentMode: 'Cash',
            account: 'Main Bank Account',
            status: 'Completed',
            branch: studentObj.branch || 'Main Campus',
            academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
            createdBy: 'Uniform Store Administrator'
          });
        }
        addToast('success', 'Sale Invoiced & Paid', `Generated Invoice for additional purchase (${qty}x ${itemObj.category}). Reflected in Finance Ledger.`);
      } else {
        addToast('success', 'Uniform Item Issued', `Assigned ${qty}x ${itemObj.category} to ${studentObj.firstName}. Stock reduced by ${qty}.`);
      }
    } else if (modalType === 'Replace' && selectedIssue) {
      updateStudentUniformIssue(selectedIssue.id, {
        status: 'Replaced',
        size: finalSize,
        replacementDate: new Date().toISOString().split('T')[0],
        notes: 'Replaced with size ' + finalSize
      });
      addToast('success', 'Size Replaced', `Successfully completed item exchange to size ${finalSize}.`);
    }

    setIsModalOpen(false);
  };

  const selectedUniformObj = uniforms.find(u => u.id === form.itemId);
  const selectedInvItem = uniformInventory.find(x => x.itemId === form.itemId || (selectedUniformObj && x.itemName.toLowerCase() === selectedUniformObj.category.toLowerCase()));
  const currentSelectedStock = selectedInvItem ? selectedInvItem.currentStock : (selectedUniformObj?.availableStock !== undefined ? selectedUniformObj.availableStock : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-sky-600" /> Uniform Distribution
          </h2>
          </div>

        <button
          onClick={handleOpenIssue}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Uniform
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, admission number, uniform item..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer w-full sm:w-44"
          >
            <option value="All">Select Class</option>
            <option value="All">All Classes</option>
            {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer w-full sm:w-44"
          >
            <option value="All">Select Status</option>
            <option value="Issued">Issued</option>
            <option value="Returned">Returned</option>
            <option value="Replaced">Replaced</option>
          </select>
        </div>
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
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No student uniform transactions logged.</td>
                </tr>
              ) : (
                paginatedIssues.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{i.studentName}</td>
                    <td className="py-3 px-4 font-mono">{i.admissionNo}</td>
                    <td className="py-3 px-4">{i.className} - {i.section}</td>
                    <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">{i.itemName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{i.size}</td>
                    <td className="py-3 px-4 text-right">{i.quantity}</td>
                    <td className="py-3 px-4 font-mono">{i.issueDate}</td>
                    <td className="py-3 px-4">
                      <Badge variant={i.status === 'Issued' ? 'success' : (i.status === 'Returned' ? 'neutral' : 'warning')}>{i.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {i.status === 'Issued' && (
                          <>
                            <button onClick={() => handleReturn(i)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] flex items-center gap-0.5" title="Return Uniform"><Undo2 className="w-2.5 h-2.5" /> Return</button>
                            <button onClick={() => handleOpenReplace(i)} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[10px] flex items-center gap-0.5" title="Exchange Size"><RefreshCw className="w-2.5 h-2.5" /> Exch</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredIssues.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Modal dialog form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="glass-card w-full max-w-lg max-h-[85vh] flex flex-col p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4 my-auto overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-500" />
                {modalType === 'Issue' ? 'Issue Uniform or Record Sale' : 'Replace Size'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {modalType === 'Issue' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Transaction Type *</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                    >
                      <option value="Issue">Baseline Distribution (Admission Kit)</option>
                      <option value="Additional Purchase">Additional Purchase (Direct Billing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Student *</label>
                    <select
                      value={form.studentId}
                      onChange={e => setForm({ ...form, studentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                    >
                      <option value="">Select Student *</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo || s.id} - {s.className || 'Class 10'})</option>
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
                    setForm({ ...form, itemId: e.target.value, size: ui?.size || '' });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer disabled:opacity-60"
                >
                  <option value="">Select Clothing Item *</option>
                  {uniforms.map(u => {
                    const invItem = uniformInventory.find(x => x.itemId === u.id || x.itemName.toLowerCase() === u.category.toLowerCase());
                    const avail = invItem ? invItem.currentStock : (u.availableStock !== undefined ? u.availableStock : 0);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.category} (Size {u.size} • Stock: {avail} units)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Size Specification *</label>
                  <select
                    value={form.size || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setForm({ ...form, size: val });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-semibold"
                  >
                    <option value="">Select Size *</option>
                    <option value="S">S (Small)</option>
                    <option value="M">M (Medium)</option>
                    <option value="L">L (Large)</option>
                    <option value="XL">XL (Extra Large)</option>
                    <option value="XXL">XXL</option>
                    <option value="28">28</option>
                    <option value="30">30</option>
                    <option value="32">32</option>
                    <option value="34">34</option>
                    <option value="36">36</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="Others">Others</option>
                    {(uniformSizes || []).map(s => (
                      !['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', 'Others', 'Other'].includes(s.sizeName) && (
                        <option key={s.id} value={s.sizeName}>{s.sizeName}</option>
                      )
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Quantity *</label>
                  <input
                    disabled={modalType === 'Replace'}
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 1"
                    value={form.quantity === ('' as any) ? '' : form.quantity}
                    onChange={e => {
                      const val = e.target.value;
                      setForm({ ...form, quantity: val === '' ? ('' as any) : Number(val) });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Custom Tailored Body Measurements Form */}
              {(form.size === 'Others' || form.size === 'Other') && (
                <div className="p-3.5 bg-sky-50/90 dark:bg-sky-950/50 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-sky-200/70 dark:border-sky-800/70 pb-2">
                    <label className="block font-extrabold text-[11px] text-sky-900 dark:text-sky-200 uppercase tracking-wider">
                      Custom Tailored Body Measurements
                    </label>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-600 text-white shadow-xs">
                      Custom Tailored
                    </span>
                  </div>

                  {/* Measurement grid: Chest, Waist, Length, Shoulder */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Chest / Bust (in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 38"
                        value={customMeasurement.chest}
                        onChange={e => setCustomMeasurement({ ...customMeasurement, chest: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Waist (in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 32"
                        value={customMeasurement.waist}
                        onChange={e => setCustomMeasurement({ ...customMeasurement, waist: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Length / Height (in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 28"
                        value={customMeasurement.length}
                        onChange={e => setCustomMeasurement({ ...customMeasurement, length: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Shoulder Width (in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 16"
                        value={customMeasurement.shoulder}
                        onChange={e => setCustomMeasurement({ ...customMeasurement, shoulder: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Live stock & bill summary box */}
              {selectedUniformObj && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Available Warehouse Stock:</span>
                    <span className={`font-bold ${currentSelectedStock >= (Number(form.quantity) || 1) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {currentSelectedStock} Units {currentSelectedStock < (Number(form.quantity) || 1) ? '(Insufficient Stock)' : ''}
                    </span>
                  </div>
                  {form.type === 'Additional Purchase' && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-sky-600 dark:text-sky-400">
                      <span>Total Invoice Amount:</span>
                      <span>{formatCurrency((selectedUniformObj.price || 0) * (Number(form.quantity) || 1))}</span>
                    </div>
                  )}
                </div>
              )}

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
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentUniformView;
