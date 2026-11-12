import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Package, Plus, AlertCircle, ShoppingCart } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

const MAX_INVENTORY_QTY = 1000000;
const MAX_INVENTORY_PRICE = 100000000;

export const InventoryView: React.FC = () => {
  const { inventory, addInventoryItem, fetchInventoryData } = useData();
  
  useEffect(() => {
    if (fetchInventoryData) {
      fetchInventoryData();
    }
  }, []);
  const { addToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: 'Asset' as const,
    quantity: '10',
    unitPrice: '50',
    location: 'Main Store Room',
    supplier: 'Global Supplies Ltd',
    status: 'In Stock' as const
  });

  const handleQtyChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 7);
    if (!digits) {
      setNewItem((prev) => ({ ...prev, quantity: '' }));
      return;
    }
    const clamped = Math.min(MAX_INVENTORY_QTY, Number(digits));
    setNewItem((prev) => ({ ...prev, quantity: String(clamped) }));
  };

  const handlePriceChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    if (!normalized) {
      setNewItem((prev) => ({ ...prev, unitPrice: '' }));
      return;
    }
    const limited = normalized.slice(0, 12);
    const num = Number(limited);
    if (Number.isFinite(num) && num > MAX_INVENTORY_PRICE) {
      setNewItem((prev) => ({ ...prev, unitPrice: String(MAX_INVENTORY_PRICE) }));
      return;
    }
    setNewItem((prev) => ({ ...prev, unitPrice: limited }));
  };

  const handleAdd = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmedName = newItem.itemName.trim();
    const qty = Number(newItem.quantity);
    const price = Number(newItem.unitPrice);

    if (!trimmedName) {
      setFormError('Item Name is required.');
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0 || qty > MAX_INVENTORY_QTY) {
      setFormError(`Quantity must be a whole number between 1 and ${MAX_INVENTORY_QTY.toLocaleString('en-IN')}.`);
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || price > MAX_INVENTORY_PRICE) {
      setFormError(`Unit Price must be between ₹1 and ${formatCurrency(MAX_INVENTORY_PRICE)}.`);
      return;
    }

    setFormError(null);
    await addInventoryItem({
      ...newItem,
      itemName: trimmedName,
      quantity: qty,
      unitPrice: price,
    });
    addToast('success', 'Stock Item Added', `Registered ${trimmedName}`);
    setNewItem({
      itemName: '',
      category: 'Asset' as const,
      quantity: '10',
      unitPrice: '50',
      location: 'Main Store Room',
      supplier: 'Global Supplies Ltd',
      status: 'In Stock' as const
    });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 dark:bg-brand-500/20 rounded-2xl shrink-0">
              <Package className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Inventory Management
              </h2>
            </div>
          </div>
  
          <button
            onClick={() => {
              setFormError(null);
              setIsAddOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Inventory Item
          </button>
        </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 whitespace-nowrap">Item Name</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Stock Qty</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Unit Price</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Location</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-400 italic">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                inventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 align-middle">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-[240px] truncate" title={item.itemName}>
                      {item.itemName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{item.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                      {Number(item.quantity || 0).toLocaleString('en-IN')} units
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-bold tabular-nums whitespace-nowrap">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{item.location}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                        item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Inventory Asset</h3>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold mb-1">Item Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={newItem.itemName}
                  onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantity <span className="text-slate-400 font-normal">(Max 10L)</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={newItem.quantity}
                    onChange={e => handleQtyChange(e.target.value)}
                    placeholder="1 - 1000000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit Price (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={newItem.unitPrice}
                    onChange={e => handlePriceChange(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono tabular-nums"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
