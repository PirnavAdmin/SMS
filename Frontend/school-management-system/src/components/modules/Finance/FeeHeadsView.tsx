import React, { useState } from 'react';
import { Tag, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';
import { FeeHead, FeeHeadCategory, FeeHeadFrequency } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

const CATEGORIES: FeeHeadCategory[] = [
  'Tuition', 'Admission', 'Books', 'Uniform', 'Lab', 'Computer',
  'Library', 'Sports', 'Activity', 'Exam', 'Transport', 'Hostel', 'Miscellaneous'
];

const FREQUENCIES: FeeHeadFrequency[] = [
  'One Time', 'Monthly', 'Quarterly', 'Half Yearly', 'Annual', 'Custom'
];

const ALL_CLASSES = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];

export const FeeHeadsView: React.FC = () => {
  const { feeHeads, addFeeHead, updateFeeHead, deleteFeeHead, toggleFeeHeadStatus } = useData();
  const { addToast } = useToast();

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
    applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    applicableBranches: ['Main Campus'],
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
  }).sort((a, b) => a.displayOrder - b.displayOrder);

  const handleOpenAdd = () => {
    setEditingHead(null);
    setFormData({
      name: '',
      code: 'FH-' + Math.floor(100 + Math.random() * 900),
      category: 'Tuition',
      frequency: 'Quarterly',
      mandatory: true,
      applicableClasses: ALL_CLASSES,
      applicableBranches: ['Main Campus'],
      taxPercentage: 0,
      displayOrder: feeHeads.length + 1,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: FeeHead) => {
    setEditingHead(h);
    setFormData(h);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('warning', 'Validation Error', 'Fee head name and code are required.');
      return;
    }

    if (editingHead) {
      updateFeeHead(editingHead.id, formData);
      addToast('success', 'Fee Head Updated', `Updated ${formData.name}`);
    } else {
      addFeeHead(formData as Omit<FeeHead, 'id'>);
      addToast('success', 'Fee Head Created', `Created ${formData.name}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-sky-500" /> Fee Heads Master
          </h2>
          <p className="text-xs text-slate-500">Configure master fee types, frequency rules, mandatory tags & display order</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Fee Head
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
                <th className="py-3.5 px-4">Fee Head Name</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Frequency</th>
                <th className="py-3.5 px-4">Mandatory</th>
                <th className="py-3.5 px-4">Classes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredHeads.map(h => (
                <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-400 font-mono">{h.displayOrder}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{h.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{h.code}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold">
                      {h.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{h.frequency}</td>
                  <td className="py-3 px-4">
                    {h.mandatory ? (
                      <span className="text-rose-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Mandatory</span>
                    ) : (
                      <span className="text-slate-400 font-medium">Optional</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{h.applicableClasses.join(', ')}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingHead ? 'Edit Fee Head' : 'Add Fee Head Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fee Head Name *</label>
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
                  <label className="block font-semibold mb-1">Fee Code *</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={e => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tax (%)</label>
                  <input
                    type="number"
                    value={formData.taxPercentage || 0}
                    onChange={e => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Mandatory Fee Head</span>
                <input
                  type="checkbox"
                  checked={formData.mandatory}
                  onChange={e => setFormData({ ...formData, mandatory: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">Save Fee Head</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingHead}
        title="Delete Fee Head"
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
