import React, { useState } from 'react';
import { FileSpreadsheet, RotateCcw, CreditCard, PieChart, Receipt } from 'lucide-react';
import { TransactionsMasterLedgerView } from './TransactionsMasterLedgerView';
import { RefundManagementView } from './RefundManagementView';
import { TransportScrollableTabs } from '../Transport/TransportScrollableTabs';

interface FinanceLedgerViewProps {
  initialTab?: string;
}

export const FinanceLedgerView: React.FC<FinanceLedgerViewProps> = ({ initialTab = 'transactions' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const tabs = [
    { id: 'transactions', label: 'Transactions', icon: FileSpreadsheet },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'refunds', label: 'Refunds', icon: RotateCcw },
    { id: 'budget', label: 'Budget', icon: PieChart },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'transactions':
      case 'ledger':
      case 'master-ledger':
        return <TransactionsMasterLedgerView initialSubTab="ledger" />;
      case 'expenses':
        return <TransactionsMasterLedgerView filterType="Expense" initialSubTab="ledger" />;
      case 'accounts':
        return <TransactionsMasterLedgerView initialSubTab="categories-accounts" />;
      case 'refunds':
      case 'refund-management':
        return <RefundManagementView />;
      case 'budget':
        return <TransactionsMasterLedgerView initialSubTab="budget" />;
      default:
        return <TransactionsMasterLedgerView initialSubTab="ledger" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Finance Ledger & Accounts
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

export default FinanceLedgerView;
