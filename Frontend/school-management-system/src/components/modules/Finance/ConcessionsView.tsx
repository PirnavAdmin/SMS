import React, { useState } from 'react';
import { Percent, Gift } from 'lucide-react';
import { DiscountsView } from './DiscountsView';
import { ScholarshipsView } from './ScholarshipsView';
import { TransportScrollableTabs } from '../Transport/TransportScrollableTabs';

interface ConcessionsViewProps {
  initialTab?: string;
}

export const ConcessionsView: React.FC<ConcessionsViewProps> = ({ initialTab = 'rules' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const tabs = [
    { id: 'rules', label: 'Concession Rules', icon: Percent },
    { id: 'student-concessions', label: 'Student Concessions', icon: Gift },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'rules':
      case 'discounts':
        return <DiscountsView />;
      case 'student-concessions':
      case 'scholarships':
        return <ScholarshipsView />;
      default:
        return <DiscountsView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-sky-500" /> Concessions & Waivers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure unified concession rules (Scholarships, Sibling/Staff discounts, Waivers) and assign them to students.
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

export default ConcessionsView;
