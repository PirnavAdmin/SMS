import React, { useState } from 'react';
import { Search, Plus, Minus, Settings2, Package, AlertTriangle, CheckCircle2, ShoppingCart, Layers, List, X, Filter } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformInventoryItem } from '../../../types';
import { Badge } from '../../common/Badge';
import { Pagination } from '../../common/Pagination';

interface UniformInventoryViewProps {
  tabs?: React.ReactNode;
  initialStatusFilter?: string;
}

export const UniformInventoryView: React.FC<UniformInventoryViewProps> = ({ tabs, initialStatusFilter }) => {
  const { uniformInventory, updateUniformInventory, uniforms } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter || '');
  const [filterSize, setFilterSize] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'matrix'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setFilterStatus(initialStatusFilter);
      setFilterSize('');
      setCurrentPage(1);
    }
  }, [initialStatusFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UniformInventoryItem | null>(null);
  const [actionType, setActionType] = useState<'In' | 'Out' | 'Adjust'>('In');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState('');

  const lowStockCount = (uniformInventory || []).filter(i => i && i.currentStock > 0 && (i.currentStock <= i.minimumStock || i.status === 'Low Stock')).length;

  // Real-time calculation of stock breakdown by size
  const sizeBreakdown = (uniformInventory || []).reduce((acc, item) => {
    if (!item) return acc;
    const sz = item.size || 'Other';
    if (!acc[sz]) {
      acc[sz] = { totalStock: 0, count: 0 };
    }
    acc[sz].totalStock += (item.currentStock || 0);
    acc[sz].count += 1;
    return acc;
  }, {} as Record<string, { totalStock: number; count: number }>);

  const availableSizes = Array.from(new Set((uniformInventory || []).map(i => i?.size))).filter(Boolean);

  // Group inventory items by itemName / category to generate item-wise size breakdown matrix
  const groupedItemMatrix = (uniformInventory || []).reduce((acc, item) => {
    if (!item) return acc;
    const key = item.itemName || item.category || 'Item';
    if (!acc[key]) {
      acc[key] = {
        itemName: key,
        category: item.category || 'Uniform',
        totalStock: 0,
        sizes: {} as Record<string, { stock: number; itemObj: UniformInventoryItem }>
      };
    }
    const szKey = item.size || 'Standard';
    acc[key].totalStock += (item.currentStock || 0);
    acc[key].sizes[szKey] = {
      stock: item.currentStock || 0,
      itemObj: item
    };
    return acc;
  }, {} as Record<string, { itemName: string; category: string; totalStock: number; sizes: Record<string, { stock: number; itemObj: UniformInventoryItem }> }>);

  // Size Breakdown for each Item Name for quick inline pill display (deduplicated by size)
  const itemSizesMap = (uniformInventory || []).reduce((acc, item) => {
    if (!item) return acc;
    const key = (item.itemName || item.category || '').toLowerCase();
    if (!acc[key]) {
      acc[key] = {};
    }
    acc[key][item.size || 'M'] = (acc[key][item.size || 'M'] || 0) + (item.currentStock || 0);
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const isFiltered = Boolean(query.trim() || (filterStatus && filterStatus !== 'All') || (filterSize && filterSize !== 'All') || initialStatusFilter);

  const filteredGroupedItems = !isFiltered ? [] : Object.values(groupedItemMatrix).filter(g => {
    if (!g) return false;
    const q = (query || '').toLowerCase();
    const matchQuery = !q || g.itemName.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);

    const sizeVariants = Object.values(g.sizes).map(s => s.itemObj);
    const matchSize = !filterSize || filterSize === 'All' ? true : sizeVariants.some(v => v && v.size === filterSize);

    const matchStatus = !filterStatus || filterStatus === 'All' ? true : sizeVariants.some(v => {
      if (!v) return false;
      const cStock = v.currentStock || 0;
      const mStock = v.minimumStock || 0;
      if (filterStatus === 'Out of Stock') return cStock === 0 || v.status === 'Out of Stock';
      if (filterStatus === 'Low Stock') return cStock > 0 && (v.status === 'Low Stock' || cStock <= mStock);
      if (filterStatus === 'In Stock') return cStock > mStock && v.status !== 'Out of Stock';
      return v.status === filterStatus;
    });

    return matchQuery && matchSize && matchStatus;
  });

  const filtered = !isFiltered ? [] : (uniformInventory || []).filter(i => {
    if (!i) return false;
    const q = (query || '').toLowerCase();
    const matchQuery = !q || (i.itemName || '').toLowerCase().includes(q) ||
                       (i.category || '').toLowerCase().includes(q);
    const cStock = i.currentStock || 0;
    const mStock = i.minimumStock || 0;
    const matchStatus = !filterStatus || filterStatus === 'All' ? true : (
      filterStatus === 'Out of Stock' ? (cStock === 0 || i.status === 'Out of Stock') :
      filterStatus === 'Low Stock' ? (cStock > 0 && (i.status === 'Low Stock' || cStock <= mStock)) :
      filterStatus === 'In Stock' ? (cStock > mStock && i.status !== 'Out of Stock') :
      i.status === filterStatus
    );
    const matchSize = !filterSize || filterSize === 'All' ? true : i.size === filterSize;
    return matchQuery && matchStatus && matchSize;
  });

  const paginatedGrouped = filteredGroupedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedTable = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAction = (item: UniformInventoryItem, type: 'In' | 'Out' | 'Adjust') => {
    setSelectedItem(item);
    setActionType(type);
    setQuantity(type === 'In' ? 20 : 10);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    let newStock = selectedItem.currentStock;
    if (actionType === 'In') {
      newStock += quantity;
    } else if (actionType === 'Out') {
      newStock = Math.max(0, newStock - quantity);
    } else if (actionType === 'Adjust') {
      newStock = Math.max(0, quantity);
    }

    const newStatus = newStock === 0 ? 'Out of Stock' : (newStock <= selectedItem.minimumStock ? 'Low Stock' : 'In Stock');

    updateUniformInventory(selectedItem.id, {
      currentStock: newStock,
      status: newStatus,
      lastUpdated: new Date().toISOString().split('T')[0]
    });

    addToast('success', 'Stock Inventory Updated', `Updated ${selectedItem.itemName} current stock to ${newStock} units.`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-600" /> Inventory Stock Registry
          </h2>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Table View
          </button>

          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Item Size Matrix
          </button>
        </div>
      </div>
      
      {tabs}

      {/* Filters Bar */}
      <div className="glass-card p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items by name, category..."
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

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Filters:</span>
          <select
            value={filterSize}
            onChange={e => { setFilterSize(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">Select Size</option>
            <option value="All">All Sizes</option>
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

          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">Select Status</option>
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Low Stock Warning Banner if Low Stock items exist */}
      {lowStockCount > 0 && (filterStatus === 'All' || filterStatus === 'Low Stock') && (
        <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Low Stock Replenishment Warning</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {lowStockCount} {lowStockCount === 1 ? 'Item Deficit' : 'Items Deficit'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Warehouse stock for these uniform items is at or below minimum reorder points. Schools issue purchase orders to suppliers to prevent student distribution delays.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main View Display: Item Size Matrix vs Standard Table */}
      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!isFiltered ? (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 font-bold glass-card rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Search className="w-8 h-8 text-sky-500/50 mx-auto" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-extrabold">No Filter Selected</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                Please select a size/status filter or type in the search bar to display inventory stock.
              </p>
            </div>
          ) : filteredGroupedItems.length === 0 ? (
            <div className="col-span-full glass-card p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold">
              No uniform items match your selected filters.
            </div>
          ) : (
            paginatedGrouped.map(group => (
              <div key={group.itemName} className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 hover:border-sky-300 dark:hover:border-sky-700 transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {group.itemName}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Category: {group.category}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-black border border-sky-200 dark:border-sky-800">
                      {group.totalStock} Units Total
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Size Availability Breakdown
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(group.sizes).map(([sz, sizeData]) => (
                      <div
                        key={sz}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          sizeData.stock === 0
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                            : sizeData.stock <= 15
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div>
                          <div className="text-[11px] font-extrabold flex items-center gap-1">
                            <span>Size {sz}</span>
                          </div>
                          <div className="text-xs font-black mt-0.5">
                            {sizeData.stock} Units
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAction(sizeData.itemObj, 'In')}
                            className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold transition-all"
                            title="Restock Size"
                          >
                            + Restock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table */
        <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Size</th>
                  <th className="py-3 px-4 text-right">Opening Stock</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Min Threshold</th>
                  <th className="py-3 px-4 text-right">Reorder Point</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Stock Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {!isFiltered ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-6 h-6 text-sky-500/50" />
                        <span>Select a size/status filter or type in the search bar to display inventory stock.</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  filterStatus === 'Low Stock' ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">All Warehouse Stock Levels Are Healthy!</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                          Zero uniform items are currently below minimum safety thresholds. Low stock warnings trigger automatically here whenever warehouse units fall below reorder levels.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No inventory matches found.
                      </td>
                    </tr>
                  )
                ) : (
                  paginatedTable.map(i => (
                    <tr key={i.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${i.currentStock <= i.minimumStock ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{i.itemName}</td>
                      <td className="py-3 px-4 text-slate-500">{i.category}</td>
                      <td className="py-3 px-4 text-center font-bold text-sky-600 dark:text-sky-400">{i.size}</td>
                      <td className="py-3 px-4 text-right">{i.openingStock} Units</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">{i.currentStock} Units</td>
                      <td className="py-3 px-4 text-right text-rose-500">{i.minimumStock} Units</td>
                      <td className="py-3 px-4 text-right text-amber-600">{i.reorderLevel} Units</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={i.status === 'In Stock' ? 'success' : (i.status === 'Low Stock' ? 'warning' : 'danger')}>{i.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenAction(i, 'In')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] flex items-center gap-0.5 transition-all" title="Add Restock Stock"><Plus className="w-2.5 h-2.5" /> Restock</button>
                          <button onClick={() => handleOpenAction(i, 'Out')} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] flex items-center gap-0.5 transition-all" title="Deduct Issue"><Minus className="w-2.5 h-2.5" /> Out</button>
                          <button onClick={() => handleOpenAction(i, 'Adjust')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-0.5 transition-all" title="Adjust Balance"><Settings2 className="w-2.5 h-2.5" /> Adj</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalItems={viewMode === 'matrix' ? filteredGroupedItems.length : filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        itemsPerPageOptions={[10, 25, 50, 100]}
        label="inventory items"
      />

      {/* Action Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-600" />
              {actionType === 'In' ? 'Replenish / Restock Inventory' : actionType === 'Out' ? 'Manual Stock Deduction' : 'Set Stock Balance'}
            </h3>

            <p className="text-xs text-slate-400">
              Modifying warehouse stock for <span className="font-bold text-slate-900 dark:text-white">{selectedItem.itemName}</span> (Size {selectedItem.size}). Current stock: <span className="font-bold text-sky-600">{selectedItem.currentStock} Units</span>.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {actionType === 'Adjust' ? 'New absolute stock level *' : 'Stock Quantity *'}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Supplier Reference / Audit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment from Apex Mills Ltd"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all">Update Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UniformInventoryView;
