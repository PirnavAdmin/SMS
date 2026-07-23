import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformSize } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const UniformSizeView: React.FC = () => {
  const { uniformSizes, addUniformSize, updateUniformSize, deleteUniformSize } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<UniformSize | null>(null);
  const [deletingSize, setDeletingSize] = useState<UniformSize | null>(null);

  const [form, setForm] = useState<Partial<UniformSize>>({
    sizeName: '',
    chest: '',
    waist: '',
    height: '',
    ageGroup: '',
    gender: 'Unisex'
  });

  const filtered = uniformSizes.filter(s =>
    s.sizeName.toLowerCase().includes(query.toLowerCase()) ||
    (s.ageGroup && s.ageGroup.toLowerCase().includes(query.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingSize(null);
    setForm({ sizeName: '', chest: '', waist: '', height: '', ageGroup: '', gender: 'Unisex' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: UniformSize) => {
    setEditingSize(s);
    setForm(s);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.sizeName) return;

    if (editingSize) {
      updateUniformSize(editingSize.id, form);
      addToast('success', 'Size Specs Updated', `Updated size ${form.sizeName}`);
    } else {
      addUniformSize(form as Omit<UniformSize, 'id'>);
      addToast('success', 'Size Specs Added', `Added size ${form.sizeName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Uniform Sizes</h3>
          <p className="text-xs text-slate-500">Configure size specifications, fits, chest/waist measurements, and age target brackets</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Size Spec
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search sizes by name, age groups..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Size Name</th>
                <th className="py-3 px-4">Chest Spec</th>
                <th className="py-3 px-4">Waist Spec</th>
                <th className="py-3 px-4">Height Target</th>
                <th className="py-3 px-4">Age Bracket</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No size specifications configured.</td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.sizeName}</td>
                    <td className="py-3 px-4 font-mono">{s.chest || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono">{s.waist || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono">{s.height || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">{s.ageGroup || 'N/A'}</td>
                    <td className="py-3 px-4">{s.gender}</td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                      <button onClick={() => handleOpenEdit(s)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingSize(s)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Save Size Specification</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Size Code Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S, M, L, XL, 32"
                    value={form.sizeName}
                    onChange={e => setForm({ ...form, sizeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender Target *</label>
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
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Chest Width</label>
                  <input
                    type="text"
                    placeholder="e.g. 38 inches"
                    value={form.chest || ''}
                    onChange={e => setForm({ ...form, chest: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Waist Specs</label>
                  <input
                    type="text"
                    placeholder="e.g. 32 inches"
                    value={form.waist || ''}
                    onChange={e => setForm({ ...form, waist: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Height Bounds</label>
                  <input
                    type="text"
                    placeholder="e.g. 170-175 cm"
                    value={form.height || ''}
                    onChange={e => setForm({ ...form, height: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Age Group</label>
                  <input
                    type="text"
                    placeholder="e.g. 13-15 years"
                    value={form.ageGroup || ''}
                    onChange={e => setForm({ ...form, ageGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all">Save Specs</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingSize}
        title="Remove Size Specifications"
        message={`Are you sure you want to delete size ${deletingSize?.sizeName}?`}
        onConfirm={() => {
          if (deletingSize) {
            deleteUniformSize(deletingSize.id);
            addToast('success', 'Size removed');
            setDeletingSize(null);
          }
        }}
        onCancel={() => setDeletingSize(null)}
      />
    </div>
  );
};
export default UniformSizeView;
