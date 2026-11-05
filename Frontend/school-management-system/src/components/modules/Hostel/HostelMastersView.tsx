import React, { useState } from 'react';
import { Building2, Layers, Home, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { HostelMasterView } from './HostelMasterView';
import { RoomTypeMasterView } from './RoomTypeMasterView';
import { RoomMasterView } from './RoomMasterView';
import { WardenMasterView } from './WardenMasterView';

interface HostelMastersViewProps {
  initialSubTab?: 'blocks' | 'room-types' | 'rooms' | 'wardens';
}

export const HostelMastersView: React.FC<HostelMastersViewProps> = ({
  initialSubTab = 'blocks'
}) => {
  const { user, role } = useAuth();
  const userRole = (role || user?.role || '').toLowerCase();
  const isWarden = userRole.includes('warden');

  const [activeSubTab, setActiveSubTab] = useState<'blocks' | 'room-types' | 'rooms' | 'wardens'>(() => {
    try {
      const saved = localStorage.getItem('hostel_master_active_subtab') as any;
      if (saved && ['blocks', 'room-types', 'rooms', 'wardens'].includes(saved)) {
        return saved;
      }
    } catch {}
    return initialSubTab;
  });

  const handleSubTabChange = (tabId: 'blocks' | 'room-types' | 'rooms' | 'wardens') => {
    setActiveSubTab(tabId);
    try {
      localStorage.setItem('hostel_master_active_subtab', tabId);
    } catch {}
  };

  React.useEffect(() => {
    if (initialSubTab && initialSubTab !== 'blocks') {
      setActiveSubTab(initialSubTab);
      try {
        localStorage.setItem('hostel_master_active_subtab', initialSubTab);
      } catch {}
    }
  }, [initialSubTab]);
  const [sharedHostelFilter, setSharedHostelFilter] = useState(() => {
    try {
      return localStorage.getItem('hostel_master_selected_filter') || '';
    } catch {
      return '';
    }
  });

  const handleSharedHostelFilterChange = (val: string) => {
    setSharedHostelFilter(val);
    try {
      localStorage.setItem('hostel_master_selected_filter', val);
    } catch {}
  };

  const allSubTabs = [
    { id: 'blocks', label: 'Hostel Blocks', icon: Building2 },
    { id: 'room-types', label: 'Room Categories', icon: Layers },
    { id: 'rooms', label: 'Rooms & Bed Allocation', icon: Home },
    { id: 'wardens', label: 'Warden Allocation', icon: Users }
  ] as const;

  const subTabs = isWarden
    ? allSubTabs.filter(t => t.id !== 'wardens' && t.id !== 'room-types').map(t => t.id === 'rooms' ? { ...t, label: 'Rooms & Beds' } : t)
    : allSubTabs;

  return (
    <div className="space-y-3.5 animate-in fade-in">
      {/* Sub-tab Selector */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
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
        {activeSubTab === 'blocks' && (
          <HostelMasterView
            selectedHostelFilter={sharedHostelFilter}
            onHostelFilterChange={handleSharedHostelFilterChange}
          />
        )}
        {activeSubTab === 'room-types' && <RoomTypeMasterView />}
        {activeSubTab === 'rooms' && (
          <RoomMasterView
            selectedHostelFilter={sharedHostelFilter}
            onHostelFilterChange={handleSharedHostelFilterChange}
          />
        )}
        {activeSubTab === 'wardens' && (
          <WardenMasterView
            selectedHostelFilter={sharedHostelFilter}
            onHostelFilterChange={handleSharedHostelFilterChange}
          />
        )}
      </div>
    </div>
  );
};
export default HostelMastersView;
