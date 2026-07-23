import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Route, MapPin, Bus, Users, Layers, UserPlus,
  DollarSign, Wrench, FileSpreadsheet, Navigation
} from 'lucide-react';

import { TransportDashboardView } from './TransportDashboardView';
import { TransportMastersView } from './TransportMastersView';
import { StudentTransportAssignmentView } from './StudentTransportAssignmentView';
import { TransportReportsView } from './TransportReportsView';

interface TransportContainerViewProps {
  initialTab?: string;
}

export const TransportContainerView: React.FC<TransportContainerViewProps> = ({ initialTab = 'transport-dashboard' }) => {
  const normalizedTab = initialTab.startsWith('transport-') ? initialTab : `transport-${initialTab}`;
  const [activeTab, setActiveTab] = useState(normalizedTab);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('transport-') ? initialTab : `transport-${initialTab}`;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const tabs = [
    { id: 'transport-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transport-masters', label: 'Transport Masters', icon: Route },
    { id: 'transport-student-assignment', label: 'Student Transport', icon: UserPlus },
    { id: 'transport-reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transport-dashboard':
        return <TransportDashboardView />;
      case 'transport-masters':
        return <TransportMastersView />;
      case 'transport-student-assignment':
        return <StudentTransportAssignmentView />;
      case 'transport-reports':
        return <TransportReportsView />;
      default:
        return <TransportDashboardView />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Sub-Navigation Header */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
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

      {/* Main Sub-Module Body */}
      {renderTabContent()}
    </div>
  );
};
