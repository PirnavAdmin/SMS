import React from 'react';
import { Shirt, Package, AlertTriangle, UserCheck, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { formatCurrency } from '../../../utils/currency';

export const UniformDashboardView: React.FC = () => {
  const { uniforms, uniformInventory, studentUniformIssues } = useData();

  // 1. KPI Calculations
  const totalItems = uniforms.length;
  const totalStock = uniformInventory.reduce((acc, x) => acc + x.currentStock, 0);
  const lowStockItems = uniformInventory.filter(x => x.status === 'Low Stock' || x.currentStock <= x.minimumStock).length;
  const uniformsIssued = studentUniformIssues.filter(x => x.status === 'Issued').reduce((acc, x) => acc + x.quantity, 0);

  // Additional sales: let's sum student uniform issues where status is Issued and notes say something about purchase or additional,
  // or we can calculate based on inventory prices of issued stock!
  const additionalSalesValue = studentUniformIssues
    .filter(x => x.status === 'Issued')
    .reduce((sum, issue) => {
      const uItem = uniforms.find(u => u.id === issue.itemId || u.category === issue.itemName);
      return sum + (uItem ? uItem.price * issue.quantity : 0);
    }, 0);

  const pendingOrders = uniformInventory.filter(x => x.status === 'Out of Stock').length;

  // Occupancy rate / stock health rate
  const stockHealthRate = totalStock > 0 ? Math.round(((totalStock - (lowStockItems * 10)) / totalStock) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Items</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{totalItems}</h3>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Available Stock</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{totalStock} Units</h3>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{lowStockItems} Items</h3>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Issued Units</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{uniformsIssued} Items</h3>
        </div>

        {/* Card 5 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Addl. Sales</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{formatCurrency(additionalSalesValue)}</h3>
        </div>

        {/* Card 6 */}
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{pendingOrders} Items</h3>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock analysis */}
        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Low Stock Analysis & Alerts</h4>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">Action Required</span>
          </div>

          <div className="space-y-3.5">
            {uniformInventory.filter(x => x.currentStock <= x.minimumStock).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All uniform inventory items are comfortably stocked.</p>
            ) : (
              uniformInventory.filter(x => x.currentStock <= x.minimumStock).map(item => {
                const percent = Math.round((item.currentStock / item.openingStock) * 100) || 0;
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.itemName} (Size {item.size})</span>
                      <span className="text-rose-500 font-bold">{item.currentStock} / {item.minimumStock} Min</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category distribution */}
        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Category-wise Stock Levels</h4>
            <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">Inventory Share</span>
          </div>

          <div className="space-y-3">
            {uniforms.slice(0, 4).map((u, i) => {
              const colors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-sky-500'];
              const uStock = uniformInventory.find(inv => inv.itemId === u.id)?.currentStock || 50;
              const percent = Math.min(100, Math.round((uStock / 200) * 100));

              return (
                <div key={u.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{u.category}</span>
                    <span className="text-slate-500">{uStock} Units</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i % 4]} rounded-full`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default UniformDashboardView;
