import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, Layers, Home, UserPlus, UserCheck, FileSpreadsheet
} from 'lucide-react';

import { HostelDashboardView } from './HostelDashboardView';
import { HostelMasterView } from './HostelMasterView';
import { RoomTypeMasterView } from './RoomTypeMasterView';
import { RoomMasterView } from './RoomMasterView';
import { StudentHostelAssignmentView } from './StudentHostelAssignmentView';
import { HostelAttendanceView } from './HostelAttendanceView';
import { HostelReportsView } from './HostelReportsView';

interface HostelContainerViewProps {
  initialTab?: string;
}

export const HostelContainerView: React.FC<HostelContainerViewProps> = ({ initialTab = 'dashboard' }) => {
  const normalizedTab = initialTab.startsWith('hostel-') ? initialTab.replace('hostel-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('hostel-') ? initialTab.replace('hostel-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Hostel Master', icon: Building2 },
    { id: 'room-type', label: 'Room Type Master', icon: Layers },
    { id: 'room-master', label: 'Room Master', icon: Home },
    { id: 'student-assignment', label: 'Student Assignment', icon: UserPlus },
    { id: 'attendance', label: 'Hostel Attendance', icon: UserCheck },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HostelDashboardView />;
      case 'master':
      case 'blocks':
        return <HostelMasterView />;
      case 'room-type':
        return <RoomTypeMasterView />;
      case 'room-master':
      case 'rooms':
        return <RoomMasterView />;
      case 'student-assignment':
      case 'beds':
        return <StudentHostelAssignmentView />;
      case 'attendance':
        return <HostelAttendanceView />;
      case 'reports':
        return <HostelReportsView />;
      default:
        return <HostelDashboardView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Sticky Sub-Navigation Bar */}
      <div className="glass-card p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm sticky top-0 z-30 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-extrabold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Render */}
      <div>{renderTabContent()}</div>
    </div>
  );
};
