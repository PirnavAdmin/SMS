import React, { useState } from 'react';
import {
  Tag, Layers, Gift, Percent, AlertTriangle, Route, Bus,
  Home, Bed, UserPlus, RotateCcw, SlidersHorizontal, Shirt, Calendar
} from 'lucide-react';

import { FeeHeadsView } from './FeeHeadsView';
import { FeeStructuresView } from './FeeStructuresView';
import { ScholarshipsView } from './ScholarshipsView';
import { DiscountsView } from './DiscountsView';
import { FineRulesView } from './FineRulesView';
import { FinanceTransportConfigView } from './FinanceTransportConfigView';
import { FinanceHostelConfigView } from './FinanceHostelConfigView';
import { StudentFeeAssignmentView } from './StudentFeeAssignmentView';
import { StudentTransportView } from './StudentTransportView';
import { HostelConfigView } from './HostelConfigView';
import { RefundManagementView } from './RefundManagementView';
import { FinanceSettingsView } from './FinanceSettingsView';
import { FinanceUniformConfigView } from './FinanceUniformConfigView';
import { FeeScheduleView } from './FeeScheduleView';
import { TransportScrollableTabs } from '../Transport/TransportScrollableTabs';

export const FinanceMastersView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<string>('fee-heads');

  const subTabs = [
    { id: 'fee-heads', label: 'Fee Types', icon: Tag },
    { id: 'fee-structure', label: 'Fee Structures', icon: Layers },
    { id: 'fee-schedule', label: 'Fee Schedule', icon: Calendar },
    { id: 'scholarships', label: 'Scholarships', icon: Gift },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'fine-rules', label: 'Fine Rules', icon: AlertTriangle },
    { id: 'transport-fee', label: 'Transport Fee', icon: Route },
    { id: 'hostel-fee', label: 'Hostel Fee', icon: Home },
    { id: 'student-assignment', label: 'Fee Assignment', icon: UserPlus },
    { id: 'uniform-fee', label: 'Uniform Fee', icon: Shirt },
    { id: 'refunds', label: 'Refund Management', icon: RotateCcw },
    { id: 'settings', label: 'Finance Settings', icon: SlidersHorizontal },
  ] as const;

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'fee-heads':
        return <FeeHeadsView />;
      case 'fee-structure':
        return <FeeStructuresView />;
      case 'fee-schedule':
        return <FeeScheduleView />;
      case 'scholarships':
        return <ScholarshipsView />;
      case 'discounts':
        return <DiscountsView />;
      case 'fine-rules':
        return <FineRulesView />;
      case 'transport-fee':
        return <FinanceTransportConfigView />;
      case 'hostel-fee':
        return <FinanceHostelConfigView />;
      case 'student-assignment':
        return <StudentFeeAssignmentView />;
      case 'refunds':
        return <RefundManagementView />;
      case 'uniform-fee':
        return <FinanceUniformConfigView />;
      case 'settings':
        return <FinanceSettingsView />;
      default:
        return <FeeHeadsView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-brand-600 dark:text-brand-400" /> Finance Setup
          </h2>
        </div>
      </div>

      {/* Sub-tab Selector */}
      <TransportScrollableTabs
        tabs={subTabs}
        activeId={activeSubTab}
        onChange={setActiveSubTab}
      />

      {/* Render Active View */}
      <div>
        {renderSubTabContent()}
      </div>
    </div>
  );
};
export default FinanceMastersView;
