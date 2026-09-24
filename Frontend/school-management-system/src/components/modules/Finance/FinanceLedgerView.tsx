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
        return <TransactionsMasterLedgerView />;
      case 'expenses':
        return (
          <div className="glass-card p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-sky-500" /> Expense Management
            </h3>
            <p className="text-xs text-slate-500">Record, approve, and track school expenditures across categories and vendors.</p>
            <TransactionsMasterLedgerView filterType="Expense" />
          </div>
        );
      case 'accounts':
        return (
          <div className="glass-card p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" /> Cash & Bank Accounts
            </h3>
            <p className="text-xs text-slate-500">Real-time ledger-derived cash and bank account balances.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <p className="text-xs text-slate-500 font-sans font-bold">School Cash Account</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹1,45,000</p>
                <span className="text-[10px] text-emerald-600 font-sans font-semibold">● Active • Reconciled</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <p className="text-xs text-slate-500 font-sans font-bold">Main Bank Account (HDFC)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹42,80,500</p>
                <span className="text-[10px] text-emerald-600 font-sans font-semibold">● Active • Reconciled</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <p className="text-xs text-slate-500 font-sans font-bold">Petty Cash Account</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹25,000</p>
                <span className="text-[10px] text-emerald-600 font-sans font-semibold">● Active • Reconciled</span>
              </div>
            </div>
          </div>
        );
      case 'refunds':
      case 'refund-management':
        return <RefundManagementView />;
      case 'budget':
        return (
          <div className="glass-card p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-500" /> Annual Budgeting & Allocations
            </h3>
            <p className="text-xs text-slate-500">Compare allocated budgets against actual income and expenditure.</p>
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <span>Staff Salaries & Payroll</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">Budget: ₹50,00,000 | Spent: ₹32,00,000 | Remaining: ₹18,00,000</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <span>Utilities & Facilities</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">Budget: ₹10,00,000 | Spent: ₹6,40,000 | Remaining: ₹3,60,000</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <span>Campus Maintenance & Repairs</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">Budget: ₹8,00,000 | Spent: ₹5,10,000 | Remaining: ₹2,90,000</span>
              </div>
            </div>
          </div>
        );
      default:
        return <TransactionsMasterLedgerView />;
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Master double-entry transaction ledger, cash/bank accounts, school expenses, refunds, and budget tracking.
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

export default FinanceLedgerView;
