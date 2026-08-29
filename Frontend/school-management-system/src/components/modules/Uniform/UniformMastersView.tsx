import React, { useState } from 'react';
import { Shirt, Layers, Ruler, Users, Package } from 'lucide-react';
import { UniformView } from './UniformView';
import { UniformCategoryView } from './UniformCategoryView';
import { UniformSizeView } from './UniformSizeView';
import { UniformSupplierView } from './UniformSupplierView';
import { UniformInventoryView } from './UniformInventoryView';

interface UniformMastersViewProps {
  initialSubTab?: 'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory';
  initialStatusFilter?: string;
}

export const UniformMastersView: React.FC<UniformMastersViewProps> = ({ initialSubTab = 'categories', initialStatusFilter }) => {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const subTabs = [
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'sizes', label: 'Sizes', icon: Ruler },
    { id: 'items', label: 'Add Uniform Type', icon: Shirt },
    { id: 'inventory', label: 'Inventory Registry', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Users }
  ] as const;

  const tabsNode = (
    <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800 mb-6">
      {subTabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeSubTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              isActive
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'categories':
        return <UniformCategoryView tabs={tabsNode} />;
      case 'items':
        return <UniformView tabs={tabsNode} />;
      case 'sizes':
        return <UniformSizeView tabs={tabsNode} />;
      case 'suppliers':
        return <UniformSupplierView tabs={tabsNode} />;
      case 'inventory':
        return <UniformInventoryView initialStatusFilter={initialStatusFilter} tabs={tabsNode} />;
      default:
        return <UniformCategoryView tabs={tabsNode} />;
    }
  };

  return (
    <div className="animate-in fade-in">
      {renderSubTabContent()}
    </div>
  );
};
export default UniformMastersView;
