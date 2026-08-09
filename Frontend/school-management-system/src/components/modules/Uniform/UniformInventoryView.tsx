import React, { useState } from 'react';
import { Search, Plus, Minus, Settings2, Package, AlertTriangle, CheckCircle2, ShoppingCart } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformInventoryItem } from '../../../types';
import { Badge } from '../../common/Badge';

export const UniformInventoryView: React.FC<{tabs?: React.ReactNode}> = ({ tabs }) => {
  const { uniformInventory, updateUniformInventory, uniforms } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UniformInventoryItem | null>(null);
  const [actionType, setActionType] = useState<'In' | 'Out' | 'Adjust'>('In');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState('');

  const lowStockCount = uniformInventory.filter(i => i.currentStock <= i.minimumStock || i.status === 'Low Stock' || i.status === 'Out of Stock').length;

  const filtered = uniformInventory.filter(i => {
    const matchQuery = i.itemName.toLowerCase().includes(query.toLowerCase()) ||
                       i.category.toLowerCase().includes(query.toLowerCase());
    const matchStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchQuery && matchStatus;
  });

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
      </div>
      
      {tabs}

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name, category..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
        >
          <option value="All">Select Status (All)</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
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

      {/* Table */}
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
              {filtered.length === 0 ? (
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
                    <td colSpan={9} className="py-8 text-center text-slate-400">No inventory matches found.</td>
                  </tr>
                )
              ) : (
                filtered.map(i => (
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
