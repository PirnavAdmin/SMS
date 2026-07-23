import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Shield, UserPlus, FileSpreadsheet } from 'lucide-react';
import { UniformDashboardView } from './UniformDashboardView';
import { UniformMastersView } from './UniformMastersView';
import { StudentUniformView } from './StudentUniformView';
import { UniformReportsView } from './UniformReportsView';

interface UniformContainerViewProps {
  initialTab?: string;
}

export const UniformContainerView: React.FC<UniformContainerViewProps> = ({ initialTab = 'dashboard' }) => {
  const normalizedTab = initialTab.startsWith('uniform-') ? initialTab.replace('uniform-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('uniform-') ? initialTab.replace('uniform-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'masters', label: 'Uniform Masters', icon: Shield },
    { id: 'student-uniform', label: 'Student Uniform', icon: UserPlus },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet }
  ];

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
      {/* Sub Navigation Bar */}
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
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-extrabold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Component */}
      <div>{renderTabContent()}</div>
    </div>
  );
};
export default UniformContainerView;
