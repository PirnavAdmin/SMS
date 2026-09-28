import React, { useState, useMemo } from 'react';
import { Tag, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';
import { FeeHead, FeeHeadCategory, FeeHeadFrequency, FeePaymentEligibility } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { compareClassesAscending } from '../../../utils/classSorter';

const CATEGORIES: FeeHeadCategory[] = [
  'Tuition', 'Admission', 'Books', 'Uniform', 'Lab', 'Computer',
  'Library', 'Sports', 'Activity', 'Exam', 'Transport', 'Hostel', 'Miscellaneous'
];

const FREQUENCIES: FeeHeadFrequency[] = [
  'One Time', 'Monthly', 'Quarterly', 'Half Yearly', 'Annual', 'Custom'
];

const DEFAULT_CLASSES = [
  'Playgroup', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

export const FeeHeadsView: React.FC = () => {
  const { feeHeads, addFeeHead, updateFeeHead, deleteFeeHead, toggleFeeHeadStatus, academicClasses, branches, academicYearFeeSchedules } = useData();
  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const classOptions = useMemo(() => {
    if (academicClasses && academicClasses.length > 0) {
      const list = academicClasses.map(c => c.name || (c as any).className).filter(Boolean);
      return Array.from(new Set(list)).sort(compareClassesAscending);
    }
    return DEFAULT_CLASSES;
  }, [academicClasses]);

  const branchOptions = useMemo(() => {
    if (branches && branches.length > 0) {
      const names = branches.map((b: any) => typeof b === 'string' ? b : (b.name || b.branchName || b.branch)).filter(Boolean);
      const unique = Array.from(new Set(names));
      if (!unique.includes('All Branches')) unique.unshift('All Branches');
      return unique;
    }
    return ['All Branches', 'Main Campus', 'Madhapur Branch'];
  }, [branches]);

  const availableAcademicTerms = useMemo(() => {
    const activeAY = selectedAcademicYear || '2026-2027';
    const schedule = (academicYearFeeSchedules || []).find((s) => s.academicYear === activeAY);
    if (schedule && schedule.terms && schedule.terms.length > 0) {
      return [...schedule.terms].sort((a, b) => a.sequence - b.sequence).map(t => t.termName || t.id);
    }
    return ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
  }, [academicYearFeeSchedules, selectedAcademicYear]);

  const formatClassDisplayName = (cls: string) => {
    if (!cls) return '';
    return cls.replace(/^Class\s+/i, '').trim();
  };

  const formatClassListForDisplay = (classes?: string[]) => {
    if (!classes || classes.length === 0) return 'None';
    return classes.map(formatClassDisplayName).join(', ');
  };

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHead, setEditingHead] = useState<FeeHead | null>(null);
  const [deletingHead, setDeletingHead] = useState<FeeHead | null>(null);

  const [formData, setFormData] = useState<Partial<FeeHead>>({
    name: '',
    code: '',
    category: 'Tuition',
    frequency: 'Quarterly',
    mandatory: true,
    applicableClasses: classOptions,
    applicableBranches: ['All Branches'],
    paymentEligibility: 'Both One-Time and Term-Wise',
    applicableTerms: [...availableAcademicTerms],
    taxPercentage: 0,
    displayOrder: 1,
    status: 'Active'
  });

  const filteredHeads = feeHeads.filter(h => {
    const matchesQuery = h.name.toLowerCase().includes(query.toLowerCase()) || h.code.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
    const matchesFrequency = selectedFrequency === 'All' || h.frequency === selectedFrequency;
    const matchesStatus = selectedStatus === 'All' || h.status === selectedStatus;
    return matchesQuery && matchesCategory && matchesFrequency && matchesStatus;
  }).sort((a, b) => {
    if (a.mandatory && !b.mandatory) return -1;
    if (!a.mandatory && b.mandatory) return 1;
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });

  const handleOpenAdd = () => {
    setEditingHead(null);
    setFormData({
      name: '',
      code: 'FH-' + Math.floor(100 + Math.random() * 900),
      category: 'Tuition',
      frequency: 'Quarterly',
      mandatory: true,
      applicableClasses: classOptions,
      applicableBranches: ['All Branches'],
      paymentEligibility: 'Both One-Time and Term-Wise',
      applicableTerms: [...availableAcademicTerms],
      taxPercentage: 0,
      displayOrder: feeHeads.length + 1,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: FeeHead) => {
    setEditingHead(h);
    setFormData({
      ...h,
      mandatory: h.mandatory === true,
      applicableClasses: h.applicableClasses && h.applicableClasses.length > 0 ? [...h.applicableClasses] : [...classOptions],
      applicableBranches: h.applicableBranches && h.applicableBranches.length > 0 ? [...h.applicableBranches] : ['All Branches'],
      paymentEligibility: h.paymentEligibility || 'Both One-Time and Term-Wise',
      applicableTerms: h.applicableTerms && h.applicableTerms.length > 0 ? [...h.applicableTerms] : [...availableAcademicTerms],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.name.trim()) {
        throw new Error('Fee type name is required.');
      }
      if (!formData.code || !formData.code.trim()) {
        throw new Error('Fee type code is required.');
      }
      if (!formData.applicableClasses || formData.applicableClasses.length === 0) {
        throw new Error('Please select at least one applicable class for this fee type.');
      }
      if (formData.paymentEligibility === 'Term-Wise Allowed' && (!formData.applicableTerms || formData.applicableTerms.length === 0)) {
        throw new Error('Validation Error: Please select at least one applicable term for Term-Wise payment.');
      }

      const cleanName = formData.name.trim().toLowerCase();
      const cleanCode = formData.code.trim().toLowerCase();

      const existingDuplicate = feeHeads.find(h => {
        if (editingHead && String(h.id) === String(editingHead.id)) return false;
        const sameCode = h.code && h.code.trim().toLowerCase() === cleanCode;
        const sameNameCat = h.name && h.name.trim().toLowerCase() === cleanName && h.category === formData.category;
        return sameCode || sameNameCat;
      });

      if (existingDuplicate) {
        if (existingDuplicate.code && existingDuplicate.code.trim().toLowerCase() === cleanCode) {
          throw new Error(`Duplicate Validation Error: Fee type code "${formData.code}" already exists.`);
        } else {
          throw new Error(`Duplicate Validation Error: Fee type "${formData.name}" in category "${formData.category}" already exists.`);
        }
      }

      const cleanTax = (formData.taxPercentage as any) === '' || formData.taxPercentage === undefined || formData.taxPercentage === null ? 0 : Number(formData.taxPercentage);
      const cleanOrder = (formData.displayOrder as any) === '' || formData.displayOrder === undefined || formData.displayOrder === null ? feeHeads.length + 1 : Number(formData.displayOrder);

      const payload = {
        ...formData,
        taxPercentage: cleanTax,
        displayOrder: cleanOrder,
        mandatory: formData.mandatory === true,
        academicYear: selectedAcademicYear || 'All',
        paymentEligibility: formData.paymentEligibility || 'Both One-Time and Term-Wise',
        applicableTerms: formData.paymentEligibility === 'One-Time Only' ? [] : (formData.applicableTerms || [...availableAcademicTerms])
      };

      if (editingHead) {
        await updateFeeHead(editingHead.id, payload);
        addToast('success', 'Fee Head Updated', `Updated ${formData.name}`);
      } else {
        await addFeeHead(payload as Omit<FeeHead, 'id'>);
        addToast('success', 'Fee Head Created', `Created ${formData.name}`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      addToast('error', 'Validation Error', err.message || 'Validation failed for Fee Type.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-sky-500" /> Fee Types
          </h2>
          </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Fee Category
          </button>
          <ExportButton data={filteredHeads} filename="fee_heads" />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name or code..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={selectedFrequency}
          onChange={e => setSelectedFrequency(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
        >
          <option value="All">All Frequencies</option>
          {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Fee Type</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payment Eligibility</th>
                <th className="py-3.5 px-4">Mandatory</th>
                <th className="py-3.5 px-4">Classes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredHeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Tag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No fee types configured</p>
                    <p className="text-xs text-slate-400 mt-1">Click "+ Add Fee Category" above to create fee heads dynamically.</p>
                  </td>
                </tr>
              ) : (
                filteredHeads.map((h, idx) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{h.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{h.code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold">
                        {h.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {h.paymentEligibility === 'One-Time Only' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                          One-Time Only
                        </span>
                      ) : h.paymentEligibility === 'Term-Wise Allowed' ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-[10px]">
                          Term-Wise ({(h.applicableTerms || []).length || 'All'} Terms)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                          Both (One-Time / Term)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {h.mandatory ? (
                        <span className="text-rose-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Mandatory</span>
                      ) : (
                        <span className="text-slate-400 font-medium">Optional</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{formatClassListForDisplay(h.applicableClasses)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleFeeHeadStatus(h.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all ${
                          h.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {h.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenEdit(h)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeletingHead(h)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingHead ? 'Edit Fee Category / Head' : 'Add Fee Category / Head'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fee Type Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tuition Fee"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Fee Code <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. TUIT-101"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Payment Configuration */}
              <div className="space-y-2 p-3 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800">
                <label className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Payment Configuration
                </label>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Payment Frequency / Eligibility <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.paymentEligibility || 'Both One-Time and Term-Wise'}
                    onChange={(e) => {
                      const val = e.target.value as FeePaymentEligibility;
                      setFormData({
                        ...formData,
                        paymentEligibility: val,
                        applicableTerms: val === 'One-Time Only' ? [] : (formData.applicableTerms && formData.applicableTerms.length > 0 ? formData.applicableTerms : [...availableAcademicTerms])
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs outline-none"
                  >
                    <option value="One-Time Only">One-Time Only (Single Installment)</option>
                    <option value="Term-Wise Allowed">Term-Wise Allowed Only</option>
                    <option value="Both One-Time and Term-Wise">Both One-Time and Term-Wise (Flexible)</option>
                  </select>
                </div>

                {formData.paymentEligibility !== 'One-Time Only' && (
                  <div className="space-y-2 pt-1 border-t border-sky-100 dark:border-sky-900/60">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px]">
                        Applicable Terms ({(formData.applicableTerms || []).length}/{availableAcademicTerms.length} Selected)
                      </label>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, applicableTerms: [...availableAcademicTerms] })}
                          className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, applicableTerms: [] })}
                          className="text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 p-1 max-h-32 overflow-y-auto">
                      {availableAcademicTerms.map((tName) => {
                        const isChecked = (formData.applicableTerms || []).includes(tName);
                        return (
                          <label
                            key={tName}
                            className={`flex items-center gap-2 p-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = formData.applicableTerms || [];
                                if (e.target.checked) {
                                  setFormData({ ...formData, applicableTerms: [...current, tName] });
                                } else {
                                  setFormData({ ...formData, applicableTerms: current.filter(t => t !== tName) });
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="truncate">{tName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={(formData.displayOrder as any) === '' ? '' : (formData.displayOrder ?? 1)}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, displayOrder: val === '' ? '' as any : Number(val) });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    value={(formData.taxPercentage as any) === '' ? '' : (formData.taxPercentage ?? 0)}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, taxPercentage: val === '' ? '' as any : Number(val) });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Applicable Classes Configuration */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200">
                    Applicable Classes ({(formData.applicableClasses || []).length}/{classOptions.length}) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, applicableClasses: [...classOptions] })}
                      className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, applicableClasses: [] })}
                      className="text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1">
                  {classOptions.map((cls) => {
                    const isChecked = (formData.applicableClasses || []).includes(cls);
                    return (
                      <label
                        key={cls}
                        className={`flex items-center gap-2 p-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = formData.applicableClasses || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, applicableClasses: [...current, cls] });
                            } else {
                              setFormData({ ...formData, applicableClasses: current.filter(c => c !== cls) });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="truncate">{formatClassDisplayName(cls)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Applicable Branches Configuration */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200">
                    Applicable Branches ({(formData.applicableBranches || []).includes('All Branches') ? 'All' : (formData.applicableBranches || []).length})
                  </label>
                </div>

                <div className="flex flex-wrap gap-1.5 p-1">
                  {branchOptions.map((br) => {
                    const isAll = br === 'All Branches';
                    const currentBranches = formData.applicableBranches || ['All Branches'];
                    const isChecked = currentBranches.includes(br) || (isAll && currentBranches.length === 0);
                    return (
                      <label
                        key={br}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (isAll) {
                              setFormData({ ...formData, applicableBranches: ['All Branches'] });
                            } else {
                              let next = currentBranches.filter(b => b !== 'All Branches');
                              if (e.target.checked) {
                                next.push(br);
                              } else {
                                next = next.filter(b => b !== br);
                              }
                              if (next.length === 0) next = ['All Branches'];
                              setFormData({ ...formData, applicableBranches: next });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>{br}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Mandatory Fee Type</span>
                  <span className="text-[11px] text-slate-400">If checked, this fee is mandatory and included by default.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.mandatory === true}
                  onChange={e => setFormData({ ...formData, mandatory: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingHead}
        title="Delete Fee Type"
        message={`Are you sure you want to delete ${deletingHead?.name}?`}
        onConfirm={() => {
          if (deletingHead) {
            deleteFeeHead(deletingHead.id);
            addToast('success', 'Fee Head Removed');
            setDeletingHead(null);
          }
        }}
        onCancel={() => setDeletingHead(null)}
      />
    </div>
  );
};
