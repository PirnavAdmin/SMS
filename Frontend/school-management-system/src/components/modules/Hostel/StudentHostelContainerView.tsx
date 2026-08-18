import React, { useState } from 'react';
import { UserPlus, LogOut, ArrowRightLeft, UserCheck } from 'lucide-react';
import { StudentHostelAssignmentView } from './StudentHostelAssignmentView';
import { HostelOutpassLeaveView } from './HostelOutpassLeaveView';
import { HostelTransferVacateView } from './HostelTransferVacateView';
import { HostelAttendanceView } from './HostelAttendanceView';

export const StudentHostelContainerView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'allocations' | 'outpass' | 'transfers' | 'attendance'>('allocations');

  const subTabs = [
    { id: 'allocations', label: 'Student Hostel Allocation', icon: UserPlus },
    { id: 'attendance', label: 'Hostel Attendance Register', icon: UserCheck },
    { id: 'outpass', label: 'Outpass & Leave Management', icon: LogOut },
    { id: 'transfers', label: 'Transfer & Vacate Student', icon: ArrowRightLeft }
  ] as const;

  const renderContent = () => {
    switch (activeSubTab) {
      case 'allocations':
        return <StudentHostelAssignmentView />;
      case 'outpass':
        return <HostelOutpassLeaveView />;
      case 'transfers':
        return <HostelTransferVacateView />;
      case 'attendance':
        return <HostelAttendanceView />;
      default:
        return <StudentHostelAssignmentView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Sub-tab Selector */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
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

      {/* Render Active View */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};
export default StudentHostelContainerView;
