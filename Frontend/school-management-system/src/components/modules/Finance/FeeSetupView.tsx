import React, { useState } from 'react';
import { Tag, Layers, Calendar, Bus } from 'lucide-react';
import { FeeHeadsView } from './FeeHeadsView';
import { FeeStructuresView } from './FeeStructuresView';
import { FeeScheduleView } from './FeeScheduleView';
import { FinanceTransportConfigView } from './FinanceTransportConfigView';
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
    { id: 'transport-fee', label: 'Transport Fee', icon: Bus },
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
      case 'transport-fee':
      case 'finance-transport-config':
      case 'transport':
        return <FinanceTransportConfigView />;
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
