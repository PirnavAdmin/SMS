import React, { useState } from 'react';
import { Tag, Layers, Calendar } from 'lucide-react';
import { FeeHeadsView } from './FeeHeadsView';
import { FeeStructuresView } from './FeeStructuresView';
import { FeeScheduleView } from './FeeScheduleView';
import { TransportScrollableTabs } from '../Transport/TransportScrollableTabs';

interface FeeSetupViewProps {
  initialTab?: string;
}

export const FeeSetupView: React.FC<FeeSetupViewProps> = ({ initialTab = 'heads' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const tabs = [
    { id: 'heads', label: 'Fee Heads', icon: Tag },
    { id: 'structures', label: 'Fee Structures', icon: Layers },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'heads':
      case 'fee-heads':
        return <FeeHeadsView />;
      case 'structures':
      case 'fee-structures':
      case 'fee-structure':
        return <FeeStructuresView />;
      case 'schedule':
      case 'fee-schedule':
        return <FeeScheduleView />;
      default:
        return <FeeHeadsView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-sky-500" /> Fee Setup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure fee heads, class-wise structures, and payment schedule deadlines.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <TransportScrollableTabs
        tabs={tabs}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {/* Content */}
      <div className="pt-2">
        {renderContent()}
      </div>
    </div>
  );
};

export default FeeSetupView;
