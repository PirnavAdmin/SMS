import React, { useEffect, useState } from 'react';
import { UniformDashboardView } from './UniformDashboardView';
import { UniformMastersView } from './UniformMastersView';
import { StudentUniformView } from './StudentUniformView';
import { UniformReportsView } from './UniformReportsView';

interface UniformContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const UniformContainerView: React.FC<UniformContainerViewProps> = ({ initialTab = 'dashboard', onTabChange }) => {
  const normalizedTab = initialTab.startsWith('uniform-') ? initialTab.replace('uniform-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory' | undefined>();
  const [reportTypeFilter, setReportTypeFilter] = useState<string | undefined>();

  useEffect(() => {
    const cleanTab = initialTab.startsWith('uniform-') ? initialTab.replace('uniform-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const handleNavigate = (tab: string, subTab?: 'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory', reportType?: string) => {
    const cleanTab = tab.startsWith('uniform-') ? tab.replace('uniform-', '') : tab;
    setActiveTab(cleanTab);
    if (subTab) {
      setActiveSubTab(subTab);
    }
    if (reportType) {
      setReportTypeFilter(reportType);
    }
    if (onTabChange) {
      onTabChange(`uniform-${cleanTab}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <UniformDashboardView onNavigate={handleNavigate} />;
      case 'masters':
      case 'master':
      case 'items':
      case 'categories':
      case 'sizes':
      case 'suppliers':
      case 'inventory':
        return (
          <UniformMastersView 
            initialSubTab={activeSubTab || (['items', 'categories', 'sizes', 'suppliers', 'inventory'].includes(activeTab) ? activeTab as any : 'items')} 
          />
        );
      case 'student-uniform':
      case 'student':
      case 'issues':
        return <StudentUniformView />;
      case 'reports':
        return <UniformReportsView initialReportType={reportTypeFilter} />;
      default:
        return <UniformDashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>{renderTabContent()}</div>
    </div>
  );
};
export default UniformContainerView;
