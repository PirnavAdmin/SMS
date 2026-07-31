import React, { useEffect, useState } from 'react';
import { FeePayment } from '../../../types';

import { FinanceDashboardView } from './FinanceDashboardView';
import { FinanceMastersView } from './FinanceMastersView';
import { FeeCollectionContainerView } from './FeeCollectionContainerView';
import { FinanceReportsView } from './FinanceReportsView';
import { TransactionsMasterLedgerView } from './TransactionsMasterLedgerView';
import { PrintableFeeReceipt } from '../FeeManagement/PrintableFeeReceipt';

interface FinanceContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const FinanceContainerView: React.FC<FinanceContainerViewProps> = ({ initialTab = 'dashboard' }) => {
  const normalizedTab = initialTab.startsWith('finance-') ? initialTab.replace('finance-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);
  const [receiptToPrint, setReceiptToPrint] = useState<FeePayment | null>(null);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('finance-') ? initialTab.replace('finance-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FinanceDashboardView />;
      case 'transactions':
      case 'ledger':
      case 'master-ledger':
        return <TransactionsMasterLedgerView />;
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
    <div className="space-y-4 animate-in fade-in">
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
