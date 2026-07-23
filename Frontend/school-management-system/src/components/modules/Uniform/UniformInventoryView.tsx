import React, { useState } from 'react';
import { Search, Plus, Minus, Settings2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformInventoryItem } from '../../../types';
import { Badge } from '../../common/Badge';

export const UniformInventoryView: React.FC = () => {
  const { uniformInventory, updateUniformInventory, uniforms } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UniformInventoryItem | null>(null);
  const [actionType, setActionType] = useState<'In' | 'Out' | 'Adjust'>('In');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState('');

  const filtered = uniformInventory.filter(i => {
    const matchQuery = i.itemName.toLowerCase().includes(query.toLowerCase()) ||
                       i.category.toLowerCase().includes(query.toLowerCase());
    const matchStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const handleOpenAction = (item: UniformInventoryItem, type: 'In' | 'Out' | 'Adjust') => {
    setSelectedItem(item);
    setActionType(type);
    setQuantity(10);
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
    } else {
      newStock = quantity; // Adjustment overrides
    }

    const newStatus = newStock === 0 ? 'Out of Stock' : (newStock <= selectedItem.minimumStock ? 'Low Stock' : 'In Stock');

    updateUniformInventory(selectedItem.id, {
      currentStock: newStock,
      status: newStatus
    });

    addToast('success', 'Stock Updated', `Successfully completed Stock ${actionType} for ${selectedItem.itemName}.`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Inventory Stock Registry</h3>
          <p className="text-xs text-slate-500">Monitor opening, reorder thresholds, low warning levels, and adjust counts</p>
        </div>
      </div>

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
          <option value="All">All Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

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
                <th className="py-3 px-4 text-right">Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No inventory matches found.</td>
                </tr>
              ) : (
                filtered.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{i.itemName}</td>
                    <td className="py-3 px-4 text-slate-500">{i.category}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{i.size}</td>
                    <td className="py-3 px-4 text-right">{i.openingStock} Units</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">{i.currentStock} Units</td>
                    <td className="py-3 px-4 text-right text-rose-500">{i.minimumStock} Units</td>
                    <td className="py-3 px-4 text-right text-amber-600">{i.reorderLevel} Units</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={i.status === 'In Stock' ? 'success' : (i.status === 'Low Stock' ? 'warning' : 'danger')}>{i.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenAction(i, 'In')} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px] flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> In</button>
                      <button onClick={() => handleOpenAction(i, 'Out')} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[10px] flex items-center gap-0.5"><Minus className="w-2.5 h-2.5" /> Out</button>
                      <button onClick={() => handleOpenAction(i, 'Adjust')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] flex items-center gap-0.5"><Settings2 className="w-2.5 h-2.5" /> Adj</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-sm p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Stock {actionType === 'In' ? 'Receive (Stock In)' : (actionType === 'Out' ? 'Deduct (Stock Out)' : 'Adjustment')}
            </h3>
            <p className="text-xs text-slate-400">Modify stock for **{selectedItem.itemName}** (Size {selectedItem.size}). Current levels: **{selectedItem.currentStock} Units**.</p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {actionType === 'Adjust' ? 'New absolute stock level *' : 'Quantity *'}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Operation Notes / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Regular restock, damaged stock"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all">Confirm Stock Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UniformInventoryView;
