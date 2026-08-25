import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Ruler, X, Filter } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformSize } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';

export const UniformSizeView: React.FC<{tabs?: React.ReactNode}> = ({ tabs }) => {
  const { uniformSizes = [], addUniformSize, updateUniformSize, deleteUniformSize } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<UniformSize | null>(null);
  const [deletingSize, setDeletingSize] = useState<UniformSize | null>(null);

  const [form, setForm] = useState<Partial<UniformSize>>({
    sizeName: '',
    chest: '',
    waist: '',
    shoulder: '',
    ageGroup: '',
    gender: '' as any
  });

  const filtered = (uniformSizes || []).filter(s => {
    if (!s) return false;
    const name = (s.sizeName || (s as any).sizeCodeName || '').toLowerCase();
    const age = (s.ageGroup || (s as any).ageBracket || '').toLowerCase();
    const q = (query || '').toLowerCase();
    const matchQuery = !q || name.includes(q) || age.includes(q);
    const matchGender = !filterGender || filterGender === 'All' || s.gender === filterGender;
    return matchQuery && matchGender;
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingSize(null);
    setForm({ sizeName: '', chest: '', waist: '', shoulder: '', ageGroup: '', gender: '' as any });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: UniformSize) => {
    setEditingSize(s);
    setForm({
      ...s,
      sizeName: s.sizeName || (s as any).sizeCodeName || '',
      chest: s.chest || '',
      waist: s.waist || '',
      shoulder: s.shoulder || '',
      ageGroup: s.ageGroup || '',
      gender: s.gender || 'Unisex'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const sName = form.sizeName?.trim() || (form as any).sizeCodeName?.trim();
    if (!sName) return;

    const payload = { ...form, sizeName: sName, sizeCodeName: sName, gender: form.gender || 'Unisex' };
    if (editingSize) {
      updateUniformSize(editingSize.id, payload);
      addToast('success', 'Size Specs Updated', `Updated size ${sName}`);
    } else {
      addUniformSize(payload as Omit<UniformSize, 'id'>);
      addToast('success', 'Size Specs Added', `Added size ${sName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Ruler className="w-6 h-6 text-sky-600" /> Size Configurations
          </h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Size
        </button>
      </div>

      {tabs}

      <div className="glass-card p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sizes by name, age groups..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Filters:</span>
          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">All Genders</option>
            <option value="Unisex">Unisex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
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
                <th className="py-3 px-4">Shoulder Spec</th>
                <th className="py-3 px-4">Age Bracket</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-6 h-6 text-sky-500/50" />
                      <span>No size specifications found. Click "Add Size" to create a new size configuration.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.sizeName}</td>
                    <td className="py-3 px-4 font-mono">{s.chest || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono">{s.waist || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono">{s.shoulder || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">{s.ageGroup || 'N/A'}</td>
                    <td className="py-3 px-4">{s.gender}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleOpenEdit(s)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeletingSize(s)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        itemsPerPageOptions={[10, 25, 50, 100]}
        label="sizes"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Save Size</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Size Code Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    <option value="">Select Gender *</option>
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
                    placeholder='e.g. 38"'
                    value={form.chest || ''}
                    onChange={e => setForm({ ...form, chest: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Waist Specs</label>
                  <input
                    type="text"
                    placeholder='e.g. 32"'
                    value={form.waist || ''}
                    onChange={e => setForm({ ...form, waist: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shoulder Spec</label>
                  <input
                    type="text"
                    placeholder='e.g. 16"'
                    value={form.shoulder || ''}
                    onChange={e => setForm({ ...form, shoulder: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Age Bracket</label>
                  <input
                    type="text"
                    placeholder="e.g. 13-15 yrs"
                    value={form.ageGroup || ''}
                    onChange={e => setForm({ ...form, ageGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all">Save</button>
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
