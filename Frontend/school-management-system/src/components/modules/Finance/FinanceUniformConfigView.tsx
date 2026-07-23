import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Shirt, Plus, Search, Edit, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { FinanceUniformConfig } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';

export const FinanceUniformConfigView: React.FC = () => {
  const {
    financeUniformConfigs,
    addFinanceUniformConfig,
    updateFinanceUniformConfig,
    deleteFinanceUniformConfig,
    financeSettings,
    academicClasses
  } = useData();

  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FinanceUniformConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<FinanceUniformConfig | null>(null);

  const [form, setForm] = useState<Partial<FinanceUniformConfig>>({
    academicYear: financeSettings.academicYear || '2025-2026',
    branch: 'Main Campus',
    className: 'Class 10',
    gender: 'Unisex',
    uniformPackage: 'Full Kit',
    feePlan: 'Annual',
    feeAmount: 3500,
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const filteredConfigs = financeUniformConfigs.filter(c => {
    const matchQuery = c.uniformPackage.toLowerCase().includes(query.toLowerCase()) ||
                       c.branch.toLowerCase().includes(query.toLowerCase());
    const matchClass = filterClass === 'All' || c.className === filterClass;
    return matchQuery && matchClass;
  });

  const handleOpenAdd = () => {
    setEditingConfig(null);
    setForm({
      academicYear: financeSettings.academicYear || '2025-2026',
      branch: 'Main Campus',
      className: academicClasses[0]?.name || 'Class 10',
      gender: 'Unisex',
      uniformPackage: 'Full Kit',
      feePlan: 'Annual',
      feeAmount: 3500,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: FinanceUniformConfig) => {
    setEditingConfig(c);
    setForm(c);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.className || !form.uniformPackage || !form.feeAmount) {
      addToast('warning', 'Missing Fields', 'Please complete all required fields.');
      return;
    }

    // Business Rules: Enforce only one active configuration for Class, Gender, Package, Branch, and Academic Year
    const duplicate = financeUniformConfigs.find(
      c => c.id !== (editingConfig?.id || '') &&
           c.status === 'Active' &&
           c.academicYear === form.academicYear &&
           c.branch === form.branch &&
           c.className === form.className &&
           c.gender === form.gender &&
           c.uniformPackage === form.uniformPackage
    );

    if (duplicate && form.status === 'Active') {
      addToast('error', 'Configuration Conflict', `An active Uniform Fee configuration already exists for Class ${form.className} (${form.gender}) - ${form.uniformPackage} in ${form.academicYear}`);
      return;
    }

    const payload = form as Omit<FinanceUniformConfig, 'id'>;

    if (editingConfig) {
      updateFinanceUniformConfig(editingConfig.id, payload);
      addToast('success', 'Configuration Updated', 'Uniform Fee settings successfully updated.');
    } else {
      addFinanceUniformConfig(payload);
      addToast('success', 'Configuration Created', 'Uniform Fee settings successfully created.');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Uniform Fee Configuration</h3>
          <p className="text-xs text-slate-500">Configure annual packaging fees for uniforms based on Class, Branch, and Gender segregation</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Uniform Config
        </button>
      </div>

      {/* Filter and Search */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search uniform config by package or branch..."
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
          <option value="All">All Classes ({academicClasses.length})</option>
          {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredConfigs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-slate-300" />
            <p className="text-xs">No active configurations found. Click "Add Uniform Config" to create new parameters.</p>
          </div>
        ) : (
          filteredConfigs.map(c => (
            <div key={c.id} className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant={c.status === 'Active' ? 'success' : 'neutral'}>{c.status}</Badge>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">{c.uniformPackage}</h4>
                  <p className="text-xs text-slate-400">{c.className} • {c.gender}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleOpenEdit(c)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingConfig(c)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-slate-800 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Fee Amount</span>
                  <span className="font-extrabold text-emerald-600">{formatCurrency(c.feeAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Billing Plan</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{c.feePlan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Branch Office</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{c.branch}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Year</span>
                  <span className="font-mono">{c.academicYear}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-purple-500" /> Save Uniform Configuration
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={form.academicYear}
                    onChange={e => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Branch Office *</label>
                  <input
                    type="text"
                    required
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class / Grade *</label>
                  <select
                    value={form.className}
                    onChange={e => setForm({ ...form, className: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender Segregation *</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Uniform Package *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Kit, Sports Kit"
                    value={form.uniformPackage}
                    onChange={e => setForm({ ...form, uniformPackage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Fee Plan *</label>
                  <select
                    value={form.feePlan}
                    onChange={e => setForm({ ...form, feePlan: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Package Fee Amount *</label>
                  <input
                    type="number"
                    required
                    value={form.feeAmount || ''}
                    onChange={e => setForm({ ...form, feeAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status *</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Effective From</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="date"
                      value={form.effectiveFrom}
                      onChange={e => setForm({ ...form, effectiveFrom: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Effective To</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="date"
                      value={form.effectiveTo || ''}
                      onChange={e => setForm({ ...form, effectiveTo: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-extrabold bg-purple-600 text-white rounded-xl">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingConfig}
        title="Remove Configuration"
        message="Are you sure you want to remove this Uniform Fee config? Enrolled students will default to baseline estimates."
        onConfirm={() => {
          if (deletingConfig) {
            deleteFinanceUniformConfig(deletingConfig.id);
            addToast('success', 'Configuration Removed');
            setDeletingConfig(null);
          }
        }}
        onCancel={() => setDeletingConfig(null)}
      />
    </div>
  );
};
export default FinanceUniformConfigView;
