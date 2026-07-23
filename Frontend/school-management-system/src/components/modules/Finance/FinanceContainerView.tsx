import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Tag, Layers, UserPlus, Gift, Percent, AlertTriangle, Route, Bus,
  Home, Bed, IndianRupee, Receipt, Clock, RotateCcw, FileSpreadsheet, SlidersHorizontal
} from 'lucide-react';
import { Student, FeePayment } from '../../../types';

import { FinanceDashboardView } from './FinanceDashboardView';
import { FeeHeadsView } from './FeeHeadsView';
import { FeeStructuresView } from './FeeStructuresView';
import { StudentFeeAssignmentView } from './StudentFeeAssignmentView';
import { ScholarshipsView } from './ScholarshipsView';
import { DiscountsView } from './DiscountsView';
import { FineRulesView } from './FineRulesView';
import { TransportConfigView } from './TransportConfigView';
import { FinanceTransportConfigView } from './FinanceTransportConfigView';
import { FinanceHostelConfigView } from './FinanceHostelConfigView';
import { StudentTransportView } from './StudentTransportView';
import { HostelConfigView } from './HostelConfigView';
import { FeeCollectionView } from './FeeCollectionView';
import { FeeReceiptsView } from './FeeReceiptsView';
import { DueFeesView } from './DueFeesView';
import { RefundManagementView } from './RefundManagementView';
import { FinanceReportsView } from './FinanceReportsView';
import { FinanceSettingsView } from './FinanceSettingsView';
import { PrintableFeeReceipt } from '../FeeManagement/PrintableFeeReceipt';

interface FinanceContainerViewProps {
  initialTab?: string;
}

export const FinanceContainerView: React.FC<FinanceContainerViewProps> = ({ initialTab = 'dashboard' }) => {
  const normalizedTab = initialTab.startsWith('finance-') ? initialTab.replace('finance-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);
  const [receiptToPrint, setReceiptToPrint] = useState<FeePayment | null>(null);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('finance-') ? initialTab.replace('finance-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fee-heads', label: 'Fee Heads', icon: Tag },
    { id: 'fee-structure', label: 'Fee Structure', icon: Layers },
    { id: 'student-fee-assignment', label: 'Assignment', icon: UserPlus },
    { id: 'scholarships', label: 'Scholarships', icon: Gift },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'fine-rules', label: 'Fine Rules', icon: AlertTriangle },
    { id: 'transport-config', label: 'Transport Config', icon: Route },
    { id: 'student-transport', label: 'Student Transport', icon: Bus },
    { id: 'hostel-config', label: 'Hostel Config', icon: Home },
    { id: 'fee-collection', label: 'Fee Collection', icon: IndianRupee },
    { id: 'fee-receipts', label: 'Fee Receipts', icon: Receipt },
    { id: 'due-fees', label: 'Due Fees', icon: Clock },
    { id: 'refund-management', label: 'Refunds', icon: RotateCcw },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  const handleCollectStudentFee = (student: Student) => {
    setActiveTab('fee-collection');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FinanceDashboardView />;
      case 'fee-heads':
        return <FeeHeadsView />;
      case 'fee-structure':
        return <FeeStructuresView />;
      case 'student-fee-assignment':
        return <StudentFeeAssignmentView />;
      case 'scholarships':
        return <ScholarshipsView />;
      case 'discounts':
        return <DiscountsView />;
      case 'fine-rules':
        return <FineRulesView />;
      case 'transport-config':
        return <FinanceTransportConfigView />;
      case 'student-transport':
        return <StudentTransportView />;
      case 'hostel-config':
        return <FinanceHostelConfigView />;
      case 'student-hostel':
        return <HostelConfigView />;
      case 'fee-collection':
      case 'fees':
        return <FeeCollectionView onPrintReceipt={(payment) => setReceiptToPrint(payment)} />;
      case 'fee-receipts':
        return <FeeReceiptsView />;
      case 'due-fees':
        return <DueFeesView onCollectStudentFee={handleCollectStudentFee} />;
      case 'refund-management':
      case 'refunds':
        return <RefundManagementView />;
      case 'reports':
        return <FinanceReportsView />;
      case 'settings':
        return <FinanceSettingsView />;
      default:
        return <FinanceDashboardView />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Sub-Navigation Header */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'fee-collection' && activeTab === 'fees');
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
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

      {/* Main Sub-Module Body */}
      {renderTabContent()}

      {/* Printable Receipt Modal */}
      <PrintableFeeReceipt
        payment={receiptToPrint}
        isOpen={!!receiptToPrint}
        onClose={() => setReceiptToPrint(null)}
      />
    </div>
  );
};
