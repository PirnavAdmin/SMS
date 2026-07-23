import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Package, Plus, AlertCircle, ShoppingCart } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const InventoryView: React.FC = () => {
  const { inventory, addInventoryItem } = useData();
  const { addToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: 'Asset' as const,
    quantity: 10,
    unitPrice: 50,
    location: 'Main Store Room',
    supplier: 'Global Supplies Ltd',
    status: 'In Stock' as const
  });

  const handleAdd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newItem.itemName) return;
    addInventoryItem(newItem);
    addToast('success', 'Stock Item Added', `Registered ${newItem.itemName}`);
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" /> Inventory & Asset Management
          </h2>
          <p className="text-xs text-slate-500">Track equipment, lab assets, stationery stock levels & purchase orders</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Asset Item
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase">
              <th className="py-3.5 px-4">Item Name</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Stock Qty</th>
              <th className="py-3.5 px-4">Unit Price</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {inventory.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{item.itemName}</td>
                <td className="py-3 px-4 text-slate-500">{item.category}</td>
                <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{item.quantity} units</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 px-4 text-slate-500">{item.location}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Inventory Asset</h3>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Item Name *</label>
                <input type="text" required value={newItem.itemName} onChange={e => setNewItem({ ...newItem, itemName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit Price (₹)</label>
                  <input type="number" value={newItem.unitPrice} onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-xl">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
