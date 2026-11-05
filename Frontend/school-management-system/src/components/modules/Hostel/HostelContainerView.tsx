import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Building2, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { HostelDashboardView } from './HostelDashboardView';
import { HostelMastersView } from './HostelMastersView';
import { StudentHostelContainerView } from './StudentHostelContainerView';
import { HostelReportsView } from './HostelReportsView';

interface HostelContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const HostelContainerView: React.FC<HostelContainerViewProps> = ({ initialTab = 'dashboard', onTabChange }) => {
  const { user, role } = useAuth();
  const userRole = (role || user?.role || '').toLowerCase();
  const isWarden = userRole.includes('warden');

  const getCleanTab = (tab: string) => {
    let clean = tab.startsWith('hostel-') ? tab.replace('hostel-', '') : tab;
    if (clean === 'hostel') clean = 'dashboard';
    if (clean === 'room-allocation' || clean === 'room-allocations' || clean === 'allocation' || clean === 'allocations' || clean === 'student-room-allocation') {
      return 'student-hostel';
    }
    return clean || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(() => getCleanTab(initialTab));

  useEffect(() => {
    const clean = getCleanTab(initialTab);
    setActiveTab(clean);
    // Tab synced
  }, [initialTab, isWarden]);

  const handleNavigate = (tab: string) => {
    const clean = getCleanTab(tab);
    setActiveTab(clean);
    const fullModule = tab.startsWith('hostel-') ? tab : `hostel-${clean}`;
    if (onTabChange) onTabChange(fullModule);
  };

  const navTabs = [
    { id: 'dashboard', label: 'Hostel Dashboard', icon: LayoutDashboard },
    { id: 'masters', label: 'Hostel Masters Setup', icon: Building2 },
    { id: 'student-hostel', label: 'Student Management', icon: Users },
    { id: 'reports', label: 'Hostel Reports', icon: BarChart3 }
  ];

  const isTabActive = (tabId: string) => {
    if (activeTab === tabId) return true;
    if (tabId === 'masters' && ['master', 'blocks', 'room-type', 'room-master', 'rooms', 'wardens'].includes(activeTab)) return true;
    if (tabId === 'student-hostel' && ['student-assignment', 'beds', 'attendance', 'outpass', 'leave', 'allocations', 'transfers'].includes(activeTab)) return true;
    return false;
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
      case 'wardens':
        return (
          <HostelMastersView
            initialSubTab={
              ['rooms', 'room-master'].includes(activeTab)
                ? 'rooms'
                : ['room-type', 'room-types'].includes(activeTab)
                ? 'room-types'
                : activeTab === 'wardens'
                ? 'wardens'
                : 'blocks'
            }
          />
        );
      case 'student-hostel':
      case 'student-assignment':
      case 'beds':
      case 'attendance':
      case 'outpass':
      case 'leave':
      case 'room-allocation':
      case 'room-allocations':
      case 'allocation':
      case 'allocations':
      case 'student-room-allocation':
        return (
          <StudentHostelContainerView
            initialSubTab={
              activeTab === 'attendance'
                ? 'attendance'
                : activeTab === 'outpass' || activeTab === 'leave'
                ? 'outpass'
                : undefined
            }
          />
        );
      case 'reports':
        return <HostelReportsView />;
      default:
        return isWarden ? <HostelMastersView /> : <HostelDashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in">
      {/* Top Module Sub-tab Navigation */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const active = isTabActive(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                active
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

      {/* Main Content Area */}
      <div>{renderTabContent()}</div>
    </div>
  );
};
export default HostelContainerView;
