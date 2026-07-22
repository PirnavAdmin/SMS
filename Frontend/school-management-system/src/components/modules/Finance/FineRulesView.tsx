import React, { useState } from 'react';
import { AlertTriangle, Plus, Edit, Trash2, CheckCircle2, Calendar } from 'lucide-react';
import { FineRule } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';

export const FineRulesView: React.FC = () => {
  const { fineRules, addFineRule, updateFineRule, deleteFineRule } = useData();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FineRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<FineRule | null>(null);

  const [formData, setFormData] = useState<Partial<FineRule>>({
    ruleName: '',
    dueDate: '2026-08-15',
    graceDays: 5,
    fineType: 'Daily Fine',
    dailyFine: 50,
    fixedFine: 200,
    maximumFine: 1500,
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      ruleName: '',
      dueDate: new Date().toISOString().split('T')[0],
      graceDays: 5,
      fineType: 'Daily Fine',
      dailyFine: 50,
      fixedFine: 200,
      maximumFine: 1500,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: FineRule) => {
    setEditingRule(r);
    setFormData(r);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ruleName) return;

    if (editingRule) {
      updateFineRule(editingRule.id, formData);
      addToast('success', 'Fine Rule Updated', `Updated ${formData.ruleName}`);
    } else {
      addFineRule(formData as Omit<FineRule, 'id'>);
      addToast('success', 'Fine Rule Configured', `Configured ${formData.ruleName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-500" /> Late Fee & Fine Configuration
          </h2>
          <p className="text-xs text-slate-500">Configure due dates, grace days, daily vs fixed fines, and maximum fine caps</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Late Fine Rule
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fineRules.map(r => (
          <div key={r.id} className="glass-card p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  r.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {r.status} Rule
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{r.ruleName}</h3>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenEdit(r)} className="p-1.5 rounded hover:bg-slate-100 text-sky-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeletingRule(r)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between"><span>Due Date:</span><span className="font-bold text-slate-900 dark:text-white">{r.dueDate}</span></div>
              <div className="flex justify-between"><span>Grace Days:</span><span className="font-semibold text-sky-600">{r.graceDays} Days</span></div>
              <div className="flex justify-between"><span>Fine Type:</span><span className="font-semibold">{r.fineType}</span></div>
              {r.fineType === 'Daily Fine' ? (
                <div className="flex justify-between"><span>Daily Rate:</span><span className="font-bold text-rose-500">INR {r.dailyFine}/day</span></div>
              ) : (
                <div className="flex justify-between"><span>Fixed Rate:</span><span className="font-bold text-rose-500">INR {r.fixedFine}</span></div>
              )}
              <div className="flex justify-between"><span>Maximum Fine Cap:</span><span className="font-bold text-slate-900 dark:text-white">INR {r.maximumFine}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRule ? 'Edit Fine Rule' : 'Add Late Fee Rule'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Rule Name *</label>
                <input type="text" required value={formData.ruleName} onChange={e => setFormData({ ...formData, ruleName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Standard Due Date *</label>
                  <input type="date" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Grace Days</label>
                  <input type="number" value={formData.graceDays} onChange={e => setFormData({ ...formData, graceDays: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fine Mode</label>
                  <select value={formData.fineType} onChange={e => setFormData({ ...formData, fineType: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Daily Fine">Daily Rate</option>
                    <option value="Fixed Fine">Fixed Fine</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Fine Limit (INR)</label>
                  <input type="number" value={formData.maximumFine} onChange={e => setFormData({ ...formData, maximumFine: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-rose-500" />
                </div>
              </div>

              {formData.fineType === 'Daily Fine' ? (
                <div><label className="block font-semibold mb-1">Daily Fine Amount (INR/day)</label><input type="number" value={formData.dailyFine} onChange={e => setFormData({ ...formData, dailyFine: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-rose-500" /></div>
              ) : (
                <div><label className="block font-semibold mb-1">Fixed Fine Amount (INR)</label><input type="number" value={formData.fixedFine} onChange={e => setFormData({ ...formData, fixedFine: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-rose-500" /></div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">Save Fine Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingRule}
        title="Delete Fine Rule"
        message={`Are you sure you want to delete ${deletingRule?.ruleName}?`}
        onConfirm={() => {
          if (deletingRule) {
            deleteFineRule(deletingRule.id);
            addToast('success', 'Fine Rule Removed');
            setDeletingRule(null);
          }
        }}
        onCancel={() => setDeletingRule(null)}
      />
    </div>
  );
};
