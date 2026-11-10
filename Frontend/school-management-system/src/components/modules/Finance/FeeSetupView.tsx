import React, { useState, useEffect } from 'react';
import { Tag, Layers, Calendar, Bus, Building2, Shirt } from 'lucide-react';
import { FeeHeadsView } from './FeeHeadsView';
import { FeeStructuresView } from './FeeStructuresView';
import { FeeScheduleView } from './FeeScheduleView';
import { FinanceTransportConfigView } from './FinanceTransportConfigView';
import { FinanceHostelConfigView } from './FinanceHostelConfigView';
import { FinanceUniformConfigView } from './FinanceUniformConfigView';
import { TransportScrollableTabs } from '../Transport/TransportScrollableTabs';

interface FeeSetupViewProps {
  initialTab?: string;
}

export const FeeSetupView: React.FC<FeeSetupViewProps> = ({ initialTab = 'heads' }) => {
  const normalizeTab = (t?: string) => {
    if (!t || t === 'fee-setup' || t === 'heads' || t === 'fee-heads' || t === 'setup') return 'heads';
    if (t === 'structures' || t === 'fee-structures' || t === 'fee-structure') return 'structures';
    if (t === 'schedule' || t === 'fee-schedule') return 'schedule';
    if (t === 'transport-fee' || t === 'transport' || t === 'finance-transport-config') return 'transport-fee';
    if (t === 'hostel-fee' || t === 'hostel' || t === 'finance-hostel-config') return 'hostel-fee';
    if (t === 'uniform-fee' || t === 'uniform' || t === 'finance-uniform-config') return 'uniform-fee';
    return t;
  };
  const [activeTab, setActiveTab] = useState<string>(normalizeTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [initialTab]);

  const tabs = [
    { id: 'heads', label: 'Fee Heads', icon: Tag },
    { id: 'structures', label: 'Fee Structures', icon: Layers },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'transport-fee', label: 'Transport Fee', icon: Bus },
    { id: 'hostel-fee', label: 'Hostel Fee', icon: Building2 },
    { id: 'uniform-fee', label: 'Uniform Fee', icon: Shirt },
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
      case 'hostel-fee':
      case 'finance-hostel-config':
      case 'hostel':
        return <FinanceHostelConfigView />;
      case 'uniform-fee':
      case 'finance-uniform-config':
      case 'uniform':
        return <FinanceUniformConfigView />;
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
