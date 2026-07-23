import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, ArrowUpRight, GraduationCap, FileSpreadsheet } from 'lucide-react';
import { AcademicYearDashboard } from './AcademicYearDashboard';
import { AcademicYearListView } from './AcademicYearListView';
import { StudentPromotionView } from './StudentPromotionView';
import { GraduationAlumniView } from './GraduationAlumniView';
import { AcademicYearReportsView } from './AcademicYearReportsView';

interface AcademicYearContainerViewProps {
  initialTab?: string;
}

export const AcademicYearContainerView: React.FC<AcademicYearContainerViewProps> = ({ initialTab = 'dashboard' }) => {
  const normalizedTab = initialTab.startsWith('acad-') ? initialTab.replace('acad-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('acad-') ? initialTab.replace('acad-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'years', label: 'Academic Years', icon: Calendar },
    { id: 'promotion', label: 'Student Promotion', icon: ArrowUpRight },
    { id: 'graduation', label: 'Graduation / Alumni', icon: GraduationCap },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AcademicYearDashboard />;
      case 'years':
        return <AcademicYearListView />;
      case 'promotion':
        return <StudentPromotionView />;
      case 'graduation':
        return <GraduationAlumniView />;
      case 'reports':
        return <AcademicYearReportsView />;
      default:
        return <AcademicYearDashboard />;
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
export default AcademicYearContainerView;
