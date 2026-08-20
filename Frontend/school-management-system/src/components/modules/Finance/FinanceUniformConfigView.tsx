import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Shirt, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { FinanceUniformConfig } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { getUniformPackageFeeByClass } from '../../../utils/uniformUtils';

export const FinanceUniformConfigView: React.FC = () => {
  const {
    financeUniformConfigs,
    addFinanceUniformConfig,
    updateFinanceUniformConfig,
    deleteFinanceUniformConfig,
    financeSettings,
    academicClasses,
    uniformCategories,
    selectedBranch,
    selectedAcademicYear
  } = useData();

  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FinanceUniformConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<FinanceUniformConfig | null>(null);

  const [form, setForm] = useState<Partial<FinanceUniformConfig>>({
    academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
    branch: selectedBranch || 'Main Campus',
    className: 'Class 10',
    gender: 'Unisex',
    uniformPackage: 'Boys Uniform Package (Admission Kit)',
    feePlan: 'Annual',
    feeAmount: 3500,
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const filteredConfigs = financeUniformConfigs.filter(c => {
    if (!c) return false;
    const qLower = query.toLowerCase().trim();
    const matchQuery = !qLower ||
                       (c.uniformPackage || '').toLowerCase().includes(qLower) ||
                       (c.className || '').toLowerCase().includes(qLower) ||
                       (c.branch || '').toLowerCase().includes(qLower);

    const matchClass = filterClass === 'All' || (() => {
      const fLower = filterClass.toLowerCase().trim();
      const cLower = (c.className || '').toLowerCase().trim();
      if (fLower === cLower) return true;
      if (fLower.includes(cLower) || cLower.includes(fLower)) return true;

      const cleanF = fLower.replace(/[^a-z0-9]/g, '');
      const cleanC = cLower.replace(/[^a-z0-9]/g, '');
      if (cleanF && cleanC && (cleanF === cleanC || cleanF.includes(cleanC) || cleanC.includes(cleanF))) return true;

      const fDigits = fLower.replace(/\D/g, '');
      const cDigits = cLower.replace(/\D/g, '');
      if (fDigits && cDigits && fDigits === cDigits) return true;

      return false;
    })();

    return matchQuery && matchClass;
  });

  const handleOpenAdd = () => {
    setEditingConfig(null);
    setForm({
      academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
      branch: selectedBranch || 'Main Campus',
      className: '',
      gender: '',
      uniformPackage: '',
      feePlan: 'Annual',
      feeAmount: undefined,
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

    const payload = form as Omit<FinanceUniformConfig, 'id'>;

    if (editingConfig) {
      updateFinanceUniformConfig(editingConfig.id, payload);
      addToast('success', 'Configuration Updated', 'Uniform Fee settings successfully updated.');
    } else {
      addFinanceUniformConfig(payload);
      addToast('success', 'Configuration Created', 'Uniform Fee settings successfully created.');
    }
    setQuery('');
    setFilterClass('All');
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingConfig) {
      deleteFinanceUniformConfig(deletingConfig.id);
      addToast('success', 'Configuration Deleted', 'Uniform fee configuration removed.');
      setDeletingConfig(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Uniform Fee Configuration</h3>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Uniform Fee
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

      {/* Table List */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Class / Grade</th>
                <th className="py-3 px-4">Uniform Package / Item</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4 text-right">Fee Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active uniform fee configurations found{filterClass !== 'All' ? ` for ${filterClass}` : ''}. Click "+ Add Uniform Fee" to create new parameters.
                  </td>
                </tr>
              ) : (
                filteredConfigs.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-sky-500 shrink-0" /> {c.className}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{c.uniformPackage}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{c.gender}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]">
                        {c.academicYear || '2026-2027'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(c.feeAmount || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.status === 'Active' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px] inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button onClick={() => handleOpenEdit(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingConfig(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-sky-500" /> Save Uniform Configuration
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class / Grade *</label>
                  <select
                    required
                    value={form.className || ''}
                    onChange={e => {
                      const newCls = e.target.value;
                      const newFee = newCls && newCls !== 'All Classes' ? getUniformPackageFeeByClass(newCls) : 0;
                      setForm({ ...form, className: newCls, feeAmount: newFee || form.feeAmount });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="">-- Select Class --</option>
                    <option value="All Classes">All Classes</option>
                    {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender Segregation *</label>
                  <select
                    required
                    value={form.gender || ''}
                    onChange={e => setForm({ ...form, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Unisex">Unisex / All Genders</option>
                    <option value="Male">Male (Boys)</option>
                    <option value="Female">Female (Girls)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Uniform Package / Item *</label>
                {(() => {
                  const basePackages = [
                    'Boys Uniform Package (Admission Kit)',
                    'Girls Uniform Package (Admission Kit)',
                    'Unstitched Uniform Cloth Package'
                  ];

                  const allCatNames = (uniformCategories || [])
                    .map(c => typeof c === 'string' ? c : (c.name || (c as any).categoryName || ''))
                    .filter(Boolean);

                  const uniqueCats = Array.from(new Set(allCatNames));

                  // Configured Categories & Additional Items (excluding base packages)
                  const additionalItems = uniqueCats.filter(name => 
                    !name.toLowerCase().includes('package') && 
                    !name.toLowerCase().includes('kit')
                  );

                  return (
                    <select
                      required
                      value={form.uniformPackage || ''}
                      onChange={e => {
                        const val = e.target.value;
                        let genderVal: 'Male' | 'Female' | 'Unisex' = form.gender || 'Unisex';
                        if (val.toLowerCase().includes('boys')) genderVal = 'Male';
                        if (val.toLowerCase().includes('girls')) genderVal = 'Female';
                        setForm({ ...form, uniformPackage: val, gender: genderVal });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold outline-none cursor-pointer"
                    >
                      <option value="">-- Select Package / Item --</option>
                      <optgroup label="Standard Admission Base Packages">
                        {basePackages.map(pkg => (
                          <option key={pkg} value={pkg}>{pkg}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Configured Categories & Additional Items (from Uniform Management)">
                        {additionalItems.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                    </select>
                  );
                })()}
              </div>

              {/* Fabric Measurement Specification Dropdown (if Cloth/Fabric item selected) */}
              {(form.uniformPackage?.toLowerCase().includes('cloth') || form.uniformPackage?.toLowerCase().includes('fabric') || form.uniformPackage?.toLowerCase().includes('unstitched')) && (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-1.5 animate-in fade-in">
                  <label className="block text-[11px] font-extrabold text-amber-900 dark:text-amber-300">Fabric Measurement Specification *</label>
                  <select
                    value={(form as any).fabricMeterage || '3.0 Meters'}
                    onChange={e => setForm({ ...form, fabricMeterage: e.target.value } as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="2.5 Meters">2.5 Meters (Shirt/Trouser Cut Length)</option>
                    <option value="3.0 Meters">3.0 Meters (Suit/Pants Cut Length)</option>
                    <option value="4.0 Meters">4.0 Meters (Full Uniform Fabric Set)</option>
                    <option value="5.0 Meters">5.0 Meters (Suit & Blazer Set Fabric)</option>
                    <option value="Unstitched Roll">Unstitched Roll / Standard Roll Cut</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Package Fee Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 3500"
                  value={form.feeAmount || ''}
                  onChange={e => setForm({ ...form, feeAmount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-sky-600 dark:text-sky-400 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-extrabold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md shadow-sky-500/20">Save Settings</button>
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
