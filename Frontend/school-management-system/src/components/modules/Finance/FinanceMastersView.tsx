import React, { useState } from 'react';
import {
  Tag, Layers, Gift, Percent, AlertTriangle, Route, Bus,
  Home, Bed, UserPlus, RotateCcw, SlidersHorizontal, Shirt
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

export const FinanceMastersView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<string>('fee-heads');

  const subTabs = [
    { id: 'fee-heads', label: 'Fee Heads', icon: Tag },
    { id: 'fee-structure', label: 'Fee Structure', icon: Layers },
    { id: 'scholarships', label: 'Scholarships', icon: Gift },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'fine-rules', label: 'Fine Rules', icon: AlertTriangle },
    { id: 'transport-fee', label: 'Transport Fee', icon: Route },
    { id: 'hostel-fee', label: 'Hostel Fee', icon: Home },
    { id: 'student-assignment', label: 'Student Assignment', icon: UserPlus },
    { id: 'student-transport', label: 'Student Transport', icon: Bus },
    { id: 'student-hostel', label: 'Student Hostel', icon: Bed },
    { id: 'uniform-fee', label: 'Uniform Fee', icon: Shirt },
    { id: 'refunds', label: 'Refunds', icon: RotateCcw },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ] as const;

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'fee-heads':
        return <FeeHeadsView />;
      case 'fee-structure':
        return <FeeStructuresView />;
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
      case 'student-transport':
        return <StudentTransportView />;
      case 'student-hostel':
        return <HostelConfigView />;
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
      {/* Sub-tab Selector */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
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
        {renderSubTabContent()}
      </div>
    </div>
  );
};
export default FinanceMastersView;
