import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Tag, Layers, UserPlus, Gift, Percent, AlertTriangle, Route, Bus,
  Home, Bed, IndianRupee, Receipt, Clock, RotateCcw, FileSpreadsheet, SlidersHorizontal
} from 'lucide-react';
import { Student, FeePayment } from '../../../types';

import { FinanceDashboardView } from './FinanceDashboardView';
import { FinanceMastersView } from './FinanceMastersView';
import { FeeCollectionContainerView } from './FeeCollectionContainerView';
import { FinanceReportsView } from './FinanceReportsView';
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
    { id: 'masters', label: 'Finance Masters', icon: SlidersHorizontal },
    { id: 'fee-collection', label: 'Fee Collection', icon: IndianRupee },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const handleCollectStudentFee = (student: Student) => {
    setActiveTab('fee-collection');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FinanceDashboardView />;
      case 'masters':
      case 'fee-heads':
      case 'fee-structure':
      case 'student-fee-assignment':
      case 'scholarships':
      case 'discounts':
      case 'fine-rules':
      case 'transport-config':
      case 'student-transport':
      case 'hostel-config':
      case 'student-hostel':
      case 'refund-management':
      case 'settings':
        return <FinanceMastersView />;
      case 'fee-collection':
      case 'fees':
      case 'fee-receipts':
      case 'due-fees':
        return <FeeCollectionContainerView onPrintReceipt={(payment) => setReceiptToPrint(payment)} />;
      case 'reports':
        return <FinanceReportsView />;
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
