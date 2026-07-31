import React, { useEffect, useState } from 'react';

import { HostelDashboardView } from './HostelDashboardView';
import { HostelMastersView } from './HostelMastersView';
import { StudentHostelContainerView } from './StudentHostelContainerView';
import { HostelReportsView } from './HostelReportsView';

interface HostelContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const HostelContainerView: React.FC<HostelContainerViewProps> = ({ initialTab = 'dashboard' }) => {
  const normalizedTab = initialTab.startsWith('hostel-') ? initialTab.replace('hostel-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('hostel-') ? initialTab.replace('hostel-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HostelDashboardView />;
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
        return <StudentHostelContainerView />;
      case 'reports':
        return <HostelReportsView />;
      default:
        return <HostelDashboardView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>{renderTabContent()}</div>
    </div>
  );
};
