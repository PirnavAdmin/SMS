import React, { useEffect, useState } from 'react';
import { UniformDashboardView } from './UniformDashboardView';
import { UniformMastersView } from './UniformMastersView';
import { StudentUniformView } from './StudentUniformView';
import { UniformReportsView } from './UniformReportsView';

interface UniformContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const UniformContainerView: React.FC<UniformContainerViewProps> = ({ initialTab = 'dashboard' }) => {
  const normalizedTab = initialTab.startsWith('uniform-') ? initialTab.replace('uniform-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('uniform-') ? initialTab.replace('uniform-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <UniformDashboardView />;
      case 'masters':
      case 'master':
      case 'items':
      case 'categories':
      case 'sizes':
      case 'suppliers':
      case 'inventory':
        return <UniformMastersView />;
      case 'student-uniform':
      case 'issues':
        return <StudentUniformView />;
      case 'reports':
        return <UniformReportsView />;
      default:
        return <UniformDashboardView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>{renderTabContent()}</div>
    </div>
  );
};
export default UniformContainerView;
