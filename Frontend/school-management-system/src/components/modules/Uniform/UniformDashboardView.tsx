import React from 'react';
import { Shirt, Package, AlertTriangle, UserCheck, IndianRupee, Clock, TrendingUp } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { formatCurrency } from '../../../utils/currency';

interface UniformDashboardViewProps {
  onNavigate?: (tab: string, subTab?: 'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory', reportType?: string) => void;
}

export const UniformDashboardView: React.FC<UniformDashboardViewProps> = ({ onNavigate }) => {
  const { uniforms, uniformInventory, studentUniformIssues } = useData();

  // 1. KPI Calculations
  const totalItems = uniforms.length;
  const totalStock = uniforms.reduce((acc, u) => {
    const invStock = uniformInventory
      .filter(inv => inv.itemId === u.id || inv.itemName.toLowerCase() === u.category.toLowerCase())
      .reduce((sum, inv) => sum + inv.currentStock, 0);
    return acc + (invStock > 0 ? invStock : (u.availableStock !== undefined ? u.availableStock : 0));
  }, 0);
  const lowStockItems = uniformInventory.filter(x => x.status === 'Low Stock' || x.currentStock <= x.minimumStock).length;
  const uniformsIssued = studentUniformIssues.filter(x => x.status === 'Issued').reduce((acc, x) => acc + x.quantity, 0);

  // Additional sales: Excludes replaced/returned items. Sums total value of all issued items (1 + remaining extra units = full quantity * unit price)
  const additionalSalesValue = studentUniformIssues
    .filter(x => x.status === 'Issued')
    .reduce((sum, issue) => {
      const uItem = uniforms.find(u => u.id === issue.itemId || u.category.toLowerCase() === issue.itemName.toLowerCase());
      return sum + (uItem ? uItem.price * issue.quantity : 0);
    }, 0);

  const pendingOrders = uniformInventory.filter(x => x.status === 'Out of Stock').length;

  // Occupancy rate / stock health rate
  const stockHealthRate = totalStock > 0 ? Math.round(((totalStock - (lowStockItems * 10)) / totalStock) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-sky-500" /> Uniform Dashboard
        </h2>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Items -> Uniform Masters (Items) */}
        <div 
          onClick={() => onNavigate?.('masters', 'items')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          title="Click to view uniform items"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Total Items</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{totalItems}</h3>
        </div>

        {/* Card 2: Available Stock -> Uniform Masters (Inventory) */}
        <div 
          onClick={() => onNavigate?.('masters', 'inventory')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          title="Click to view uniform inventory stock"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Available Stock</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{totalStock} Units</h3>
        </div>

        {/* Card 3: Low Stock -> Uniform Reports (Low Stock) */}
        <div 
          onClick={() => onNavigate?.('reports', undefined, 'Low Stock')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          title="Click to view low stock alerts report"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{lowStockItems} Items</h3>
        </div>

        {/* Card 4: Issued Units -> Student Uniform Distribution */}
        <div 
          onClick={() => onNavigate?.('student-uniform')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          title="Click to view student uniform distribution"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Issued Units</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{uniformsIssued} Items</h3>
        </div>

        {/* Card 5: Additional Sales -> Uniform Reports */}
        <div 
          onClick={() => onNavigate?.('reports', undefined, 'Additional Uniform Sales')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          title="Click to view additional sales report"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Additional Sales</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-4">{formatCurrency(additionalSalesValue)}</h3>
        </div>

        {/* Card 6: Out of Stock -> Uniform Masters (Inventory) */}
        <div 
          onClick={() => onNavigate?.('masters', 'inventory')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          title="Click to view out of stock inventory"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
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
            <button 
              onClick={() => onNavigate?.('masters', 'inventory')} 
              className="text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
            >
              Action Required
            </button>
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
            <span className="text-[10px] text-sky-500 font-bold bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded">Inventory Share</span>
          </div>

          <div className="space-y-3">
            {uniforms.map((u, i) => {
              const colors = ['bg-sky-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500'];
              const invStock = uniformInventory
                .filter(inv => inv.itemId === u.id || inv.itemName.toLowerCase() === u.category.toLowerCase())
                .reduce((sum, inv) => sum + inv.currentStock, 0);
              const uStock = invStock > 0 ? invStock : (u.availableStock !== undefined ? u.availableStock : 0);
              const totalInvStock = totalStock > 0 ? totalStock : 1;
              const percent = Math.min(100, Math.round((uStock / totalInvStock) * 100));

              return (
                <div key={u.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{u.category}</span>
                    <span className="text-slate-500 font-bold">{uStock} Units</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
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
