import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformCategory } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const UniformCategoryView: React.FC = () => {
  const { uniformCategories, addUniformCategory, updateUniformCategory, deleteUniformCategory } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UniformCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<UniformCategory | null>(null);

  const [form, setForm] = useState<Partial<UniformCategory>>({
    name: '',
    description: ''
  });

  const filtered = uniformCategories.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(query.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: UniformCategory) => {
    setEditingCategory(c);
    setForm(c);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.name) return;

    if (editingCategory) {
      updateUniformCategory(editingCategory.id, form);
      addToast('success', 'Category Updated', `Updated uniform category ${form.name}`);
    } else {
      addUniformCategory(form as Omit<UniformCategory, 'id'>);
      addToast('success', 'Category Added', `Added uniform category ${form.name}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Uniform Categories</h3>
          <p className="text-xs text-slate-500">Configure catalog sections (e.g. Shirts, Blazers, Sports Uniforms)</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name, details..."
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
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">No categories found. Click "Add Category" to create new catalog headings.</td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="py-3 px-4 text-slate-500">{c.description || 'N/A'}</td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                      <button onClick={() => handleOpenEdit(c)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingCategory(c)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Save Uniform Category</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Category Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingCategory}
        title="Remove Category"
        message={`Are you sure you want to delete ${deletingCategory?.name}? This will invalidate linked sizes.`}
        onConfirm={() => {
          if (deletingCategory) {
            deleteUniformCategory(deletingCategory.id);
            addToast('success', 'Category Removed');
            setDeletingCategory(null);
          }
        }}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
};
export default UniformCategoryView;
