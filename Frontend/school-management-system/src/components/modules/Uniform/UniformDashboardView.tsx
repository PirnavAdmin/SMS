import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Shirt, 
  Package, 
  AlertTriangle, 
  UserCheck, 
  TrendingUp, 
  RotateCcw, 
  ArrowUpRight, 
  RefreshCw 
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { normalizeUniformCategoryName } from '../../../utils/uniformUtils';
import { fetchUniformDashboardApi } from '../../../api/uniform';

interface LowStockAlert {
  id: string;
  itemName: string;
  size: string;
  currentStock: number;
  minimumStock: number;
  status: string;
}

interface CategoryStockItem {
  category: string;
  stock: number;
  total: number;
  percent: number;
}

interface UniformDashboardViewProps {
  onNavigate?: (tab: string, subTab?: 'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory', reportType?: string, statusFilter?: string) => void;
}

export const UniformDashboardView: React.FC<UniformDashboardViewProps> = ({ onNavigate }) => {
  const { 
    uniforms = [], 
    uniformCategories = [],
    uniformInventory = [], 
    studentUniformIssues = [],
    fetchUniformData
  } = useData();

  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = React.useRef(false);

  const loadDashboardData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshing(true);
    try {
      const [metricsRes] = await Promise.allSettled([
        fetchUniformDashboardApi(),
        fetchUniformData ? fetchUniformData() : Promise.resolve()
      ]);
      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setDashboardMetrics(metricsRes.value);
      }
    } catch (err) {
      console.warn('Failed to load live uniform dashboard metrics:', err);
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [fetchUniformData]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Dynamic KPI Card 1: Total Items
  const totalItemsCount = useMemo(() => {
    if (dashboardMetrics?.totalItems !== undefined && dashboardMetrics?.totalItems !== null) {
      return Number(dashboardMetrics.totalItems);
    }
    if (uniformCategories && uniformCategories.length > 0) {
      return uniformCategories.length;
    }
    const unique = new Set((uniformInventory || []).map(i => normalizeUniformCategoryName(i.category || i.itemName)).filter(Boolean));
    return unique.size || (uniforms || []).length || 0;
  }, [dashboardMetrics, uniformCategories, uniformInventory, uniforms]);

  // Dynamic KPI Card 2: Available Stock
  const availableStockCount = useMemo(() => {
    if (dashboardMetrics?.availableStock !== undefined && dashboardMetrics?.availableStock !== null) {
      return Number(dashboardMetrics.availableStock);
    }
    return (uniformInventory || []).reduce((sum, i) => sum + (Number(i.currentStock) || 0), 0);
  }, [dashboardMetrics, uniformInventory]);

  // Dynamic KPI Card 3: Issued Units
  const issuedUnitsCount = useMemo(() => {
    if (dashboardMetrics?.issuedUnits !== undefined && dashboardMetrics?.issuedUnits !== null) {
      return Number(dashboardMetrics.issuedUnits);
    }
    return (studentUniformIssues || [])
      .filter(i => i && i.status !== 'Returned' && i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  }, [dashboardMetrics, studentUniformIssues]);

  // Dynamic KPI Card 4: Returned Items
  const returnedItemsCount = useMemo(() => {
    if (dashboardMetrics?.returnedItems !== undefined && dashboardMetrics?.returnedItems !== null) {
      return Number(dashboardMetrics.returnedItems);
    }
    return (studentUniformIssues || [])
      .filter(i => i && (i.status === 'Returned' || (i.notes || '').toLowerCase().includes('returned')))
      .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  }, [dashboardMetrics, studentUniformIssues]);

  // Dynamic KPI Card 5: Low Stock Items
  const lowStockCount = useMemo(() => {
    if (dashboardMetrics?.lowStock !== undefined && dashboardMetrics?.lowStock !== null) {
      return Number(dashboardMetrics.lowStock);
    }
    return (uniformInventory || []).filter(x => Number(x.currentStock) <= Number(x.minimumStock || 10)).length;
  }, [dashboardMetrics, uniformInventory]);

  // Dynamic Low Stock Alerts
  const lowStockAlertList: LowStockAlert[] = useMemo(() => {
    if (dashboardMetrics?.lowStockAlerts && Array.isArray(dashboardMetrics.lowStockAlerts) && dashboardMetrics.lowStockAlerts.length > 0) {
      return dashboardMetrics.lowStockAlerts.map((alert: any, idx: number) => ({
        id: `alert-${idx}`,
        itemName: alert.itemName || alert.category || 'Item',
        size: alert.size || 'Standard',
        currentStock: Number(alert.currentStock || 0),
        minimumStock: Number(alert.minThreshold || alert.minimumStock || 10),
        status: alert.status || 'Low Stock'
      }));
    }
    return (uniformInventory || [])
      .filter(x => Number(x.currentStock) <= Number(x.minimumStock || 10))
      .map(item => ({
        id: item.id,
        itemName: item.itemName,
        size: item.size || 'M',
        currentStock: Number(item.currentStock) || 0,
        minimumStock: Number(item.minimumStock || 10),
        status: item.status || 'Low Stock'
      }));
  }, [dashboardMetrics, uniformInventory]);

  // Dynamic Category Stock Distribution
  const categoryStockList: CategoryStockItem[] = useMemo(() => {
    if (dashboardMetrics?.categoryStockLevels && Array.isArray(dashboardMetrics.categoryStockLevels) && dashboardMetrics.categoryStockLevels.length > 0) {
      const map = new Map<string, { category: string; stock: number; total: number }>();

      dashboardMetrics.categoryStockLevels.forEach((lvl: any) => {
        const rawCat = lvl.categoryName || lvl.itemName || 'Uniform Category';
        const cat = normalizeUniformCategoryName(rawCat);
        const normKey = cat.trim().toLowerCase();
        const units = Number(lvl.totalUnits ?? lvl.currentStock ?? 0);

        const existing = map.get(normKey);
        if (existing) {
          existing.stock += units;
        } else {
          map.set(normKey, { category: cat, stock: units, total: 0 });
        }
      });

      const categories = Array.from(map.values());
      const sumUnits = categories.reduce((s, c) => s + c.stock, 0) || availableStockCount || 1;

      return categories.map(c => ({
        ...c,
        total: sumUnits,
        percent: Math.min(100, Math.max(5, Math.round((c.stock / sumUnits) * 100)))
      }));
    }

    const map = new Map<string, { category: string; stock: number; total: number }>();
    (uniformInventory || []).forEach(inv => {
      if (!inv) return;
      const cat = normalizeUniformCategoryName(inv.category || inv.itemName || 'General');
      const curStock = Number(inv.currentStock) || 0;
      const openStock = Number(inv.openingStock) || curStock;
      const normKey = cat.trim().toLowerCase();

      const existing = map.get(normKey);
      if (existing) {
        existing.stock += curStock;
        existing.total += openStock;
      } else {
        map.set(normKey, { category: cat, stock: curStock, total: openStock });
      }
    });

    const categories = Array.from(map.values());
    const totalAvail = categories.reduce((sum, c) => sum + c.stock, 0) || 1;

    return categories.map(c => ({
      ...c,
      percent: Math.min(100, Math.max(5, Math.round((c.stock / totalAvail) * 100)))
    }));
  }, [dashboardMetrics, availableStockCount, uniformInventory]);

  // Dynamic Recent Activity Table
  const validStudentUniformIssues = useMemo(() => {
    if (!studentUniformIssues || studentUniformIssues.length === 0) return [];
    return studentUniformIssues.filter(i => Boolean(i && (i.studentName || i.studentId || i.admissionNo)));
  }, [studentUniformIssues]);

  const groupedRecentActivity = useMemo(() => {
    if (!validStudentUniformIssues || validStudentUniformIssues.length === 0) return [];
    const map = new Map<string, {
      id: string;
      studentName: string;
      className: string;
      section: string;
      itemsList: string[];
      sizesList: string[];
      totalQuantity: number;
      date: string;
      status: string;
    }>();

    validStudentUniformIssues.forEach(issue => {
      const normKey = (issue.studentName || 'Student').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanItemName = (issue.itemName || '').replace(/\s*\(Extra\)/gi, '').trim();
      const isReturned = issue.status === 'Returned' || issue.status === 'Cancelled';

      const existing = map.get(normKey);
      if (existing) {
        if (!isReturned) {
          if (!existing.itemsList.includes(cleanItemName)) {
            existing.itemsList.push(cleanItemName);
          }
          if (issue.size && !existing.sizesList.includes(issue.size)) {
            existing.sizesList.push(issue.size);
          }
          existing.totalQuantity += (issue.quantity || 1);
        }
        if (issue.issueDate && issue.issueDate > existing.date) {
          existing.date = issue.issueDate;
        }
      } else {
        map.set(normKey, {
          id: issue.id,
          studentName: issue.studentName || 'Student',
          className: issue.className || 'Class 10',
          section: issue.section || 'A',
          itemsList: isReturned ? [] : [cleanItemName],
          sizesList: issue.size ? [issue.size] : ['M'],
          totalQuantity: isReturned ? 0 : (issue.quantity || 1),
          date: issue.issueDate || new Date().toISOString().split('T')[0],
          status: issue.status || 'Issued'
        });
      }
    });

    return Array.from(map.values()).map(g => ({
      ...g,
      itemsList: g.itemsList.length > 0 ? g.itemsList : ['All Items Returned'],
      status: g.totalQuantity === 0 ? 'Returned' : 'Issued'
    }));
  }, [validStudentUniformIssues]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-500" /> Uniform Dashboard
          </h2>
        </div>

        <button
          type="button"
          onClick={() => loadDashboardData()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400 dark:hover:border-sky-600 hover:text-sky-600 dark:hover:text-sky-400 transition-all shadow-xs cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Live Data'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Items */}
        <div 
          onClick={() => onNavigate?.('masters', 'items')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-sm transition-all group"
          title="Click to view uniform items"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Total Items</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">{totalItemsCount}</h3>
        </div>

        {/* Card 2: Available Stock */}
        <div 
          onClick={() => onNavigate?.('masters', 'inventory', undefined, 'All')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm transition-all group"
          title="Click to view uniform inventory stock"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Stock Available</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">{availableStockCount} Units</h3>
        </div>

        {/* Card 3: Issued Units */}
        <div 
          onClick={() => onNavigate?.('student-uniform', undefined, undefined, 'Issued')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-all group"
          title="Click to view uniform distribution"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Issued Units</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">{issuedUnitsCount} Units</h3>
        </div>

        {/* Card 4: Returned Items */}
        <div 
          onClick={() => onNavigate?.('student-uniform', undefined, undefined, 'Returned')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-sm transition-all group"
          title="Click to view returned items"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Returned Items</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">{returnedItemsCount} Items</h3>
        </div>

        {/* Card 5: Low Stock */}
        <div 
          onClick={() => onNavigate?.('masters', 'inventory', undefined, 'Low Stock')}
          className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm transition-all group"
          title="Click to view low stock inventory"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">{lowStockCount} Items</h3>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
            </h4>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 px-2.5 py-0.5 rounded-full">
              Stock Level
            </span>
          </div>

          <div className="space-y-3">
            {lowStockAlertList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All uniform inventory items are comfortably stocked.</p>
            ) : (
              lowStockAlertList.map((item: LowStockAlert, idx: number) => {
                const percent = Math.min(100, Math.max(10, Math.round((item.currentStock / (item.minimumStock || 10)) * 100))) || 0;
                return (
                  <div key={`${item.id || item.itemName}-${idx}`} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.itemName} {item.size ? `(Size ${item.size})` : ''}</span>
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

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {categoryStockList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No uniform categories recorded.</p>
            ) : (
              (() => {
                const colors = ['bg-sky-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-amber-500', 'bg-teal-500'];

                return categoryStockList.map((item: CategoryStockItem, i: number) => (
                  <div key={`${item.category}-${i}`} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                      <span className="text-slate-500 font-bold">{item.stock} Units</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ));
              })()
            )}
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
                <th className="py-2.5 px-3">Clothing Items Issued</th>
                <th className="py-2.5 px-3 text-center">Size</th>
                <th className="py-2.5 px-3 text-right">Total Qty</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {groupedRecentActivity.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">No recent uniform issue or return activity recorded.</td>
                </tr>
              ) : (
                groupedRecentActivity.slice(0, 5).map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{g.studentName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{g.className.includes('-') ? g.className : (g.section ? `${g.className} - ${g.section}` : g.className)}</td>
                    <td className="py-2.5 px-3 font-semibold text-sky-600 dark:text-sky-400 max-w-xs truncate" title={g.itemsList.join(', ')}>
                      {g.itemsList.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">{g.sizesList.join(', ')}</td>
                    <td className="py-2.5 px-3 text-right font-black">{g.totalQuantity} Units</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{g.date}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={g.status === 'Issued' ? 'success' : (g.status === 'Returned' ? 'neutral' : 'warning')}>
                        {g.status}
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
