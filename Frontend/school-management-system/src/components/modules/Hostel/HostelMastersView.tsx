import React, { useState } from 'react';
import { Building2, Layers, Home, Users, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { HostelMasterView } from './HostelMasterView';
import { HostelBlocksView } from './HostelBlocksView';
import { HostelFloorsView } from './HostelFloorsView';
import { RoomTypeMasterView } from './RoomTypeMasterView';
import { RoomMasterView } from './RoomMasterView';
import { WardenMasterView } from './WardenMasterView';

export const HostelMastersView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'hostels' | 'blocks' | 'floors' | 'room-types' | 'rooms' | 'wardens'>('hostels');

  const subTabs = [
    { id: 'hostels', label: 'Hostel Master', icon: Building2 },
    { id: 'blocks', label: 'Block Management', icon: Layers },
    { id: 'floors', label: 'Floor Management', icon: ArrowUpRight },
    { id: 'room-types', label: 'Room Categories', icon: Layers },
    { id: 'rooms', label: 'Room Management', icon: Home },
    { id: 'wardens', label: 'Staff Warden & Supervisor Registry', icon: Users }
  ] as const;

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'hostels':
        return <HostelMasterView />;
      case 'blocks':
        return <HostelBlocksView />;
      case 'floors':
        return <HostelFloorsView />;
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
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-extrabold'
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
