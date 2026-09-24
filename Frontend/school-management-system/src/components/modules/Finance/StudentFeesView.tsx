import React, { useState } from 'react';
import { UserPlus, Clock, FileSpreadsheet } from 'lucide-react';
import { StudentFeeAssignmentView } from './StudentFeeAssignmentView';
import { DueFeesView } from './DueFeesView';
import { TransactionsMasterLedgerView } from './TransactionsMasterLedgerView';
import { TransportScrollableTabs } from '../Transport/TransportScrollableTabs';

interface StudentFeesViewProps {
  initialTab?: string;
  onNavigateToCollect?: (studentId?: string) => void;
}

export const StudentFeesView: React.FC<StudentFeesViewProps> = ({
  initialTab = 'assign',
  onNavigateToCollect,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const tabs = [
    { id: 'assign', label: 'Assign Fees', icon: UserPlus },
    { id: 'dues', label: 'Dues', icon: Clock },
    { id: 'ledger', label: 'Student Ledger', icon: FileSpreadsheet },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'assign':
      case 'student-assignment':
        return <StudentFeeAssignmentView />;
      case 'dues':
      case 'due-fees':
        return <DueFeesView onCollectStudentFee={(st) => onNavigateToCollect && onNavigateToCollect(st.id)} onCollectClick={(sId: string) => onNavigateToCollect && onNavigateToCollect(sId)} />;
      case 'ledger':
      case 'student-ledger':
        return <TransactionsMasterLedgerView />;
      default:
        return <StudentFeeAssignmentView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-sky-500" /> Student Fees & Accounts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage fee assignments, view outstanding student dues, and inspect individual student ledgers.
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

export default StudentFeesView;
