import React, { useEffect, useState, useRef } from 'react';
import { UniformDashboardView } from './UniformDashboardView';
import { UniformMastersView } from './UniformMastersView';
import { StudentUniformView } from './StudentUniformView';
import { UniformReportsView } from './UniformReportsView';

interface UniformContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const UniformContainerView: React.FC<UniformContainerViewProps> = ({ initialTab = 'dashboard', onTabChange }) => {
  const normalizeTab = (tab: string) => tab.startsWith('uniform-') ? tab.replace('uniform-', '') : tab;

  const [activeTab, setActiveTab] = useState(normalizeTab(initialTab));
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory' | undefined>();
  const [reportTypeFilter, setReportTypeFilter] = useState<string | undefined>();
  const [statusFilterParam, setStatusFilterParam] = useState<string | undefined>();

  // Track whether the last navigation came from internal handleNavigate
  // so we can ignore the resulting initialTab prop change in the useEffect
  const isInternalNavRef = useRef(false);

  useEffect(() => {
    // If the tab change was triggered internally (by handleNavigate), skip this effect
    if (isInternalNavRef.current) {
      isInternalNavRef.current = false;
      return;
    }
    // This is a genuine EXTERNAL navigation (sidebar click) — reset to clean state
    const cleanTab = normalizeTab(initialTab);
    setActiveTab(cleanTab);
    setActiveSubTab(undefined);      // Reset subTab so sidebar always opens 'categories'
    setStatusFilterParam(undefined); // Reset any status filter
    setReportTypeFilter(undefined);
  }, [initialTab]);

  const handleNavigate = (
    tab: string,
    subTab?: 'items' | 'categories' | 'sizes' | 'suppliers' | 'inventory',
    reportType?: string,
    statusFilter?: string
  ) => {
    const cleanTab = normalizeTab(tab);

    // Mark as internal so the useEffect ignores the resulting initialTab change
    isInternalNavRef.current = true;

    setActiveTab(cleanTab);
    setActiveSubTab(subTab);
    setStatusFilterParam(statusFilter);
    if (reportType) setReportTypeFilter(reportType);

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
      case 'inventory': {
        const resolvedSubTab = activeSubTab ||
          (['items', 'categories', 'sizes', 'suppliers', 'inventory'].includes(activeTab)
            ? activeTab as any
            : 'categories');
        return (
          <UniformMastersView
            key={`masters-${resolvedSubTab}-${statusFilterParam || 'all'}`}
            initialSubTab={resolvedSubTab}
            initialStatusFilter={statusFilterParam}
          />
        );
      }
      case 'student-uniform':
      case 'student':
      case 'issues':
        return (
          <StudentUniformView
            key={`student-${statusFilterParam || 'all'}`}
            initialStatusFilter={statusFilterParam}
          />
        );
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
