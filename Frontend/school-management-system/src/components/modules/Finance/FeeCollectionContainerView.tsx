import React, { useState } from 'react';
import { IndianRupee, Receipt, Clock } from 'lucide-react';
import { Student, FeePayment } from '../../../types';
import { FeeCollectionView } from './FeeCollectionView';
import { FeeReceiptsView } from './FeeReceiptsView';
import { DueFeesView } from './DueFeesView';

interface FeeCollectionContainerViewProps {
  onPrintReceipt: (payment: FeePayment) => void;
}

export const FeeCollectionContainerView: React.FC<FeeCollectionContainerViewProps> = ({ onPrintReceipt }) => {
  const [activeSubTab, setActiveSubTab] = useState<'collect' | 'due' | 'receipts'>('collect');

  const subTabs = [
    { id: 'collect', label: 'Collect Fees', icon: IndianRupee },
    { id: 'due', label: 'Due Fees', icon: Clock },
    { id: 'receipts', label: 'Fee Receipts', icon: Receipt },
  ] as const;

  const handleCollectStudentFee = (student: Student) => {
    setActiveSubTab('collect');
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'collect':
        return <FeeCollectionView onPrintReceipt={onPrintReceipt} />;
      case 'due':
        return <DueFeesView onCollectStudentFee={handleCollectStudentFee} />;
      case 'receipts':
        return <FeeReceiptsView />;
      default:
        return <FeeCollectionView onPrintReceipt={onPrintReceipt} />;
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
        {renderSubTabContent()}
      </div>
    </div>
  );
};
export default FeeCollectionContainerView;
