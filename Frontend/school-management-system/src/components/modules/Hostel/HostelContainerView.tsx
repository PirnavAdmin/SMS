import React, { useEffect, useState } from 'react';

import { HostelDashboardView } from './HostelDashboardView';
import { HostelMastersView } from './HostelMastersView';
import { StudentHostelContainerView } from './StudentHostelContainerView';
import { HostelReportsView } from './HostelReportsView';

interface HostelContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const HostelContainerView: React.FC<HostelContainerViewProps> = ({ initialTab = 'dashboard', onTabChange }) => {
  const getCleanTab = (tab: string) => {
    let clean = tab.startsWith('hostel-') ? tab.replace('hostel-', '') : tab;
    if (clean === 'room-allocation' || clean === 'room-allocations' || clean === 'allocation' || clean === 'allocations' || clean === 'student-room-allocation') {
      return 'student-hostel';
    }
    return clean;
  };

  const [activeTab, setActiveTab] = useState(() => getCleanTab(initialTab));

  useEffect(() => {
    setActiveTab(getCleanTab(initialTab));
  }, [initialTab]);

  const handleNavigate = (tab: string) => {
    const clean = getCleanTab(tab);
    setActiveTab(clean);
    if (onTabChange) onTabChange(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HostelDashboardView onNavigate={handleNavigate} />;
      case 'masters':
      case 'master':
      case 'blocks':
      case 'room-type':
      case 'room-master':
      case 'rooms':
        return <HostelMastersView />;
      case 'student-hostel':
      case 'student-assignment':
      case 'beds':
      case 'attendance':
      case 'room-allocation':
      case 'room-allocations':
      case 'allocation':
      case 'allocations':
      case 'student-room-allocation':
        return <StudentHostelContainerView />;
      case 'reports':
        return <HostelReportsView />;
      default:
        return <HostelDashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>{renderTabContent()}</div>
    </div>
  );
};
