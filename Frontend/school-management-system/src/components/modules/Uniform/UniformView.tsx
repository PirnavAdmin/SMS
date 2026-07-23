import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Shirt, Plus, Search, Filter, Edit, Trash2, X } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformItem } from '../../../types';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';

export const UniformView: React.FC = () => {
  const { uniforms, addUniform, updateUniform, deleteUniform } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterGender, setFilterGender] = useState('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUniform, setEditingUniform] = useState<UniformItem | null>(null);
  const [deletingUniform, setDeletingUniform] = useState<UniformItem | null>(null);

  const [formData, setFormData] = useState<Partial<UniformItem>>({
    category: 'Summer Polo Shirt',
    gender: 'Unisex',
    className: 'Class 10',
    size: 'M',
    color: 'Navy Blue',
    price: 35,
    availableStock: 50
  });

  const filtered = uniforms.filter(u => {
    const matchQuery = u.category.toLowerCase().includes(query.toLowerCase()) || u.color.toLowerCase().includes(query.toLowerCase());
    const matchCat = filterCategory === 'All' || u.category === filterCategory;
    const matchGen = filterGender === 'All' || u.gender === filterGender;
    return matchQuery && matchCat && matchGen;
  });

  const handleOpenAdd = () => {
    setEditingUniform(null);
    setFormData({
      category: 'Summer Polo Shirt',
      gender: 'Unisex',
      className: 'Class 10',
      size: 'M',
      color: 'Navy Blue',
      price: 35,
      availableStock: 50
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (u: UniformItem) => {
    setEditingUniform(u);
    setFormData(u);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.category) return;

    if (editingUniform) {
      updateUniform(editingUniform.id, formData);
      addToast('success', 'Uniform Item Updated', `Updated ${formData.category}`);
    } else {
      addUniform(formData as Omit<UniformItem, 'id'>);
      addToast('success', 'Uniform Item Added', `Added ${formData.category}`);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shirt className="w-6 h-6 text-purple-600" /> Uniform Store Configuration
          </h2>
          <p className="text-xs text-slate-500">Configure uniform categories, sizes, colors, pricing & inventory stock</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Uniform Item
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search uniform by category or color..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Filters:</span>
          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="All">All Genders</option>
            <option value="Unisex">Unisex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* Uniform Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div key={u.id} className="glass-card p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950">{u.gender} • Size {u.size}</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{u.category}</h3>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenEdit(u)} className="p-1 rounded hover:bg-slate-100 text-brand-600"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeletingUniform(u)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Target Class:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{u.className}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Color Spec:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{u.color}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Unit Price:</span><span className="font-extrabold text-emerald-600">{formatCurrency(u.price)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Stock Available:</span><span className="font-bold text-slate-900 dark:text-white">{u.availableStock} Units</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUniform ? 'Edit Uniform Item' : 'Add Uniform Configuration'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Uniform Category / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Blazer, Tracksuit"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Unisex">Unisex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Class</label>
                  <select value={formData.className} onChange={e => setFormData({ ...formData, className: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="All Classes">All Classes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Size</label>
                  <input type="text" placeholder="S, M, L, XL" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Color</label>
                  <input type="text" placeholder="Navy Blue" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Unit Price (₹)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Available Stock</label>
                  <input type="number" value={formData.availableStock} onChange={e => setFormData({ ...formData, availableStock: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-purple-600 text-white rounded-xl">
                  {editingUniform ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingUniform}
        title="Delete Uniform Item"
        message={`Are you sure you want to delete ${deletingUniform?.category}?`}
        onConfirm={() => {
          if (deletingUniform) {
            deleteUniform(deletingUniform.id);
            addToast('success', 'Uniform Item Removed');
            setDeletingUniform(null);
          }
        }}
        onCancel={() => setDeletingUniform(null)}
      />
    </div>
  );
};
