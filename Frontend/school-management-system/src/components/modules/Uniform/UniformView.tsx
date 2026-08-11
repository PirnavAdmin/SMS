import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Shirt, Plus, Search, Filter, Edit, Trash2, X } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformItem } from '../../../types';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';

export const UniformView: React.FC<{tabs?: React.ReactNode}> = ({ tabs }) => {
  const { uniforms, addUniform, updateUniform, deleteUniform, uniformSizes, uniformCategories } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUniform, setEditingUniform] = useState<UniformItem | null>(null);
  const [deletingUniform, setDeletingUniform] = useState<UniformItem | null>(null);

  const [formData, setFormData] = useState<Partial<UniformItem>>({
    gender: '' as any,
    size: '',
    className: '',
    price: undefined,
    availableStock: undefined
  });

  const filtered = uniforms.filter(u => {
    const mQuery = query.toLowerCase();
    const mCat = u.category.toLowerCase();
    const mCol = u.color.toLowerCase();
    const matchesQuery = mCat.includes(mQuery) || mCol.includes(mQuery);
    const matchesGender = filterGender === 'All' || u.gender === filterGender;
    return matchesQuery && matchesGender;
  });

  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [customMeasurement, setCustomMeasurement] = useState({
    chest: '',
    waist: '',
    length: '',
    shoulder: ''
  });

  const handleOpenAdd = () => {
    setEditingUniform(null);
    setFormData({ gender: '' as any, size: '', className: '', price: undefined, availableStock: undefined });
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (u: UniformItem) => {
    setEditingUniform(u);
    setFormData(u);
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.category) return;

    let finalSize = formData.size || 'M';
    if (formData.size === 'Others' || formData.size === 'Other') {
      const parts = [];
      if (customMeasurement.chest) parts.push(`Chest: ${customMeasurement.chest}"`);
      if (customMeasurement.waist) parts.push(`Waist: ${customMeasurement.waist}"`);
      if (customMeasurement.length) parts.push(`Length: ${customMeasurement.length}"`);
      if (customMeasurement.shoulder) parts.push(`Shoulder: ${customMeasurement.shoulder}"`);
      
      finalSize = parts.length > 0 ? `Custom Tailored (${parts.join(', ')})` : 'Custom Tailored';
    }

    const payload = {
      ...formData,
      size: finalSize,
      gender: formData.gender || 'Unisex',
      className: formData.className || 'All Wings',
      price: formData.price ? Number(formData.price) : 0,
      availableStock: formData.availableStock ? Number(formData.availableStock) : 0
    };

    if (editingUniform) {
      updateUniform(editingUniform.id, payload);
      addToast('success', 'Uniform Item Updated', `Updated ${formData.category}`);
    } else {
      addUniform(payload as Omit<UniformItem, 'id'>);
      addToast('success', 'Uniform Item Added', `Added ${formData.category}`);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shirt className="w-6 h-6 text-sky-600" /> Uniform Configuration
          </h2>
          </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Uniform
        </button>
      </div>

      {tabs}

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
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-semibold cursor-pointer"
          >
            <option value="All">Select Gender</option>
            <option value="All">Select All</option>
            <option value="Unisex">Unisex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* Uniform Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 font-bold glass-card rounded-3xl border border-slate-200 dark:border-slate-800">
            No uniform configuration items found matching the selected filter.
          </div>
        ) : (
          paginatedItems.map(u => (
            <div key={u.id} className="glass-card p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950">{u.gender} • Size {u.size}</span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{u.category}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(u)} className="p-1 rounded hover:bg-slate-100 text-brand-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingUniform(u)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">School Wing:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{u.className || 'All Wings'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Color Spec:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{u.color}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Unit Price:</span><span className="font-extrabold text-emerald-600">{formatCurrency(u.price)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Stock Available:</span><span className="font-bold text-slate-900 dark:text-white">{u.availableStock} Units</span></div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg max-h-[85vh] flex flex-col w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUniform ? 'Edit Uniform Item' : 'Add Uniform Configuration'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block font-semibold mb-1">Uniform Category / Item Name *</label>
                <select
                  required
                  value={formData.category || ''}
                  onChange={e => {
                    const val = e.target.value;
                    const itemPriceMap: Record<string, number> = {
                      'Boys Uniform Package (Admission Kit)': 3000,
                      'Girls Uniform Package (Admission Kit)': 3000,
                      'Extra Shirt': 350,
                      'Extra Pair of Trousers': 500,
                      'Extra Skirt': 500,
                      'Formal Blazer (Winter)': 1500,
                      'Blazer': 1500,
                      'V-Neck Sweater (Winter)': 800,
                      'Tie & Crest': 150,
                      'Belt': 150,
                      'Black Shoes (Pair)': 600,
                      'Socks (Pair)': 150,
                      'Sports Tracksuit Kit': 500
                    };
                    const itemGenderMap: Record<string, 'Male' | 'Female' | 'Unisex'> = {
                      'Boys Uniform Package (Admission Kit)': 'Male',
                      'Girls Uniform Package (Admission Kit)': 'Female',
                      'Extra Pair of Trousers': 'Male',
                      'Extra Skirt': 'Female',
                      'Extra Shirt': 'Unisex',
                      'Formal Blazer (Winter)': 'Unisex',
                      'Blazer': 'Unisex',
                      'V-Neck Sweater (Winter)': 'Unisex',
                      'Tie & Crest': 'Unisex',
                      'Belt': 'Unisex',
                      'Black Shoes (Pair)': 'Unisex',
                      'Socks (Pair)': 'Unisex',
                      'Sports Tracksuit Kit': 'Unisex'
                    };

                    const defaultPrice = itemPriceMap[val] !== undefined ? itemPriceMap[val] : (editingUniform ? formData.price : 350);
                    const defaultGender = itemGenderMap[val] || formData.gender || 'Unisex';

                    setFormData({ 
                      ...formData, 
                      category: val,
                      price: defaultPrice,
                      gender: defaultGender
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-semibold"
                >
                  <option value="">Select Uniform Category / Item Name *</option>
                  <optgroup label="📦 Standard Admission Packages (₹3,000 Fee Covered)">
                    <option value="Boys Uniform Package (Admission Kit)">Boys Uniform Package (Admission Kit)</option>
                    <option value="Girls Uniform Package (Admission Kit)">Girls Uniform Package (Admission Kit)</option>
                  </optgroup>
                  <optgroup label="👔 Individual Items & Extra Accessories">
                    <option value="Extra Shirt">Extra Shirt</option>
                    <option value="Extra Pair of Trousers">Extra Pair of Trousers</option>
                    <option value="Extra Skirt">Extra Skirt</option>
                    <option value="Formal Blazer (Winter)">Formal Blazer (Winter)</option>
                    <option value="V-Neck Sweater (Winter)">V-Neck Sweater (Winter)</option>
                    <option value="Tie & Crest">Tie & Crest</option>
                    <option value="Belt">Belt</option>
                    <option value="Black Shoes (Pair)">Black Shoes (Pair)</option>
                    <option value="Socks (Pair)">Socks (Pair)</option>
                    <option value="Sports Tracksuit Kit">Sports Tracksuit Kit</option>
                  </optgroup>
                </select>

                {(() => {
                  if (!formData.category) return null;
                  const lower = formData.category.toLowerCase();
                  const matchedCat = (uniformCategories || []).find(c => {
                    const cLower = c.name.toLowerCase();
                    if (lower === cLower || lower.includes(cLower) || cLower.includes(lower)) return true;
                    if (lower.includes('boys') && cLower.includes('boys')) return true;
                    if (lower.includes('girls') && cLower.includes('girls')) return true;
                    if (lower.includes('shirt') && cLower.includes('shirt')) return true;
                    if (lower.includes('trousers') && (cLower.includes('pant') || cLower.includes('trouser'))) return true;
                    if (lower.includes('skirt') && cLower.includes('skirt')) return true;
                    if (lower.includes('blazer') && cLower.includes('blazer')) return true;
                    if (lower.includes('sweater') && cLower.includes('sweater')) return true;
                    if (lower.includes('sports') && (cLower.includes('sports') || cLower.includes('tracksuit'))) return true;
                    return false;
                  });
                  if (!matchedCat || !matchedCat.description) return null;
                  return (
                    <div className="mt-2.5 p-3.5 rounded-2xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-black text-sky-900 dark:text-sky-200">
                        <span>📦 Configured Package Specification (Category Master Data)</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        {matchedCat.description}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="">Select Gender *</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">School Wing / Level</label>
                  <select value={formData.className || ''} onChange={e => setFormData({ ...formData, className: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-semibold">
                    <option value="">Select School Wing / Level *</option>
                    <option value="All Wings">All Wings (Universal)</option>
                    <option value="Pre-Primary">Pre-Primary (Playgroup - UKG)</option>
                    <option value="Primary Wing">Primary Wing (Class I - V)</option>
                    <option value="Middle Wing">Middle Wing (Class VI - VIII)</option>
                    <option value="Senior Wing">Senior Wing (Class IX - XII)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Size Specification *</label>
                  <select
                    value={formData.size || ''}
                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-semibold"
                  >
                    <option value="">Select Size *</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="28">28</option>
                    <option value="30">30</option>
                    <option value="32">32</option>
                    <option value="34">34</option>
                    <option value="36">36</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Color</label>
                  <input type="text" placeholder="Navy Blue" value={formData.color || ''} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              {/* Custom Tailored Body Measurements Form */}
              {(formData.size === 'Others' || formData.size === 'Other') && (
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={formData.price ?? ''}
                    onChange={e => setFormData({ ...formData, price: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Available Stock</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.availableStock ?? ''}
                    onChange={e => setFormData({ ...formData, availableStock: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">
                  Save
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
