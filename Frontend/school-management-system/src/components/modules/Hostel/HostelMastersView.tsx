import React, { useState } from 'react';
import { Building2, Layers, Home, Users } from 'lucide-react';
import { HostelMasterView } from './HostelMasterView';
import { RoomTypeMasterView } from './RoomTypeMasterView';
import { RoomMasterView } from './RoomMasterView';
import { WardenMasterView } from './WardenMasterView';

export const HostelMastersView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'blocks' | 'room-types' | 'rooms' | 'wardens'>('blocks');

  const subTabs = [
    { id: 'blocks', label: 'Hostels', icon: Building2 },
    { id: 'room-types', label: 'Room Types', icon: Layers },
    { id: 'rooms', label: 'Rooms', icon: Home },
    { id: 'wardens', label: 'Wardens', icon: Users }
  ] as const;

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'blocks':
        return <HostelMasterView />;
      case 'room-types':
        return <RoomTypeMasterView />;
      case 'rooms':
        return <RoomMasterView />;
      case 'wardens':
        return <WardenMasterView />;
      default:
        return <HostelMasterView />;
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

      {/* Render Active View */}
      <div>
        {renderSubTabContent()}
      </div>
    </div>
  );
};
export default HostelMastersView;
