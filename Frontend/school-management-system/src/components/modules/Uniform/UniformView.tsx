import React, { useState } from 'react';
import { getCategorySizes, normalizeUniformCategoryName } from '../../../utils/uniformUtils';
import { Shirt, Plus, Search, Filter, Edit, Trash2, X, Package, Layers, CheckSquare, Square } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformItem, PackageComponentItem } from '../../../types';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';

export const UniformView: React.FC<{tabs?: React.ReactNode}> = ({ tabs }) => {
  const { uniforms, addUniform, updateUniform, deleteUniform, uniformSizes, uniformCategories } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUniform, setEditingUniform] = useState<UniformItem | null>(null);
  const [deletingUniform, setDeletingUniform] = useState<UniformItem | null>(null);

  const [packageName, setPackageName] = useState('');
  const [formData, setFormData] = useState<Partial<UniformItem>>({
    gender: 'Unisex' as any,
    size: 'M',
    className: 'All Wings',
    availableStock: 50,
    isPackage: true
  });

  const [categorySelections, setCategorySelections] = useState<{ [catName: string]: { selected: boolean, quantity: string } }>({});
  const [packageSizeStock, setPackageSizeStock] = useState<{ [sz: string]: number }>({
    'XS': 30,
    'S': 50,
    'M': 100,
    'L': 80,
    'XL': 40
  });
  const [fabricStock, setFabricStock] = useState<{ [range: string]: number }>({
    '1.0m - 1.5m': 50,
    '1.5m - 2.0m': 100,
    '2.0m - 2.5m': 75,
    '2.5m - 3.0m': 30
  });

  const filtered = (uniforms || []).filter(u => {
    if (!u) return false;
    const rawCat = u.category || (u as any).name || (u as any).itemName || '';
    const rawCatLower = rawCat.toLowerCase().trim();
    if ((rawCatLower === 'uniform package' || rawCatLower === 'package') && !rawCatLower.includes('boys') && !rawCatLower.includes('girls')) {
      return false;
    }
    const mQuery = (query || '').toLowerCase();
    const normMCat = normalizeUniformCategoryName(rawCat).toLowerCase();
    const mCol = (u.color || '').toLowerCase();

    const matchesQuery = !mQuery || rawCat.toLowerCase().includes(mQuery) || normMCat.includes(mQuery) || mCol.includes(mQuery);
    const matchesGender = !filterGender || filterGender === 'All' || u.gender === filterGender;

    const normFilter = normalizeUniformCategoryName(filterCategory).toLowerCase();
    const matchesCategory = !filterCategory || filterCategory === 'All' || normMCat === normFilter || normMCat.includes(normFilter) || normFilter.includes(normMCat);

    return matchesQuery && matchesGender && matchesCategory;
  });

  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [customMeasurement, setCustomMeasurement] = useState({
    chest: '',
    waist: '',
    length: '',
    shoulder: ''
  });

  const availableCategoryNames = Array.from(new Set(
    (uniformCategories || [])
      .map(c => typeof c === 'string' ? c : (c.name || (c as any).categoryName || (c as any).category || ''))
      .filter(cName => {
        if (!cName) return false;
        const lower = cName.toLowerCase();
        const isBasePkg = (lower.includes('boys') || lower.includes('girls')) && (lower.includes('package') || lower.includes('kit'));
        const isClothPkg = lower.includes('unstitched') || lower.includes('cloth') || lower.includes('fabric');
        return !isBasePkg && !isClothPkg;
      })
  ));

  const handleOpenAdd = () => {
    setEditingUniform(null);
    setPackageName('');
    setFormData({
      gender: 'Unisex',
      size: 'All Sizes',
      className: 'All Wings',
      availableStock: undefined,
      isPackage: false
    });
    setPackageSizeStock({
      'XS': 30,
      'S': 50,
      'M': 100,
      'L': 80,
      'XL': 40
    });
    setFabricStock({
      '1.0m - 1.5m': 50,
      '1.5m - 2.0m': 100,
      '2.0m - 2.5m': 75,
      '2.5m - 3.0m': 30
    });

    const initMap: { [catName: string]: { selected: boolean, quantity: string } } = {};
    availableCategoryNames.forEach((cat) => {
      initMap[cat] = { selected: false, quantity: '1' };
    });
    setCategorySelections(initMap);
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (u: UniformItem) => {
    setEditingUniform(u);
    setPackageName(u.category || u.name || '');
    setFormData(u);
    if ((u as any).sizeStockBreakdown) {
      setPackageSizeStock((u as any).sizeStockBreakdown);
    }
    if ((u as any).meterageStockBreakdown) {
      setFabricStock((u as any).meterageStockBreakdown);
    }

    const isClothItem = (u.category || u.name || '').toLowerCase().includes('cloth') || (u.category || u.name || '').toLowerCase().includes('fabric');
    const initMap: { [catName: string]: { selected: boolean, quantity: string, meterRange?: string, size?: string } } = {};
    availableCategoryNames.forEach(cat => {
      const isClothCat = cat.toLowerCase().includes('cloth') || cat.toLowerCase().includes('fabric');
      const found = (u.packageComponents || []).find(c => c.categoryName.toLowerCase() === cat.toLowerCase());
      const catSizeOptions = getCategorySizes(cat, uniformSizes);
      const defaultCatSize = catSizeOptions.length > 0 ? catSizeOptions[0].value : 'All Sizes';

      if (found || (isClothItem && isClothCat)) {
        const componentSize = (found as any)?.size || u.size || (u as any).meterRange || defaultCatSize;
        initMap[cat] = {
          selected: true,
          quantity: String(found?.quantity || '1'),
          meterRange: componentSize,
          size: componentSize
        };
      } else {
        initMap[cat] = { selected: false, quantity: '1', size: '', meterRange: '' };
      }
    });
    setCategorySelections(initMap);
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsFormOpen(true);
  };

  const handleToggleCategory = (catName: string) => {
    setCategorySelections(prev => {
      const current = prev[catName] || { selected: false, quantity: '1', size: '', meterRange: '' };
      const newSelected = !current.selected;
      const catSizeOptions = getCategorySizes(catName, uniformSizes);
      const defaultCatSize = catSizeOptions.length > 0 ? catSizeOptions[0].value : 'All Sizes';
      const initialSize = current.size || current.meterRange || defaultCatSize;

      return {
        ...prev,
        [catName]: {
          ...current,
          selected: newSelected,
          size: newSelected ? initialSize : '',
          meterRange: newSelected ? initialSize : ''
        }
      };
    });
  };

  const handleQuantityChange = (catName: string, quantity: string) => {
    setCategorySelections(prev => {
      const current = prev[catName] || { selected: true, quantity: '1' };
      return {
        ...prev,
        [catName]: { ...current, quantity }
      };
    });
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const finalName = (packageName || formData.category || formData.name || '').trim();

    if (!finalName) {
      addToast('error', 'Validation Error', 'Please enter a Package / Uniform Type Name');
      return;
    }

    const invalidSelectedItem = Object.entries(categorySelections).find(([catName, data]) => {
      return data.selected && (!data.size && !data.meterRange || (data.size || data.meterRange || '').trim() === '');
    });

    if (invalidSelectedItem) {
      addToast('error', 'Validation Error', `Please select a Size for ${invalidSelectedItem[0]} before submitting`);
      return;
    }

    if (formData.availableStock === undefined || formData.availableStock === null || isNaN(Number(formData.availableStock))) {
      addToast('error', 'Validation Error', 'Please enter valid Warehouse Stock (Available Units)');
      return;
    }

    const selectedCompList = Object.entries(categorySelections).filter(([_, data]) => data.selected);
    const isPkg = selectedCompList.length > 1 || finalName.toLowerCase().includes('package') || finalName.toLowerCase().includes('kit');

    const packageComponents: PackageComponentItem[] = isPkg ? selectedCompList.map(([catName, data]) => ({
      categoryName: catName,
      quantity: data.quantity.trim() || '1',
      ...(data.size || data.meterRange ? { size: data.size || data.meterRange } : {})
    })) : [];

    const clothSelectedData = Object.entries(categorySelections).find(([catName, data]) => data.selected && (catName.toLowerCase().includes('cloth') || catName.toLowerCase().includes('fabric')));
    const selectedMeterRange = clothSelectedData ? (clothSelectedData[1].size || clothSelectedData[1].meterRange) : undefined;

    const isBasePkg = finalName.toLowerCase().includes('boys') || finalName.toLowerCase().includes('girls') || (finalName.toLowerCase().includes('package') && finalName.toLowerCase().includes('admission'));
    const isFabric = finalName.toLowerCase().includes('cloth') || finalName.toLowerCase().includes('fabric') || finalName.toLowerCase().includes('unstitched');
    const finalSize = isFabric ? (selectedMeterRange || formData.size || '1.0m - 1.5m') : (formData.size || 'All Sizes');

    const computedStock = formData.availableStock !== undefined ? Number(formData.availableStock) : 150;

    const payload: Partial<UniformItem> = {
      ...formData,
      category: finalName,
      name: finalName,
      size: finalSize,
      gender: formData.gender || 'Unisex',
      className: formData.className || 'All Wings',
      openingStock: computedStock,
      availableStock: computedStock,
      isPackage: isPkg,
      packageComponents: isPkg && packageComponents.length > 0 ? packageComponents : undefined,
      ...(isBasePkg ? { sizeStockBreakdown: packageSizeStock } : {}),
      ...(isFabric ? { meterRange: finalSize } : {})
    };

    if (editingUniform) {
      updateUniform(editingUniform.id, payload);
      addToast('success', 'Uniform Type Updated', `Updated ${finalName}`);
    } else {
      addUniform(payload as Omit<UniformItem, 'id'>);
      addToast('success', 'Uniform Type Created', `Added ${finalName}`);
    }
    setIsFormOpen(false);
  };

  const selectedCategoriesCount = Object.values(categorySelections).filter(v => v.selected).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shirt className="w-6 h-6 text-sky-600" /> Add Uniform
          </h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Uniform
        </button>
      </div>

      {tabs}

      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search uniform package or item..."
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Filters:</span>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none font-semibold cursor-pointer focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">Select Package / Category</option>
            <option value="All">All Categories</option>
            {(() => {
              const seen = new Set<string>();
              const catList: string[] = [];
              (uniforms || []).forEach(u => {
                const raw = u.category || (u as any).name;
                if (!raw) return;
                const norm = normalizeUniformCategoryName(raw);
                if (!seen.has(norm.toLowerCase())) {
                  seen.add(norm.toLowerCase());
                  catList.push(norm);
                }
              });
              return catList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ));
            })()}
          </select>

          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none font-semibold cursor-pointer focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">Select Gender</option>
            <option value="All">All Genders</option>
            <option value="Unisex">Unisex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 font-bold glass-card rounded-3xl border border-slate-200 dark:border-slate-800">
            No uniform items found. Click "+ Add Uniform" to create one.
          </div>
        ) : (
          paginatedItems.map(u => {
            const components = u.packageComponents || [];

            return (
              <div key={u.id} className="glass-card p-5 rounded-3xl space-y-3.5 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/30 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          {u.gender}
                        </span>
                        {(() => {
                          const isBasePackage = (u.category || u.name || '').toLowerCase().includes('package') || (u.category || u.name || '').toLowerCase().includes('kit');
                          return isBasePackage ? (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <Package className="w-3 h-3" /> Uniform Package
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
                              <Shirt className="w-3 h-3" /> Uniform Item
                            </span>
                          );
                        })()}
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          Size: {u.size || (u as any).meterRange || 'All Sizes'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {u.category}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleOpenEdit(u)} title="Edit Uniform Type" className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 transition-all"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingUniform(u)} title="Delete Uniform Type" className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {((u.category || u.name || '').toLowerCase().includes('cloth') || (u.category || u.name || '').toLowerCase().includes('fabric') || (u.category || u.name || '').toLowerCase().includes('unstitched')) && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Meterage Size:</span>
                        <span className="font-bold text-sky-700 dark:text-sky-300">
                          {u.size && u.size !== 'All Sizes' ? u.size : ((u as any).meterRange || '1.0m – 1.5m')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">School Wing:</span><span className="font-bold text-slate-800 dark:text-slate-200">{u.className || 'All Wings'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">Warehouse Stock:</span><span className="font-bold text-slate-900 dark:text-white">{u.availableStock ?? 50} Units Available</span></div>
                  </div>

                  {components.length > 1 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-sky-500" /> Included Items ({components.length} Categories):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {components.map((comp, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                            {comp.quantity ? `${comp.quantity}x ` : ''}{comp.categoryName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        itemsPerPageOptions={[12, 24, 36, 48, 100]}
        label="uniform items"
      />

      {/* Package / Uniform Type Creation & Configuration Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl max-h-[90vh] flex flex-col w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {editingUniform ? 'Edit Uniform Type' : 'Add Uniform Type'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Package / Item Name Input */}
              <div>
                <label className="block font-semibold mb-1">Package Name / Item Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Enter Package or Item Name (e.g. Boys Uniform Package, Sports Dress)..."
                  value={packageName || formData.category || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setPackageName(val);
                    const existingItem = (uniforms || []).find(u => u.category?.toLowerCase() === val.toLowerCase() || u.name?.toLowerCase() === val.toLowerCase());
                    const lower = val.toLowerCase();
                    
                    let defaultPrice = formData.price || 350;
                    if (!editingUniform) {
                      if (existingItem?.price) {
                        defaultPrice = existingItem.price;
                      } else if (lower.includes('package') || lower.includes('kit')) {
                        defaultPrice = 3000;
                      } else if (lower.includes('blazer')) {
                        defaultPrice = 1500;
                      } else if (lower.includes('sweater')) {
                        defaultPrice = 800;
                      } else if (lower.includes('pant') || lower.includes('trouser') || lower.includes('skirt') || lower.includes('shoes') || lower.includes('tracksuit')) {
                        defaultPrice = 500;
                      }
                    }

                    let defaultGender: 'Male' | 'Female' | 'Unisex' = formData.gender || 'Unisex';
                    if (existingItem?.gender) {
                      defaultGender = existingItem.gender;
                    } else if (lower.includes('boys')) {
                      defaultGender = 'Male';
                    } else if (lower.includes('girls') || lower.includes('skirt')) {
                      defaultGender = 'Female';
                    }

                    setFormData({ 
                      ...formData, 
                      category: val,
                      name: val,
                      price: editingUniform ? formData.price : defaultPrice,
                      gender: defaultGender
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
                />

                {(() => {
                  if (!formData.category) return null;
                  const lower = (formData.category || '').toLowerCase();
                  const matchedCat = (uniformCategories || []).find(c => {
                    if (!c) return false;
                    const cName = typeof c === 'string' ? c : (c.name || (c as any).categoryName || (c as any).category || '');
                    if (!cName) return false;
                    const cLower = cName.toLowerCase();
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
                  const cleanDesc = matchedCat.description.replace(/\s+\)/g, ')').trim();
                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in">
                      <Package className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <span className="font-bold text-slate-900 dark:text-white">Package Specification: </span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">{cleanDesc}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Automatically Populated Configured Categories List & Quantity Stepper (Optional) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-500" /> Included Items (Optional) {selectedCategoriesCount > 0 ? `(${selectedCategoriesCount} Selected)` : ''}
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                  Check items below if creating a package bundle (leave blank for a single item card):
                </p>

                {availableCategoryNames.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 font-medium border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    No categories found. Please add categories under the Categories tab first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {availableCategoryNames.map(catName => {
                      const selData = (categorySelections[catName] as any) || { selected: false, quantity: '1', stock: 50, meterRange: '1.5m - 2.0m', wing: 'All Wings' };
                      const isSel = selData.selected;
                      const isCloth = catName.toLowerCase().includes('cloth') || catName.toLowerCase().includes('fabric') || catName.toLowerCase().includes('unstitched');

                      return (
                        <div
                          key={catName}
                          className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                            isSel
                              ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div
                            onClick={() => handleToggleCategory(catName)}
                            className="flex items-center gap-2.5 cursor-pointer select-none"
                          >
                            {isSel ? (
                              <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={`font-extrabold text-xs ${isSel ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                              {catName}
                            </span>
                          </div>

                          {isSel && !isCloth && (
                            <div className="pt-2 flex items-center justify-between border-t border-sky-200/80 dark:border-sky-800/60 animate-in fade-in">
                              <span className="text-[11px] font-extrabold text-sky-900 dark:text-sky-300">
                                Included Quantity *
                              </span>
                              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl px-1.5 py-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentQty = Math.max(1, parseInt(selData.quantity || '1', 10) - 1);
                                    handleQuantityChange(catName, String(currentQty));
                                  }}
                                  className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900 font-extrabold flex items-center justify-center text-xs transition-colors cursor-pointer"
                                >
                                  –
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={50}
                                  value={selData.quantity || '1'}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    handleQuantityChange(catName, String(val));
                                  }}
                                  className="w-8 text-center text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentQty = parseInt(selData.quantity || '1', 10) + 1;
                                    handleQuantityChange(catName, String(currentQty));
                                  }}
                                  className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900 font-extrabold flex items-center justify-center text-xs transition-colors cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}

                          {isSel && isCloth && (
                            <div className="pt-2 border-t border-sky-200/80 dark:border-sky-800/60 animate-in fade-in">
                              <label className="block text-[10px] font-extrabold text-sky-900 dark:text-sky-300 mb-1">
                                Meter Range *
                              </label>
                              <select
                                value={selData.meterRange || selData.size || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCategorySelections(prev => ({
                                    ...prev,
                                    [catName]: { ...prev[catName], meterRange: val, size: val }
                                  }));
                                }}
                                className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 font-bold text-slate-900 dark:text-white cursor-pointer"
                              >
                                <option value="">-- Select Size --</option>
                                <option value="1.0m - 1.5m">1.0m – 1.5m</option>
                                <option value="1.5m - 2.0m">1.5m – 2.0m</option>
                                <option value="2.0m - 2.5m">2.0m – 2.5m</option>
                                <option value="2.5m - 3.0m">2.5m – 3.0m</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Target Gender & Wing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Gender *</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
                    <option value="Unisex">Unisex (All Students)</option>
                    <option value="Male">Male (Boys Only)</option>
                    <option value="Female">Female (Girls Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">School Wing / Level *</label>
                  <select value={formData.className || 'All Wings'} onChange={e => setFormData({ ...formData, className: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer font-semibold">
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
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Size Specification <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={formData.size || ''}
                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white outline-none cursor-pointer text-xs"
                  >
                    <option value="">Select Size Specification *</option>
                    <option value="All Sizes">All Sizes (Universal Standard)</option>
                    {getCategorySizes(formData.category, uniformSizes).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Color</label>
                  <input type="text" placeholder="e.g. Navy Blue" value={formData.color || ''} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white outline-none text-xs" />
                </div>
              </div>

              {/* Warehouse Stock (Bottom Positioned) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Warehouse Stock (Available Units) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50"
                  value={formData.availableStock ?? ''}
                  onChange={e => setFormData({ ...formData, availableStock: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4.5 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 transition-all">
                  Save Uniform Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingUniform}
        title="Delete Uniform Type"
        message={`Are you sure you want to delete ${deletingUniform?.category}?`}
        onConfirm={() => {
          if (deletingUniform) {
            deleteUniform(deletingUniform.id);
            addToast('success', 'Uniform Type Removed');
            setDeletingUniform(null);
          }
        }}
        onCancel={() => setDeletingUniform(null)}
      />
    </div>
  );
};
