import React, { useState } from 'react';
import { Shirt, Layers, Ruler, Users, Package } from 'lucide-react';
import { UniformView } from './UniformView';
import { UniformCategoryView } from './UniformCategoryView';
import { UniformSizeView } from './UniformSizeView';
import { UniformSupplierView } from './UniformSupplierView';
import { UniformInventoryView } from './UniformInventoryView';

export const UniformMastersView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory'>('items');

  const subTabs = [
    { id: 'items', label: 'Uniform Items', icon: Shirt },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'sizes', label: 'Sizes', icon: Ruler },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package }
  ] as const;

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'items':
        return <UniformView />;
      case 'categories':
        return <UniformCategoryView />;
      case 'sizes':
        return <UniformSizeView />;
      case 'suppliers':
        return <UniformSupplierView />;
      case 'inventory':
        return <UniformInventoryView />;
      default:
        return <UniformView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Sub-tab Selector */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active View */}
      <div>
        {renderSubTabContent()}
      </div>
    </div>
  );
};
export default UniformMastersView;
