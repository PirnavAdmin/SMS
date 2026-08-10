import React from 'react';
import { Shirt, Package, AlertTriangle, UserCheck, IndianRupee, Clock, TrendingUp, RotateCcw, ArrowUpRight } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { formatCurrency } from '../../../utils/currency';
import { Badge } from '../../common/Badge';

interface UniformDashboardViewProps {
  onNavigate?: (tab: string, subTab?: 'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory', reportType?: string, statusFilter?: string) => void;
}

export const UniformDashboardView: React.FC<UniformDashboardViewProps> = ({ onNavigate }) => {
  const { uniforms, uniformInventory, studentUniformIssues } = useData();

  // 1. KPI Calculations
  const totalItems = uniforms.length;
  const totalStock = uniformInventory.reduce((acc, inv) => acc + inv.currentStock, 0);
  const lowStockItems = uniformInventory.filter(x => x.currentStock > 0 && (x.status === 'Low Stock' || x.currentStock <= x.minimumStock)).length;
  const uniformsIssued = studentUniformIssues.filter(x => x.status === 'Issued').reduce((acc, x) => acc + x.quantity, 0);
  const uniformsReturned = studentUniformIssues.filter(x => x.status === 'Returned').reduce((acc, x) => acc + x.quantity, 0);

  // Additional sales: Excludes replaced/returned items. Sums total value of all issued items
  const additionalSalesValue = studentUniformIssues
    .filter(x => x.status === 'Issued')
    .reduce((sum, issue) => {
      const uItem = uniforms.find(u => u.id === issue.itemId || u.category.toLowerCase() === issue.itemName.toLowerCase());
      return sum + (uItem ? uItem.price * issue.quantity : 0);
    }, 0);

  const pendingOrders = uniformInventory.filter(x => x.status === 'Out of Stock' || x.currentStock === 0).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-sky-500" /> Uniform Dashboard
        </h2>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {/* Card 1: Total Items */}
        <div 
          onClick={() => onNavigate?.('masters', 'items')}
          className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-sm transition-all group"
          title="Click to view uniform items"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Total Items</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Shirt className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">{totalItems}</h3>
        </div>

        {/* Card 2: Available Stock */}
        <div 
          onClick={() => onNavigate?.('masters', 'inventory', undefined, 'All')}
          className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm transition-all group"
          title="Click to view uniform inventory stock"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Stock Available</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">{totalStock} Units</h3>
        </div>

        {/* Card 3: Issued Units */}
        <div 
          onClick={() => onNavigate?.('student-uniform', undefined, undefined, 'Issued')}
          className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-all group"
          title="Click to view student uniform distribution"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Issued Units</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">{uniformsIssued} Units</h3>
        </div>

        {/* Card 4: Returned Units */}
        <div 
          onClick={() => onNavigate?.('student-uniform', undefined, undefined, 'Returned')}
          className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-sm transition-all group"
          title="Click to view returned items"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Returned Units</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">{uniformsReturned} Units</h3>
        </div>

        {/* Card 5: Low Stock */}
        <div 
          onClick={() => onNavigate?.('masters', 'inventory', undefined, 'Low Stock')}
          className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm transition-all group"
          title="Click to view low stock inventory"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Low Stock</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">{lowStockItems} Items</h3>
        </div>

        {/* Card 6: Additional Sales */}
        <div 
          onClick={() => onNavigate?.('reports', undefined, 'Additional Uniform Sales')}
          className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-sm transition-all group"
          title="Click to view additional sales report"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Sales Value</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">{formatCurrency(additionalSalesValue)}</h3>
        </div>

        {/* Card 7: Out of Stock */}
        <div 
          onClick={() => onNavigate?.('masters', 'inventory', undefined, 'Out of Stock')}
          className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-sm transition-all group"
          title="Click to view out of stock inventory"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Out of Stock</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">{pendingOrders} Items</h3>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock analysis */}
        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Analysis & Replenishment
            </h4>
            <button 
              onClick={() => onNavigate?.('masters', 'inventory')} 
              className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
            >
              Restock Registry
            </button>
          </div>

          <div className="space-y-3">
            {uniformInventory.filter(x => x.currentStock > 0 && x.currentStock <= x.minimumStock).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All uniform inventory items are comfortably stocked.</p>
            ) : (
              uniformInventory.filter(x => x.currentStock > 0 && x.currentStock <= x.minimumStock).map(item => {
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
        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-500" /> Category-wise Stock Distribution
            </h4>
            <span className="text-[10px] text-sky-600 font-bold bg-sky-50 dark:bg-sky-950/40 px-2.5 py-0.5 rounded-full">Inventory Share</span>
          </div>

          <div className="space-y-3">
            {(() => {
              const catMap = new Map<string, number>();
              uniformInventory.forEach(inv => {
                const name = inv.itemName || inv.category;
                catMap.set(name, (catMap.get(name) || 0) + inv.currentStock);
              });
              uniforms.forEach(u => {
                if (!catMap.has(u.category)) {
                  catMap.set(u.category, u.availableStock || 0);
                }
              });
              const grouped = Array.from(catMap.entries()).map(([category, stock]) => ({ category, stock }));
              const colors = ['bg-sky-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500'];
              const totalInvStock = totalStock > 0 ? totalStock : 1;

              return grouped.map((item, i) => {
                const percent = Math.min(100, Math.round((item.stock / totalInvStock) * 100));
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                      <span className="text-slate-500 font-bold">{item.stock} Units</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Recent Student Distribution & Returns Activity Table */}
      <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-500" />
              Recent Distribution & Returns Activity
            </h3>
          </div>
          
          <button
            type="button"
            onClick={() => onNavigate?.('student-uniform')}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Records</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Clothing Item</th>
                <th className="py-2.5 px-3 text-center">Size</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {studentUniformIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">No recent uniform issue or return activity recorded.</td>
                </tr>
              ) : (
                studentUniformIssues.slice(0, 5).map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{issue.studentName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{issue.className} - {issue.section}</td>
                    <td className="py-2.5 px-3 font-semibold text-sky-600 dark:text-sky-400">{issue.itemName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">{issue.size}</td>
                    <td className="py-2.5 px-3 text-right font-black">{issue.quantity} Units</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{issue.issueDate}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={issue.status === 'Issued' ? 'success' : (issue.status === 'Returned' ? 'neutral' : 'warning')}>
                        {issue.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default UniformDashboardView;
