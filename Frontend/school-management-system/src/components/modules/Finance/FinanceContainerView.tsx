import React, { useEffect, useState } from 'react';
import { FeePayment } from '../../../types';
import { useData } from '../../../context/DataContext';

import { FinanceDashboardView } from './FinanceDashboardView';
import { FeeSetupView } from './FeeSetupView';
import { StudentFeesView } from './StudentFeesView';
import { FeeCollectionContainerView } from './FeeCollectionContainerView';
import { ConcessionsView } from './ConcessionsView';
import { FinanceLedgerView } from './FinanceLedgerView';
import { FinanceReportsView } from './FinanceReportsView';
import { PrintableFeeReceipt } from '../FeeManagement/PrintableFeeReceipt';

interface FinanceContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const FinanceContainerView: React.FC<FinanceContainerViewProps> = ({ initialTab = 'fee-collection', onTabChange }) => {
  const { fetchFinanceData } = useData();

  useEffect(() => {
    if (fetchFinanceData) {
      fetchFinanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedTab = initialTab.startsWith('finance-') ? initialTab.replace('finance-', '') : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);
  const [receiptToPrint, setReceiptToPrint] = useState<FeePayment | null>(null);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('finance-') ? initialTab.replace('finance-', '') : initialTab;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(`finance-${tab}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FinanceDashboardView onNavigate={handleNavigate} />;

      case 'fee-setup':
      case 'masters':
      case 'fee-heads':
      case 'fee-structure':
      case 'fee-schedule':
      case 'settings':
        return <FeeSetupView initialTab={activeTab} />;

      case 'student-fees':
      case 'student-fee-assignment':
      case 'student-assignment':
      case 'due-fees':
      case 'due_fees':
      case 'due':
      case 'dues':
      case 'promoted-dues':
        return (
          <StudentFeesView
            initialTab={activeTab === 'student-fees' || activeTab === 'student-assignment' ? 'assign' : 'dues'}
            onNavigateToCollect={() => setActiveTab('fee-collection')}
          />
        );

      case 'fee-collection':
      case 'fees':
      case 'fee-receipts':
        return <FeeCollectionContainerView onPrintReceipt={(payment) => setReceiptToPrint(payment)} />;

      case 'concessions':
      case 'scholarships':
      case 'discounts':
        return <ConcessionsView initialTab={activeTab === 'scholarships' ? 'student-concessions' : 'rules'} />;

      case 'ledger':
      case 'transactions':
      case 'master-ledger':
      case 'expenses':
      case 'accounts':
      case 'refunds':
      case 'refund-management':
      case 'budget':
        return <FinanceLedgerView initialTab={activeTab} />;

      case 'reports':
        return <FinanceReportsView />;

      default:
        return <FeeCollectionContainerView onPrintReceipt={(payment) => setReceiptToPrint(payment)} />;
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

export default FinanceContainerView;
